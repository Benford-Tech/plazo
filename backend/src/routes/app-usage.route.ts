import { Router } from 'express';
import { AppUsageController } from '@/controllers/app-usage.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Downloads and use of the Plazo and Plazo Pro apps (15/11/2026, choix « Mesuré par Plazo »)
 * /internal/platform/apps:
 *   get:
 *     summary: Plateforme › Applications (platform admin)
 *     description: >
 *       ?days=7|30|90 (30 by default), today included, Paris time. Plazo: new phones (first launch, about the installs) and
 *       the period before, phones active today, over 7 and 30 days, by platform, bookings made in the app. Plazo Pro:
 *       members active today, over 7 and 30 days, active members, parkings used over 7 days (no prospects' demo, no test
 *       operator). A day-by-day series and the first measured day.
 *     tags: [Applications]
 */
export class AppUsageRoute implements Routes {
  public router = Router();
  public usage = new AppUsageController();

  constructor() {
    this.router.get('/internal/platform/apps', PlatformAdminMiddleware(), this.usage.report);
  }
}
