/**
 * The parking's SMS phone (06/11/2026, « ajoute un historique d'état du téléphone de service », direction A with the alert
 * of C, maquettes https://claude.ai/artifact/EoG7vfKDXPud3VyAkDtdGg). Every 15 minutes Plazo asks the SMS app's server when
 * the phone was last seen; these pure rules turn the checks into the 7-day ribbon, the list of changes and the alert.
 */
import { dayBounds, localDateTime } from './time';

export type PhoneState = 'online' | 'offline' | 'unknown';
/** The ribbon also has the time nobody knows about: before the first check, a missed check, the rest of today. */
export type RibbonState = PhoneState | 'none';

/** Not seen for longer than this: offline (the app pings every 5 minutes, PHONE_PING_SECONDS). */
export const PHONE_OFFLINE_AFTER_MS = 15 * 60 * 1000;
/** The crons call every 15 minutes; two calls closer than this check once. */
export const PHONE_CHECK_MIN_GAP_MS = 10 * 60 * 1000;
/** A check stands for the time until the next one, 20 minutes at most: beyond, nothing is known. */
export const PHONE_CHECK_SPAN_MS = 20 * 60 * 1000;
/** The ping Plazo asks the app for, so that an idle phone is still seen. */
export const PHONE_PING_SECONDS = 300;
/**
 * 07/11/2026 (« Faudrait espacer les envois », après 7 à 9 SMS de la veille abandonnés d'un coup): the app waits 30 to 60 s
 * between two SMS, so a burst (the day-before SMS of a whole evening) leaves the phone one by one. Ten SMS take about 8
 * minutes, far within the 2 hours an SMS waits at the gateway.
 */
export const PHONE_SEND_INTERVAL_MIN_SECONDS = 30;
export const PHONE_SEND_INTERVAL_MAX_SECONDS = 60;
export const PHONE_HISTORY_DAYS = 7;
export const PHONE_CHECKS_KEPT_DAYS = 30;
/** Failed SMS of one kind less than this apart are one line of the history. */
const FAILURE_GROUP_GAP_MS = 30 * 60 * 1000;

export interface PhoneCheck {
  checkedAt: Date;
  state: PhoneState;
  lastSeenAt: Date | null;
}

export function phoneStateOf(lastSeen: Date | null, now: Date): Exclude<PhoneState, 'unknown'> {
  return lastSeen && now.getTime() - lastSeen.getTime() <= PHONE_OFFLINE_AFTER_MS ? 'online' : 'offline';
}

export interface RibbonSegment {
  /** Fractions of the local day, 0 to 1. */
  start: number;
  end: number;
  /** Local "HH:mm". */
  from: string;
  to: string;
  state: RibbonState;
}

const hhmm = (instant: Date, tz: string) => localDateTime(instant, tz).slice(11, 16);

/** One local day of the ribbon, from the checks sorted by time (those of the day before included, for its start). */
export function daySegments(checks: PhoneCheck[], day: string, tz: string, now: Date): RibbonSegment[] {
  const { start, end } = dayBounds(day, tz);
  const length = end.getTime() - start.getTime();
  const covered: { from: number; to: number; state: RibbonState }[] = [];
  checks.forEach((check, i) => {
    const next = checks[i + 1]?.checkedAt.getTime() ?? Infinity;
    const from = Math.max(check.checkedAt.getTime(), start.getTime());
    const to = Math.min(next, check.checkedAt.getTime() + PHONE_CHECK_SPAN_MS, now.getTime(), end.getTime());
    if (to > from) covered.push({ from, to, state: check.state });
  });
  const pieces: { from: number; to: number; state: RibbonState }[] = [];
  let cursor = start.getTime();
  for (const piece of covered) {
    if (piece.from > cursor) pieces.push({ from: cursor, to: piece.from, state: 'none' });
    pieces.push(piece);
    cursor = piece.to;
  }
  if (cursor < end.getTime()) pieces.push({ from: cursor, to: end.getTime(), state: 'none' });
  const merged: typeof pieces = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last && last.state === piece.state && last.to === piece.from) last.to = piece.to;
    else merged.push({ ...piece });
  }
  return merged.map(p => ({
    start: (p.from - start.getTime()) / length,
    end: (p.to - start.getTime()) / length,
    from: hhmm(new Date(p.from), tz),
    to: p.to === end.getTime() ? '24:00' : hhmm(new Date(p.to), tz),
    state: p.state,
  }));
}

export type PhoneEvent =
  | { kind: 'state'; at: Date; state: PhoneState; lastSeenAt: Date | null; /** How long the state before lasted. */ afterMs: number | null }
  | { kind: 'sms_failed'; at: Date; smsKind: string; status: 'failed' | 'abandoned'; count: number };

/** The changes of state, oldest first: a check whose state differs from the one before (a missed check changes nothing). */
export function stateChanges(checks: PhoneCheck[]): PhoneEvent[] {
  const events: PhoneEvent[] = [];
  let since: Date | null = null;
  checks.forEach((check, i) => {
    const previous = checks[i - 1];
    if (previous && previous.state === check.state) return;
    // An outage starts when the phone was last seen; it ends at the check that sees it again.
    const startedAt =
      check.state === 'offline' && check.lastSeenAt && (!previous || check.lastSeenAt > previous.checkedAt) ? check.lastSeenAt : check.checkedAt;
    if (previous)
      events.push({
        kind: 'state',
        at: check.checkedAt,
        state: check.state,
        lastSeenAt: check.lastSeenAt,
        afterMs: since ? startedAt.getTime() - since.getTime() : null,
      });
    since = startedAt;
  });
  return events;
}

export interface FailedSms {
  kind: string;
  status: 'failed' | 'abandoned';
  createdAt: Date;
  /** For an abandoned SMS, when Plazo gave up on it. */
  updatedAt: Date;
}

/** The SMS that did not leave, one line per kind and burst (the 8 day-before SMS of an evening are one line). */
export function failureEvents(rows: FailedSms[]): PhoneEvent[] {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const groups: { first: FailedSms; last: FailedSms; count: number }[] = [];
  for (const row of sorted) {
    const group = [...groups].reverse().find(g => g.first.kind === row.kind && g.first.status === row.status);
    if (group && row.createdAt.getTime() - group.last.createdAt.getTime() <= FAILURE_GROUP_GAP_MS) {
      group.last = row;
      group.count += 1;
    } else groups.push({ first: row, last: row, count: 1 });
  }
  return groups.map(g => ({
    kind: 'sms_failed' as const,
    at: g.first.status === 'abandoned' ? g.last.updatedAt : g.first.createdAt,
    smsKind: g.first.kind,
    status: g.first.status,
    count: g.count,
  }));
}

/** The push to the managers when the phone stops answering: once per outage. */
export function offlineAlert(input: { lastSeenAt: Date | null; reminderAt: string | null; tz: string }): { title: string; body: string } {
  const since = input.lastSeenAt ? `Plus de nouvelles depuis ${hhmm(input.lastSeenAt, input.tz)}.` : "Le téléphone ne s'est pas manifesté.";
  const then = input.reminderAt
    ? ` Le SMS de la veille part à ${input.reminderAt} : ouvrez l'appli SMS.`
    : " Les SMS aux voyageurs attendront son retour : ouvrez l'appli SMS.";
  return { title: 'Téléphone SMS hors ligne', body: `${since}${then}` };
}
