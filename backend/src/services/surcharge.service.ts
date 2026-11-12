import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { surchargesLine, surchargesOf, validateSurcharges } from '@/domain/surcharges';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

/**
 * « Suppléments et conditions » of Parking › Réglages (12/11/2026, choix A): the parking's supplements and the sentence
 * Plazo writes from them for the traveller.
 */
@Service()
export class SurchargeService {
  constructor(private readonly audit: AuditService) {}

  private async ownParking(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({
      where: { id: parkingId, operatorId: actor.operatorId },
      select: { id: true, surcharges: true, nightStart: true, nightEnd: true, nightFeeEnabled: true },
    });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }

  private view(parking: { surcharges: unknown; nightStart: string | null; nightEnd: string | null; nightFeeEnabled: boolean }) {
    const surcharges = surchargesOf(parking.surcharges);
    const night = parking.nightStart && parking.nightEnd ? { start: parking.nightStart, end: parking.nightEnd } : null;
    return {
      surcharges,
      night,
      /** The hours are those of « Mes tarifs », which charges them itself on bookings made on Plazo. */
      nightFeesCharged: parking.nightFeeEnabled,
      configured: parking.surcharges !== null,
      line: surchargesLine(surcharges, night),
    };
  }

  /** GET /internal/parkings/:id/surcharges */
  public async get(actor: AuthenticatedStaff, parkingId: string) {
    return this.view(await this.ownParking(actor, parkingId));
  }

  /**
   * PUT /internal/parkings/:id/surcharges { surcharges: [{ kind, enabled, amountCents, minutes?, label?, note?, id? }],
   * night?: { start, end } }: the whole list. The night hours are the parking's (those of the night fees, set once).
   */
  public async update(actor: AuthenticatedStaff, parkingId: string, body: { surcharges?: unknown; night?: unknown }) {
    const parking = await this.ownParking(actor, parkingId);
    const { surcharges, night, errors } = validateSurcharges(body.surcharges, body.night, () => randomBytes(6).toString('hex'));
    if (Object.keys(errors).length) throw new ValidationException(errors);
    const before = this.view(parking);
    const updated = await prisma.$transaction(async tx => {
      const row = await tx.parking.update({
        where: { id: parking.id },
        data: {
          surcharges: surcharges as unknown as Prisma.InputJsonValue,
          ...(night ? { nightStart: night.start, nightEnd: night.end } : {}),
        },
        select: { id: true, surcharges: true, nightStart: true, nightEnd: true, nightFeeEnabled: true },
      });
      await this.audit.record(
        actor,
        {
          action: 'parking.surcharges_updated',
          entityType: 'parking',
          entityId: parking.id,
          details: {
            surcharges: surcharges.map(s => ({ kind: s.kind, enabled: s.enabled, amountCents: s.amountCents, minutes: s.minutes })),
            ...(night && (night.start !== before.night?.start || night.end !== before.night?.end)
              ? { night: { from: before.night ? { ...before.night } : null, to: { ...night } } }
              : {}),
          } as Prisma.InputJsonValue,
        },
        tx,
      );
      return row;
    });
    return this.view(updated);
  }
}
