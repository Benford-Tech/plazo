import { Router } from 'express';
import { DemoController } from '@/controllers/demo.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { demoLimiter, publicLimiter } from '@/middlewares/rateLimiter';

/**
 * @swagger
 * /internal/auth/demo:
 *   post:
 *     tags: [Demo]
 *     summary: Opens the prospects' demo (« Parking des Cèdres (démo) ») in a role, with or without a prospect's link
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [manager, agent, driver, valet] }
 *               token: { type: string, description: A prospect's link (its opens are counted) }
 *     responses:
 *       200: { description: "{ tokenData, user } (user.demo.resetsAt)" }
 *       400: { description: Unknown role (code invalid_role) }
 *       404: { description: Unknown link (code demo_link_unknown) }
 *       410: { description: Expired link (code demo_link_expired) }
 * /public/demo/links/{token}:
 *   get:
 *     tags: [Demo]
 *     summary: A demo link's state (valid, expired, unknown) and the prospect's parking name
 * /internal/platform/prospects/{id}/demo-link:
 *   post:
 *     tags: [Prospecting]
 *     summary: « Créer un lien de démo » — the prospect's link for 14 days (kept while valid; `renew` makes a new one)
 */
export class DemoRoute implements Routes {
  public router = Router();
  public demo = new DemoController();

  constructor() {
    this.router.post('/internal/auth/demo', demoLimiter, this.demo.enter);
    this.router.get('/public/demo/links/:token', publicLimiter, this.demo.link);
    this.router.post('/internal/platform/prospects/:id/demo-link', PlatformAdminMiddleware(), this.demo.prospectLink);
  }
}
