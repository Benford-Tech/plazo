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
 */
export class CronRoute implements Routes {
  public router = Router();
  public cron = new CronController();

  constructor() {
    this.router.get('/internal/cron/purge-expired-tokens', CronAuthMiddleware(), this.cron.purgeExpiredTokens);
  }
}
