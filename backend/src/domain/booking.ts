import { createHmac, timingSafeEqual } from 'crypto';
import { CancellationPolicy, ReservationStatus } from '@/database';

/**
 * Rules of the bookings travellers make on the site (channel "plazo") and manage themselves with
 * the link they receive: no account, a per-booking secret instead.
 */

export const MANAGE_TOKEN_LENGTH = 32;

/**
 * Secret giving access to one booking: HMAC-SHA256 of its id, base64url, 32 characters. The
 * version (0 for every new booking) goes into the HMAC once staff revoke a link: increasing it
 * invalidates the old link and every copy of it.
 */
export function manageToken(reservationId: string, secretKey: string, version = 0): string {
  const message = version ? `manage-booking:${reservationId}:v${version}` : `manage-booking:${reservationId}`;
  return createHmac('sha256', secretKey).update(message).digest('base64url').slice(0, MANAGE_TOKEN_LENGTH);
}

export function isValidManageToken(reservationId: string, token: string | undefined, secretKey: string, version = 0): boolean {
  if (!token) return false;
  const expected = Buffer.from(manageToken(reservationId, secretKey, version));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** The manage link stops working this many days after the return (data minimisation). */
export const MANAGE_LINK_DAYS_AFTER_RETURN = 30;

export function manageLinkExpired(returnAt: Date, now: Date = new Date()): boolean {
  return now.getTime() > returnAt.getTime() + MANAGE_LINK_DAYS_AFTER_RETURN * 86400000;
}

const FREE_CANCELLATION_HOURS: Record<CancellationPolicy, number | null> = {
  free_until_arrival: 0,
  free_24h: 24,
  free_48h: 48,
  non_refundable: null,
};

/** Last moment the traveller can cancel online; null when the policy allows no online cancellation. */
export function cancellableUntil(arrivalAt: Date, policy: CancellationPolicy): Date | null {
  const hours = FREE_CANCELLATION_HOURS[policy];
  return hours === null ? null : new Date(arrivalAt.getTime() - hours * 3600000);
}

export function canCancel(status: ReservationStatus, until: Date | null, now: Date = new Date()): boolean {
  return status === 'upcoming' && until !== null && now < until;
}

/** Statuses after which the return flight no longer matters. */
const FLIGHT_LOCKED_STATUSES: ReservationStatus[] = ['cancelled', 'returned', 'no_show'];

export function canEditFlight(status: ReservationStatus, returnAt: Date, now: Date = new Date()): boolean {
  return !FLIGHT_LOCKED_STATUSES.includes(status) && now < returnAt;
}
