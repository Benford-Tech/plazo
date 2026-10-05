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
