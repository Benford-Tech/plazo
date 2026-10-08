import { Request, Response } from 'express';
import { Container } from 'typedi';
import { ArrivalService } from '@/services/arrival.service';
import { BookingDigestService } from '@/services/booking-digest.service';
import { FileService } from '@/services/file.service';
import { FlightTrackingService } from '@/services/flight-tracking.service';
import { InboundEmailService } from '@/services/inbound-email.service';
import { ReturnService } from '@/services/return.service';
import { ShuttleService } from '@/services/shuttle.service';
import { SmsService } from '@/services/sms.service';
import { PaymentService } from '@/services/payment.service';
import { ReminderService } from '@/services/reminder.service';
import { RetentionService } from '@/services/retention.service';
import { TokenService } from '@/services/token.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

export class CronController {
  public tokenService = Container.get(TokenService);
  public payments = Container.get(PaymentService);
  public arrivals = Container.get(ArrivalService);
  public flights = Container.get(FlightTrackingService);
  public shuttle = Container.get(ShuttleService);
  public returns = Container.get(ReturnService);
  public inbound = Container.get(InboundEmailService);
  public reminders = Container.get(ReminderService);
  public sms = Container.get(SmsService);
  public retention = Container.get(RetentionService);
  public files = Container.get(FileService);
  public digest = Container.get(BookingDigestService);

  /** GET /internal/cron/expire-arrival-signals */
  public expireArrivalSignals = catchAsync(async (req: Request, res: Response) => {
    const ended = await this.arrivals.sweep();
    const tripsEnded = await this.shuttle.sweep();
    logger.info(`[Cron] ${ended} arrival signals ended, ${tripsEnded} shuttle trips ended`);
    res.json({ ended, tripsEnded });
  });

  /** GET /internal/cron/track-return-flights */
  public trackReturnFlights = catchAsync(async (req: Request, res: Response) => {
    const result = await this.flights.refreshDue();
    // Outbound flights too (the shuttle waves), then the retries of the SMS waiting for an operator's phone.
    const departures = await this.flights.refreshDueDepartures();
    const sms = await this.sms.refreshAll();
    logger.info(`[Cron] Return flights: ${JSON.stringify(result)}; departures: ${departures}; SMS queue: ${JSON.stringify(sms)}`);
    res.json({ ...result, departures, sms });
  });

  /** GET /internal/cron/prepare-files (S-C, 07/10/2026): keeps empty files for the big return days. */
  public prepareFiles = catchAsync(async (req: Request, res: Response) => {
    const result = await this.files.prepareAll();
    logger.info(`[Cron] Files prepared: ${JSON.stringify(result)}`);
    res.json(result);
  });

  /** GET /internal/cron/payouts */
  public payouts = catchAsync(async (req: Request, res: Response) => {
    const result = await this.payments.runPayouts();
    logger.info(`[Cron] Payouts: ${JSON.stringify(result)}`);
    res.json(result);
  });

  /** GET /internal/cron/expire-payment-holds */
  public expirePaymentHolds = catchAsync(async (req: Request, res: Response) => {
    const expired = await this.payments.expireLapsedHolds();
    logger.info(`[Cron] ${expired} lapsed payment holds expired`);
    res.json({ expired });
  });

  /**
   * GET /internal/cron/remind-tomorrow: the day-before reminders due now (S-A + S-B, 06/10/2026), once
   * per booking, then the retries of the SMS waiting for an operator's phone. Called every 15 minutes
   * by an external scheduler (Vercel Hobby only runs it once a day, as a fallback).
   */
  public remindTomorrow = catchAsync(async (req: Request, res: Response) => {
    const result = await this.reminders.dispatchDue();
    const sms = await this.sms.refreshAll();
    logger.info(`[Cron] Reminders: ${JSON.stringify(result)}; SMS queue: ${JSON.stringify(sms)}`);
    res.json({ ...result, sms });
  });

  /**
   * GET /internal/cron/booking-digest (N-A, 08/10/2026): the hourly « Récapitulatif horaire » of the new bookings to
   * the staff on `hourly`, per operator, outside the quiet hours. Called at every full hour by an external scheduler.
   */
  public bookingDigest = catchAsync(async (req: Request, res: Response) => {
    const result = await this.digest.run();
    logger.info(`[Cron] Booking digest: ${JSON.stringify(result)}`);
    res.json(result);
  });

  /** GET /internal/cron/purge-expired-tokens */
  public purgeExpiredTokens = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.tokenService.deleteExpired();
    // Safety net of the arrival signals' retention (they are also ended lazily when read).
    const arrivalSignalsEnded = await this.arrivals.sweep();
    const shuttleTripsEnded = await this.shuttle.sweep();
    // SMS: retry or abandon the waiting ones, and the 30-day retention of the outbox (recipients' numbers).
    const sms = await this.sms.refreshAll();
    const smsPurged = await this.sms.purgeOld();
    // Travellers' phones registered for the shuttle pushes: two days after the return.
    const travellerDevicesPurged = await this.returns.purgeDevices();
    const carLocationsPurged = await this.returns.purgeCarLocations();
    // Forwarded confirmation emails: text after 30 days, rows after 90 (M-A).
    const inboundEmails = await this.inbound.purge();
    // Bookings returned more than 12 months ago lose the traveller's data (privacy policy).
    const reservationsAnonymized = await this.retention.anonymizeReservations();
    logger.info(
      `[Cron] ${deleted} expired staff tokens deleted, ${arrivalSignalsEnded} arrival signals ended, ${shuttleTripsEnded} shuttle trips ended, ` +
        `SMS queue ${JSON.stringify(sms)}, ${smsPurged} outbox rows purged, ${reservationsAnonymized} bookings anonymised`,
    );
    res.json({
      deleted,
      arrivalSignalsEnded,
      shuttleTripsEnded,
      smsAbandoned: sms.abandoned,
      smsPurged,
      travellerDevicesPurged,
      carLocationsPurged,
      inboundEmails,
      reservationsAnonymized,
    });
  });
}
