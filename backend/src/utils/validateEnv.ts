import { cleanEnv, port, str } from 'envalid';

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
  });
  if (process.env.NODE_ENV === 'production' && !process.env.SITE_API_KEY?.trim()) {
    throw new Error('SITE_API_KEY must be set in production (shared with the traveller site)');
  }
};
