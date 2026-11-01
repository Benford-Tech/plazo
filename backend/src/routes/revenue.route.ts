import { Router } from 'express';
import { RevenueController } from '@/controllers/revenue.controller';
import { SetPriceDto } from '@/dtos/reservation.dto';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Revenue
 *   description: The revenue of the bookings (CA-B + CA-A, 09/10/2026), managers only
 * /internal/revenue:
 *   get:
 *     summary: A period's revenue — total, bookings with an amount, average, by channel (comparators by name) and by day; bookings without an amount are counted apart and listed (50 at most). Cancelled bookings are left out.
 *     tags: [Revenue]
 *     parameters:
 *       - { in: query, name: from, required: true, schema: { type: string, example: "2026-10-01" } }
 *       - { in: query, name: to, required: true, schema: { type: string, example: "2026-10-31" } }
 *       - { in: query, name: basis, schema: { type: string, enum: [arrival, booked], default: arrival }, description: "The local day a booking counts on: its arrival, or the day it was booked" }
 *     responses:
 *       200: { description: "{ from, to, basis, timezone, today, totalCents, count, averageCents, averageDays, withoutAmount, byChannel, byDay, missing }" }
 *       400: { description: "fields.from / fields.to invalid_date, range_too_long (a year at most), fields.basis invalid_basis" }
 *       403: { description: forbidden (managers only) }
 * /internal/revenue/summary:
 *   get:
 *     summary: The dashboard's tile — this month, today and the last 7 days, by arrival
 *     tags: [Revenue]
 *     responses:
 *       200: { description: "{ today, month: { from, to, totalCents, count, withoutAmount }, todayCents, weekCents }" }
 * /internal/revenue/months:
 *   get:
 *     summary: « Mois par mois » (01/11/2026) — the 12 months ending with `to` (this month by default), each with its total, commissions, net, bookings with an amount and without; the oldest first
 *     tags: [Revenue]
 *     parameters:
 *       - { in: query, name: to, schema: { type: string, example: "2026-11" } }
 *       - { in: query, name: basis, schema: { type: string, enum: [arrival, booked], default: arrival } }
 *     responses:
 *       200: { description: "{ today, basis, months: [{ month, from, to, totalCents, commissionCents, netCents, count, withoutAmount }], totalCents, netCents }" }
 *       400: { description: "fields.to invalid_month, fields.basis invalid_basis" }
 *       403: { description: forbidden (managers only) }
 * /internal/revenue/export:
 *   get:
 *     summary: The period's bookings as a CSV (« ; », UTF-8 with BOM), with or without an amount
 *     tags: [Revenue]
 *     responses:
 *       200: { description: text/csv }
 * /internal/reservations/{id}/price:
 *   put:
 *     summary: The amount of a booking (any status but cancelled), in euro cents; null clears it. Never a Plazo booking's.
 *     tags: [Revenue]
 *     requestBody: { content: { application/json: { schema: { type: object, properties: { priceCents: { type: integer, nullable: true } } } } } }
 *     responses:
 *       200: { description: "{ id, priceCents }" }
 *       400: { description: "fields.priceCents price_locked (Plazo booking), reservation_closed (cancelled)" }
 * /internal/comparators/commissions:
 *   get:
 *     summary: What each comparator takes (19/10/2026) — the known four, every comparator named on a booking and every rate set; the rate in force today, the ones to come, the history, the bookings made this month
 *     tags: [Revenue]
 *     responses:
 *       200: { description: "{ today, comparators: [{ key, label, current, upcoming, history, bookingsThisMonth }] }" }
 *   put:
 *     summary: A comparator's rate from a local day on (the bookings made from that day take it; the same day again replaces it)
 *     tags: [Revenue]
 *     requestBody: { content: { application/json: { schema: { type: object, properties: { label: { type: string }, rateBp: { type: integer, description: "1800 = 18 %" }, fixedCents: { type: integer }, effectiveFrom: { type: string, example: "2026-10-01" } } } } } }
 *     responses:
 *       200: { description: "{ comparatorKey, label, rateBp, fixedCents, effectiveFrom }" }
 *       400: { description: "fields.label required/too_long, fields.rateBp integer/rate_range, fields.fixedCents integer/fixed_range, fields.effectiveFrom invalid_date" }
 * /internal/comparators/commissions/{key}/{effectiveFrom}:
 *   delete:
 *     summary: Takes out a rate set by mistake (its bookings fall back on the rate before)
 *     tags: [Revenue]
 *     responses:
 *       204: { description: done }
 *       404: { description: not_found }
 * /internal/reservations/{id}/commission:
 *   put:
 *     summary: One comparator booking's own commission — a rate (rateBp) or an amount (amountCents), or neither to go back to the comparator's rate
 *     tags: [Revenue]
 *     responses:
 *       200: { description: "{ id, commission }" }
 *       400: { description: "not_comparator, fields.rateBp rate_range, fields.amountCents invalid_amount / rate_or_amount" }
 */
export class RevenueRoute implements Routes {
  public router = Router();
  public revenue = new RevenueController();

  constructor() {
    this.router.get('/internal/revenue', StaffAuthMiddleware('revenue:view'), this.revenue.report);
    this.router.get('/internal/revenue/summary', StaffAuthMiddleware('revenue:view'), this.revenue.summary);
    this.router.get('/internal/revenue/months', StaffAuthMiddleware('revenue:view'), this.revenue.months);
    this.router.get('/internal/revenue/export', StaffAuthMiddleware('revenue:view'), this.revenue.export);
    this.router.put(
      '/internal/reservations/:id/price',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(SetPriceDto),
      this.revenue.setPrice,
    );
    this.router.get('/internal/comparators/commissions', StaffAuthMiddleware('revenue:view'), this.revenue.commissionList);
    this.router.put('/internal/comparators/commissions', StaffAuthMiddleware('revenue:view'), this.revenue.setCommission);
    this.router.delete('/internal/comparators/commissions/:key/:effectiveFrom', StaffAuthMiddleware('revenue:view'), this.revenue.removeCommission);
    this.router.put('/internal/reservations/:id/commission', StaffAuthMiddleware('revenue:view'), this.revenue.setReservationCommission);
  }
}
