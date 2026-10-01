/**
 * Timezone helpers without dependencies. Reservations are stored in UTC; the parking's
 * timezone (Europe/Paris for the MVP) defines local dates, times and "nights".
 */

function offsetMinutes(utc: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(utc);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - utc.getTime()) / 60000);
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const OFFSET_RE = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parses either an ISO instant with an offset ("2026-10-04T04:30:00Z") or a local wall-clock time
 * without offset ("2026-10-04T06:30"), interpreted in `timeZone`. Returns null when invalid.
 */
export function parseInstant(value: string, timeZone: string): Date | null {
  if (OFFSET_RE.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = LOCAL_RE.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the DST transition hours.
  let utc = naive - offsetMinutes(new Date(naive), timeZone) * 60000;
  utc = naive - offsetMinutes(new Date(utc), timeZone) * 60000;
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** Local calendar date (YYYY-MM-DD) of an instant in `timeZone`. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** UTC instants bounding a local calendar day: [start, end). */
export function dayBounds(date: string, timeZone: string): { start: Date; end: Date } {
  return { start: parseInstant(`${date}T00:00`, timeZone)!, end: parseInstant(`${addDays(date, 1)}T00:00`, timeZone)! };
}
