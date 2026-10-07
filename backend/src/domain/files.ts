/**
 * O-A "File triée" (06/10/2026): on a valet layout the cars of a file leave through the aisle, so
 * the car at the back must be the last to leave. A file is sound when the returns decrease from
 * the aisle (depth 0) to the back; then nobody ever moves a car to free another one.
 *
 * This module is pure: it rebuilds the files from the spots' depths and positions, and scores a
 * free spot for a stay by the moves it would cost: cars in front that leave after this one (to
 * take out when it leaves), and cars behind that leave before it (blocked by it).
 */

export interface FileSpot {
  id: string;
  zoneId: string;
  code: string;
  lon: number;
  lat: number;
  /** Rank from the aisle (0: first); null on a self-park plan, where no file exists. */
  depth: number | null;
}

/** A stay placed on a spot: what matters to the order of a file. */
export interface FileStay {
  reservationId: string;
  reference: string;
  spotId: string;
  arrivalAt: Date;
  returnAt: Date;
}

export interface Blocker {
  reservationId: string;
  reference: string;
  spotCode: string;
  returnAt: Date;
}

export interface FileScore {
  /** Cars to move so this one gets out (in front, leaving later) or gets in place behind others (behind, leaving earlier). */
  moves: number;
  /** Cars in front that leave after this stay: to take out at its return. */
  blocking: Blocker[];
  /** Cars behind that leave before this stay: this car would block them. */
  blocked: Blocker[];
  /** Minutes between this return and the nearest return in front of it (the file stays tight when small); null without a car in front. */
  fitMinutes: number | null;
}

/** Two cars whose returns fall within this many hours leave "together": no order between them. */
export const SAME_WAVE_HOURS = 2;

/** The longest distance (metres) between two consecutive ranks of a file. */
const RANK_GAP_M = 9;

function metres(a: FileSpot, b: FileSpot): number {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLon = (b.lon - a.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/**
 * Groups the spots into files: in each zone, a rank-0 spot starts a file, and every deeper spot
 * joins the file whose last spot (one rank less) is nearest, within one slot length. Spots without a
 * depth (self-park) or without a predecessor stand alone. Returns the file of every spot, in rank order.
 */
export function buildFiles(spots: FileSpot[]): Map<string, FileSpot[]> {
  const byZone = new Map<string, FileSpot[]>();
  for (const s of spots) byZone.set(s.zoneId, [...(byZone.get(s.zoneId) ?? []), s]);
  const fileOf = new Map<string, FileSpot[]>();
  for (const zone of byZone.values()) {
    const ranked = zone.filter(s => s.depth !== null).sort((a, b) => (a.depth as number) - (b.depth as number));
    const open: FileSpot[][] = [];
    for (const s of ranked) {
      const depth = s.depth as number;
      let best: FileSpot[] | null = null;
      let bestDistance = RANK_GAP_M;
      for (const file of open) {
        const last = file[file.length - 1];
        if ((last.depth as number) !== depth - 1) continue;
        const d = metres(last, s);
        if (d < bestDistance) {
          bestDistance = d;
          best = file;
        }
      }
      if (best) best.push(s);
      else open.push([s]);
    }
    for (const file of open) for (const s of file) fileOf.set(s.id, file);
    for (const s of zone) if (!fileOf.has(s.id)) fileOf.set(s.id, [s]);
  }
  return fileOf;
}

/** Whether `other` must be out of the way before `mine` leaves: it leaves clearly later. */
export function leavesAfter(other: Date, mine: Date, sameWaveHours = SAME_WAVE_HOURS): boolean {
  return other.getTime() - mine.getTime() > sameWaveHours * 3_600_000;
}

/**
 * The cost of placing a stay on `spot`: the stays on the other spots of its file that overlap it in
 * time and break the order. `staysBySpot` holds every placed stay that may overlap (the caller filters by time).
 */
export function scoreSpot(
  spot: FileSpot,
  file: FileSpot[],
  stay: { arrivalAt: Date; returnAt: Date },
  staysBySpot: Map<string, FileStay[]>,
  sameWaveHours = SAME_WAVE_HOURS,
): FileScore {
  const depth = spot.depth ?? 0;
  const blocking: Blocker[] = [];
  const blocked: Blocker[] = [];
  let fit: number | null = null;
  for (const other of file) {
    if (other.id === spot.id || other.depth === null) continue;
    for (const s of staysBySpot.get(other.id) ?? []) {
      if (!(s.arrivalAt < stay.returnAt && s.returnAt > stay.arrivalAt)) continue;
      const blocker: Blocker = { reservationId: s.reservationId, reference: s.reference, spotCode: other.code, returnAt: s.returnAt };
      if (other.depth < depth) {
        // In front: must be gone when this car leaves.
        if (leavesAfter(s.returnAt, stay.returnAt, sameWaveHours)) blocking.push(blocker);
        else {
          const gap = (stay.returnAt.getTime() - s.returnAt.getTime()) / 60_000;
          if (fit === null || gap < fit) fit = Math.max(0, gap);
        }
      } else if (leavesAfter(stay.returnAt, s.returnAt, sameWaveHours)) {
        // Behind: this car must not leave after it.
        blocked.push(blocker);
      }
    }
  }
  return { moves: blocking.length + blocked.length, blocking, blocked, fitMinutes: fit };
}

/** The cars in front of a placed stay that leave after it: what blocks its return today. */
export function blockersOf(
  stay: FileStay,
  spot: FileSpot,
  file: FileSpot[],
  staysBySpot: Map<string, FileStay[]>,
  sameWaveHours = SAME_WAVE_HOURS,
): Blocker[] {
  return scoreSpot(spot, file, stay, staysBySpot, sameWaveHours).blocking;
}
