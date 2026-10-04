import type { ReservationStatus } from "@/lib/types";
import type { SpotKind } from "./types";

export interface PlannedStay {
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
  onSite: boolean;
}

export interface PlannedSpot {
  id: string;
  zoneId: string;
  code: string;
  row: number;
  index: number;
  kind: SpotKind;
  active: boolean;
  stays: PlannedStay[];
}

export interface DayLoad {
  date: string;
  placed: number;
  unplaced: number;
  capacity: number;
}

export type PlanningAlert =
  | { kind: "over_capacity"; date: string; count: number }
  | { kind: "unplaced"; count: number }
  | { kind: "inactive_spot_used"; spotCode: string; reference: string };

export interface SpotPlanning {
  from: string;
  days: number;
  timezone: string;
  capacity: number;
  spots: PlannedSpot[];
  unplaced: PlannedStay[];
  load: DayLoad[];
  alerts: PlanningAlert[];
}

export interface PreassignResult {
  assigned: {
    reservationId: string;
    reference: string;
    spotId: string;
    code: string;
  }[];
  skipped: { reservationId: string; reference: string }[];
}

const overlaps = (
  a: { arrivalAt: string; returnAt: string },
  b: { arrivalAt: string; returnAt: string },
) => a.arrivalAt < b.returnAt && a.returnAt > b.arrivalAt;

/** Active, non-reserved spots free during the whole stay (the stay itself excluded). */
export function freeSpotsFor(
  spots: PlannedSpot[],
  stay: { id: string; arrivalAt: string; returnAt: string },
): PlannedSpot[] {
  return spots.filter(
    (s) =>
      s.active &&
      s.kind !== "reserved" &&
      !s.stays.some((o) => o.id !== stay.id && overlaps(o, stay)),
  );
}
