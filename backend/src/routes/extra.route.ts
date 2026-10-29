import { Router } from 'express';
import { ExtraController } from '@/controllers/extra.controller';
import { Routes } from '@/interfaces/routes.interface';
import { lookupLimiter } from '@/middlewares/rateLimiter';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Extras
 *   description: >
 *     Services for the car (21/10/2026): lavage intérieur et shampouineuse, recharge hybride, recharge électrique. Each
 *     parking turns them on and sets its price (defaults 50 €, 15 €, 30 €) and how long before the return they can be
 *     ordered (24 h by default). The traveller orders them in the Plazo app, with the booking (`extras` of POST
 *     /public/bookings, paid in the same payment) or later, before or after the drop-off, each in its own payment sheet
 *     (PaymentIntent with metadata.extraId; the app calls `sync` after the sheet). The team marks them done (the traveller
 *     gets a push) or not possible (refunded). One still to do when the car is handed back, or on a cancelled or no-show
 *     booking, is refunded by the 15-minute pass. The operator's share is transferred on the booking's payout date, once
 *     done. Errors: 409 not_offered, closed, too_late, already_ordered, one_charge, not_online, online_booking_unavailable,
 *     not_to_do; 400 kind invalid, leadHours invalid, offers.<kind>.priceCents range (1 € to 1 000 €); 502 refund_failed.
 * /internal/parkings/{id}/extras:
 *   get:
 *     summary: The parking's services, prices and order deadline (managers)
 *     tags: [Extras]
 *   put:
 *     summary: "Changes them: { leadHours?, offers?: [{ kind, enabled, priceCents }] }"
 *     tags: [Extras]
 * /internal/reservations/{id}/extras:
 *   get:
 *     summary: The services ordered on a booking
 *     tags: [Extras]
 * /internal/extras:
 *   get:
 *     summary: "« Services à faire » (29/10/2026): ?view=todo|done|refused → { counts, data[] with dueAt (1 h before the expected return), late, reservation }"
 *     tags: [Extras]
 * /internal/reservations/{id}/extras/{extraId}/accept:
 *   post:
 *     summary: « Accepter » (the traveller is told; once only)
 *     tags: [Extras]
 * /internal/reservations/{id}/extras/{extraId}/done:
 *   post:
 *     summary: « Fait »
 *     tags: [Extras]
 * /internal/reservations/{id}/extras/{extraId}/refuse:
 *   post:
 *     summary: « Pas possible » { reason? }, refunded
 *     tags: [Extras]
 * /public/bookings/{reference}/extras:
 *   get:
 *     summary: What the traveller can order, and their orders (x-booking-token)
 *     tags: [Extras]
 *   post:
 *     summary: "Orders a service: { kind } → { extra, payment: { clientSecret, paymentIntentId, amountCents, currency } | { paid: true } }"
 *     tags: [Extras]
 * /public/bookings/{reference}/extras/{extraId}/sync:
 *   post:
 *     summary: After the payment sheet, reads the payment at Stripe
 *     tags: [Extras]
 * /public/bookings/{reference}/extras/{extraId}:
 *   delete:
 *     summary: The traveller closed the payment sheet without paying
 *     tags: [Extras]
 */
export class ExtraRoute implements Routes {
  public router = Router();
  public extras = new ExtraController();

  constructor() {
    this.router.get('/internal/parkings/:id/extras', StaffAuthMiddleware('parking:manage'), this.extras.settings);
    this.router.put('/internal/parkings/:id/extras', StaffAuthMiddleware('parking:manage'), this.extras.updateSettings);
    this.router.get('/internal/reservations/:id/extras', StaffAuthMiddleware('reservations:view'), this.extras.staffOrders);
    this.router.get('/internal/extras', StaffAuthMiddleware('reservations:view'), this.extras.board);
    this.router.post('/internal/reservations/:id/extras/:extraId/accept', StaffAuthMiddleware('reservations:status'), this.extras.accept);
    this.router.post('/internal/reservations/:id/extras/:extraId/done', StaffAuthMiddleware('reservations:status'), this.extras.done);
    this.router.post('/internal/reservations/:id/extras/:extraId/refuse', StaffAuthMiddleware('reservations:status'), this.extras.refuse);

    const traveller = '/public/bookings/:reference/extras';
    this.router.get(traveller, this.extras.travellerView);
    this.router.post(traveller, lookupLimiter, this.extras.order);
    this.router.post(`${traveller}/:extraId/sync`, this.extras.sync);
    this.router.delete(`${traveller}/:extraId`, this.extras.abandon);
  }
}
