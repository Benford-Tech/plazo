import { fr } from "./fr";
import type { CancellationPolicy, ListingService } from "./types";

/**
 * The tags travellers see on a Plazo result (14/10/2026, direction C), for the « Aperçu dans les résultats » of
 * « Ma fiche » and of the platform review. Same rules as the site (site/src/lib/highlights.ts, `shuttleBox` and
 * `factChips`) and the app (mobile/lib/src/core/helpers/highlights.dart): keep the three in step.
 */

export interface TaggedListing {
  services: ListingService[];
  shuttleMinutes: number | null;
  /** The declared average wait; null or absent when not declared. */
  shuttleWaitMinutes?: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
}

export interface ShuttleTag {
  /** Ride to the terminal, in minutes; null when unknown (0 counts as unknown, as on the site). */
  rideMinutes: number | null;
  /** Declared average wait; null when not declared (0 is a declared figure). */
  waitMinutes: number | null;
}

/** « Navette gratuite · trajet N min · attente moy. N min »: only for a parking that offers the shuttle. */
export function shuttleTag(listing: Pick<TaggedListing, "services" | "shuttleMinutes" | "shuttleWaitMinutes">): ShuttleTag | null {
  if (!listing.services.includes("shuttle")) return null;
  return { rideMinutes: listing.shuttleMinutes || null, waitMinutes: listing.shuttleWaitMinutes ?? null };
}

export type TagIcon = "outdoor" | "covered" | "keys" | "open24h" | "fenced" | "ev" | "cancel" | "warning";

export interface ListingTag {
  icon: TagIcon;
  label: string;
  /** Longer wording for the tooltip and assistive technology, when the label is terse. */
  title?: string;
}

/** Opening hours that only say « 24h/24 » (or « 24/7 »): the same tag as the service. */
const ROUND_THE_CLOCK = /^(ouvert\s+)?24\s*h?\s*\/\s*(24|7)\s*h?$/i;

/**
 * The tags after the shuttle, in the site's order: outdoor or covered, the keys (handed to a valet or kept), the opening
 * (« Ouvert 24h/24 » from the service or hours that say so, else « Ouvert 6h–23h » from the hours typed, nothing without
 * either), then fenced, EV charging and the cancellation terms last.
 */
export function listingTags(listing: Pick<TaggedListing, "services" | "openingHours" | "cancellationPolicy">): ListingTag[] {
  const t = fr.plazo.previewTags;
  const has = (s: ListingService) => listing.services.includes(s);
  const tags: ListingTag[] = [];
  tags.push(has("covered") ? { icon: "covered", label: t.covered } : { icon: "outdoor", label: t.outdoor });
  tags.push({ icon: "keys", label: has("valet") ? t.keysValet : t.keysSelf });
  const hours = listing.openingHours?.trim() || null;
  if (has("open_24h") || (hours && ROUND_THE_CLOCK.test(hours))) tags.push({ icon: "open24h", label: t.open24h });
  // Hours typed as a sentence (« Ouvert de 5h à 23h ») are not prefixed twice.
  else if (hours) tags.push({ icon: "open24h", label: t.openHours(hours.replace(/^ouvert\s+/i, "")) });
  if (has("fenced")) tags.push({ icon: "fenced", label: t.fenced });
  if (has("ev_charging")) tags.push({ icon: "ev", label: t.ev, title: t.evTitle });
  const policy = listing.cancellationPolicy;
  tags.push({ icon: policy === "non_refundable" ? "warning" : "cancel", label: t.cancel[policy], title: t.cancelTitle[policy] });
  return tags;
}
