import { Router } from 'express';
import { TravellerWelcomeController } from '@/controllers/traveller-welcome.controller';
import { Routes } from '@/interfaces/routes.interface';

/**
 * @swagger
 * /public/traveller-emails/unsubscribe/{token}:
 *   get:
 *     tags: [Bookings]
 *     summary: « Ne plus recevoir ces messages » of the welcome email to the travellers (15/11/2026) — a small page with a button
 *     parameters: [{ in: path, name: token, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: HTML page }
 *       404: { description: Invalid link }
 *   post:
 *     tags: [Bookings]
 *     summary: Stops the welcome emails to this address (the page's button, and the one-click unsubscription of RFC 8058)
 *     parameters: [{ in: path, name: token, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: HTML page }
 *       404: { description: Invalid link }
 */
export class TravellerWelcomeRoute implements Routes {
  public router = Router();
  public welcome = new TravellerWelcomeController();

  constructor() {
    this.router.get('/public/traveller-emails/unsubscribe/:token', this.welcome.unsubscribePage);
    this.router.post('/public/traveller-emails/unsubscribe/:token', this.welcome.unsubscribe);
  }
}
