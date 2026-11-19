import { Router } from 'express';
import { WebsiteIntegrationController } from '@/controllers/website-integration.controller';
import { Routes } from '@/interfaces/routes.interface';
import { siteBookingLimiter, siteQuoteLimiter } from '@/middlewares/rateLimiter';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Site du parking
 *   description: >
 *     19/11/2026 (niveau 2 « l'extension WordPress Plazo »): the parking's WordPress site, with a key of its own, reads the
 *     places and the grid price of a stay and creates its bookings (channel `website`, paid at the parking, no commission).
 * /internal/website-integration:
 *   get:
 *     summary: The site's key (its prefix only), when it was last used and the last booking received
 *     tags: [Site du parking]
 *   delete:
 *     summary: Remove the key (the site stops booking)
 *     tags: [Site du parking]
 * /internal/website-integration/key:
 *   post:
 *     summary: « Créer la clé » / « Nouvelle clé » — the key, shown once; the old one stops at once
 *     tags: [Site du parking]
 * /public/site/wordpress-plugin.zip:
 *   get:
 *     summary: The WordPress plugin « Plazo » (Extensions › Téléverser)
 *     tags: [Site du parking]
 * /public/site/status:
 *   get:
 *     summary: The plugin checks its key (header X-Plazo-Site-Key) → { connected, operatorName, parkingName, timezone }
 *     tags: [Site du parking]
 *     responses:
 *       401: { description: invalid_site_key }
 *       403: { description: operator_inactive }
 * /public/site/quote:
 *   get:
 *     summary: Places and grid price of a stay (arrivalAt, returnAt local « YYYY-MM-DDTHH:mm ») → { available, reason (full, no_price), fullNights, days, priceCents }
 *     tags: [Site du parking]
 *     responses:
 *       400: { description: "arrivalAt / returnAt: invalid_datetime, return_before_arrival, in_the_past" }
 * /public/site/bookings:
 *   post:
 *     summary: A booking from the parking's site (arrivalAt, returnAt, firstName, lastName, phone, email?, plate?, returnFlight?, passengers?, message?) → 201 { reference, duplicate, priceCents }
 *     tags: [Site du parking]
 *     responses:
 *       400: { description: field codes (required, invalid_phone, invalid_email, invalid_datetime…) }
 *       409: { description: "full (details.fullNights), no_price" }
 */
export class WebsiteIntegrationRoute implements Routes {
  public router = Router();
  public controller = new WebsiteIntegrationController();

  constructor() {
    this.router.get('/internal/website-integration', StaffAuthMiddleware('parking:manage'), this.controller.view);
    this.router.post('/internal/website-integration/key', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.rotate);
    this.router.delete('/internal/website-integration', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.revoke);
    this.router.get('/public/site/wordpress-plugin.zip', this.controller.download);
    this.router.get('/public/site/status', siteQuoteLimiter, this.controller.status);
    this.router.get('/public/site/quote', siteQuoteLimiter, this.controller.quote);
    this.router.post('/public/site/bookings', siteBookingLimiter, this.controller.book);
  }
}
