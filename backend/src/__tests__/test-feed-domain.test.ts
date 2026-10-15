import type { ReservationStatus } from '@/database';
import { AWAY_STATUSES } from '@/domain/reservation';
import { canBoard } from '@/domain/shuttle';
import {
  FEED_PEOPLE,
  FeedRow,
  FeedState,
  FeedWrite,
  TEST_FEED_MAX_REBOOKS_PER_HOUR,
  TEST_FEED_MAX_WRITES_PER_RUN,
  TEST_FEED_MIN_STAY_MINUTES,
  TEST_FEED_TARGETS_ROOM,
  drawGroup,
  feedCounts,
  feedPerson,
  feedRng,
  feedState,
  handsOffReason,
  inDepartureList,
  inPickupList,
  isTestOperatorName,
  mulberry32,
  planFeed,
  recordApplied,
} from '@/domain/test-feed';
import { smsRecipient } from '@/domain/phone';

/**
 * The continuous test feed of « Plazo (tests) » (15/10/2026): the pure rules (lists, who may be written, the plan of a
 * run) and a day of simulation with a driver, as the server runs it at every read of the driver's lists.
 */

const TZ = 'Europe/Paris';
const M = 60000;
const H = 60 * M;
const T0 = new Date('2026-11-03T00:00:00+01:00').getTime();
const at = (ms: number) => new Date(ms);
const EMPTY: FeedState = { writes: {}, rebooks: [] };

function row(i: number, fields: Partial<FeedRow> = {}): FeedRow {
  const person = feedPerson(i);
  return {
    id: `r${String(i).padStart(2, '0')}`,
    plate: person.plate,
    status: 'cancelled',
    arrivalAt: at(T0 - 7 * 24 * H),
    returnAt: at(T0 - 6 * 24 * H),
    arrivedAt: null,
    returnedAt: null,
    updatedAt: at(T0 - 7 * 24 * H),
    passengers: 1,
    flightEstimatedAt: null,
    flightLandedAt: null,
    locked: true,
    onTrip: false,
    tripEndedAt: null,
    ...fields,
  };
}
const pool = () => Array.from({ length: 40 }, (_, i) => row(i));
const plan = (rows: FeedRow[], now: number, options: { cap?: number; seats?: number; state?: FeedState } = {}) =>
  planFeed(
    { now: at(now), timezone: TZ, cap: options.cap ?? 40, seats: options.seats ?? 8, rows, state: options.state ?? EMPTY },
    feedRng('op', at(now)),
  );
const listed = (r: FeedRow, now: number) => inDepartureList(r, at(now)) || inPickupList(r, at(now));

describe('le loueur de test et ses voyageurs fictifs', () => {
  it('ne reconnaît que « … (tests) »', () => {
    expect(isTestOperatorName('Plazo (tests)')).toBe(true);
    expect(isTestOperatorName('Plazo (tests)  ')).toBe(true);
    expect(isTestOperatorName('Plazo (tests) 3')).toBe(false);
    expect(isTestOperatorName('Parking Dupont')).toBe(false);
    expect(isTestOperatorName(null)).toBe(false);
  });

  it('donne 40 plaques TS-201-PZ à TS-240-PZ, des numéros fictifs et jamais le canal Plazo', () => {
    expect(FEED_PEOPLE).toHaveLength(40);
    expect(FEED_PEOPLE[0]).toMatchObject({
      plate: 'TS-201-PZ',
      plateKey: 'TS201PZ',
      externalReference: 'TEST-FEED-TS201PZ',
      firstName: 'Inès',
      lastName: 'Dubois',
    });
    expect(FEED_PEOPLE[39].plate).toBe('TS-240-PZ');
    expect(new Set(FEED_PEOPLE.map(p => p.plate)).size).toBe(40);
    for (const person of FEED_PEOPLE) {
      expect(person.phone).toMatch(/^\+33 6 39 98 02 \d{2}$/);
      expect(smsRecipient(person.phone)).toBeNull();
      expect(person.channel).not.toBe('plazo');
    }
  });

  it('lit l’état gardé sans se fier à son contenu', () => {
    expect(feedState(null)).toEqual(EMPTY);
    expect(feedState({ writes: { a: '2026-01-01T00:00:00.000Z', b: 3 }, rebooks: ['x', 4] })).toEqual({
      writes: { a: '2026-01-01T00:00:00.000Z' },
      rebooks: ['x'],
    });
  });

  it('tire les mêmes nombres pour le même loueur dans la même minute', () => {
    const a = feedRng('op', at(T0 + 10 * 1000));
    const b = feedRng('op', at(T0 + 50 * 1000));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(feedRng('op', at(T0 + 60 * 1000))()).not.toBe(feedRng('op', at(T0))());
  });

  it('forme des groupes dans les places de la navette', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i += 1) {
      for (const seats of [1, 3, 8]) {
        const group = drawGroup(rng, seats);
        expect(group.length).toBeGreaterThanOrEqual(1);
        expect(group.length).toBeLessThanOrEqual(3);
        expect(group.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(seats);
      }
    }
  });
});

describe('les listes du chauffeur, comme le serveur les construit', () => {
  const t = T0 + 12 * H;
  it('« À emmener » : attendus de 6 h avant à 3 h après, pointés depuis 6 h', () => {
    expect(inDepartureList(row(0, { status: 'upcoming', arrivalAt: at(t - 6 * H) }), at(t))).toBe(true);
    expect(inDepartureList(row(0, { status: 'upcoming', arrivalAt: at(t - 6 * H - 1) }), at(t))).toBe(false);
    expect(inDepartureList(row(0, { status: 'upcoming', arrivalAt: at(t + 3 * H) }), at(t))).toBe(true);
    expect(inDepartureList(row(0, { status: 'upcoming', arrivalAt: at(t + 3 * H + 1) }), at(t))).toBe(false);
    expect(inDepartureList(row(0, { status: 'arrived', arrivalAt: at(t - 20 * H), arrivedAt: at(t - 6 * H) }), at(t))).toBe(true);
    expect(inDepartureList(row(0, { status: 'arrived', arrivalAt: at(t), arrivedAt: at(t - 6 * H - 1) }), at(t))).toBe(false);
    expect(inDepartureList(row(0, { status: 'arrived', arrivalAt: at(t + 3 * H), arrivedAt: null }), at(t))).toBe(true);
    expect(inDepartureList(row(0, { status: 'shuttled_out', arrivalAt: at(t) }), at(t))).toBe(false);
  });

  it('« À récupérer » : retours de 3 h avant à 18 h après, 6 h au plus après l’atterrissage', () => {
    const away = (fields: Partial<FeedRow>) => row(0, { status: 'shuttled_out', arrivalAt: at(t - 48 * H), ...fields });
    expect(inPickupList(away({ returnAt: at(t - 3 * H) }), at(t))).toBe(true);
    expect(inPickupList(away({ returnAt: at(t - 3 * H - 1) }), at(t))).toBe(false);
    expect(inPickupList(away({ returnAt: at(t + 18 * H) }), at(t))).toBe(true);
    expect(inPickupList(away({ returnAt: at(t + 18 * H + 1) }), at(t))).toBe(false);
    // A late flight keeps the traveller listed from its estimate, up to 6 hours after the landing.
    expect(inPickupList(away({ returnAt: at(t - 5 * H), flightEstimatedAt: at(t - 2 * H) }), at(t))).toBe(true);
    expect(inPickupList(away({ returnAt: at(t - 5 * H), flightEstimatedAt: at(t - 2 * H), flightLandedAt: at(t - 6 * H - 1) }), at(t))).toBe(false);
    expect(inPickupList(away({ returnAt: at(t), status: 'back_at_parking' }), at(t))).toBe(false);
    expect(inPickupList(away({ returnAt: at(t), status: 'arrived' }), at(t))).toBe(true);
  });
});

describe('ce que le flux ne touche jamais', () => {
  const t = T0 + 12 * H;
  it('ni un passager en route, ni une ligne verrouillée, ni un trajet fini depuis moins de 10 min, ni une ligne changée par quelqu’un', () => {
    const base = { status: 'upcoming' as ReservationStatus, arrivalAt: at(t - 30 * M), returnAt: at(t + 30 * H) };
    expect(handsOffReason(row(0, { ...base, onTrip: true }), at(t), {})).toBe('on_trip');
    expect(handsOffReason(row(0, { ...base, locked: false }), at(t), {})).toBe('busy');
    expect(handsOffReason(row(0, { ...base, tripEndedAt: at(t - 9 * M) }), at(t), {})).toBe('trip_ended');
    expect(handsOffReason(row(0, { ...base, tripEndedAt: at(t - 11 * M) }), at(t), {})).toBeNull();
    const changed = row(0, { ...base, updatedAt: at(t - 5 * M) });
    expect(handsOffReason(changed, at(t), {})).toBe('changed');
    expect(handsOffReason(changed, at(t), { [changed.id]: changed.updatedAt.toISOString() })).toBeNull();
    // None of them is written, even the check-in due.
    for (const r of [row(0, { ...base, onTrip: true }), row(0, { ...base, locked: false }), changed]) {
      expect(plan([r, ...pool().slice(1)], t).writes.filter(w => w.id === r.id)).toEqual([]);
    }
  });

  it('ne propose aux lignes affichées que le pointage et l’appel du retour, qui les gardent affichées et embarquables', () => {
    const rng = mulberry32(42);
    const statuses: ReservationStatus[] = ['upcoming', 'arrived', 'shuttled_out', 'return_requested', 'back_at_parking', 'returned', 'cancelled'];
    for (let n = 0; n < 300; n += 1) {
      const t0 = T0 + Math.floor(rng() * 48 * 60) * M;
      const rows = Array.from({ length: 40 }, (_, i) => {
        const arrival = t0 + Math.floor((rng() * 30 - 20) * H);
        const status = statuses[Math.floor(rng() * statuses.length)];
        return row(i, {
          status,
          arrivalAt: at(arrival),
          returnAt: at(arrival + Math.floor((rng() * 80 + 2) * H)),
          arrivedAt: status === 'upcoming' || status === 'cancelled' ? null : at(arrival + Math.floor(rng() * 10) * M),
          returnedAt: status === 'returned' ? at(t0 - Math.floor(rng() * 10 * H)) : null,
          updatedAt: at(t0 - Math.floor(rng() * 3 * H)),
          onTrip: rng() < 0.1,
          locked: rng() > 0.05,
          tripEndedAt: rng() < 0.1 ? at(t0 - Math.floor(rng() * 20) * M) : null,
        });
      });
      const result = plan(rows, t0);
      const before = new Map(rows.map(r => [r.id, r]));
      const touched = new Set<string>();
      for (const w of result.writes) {
        const r = before.get(w.id)!;
        expect(handsOffReason(r, at(t0), {})).toBeNull();
        if (touched.has(w.id)) continue;
        touched.add(w.id);
        if (listed(r, t0) || listed(r, t0 - 15 * M)) {
          expect(w.kind).toBe('move');
          const move = w as Extract<FeedWrite, { kind: 'move' }>;
          expect(['check_in', 'return_call']).toContain(move.rule);
          const after = result.rows.find(x => x.id === w.id)!;
          expect(listed(after, t0)).toBe(true);
          expect(canBoard(move.rule === 'check_in' ? 'dropoff' : 'pickup', after, at(t0))).toBe(true);
        }
      }
    }
  });
});

describe('les nouveaux séjours', () => {
  it('commencent par 3 à 8 voyageurs à emmener, 2 retours dans les 2 h et 4 à récupérer, dans des vagues séparées', () => {
    const t = T0 + 10 * H;
    const result = plan(pool(), t);
    const counts = feedCounts(result.rows, at(t), TZ, {});
    expect(counts.toTake).toBeGreaterThanOrEqual(3);
    expect(counts.toTake).toBeLessThanOrEqual(8);
    expect(counts.soonReturns).toBeGreaterThanOrEqual(2);
    expect(counts.toPickUp).toBeGreaterThanOrEqual(4);
    expect(result.writes.length).toBeLessThanOrEqual(TEST_FEED_MAX_WRITES_PER_RUN);
    const rebooks = result.writes.filter((w): w is Extract<FeedWrite, { kind: 'rebook' }> => w.kind === 'rebook');
    for (const w of rebooks) {
      const minutes = (w.stay.returnAt.getTime() - w.stay.arrivalAt.getTime()) / M;
      expect(minutes).toBeGreaterThanOrEqual(TEST_FEED_MIN_STAY_MINUTES);
      expect(w.stay.arrivalAt.getTime() % (5 * M)).toBe(0);
      expect(w.stay.returnAt.getTime() % (5 * M)).toBe(0);
      expect((w.fallback.returnAt.getTime() - w.fallback.arrivalAt.getTime()) / M).toBeGreaterThanOrEqual(TEST_FEED_MIN_STAY_MINUTES);
      // Nobody in both lists.
      const after = result.rows.find(r => r.id === w.id)!;
      expect(inDepartureList(after, at(t)) && inPickupList(after, at(t))).toBe(false);
      // Away travellers never arrived today, nor in the future.
      if (w.stay.status !== 'upcoming') {
        expect(w.stay.arrivalAt.getTime()).toBeLessThan(new Date('2026-11-03T00:00:00+01:00').getTime());
      }
    }
    // Arrival waves at least 20 minutes apart; a group within the shuttle's seats.
    const waves = new Map<number, number>();
    for (const w of rebooks.filter(r => r.stay.status === 'upcoming')) {
      waves.set(w.stay.arrivalAt.getTime(), (waves.get(w.stay.arrivalAt.getTime()) ?? 0) + w.stay.passengers);
    }
    const times = [...waves.keys()].sort((a, b) => a - b);
    for (let i = 1; i < times.length; i += 1) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(20 * M);
    for (const passengers of waves.values()) expect(passengers).toBeLessThanOrEqual(8);
  });

  it('ne fait jamais une vague de « Ligne du jour » qui demande une deuxième navette, pointages en retard compris', () => {
    const t = T0 + 10 * H;
    const rows = pool();
    // Checked in 10 minutes late (the wave reads the check-in), and a group just dropped at the terminal: 8 seats taken.
    rows[0] = row(0, {
      status: 'arrived',
      passengers: 4,
      arrivalAt: at(t - 10 * M),
      arrivedAt: at(t),
      returnAt: at(t + 30 * H),
      updatedAt: at(t - H),
    });
    rows[1] = row(1, {
      status: 'shuttled_out',
      passengers: 4,
      arrivalAt: at(t - 20 * M),
      arrivedAt: at(t - 3 * M),
      returnAt: at(t + 30 * H),
      updatedAt: at(t - H),
    });
    const result = plan(rows, t);
    const arrivals = new Map<number, number>();
    for (const w of result.writes) {
      if (w.kind === 'rebook' && w.stay.status === 'upcoming')
        arrivals.set(+w.stay.arrivalAt, (arrivals.get(+w.stay.arrivalAt) ?? 0) + w.stay.passengers);
    }
    expect(arrivals.size).toBeGreaterThan(0);
    for (const [arrival, passengers] of arrivals) {
      // Checked in up to 10 minutes late, within the 15 minutes of a wave of the 8 seats already taken: none.
      const sharing = [t, t - 3 * M].filter(leave => arrival - leave <= 15 * M);
      expect(passengers + 4 * sharing.length).toBeLessThanOrEqual(8);
    }
  });

  it('garde les groupes dans une petite navette', () => {
    const result = plan(pool(), T0 + 10 * H, { seats: 3 });
    const waves = new Map<number, number>();
    for (const w of result.writes) {
      if (w.kind === 'rebook' && w.stay.status === 'upcoming')
        waves.set(w.stay.arrivalAt.getTime(), (waves.get(w.stay.arrivalAt.getTime()) ?? 0) + w.stay.passengers);
    }
    expect(waves.size).toBeGreaterThan(0);
    for (const passengers of waves.values()) expect(passengers).toBeLessThanOrEqual(3);
  });

  it('réduit ses objectifs sous 20, et ne fait rien sous 6', () => {
    const t = T0 + 10 * H;
    const reduced = plan(pool(), t, { cap: 12 });
    expect(reduced.reduced).toBe(true);
    const counts = feedCounts(reduced.rows, at(t), TZ, {});
    expect(counts.toTake).toBeGreaterThanOrEqual(2);
    expect(counts.toTake).toBeLessThanOrEqual(4);
    expect(counts.active).toBeLessThanOrEqual(12);
    const tiny = plan(pool(), t, { cap: 5 });
    expect(tiny.tooSmall).toBe(true);
    expect(tiny.writes).toEqual([]);
  });

  it('ne refait pas plus de 8 réservations par heure pour les arrivées', () => {
    const t = T0 + 10 * H;
    const state: FeedState = { writes: {}, rebooks: Array.from({ length: TEST_FEED_MAX_REBOOKS_PER_HOUR }, () => at(t - 20 * M).toISOString()) };
    const isArrival = (w: FeedWrite) => w.kind === 'rebook' && (w.target === 'take_now' || w.target === 'flow');
    // Budget spent: someone already to take, no arrival rebooked…
    const waiting = pool();
    waiting[0] = row(0, { status: 'upcoming', arrivalAt: at(t + 30 * M), returnAt: at(t + 30 * H), updatedAt: at(t - 2 * H) });
    expect(plan(waiting, t, { state }).writes.filter(isArrival)).toEqual([]);
    // …nobody to take: one traveller still, never the driver left with nobody (e2e, 15/10/2026).
    const result = plan(pool(), t, { state });
    const floor = result.writes.filter(isArrival);
    expect(floor).toHaveLength(1);
    expect(floor[0]).toMatchObject({ kind: 'rebook', target: 'take_now' });
    // The returns rebooked meanwhile do not take from the arrivals' budget.
    const returns = result.writes.filter(w => w.kind === 'rebook' && !isArrival(w));
    expect(returns.length).toBeGreaterThan(0);
    expect(recordApplied(EMPTY, result.writes, at(t)).rebooks).toHaveLength(1);
    // An hour later the budget is back.
    const later = plan(pool(), t + 61 * M, { state });
    const arrivals = later.writes.filter(w => w.kind === 'rebook' && (w.target === 'take_now' || w.target === 'flow'));
    expect(arrivals.length).toBeGreaterThan(0);
    expect(arrivals.length).toBeLessThanOrEqual(TEST_FEED_MAX_REBOOKS_PER_HOUR);
  });

  it('écrit 30 fois au plus par passage, en gardant de quoi remplir les listes', () => {
    // 40 travellers whose day moves on at once: back at the parking for an hour, to hand back.
    const t = T0 + 10 * H;
    const rows = Array.from({ length: 40 }, (_, i) =>
      row(i, { status: 'back_at_parking', arrivalAt: at(t - 50 * H), returnAt: at(t - 2 * H), arrivedAt: at(t - 50 * H), updatedAt: at(t - 2 * H) }),
    );
    const { writes } = plan(rows, t);
    expect(writes.length).toBeLessThanOrEqual(TEST_FEED_MAX_WRITES_PER_RUN);
    expect(writes.filter(w => w.kind === 'move')).toHaveLength(TEST_FEED_MAX_WRITES_PER_RUN - TEST_FEED_TARGETS_ROOM);
    expect(writes.filter(w => w.kind === 'rebook').length).toBeGreaterThan(0);
  });

  it('après un week-end sans lecture, la première lecture a déjà du monde à emmener et à récupérer', () => {
    // 34 travellers back two days ago, never handed back (nobody read the lists since), and 6 plates free.
    const t = T0 + 10 * H;
    const rows = Array.from({ length: 40 }, (_, i) =>
      i < 34
        ? row(i, {
            status: 'shuttled_out',
            arrivalAt: at(t - 96 * H),
            arrivedAt: at(t - 96 * H),
            returnAt: at(t - 48 * H),
            updatedAt: at(t - 96 * H),
          })
        : row(i),
    );
    const result = plan(rows, t);
    expect(result.writes.length).toBeLessThanOrEqual(TEST_FEED_MAX_WRITES_PER_RUN);
    const counts = feedCounts(result.rows, at(t), TZ, {});
    expect(counts.toTake).toBeGreaterThanOrEqual(3);
    expect(counts.soonReturns).toBeGreaterThanOrEqual(2);
    // The stale ones left are closed by the next runs, and never listed meanwhile.
    for (const r of result.rows.filter(r => r.status === 'shuttled_out' && r.returnAt.getTime() < t)) expect(listed(r, t)).toBe(false);
  });

  it('ne reprend un voyageur d’un autre jour qu’en gardant les 2 de « En séjour »', () => {
    const t = T0 + 10 * H;
    // A full pool: 38 travellers away well after tomorrow, 2 for later days: only those beyond 2 may be brought forward.
    const rows = Array.from({ length: 40 }, (_, i) =>
      row(i, {
        status: 'shuttled_out',
        arrivalAt: at(t - 30 * H),
        arrivedAt: at(t - 30 * H),
        returnAt: at(t + (20 + i) * H),
        updatedAt: at(t - 30 * H),
      }),
    );
    const result = plan(rows, t);
    const far = result.rows.filter(r => r.status === 'shuttled_out' && r.returnAt.getTime() > t + 18 * H);
    expect(far.length).toBeGreaterThanOrEqual(2);
    expect(result.writes.some(w => w.kind === 'retime')).toBe(true);
  });

  it('ne fait jamais arriver aujourd’hui un voyageur déjà parti, même le jour de 25 h du passage à l’heure d’hiver', () => {
    // 25/10/2026 in Paris lasts 25 hours: 24 hours before 23:35 is 00:35 the same day.
    const day = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);
    let away = 0;
    for (let minute = 0; minute < 30; minute += 5) {
      const t = new Date('2026-10-25T23:30:00+01:00').getTime() + minute * M;
      for (let seed = 0; seed < 20; seed += 1) {
        const week = (i: number) => row(i, { arrivalAt: at(t - 7 * 24 * H), returnAt: at(t - 6 * 24 * H), updatedAt: at(t - 7 * 24 * H) });
        const rows = Array.from({ length: 40 }, (_, i) => week(i));
        const result = planFeed({ now: at(t), timezone: TZ, cap: 40, seats: 8, rows, state: EMPTY }, mulberry32(seed * 1000 + minute));
        for (const w of result.writes) {
          if (w.kind !== 'rebook' || w.stay.status === 'upcoming') continue;
          away += 1;
          for (const stay of [w.stay, w.fallback]) {
            expect(day(stay.arrivalAt.getTime())).not.toBe('2026-10-25');
            expect(stay.arrivalAt.getTime()).toBeLessThan(stay.returnAt.getTime());
          }
        }
      }
    }
    expect(away).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- a day with a driver

interface Trip {
  direction: 'pickup' | 'dropoff';
  ids: Set<string>;
  end: number | null; // planned end; null: never ended (expires at 90 min)
  started: number;
  endedAt: number | null;
}

class Simulation {
  rows: FeedRow[] = pool();
  trips: Trip[] = [];
  state: FeedState = EMPTY;
  lastRun = -Infinity;
  violations: string[] = [];

  constructor(private cap = 40) {}

  input(t: number): FeedRow[] {
    return this.rows.map(r => {
      const trips = this.trips.filter(trip => trip.ids.has(r.id));
      const ended = trips.filter(trip => trip.endedAt !== null).map(trip => trip.endedAt!);
      const recent = ended.filter(e => e > t - 10 * M);
      return { ...r, locked: true, onTrip: trips.some(trip => trip.endedAt === null), tripEndedAt: recent.length ? at(Math.max(...recent)) : null };
    });
  }

  run(t: number) {
    if (t - this.lastRun < 3 * M) return;
    this.lastRun = t;
    const rows = this.input(t);
    const result = planFeed({ now: at(t), timezone: TZ, cap: this.cap, seats: 8, rows, state: this.state }, feedRng('op', at(t)));
    const before = new Map(rows.map(r => [r.id, r]));
    const seen = new Set<string>();
    for (const w of result.writes) {
      const r = before.get(w.id)!;
      if (r.onTrip) this.violations.push(`write to a passenger at ${at(t).toISOString()}`);
      if (!seen.has(w.id) && listed(r, t) && !(w.kind === 'move' && (w.rule === 'check_in' || w.rule === 'return_call'))) {
        this.violations.push(`${w.kind} on a listed row at ${at(t).toISOString()}`);
      }
      seen.add(w.id);
    }
    this.rows = result.rows.map(r => ({ ...r, locked: true, onTrip: false, tripEndedAt: null }));
    this.state = recordApplied(result.state, result.writes, at(t));
    for (const r of this.rows) {
      if (inDepartureList(r, at(t)) && inPickupList(r, at(t))) this.violations.push(`${r.plate} in both lists at ${at(t).toISOString()}`);
    }
    const active = this.rows.filter(r => !['returned', 'cancelled', 'no_show'].includes(r.status)).length;
    if (active > this.cap) this.violations.push(`${active} active for a cap of ${this.cap}`);
  }

  counts(t: number) {
    return feedCounts(this.input(t), at(t), TZ, this.state.writes);
  }

  endTrips(t: number) {
    for (const trip of this.trips) {
      if (trip.endedAt !== null) continue;
      if (trip.end === null) {
        if (t >= trip.started + 90 * M) trip.endedAt = t; // expired: nobody moves
        continue;
      }
      if (t < trip.end) continue;
      trip.endedAt = t;
      this.rows = this.rows.map(r => {
        if (!trip.ids.has(r.id)) return r;
        if (trip.direction === 'dropoff' && r.status === 'arrived') return { ...r, status: 'shuttled_out', updatedAt: at(t) };
        if (trip.direction === 'pickup' && AWAY_STATUSES.includes(r.status)) return { ...r, status: 'back_at_parking', updatedAt: at(t) };
        return r;
      });
    }
  }

  visits = 0;

  /**
   * The driver opens the app: every other visit a drop-off when someone waits, else a pick-up when someone returns
   * within the hour (else whichever has someone).
   */
  drive(t: number, expires: boolean): 'busy' | 'pickup' | 'dropoff' | 'none' {
    if (this.trips.some(trip => trip.endedAt === null)) return 'busy';
    this.visits += 1;
    const rows = this.input(t);
    const due = rows
      .filter(r => inPickupList(r, at(t)) && !r.onTrip && r.returnAt.getTime() <= t + H)
      .sort((a, b) => a.returnAt.getTime() - b.returnAt.getTime());
    const board = (candidates: FeedRow[]) => {
      let seats = 8;
      const ids = new Set<string>();
      for (const r of candidates) {
        if (r.passengers <= seats) {
          seats -= r.passengers;
          ids.add(r.id);
        }
      }
      return ids;
    };
    const candidates = rows
      .filter(r => inDepartureList(r, at(t)) && !r.onTrip && canBoard('dropoff', r, at(t)))
      .sort(
        (a, b) =>
          Number(a.status !== 'arrived') - Number(b.status !== 'arrived') ||
          (a.arrivedAt ?? a.arrivalAt).getTime() - (b.arrivedAt ?? b.arrivalAt).getTime(),
      );
    if (due.length && !(this.visits % 2 === 0 && candidates.length)) {
      this.trips.push({ direction: 'pickup', ids: board(due), started: t, end: expires ? null : t + 40 * M, endedAt: null });
      return 'pickup';
    }
    if (!candidates.length) return 'none';
    const ids = board(candidates);
    this.rows = this.rows.map(r => (ids.has(r.id) && r.status === 'upcoming' ? { ...r, status: 'arrived', arrivedAt: at(t), updatedAt: at(t) } : r));
    this.trips.push({ direction: 'dropoff', ids, started: t, end: expires ? null : t + 25 * M, endedAt: null });
    return 'dropoff';
  }
}

function simulate(options: {
  reads: (minute: number) => boolean;
  drives: (minute: number) => boolean;
  expires?: (minute: number) => boolean;
  cap?: number;
}) {
  const sim = new Simulation(options.cap);
  const samples: { takeable: number; soon: number }[] = [];
  const visits: number[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 3) {
    const t = T0 + 8 * H + minute * M;
    sim.endTrips(t);
    const reads = options.reads(minute);
    const drives = options.drives(minute);
    if (reads || drives) sim.run(t);
    if (reads && minute >= 30) {
      const c = sim.counts(t);
      samples.push({ takeable: c.toTake, soon: c.soonReturns });
    }
    if (drives) {
      const c = sim.counts(t);
      const result = sim.drive(t, options.expires?.(minute) ?? false);
      if (result !== 'busy') visits.push(c.toTake);
    }
  }
  const share = (ok: (s: { takeable: number; soon: number }) => boolean) => samples.filter(ok).length / samples.length;
  return { sim, samples, visits, share };
}

describe('une journée avec un chauffeur (simulation sur 24 h, toutes les 3 min)', () => {
  const always = () => true;
  const hourOf = (minute: number) => (8 + Math.floor(minute / 60)) % 24;
  const daytime = (minute: number) => hourOf(minute) >= 7 && hourOf(minute) < 22;
  const scenarios: [string, Parameters<typeof simulate>[0]][] = [
    ['personne ne conduit', { reads: always, drives: () => false }],
    ['un chauffeur toutes les 30 min, jour et nuit', { reads: always, drives: m => m % 30 === 0 }],
    ['un chauffeur toutes les 10 min', { reads: always, drives: m => m % 10 === 0 }],
    ['un chauffeur toutes les 2 h, lectures de 07:00 à 22:00', { reads: daytime, drives: m => daytime(m) && m % 120 === 0 }],
    ['un trajet de 90 min qui expire', { reads: always, drives: m => m % 30 === 0, expires: m => m % 180 === 0 }],
  ];

  it.each(scenarios)('%s', (_name, options) => {
    const { sim, visits, share } = simulate(options);
    expect(sim.violations).toEqual([]);
    if (options.drives(0)) expect(sim.trips.filter(trip => trip.direction === 'dropoff').length).toBeGreaterThanOrEqual(3);
    for (const takeable of visits) expect(takeable).toBeGreaterThanOrEqual(1);
    expect(share(s => s.takeable >= 3)).toBeGreaterThanOrEqual(0.95);
    expect(share(s => s.soon >= 1)).toBeGreaterThanOrEqual(0.95);
  });

  it('un petit parking (cap 12) a quelqu’un à emmener à chaque passage du chauffeur', () => {
    // Reduced targets: the 4 travellers taken stay in the list (« En route ») until the drop-off ends, so the band
    // may be empty while the driver is away, never when they come back.
    const { sim, visits, share } = simulate({ reads: always, drives: m => m % 30 === 0, cap: 12 });
    expect(sim.violations).toEqual([]);
    expect(visits.length).toBeGreaterThan(20);
    for (const takeable of visits) expect(takeable).toBeGreaterThanOrEqual(1);
    expect(share(s => s.soon >= 1)).toBeGreaterThanOrEqual(0.95);
  });
});
