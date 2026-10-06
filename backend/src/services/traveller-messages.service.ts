import { Container, Service } from 'typedi';
import { PRODUCT_NAME, SECRET_KEY } from '@/config';
import prisma from '@/database';
import { manageToken } from '@/domain/booking';
import { bonVoyagePush, carParkedPush, handedBackPush, reminderSms } from '@/domain/booking-messages';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { addDays, dayBounds, localDate, localDateTime } from '@/domain/time';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';

/**
 * B (06/10/2026): the traveller's message thread beyond the confirmation and the landing SMS.
 * - the day before the drop-off: email, SMS (the operator's channel) and push, once;
 * - "Votre voiture est garée" (push) when the valet places the car;
 * - "Bon voyage !" (push) when the drop-off shuttle ends;
 * - after the handover: email and push, once.
 * A message never fails the action that caused it.
 */
@Service()
export class TravellerMessagesService {
  public notifications = Container.get(NotificationService);
  public sms = Container.get(SmsService);
  public push = Container.get(PushService);

  /** The reminders of the bookings arriving tomorrow (local to each parking), once each. Daily cron, late afternoon. */
  public async remindTomorrow(now = new Date()): Promise<{ checked: number; sent: number }> {
    const parkings = await prisma.parking.findMany({ select: { id: true, timezone: true } });
    let checked = 0;
    let sent = 0;
    for (const parking of parkings) {
      const tomorrow = addDays(localDate(now, parking.timezone), 1);
      const { start, end } = dayBounds(tomorrow, parking.timezone);
      const rows = await prisma.reservation.findMany({
        where: { parkingId: parking.id, status: 'upcoming', reminderSentAt: null, arrivalAt: { gte: start, lt: end } },
        select: { id: true },
      });
      for (const row of rows) {
        checked += 1;
        if (await this.remind(row.id, now)) sent += 1;
      }
    }
    return { checked, sent };
  }

  private async remind(id: string, now: Date): Promise<boolean> {
    const { count } = await prisma.reservation.updateMany({ where: { id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!count) return false;
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id }, include: WITH_LISTING });
    if (!record.parking.listing) return false;
    const booking = toPublicBooking(record, now);
    const token = SECRET_KEY ? manageToken(record.id, SECRET_KEY, record.manageTokenVersion) : null;
    try {
      await this.notifications.bookingReminder(booking, token);
      await this.sms.sendTravellerSms(record.operatorId, {
        reservationId: record.id,
        kind: 'booking_reminder',
        to: record.customerPhone,
        text: reminderSms(PRODUCT_NAME, booking, token ? this.notifications.manageUrl(record.reference, token) : null),
      });
      await this.push.notifyTravellers(
        [record.id],
        {
          title: `À demain, ${booking.customerName.split(' ')[0]} !`,
          body: `Dépôt prévu ${booking.arrivalAt.slice(11, 16)} à ${booking.parking.title}.`,
        },
        { data: { type: 'booking', event: 'reminder', reservationId: record.id }, collapseId: `reminder-${record.id}` },
      );
    } catch (error) {
      logger.warn(`[Messages] Reminder for ${record.reference} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    return true;
  }

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
