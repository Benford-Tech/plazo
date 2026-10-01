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
  });
};
