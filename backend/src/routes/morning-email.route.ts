import { Router } from 'express';
import { MorningEmailController } from '@/controllers/morning-email.controller';
import { Routes } from '@/interfaces/routes.interface';

/**
 * @swagger
 * /public/morning-email/unsubscribe/{token}:
 *   get:
 *     tags: [Staff notifications]
 *     summary: « Ne plus le recevoir » of the « Mail du matin » (21/10/2026) — a small page with a button
 *     parameters: [{ in: path, name: token, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: HTML page }
 *       404: { description: Invalid link }
 *   post:
 *     tags: [Staff notifications]
 *     summary: Turns the « Mail du matin » off (the page's button, and the one-click unsubscription of RFC 8058)
 *     parameters: [{ in: path, name: token, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: HTML page }
 *       404: { description: Invalid link }
 */
export class MorningEmailRoute implements Routes {
  public router = Router();
  public morning = new MorningEmailController();

  constructor() {
    this.router.get('/public/morning-email/unsubscribe/:token', this.morning.unsubscribePage);
    this.router.post('/public/morning-email/unsubscribe/:token', this.morning.unsubscribe);
  }
}
