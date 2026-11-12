import httpStatus from 'http-status';
import { Service } from 'typedi';
import prisma from '@/database';
import { can } from '@/domain/roles';
import { lateSuggestion, MAX_SURCHARGE_CENTS, surchargeName, surchargesOf } from '@/domain/surcharges';
import { localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { STAFF_VISIBLE } from './reservation.service';

const CLOSED = ['cancelled', 'no_show'];
const MAX_LABEL = 80;

/**
 * B (12/11/2026, « A puis B »): the supplements the team applies on a booking, from the parking's rules (« Suppléments et
 * conditions ») or an amount typed on the spot. Collected at the parking: nothing is charged online.
 */
@Service()
export class ReservationSurchargeService {
  constructor(private readonly audit: AuditService) {}

  private async booking(actor: AuthenticatedStaff, id: string) {
    const booking = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      select: {
        id: true,
        status: true,
        arrivalAt: true,
        arrivedAt: true,
        surchargeSuggestionDismissedAt: true,
        parking: { select: { surcharges: true, timezone: true } },
      },
    });
    if (!booking) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    return booking;
  }

  /** GET /internal/reservations/:id/surcharges */
  public async list(actor: AuthenticatedStaff, id: string) {
    const booking = await this.booking(actor, id);
    const tz = booking.parking.timezone;
    const rules = surchargesOf(booking.parking.surcharges);
    const rows = await prisma.reservationSurcharge.findMany({
      where: { reservationId: booking.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, kind: true, label: true, amountCents: true, createdAt: true, addedBy: { select: { firstName: true } } },
    });
    const late = lateSuggestion(
      rules.find(r => r.kind === 'late'),
      booking,
    );
    const suggestion =
      late && !booking.surchargeSuggestionDismissedAt && !rows.some(r => r.kind === 'late') && !CLOSED.includes(booking.status)
        ? {
            kind: 'late' as const,
            ...late,
            scheduledAt: localDateTime(booking.arrivalAt, tz),
            arrivedAt: localDateTime(booking.arrivedAt!, tz),
          }
        : null;
    return {
      surcharges: rows.map(r => ({
        id: r.id,
        kind: r.kind,
        label: r.label,
        amountCents: r.amountCents,
        at: localDateTime(r.createdAt, tz),
        by: r.addedBy?.firstName ?? null,
      })),
      options: rules.filter(r => r.enabled).map(r => ({ key: r.id, kind: r.kind, label: surchargeName(r), amountCents: r.amountCents })),
      suggestion,
      totalCents: rows.reduce((sum, r) => sum + r.amountCents, 0),
      canEdit: can(actor.role, 'reservations:status') && !CLOSED.includes(booking.status),
    };
  }

  /**
   * POST /internal/reservations/:id/surcharges { key } (one of the parking's supplements that is on) or { label,
   * amountCents } (« Autre montant ») → 201 with the list.
   */
  public async add(actor: AuthenticatedStaff, id: string, body: { key?: unknown; label?: unknown; amountCents?: unknown }) {
    const booking = await this.booking(actor, id);
    if (CLOSED.includes(booking.status)) throw new HttpException(httpStatus.CONFLICT, 'Reservation closed', 'reservation_closed');
    let kind: string;
    let label: string;
    let amountCents: number;
    if (body.key !== undefined && body.key !== null) {
      const rule = surchargesOf(booking.parking.surcharges).find(r => r.id === body.key && r.enabled);
      if (!rule) throw new HttpException(httpStatus.CONFLICT, 'Supplement not offered', 'not_offered');
      kind = rule.kind;
      label = surchargeName(rule);
      amountCents = rule.amountCents;
      const late = rule.kind === 'late' ? lateSuggestion(rule, booking) : null;
      if (late) label = `${label} (${late.lateMinutes} min)`;
    } else {
      const fields: Record<string, string> = {};
      const text = typeof body.label === 'string' ? body.label.replace(/\s+/g, ' ').trim() : '';
      if (!text) fields.label = 'required';
      else if (text.length > MAX_LABEL) fields.label = 'too_long';
      const amount = body.amountCents;
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > MAX_SURCHARGE_CENTS) {
        fields.amountCents = amount === undefined || amount === null ? 'required' : 'invalid';
      }
      if (Object.keys(fields).length) throw new ValidationException(fields);
      kind = 'other';
      label = text;
      amountCents = amount as number;
    }
    await prisma.$transaction(async tx => {
      const row = await tx.reservationSurcharge.create({
        data: { operatorId: actor.operatorId, reservationId: booking.id, kind, label, amountCents, addedById: actor.id },
      });
      await this.audit.record(
        actor,
        { action: 'surcharge.added', entityType: 'reservation', entityId: booking.id, details: { surchargeId: row.id, kind, label, amountCents } },
        tx,
      );
    });
    return this.list(actor, id);
  }

  /** DELETE /internal/reservations/:id/surcharges/:surchargeId */
  public async remove(actor: AuthenticatedStaff, id: string, surchargeId: string) {
    const booking = await this.booking(actor, id);
    const row = await prisma.reservationSurcharge.findFirst({ where: { id: surchargeId, reservationId: booking.id } });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'Supplement not found', 'not_found');
    await prisma.$transaction(async tx => {
      await tx.reservationSurcharge.delete({ where: { id: row.id } });
      await this.audit.record(
        actor,
        {
          action: 'surcharge.removed',
          entityType: 'reservation',
          entityId: booking.id,
          details: { kind: row.kind, label: row.label, amountCents: row.amountCents },
        },
        tx,
      );
    });
    return this.list(actor, id);
  }

  /** POST /internal/reservations/:id/surcharges/dismiss: « Non » to the suggested late-arrival supplement. */
  public async dismiss(actor: AuthenticatedStaff, id: string) {
    const booking = await this.booking(actor, id);
    await prisma.reservation.update({ where: { id: booking.id }, data: { surchargeSuggestionDismissedAt: new Date() } });
    return this.list(actor, id);
  }
}
