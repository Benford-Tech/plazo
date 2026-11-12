import { Router } from 'express';
import { SurchargeController } from '@/controllers/surcharge.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @openapi
 * /internal/parkings/{id}/surcharges:
 *   get:
 *     summary: "12/11/2026: the parking's supplements { surcharges: [{ id, kind: late | night | breakdown | custom, enabled, amountCents, minutes, label, note }], night: { start, end } | null, nightFeesCharged, configured, line }"
 *     tags: [Parking]
 *   put:
 *     summary: "The whole list { surcharges, night?: { start, end } } (the night hours are the parking's, shared with « Mes tarifs »); 400 with the fields"
 *     tags: [Parking]
 * /internal/reservations/{id}/surcharges:
 *   get:
 *     summary: "12/11/2026 (B): the supplements applied on a booking { surcharges: [{ id, kind, label, amountCents, at, by }], options: [{ key, kind, label, amountCents }], suggestion: { kind: late, lateMinutes, amountCents, scheduledAt, arrivedAt } | null, totalCents, canEdit }"
 *     tags: [Reservations]
 *   post:
 *     summary: "Applies one of the parking's supplements { key } or an amount typed on the spot { label, amountCents } → 201 with the list; 409 not_offered, reservation_closed"
 *     tags: [Reservations]
 * /internal/reservations/{id}/surcharges/{surchargeId}:
 *   delete:
 *     summary: Removes a supplement (traced)
 *     tags: [Reservations]
 * /internal/reservations/{id}/surcharges/dismiss:
 *   post:
 *     summary: « Non » to the suggested late-arrival supplement
 *     tags: [Reservations]
 */
export class SurchargeRoute implements Routes {
  public router = Router();
  public surcharges = new SurchargeController();

  constructor() {
    this.router.get('/internal/parkings/:id/surcharges', StaffAuthMiddleware('parking:manage'), this.surcharges.get);
    this.router.put('/internal/parkings/:id/surcharges', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.surcharges.update);
    const booking = '/internal/reservations/:id/surcharges';
    this.router.get(booking, StaffAuthMiddleware('reservations:view'), this.surcharges.onBooking);
    this.router.post(`${booking}/dismiss`, StaffAuthMiddleware('reservations:status'), this.surcharges.dismissSuggestion);
    this.router.post(booking, StaffAuthMiddleware('reservations:status'), this.surcharges.addToBooking);
    this.router.delete(`${booking}/:surchargeId`, StaffAuthMiddleware('reservations:status'), this.surcharges.removeFromBooking);
  }
}
