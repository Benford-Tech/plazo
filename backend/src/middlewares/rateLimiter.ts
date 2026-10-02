import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { isIP } from 'net';
import { NODE_ENV, SITE_API_KEY } from '@/config';

const skip = () => NODE_ENV === 'test';

function sameSecret(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The 8 groups of an IPv6 address, or null. */
function ipv6Groups(ip: string): number[] | null {
  let address = ip.split('%')[0].toLowerCase();
  // Embedded IPv4 (e.g. ::ffff:1.2.3.4): turn its last 32 bits into two groups.
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    address = `${address.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail].map(g => parseInt(g, 16));
  return groups.length === 8 && groups.every(g => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/**
 * Rate-limit key of an IP address. One subscriber usually holds a whole IPv6 /64, so IPv6
 * addresses count per /64 (otherwise each of its 2^64 addresses would get its own bucket).
 * IPv4-mapped IPv6 addresses count as the IPv4 address.
 */
export function ipKey(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  const groups = ipv6Groups(ip);
  if (!groups) return ip;
  if (groups.slice(0, 5).every(g => g === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.');
  }
  return `${groups
    .slice(0, 4)
    .map(g => g.toString(16))
    .join(':')}::/64`;
}

/**
 * Who a request counts against. The traveller site calls the API from its own server, so every
 * traveller would share the site's IP: when the request carries the site's key, the traveller's IP
 * it forwards (x-plazo-client-ip) is used instead. Anyone else is counted by their own IP.
 */
export function rateLimitKey(req: Request, siteKey: string = SITE_API_KEY): string {
  const sentKey = req.get('x-plazo-site-key');
  const clientIp = req.get('x-plazo-client-ip')?.trim();
  if (siteKey && sentKey && sameSecret(sentKey, siteKey) && clientIp && isIP(clientIp)) return ipKey(clientIp);
  return req.ip ? ipKey(req.ip) : 'unknown';
}

const keyGenerator = (req: Request) => rateLimitKey(req);

// 429 bodies follow the API's error shape: { message, code }.
const tooMany = (code: string) => ({ message: 'Too many requests, please try again later', code });

export const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, skipSuccessfulRequests: true, skip, message: tooMany('too_many_requests') });

export const appLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  skip,
  keyGenerator,
  message: tooMany('too_many_requests'),
});

// Anonymous endpoints of the traveller site: every request counts, not only failures.
export const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, skip, keyGenerator, message: tooMany('too_many_requests') });

// Finding a booking by reference and email: few attempts, to make guessing pointless.
export const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, skip, keyGenerator, message: tooMany('too_many_attempts') });

// Bookings on the site: anonymous and free (paid on site), each one holds a real place and sends an
// email and an SMS. A traveller rarely books more than a couple of stays in an hour; failed
// attempts (validation, full nights) do not count.
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip,
  skipFailedRequests: true,
  keyGenerator,
  message: tooMany('too_many_requests'),
});

/** The reference a lookup is about, so that guesses on one booking are limited whatever the IP. */
export function lookupReferenceKey(req: Request): string {
  const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim().toUpperCase().slice(0, 20) : '';
  return `reference:${reference}`;
}

// Failed lookups of one reference, from any number of addresses.
export const lookupReferenceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip,
  skipSuccessfulRequests: true,
  keyGenerator: lookupReferenceKey,
  message: tooMany('too_many_attempts'),
});

// Self sign-up of operators: each one creates an account and sends an email. Every request counts
// (also refused ones), per IP. Tests switch it on with TEST_RATE_LIMITS to check it.
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => skip() && !process.env.TEST_RATE_LIMITS,
  keyGenerator,
  message: tooMany('too_many_requests'),
});
