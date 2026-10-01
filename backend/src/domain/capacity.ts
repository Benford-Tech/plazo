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
