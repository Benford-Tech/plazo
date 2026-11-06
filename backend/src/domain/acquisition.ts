/**
 * SEO local, measurement (06/11/2026, choice A + M2 of https://claude.ai/artifact/VjbSdoTMnjn4nGx1uNDipb): where a visitor of
 * the traveller site came from (the site classifies it in the browser, `site/src/lib/acquisition.ts`), checked here before it
 * is counted or kept on a booking. No visitor is kept: a booking keeps its origin, visits are counted per day.
 */

export const ACQUISITION_SOURCES = ['search', 'direct', 'referral', 'social', 'campaign', 'app'] as const;
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

export interface Acquisition {
  source: AcquisitionSource;
  /** The engine (google), site (lyon-aeroport.fr) or campaign; '' when none. */
  detail: string;
  /** The page the visit started on ("/lyon-saint-exupery/guide/parking-pas-cher"); '' when unknown. */
  landing: string;
}

const DETAIL_RE = /^[a-z0-9][a-z0-9._-]{0,59}$/;
const LANDING_MAX = 200;

/** A landing page: a path of the site, without its query or fragment; never the pro space or the API. */
export function cleanLanding(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let path = value.trim().split(/[?#]/)[0];
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (path.length > LANDING_MAX) return null;
  if (/^\/(api|pro|_next)(\/|$)/.test(path)) return null;
  // Booking pages carry a reference: grouped under their section.
  if (path.startsWith('/ma-reservation')) return '/ma-reservation';
  if (path.startsWith('/a/')) return '/a';
  if (!/^[\p{L}\p{N}/._~-]*$/u.test(path)) return null;
  return path.toLowerCase();
}

/** The origin sent by the site, or null when it is not one. */
export function cleanAcquisition(value: unknown): Acquisition | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const source = typeof v.source === 'string' ? (v.source as AcquisitionSource) : null;
  if (!source || !(ACQUISITION_SOURCES as readonly string[]).includes(source) || source === 'app') return null;
  const rawDetail = typeof v.detail === 'string' ? v.detail.trim().toLowerCase() : '';
  const detail = rawDetail && DETAIL_RE.test(rawDetail) ? rawDetail : '';
  const landing = cleanLanding(v.landing) ?? '';
  return { source, detail, landing };
}

/** A day in Paris, "YYYY-MM-DD" (the site's audience is French; the platform counts in Paris). */
export function parisDay(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}
