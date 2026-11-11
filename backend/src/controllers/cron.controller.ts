import { ReservationTrashService } from '@/services/reservation-trash.service';
import { ProspectDemoService } from '@/services/prospect-demo.service';
import { Request, Response } from 'express';
import { Container } from 'typedi';
import { AppLinkService } from '@/services/app-link.service';
import { ArrivalService } from '@/services/arrival.service';
import { BookingDigestService } from '@/services/booking-digest.service';
import { FileService } from '@/services/file.service';
import { FlightTrackingService } from '@/services/flight-tracking.service';
import { IdentityVerificationService } from '@/services/identity-verification.service';
import { InboundEmailService } from '@/services/inbound-email.service';
import { JoinRequestService } from '@/services/join-request.service';
import { purgeLoginAttempts } from '@/services/password-attempts';
import { ReturnService } from '@/services/return.service';
import { ShuttleService } from '@/services/shuttle.service';
import { SeoService } from '@/services/seo.service';
import { SmsPhoneService } from '@/services/sms-phone.service';
import { SmsService } from '@/services/sms.service';
import { WhatsappService } from '@/services/whatsapp.service';
import { PaymentService } from '@/services/payment.service';
import { MorningEmailService } from '@/services/morning-email.service';
import { InboundWatchService } from '@/services/inbound-watch.service';
import { ProspectingService } from '@/services/prospecting.service';
import { ValetService } from '@/services/valet.service';
import { ExtraService } from '@/services/extra.service';
import { ReminderService } from '@/services/reminder.service';
import { RetentionService } from '@/services/retention.service';
import { TokenService } from '@/services/token.service';
import { StaffNotificationService } from '@/services/staff-notification.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

/**
 * cron-job.org only alerts on a non-2xx answer: a run in which everything that was tried failed answers 500 with the
 * same JSON (08/10/2026). A run with nothing to do, or with at least one success, stays 200.
 */
const statusOf = (tried: number, failed: number): number => (tried > 0 && failed >= tried ? 500 : 200);

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
  public joinRequests = Container.get(JoinRequestService);
  public identityVerification = Container.get(IdentityVerificationService);
  public prospecting = Container.get(ProspectingService);
  public morning = Container.get(MorningEmailService);
  public inboundWatch = Container.get(InboundWatchService);
  public valet = Container.get(ValetService);
  public demo = Container.get(ProspectDemoService);
  public extras = Container.get(ExtraService);
  public whatsapp = Container.get(WhatsappService);
  public smsPhone = Container.get(SmsPhoneService);
  public seo = Container.get(SeoService);

  /** WhatsApp messages not delivered after 5 minutes go by SMS (03/11/2026). Never throws (rides on remind-tomorrow). */
  /** 06/11/2026: the parking's SMS phone checked every 15 minutes (never throws: rides on remind-tomorrow). */
  private async phonePass(): Promise<Awaited<ReturnType<SmsPhoneService['checkAll']>> | { error: true }> {
    try {
      return await this.smsPhone.checkAll();
    } catch (error) {
      logger.error(`[Cron] SMS phone pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

  private async whatsappPass(): Promise<(Awaited<ReturnType<WhatsappService['sweep']>> & { webhook: string }) | { error: true }> {
    try {
      // 11/11/2026: Meta's status webhook kept in place (subscribed once, then checked every 6 hours).
      const webhook = await this.whatsapp.ensureWebhook();
      return { ...(await this.whatsapp.sweep()), webhook };
    } catch (error) {
      logger.error(`[Cron] WhatsApp pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

  /** Services for the car (21/10/2026) still to do on a closed booking: refunded. Never throws (rides on remind-tomorrow). */
  private async extrasPass(): Promise<Awaited<ReturnType<ExtraService['settle']>> | { error: true }> {
    try {
      return await this.extras.settle();
    } catch (error) {
      logger.error(`[Cron] Extras pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

  /**
   * The prospecting emails due now (Plateforme › Prospection, 18/10/2026). Never throws: a failure here must not change
   * the answer of the route that carries it (remind-tomorrow).
   */
  private async prospectingPass(): Promise<Awaited<ReturnType<ProspectingService['runDue']>> | { error: true }> {
    try {
      return await this.prospecting.runDue();
    } catch (error) {
      logger.error(`[Cron] Prospecting pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

  /** « Mail du matin » (21/10/2026) due now. Never throws: it must not change the answer of remind-tomorrow. */
  /** « Course à prendre » (27/10/2026): the valets hear of the runs nobody took. Never throws. */
  private async valetPass(): Promise<{ announced: number } | { error: true }> {
    try {
      return { announced: await this.valet.announceDue() };
    } catch (error) {
      logger.error(`[Cron] valet runs pass failed: ${error instanceof Error ? error.message : String(error)}`);
      return { error: true };
    }
  }

  /** 09/11/2026: the inbound emails left « À traiter » told to the managers, the platform's morning report. Never throws. */
  private async inboundWatchPass(): Promise<Awaited<ReturnType<InboundWatchService['run']>> | { error: true }> {
    try {
      return await this.inboundWatch.run();
    } catch (error) {
      logger.error(`[Cron] inbound watch pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

  private async morningPass(): Promise<Awaited<ReturnType<MorningEmailService['run']>> | { error: true }> {
    try {
      return await this.morning.run();
    } catch (error) {
      logger.error(`[Cron] Morning email pass failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { error: true };
    }
  }

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
    res.status(statusOf(result.checked, result.errors)).json({ ...result, departures, sms });
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
    // The services for the car done (21/10/2026), on their booking's payout date.
    const extras = await this.extras.runPayouts();
    logger.info(`[Cron] Payouts: ${JSON.stringify(result)}; services: ${JSON.stringify(extras)}`);
    const tried = result.transferred + result.failed + extras.transferred + extras.failed;
    res.status(statusOf(tried, result.failed + extras.failed)).json({ ...result, extras });
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
    // The prospecting emails ride on this 15-minute call (Vercel Hobby has daily crons only); their outcome never changes
    // this route's status.
    const prospecting = await this.prospectingPass();
    // « Mail du matin » (21/10/2026) rides on it too, with the same rule.
    const morning = await this.morningPass();
    const extras = await this.extrasPass();
    const valet = await this.valetPass();
    const whatsapp = await this.whatsappPass();
    const phone = await this.phonePass();
    const inbound = await this.inboundWatchPass();
    logger.info(
      `[Cron] Reminders: ${JSON.stringify(result)}; SMS queue: ${JSON.stringify(sms)}; SMS phone: ${JSON.stringify(phone)}; prospecting: ${JSON.stringify(prospecting)}; morning: ${JSON.stringify(morning)}; services: ${JSON.stringify(extras)}; valet: ${JSON.stringify(valet)}; WhatsApp: ${JSON.stringify(whatsapp)}; inbound: ${JSON.stringify(inbound)}`,
    );
    res
      .status(statusOf(result.sent + result.failed, result.failed))
      .json({ ...result, sms, prospecting, morning, extras, valet, whatsapp, phone, inbound });
  });

  /** GET /internal/cron/morning-email: « Mail du matin » due now, for a dedicated job (also run by remind-tomorrow). */
  public morningEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await this.morning.run();
    logger.info(`[Cron] Morning email: ${JSON.stringify(result)}`);
    res.status(statusOf(result.sent + result.failed, result.failed)).json(result);
  });

  /** GET /internal/cron/prospecting: the prospecting emails due now, for a dedicated job (also run by remind-tomorrow). */
  public prospectingDue = catchAsync(async (req: Request, res: Response) => {
    const result = await this.prospecting.runDue();
    logger.info(`[Cron] Prospecting: ${JSON.stringify(result)}`);
    res.status(statusOf(result.sent + result.failed, result.failed)).json(result);
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
    // 03/11/2026: WhatsApp messages (number and status, no text) after 30 days.
    const whatsappPurged = await this.whatsapp.purgeOld();
    // Travellers' phones registered for the shuttle pushes: two days after the return.
    const travellerDevicesPurged = await this.returns.purgeDevices();
    const carLocationsPurged = await this.returns.purgeCarLocations();
    // Forwarded confirmation emails: text after 30 days, rows after 90 (M-A).
    const inboundEmails = await this.inbound.purge();
    // Bookings returned more than 12 months ago lose the traveller's data (privacy policy).
    const reservationsAnonymized = await this.retention.anonymizeReservations();
    // Condition report photos 90 days after the return (365 with a reservation), signature codes after a day.
    const paperwork = await this.retention.paperwork.purge();
    // « Rejoindre un parking » (13/10/2026): onboarding sessions past their 7 days, requests unanswered for 7 days
    // (expired), join attempts after 7 days, identities never linked and idle for 30 days.
    const identityTokensDeleted = await this.tokenService.deleteExpiredOnboardingTokens();
    const joins = await this.joinRequests.purge();
    // Apple / Google tokens already used (single use) past their own expiry, and login attempts after 30 days.
    const usedIdentityTokensDeleted = await this.identityVerification.purgeUsedTokens();
    const loginAttemptsDeleted = await purgeLoginAttempts();
    // « Lien court Plazo » (27/10/2026): phones remembered for the store past their 24 h.
    const appLinkClaimsDeleted = await Container.get(AppLinkService).purge();
    // Prospects 3 years after the last contact (or their creation); the opt-out list stays.
    const prospectsDeleted = await this.prospecting.purge();
    // 02/11/2026: the bell forgets after 30 days.
    const bellPurged = await Container.get(StaffNotificationService).purge();
    // 03/11/2026: the reservations deleted 45 days ago, erased for good with their mails, contract and photos.
    const reservationsPurged = await Container.get(ReservationTrashService).purge();
    // 06/11/2026: the SMS phone's checks after 30 days.
    const phoneChecksPurged = await this.smsPhone.purge();
    // 06/11/2026 (SEO local M2): Search Console's last days, then the old visits and rows (never throws).
    const searchConsole = await this.seo.syncSearchConsole();
    const seoPurged = await this.seo.purge();
    // 21/10/2026: the prospects' demo starts every day afresh (never throws).
    const demoReset = await this.demo.reset();
    logger.info(
      `[Cron] ${deleted} expired staff tokens deleted, ${arrivalSignalsEnded} arrival signals ended, ${shuttleTripsEnded} shuttle trips ended, ` +
        `SMS queue ${JSON.stringify(sms)}, ${smsPurged} outbox rows purged, ${reservationsAnonymized} bookings anonymised, ` +
        `${paperwork.photosErased} inspection photos erased, ${paperwork.codesDeleted} signature codes deleted, ` +
        `${identityTokensDeleted} onboarding tokens deleted, join requests ${JSON.stringify(joins)}, ` +
        `${usedIdentityTokensDeleted} used identity tokens, ${loginAttemptsDeleted} login attempts and ${prospectsDeleted} prospects deleted`,
    );
    res.json({
      deleted,
      demoReset,
      arrivalSignalsEnded,
      shuttleTripsEnded,
      smsAbandoned: sms.abandoned,
      smsPurged,
      whatsappPurged,
      travellerDevicesPurged,
      carLocationsPurged,
      inboundEmails,
      reservationsAnonymized,
      inspectionPhotosErased: paperwork.photosErased,
      signatureCodesDeleted: paperwork.codesDeleted,
      identityTokensDeleted,
      joinRequestsExpired: joins.requestsExpired,
      joinAttemptsDeleted: joins.joinAttemptsDeleted,
      identitiesDeleted: joins.identitiesDeleted,
      usedIdentityTokensDeleted,
      loginAttemptsDeleted,
      appLinkClaimsDeleted,
      prospectsDeleted,
      bellPurged,
      reservationsPurged,
      phoneChecksPurged,
      searchConsole,
      seoPurged,
    });
  });
}
