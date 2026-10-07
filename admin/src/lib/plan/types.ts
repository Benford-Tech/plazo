import type {
  CapacityStudy,
  GeoPoint,
  LayoutKey,
  StayClass,
} from "@/lib/capacity/types";

export type LandmarkKind =
  | "entrance"
  | "exit"
  | "handover"
  | "shuttle_stop"
  | "key_box";
export const LANDMARK_KINDS: LandmarkKind[] = [
  "entrance",
  "exit",
  "handover",
  "shuttle_stop",
  "key_box",
];

export type SpotKind = "standard" | "large" | "covered" | "pmr" | "reserved";
export const SPOT_KINDS: SpotKind[] = [
  "standard",
  "large",
  "covered",
  "pmr",
  "reserved",
];

export interface Landmark {
  id: string;
  kind: LandmarkKind;
  geometry: GeoPoint;
}

/** The plan as the API stores it (bloc 2, step "Plan"): the estimator's fields plus the landmarks. */
export interface ParkingPlan extends Pick<
  CapacityStudy,
  "outline" | "parcels" | "scaleFactor" | "zones" | "exclusions" | "settings"
> {
  id: string;
  parkingId: string;
  landmarks: Landmark[];
  layout: LayoutKey | null;
  generatedAt: string | null;
  updatedAt: string;
}

export interface Spot {
  id: string;
  zoneId: string;
  code: string;
  row: number;
  index: number;
  kind: SpotKind;
  active: boolean;
  /** Closed ring, [lon, lat] × 5. */
  geometry: [number, number][];
  lon: number;
  lat: number;
  /** Rank from the aisle, length of the file, and the stay class (valet layouts, Z-A). */
  depth: number | null;
  fileLength: number | null;
  stayClass: StayClass | null;
  /** P-B (07/10/2026): laid by hand (a row drawn on the map); kept through regenerations. */
  manual: boolean;
}

export interface SpotInput {
  zoneId: string;
  code: string;
  row: number;
  index: number;
  geometry: [number, number][];
  depth?: number | null;
  fileLength?: number | null;
  stayClass?: StayClass | null;
}

export interface ParkingPlanView {
  plan: ParkingPlan;
  spots: Spot[];
  activeSpots: number;
  totalCapacity: number;
}

export type PlanPatch = Partial<
  Pick<
    ParkingPlan,
    | "outline"
    | "parcels"
    | "scaleFactor"
    | "zones"
    | "exclusions"
    | "settings"
    | "landmarks"
  >
>;
