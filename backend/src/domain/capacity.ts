/**
 * Number of spots that can be booked once the safety margin is set aside.
 * Rounds down: a partial spot is never bookable.
 */
export function bookableCapacity(totalCapacity: number, safetyMarginPct: number): number {
  if (!Number.isInteger(totalCapacity) || totalCapacity <= 0) {
    throw new RangeError('totalCapacity must be a positive integer');
  }
  if (!Number.isInteger(safetyMarginPct) || safetyMarginPct < 0 || safetyMarginPct > 50) {
    throw new RangeError('safetyMarginPct must be an integer between 0 and 50');
  }
  return Math.floor((totalCapacity * (100 - safetyMarginPct)) / 100);
}

/** Where the capacity used everywhere comes from: the valet files, the plan's spots, or the figure typed by the operator. */
export type CapacitySource = 'files' | 'spots' | 'declared';

export interface PlanCapacity {
  /** Sum of the capacities of the active files (0 without files). */
  activeFilesCapacity: number;
  /** Active spots of the plan, laid by hand and reserved ones included (0 without a plan). */
  activeSpots: number;
}

export interface EffectiveCapacity {
  total: number;
  source: CapacitySource;
}

/**
 * The parking's capacity used everywhere (bookings, site, planning, dashboard; 09/10/2026, « le
 * nombre de places généré doit être pris en compte dans toute l'application »): the room in the
 * active files when there is any, else the active spots of the plan, else the declared figure.
 * The safety margin still applies on top (`bookableCapacity`).
 */
export function effectiveCapacity(input: PlanCapacity & { declared: number }): EffectiveCapacity {
  if (input.activeFilesCapacity > 0) return { total: input.activeFilesCapacity, source: 'files' };
  if (input.activeSpots > 0) return { total: input.activeSpots, source: 'spots' };
  return { total: input.declared, source: 'declared' };
}

/** Room in the active files (a closed file takes no new car). */
export function activeFilesCapacity(files: { active: boolean; capacity: number }[]): number {
  return files.reduce((sum, f) => sum + (f.active ? f.capacity : 0), 0);
}

/** Spots that count: an inactive spot stays on the plan but counts for nothing. */
export function activeSpotCount(spots: { active: boolean }[]): number {
  return spots.reduce((sum, s) => sum + (s.active ? 1 : 0), 0);
}
