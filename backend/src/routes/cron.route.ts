import { Router } from 'express';
import { CronController } from '@/controllers/cron.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CronAuthMiddleware } from '@/middlewares/cron-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Cron
 *   description: Scheduled jobs, called by Vercel Cron (see the repository's vercel.json)
 */
/**
 * @swagger
 * /internal/cron/remind-tomorrow:
 *   get:
 *     summary: Send the day-before reminders (email, SMS, push) to the travellers arriving tomorrow, once each (every afternoon)
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: "{ checked, sent }"
 * /internal/cron/purge-expired-tokens:
 *   get:
 *     summary: Delete expired staff tokens, end lapsed arrival signals and shuttle trips, retry or abandon waiting SMS, purge the SMS outbox after 30 days, erase car positions and push phones 2 days after the return, anonymise bookings 12 months after it (every night)
 *     tags: [Cron]
 *     description: "Requires Authorization: Bearer <CRON_SECRET>."
 *     responses:
 *       200:
 *         description: "{ deleted, arrivalSignalsEnded, shuttleTripsEnded, smsAbandoned, smsPurged, travellerDevicesPurged, carLocationsPurged, reservationsAnonymized }"
 * /internal/cron/payouts:
 *   get:
 *     summary: Transfer the operators' shares that are due (every day)
 *     tags: [Cron]
 *     description: >
 *       "Requires Authorization: Bearer <CRON_SECRET>." Plazo takes each online payment on its own
 *       account, then transfers the operator's share (source_transaction = the charge) when it is due
 *       by the operator's payout schedule, unless the booking was cancelled. An operator whose
 *       account cannot take charges yet keeps its payouts pending until a later run.
 *     responses:
 *       200:
 *         description: "{ transferred, notDue, waitingForAccount, failed, skipped }"
 * /internal/cron/expire-arrival-signals:
 *   get:
 *     summary: End the arrival signals past their 2 hours (or whose booking moved on), erasing their position
 *     tags: [Cron]
 *     description: >
 *       "Requires Authorization: Bearer <CRON_SECRET>." Tidy-up only: signals are already ended when
 *       read (traveller, planning, live list); the nightly purge-expired-tokens run does it too.
 *     responses:
 *       200:
 *         description: "{ ended, tripsEnded }"
 * /internal/cron/track-return-flights:
 *   get:
 *     summary: Refresh today's return flights at the provider (daily at 03:00 UTC on Vercel Hobby, which only allows daily crons; every 10 minutes 05:00-00:00 on a higher plan; reads refresh lazily too)
 *     tags: [Cron]
 *     description: >
 *       "Requires Authorization: Bearer <CRON_SECRET>." Asks AeroDataBox (or AirLabs) about the return
 *       flights of the bookings whose vehicle is on site, within 24 h of the landing, skipping those
 *       looked up less than 5 minutes ago and the final ones (landed, cancelled, diverted). On a
 *       landing: push to the staff and SMS to the traveller, once each. Reads refresh lazily with the
 *       same cache, so the block works without this cron (Vercel Hobby: daily crons only). Also
 *       retries the SMS waiting for an operator's phone (sms_outbox).
 *     responses:
 *       200:
 *         description: "{ checked, landed, skipped, sms: { operators, checked, sent, abandoned } }"
 * /internal/cron/expire-payment-holds:
 *   get:
 *     summary: End the lapsed holds of bookings waiting for their online payment
 *     tags: [Cron]
 *     description: >
 *       "Requires Authorization: Bearer <CRON_SECRET>." Tidy-up only: a lapsed hold already stops
 *       counting toward capacity, and is expired by the Stripe webhook and when the booking is read.
 *     responses:
 *       200:
 *         description: "{ expired }"
 */
export class CronRoute implements Routes {
  public router = Router();
  public cron = new CronController();

  constructor() {
    this.router.get('/internal/cron/purge-expired-tokens', CronAuthMiddleware(), this.cron.purgeExpiredTokens);
    this.router.get('/internal/cron/payouts', CronAuthMiddleware(), this.cron.payouts);
    this.router.get('/internal/cron/expire-arrival-signals', CronAuthMiddleware(), this.cron.expireArrivalSignals);
    this.router.get('/internal/cron/expire-payment-holds', CronAuthMiddleware(), this.cron.expirePaymentHolds);
    this.router.get('/internal/cron/track-return-flights', CronAuthMiddleware(), this.cron.trackReturnFlights);
    this.router.get('/internal/cron/remind-tomorrow', CronAuthMiddleware(), this.cron.remindTomorrow);
  }
}
