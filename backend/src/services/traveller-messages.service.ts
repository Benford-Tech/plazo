import { Container, Service } from 'typedi';
import prisma from '@/database';
import { bonVoyagePush, carParkedPush, handedBackPush } from '@/domain/booking-messages';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { localDateTime } from '@/domain/time';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

/**
 * B (06/10/2026): the traveller's message thread beyond the confirmation and the landing SMS.
 * - the day before the drop-off: email, SMS (the operator's channel) and push, once (ReminderService);
 * - "Votre voiture est garée" (push) when the valet places the car;
 * - "Bon voyage !" (push) when the drop-off shuttle ends;
 * - after the handover: email and push, once.
 * A message never fails the action that caused it.
 */
@Service()
export class TravellerMessagesService {
  public notifications = Container.get(NotificationService);
  public push = Container.get(PushService);

  /** The valet placed the car: the traveller's app hears where (once per booking). */
  public async carParked(reservationId: string): Promise<void> {
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({
      where: { id: reservationId, parkedNotifiedAt: null, spotId: { not: null } },
      data: { parkedNotifiedAt: now },
    });
    if (!count) return;
    const row = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { keyHook: true, spot: { select: { code: true } } } });
    await this.push.notifyTravellers([reservationId], carParkedPush(row?.spot?.code ?? null, row?.keyHook ?? null), {
      data: { type: 'booking', event: 'parked', reservationId },
      collapseId: `parked-${reservationId}`,
    });
  }

  /** The drop-off shuttle ended: its passengers hear "Bon voyage". */
  public async droppedOff(reservationIds: string[], parkingTitle: string): Promise<void> {
    if (!reservationIds.length) return;
    await this.push.notifyTravellers(reservationIds, bonVoyagePush(parkingTitle), { data: { type: 'booking', event: 'dropped_off' } });
  }

  /** The vehicle was handed back: the closing email and push, once. */
  public async handedBack(reservationId: string): Promise<void> {
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({
      where: { id: reservationId, closingSentAt: null, status: 'returned' },
      data: { closingSentAt: now },
    });
    if (!count) return;
    const record = await prisma.reservation.findUnique({ where: { id: reservationId }, include: WITH_LISTING });
    if (!record?.parking.listing) return;
    const booking = toPublicBooking(record, now);
    try {
      await this.notifications.bookingClosed(booking, localDateTime(record.returnedAt ?? now, record.parking.timezone));
      await this.push.notifyTravellers([reservationId], handedBackPush(booking.parking.title), {
        data: { type: 'booking', event: 'returned', reservationId },
      });
    } catch (error) {
      logger.warn(`[Messages] Closing message for ${record.reference} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
