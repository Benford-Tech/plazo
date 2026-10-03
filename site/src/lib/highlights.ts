import { fr } from "./fr";
import { formatKm } from "./listing";
import { formatEuros } from "./money";
import type { CancellationPolicy, ListingSummary, SearchResult } from "./types";

/**
 * What reassures a traveller at a glance: the price per day, the badges of the results ("Le moins
 * cher", "Navette la plus rapide"), the fact chips of a card and the trust tiles of a parking page.
 * The app has the same rules (mobile/lib/src/core/helpers/highlights.dart).
 */

/** Total ÷ billable days, rounded to the cent: 4500 for 8 days -> 563. */
export function pricePerDayCents(totalCents: number, days: number): number {
  if (days <= 0) return totalCents;
  return Math.round(totalCents / days);
}

/** "5,63 €/jour" */
export function perDayLabel(totalCents: number, days: number): string {
  return fr.highlights.perDay(formatEuros(pricePerDayCents(totalCents, days)));
}

export type Badge = "cheapest" | "fastestShuttle";

/** Order of the badges when a card carries both. */
export const BADGE_ORDER: Badge[] = ["cheapest", "fastestShuttle"];

/**
 * Badges of the displayed results, by slug: the lowest total (ties: first) and the shortest shuttle
 * ride (ties: first), among the bookable results. Nothing when there is only one to compare.
 */
export function resultBadges(results: SearchResult[]): Map<string, Badge[]> {
  const badges = new Map<string, Badge[]>();
  const bookable = results.filter(r => r.available && r.priceCents !== null);
  if (bookable.length < 2) return badges;
  const add = (slug: string, badge: Badge) => badges.set(slug, [...(badges.get(slug) ?? []), badge]);
  add(bookable.reduce((a, b) => (b.priceCents! < a.priceCents! ? b : a)).slug, "cheapest");
  const withShuttle = bookable.filter(r => r.services.includes("shuttle") && r.shuttleMinutes !== null && r.shuttleMinutes > 0);
  if (withShuttle.length > 0) add(withShuttle.reduce((a, b) => (b.shuttleMinutes! < a.shuttleMinutes! ? b : a)).slug, "fastestShuttle");
  for (const [slug, list] of badges) badges.set(slug, BADGE_ORDER.filter(b => list.includes(b)));
  return badges;
}

export type ChipIcon = "shuttle" | "fenced" | "covered" | "ev" | "valet" | "cancel" | "warning";

export interface FactChip {
  icon: ChipIcon;
  label: string;
  /** Longer wording for assistive technology and the tooltip, when the label is terse. */
  title?: string;
}

const CANCEL_CHIP: Record<CancellationPolicy, string> = {
  free_until_arrival: fr.highlights.cancelChip.untilArrival,
  free_24h: fr.highlights.cancelChip.h24,
  free_48h: fr.highlights.cancelChip.h48,
  non_refundable: fr.highlights.cancelChip.nonRefundable,
};

/** Chips of a result card: shuttle minutes, fenced, covered, EV charging, valet, then cancellation. */
export function factChips(listing: ListingSummary): FactChip[] {
  const chips: FactChip[] = [];
  const has = (s: string) => listing.services.includes(s);
  if (has("shuttle") && listing.shuttleMinutes) {
    chips.push({ icon: "shuttle", label: fr.highlights.shuttleChip(listing.shuttleMinutes), title: fr.parking.shuttleValue(listing.shuttleMinutes) });
  }
  if (has("fenced")) chips.push({ icon: "fenced", label: fr.servicesShort.fenced });
  if (has("covered")) chips.push({ icon: "covered", label: fr.servicesShort.covered });
  if (has("ev_charging")) chips.push({ icon: "ev", label: fr.highlights.evChip, title: fr.services.ev_charging });
  if (has("valet")) chips.push({ icon: "valet", label: fr.servicesShort.valet });
  const policy = listing.cancellationPolicy;
  const label = CANCEL_CHIP[policy];
  if (label) chips.push({ icon: policy === "non_refundable" ? "warning" : "cancel", label, title: fr.cancellation[policy] });
  return chips;
}

export type TileKind = "shuttle" | "security" | "cancellation" | "keys";

export interface TrustTile {
  kind: TileKind;
  title: string;
  text: string;
}

/**
 * The trust band of a parking page, in this order: shuttle, security, cancellation, keys. A tile
 * without data (no shuttle time, no security service) is left out.
 */
export function trustTiles(listing: Pick<ListingSummary, "services" | "shuttleMinutes" | "openingHours" | "cancellationPolicy">): TrustTile[] {
  const t = fr.highlights.tiles;
  const has = (s: string) => listing.services.includes(s);
  const tiles: TrustTile[] = [];
  if (has("shuttle") && listing.shuttleMinutes) {
    const hours = listing.openingHours ?? (has("open_24h") ? fr.servicesShort.open_24h : null);
    tiles.push({ kind: "shuttle", title: t.shuttle(listing.shuttleMinutes), text: hours ? t.shuttleHours(hours) : t.shuttleFree });
  }
  const security = [has("fenced") ? t.fenced : null, has("cctv") ? t.cctv : null].filter((s): s is string => !!s);
  if (security.length > 0) tiles.push({ kind: "security", title: t.secured, text: security.join(", ") });
  const policy = listing.cancellationPolicy;
  if (policy === "non_refundable") tiles.push({ kind: "cancellation", title: t.nonRefundable, text: t.nonRefundableText });
  else if (t.cancellationText[policy]) tiles.push({ kind: "cancellation", title: t.freeCancellation, text: t.cancellationText[policy] });
  tiles.push(has("valet") ? { kind: "keys", title: t.valet, text: t.valetText } : { kind: "keys", title: t.selfPark, text: t.selfParkText });
  return tiles.slice(0, 4);
}

/** "À 4,2 km des terminaux · Extérieur · Recharge électrique" */
export function factsLine(listing: Pick<ListingSummary, "services" | "distanceKm">): string {
  const has = (s: string) => listing.services.includes(s);
  const parts: string[] = [];
  if (listing.distanceKm !== null && listing.distanceKm !== undefined) parts.push(fr.highlights.kmFromTerminals(formatKm(listing.distanceKm)));
  parts.push(has("covered") ? fr.parking.covered : fr.parking.outdoor);
  if (has("ev_charging")) parts.push(fr.services.ev_charging);
  return parts.join(" · ");
}
