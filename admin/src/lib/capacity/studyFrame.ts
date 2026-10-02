import { makeFrame, type Frame } from "./projection";
import type { GeoPolygon } from "./types";

/** A metric frame anchored on a polygon's first vertex (scale 1 unless given). */
export function estimateFrame(polygon: GeoPolygon, scale = 1): Frame {
  return makeFrame(polygon.coordinates[0][0], scale);
}
