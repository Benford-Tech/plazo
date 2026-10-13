/**
 * The « code du jour » of an operator (13/10/2026): ten characters a manager hands to a new recruit, who types it in
 * Plazo Pro after signing in with Apple or Google; a manager then accepts the join request. Derived, never stored: an
 * HMAC of the operator and its local day, so it changes by itself at local midnight and a manager can read it again
 * at any time. Pure functions (the secret and the day are given).
 */
import { createHmac } from 'crypto';
import { dayBounds } from './time';

/** Crockford's base 32: no I, L, O or U (they read like 1, 1, 0 and V). */
export const JOIN_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const JOIN_CODE_LENGTH = 10;

const CODE_RE = new RegExp(`^[${JOIN_CODE_ALPHABET}]{${JOIN_CODE_LENGTH}}$`);

/**
 * The code of an operator for a local day (YYYY-MM-DD): the first 50 bits of HMAC-SHA256(secret, "operatorId:day"),
 * five bits per character (32 is a power of two: no modulo bias).
 */
export function joinCodeFor(secret: Buffer | string, operatorId: string, day: string): string {
  const digest = createHmac('sha256', secret).update(`${operatorId}:${day}`).digest();
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    let value = 0;
    for (let b = 0; b < 5; b += 1) {
      const bit = i * 5 + b;
      value = (value << 1) | ((digest[bit >> 3] >> (7 - (bit & 7))) & 1);
    }
    code += JOIN_CODE_ALPHABET[value];
  }
  return code;
}

/** "K7QM2XP9TD" → "K7QM2-XP9TD" (two groups of five, easier to read and dictate). */
export function formatJoinCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/**
 * What a person typed or pasted → the bare code, or null when it cannot be one. Upper case, spaces and dashes
 * removed, and the letters that read like digits tolerated (O → 0, I and L → 1).
 */
export function normalizeJoinCode(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;
  const code = input
    .toUpperCase()
    .replace(/[\s\-‐‑‒–—―]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return CODE_RE.test(code) ? code : null;
}

/** When the code of a local day stops working: the next local midnight. */
export function joinCodeValidUntil(day: string, timezone: string): Date {
  return dayBounds(day, timezone).end;
}
