import { randomInt } from 'crypto';
import { ReservationStatus } from '@/database';

/** Statuses that no longer hold a spot. */
export const RELEASED_STATUSES: ReservationStatus[] = ['cancelled', 'no_show'];
/** The vehicle is on the parking: from the check-in to the handover (06/10/2026: `back_at_parking` included). */
export const ON_SITE_STATUSES: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested', 'back_at_parking'];
/** Statuses that hold (or will hold) a spot: booked and on site. */
export const HOLDING_STATUSES: ReservationStatus[] = ['upcoming', ...ON_SITE_STATUSES];
/** The traveller is away or on their way back: the return shuttle still applies. */
export const AWAY_STATUSES: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested'];

/** Allowed status changes, following the customer's journey. */
// A booking waiting for its online payment is not the staff's to move: only the payment (or its
// expiry) changes it.
export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending_payment: [],
  upcoming: ['arrived', 'cancelled', 'no_show'],
  arrived: ['shuttled_out', 'return_requested', 'back_at_parking', 'returned', 'upcoming'],
  shuttled_out: ['return_requested', 'back_at_parking', 'returned', 'arrived'],
  return_requested: ['back_at_parking', 'returned', 'shuttled_out'],
  back_at_parking: ['returned', 'return_requested'],
  returned: ['back_at_parking'],
  cancelled: ['upcoming'],
  no_show: ['upcoming'],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

/** Letters and digits only, upper-case: "ab 123 cd" -> "AB123CD". */
export function plateKey(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** French SIV plates get their dashes (AB-123-CD); anything else (foreign plates) stays as typed, upper-cased. */
/**
 * 10/10/2026: the amount of a booking paid online on Plazo is what the traveller paid; the staff never change it (the
 * booking form, « Modifier le prix », the revenue page's « Les compléter »).
 */
export function isPriceLocked(booking: { channel: string; paymentStatus: string | null; chargedCents: number | null }): boolean {
  return booking.channel === 'plazo' || booking.paymentStatus !== null || booking.chargedCents !== null;
}

export function formatPlate(plate: string): string {
  const key = plateKey(plate);
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(key)) return `${key.slice(0, 2)}-${key.slice(2, 5)}-${key.slice(5)}`;
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

/** "to3627" -> "TO 3627"; returns null when it does not look like a flight number. */
export function formatFlight(flight: string): string | null {
  const compact = flight.toUpperCase().replace(/\s+/g, '');
  const m = /^([A-Z0-9]{2}[A-Z]?)(\d{1,4}[A-Z]?)$/.exec(compact);
  if (!m) return null;
  // IATA codes may contain a digit (U2); the optional third letter covers ICAO codes (EZY).
  return `${m[1]} ${m[2]}`;
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short customer-facing code, e.g. R7KQ2M (no 0/O/1/I to avoid misreading). */
export function newReference(random?: () => number): string {
  // A reference (with the email) unlocks a booking: draw it from the cryptographic generator.
  const pick = random ? () => Math.floor(random() * REFERENCE_ALPHABET.length) : () => randomInt(REFERENCE_ALPHABET.length);
  let code = 'R';
  for (let i = 0; i < 5; i++) code += REFERENCE_ALPHABET[pick()];
  return code;
}
