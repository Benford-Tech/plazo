import type { ShuttleDirection } from "./types";

type LatLng = { lat: number; lng: number };

/**
 * I-C (06/10/2026): the shuttle pictogram — a minibus seen from the side (Material "airport_shuttle"),
 * turned the way it drives. In the pro space: dark green to the terminal (drop-off), bright green to
 * the airport to fetch travellers (pickup), grey without a position.
 */
export const SHUTTLE_PATH =
  "M17 5H3c-1.1 0-2 .89-2 2v9h2c0 1.65 1.34 3 3 3s3-1.35 3-3h5.5c0 1.65 1.34 3 3 3s3-1.35 3-3H23v-5l-6-6zM3 11V7h4v4H3zm3 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM13 11H9V7h4v4zm4.5 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 11V7h1l4 4h-5z";

export type ShuttleTone = "terminal" | "airport" | "unknown";
export const SHUTTLE_COLOURS: Record<ShuttleTone, string> = { terminal: "#1E5E2E", airport: "#16A34A", unknown: "#6B7280" };

export function shuttleTone(direction: ShuttleDirection, hasPosition: boolean): ShuttleTone {
  if (!hasPosition) return "unknown";
  return direction === "dropoff" ? "terminal" : "airport";
}

/** The bus faces east at rest; a heading west mirrors it so it never drives upside down. */
export function shuttleTransform(heading: number | null): string {
  if (heading === null) return "";
  const h = ((heading % 360) + 360) % 360;
  return h <= 180 ? `rotate(${h - 90}deg)` : `scaleX(-1) rotate(${270 - h}deg)`;
}

/** Compass bearing from one position to the next (0 = north); null under ~8 m (GPS jitter). */
export function bearing(from: LatLng, to: LatLng): number | null {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dist = Math.hypot((to.lat - from.lat) * 111_000, (to.lng - from.lng) * 111_000 * Math.cos(toRad(from.lat)));
  if (dist < 8) return null;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Headings after a poll, from the previous positions; kept when the bus barely moved. */
export function nextHeadings(before: Map<string, { position: LatLng; heading: number | null }>, trips: { id: string; position: LatLng | null }[]) {
  const next = new Map<string, { position: LatLng; heading: number | null }>();
  for (const t of trips) {
    if (!t.position) continue;
    const prev = before.get(t.id);
    next.set(t.id, { position: t.position, heading: prev ? (bearing(prev.position, t.position) ?? prev.heading) : null });
  }
  return next;
}

export function shuttleSvg(size = 20): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${SHUTTLE_PATH}"/></svg>`;
}
