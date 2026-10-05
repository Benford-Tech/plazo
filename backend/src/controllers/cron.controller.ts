import { Request, Response } from 'express';
import { Container } from 'typedi';
import { ArrivalService } from '@/services/arrival.service';
import { FlightTrackingService } from '@/services/flight-tracking.service';
import { ReturnService } from '@/services/return.service';
import { ShuttleService } from '@/services/shuttle.service';
import { SmsService } from '@/services/sms.service';
import { PaymentService } from '@/services/payment.service';
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
  public sms = Container.get(SmsService);

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
    logger.info(
      `[Cron] ${deleted} expired staff tokens deleted, ${arrivalSignalsEnded} arrival signals ended, ${shuttleTripsEnded} shuttle trips ended, ` +
        `SMS queue ${JSON.stringify(sms)}, ${smsPurged} outbox rows purged`,
    );
    res.json({ deleted, arrivalSignalsEnded, shuttleTripsEnded, smsAbandoned: sms.abandoned, smsPurged, travellerDevicesPurged });
  });
}
