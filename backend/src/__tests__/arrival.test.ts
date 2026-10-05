import { Container } from 'typedi';
import prisma from '@/database';
import { arrivalWindows, canSignal, crossesSoonThreshold, currentMoment, haversineMeters, shortName, straightLineEstimate } from '@/domain/arrival';
import { arrivalPush } from '@/domain/arrival-messages';
import { localDateTime } from '@/domain/time';
import { ParkingLocationService } from '@/services/parking-location.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { addStaff, api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (value: string) => ({ 'x-booking-token': value });
const inDays = (days: number, time: string) => `${localDateTime(new Date(Date.now() + days * 86400000), TZ).slice(0, 10)}T${time}`;
const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60000);

// The parking's reception, and points at known distances north of it (1° of latitude ≈ 111.2 km).
const RECEPTION = { lat: 45.73, lng: 5.05 };
const north = (km: number) => ({ lat: RECEPTION.lat + km / 111.195, lng: RECEPTION.lng });
const at = (point: { lat: number; lng: number }, extra: Record<string, unknown> = {}) => ({
  ...point,
  accuracy: 12,
  recordedAt: new Date().toISOString(),
  ...extra,
});

async function parkingWithBooking() {
  const op = await setupOperator();
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({
      tiers: [
        { days: 1, priceCents: 1500 },
        { days: 7, priceCents: 5900 },
      ],
      extraDayPriceCents: 600,
    });
  const listing = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: `parking-${op.parking.id}`,
      title: 'Parking Démo LYS',
      services: ['shuttle'],
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  if (listing.status !== 200) throw new Error(JSON.stringify(listing.body));
  await publishListing(op.parking.id);
  await Container.get(ParkingLocationService).store(op.parking.id, RECEPTION);
  const res = await api()
    .post('/api/public/bookings')
    .send({
      airport: 'lyon-saint-exupery',
      parking: `parking-${op.parking.id}`,
      arrivalAt: inDays(5, '06:30'),
      returnAt: inDays(7, '15:05'),
      customerName: 'Camille Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: `camille${op.parking.id}@example.com`,
      plate: 'ab123cd',
      passengers: 2,
      acceptTerms: true,
    });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  const { reference, manageToken } = res.body as { reference: string; manageToken: string };
  // The drop-off is in an hour: the arrival block is open.
  const reservation = await prisma.reservation.update({
    where: { reference },
    data: { arrivalAt: minutesFromNow(60), returnAt: minutesFromNow((3 * 86400 * 1000) / 60000) },
  });
  return { op, reference, manageToken, reservation };
}

type Booking = Awaited<ReturnType<typeof parkingWithBooking>>;
const arrival = (b: Booking, path = '') => `/api/public/bookings/${b.reference}/arrival${path}`;
const start = (b: Booking, kind = 'outbound') => api().post(arrival(b, '/start')).set(bookingToken(b.manageToken)).send({ kind, consent: true });
const sendPosition = (b: Booking, body: Record<string, unknown>) => api().post(arrival(b, '/position')).set(bookingToken(b.manageToken)).send(body);
const signalRows = (b: Booking) => prisma.arrivalSignal.findMany({ where: { reservationId: b.reservation.id } });
/** Lets the next position through the 10 s limit. */
const waitTenSeconds = (b: Booking) =>
  prisma.arrivalSignal.updateMany({ where: { reservationId: b.reservation.id }, data: { positionReceivedAt: new Date(Date.now() - 11000) } });

let fetchMock: jest.SpyInstance;
const pushCalls = () => fetchMock.mock.calls.filter(([url]) => String(url) === ONESIGNAL_NOTIFICATIONS_URL);
const pushBodies = () => pushCalls().map(([, init]) => JSON.parse((init as RequestInit).body as string));

beforeEach(async () => {
  await resetDatabase();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => fetchMock.mockRestore());
afterAll(() => prisma.$disconnect());

describe('règles (domaine)', () => {
  it('estime à vol d’oiseau à 40 km/h, jamais moins d’une minute', () => {
    expect(haversineMeters(RECEPTION, north(10))).toBeGreaterThan(9990);
    expect(haversineMeters(RECEPTION, north(10))).toBeLessThan(10010);
    expect(straightLineEstimate(north(8.4), RECEPTION)).toEqual({ distanceM: expect.any(Number), etaMinutes: 13 });
    expect(straightLineEstimate(north(20), RECEPTION).etaMinutes).toBe(30);
    expect(straightLineEstimate(north(0.05), RECEPTION).etaMinutes).toBe(1);
    expect(straightLineEstimate(RECEPTION, RECEPTION)).toEqual({ distanceM: 0, etaMinutes: 1 });
  });

  it('franchit le seuil des 10 minutes une seule fois', () => {
    expect(crossesSoonThreshold(13, 10)).toBe(true);
    expect(crossesSoonThreshold(null, 8)).toBe(true);
    expect(crossesSoonThreshold(10, 9)).toBe(false);
    expect(crossesSoonThreshold(13, 11)).toBe(false);
    expect(crossesSoonThreshold(13, null)).toBe(false);
  });

  it('ouvre l’aller 2 h avant le dépôt et le retour une fois le véhicule sur place', () => {
    const now = new Date('2026-10-03T06:00:00Z');
    const booking = { status: 'upcoming' as const, arrivalAt: new Date('2026-10-03T07:30:00Z'), returnAt: new Date('2026-10-10T15:00:00Z') };
    expect(canSignal('outbound', booking, now)).toBe(true);
    expect(canSignal('outbound', booking, new Date('2026-10-03T05:29:00Z'))).toBe(false);
    expect(canSignal('outbound', booking, new Date('2026-10-03T09:31:00Z'))).toBe(false);
    expect(canSignal('return', booking, new Date('2026-10-10T14:00:00Z'))).toBe(false);
    expect(canSignal('return', { ...booking, status: 'shuttled_out' }, new Date('2026-10-10T14:00:00Z'))).toBe(true);
    expect(currentMoment(booking, new Date('2026-10-02T06:00:00Z'))).toMatchObject({ kind: 'outbound', open: false });
    expect(currentMoment({ ...booking, status: 'arrived' }, now)).toMatchObject({ kind: 'return', open: false });
    expect(arrivalWindows(booking).return.closesAt.toISOString()).toBe('2026-10-10T21:00:00.000Z');
  });

  it('écrit des notifications courtes, avec le nom abrégé', () => {
    expect(shortName('Camille Martin')).toBe('C. Martin');
    expect(shortName('Jean de La Fontaine')).toBe('J. de La Fontaine');
    const base = {
      kind: 'outbound' as const,
      customerName: 'Camille Martin',
      plate: 'AB-123-CD',
      parkingName: 'Parking Démo LYS',
      meetingLabel: null,
    };
    expect(arrivalPush({ ...base, event: 'started', etaMinutes: 12 }).body).toBe('C. Martin arrive dans 12 min · AB-123-CD · Parking Démo LYS');
    expect(arrivalPush({ ...base, event: 'announced', etaMinutes: 20 }).body).toBe("C. Martin : « J'arrive dans 20 min » · AB-123-CD");
    expect(arrivalPush({ ...base, kind: 'return', event: 'at_meeting_point', etaMinutes: 0, meetingLabel: 'Terminal 1' }).body).toBe(
      'Retour : C. Martin est au point de rendez-vous · Terminal 1 · AB-123-CD',
    );
  });
});

describe('voyageur : accès par le lien de gestion', () => {
  it('refuse un jeton absent ou faux, ouvre le bloc avec le bon', async () => {
    const b = await parkingWithBooking();
    expect((await api().get(arrival(b))).status).toBe(404);
    const wrong = await api()
      .get(arrival(b))
      .set(bookingToken('x'.repeat(32)));
    expect(wrong.status).toBe(404);
    expect(wrong.body.code).toBe('not_found');
    expect(
      (
        await api()
          .post(arrival(b, '/start'))
          .set(bookingToken('x'.repeat(32)))
          .send({ kind: 'outbound', consent: true })
      ).status,
    ).toBe(404);

    const res = await api().get(arrival(b)).set(bookingToken(b.manageToken));
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({
      reference: b.reference,
      moment: { kind: 'outbound', open: true },
      meetingPoint: { lat: RECEPTION.lat, lng: RECEPTION.lng, source: 'parking', label: null },
      signal: null,
      rules: { maxMinutes: 120, arrivedWithinMeters: 150, positionIntervalSeconds: 10, announceMinutes: [10, 20, 30] },
    });
  });

  it('exige le consentement explicite avant tout partage', async () => {
    const b = await parkingWithBooking();
    for (const body of [{ kind: 'outbound' }, { kind: 'outbound', consent: false }, { kind: 'outbound', consent: 'true' }]) {
      const res = await api().post(arrival(b, '/start')).set(bookingToken(b.manageToken)).send(body);
      expect(res.status).toBe(400);
      expect(res.body.fields).toEqual({ consent: 'consent_required' });
    }
    expect(await signalRows(b)).toHaveLength(0);
    // Nothing to post a position to without a started sharing.
    expect((await sendPosition(b, at(north(5)))).body.code).toBe('not_sharing');
  });

  it('refuse hors de la fenêtre (plus de 2 h avant le dépôt)', async () => {
    const b = await parkingWithBooking();
    await prisma.reservation.update({ where: { id: b.reservation.id }, data: { arrivalAt: minutesFromNow(3 * 60) } });
    const res = await start(b);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('arrival_window_closed');
    const state = await api().get(arrival(b)).set(bookingToken(b.manageToken));
    expect(state.body.moment).toMatchObject({ kind: 'outbound', open: false });
  });
});

describe('voyageur : partage de position', () => {
  it('ne garde que la dernière position, au plus une toutes les 10 s, et calcule l’ETA', async () => {
    const b = await parkingWithBooking();
    const started = await start(b);
    expect(started.status).toBe(200);
    expect(started.body.signal).toMatchObject({ kind: 'outbound', state: 'sharing', etaMinutes: null });
    expect(started.body.signal.secondsLeft).toBeGreaterThan(7190);
    // Starting again while sharing changes nothing.
    expect((await start(b)).body.signal.startedAt).toBe(started.body.signal.startedAt);

    const first = await sendPosition(b, at(north(8.4)));
    expect(first.status).toBe(200);
    expect(first.body.signal).toMatchObject({ state: 'sharing', etaMinutes: 13 });
    expect(first.body.signal.distanceM).toBeGreaterThan(8350);
    // The traveller never gets coordinates back.
    expect(JSON.stringify(first.body.signal)).not.toMatch(/"lat"|"lng"/);

    const tooSoon = await sendPosition(b, at(north(8)));
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe('too_many_positions');
    expect(tooSoon.body.details.retryAfterSeconds).toBeGreaterThan(0);

    await waitTenSeconds(b);
    const second = await sendPosition(b, at(north(5)));
    expect(second.status).toBe(200);
    expect(second.body.signal.etaMinutes).toBe(8);

    // No history: one row, holding the latest position only.
    const rows = await signalRows(b);
    expect(rows).toHaveLength(1);
    expect(rows[0].lat).toBeCloseTo(north(5).lat, 6);
    expect(rows[0].accuracyM).toBe(12);
  });

  it('valide la position (bornes, date)', async () => {
    const b = await parkingWithBooking();
    await start(b);
    expect((await sendPosition(b, at({ lat: 91, lng: 5 }))).body.fields).toEqual({ lat: 'invalid_lat' });
    expect((await sendPosition(b, { lat: 45, lng: 5 })).body.fields).toEqual({ recordedAt: 'required' });
    const old = await sendPosition(b, at(north(3), { recordedAt: new Date(Date.now() - 10 * 60000).toISOString() }));
    expect(old.body.code).toBe('position_too_old');
    const future = await sendPosition(b, at(north(3), { recordedAt: new Date(Date.now() + 10 * 60000).toISOString() }));
    expect(future.body.code).toBe('invalid_recorded_at');
  });

  it('s’arrête tout seul à moins de 150 m du point de rendez-vous et efface la position', async () => {
    const b = await parkingWithBooking();
    await start(b);
    await sendPosition(b, at(north(2)));
    await waitTenSeconds(b);
    const res = await sendPosition(b, at(north(0.12)));
    expect(res.status).toBe(200);
    expect(res.body.signal).toMatchObject({ state: 'at_meeting_point', etaMinutes: 0 });
    expect(res.body.signal.atMeetingPointAt).not.toBeNull();
    const [row] = await signalRows(b);
    expect(row).toMatchObject({ state: 'at_meeting_point', lat: null, lng: null, accuracyM: null, positionRecordedAt: null });

    await waitTenSeconds(b);
    const after = await sendPosition(b, at(north(1)));
    expect(after.status).toBe(409);
    expect(after.body.code).toBe('not_sharing');
  });

  it('s’arrête au bout de 2 h : position effacée à la lecture, journal sans coordonnées', async () => {
    const b = await parkingWithBooking();
    await start(b);
    await sendPosition(b, at(north(6)));
    await prisma.arrivalSignal.updateMany({
      where: { reservationId: b.reservation.id },
      data: { startedAt: minutesFromNow(-121), expiresAt: minutesFromNow(-1) },
    });

    const res = await api().get(arrival(b)).set(bookingToken(b.manageToken));
    expect(res.body.signal).toMatchObject({ state: 'ended', endReason: 'expired', secondsLeft: 0, etaMinutes: null, distanceM: null });
    const [row] = await signalRows(b);
    expect(row).toMatchObject({ state: 'ended', lat: null, lng: null, accuracyM: null, positionRecordedAt: null });
    expect((await sendPosition(b, at(north(5)))).body.code).toBe('not_sharing');

    const audit = await prisma.auditLog.findMany({ where: { entityId: b.reservation.id, action: { startsWith: 'arrival.' } } });
    expect(audit.map(a => a.action)).toEqual(['arrival.sharing_started', 'arrival.ended']);
    expect(JSON.stringify(audit.map(a => a.details))).not.toMatch(/lat|lng|45\.7/);
  });

  it('le cron termine aussi les partages expirés', async () => {
    const b = await parkingWithBooking();
    await start(b);
    await sendPosition(b, at(north(6)));
    await prisma.arrivalSignal.updateMany({
      where: { reservationId: b.reservation.id },
      data: { startedAt: minutesFromNow(-121), expiresAt: minutesFromNow(-1) },
    });
    const res = await api().get('/api/internal/cron/expire-arrival-signals').set(auth('test-cron-secret'));
    expect(res.body).toEqual({ ended: 1, tripsEnded: 0 });
    expect((await signalRows(b))[0].lat).toBeNull();
  });

  it('« Arrêter le partage » efface la position aussitôt', async () => {
    const b = await parkingWithBooking();
    await start(b);
    await sendPosition(b, at(north(6)));
    const res = await api().post(arrival(b, '/stop')).set(bookingToken(b.manageToken)).send({});
    expect(res.body.signal).toMatchObject({ state: 'ended', endReason: 'stopped' });
    expect((await signalRows(b))[0]).toMatchObject({ lat: null, lng: null, distanceM: null });
  });

  it('se clôt quand le personnel enregistre le dépôt', async () => {
    const b = await parkingWithBooking();
    await start(b);
    await sendPosition(b, at(north(6)));
    await prisma.reservation.update({ where: { id: b.reservation.id }, data: { status: 'arrived' } });
    const live = await api().get('/api/internal/arrivals/live').set(auth(b.op.token));
    expect(live.body.signals).toEqual([]);
    expect((await signalRows(b))[0]).toMatchObject({ state: 'ended', endReason: 'closed', lat: null });
  });
});

describe('voyageur : sans partage, et retour', () => {
  it('« J’arrive dans 20 min » sans position', async () => {
    const b = await parkingWithBooking();
    expect((await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 15 })).status).toBe(400);
    await start(b);
    await sendPosition(b, at(north(6)));
    const res = await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 20 });
    expect(res.status).toBe(200);
    expect(res.body.signal).toMatchObject({ state: 'announced', announcedMinutes: 20, etaMinutes: 20 });
    // Announcing stops the sharing: its position is gone.
    expect((await signalRows(b))[0]).toMatchObject({ lat: null, state: 'announced' });
  });

  it('au retour, « Je suis au point de rendez-vous » met la réservation en attente de navette', async () => {
    const b = await parkingWithBooking();
    await prisma.reservation.update({
      where: { id: b.reservation.id },
      data: { status: 'shuttled_out', arrivalAt: minutesFromNow((-3 * 86400000) / 60000), returnAt: minutesFromNow(30) },
    });
    const state = await api().get(arrival(b)).set(bookingToken(b.manageToken));
    // No return point set: the airport is the meeting point.
    expect(state.body).toMatchObject({ moment: { kind: 'return', open: true }, meetingPoint: { source: 'airport', label: 'Lyon Saint-Exupéry' } });

    const res = await api()
      .post(arrival(b, '/at-meeting-point'))
      .set(bookingToken(b.manageToken))
      .send({ kind: 'return', lat: 45.7256, lng: 5.0811 });
    expect(res.status).toBe(200);
    expect(res.body.signal).toMatchObject({ kind: 'return', state: 'at_meeting_point' });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: b.reservation.id } })).status).toBe('return_requested');
    expect((await signalRows(b))[0]).toMatchObject({ lat: null, lng: null });

    const live = await api().get('/api/internal/arrivals/live').set(auth(b.op.token));
    expect(live.body.signals).toEqual([expect.objectContaining({ kind: 'return', state: 'at_meeting_point', plate: 'AB-123-CD', position: null })]);
  });

  it('utilise le point de rendez-vous retour du loueur quand il est défini', async () => {
    const b = await parkingWithBooking();
    const driver = await addStaff(b.op.token, 'driver');
    expect((await api().put('/api/internal/parking/return-meeting-point').set(auth(driver.token)).send({ lat: 45.72, lng: 5.08 })).status).toBe(403);
    const set = await api()
      .put('/api/internal/parking/return-meeting-point')
      .set(auth(b.op.token))
      .send({ lat: 45.7214, lng: 5.0782, label: 'Terminal 1 · P5' });
    expect(set.body.data).toEqual({ lat: 45.7214, lng: 5.0782, label: 'Terminal 1 · P5', instructions: null, photoUrl: null });
    await prisma.reservation.update({ where: { id: b.reservation.id }, data: { status: 'arrived', returnAt: minutesFromNow(60) } });
    const state = await api().get(arrival(b)).set(bookingToken(b.manageToken));
    expect(state.body.meetingPoint).toEqual({
      lat: 45.7214,
      lng: 5.0782,
      source: 'return_point',
      label: 'Terminal 1 · P5',
      instructions: null,
      photoUrl: null,
    });
  });
});

describe('personnel : signaux en direct', () => {
  it('ne montre que les signaux de son propre loueur, avec la position et l’ETA', async () => {
    const b = await parkingWithBooking();
    const other = await setupOperator('Autre');
    await start(b);
    await sendPosition(b, at(north(8.4)));

    const own = await api().get('/api/internal/arrivals/live').set(auth(b.op.token));
    expect(own.status).toBe(200);
    expect(own.body.signals).toHaveLength(1);
    expect(own.body.signals[0]).toMatchObject({
      reference: b.reference,
      kind: 'outbound',
      state: 'sharing',
      customerName: 'Camille Martin',
      plate: 'AB-123-CD',
      etaMinutes: 13,
      meetingPoint: { source: 'parking' },
    });
    expect(own.body.signals[0].position.lat).toBeCloseTo(north(8.4).lat, 6);
    expect(own.body.signals[0].positionAgeSeconds).toBeLessThan(5);

    expect((await api().get('/api/internal/arrivals/live').set(auth(other.token))).body.signals).toEqual([]);
    expect((await api().get('/api/internal/arrivals/live')).status).toBe(401);

    const planning = await api().get('/api/internal/planning').set(auth(b.op.token));
    const row = planning.body.arrivals.find((r: { id: string }) => r.id === b.reservation.id);
    expect(row.arrivalSignal).toMatchObject({ state: 'sharing', etaMinutes: 13 });
    const otherPlanning = await api().get('/api/internal/planning').set(auth(other.token));
    expect(otherPlanning.body.arrivals).toEqual([]);
  });
});

describe('personnel : notifications push', () => {
  async function withDevices(b: Booking) {
    process.env.ONESIGNAL_APP_ID = 'app-1';
    process.env.ONESIGNAL_REST_API_KEY = 'rest-key';
    const reg = await api()
      .put('/api/internal/notifications/devices')
      .set(auth(b.op.token))
      .send({ subscriptionId: 'sub-manager', platform: 'android' });
    expect(reg.status).toBe(200);
    expect(reg.body.preferences).toEqual({ arrivals: true, returns: true, shuttles: true, devices: 1 });
  }

  it('prévient au départ, au seuil des 10 min et à l’arrivée, sans répéter', async () => {
    const b = await parkingWithBooking();
    await withDevices(b);
    const other = await setupOperator('Autre');
    await api().put('/api/internal/notifications/devices').set(auth(other.token)).send({ subscriptionId: 'sub-other' });

    await start(b);
    expect(pushCalls()).toHaveLength(0); // no estimate yet
    await sendPosition(b, at(north(8.4))); // 13 min: "arrive dans 13 min"
    await waitTenSeconds(b);
    await sendPosition(b, at(north(8))); // 12 min: nothing new
    await waitTenSeconds(b);
    await sendPosition(b, at(north(6))); // 9 min: crosses 10 min
    await waitTenSeconds(b);
    await sendPosition(b, at(north(4))); // 6 min: nothing new
    await waitTenSeconds(b);
    await sendPosition(b, at(north(0.1))); // arrived

    const bodies = pushBodies();
    expect(bodies.map(p => p.contents.fr)).toEqual([
      'C. Martin arrive dans 13 min · AB-123-CD · Parking Test LYS',
      'C. Martin arrive dans 9 min · AB-123-CD · Parking Test LYS',
      "C. Martin est à l'accueil · AB-123-CD · Parking Test LYS",
    ]);
    for (const body of bodies) {
      expect(body).toMatchObject({ app_id: 'app-1', target_channel: 'push', include_subscription_ids: ['sub-manager'] });
      expect(JSON.stringify(body.data)).not.toMatch(/lat|lng/);
    }
    expect((pushCalls()[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Key rest-key' });

    // Stopping and starting again right away does not repeat the first push.
    await api().post(arrival(b, '/stop')).set(bookingToken(b.manageToken)).send({});
    await start(b);
    await sendPosition(b, at(north(8.4)));
    expect(pushCalls()).toHaveLength(3);
  });

  it('respecte les préférences (arrivées / retours) et ne fait rien sans clés OneSignal', async () => {
    const b = await parkingWithBooking();
    await withDevices(b);
    expect((await api().patch('/api/internal/notifications/preferences').set(auth(b.op.token)).send({ arrivals: false })).body).toEqual({
      arrivals: false,
      returns: true,
      shuttles: true,
      devices: 1,
    });
    await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 20 });
    expect(pushCalls()).toHaveLength(0);

    await api().patch('/api/internal/notifications/preferences').set(auth(b.op.token)).send({ arrivals: true });
    delete process.env.ONESIGNAL_REST_API_KEY;
    await prisma.arrivalSignal.updateMany({ data: { notifiedStartAt: null } });
    await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 10 });
    expect(pushCalls()).toHaveLength(0);

    process.env.ONESIGNAL_REST_API_KEY = 'rest-key';
    await prisma.arrivalSignal.updateMany({ data: { notifiedStartAt: null } });
    await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 30 });
    expect(pushBodies().map(p => p.contents.fr)).toEqual(["C. Martin : « J'arrive dans 30 min » · AB-123-CD"]);
  });

  it('un échec de OneSignal ne fait pas échouer le voyageur', async () => {
    const b = await parkingWithBooking();
    await withDevices(b);
    fetchMock.mockImplementation(async () => {
      throw new Error('network down');
    });
    const res = await api().post(arrival(b, '/announce')).set(bookingToken(b.manageToken)).send({ kind: 'outbound', minutes: 10 });
    expect(res.status).toBe(200);
  });

  it('un téléphone n’appartient qu’à une personne, qui peut le retirer', async () => {
    const b = await parkingWithBooking();
    const agent = await addStaff(b.op.token, 'agent');
    await api().put('/api/internal/notifications/devices').set(auth(b.op.token)).send({ subscriptionId: 'sub-1' });
    await api().put('/api/internal/notifications/devices').set(auth(agent.token)).send({ subscriptionId: 'sub-1', platform: 'ios' });
    expect(await prisma.staffDevice.findMany()).toEqual([expect.objectContaining({ subscriptionId: 'sub-1', staffId: agent.id, platform: 'ios' })]);
    // Someone else's phone cannot be removed.
    await api().delete('/api/internal/notifications/devices/sub-1').set(auth(b.op.token));
    expect(await prisma.staffDevice.count()).toBe(1);
    expect((await api().delete('/api/internal/notifications/devices/sub-1').set(auth(agent.token))).status).toBe(204);
    expect(await prisma.staffDevice.count()).toBe(0);
  });
});
