import { createSign } from 'crypto';

/**
 * Google Search Console (06/11/2026, SEO local M2): the nightly import signs in with a service account (a JSON key in
 * GOOGLE_SEARCH_CONSOLE_CREDENTIALS, added by Joanny as a user of the property) and reads the Search Analytics rows.
 * Pure helpers: the signed assertion, the request, and the reading of the answer.
 */

export const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** Days read again each night: Google completes its figures over two or three days. */
export const SEARCH_CONSOLE_REREAD_DAYS = 5;
/** Days read on the first import. */
export const SEARCH_CONSOLE_FIRST_DAYS = 90;
/** Rows kept (Search Console itself keeps 16 months). */
export const SEARCH_CONSOLE_KEPT_DAYS = 400;
export const SEARCH_CONSOLE_ROW_LIMIT = 25000;

export interface ServiceAccount {
  clientEmail: string;
  privateKey: string;
}

/** The service account of a key file, or null when the JSON is not one. */
export function parseServiceAccount(json: string | undefined): ServiceAccount | null {
  if (!json?.trim()) return null;
  try {
    const data = JSON.parse(json) as { client_email?: unknown; private_key?: unknown };
    if (typeof data.client_email !== 'string' || typeof data.private_key !== 'string') return null;
    return { clientEmail: data.client_email, privateKey: data.private_key.replace(/\\n/g, '\n') };
  } catch {
    return null;
  }
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** The JWT exchanged for an access token (RS256, one hour). */
export function signedAssertion(account: ServiceAccount, now: Date): string {
  const iat = Math.floor(now.getTime() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({ iss: account.clientEmail, scope: SEARCH_CONSOLE_SCOPE, aud: GOOGLE_TOKEN_URL, iat, exp: iat + 3600 }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${base64url(signer.sign(account.privateKey))}`;
}

/** The Search Analytics address of a property ("sc-domain:plazo.fr" or "https://www.plazo.fr/"). */
export function searchAnalyticsUrl(property: string): string {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
}

export interface SearchConsoleRowInput {
  date: string;
  query: string;
  /** The path of the page ("/lyon-saint-exupery/guide/parking-pas-cher"). */
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

/** The rows of an answer (dimensions date, query, page), the page kept as its path. */
export function readRows(body: unknown): SearchConsoleRowInput[] {
  const rows = (body as { rows?: unknown })?.rows;
  if (!Array.isArray(rows)) return [];
  const out: SearchConsoleRowInput[] = [];
  for (const row of rows) {
    const keys = (row as { keys?: unknown }).keys;
    if (!Array.isArray(keys) || keys.length < 3) continue;
    const [date, query, page] = keys.map(String);
    let path: string;
    try {
      path = new URL(page).pathname.replace(/\/+$/, '') || '/';
    } catch {
      continue;
    }
    const r = row as { clicks?: unknown; impressions?: unknown; position?: unknown };
    out.push({
      date,
      query: query.slice(0, 300),
      page: path.slice(0, 300),
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      position: Number(r.position) || 0,
    });
  }
  return out;
}

/** Average position weighted by impressions (what Search Console shows for a group of rows). */
export function weightedPosition(rows: { impressions: number; position: number }[]): number | null {
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  if (!impressions) return null;
  return rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions;
}
