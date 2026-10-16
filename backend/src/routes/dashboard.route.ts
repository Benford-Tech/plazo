import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: The pro space's home (05/10/2026)
 * /internal/dashboard:
 *   get:
 *     summary: The day's figures, the services' state, the alerts (no spot, delayed or cancelled flight, traveller waiting at the meeting point, keys not hung, SMS pending, overbooking) and the vehicles on the parking
 *     description: >
 *       Each vehicle carries boardingCheckIn { driverFirstName, at } when its traveller was checked in as they boarded
 *       a drop-off (« Embarquer en un geste », 14/10/2026), else null. 16/10/2026: `services.reading` { configured,
 *       outage: { cause, at } | null }: Claude's reading of the emails no rule knows; `outage` when an email that needed
 *       Claude could not be read within the hour (« Import » À voir).
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: "{ serverTime, date, parking, counts, services, alerts, breakdown, vehicles }" }
 */
export class DashboardRoute implements Routes {
  public router = Router();
  public dashboard = new DashboardController();

  constructor() {
    this.router.get('/internal/dashboard', StaffAuthMiddleware('reservations:view'), this.dashboard.get);
  }
}
