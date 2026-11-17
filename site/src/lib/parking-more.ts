import { fr } from "./fr";
import type { ParkingResponse } from "./types";

/**
 * B « fiche parking enrichie » (17/11/2026): what the blocks under the presentation say, from the parking's real settings
 * only. A question whose answer the parking never gave is left out (no opening hours: no question about the night).
 */

/** The price grid, shortest package first, and the extra day when the parking sets one. */
export function priceRows(pricing: ParkingResponse["parking"]["pricing"]): { days: number; priceCents: number }[] {
  return [...pricing.tiers].sort((a, b) => a.days - b.days);
}

/** The questions of the parking's FAQ (shown and marked up for search engines), each with an answer drawn from its data. */
export function parkingFaq({ airport, parking }: Pick<ParkingResponse, "airport" | "parking">): [string, string][] {
  const q = fr.parkingMore.faq;
  const faq: [string, string][] = [];
  const shuttle = parking.services.includes("shuttle");
  if (shuttle && parking.shuttleMinutes) {
    faq.push([q.shuttleQ, q.shuttleA(parking.shuttleMinutes, airport.code === "LYS", parking.shuttleWaitMinutes ?? null)]);
  }
  if (parking.services.includes("open_24h")) faq.push([q.hoursQ, q.hoursA24]);
  else if (parking.openingHours?.trim()) faq.push([q.hoursQ, q.hoursA(parking.openingHours.trim())]);
  faq.push([q.keysQ, parking.services.includes("valet") ? q.keysValet : q.keysSelf]);
  if (shuttle) faq.push([q.delayQ, q.delayA]);
  faq.push([q.cancelQ, q.cancelA[parking.cancellationPolicy]]);
  if (parking.payment === "online") faq.push([q.payQ, q.payA]);
  return faq;
}
