// 26/11/2026, widget B « Calendrier et trois étapes »: the calendar of a parking's booking module. Plain local dates
// « AAAA-MM-JJ » and times « HH:mm », never Date objects in a time zone: the parking's day is what the traveller picks.

export type Day = string; // AAAA-MM-JJ

function toUtc(day: Day): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: Day, days: number): Day {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addMonths(month: string, months: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 7);
}

/** The month's weeks, Monday first; null fills the days of the weeks outside the month. */
export function monthGrid(month: string): (Day | null)[][] {
  const first = `${month}-01`;
  const lead = (toUtc(first).getUTCDay() + 6) % 7;
  const cells: (Day | null)[] = Array.from({ length: lead }, () => null);
  for (let day = first; day.startsWith(month); day = addDays(day, 1)) cells.push(day);
  while (cells.length % 7) cells.push(null);
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A stay from `from` to `to` crosses a full night (the return day itself is not a night). */
export function crossesFull(from: Day, to: Day, full: ReadonlySet<Day>): boolean {
  for (let day = from; day < to || day === from; day = addDays(day, 1)) if (full.has(day)) return true;
  return false;
}

export interface Range {
  from: Day | null;
  to: Day | null;
}

/**
 * A touch on a day: the first sets the drop-off, the second the return (the same day is allowed); a day before the
 * drop-off, or a touch once both are set, starts again from that day.
 */
export function pick(range: Range, day: Day): Range {
  if (!range.from || range.to || day < range.from) return { from: day, to: null };
  return { from: range.from, to: day };
}

/** Whether a day can be touched now: not past, not full as a drop-off, no full night between the drop-off and it. */
export function selectable(range: Range, day: Day, today: Day, full: ReadonlySet<Day>): boolean {
  if (day < today) return false;
  const choosingReturn = !!range.from && !range.to && day >= range.from;
  if (choosingReturn) return !crossesFull(range.from!, day, full);
  return !full.has(day);
}

/** Every half hour of the day, « 00:00 » to « 23:30 ». */
export const HALF_HOURS: string[] = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

/** The few times offered as pills; any other comes from the list. */
export const DROP_OFF_TIMES = ["06:00", "08:00", "10:00", "14:00"];
export const RETURN_TIMES = ["12:00", "18:00", "21:00", "23:00"];
