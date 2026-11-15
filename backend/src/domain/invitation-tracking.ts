import { createHmac, timingSafeEqual } from 'crypto';

/**
 * 15/11/2026 (« traquer les ouvertures de mail d'invitation, par qui, sur quel support, s'ils téléchargent l'app »):
 * the invitation emails carry a signed key per send, read by an invisible image (the open, approximate) and by the
 * links to the stores and the demo, which go through Plazo before the store. The password link is not rewritten (its
 * secret stays in the fragment): its click is seen when the invitation page asks Plazo who is invited.
 */

const CHECK_LENGTH = 16;

const checkOf = (id: string, secret: string) =>
  createHmac('sha256', secret).update(`invitation-tracking:${id}`).digest('base64url').slice(0, CHECK_LENGTH);

/** `<id>.<check>`: the tracking row, and a check nobody can forge without the server's secret. */
export function trackingKey(id: string, secret: string): string {
  return `${id}.${checkOf(id, secret)}`;
}

/** The row id of a key, null when the check does not match. */
export function trackingIdOf(key: string, secret: string): string | null {
  const [id, check] = key.split('.');
  if (!id || !check || !/^[a-z0-9]{10,40}$/i.test(id)) return null;
  const expected = Buffer.from(checkOf(id, secret));
  const given = Buffer.from(check);
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

export type Device = 'iphone' | 'ipad' | 'android' | 'computer' | 'mail_proxy' | 'other';

/**
 * The device of a browser or mail reader, from its User-Agent. Gmail, Yahoo and Outlook load images through their own
 * servers (`mail_proxy`: the device stays unknown); Apple Mail's privacy protection loads them without a recognisable
 * device at all, which is why an open is only « approximate ».
 */
export function deviceOf(userAgent: string | null | undefined): Device | null {
  const ua = (userAgent ?? '').trim();
  if (!ua) return null;
  if (/GoogleImageProxy|YahooMailProxy|ggpht\.com|Outlook-iOS-Android|OutlookPreview|MicrosoftPreview/i.test(ua)) return 'mail_proxy';
  if (/iPad/.test(ua)) return 'ipad';
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/Android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Mac OS X|X11|Linux|CrOS/i.test(ua)) return 'computer';
  return 'other';
}

export type AppPlatform = 'ios' | 'android' | 'app';

/**
 * Plazo Pro on a phone sends `X-Plazo-Client: pro-ios | pro-android` (15/11/2026); older versions send Dart's own
 * User-Agent only, counted as « the app » without the platform. Anything else is a browser (the pro space on the web).
 */
export function appPlatformOf(client: string | null | undefined, userAgent: string | null | undefined): AppPlatform | null {
  const c = (client ?? '').trim().toLowerCase();
  if (c === 'pro-ios') return 'ios';
  if (c === 'pro-android') return 'android';
  if (c.startsWith('pro-')) return 'app';
  if (/^Dart\//.test(userAgent ?? '')) return 'app';
  return null;
}

/** A 1 × 1 transparent GIF, the open image. */
export const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

/** The invisible image, placed before `</body>` of an email's HTML. */
export function withOpenPixel(html: string, pixelUrl: string | null): string {
  if (!pixelUrl) return html;
  const img = `<img src="${pixelUrl.replace(/"/g, '&quot;')}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0" />`;
  return html.includes('</body>') ? html.replace('</body>', `${img}</body>`) : `${html}${img}`;
}

export const TRACKED_TARGETS = ['play', 'app_store', 'demo'] as const;
export type TrackedTarget = (typeof TRACKED_TARGETS)[number];

/** How long a tracking row is kept: 13 months after the email. */
export const INVITATION_TRACKING_RETENTION_DAYS = 395;
