import { Router } from 'express';
import { ReturnController } from '@/controllers/return.controller';
import { ShuttleController } from '@/controllers/shuttle.controller';
import {
  ShuttleStopDto,
  ShuttleVehicleDto,
  StartTripDto,
  TravellerDeviceDto,
  TripPositionDto,
  UpdateShuttleStopDto,
  UpdateShuttleVehicleDto,
} from '@/dtos/shuttle.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   - name: Return day
 *     description: >
 *       "Votre retour aujourd'hui" (traveller, manage token in x-booking-token): the return flight
 *       (tracked by AeroDataBox or AirLabs when a key is set, refreshed at most every 5 minutes, or
 *       declared landed by the traveller), the meeting point with the operator's directions and
 *       photo, the walking route to it (IGN Géoplateforme, computed by the API and cached a few
 *       minutes; a straight line when the service fails), and the shuttle coming for them.
 *   - name: Shuttle
 *     description: >
 *       Driver mode (staff): today's returns to pick up, the operator's vehicles, and trips. While
 *       a trip runs, the driver's latest position (one per 10 s) is visible to its passengers only;
 *       it is erased when the trip ends ("Clients récupérés", or 90 minutes after the start). The
 *       audit log never holds coordinates.
 * components:
 *   schemas:
 *     FlightView:
 *       type: object
 *       properties:
 *         number: { type: string, nullable: true, example: "TO 3627" }
 *         status: { type: string, nullable: true, enum: [scheduled, delayed, departed, landed, cancelled, diverted, unknown] }
 *         scheduledAt: { type: string, format: date-time, nullable: true }
 *         estimatedAt: { type: string, format: date-time, nullable: true }
 *         landedAt: { type: string, format: date-time, nullable: true }
 *         landedSource: { type: string, nullable: true, enum: [tracking, traveller] }
 *         terminal: { type: string, nullable: true, example: "1" }
 *         gate: { type: string, nullable: true, example: "12" }
 *         checkedAt: { type: string, format: date-time, nullable: true }
 *     TravellerShuttle:
 *       type: object
 *       nullable: true
 *       properties:
 *         tripId: { type: string }
 *         direction: { type: string, enum: [pickup, dropoff] }
 *         mine: { type: boolean, description: This booking is on the trip }
 *         startedAt: { type: string, format: date-time }
 *         vehicle: { type: object, properties: { model: { type: string, nullable: true }, colour: { type: string, nullable: true }, plate: { type: string, nullable: true } } }
 *         driverFirstName: { type: string }
 *         position: { type: object, nullable: true, properties: { lat: { type: number }, lng: { type: number } } }
 *         positionAgeSeconds: { type: integer, nullable: true }
 *         distanceM: { type: integer, nullable: true }
 *         etaMinutes: { type: integer, nullable: true, description: "Straight line at 40 km/h, at least 1" }
 *         etaAt: { type: string, format: date-time, nullable: true }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *         destination: { type: object, nullable: true, properties: { kind: { type: string, enum: [parking, meeting_point] }, lat: { type: number }, lng: { type: number }, label: { type: string, nullable: true } } }
 *     TravellerReturn:
 *       type: object
 *       properties:
 *         reference: { type: string }
 *         status: { type: string }
 *         returnAt: { type: string, example: "2026-10-10T15:05" }
 *         returnDay: { type: boolean, description: Vehicle on site and within the return window }
 *         flight: { $ref: '#/components/schemas/FlightView' }
 *         flightTracked: { type: boolean, description: A flight provider is configured }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *         atMeetingPointAt: { type: string, format: date-time, nullable: true }
 *         shuttle: { $ref: '#/components/schemas/TravellerShuttle' }
 *         parking: { type: object, properties: { name: { type: string }, phone: { type: string, nullable: true }, shuttleMinutes: { type: integer, nullable: true }, address: { type: string, nullable: true } } }
 *         plate: { type: string }
 *     WalkingRoute:
 *       type: object
 *       properties:
 *         geometry: { type: array, items: { type: array, items: { type: number }, minItems: 2, maxItems: 2 }, description: "[lat, lng] pairs" }
 *         distanceM: { type: integer }
 *         durationMinutes: { type: integer }
 *         fallback: { type: boolean, description: True when the routing service failed (straight line) }
 *         from: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *         to: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *     ShuttleVehicle:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         model: { type: string, example: "Mercedes Vito" }
 *         colour: { type: string, nullable: true, example: "blanche" }
 *         plate: { type: string, nullable: true, example: "GH-456-JK" }
 *         seats: { type: integer, nullable: true, description: Passenger seats, the driver's excluded }
 *         inService: { type: boolean }
 *         driverId: { type: string, nullable: true, description: The usual driver }
 *         driverName: { type: string, nullable: true }
 *     DepartureRow:
 *       type: object
 *       properties:
 *         reservationId: { type: string }
 *         reference: { type: string }
 *         customerName: { type: string }
 *         passengers: { type: integer }
 *         plate: { type: string }
 *         status: { type: string }
 *         arrivalAt: { type: string, format: date-time }
 *         arrivedAt: { type: string, format: date-time, nullable: true }
 *         spot: { type: string, nullable: true }
 *         tripId: { type: string, nullable: true }
 *     StaffTrip:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         status: { type: string, enum: [running, ended] }
 *         direction: { type: string, enum: [pickup, dropoff], description: "pickup: to the airport for returning travellers; dropoff: to the terminal with arrived ones" }
 *         driverId: { type: string }
 *         driverName: { type: string }
 *         vehicle: { type: object, properties: { model: { type: string, nullable: true }, colour: { type: string, nullable: true }, plate: { type: string, nullable: true } } }
 *         startedAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         endedAt: { type: string, format: date-time, nullable: true }
 *         endReason: { type: string, nullable: true, enum: [completed, expired] }
 *         secondsLeft: { type: integer }
 *         passengers: { type: array, items: { type: object, properties: { reservationId: { type: string }, reference: { type: string }, customerName: { type: string }, passengers: { type: integer }, plate: { type: string }, terminal: { type: string, nullable: true } } } }
 *         positionUpdatedAt: { type: string, format: date-time, nullable: true, description: The driver's own position is never sent back }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *     PickupRow:
 *       type: object
 *       properties:
 *         reservationId: { type: string }
 *         reference: { type: string }
 *         customerName: { type: string }
 *         passengers: { type: integer }
 *         plate: { type: string }
 *         status: { type: string }
 *         returnAt: { type: string, format: date-time }
 *         flight: { $ref: '#/components/schemas/FlightView' }
 *         terminal: { type: string, nullable: true, example: "Terminal 1" }
 *         atMeetingPointAt: { type: string, format: date-time, nullable: true }
 *         tripId: { type: string, nullable: true, description: The running trip this traveller is on }
 */
/**
 * @swagger
 * /public/bookings/{reference}/return:
 *   get:
 *     summary: The return day of a booking (flight, meeting point, signal, shuttle)
 *     description: Refreshes the flight at the provider when due (at most once per 5 minutes per booking).
 *     tags: [Return day]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     responses:
 *       200: { description: The state, content: { application/json: { schema: { $ref: '#/components/schemas/TravellerReturn' } } } }
 *       404: { description: Unknown reference, wrong or revoked token (not_found) }
 * /public/bookings/{reference}/return/landed:
 *   post:
 *     summary: "\"J'ai atterri\": the flight counts as landed (the staff get a push)"
 *     tags: [Return day]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     responses:
 *       200: { description: The state, content: { application/json: { schema: { $ref: '#/components/schemas/TravellerReturn' } } } }
 * /public/bookings/{reference}/return/route:
 *   get:
 *     summary: Walking route to the meeting point
 *     description: >
 *       From the traveller's position (lat, lng), or from the airport when absent (location refused).
 *       Computed by the IGN Géoplateforme routing service (pedestrian profile) through the API, cached
 *       per booking for 3 minutes; `fallback: true` with a straight line when the service fails.
 *     tags: [Return day]
 *     security: []
 *     parameters:
 *       - { $ref: '#/components/parameters/BookingReference' }
 *       - { $ref: '#/components/parameters/BookingToken' }
 *       - { in: query, name: lat, schema: { type: number } }
 *       - { in: query, name: lng, schema: { type: number } }
 *     responses:
 *       200: { description: The route, content: { application/json: { schema: { $ref: '#/components/schemas/WalkingRoute' } } } }
 * /public/bookings/{reference}/shuttle:
 *   get:
 *     summary: The shuttle coming for this booking (null unless a running trip includes it)
 *     description: Polled every 10 s by the app while the trip card is open.
 *     tags: [Return day]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     responses:
 *       200:
 *         description: "{ shuttle, serverTime }"
 *         content: { application/json: { schema: { type: object, properties: { shuttle: { $ref: '#/components/schemas/TravellerShuttle' }, serverTime: { type: string, format: date-time } } } } }
 * /public/bookings/{reference}/shuttles:
 *   get:
 *     summary: The parking's running shuttles during the stay (arrival day to return day), the booking's own flagged
 *     description: |
 *       `phase` is `arrival`, `stay` or `return` (distance to the parking, or to the meeting point on the return
 *       day), null outside those days. Polled every 12 s by the app while the booking is open.
 *     tags: [Return day]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     responses:
 *       200:
 *         description: "{ phase, serverTime, shuttles }"
 *         content: { application/json: { schema: { type: object, properties: { phase: { type: string, nullable: true, enum: [arrival, stay, return] }, serverTime: { type: string, format: date-time }, shuttles: { type: array, items: { $ref: '#/components/schemas/TravellerShuttle' } } } } } }
 * /internal/shuttle/departures:
 *   get:
 *     summary: Today's arrived travellers waiting for the shuttle to the terminal (driver, drop-off)
 *     tags: [Shuttle]
 *     responses:
 *       200:
 *         description: "{ serverTime, rows }"
 *         content: { application/json: { schema: { type: object, properties: { serverTime: { type: string }, rows: { type: array, items: { $ref: '#/components/schemas/DepartureRow' } } } } } }
 * /internal/shuttle/pickups:
 *   get:
 *     summary: Today's returns to pick up at the airport (driver), flights refreshed when due
 *     description: Sorted at the meeting point first, then landed, then by expected landing. Group by `terminal` in the app.
 *     tags: [Shuttle]
 *     responses:
 *       200:
 *         description: "{ serverTime, meetingPoint, rows }"
 *         content: { application/json: { schema: { type: object, properties: { serverTime: { type: string }, meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }, rows: { type: array, items: { $ref: '#/components/schemas/PickupRow' } } } } } }
 * /public/bookings/{reference}/devices:
 *   put:
 *     summary: Registers the traveller's phone (OneSignal subscription id) for the pushes about their shuttle (N-A) — x-booking-token required
 *     tags: [Return]
 *     responses:
 *       200: { description: "{ subscriptionId, platform }" }
 * /public/bookings/{reference}/devices/{subscriptionId}:
 *   delete:
 *     summary: Forgets that phone
 *     tags: [Return]
 *     responses:
 *       204: { description: Removed }
 * /internal/shuttle/stops:
 *   get:
 *     summary: The places the shuttle serves (D-A) — the airport first (builtIn, id null, from the return meeting point), then the parking's own stops (station…)
 *     tags: [Shuttle]
 *     responses:
 *       200: { description: "{ data: [{ id, kind, name, lat, lng, instructions, builtIn }] }" }
 *   post:
 *     summary: Add a stop (manager) — { kind airport|station|other, name, lat, lng, instructions?, sortOrder? }
 *     tags: [Shuttle]
 *     responses:
 *       201: { description: "{ data }" }
 * /internal/shuttle/stops/{id}:
 *   patch:
 *     summary: Edit a stop (manager)
 *     tags: [Shuttle]
 *     responses:
 *       200: { description: "{ data }" }
 *   delete:
 *     summary: Remove a stop (manager); trips and bookings that referred to it fall back to the airport
 *     tags: [Shuttle]
 *     responses:
 *       204: { description: Removed }
 * /internal/shuttle/live:
 *   get:
 *     summary: P-A — the operator's running shuttles for the team's live map ({ serverTime, parking { id, name, lat, lng }, stops, trips [{ id, direction, driverName, vehicle, stop, passengers, position, positionAgeSeconds, toStop { distanceM, etaMinutes }, toParking }] })
 *     tags: [Shuttle]
 *     responses:
 *       200: { description: Live shuttles }
 * /internal/shuttle/vehicles:
 *   get:
 *     summary: The operator's shuttles
 *     tags: [Shuttle]
 *     responses:
 *       200: { description: "{ data }", content: { application/json: { schema: { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/ShuttleVehicle' } } } } } } }
 *   post:
 *     summary: Add a shuttle (manager)
 *     tags: [Shuttle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [model]
 *             properties:
 *               model: { type: string }
 *               colour: { type: string, nullable: true }
 *               plate: { type: string, nullable: true }
 *               seats: { type: integer, nullable: true, minimum: 1, maximum: 60 }
 *               inService: { type: boolean }
 *               driverId: { type: string, nullable: true }
 *     responses:
 *       201: { description: "{ data }" }
 * /internal/shuttle/vehicles/{id}:
 *   patch:
 *     summary: Edit a shuttle's sheet (manager); fields left out keep their value
 *     tags: [Shuttle]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model: { type: string }
 *               colour: { type: string, nullable: true }
 *               plate: { type: string, nullable: true }
 *               seats: { type: integer, nullable: true, minimum: 1, maximum: 60 }
 *               inService: { type: boolean }
 *               driverId: { type: string, nullable: true }
 *     responses:
 *       200: { description: "{ data }" }
 *       422: { description: "invalid_driver" }
 *   delete:
 *     summary: Remove a shuttle (manager); running trips keep their snapshot of it
 *     tags: [Shuttle]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: Removed }
 * /internal/shuttle/trips/current:
 *   get:
 *     summary: The signed-in driver's running trip, or null
 *     tags: [Shuttle]
 *     responses:
 *       200: { description: "{ trip }", content: { application/json: { schema: { type: object, properties: { trip: { $ref: '#/components/schemas/StaffTrip' } } } } } }
 * /internal/shuttle/trips:
 *   post:
 *     summary: "\"Démarrer le trajet (N clients)\": start sharing the position with those travellers"
 *     description: >
 *       One running trip per driver (409 trip_already_running, details.tripId). Passengers must be
 *       bookings of the operator whose vehicle is on site (422 invalid_passengers) and not already on
 *       a running trip (409 already_on_trip). The vehicle is one of the operator's (vehicleId) or typed
 *       freely (vehicle). The trip ends by itself 90 minutes after the start.
 *     tags: [Shuttle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationIds]
 *             properties:
 *               reservationIds: { type: array, items: { type: string }, minItems: 1, maxItems: 30 }
 *               vehicleId: { type: string, nullable: true }
 *               vehicle: { type: object, nullable: true, properties: { model: { type: string, nullable: true }, colour: { type: string, nullable: true }, plate: { type: string, nullable: true } } }
 *               direction: { type: string, enum: [pickup, dropoff], default: pickup, description: "dropoff: arrived travellers to the terminal (422 invalid_passengers otherwise); a vehicle with fewer seats than passengers is refused (422 too_many_passengers), an out-of-service one too (422 vehicle_out_of_service)" }
 *     responses:
 *       201: { description: "{ trip }", content: { application/json: { schema: { type: object, properties: { trip: { $ref: '#/components/schemas/StaffTrip' } } } } } }
 * /internal/shuttle/trips/{id}/position:
 *   post:
 *     summary: The driver's latest position (one per 10 s at most; driver only)
 *     description: >
 *       Replaces the previous position (never a history). 429 "too_many_positions" (details.retryAfterSeconds)
 *       within 10 s of the previous one; 409 "trip_not_running" once the trip ended; 400 "position_too_old"
 *       (more than 5 min) or "invalid_recorded_at" (in the future).
 *     tags: [Shuttle]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng, recordedAt]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *               accuracy: { type: number }
 *               recordedAt: { type: string, format: date-time }
 *     responses:
 *       200: { description: "{ trip }" }
 * /internal/shuttle/trips/{id}/end:
 *   post:
 *     summary: "\"Clients récupérés · retour parking\": the trip ends, the position is erased"
 *     description: The driver, or a manager or agent closing a forgotten trip.
 *     tags: [Shuttle]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ trip }" }
 */
export class ReturnRoute implements Routes {
  public router = Router();
  public returns = new ReturnController();
  public shuttle = new ShuttleController();

  constructor() {
    const base = '/public/bookings/:reference';
    this.router.get(`${base}/return`, this.returns.state);
    this.router.post(`${base}/return/landed`, this.returns.landed);
    this.router.get(`${base}/return/route`, this.returns.route);
    this.router.get(`${base}/shuttle`, this.returns.shuttle);
    this.router.get(`${base}/shuttles`, this.returns.shuttles);
    this.router.put(`${base}/devices`, ValidationMiddleware(TravellerDeviceDto), this.returns.registerDevice);
    this.router.delete(`${base}/devices/:subscriptionId`, this.returns.unregisterDevice);

    this.router.get('/internal/shuttle/stops', StaffAuthMiddleware('reservations:view'), this.shuttle.stops);
    this.router.post(
      '/internal/shuttle/stops',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(ShuttleStopDto),
      this.shuttle.addStop,
    );
    this.router.patch(
      '/internal/shuttle/stops/:id',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(UpdateShuttleStopDto),
      this.shuttle.updateStop,
    );
    this.router.delete('/internal/shuttle/stops/:id', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.shuttle.removeStop);
    this.router.get('/internal/shuttle/live', StaffAuthMiddleware('reservations:view'), this.shuttle.live);

    this.router.get('/internal/shuttle/forecast', StaffAuthMiddleware('reservations:view'), this.shuttle.waves);
    this.router.get('/internal/flights/check', StaffAuthMiddleware('parking:manage'), this.shuttle.checkFlight);
    this.router.get('/internal/shuttle/pickups', StaffAuthMiddleware('reservations:view'), this.shuttle.pickups);
    this.router.get('/internal/shuttle/departures', StaffAuthMiddleware('reservations:view'), this.shuttle.departures);
    this.router.get('/internal/shuttle/vehicles', StaffAuthMiddleware('reservations:view'), this.shuttle.vehicles);
    this.router.post(
      '/internal/shuttle/vehicles',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(ShuttleVehicleDto),
      this.shuttle.addVehicle,
    );
    this.router.patch(
      '/internal/shuttle/vehicles/:id',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdateShuttleVehicleDto),
      this.shuttle.updateVehicle,
    );
    this.router.delete('/internal/shuttle/vehicles/:id', StaffAuthMiddleware('parking:manage'), this.shuttle.removeVehicle);
    this.router.get('/internal/shuttle/trips/current', StaffAuthMiddleware('reservations:status'), this.shuttle.current);
    // A platform admin viewing an operator's space never shares a position in its name.
    this.router.post(
      '/internal/shuttle/trips',
      StaffAuthMiddleware('reservations:status'),
      RefuseInViewAs(),
      ValidationMiddleware(StartTripDto),
      this.shuttle.start,
    );
    this.router.post(
      '/internal/shuttle/trips/:id/position',
      StaffAuthMiddleware('reservations:status'),
      RefuseInViewAs(),
      ValidationMiddleware(TripPositionDto),
      this.shuttle.position,
    );
    this.router.post('/internal/shuttle/trips/:id/end', StaffAuthMiddleware('reservations:status'), RefuseInViewAs(), this.shuttle.end);
  }
}
