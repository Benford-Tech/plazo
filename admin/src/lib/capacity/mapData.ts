import type { FeatureCollection, MapLabel } from "@/components/capacity/MapView";
import { centroidOf } from "./geometry";
import { distanceM } from "./projection";
import { estimateFrame } from "./studyFrame";
import type { GeoPolygon, LonLat } from "./types";

export const fc = (features: FeatureCollection["features"]): FeatureCollection => ({ type: "FeatureCollection", features });
export const feature = (geometry: unknown, properties: Record<string, unknown> = {}) => ({ type: "Feature" as const, geometry, properties });

/** Labels with the length of every edge of a polygon (at least `min` metres). */
export function edgeLabels(polygon: GeoPolygon | null, scale: number, min = 12): MapLabel[] {
  if (!polygon) return [];
  const ring = polygon.coordinates[0];
  const labels: MapLabel[] = [];
  for (let i = 0; i + 1 < ring.length; i++) {
    const length = distanceM(ring[i], ring[i + 1], scale);
    if (length < min) continue;
    labels.push({
      id: `edge-${i}`,
      lngLat: [(ring[i][0] + ring[i + 1][0]) / 2, (ring[i][1] + ring[i + 1][1]) / 2],
      text: `${Math.round(length)} m`,
      variant: "length",
    });
  }
  return labels;
}

export function polygonCentroid(polygon: GeoPolygon): LonLat {
  const frame = estimateFrame(polygon);
  const c = centroidOf([polygon.coordinates.map(r => r.map(frame.forward))]);
  return c ? frame.inverse(c) : polygon.coordinates[0][0];
}

export function boundsOf(points: LonLat[]): [LonLat, LonLat] | null {
  if (!points.length) return null;
  let [w, s] = points[0];
  let [e, n] = points[0];
  for (const [x, y] of points) {
    w = Math.min(w, x);
    e = Math.max(e, x);
    s = Math.min(s, y);
    n = Math.max(n, y);
  }
  return [
    [w, s],
    [e, n],
  ];
}

/** Every position of a (Multi)Polygon's coordinates. */
export function positionsOf(coordinates: unknown): LonLat[] {
  if (Array.isArray(coordinates) && typeof coordinates[0] === "number") return [coordinates as LonLat];
  return Array.isArray(coordinates) ? coordinates.flatMap(positionsOf) : [];
}

/** Polygons of a GeoJSON Polygon or MultiPolygon (outer rings and holes). */
export function polygonsOf(geometry: { type: string; coordinates: unknown }): GeoPolygon[] {
  if (geometry.type === "Polygon") return [{ type: "Polygon", coordinates: geometry.coordinates as LonLat[][] }];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates as LonLat[][][]).map(c => ({ type: "Polygon", coordinates: c }));
  return [];
}
