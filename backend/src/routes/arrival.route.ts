import { Router } from 'express';
import { ArrivalController } from '@/controllers/arrival.controller';
import {
  AnnounceArrivalDto,
  ArrivalPositionDto,
  AtMeetingPointDto,
  NotificationPreferencesDto,
  RegisterDeviceDto,
  ReturnMeetingPointDto,
  StartArrivalDto,
  StopArrivalDto,
} from '@/dtos/arrival.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   - name: Arrivals
 *     description: >
 *       "Prévenir de son arrivée". A traveller with a booking made on the site (manage token in the
 *       x-booking-token header, as for the other public booking routes) tells the parking they are
 *       coming: live position (explicit consent), or "J'arrive dans 10 / 20 / 30 min", or "Je suis au
 *       point de rendez-vous". Two moments: the drop-off ("outbound", meeting point: the parking's
 *       reception) and the return ("return", meeting point: the operator's return point, else the
 *       airport). Each moment opens 2 h before the drop-off (status upcoming) or the return (vehicle
 *       on site) and closes 2 h (outbound) or 6 h (return) after it; else 409 "arrival_window_closed".
 *       RGPD: only the latest position is kept, while sharing; it is erased on stop, within 150 m of
 *       the meeting point (state at_meeting_point) and 2 h after the start (state ended, reason
 *       expired). No history, and the audit log never holds coordinates.
 *   - name: Staff notifications
 *     description: Push notifications of arrivals to the staff app (OneSignal), per person.
 * components:
 *   schemas:
 *     MeetingPoint:
 *       type: object
 *       nullable: true
 *       properties:
 *         lat: { type: number }
 *         lng: { type: number }
 *         source: { type: string, enum: [parking, return_point, airport] }
 *         label: { type: string, nullable: true, example: "Terminal 1 · arrêt navettes" }
 *     TravellerArrival:
 *       type: object
 *       properties:
 *         reference: { type: string }
 *         moment:
 *           type: object
 *           nullable: true
 *           description: The moment offered now (open) or the next one (opensAt). Null when nothing is left.
 *           properties:
 *             kind: { type: string, enum: [outbound, return] }
 *             open: { type: boolean }
 *             opensAt: { type: string, format: date-time }
 *             closesAt: { type: string, format: date-time }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *         signal:
 *           type: object
 *           nullable: true
 *           properties:
 *             kind: { type: string, enum: [outbound, return] }
 *             state: { type: string, enum: [sharing, announced, at_meeting_point, ended] }
 *             endReason: { type: string, nullable: true, enum: [stopped, expired, closed] }
 *             startedAt: { type: string, format: date-time }
 *             expiresAt: { type: string, format: date-time }
 *             secondsLeft: { type: integer }
 *             distanceM: { type: integer, nullable: true }
 *             etaMinutes: { type: integer, nullable: true }
 *             etaAt: { type: string, format: date-time, nullable: true }
 *             announcedMinutes: { type: integer, nullable: true, enum: [10, 20, 30] }
 *             atMeetingPointAt: { type: string, format: date-time, nullable: true }
 *             positionUpdatedAt: { type: string, format: date-time, nullable: true }
 *         rules:
 *           type: object
 *           properties:
 *             maxMinutes: { type: integer, example: 120 }
 *             arrivedWithinMeters: { type: integer, example: 150 }
 *             positionIntervalSeconds: { type: integer, example: 10 }
 *             announceMinutes: { type: array, items: { type: integer }, example: [10, 20, 30] }
 *     StaffArrivalSignal:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         reservationId: { type: string }
 *         reference: { type: string }
 *         kind: { type: string, enum: [outbound, return] }
 *         state: { type: string, enum: [sharing, announced, at_meeting_point] }
 *         customerName: { type: string }
 *         plate: { type: string }
 *         passengers: { type: integer }
 *         returnFlight: { type: string, nullable: true }
 *         scheduledAt: { type: string, format: date-time }
 *         startedAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         distanceM: { type: integer, nullable: true }
 *         etaMinutes: { type: integer, nullable: true }
 *         etaAt: { type: string, format: date-time, nullable: true }
 *         announcedMinutes: { type: integer, nullable: true }
 *         atMeetingPointAt: { type: string, format: date-time, nullable: true }
 *         position: { type: object, nullable: true, properties: { lat: { type: number }, lng: { type: number }, accuracyM: { type: number, nullable: true } } }
 *         positionUpdatedAt: { type: string, format: date-time, nullable: true }
 *         positionAgeSeconds: { type: integer, nullable: true }
 *         meetingPoint: { $ref: '#/components/schemas/MeetingPoint' }
 *   parameters:
 *     BookingReference: { in: path, name: reference, required: true, schema: { type: string } }
 *     BookingToken: { in: header, name: x-booking-token, required: true, schema: { type: string } }
 */
/**
 * @swagger
 * /public/bookings/{reference}/arrival:
 *   get:
 *     summary: The arrival block of a booking (moment, meeting point, current signal)
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     responses:
 *       200: { description: The state, content: { application/json: { schema: { $ref: '#/components/schemas/TravellerArrival' } } } }
 *       404: { description: Unknown reference, wrong or revoked token (not_found) }
 * /public/bookings/{reference}/arrival/start:
 *   post:
 *     summary: Start sharing the live position (consent required)
 *     description: 400 "validation_failed" (fields.consent = consent_required) without consent=true. Idempotent while sharing.
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kind, consent]
 *             properties:
 *               kind: { type: string, enum: [outbound, return] }
 *               consent: { type: boolean, enum: [true] }
 *     responses:
 *       200: { description: The state, content: { application/json: { schema: { $ref: '#/components/schemas/TravellerArrival' } } } }
 *       409: { description: arrival_window_closed }
 * /public/bookings/{reference}/arrival/position:
 *   post:
 *     summary: The latest position while sharing (one per 10 s at most)
 *     description: >
 *       Replaces the previous position (never a history) and recomputes the estimate (straight line,
 *       40 km/h, at least 1 min). Within 150 m of the meeting point the sharing stops by itself and the
 *       position is erased (state at_meeting_point). 429 "too_many_positions" (details.retryAfterSeconds)
 *       within 10 s of the previous one; 409 "not_sharing" when no sharing is live (stopped, expired);
 *       400 "position_too_old" (recorded more than 5 min ago) or "invalid_recorded_at" (in the future).
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng, recordedAt]
 *             properties:
 *               lat: { type: number, example: 45.7256 }
 *               lng: { type: number, example: 5.0811 }
 *               accuracy: { type: number, description: Radius in metres, example: 12 }
 *               recordedAt: { type: string, format: date-time }
 * /public/bookings/{reference}/arrival/announce:
 *   post:
 *     summary: "\"J'arrive dans 10 / 20 / 30 min\", without sharing the position"
 *     description: Stops a sharing in progress (its position is erased). Notifies the staff.
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kind, minutes]
 *             properties:
 *               kind: { type: string, enum: [outbound, return] }
 *               minutes: { type: integer, enum: [10, 20, 30] }
 * /public/bookings/{reference}/arrival/at-meeting-point:
 *   post:
 *     summary: "\"Je suis au point de rendez-vous\""
 *     description: >
 *       The optional position only gives the staff the distance to the meeting point; it is not
 *       stored. On the return, the booking goes to "return_requested" (waiting for the shuttle).
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kind]
 *             properties:
 *               kind: { type: string, enum: [outbound, return] }
 *               lat: { type: number }
 *               lng: { type: number }
 * /public/bookings/{reference}/arrival/stop:
 *   post:
 *     summary: Stop sharing (or cancel an announce); the position is erased at once
 *     tags: [Arrivals]
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/BookingReference' }, { $ref: '#/components/parameters/BookingToken' }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kind: { type: string, enum: [outbound, return], description: "Default: every moment" }
 * /internal/arrivals/live:
 *   get:
 *     summary: The operator's live arrival signals (sharing, announced, at the meeting point)
 *     description: >
 *       Polled by the pro space and the staff app (every 10-15 s: no websockets on Vercel). Only the
 *       signed-in staff's operator. Also attached to each row of GET /internal/planning (arrivalSignal).
 *     tags: [Arrivals]
 *     responses:
 *       200:
 *         description: "{ serverTime, signals }"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime: { type: string, format: date-time }
 *                 signals: { type: array, items: { $ref: '#/components/schemas/StaffArrivalSignal' } }
 * /internal/parking/return-meeting-point:
 *   get:
 *     summary: "Where the shuttle meets travellers at the airport (null: the airport is used)"
 *     tags: [Arrivals]
 *   put:
 *     summary: Set (or clear with lat null) the return meeting point (manager)
 *     tags: [Arrivals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number, nullable: true }
 *               lng: { type: number, nullable: true }
 *               label: { type: string, nullable: true, example: "Terminal 1 · arrêt navettes" }
 * /internal/notifications/devices:
 *   put:
 *     summary: Register this phone for pushes (OneSignal subscription id)
 *     description: A subscription id belongs to one person; registering it again moves it to the caller.
 *     tags: [Staff notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscriptionId]
 *             properties:
 *               subscriptionId: { type: string }
 *               platform: { type: string, enum: [ios, android, web] }
 * /internal/notifications/devices/{subscriptionId}:
 *   delete:
 *     summary: Forget this phone (logout)
 *     tags: [Staff notifications]
 *     parameters: [{ in: path, name: subscriptionId, required: true, schema: { type: string } }]
 * /internal/notifications/preferences:
 *   get:
 *     summary: What the signed-in person is notified of
 *     tags: [Staff notifications]
 *     responses:
 *       200: { description: "{ arrivals, returns, devices }" }
 *   patch:
 *     summary: Choose arrivals (drop-offs), returns, or both
 *     tags: [Staff notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               arrivals: { type: boolean }
 *               returns: { type: boolean }
 */
export class ArrivalRoute implements Routes {
  public router = Router();
  public arrivals = new ArrivalController();

  // Also rate limited per traveller in app.ts (publicLimiter on /public); positions are limited
  // per booking in the service (one per 10 s), whatever the address.
  constructor() {
    const base = '/public/bookings/:reference/arrival';
    this.router.get(base, this.arrivals.state);
    this.router.post(`${base}/start`, ValidationMiddleware(StartArrivalDto), this.arrivals.start);
    this.router.post(`${base}/position`, ValidationMiddleware(ArrivalPositionDto), this.arrivals.position);
    this.router.post(`${base}/announce`, ValidationMiddleware(AnnounceArrivalDto), this.arrivals.announce);
    this.router.post(`${base}/at-meeting-point`, ValidationMiddleware(AtMeetingPointDto), this.arrivals.atMeetingPoint);
    this.router.post(`${base}/stop`, ValidationMiddleware(StopArrivalDto), this.arrivals.stop);

    this.router.get('/internal/arrivals/live', StaffAuthMiddleware('reservations:view'), this.arrivals.live);
    this.router.get('/internal/parking/return-meeting-point', StaffAuthMiddleware('reservations:view'), this.arrivals.getReturnMeetingPoint);
    this.router.put(
      '/internal/parking/return-meeting-point',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(ReturnMeetingPointDto),
      this.arrivals.setReturnMeetingPoint,
    );

    this.router.put(
      '/internal/notifications/devices',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(RegisterDeviceDto),
      this.arrivals.registerDevice,
    );
    this.router.delete('/internal/notifications/devices/:subscriptionId', StaffAuthMiddleware(), RefuseInViewAs(), this.arrivals.unregisterDevice);
    this.router.get('/internal/notifications/preferences', StaffAuthMiddleware(), this.arrivals.preferences);
    this.router.patch(
      '/internal/notifications/preferences',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(NotificationPreferencesDto),
      this.arrivals.updatePreferences,
    );
  }
}
