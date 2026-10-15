import { Container } from 'typedi';
import prisma from '@/database';
import { TEST_FEED_REFERENCE_PREFIX, feedPersonOf } from '@/domain/test-feed';
import { addDays, localDate, parseInstant } from '@/domain/time';
import { FlightTrackingService } from '@/services/flight-tracking.service';
import { NotificationService } from '@/services/notification.service';
import { PushService } from '@/services/push.service';
import { SmsGatewayClient } from '@/services/sms-gateway.service';
import { SmsService } from '@/services/sms.service';
import { TestFeedService } from '@/services/test-feed.service';
import { TravellerMessagesService } from '@/services/traveller-messages.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * The continuous test feed of « Plazo (tests) » (15/10/2026) lived as a driver lives it, end to end through the API and
 * the real database: hours of a driver's tour at different times of the day (night, noon, evening), reading his
 * lists every 4 minutes, taking « Sur place » and « Attendu » travellers to the terminal, fetching returns, handing
 * cars back, while the feed runs at each read. At every step: someone to take and to fetch (or the documented reason
 * why not), nobody on a running trip touched, no trip started or ended by the feed, a listed booking only ever checked
 * in or calling its return, 40 plates and no duplicate, nothing done to another operator, and no push, SMS, e-mail or
 * flight lookup attempted by a read. FEED_E2E_HOURS (default 2) sets the hours driven from each start, FEED_E2E_STARTS
 * the starts (parking's clock, default 02:40,11:30,21:20), FEED_E2E_GREEDY=1 a driver boarding everyone listed at each
 * trip, FEED_E2E_TRACE=1 the runs that leave fewer than 3 to take, with their reason.
 */

const TZ = 'Europe/Paris';
const M = 60000;
const H = 60 * M;
const STEP = 4 * M;
const HOURS = Number(process.env.FEED_E2E_HOURS || 2);
const STARTS = (process.env.FEED_E2E_STARTS || '02:40,11:30,21:20').split(',');
const SEATS = 8;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const feed = () => Container.get(TestFeedService);
const savedAdmins = process.env.PLATFORM_ADMIN_EMAILS;

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  process.env.PLATFORM_ADMIN_EMAILS = savedAdmins;
});
afterAll(() => prisma.$disconnect());

/** `hhmm` on the parking's clock, two days ahead of the real date (the database's own clock stays behind it). */
function parisAt(hhmm: string): Date {
  return parseInstant(`${addDays(localDate(new Date(), TZ), 2)}T${hhmm}`, TZ)!;
}

function freezeAt(at: Date) {
  jest.useFakeTimers({
    now: at,
    advanceTimers: true,
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'queueMicrotask',
      'hrtime',
      'performance',
    ],
  });
}

/** Every channel a message or a flight lookup could leave by, spied (nothing really sent: no key in tests). */
function spyOnSenders() {
  const push = Container.get(PushService);
  const sms = Container.get(SmsService);
  const gateway = Container.get(SmsGatewayClient);
  const mail = Container.get(NotificationService);
  const messages = Container.get(TravellerMessagesService);
  const flights = Container.get(FlightTrackingService);
  const lookup = jest.fn(async () => null);
  jest.spyOn(flights, 'provider').mockReturnValue({ name: 'aerodatabox', lookup } as any);
  const spies: Record<string, jest.SpyInstance | jest.Mock> = {
    lookup,
    fetch: jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 })),
    notifyNewBooking: jest.spyOn(push, 'notifyNewBooking'),
    notifyBookingChanged: jest.spyOn(push, 'notifyBookingChanged'),
    notifyStaff: jest.spyOn(push, 'notifyStaff'),
    notifyTravellers: jest.spyOn(push, 'notifyTravellers'),
    sendTravellerSms: jest.spyOn(sms, 'sendTravellerSms'),
    gatewaySend: jest.spyOn(gateway, 'send'),
    smsViaBrevo: jest.spyOn(mail, 'smsViaBrevo'),
    sendEmail: jest.spyOn(mail as any, 'sendEmail'),
    emailStaff: jest.spyOn(mail, 'emailStaff'),
    carParked: jest.spyOn(messages, 'carParked'),
    droppedOff: jest.spyOn(messages, 'droppedOff'),
    handedBack: jest.spyOn(messages, 'handedBack'),
  };
  return {
    reset: () => Object.values(spies).forEach(s => s.mockClear()),
    called: () =>
      Object.entries(spies)
        .filter(([, s]) => s.mock.calls.length)
        .map(([name, s]) => `${name} ×${s.mock.calls.length}`),
    /** The calls whose arguments name one of `needles` (an operator, a booking, a reference). */
    naming: (needles: string[]) =>
      Object.entries(spies).flatMap(([name, s]) =>
        s.mock.calls
          .map(args => {
            let text = '';
            try {
              text = JSON.stringify(args);
            } catch {
              text = String(args);
            }
            return needles.some(n => text.includes(n)) ? `${name}: ${text.slice(0, 160)}` : null;
          })
          .filter((c): c is string => c !== null),
      ),
  };
}

const rowsOf = (operatorId: string) => prisma.reservation.findMany({ where: { operatorId }, orderBy: { id: 'asc' } });
const tripsOf = (operatorId: string) =>
  prisma.shuttleTrip.findMany({
    where: { operatorId },
    orderBy: { id: 'asc' },
    select: { id: true, status: true, endedAt: true, expiresAt: true, passengers: { select: { reservationId: true } } },
  });
const json = (r: unknown) => JSON.stringify(r);
const LIST_KEEPING: [string, string][] = [
  ['upcoming', 'arrived'],
  ['shuttled_out', 'return_requested'],
];

/**
 * A member's write is dated by the database engine's own clock (the real one), not the test's clock: it is dated again
 * at the test's « now », as it would be in production (the feed tells a member's change by its updatedAt).
 */
async function asStaff<T>(operatorId: string, action: () => Promise<T>): Promise<T> {
  const before = new Map((await rowsOf(operatorId)).map(r => [r.id, r.updatedAt.getTime()]));
  const result = await action();
  const now = new Date();
  for (const r of await rowsOf(operatorId)) {
    if (before.get(r.id) !== r.updatedAt.getTime()) await prisma.reservation.update({ where: { id: r.id }, data: { updatedAt: now } });
  }
  return result;
}

async function setup() {
  const test = await setupOperator('Plazo');
  await prisma.operator.update({ where: { id: test.operator.id }, data: { name: 'Plazo (tests)' } });
  // Another operator, whose manager is also a platform admin (only the name and its own admin make the test account),
  // with real bookings in its driver's lists; and a « (tests) » operator without any admin.
  const real = await setupOperator('Parking Réel');
  const orphan = await setupOperator('Autre');
  await prisma.operator.update({ where: { id: orphan.operator.id }, data: { name: 'Autre (tests)' } });
  process.env.PLATFORM_ADMIN_EMAILS = `${test.manager.email},${real.manager.email}`;
  const driver = await addStaff(test.token, 'driver');
  const realDriver = await addStaff(real.token, 'driver');
  const orphanDriver = await addStaff(orphan.token, 'driver');
  const vehicle = await api()
    .post('/api/internal/shuttle/vehicles')
    .set(auth(test.token))
    .send({ model: 'Trafic', colour: 'blanc', plate: 'TS-100-PZ', seats: SEATS });
  expect(vehicle.status).toBe(201);
  const now = Date.now();
  for (const [arrival, ret, plate] of [
    [now + 40 * M, now + 3 * 24 * H, 'AB-123-CD'],
    [now - 3 * 24 * H, now + 50 * M, 'EF-456-GH'],
  ] as const) {
    const res = await api()
      .post('/api/internal/reservations')
      .set(auth(real.token))
      .send({
        channel: 'phone',
        arrivalAt: new Date(arrival).toISOString(),
        returnAt: new Date(ret).toISOString(),
        passengers: 2,
        customerFirstName: 'Vrai',
        customerLastName: 'Client',
        customerPhone: '06 12 34 56 78',
        plate,
      });
    expect(res.status).toBe(201);
  }
  await prisma.reservation.updateMany({ where: { operatorId: real.operator.id, plate: 'EF-456-GH' }, data: { status: 'shuttled_out' } });
  return { test, real, orphan, driver, realDriver, orphanDriver, vehicleId: vehicle.body.data.id as string };
}

interface Trip {
  id: string;
  direction: 'dropoff' | 'pickup';
  ids: string[];
  endAt: number;
  snapshot: string;
}

interface Stats {
  steps: number;
  idleReads: number;
  take: number[];
  soon: number[];
  pick: number[];
  dropoffs: number;
  pickups: number;
  boardedExpected: number;
  boarded: number;
  handedBackByDesk: number;
  feedWrites: number;
  listKeepingMoves: number;
  shortfalls: Record<string, number>;
  dropoffOverflow: number;
}

async function driveFrom(startHHMM: string): Promise<Stats> {
  await resetDatabase();
  feed().tried.clear();
  const start = parisAt(startHHMM);
  freezeAt(start);
  const senders = spyOnSenders();
  const ctx = await setup();
  const op = ctx.test.operator.id;
  const isFeed = (r: { plate: string }) => /^TS-2\d\d-PZ$/.test(r.plate);
  const stats: Stats = {
    steps: 0,
    idleReads: 0,
    take: [],
    soon: [],
    pick: [],
    dropoffs: 0,
    pickups: 0,
    boardedExpected: 0,
    boarded: 0,
    handedBackByDesk: 0,
    feedWrites: 0,
    listKeepingMoves: 0,
    shortfalls: {},
    dropoffOverflow: 0,
  };
  const shortfall = (what: string) => (stats.shortfalls[what] = (stats.shortfalls[what] ?? 0) + 1);

  let trip: Trip | null = null;
  let lastDirection: 'dropoff' | 'pickup' = 'pickup';
  const ended: { ids: string[]; at: number }[] = [];
  const broughtBack = new Map<string, number>();
  const seenListed = new Map<string, number>();
  const lastRanAt = { value: null as string | null };

  for (let t = start.getTime() + STEP; t <= start.getTime() + HOURS * H; t += STEP) {
    jest.setSystemTime(t);
    stats.steps += 1;
    const where = `${startHHMM} +${Math.round((t - start.getTime()) / M)} min`;
    const before = await rowsOf(op);
    const tripsBefore = json(await tripsOf(op));
    const realBefore = json([...(await rowsOf(ctx.real.operator.id)), ...(await rowsOf(ctx.orphan.operator.id))]);
    senders.reset();

    // ---- the driver's reads (the feed runs at the first one), and the other operators' drivers reading theirs
    const dep = await api().get('/api/internal/shuttle/departures').set(auth(ctx.driver.token));
    const pick = await api().get('/api/internal/shuttle/pickups').set(auth(ctx.driver.token));
    expect([dep.status, pick.status]).toEqual([200, 200]);
    if (stats.steps % 3 === 1) {
      const [staying, forecast, planning] = await Promise.all([
        api().get('/api/internal/shuttle/staying').set(auth(ctx.driver.token)),
        api().get('/api/internal/shuttle/forecast').set(auth(ctx.driver.token)),
        api().get('/api/internal/planning').set(auth(ctx.driver.token)),
      ]);
      expect([staying.status, forecast.status, planning.status]).toEqual([200, 200, 200]);
      // « Ligne du jour »: no drop-off wave still to run needs a second shuttle (the dashboard's wave_overflow alert;
      // a running wave is the driver's own trip, which may have boarded travellers early).
      for (const wave of forecast.body.waves as { direction: string; state: string; vehiclesNeeded: number | null }[]) {
        if (wave.direction === 'dropoff' && wave.state === 'planned' && (wave.vehiclesNeeded ?? 1) > 1) {
          stats.dropoffOverflow += 1;
          if (process.env.FEED_E2E_TRACE) {
            // eslint-disable-next-line no-console
            console.log(`[overflow] ${where} ${json(wave)}`);
          }
        }
      }
    }
    for (const token of [ctx.realDriver.token, ctx.orphanDriver.token]) {
      const [d, p] = await Promise.all([
        api().get('/api/internal/shuttle/departures').set(auth(token)),
        api().get('/api/internal/shuttle/pickups').set(auth(token)),
      ]);
      expect([...d.body.rows, ...p.body.rows].filter(isFeed)).toEqual([]);
    }

    // ---- nobody told, nothing looked up, by any read
    expect({ where, called: senders.called() }).toEqual({ where, called: [] });

    // ---- the trips are the driver's: none started, ended nor expired by a read
    expect(json(await tripsOf(op))).toBe(tripsBefore);
    // ---- the other operators untouched, and never a test feed of theirs
    expect(json([...(await rowsOf(ctx.real.operator.id)), ...(await rowsOf(ctx.orphan.operator.id))])).toBe(realBefore);
    expect(await prisma.testFeed.count({ where: { operatorId: { not: op } } })).toBe(0);
    expect(
      await prisma.reservation.count({ where: { operatorId: { not: op }, externalReference: { startsWith: TEST_FEED_REFERENCE_PREFIX } } }),
    ).toBe(0);

    // ---- the pool: 40 bookings, one per plate, each its own fictional person, never overbooked
    const after = await rowsOf(op);
    expect(after).toHaveLength(40);
    expect(new Set(after.map(r => r.plate)).size).toBe(40);
    expect(new Set(after.map(r => r.reference)).size).toBe(40);
    for (const r of after) {
      expect(feedPersonOf(r.externalReference)?.plate).toBe(r.plate);
      expect(r.overbooked).toBe(false);
      expect(r.customerEmail).toBeNull();
      expect(r.returnFlight).toBeNull();
      expect(r.returnAt.getTime()).toBeGreaterThan(r.arrivalAt.getTime());
    }

    // ---- what the feed wrote during these reads
    const prior = new Map(before.map(r => [r.id, r]));
    const onTrip = new Set(trip?.ids ?? []);
    for (const r of after) {
      const was = prior.get(r.id);
      if (was && json(was) === json(r)) continue;
      stats.feedWrites += 1;
      const change = `${where} ${r.plate}: ${was?.status} → ${r.status}`;
      // Nobody on a running trip, nor of a trip ended less than 10 minutes ago.
      expect({ change, onTrip: onTrip.has(r.id) }).toEqual({ change, onTrip: false });
      const justEnded = ended.find(e => e.ids.includes(r.id) && t - e.at < 10 * M);
      expect({ change, justEnded: !!justEnded }).toEqual({ change, justEnded: false });
      // Brought back to the parking: the desk hands the car back, the feed waits 45 minutes.
      const back = broughtBack.get(r.id);
      if (back !== undefined && t - back < 45 * M) expect({ change, early: true }).toEqual({ change, early: false });
      // Listed to the driver less than 15 minutes ago: only checked in, or calling for the return, and still listed.
      if ((seenListed.get(r.id) ?? -Infinity) >= t - 15 * M) {
        const move = `${was!.status}→${r.status}`;
        expect({ change, move: LIST_KEEPING.some(([a, b]) => `${a}→${b}` === move) }).toEqual({ change, move: true });
        expect({ change, same: [was!.reference, +was!.arrivalAt, +was!.returnAt] }).toEqual({
          change,
          same: [r.reference, +r.arrivalAt, +r.returnAt],
        });
        const stillListed = [...dep.body.rows, ...pick.body.rows].some((x: { reservationId: string }) => x.reservationId === r.id);
        expect({ change, stillListed }).toEqual({ change, stillListed: true });
        stats.listKeepingMoves += 1;
      }
    }

    // ---- the lists: nobody in both, and the targets met (or the run says why not)
    const depRows = (dep.body.rows as any[]).filter(isFeed);
    const pickRows = (pick.body.rows as any[]).filter(isFeed);
    expect(depRows.filter(d => pickRows.some(p => p.reservationId === d.reservationId))).toEqual([]);
    for (const r of [...depRows, ...pickRows]) seenListed.set(r.reservationId, t);
    const takeable = depRows.filter(r => !r.tripId);
    const pickable = pickRows.filter(r => !r.tripId);
    const soon = pickable.filter(r => Date.parse(r.returnAt) >= t - 30 * M && Date.parse(r.returnAt) <= t + 2 * H);
    const state = await prisma.testFeed.findUniqueOrThrow({ where: { operatorId: op } });
    const ran = state.ranAt?.toISOString() ?? null;
    expect({ where, ran: ran !== lastRanAt.value }).toEqual({ where, ran: true });
    lastRanAt.value = ran;
    const report = state.lastReport as any;
    const rebooksLastHour = ((state.state as any).rebooks as string[]).filter(at => Date.parse(at) > t - H).length;
    const skipped = (reason: string) => (report.skipped as { reason: string }[]).some(s => s.reason === reason);
    const busy = report.moves.length + report.rebooks.length + report.retimes.length >= 30 || report.poolExhausted;
    if (takeable.length < 3) {
      const takeNow = (report.rebooks as { target: string }[]).filter(r => r.target === 'take_now').length;
      const why =
        depRows.length >= 8
          ? 'take: 8 listed'
          : rebooksLastHour >= 8
            ? 'take: hourly budget'
            : skipped('take_now_no_slot')
              ? 'take: no slot'
              : takeNow >= 2
                ? 'take: 2 groups a run'
                : busy
                  ? 'take: busy'
                  : null;
      expect({ where, takeable: takeable.length, why }).toEqual({ where, takeable: takeable.length, why: expect.any(String) });
      shortfall(why!);
      if (process.env.FEED_E2E_TRACE) {
        const done = { rebooks: report.rebooks.map((r: { target: string }) => r.target), retimes: report.retimes.length, moves: report.moves.length };
        // eslint-disable-next-line no-console
        console.log(
          `[trace] ${where} take=${takeable.length}/${depRows.length} ${why} arrivalsLastHour=${rebooksLastHour} idle=${!trip} ${json(done)}`,
        );
      }
    }
    if (soon.length < 2) {
      const why = skipped('soon_return_no_slot') ? 'soon: no slot' : busy ? 'soon: busy' : null;
      expect({ where, soon: soon.length, why }).toEqual({ where, soon: soon.length, why: expect.any(String) });
      shortfall(why!);
    }
    if (pickable.length < 4) {
      const listed = (report.rebooks as { target: string }[]).filter(r => r.target === 'listed_return').length;
      const why = report.counts.active >= report.cap ? 'pick: cap' : listed >= 2 ? 'pick: 2 a run' : busy ? 'pick: busy' : null;
      expect({ where, pick: pickable.length, why }).toEqual({ where, pick: pickable.length, why: expect.any(String) });
      shortfall(why!);
    }

    // ---- the driver
    if (trip) {
      // On the way: his passengers exactly as they were when he left.
      expect({ where, passengers: json(after.filter(r => trip!.ids.includes(r.id))) }).toEqual({ where, passengers: trip.snapshot });
      if (t >= trip.endAt) {
        const current = trip;
        await asStaff(op, async () => {
          const res = await api().post(`/api/internal/shuttle/trips/${current.id}/end`).set(auth(ctx.driver.token));
          expect(res.status).toBe(200);
        });
        const rows = (await rowsOf(op)).filter(r => current.ids.includes(r.id));
        expect(rows.map(r => r.status)).toEqual(rows.map(() => (current.direction === 'dropoff' ? 'shuttled_out' : 'back_at_parking')));
        ended.push({ ids: current.ids, at: Date.now() });
        if (current.direction === 'pickup') for (const id of current.ids) broughtBack.set(id, Date.now());
        trip = null;
      }
    } else {
      stats.idleReads += 1;
      stats.take.push(takeable.length);
      stats.soon.push(soon.length);
      stats.pick.push(pickable.length);
      // The driver always finds someone to take, and someone to fetch.
      expect({ where, someoneToTake: takeable.length > 0 }).toEqual({ where, someoneToTake: true });
      expect({ where, someoneToFetch: pickable.length > 0 }).toEqual({ where, someoneToFetch: true });

      // His choice: the returns due within 30 minutes, or the travellers on site and those expected within 15 minutes
      // (« Embarquer en un geste »), one way then the other.
      const dueBack = pickable.filter(r => Date.parse(r.returnAt) <= t + 30 * M).sort((a, b) => Date.parse(a.returnAt) - Date.parse(b.returnAt));
      const toTake = takeable
        .filter(r => r.status === 'arrived' || Date.parse(r.arrivalAt) <= t + (process.env.FEED_E2E_GREEDY ? 24 * H : 15 * M))
        .sort((a, b) => Number(a.expected) - Number(b.expected) || Date.parse(a.arrivalAt) - Date.parse(b.arrivalAt));
      const direction: 'dropoff' | 'pickup' | null =
        lastDirection === 'dropoff'
          ? dueBack.length
            ? 'pickup'
            : toTake.length
              ? 'dropoff'
              : null
          : toTake.length
            ? 'dropoff'
            : dueBack.length
              ? 'pickup'
              : null;
      if (direction) {
        const seated: any[] = [];
        for (const r of direction === 'dropoff' ? toTake : dueBack) {
          if (seated.reduce((sum, s) => sum + s.passengers, 0) + r.passengers <= SEATS) seated.push(r);
        }
        const ids = seated.map(r => r.reservationId as string);
        const started = await asStaff(op, () =>
          api().post('/api/internal/shuttle/trips').set(auth(ctx.driver.token)).send({ reservationIds: ids, direction, vehicleId: ctx.vehicleId }),
        );
        expect({ where, status: started.status, body: started.status === 201 ? null : started.body }).toEqual({ where, status: 201, body: null });
        const rows = (await rowsOf(op)).filter(r => ids.includes(r.id));
        if (direction === 'dropoff') {
          // Everyone « Sur place » from the start, the expected ones checked in at boarding.
          expect(rows.every(r => r.status === 'arrived')).toBe(true);
          stats.boardedExpected += seated.filter(r => r.expected).length;
          stats.dropoffs += 1;
        } else stats.pickups += 1;
        stats.boarded += ids.length;
        trip = { id: started.body.trip.id, direction, ids, endAt: t + (direction === 'dropoff' ? 12 : 16) * M, snapshot: json(rows) };
        lastDirection = direction;
      }
    }

    // ---- the desk hands back half of the cars brought back, 8 to 40 minutes later (the feed does the others at 45)
    for (const [id, at] of broughtBack) {
      if (t - at < 8 * M || t - at > 40 * M || id.charCodeAt(id.length - 1) % 2) continue;
      const row = (await rowsOf(op)).find(r => r.id === id)!;
      if (row.status !== 'back_at_parking') continue;
      const res = await asStaff(op, () =>
        api().post(`/api/internal/reservations/${id}/status`).set(auth(ctx.test.token)).send({ status: 'returned' }),
      );
      expect(res.status).toBe(200);
      stats.handedBackByDesk += 1;
    }
  }

  // ---- the crons of the day: no reminder, digest, landing SMS nor message for a fictional traveller
  senders.reset();
  await prisma.staff.updateMany({ where: { operatorId: op }, data: { bookingNotify: 'hourly' } });
  for (const cron of ['remind-tomorrow', 'booking-digest', 'track-return-flights']) {
    const res = await api().get(`/api/internal/cron/${cron}`).set('Authorization', 'Bearer test-cron-secret');
    expect([cron, res.status < 500]).toEqual([cron, true]);
  }
  const fictional = await rowsOf(op);
  expect(senders.naming([op, ...fictional.flatMap(r => [r.id, r.reference])])).toEqual([]);
  expect(fictional.every(r => r.reminderSentAt === null && r.landingSmsAt === null)).toBe(true);
  expect(await prisma.smsOutbox.count({ where: { reservationId: { in: fictional.map(r => r.id) } } })).toBe(0);
  if (trip) {
    const res = await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(ctx.driver.token));
    expect(res.status).toBe(200);
  }
  return stats;
}

const summary = (n: number[]) => {
  const sorted = [...n].sort((a, b) => a - b);
  return n.length ? { min: sorted[0], median: sorted[Math.floor(sorted.length / 2)], max: sorted[sorted.length - 1] } : null;
};

describe('« Plazo (tests) » : un chauffeur trouve toujours du monde, à toute heure', () => {
  for (const start of STARTS) {
    it(`de ${start}, ${HOURS} h de tournée`, async () => {
      const stats = await driveFrom(start);
      const atLeast3 = stats.take.filter(n => n >= 3).length;
      // eslint-disable-next-line no-console
      console.log(
        `[feed e2e ${start}] steps=${stats.steps} idle=${stats.idleReads} dropoffs=${stats.dropoffs} pickups=${stats.pickups} boarded=${stats.boarded} ` +
          `(attendus ${stats.boardedExpected}) deskHandBacks=${stats.handedBackByDesk} feedWrites=${stats.feedWrites} listKeeping=${stats.listKeepingMoves} ` +
          `take=${json(summary(stats.take))} take>=3=${atLeast3}/${stats.take.length} soon=${json(summary(stats.soon))} pick=${json(summary(stats.pick))} ` +
          `shortfalls=${json(stats.shortfalls)} dropoffOverflow=${stats.dropoffOverflow}`,
      );
      expect(stats.dropoffs).toBeGreaterThan(0);
      expect(stats.pickups).toBeGreaterThan(0);
      expect(stats.boardedExpected).toBeGreaterThan(0);
      // A driver boarding travellers hours early (FEED_E2E_GREEDY) moves their wave to now: only the usual driver's count.
      if (!process.env.FEED_E2E_GREEDY) expect(stats.dropoffOverflow).toBe(0);
    }, 600000);
  }
});
