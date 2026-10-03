import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local`, quiet: true });
config({ quiet: true });

export const { NODE_ENV, PORT, SECRET_KEY, DATABASE_URL, CRON_SECRET } = process.env;

// Every route is served under this prefix: on Vercel the project's /api/* requests go to this
// service with their path unchanged (see the repository's vercel.json).
export const API_PREFIX = '/api';

// Set by Vercel on every deployment.
export const IS_VERCEL = !!process.env.VERCEL;

export const CLIENT_URLS = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

// Access token lasts one working shift; the refresh token keeps the mobile app signed in.
export const ACCESS_TOKEN_TTL_HOURS = 12;
export const REFRESH_TOKEN_TTL_DAYS = 30;

// Lock an email after too many failed logins in a sliding window.
export const LOGIN_MAX_FAILURES = 8;
export const LOGIN_WINDOW_MINUTES = 15;

export const BCRYPT_ROUNDS = 10;

// Links sent by email to the operators: an invitation to set one's password, and the
// confirmation of the email given at sign-up. Single use.
export const INVITATION_TTL_DAYS = 7;
export const EMAIL_VERIFICATION_TTL_HOURS = 48;

// "Open their space": a platform admin's session scoped to one operator. Short-lived, no refresh.
export const VIEW_AS_TTL_MINUTES = 60;

// Shared secret sent by the traveller site (x-plazo-site-key) on its server-side calls. When it
// matches, rate limits count the traveller's IP (x-plazo-client-ip) instead of the site's own IP.
export const SITE_API_KEY = process.env.SITE_API_KEY || '';

// Brevo (transactional email and SMS). Without an API key, nothing is sent.
export const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
// Sender of the emails, e.g. "Plazo <reservations@example.com>" (a sender verified in Brevo).
export const EMAIL_FROM = process.env.EMAIL_FROM || '';
// Alphanumeric SMS sender, 11 characters at most (default: the product name).
export const SMS_SENDER = process.env.SMS_SENDER || '';
// Confirmation SMS sent per rolling 24 hours at most (bookings on the site are free to make: a cap
// on the SMS bill). Above it, travellers still get the email.
const rawSmsLimit = Number(process.env.SMS_DAILY_LIMIT);
export const SMS_DAILY_LIMIT = Number.isInteger(rawSmsLimit) && rawSmsLimit >= 0 ? rawSmsLimit : 300;
// Public base URL of the traveller site, for the links in emails and SMS. On Vercel it defaults to
// the project's production domain (the site, the API and the pro space share it).
export const PUBLIC_SITE_URL = (
  process.env.PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/+$/, '');

// Default commission on online bookings, in basis points (1500 = 15 %), when an operator has none.
// Unset: online payment stays closed until a commission is configured.
const rawCommission = Number(process.env.PLATFORM_COMMISSION_BPS);
export const PLATFORM_COMMISSION_BPS = Number.isInteger(rawCommission) && rawCommission >= 0 && rawCommission <= 5000 ? rawCommission : null;

// Stripe Connect (online payment of the site's bookings). Read on every call, like the platform
// admins below, so that tests can switch payments on and off. Without a secret key, payments are
// off and travellers pay at the parking, exactly as before.
export function stripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() || '';
}

/** Publishable key (pk_…) handed to the app's native payment sheet; optional (web Checkout needs none). */
export function stripePublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY?.trim() || '';
}

export function paymentsEnabled(): boolean {
  return !!stripeSecretKey();
}

/** Signing secrets of the webhook endpoints (comma-separated: the platform's and the connected accounts' events). */
export function stripeWebhookSecrets(): string[] {
  return (process.env.STRIPE_WEBHOOK_SECRET || '')
    .split(',')
    .map(secret => secret.trim())
    .filter(Boolean);
}

/** Live keys (sk_live_, rk_live_) move real money: refused in production unless STRIPE_ALLOW_LIVE=true. */
export function isLiveStripeKey(key: string): boolean {
  return /^(sk|rk)_live_/.test(key.trim());
}

/**
 * Development and end-to-end tests only: another Stripe API address (e.g. a local fake,
 * "http://localhost:12111"). Ignored in production.
 */
export function stripeApiBase(): string {
  return process.env.NODE_ENV === 'production' ? '' : process.env.STRIPE_API_BASE?.trim() || '';
}

// Platform owners (comma-separated emails): a staff member whose email is listed may use the
// internal tools under /api/internal/platform (e.g. the capacity estimator). Read on every call so
// that a change of the environment needs no code change (and tests can set it).
export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  return !!email && platformAdminEmails().includes(email.trim().toLowerCase());
}

// OneSignal (push notifications to the staff's phones). Read on every call so that tests can
// switch pushes on and off. Without both values, no push is sent (the rest works the same).
export function oneSignalSettings(): { appId: string; restApiKey: string } | null {
  const appId = process.env.ONESIGNAL_APP_ID?.trim() || '';
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim() || '';
  return appId && restApiKey ? { appId, restApiKey } : null;
}

// Return flight tracking. Both providers are optional; the active one is FLIGHT_TRACKING_PROVIDER
// (airlabs | aerodatabox), else whichever key is set (AeroDataBox when both). Read on every call so
// that tests can switch providers. Without a key, flights are not tracked (the traveller's
// "J'ai atterri" and the return time typed at booking still work).
export type FlightProviderName = 'airlabs' | 'aerodatabox';
export function flightTrackingSettings(): { provider: FlightProviderName; apiKey: string; baseUrl: string } | null {
  const airlabs = process.env.AIRLABS_API_KEY?.trim() || '';
  const aerodatabox = process.env.AERODATABOX_API_KEY?.trim() || '';
  const chosen = (process.env.FLIGHT_TRACKING_PROVIDER?.trim().toLowerCase() || '') as FlightProviderName | '';
  const provider: FlightProviderName | null =
    chosen === 'airlabs' || chosen === 'aerodatabox' ? chosen : aerodatabox ? 'aerodatabox' : airlabs ? 'airlabs' : null;
  if (!provider) return null;
  const apiKey = provider === 'airlabs' ? airlabs : aerodatabox;
  if (!apiKey) return null;
  const baseUrl =
    provider === 'airlabs'
      ? process.env.AIRLABS_BASE_URL?.trim() || 'https://airlabs.co/api/v9'
      : // RapidAPI by default; the direct API.Market host also works (see README).
        process.env.AERODATABOX_BASE_URL?.trim() || 'https://aerodatabox.p.rapidapi.com';
  return { provider, apiKey, baseUrl: baseUrl.replace(/\/+$/, '') };
}

// The product name is still a working name: it lives only in the repository's product.json.
// The build copies it to lib/product.json (deployed with the function); in development it is
// read from the repository root.
const productPath = [resolve(__dirname, '../product.json'), resolve(__dirname, '../../../product.json')].find(existsSync);
if (!productPath) throw new Error('product.json not found');
const product = JSON.parse(readFileSync(productPath, 'utf8')) as { name: string; tagline: string };
export const PRODUCT_NAME = product.name;
export const PRODUCT_TAGLINE = product.tagline;
