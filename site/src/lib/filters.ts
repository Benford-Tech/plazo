import { encodeQueryValue, param } from "./dates";
import type { SearchResult, Service } from "./types";

/** Filters and sort of the results page, read from French query params. */

export const SERVICE_SLUGS: Record<Service, string> = {
  shuttle: "navette",
  valet: "voiturier",
  covered: "couvert",
  ev_charging: "recharge",
  open_24h: "24h",
  fenced: "cloture",
  cctv: "videosurveillance",
};

const SERVICE_BY_SLUG = Object.fromEntries(Object.entries(SERVICE_SLUGS).map(([k, v]) => [v, k as Service])) as Record<string, Service>;

/** Order of the services in the filters column. */
export const FILTER_SERVICES: Service[] = ["shuttle", "valet", "covered", "ev_charging", "open_24h", "fenced", "cctv"];

export const SHUTTLE_LIMITS = [10, 15] as const;
export type ShuttleLimit = (typeof SHUTTLE_LIMITS)[number];

export const SORT_KEYS = ["prix", "navette", "distance"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface Filters {
  services: Service[];
  freeCancellation: boolean;
  maxShuttle: ShuttleLimit | null;
  /** Maximum total price, in cents; null = no limit. */
  maxPriceCents: number | null;
  sort: SortKey;
}

type Params = Record<string, string | string[] | undefined>;

function all(params: Params, name: string): string[] {
  const value = params[name];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** ?service=navette&service=couvert&annulation=gratuite&navette=10&prix_max=60&tri=navette */
export function parseFilters(params: Params): Filters {
  const services = [...new Set(all(params, "service").map(s => SERVICE_BY_SLUG[s]).filter(Boolean))];
  const shuttle = Number(param(params, "navette"));
  const maxShuttle = (SHUTTLE_LIMITS as readonly number[]).includes(shuttle) ? (shuttle as ShuttleLimit) : null;
  const priceRaw = param(params, "prix_max");
  const price = priceRaw ? Number(priceRaw) : NaN;
  const maxPriceCents = Number.isFinite(price) && price >= 0 ? Math.round(price * 100) : null;
  const sortRaw = param(params, "tri");
  const sort = (SORT_KEYS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as SortKey) : "prix";
  return { services, freeCancellation: param(params, "annulation") === "gratuite", maxShuttle, maxPriceCents, sort };
}

/** True when at least one filter (not the sort) narrows the results. */
export function hasActiveFilters(f: Filters): boolean {
  return f.services.length > 0 || f.freeCancellation || f.maxShuttle !== null || f.maxPriceCents !== null;
}

/** The results page shows the map beside the list (?carte=1): shareable, and a plain link without JavaScript. */
export function mapShown(params: Params): boolean {
  return param(params, "carte") === "1";
}

/** Query string of a results page: stay first, then filters and sort (defaults omitted), then the map. */
export function resultsQuery(stay: { arrivee: string; retour: string }, f: Filters, map = false): string {
  const parts = [`arrivee=${encodeQueryValue(stay.arrivee)}`, `retour=${encodeQueryValue(stay.retour)}`];
  for (const s of f.services) parts.push(`service=${encodeURIComponent(SERVICE_SLUGS[s])}`);
  if (f.freeCancellation) parts.push("annulation=gratuite");
  if (f.maxShuttle !== null) parts.push(`navette=${f.maxShuttle}`);
  if (f.maxPriceCents !== null) parts.push(`prix_max=${Math.round(f.maxPriceCents / 100)}`);
  if (f.sort !== "prix") parts.push(`tri=${f.sort}`);
  if (map) parts.push("carte=1");
  return `?${parts.join("&")}`;
}

function byNullable(a: number | null, b: number | null): number {
  return (a ?? Infinity) - (b ?? Infinity);
}

/** Results matching the filters, available first, then in the chosen order. */
export function applyFilters(results: SearchResult[], f: Filters): SearchResult[] {
  const kept = results.filter(r => {
    if (f.services.some(s => !r.services.includes(s))) return false;
    if (f.freeCancellation && r.cancellationPolicy === "non_refundable") return false;
    if (f.maxShuttle !== null && (r.shuttleMinutes === null || r.shuttleMinutes > f.maxShuttle)) return false;
    if (f.maxPriceCents !== null && (r.priceCents === null || r.priceCents > f.maxPriceCents)) return false;
    return true;
  });
  const order = (a: SearchResult, b: SearchResult) => {
    if (f.sort === "navette") return byNullable(a.shuttleMinutes, b.shuttleMinutes) || byNullable(a.priceCents, b.priceCents);
    if (f.sort === "distance") return byNullable(a.distanceKm, b.distanceKm) || byNullable(a.priceCents, b.priceCents);
    return byNullable(a.priceCents, b.priceCents);
  };
  return [...kept].sort((a, b) => Number(b.available) - Number(a.available) || order(a, b));
}

/** Number of results offering each service (over all results, so counts do not jump while filtering). */
export function serviceCounts(results: SearchResult[]): Record<Service, number> {
  const counts = Object.fromEntries(FILTER_SERVICES.map(s => [s, 0])) as Record<Service, number>;
  for (const r of results) for (const s of r.services) if (s in counts) counts[s as Service] += 1;
  return counts;
}

/** Upper bound of the price slider: highest price, rounded up to 10 €. */
export function priceCeilingCents(results: SearchResult[]): number {
  const prices = results.map(r => r.priceCents).filter((p): p is number => p !== null);
  if (!prices.length) return 0;
  return Math.ceil(Math.max(...prices) / 1000) * 1000;
}

/** The cheapest available result, when there is something to compare (2 or more available). */
export function cheapestSlug(results: SearchResult[]): string | null {
  const available = results.filter(r => r.available && r.priceCents !== null);
  if (available.length < 2) return null;
  return available.reduce((a, b) => (b.priceCents! < a.priceCents! ? b : a)).slug;
}
