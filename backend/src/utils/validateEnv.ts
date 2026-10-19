import { bool, cleanEnv, port, str } from 'envalid';
import { isLiveStripeKey } from '@/config';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    // On Vercel the API shares its origin with the pro space and the site, so CORS origins are
    // only needed when a front end runs elsewhere (comma-separated list).
    PORT: port({ default: 3005 }),
    CLIENT_URL: str({ default: '' }),
    SECRET_KEY: str(),
    DATABASE_URL: str(),
    CRON_SECRET: str({ desc: 'Secret sent by Vercel Cron in the Authorization header' }),
    // Required in production: without it every traveller shares the site's rate-limit bucket
    // (a few "Ma réservation" attempts would lock the form for everyone).
    SITE_API_KEY: str({ devDefault: '', desc: 'Shared secret sent by the traveller site (x-plazo-site-key)' }),
    // Optional: see .env.example.
    BREVO_API_KEY: str({ default: '' }),
    EMAIL_FROM: str({ default: '' }),
    SMS_SENDER: str({ default: '' }),
    PUBLIC_SITE_URL: str({ default: '' }),
    SMS_DAILY_LIMIT: str({ default: '' }),
    // « La lettre Plazo » (15/10/2026): without both, POST /public/newsletter answers 409 newsletter_unavailable.
    BREVO_NEWSLETTER_LIST_ID: str({ default: '', desc: 'Id of the Brevo list the newsletter subscribers join (a positive integer)' }),
    BREVO_NEWSLETTER_DOI_TEMPLATE_ID: str({
      default: '',
      desc: 'Id of the Brevo double opt-in template (it holds the {{ doubleoptin }} link; a positive integer)',
    }),
    // Prospection (Plateforme › Prospection, 18/10/2026): empty = EMAIL_FROM, and replies to the admin who sent.
    PROSPECTING_SENDER_EMAIL: str({ default: '', desc: 'Sender address of the prospecting emails (verified in Brevo)' }),
    PROSPECTING_SENDER_NAME: str({ default: '', desc: 'Sender name of the prospecting emails' }),
    PROSPECTING_REPLY_TO: str({ default: '', desc: 'Reply-To of the prospecting emails' }),
    PROSPECTING_PHONE: str({ default: '', desc: 'Phone number written under the signature of the prospecting emails' }),
    // Per-operator SMS through their own Android phone: needed as soon as one operator links a phone.
    SMS_GATEWAY_ENCRYPTION_KEY: str({
      default: '',
      desc: 'AES-256 key (32 bytes, base64) encrypting the gateway passwords: openssl rand -base64 32',
    }),
    PLATFORM_ADMIN_EMAILS: str({ default: '', desc: 'Emails of the platform owners (internal tools), comma-separated' }),
    // Online payment (Stripe Connect). Without a secret key, travellers pay at the parking.
    STRIPE_SECRET_KEY: str({ default: '', desc: 'Stripe secret key (sk_test_… until the legal validation)' }),
    STRIPE_PUBLISHABLE_KEY: str({ default: '', desc: "Stripe publishable key (pk_…) for the app's payment sheet" }),
    STRIPE_WEBHOOK_SECRET: str({ default: '', desc: 'Signing secrets of the Stripe webhook endpoints (whsec_…), comma-separated' }),
    STRIPE_ALLOW_LIVE: bool({ default: false, desc: 'Allow a live Stripe key in production' }),
    STRIPE_API_BASE: str({ default: '', desc: 'Development only: address of a fake Stripe API' }),
    // Push notifications to the staff app. Without both, no push is sent.
    ONESIGNAL_APP_ID: str({ default: '', desc: 'OneSignal app id (push notifications to the staff)' }),
    ONESIGNAL_REST_API_KEY: str({ default: '', desc: 'OneSignal REST API key of that app' }),
    ONESIGNAL_TRAVELLER_APP_ID: str({
      default: '',
      desc: 'OneSignal app id of the traveller app (pushes about the shuttle); defaults to the staff one',
    }),
    ONESIGNAL_TRAVELLER_REST_API_KEY: str({ default: '', desc: 'OneSignal REST API key of the traveller app' }),
    // Return flight tracking (optional). AeroDataBox through RapidAPI is the one that works today;
    // AirLabs is kept for when its registration reopens.
    AERODATABOX_API_KEY: str({ default: '', desc: 'AeroDataBox key (RapidAPI "Basic" plan, or API.Market with AERODATABOX_BASE_URL)' }),
    AERODATABOX_BASE_URL: str({ default: '', desc: 'Default https://aerodatabox.p.rapidapi.com' }),
    AIRLABS_BASE_URL: str({ default: '', desc: 'Default https://airlabs.co/api/v9' }),
    PLATFORM_COMMISSION_BPS: str({ default: '', desc: 'Platform commission in basis points (0-5000)' }),
    POSTGRES_PRISMA_URL: str({
      default: '',
      desc: 'Pooled connection injected by the Vercel Neon integration (used instead of DATABASE_URL when set)',
    }),
    AIRLABS_API_KEY: str({ default: '', desc: 'AirLabs API key (optional)' }),
    FLIGHT_TRACKING_PROVIDER: str({ default: '', desc: 'airlabs | aerodatabox (default: the provider whose key is set, aerodatabox when both)' }),
    // Plazo Pro sign-in with Apple / Google (13/10/2026). Apple is offered only with the key, Google only with a client ID.
    APPLE_TEAM_ID: str({ default: '3BX4795V2Y', desc: 'Apple Developer team id (issuer of the client secret)' }),
    APPLE_CLIENT_IDS: str({ default: 'com.benfordtech.plazopro', desc: 'Accepted audiences of Apple identity tokens, comma-separated' }),
    APPLE_SIGNIN_KEY_ID: str({ default: '', desc: 'Key ID of the « Sign in with Apple » key (.p8)' }),
    APPLE_SIGNIN_PRIVATE_KEY: str({ default: '', desc: 'PEM content of that .p8 (literal \\n accepted); revokes the tokens at account deletion' }),
    GOOGLE_CLIENT_IDS: str({ default: '', desc: 'Google OAuth client IDs accepted as the audience of ID tokens (the Web client), comma-separated' }),
  });
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
  if (process.env.NODE_ENV === 'production' && isLiveStripeKey(stripeKey) && process.env.STRIPE_ALLOW_LIVE !== 'true') {
    // Test mode only until the legal validation (platform status, VAT, terms).
    throw new Error('A live Stripe key is set: refused in production unless STRIPE_ALLOW_LIVE=true');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.SITE_API_KEY?.trim()) {
    throw new Error('SITE_API_KEY must be set in production (shared with the traveller site)');
  }
};
