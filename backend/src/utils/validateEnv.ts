import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    CLIENT_URL: str(),
    SECRET_KEY: str(),
    DATABASE_URL: str(),
    CRON_SECRET: str({ desc: 'Secret sent by Vercel Cron in the Authorization header' }),
  });
};
