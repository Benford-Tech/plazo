import type { ReservationStatus } from "@/lib/types";

/**
 * S-C "Des files, pas des places" (07/10/2026): the files of a valet parking as the API serves them.
 */
export type LonLat = [number, number];

export interface ParkingFile {
  id: string;
  code: string;
  name: string | null;
  capacity: number;
  /** From the aisle to the back, or null without a map. */
  geometry: LonLat[] | null;
  sortOrder: number;
  active: boolean;
  plannedDay: string | null;
  /** The planned day was chosen by the staff, not by the night's preparation (older APIs omit it). */
  keptByHand?: boolean;
}

export interface FileInput {
  id?: string;
  code: string;
  name?: string | null;
  capacity: number;
  geometry?: LonLat[] | null;
  sortOrder?: number;
  active?: boolean;
}

export interface FileCar {
  id: string;
  reference: string;
  customerName: string;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  returnAt: string;
  returnFlight: string | null;
  keyHook: string | null;
  vehicleModel?: string | null;
  vehicleColour?: string | null;
  onSite: boolean;
  leavesToday: boolean;
  /** 1 = first out, at the aisle. */
  position: number;
  /** Cars in front that leave later: to take out before this one. */
  blockedBy: {
    reservationId: string;
    reference: string;
    plate: string;
    returnAt: string;
  }[];
}

export interface FileView extends ParkingFile {
  /** The return day the file serves (its front car's, else the planned one). */
  day: string | null;
  /** From the aisle to the back. */
  cars: FileCar[];
  movesToday: number;
  sound: boolean;
}

export type FileReason =
  | "planned_day"
  | "tight_fit"
  | "empty"
  | "moves"
  | "full";

export interface FileChoice {
  fileId: string;
  code: string;
  reason: FileReason;
  moves: number;
  cars: number;
  capacity: number;
  fitMinutes: number | null;
}

export interface FileArrival {
  id: string;
  reference: string;
  customerName: string;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  returnAt: string;
  returnFlight: string | null;
  keyHook: string | null;
  onSite: boolean;
  choices: FileChoice[];
  suggested: FileChoice | null;
}

export interface FileBoard {
  date: string;
  timezone: string;
  files: FileView[];
  arrivals: FileArrival[];
  stats: {
    files: number;
    capacity: number;
    cars: number;
    onSite: number;
    leavingToday: number;
    movesToday: number;
    unsound: number;
  };
}

// "Planning des files" (07/10/2026): the coming days read in files.
export interface FilesPlanningFile {
  id: string;
  code: string;
  name: string | null;
  capacity: number;
  active: boolean;
  plannedDay: string | null;
  /** The return day the file serves: its front car's local day, else the planned one. */
  day: string | null;
  cars: number;
  sound: boolean;
  keptByHand?: boolean;
}

export interface FilesPlanningDay {
  date: string;
  /** Holding bookings whose return falls on that local day. */
  returns: number;
  /** Of those, already in a file. */
  placed: number;
  toCome: number;
  /** Holding bookings overlapping the day. */
  onSite: number;
  /** Codes of the files serving that day and holding cars. */
  filesServing: string[];
  /** Codes of the empty files kept for that day. */
  filesKept: string[];
  /** Free slots over the serving and kept files. */
  room: number;
  /** max(0, toCome - room) */
  missing: number;
}

export type FilesPlanningAlert =
  | { kind: "missing_room"; date: string; count: number }
  | { kind: "over_capacity"; date: string; count: number }
  | { kind: "unsound"; fileCode: string; count: number };

export interface FilesPlanning {
  from: string;
  days: number;
  timezone: string;
  /** The parking's local day as the server reckons it (missing from an older API: fall back to `from`). */
  today?: string;
  /** Sum of the active files' capacities. */
  capacity: number;
  files: FilesPlanningFile[];
  load: FilesPlanningDay[];
  alerts: FilesPlanningAlert[];
}

/** Metres between two positions, flat-earth (fine within a parking). */
export function metresBetween(a: LonLat, b: LonLat): number {
  const kx = 111_320 * Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * 110_540);
}

/** Length of a drawn line in metres. */
export function lineLengthM(line: LonLat[]): number {
  let m = 0;
  for (let i = 1; i < line.length; i++)
    m += metresBetween(line[i - 1], line[i]);
  return m;
}

/** How many cars a drawn file holds, nose to tail, at `slotLength` metres each (at least one). */
export function capacityOf(line: LonLat[], slotLength: number): number {
  return Math.max(
    1,
    Math.floor(lineLengthM(line) / Math.max(1, slotLength) + 0.25),
  );
}

/** The next free code "F01", "F02"… */
export function nextFileCode(existing: { code: string }[]): string {
  const taken = new Set(existing.map((f) => f.code.toUpperCase()));
  let n = existing.length + 1;
  while (taken.has(`F${String(n).padStart(2, "0")}`)) n += 1;
  return `F${String(n).padStart(2, "0")}`;
}
