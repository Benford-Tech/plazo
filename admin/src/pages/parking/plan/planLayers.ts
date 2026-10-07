import type { MapLabel, MapLayer } from "@/components/capacity/MapView";
import { m2 } from "@/lib/capacity/format";
import {
  exclusionMulti,
  multiToPolygons,
  type Estimate,
} from "@/lib/capacity/estimate";
import { areaOf, intersection, type Multi } from "@/lib/capacity/geometry";
import {
  edgeLabels,
  fc,
  feature,
  polygonCentroid,
  polygonsOf,
} from "@/lib/capacity/mapData";
import type { Frame } from "@/lib/capacity/projection";
import { polygonToMulti } from "@/lib/capacity/estimate";
import type {
  Exclusion,
  ExclusionKind,
  GeoPolygon,
  LayoutKey,
  ParcelRef,
  StayClass,
  Zone,
  ZoneSuggestion,
} from "@/lib/capacity/types";
import { fr } from "@/lib/fr";
import type {
  Landmark,
  LandmarkKind,
  ParkingPlan,
  Spot,
  SpotKind,
} from "@/lib/plan/types";

/** The editor's palette (direction C-B): lime for what is drawn, deep green for the land. */
export const LIME = "#A3E635";
export const DEEP = "#1E5E2E";
export const PROPOSAL = "#5fd3ff";
const PARCEL = "#ff8a3d";
const GREY = "#6b6b66";
export const EXCLUSION_COLORS: Record<ExclusionKind, string> = {
  building: "#9a9a94",
  reception: "#8a7420",
  shuttle_lane: "#5fd3ff",
  tree: "#2f7a3a",
  post: "#ff8a3d",
  other: "#c0392b",
};
export const LANDMARK_COLORS: Record<LandmarkKind, string> = {
  entrance: "#6ec071",
  exit: "#ff8a3d",
  handover: LIME,
  shuttle_stop: "#5fd3ff",
  key_box: "#f3f3f0",
};
export const SPOT_KIND_COLORS: Record<SpotKind, string> = {
  standard: LIME,
  large: "#5fd3ff",
  covered: "#b48cff",
  pmr: "#6ec071",
  reserved: "#ff8a3d",
};
export const STAY_COLORS: Record<StayClass, string> = {
  short: "#fff3b0",
  medium: LIME,
  long: "#b58900",
};

export type ExclusionShape = {
  area: number;
  polygons: GeoPolygon[];
  multi: Multi;
};

/** The excluded parts as polygons (a tree or a post becomes its clearance disc). */
export function exclusionShapes(
  frame: Frame | null,
  exclusions: Exclusion[],
  land: Multi | null,
): Map<string, ExclusionShape> {
  const map = new Map<string, ExclusionShape>();
  if (!frame) return map;
  for (const e of exclusions) {
    const multi = exclusionMulti(frame, e);
    const clipped = land ? intersection(multi, land) : multi;
    map.set(e.id, {
      area: areaOf(clipped),
      polygons: multiToPolygons(frame, multi),
      multi,
    });
  }
  return map;
}

export function zoneAreas(
  frame: Frame | null,
  zones: Zone[],
  land: Multi | null,
): Map<string, number> {
  const map = new Map<string, number>();
  if (!frame) return map;
  for (const z of zones) {
    const multi = polygonToMulti(frame, z.geometry);
    map.set(z.id, areaOf(land ? intersection(multi, land) : multi));
  }
  return map;
}

export interface LayerInput {
  plan: Pick<ParkingPlan, "outline" | "zones" | "exclusions" | "landmarks">;
  parcels: ParcelRef[];
  showParcels: boolean;
  shapes: Map<string, ExclusionShape>;
  selectedExclusion: string | null;
  spots: Spot[];
  /** The chosen layout's preview while no spot is generated (the places tool only). */
  preview: { estimate: Estimate; layout: LayoutKey } | null;
  suggestion: ZoneSuggestion | null;
  /** Zones and spots fade when another tool is in use, so the tool's own layer reads first. */
  focus: "land" | "zones" | "spots";
}

export function planLayers(input: LayerInput): MapLayer[] {
  const { plan, shapes, spots, preview, suggestion, focus } = input;
  const list: MapLayer[] = [];
  if (input.showParcels && input.parcels.length)
    list.push({
      id: "parcels",
      type: "line",
      data: fc(
        input.parcels.filter((p) => p.geometry).map((p) => feature(p.geometry)),
      ),
      paint: {
        "line-color": PARCEL,
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    });
  if (plan.outline) {
    list.push({
      id: "outline-fill",
      type: "fill",
      data: fc([feature(plan.outline)]),
      paint: {
        "fill-color": LIME,
        "fill-opacity": focus === "land" ? 0.1 : 0.04,
      },
    });
  }
  list.push({
    id: "zones-fill",
    type: "fill",
    data: fc(plan.zones.map((z) => feature(z.geometry))),
    paint: {
      "fill-color": LIME,
      "fill-opacity": focus === "zones" ? 0.28 : 0.12,
    },
  });
  list.push({
    id: "zones-line",
    type: "line",
    data: fc(plan.zones.map((z) => feature(z.geometry))),
    paint: { "line-color": LIME, "line-width": focus === "zones" ? 2.5 : 1.5 },
  });
  const exclusionFeatures = plan.exclusions.flatMap((e) =>
    (shapes.get(e.id)?.polygons ?? []).map((p) =>
      feature(p, {
        color: EXCLUSION_COLORS[e.kind],
        selected: input.selectedExclusion === e.id,
      }),
    ),
  );
  list.push({
    id: "exclusions-fill",
    type: "fill",
    data: fc(exclusionFeatures),
    paint: { "fill-color": ["get", "color"], "fill-opacity": 0.55 },
  });
  list.push({
    id: "exclusions-line",
    type: "line",
    data: fc(exclusionFeatures),
    paint: {
      "line-color": ["case", ["get", "selected"], "#0F2A14", "#F3F3F0"],
      "line-width": ["case", ["get", "selected"], 3, 1.2],
    },
  });
  if (spots.length) {
    const spotFeatures = spots.map((s) =>
      feature(
        { type: "Polygon", coordinates: [s.geometry] },
        {
          active: s.active,
          manual: s.manual,
          color:
            s.kind === "standard" && s.stayClass
              ? STAY_COLORS[s.stayClass]
              : SPOT_KIND_COLORS[s.kind],
        },
      ),
    );
    list.push({
      id: "spots-fill",
      type: "fill",
      data: fc(spotFeatures),
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": [
          "case",
          ["get", "active"],
          focus === "spots" ? 0.5 : 0.3,
          0.08,
        ],
      },
    });
    list.push({
      id: "spots-line",
      type: "line",
      data: fc(spotFeatures),
      paint: {
        "line-color": ["case", ["get", "active"], ["get", "color"], GREY],
        // A spot laid by hand (P-B) reads with a thicker white edge.
        "line-width": ["case", ["get", "manual"], 2.2, 1.2],
      },
    });
    list.push({
      id: "spots-manual",
      type: "line",
      data: fc(spotFeatures.filter((f) => f.properties?.manual)),
      paint: {
        "line-color": "#F3F3F0",
        "line-width": 1,
        "line-dasharray": [2, 1.5],
      },
    });
  } else if (preview) {
    const layouts = preview.estimate.zones.map(
      (z) => z.layouts[preview.layout],
    );
    list.push({
      id: "preview-aisles",
      type: "fill",
      data: fc(
        layouts.flatMap((l) =>
          l.aisles.map((ring) =>
            feature({ type: "Polygon", coordinates: [ring] }),
          ),
        ),
      ),
      paint: { "fill-color": "#F3F3F0", "fill-opacity": 0.22 },
    });
    list.push({
      id: "preview",
      type: "line",
      data: fc(
        layouts.flatMap((l) =>
          l.slots.map((ring) =>
            feature({ type: "Polygon", coordinates: [ring] }),
          ),
        ),
      ),
      paint: { "line-color": DEEP, "line-width": 1, "line-dasharray": [2, 2] },
    });
  }
  if (plan.outline)
    list.push({
      id: "outline",
      type: "line",
      data: fc([feature(plan.outline)]),
      paint: { "line-color": DEEP, "line-width": 3 },
    });
  if (suggestion?.zones.length) {
    list.push({
      id: "proposal-fill",
      type: "fill",
      data: fc(suggestion.zones.map((z) => feature(z.geometry))),
      paint: { "fill-color": PROPOSAL, "fill-opacity": 0.25 },
    });
    list.push({
      id: "proposal-line",
      type: "line",
      data: fc(suggestion.zones.map((z) => feature(z.geometry))),
      paint: {
        "line-color": PROPOSAL,
        "line-width": 2.5,
        "line-dasharray": [2, 1.5],
      },
    });
  }
  list.push({
    id: "landmarks",
    type: "circle",
    data: fc(
      plan.landmarks.map((l) =>
        feature(l.geometry, { color: LANDMARK_COLORS[l.kind] }),
      ),
    ),
    paint: {
      "circle-radius": 7,
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#0F2A14",
      "circle-stroke-width": 2,
    },
  });
  return list;
}

export function planLabels(
  plan: Pick<ParkingPlan, "outline" | "zones" | "landmarks">,
  scaleFactor: number,
  areas: Map<string, number>,
  focus: LayerInput["focus"],
): MapLabel[] {
  const labels: MapLabel[] = [];
  if (focus === "land") labels.push(...edgeLabels(plan.outline, scaleFactor));
  if (focus !== "spots")
    labels.push(
      ...plan.zones.map((z) => ({
        id: `zone-${z.id}`,
        lngLat: polygonCentroid(z.geometry),
        text: `${z.name} · ${m2.format(areas.get(z.id) ?? 0)} m²`,
        variant: "zone" as const,
      })),
    );
  labels.push(
    ...plan.landmarks.map((l: Landmark) => ({
      id: `lm-${l.id}`,
      lngLat: l.geometry.coordinates,
      text: fr.parkingPlan.landmarkKinds[l.kind],
      variant: "vertex" as const,
    })),
  );
  return labels;
}

/** The positions the pointer snaps to while drawing: parcels, outline and obstacles. */
export function snapTargets(
  outline: GeoPolygon | null,
  parcels: ParcelRef[],
  shapes: Map<string, ExclusionShape>,
): [number, number][][] {
  return [
    ...(outline ? outline.coordinates : []),
    ...parcels.flatMap((p) =>
      p.geometry ? polygonsOf(p.geometry).flatMap((g) => g.coordinates) : [],
    ),
    ...[...shapes.values()].flatMap((v) =>
      v.polygons.flatMap((p) => p.coordinates),
    ),
  ];
}
