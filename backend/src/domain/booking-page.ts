/**
 * Site du parking, niveau 3 « La réservation Plazo dans le site » (19/11/2026, choix « 2 et 3 », « reversé entier »):
 * the parking's own Plazo booking page, plazo.fr/r/<slug>, shown in its site (an iframe added by a one-line script) or
 * opened as a link. Everything is Plazo's: places, card payment, confirmation, cancellation. The booking is a Plazo one
 * (channel plazo) marked viaBookingPage, and the whole amount goes to the parking: no commission.
 */

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const ACCENT_RE = /^#[0-9A-F]{6}$/;
/** The default button colour of the module (the site's own orange). */
export const DEFAULT_BOOKING_PAGE_ACCENT = '#FF6600';

/** « Parking des Cèdres » → « parking-des-cedres » (accents, spaces and signs dropped, 40 characters at most). */
export function slugFrom(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function readSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = slugFrom(value.trim());
  return SLUG_RE.test(slug) ? slug : null;
}

/** « #0e4c6e » → « #0E4C6E »; anything else is null. */
export function readAccent(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().toUpperCase();
  const full = /^#[0-9A-F]{3}$/.test(hex) ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  return ACCENT_RE.test(full) ? full : null;
}

/** The text on the button must stay readable: white on a dark colour, ink on a light one. */
export function accentInk(accent: string): '#FFFFFF' | '#1A1D1A' {
  const [r, g, b] = [1, 3, 5]
    .map(i => parseInt(accent.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? '#1A1D1A' : '#FFFFFF';
}

/** Words that would read as Plazo's own pages, never a parking's address. */
const RESERVED = new Set(['plazo', 'pro', 'api', 'admin', 'embed', 'demo', 'test', 'www']);
export const isReservedSlug = (slug: string) => RESERVED.has(slug);

/** The page and the code to paste in the parking's site. */
export function bookingPageUrls(siteUrl: string, slug: string) {
  const site = siteUrl.replace(/\/+$/, '');
  const page = `${site}/r/${slug}`;
  return {
    page,
    embed: `<script src="${site}/r/embed.js" data-plazo="${slug}" async></script>`,
  };
}
