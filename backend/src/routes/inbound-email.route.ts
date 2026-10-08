import { Router } from 'express';
import { InboundEmailController } from '@/controllers/inbound-email.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Inbound email
 *   description: >
 *     M-A (06/10/2026) — the operator's mailbox forwards the comparators' confirmation emails to
 *     their Plazo address (<slug>@INBOUND_EMAIL_DOMAIN); Cloudflare Email Routing and the email-worker/
 *     relay post them to the public webhook; a recognised, complete email becomes a booking at once, the others wait in
 *     "À vérifier".
 *
 * /public/inbound/email:
 *   post:
 *     tags: [Inbound email]
 *     summary: Inbound email webhook of the Cloudflare relay (header X-Inbound-Secret or query `secret` = INBOUND_EMAIL_SECRET)
 *     responses:
 *       200:
 *         description: "{ received, imported, toCheck, ignored }; always 200 once authenticated, so the relay does not resend"
 *       401:
 *         description: Bad or missing secret, or the feature is off
 * /internal/inbound/settings:
 *   get:
 *     tags: [Inbound email]
 *     summary: The operator's inbound address, last email received, counts of the last 30 days
 * /internal/inbound/address:
 *   post:
 *     tags: [Inbound email]
 *     summary: "Manager: returns the address (every operator has one from its creation), or gives a new one with { regenerate: true }"
 * /internal/inbound/emails:
 *   get:
 *     tags: [Inbound email]
 *     summary: "« À vérifier »: the emails waiting for the staff first, then the last 30 days (?status=)"
 * /internal/inbound/emails/{id}/dismiss:
 *   post:
 *     tags: [Inbound email]
 *     summary: Close an email without a booking
 * /internal/inbound/emails/{id}/attach:
 *   post:
 *     tags: [Inbound email]
 *     summary: "Link an email to the booking typed from it ({ reservationId })"
 */
export class InboundEmailRoute implements Routes {
  public router = Router();
  public inbound = new InboundEmailController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/public/inbound/email', this.inbound.receive);
    this.router.get('/internal/inbound/settings', StaffAuthMiddleware('reservations:manage'), this.inbound.settings);
    this.router.post('/internal/inbound/address', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.inbound.enableAddress);
    this.router.get('/internal/inbound/emails', StaffAuthMiddleware('reservations:manage'), this.inbound.list);
    this.router.post('/internal/inbound/emails/:id/dismiss', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.dismiss);
    this.router.post('/internal/inbound/emails/:id/attach', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.attach);
  }
}
