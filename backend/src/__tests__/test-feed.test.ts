import { Container } from 'typedi';
import prisma, { Parking } from '@/database';
import { inDepartureList, inPickupList, TEST_FEED_REFERENCE_PREFIX } from '@/domain/test-feed';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { BookingDigestService } from '@/services/booking-digest.service';
import { PushService } from '@/services/push.service';
import { ReminderService } from '@/services/reminder.service';
import { TestFeedService } from '@/services/test-feed.service';
import { addStaff, api, resetDatabase, setupOperator, useBrevoSms } from './utils/helpers';

/**
 * The continuous fictional travellers of the platform's test operator (15/10/2026, « ajoute en continu des données de
 * tests pour le chauffeur pour qu'il ait toujours des personnes à emmener »): stocked by the driver's reads, through
 * the API and the real database; real operators untouched, drivers never interrupted, nobody told.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const M = 60000;
const H = 60 * M;
const feed = () => Container.get(TestFeedService);
const savedAdmins = process.env.PLATFORM_ADMIN_EMAILS;
const POOL = { externalReference: { startsWith: TEST_FEED_REFERENCE_PREFIX } };

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  feed().tried.clear();
  delete process.env.TEST_FEED;
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  jest.useRealTimers();
  jest.restoreAllMocks();
  process.env.PLATFORM_ADMIN_EMAILS = savedAdmins;
  delete process.env.TEST_FEED;
});
afterAll(() => prisma.$disconnect());

/** The clock seen by the code moved to `at` (and running from there); the database's own defaults keep the real time. */
function clockAt(at: Date) {
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

/**
 * « Plazo (tests) »: an operator renamed so, whose manager is a platform admin, with a driver and an 8-seat shuttle.
 * `as`: another setup to check that nothing happens (another name, no admin, demo).
 */
async function testOperator(as: { name?: string; admin?: boolean; demo?: boolean; capacity?: number } = {}) {
  const op = await setupOperator('Plazo');
  await prisma.operator.update({ where: { id: op.operator.id }, data: { name: as.name ?? 'Plazo (tests)', isDemo: as.demo ?? false } });
  if (as.capacity) await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: as.capacity } });
  process.env.PLATFORM_ADMIN_EMAILS = as.admin === false ? 'quelquun@ailleurs.example' : op.manager.email;
  const driver = await addStaff(op.token, 'driver');
  const vehicle = await api()
    .post('/api/internal/shuttle/vehicles')
    .set(auth(op.token))
    .send({ model: 'Trafic', colour: 'blanc', plate: 'TS-100-PZ', seats: 8 });
  if (vehicle.status !== 201) throw new Error(JSON.stringify(vehicle.body));
  return { ...op, driver, vehicleId: vehicle.body.data.id as string };
}

const departures = (token: string) => api().get('/api/internal/shuttle/departures').set(auth(token));
const pickups = (token: string) => api().get('/api/internal/shuttle/pickups').set(auth(token));
const poolRows = (operatorId: string) => prisma.reservation.findMany({ where: { operatorId, ...POOL }, orderBy: { plate: 'asc' } });
/** The feed's rows of a list the API served (TS-201-PZ to TS-240-PZ). */
const feedRowsIn = (rows: any[]): any[] => rows.filter(r => /^TS-2\d\d-PZ$/.test(r.plate));
const startTrip = (token: string, reservationIds: string[], direction: 'pickup' | 'dropoff', vehicleId: string) =>
  api().post('/api/internal/shuttle/trips').set(auth(token)).send({ reservationIds, direction, vehicleId });
const snapshot = async (ids: string[]) =>
  (
    await prisma.reservation.findMany({
      where: { id: { in: ids } },
      orderBy: { id: 'asc' },
      select: { id: true, status: true, updatedAt: true, returnAt: true, reference: true },
    })
  ).map(r => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
    returnAt: r.returnAt.toISOString(),
  }));
const ranAt = async (operatorId: string) => (await prisma.testFeed.findUnique({ where: { operatorId } }))?.ranAt?.toISOString() ?? null;

describe('les vrais loueurs ne sont jamais touchés', () => {
  it('ni un loueur ordinaire (même avec un administrateur de la plateforme), ni « (tests) » sans administrateur', async () => {
    for (const as of [{ name: 'Parking Dupont' }, { admin: false }]) {
      const op = await testOperator(as);
      expect((await departures(op.driver.token)).status).toBe(200);
      expect((await pickups(op.driver.token)).status).toBe(200);
      expect(await prisma.testFeed.count({ where: { operatorId: op.operator.id } })).toBe(0);
      expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(0);
      const view = await api().get('/api/internal/test-feed').set(auth(op.token));
      expect(view.status).toBe(404);
      expect(view.body.code).toBe('not_found');
      expect((await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: true })).status).toBe(404);
      expect((await api().post('/api/internal/test-feed/run').set(auth(op.token))).status).toBe(404);
    }
  });

  it('ni un loueur de démonstration, suspendu ou archivé, ni quand TEST_FEED=off', async () => {
    const demo = await testOperator({ demo: true });
    await departures(demo.driver.token);
    expect(await prisma.reservation.count({ where: { operatorId: demo.operator.id } })).toBe(0);
    const demoView = await api().get('/api/internal/test-feed').set(auth(demo.token));
    expect(demoView.body.data).toMatchObject({ available: false, pool: [] });

    // Suspended or archived: nobody of theirs reads, but a platform admin may consult the space.
    const closed = await testOperator();
    const parking = (await prisma.parking.findFirstOrThrow({ where: { operatorId: closed.operator.id } })) as Parking;
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: closed.driver.id } });
    const actor = { ...staff, operatorName: 'Plazo (tests)' } as AuthenticatedStaff;
    for (const data of [
      { status: 'suspended' as const, suspendedAt: new Date() },
      { status: 'suspended' as const, suspendedAt: new Date(), archivedAt: new Date() },
    ]) {
      await prisma.operator.update({ where: { id: closed.operator.id }, data });
      feed().tried.clear();
      await feed().maybeRun(actor, parking);
      expect(await prisma.reservation.count({ where: { operatorId: closed.operator.id } })).toBe(0);
    }

    process.env.TEST_FEED = 'off';
    const off = await testOperator();
    await departures(off.driver.token);
    expect(await prisma.testFeed.count({ where: { operatorId: off.operator.id } })).toBe(0);
    expect(await prisma.reservation.count({ where: { operatorId: off.operator.id } })).toBe(0);
    const offView = await api().get('/api/internal/test-feed').set(auth(off.token));
    expect(offView.body.data).toMatchObject({ killSwitch: true, available: false });
    expect((await api().post('/api/internal/test-feed/run').set(auth(off.token))).body.code).toBe('test_feed_off');
  });
});

describe('le chauffeur trouve toujours du monde', () => {
  it('dès sa première lecture : au moins 3 voyageurs à emmener et 2 retours dans les 2 h, sans message ni vol', async () => {
    const op = await testOperator();
    fetchMock.mockClear();
    const before = Date.now();
    const take = await departures(op.driver.token);
    expect(take.status).toBe(200);
    expect(feedRowsIn(take.body.rows).length).toBeGreaterThanOrEqual(3);
    const pick = await pickups(op.driver.token);
    const soon = feedRowsIn(pick.body.rows).filter(r => Date.parse(r.returnAt) <= Date.now() + 2 * H);
    expect(soon.length).toBeGreaterThanOrEqual(2);
    // Nobody in both lists.
    const both = take.body.rows.filter((r: { reservationId: string }) =>
      pick.body.rows.some((p: { reservationId: string }) => p.reservationId === r.reservationId),
    );
    expect(both).toEqual([]);

    const rows = await poolRows(op.operator.id);
    expect(rows).toHaveLength(40);
    expect(rows.map(r => r.plate)).toEqual(Array.from({ length: 40 }, (_, i) => `TS-2${String(i + 1).padStart(2, '0')}-PZ`));
    for (const r of rows) {
      expect(r.createdAt.getTime()).toBeLessThanOrEqual(before - 7 * 24 * H + M);
      expect(r.reminderExcludedAt).not.toBeNull();
      expect(r.customerEmail).toBeNull();
      expect(r.returnFlight).toBeNull();
      expect(r.departureFlight).toBeNull();
      expect(r.channel).not.toBe('plazo');
      expect(r.customerPhone).toMatch(/^\+33 6 39 98 02 \d\d$/);
      expect(r.overbooked).toBe(false);
      if (!['cancelled'].includes(r.status)) expect(r.priceCents).toBeGreaterThan(0);
    }
    // Nobody told (OneSignal, Brevo): not a single call out.
    expect(fetchMock).not.toHaveBeenCalled();
    const audits = await prisma.auditLog.findMany({ where: { operatorId: op.operator.id, entityType: 'reservation' } });
    expect(audits.length).toBeGreaterThan(0);
    for (const a of audits) {
      expect(a.staffId).toBeNull();
      expect((a.details as { via?: string }).via).toBe('test_feed');
    }
    // The lists the driver got are the planner's mirrors.
    const now = new Date();
    for (const r of rows) {
      const listedTake = take.body.rows.some((x: { reservationId: string }) => x.reservationId === r.id);
      expect(inDepartureList(r, now)).toBe(listedTake);
      const listedPick = pick.body.rows.some((x: { reservationId: string }) => x.reservationId === r.id);
      expect(inPickupList(r, now)).toBe(listedPick);
    }
    // The planning and the day's waves read it too.
    expect((await api().get('/api/internal/planning').set(auth(op.driver.token))).status).toBe(200);
    expect((await api().get('/api/internal/shuttle/forecast').set(auth(op.driver.token))).status).toBe(200);
    const view = await api().get('/api/internal/test-feed').set(auth(op.driver.token));
    expect(view.status).toBe(200);
    expect(view.body.data).toMatchObject({ enabled: true, available: true, killSwitch: false, lastError: null, listingPublished: false, cap: 40 });
    expect(view.body.data.pool).toHaveLength(40);
    expect(view.body.data.report.counts.toTake).toBeGreaterThanOrEqual(3);
  });

  it('une fois toutes les 3 minutes au plus', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const first = await ranAt(op.operator.id);
    const rows = await poolRows(op.operator.id);
    const before = await snapshot(rows.map(r => r.id));
    feed().tried.clear();
    await departures(op.driver.token);
    expect(await ranAt(op.operator.id)).toBe(first);
    expect(await snapshot(rows.map(r => r.id))).toEqual(before);

    clockAt(new Date(Date.now() + 3 * M + 5000));
    await departures(op.driver.token);
    expect(await ranAt(op.operator.id)).not.toBe(first);
  });
});

describe('un chauffeur n’est jamais interrompu', () => {
  it('ne touche pas aux passagers pendant le trajet, ni dans les 10 minutes qui suivent sa fin', async () => {
    const op = await testOperator();
    const take = await departures(op.driver.token);
    const listed = feedRowsIn(take.body.rows) as { reservationId: string; expected: boolean; passengers: number }[];
    const expected = listed.find(r => r.expected);
    const other = listed.find(r => r !== expected);
    expect(expected).toBeDefined();
    const ids = [expected!.reservationId, other!.reservationId];
    const started = await startTrip(op.driver.token, ids, 'dropoff', op.vehicleId);
    expect(started.status).toBe(201);
    const during = await snapshot(ids);
    expect(during.map(r => r.status)).toEqual(['arrived', 'arrived']);

    // 4 minutes later: a run, and the two passengers as they were.
    let t = Date.now();
    clockAt(new Date((t += 4 * M)));
    const run1 = await ranAt(op.operator.id);
    await departures(op.driver.token);
    expect(await ranAt(op.operator.id)).not.toBe(run1);
    expect(await snapshot(ids)).toEqual(during);

    // The drop-off ends: away (« Parti en navette »), and left alone 10 minutes.
    expect((await api().post(`/api/internal/shuttle/trips/${started.body.trip.id}/end`).set(auth(op.driver.token))).status).toBe(200);
    const after = await snapshot(ids);
    expect(after.map(r => r.status)).toEqual(['shuttled_out', 'shuttled_out']);
    clockAt(new Date((t += 4 * M)));
    const run2 = await ranAt(op.operator.id);
    await pickups(op.driver.token);
    expect(await ranAt(op.operator.id)).not.toBe(run2);
    expect(await snapshot(ids)).toEqual(after);
  });

  it('un voyageur pointé par le flux pendant que le chauffeur part embarque quand même', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const parking = await prisma.parking.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // A traveller due 15 minutes ago, still expected (written long ago: the feed's to move).
    const row = (await poolRows(op.operator.id)).find(r => r.status === 'cancelled')!;
    const now = Date.now();
    await prisma.reservation.update({
      where: { id: row.id },
      data: {
        status: 'upcoming',
        cancelledAt: null,
        arrivalAt: new Date(now - 15 * M),
        returnAt: new Date(now + 30 * H),
        arrivedAt: null,
        updatedAt: new Date(now - 30 * M),
      },
    });
    const transaction = prisma.$transaction.bind(prisma);
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (fn: any, options?: any) => {
      // The feed runs between the start's checks and its transaction, and checks the traveller in.
      await feed().tick(op.operator.id, parking, new Date(), 0);
      expect((await prisma.reservation.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('arrived');
      return transaction(fn, options);
    });
    const started = await startTrip(op.driver.token, [row.id], 'dropoff', op.vehicleId);
    expect(started.status).toBe(201);
    expect(started.body.trip.passengers.map((p: { reservationId: string }) => p.reservationId)).toEqual([row.id]);
  });

  it('laisse une réservation qu’un membre vient de modifier, et ne touche jamais une autre réservation', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const parking = await prisma.parking.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    const row = (await poolRows(op.operator.id)).find(r => r.status === 'cancelled')!;
    const now = Date.now();
    await prisma.reservation.update({
      where: { id: row.id },
      data: { status: 'upcoming', cancelledAt: null, arrivalAt: new Date(now - 15 * M), returnAt: new Date(now + 30 * H), arrivedAt: null },
    });
    // A member's change (the API): the feed waits 10 minutes before checking them in.
    expect((await api().patch(`/api/internal/reservations/${row.id}`).set(auth(op.token)).send({ notes: 'Client prévenu' })).status).toBe(200);
    // A real booking, due 15 minutes ago.
    const own = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: new Date(now - 15 * M).toISOString(),
        returnAt: new Date(now + 30 * H).toISOString(),
        passengers: 2,
        customerFirstName: 'Vrai',
        customerLastName: 'Client',
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
      });
    expect(own.status).toBe(201);
    const before = await snapshot([row.id, own.body.data.id]);
    await feed().tick(op.operator.id, parking, new Date(), 0);
    expect(await snapshot([row.id, own.body.data.id])).toEqual(before);
  });
});

describe('allumer, éteindre', () => {
  it('éteint : ferme les réservations fictives sauf celles d’un trajet en cours ; rallumé : réapprovisionne', async () => {
    const op = await testOperator();
    const take = await departures(op.driver.token);
    const passenger = feedRowsIn(take.body.rows)[0] as { reservationId: string; plate: string };
    expect((await startTrip(op.driver.token, [passenger.reservationId], 'dropoff', op.vehicleId)).status).toBe(201);

    // A driver may read the switch, not turn it.
    expect((await api().put('/api/internal/test-feed').set(auth(op.driver.token)).send({ enabled: false })).status).toBe(403);
    expect((await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: 'non' })).status).toBe(400);
    const off = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: false });
    expect(off.status).toBe(200);
    expect(off.body.data.enabled).toBe(false);
    expect(off.body.data.left).toEqual([{ plate: passenger.plate, reason: 'on_trip' }]);
    const rows = await poolRows(op.operator.id);
    for (const r of rows) {
      if (r.id === passenger.reservationId) expect(r.status).toBe('arrived');
      else expect(['cancelled', 'returned']).toContain(r.status);
    }
    expect(await prisma.auditLog.count({ where: { operatorId: op.operator.id, action: 'test_feed.disabled', staffId: op.manager.id } })).toBe(1);

    // Switched off: the reads write nothing, « feed-run » is refused.
    const before = await snapshot(rows.map(r => r.id));
    clockAt(new Date(Date.now() + 4 * M));
    await departures(op.driver.token);
    expect(await snapshot(rows.map(r => r.id))).toEqual(before);
    const refused = await api().post('/api/internal/test-feed/run').set(auth(op.token));
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('test_feed_off');

    const on = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: true });
    expect(on.status).toBe(200);
    expect(on.body.data.enabled).toBe(true);
    expect(on.body.data.report.counts.toTake).toBeGreaterThanOrEqual(3);
    feed().tried.clear();
    expect(feedRowsIn((await departures(op.driver.token)).body.rows).length).toBeGreaterThanOrEqual(3);
    // « feed-run »: at once (10 seconds after the last run at least).
    clockAt(new Date(Date.now() + 15000));
    const run = await api().post('/api/internal/test-feed/run').set(auth(op.token));
    expect(run.status).toBe(200);
    expect(Date.parse(run.body.data.ranAt)).toBeGreaterThan(Date.parse(on.body.data.ranAt));
  });

  it('rallumé juste après l’avoir éteint, toutes ses plaques en jeu : du monde à emmener tout de suite', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    // As after a few hours of driving: the 40 plates in play (away for days, written long ago), none closed and free.
    const now = Date.now();
    await prisma.reservation.updateMany({
      where: { operatorId: op.operator.id, ...POOL, status: { in: ['cancelled', 'returned'] } },
      data: {
        status: 'shuttled_out',
        cancelledAt: null,
        returnedAt: null,
        arrivalAt: new Date(now - 30 * H),
        arrivedAt: new Date(now - 30 * H),
        returnAt: new Date(now + 40 * H),
        updatedAt: new Date(now - 2 * H),
      },
    });
    const off = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: false });
    expect(off.status).toBe(200);
    expect((await poolRows(op.operator.id)).every(r => ['cancelled', 'returned'].includes(r.status))).toBe(true);

    // The plates « feed-off » just closed are the feed's own: switched on a minute later, it stocks the lists at once.
    clockAt(new Date(Date.now() + M));
    const on = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: true });
    expect(on.status).toBe(200);
    expect(on.body.data.report.counts.toTake).toBeGreaterThanOrEqual(3);
    feed().tried.clear();
    expect(feedRowsIn((await departures(op.driver.token)).body.rows).length).toBeGreaterThanOrEqual(3);
  });
});

describe('la capacité du parking', () => {
  it('un parking de 10 places est trop petit : rien n’est écrit', async () => {
    const op = await testOperator({ capacity: 10 });
    await departures(op.driver.token);
    expect((await poolRows(op.operator.id)).every(r => r.status === 'cancelled')).toBe(true);
    const view = await api().get('/api/internal/test-feed').set(auth(op.token));
    expect(view.body.data).toMatchObject({ cap: 5, lastError: 'parking_too_small' });
    expect(view.body.data.report.error).toBe('parking_too_small');
  });

  it('les nuits complètes ne sont jamais dépassées', async () => {
    const op = await testOperator({ capacity: 20 });
    const now = Date.now();
    await prisma.reservation.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({
        reference: `RF${String(i).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel: 'phone' as const,
        status: 'arrived' as const,
        arrivalAt: new Date(now - 6 * 24 * H),
        returnAt: new Date(now + 8 * 24 * H),
        passengers: 1,
        customerName: 'Client Plein',
        customerPhone: '06 12 34 56 78',
        plate: `FU-${String(100 + i)}-LL`,
        plateKey: `FU${100 + i}LL`,
      })),
    });
    await departures(op.driver.token);
    expect((await poolRows(op.operator.id)).every(r => r.status === 'cancelled')).toBe(true);
    const view = await api().get('/api/internal/test-feed').set(auth(op.token));
    expect(view.body.data.report.rebooks).toEqual([]);
    expect(view.body.data.report.skipped.some((s: { reason: string }) => s.reason === 'full')).toBe(true);
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, overbooked: true } })).toBe(0);
  });
});

describe('personne n’est prévenu', () => {
  it('ni par le récapitulatif horaire, ni par le SMS de la veille', async () => {
    const op = await testOperator();
    await useBrevoSms(op.operator.id);
    await departures(op.driver.token);
    // One real booking made now: the digest counts it, and it alone.
    const now = Date.now();
    expect(
      (
        await api()
          .post('/api/internal/reservations')
          .set(auth(op.token))
          .send({
            channel: 'phone',
            arrivalAt: new Date(now + 26 * H).toISOString(),
            returnAt: new Date(now + 50 * H).toISOString(),
            passengers: 1,
            customerFirstName: 'Vrai',
            customerLastName: 'Client',
            customerPhone: '06 12 34 56 78',
            plate: 'AB-123-CD',
          })
      ).status,
    ).toBe(201);
    await prisma.staff.update({ where: { id: op.manager.id }, data: { bookingNotify: 'hourly' } });
    const notify = jest.spyOn(Container.get(PushService), 'notifyStaff');
    // At 10:00 on the parking's clock (the digest is quiet at night), an hour after the last one.
    const ten = new Date(new Date().toISOString().slice(0, 10) + 'T08:00:00Z');
    await prisma.operator.update({ where: { id: op.operator.id }, data: { bookingDigestAt: new Date(ten.getTime() - H) } });
    await prisma.reservation.updateMany({
      where: { operatorId: op.operator.id, plate: 'AB-123-CD' },
      data: { createdAt: new Date(ten.getTime() - 10 * M) },
    });
    await Container.get(BookingDigestService).run(ten);
    const digests = notify.mock.calls.filter(call => call[0] === op.operator.id && call[1] === 'bookingDigest');
    expect(digests).toHaveLength(1);
    expect(digests[0][2].title).toBe('1 réservation reçue');

    // The day-before SMS: none of the fictional travellers is even considered.
    await Container.get(ReminderService).dispatchDue(new Date());
    const fictional = await poolRows(op.operator.id);
    expect(fictional.every(r => r.reminderSentAt === null)).toBe(true);
    expect(await prisma.smsOutbox.count({ where: { reservationId: { in: fictional.map(r => r.id) } } })).toBe(0);
  });
});

describe('rien ne s’échappe d’un séjour fictif à l’autre (revue de sûreté, 15/10/2026)', () => {
  it('une plaque reprise perd son téléphone enregistré, son signal, son lien de gestion et les données personnelles de son historique', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const parking = await prisma.parking.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    const dayAgo = new Date(Date.now() - 24 * H);
    // Every plate closed a day ago, each with a phone registered by a tester, a signal « au point de rendez-vous »
    // and a member's change that put a real phone number in its history.
    await prisma.reservation.updateMany({
      where: { operatorId: op.operator.id, ...POOL },
      data: { status: 'cancelled', cancelledAt: dayAgo, returnAt: dayAgo, arrivalAt: new Date(dayAgo.getTime() - 26 * H), updatedAt: dayAgo },
    });
    await prisma.testFeed.update({ where: { operatorId: op.operator.id }, data: { state: {} } });
    const before = await poolRows(op.operator.id);
    for (const [i, r] of before.entries()) {
      await prisma.travellerDevice.create({ data: { reservationId: r.id, subscriptionId: `sub-${i}` } });
      await prisma.arrivalSignal.create({
        data: {
          reservationId: r.id,
          operatorId: op.operator.id,
          parkingId: parking.id,
          kind: 'return',
          state: 'at_meeting_point',
          note: 'Je suis devant la porte 4',
          startedAt: dayAgo,
          expiresAt: new Date(Date.now() + H),
        },
      });
      await prisma.auditLog.create({
        data: {
          operatorId: op.operator.id,
          staffId: op.manager.id,
          action: 'reservation.updated',
          entityType: 'reservation',
          entityId: r.id,
          details: { customerPhone: { from: '+33 6 39 98 02 01', to: '06 12 34 56 78' }, notes: { from: null, to: 'x' } },
        },
      });
    }

    const report = await feed().tick(op.operator.id, parking, new Date(), 0);
    expect(report?.rebooks.length).toBeGreaterThan(0);
    const after = new Map((await poolRows(op.operator.id)).map(r => [r.id, r]));
    const rebooked = before.filter(r => after.get(r.id)!.reference !== r.reference);
    const kept = before.filter(r => after.get(r.id)!.reference === r.reference);
    expect(rebooked.length).toBe(report!.rebooks.length);
    expect(kept.length).toBeGreaterThan(0);
    for (const r of rebooked) {
      expect(await prisma.travellerDevice.count({ where: { reservationId: r.id } })).toBe(0);
      expect(await prisma.arrivalSignal.count({ where: { reservationId: r.id } })).toBe(0);
      expect(after.get(r.id)!.manageTokenVersion).toBe(r.manageTokenVersion + 1);
      const history = await prisma.auditLog.findFirstOrThrow({ where: { entityId: r.id, staffId: op.manager.id } });
      expect(history.details).toEqual({ anonymized: true });
    }
    // A plate the run did not take back keeps its own (nothing is wiped beyond the rebooked ones).
    for (const r of kept) {
      expect(await prisma.travellerDevice.count({ where: { reservationId: r.id } })).toBe(1);
      expect(after.get(r.id)!.manageTokenVersion).toBe(r.manageTokenVersion);
    }
  });

  it('renommé (devenu un vrai loueur), il n’est plus approvisionné et « feed-off » ferme encore ses réservations fictives', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    await prisma.operator.update({ where: { id: op.operator.id }, data: { name: 'Parking Dupont' } });
    // The session reads the operator's name at each request.
    const token = op.token;
    const rows = await poolRows(op.operator.id);
    const before = await snapshot(rows.map(r => r.id));
    feed().tried.clear();
    clockAt(new Date(Date.now() + 4 * M));
    await departures(token);
    expect(await snapshot(rows.map(r => r.id))).toEqual(before);
    expect((await api().get('/api/internal/test-feed').set(auth(token))).body.data).toMatchObject({ available: false });
    expect((await api().put('/api/internal/test-feed').set(auth(token)).send({ enabled: true })).body.code).toBe('test_feed_unavailable');
    expect((await api().post('/api/internal/test-feed/run').set(auth(token))).body.code).toBe('test_feed_unavailable');
    const off = await api().put('/api/internal/test-feed').set(auth(token)).send({ enabled: false });
    expect(off.status).toBe(200);
    for (const r of await poolRows(op.operator.id)) expect(['cancelled', 'returned']).toContain(r.status);
  });

  it('un passage réservé avant « feed-off » n’écrit plus rien une fois le flux éteint', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const parking = await prisma.parking.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // feed-off lands between the claim of a run and its transaction.
    const off = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: false });
    expect(off.status).toBe(200);
    const rows = await poolRows(op.operator.id);
    const closed = await snapshot(rows.map(r => r.id));
    await prisma.testFeed.update({ where: { operatorId: op.operator.id }, data: { enabled: true } });
    const transaction = prisma.$transaction.bind(prisma);
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (fn: any, options?: any) => {
      await prisma.testFeed.update({ where: { operatorId: op.operator.id }, data: { enabled: false } });
      return transaction(fn, options);
    });
    clockAt(new Date(Date.now() + 4 * M));
    expect(await feed().tick(op.operator.id, parking, new Date(), 0)).toBeNull();
    expect(await snapshot(rows.map(r => r.id))).toEqual(closed);
  });

  it('« feed-on » répété ne relance pas le budget horaire, et l’historique du flux ne garde qu’une semaine', async () => {
    const op = await testOperator();
    await departures(op.driver.token);
    const first = await prisma.testFeed.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    const on = await api().put('/api/internal/test-feed').set(auth(op.token)).send({ enabled: true });
    expect(on.status).toBe(200);
    const again = await prisma.testFeed.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    // Already on: no run within 10 seconds, the arrivals' budget kept, no « switched on » entry.
    expect(again.ranAt?.toISOString()).toBe(first.ranAt?.toISOString());
    expect((again.state as { rebooks: string[] }).rebooks).toEqual((first.state as { rebooks: string[] }).rebooks);
    expect(await prisma.auditLog.count({ where: { operatorId: op.operator.id, action: 'test_feed.enabled' } })).toBe(0);

    // The feed's own entries older than 7 days go at the next run; a member's entry stays, whatever its age.
    const old = new Date(Date.now() - 8 * 24 * H);
    const [feedEntry, memberEntry, feedRecent] = await Promise.all([
      prisma.auditLog.create({
        data: {
          operatorId: op.operator.id,
          staffId: null,
          action: 'reservation.updated',
          entityType: 'reservation',
          details: { via: 'test_feed' },
          createdAt: old,
        },
      }),
      prisma.auditLog.create({
        data: {
          operatorId: op.operator.id,
          staffId: op.manager.id,
          action: 'reservation.updated',
          entityType: 'reservation',
          details: { via: 'test_feed' },
          createdAt: old,
        },
      }),
      prisma.auditLog.create({
        data: { operatorId: op.operator.id, staffId: null, action: 'reservation.updated', entityType: 'reservation', details: { via: 'test_feed' } },
      }),
    ]);
    const parking = await prisma.parking.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    clockAt(new Date(Date.now() + 4 * M));
    await feed().tick(op.operator.id, parking, new Date(), 0);
    expect(await prisma.auditLog.findUnique({ where: { id: feedEntry.id } })).toBeNull();
    expect(await prisma.auditLog.findUnique({ where: { id: memberEntry.id } })).not.toBeNull();
    expect(await prisma.auditLog.findUnique({ where: { id: feedRecent.id } })).not.toBeNull();
  });
});
