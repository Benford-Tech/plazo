import { Router } from 'express';
import { ReservationController } from '@/controllers/reservation.controller';
import { ChangeStatusDto, CreateReservationDto, ParseEmailDto, UpdateReservationDto } from '@/dtos/reservation.dto';
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
 *     description: On the platform's test operator, the read first tops up the fictional travellers (TestFeedService).
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: date, schema: { type: string, example: "2026-10-04" }, description: "Local date (default: today)" }
 * /internal/planning/forecast:
 *   get:
 *     summary: Forecast calendar — arrivals, returns and night load of each day of 1 to 92 days
 *     description: Bookings as recorded (all channels, cancelled and no-shows excluded), nights against the real capacity.
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, example: "2026-10-01" }, description: "First local date (default: today)" }
 *       - { in: query, name: days, schema: { type: integer, example: 31 }, description: "1 to 92 (default 31)" }
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
 *     summary: Search reservations (plate, name, phone or reference), in chronological order
 *     description: >
 *       By arrival, the earliest first. Without q, page 1 opens on today's first arrival (the parking's local day) and
 *       pages 0, -1… go back in time; pageNumber is the page's place among all of them (« Page 3 / 4 »). With q, every
 *       match from the earliest, pages from 1.
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, description: "1 by default; 0 and below: before today (without q)" } }
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
 *             required: [channel, arrivalAt, returnAt, passengers, customerFirstName, customerLastName, customerPhone, plate]
 *             properties:
 *               channel: { type: string, enum: [website, phone, counter, aggregator, import] }
 *               channelDetail: { type: string, example: Parkos }
 *               arrivalAt: { type: string }
 *               returnAt: { type: string }
 *               passengers: { type: integer, minimum: 1, maximum: 9 }
 *               customerFirstName: { type: string, maxLength: 60, description: "Trimmed; the server stores \"Prénom Nom\" as customerName" }
 *               customerLastName: { type: string, maxLength: 60 }
 *               customerName: { type: string, maxLength: 120, description: "Older app versions only: the whole name, sent alone, split at its first space" }
 *               customerPhone: { type: string }
 *               customerEmail: { type: string }
 *               plate: { type: string, example: GK-318-PX }
 *               returnFlight: { type: string, example: TO 3627 }
 *               notes: { type: string }
 *               externalReference: { type: string, example: AL-884880719 }
 *               priceCents: { type: integer, example: 3499 }
 *               force: { type: boolean }
 * /internal/reservations/{id}:
 *   get:
 *     summary: One reservation
 *     description: >
 *       The reservation's fields (also those of each item of the list), among them priceCents and, for a booking made
 *       on Plazo, nightArrivalFeeCents / nightReturnFeeCents: the night fees charged at booking and included in
 *       priceCents (12/10/2026), frozen; null when none, and always for the other channels. The sheet alone adds
 *       boardingCheckIn { driverFirstName (null when unknown), at }: the traveller was checked in as they boarded a
 *       drop-off (« Pointé à l'embarquement par Karim », 14/10/2026); null otherwise, and once back to upcoming.
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   patch:
 *     summary: Edit a reservation (date changes re-check capacity; customerFirstName / customerLastName merged with the stored name, customerName recomputed, a blank one refused as required)
 *     description: >
 *       priceCents (10/10/2026): the amount in euro cents, null clears it; 400 with fields.priceCents = price_locked when
 *       it would change on a booking paid online on Plazo. Closed bookings (returned, cancelled, no-show) are refused with
 *       reservation_closed: their amount is corrected with PUT /internal/reservations/{id}/price.
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/imports/email:
 *   post:
 *     summary: Read a pasted confirmation email (Allopark) and prepare a reservation
 *     description: >
 *       Returns the fields found (parsed), the required ones still missing, an existing reservation
 *       with the same booking number (duplicate) and the load of the nights (capacity).
 *       422 "unrecognised_email" when no importer knows the email. Nothing is saved.
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
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
 * /internal/reservations/{id}/manage-link/revoke:
 *   post:
 *     summary: Revoke the traveller's manage link (bookings made on the site)
 *     description: >
 *       The link sent by email and SMS stops working; the traveller gets a new one from « Ma réservation »
 *       (reference + email). 400 "not_site_booking" for the other channels.
 *     tags: [Reservations]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
/**
 * @swagger
 * /internal/reservations/{id}/history:
 *   get:
 *     summary: "Historique (30/10/2026): who did what on the reservation, newest first. { data: [{ id, at, action, group (status | change | message | other), author { kind (staff | traveller | comparator | system), name, staffId, photoUpdatedAt, viewAs }, changes [{ field, from, to }] (values written for reading), info }] }"
 *     tags: [Reservations]
 *     responses:
 *       200: { description: The history }
 *       404: { description: not_found (another operator's reservation) }
 */
export class ReservationRoute implements Routes {
  public router = Router();
  public reservations = new ReservationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/planning', StaffAuthMiddleware('reservations:view'), this.reservations.planning);
    this.router.get('/internal/planning/forecast', StaffAuthMiddleware('reservations:view'), this.reservations.forecast);
    this.router.get('/internal/capacity', StaffAuthMiddleware('reservations:view'), this.reservations.capacity);
    this.router.get('/internal/reservations', StaffAuthMiddleware('reservations:view'), this.reservations.list);
    this.router.post(
      '/internal/reservations',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(CreateReservationDto),
      this.reservations.create,
    );
    this.router.post(
      '/internal/imports/email',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(ParseEmailDto),
      this.reservations.parseEmail,
    );
    // « Historique » (30/10/2026): who did what on the reservation, newest first.
    this.router.get('/internal/reservations/:id/history', StaffAuthMiddleware('reservations:view'), this.reservations.history);
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
    this.router.post('/internal/reservations/:id/manage-link/revoke', StaffAuthMiddleware('reservations:manage'), this.reservations.revokeManageLink);
  }
}
