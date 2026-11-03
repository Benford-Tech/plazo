import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { prismaWithDeleted } from '@/database';
import { ON_SITE_STATUSES } from '@/domain/reservation';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { CapacityService } from './capacity.service';
import { ContractTemplateService } from './contract-template.service';
import { PaperworkService } from './paperwork.service';

/** A deleted reservation is kept this long, then erased for good (« elle s'archive 45 jours »). */
export const TRASH_RETENTION_DAYS = 45;
const DAY_MS = 86_400_000;
const REASON_MAX = 200;

export function purgeAtOf(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + TRASH_RETENTION_DAYS * DAY_MS);
}

/**
 * Why a reservation cannot be deleted, or null. Never one paid on Plazo (its payment, refund and payout stay with it:
 * cancel it instead), nor a car still at the parking (hand it back, or mark it a no-show, first).
 */
export function deletionRefusal(r: {
  channel: string;
  status: string;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  chargedCents: number | null;
}): 'plazo_booking' | 'vehicle_on_site' | null {
  if (r.channel === 'plazo' || r.stripePaymentIntentId || r.stripeCheckoutSessionId || (r.chargedCents ?? 0) > 0) return 'plazo_booking';
  if ((ON_SITE_STATUSES as string[]).includes(r.status)) return 'vehicle_on_site';
  return null;
}

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');

/**
 * 03/11/2026 (« Pouvoir supprimer une réservation… elle s'archive 45 jours », maquettes
 * https://claude.ai/artifact/JD6yJ7YvnSpFkrKp5nCM1D): a manager deletes a reservation typed by mistake, a duplicate or
 * a test. It leaves every list, the planning, the forecast, the places and the revenue (`deletedAt`, hidden by the
 * database client), nothing is sent to the traveller, and it can be restored for 45 days from Réservations ›
 * Supprimées; then the nightly purge erases it with its mails, contract and photos.
 */
@Service()
export class ReservationTrashService {
  public audit = Container.get(AuditService);
  public capacity = Container.get(CapacityService);
  public paperwork = Container.get(PaperworkService);
  public templates = Container.get(ContractTemplateService);

  /** DELETE /internal/reservations/:id { reason? } → { id, deletedAt, purgeAt } */
  public async remove(actor: AuthenticatedStaff, id: string, reason?: string | null) {
    const note = reason?.trim().slice(0, REASON_MAX) || null;
    const now = new Date();
    const done = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const r = await tx.reservation.findFirst({ where: { id, operatorId: actor.operatorId } });
      if (!r) throw notFound();
      const refusal = deletionRefusal(r);
      if (refusal === 'plazo_booking') {
        throw new HttpException(httpStatus.CONFLICT, 'A reservation paid on Plazo cannot be deleted: cancel it', 'plazo_booking');
      }
      if (refusal === 'vehicle_on_site') {
        throw new HttpException(httpStatus.CONFLICT, 'The car is still at the parking', 'vehicle_on_site');
      }
      // Its place or file is freed (another car may take it meanwhile); a restore brings the booking back without one.
      await tx.reservation.update({
        where: { id },
        data: { deletedAt: now, deletedById: actor.id, deleteReason: note, spotId: null, fileId: null, fileRank: null },
      });
      await tx.arrivalSignal.updateMany({
        where: { reservationId: id, state: { not: 'ended' } },
        data: { state: 'ended', endReason: 'closed', endedAt: now, lat: null, lng: null, accuracyM: null },
      });
      await this.audit.record(
        actor,
        {
          action: 'reservation.deleted',
          entityType: 'reservation',
          entityId: id,
          details: { reference: r.reference, status: r.status, reason: note },
        },
        tx,
      );
      return r;
    });
    return { id: done.id, deletedAt: now.toISOString(), purgeAt: purgeAtOf(now).toISOString() };
  }

  /** POST /internal/reservations/:id/restore → { reservation, overbooked } (restored even onto a full night). */
  public async restore(actor: AuthenticatedStaff, id: string) {
    const r = await prismaWithDeleted.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, deletedAt: { not: null } },
      include: { parking: true },
    });
    if (!r) throw notFound();
    await prismaWithDeleted.$transaction(async tx => {
      const { count } = await tx.reservation.updateMany({
        where: { id, deletedAt: { not: null } },
        data: { deletedAt: null, deletedById: null, deleteReason: null },
      });
      if (!count) throw notFound();
      await this.audit.record(
        actor,
        { action: 'reservation.restored', entityType: 'reservation', entityId: id, details: { reference: r.reference } },
        tx,
      );
    });
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id } });
    const overbooked = await this.capacity.overbookedNow(r.parking, reservation);
    return { reservation, overbooked };
  }

  /** GET /internal/reservations/deleted → the trash, the latest deleted first. */
  public async list(actor: AuthenticatedStaff) {
    const since = new Date(Date.now() - TRASH_RETENTION_DAYS * DAY_MS);
    const rows = await prismaWithDeleted.reservation.findMany({
      where: { operatorId: actor.operatorId, deletedAt: { not: null, gt: since } },
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      take: 500,
      select: {
        id: true,
        reference: true,
        customerName: true,
        plate: true,
        channel: true,
        channelDetail: true,
        status: true,
        arrivalAt: true,
        returnAt: true,
        priceCents: true,
        deletedAt: true,
        deletedById: true,
        deleteReason: true,
      },
    });
    const staffIds = [...new Set(rows.map(r => r.deletedById).filter((v): v is string => !!v))];
    const staff = staffIds.length ? await prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, firstName: true } }) : [];
    const names = new Map(staff.map(s => [s.id, s.firstName]));
    return {
      retentionDays: TRASH_RETENTION_DAYS,
      data: rows.map(({ deletedById, ...r }) => ({
        ...r,
        deletedAt: r.deletedAt!.toISOString(),
        purgeAt: purgeAtOf(r.deletedAt!).toISOString(),
        deletedBy: deletedById ? { firstName: names.get(deletedById) ?? null } : null,
      })),
    };
  }

  /** The number in « Supprimées · 4 ». */
  public async count(operatorId: string): Promise<number> {
    const since = new Date(Date.now() - TRASH_RETENTION_DAYS * DAY_MS);
    return prismaWithDeleted.reservation.count({ where: { operatorId, deletedAt: { not: null, gt: since } } });
  }

  /**
   * Nightly: the reservations deleted more than 45 days ago are erased for good, with their linked mails, contract,
   * condition reports and photos (files outside the database first) and their history. Returns how many.
   */
  public async purge(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - TRASH_RETENTION_DAYS * DAY_MS);
    let total = 0;
    for (let batch = 0; batch < 10; batch += 1) {
      const rows = await prismaWithDeleted.reservation.findMany({
        where: { deletedAt: { not: null, lte: cutoff } },
        select: { id: true },
        orderBy: { deletedAt: 'asc' },
        take: 200,
      });
      if (!rows.length) break;
      const ids = rows.map(r => r.id);
      try {
        await this.paperwork.erasePhotosOf(ids);
        const contractFiles = await this.templates.signedBlobKeysOf(ids);
        if (contractFiles.length) await this.templates.storage.remove(contractFiles);
      } catch (error) {
        // Files that stay are retried the next night: the rows wait with them.
        logger.warn(`[Trash] could not erase the files: ${error instanceof Error ? error.message : 'unknown error'}`);
        break;
      }
      const [, , deleted] = await prismaWithDeleted.$transaction([
        prismaWithDeleted.inboundEmail.deleteMany({ where: { reservationId: { in: ids } } }),
        prismaWithDeleted.auditLog.deleteMany({ where: { entityType: 'reservation', entityId: { in: ids } } }),
        prismaWithDeleted.reservation.deleteMany({ where: { id: { in: ids }, deletedAt: { not: null, lte: cutoff } } }),
      ]);
      total += deleted.count;
      if (rows.length < 200) break;
    }
    return total;
  }
}
