import { areaOf, bufferLine, difference, grow, intersection, simplify, union, type Multi } from "./geometry";
import { OUTLINE_SIMPLIFY_M, multiToPolygons, polygonToMulti } from "./estimate";
import type { Frame } from "./projection";
import type { GeoPolygon, LonLat, Zone } from "./types";

/**
 * P-A (07/10/2026): the brush of the zones step. A stroke is the pointer's path on the map; its
 * area is the path widened to the brush width. Painting adds that area to the zones it touches
 * (merging them into one), erasing takes it away (a zone cut in two becomes two zones).
 */

/** Brush widths on offer, in metres on the ground. */
export const BRUSH_WIDTHS_M = [3, 6, 12] as const;
export type BrushWidth = (typeof BRUSH_WIDTHS_M)[number];
/** A piece of zone smaller than this (m²) is dropped after an erase. */
const MIN_PIECE_M2 = 2;
/** Zones separated by less than this (m) count as touching. */
const TOUCH_M = 0.1;

export interface BrushContext {
  frame: Frame;
  outline: GeoPolygon | null;
  /** Names a new zone from its letter (A, B, C…). */
  name: (letter: string) => string;
  newId: () => string;
}

/** The area of a stroke, in the local frame, kept inside the land. */
export function strokeArea(points: LonLat[], widthM: number, ctx: Pick<BrushContext, "frame" | "outline">): Multi {
  if (!points.length) return [];
  const local = points.map(ctx.frame.forward);
  let area = bufferLine(local, widthM / 2);
  if (ctx.outline) area = intersection(area, polygonToMulti(ctx.frame, ctx.outline));
  return area;
}

/** The first zone letter not used by `zones`. */
export function nextLetter(zones: Zone[], name: (letter: string) => string): string {
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!zones.some(z => z.name === name(letter))) return letter;
  }
  return String(zones.length + 1);
}

const toPolygon = (ctx: BrushContext, multi: Multi): GeoPolygon[] => multiToPolygons(ctx.frame, simplify(multi, OUTLINE_SIMPLIFY_M));

function touches(ctx: BrushContext, zone: Zone, area: Multi): boolean {
  return intersection(grow(polygonToMulti(ctx.frame, zone.geometry), TOUCH_M), area).length > 0;
}

/** The zones after a paint stroke: the touched zones and the stroke become one zone (the first's name). */
export function paintZones(zones: Zone[], area: Multi, ctx: BrushContext): Zone[] {
  if (!area.length) return zones;
  const touched = zones.filter(z => touches(ctx, z, area));
  if (!touched.length) {
    // A new zone (or several, when the land cuts the stroke), with the first free letters.
    let used = [...zones];
    const added = toPolygon(ctx, area).map(geometry => {
      const zone = { id: ctx.newId(), name: ctx.name(nextLetter(used, ctx.name)), geometry };
      used = [...used, zone];
      return zone;
    });
    return [...zones, ...added];
  }
  const merged = union(...touched.map(z => polygonToMulti(ctx.frame, z.geometry)), area);
  const polygons = toPolygon(ctx, merged);
  const first = touched[0];
  const kept = zones.filter(z => !touched.includes(z));
  let used = [...kept];
  const result = polygons.map((geometry, i) => {
    if (i === 0) {
      const zone = { ...first, geometry };
      used = [...used, zone];
      return zone;
    }
    const zone = { id: ctx.newId(), name: ctx.name(nextLetter(used, ctx.name)), geometry };
    used = [...used, zone];
    return zone;
  });
  const at = zones.indexOf(first);
  return [...kept.slice(0, at), ...result, ...kept.slice(at)];
}

/** The zones after an erase stroke: each touched zone loses the area, and may split or vanish. */
export function eraseZones(zones: Zone[], area: Multi, ctx: BrushContext): Zone[] {
  if (!area.length) return zones;
  let used: Zone[] = [];
  const out: Zone[] = [];
  for (const zone of zones) {
    const multi = polygonToMulti(ctx.frame, zone.geometry);
    if (intersection(multi, area).length === 0) {
      out.push(zone);
      used = [...used, zone];
      continue;
    }
    const rest = difference(multi, area).filter(poly => areaOf([poly]) >= MIN_PIECE_M2);
    toPolygon(ctx, rest).forEach((geometry, i) => {
      const next = i === 0 ? { ...zone, geometry } : { id: ctx.newId(), name: ctx.name(nextLetter([...zones, ...used], ctx.name)), geometry };
      out.push(next);
      used = [...used, next];
    });
  }
  return out;
}
