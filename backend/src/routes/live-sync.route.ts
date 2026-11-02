import { Router } from 'express';
import { LiveSyncController } from '@/controllers/live-sync.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: LiveSync
 *   description: >
 *     Live sync between the web pro space and Plazo Pro (02/11/2026): a version that changes on every write of the operator;
 *     the screens poll it every few seconds and read their data again when it moves.
 * /internal/sync:
 *   get:
 *     summary: The operator's current version { version }
 */
export class LiveSyncRoute implements Routes {
  public router = Router();
  public sync = new LiveSyncController();

  constructor() {
    this.router.get('/internal/sync', StaffAuthMiddleware('reservations:view'), this.sync.get);
  }
}
