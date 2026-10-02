import { addDays, daysLabel, formatDay, isValidDate, isValidTime, stayDays } from "./dates";
import { fr } from "./fr";

/**
 * Logic of the stay pickers (calendar of the drop-off/return range and time slots), kept free of
 * React so that it is tested on its own. Dates are local "YYYY-MM-DD" strings, months "YYYY-MM".
 */

/** Weekday initials, Monday first (French calendars). */
export const WEEKDAY_INITIALS = ["lu", "ma", "me", "je", "ve", "sa", "di"] as const;
export const WEEKDAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
const MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function utc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: string): number {
  return (utc(date).getUTCDay() + 6) % 7;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Weeks of a month, Monday first; days of the neighbouring months are null. */
export function monthWeeks(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const cells: (string | null)[] = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let d = 1; d <= daysInMonth(month); d += 1) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "2026-10" -> "Octobre 2026" */
export function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const name = MONTH_NAMES[m - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** "2026-10-10" -> "samedi 10 octobre 2026" (labels of the calendar's days). */
export function formatDayLong(date: string): string {
  const d = utc(date);
  return `${WEEKDAY_NAMES[weekdayIndex(date)]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Days before today at the parking cannot be picked. */
export function isDisabled(date: string, minDate: string): boolean {
  return date < minDate;
}

export type Side = "start" | "end";

/** A range being picked: the next click sets `picking`. */
export interface RangeDraft {
  start: string | null;
  end: string | null;
  picking: Side;
}

/**
 * Applies a click on a day. Picking the drop-off keeps the return when it still comes after it,
 * then asks for the return; a return before the drop-off becomes the new drop-off.
 */
export function pickDay(draft: RangeDraft, day: string, minDate: string): RangeDraft {
  if (isDisabled(day, minDate)) return draft;
  if (draft.picking === "start" || !draft.start) {
    return { start: day, end: draft.end && draft.end >= day ? draft.end : null, picking: "end" };
  }
  if (day < draft.start) return { start: day, end: null, picking: "end" };
  return { start: draft.start, end: day, picking: "start" };
}

export type DayState = "start" | "end" | "single" | "between" | null;

/** Place of a day in the range (both ends on the same day: "single"). */
export function dayState(day: string, draft: Pick<RangeDraft, "start" | "end">): DayState {
  const { start, end } = draft;
  if (start && end && start === end && day === start) return "single";
  if (day === start) return "start";
  if (day === end) return "end";
  if (start && end && day > start && day < end) return "between";
  return null;
}

/** Billable days of a range (every local day touched, inclusive), as the API counts them. */
export function rangeDays(start: string | null, end: string | null): number | null {
  return start && end && end >= start ? stayDays(start, end) : null;
}

/** "sam. 10 oct. → mer. 14 oct. · 5 jours" (or what is still missing). */
export function rangeSummary(start: string | null, end: string | null): { dates: string; days: string | null } {
  if (!start) return { dates: fr.picker.pickDropOff, days: null };
  if (!end) return { dates: `${formatDay(start)} → ${fr.picker.pickReturn}`, days: null };
  return { dates: `${formatDay(start)} → ${formatDay(end)}`, days: daysLabel(rangeDays(start, end)!) };
}

/** Where a key moves the focused day of the calendar (null: not a navigation key). Never before minDate. */
export function moveFocus(date: string, key: string, minDate: string): string | null {
  let next: string;
  switch (key) {
    case "ArrowLeft":
      next = addDays(date, -1);
      break;
    case "ArrowRight":
      next = addDays(date, 1);
      break;
    case "ArrowUp":
      next = addDays(date, -7);
      break;
    case "ArrowDown":
      next = addDays(date, 7);
      break;
    case "Home":
      next = addDays(date, -weekdayIndex(date));
      break;
    case "End":
      next = addDays(date, 6 - weekdayIndex(date));
      break;
    case "PageUp":
    case "PageDown": {
      const month = addMonths(monthOf(date), key === "PageUp" ? -1 : 1);
      const day = Math.min(Number(date.slice(8, 10)), daysInMonth(month));
      next = `${month}-${String(day).padStart(2, "0")}`;
      break;
    }
    default:
      return null;
  }
  return next < minDate ? minDate : next;
}

/** First month shown so that `focus` is visible among `count` months starting at `view`. */
export function viewFor(view: string, focus: string, count: number): string {
  const month = monthOf(focus);
  if (month < view) return month;
  const last = addMonths(view, count - 1);
  return month > last ? addMonths(month, -(count - 1)) : view;
}

/** Half-hour slots offered by the time pickers. */
export const TIME_SLOTS: string[] = Array.from({ length: (24 - 5) * 2 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});

/** The slots, plus the current time when it is not one of them (e.g. 15:05 from a shared link). */
export function timeOptions(current: string | null | undefined): string[] {
  if (!current || !isValidTime(current) || TIME_SLOTS.includes(current)) return TIME_SLOTS;
  return [...TIME_SLOTS, current].sort();
}

/** A date given to the pickers, or null when it is not a real date. */
export function validDateOrNull(date: string | null | undefined): string | null {
  return date && isValidDate(date) ? date : null;
}
