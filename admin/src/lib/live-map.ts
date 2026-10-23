import { SHUTTLE_COLOURS, shuttleTone } from "./shuttle-icon";
import type { LiveShuttles, LiveTrip } from "./types";

type LngLat = [number, number];

export interface TripLine {
  tripId: string;
  /** `done`: parking → shuttle (solid); `left`: shuttle → stop (dotted). */
  part: "done" | "left";
  colour: string;
  coordinates: LngLat[];
}

/**
 * Direction B « Halo et trajets » (23/10/2026): the route of each running shuttle with a position,
 * in two pieces — the travelled part from the parking (solid) and what is left to its stop (dotted),
 * both in the colour of its direction. A shuttle without a position, or a parking without coordinates,
 * draws no line.
 */
export function tripLines(live: LiveShuttles): TripLine[] {
  const parking = live.parking;
  if (parking.lat === null || parking.lng === null) return [];
  const from: LngLat = [parking.lng, parking.lat];
  const lines: TripLine[] = [];
  for (const trip of live.trips) {
    if (!trip.position) continue;
    const colour = SHUTTLE_COLOURS[shuttleTone(trip.direction, true)];
    const at: LngLat = [trip.position.lng, trip.position.lat];
    lines.push({
      tripId: trip.id,
      part: "done",
      colour,
      coordinates: [from, at],
    });
    if (trip.stop)
      lines.push({
        tripId: trip.id,
        part: "left",
        colour,
        coordinates: [at, [trip.stop.lng, trip.stop.lat]],
      });
  }
  return lines;
}

export function tripLinesGeoJson(
  live: LiveShuttles,
): GeoJSON.FeatureCollection<
  GeoJSON.LineString,
  { part: string; colour: string }
> {
  return {
    type: "FeatureCollection",
    features: tripLines(live).map((l) => ({
      type: "Feature",
      properties: { part: l.part, colour: l.colour },
      geometry: { type: "LineString", coordinates: l.coordinates },
    })),
  };
}

/** The ETA shown on a stop's plate: the soonest shuttle with a position heading to it, if any. */
export function stopEta(
  live: LiveShuttles,
  stop: { id: string | null; name: string },
): number | null {
  let best: number | null = null;
  for (const trip of live.trips) {
    if (!trip.position || !trip.toStop || !trip.stop) continue;
    if (trip.stop.id !== stop.id || trip.stop.name !== stop.name) continue;
    if (best === null || trip.toStop.etaMinutes < best)
      best = trip.toStop.etaMinutes;
  }
  return best;
}

/** The running shuttles with no position yet: drawn at the parking, side by side. */
export function ghosts(trips: LiveTrip[]): LiveTrip[] {
  return trips.filter((t) => !t.position);
}
