import type { ReservationStatus } from "@/lib/types";
import type { StayClass } from "@/lib/capacity/types";
import type { Landmark, SpotKind } from "./types";

export interface Occupant {
  id: string;
  reference: string;
  customerName: string;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  returnAt: string;
  returnFlight: string | null;
  spotId: string | null;
  keyHook: string | null;
  /** Where the car is parked (06/10/2026), when recorded. */
  carLat?: number | null;
  carLng?: number | null;
  carAccuracyM?: number | null;
  carLocatedAt?: string | null;
  carLocatedBy?: "traveller" | "staff" | null;
  carNote?: string | null;
  onSite: boolean;
  leavesToday: boolean;
}

export interface SpotState {
  id: string;
  zoneId: string;
  code: string;
  row: number;
  index: number;
  kind: SpotKind;
  active: boolean;
  geometry: [number, number][];
  stayClass: StayClass | null;
  occupant: Occupant | null;
}

export interface Suggestion {
  spotId: string;
  code: string;
  distanceM: number | null;
  reason: "near_handover" | "near_entrance" | "free";
  /** The spot's stay class, when the plan has them (Z-A). */
  stayClass: StayClass | null;
}

export type ArrivalToPlace = Omit<Occupant, "onSite" | "leavesToday"> & {
  suggestions: Suggestion[];
};

export interface OccupationBoard {
  date: string;
  timezone: string;
  plan: {
    outline: unknown;
    zones: { id: string; name: string; geometry: unknown }[];
    landmarks: Landmark[];
  } | null;
  spots: SpotState[];
  arrivals: ArrivalToPlace[];
  zones: { zoneId: string; total: number; occupied: number }[];
  stats: { active: number; occupied: number; leavingToday: number };
}

export type VehicleHit = Omit<Occupant, "leavesToday"> & {
  spot: { code: string } | null;
};

/** Colour of a spot on the occupation map. */
export function spotTone(
  s: SpotState,
): "occupied" | "leaving" | "booked" | "free" | "inactive" {
  if (!s.active) return "inactive";
  if (!s.occupant) return "free";
  if (s.occupant.onSite) return s.occupant.leavesToday ? "leaving" : "occupied";
  return "booked";
}
