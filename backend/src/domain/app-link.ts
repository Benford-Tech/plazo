import { createHash, createHmac, timingSafeEqual } from 'crypto';

/**
 * « Lien court Plazo » (direction B, 27/10/2026): the SMS and emails carry https://www.plazo.fr/a/<code> instead of the
 * long manage link. The code is the reference plus a short HMAC of the booking (no table, revoked with the manage
 * token's version): https://www.plazo.fr/a/R7KQ2M-K4x9PqZa. The site resolves it (installed app → opens, else store), and
 * the app opens the booking it names.
 */
export const APP_LINK_CHECK_LENGTH = 8;
export const APP_LINK_CODE_RE = /^([A-Za-z0-9]{4,12})-([A-Za-z0-9_-]{8})$/;

/** How long a phone that left for the store is remembered (fingerprint), to open its booking at the first launch. */
export const APP_LINK_CLAIM_HOURS = 24;

export type AppPlatform = 'ios' | 'android';

function check(reservationId: string, secretKey: string, version: number): string {
  const message = version ? `app-link:${reservationId}:v${version}` : `app-link:${reservationId}`;
  return createHmac('sha256', secretKey).update(message).digest('base64url').slice(0, APP_LINK_CHECK_LENGTH);
}

export function appLinkCode(booking: { id: string; reference: string; manageTokenVersion: number }, secretKey: string): string {
  return `${booking.reference.toUpperCase()}-${check(booking.id, secretKey, booking.manageTokenVersion)}`;
}

/** The reference a code names (null when the code is malformed), before it is checked against the booking. */
export function appLinkReference(code: string): string | null {
  const match = APP_LINK_CODE_RE.exec(code.trim());
  return match ? match[1].toUpperCase() : null;
}

export function isValidAppLinkCode(booking: { id: string; reference: string; manageTokenVersion: number }, code: string, secretKey: string): boolean {
  const match = APP_LINK_CODE_RE.exec(code.trim());
  if (!match || match[1].toUpperCase() !== booking.reference.toUpperCase()) return false;
  const expected = Buffer.from(check(booking.id, secretKey, booking.manageTokenVersion));
  const received = Buffer.from(match[2]);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * The phone that left the rebound page for the store, as the API can recognise it at the app's first launch: its
 * address and its platform, hashed (nothing readable is stored). Two phones behind the same address and platform
 * (a shared Wi-Fi) can be confused: the app shows the booking's name and asks to confirm.
 */
export function deviceFingerprint(ip: string, platform: AppPlatform): string {
  return createHash('sha256').update(`${ip}|${platform}`).digest('hex');
}

/** The platform of a browser, read from its user agent; null for a desktop or an unknown device. */
export function platformOf(userAgent: string | null | undefined): AppPlatform | null {
  const ua = userAgent ?? '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return null;
}
