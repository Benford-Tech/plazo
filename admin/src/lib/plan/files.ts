import { fromL93, toL93, type LonLat, type XY } from "@/lib/capacity/projection";
import type { SpotState } from "./occupation";

/**
 * O-A on the plan (06/10/2026): the geometry behind the car icons, the manoeuvring strip and the
 * file marks. Every spot of a valet plan knows its rank (`depth`) and its file (`fileKey`); a
 * self-park plan has neither, and the plan is drawn as before.
 */

/** Metres of manoeuvring room kept clear in front of every file, between the aisle and the first car. */
export const MANOEUVRE_M = 3;

const CAR_SVG_HEAD_UP = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="52" viewBox="0 0 26 52"><rect x="4" y="2" width="18" height="48" rx="6" fill="${fill}" stroke="#1A1D1A" stroke-width="1.5"/><path d="M6 12 l5 -5 h4 l5 5 z" fill="#1A1D1A" opacity=".55"/><path d="M6 36 l5 5 h4 l5 -5 z" fill="#1A1D1A" opacity=".55"/><rect x="7" y="38" width="12" height="7" rx="2" fill="#1A1D1A" opacity=".35"/><rect x="2" y="6" width="4" height="5" rx="1" fill="#1A1D1A"/><rect x="20" y="6" width="4" height="5" rx="1" fill="#1A1D1A"/><rect x="2" y="38" width="4" height="5" rx="1" fill="#1A1D1A"/><rect x="20" y="38" width="4" height="5" rx="1" fill="#1A1D1A"/></svg>`;

/** The car icons, one per tone, drawn nose up (north) so MapLibre rotates them by the file's bearing. */
export function carIcons(colours: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(colours).map(([tone, fill]) => [`car-${tone}`, CAR_SVG_HEAD_UP(fill)]));
}

export function ringCentroid(ring: LonLat[]): LonLat {
  const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring;
  const xy = pts.map(toL93);
  const c: XY = [xy.reduce((s, p) => s + p[0], 0) / xy.length, xy.reduce((s, p) => s + p[1], 0) / xy.length];
  return fromL93(c);
}

/** Bearing in degrees, clockwise from north, from `a` to `b`. */
export function bearingDeg(a: LonLat, b: LonLat): number {
  const pa = toL93(a);
  const pb = toL93(b);
  return ((Math.atan2(pb[0] - pa[0], pb[1] - pa[1]) * 180) / Math.PI + 360) % 360;
}

/** The direction of the ring's longest side, as a bearing (0–180). */
export function longAxisBearing(ring: LonLat[]): number {
  let best = 0;
  let bestLength = -1;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = toL93(ring[i]);
    const b = toL93(ring[i + 1]);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > bestLength) {
      bestLength = length;
      best = ((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI + 360) % 180;
    }
  }
  return best;
}

export interface SpotFile {
  key: string;
  /** From the aisle (depth 0) to the back. */
  spots: SpotState[];
}

export function filesOf(spots: SpotState[]): SpotFile[] {
  const map = new Map<string, SpotState[]>();
  for (const s of spots) if (s.fileKey) map.set(s.fileKey, [...(map.get(s.fileKey) ?? []), s]);
  // Rank order inside each file.
  return [...map.entries()].map(([key, list]) => ({ key, spots: [...list].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0)) }));
}

/**
 * Where the car's nose points: towards the aisle, i.e. towards the spot one rank closer to it
 * (or away from the one behind, for the first rank); alone, along the spot's long side.
 */
export function headingOf(spot: SpotState, file: SpotFile | undefined): number {
  const centre = ringCentroid(spot.geometry);
  const depth = spot.depth ?? null;
  if (file && depth !== null) {
    const front = file.spots.find(s => s.depth === depth - 1);
    if (front) return bearingDeg(centre, ringCentroid(front.geometry));
    const behind = file.spots.find(s => s.depth === depth + 1);
    if (behind) return (bearingDeg(ringCentroid(behind.geometry), centre) + 360) % 360;
  }
  return longAxisBearing(spot.geometry);
}

/** Moves a WGS84 point by `metres` along `bearing` (degrees from north). */
export function offsetM(p: LonLat, bearing: number, metres: number): LonLat {
  const xy = toL93(p);
  const rad = (bearing * Math.PI) / 180;
  return fromL93([xy[0] + Math.sin(rad) * metres, xy[1] + Math.cos(rad) * metres]);
}

/**
 * The manoeuvring strip of a file: the first spot's front edge (the side facing the aisle)
 * pushed `MANOEUVRE_M` metres towards the aisle. Null when the file has no rank.
 */
export function manoeuvreStrip(file: SpotFile): LonLat[] | null {
  const first = file.spots[0];
  if (!first || first.depth === null || first.depth === undefined) return null;
  const heading = headingOf(first, file);
  const ring = first.geometry.slice(0, -1);
  // The front edge: the side whose midpoint lies furthest along the heading.
  const centre = toL93(ringCentroid(first.geometry));
  const rad = (heading * Math.PI) / 180;
  const along = (p: LonLat) => {
    const xy = toL93(p);
    return (xy[0] - centre[0]) * Math.sin(rad) + (xy[1] - centre[1]) * Math.cos(rad);
  };
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const score = (along(a) + along(b)) / 2;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  const a = ring[best];
  const b = ring[(best + 1) % ring.length];
  const a2 = offsetM(a, heading, MANOEUVRE_M);
  const b2 = offsetM(b, heading, MANOEUVRE_M);
  return [a, b, b2, a2, a];
}
