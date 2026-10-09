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
 *       200: { description: "{ from, to, basis, timezone, totalCents, count, averageCents, averageDays, withoutAmount, byChannel, byDay, missing }" }
 *       400: { description: "fields.from / fields.to invalid_date, range_too_long (a year at most), fields.basis invalid_basis" }
 *       403: { description: forbidden (managers only) }
 * /internal/revenue/summary:
 *   get:
 *     summary: The dashboard's tile — this month, today and the last 7 days, by arrival
 *     tags: [Revenue]
 *     responses:
 *       200: { description: "{ today, month: { from, to, totalCents, count, withoutAmount }, todayCents, weekCents }" }
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
 */
export class RevenueRoute implements Routes {
  public router = Router();
  public revenue = new RevenueController();

  constructor() {
    this.router.get('/internal/revenue', StaffAuthMiddleware('revenue:view'), this.revenue.report);
    this.router.get('/internal/revenue/summary', StaffAuthMiddleware('revenue:view'), this.revenue.summary);
    this.router.get('/internal/revenue/export', StaffAuthMiddleware('revenue:view'), this.revenue.export);
    this.router.put(
      '/internal/reservations/:id/price',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(SetPriceDto),
      this.revenue.setPrice,
    );
  }
}
