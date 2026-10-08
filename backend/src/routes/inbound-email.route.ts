import express, { Router } from 'express';
import { RAW_EMAIL_MAX_BYTES, RAW_EMAIL_TYPE } from '@/domain/inbound-mime';
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
 *     summary: "Inbound email webhook of the Cloudflare relay: the raw message (message/rfc822, envelope in X-Envelope-From / X-Envelope-To, cut at 4 MB) or the former { items } JSON; header X-Inbound-Secret or query `secret` = INBOUND_EMAIL_SECRET"
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
 *     summary: "The inbox (M-A, 08/10/2026): ?view=todo|done|archived (todo by default; ?status= narrows), newest first, with { data, counts: { todo, done, archived } }"
 *     description: >
 *       todo = incomplete and unrecognised (all of them); done = imported, duplicate, handled (and the deprecated
 *       dismissed) of the last 30 days; archived = the last 90 days. Gmail's forwarding confirmations are never listed.
 * /internal/inbound/emails/{id}/handle:
 *   post:
 *     tags: [Inbound email]
 *     summary: "T-A « Marquer comme traité »: dealt with, with or without a booking (imported stays imported; 409 `archived`; 404 for a forwarding confirmation)"
 * /internal/inbound/emails/{id}/dismiss:
 *   post:
 *     tags: [Inbound email]
 *     deprecated: true
 *     summary: Deprecated alias of /handle
 * /internal/inbound/emails/{id}/archive:
 *   post:
 *     tags: [Inbound email]
 *     summary: "T-A « Archiver »: out of the inbox, readable in « Archivés » (text kept until the purge); 409 `forwarding`"
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
    // The relay posts the raw message (message/rfc822, up to Vercel's body limit); the former JSON shape still goes through express.json.
    this.router.post('/public/inbound/email', express.raw({ type: RAW_EMAIL_TYPE, limit: RAW_EMAIL_MAX_BYTES + 64 * 1024 }), this.inbound.receive);
    this.router.get('/internal/inbound/settings', StaffAuthMiddleware('reservations:manage'), this.inbound.settings);
    this.router.post('/internal/inbound/address', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.inbound.enableAddress);
    this.router.get('/internal/inbound/emails', StaffAuthMiddleware('reservations:manage'), this.inbound.list);
    this.router.post('/internal/inbound/emails/:id/handle', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.handle);
    this.router.post('/internal/inbound/emails/:id/dismiss', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.handle);
    this.router.post('/internal/inbound/emails/:id/archive', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.archive);
    this.router.post('/internal/inbound/emails/:id/attach', StaffAuthMiddleware('reservations:manage'), RefuseInViewAs(), this.inbound.attach);
  }
}
