import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local`, quiet: true });
config({ quiet: true });

export const { NODE_ENV, PORT, SECRET_KEY, DATABASE_URL, BOSS_DATABASE_URL } = process.env;

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

// The product name is still a working name: it lives only in the repository's product.json.
// src/config and dist/config are both two levels below backend/.
const product = JSON.parse(readFileSync(resolve(__dirname, '../../../product.json'), 'utf8')) as { name: string; tagline: string };
export const PRODUCT_NAME = product.name;
export const PRODUCT_TAGLINE = product.tagline;
