import { Router } from 'express';
import { PublicBookingController } from '@/controllers/public-booking.controller';
import { CreatePublicBookingDto, LookupBookingDto, UpdateBookingFlightDto, CarLocationDto } from '@/dtos/public-booking.dto';
import { Routes } from '@/interfaces/routes.interface';
import { bookingLimiter, lookupLimiter, lookupReferenceLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Public bookings
 *   description: >
 *     Bookings made by travellers on the site (channel "plazo"). Paid at the parking while online
 *     payments are off (no STRIPE_SECRET_KEY); with them, a booking is created in status
 *     "pending_payment", holding its place for 30 minutes (payment.holdExpiresAt), and becomes
 *     "upcoming" once paid on Stripe Checkout (POST /checkout). No account: each booking is managed
 *     with its manageToken, sent in the x-booking-token header (never in the URL). Dates are local to
 *     the parking ("2026-10-04T06:30").
 * components:
 *   schemas:
 *     PublicBooking:
 *       type: object
 *       properties:
 *         reference: { type: string, example: R7KQ2M }
 *         status: { type: string, enum: [pending_payment, upcoming, arrived, shuttled_out, return_requested, returned, cancelled, no_show] }
 *         paymentMode: { type: string, enum: [on_site, online] }
 *         payment:
 *           type: object
 *           nullable: true
 *           description: Null when paid at the parking.
 *           properties:
 *             status: { type: string, enum: [pending, paid, expired, refunded] }
 *             holdExpiresAt: { type: string, nullable: true, example: "2026-10-02T12:30:00.000Z" }
 *             holdSecondsLeft: { type: integer, nullable: true, example: 1745 }
 *         parking:
 *           type: object
 *           properties:
 *             title: { type: string }
 *             slug: { type: string }
 *             airport: { type: object, properties: { slug: { type: string }, name: { type: string } } }
 *             address: { type: string, nullable: true }
 *             shuttleMinutes: { type: integer, nullable: true }
 *             openingHours: { type: string, nullable: true }
 *             phone: { type: string, nullable: true, example: 04 72 00 00 00 }
 *         arrivalAt: { type: string, example: "2026-10-04T06:30" }
 *         returnAt: { type: string, example: "2026-10-11T15:05" }
 *         days: { type: integer, example: 8 }
 *         priceCents: { type: integer, example: 5500 }
 *         customerName: { type: string, description: "Display form \"Prénom Nom\", recomputed by the server" }
 *         customerFirstName: { type: string, example: Camille }
 *         customerLastName: { type: string, example: Martin }
 *         customerEmail: { type: string }
 *         customerPhone: { type: string }
 *         plate: { type: string, example: AB-123-CD }
 *         returnFlight: { type: string, nullable: true, example: TO 3627 }
 *         passengers: { type: integer }
 *         cancellationPolicy: { type: string, enum: [free_until_arrival, free_24h, free_48h, non_refundable] }
 *         cancellableUntil: { type: string, nullable: true, example: "2026-10-03T06:30" }
 *         canCancel: { type: boolean }
 *         canEditFlight: { type: boolean }
 */
/**
 * @swagger
 * /public/bookings:
 *   post:
 *     summary: Book a stay (paid at the parking, or held while paid online)
 *     description: >
 *       With online payments, the booking holds its place (status pending_payment) and no message is
 *       sent until it is paid; 409 "online_booking_unavailable" when the parking's operator cannot take
 *       online payments yet.
 *       Availability and price are recomputed under the parking lock, as for staff bookings: 409
 *       "overbooked" (details.fullNights) when a night is full, 409 "no_price" when the grid cannot
 *       price the stay, 404 "not_found" for an unknown or unpublished parking, 409 "duplicate_booking"
 *       when the vehicle already has a booking on the site for these dates, 409 "too_many_bookings"
 *       beyond 3 bookings in progress per email or phone. Sends the confirmation email and SMS (French
 *       mobiles only). Returns { reference, manageToken, booking } (201); a form sent again with the
 *       same idempotencyKey returns the booking already made (200), without new messages. At most 5
 *       bookings per hour per traveller (429 "too_many_requests").
 *     tags: [Public bookings]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [airport, parking, arrivalAt, returnAt, customerFirstName, customerLastName, customerPhone, customerEmail, plate, passengers, acceptTerms]
 *             properties:
 *               airport: { type: string, example: lyon-saint-exupery }
 *               parking: { type: string, example: parking-demo-lys }
 *               arrivalAt: { type: string, example: "2026-10-04T06:30" }
 *               returnAt: { type: string, example: "2026-10-11T15:05" }
 *               customerFirstName: { type: string, maxLength: 60, example: Camille, description: "Trimmed; letters, spaces, apostrophes, hyphens and periods (invalid_name)" }
 *               customerLastName: { type: string, maxLength: 60, example: Martin }
 *               customerName: { type: string, maxLength: 120, description: "Older app versions only: the whole name, sent without the two fields above, split at its first space" }
 *               customerPhone: { type: string, example: "06 12 34 56 78" }
 *               customerEmail: { type: string }
 *               plate: { type: string, example: GK-318-PX }
 *               returnFlight: { type: string, example: TO 3627 }
 *               passengers: { type: integer, minimum: 1, maximum: 9 }
 *               acceptTerms: { type: boolean, enum: [true] }
 *               idempotencyKey: { type: string, description: Random key of the booking form (16 to 64 letters, digits or hyphens) }
 * /public/bookings/lookup:
 *   post:
 *     summary: Find a booking by reference and email (strictly rate limited)
 *     description: >
 *       Returns { reference, manageToken }; 404 "not_found" when the reference or the email is wrong, or
 *       30 days after the return. 429 "too_many_attempts" after 10 attempts in 15 minutes per traveller,
 *       or 10 failed attempts in an hour on one reference.
 *     tags: [Public bookings]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reference, email]
 *             properties:
 *               reference: { type: string, example: R7KQ2M }
 *               email: { type: string }
 * /public/bookings/{reference}:
 *   get:
 *     summary: A booking, for its traveller
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The booking, content: { application/json: { schema: { $ref: '#/components/schemas/PublicBooking' } } } }
 *       404: { description: Unknown reference, wrong or revoked token, or more than 30 days after the return (not_found) }
 * /public/bookings/{reference}/flight:
 *   patch:
 *     summary: Set or clear the return flight
 *     description: 409 "flight_locked" once the booking is cancelled, returned or a no-show, or after its return time.
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [returnFlight]
 *             properties:
 *               returnFlight: { type: string, nullable: true, example: TO 3627, description: Empty or null clears it }
 * /public/bookings/{reference}/checkout:
 *   post:
 *     summary: Stripe Checkout page of a booking holding its place
 *     description: >
 *       Returns { url } (the open payment page again, or a new one; the hold then lasts as long as the
 *       page) or { paid: true } when the payment already went through. 409 "hold_expired" once the hold
 *       ended, 409 "online_booking_unavailable" if the operator can no longer take payments.
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 * /public/bookings/{reference}/payment-intent:
 *   post:
 *     summary: PaymentIntent of a booking holding its place (the app's native payment sheet)
 *     description: >
 *       Returns { clientSecret, paymentIntentId, amountCents, currency, holdExpiresAt } (the intent
 *       already started again, or a new one: same amount and commission split as Checkout, metadata
 *       reservationId, idempotency keys; an open Checkout page of the booking is closed first) or
 *       { paid: true } when the payment already went through. The hold is not extended. 409
 *       "hold_expired" once the hold ended, 409 "online_booking_unavailable" when payments are off or
 *       the operator can no longer take them. Confirmed by the payment_intent.succeeded webhook, or
 *       when the app reads the booking again (GET asks Stripe).
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 * /public/bookings/{reference}/release:
 *   post:
 *     summary: Release the hold (the traveller goes back to edit the form)
 *     description: The payment page is closed first. 409 "already_paid" when the payment went through meanwhile.
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 * /public/bookings/{reference}/cancel:
 *   post:
 *     summary: Cancel online
 *     description: >
 *       Only while the booking is upcoming and before cancellableUntil (free_until_arrival: arrival;
 *       free_24h / free_48h: 24 / 48 h before; non_refundable: never). Else 409 "cancellation_closed".
 *       A booking paid online is refunded in full first (502 "refund_failed" if Stripe refuses: nothing
 *       changes). Sends a cancellation email.
 *     tags: [Public bookings]
 *     security: []
 *     parameters:
 *       - { in: path, name: reference, required: true, schema: { type: string } }
 *       - { in: header, name: x-booking-token, required: true, schema: { type: string } }
 */
export class PublicBookingRoute implements Routes {
  public router = Router();
  public bookings = new PublicBookingController();

  // Also rate limited per traveller in app.ts (publicLimiter on /public). Bookings: a few per hour
  // per traveller; lookups: per traveller and per reference.
  constructor() {
    this.router.post('/public/bookings', bookingLimiter, ValidationMiddleware(CreatePublicBookingDto), this.bookings.create);
    this.router.post('/public/bookings/lookup', lookupLimiter, lookupReferenceLimiter, ValidationMiddleware(LookupBookingDto), this.bookings.lookup);
    this.router.get('/public/bookings/:reference', this.bookings.get);
    this.router.patch('/public/bookings/:reference/flight', ValidationMiddleware(UpdateBookingFlightDto), this.bookings.updateFlight);
    // Where the car is parked (06/10/2026), recorded by the traveller who parked it themselves.
    this.router.put('/public/bookings/:reference/car-location', ValidationMiddleware(CarLocationDto), this.bookings.locateCar);
    this.router.delete('/public/bookings/:reference/car-location', this.bookings.clearCarLocation);
    this.router.post('/public/bookings/:reference/checkout', this.bookings.checkout);
    this.router.post('/public/bookings/:reference/payment-intent', this.bookings.paymentIntent);
    this.router.post('/public/bookings/:reference/release', this.bookings.release);
    this.router.post('/public/bookings/:reference/cancel', this.bookings.cancel);
  }
}
