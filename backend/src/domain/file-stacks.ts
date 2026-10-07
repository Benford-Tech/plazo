/**
 * S-C "Des files, pas des places" (07/10/2026). On a valet parking the cars are stored in files,
 * nose to tail, entered and left through the aisle: the last car in stands in front. A file is sound
 * when every car leaves before (or with) the ones behind it, so nobody ever moves a car to free
 * another one. This module is pure: it says where an arriving car should go, what a file costs
 * today, and which empty files the night preparation keeps for the big return days.
 *
 * The rule ("patience sorting"): an arriving car goes to the file whose front car leaves the
 * earliest while still leaving after it (the tightest fit); failing that, it opens a file. It needs
 * the fewest files possible and never puts a car in front of one that leaves earlier.
 */

/** Two cars whose returns fall within this many hours leave together: no order between them. */
export const SAME_WAVE_HOURS = 2;

export interface StackCar {
  reservationId: string;
  reference: string;
  plate: string;
  customerName: string;
  returnAt: Date;
  /** Entry order (1 = deepest, at the back). */
  rank: number;
}

export interface StackFile {
  id: string;
  code: string;
  capacity: number;
  active: boolean;
  sortOrder: number;
  /** Return day (YYYY-MM-DD) an empty file is kept for by the night preparation. */
  plannedDay: string | null;
  /** Cars in the file, any order. */
  cars: StackCar[];
}

export type FileReason = 'planned_day' | 'tight_fit' | 'empty' | 'moves' | 'full';

export interface FileChoice {
  fileId: string;
  code: string;
  reason: FileReason;
  /** Cars already in the file that leave before this one: they would be blocked by it. */
  moves: number;
  /** Cars the file holds and its capacity, for the label "3 / 8". */
  cars: number;
  capacity: number;
  /** Minutes between the front car's return and this one (small = tight fit); null on an empty file. */
  fitMinutes: number | null;
}

/** Whether `other` leaves clearly after `mine`. */
export function leavesAfter(other: Date, mine: Date, waveHours = SAME_WAVE_HOURS): boolean {
  return other.getTime() - mine.getTime() > waveHours * 3_600_000;
}

/** The cars of a file from the back to the front (entry order). */
export function stackOf(file: Pick<StackFile, 'cars'>): StackCar[] {
  return [...file.cars].sort((a, b) => a.rank - b.rank);
}

/** The front car (last in), or null on an empty file. */
export function frontCar(file: Pick<StackFile, 'cars'>): StackCar | null {
  const stack = stackOf(file);
  return stack.length ? stack[stack.length - 1] : null;
}

/** Position from the aisle (1 = first out) of a car in its file. */
export function positionFromAisle(file: Pick<StackFile, 'cars'>, reservationId: string): number | null {
  const stack = stackOf(file);
  const i = stack.findIndex(c => c.reservationId === reservationId);
  return i < 0 ? null : stack.length - i;
}

/**
 * For each car of the file, the cars in front of it that leave later (to take out before it can
 * leave). A sound file has none.
 */
export function blockersIn(file: Pick<StackFile, 'cars'>, waveHours = SAME_WAVE_HOURS): Map<string, StackCar[]> {
  const stack = stackOf(file);
  const out = new Map<string, StackCar[]>();
  stack.forEach((car, i) => {
    const inFront = stack.slice(i + 1).filter(other => leavesAfter(other.returnAt, car.returnAt, waveHours));
    if (inFront.length) out.set(car.reservationId, inFront);
  });
  return out;
}

/** Cars to move today: the blockers of the cars returning between `start` and `end`. */
export function movesToday(file: Pick<StackFile, 'cars'>, start: Date, end: Date, waveHours = SAME_WAVE_HOURS): number {
  const blockers = blockersIn(file, waveHours);
  const ids = new Set<string>();
  for (const car of file.cars) {
    if (car.returnAt < start || car.returnAt >= end) continue;
    for (const b of blockers.get(car.reservationId) ?? []) ids.add(b.reservationId);
  }
  return ids.size;
}

/** The cost of entering a file: cars already there that leave before this one. */
function movesFor(file: Pick<StackFile, 'cars'>, returnAt: Date, waveHours: number): number {
  return file.cars.filter(c => leavesAfter(returnAt, c.returnAt, waveHours)).length;
}

/**
 * Ranks the files for an arriving car. First the files that cost no move: one already serving its
 * return day, then the tightest fit behind the front car, then an empty file kept for its day, then
 * an empty free file, then an empty file kept for another day; full files and files that cost
 * moves come last. `returnDay` is the car's return day in the parking's time zone.
 */
export function rankFiles(
  files: StackFile[],
  stay: { returnAt: Date; returnDay: string },
  options: { waveHours?: number; skip?: Set<string>; localDay?: LocalDay } = {},
): FileChoice[] {
  const wave = options.waveHours ?? SAME_WAVE_HOURS;
  const localDayOf = options.localDay ?? utcDay;
  const scored = files
    .filter(f => f.active && !options.skip?.has(f.id))
    .map(f => {
      const front = frontCar(f);
      const full = f.cars.length >= f.capacity;
      const moves = movesFor(f, stay.returnAt, wave);
      const fit = front ? Math.max(0, (front.returnAt.getTime() - stay.returnAt.getTime()) / 60_000) : null;
      let reason: FileReason;
      let tier: number;
      if (full) {
        reason = 'full';
        tier = 6;
      } else if (moves) {
        reason = 'moves';
        tier = 5;
      } else if (front) {
        // A file already serving this return day, else the tightest fit behind a later return.
        reason = localDayOf(front.returnAt) === stay.returnDay ? 'planned_day' : 'tight_fit';
        tier = reason === 'planned_day' ? 0 : 1;
      } else if (f.plannedDay === stay.returnDay) {
        reason = 'planned_day';
        tier = 2;
      } else if (!f.plannedDay) {
        reason = 'empty';
        tier = 3;
      } else {
        reason = 'empty';
        tier = 4;
      }
      const choice: FileChoice = { fileId: f.id, code: f.code, reason, moves, cars: f.cars.length, capacity: f.capacity, fitMinutes: fit };
      return { choice, tier, fit: fit ?? Number.MAX_SAFE_INTEGER, order: f.sortOrder };
    });
  scored.sort((a, b) => a.tier - b.tier || a.choice.moves - b.choice.moves || a.fit - b.fit || a.order - b.order);
  return scored.map(s => s.choice);
}

/** How a Date maps to the parking's local day (YYYY-MM-DD). */
export type LocalDay = (d: Date) => string;
const utcDay: LocalDay = d => d.toISOString().slice(0, 10);

export interface ExpectedReturns {
  /** Return day (YYYY-MM-DD). */
  day: string;
  /** Cars expected back that day that are not in a file yet. */
  cars: number;
}

/**
 * Night preparation: keeps empty files for the days with the most cars to come, so a big return
 * day is not scattered across files that other days then block. Returns the planned day of every
 * empty file (null when it stays free). Files with cars keep their role from their front car.
 */
export function planEmptyFiles(files: StackFile[], expected: ExpectedReturns[], localDayOf: LocalDay = utcDay): Map<string, string | null> {
  const plan = new Map<string, string | null>();
  const empty = files.filter(f => f.active && f.cars.length === 0).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const f of empty) plan.set(f.id, null);
  if (!empty.length) return plan;
  const avgCapacity = Math.max(1, Math.round(empty.reduce((s, f) => s + f.capacity, 0) / empty.length));
  // Room already open for a day: free slots of the files whose front car returns that day.
  const openRoom = new Map<string, number>();
  for (const f of files) {
    if (!f.active || !f.cars.length) continue;
    const front = frontCar(f) as StackCar;
    const day = localDayOf(front.returnAt);
    openRoom.set(day, (openRoom.get(day) ?? 0) + Math.max(0, f.capacity - f.cars.length));
  }
  // A day is worth a file of its own from half a file of cars still to come.
  const worth = Math.ceil(avgCapacity / 2);
  const needs = expected
    .map(e => ({ day: e.day, cars: Math.max(0, e.cars - (openRoom.get(e.day) ?? 0)) }))
    .filter(e => e.cars >= worth)
    .sort((a, b) => b.cars - a.cars || a.day.localeCompare(b.day));
  // Keep at least a third of the empty files free for the unexpected (walk-ins, changed returns).
  let available = Math.max(0, empty.length - Math.ceil(empty.length / 3));
  const queue = [...empty];
  for (const need of needs) {
    const wanted = Math.ceil(need.cars / avgCapacity);
    for (let i = 0; i < wanted && available > 0; i++) {
      const f = queue.shift();
      if (!f) break;
      plan.set(f.id, need.day);
      available -= 1;
    }
    if (available <= 0) break;
  }
  return plan;
}
