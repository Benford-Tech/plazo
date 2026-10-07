import {
  areaOf,
  bufferLine,
  circle,
  difference,
  grow,
  intersection,
  shrink,
  simplify,
  union,
  type Multi,
  type Poly,
} from "./geometry";
import { generateLayout, type LayoutParams } from "./layout";
import {
  makeFrame,
  polygonAreaM2,
  type Frame,
  type LonLat,
  type XY,
} from "./projection";
import {
  IGN_BUILDING_CLEARANCE,
  LAYOUT_KEYS,
  settingsOf,
  type CapacitySettings,
  type CapacityStudy,
  type Exclusion,
  type GeoPolygon,
  type LayoutKey,
  type StudyResults,
  type Zone,
} from "./types";

/** Tolerance of the outline simplification before the layout search, in metres. */
export const LAYOUT_SIMPLIFY_M = 0.1;

export interface LayoutEstimate {
  count: number;
  angle: number;
  pattern: number[];
  /** Slot outlines as closed WGS84 rings. */
  slots: LonLat[][];
  /** Rank from the aisle and length of the file, per slot (Z-A). */
  depths: number[];
  files: number[];
  /** The service aisles, clipped to the zone, as closed WGS84 rings (M-A). */
  aisles: LonLat[][];
}

export interface ZoneEstimate {
  zoneId: string;
  name: string;
  /** Zone area inside the outline, m². */
  area: number;
  /** Zone area minus the excluded parts, m² (the setback is not deducted). */
  usableArea: number;
  layouts: Record<LayoutKey, LayoutEstimate>;
}

export interface Estimate {
  zones: ZoneEstimate[];
  usableArea: number;
  totals: Record<LayoutKey, number>;
}

/** The plan, plus the entrance (or handover point) the edge layout should start from. */
export type EstimateInput = Pick<
  CapacityStudy,
  "outline" | "zones" | "exclusions" | "scaleFactor" | "settings"
> & { anchor?: LonLat | null };

export function layoutParams(
  key: LayoutKey,
  s: CapacitySettings,
): LayoutParams {
  const common = { aisleWidth: s.aisleWidth, crossAisles: s.crossAisles };
  if (key === "selfPark") {
    return {
      ...common,
      slotWidth: s.selfParkSlot.width,
      slotLength: s.selfParkSlot.length,
      blockDepth: 2,
      oneSidedDepth: 1,
      endStalls: s.endStalls,
    };
  }
  if (key === "valet24") {
    const depth = Math.max(2, Math.round(s.maxDepth));
    return {
      ...common,
      slotWidth: s.valetSlot.width,
      slotLength: s.valetSlot.length,
      blockDepth: depth,
      oneSidedDepth: depth - 1,
      endStalls: false,
    };
  }
  if (key === "valetEdge") {
    const files = Math.max(1, Math.round(s.edgeMaxFiles));
    return {
      ...common,
      crossAisles: false,
      slotWidth: s.valetSlot.width,
      slotLength: s.valetSlot.length,
      blockDepth: 2 * files,
      oneSidedDepth: files,
      endStalls: false,
      mode: "comb",
      maxFiles: files,
    };
  }
  return {
    ...common,
    slotWidth: s.valetSlot.width,
    slotLength: s.valetSlot.length,
    blockDepth: 10,
    oneSidedDepth: 5,
    endStalls: false,
  };
}

export function frameFor(
  input: Pick<CapacityStudy, "outline" | "zones" | "scaleFactor">,
): Frame | null {
  const ring =
    input.outline?.coordinates[0] ?? input.zones[0]?.geometry.coordinates[0];
  if (!ring?.length) return null;
  return makeFrame(ring[0], input.scaleFactor || 1);
}

export const polygonToMulti = (frame: Frame, polygon: GeoPolygon): Multi => [
  polygon.coordinates.map((ring) => ring.map(frame.forward)),
];

export function multiToPolygons(frame: Frame, multi: Multi): GeoPolygon[] {
  return multi.map((poly) => ({
    type: "Polygon",
    coordinates: poly.map((ring) => ring.map(frame.inverse)),
  }));
}

/** The area an exclusion removes, its margin included. */
export function exclusionMulti(frame: Frame, exclusion: Exclusion): Multi {
  const g = exclusion.geometry;
  const d = Math.max(0, exclusion.clearance || 0);
  if (g.type === "Point")
    return d > 0 ? [circle(frame.forward(g.coordinates), d)] : [];
  if (g.type === "LineString")
    return bufferLine(g.coordinates.map(frame.forward), d);
  return grow([g.coordinates.map((ring) => ring.map(frame.forward))], d);
}

export function outlineMulti(
  frame: Frame,
  input: Pick<CapacityStudy, "outline">,
): Multi | null {
  return input.outline ? polygonToMulti(frame, input.outline) : null;
}

/** Area in m² of a WGS84 polygon with the study's scale. */
export const areaM2 = (polygon: GeoPolygon | null | undefined, scale = 1) =>
  polygon ? polygonAreaM2(polygon.coordinates, scale) : 0;

export function estimate(input: EstimateInput): Estimate {
  const empty: Estimate = {
    zones: [],
    usableArea: 0,
    totals: { selfPark: 0, valet24: 0, valet5: 0, valetEdge: 0 },
  };
  const frame = frameFor(input);
  if (!frame) return empty;
  const settings = settingsOf(input);
  const outline = outlineMulti(frame, input);
  const excluded = union(
    ...input.exclusions.map((e) => exclusionMulti(frame, e)),
  );
  const anchor = input.anchor ? frame.forward(input.anchor) : null;

  const zones: ZoneEstimate[] = input.zones.map((zone) => {
    let land = polygonToMulti(frame, zone.geometry);
    if (outline) land = intersection(land, outline);
    const usable = difference(land, excluded);
    // 10 cm: invisible at the scale of a parking slot, and the search gets 5 to 10 times faster.
    const forLayout = simplify(
      difference(shrink(land, settings.setback), excluded),
      LAYOUT_SIMPLIFY_M,
    );
    const layouts = {} as Record<LayoutKey, LayoutEstimate>;
    for (const key of LAYOUT_KEYS) {
      const r = generateLayout(forLayout, layoutParams(key, settings), {
        angle: settings.orientation,
        anchor,
      });
      // The aisle rectangles overlap (an aisle and the spine of a comb) and may overshoot the land.
      const aisles = r.aisles.length
        ? intersection(union(r.aisles.map((q) => [[...q, q[0]]])), forLayout)
        : [];
      layouts[key] = {
        count: r.count,
        angle: r.angle,
        pattern: r.pattern,
        slots: r.slots.map((q) =>
          [...q, q[0]].map((p) => frame.inverse(p as XY)),
        ),
        depths: r.depths,
        files: r.files,
        aisles: aisles.map((poly) => poly[0].map((p) => frame.inverse(p))),
      };
    }
    return {
      zoneId: zone.id,
      name: zone.name,
      area: areaOf(land),
      usableArea: areaOf(usable),
      layouts,
    };
  });

  const totals = { selfPark: 0, valet24: 0, valet5: 0, valetEdge: 0 };
  for (const z of zones)
    for (const key of LAYOUT_KEYS) totals[key] += z.layouts[key].count;
  return {
    zones,
    usableArea: zones.reduce((s, z) => s + z.usableArea, 0),
    totals,
  };
}

/** The small summary stored with the study. */
export function summarize(result: Estimate): StudyResults {
  return {
    computedAt: new Date().toISOString(),
    usableArea: Math.round(result.usableArea),
    totals: result.totals,
    zones: result.zones.map((z) => ({
      zoneId: z.zoneId,
      name: z.name,
      area: Math.round(z.area),
      usableArea: Math.round(z.usableArea),
      counts: {
        selfPark: z.layouts.selfPark.count,
        valet24: z.layouts.valet24.count,
        valet5: z.layouts.valet5.count,
        valetEdge: z.layouts.valetEdge.count,
      },
      angle: z.layouts.valet24.angle,
    })),
  };
}

/** Theoretical ceiling: the usable area divided by one valet slot, as if there were no aisle. */
export function ceilingOf(
  usableArea: number,
  settings: CapacitySettings,
): number {
  return Math.floor(
    Math.round(usableArea) /
      (settings.valetSlot.width * settings.valetSlot.length),
  );
}

/** Outlines from the cadastre are simplified to this tolerance (metres) so they stay editable. */
export const OUTLINE_SIMPLIFY_M = 0.2;

/** Union of polygons (WGS84), e.g. adjacent cadastral parcels; holes are dropped. */
export function unionPolygons(
  polygons: GeoPolygon[],
  frame: Frame,
  clip?: GeoPolygon[],
): GeoPolygon[] {
  let merged = union(...polygons.map((p) => polygonToMulti(frame, p)));
  if (clip?.length)
    merged = intersection(
      merged,
      union(...clip.map((p) => polygonToMulti(frame, p))),
    );
  merged = simplify(merged, OUTLINE_SIMPLIFY_M);
  return merged
    .map((poly: Poly) => [poly[0]] as Poly)
    .sort((a, b) => areaOf([b]) - areaOf([a]))
    .map(
      (poly) =>
        ({
          type: "Polygon",
          coordinates: poly.map((ring) => ring.map(frame.inverse)),
        }) as GeoPolygon,
    );
}

/** A building must overlap the land by at least this area (m²) to be excluded (B-A). */
export const IGN_BUILDING_MIN_M2 = 4;
/** The plan keeps at most this many IGN buildings (the server allows 200 exclusions in all). */
export const IGN_BUILDINGS_MAX = 60;

/**
 * B-A (07/10/2026): the exclusions after the IGN buildings were synced: the hand-made ones are
 * kept, the previous IGN ones replaced by every building overlapping the land, each as a
 * "building" exclusion with a 1 m margin that can be removed like any other.
 */
export function withIgnBuildings(
  input: Pick<CapacityStudy, "outline" | "exclusions" | "scaleFactor">,
  buildings: {
    id: string;
    geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  }[],
  name: string,
): Exclusion[] {
  const kept = input.exclusions.filter((e) => e.source !== "ign");
  const frame = frameFor({ ...input, zones: [] });
  if (!frame || !input.outline) return kept;
  const land = polygonToMulti(frame, input.outline);
  const added: Exclusion[] = [];
  for (const b of buildings) {
    const polygons =
      b.geometry.type === "Polygon"
        ? [b.geometry.coordinates as LonLat[][]]
        : (b.geometry.coordinates as LonLat[][][]);
    polygons.forEach((rings, i) => {
      if (added.length >= IGN_BUILDINGS_MAX) return;
      const multi: Multi = [rings.map((ring) => ring.map(frame.forward))];
      if (areaOf(intersection(multi, land)) < IGN_BUILDING_MIN_M2) return;
      const ref = polygons.length > 1 ? `${b.id}-${i + 1}` : b.id;
      added.push({
        id: `ign-${ref}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64),
        name,
        kind: "building",
        clearance: IGN_BUILDING_CLEARANCE,
        geometry: { type: "Polygon", coordinates: [rings[0]] },
        source: "ign",
        ref,
      });
    });
  }
  return [...kept, ...added];
}

/** Below this area a piece of land is not worth a zone of its own (m²). */
export const AUTO_ZONE_MIN_M2 = 30;

/**
 * T-A (07/10/2026): the parking zones made by the land itself, one per piece the exclusions leave
 * (a building across the land splits it in two, each with its own orientation), largest first,
 * named A, B, C… Holes are dropped: the exclusions are deducted again at estimate time.
 */
export function autoZones(
  input: Pick<CapacityStudy, "outline" | "exclusions" | "scaleFactor">,
  zoneName: (letter: string) => string,
  ids: () => string,
): Zone[] {
  const frame = frameFor({ ...input, zones: [] });
  if (!frame || !input.outline) return [];
  return autoZonesFrom(polygonToMulti(frame, input.outline), input, zoneName, ids);
}

/**
 * The zones made of a given surface (local frame): kept inside the land, the exclusions deducted,
 * one zone per piece, largest first, named A, B, C… Used by the automatic zones (the whole land)
 * and by Claude's proposal (V-A: the surfaces it read on the photo).
 */
export function autoZonesFrom(
  surface: Multi,
  input: Pick<CapacityStudy, "outline" | "exclusions" | "scaleFactor">,
  zoneName: (letter: string) => string,
  ids: () => string,
): Zone[] {
  const frame = frameFor({ ...input, zones: [] });
  if (!frame || !input.outline || !surface.length) return [];
  const land = intersection(surface, polygonToMulti(frame, input.outline));
  const excluded = union(
    ...input.exclusions.map((e) => exclusionMulti(frame, e)),
  );
  const pieces = simplify(difference(land, excluded), OUTLINE_SIMPLIFY_M)
    .filter((poly) => areaOf([poly]) >= AUTO_ZONE_MIN_M2)
    .sort((a, b) => areaOf([b]) - areaOf([a]));
  return pieces.map((poly, i) => ({
    id: ids(),
    name: zoneName(
      i < 26 ? String.fromCharCode(65 + i) : String(i + 1),
    ),
    geometry: { type: "Polygon", coordinates: [poly[0].map(frame.inverse)] },
  }));
}

/** Outline minus a drawn part ("Exclure une partie"): the largest remaining piece. */
export function subtractFromOutline(
  outline: GeoPolygon,
  cut: GeoPolygon,
  frame: Frame,
): GeoPolygon | null {
  const rest = difference(
    polygonToMulti(frame, outline),
    polygonToMulti(frame, cut),
  );
  if (!rest.length) return null;
  const largest = [...rest].sort((a, b) => areaOf([b]) - areaOf([a]))[0];
  return { type: "Polygon", coordinates: [largest[0].map(frame.inverse)] };
}
