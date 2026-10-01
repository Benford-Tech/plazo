import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    CLIENT_URL: str(),
    SECRET_KEY: str(),
    DATABASE_URL: str(),
    BOSS_DATABASE_URL: str(),
  });
};
