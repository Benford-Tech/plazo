import { fr } from "./fr";
import { bearing } from "./shuttle-icon";
import type { AirportLive, LatLng } from "./types";

/**
 * L3 « Le trajet en direct » (14/10/2026): a parking's running shuttles on a small rail from the parking (P) to the
 * terminal, each placed at its real progress. Pure functions; the rail itself is components/LiveShuttleRail.tsx.
 */

/** At most this many minibuses on one rail. */
export const MAX_RAIL_SHUTTLES = 3;
/** A minibus never sits on the P nor on the plane: its progress is kept within 5–95 %. */
export const RAIL_MIN = 0.05;
export const RAIL_MAX = 0.95;

/** Great-circle distance in metres (haversine). */
export function metresBetween(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** distance(parking → shuttle) ÷ distance(parking → airport), clamped to 5–95 %; null when it cannot be measured. */
export function railProgress(parking: LatLng, airport: LatLng, shuttle: LatLng): number | null {
  const route = metresBetween(parking, airport);
  if (!(route > 0)) return null;
  return Math.min(RAIL_MAX, Math.max(RAIL_MIN, metresBetween(parking, shuttle) / route));
}

export interface RailMarker {
  id: string;
  /** 0.05–0.95 from the parking (left) to the terminal (right). */
  progress: number;
  /** The minibus faces the terminal unless its last move went back towards the parking. */
  towardsParking: boolean;
}

export interface RailState {
  /** Running shuttles of the parking right now (with or without a position). */
  running: number;
  markers: RailMarker[];
  /** Age of the freshest position among the parking's running shuttles, in seconds at `serverTime`; null without one. */
  ageSeconds: number | null;
}

/** The angle between two compass bearings, 0–180°. */
function angleBetween(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * The rail of one parking from the airport's live answer: its running shuttles, the freshest first, at most three
 * markers, none for a shuttle without a position (nor when the parking or the airport has no known position).
 */
export function railState(live: AirportLive | null, slug: string, fallbackParking: LatLng | null = null): RailState {
  const shuttles = (live?.shuttles ?? []).filter(s => s.parking === slug);
  const located = shuttles
    .filter(s => s.position)
    .sort((a, b) => (a.positionAgeSeconds ?? Infinity) - (b.positionAgeSeconds ?? Infinity));
  const ages = located.map(s => s.positionAgeSeconds).filter((a): a is number => a !== null);
  const parking = live?.parkings.find(p => p.slug === slug)?.location ?? fallbackParking;
  const airport = live?.airport.location ?? null;
  const markers: RailMarker[] = [];
  if (parking && airport) {
    const route = bearing(parking, airport);
    for (const s of located) {
      if (markers.length >= MAX_RAIL_SHUTTLES) break;
      const progress = railProgress(parking, airport, s.position!);
      if (progress === null) continue;
      const heading = s.heading ?? null;
      markers.push({ id: s.id, progress, towardsParking: heading !== null && route !== null && angleBetween(heading, route) > 90 });
    }
  }
  return { running: shuttles.length, markers, ageSeconds: ages.length > 0 ? Math.min(...ages) : null };
}

export type RailPlace = "terminal1" | "airport";

/** The end of the rail: Terminal 1 at Lyon Saint-Exupéry (Terminal 2 closed on 01/04/2026), the airport elsewhere. */
export function railPlace(airportCode: string | null | undefined): RailPlace {
  return airportCode?.toUpperCase() === "LYS" ? "terminal1" : "airport";
}

/** « Terminal 1 » at Lyon Saint-Exupéry, « Aéroport » elsewhere: the label under the rail. */
export function railDestination(airportCode: string | null | undefined): string {
  return fr.highlights.shuttleBox[railPlace(airportCode)];
}
