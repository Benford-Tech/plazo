import { Container } from 'typedi';
import prisma from '@/database';
import { mapAeroDataBox, shouldLookupDeparture } from '@/domain/flight';
import { buildWaves, dropoffTimes, pickupTimes, WaveMember } from '@/domain/shuttle-waves';
import { localDateTime } from '@/domain/time';
import { FlightTrackingService } from '@/services/flight-tracking.service';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/** Shuttle waves (V-A "Ligne du jour" + F-A tracked outbound flight, 05/10/2026). */

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const TIMES = { shuttleTravelMinutes: 10, terminalLeadMinutes: 120, landingDelayMinutes: 30 };
const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60000);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const adbUtc = (d: Date) => `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}Z`;
const adbLocal = (d: Date) => `${localDateTime(d, TZ).replace('T', ' ')}+02:00`;
const adbTime = (d: Date) => ({ utc: adbUtc(d), local: adbLocal(d) });

/** An outbound leg LYS -> MRS: scheduled at `at`, revised `delay` minutes later. */
const adbDeparture = (at: Date, status = 'Expected', delay = 0) => [
  {
    number: 'AF 7641',
    status,
    departure: {
      airport: { iata: 'LYS' },
      scheduledTime: adbTime(at),
      ...(delay ? { revisedTime: adbTime(new Date(at.getTime() + delay * 60000)) } : {}),
      terminal: '2',
    },
    arrival: { airport: { iata: 'MRS' }, scheduledTime: adbTime(new Date(at.getTime() + 3600000)) },
  },
];

const member = (over: Partial<WaveMember> & { leaveAt: string }): WaveMember => ({
  reservationId: over.leaveAt,
  reference: 'REF',
  customerName: 'X',
  passengers: 2,
  plate: 'AA-123-AA',
  status: 'arrived',
  direction: 'dropoff',
  stopId: null,
  stopName: null,
  meetAt: null,
  flight: null,
  noFlight: false,
  state: 'planned',
  tripId: null,
  ...over,
});

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.AERODATABOX_API_KEY;
  delete process.env.FLIGHT_TRACKING_PROVIDER;
  Container.get(FlightTrackingService).providerOverride = null;
  Container.get(NotificationService).settings.apiKey = '';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => json({}));
});
afterEach(() => fetchMock.mockRestore());
afterAll(() => prisma.$disconnect());

describe('vagues (domaine)', () => {
  it('place la navette aller avant le décollage, sinon à l’arrivée du client', () => {
    const takeOff = new Date('2026-10-06T06:00:00Z');
    const withFlight = dropoffTimes(
      {
        arrivalAt: new Date('2026-10-06T03:00:00Z'),
        arrivedAt: null,
        departureScheduledAt: takeOff,
        departureEstimatedAt: null,
        departureStatus: 'scheduled',
      },
      TIMES,
    );
    expect(withFlight).toEqual({ leaveAt: new Date('2026-10-06T03:50:00Z'), noFlight: false });
    const revised = dropoffTimes(
      {
        arrivalAt: new Date('2026-10-06T03:00:00Z'),
        arrivedAt: null,
        departureScheduledAt: takeOff,
        departureEstimatedAt: new Date('2026-10-06T06:30:00Z'),
        departureStatus: 'delayed',
      },
      TIMES,
    );
    expect(revised.leaveAt.toISOString()).toBe('2026-10-06T04:20:00.000Z');
    const none = dropoffTimes(
      {
        arrivalAt: new Date('2026-10-06T03:00:00Z'),
        arrivedAt: new Date('2026-10-06T03:05:00Z'),
        departureScheduledAt: null,
        departureEstimatedAt: null,
        departureStatus: null,
      },
      TIMES,
    );
    expect(none).toEqual({ leaveAt: new Date('2026-10-06T03:05:00Z'), noFlight: true });
    // A cancelled outbound flight: back to the booking's own time.
    expect(
      dropoffTimes(
        { ...none, arrivedAt: null, departureScheduledAt: takeOff, departureEstimatedAt: null, departureStatus: 'cancelled' } as any,
        TIMES,
      ).noFlight,
    ).toBe(true);
  });

  it('place la navette retour après l’atterrissage, sinon à l’heure de retour saisie', () => {
    const landing = new Date('2026-10-06T08:00:00Z');
    const tracked = pickupTimes(
      {
        returnAt: new Date('2026-10-06T09:00:00Z'),
        flightLandedAt: null,
        flightEstimatedAt: landing,
        flightScheduledAt: null,
        flightStatus: 'departed',
      },
      TIMES,
    );
    expect(tracked).toEqual({ leaveAt: new Date('2026-10-06T08:20:00Z'), meetAt: new Date('2026-10-06T08:30:00Z'), noFlight: false });
    const none = pickupTimes(
      { returnAt: new Date('2026-10-06T09:00:00Z'), flightLandedAt: null, flightEstimatedAt: null, flightScheduledAt: null, flightStatus: null },
      TIMES,
    );
    expect(none).toEqual({ leaveAt: new Date('2026-10-06T08:50:00Z'), meetAt: new Date('2026-10-06T09:00:00Z'), noFlight: true });
  });

  it('regroupe par fenêtre de 15 min, sens et desserte, et compte les navettes nécessaires', () => {
    const waves = buildWaves(
      [
        member({
          leaveAt: '2026-10-06T04:00:00.000Z',
          passengers: 3,
          flight: { number: 'AF 7641', status: null, scheduledAt: null, estimatedAt: null, actualAt: null, terminal: null },
        }),
        member({
          leaveAt: '2026-10-06T04:10:00.000Z',
          passengers: 4,
          flight: { number: 'AF 7641', status: null, scheduledAt: null, estimatedAt: null, actualAt: null, terminal: null },
        }),
        member({ leaveAt: '2026-10-06T04:14:00.000Z', passengers: 4, noFlight: true }),
        member({ leaveAt: '2026-10-06T04:16:00.000Z', passengers: 1 }), // past the window of the first
        member({ leaveAt: '2026-10-06T04:05:00.000Z', passengers: 2, stopId: 'gare', stopName: 'Gare TGV' }), // another stop
        member({ leaveAt: '2026-10-06T03:30:00.000Z', passengers: 2, direction: 'pickup', meetAt: '2026-10-06T03:40:00.000Z', state: 'done' }),
      ],
      8,
    );
    expect(waves.map(w => [w.direction, w.stopId, w.leaveAt.slice(11, 16), w.passengers, w.vehiclesNeeded, w.state])).toEqual([
      ['pickup', null, '03:30', 2, 1, 'done'],
      ['dropoff', null, '04:00', 11, 2, 'planned'],
      ['dropoff', 'gare', '04:05', 2, 1, 'planned'],
      ['dropoff', null, '04:16', 1, 1, 'planned'],
    ]);
    expect(waves[1].flights).toEqual(['AF 7641']);
    expect(waves[1].noFlight).toBe(1);
    // Unknown seats: no vehicle count.
    expect(buildWaves([member({ leaveAt: '2026-10-06T04:00:00.000Z' })], null)[0].vehiclesNeeded).toBeNull();
  });

  it('interroge le vol aller dans les 24 h avant le décollage, tant qu’il n’est pas parti', () => {
    const base = {
      departureFlight: 'AF 7641',
      status: 'upcoming',
      arrivalAt: minutesFromNow(120),
      departureStatus: null,
      departureScheduledAt: null,
      departureEstimatedAt: null,
      departureCheckedAt: null,
    };
    expect(shouldLookupDeparture(base)).toBe(true);
    expect(shouldLookupDeparture({ ...base, departureFlight: null })).toBe(false);
    expect(shouldLookupDeparture({ ...base, status: 'shuttled_out' })).toBe(false);
    expect(shouldLookupDeparture({ ...base, departureStatus: 'departed' })).toBe(false);
    expect(shouldLookupDeparture({ ...base, departureScheduledAt: minutesFromNow(25 * 60) })).toBe(false);
    expect(shouldLookupDeparture({ ...base, departureScheduledAt: minutesFromNow(-3 * 60) })).toBe(false);
    expect(shouldLookupDeparture({ ...base, departureCheckedAt: minutesFromNow(-2) })).toBe(false);
  });

  it('lit le tronçon au départ de l’aéroport chez AeroDataBox', () => {
    const at = new Date('2026-10-06T06:00:00Z');
    const info = mapAeroDataBox(
      [{ status: 'Expected', departure: { airport: { iata: 'CDG' } }, arrival: { airport: { iata: 'LYS' } } }, ...adbDeparture(at, 'Delayed', 20)],
      'LYS',
      'departure',
    )!;
    expect(info.departureAirport).toBe('LYS');
    expect(info.status).toBe('delayed');
    expect(info.scheduledDepartureAt).toEqual(at);
    expect(info.estimatedDepartureAt).toEqual(new Date('2026-10-06T06:20:00Z'));
    expect(info.departureTerminal).toBe('2');
  });
});

describe('GET /internal/shuttle/forecast', () => {
  it('suit le vol aller, forme les vagues, signale le dépassement et nourrit le tableau de bord', async () => {
    const op = await setupOperator();
    const token = op.token;
    await api().patch(`/api/internal/parkings/${op.parking.id}`).set(auth(token)).send({
      name: 'Parking LYS',
      totalCapacity: 200,
      safetyMarginPct: 0,
      shuttleTravelMinutes: 10,
      terminalLeadMinutes: 90,
      landingDelayMinutes: 20,
    });
    const settings = await api().get('/api/internal/parking').set(auth(token));
    expect(settings.body.data ?? settings.body).toMatchObject({ terminalLeadMinutes: 90, landingDelayMinutes: 20 });
    await api().post('/api/internal/shuttle/vehicles').set(auth(token)).send({ model: 'Vito', seats: 8 });

    // Three travellers arriving today for the same flight (take-off in 3 h): 11 passengers.
    const takeOff = minutesFromNow(180);
    const arrival = localDateTime(minutesFromNow(30), TZ);
    const ret = localDateTime(minutesFromNow(3 * 24 * 60), TZ);
    for (const [name, passengers, flight] of [
      ['Martin', 4, 'af7641'],
      ['Dupont', 4, 'AF 7641'],
      ['Nguyen', 3, undefined],
    ] as const) {
      const res = await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send({
          channel: 'phone',
          arrivalAt: arrival,
          returnAt: ret,
          passengers,
          customerName: name,
          customerPhone: '06 12 34 56 78',
          plate: `aa${passengers}${name.length}aa`.slice(0, 7),
          departureFlight: flight,
        });
      expect(res.status).toBe(201);
      if (flight) expect(res.body.data.departureFlight).toBe('AF 7641');
    }
    expect(
      (
        await api().post('/api/internal/reservations').set(auth(token)).send({
          channel: 'phone',
          arrivalAt: arrival,
          returnAt: ret,
          passengers: 1,
          customerName: 'Bad',
          customerPhone: '06 12 34 56 78',
          plate: 'bb123bb',
          departureFlight: 'not a flight',
        })
      ).body.fields,
    ).toEqual({ departureFlight: 'invalid_flight' });

    process.env.AERODATABOX_API_KEY = 'rapid-key';
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbDeparture(takeOff, 'Delayed', 30)) : json({})));

    const res = await api().get('/api/internal/shuttle/forecast').set(auth(token));
    expect(res.status).toBe(200);
    // The two tracked bookings were looked up (role Departure), the one without a flight was not.
    const lookups = fetchMock.mock.calls.filter(([u]) => /aerodatabox/.test(String(u)));
    expect(lookups.length).toBe(2);
    expect(String(lookups[0][0])).toContain('dateLocalRole=Departure');
    expect(res.body.times).toEqual({ shuttleTravelMinutes: 10, terminalLeadMinutes: 90, landingDelayMinutes: 20 });
    expect(res.body.seats).toBe(8);
    // The tracked travellers leave 100 min before the revised take-off; the untracked one at their arrival (30 min from now): two waves.
    const waves = res.body.waves as any[];
    expect(waves.length).toBe(2);
    const [early, tracked] = waves;
    expect(early.noFlight).toBe(1);
    expect(early.passengers).toBe(3);
    expect(tracked.flights).toEqual(['AF 7641']);
    expect(tracked.passengers).toBe(8);
    expect(tracked.vehiclesNeeded).toBe(1);
    const expectedLeave = new Date(takeOff.getTime() + 30 * 60000 - 100 * 60000);
    expect(Math.abs(new Date(tracked.leaveAt).getTime() - expectedLeave.getTime())).toBeLessThan(60000);
    expect(tracked.members[0].flight).toMatchObject({ number: 'AF 7641', status: 'delayed', terminal: '2' });

    // The dashboard: the outbound delay, the next wave; a smaller vehicle makes the wave overflow.
    await prisma.shuttleVehicle.updateMany({ where: { operatorId: op.operator.id }, data: { seats: 6 } });
    const dash = await api().get('/api/internal/dashboard').set(auth(token));
    expect(dash.status).toBe(200);
    expect(dash.body.nextWave).toMatchObject({ direction: 'dropoff', passengers: 3 });
    const kinds = (dash.body.alerts as { kind: string; detail: string | null; minutes: number | null }[]).map(a => a.kind);
    expect(kinds.filter(k => k === 'departure_delayed').length).toBe(2);
    expect(kinds).toContain('wave_overflow');
    // No second lookup within the cache.
    expect(fetchMock.mock.calls.filter(([u]) => /aerodatabox/.test(String(u))).length).toBe(2);

    // Another day: nothing.
    const empty = await api().get('/api/internal/shuttle/forecast?date=2030-01-01').set(auth(token));
    expect(empty.body.waves).toEqual([]);
    expect(empty.body.date).toBe('2030-01-01');
  });

  it('cron : les vols aller du jour sont rafraîchis avec les retours', async () => {
    const op = await setupOperator();
    const arrival = localDateTime(minutesFromNow(30), TZ);
    await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: arrival,
        returnAt: localDateTime(minutesFromNow(2 * 24 * 60), TZ),
        passengers: 2,
        customerName: 'Martin',
        customerPhone: '06 12 34 56 78',
        plate: 'cc123cc',
        departureFlight: 'AF 7641',
      });
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbDeparture(minutesFromNow(150), 'Departed')) : json({})));
    const run = await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(run.body.departures).toBe(1);
    const row = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(row.departureStatus).toBe('departed');
    expect(row.departureTerminal).toBe('2');
    // Final: not asked again.
    const again = await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(again.body.departures).toBe(0);
  });
});

describe('GET /internal/flights/check', () => {
  it('montre la réponse du fournisseur, ou son erreur, pour un vol donné', async () => {
    const op = await setupOperator();
    expect((await api().get('/api/internal/flights/check?flight=AF7641').set(auth(op.token))).body.outcome).toBe('not_configured');
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbDeparture(new Date('2026-10-06T06:00:00Z'))) : json({})));
    const found = await api().get('/api/internal/flights/check?flight=af7641&date=2026-10-06&role=departure').set(auth(op.token));
    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({
      provider: 'aerodatabox',
      host: 'aerodatabox.p.rapidapi.com',
      flight: 'AF7641',
      outcome: 'found',
      role: 'departure',
    });
    expect(found.body.info.departureTerminal).toBe('2');
    fetchMock.mockImplementation(async () => json({ message: 'You are not subscribed to this API.' }, 403));
    const refused = await api().get('/api/internal/flights/check?flight=AF7641&date=2026-10-06').set(auth(op.token));
    expect(refused.body).toMatchObject({ outcome: 'error', error: 'AeroDataBox answered 403' });
    expect((await api().get('/api/internal/flights/check?flight=zz').set(auth(op.token))).status).toBe(400);
  });
});
