import { Container, Service } from 'typedi';
import prisma from '@/database';
import { ANONYMIZED_TRAVELLER, anonymizeReturnedBefore, PERSONAL_AUDIT_KEYS } from '@/domain/retention';
import { PaperworkService } from './paperwork.service';

/** Bookings anonymised per transaction, and per night at most (the rest waits for the next night). */
const BATCH_SIZE = 500;
const MAX_BATCHES = 20;

@Service()
export class RetentionService {
  public paperwork = Container.get(PaperworkService);

  /**
   * Anonymises the bookings returned more than 12 months ago (see src/domain/retention.ts): the
   * traveller's data goes from the booking and from its audit entries, which keep the action and the
   * other changes; the words joined to arrival signals are cleared, and anything still attached
   * (phones for pushes, queued SMS, the signed contract and the condition reports with their photos) is deleted.
   * Idempotent.
   * Returns the number of bookings anonymised.
   */
  public async anonymizeReservations(now = new Date()): Promise<number> {
    const cutoff = anonymizeReturnedBefore(now);
    let total = 0;
    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const rows = await prisma.reservation.findMany({
        where: { returnAt: { lt: cutoff }, anonymizedAt: null },
        select: { id: true },
        orderBy: { returnAt: 'asc' },
        take: BATCH_SIZE,
      });
      if (!rows.length) break;
      const ids = rows.map(r => r.id);
      // The condition reports' photos go first (their storage is outside the database); the contract and the reports,
      // which name the traveller, go with the rest.
      await this.paperwork.erasePhotosOf(ids);
      const [{ count }] = await prisma.$transaction([
        prisma.reservation.updateMany({ where: { id: { in: ids }, anonymizedAt: null }, data: { ...ANONYMIZED_TRAVELLER, anonymizedAt: now } }),
        prisma.$executeRaw`
          UPDATE "audit_logs"
          SET "details" = ("details" - ${PERSONAL_AUDIT_KEYS}::text[]) || '{"anonymized": true}'::jsonb
          WHERE "entityType" = 'reservation' AND "entityId" = ANY(${ids}::text[])
            AND jsonb_typeof("details") = 'object' AND jsonb_exists_any("details", ${PERSONAL_AUDIT_KEYS}::text[])`,
        prisma.arrivalSignal.updateMany({ where: { reservationId: { in: ids }, note: { not: null } }, data: { note: null } }),
        prisma.travellerDevice.deleteMany({ where: { reservationId: { in: ids } } }),
        prisma.smsOutbox.deleteMany({ where: { reservationId: { in: ids } } }),
        prisma.reservationContract.deleteMany({ where: { reservationId: { in: ids } } }),
        prisma.vehicleInspection.deleteMany({ where: { reservationId: { in: ids }, photos: { none: {} } } }),
        prisma.signatureCode.deleteMany({ where: { reservationId: { in: ids } } }),
      ]);
      total += count;
      if (rows.length < BATCH_SIZE) break;
    }
    return total;
  }
}
