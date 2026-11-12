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
 */
export class SurchargeRoute implements Routes {
  public router = Router();
  public surcharges = new SurchargeController();

  constructor() {
    this.router.get('/internal/parkings/:id/surcharges', StaffAuthMiddleware('parking:manage'), this.surcharges.get);
    this.router.put('/internal/parkings/:id/surcharges', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.surcharges.update);
  }
}
