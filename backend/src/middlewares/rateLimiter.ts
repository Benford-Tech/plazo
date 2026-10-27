import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { isIP } from 'net';
import { NODE_ENV, SITE_API_KEY } from '@/config';
import { ipv6Groups, visitorIp } from '@/domain/client-ip';

const skip = () => NODE_ENV === 'test';

function sameSecret(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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
 * it forwards (x-plazo-client-ip) is used instead. Anyone else is counted by their own IP, read
 * behind Cloudflare's proxy when the request came through it (08/10/2026: www.plazo.fr is proxied,
 * every visitor would otherwise share a handful of Cloudflare addresses).
 */
export function rateLimitKey(req: Request, siteKey: string = SITE_API_KEY): string {
  const sentKey = req.get('x-plazo-site-key');
  const clientIp = req.get('x-plazo-client-ip')?.trim();
  if (siteKey && sentKey && sameSecret(sentKey, siteKey) && clientIp && isIP(clientIp)) return ipKey(clientIp);
  const ip = visitorIp(req.ip, req.get('cf-connecting-ip'));
  return ip ? ipKey(ip) : 'unknown';
}

/** The visitor's own address (the one the site forwards, else the one seen behind Cloudflare), or undefined. */
export function visitorAddress(req: Request, siteKey: string = SITE_API_KEY): string | undefined {
  const sentKey = req.get('x-plazo-site-key');
  const clientIp = req.get('x-plazo-client-ip')?.trim();
  if (siteKey && sentKey && sameSecret(sentKey, siteKey) && clientIp && isIP(clientIp)) return clientIp;
  return visitorIp(req.ip, req.get('cf-connecting-ip'));
}

const keyGenerator = (req: Request) => rateLimitKey(req);

// 429 bodies follow the API's error shape: { message, code }.
const tooMany = (code: string) => ({ message: 'Too many requests, please try again later', code });

// Failed sign-ins, codes of the day… per visitor (13/10/2026: counted by rateLimitKey like the others, not by req.ip,
// which behind Cloudflare is an edge address many visitors share).
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  skip,
  keyGenerator,
  message: tooMany('too_many_requests'),
});

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

// A traveller's own photos of the car: six slots, retaken now and then; an upload is up to 3 MB.
export const photoUploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, skip, keyGenerator, message: tooMany('too_many_requests') });

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
  const reference = typeof req.body?.reference === 'string' ? req.body.reference.replace(/[\s#]/g, '').toUpperCase().slice(0, 40) : '';
  return `reference:${reference}`;
}

// « Lien court Plazo » (27/10/2026): the rebound page, the store claim and the app's first launch, per visitor.
export const appLinkLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, skip, keyGenerator, message: tooMany('too_many_requests') });

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

// Footer A (15/10/2026): the site's contact form (each message is an email to the support) and « La lettre Plazo » (each
// subscription makes Brevo email a confirmation). Per visitor, only accepted requests count (a visitor fixing a too-short
// message is not penalised); tests switch them on with TEST_RATE_LIMITS.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => skip() && !process.env.TEST_RATE_LIMITS,
  skipFailedRequests: true,
  keyGenerator,
  message: tooMany('too_many_requests'),
});

export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => skip() && !process.env.TEST_RATE_LIMITS,
  skipFailedRequests: true,
  keyGenerator,
  message: tooMany('too_many_requests'),
});

/**
 * The mailbox a subscription is for, hashed (no address kept in memory): confirmation emails to one mailbox are limited
 * whatever the number of visitors asking for them, and however it is spelt (« camille+1@… » and « camille+2@… » reach the
 * same inbox, as « c.amille@gmail.com » and « camille@gmail.com »).
 */
export function newsletterAddressKey(req: Request): string {
  let email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
  const at = email.lastIndexOf('@');
  if (at > 0) {
    let local = email.slice(0, at).replace(/\+.*$/, '');
    let domain = email.slice(at + 1);
    if (domain === 'googlemail.com') domain = 'gmail.com';
    if (domain === 'gmail.com') local = local.replace(/\./g, '');
    email = `${local}@${domain}`;
  }
  return `newsletter:${createHash('sha256').update(email).digest('hex').slice(0, 32)}`;
}

// Beyond 3 a day for one mailbox, nothing more is sent but the answer is the usual 202: a 429 would tell anyone that this
// address was asked for already (the form says nothing about an address).
export const newsletterAddressLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  skip: () => skip() && !process.env.TEST_RATE_LIMITS,
  skipFailedRequests: true,
  keyGenerator: newsletterAddressKey,
  handler: (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(202).json({ ok: true });
  },
});

/** 21/10/2026: entering the prospects' demo (a session each time): 30 per 15 minutes per address. */
export const demoLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, skip, keyGenerator, message: tooMany('too_many_requests') });
