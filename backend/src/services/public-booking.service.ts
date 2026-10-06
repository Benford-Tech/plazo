import httpStatus from 'http-status';
import { CAR_LOCATABLE_STATUSES, canLocateCar, canReplaceCarLocation, CLEARED_CAR_LOCATION } from '@/domain/car-location';
import { Container, Service } from 'typedi';
import { SECRET_KEY } from '@/config';
import prisma, { Prisma, ReservationStatus } from '@/database';
import { cancellableUntil, canCancel, canEditFlight, isValidManageToken, manageLinkExpired, manageToken } from '@/domain/booking';
import { BookingRecord, bookingPolicy, toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { formatPlate, plateKey, RELEASED_STATUSES } from '@/domain/reservation';
import { CreatePublicBookingDto, LookupBookingDto, CarLocationDto } from '@/dtos/public-booking.dto';
import { PublicBooking } from '@/interfaces/booking.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { CapacityService } from './capacity.service';
import { NotificationService } from './notification.service';
import { HOLD_MINUTES, PaymentService } from './payment.service';
import { PublicService } from './public.service';
import { ReservationService } from './reservation.service';

// Same answer whether the reference, the email or the token is wrong.
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Booking not found', 'not_found');

type Client = Prisma.TransactionClient | typeof prisma;

const FLIGHT_LOCKED: ReservationStatus[] = ['cancelled', 'returned', 'no_show'];

// Bookings on the site are free to make (paid on site): limits per traveller, so that a script
// cannot fill a parking or send messages to strangers with fake bookings.
export const MAX_ACTIVE_SITE_BOOKINGS_PER_CONTACT = 3;
const IDEMPOTENCY_WINDOW_MS = 24 * 3600000;
// A place held for an online payment counts too (lapsed holds are swept before the check).
const ACTIVE_STATUSES: ReservationStatus[] = ['pending_payment', 'upcoming', 'arrived', 'shuttled_out', 'return_requested'];

/** Last 9 digits of a phone number: the same for "06 12 34 56 78", "+33612345678" and "0033 6…". */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, '').slice(-9);
}

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Bookings made by travellers on the site (channel "plazo"), and managed without an account
 * through a per-booking token. Capacity, locking and pricing are those of staff bookings. Paid at
 * the parking while online payments are off; with them, a booking first holds its place
 * (pending_payment) until it is paid (see PaymentService).
 */
@Service()
export class PublicBookingService {
  public audit = Container.get(AuditService);
  public capacity = Container.get(CapacityService);
  public notifications = Container.get(NotificationService);
  public payments = Container.get(PaymentService);
  public publicService = Container.get(PublicService);
  public reservations = Container.get(ReservationService);

  private get secret(): string {
    if (!SECRET_KEY) throw new Error('SECRET_KEY is not set');
    return SECRET_KEY;
  }

  /** Books a stay: price and availability recomputed under the parking lock, never overbooked. */
  public async create(data: CreatePublicBookingDto) {
    const key = data.idempotencyKey || null;
    if (key) {
      const replayed = await this.replay(key);
      if (replayed) return replayed;
    }

    const airport = await this.publicService.airportBySlug(data.airport);
    const { parking } = await this.publicService.findPublished(airport, data.parking);
    const stay = this.publicService.parseStay(parking, data.arrivalAt, data.returnAt)!;
    const returnFlight = this.reservations.normalizeFlight(data.returnFlight);
    const departureFlight = this.reservations.normalizeFlight(data.departureFlight, 'departureFlight');
    const email = data.customerEmail.trim().toLowerCase();
    const plate = plateKey(data.plate);
    // Every Plazo booking is paid online (06/10/2026): without Stripe on the platform, no booking.
    if (!this.payments.enabled()) throw new HttpException(httpStatus.CONFLICT, 'Online booking is not available yet', 'online_booking_unavailable');
    // Lapsed holds first: their places and their vehicles are free again.
    await this.payments.expireLapsedHolds();

    let reservation: BookingRecord | null;
    try {
      reservation = await prisma.$transaction(async tx => {
        await this.capacity.lock(tx, parking.id);
        // The same form sent twice at once: the second waits for the lock, then finds the first.
        if (key && (await tx.reservation.findUnique({ where: { idempotencyKey: key }, select: { id: true } }))) return null;
        await this.checkTravellerLimits(tx, { email, phone: data.customerPhone, plate, ...stay });
        // Read again under the lock: the listing may just have been unpublished or repriced.
        const listing = await this.publicService.findPublished(airport, data.parking, tx);
        const quote = await this.publicService.quote(listing, stay, tx);
        if (quote.priceCents === null) throw new HttpException(httpStatus.CONFLICT, 'This stay has no price', 'no_price');
        if (quote.fullNights.length) {
          throw new HttpException(httpStatus.CONFLICT, 'At least one night is full', 'overbooked', { fullNights: quote.fullNights });
        }
        // Only parkings whose operator takes online payments can be booked.
        const operator = await tx.operator.findUniqueOrThrow({ where: { id: listing.parking.operatorId } });
        if (this.payments.modeFor(operator) !== 'online') {
          throw new HttpException(httpStatus.CONFLICT, 'This parking cannot be booked online yet', 'online_booking_unavailable');
        }
        const payment = {
          status: 'pending_payment' as const,
          paymentStatus: 'pending' as const,
          holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60000),
          // Amount, Plazo's commission and the operator's share, from the price computed here
          // (never the client's).
          ...this.payments.split(operator, quote.priceCents),
        };

        const created = await tx.reservation.create({
          data: {
            reference: await this.reservations.newUniqueReference(tx),
            operatorId: listing.parking.operatorId,
            parkingId: listing.parkingId,
            channel: 'plazo',
            ...stay,
            passengers: data.passengers,
            customerName: data.customerName.trim().replace(/\s+/g, ' '),
            customerPhone: data.customerPhone.trim(),
            customerEmail: email,
            plate: formatPlate(data.plate),
            plateKey: plate,
            returnFlight,
            departureFlight,
            priceCents: quote.priceCents,
            cancellationPolicy: listing.cancellationPolicy,
            idempotencyKey: key,
            createdById: null,
            ...payment,
          },
          include: WITH_LISTING,
        });
        await this.audit.record(
          { id: null, operatorId: created.operatorId },
          {
            action: 'reservation.created',
            entityType: 'reservation',
            entityId: created.id,
            details: {
              channel: 'plazo',
              ...(operator ? { payment: 'online', commissionCents: created.commissionCents, operatorShareCents: created.operatorShareCents } : {}),
            },
          },
          tx,
        );
        return created;
      });
    } catch (error) {
      // Same key used for two parkings at once: the unique index keeps one booking.
      if (key && isUniqueViolation(error)) {
        const replayed = await this.replay(key);
        if (replayed) return replayed;
      }
      throw error;
    }
    if (!reservation) return (await this.replay(key!))!;

    const token = manageToken(reservation.id, this.secret, reservation.manageTokenVersion);
    // Paid at the parking: confirmed now. Paid online: confirmed once the payment goes through.
    if (reservation.status !== 'pending_payment') await this.payments.sendConfirmationOnce(reservation.id);
    return { reference: reservation.reference, manageToken: token, booking: toPublicBooking(reservation), replayed: false };
  }

  /** The booking already made with this form, if any (no new notification). */
  private async replay(key: string) {
    const existing = await prisma.reservation.findUnique({ where: { idempotencyKey: key }, include: WITH_LISTING });
    if (!existing || existing.channel !== 'plazo' || !existing.parking.listing) return null;
    // A key only replays the submission it came with, shortly after: never a way back in later.
    if (Date.now() - existing.createdAt.getTime() > IDEMPOTENCY_WINDOW_MS) {
      throw new HttpException(httpStatus.CONFLICT, 'This booking form was already sent', 'duplicate_booking');
    }
    return {
      reference: existing.reference,
      manageToken: manageToken(existing.id, this.secret, existing.manageTokenVersion),
      booking: toPublicBooking(existing),
      replayed: true,
    };
  }

  /**
   * A vehicle cannot hold two places for the same nights, and one traveller (email or phone) has at
   * most a few bookings in progress on the site: 409 "duplicate_booking" / "too_many_bookings".
   */
  private async checkTravellerLimits(
    tx: Prisma.TransactionClient,
    traveller: { email: string; phone: string; plate: string; arrivalAt: Date; returnAt: Date },
  ) {
    const now = new Date();
    const active = { channel: 'plazo' as const, status: { in: ACTIVE_STATUSES }, returnAt: { gt: now } };
    const sameVehicle = await tx.reservation.count({
      where: {
        channel: 'plazo',
        status: { notIn: RELEASED_STATUSES },
        plateKey: traveller.plate,
        arrivalAt: { lt: traveller.returnAt },
        returnAt: { gt: traveller.arrivalAt },
      },
    });
    if (sameVehicle) throw new HttpException(httpStatus.CONFLICT, 'This vehicle already has a booking for these dates', 'duplicate_booking');

    const byEmail = await tx.reservation.count({ where: { ...active, customerEmail: traveller.email } });
    const phone = phoneKey(traveller.phone);
    const [{ count: byPhone }] = await tx.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM reservations
      WHERE channel = 'plazo' AND status::text = ANY(${ACTIVE_STATUSES}::text[]) AND "returnAt" > ${now}
        AND right(regexp_replace("customerPhone", '[^0-9]', '', 'g'), 9) = ${phone}`;
    if (byEmail >= MAX_ACTIVE_SITE_BOOKINGS_PER_CONTACT || byPhone >= MAX_ACTIVE_SITE_BOOKINGS_PER_CONTACT) {
      throw new HttpException(httpStatus.CONFLICT, 'Too many bookings in progress for this traveller', 'too_many_bookings');
    }
  }

  /** The manage token of a booking, for its reference and the email given when booking. */
  public async lookup(data: LookupBookingDto) {
    const reservation = await prisma.reservation.findFirst({
      where: { reference: data.reference.trim().toUpperCase(), channel: 'plazo' },
      select: { id: true, reference: true, customerEmail: true, returnAt: true, manageTokenVersion: true },
    });
    if (!reservation?.customerEmail || reservation.customerEmail !== data.email.trim().toLowerCase()) throw notFound();
    if (manageLinkExpired(reservation.returnAt)) throw notFound();
    return { reference: reservation.reference, manageToken: manageToken(reservation.id, this.secret, reservation.manageTokenVersion) };
  }

  /**
   * A booking for its traveller. While its payment is pending, Stripe is asked whether it went
   * through (the traveller is back from the payment page before the webhook, or it was missed).
   */
  public async get(reference: string, token: string | undefined): Promise<PublicBooking> {
    const booking = await this.load(reference, token);
    if (booking.status === 'pending_payment' && (await this.payments.syncFromStripe(booking))) {
      return toPublicBooking(await this.find(booking.id, prisma));
    }
    return toPublicBooking(booking);
  }

  /** The payment page of a booking holding its place: { url } to redirect to, or { paid: true }. */
  public async checkout(reference: string, token: string | undefined) {
    const booking = await this.load(reference, token);
    if (booking.paymentStatus === null) throw notFound();
    return this.payments.checkout(booking.id);
  }

  /** The app's payment sheet for a booking holding its place: { clientSecret, … } or { paid: true }. */
  public async paymentIntent(reference: string, token: string | undefined) {
    const booking = await this.load(reference, token);
    if (booking.paymentStatus === null) throw notFound();
    return this.payments.paymentIntent(booking.id);
  }

  /** The traveller goes back to the form ("Modifier"): the place is released. */
  public async release(reference: string, token: string | undefined): Promise<PublicBooking> {
    const booking = await this.load(reference, token);
    if (booking.paymentStatus === null) throw notFound();
    await this.payments.releaseHold(booking.id);
    return toPublicBooking(await this.find(booking.id, prisma));
  }

  /** Sets or clears the return flight, until the vehicle is handed back. */
  public async updateFlight(reference: string, token: string | undefined, flight: string | null, outbound?: string | null): Promise<PublicBooking> {
    const before = await this.load(reference, token);
    const returnFlight = this.reservations.normalizeFlight(flight);
    const departureFlight = outbound === undefined ? before.departureFlight : this.reservations.normalizeFlight(outbound, 'departureFlight');
    const locked = () => new HttpException(httpStatus.CONFLICT, 'The return flight can no longer be changed', 'flight_locked');
    if (!canEditFlight(before.status, before.returnAt)) throw locked();
    if (returnFlight === before.returnFlight && departureFlight === before.departureFlight) return toPublicBooking(before);

    const after = await prisma.$transaction(async tx => {
      // Conditional update: staff may have closed the booking in the meantime.
      const { count } = await tx.reservation.updateMany({
        where: { id: before.id, status: { notIn: FLIGHT_LOCKED }, returnAt: { gt: new Date() } },
        data: {
          returnFlight,
          departureFlight,
          ...(departureFlight === before.departureFlight
            ? {}
            : { departureStatus: null, departureScheduledAt: null, departureEstimatedAt: null, departureTerminal: null, departureCheckedAt: null }),
        },
      });
      if (!count) throw locked();
      await this.audit.record(
        { id: null, operatorId: before.operatorId },
        {
          action: 'reservation.updated',
          entityType: 'reservation',
          entityId: before.id,
          details: {
            returnFlight: { from: before.returnFlight, to: returnFlight },
            ...(departureFlight === before.departureFlight ? {} : { departureFlight: { from: before.departureFlight, to: departureFlight } }),
            by: 'traveller',
          },
        },
        tx,
      );
      return this.find(before.id, tx);
    });
    return toPublicBooking(after);
  }

  /**
   * Cancels online, while the booking's cancellation terms allow it. A booking paid online is
   * refunded in full (the operator's transfer and Plazo's fee are reversed); if the refund fails,
   * the booking stays as it was (502 "refund_failed").
   */
  public async cancel(reference: string, token: string | undefined): Promise<PublicBooking> {
    const before = await this.load(reference, token);
    const closed = () => new HttpException(httpStatus.CONFLICT, 'This booking can no longer be cancelled online', 'cancellation_closed');
    if (!canCancel(before.status, cancellableUntil(before.arrivalAt, this.policy(before)))) throw closed();

    const after = await this.payments.cancelWithRefund(
      before.id,
      current => {
        if (current.status !== 'upcoming' || !canCancel(current.status, cancellableUntil(current.arrivalAt, this.policy(before)))) throw closed();
      },
      async (tx, refund) => {
        await tx.reservation.update({ where: { id: before.id }, data: { status: 'cancelled', cancelledAt: new Date(), ...refund } });
        await this.audit.record(
          { id: null, operatorId: before.operatorId },
          {
            action: 'reservation.status_changed',
            entityType: 'reservation',
            entityId: before.id,
            details: { from: 'upcoming', to: 'cancelled', by: 'traveller', ...(refund ? { refunded: true } : {}) },
          },
          tx,
        );
        return this.find(before.id, tx);
      },
    );

    const booking = toPublicBooking(after);
    await this.notifications.bookingCancelled(booking);
    return booking;
  }

  private async find(id: string, client: Client): Promise<BookingRecord> {
    return client.reservation.findUniqueOrThrow({ where: { id }, include: WITH_LISTING });
  }

  /** A booking made on the site, if the token is its own. */
  /** The traveller records where they parked (self-parking); refused once a valet recorded the position. */
  public async locateCar(reference: string, token: string | undefined, data: CarLocationDto): Promise<PublicBooking> {
    const before = await this.load(reference, token);
    if (!canLocateCar(before.status))
      throw new HttpException(httpStatus.CONFLICT, 'The car position can no longer be recorded', 'car_location_closed');
    if (!canReplaceCarLocation('traveller', before.carLocatedBy))
      throw new HttpException(httpStatus.CONFLICT, 'The parking recorded the car position', 'car_location_locked');
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({
      where: { id: before.id, status: { in: CAR_LOCATABLE_STATUSES }, OR: [{ carLocatedBy: null }, { carLocatedBy: 'traveller' }] },
      data: {
        carLat: data.lat,
        carLng: data.lng,
        carAccuracyM: data.accuracyM ?? null,
        carLocatedAt: now,
        carLocatedBy: 'traveller',
        carNote: data.note?.trim() || null,
      },
    });
    if (!count) throw new HttpException(httpStatus.CONFLICT, 'The parking recorded the car position', 'car_location_locked');
    // Coordinates stay out of the audit trail (the row holds them).
    await this.audit.record(
      { id: null, operatorId: before.operatorId },
      {
        action: 'reservation.car_located',
        entityType: 'reservation',
        entityId: before.id,
        details: { by: 'traveller', accuracyM: data.accuracyM ?? null },
      },
    );
    return toPublicBooking(await this.find(before.id, prisma));
  }

  /** The traveller clears their own position (a valet's one stays). */
  public async clearCarLocation(reference: string, token: string | undefined): Promise<PublicBooking> {
    const before = await this.load(reference, token);
    if (before.carLocatedBy === 'staff') throw new HttpException(httpStatus.CONFLICT, 'The parking recorded the car position', 'car_location_locked');
    await prisma.reservation.updateMany({ where: { id: before.id, carLocatedBy: 'traveller' }, data: CLEARED_CAR_LOCATION });
    return toPublicBooking(await this.find(before.id, prisma));
  }

  public async load(reference: string, token: string | undefined): Promise<BookingRecord> {
    if (!reference || reference.length > 20 || !token) throw notFound();
    const reservation = await prisma.reservation.findFirst({
      where: { reference: reference.toUpperCase(), channel: 'plazo' },
      include: WITH_LISTING,
    });
    if (!reservation?.parking.listing || !isValidManageToken(reservation.id, token, this.secret, reservation.manageTokenVersion)) throw notFound();
    // The link gives the traveller's personal data: it does not outlive the stay by long.
    if (manageLinkExpired(reservation.returnAt)) throw notFound();
    // Lazy expiry: a hold past its time reads as expired, and frees its place for good.
    if (reservation.status === 'pending_payment' && reservation.holdExpiresAt && reservation.holdExpiresAt <= new Date()) {
      await this.payments.expireLapsedHolds();
      return this.find(reservation.id, prisma);
    }
    return reservation;
  }

  /** The terms accepted when booking (the listing's current ones for older rows). */
  private policy(reservation: BookingRecord) {
    return bookingPolicy(reservation);
  }
}
