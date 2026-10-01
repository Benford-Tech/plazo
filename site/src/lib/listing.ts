import { serviceLabel } from "./fr";
import type { CancellationPolicy, ListingSummary } from "./types";

/** 3.5 -> "3,5" */
export function formatKm(km: number): string {
  return (Math.round(km * 10) / 10).toString().replace(".", ",");
}

const CANCELLATION_FACT: Record<CancellationPolicy, string> = {
  free_until_arrival: "Annulation gratuite",
  free_24h: "Annulation gratuite 24 h",
  free_48h: "Annulation gratuite 48 h",
  non_refundable: "Non annulable",
};

/** "Navette 8 min · 3,5 km · Clôturé · Vidéosurveillance · Annulation gratuite 24 h" */
export function listingFacts(listing: ListingSummary, withCancellation = true): string {
  const parts: string[] = [];
  if (listing.shuttleMinutes) parts.push(`Navette ${listing.shuttleMinutes} min`);
  if (listing.distanceKm !== null && listing.distanceKm !== undefined) parts.push(`${formatKm(listing.distanceKm)} km`);
  for (const s of listing.services) if (s !== "shuttle") parts.push(serviceLabel(s, true));
  if (withCancellation) parts.push(CANCELLATION_FACT[listing.cancellationPolicy] ?? "");
  return parts.filter(Boolean).join(" · ");
}

export function isFreeCancellation(policy: CancellationPolicy): boolean {
  return policy !== "non_refundable";
}

/** Google Maps search for an address (itinerary links; no API key needed). */
export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Google Maps directions to an address. */
export function directionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
