import { ReservationStatus } from '@/database';

/** Statuses that no longer hold a spot. */
export const RELEASED_STATUSES: ReservationStatus[] = ['cancelled', 'no_show'];

/** Allowed status changes, following the customer's journey. */
export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  upcoming: ['arrived', 'cancelled', 'no_show'],
  arrived: ['shuttled_out', 'return_requested', 'returned', 'upcoming'],
  shuttled_out: ['return_requested', 'returned', 'arrived'],
  return_requested: ['returned', 'shuttled_out'],
  returned: ['return_requested'],
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
export function newReference(random: () => number = Math.random): string {
  let code = 'R';
  for (let i = 0; i < 5; i++) code += REFERENCE_ALPHABET[Math.floor(random() * REFERENCE_ALPHABET.length)];
  return code;
}
