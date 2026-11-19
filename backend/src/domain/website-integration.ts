/**
 * Site du parking (19/11/2026, niveau 2 « l'extension WordPress Plazo »): the parking's WordPress site reads the places and
 * the price of a stay and creates its bookings in Plazo with a key of its own. The traveller pays at the parking (choix
 * « 2 oui »): the booking is the `website` channel, without commission, like the parking's own form read from its mail.
 */
import { createHash, randomBytes } from 'crypto';

export const SITE_KEY_PREFIX = 'plz_site_';
/** What the page shows of a key: its prefix and the first characters. */
export const SHOWN_KEY_LENGTH = SITE_KEY_PREFIX.length + 6;

export function newSiteKey(): string {
  return `${SITE_KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
}

export const hashSiteKey = (key: string): string => createHash('sha256').update(key).digest('hex');

export const looksLikeSiteKey = (key: unknown): key is string =>
  typeof key === 'string' && key.startsWith(SITE_KEY_PREFIX) && key.length > SITE_KEY_PREFIX.length + 20 && key.length < 80;

/** « parking-des-cedres.fr » from the address the plugin reports, else null. */
export function siteHostOf(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > 500) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.hostname.toLowerCase().slice(0, 255) || null;
  } catch {
    return null;
  }
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export interface SiteBookingInput {
  arrivalAt: string;
  returnAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  plate: string | null;
  returnFlight: string | null;
  passengers: number;
  message: string | null;
}

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, max) : null;
};

/** The booking the plugin sends, checked field by field (the errors are the API's usual field codes). */
export function readSiteBooking(body: unknown): { ok: true; value: SiteBookingInput } | { ok: false; fields: Record<string, string> } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const arrivalAt = typeof b.arrivalAt === 'string' ? b.arrivalAt.trim() : '';
  const returnAt = typeof b.returnAt === 'string' ? b.returnAt.trim() : '';
  if (!LOCAL_DATETIME.test(arrivalAt)) fields.arrivalAt = 'invalid_datetime';
  if (!LOCAL_DATETIME.test(returnAt)) fields.returnAt = 'invalid_datetime';
  const firstName = text(b.firstName, 60);
  const lastName = text(b.lastName, 60);
  if (!firstName) fields.firstName = 'required';
  if (!lastName) fields.lastName = 'required';
  const phone = text(b.phone, 30);
  if (!phone || phone.replace(/\D/g, '').length < 8) fields.phone = phone ? 'invalid_phone' : 'required';
  const email = text(b.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'invalid_email';
  const passengers = b.passengers === undefined || b.passengers === null || b.passengers === '' ? 1 : Number(b.passengers);
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) fields.passengers = 'invalid';
  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      arrivalAt,
      returnAt,
      firstName: firstName!,
      lastName: lastName!,
      phone: phone!,
      email,
      plate: text(b.plate, 20),
      returnFlight: text(b.returnFlight, 20),
      passengers,
      message: text(b.message, 300),
    },
  };
}
