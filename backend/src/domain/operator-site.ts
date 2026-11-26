import { createHmac } from 'crypto';

/**
 * The parking's own site (22/11/2026, « pouvoir créer un site dédié au parking », « le plus modulaire possible »): a page
 * made of blocks the manager orders, switches on or off and titles. The « Plazo » blocks fill themselves from what the
 * parking already set (listing, prices, shuttle, meeting point, services, conditions); a « text » block is the manager's
 * own words. A new kind of block is one more entry here and one more component on the site: nothing else changes.
 */

/** Blocks filled by Plazo, at most one of each. */
export const PLAZO_BLOCK_KINDS = [
  'booking',
  'highlights',
  'steps',
  'destinations',
  'pricing',
  'photos',
  'access',
  'services',
  'cta',
  'conditions',
  'faq',
  'contact',
] as const;
/** Blocks written by the parking, several allowed. */
export const FREE_BLOCK_KINDS = ['text'] as const;
export const SITE_BLOCK_KINDS = [...PLAZO_BLOCK_KINDS, ...FREE_BLOCK_KINDS] as const;
export type SiteBlockKind = (typeof SITE_BLOCK_KINDS)[number];

export interface SiteBlock {
  id: string;
  kind: SiteBlockKind;
  enabled: boolean;
  /** The manager's own heading; null: the block's usual one. */
  title: string | null;
  /** A text block's words; null for every other kind. */
  text: string | null;
}

export const MAX_BLOCKS = 24;
export const MAX_TEXT_BLOCKS = 6;
export const MAX_BLOCK_TITLE = 80;
export const MAX_BLOCK_TEXT = 1200;
/** « Le site est en supplément » (22/11/2026): the monthly price shown to the manager, before tax. To be confirmed. */
export const SITE_ADDON_PRICE_CENTS = 2900;

const isKind = (value: unknown): value is SiteBlockKind => (SITE_BLOCK_KINDS as readonly string[]).includes(value as string);
const isFree = (kind: SiteBlockKind) => (FREE_BLOCK_KINDS as readonly string[]).includes(kind);

/** Blocks of the showcase look (24/11/2026): off until the manager switches them on, so that no site changes by itself. */
const OFF_BY_DEFAULT: readonly SiteBlockKind[] = ['destinations', 'cta'];

export const defaultBlocks = (): SiteBlock[] =>
  [...PLAZO_BLOCK_KINDS.filter(k => !OFF_BY_DEFAULT.includes(k)), ...OFF_BY_DEFAULT].map(kind => ({
    id: kind,
    kind,
    enabled: !OFF_BY_DEFAULT.includes(kind),
    title: null,
    text: null,
  }));

const oneLine = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

/**
 * The blocks a manager sends, checked: known kinds, a Plazo block once at most, the booking block always there and on
 * (the site is there to book), a text block with its words. Returns the clean list, or the reason it is refused.
 */
export function readBlocks(value: unknown): { blocks: SiteBlock[] } | { error: string } {
  if (!Array.isArray(value)) return { error: 'invalid' };
  if (value.length > MAX_BLOCKS) return { error: 'too_many' };
  const seen = new Set<string>();
  const blocks: SiteBlock[] = [];
  let texts = 0;
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return { error: 'invalid' };
    const { kind, enabled, title, text } = raw as Record<string, unknown>;
    if (!isKind(kind)) return { error: 'invalid_kind' };
    if (isFree(kind)) {
      texts += 1;
      if (texts > MAX_TEXT_BLOCKS) return { error: 'too_many_texts' };
      const body =
        typeof text === 'string'
          ? text
              .replace(/[ \t]+/g, ' ')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
          : '';
      if (!body) return { error: 'text_required' };
      if (body.length > MAX_BLOCK_TEXT) return { error: 'text_too_long' };
      blocks.push({ id: `text-${texts}`, kind, enabled: enabled !== false, title: oneLine(title, MAX_BLOCK_TITLE), text: body });
      continue;
    }
    if (seen.has(kind)) return { error: 'duplicate' };
    seen.add(kind);
    blocks.push({ id: kind, kind, enabled: kind === 'booking' ? true : enabled !== false, title: oneLine(title, MAX_BLOCK_TITLE), text: null });
  }
  if (!seen.has('booking')) return { error: 'booking_required' };
  return { blocks: withMissing(blocks) };
}

/** A Plazo block the list does not name (a kind added since it was saved) comes last, switched off. */
function withMissing(blocks: SiteBlock[]): SiteBlock[] {
  const has = new Set(blocks.map(b => b.kind));
  return [...blocks, ...PLAZO_BLOCK_KINDS.filter(k => !has.has(k)).map(kind => ({ id: kind, kind, enabled: false, title: null, text: null }))];
}

/** The saved blocks, or the default ones; anything unreadable falls back to the default. */
export function blocksOf(stored: unknown): SiteBlock[] {
  if (stored === null || stored === undefined) return defaultBlocks();
  const read = readBlocks(stored);
  return 'blocks' in read ? read.blocks : defaultBlocks();
}

/**
 * The site's look: « simple » (the first one, sober), « showcase » (24/11/2026: photo behind the title, two colours), and
 * four more models (24/11/2026, « propose plusieurs modèles de sites »): « night » (dark, for a valet), « postcard » (the
 * photo fills the first screen), « home » (warm, the phone in view) and « express » (the first price in large); then two
 * after the sites the manager showed (24/11/2026, aerpark.fr and onevalet.fr, « tout »): « park » (a shuttle car park:
 * contact bar, two buttons, numbered steps, ticked strengths) and « valet » (title and photo side by side, the journey in
 * four steps, the services with their price); then « prestige » (26/11/2026, d'après yourvaletbrothers.com): black and white, a white contact bar, a black header, the
 * banner photo in greys, the steps on grey cards, the prices on dark tiles and the manager's texts beside the listing's photos.
 */
export const SITE_THEMES = ['simple', 'showcase', 'night', 'postcard', 'home', 'express', 'park', 'valet', 'prestige'] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];
export const readTheme = (value: unknown): SiteTheme | null => ((SITE_THEMES as readonly unknown[]).includes(value) ? (value as SiteTheme) : null);

/**
 * The Google rating as the manager typed it (« 4,8 », 193 reviews): Plazo does not read it at Google. Null clears it;
 * a count needs a rating. Returns the tenths (10 to 50) and the count, or the field refused.
 */
export function readRating(value: unknown): { tenths: number | null; count: number | null } | { error: 'rating' | 'ratingCount' } {
  if (value === null || value === undefined) return { tenths: null, count: null };
  if (typeof value !== 'object') return { error: 'rating' };
  const { value: note, count } = value as Record<string, unknown>;
  if (note === null || note === undefined || note === '') {
    return count === null || count === undefined || count === '' ? { tenths: null, count: null } : { error: 'rating' };
  }
  const number = typeof note === 'number' ? note : typeof note === 'string' ? Number(note.replace(',', '.')) : NaN;
  const tenths = Math.round(number * 10);
  if (!Number.isFinite(number) || tenths < 10 || tenths > 50) return { error: 'rating' };
  if (count === null || count === undefined || count === '') return { tenths, count: null };
  const reviews = typeof count === 'number' ? count : Number(count);
  if (!Number.isInteger(reviews) || reviews < 1 || reviews > 1_000_000) return { error: 'ratingCount' };
  return { tenths, count: reviews };
}

/** Where the parking takes its travellers: the airport first, then each stop of its shuttle. */
export interface SiteDestination {
  slug: string;
  kind: 'airport' | 'station' | 'other';
  name: string;
  instructions: string | null;
}

/** Page names the site keeps for itself. */
export const FIXED_SITE_PAGES = ['tarifs', 'questions', 'contact', 'mentions-legales'] as const;

const pageSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/** The airport and the shuttle's stops as destinations, each with the page name it gets (unique, never a fixed page). */
export function siteDestinations(airportName: string, stops: { name: string; kind: string; instructions?: string | null }[]): SiteDestination[] {
  const taken = new Set<string>(FIXED_SITE_PAGES);
  const list: SiteDestination[] = [];
  const add = (name: string, kind: SiteDestination['kind'], wanted: string, instructions: string | null) => {
    const slug = pageSlug(wanted);
    if (!slug || taken.has(slug)) return;
    taken.add(slug);
    list.push({ slug, kind, name, instructions });
  };
  add(airportName, 'airport', 'aeroport', null);
  for (const stop of stops.slice(0, 8)) {
    const kind = stop.kind === 'station' ? 'station' : stop.kind === 'airport' ? 'airport' : 'other';
    add(stop.name, kind, stop.name, stop.instructions?.trim() || null);
  }
  return list;
}

export const siteUrl = (site: string, slug: string) => `${site.replace(/\/+$/, '')}/s/${slug}`;

/** The key that lets the manager see the site before it is online (the address alone answers 404 until then). */
export const sitePreviewKey = (operatorId: string, secret: string) =>
  createHmac('sha256', secret).update(`operator-site:${operatorId}`).digest('hex').slice(0, 20);
