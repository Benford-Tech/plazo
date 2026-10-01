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

// Default commission on online bookings, in basis points (1500 = 15 %), when an operator has none.
// Unset: online payment stays closed until a commission is configured.
const rawCommission = Number(process.env.PLATFORM_COMMISSION_BPS);
export const PLATFORM_COMMISSION_BPS = Number.isInteger(rawCommission) && rawCommission >= 0 && rawCommission <= 5000 ? rawCommission : null;

// The product name is still a working name: it lives only in the repository's product.json.
// The build copies it to lib/product.json (deployed with the function); in development it is
// read from the repository root.
const productPath = [resolve(__dirname, '../product.json'), resolve(__dirname, '../../../product.json')].find(existsSync);
if (!productPath) throw new Error('product.json not found');
const product = JSON.parse(readFileSync(productPath, 'utf8')) as { name: string; tagline: string };
export const PRODUCT_NAME = product.name;
export const PRODUCT_TAGLINE = product.tagline;
