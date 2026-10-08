import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local`, quiet: true });
config({ quiet: true });

export const { NODE_ENV, PORT, SECRET_KEY, CRON_SECRET } = process.env;

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

// V-A (07/10/2026): Claude proposes the parking zones from the IGN photo. Without a key, the pro
// space's button answers 409 `ai_unavailable`. The model can be pinned (default: Claude Opus 5.5).
export const anthropicApiKey = (): string => (process.env.ANTHROPIC_API_KEY || '').trim();
export const zoneSuggestionModel = (): string => (process.env.ZONE_SUGGESTION_MODEL || '').trim() || 'claude-opus-5-5';
// L-A (08/10/2026): Claude reads the forwarded emails no importer recognises and creates the booking.
// Same key; without it, those emails simply wait in "À vérifier". The model can be pinned too.
export const emailReadingModel = (): string => (process.env.EMAIL_READING_MODEL || '').trim() || 'claude-opus-5-5';

// Brevo (transactional email and SMS). Without an API key, nothing is sent.
export const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
// M-A (06/10/2026): the domain of the operators' inbound addresses (<slug>@<domain>). Cloudflare Email Routing
// hands its mail to the email-worker/ relay (08/10/2026, Brevo before), which posts it to POST /public/inbound/email
// with the header X-Inbound-Secret: <INBOUND_EMAIL_SECRET> (header only, 08/10/2026). Both empty: feature off.
export const INBOUND_EMAIL_DOMAIN = (process.env.INBOUND_EMAIL_DOMAIN || '').trim().toLowerCase();
export const INBOUND_EMAIL_SECRET = (process.env.INBOUND_EMAIL_SECRET || '').trim();
export const inboundEmailAvailable = (): boolean => !!INBOUND_EMAIL_DOMAIN && !!INBOUND_EMAIL_SECRET;
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

// Per-operator SMS through the operator's own Android phone ("SMS Gateway for Android"). The
// app's password is encrypted at rest with this key (32 bytes, base64: `openssl rand -base64 32`).
// Read on every call so that tests can set it. Without it, the gateway mode cannot be enabled.
export function smsGatewayEncryptionKey(): string {
  return process.env.SMS_GATEWAY_ENCRYPTION_KEY?.trim() || '';
}

/** Whether the "Plazo envoie pour moi" SMS channel (Brevo) can be offered to the operators. */
export function brevoSmsAvailable(): boolean {
  return !!(process.env.BREVO_API_KEY?.trim() || '');
}

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

/**
 * The platform tools open only to a listed email that its owner has verified (08/10/2026): a free signup or a
 * member created with the owner's email, never verified, must not reach the platform.
 */
export function isVerifiedPlatformAdmin(staff: { email: string | null; emailVerifiedAt: Date | null } | null | undefined): boolean {
  return !!staff && !!staff.emailVerifiedAt && isPlatformAdmin(staff.email);
}

// OneSignal (push notifications to the staff's phones). Read on every call so that tests can
// switch pushes on and off. Without both values, no push is sent (the rest works the same).
export function oneSignalSettings(): { appId: string; restApiKey: string } | null {
  const appId = process.env.ONESIGNAL_APP_ID?.trim() || '';
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim() || '';
  return appId && restApiKey ? { appId, restApiKey } : null;
}

// The traveller app is another OneSignal app (another Android package / iOS bundle). Without its own
// values, the staff app's are used (one OneSignal app for both during the tests).
export function oneSignalTravellerSettings(): { appId: string; restApiKey: string } | null {
  const appId = process.env.ONESIGNAL_TRAVELLER_APP_ID?.trim() || '';
  const restApiKey = process.env.ONESIGNAL_TRAVELLER_REST_API_KEY?.trim() || '';
  return appId && restApiKey ? { appId, restApiKey } : oneSignalSettings();
}

// Return flight tracking. The providers are optional; the active one is FLIGHT_TRACKING_PROVIDER
// (flightaware | aerodatabox | airlabs), else whichever key is set (FlightAware, then AeroDataBox,
// then AirLabs). Read on every call so that tests can switch providers. Without a key, flights
// are not tracked (the traveller's "J'ai atterri" and the return time typed at booking still work).
export type FlightProviderName = 'flightaware' | 'aerodatabox' | 'airlabs';
export function flightTrackingSettings(): { provider: FlightProviderName; apiKey: string; baseUrl: string } | null {
  const keys: Record<FlightProviderName, string> = {
    flightaware: process.env.FLIGHTAWARE_API_KEY?.trim() || '',
    aerodatabox: process.env.AERODATABOX_API_KEY?.trim() || '',
    airlabs: process.env.AIRLABS_API_KEY?.trim() || '',
  };
  const chosen = (process.env.FLIGHT_TRACKING_PROVIDER?.trim().toLowerCase() || '') as FlightProviderName | '';
  const provider: FlightProviderName | null =
    chosen === 'flightaware' || chosen === 'aerodatabox' || chosen === 'airlabs'
      ? chosen
      : ((['flightaware', 'aerodatabox', 'airlabs'] as FlightProviderName[]).find(name => keys[name]) ?? null);
  if (!provider) return null;
  const apiKey = keys[provider];
  if (!apiKey) return null;
  const defaults: Record<FlightProviderName, string> = {
    // AeroAPI v4 (Personal plan: 5 $ of queries offered every month).
    flightaware: process.env.FLIGHTAWARE_BASE_URL?.trim() || 'https://aeroapi.flightaware.com/aeroapi',
    // RapidAPI by default; the direct API.Market host also works (see README).
    aerodatabox: process.env.AERODATABOX_BASE_URL?.trim() || 'https://aerodatabox.p.rapidapi.com',
    airlabs: process.env.AIRLABS_BASE_URL?.trim() || 'https://airlabs.co/api/v9',
  };
  return { provider, apiKey, baseUrl: defaults[provider].replace(/\/+$/, '') };
}

// The product name is still a working name: it lives only in the repository's product.json.
// The build copies it to lib/product.json (deployed with the function); in development it is
// read from the repository root.
const productPath = [resolve(__dirname, '../product.json'), resolve(__dirname, '../../../product.json')].find(existsSync);
if (!productPath) throw new Error('product.json not found');
const product = JSON.parse(readFileSync(productPath, 'utf8')) as { name: string; tagline: string };
export const PRODUCT_NAME = product.name;
export const PRODUCT_TAGLINE = product.tagline;
