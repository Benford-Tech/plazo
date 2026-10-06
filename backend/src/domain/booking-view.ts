import { Airport, Listing, Parking, Reservation } from '@/database';
import { PublicBooking } from '@/interfaces/booking.interface';
import { cancellableUntil, canCancel, canEditFlight } from './booking';
import { billableDays } from './pricing';
import { carView } from './car-location';
import { dropoffTimes } from './shuttle-waves';
import { localDateTime } from './time';

/** A booking made on the site, with its parking's public page. */
export type BookingRecord = Reservation & { parking: Parking & { listing: (Listing & { airport: Airport }) | null } };

export const WITH_LISTING = { parking: { include: { listing: { include: { airport: true } } } } } as const;

/** The terms accepted when booking (the listing's current ones for older rows). */
export function bookingPolicy(reservation: BookingRecord) {
  return reservation.cancellationPolicy ?? reservation.parking.listing?.cancellationPolicy ?? 'non_refundable';
}

/** A booking as its traveller sees it (only with its manage token). */
/** The outbound flight block of the public booking: null without a flight number. */
function outboundView(reservation: Reservation, parking: Parking, tz: string): PublicBooking['outbound'] {
  if (!reservation.departureFlight) return null;
  const { leaveAt, noFlight } = dropoffTimes(reservation, parking);
  return {
    status: reservation.departureStatus,
    scheduledAt: reservation.departureScheduledAt ? localDateTime(reservation.departureScheduledAt, tz) : null,
    estimatedAt: reservation.departureEstimatedAt ? localDateTime(reservation.departureEstimatedAt, tz) : null,
    terminal: reservation.departureTerminal,
    shuttleAt: noFlight ? null : localDateTime(leaveAt, tz),
  };
}

export function toPublicBooking(reservation: BookingRecord, now = new Date()): PublicBooking {
  const { parking } = reservation;
  const listing = parking.listing!;
  const tz = parking.timezone;
  const policy = bookingPolicy(reservation);
  const until = cancellableUntil(reservation.arrivalAt, policy);
  const pending = reservation.status === 'pending_payment' && reservation.holdExpiresAt !== null;
  return {
    reference: reservation.reference,
    status: reservation.status,
    paymentMode: reservation.paymentStatus ? 'online' : 'on_site',
    payment: reservation.paymentStatus
      ? {
          status: reservation.paymentStatus,
          holdExpiresAt: pending ? reservation.holdExpiresAt!.toISOString() : null,
          holdSecondsLeft: pending ? Math.max(0, Math.floor((reservation.holdExpiresAt!.getTime() - now.getTime()) / 1000)) : null,
        }
      : null,
    parking: {
      title: listing.title,
      slug: listing.slug,
      airport: { slug: listing.airport.slug, name: listing.airport.name },
      address: parking.address,
      shuttleMinutes: listing.shuttleMinutes ?? parking.shuttleTravelMinutes,
      openingHours: listing.openingHours,
      phone: listing.contactPhone,
    },
    arrivalAt: localDateTime(reservation.arrivalAt, tz),
    returnAt: localDateTime(reservation.returnAt, tz),
    days: billableDays(reservation.arrivalAt, reservation.returnAt, tz),
    priceCents: reservation.priceCents,
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    customerPhone: reservation.customerPhone,
    plate: reservation.plate,
    returnFlight: reservation.returnFlight,
    departureFlight: reservation.departureFlight,
    outbound: outboundView(reservation, parking, tz),
    car: carView(reservation),
    passengers: reservation.passengers,
    cancellationPolicy: policy,
    cancellableUntil: until ? localDateTime(until, tz) : null,
    canCancel: canCancel(reservation.status, until, now),
    canEditFlight: reservation.status !== 'pending_payment' && canEditFlight(reservation.status, reservation.returnAt, now),
  };
}
