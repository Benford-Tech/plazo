import type { GeocodeResult } from "@/lib/api";
import { fr } from "@/lib/fr";

/** "45.7095, 5.1033" (latitude, longitude, as copied from most maps) → a point. */
export function parseLatLon(text: string): GeocodeResult | null {
  const m = text.trim().match(/^(-?\d{1,2}(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1].replace(",", "."));
  const lon = Number(m[2].replace(",", "."));
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  return { label: fr.capacity.pointLabel(lat, lon), type: "point", lon, lat };
}

