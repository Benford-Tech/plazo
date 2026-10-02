import { Router } from 'express';
import { CronController } from '@/controllers/cron.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CronAuthMiddleware } from '@/middlewares/cron-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Cron
 *   description: Scheduled jobs, called by Vercel Cron (see backend/vercel.json)
 */
/**
 * @swagger
 * /internal/cron/purge-expired-tokens:
 *   get:
 *     summary: Delete expired staff tokens (every night)
 *     tags: [Cron]
 *     description: "Requires Authorization: Bearer <CRON_SECRET>."
 *     responses:
 *       200:
 *         description: "{ deleted }"
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
    this.router.get('/internal/cron/expire-payment-holds', CronAuthMiddleware(), this.cron.expirePaymentHolds);
  }
}
