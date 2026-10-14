import { fr } from "./fr";
import { formatKm } from "./listing";
import { formatEuros } from "./money";
import type { CancellationPolicy, ListingSummary, SearchResult } from "./types";

/**
 * What reassures a traveller at a glance: the price per day, the badges of the results ("Le moins
 * cher", "Navette la plus rapide"), the shuttle box and the fact chips of a card and the trust tiles of a parking page.
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

export type ChipIcon = "shuttle" | "outdoor" | "covered" | "keys" | "open24h" | "fenced" | "ev" | "cancel" | "warning";

export interface FactChip {
  icon: ChipIcon;
  label: string;
  /** Wording of a narrow card (phones, the column next to the map), when the label is long. */
  short?: string;
  /** Longer wording for assistive technology and the tooltip, when the label is terse. */
  title?: string;
}

const CANCEL_CHIP: Record<CancellationPolicy, string> = {
  free_until_arrival: fr.highlights.cancelChip.untilArrival,
  free_24h: fr.highlights.cancelChip.h24,
  free_48h: fr.highlights.cancelChip.h48,
  non_refundable: fr.highlights.cancelChip.nonRefundable,
};

type Tagged = Pick<ListingSummary, "services" | "openingHours">;

/** Opening hours that only say « 24h/24 » (or « 24/7 »): the same tag as the service. */
const ROUND_THE_CLOCK = /^(ouvert\s+)?24\s*h?\s*\/\s*(24|7)\s*h?$/i;

/** « Ouvert 24h/24 » (service, or hours that say so), else « Ouvert 6h–23h » from the hours typed; null without either. */
function opening(listing: Tagged): { open24h: boolean; hours: string | null } | null {
  const hours = listing.openingHours?.trim() || null;
  if (listing.services.includes("open_24h") || (hours && ROUND_THE_CLOCK.test(hours))) return { open24h: true, hours: null };
  if (!hours) return null;
  // Hours typed as a sentence (« Ouvert de 5h à 23h ») are not prefixed twice.
  return { open24h: false, hours: hours.replace(/^ouvert\s+/i, "") };
}

/**
 * Tags of a card (14/10/2026, direction C; the shuttle is in its own box, `shuttleBox`): outdoor or covered, the keys
 * (handed to a valet or kept), the opening, then fenced, EV charging and the cancellation terms last.
 */
export function factChips(listing: Pick<ListingSummary, "services" | "openingHours" | "cancellationPolicy">): FactChip[] {
  const c = fr.highlights.chips;
  const chips: FactChip[] = [];
  const has = (s: string) => listing.services.includes(s);
  chips.push(has("covered") ? { icon: "covered", label: c.covered } : { icon: "outdoor", label: c.outdoor });
  chips.push(has("valet") ? { icon: "keys", label: c.keysValet, short: c.keysValetShort } : { icon: "keys", label: c.keysSelf, short: c.keysSelfShort });
  const open = opening(listing);
  if (open?.open24h) chips.push({ icon: "open24h", label: c.open24h, short: c.open24hShort });
  else if (open?.hours) chips.push({ icon: "open24h", label: c.openHours(open.hours) });
  if (has("fenced")) chips.push({ icon: "fenced", label: fr.servicesShort.fenced });
  if (has("ev_charging")) chips.push({ icon: "ev", label: fr.highlights.evChip, title: fr.services.ev_charging });
  const policy = listing.cancellationPolicy;
  const label = CANCEL_CHIP[policy];
  if (label) chips.push({ icon: policy === "non_refundable" ? "warning" : "cancel", label, title: fr.cancellation[policy] });
  return chips;
}

export interface ShuttleFacts {
  /** Ride to the terminal, in minutes; null when unknown. */
  rideMinutes: number | null;
  /** Average wait the operator declares; null when not declared (the figure is left out). */
  waitMinutes: number | null;
  /** The parking shows its shuttles to the travellers (R-B + I-C): the box carries the live rail (L3). */
  live: boolean;
}

/** The shuttle box of a card (« encart navette »): only for a parking that offers the shuttle. */
export function shuttleBox(listing: Pick<ListingSummary, "services" | "shuttleMinutes" | "shuttleWaitMinutes" | "liveShuttle">): ShuttleFacts | null {
  if (!listing.services.includes("shuttle")) return null;
  return {
    rideMinutes: listing.shuttleMinutes || null,
    waitMinutes: listing.shuttleWaitMinutes ?? null,
    live: listing.liveShuttle === true,
  };
}

export type TileKind = "shuttle" | "outdoor" | "covered" | "keys" | "opening" | "cancellation";

export interface TrustTile {
  kind: TileKind;
  title: string;
  text: string;
  /** The shuttle is shown live: the title carries the breathing dot. */
  live?: boolean;
}

/**
 * The trust band of a parking page (« L’essentiel », 14/10/2026), in this order: shuttle, outdoor or covered, keys,
 * opening, cancellation. A tile without data (no shuttle, no hours) is left out; up to five.
 */
export function trustTiles(
  listing: Pick<ListingSummary, "services" | "shuttleMinutes" | "shuttleWaitMinutes" | "liveShuttle" | "openingHours" | "cancellationPolicy">,
): TrustTile[] {
  const t = fr.highlights.tiles;
  const has = (s: string) => listing.services.includes(s);
  const tiles: TrustTile[] = [];
  const shuttle = shuttleBox(listing);
  if (shuttle) {
    const parts = [
      shuttle.live ? t.free : null,
      shuttle.rideMinutes ? t.ride(shuttle.rideMinutes) : null,
      shuttle.waitMinutes !== null ? t.wait(shuttle.waitMinutes) : null,
      shuttle.live ? t.followLive : null,
    ].filter((p): p is string => !!p);
    const text = parts.length > 0 ? parts.join(" · ") : t.toTerminals;
    tiles.push({
      kind: "shuttle",
      title: shuttle.live ? t.shuttleLive : t.shuttleFree,
      text: text.charAt(0).toUpperCase() + text.slice(1),
      ...(shuttle.live ? { live: true } : {}),
    });
  }
  const security = [has("fenced") ? t.fenced : null, has("cctv") ? t.cctv : null].filter((s): s is string => !!s).join(", ");
  tiles.push(
    has("covered")
      ? { kind: "covered", title: t.covered, text: security || t.coveredText }
      : { kind: "outdoor", title: t.outdoor, text: security || t.outdoorText },
  );
  tiles.push(has("valet") ? { kind: "keys", title: t.keysValet, text: t.keysValetText } : { kind: "keys", title: t.keysSelf, text: t.keysSelfText });
  const open = opening(listing);
  if (open?.open24h) tiles.push({ kind: "opening", title: t.open24h, text: t.open24hText });
  else if (open?.hours) tiles.push({ kind: "opening", title: t.openHours(open.hours), text: t.openHoursText });
  const policy = listing.cancellationPolicy;
  if (policy === "non_refundable") tiles.push({ kind: "cancellation", title: t.nonRefundable, text: t.nonRefundableText });
  else if (t.cancellationText[policy]) tiles.push({ kind: "cancellation", title: t.freeCancellation, text: t.cancellationText[policy] });
  return tiles.slice(0, 5);
}

/** "À 4,2 km des terminaux · Recharge électrique" (outdoor or covered is a tile of the band since 14/10/2026). */
export function factsLine(listing: Pick<ListingSummary, "services" | "distanceKm">): string {
  const has = (s: string) => listing.services.includes(s);
  const parts: string[] = [];
  if (listing.distanceKm !== null && listing.distanceKm !== undefined) parts.push(fr.highlights.kmFromTerminals(formatKm(listing.distanceKm)));
  if (has("ev_charging")) parts.push(fr.services.ev_charging);
  return parts.join(" · ");
}
