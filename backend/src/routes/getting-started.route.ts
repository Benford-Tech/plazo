import { Router } from 'express';
import { GettingStartedController } from '@/controllers/getting-started.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: GettingStarted
 *   description: >
 *     « Bien démarrer avec Plazo Pro » (26/10/2026, choice T-A): the setup steps of the staff member's post, ticked from
 *     what Plazo sees (nothing stored).
 * /internal/getting-started:
 *   get:
 *     summary: The steps of the member's post { post, steps[{ key, done, detail }], done, total }
 */
export class GettingStartedRoute implements Routes {
  public router = Router();
  public gettingStarted = new GettingStartedController();

  constructor() {
    this.router.get('/internal/getting-started', StaffAuthMiddleware('reservations:view'), this.gettingStarted.get);
  }
}
