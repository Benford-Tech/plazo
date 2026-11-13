/**
 * Promotions to the Plazo app's travellers (13/11/2026, choix A « Message promo » des maquettes
 * https://claude.ai/artifact/QVEjFhRHjcKpbf5gt8RcpX): a push to the phones that accepted « Offres et bons plans », opening the app's
 * search on an airport and dates, or a parking's page. No price changes. Pure rules: the link, its path, the weekly cap.
 */

/** At most two promotions a week, as the app's switch promises (« deux par semaine au plus »). */
export const PROMOTIONS_PER_WEEK = 2;
export const PROMOTION_WINDOW_MS = 7 * 86400_000;

export type PromotionLink =
  | { kind: 'search'; airport: string; arrival?: string | null; return?: string | null }
  | { kind: 'parking'; airport: string; parking: string; arrival?: string | null; return?: string | null };

export interface PromotionFilters {
  /** Phones that booked at this airport (its slug). */
  airport?: string | null;
  /** Phones with no booking to come. */
  noUpcoming?: boolean;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STAY_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Field errors of a link, as the clients read them (`link.airport`, `link.arrival`…); empty when it is fine. */
export function promotionLinkErrors(link: unknown): Record<string, string> {
  if (link === null || link === undefined) return {};
  if (typeof link !== 'object') return { link: 'invalid' };
  const l = link as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (l.kind !== 'search' && l.kind !== 'parking') errors['link.kind'] = 'invalid';
  if (typeof l.airport !== 'string' || !SLUG.test(l.airport) || l.airport.length > 80) errors['link.airport'] = 'invalid';
  if (l.kind === 'parking' && (typeof l.parking !== 'string' || !SLUG.test(l.parking) || l.parking.length > 80)) {
    errors['link.parking'] = 'invalid';
  }
  const arrival = l.arrival ?? null;
  const ret = l.return ?? null;
  if (arrival !== null && (typeof arrival !== 'string' || !STAY_TIME.test(arrival))) errors['link.arrival'] = 'invalid';
  if (ret !== null && (typeof ret !== 'string' || !STAY_TIME.test(ret))) errors['link.return'] = 'invalid';
  if ((arrival === null) !== (ret === null)) errors[arrival === null ? 'link.arrival' : 'link.return'] = 'required';
  if (typeof arrival === 'string' && typeof ret === 'string' && STAY_TIME.test(arrival) && STAY_TIME.test(ret) && ret <= arrival) {
    errors['link.return'] = 'before_arrival';
  }
  return errors;
}

/** The link kept and sent, reduced to its known fields. */
export function cleanPromotionLink(link: PromotionLink): PromotionLink {
  const dates = link.arrival && link.return ? { arrival: link.arrival, return: link.return } : {};
  return link.kind === 'parking'
    ? { kind: 'parking', airport: link.airport, parking: link.parking, ...dates }
    : { kind: 'search', airport: link.airport, ...dates };
}

/** The path the app (and the site) opens: `/lyon-saint-exupery/recherche?arrivee=…&retour=…` or the parking's page. */
export function promotionPath(link: PromotionLink): string {
  const base = link.kind === 'parking' ? `/${link.airport}/${link.parking}` : `/${link.airport}/recherche`;
  if (!link.arrival || !link.return) return base;
  return `${base}?arrivee=${encodeURIComponent(link.arrival)}&retour=${encodeURIComponent(link.return)}`;
}

/** When the next promotion may go, from the sending times of the last week (null: now). */
export function nextPromotionAt(sentAt: Date[], now: Date): Date | null {
  const recent = sentAt.filter(d => now.getTime() - d.getTime() < PROMOTION_WINDOW_MS).sort((a, b) => a.getTime() - b.getTime());
  if (recent.length < PROMOTIONS_PER_WEEK) return null;
  return new Date(recent[recent.length - PROMOTIONS_PER_WEEK].getTime() + PROMOTION_WINDOW_MS);
}
