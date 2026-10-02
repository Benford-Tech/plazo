import { TIMEZONE } from "./site";
import type { CancellationPolicy } from "./types";

/**
 * Dates exchanged with the API are wall-clock times at the parking ("2026-10-04T06:30", Europe/Paris).
 * French display strings are built by hand so that the server and the browser always agree.
 */

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Longest stay the API accepts. */
export const MAX_STAY_DAYS = 90;

export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === mo - 1 && utc.getUTCDate() === d;
}

export function isValidTime(time: string): boolean {
  const m = TIME_RE.exec(time);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** Splits "2026-10-04T06:30" into its date and time, or null when it is not a real local datetime. */
export function parseLocal(value: string | null | undefined): { date: string; time: string } | null {
  if (!value || !LOCAL_RE.test(value)) return null;
  const [date, time] = value.split("T");
  return isValidDate(date) && isValidTime(time) ? { date, time } : null;
}

/** "2026-10-04" + "06:30" -> "2026-10-04T06:30", or null when either part is invalid. */
export function joinLocal(date: string | null | undefined, time: string | null | undefined): string | null {
  if (!date || !time || !isValidDate(date) || !isValidTime(time)) return null;
  return `${date}T${time}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function zoneParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Wall-clock time of an instant in a time zone, as "YYYY-MM-DDTHH:mm". */
export function fromInstant(instant: Date, timeZone: string = TIMEZONE): string {
  const p = zoneParts(instant, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

function offsetMinutes(instant: Date, timeZone: string): number {
  const p = zoneParts(instant, timeZone);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - instant.getTime()) / 60000);
}

/** Instant of a local wall-clock time (same rules as the API, DST transitions included). */
export function toInstant(local: string, timeZone: string = TIMEZONE): Date | null {
  const parsed = parseLocal(local);
  if (!parsed) return null;
  const [y, mo, d] = parsed.date.split("-").map(Number);
  const [h, mi] = parsed.time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let utc = naive - offsetMinutes(new Date(naive), timeZone) * 60000;
  utc = naive - offsetMinutes(new Date(utc), timeZone) * 60000;
  return new Date(utc);
}

/** Today's date at the parking, "YYYY-MM-DD". */
export function todayLocal(now: Date = new Date(), timeZone: string = TIMEZONE): string {
  return fromInstant(now, timeZone).slice(0, 10);
}

/** Dates suggested in an empty search form: tomorrow 08:00 to a week later 18:00. */
export function defaultStay(now: Date = new Date(), timeZone: string = TIMEZONE): { arrivee: string; retour: string } {
  const tomorrow = addDays(todayLocal(now, timeZone), 1);
  return { arrivee: `${tomorrow}T08:00`, retour: `${addDays(tomorrow, 7)}T18:00` };
}

/** "2026-10-04" -> "dim. 4 oct." */
export function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * Short dates of a stay, for the phone's single "Vos dates" pill: the return drops its month when
 * it is the drop-off's ("sam. 3 oct." → "sam. 10"), and shows its year when that differs.
 */
export function formatStayDates(start: string, end: string): { start: string; end: string } {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  if (sameYear && a.getUTCMonth() === b.getUTCMonth()) return { start: formatDay(start), end: `${WEEKDAYS[b.getUTCDay()]} ${b.getUTCDate()}` };
  return { start: formatDay(start), end: sameYear ? formatDay(end) : `${formatDay(end)} ${b.getUTCFullYear()}` };
}

/** "2026-10-04T06:30" -> "dim. 4 oct. · 06:30" */
export function formatDateTime(local: string): string {
  const parsed = parseLocal(local);
  return parsed ? `${formatDay(parsed.date)} · ${parsed.time}` : local;
}

/** "2026-10-03T06:30" -> "sam. 3 oct. à 06:30" */
export function formatDateTimeAt(local: string): string {
  const parsed = parseLocal(local);
  return parsed ? `${formatDay(parsed.date)} à ${parsed.time}` : local;
}

/** Billable days of a stay, as the API counts them: every local calendar day touched. */
export function stayDays(arrivee: string, retour: string): number {
  const first = arrivee.slice(0, 10);
  const last = retour.slice(0, 10);
  let days = 1;
  for (let d = first; d < last; d = addDays(d, 1)) days += 1;
  return days;
}

export function daysLabel(days: number): string {
  return `${days} jour${days > 1 ? "s" : ""}`;
}

const POLICY_HOURS: Record<CancellationPolicy, number | null> = {
  free_until_arrival: 0,
  free_24h: 24,
  free_48h: 48,
  non_refundable: null,
};

/** Last moment of free online cancellation (local time), or null when the booking cannot be cancelled. */
export function cancellableUntil(policy: CancellationPolicy, arrivee: string, timeZone: string = TIMEZONE): string | null {
  const hours = POLICY_HOURS[policy];
  if (hours === null || hours === undefined) return null;
  const instant = toInstant(arrivee, timeZone);
  if (!instant) return null;
  return fromInstant(new Date(instant.getTime() - hours * 3600000), timeZone);
}

export type StayErrorCode = "required" | "invalid_datetime" | "return_before_arrival" | "arrival_in_past" | "stay_too_long";

/** Same checks as the API, so that obviously wrong dates never reach it. Empty object when valid. */
export function validateStay(
  arrivee: string | null | undefined,
  retour: string | null | undefined,
  now: Date = new Date(),
  timeZone: string = TIMEZONE,
): { arrivalAt?: StayErrorCode; returnAt?: StayErrorCode } {
  const errors: { arrivalAt?: StayErrorCode; returnAt?: StayErrorCode } = {};
  if (!arrivee) errors.arrivalAt = "required";
  else if (!parseLocal(arrivee)) errors.arrivalAt = "invalid_datetime";
  if (!retour) errors.returnAt = "required";
  else if (!parseLocal(retour)) errors.returnAt = "invalid_datetime";
  if (errors.arrivalAt || errors.returnAt) return errors;
  const a = toInstant(arrivee!, timeZone)!;
  const r = toInstant(retour!, timeZone)!;
  if (r <= a) errors.returnAt = "return_before_arrival";
  // Calendar days, like the API: a stay across a clock change is not an hour off.
  else if (retour! > `${addDays(arrivee!.slice(0, 10), MAX_STAY_DAYS)}${arrivee!.slice(10)}`) errors.returnAt = "stay_too_long";
  // The API tolerates one hour in the past (a traveller booking at the gate).
  if (a.getTime() < now.getTime() - 3600000) errors.arrivalAt = "arrival_in_past";
  return errors;
}

type Params = Record<string, string | string[] | undefined>;

/** First value of a search param. */
export function param(params: Params, name: string): string | undefined {
  const value = params[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Stay from a page's search params (?arrivee=…&retour=…), unvalidated. */
export function stayFromParams(params: Params): { arrivee: string | null; retour: string | null } {
  return { arrivee: param(params, "arrivee") || null, retour: param(params, "retour") || null };
}

/** Encodes a query value but keeps ":" readable (allowed in a query string): "2026-10-04T06:30". */
export function encodeQueryValue(value: string): string {
  return encodeURIComponent(value).replace(/%3A/gi, ":");
}

/** Query string of a stay, e.g. "?arrivee=2026-10-04T06:30&retour=2026-10-11T15:05" ("" without dates). */
export function stayQuery(stay: { arrivee: string | null; retour: string | null }): string {
  if (!stay.arrivee || !stay.retour) return "";
  return `?arrivee=${encodeQueryValue(stay.arrivee)}&retour=${encodeQueryValue(stay.retour)}`;
}
