/**
 * « Lien court Plazo » (direction B, 27/10/2026): https://www.plazo.fr/a/<REF>-<code> in the SMS and emails. On a phone
 * with the app, the OS opens the app itself (universal link / App Link); without it, the rebound page (app/a/[code])
 * remembers the phone with the API and leads to the store, or to the booking's page on a computer. Pure helpers.
 */

export const APP_LINK_CODE_RE = /^[A-Za-z0-9]{4,12}-[A-Za-z0-9_-]{8}$/;

export type AppPlatform = "ios" | "android";

/** The platform of a browser, from its user agent; null for a computer or an unknown device. */
export function platformOf(
  userAgent: string | null | undefined,
): AppPlatform | null {
  const ua = userAgent ?? "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

export const PLAZO_PACKAGE = "com.benfordtech.plazo";

/** Google Play, with the code as install referrer: the app can read it at its first launch. */
export function playStoreUrl(code: string): string {
  return `https://play.google.com/store/apps/details?id=${PLAZO_PACKAGE}&referrer=${encodeURIComponent(`plazo_code=${code}`)}`;
}

/** The App Store page of the traveller app, once Apple has published it (PLAZO_APP_STORE_URL); null until then. */
export function appStoreUrl(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const url = env.PLAZO_APP_STORE_URL?.trim().replace(/\/+$/, "") ?? "";
  return /^https:\/\/apps\.apple\.com\//.test(url) ? url : null;
}

/** The app's own scheme, for « J'ai déjà l'app » when the OS did not open it itself. */
export function appSchemeUrl(code: string): string {
  return `plazo://a/${encodeURIComponent(code)}`;
}
