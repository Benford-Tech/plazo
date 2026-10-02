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
    PLATFORM_ADMIN_EMAILS: str({ default: '', desc: 'Emails of the platform owners (internal tools), comma-separated' }),
    // Online payment (Stripe Connect). Without a secret key, travellers pay at the parking.
    STRIPE_SECRET_KEY: str({ default: '', desc: 'Stripe secret key (sk_test_… until the legal validation)' }),
    STRIPE_WEBHOOK_SECRET: str({ default: '', desc: 'Signing secrets of the Stripe webhook endpoints (whsec_…), comma-separated' }),
    STRIPE_ALLOW_LIVE: bool({ default: false, desc: 'Allow a live Stripe key in production' }),
    STRIPE_API_BASE: str({ default: '', desc: 'Development only: address of a fake Stripe API' }),
    // Push notifications to the staff app. Without both, no push is sent.
    ONESIGNAL_APP_ID: str({ default: '', desc: 'OneSignal app id (push notifications to the staff)' }),
    ONESIGNAL_REST_API_KEY: str({ default: '', desc: 'OneSignal REST API key of that app' }),
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
