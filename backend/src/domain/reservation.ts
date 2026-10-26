import { randomInt } from 'crypto';
import { ReservationChannel, ReservationStatus } from '@/database';

/** What a plate may be when typed (the staff's forms, the site): letters, digits, spaces and dashes. */
export const PLATE_RE = /^[A-Za-z0-9 -]{2,15}$/;

/**
 * 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): the channels whose bookings may come without
 * a plate (comparators often leave it out; it is read on arrival), stored as '' (never null: the apps in the stores read
 * a string).
 */
export const PLATE_OPTIONAL_CHANNELS: readonly ReservationChannel[] = ['aggregator', 'import'];

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

/** The fields a status change sets besides the status (undefined: left as it is). */
export interface StatusSideEffects {
  arrivedAt: Date | null | undefined;
  boardingTripId: null | undefined;
  returnedAt: Date | null | undefined;
  cancelledAt: Date | null | undefined;
  keyHook: null | undefined;
  keysLeftAt: null | undefined;
  fileId: null | undefined;
  fileRank: null | undefined;
}

/**
 * What a status change does to the booking's other fields (ReservationService.applyStatus, and the test operator's
 * fictional travellers, TestFeedService): checked in once (arrivedAt kept), back to "Attendu" no longer checked in nor
 * pointed at a boarding (« Embarquer en un geste »), handed back with the keys off their hook, and a car leaving its
 * file (S-C) when the booking closes.
 */
export function statusSideEffects(
  before: { status: ReservationStatus; arrivedAt: Date | null },
  status: ReservationStatus,
  now: Date,
): StatusSideEffects {
  const closes = (['returned', 'cancelled', 'no_show'] as ReservationStatus[]).includes(status);
  return {
    arrivedAt: status === 'arrived' && !before.arrivedAt ? now : status === 'upcoming' ? null : undefined,
    boardingTripId: status === 'upcoming' ? null : undefined,
    returnedAt: status === 'returned' ? now : before.status === 'returned' ? null : undefined,
    cancelledAt: status === 'cancelled' ? now : before.status === 'cancelled' ? null : undefined,
    keyHook: status === 'returned' ? null : undefined,
    keysLeftAt: status === 'returned' ? null : undefined,
    fileId: closes ? null : undefined,
    fileRank: closes ? null : undefined,
  };
}

/** Letters and digits only, upper-case: "ab 123 cd" -> "AB123CD". */
export function plateKey(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * 10/10/2026: the amount of a booking paid online on Plazo is what the traveller paid; the staff never change it (the
 * booking form, « Modifier le prix », the revenue page's « Les compléter »).
 */
export function isPriceLocked(booking: { channel: string; paymentStatus: string | null; chargedCents: number | null }): boolean {
  return booking.channel === 'plazo' || booking.paymentStatus !== null || booking.chargedCents !== null;
}

/** French SIV plates get their dashes (AB-123-CD); anything else (foreign plates) stays as typed, upper-cased. */
export function formatPlate(plate: string): string {
  const key = plateKey(plate);
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(key)) return `${key.slice(0, 2)}-${key.slice(2, 5)}-${key.slice(5)}`;
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

/** 15/10/2026: « · AB-123-CD » in a staff push, nothing for a booking imported without its plate (read on arrival). */
export function plateSegment(plate: string): string {
  return plate.trim() ? ` · ${plate}` : '';
}

/**
 * 15/10/2026: a plate read in a comparator's email, its booking page or by Claude, formatted; undefined when it is none
 * (blank, a label such as « Entrée », a placeholder such as « Inconnue » or « XX-XXX-XX »: a plate has a digit). A French
 * plate within a longer text (« AB-123-CD (Peugeot 208) ») is taken alone.
 */
export function importedPlate(raw: string | null | undefined): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const upper = raw.toUpperCase();
  const siv = /(?<![A-Z0-9])([A-Z]{2})[- .]?(\d{3})[- .]?([A-Z]{2})(?![A-Z0-9])/.exec(upper);
  if (siv) return `${siv[1]}-${siv[2]}-${siv[3]}`;
  const text = upper
    .replace(/[^A-Z0-9 -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/\d/.test(text) || !PLATE_RE.test(text) || plateKey(text).length < 2) return undefined;
  return formatPlate(text);
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
