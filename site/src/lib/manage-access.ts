/**
 * Access to a booking's page without an account. The manage key arrives once in a link
 * (/ma-reservation/<ref>?cle=…, from the email or SMS); the proxy then keeps it in an HttpOnly
 * cookie limited to that booking's pages and redirects to the same address without the key, so it
 * does not stay in the browser history, in shared links or in request logs. Pure helpers: also used
 * by the proxy.
 */

export const REFERENCE_RE = /^[A-Za-z0-9]{4,12}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** The key is valid until 30 days after the return (checked by the API); 90-day stays + margin. */
const MAX_AGE_SECONDS = 150 * 24 * 3600;

export function isManageToken(value: string | null | undefined): value is string {
  return !!value && TOKEN_RE.test(value);
}

/** Pages of one booking (its page and its .ics file): the cookie is sent there only. */
export function managePath(reference: string): string {
  return `/ma-reservation/${encodeURIComponent(reference.toUpperCase())}`;
}

export function manageCookieName(reference: string): string {
  return `cle-${reference.toUpperCase()}`;
}

export interface ManageCookie {
  name: string;
  value: string;
  options: { httpOnly: true; secure: boolean; sameSite: "lax"; path: string; maxAge: number };
}

/** Cookie holding a booking's manage key. */
export function manageCookie(reference: string, token: string, secure: boolean): ManageCookie {
  return {
    name: manageCookieName(reference),
    value: token,
    options: { httpOnly: true, secure, sameSite: "lax", path: managePath(reference), maxAge: MAX_AGE_SECONDS },
  };
}

/** HTTPS only in production (browsers also accept Secure cookies on http://localhost). */
export function secureCookies(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "production";
}
