import { Router } from 'express';
import { ReservationController } from '@/controllers/reservation.controller';
import { ChangeStatusDto, CreateReservationDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Bookings, day planning and per-night capacity
 */
/**
 * @swagger
 * /internal/planning:
 *   get:
 *     summary: Day sheet — arrivals, returns and the load of the next 7 nights
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: date, schema: { type: string, example: "2026-10-04" }, description: "Local date (default: today)" }
 * /internal/capacity:
 *   get:
 *     summary: Load of each night of a stay, with the nights already full
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: arrivalAt, required: true, schema: { type: string, example: "2026-10-04T06:30" } }
 *       - { in: query, name: returnAt, required: true, schema: { type: string, example: "2026-10-11T15:05" } }
 *       - { in: query, name: excludeId, schema: { type: string }, description: "Reservation being edited" }
 * /internal/reservations:
 *   get:
 *     summary: Search reservations (plate, name, phone or reference)
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *   post:
 *     summary: Create a reservation
 *     description: >
 *       Dates are local to the parking ("2026-10-04T06:30") or ISO instants. Refused with 409 and
 *       code "overbooked" (details.nights) when a night is full, unless force=true (agents and managers, audited).
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channel, arrivalAt, returnAt, passengers, customerName, customerPhone, plate]
 *             properties:
 *               channel: { type: string, enum: [website, phone, counter, aggregator, import] }
 *               channelDetail: { type: string, example: Parkos }
 *               arrivalAt: { type: string }
 *               returnAt: { type: string }
 *               passengers: { type: integer, minimum: 1, maximum: 9 }
 *               customerName: { type: string }
 *               customerPhone: { type: string }
 *               customerEmail: { type: string }
 *               plate: { type: string, example: GK-318-PX }
 *               returnFlight: { type: string, example: TO 3627 }
 *               notes: { type: string }
 *               force: { type: boolean }
 * /internal/reservations/{id}:
 *   get:
 *     summary: One reservation
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   patch:
 *     summary: Edit a reservation (date changes re-check capacity)
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/reservations/{id}/status:
 *   post:
 *     summary: Change the status (upcoming → arrived → shuttled_out → return_requested → returned; cancelled, no_show)
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [upcoming, arrived, shuttled_out, return_requested, returned, cancelled, no_show] }
 */
export class ReservationRoute implements Routes {
  public router = Router();
  public reservations = new ReservationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/planning', StaffAuthMiddleware('reservations:view'), this.reservations.planning);
    this.router.get('/internal/capacity', StaffAuthMiddleware('reservations:view'), this.reservations.capacity);
    this.router.get('/internal/reservations', StaffAuthMiddleware('reservations:view'), this.reservations.list);
    this.router.post(
      '/internal/reservations',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(CreateReservationDto),
      this.reservations.create,
    );
    this.router.get('/internal/reservations/:id', StaffAuthMiddleware('reservations:view'), this.reservations.get);
    this.router.patch(
      '/internal/reservations/:id',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(UpdateReservationDto, 'body', true),
      this.reservations.update,
    );
    this.router.post(
      '/internal/reservations/:id/status',
      StaffAuthMiddleware('reservations:status'),
      ValidationMiddleware(ChangeStatusDto),
      this.reservations.changeStatus,
    );
  }
}
