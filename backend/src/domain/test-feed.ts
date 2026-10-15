import type { ReservationChannel, ReservationStatus } from '@/database';
import { AWAY_STATUSES, statusSideEffects } from './reservation';
import {
  DROPOFF_LIST_HOURS_AFTER,
  DROPOFF_LIST_HOURS_BEFORE,
  PICKUP_LIST_HOURS_AFTER,
  PICKUP_LIST_HOURS_AHEAD,
  PICKUP_LIST_HOURS_BEFORE,
  PICKUP_STATUSES,
} from './shuttle';
import { WAVE_WINDOW_MINUTES } from './shuttle-waves';

/**
 * The continuous test feed of the platform's own test operator (15/10/2026, « ajoute en continu des données de tests
 * pour le chauffeur pour qu'il ait toujours des personnes à emmener »): 40 fictional bookings (TS-201-PZ to TS-240-PZ)
 * recycled so that a driver always finds travellers to take to the terminal (« À emmener ») and to fetch at the airport
 * (« À récupérer »), at any hour. The server runs it when someone reads the driver's lists (TestFeedService); this
 * module is the pure part: who may be written, and the plan of one run (planFeed).
 *
 * The rules that keep a driver safe: a passenger of a running trip (or of one ended less than 10 minutes ago), a row
 * locked by someone else and a row someone else changed less than 10 minutes ago are never written; a row listed to the
 * driver only ever gets the two moves that keep it listed and boardable (check-in, return call); any other write goes
 * to rows outside both lists, at least 15 minutes after they left them.
 */

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Size of the pool: TS-201-PZ to TS-240-PZ. */
export const TEST_FEED_POOL_SIZE = 40;
/** The pool's rows carry this external reference, then the plate's key (TEST-FEED-TS201PZ). */
export const TEST_FEED_REFERENCE_PREFIX = 'TEST-FEED-';
export const TEST_FEED_NOTE = 'Réservation fictive (flux continu de test Plazo)';
/** At most one run every 3 minutes (test_feeds.ranAt); 10 seconds for « feed-run ». */
export const TEST_FEED_RUN_EVERY_MINUTES = 3;
export const TEST_FEED_MANUAL_RUN_EVERY_SECONDS = 10;
/** A server instance does not even look for this long after it tried an operator. */
export const TEST_FEED_MEMO_SECONDS = 60;
/** Rows written by someone else (or passengers of a trip just ended) are left alone this long. */
export const TEST_FEED_HANDS_OFF_MINUTES = 10;
/** A row that left one of the driver's lists is not rewritten before this long (the app reads every 12 s, the web 30 s). */
export const TEST_FEED_LIST_MARGIN_MINUTES = 15;
/** Every stay lasts at least this long: a traveller waiting to go is never also one to fetch. */
export const TEST_FEED_MIN_STAY_MINUTES = 25 * 60;
/** Checked in only when the stay still lasts this long after the check-in. */
export const TEST_FEED_CHECK_IN_MIN_STAY_MINUTES = 24 * 60 + 30;
export const TEST_FEED_MAX_WRITES_PER_RUN = 30;
/** Writes of a run kept for the targets (E): the moves that close stale bookings stop short of them. */
export const TEST_FEED_TARGETS_ROOM = 12;
export const TEST_FEED_MAX_REBOOKS_PER_HOUR = 8;
/** Two feed arrivals (T1) are this far apart at least. */
export const TEST_FEED_ARRIVAL_GAP_MINUTES = 20;
/** A traveller is checked in 0 to this many minutes after the booked arrival (rule check_in). */
export const TEST_FEED_CHECK_IN_DELAY_MINUTES = 10;
/** Below this many fictional bookings the parking is too small (half its bookable capacity at most). */
export const TEST_FEED_MIN_CAP = 6;
/** Below this many, the reduced targets. */
export const TEST_FEED_REDUCED_BELOW_CAP = 20;
/** The price of a day when the parking's grid prices nothing. */
export const TEST_FEED_DAY_PRICE_CENTS = 1500;
/** The feed's own history entries (staffId null, via test_feed) are deleted after this many days: they never pile up. */
export const TEST_FEED_AUDIT_DAYS = 7;
/** Draws of fresh references before a run gives up (a run never loops for ever). */
export const TEST_FEED_REFERENCE_DRAWS = 5;

/** The platform's test operator is named « … (tests) » (« Plazo (tests) »; never « Plazo (tests) 3 »). */
export function isTestOperatorName(name: string | null | undefined): boolean {
  return /\(tests\)\s*$/.test(name ?? '');
}

// ---------------------------------------------------------------- the pool's fictional people

const FIRST = [
  'Inès',
  'Julien',
  'Sarah',
  'Mehdi',
  'Clara',
  'Antoine',
  'Lina',
  'Maxime',
  'Zoé',
  'Karim',
  'Emma',
  'Romain',
  'Jade',
  'Yanis',
  'Louise',
  'Bastien',
  'Nora',
  'Théo',
  'Alice',
  'Samuel',
];
const LAST = [
  'Dubois',
  'Lefèvre',
  'Girard',
  'Bonnet',
  'Mercier',
  'Faure',
  'André',
  'Blanc',
  'Guérin',
  'Muller',
  'Henry',
  'Roussel',
  'Nicolas',
  'Perrin',
  'Morin',
  'Mathieu',
  'Clément',
  'Gauthier',
  'Dumont',
  'Lopez',
];
const VEHICLES: [string, string][] = [
  ['Renault Clio', 'grise'],
  ['Peugeot 308', 'bleue'],
  ['Citroën C3', 'blanche'],
  ['Volkswagen Polo', 'noire'],
  ['Toyota Corolla', 'rouge'],
  ['Dacia Duster', 'orange'],
  ['Skoda Octavia', 'grise'],
  ['Fiat 500', 'blanche'],
  ['Hyundai Tucson', 'noire'],
  ['Renault Mégane', 'bleue'],
];
const CHANNELS: [ReservationChannel, string | null][] = [
  ['phone', null],
  ['counter', null],
  ['website', null],
  ['aggregator', 'Allopark'],
  ['aggregator', 'Onepark'],
  ['phone', null],
  ['aggregator', 'Parclick'],
  ['aggregator', 'ParkMundo'],
];

export interface FeedPerson {
  index: number;
  plate: string;
  plateKey: string;
  externalReference: string;
  firstName: string;
  lastName: string;
  /** In the 06 39 98 range kept for fiction: smsRecipient refuses it. */
  phone: string;
  vehicleModel: string;
  vehicleColour: string;
  channel: ReservationChannel;
  channelDetail: string | null;
}

/** Person i (0 to 39) of the pool: always the same name, phone, car and channel for the same plate. */
export function feedPerson(index: number): FeedPerson {
  const n = String(index + 1).padStart(2, '0');
  const [vehicleModel, vehicleColour] = VEHICLES[index % VEHICLES.length];
  const [channel, channelDetail] = CHANNELS[index % CHANNELS.length];
  return {
    index,
    plate: `TS-2${n}-PZ`,
    plateKey: `TS2${n}PZ`,
    externalReference: `${TEST_FEED_REFERENCE_PREFIX}TS2${n}PZ`,
    firstName: FIRST[index % FIRST.length],
    lastName: LAST[(index * 7 + Math.floor(index / FIRST.length)) % LAST.length],
    phone: `+33 6 39 98 02 ${n}`,
    vehicleModel,
    vehicleColour,
    channel,
    channelDetail,
  };
}

export const FEED_PEOPLE: FeedPerson[] = Array.from({ length: TEST_FEED_POOL_SIZE }, (_, i) => feedPerson(i));
export const FEED_REFERENCES: string[] = FEED_PEOPLE.map(p => p.externalReference);

/** The pool's person behind an external reference, or null. */
export function feedPersonOf(externalReference: string | null | undefined): FeedPerson | null {
  return FEED_PEOPLE.find(p => p.externalReference === externalReference) ?? null;
}

// ---------------------------------------------------------------- deterministic draws

/** FNV-1a, 32 bits. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A small seeded generator (mulberry32): numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** The draws of a run: the same operator in the same minute draws the same numbers. */
export function feedRng(operatorId: string, now: Date): () => number {
  return mulberry32(fnv1a(operatorId + now.toISOString().slice(0, 16)));
}

// ---------------------------------------------------------------- local clock (formatters cached: a run asks often)

const hourFormats = new Map<string, Intl.DateTimeFormat>();
const dayFormats = new Map<string, Intl.DateTimeFormat>();

function localHour(instant: number, timeZone: string): number {
  let format = hourFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' });
    hourFormats.set(timeZone, format);
  }
  return Number(format.format(new Date(instant)));
}

function localDay(instant: number, timeZone: string): string {
  let format = dayFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dayFormats.set(timeZone, format);
  }
  return format.format(new Date(instant));
}

/** 22:00 to 05:59 on the parking's clock. */
export function isNight(instant: number, timeZone: string): boolean {
  const hour = localHour(instant, timeZone);
  return hour >= 22 || hour < 6;
}

const floor5 = (ms: number) => Math.floor(ms / (5 * MINUTE)) * 5 * MINUTE;
const ceil5 = (ms: number) => Math.ceil(ms / (5 * MINUTE)) * 5 * MINUTE;

// ---------------------------------------------------------------- the driver's lists, as the server builds them

type DepartureFields = { status: ReservationStatus; arrivalAt: Date; arrivedAt: Date | null };
type PickupFields = { status: ReservationStatus; returnAt: Date; flightEstimatedAt: Date | null; flightLandedAt: Date | null };

/**
 * « À emmener » (ShuttleService.departures): checked in during the last 6 hours (or, without a check-in time, due
 * around now), and the travellers still expected from 6 hours ago to 3 hours ahead.
 */
export function inDepartureList(r: DepartureFields, now: Date): boolean {
  const t = now.getTime();
  const around = (d: Date) => d.getTime() >= t - DROPOFF_LIST_HOURS_BEFORE * HOUR && d.getTime() <= t + DROPOFF_LIST_HOURS_AFTER * HOUR;
  if (r.status === 'upcoming') return around(r.arrivalAt);
  if (r.status !== 'arrived') return false;
  return r.arrivedAt ? r.arrivedAt.getTime() >= t - DROPOFF_LIST_HOURS_BEFORE * HOUR : around(r.arrivalAt);
}

/**
 * « À récupérer » (ShuttleService.pickups): away, returning (or landing) from 3 hours ago to 18 hours ahead, and not
 * more than 6 hours after the landing (else the estimate, else the return time).
 */
export function inPickupList(r: PickupFields, now: Date): boolean {
  if (!PICKUP_STATUSES.includes(r.status)) return false;
  const t = now.getTime();
  const within = (d: Date | null) => !!d && d.getTime() >= t - PICKUP_LIST_HOURS_BEFORE * HOUR && d.getTime() <= t + PICKUP_LIST_HOURS_AHEAD * HOUR;
  if (!within(r.returnAt) && !within(r.flightEstimatedAt)) return false;
  return t - (r.flightLandedAt ?? r.flightEstimatedAt ?? r.returnAt).getTime() <= PICKUP_LIST_HOURS_AFTER * HOUR;
}

// ---------------------------------------------------------------- the snapshot of a run and its plan

/** A pool row as the run reads it (inside its transaction). */
export interface FeedRow {
  id: string;
  plate: string;
  status: ReservationStatus;
  arrivalAt: Date;
  returnAt: Date;
  arrivedAt: Date | null;
  returnedAt: Date | null;
  updatedAt: Date;
  passengers: number;
  flightEstimatedAt: Date | null;
  flightLandedAt: Date | null;
  /** This run holds the row's lock; false: someone else is writing it. */
  locked: boolean;
  /** A passenger of a running trip. */
  onTrip: boolean;
  /** When a trip it was on ended, if less than 10 minutes ago (the trip's end moves its passengers in a second step). */
  tripEndedAt: Date | null;
}

/** What test_feeds.state keeps between runs. */
export interface FeedState {
  /** The feed's own last write of each row (its updatedAt, ISO): a row whose updatedAt differs was changed by someone. */
  writes: Record<string, string>;
  /** The arrivals rebooked in the last hour (T1 take_now, T2 flow; ISO): the hourly budget of the arrivals. */
  rebooks: string[];
}

/** test_feeds.state read safely (anything else: empty). */
export function feedState(json: unknown): FeedState {
  const value = (json && typeof json === 'object' ? json : {}) as { writes?: unknown; rebooks?: unknown };
  const writes: Record<string, string> = {};
  if (value.writes && typeof value.writes === 'object' && !Array.isArray(value.writes)) {
    for (const [id, at] of Object.entries(value.writes as Record<string, unknown>)) if (typeof at === 'string') writes[id] = at;
  }
  const rebooks = Array.isArray(value.rebooks) ? value.rebooks.filter((at): at is string => typeof at === 'string') : [];
  return { writes, rebooks };
}

export interface FeedInput {
  now: Date;
  timezone: string;
  /** min(40, half the bookable capacity of today). */
  cap: number;
  /** Seats of the largest shuttle in service, 8 at most (8 without one). */
  seats: number;
  rows: FeedRow[];
  state: FeedState;
}

export type FeedMoveRule = 'check_in' | 'return_call' | 'hand_back' | 'missed_arrival' | 'left_unseen' | 'late_return';
export type FeedTarget = 'take_now' | 'flow' | 'soon_return' | 'listed_return' | 'later_day';
export type HandsOffReason = 'busy' | 'on_trip' | 'trip_ended' | 'changed';

/** The new stay of a rebooked plate. */
export interface FeedStay {
  status: ReservationStatus;
  arrivalAt: Date;
  returnAt: Date;
  arrivedAt: Date | null;
  passengers: number;
}

export type FeedWrite =
  | {
      kind: 'move';
      id: string;
      plate: string;
      rule: FeedMoveRule;
      from: ReservationStatus;
      to: ReservationStatus;
      /** Overrides of the status change's own fields (statusSideEffects); undefined: as the change sets them. */
      arrivedAt?: Date | null;
      returnedAt?: Date | null;
    }
  | { kind: 'retime'; id: string; plate: string; target: 'soon_return'; returnAt: Date }
  | {
      kind: 'rebook';
      id: string;
      plate: string;
      target: FeedTarget;
      from: ReservationStatus;
      stay: FeedStay;
      /** The same booking over 25 hours, tried when a night of `stay` is full. */
      fallback: FeedStay;
    };

export interface FeedPlan {
  writes: FeedWrite[];
  /** The rows once the writes are made (as planned). */
  rows: FeedRow[];
  /** The state read, pruned (the run's own writes are recorded by recordApplied, once made). */
  state: FeedState;
  reduced: boolean;
  /** The parking is too small (cap below 6): nothing written. */
  tooSmall: boolean;
  /** A target found no plate to rebook. */
  poolExhausted: boolean;
  skipped: { plate: string; reason: string }[];
}

interface Targets {
  minTake: number;
  maxTake: number;
  soonReturns: number;
  listedReturns: number;
  laterDays: number;
}
export const TEST_FEED_TARGETS: { normal: Targets; reduced: Targets } = {
  normal: { minTake: 3, maxTake: 8, soonReturns: 2, listedReturns: 4, laterDays: 2 },
  reduced: { minTake: 2, maxTake: 4, soonReturns: 1, listedReturns: 2, laterDays: 0 },
};

const CLOSED: ReservationStatus[] = ['returned', 'cancelled', 'no_show'];
const STAYING: ReservationStatus[] = ['shuttled_out', 'return_requested'];
/** Only these targets may take back a traveller away for a later day (source B3). */
const RECLAIMING: FeedTarget[] = ['take_now', 'flow', 'soon_return'];
/**
 * The arrivals' targets, the only ones the hourly budget counts and limits: the returns' rebooks (T3 to T5, a few per
 * run) once counted too and could starve the arrivals for an hour, « À emmener » empty at night (e2e, 15/10/2026).
 */
const ARRIVALS: FeedTarget[] = ['take_now', 'flow'];
const isArrivalRebook = (w: FeedWrite) => w.kind === 'rebook' && ARRIVALS.includes(w.target);

/** Why a row is not the feed's to write now, or null. */
export function handsOffReason(r: FeedRow, now: Date, writes: Record<string, string>): HandsOffReason | null {
  const t = now.getTime();
  if (!r.locked) return 'busy';
  if (r.onTrip) return 'on_trip';
  if (r.tripEndedAt && r.tripEndedAt.getTime() > t - TEST_FEED_HANDS_OFF_MINUTES * MINUTE) return 'trip_ended';
  if (r.updatedAt.getTime() > t - TEST_FEED_HANDS_OFF_MINUTES * MINUTE && writes[r.id] !== r.updatedAt.toISOString()) return 'changed';
  return null;
}

/** The row once the write is made (the in-memory copy of a run, and of the tests' simulation). */
export function applyWrite(r: FeedRow, w: FeedWrite, now: Date): FeedRow {
  if (w.kind === 'retime') return { ...r, returnAt: w.returnAt, updatedAt: now };
  if (w.kind === 'rebook') {
    return {
      ...r,
      ...w.stay,
      returnedAt: null,
      flightEstimatedAt: null,
      flightLandedAt: null,
      updatedAt: now,
    };
  }
  const side = statusSideEffects(r, w.to, now);
  const pick = (override: Date | null | undefined, set: Date | null | undefined, current: Date | null) =>
    override !== undefined ? override : set !== undefined ? set : current;
  return {
    ...r,
    status: w.to,
    arrivedAt: pick(w.arrivedAt, side.arrivedAt, r.arrivedAt),
    returnedAt: pick(w.returnedAt, side.returnedAt, r.returnedAt),
    updatedAt: now,
  };
}

/** The state once the writes made by a run are recorded (each row's updatedAt is the run's `now`; the arrivals' rebooks). */
export function recordApplied(state: FeedState, applied: FeedWrite[], now: Date): FeedState {
  const at = now.toISOString();
  const writes = { ...state.writes };
  for (const w of applied) writes[w.id] = at;
  const rebooks = [...state.rebooks, ...applied.filter(isArrivalRebook).map(() => at)];
  return { writes, rebooks };
}

/** What the run reports: the lists as the driver sees them, and the pool. */
export interface FeedCounts {
  /** « À emmener »: listed, not on a trip; of which checked in, and still expected. */
  toTake: number;
  onSiteWaiting: number;
  expected: number;
  /** « À récupérer »: listed, not on a trip; of which returning within 2 hours. */
  toPickUp: number;
  soonReturns: number;
  /** « En séjour »: dropped at the terminal, any return day. */
  staying: number;
  /** Back at the parking, or handed back today. */
  back: number;
  active: number;
  /** Closed rows (handed back, cancelled): the plates free for a new stay. */
  free: number;
  onTrip: number;
  handsOff: number;
}

export function feedCounts(rows: FeedRow[], now: Date, timezone: string, writes: Record<string, string>): FeedCounts {
  const t = now.getTime();
  const take = rows.filter(r => inDepartureList(r, now) && !r.onTrip);
  const pick = rows.filter(r => inPickupList(r, now) && !r.onTrip);
  const today = localDay(t, timezone);
  return {
    toTake: take.length,
    onSiteWaiting: take.filter(r => r.status === 'arrived').length,
    expected: take.filter(r => r.status === 'upcoming').length,
    toPickUp: pick.length,
    soonReturns: pick.filter(r => r.returnAt.getTime() >= t - 30 * MINUTE && r.returnAt.getTime() <= t + 2 * HOUR).length,
    staying: rows.filter(r => STAYING.includes(r.status)).length,
    back: rows.filter(
      r => r.status === 'back_at_parking' || (r.status === 'returned' && !!r.returnedAt && localDay(r.returnedAt.getTime(), timezone) === today),
    ).length,
    active: rows.filter(r => !CLOSED.includes(r.status)).length,
    free: rows.filter(r => CLOSED.includes(r.status)).length,
    onTrip: rows.filter(r => r.onTrip).length,
    handsOff: rows.filter(r => handsOffReason(r, now, writes) !== null).length,
  };
}

const randInt = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
function weighted<T>(rng: () => number, values: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < values.length; i += 1) {
    x -= weights[i];
    if (x < 0) return values[i];
  }
  return values[values.length - 1];
}

/** A stay: half 1 day and 1 to 5 hours, 30 % 2 days ± 3 hours, 20 % 3 to 4 days; never under 25 hours. */
export function drawStayMinutes(rng: () => number): number {
  const x = rng();
  let minutes: number;
  if (x < 0.5) minutes = 24 * 60 + randInt(rng, 60, 300);
  else if (x < 0.8) minutes = 48 * 60 + randInt(rng, -180, 180);
  else minutes = randInt(rng, 72 * 60, 96 * 60);
  return Math.max(TEST_FEED_MIN_STAY_MINUTES, Math.floor(minutes / 5) * 5);
}

/** Bookings travelling together (1 to 3, 1 to 4 passengers each), within the shuttle's seats. */
export function drawGroup(rng: () => number, seats: number): number[] {
  const count = weighted(rng, [1, 2, 3], [50, 35, 15]);
  const passengers = Array.from({ length: count }, () => Math.min(Math.max(1, seats), weighted(rng, [1, 2, 3, 4], [35, 35, 20, 10])));
  while (passengers.length > 1 && passengers.reduce((a, b) => a + b, 0) > seats) passengers.pop();
  return passengers;
}

/**
 * One run of the feed (pure): the moves of the travellers' day (A), then the plates rebooked or retimed to keep the
 * driver's lists stocked (E: T1 someone to take now, T2 a flow of arrivals up to 3 hours ahead, T3 returns within 2
 * hours, T4 returns later today, T5 a few later days), at most 30 writes (the moves closing stale bookings leave 12 of
 * them to the targets), at most 8 rebooks an hour for T1 and T2 (beyond it, one traveller when nobody is left to take).
 */
export function planFeed(input: FeedInput, rng: () => number): FeedPlan {
  const { now, timezone: tz, cap, seats } = input;
  const t = now.getTime();
  const nowIso = now.toISOString();
  const rows = input.rows.map(r => ({ ...r })).sort((a, b) => a.plate.localeCompare(b.plate));
  const ids = new Set(rows.map(r => r.id));
  const state: FeedState = {
    writes: Object.fromEntries(Object.entries(input.state.writes).filter(([id]) => ids.has(id))),
    rebooks: input.state.rebooks.filter(at => Date.parse(at) > t - HOUR && Date.parse(at) <= t),
  };
  const plan: FeedPlan = {
    writes: [],
    rows,
    state,
    reduced: cap < TEST_FEED_REDUCED_BELOW_CAP,
    tooSmall: cap < TEST_FEED_MIN_CAP,
    poolExhausted: false,
    skipped: [],
  };
  if (plan.tooSmall) return plan;
  const targets = plan.reduced ? TEST_FEED_TARGETS.reduced : TEST_FEED_TARGETS.normal;
  const today = localDay(t, tz);
  // The feed's own writes, this run's included: a row it just wrote is not "changed by someone".
  const own: Record<string, string> = { ...state.writes };
  let rebooksThisRun = 0;

  const handsOff = (r: FeedRow) => handsOffReason(r, now, own) !== null;
  const listedAt = (r: FeedRow, at: Date) => inDepartureList(r, at) || inPickupList(r, at);
  const earlier = new Date(t - TEST_FEED_LIST_MARGIN_MINUTES * MINUTE);
  /** Listed now, or 15 minutes ago: only the two list-keeping moves may touch it. */
  const listedAround = (r: FeedRow) => listedAt(r, now) || listedAt(r, earlier);
  const ownWrite = (r: FeedRow) => own[r.id] === r.updatedAt.toISOString();
  /** A row that may be rebooked or retimed: free, outside the lists, and not just changed by someone. */
  const safeSource = (r: FeedRow) =>
    !handsOff(r) && !listedAround(r) && (ownWrite(r) || r.updatedAt.getTime() <= t - TEST_FEED_LIST_MARGIN_MINUTES * MINUTE);
  const room = () => TEST_FEED_MAX_WRITES_PER_RUN - plan.writes.length;
  const rebookBudget = () => TEST_FEED_MAX_REBOOKS_PER_HOUR - state.rebooks.length - rebooksThisRun;

  const push = (w: FeedWrite) => {
    const i = rows.findIndex(r => r.id === w.id);
    rows[i] = applyWrite(rows[i], w, now);
    own[w.id] = nowIso;
    if (isArrivalRebook(w)) rebooksThisRun += 1;
    plan.writes.push(w);
  };

  // ---------------------------------------------------------------- A. the travellers' day

  // The moves that keep a listed traveller listed first, then the others, which leave room for the targets: after a
  // weekend nobody read the lists, closing 30 stale bookings took the whole run and the driver's first read found nobody
  // to fetch and one to take (review, 15/10/2026); the rest are closed by the next runs (out of the lists meanwhile).
  const keepsListed = (w: FeedWrite) => w.kind === 'move' && (w.rule === 'check_in' || w.rule === 'return_call');
  const moves = rows.filter(r => !handsOff(r)).flatMap(r => moveOf(r) ?? []);
  for (const w of [...moves.filter(keepsListed), ...moves.filter(w => !keepsListed(w))]) {
    if (room() <= (keepsListed(w) ? 0 : TEST_FEED_TARGETS_ROOM)) break;
    push(w);
  }

  function moveOf(r: FeedRow): FeedWrite | null {
    const move = (rule: FeedMoveRule, to: ReservationStatus, fields: { arrivedAt?: Date | null; returnedAt?: Date | null } = {}): FeedWrite => ({
      kind: 'move',
      id: r.id,
      plate: r.plate,
      rule,
      from: r.status,
      to,
      ...fields,
    });
    const arrival = r.arrivalAt.getTime();
    const ret = r.returnAt.getTime();
    const delay = (fnv1a(r.id + r.arrivalAt.toISOString()) % (TEST_FEED_CHECK_IN_DELAY_MINUTES + 1)) * MINUTE;
    const lateReturn = () => new Date(Math.min(t, ret + 40 * MINUTE));
    if (r.status === 'upcoming') {
      // 1. check_in: « Sur place » 0 to 10 minutes after the booked arrival (still listed, still boardable).
      if (arrival >= t - DROPOFF_LIST_HOURS_BEFORE * HOUR && arrival + delay <= t) {
        const arrivedAt = Math.min(t, arrival + delay);
        return ret >= arrivedAt + TEST_FEED_CHECK_IN_MIN_STAY_MINUTES * MINUTE
          ? move('check_in', 'arrived', { arrivedAt: new Date(arrivedAt) })
          : null;
      }
      // 4. missed_arrival: never checked in, out of the list for 15 minutes: away, or back already.
      if (arrival < t - DROPOFF_LIST_HOURS_BEFORE * HOUR - TEST_FEED_LIST_MARGIN_MINUTES * MINUTE && !listedAround(r)) {
        const arrivedAt = new Date(arrival + delay);
        return ret < t - (PICKUP_LIST_HOURS_BEFORE * HOUR + TEST_FEED_LIST_MARGIN_MINUTES * MINUTE)
          ? move('missed_arrival', 'returned', { arrivedAt, returnedAt: lateReturn() })
          : move('missed_arrival', 'shuttled_out', { arrivedAt });
      }
      return null;
    }
    if (r.status === 'shuttled_out' && fnv1a(r.id + r.returnAt.toISOString()) % 2 === 0) {
      // 2. return_call: half of the travellers call 20 minutes before their return (still listed, still boardable).
      if (t >= ret - 20 * MINUTE && t <= ret + PICKUP_LIST_HOURS_BEFORE * HOUR) return move('return_call', 'return_requested');
    }
    if (r.status === 'back_at_parking') {
      // 3. hand_back: « Rendu » 45 minutes after « De retour au parking ».
      return r.updatedAt.getTime() <= t - 45 * MINUTE && !listedAround(r) ? move('hand_back', 'returned', { returnedAt: now }) : null;
    }
    if (listedAround(r)) return null;
    if (
      r.status === 'arrived' &&
      (r.arrivedAt ?? r.arrivalAt).getTime() < t - DROPOFF_LIST_HOURS_BEFORE * HOUR - TEST_FEED_LIST_MARGIN_MINUTES * MINUTE
    ) {
      // 5. left_unseen: checked in, never driven: away (or back already).
      return ret < t - (PICKUP_LIST_HOURS_BEFORE * HOUR + TEST_FEED_LIST_MARGIN_MINUTES * MINUTE)
        ? move('left_unseen', 'returned', { returnedAt: lateReturn() })
        : move('left_unseen', 'shuttled_out');
    }
    // 6. late_return: away, past the return and out of the list: handed back.
    if (AWAY_STATUSES.includes(r.status) && ret < t) return move('late_return', 'returned', { returnedAt: lateReturn() });
    return null;
  }

  // ---------------------------------------------------------------- B. where a rebooked plate comes from

  const counts = () => {
    const take = rows.filter(r => inDepartureList(r, now));
    const pick = rows.filter(r => inPickupList(r, now) && !r.onTrip);
    return {
      take,
      takeable: take.filter(r => !r.onTrip),
      pick,
      soon: pick.filter(r => r.returnAt.getTime() >= t - 30 * MINUTE && r.returnAt.getTime() <= t + 2 * HOUR),
      far: rows.filter(r => STAYING.includes(r.status) && r.returnAt.getTime() > t + PICKUP_LIST_HOURS_AHEAD * HOUR),
      active: rows.filter(r => !CLOSED.includes(r.status)).length,
    };
  };
  const closedAt = (r: FeedRow) => (r.returnedAt ?? r.updatedAt).getTime();

  function source(target: FeedTarget): FeedRow | null {
    const c = counts();
    if (c.active < cap) {
      const closed = rows.filter(r => CLOSED.includes(r.status) && safeSource(r));
      // B1: closed 2 hours ago at least, those of a previous day first (« Rendus » keeps today's), the oldest first.
      const old = closed
        .filter(r => closedAt(r) <= t - 2 * HOUR)
        .sort(
          (a, b) =>
            Number(localDay(closedAt(a), tz) === today) - Number(localDay(closedAt(b), tz) === today) ||
            a.updatedAt.getTime() - b.updatedAt.getTime() ||
            a.plate.localeCompare(b.plate),
        );
      if (old.length) return old[0];
      // B2: closed less than 2 hours ago, the oldest first.
      const young = closed
        .filter(r => closedAt(r) > t - 2 * HOUR)
        .sort((a, b) => closedAt(a) - closedAt(b) || a.updatedAt.getTime() - b.updatedAt.getTime() || a.plate.localeCompare(b.plate));
      if (young.length) return young[0];
    }
    // B3: someone away for a later day, the latest first, as long as `laterDays` of them remain.
    if (RECLAIMING.includes(target) && c.far.length - 1 >= targets.laterDays) {
      const far = c.far.filter(safeSource).sort((a, b) => b.returnAt.getTime() - a.returnAt.getTime());
      if (far.length) return far[0];
    }
    plan.poolExhausted = true;
    return null;
  }

  // ---------------------------------------------------------------- C/D. new stays

  const rebookExpected = (src: FeedRow, arrivalAt: number, passengers: number, target: FeedTarget) => {
    const stay = drawStayMinutes(rng) * MINUTE;
    const expected = (length: number): FeedStay => ({
      status: 'upcoming',
      arrivalAt: new Date(arrivalAt),
      returnAt: new Date(arrivalAt + length),
      arrivedAt: null,
      passengers,
    });
    push({
      kind: 'rebook',
      id: src.id,
      plate: src.plate,
      target,
      from: src.status,
      stay: expected(stay),
      fallback: expected(TEST_FEED_MIN_STAY_MINUTES * MINUTE),
    });
  };

  /** Someone away (dropped at the terminal) returning at `returnAt`, who arrived before today (no stray drop-off wave). */
  const rebookAway = (src: FeedRow, returnAt: number, passengers: number, target: FeedTarget) => {
    const status: ReservationStatus =
      returnAt <= t + 30 * MINUTE && fnv1a(src.id + new Date(returnAt).toISOString()) % 2 === 0 ? 'return_requested' : 'shuttled_out';
    const away = (length: number): FeedStay => {
      // Never arrived in the future (a later day's return), and never today (a loop: on the 25-hour day of the switch to
      // winter time, 24 hours before 23:30 is still that day).
      let arrivalAt = floor5(Math.min(returnAt - length, t - 30 * MINUTE));
      while (localDay(arrivalAt, tz) === today) arrivalAt -= DAY;
      return { status, arrivalAt: new Date(arrivalAt), returnAt: new Date(returnAt), arrivedAt: new Date(arrivalAt), passengers };
    };
    push({
      kind: 'rebook',
      id: src.id,
      plate: src.plate,
      target,
      from: src.status,
      stay: away(drawStayMinutes(rng) * MINUTE),
      fallback: away(TEST_FEED_MIN_STAY_MINUTES * MINUTE),
    });
  };

  /** Feed arrivals still in play: expected, or checked in, from 6 hours ago. */
  const arrivals = () =>
    rows
      .filter(r => (r.status === 'upcoming' || r.status === 'arrived') && r.arrivalAt.getTime() >= t - DROPOFF_LIST_HOURS_BEFORE * HOUR)
      .map(r => r.arrivalAt.getTime());
  /**
   * When each drop-off of the last 6 hours leaves in « Ligne du jour » (the check-in time, else the booked arrival and up
   * to 10 minutes after it for one still expected), and its passengers: those already dropped count in their wave too.
   */
  const leaves = () =>
    rows
      .filter(r => !['cancelled', 'no_show'].includes(r.status) && r.arrivalAt.getTime() >= t - DROPOFF_LIST_HOURS_BEFORE * HOUR)
      .map(r => {
        const from = (r.status === 'upcoming' ? r.arrivalAt : (r.arrivedAt ?? r.arrivalAt)).getTime();
        const to = r.status === 'upcoming' ? from + TEST_FEED_CHECK_IN_DELAY_MINUTES * MINUTE : from;
        return { from, to, passengers: r.passengers };
      });
  /**
   * The first time from `from` to `to`, by 5 minutes, for a group of `passengers`: 20 minutes at least from every other
   * arrival, and never in a wave (15 minutes, check-in delays included) where it would need a second shuttle (e2e,
   * 15/10/2026: two groups 20 minutes apart, the first checked in 10 minutes late, made a wave of 9 for 8 seats).
   */
  const freeArrival = (from: number, to: number, passengers: number) => {
    const taken = arrivals();
    const known = leaves();
    for (let at = from; at <= to; at += 5 * MINUTE) {
      if (!taken.every(a => Math.abs(a - at) >= TEST_FEED_ARRIVAL_GAP_MINUTES * MINUTE)) continue;
      const end = at + TEST_FEED_CHECK_IN_DELAY_MINUTES * MINUTE;
      const sharing = known.filter(k => Math.max(k.from, at) - Math.min(k.to, end) <= WAVE_WINDOW_MINUTES * MINUTE);
      if (sharing.reduce((sum, k) => sum + k.passengers, passengers) <= seats) return at;
    }
    return null;
  };
  /** A return time near `wanted` (t + 15 min to t + 115 min), 20 minutes at least from the other returns of the next 2 hours. */
  const freeReturn = (wanted: number) => {
    const taken = rows
      .filter(r => AWAY_STATUSES.includes(r.status))
      .map(r => r.returnAt.getTime())
      .filter(at => at >= t - 30 * MINUTE && at <= t + 2 * HOUR + 20 * MINUTE);
    const fits = (at: number) => taken.every(other => Math.abs(other - at) >= 20 * MINUTE);
    for (let at = wanted; at <= t + 115 * MINUTE; at += 5 * MINUTE) if (fits(at)) return at;
    for (let at = wanted - 5 * MINUTE; at >= t + 15 * MINUTE; at -= 5 * MINUTE) if (fits(at)) return at;
    return null;
  };
  /** A group drawn and trimmed to the budgets (each booking's passengers). */
  const groupOf = (take: number, budget = rebookBudget()) =>
    drawGroup(rng, seats).slice(0, Math.max(0, Math.min(budget, room(), targets.maxTake - take)));
  /** The group at `arrivalAt`; false when nobody could be placed. */
  const placeGroup = (arrivalAt: number, target: FeedTarget, group: number[]) => {
    let placed = 0;
    for (const passengers of group) {
      const src = source(target);
      if (!src) break;
      rebookExpected(src, arrivalAt, passengers, target);
      placed += 1;
    }
    return placed > 0;
  };

  // ---------------------------------------------------------------- E. the targets

  // T1 take_now: someone to take right now (an expected traveller boards at once). The hourly budget never leaves the
  // driver with nobody at all to take: « À emmener » empty, one traveller is placed whatever the budget (e2e, 15/10/2026).
  for (let groups = 0; groups < 2 && room() > 0; groups += 1) {
    const c = counts();
    if (c.takeable.length >= targets.minTake || c.take.length >= targets.maxTake) break;
    const budget = c.takeable.length ? rebookBudget() : Math.max(1, rebookBudget());
    if (budget <= 0) break;
    const group = groupOf(c.take.length, budget);
    const at = freeArrival(
      ceil5(t + 10 * MINUTE),
      t + 60 * MINUTE,
      group.reduce((a, b) => a + b, 0),
    );
    if (at === null) {
      plan.skipped.push({ plate: '', reason: 'take_now_no_slot' });
      break;
    }
    if (!placeGroup(at, 'take_now', group)) break;
  }

  // T2 flow: a group every 45 to 90 minutes (90 to 150 at night), up to 2 h 55 ahead.
  {
    const known = arrivals();
    let last = known.length ? Math.max(...known) : t;
    while (room() > 0 && rebookBudget() > 0) {
      const c = counts();
      if (c.take.length >= targets.maxTake) break;
      const gap = isNight(last, tz) ? randInt(rng, 90, 150) : randInt(rng, 45, 90);
      const next = floor5(Math.max(last + gap * MINUTE, t + 15 * MINUTE));
      if (next > t + 2 * HOUR + 55 * MINUTE) break;
      if (!placeGroup(next, 'flow', groupOf(c.take.length))) break;
      last = next;
    }
  }

  // T3 soon_return: returns within 2 hours, a later day's traveller brought forward first.
  for (let tries = 0; tries < 2 && room() > 0; tries += 1) {
    const c = counts();
    if (c.soon.length >= targets.soonReturns) break;
    const latest = Math.max(t, ...c.soon.map(r => r.returnAt.getTime()).filter(at => at >= t));
    const wanted = floor5(Math.min(t + 115 * MINUTE, Math.max(latest + randInt(rng, 20, 40) * MINUTE, t + randInt(rng, 15, 40) * MINUTE)));
    const at = freeReturn(wanted);
    if (at === null) {
      plan.skipped.push({ plate: '', reason: 'soon_return_no_slot' });
      continue;
    }
    const far =
      c.far.length - 1 >= targets.laterDays
        ? c.far.filter(r => safeSource(r) && at - r.arrivalAt.getTime() >= 2 * HOUR).sort((a, b) => b.returnAt.getTime() - a.returnAt.getTime())[0]
        : undefined;
    if (far) {
      push({ kind: 'retime', id: far.id, plate: far.plate, target: 'soon_return', returnAt: new Date(at) });
      continue;
    }
    const src = source('soon_return');
    if (!src) break;
    rebookAway(src, at, drawGroup(rng, seats)[0], 'soon_return');
  }

  // T4 listed_return: a few more returns later in the list (2 h 30 to 17 h ahead).
  for (let tries = 0; tries < 2 && room() > 0; tries += 1) {
    const c = counts();
    if (c.pick.length >= targets.listedReturns || c.active >= cap) break;
    const at = floor5(t + randInt(rng, 150, 17 * 60) * MINUTE);
    const src = source('listed_return');
    if (!src) break;
    rebookAway(src, at, drawGroup(rng, seats)[0], 'listed_return');
  }

  // T5 later_day: travellers away for a later day (« En séjour »), returning between 06:00 and 23:00.
  {
    const c = counts();
    if (c.far.length < targets.laterDays && c.active < cap - 4 && room() > 0) {
      let at: number | null = null;
      for (let draw = 0; draw < 4 && at === null; draw += 1) {
        const candidate = floor5(t + randInt(rng, 20 * 60, 4 * 24 * 60) * MINUTE);
        const hour = localHour(candidate, tz);
        if (hour >= 6 && hour < 23) at = candidate;
      }
      const src = at === null ? null : source('later_day');
      if (src && at !== null) rebookAway(src, at, drawGroup(rng, seats)[0], 'later_day');
    }
  }

  for (const r of rows) {
    const reason = handsOffReason(r, now, own);
    if (reason) plan.skipped.push({ plate: r.plate, reason });
  }
  return plan;
}
