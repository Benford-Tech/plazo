import type { LonLat } from "./projection";

export type { LonLat };

export interface GeoPolygon {
  type: "Polygon";
  coordinates: LonLat[][];
}
export interface GeoLineString {
  type: "LineString";
  coordinates: LonLat[];
}
export interface GeoPoint {
  type: "Point";
  coordinates: LonLat;
}

export interface Zone {
  id: string;
  name: string;
  geometry: GeoPolygon;
}

export type ExclusionKind =
  | "building"
  | "reception"
  | "shuttle_lane"
  | "tree"
  | "post"
  | "other";

export interface Exclusion {
  id: string;
  name: string;
  kind: ExclusionKind;
  /** Margin kept around the geometry, in metres (a lane: half its width; a tree: its radius). */
  clearance: number;
  geometry: GeoPolygon | GeoLineString | GeoPoint;
}

export interface ParcelRef {
  id: string;
  section: string;
  numero: string;
  commune: string;
  insee: string;
  contenance: number | null;
  /** Kept so the parcels can be shown and merged again when the study is reopened. */
  geometry?: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

export interface Calibration {
  a: LonLat;
  b: LonLat;
  measured: number;
}

export interface CapacitySettings {
  selfParkSlot: { width: number; length: number };
  valetSlot: { width: number; length: number };
  aisleWidth: number;
  /** Rows of a valet block between two aisles (layout "files de 2 à 4"). */
  maxDepth: number;
  /** Margin kept along the edges of every zone, in metres. */
  setback: number;
  /** Self-park: perpendicular stalls at the ends of the aisles. */
  endStalls: boolean;
  /** Cross aisle at both ends of every aisle run. */
  crossAisles: boolean;
  /** Fixed row bearing in degrees; null: automatic. */
  orientation: number | null;
  /** Valet "files depuis le bord" (T-A): deepest file allowed. */
  edgeMaxFiles: number;
  /** Stay classes by depth (Z-A): a stay up to `stayShortMaxNights` is short, up to `stayMediumMaxNights` medium, else long. */
  stayShortMaxNights: number;
  stayMediumMaxNights: number;
  /** Use the BD TOPO parking to cut the outline (step 1). */
  clipToParking?: boolean;
  calibration?: Calibration | null;
  /** How the outline was made: from parcels, edited by hand after that, or drawn by hand. */
  outlineSource?: "parcels" | "edited" | "drawn";
}

export const DEFAULT_SETTINGS: CapacitySettings = {
  selfParkSlot: { width: 2.5, length: 5 },
  valetSlot: { width: 2.4, length: 5 },
  aisleWidth: 6,
  maxDepth: 4,
  setback: 1,
  endStalls: true,
  crossAisles: true,
  orientation: null,
  edgeMaxFiles: 8,
  stayShortMaxNights: 3,
  stayMediumMaxNights: 8,
  clipToParking: false,
  calibration: null,
};

export type LayoutKey = "selfPark" | "valet24" | "valet5" | "valetEdge";
export const LAYOUT_KEYS: LayoutKey[] = [
  "selfPark",
  "valet24",
  "valet5",
  "valetEdge",
];

/** Z-A (04/10/2026): which stays a spot is meant for, from its rank in the file. */
export type StayClass = "short" | "medium" | "long";
export const STAY_CLASSES: StayClass[] = ["short", "medium", "long"];

/** First rank from the aisle: short stays; last rank: long; between: medium. One-deep files: short. */
export function stayClassOf(depth: number, fileLength: number): StayClass {
  if (fileLength <= 1 || depth <= 0) return "short";
  if (depth >= fileLength - 1) return "long";
  return "medium";
}

/** The class of a stay of `nights` nights. */
export function stayClassForNights(
  nights: number,
  s: Pick<CapacitySettings, "stayShortMaxNights" | "stayMediumMaxNights">,
): StayClass {
  if (nights <= s.stayShortMaxNights) return "short";
  if (nights <= s.stayMediumMaxNights) return "medium";
  return "long";
}

/** 0: the spot's class is the stay's; 1: a neighbouring class (or no class); 2: the opposite one. */
export function stayClassDistance(
  spot: StayClass | null | undefined,
  wanted: StayClass,
): number {
  if (!spot) return 1;
  if (spot === wanted) return 0;
  return spot === "medium" || wanted === "medium" ? 1 : 2;
}

/** Summary saved with the study (the slots are recomputed when it is reopened). */
export interface StudyResults {
  computedAt?: string;
  usableArea?: number;
  totals?: Record<LayoutKey, number>;
  zones?: {
    zoneId: string;
    name: string;
    area: number;
    usableArea: number;
    counts: Record<LayoutKey, number>;
    angle: number;
  }[];
}

/** The plan fields the engine reads (the pro space's CapacityStudy carries the same ones). */
export interface CapacityStudy {
  id: string;
  name: string;
  outline: GeoPolygon | null;
  parcels: ParcelRef[];
  scaleFactor: number;
  zones: Zone[];
  exclusions: Exclusion[];
  settings: Partial<CapacitySettings>;
  results: StudyResults;
  carMarkers: LonLat[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string } | null;
}

export type CapacityStudySummary = Pick<
  CapacityStudy,
  | "id"
  | "name"
  | "parcels"
  | "results"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
>;

export type StudyPatch = Partial<
  Pick<
    CapacityStudy,
    | "name"
    | "outline"
    | "parcels"
    | "scaleFactor"
    | "zones"
    | "exclusions"
    | "settings"
    | "results"
    | "carMarkers"
  >
>;

export function settingsOf(
  study: Pick<CapacityStudy, "settings">,
): CapacitySettings {
  return {
    ...DEFAULT_SETTINGS,
    ...study.settings,
    selfParkSlot: {
      ...DEFAULT_SETTINGS.selfParkSlot,
      ...study.settings?.selfParkSlot,
    },
    valetSlot: { ...DEFAULT_SETTINGS.valetSlot, ...study.settings?.valetSlot },
  };
}

/** Margins and geometry each kind of exclusion starts with. */
export const EXCLUSION_DEFAULTS: Record<
  ExclusionKind,
  { geometry: "Polygon" | "LineString" | "Point"; clearance: number }
> = {
  building: { geometry: "Polygon", clearance: 0 },
  reception: { geometry: "Polygon", clearance: 0 },
  shuttle_lane: { geometry: "LineString", clearance: 3 },
  tree: { geometry: "Point", clearance: 2 },
  post: { geometry: "Point", clearance: 0.5 },
  other: { geometry: "Polygon", clearance: 0 },
};
