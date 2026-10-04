import { Container } from 'typedi';
import prisma from '@/database';
import { aeroDataBoxStatus, airLabsStatus, mapAeroDataBox, mapAirLabs, shouldLookupFlight } from '@/domain/flight';
import { landedPush, landedSms } from '@/domain/return-messages';
import { firstName, vehicleDescription } from '@/domain/shuttle';
import { localDateTime } from '@/domain/time';
import { ArrivalService } from '@/services/arrival.service';
import { AeroDataBoxProvider, AirLabsProvider, FlightTrackingService } from '@/services/flight-tracking.service';
import { NotificationService } from '@/services/notification.service';
import { ParkingLocationService } from '@/services/parking-location.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { IGN_ROUTING_URL, RoutingService } from '@/services/routing.service';
import { addStaff, api, publishListing, resetDatabase, setupOperator, useBrevoSms } from './utils/helpers';

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (value: string) => ({ 'x-booking-token': value });
const inDays = (days: number, time: string) => `${localDateTime(new Date(Date.now() + days * 86400000), TZ).slice(0, 10)}T${time}`;
const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60000);

const RECEPTION = { lat: 45.73, lng: 5.05 };
const MEETING = { lat: 45.7205, lng: 5.0817 };
const SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/send';

async function parkingWithReturningBooking(options: { flight?: string | null; meetingPoint?: boolean } = {}) {
  const op = await setupOperator();
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
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
      contactPhone: '04 72 00 00 00',
    });
  if (listing.status !== 200) throw new Error(JSON.stringify(listing.body));
  await publishListing(op.parking.id);
  await useBrevoSms(op.operator.id);
  await Container.get(ParkingLocationService).store(op.parking.id, RECEPTION);
  if (options.meetingPoint !== false) {
    await Container.get(ArrivalService).setReturnMeetingPoint(op.parking.id, {
      ...MEETING,
      label: 'Terminal 1 · Porte 12',
      instructions: 'Sortez de la zone bagages, suivez « Sortie / Parkings ».',
      photoUrl: 'https://example.com/point.jpg',
    });
  }
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
      returnFlight: options.flight === undefined ? 'TO 3627' : options.flight,
      acceptTerms: true,
    });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  const { reference, manageToken } = res.body as { reference: string; manageToken: string };
  // The vehicle is on site, the return is in an hour: the return day.
  const reservation = await prisma.reservation.update({
    where: { reference },
    data: { status: 'arrived', arrivedAt: minutesFromNow(-3 * 24 * 60), arrivalAt: minutesFromNow(-3 * 24 * 60), returnAt: minutesFromNow(60) },
  });
  return { op, reference, manageToken, reservation };
}

type Booking = Awaited<ReturnType<typeof parkingWithReturningBooking>>;
const getReturn = (b: Booking) => api().get(`/api/public/bookings/${b.reference}/return`).set(bookingToken(b.manageToken));
const getShuttle = (b: Booking) => api().get(`/api/public/bookings/${b.reference}/shuttle`).set(bookingToken(b.manageToken));

/** AeroDataBox writes instants as "2026-10-03 08:00Z". */
const adbUtc = (d: Date) => `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}Z`;
const adbLocal = (d: Date) => `${localDateTime(d, TZ).replace('T', ' ')}+02:00`;
/** The provider's answer; `at` is the scheduled landing (defaults to a fixed instant for the parsing tests). */
const adbLanded = (status = 'Arrived', at = new Date('2026-10-03T08:00:00Z')) => {
  const revised = new Date(at.getTime() + 2 * 60000);
  return [
    {
      number: 'TO 3627',
      status,
      departure: {
        airport: { iata: 'MRS' },
        scheduledTime: { utc: adbUtc(new Date(at.getTime() - 3600000)), local: adbLocal(new Date(at.getTime() - 3600000)) },
      },
      arrival: {
        airport: { iata: 'LYS' },
        scheduledTime: { utc: adbUtc(at), local: adbLocal(at) },
        revisedTime: { utc: adbUtc(revised), local: adbLocal(revised) },
        runwayTime: status === 'Arrived' ? { utc: adbUtc(revised), local: adbLocal(revised) } : undefined,
        terminal: '1',
        gate: '12',
      },
    },
  ];
};

let fetchMock: jest.SpyInstance;
const calls = (url: string | RegExp) => fetchMock.mock.calls.filter(([u]) => (typeof url === 'string' ? String(u) === url : url.test(String(u))));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(async () => {
  await resetDatabase();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.AERODATABOX_API_KEY;
  delete process.env.AIRLABS_API_KEY;
  delete process.env.FLIGHT_TRACKING_PROVIDER;
  Container.get(FlightTrackingService).providerOverride = null;
  Container.get(NotificationService).settings.apiKey = '';
  Container.get(RoutingService).clearCache();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => json({ ok: true }));
});
afterEach(() => fetchMock.mockRestore());
afterAll(() => prisma.$disconnect());

describe('vols (domaine)', () => {
  it('traduit les statuts AeroDataBox et AirLabs', () => {
    expect(aeroDataBoxStatus('Expected')).toBe('scheduled');
    expect(aeroDataBoxStatus('Delayed')).toBe('delayed');
    expect(aeroDataBoxStatus('Approaching')).toBe('departed');
    expect(aeroDataBoxStatus('Arrived')).toBe('landed');
    expect(aeroDataBoxStatus('Canceled')).toBe('cancelled');
    expect(aeroDataBoxStatus('Diverted')).toBe('diverted');
    expect(aeroDataBoxStatus('whatever')).toBe('unknown');
    expect(airLabsStatus('en-route')).toBe('departed');
    expect(airLabsStatus('landed')).toBe('landed');
  });

  it('lit la réponse AeroDataBox (étape vers l’aéroport de la fiche, heures, terminal, porte)', () => {
    const info = mapAeroDataBox([{ status: 'Expected', arrival: { airport: { iata: 'CDG' } } }, ...adbLanded()], 'LYS')!;
    expect(info.status).toBe('landed');
    expect(info.arrivalAirport).toBe('LYS');
    expect(info.terminal).toBe('1');
    expect(info.gate).toBe('12');
    expect(info.scheduledArrivalAt?.toISOString()).toBe('2026-10-03T08:00:00.000Z');
    expect(info.actualArrivalAt?.toISOString()).toBe('2026-10-03T08:02:00.000Z');
    expect(mapAeroDataBox([], 'LYS')).toBeNull();
    expect(mapAeroDataBox(adbLanded('Delayed'), 'LYS')!.status).toBe('delayed');
  });

  it('lit la réponse AirLabs', () => {
    const info = mapAirLabs({
      response: { status: 'landed', arr_iata: 'LYS', arr_time_utc: '2026-10-03 08:00', arr_actual_utc: '2026-10-03 08:02', arr_terminal: '1' },
    })!;
    expect(info.status).toBe('landed');
    expect(info.actualArrivalAt?.toISOString()).toBe('2026-10-03T08:02:00.000Z');
    expect(info.terminal).toBe('1');
    expect(mapAirLabs({ response: {} })).toBeNull();
    expect(mapAirLabs({ response: { status: 'scheduled', delayed: 25 } })!.status).toBe('delayed');
  });

  it('n’interroge le fournisseur que dans les 24 h, hors statut final, et pas plus d’une fois par 5 min', () => {
    const now = new Date('2026-10-03T08:00:00Z');
    const base = {
      returnFlight: 'TO 3627',
      status: 'arrived',
      returnAt: new Date('2026-10-03T10:00:00Z'),
      flightStatus: null,
      flightScheduledAt: null,
      flightEstimatedAt: null,
      flightLandedAt: null,
      flightCheckedAt: null,
    };
    expect(shouldLookupFlight(base, now)).toBe(true);
    expect(shouldLookupFlight({ ...base, returnFlight: null }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, status: 'upcoming' }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, returnAt: new Date('2026-10-05T10:00:00Z') }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, returnAt: new Date('2026-10-02T10:00:00Z') }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, flightStatus: 'landed' }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, flightCheckedAt: new Date('2026-10-03T07:57:00Z') }, now)).toBe(false);
    expect(shouldLookupFlight({ ...base, flightCheckedAt: new Date('2026-10-03T07:54:00Z') }, now)).toBe(true);
  });

  it('écrit les messages d’atterrissage', () => {
    expect(landedPush({ flight: 'TO 3627', customerName: 'Camille Martin', plate: 'AB-123-CD', source: 'tracking', landedAt: '10:02' }).body).toBe(
      'Vol TO 3627 atterri · C. Martin · AB-123-CD · 10:02',
    );
    const sms = landedSms({
      productName: 'Plazo',
      parkingName: 'Parking Démo',
      meetingLabel: 'Terminal 1 · Porte 12',
      instructions: 'Sortez côté parkings.',
      phone: null,
      manageUrl: 'https://plazo.test/ma-reservation/R1?cle=x',
    });
    expect(sms).toBe(
      'Plazo : votre vol a atterri. Rendez-vous navette : Terminal 1 · Porte 12. Sortez côté parkings. Votre reservation : https://plazo.test/ma-reservation/R1?cle=x',
    );
    expect(firstName('Karim Benali')).toBe('Karim');
    expect(vehicleDescription({ model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK' })).toBe('Navette blanche · Mercedes Vito · GH-456-JK');
  });
});

describe('fournisseurs de vols (fetch simulé)', () => {
  it('AeroDataBox via RapidAPI : en-têtes et URL', async () => {
    fetchMock.mockImplementation(async () => json(adbLanded()));
    const provider = new AeroDataBoxProvider('rapid-key', 'https://aerodatabox.p.rapidapi.com');
    const info = await provider.lookup('TO3627', '2026-10-03', 'LYS');
    expect(info?.status).toBe('landed');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'https://aerodatabox.p.rapidapi.com/flights/number/TO3627/2026-10-03?withAircraftImage=false&withLocation=false&dateLocalRole=Arrival',
    );
    expect((init as RequestInit).headers).toMatchObject({ 'x-rapidapi-key': 'rapid-key', 'x-rapidapi-host': 'aerodatabox.p.rapidapi.com' });
  });

  it('AeroDataBox via API.Market : autre hôte, autre en-tête ; 204 = vol inconnu', async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
    const provider = new AeroDataBoxProvider('market-key', 'https://prod.api.market/api/v1/aedbx/aerodatabox');
    expect(await provider.lookup('TO3627', '2026-10-03', 'LYS')).toBeNull();
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ 'x-magicapi-key': 'market-key' });
  });

  it('AirLabs : clé en paramètre, et une occurrence d’un autre jour est ignorée', async () => {
    fetchMock.mockImplementation(async () => json({ response: { status: 'landed', arr_iata: 'LYS', arr_actual_utc: '2026-10-03 08:02' } }));
    const provider = new AirLabsProvider('al-key', 'https://airlabs.co/api/v9');
    expect((await provider.lookup('TO3627', '2026-10-03', 'LYS'))?.status).toBe('landed');
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://airlabs.co/api/v9/flight?flight_iata=TO3627&api_key=al-key');
    expect(await provider.lookup('TO3627', '2026-10-10', 'LYS')).toBeNull();
  });

  it('choisit le fournisseur par FLIGHT_TRACKING_PROVIDER, sinon la clé présente (AeroDataBox si les deux)', () => {
    const service = Container.get(FlightTrackingService);
    expect(service.provider().name).toBe('none');
    process.env.AIRLABS_API_KEY = 'a';
    expect(service.provider().name).toBe('airlabs');
    process.env.AERODATABOX_API_KEY = 'b';
    expect(service.provider().name).toBe('aerodatabox');
    process.env.FLIGHT_TRACKING_PROVIDER = 'airlabs';
    expect(service.provider().name).toBe('airlabs');
  });
});

describe('GET /public/bookings/:reference/return', () => {
  it('refuse sans jeton, et décrit le jour du retour (point de rendez-vous, consignes, vol)', async () => {
    const b = await parkingWithReturningBooking();
    expect((await api().get(`/api/public/bookings/${b.reference}/return`)).status).toBe(404);
    const res = await getReturn(b);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      returnDay: true,
      flightTracked: false,
      flight: { number: 'TO 3627', status: null },
      meetingPoint: {
        source: 'return_point',
        label: 'Terminal 1 · Porte 12',
        instructions: expect.stringContaining('Sortez'),
        photoUrl: 'https://example.com/point.jpg',
      },
      atMeetingPointAt: null,
      shuttle: null,
      parking: { phone: '04 72 00 00 00' },
      plate: 'AB-123-CD',
    });
    expect(calls(/aerodatabox|airlabs/).length).toBe(0);
  });

  it('rafraîchit le vol à la lecture (cache 5 min), prévient le personnel et envoie le SMS une seule fois à l’atterrissage', async () => {
    const b = await parkingWithReturningBooking();
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    process.env.ONESIGNAL_APP_ID = 'app';
    process.env.ONESIGNAL_REST_API_KEY = 'key';
    Container.get(NotificationService).settings.apiKey = 'brevo';
    Container.get(NotificationService).settings.publicSiteUrl = 'https://plazo.test';
    const driver = await addStaff(b.op.token, 'driver');
    await api().put('/api/internal/notifications/devices').set(auth(driver.token)).send({ subscriptionId: 'sub-driver' });
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbLanded()) : json({ id: 'n1' })));

    const first = await getReturn(b);
    expect(first.body.flightTracked).toBe(true);
    expect(first.body.flight).toMatchObject({
      status: 'landed',
      landedSource: 'tracking',
      terminal: '1',
      gate: '12',
      landedAt: '2026-10-03T08:02:00.000Z',
    });
    expect(calls(/aerodatabox/).length).toBe(1);
    // Push: once, to the staff who want returns.
    const pushes = calls(ONESIGNAL_NOTIFICATIONS_URL).map(([, init]) => JSON.parse((init as RequestInit).body as string));
    expect(pushes.length).toBe(1);
    expect(pushes[0].contents.fr).toContain('Vol TO 3627 atterri · C. Martin · AB-123-CD');
    expect(pushes[0].include_subscription_ids).toEqual(['sub-driver']);
    // SMS: once, with the meeting point, the instructions and the manage link; no phone number in the logs.
    const sms = calls(SMS_URL).map(([, init]) => JSON.parse((init as RequestInit).body as string));
    expect(sms.length).toBe(1);
    expect(sms[0].recipient).toBe('33612345678');
    expect(sms[0].content).toContain('Terminal 1 · Porte 12');
    expect(sms[0].content).toContain('https://plazo.test/ma-reservation/');

    // Second read within 5 minutes, and the flight is final anyway: no lookup, no second push or SMS.
    await getReturn(b);
    await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(calls(/aerodatabox/).length).toBe(1);
    expect(calls(ONESIGNAL_NOTIFICATIONS_URL).length).toBe(1);
    expect(calls(SMS_URL).length).toBe(1);
    const audit = await prisma.auditLog.findMany({ where: { action: 'return.landed' } });
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit[0].details)).not.toMatch(/45\.7/);
  });

  it('cron : protégé par le secret, idempotent, n’interroge pas un vol déjà vu il y a moins de 5 min', async () => {
    const b = await parkingWithReturningBooking();
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    // The flight is expected in an hour (relative to today: the lookup window is ±6 h around the landing).
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbLanded('Expected', minutesFromNow(60))) : json({})));
    expect((await api().get('/api/internal/cron/track-return-flights')).status).toBe(401);
    const run1 = await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(run1.body).toEqual({ checked: 1, landed: 0, skipped: false, sms: { operators: 0, checked: 0, sent: 0, abandoned: 0 } });
    const run2 = await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(run2.body).toEqual({ checked: 0, landed: 0, skipped: false, sms: { operators: 0, checked: 0, sent: 0, abandoned: 0 } });
    expect(calls(/aerodatabox/).length).toBe(1);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: b.reservation.id } });
    expect(row.flightStatus).toBe('scheduled');
    expect(row.flightTerminal).toBe('1');
    // Past the cache: looked up again.
    await prisma.reservation.update({ where: { id: b.reservation.id }, data: { flightCheckedAt: minutesFromNow(-6) } });
    const run3 = await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'));
    expect(run3.body.checked).toBe(1);
    // Without any key: skipped.
    delete process.env.AERODATABOX_API_KEY;
    expect((await api().get('/api/internal/cron/track-return-flights').set(auth('test-cron-secret'))).body.skipped).toBe(true);
  });

  it('un fournisseur en panne ne casse pas la lecture et n’est pas martelé', async () => {
    const b = await parkingWithReturningBooking();
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json({ message: 'nope' }, 500) : json({})));
    const res = await getReturn(b);
    expect(res.status).toBe(200);
    expect(res.body.flight.status).toBeNull();
    await getReturn(b);
    expect(calls(/aerodatabox/).length).toBe(1);
  });

  it('« J’ai atterri » : atterri par le voyageur, push au personnel, pas de SMS', async () => {
    const b = await parkingWithReturningBooking({ flight: null });
    process.env.ONESIGNAL_APP_ID = 'app';
    process.env.ONESIGNAL_REST_API_KEY = 'key';
    Container.get(NotificationService).settings.apiKey = 'brevo';
    await api().put('/api/internal/notifications/devices').set(auth(b.op.token)).send({ subscriptionId: 'sub-manager' });
    const res = await api().post(`/api/public/bookings/${b.reference}/return/landed`).set(bookingToken(b.manageToken));
    expect(res.status).toBe(200);
    expect(res.body.flight).toMatchObject({ status: 'landed', landedSource: 'traveller' });
    expect(res.body.flight.landedAt).toBeTruthy();
    await api().post(`/api/public/bookings/${b.reference}/return/landed`).set(bookingToken(b.manageToken));
    expect(calls(ONESIGNAL_NOTIFICATIONS_URL).length).toBe(1);
    expect(calls(SMS_URL).length).toBe(0);
    // The tracking (later) keeps the traveller's word but adds the terminal.
    process.env.AERODATABOX_API_KEY = 'rapid-key';
    await prisma.reservation.update({
      where: { id: b.reservation.id },
      data: { returnFlight: 'TO 3627', flightStatus: 'departed', flightCheckedAt: null },
    });
    fetchMock.mockImplementation(async url => (/aerodatabox/.test(String(url)) ? json(adbLanded('Approaching')) : json({})));
    await getReturn(b);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: b.reservation.id } });
    expect(row.flightStatus).toBe('departed');
    expect(row.flightTerminal).toBe('1');
  });
});

describe('GET /public/bookings/:reference/return/route', () => {
  const ignAnswer = {
    distance: 450,
    duration: 5.4,
    geometry: {
      type: 'LineString',
      coordinates: [
        [5.08, 45.722],
        [5.081, 45.7212],
        [5.0817, 45.7205],
      ],
    },
  };

  it('calcule le chemin piéton par l’IGN depuis la position, le met en cache 3 minutes', async () => {
    const b = await parkingWithReturningBooking();
    fetchMock.mockImplementation(async url => (String(url).startsWith(IGN_ROUTING_URL) ? json(ignAnswer) : json({})));
    const res = await api().get(`/api/public/bookings/${b.reference}/return/route?lat=45.722&lng=5.08`).set(bookingToken(b.manageToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ distanceM: 450, durationMinutes: 6, fallback: false, meetingPoint: { label: 'Terminal 1 · Porte 12' } });
    expect(res.body.geometry).toEqual([
      [45.722, 5.08],
      [45.7212, 5.081],
      [45.7205, 5.0817],
    ]);
    const url = new URL(String(calls(/geopf/)[0][0]));
    expect(url.searchParams.get('profile')).toBe('pedestrian');
    expect(url.searchParams.get('resource')).toBe('bdtopo-osrm');
    expect(url.searchParams.get('start')).toBe('5.08,45.722');
    expect(url.searchParams.get('end')).toBe(`${MEETING.lng},${MEETING.lat}`);
    // A few metres further: the cached route.
    await api().get(`/api/public/bookings/${b.reference}/return/route?lat=45.72201&lng=5.08001`).set(bookingToken(b.manageToken));
    expect(calls(/geopf/).length).toBe(1);
    // Without a position: from the airport (another cache entry).
    const fromAirport = await api().get(`/api/public/bookings/${b.reference}/return/route`).set(bookingToken(b.manageToken));
    expect(fromAirport.body.from).toEqual({ lat: 45.7256, lng: 5.0811 });
    expect(calls(/geopf/).length).toBe(2);
  });

  it('se replie sur une ligne droite quand le service ne répond pas', async () => {
    const b = await parkingWithReturningBooking();
    fetchMock.mockImplementation(async url => (String(url).startsWith(IGN_ROUTING_URL) ? json({ error: 'down' }, 503) : json({})));
    const res = await api().get(`/api/public/bookings/${b.reference}/return/route?lat=45.722&lng=5.08`).set(bookingToken(b.manageToken));
    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    expect(res.body.geometry).toHaveLength(2);
    expect(res.body.distanceM).toBeGreaterThan(100);
    expect(res.body.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe('navette (mode chauffeur)', () => {
  const start = (token: string, ids: string[], extra: Record<string, unknown> = {}) =>
    api()
      .post('/api/internal/shuttle/trips')
      .set(auth(token))
      .send({ reservationIds: ids, ...extra });
  const position = (token: string, id: string, lat = 45.74, lng = 5.06, extra: Record<string, unknown> = {}) =>
    api()
      .post(`/api/internal/shuttle/trips/${id}/position`)
      .set(auth(token))
      .send({ lat, lng, accuracy: 8, recordedAt: new Date().toISOString(), ...extra });

  it('véhicules : le gérant les gère, le chauffeur les lit', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    const other = await setupOperator('Autre');
    expect((await api().post('/api/internal/shuttle/vehicles').set(auth(driver.token)).send({ model: 'Vito' })).status).toBe(403);
    expect((await api().post('/api/internal/shuttle/vehicles').set(auth(b.op.token)).send({ model: '' })).status).toBe(400);
    const created = await api()
      .post('/api/internal/shuttle/vehicles')
      .set(auth(b.op.token))
      .send({ model: 'Mercedes Vito', colour: 'blanche', plate: 'gh-456-jk' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK' });
    const list = await api().get('/api/internal/shuttle/vehicles').set(auth(driver.token));
    expect(list.body.data).toHaveLength(1);
    expect((await api().get('/api/internal/shuttle/vehicles').set(auth(other.token))).body.data).toHaveLength(0);
    expect((await api().delete(`/api/internal/shuttle/vehicles/${created.body.data.id}`).set(auth(other.token))).status).toBe(404);
    expect((await api().delete(`/api/internal/shuttle/vehicles/${created.body.data.id}`).set(auth(b.op.token))).status).toBe(204);
  });

  it('liste les retours à récupérer, triés : au point de rendez-vous, atterris, puis par heure', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    await api().post(`/api/public/bookings/${b.reference}/arrival/at-meeting-point`).set(bookingToken(b.manageToken)).send({ kind: 'return' });
    const res = await api().get('/api/internal/shuttle/pickups').set(auth(driver.token));
    expect(res.status).toBe(200);
    expect(res.body.meetingPoint).toMatchObject({ label: 'Terminal 1 · Porte 12' });
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0]).toMatchObject({
      reference: b.reference,
      customerName: 'Camille Martin',
      passengers: 2,
      terminal: 'Terminal 1 · Porte 12',
      tripId: null,
    });
    expect(res.body.rows[0].atMeetingPointAt).toBeTruthy();
    // Another operator sees nothing of it.
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/shuttle/pickups').set(auth(other.token))).body.rows).toHaveLength(0);
  });

  it('démarre un trajet, partage la position avec ses passagers seulement, le termine et efface la position', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    // A second booking of the same parking, not on the trip.
    const second = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${b.op.parking.id}`,
        arrivalAt: inDays(5, '06:30'),
        returnAt: inDays(7, '15:05'),
        customerName: 'Léa Durand',
        customerPhone: '06 98 76 54 32',
        customerEmail: `lea${b.op.parking.id}@example.com`,
        plate: 'gh456jk',
        passengers: 1,
        acceptTerms: true,
      });
    const secondRow = await prisma.reservation.update({
      where: { reference: second.body.reference },
      data: { status: 'arrived', arrivalAt: minutesFromNow(-3 * 24 * 60), returnAt: minutesFromNow(90) },
    });

    // Validation and scoping.
    expect((await start(driver.token, [])).status).toBe(400);
    expect((await start(driver.token, ['nope'])).status).toBe(422);
    const other = await setupOperator('Autre');
    expect((await start(other.token, [b.reservation.id])).status).toBe(422);
    expect((await api().get('/api/internal/shuttle/trips/current').set(auth(driver.token))).body.trip).toBeNull();

    const started = await start(driver.token, [b.reservation.id], { vehicle: { model: 'Mercedes Vito', colour: 'blanche', plate: 'gh-456-jk' } });
    expect(started.status).toBe(201);
    const trip = started.body.trip;
    expect(trip).toMatchObject({
      status: 'running',
      driverName: driver.session.user.name,
      vehicle: { model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK' },
    });
    expect(trip.passengers).toHaveLength(1);
    expect(trip.passengers[0]).toMatchObject({ reservationId: b.reservation.id, customerName: 'Camille Martin', terminal: 'Terminal 1 · Porte 12' });
    expect(trip.secondsLeft).toBeLessThanOrEqual(90 * 60);
    expect(trip).not.toHaveProperty('lat');
    // One trip per driver; a traveller cannot be on two trips.
    expect((await start(driver.token, [secondRow.id])).body.code).toBe('trip_already_running');
    const driver2 = await addStaff(b.op.token, 'driver');
    expect((await start(driver2.token, [b.reservation.id])).body.code).toBe('already_on_trip');

    // Before any position: the passenger sees the shuttle, without position; the other booking sees nothing.
    const before = await getShuttle(b);
    expect(before.body.shuttle).toMatchObject({
      tripId: trip.id,
      driverFirstName: driver.session.user.name.split(' ')[0],
      position: null,
      etaMinutes: null,
    });
    const secondToken = second.body.manageToken;
    expect((await api().get(`/api/public/bookings/${second.body.reference}/shuttle`).set(bookingToken(secondToken))).body.shuttle).toBeNull();

    // Positions: the driver only, one per 10 s, never a history.
    expect((await position(driver2.token, trip.id)).status).toBe(404);
    expect((await position(driver.token, trip.id, 45.74, 5.06, { recordedAt: new Date(Date.now() - 10 * 60000).toISOString() })).body.code).toBe(
      'position_too_old',
    );
    expect((await position(driver.token, trip.id)).status).toBe(200);
    const tooSoon = await position(driver.token, trip.id, 45.741, 5.061);
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe('too_many_positions');
    const live = await getShuttle(b);
    expect(live.body.shuttle.position).toEqual({ lat: 45.74, lng: 5.06 });
    expect(live.body.shuttle.etaMinutes).toBeGreaterThanOrEqual(1);
    expect(live.body.shuttle.etaAt).toBeTruthy();
    expect(live.body.shuttle.positionAgeSeconds).toBeLessThan(5);
    // The planning and the live list say "Navette en route (driver)".
    const planning = await api().get('/api/internal/planning').set(auth(b.op.token));
    const row = planning.body.returns.find((r: { id: string }) => r.id === b.reservation.id);
    expect(row.shuttleTrip).toMatchObject({ id: trip.id, driverName: driver.session.user.name });
    expect(planning.body.returns.find((r: { id: string }) => r.id === secondRow.id).shuttleTrip).toBeNull();
    const liveList = await api().get('/api/internal/arrivals/live').set(auth(b.op.token));
    expect(liveList.body.shuttleTrips).toEqual([expect.objectContaining({ id: trip.id, reservationIds: [b.reservation.id] })]);
    expect((await api().get('/api/internal/shuttle/pickups').set(auth(driver.token))).body.rows[0].tripId).toBe(trip.id);

    // End: the position is erased at once, the traveller sees no shuttle, the audit has no coordinates.
    expect((await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(driver2.token))).status).toBe(403);
    const ended = await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(driver.token));
    expect(ended.body.trip).toMatchObject({ status: 'ended', endReason: 'completed', secondsLeft: 0, positionUpdatedAt: null });
    const stored = await prisma.shuttleTrip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(stored.lat).toBeNull();
    expect(stored.lng).toBeNull();
    expect(stored.positionRecordedAt).toBeNull();
    expect((await getShuttle(b)).body.shuttle).toBeNull();
    expect((await position(driver.token, trip.id)).body.code).toBe('trip_not_running');
    const audit = await prisma.auditLog.findMany({ where: { entityId: trip.id } });
    expect(audit.map(a => a.action).sort()).toEqual(['shuttle.trip_ended', 'shuttle.trip_started']);
    expect(JSON.stringify(audit.map(a => a.details))).not.toMatch(/45\.74|5\.06/);
  });

  it('s’arrête tout seul au bout de 90 minutes, position effacée (à la lecture et par le cron)', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    const started = await start(driver.token, [b.reservation.id], { vehicle: { model: 'Vito' } });
    const trip = started.body.trip;
    expect((await position(driver.token, trip.id)).status).toBe(200);
    await prisma.shuttleTrip.update({ where: { id: trip.id }, data: { startedAt: minutesFromNow(-95), expiresAt: minutesFromNow(-5) } });
    // The traveller's read ends it.
    expect((await getShuttle(b)).body.shuttle).toBeNull();
    const stored = await prisma.shuttleTrip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(stored).toMatchObject({ status: 'ended', endReason: 'expired', lat: null, lng: null });
    expect((await api().get('/api/internal/shuttle/trips/current').set(auth(driver.token))).body.trip).toBeNull();
    // The cron is the safety net (nothing left here).
    const cron = await api().get('/api/internal/cron/purge-expired-tokens').set(auth('test-cron-secret'));
    expect(cron.body.shuttleTripsEnded).toBe(0);
    // A manager may also pick a vehicle on file and close a forgotten trip.
    const vehicle = await api().post('/api/internal/shuttle/vehicles').set(auth(b.op.token)).send({ model: 'Renault Trafic', colour: 'grise' });
    const again = await start(driver.token, [b.reservation.id], { vehicleId: vehicle.body.data.id });
    expect(again.body.trip.vehicle).toMatchObject({ model: 'Renault Trafic', colour: 'grise' });
    expect((await api().post(`/api/internal/shuttle/trips/${again.body.trip.id}/end`).set(auth(b.op.token))).body.trip.status).toBe('ended');
  });

  it('fiche véhicule : places, en service, chauffeur habituel (V-A), modifiable', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    const other = await setupOperator('Autre');
    const bad = await api().post('/api/internal/shuttle/vehicles').set(auth(b.op.token)).send({ model: 'Vito', seats: 0 });
    expect(bad.status).toBe(400);
    expect(bad.body.fields.seats).toBe('invalid_seats');
    // The usual driver must be one of the team.
    const foreign = await api().post('/api/internal/shuttle/vehicles').set(auth(b.op.token)).send({ model: 'Vito', driverId: other.manager.id });
    expect(foreign.status).toBe(400);
    expect(foreign.body.fields).toEqual({ driverId: 'invalid_driver' });
    const created = await api()
      .post('/api/internal/shuttle/vehicles')
      .set(auth(b.op.token))
      .send({ model: 'Mercedes Vito', colour: 'blanche', plate: 'gh-456-jk', seats: 8, driverId: driver.id });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ seats: 8, inService: true, driverId: driver.id, driverName: driver.session.user.name });
    const id = created.body.data.id;
    expect((await api().patch(`/api/internal/shuttle/vehicles/${id}`).set(auth(driver.token)).send({ seats: 4 })).status).toBe(403);
    expect((await api().patch(`/api/internal/shuttle/vehicles/${id}`).set(auth(other.token)).send({ seats: 4 })).status).toBe(404);
    const updated = await api()
      .patch(`/api/internal/shuttle/vehicles/${id}`)
      .set(auth(b.op.token))
      .send({ seats: 4, inService: false, driverId: null });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ model: 'Mercedes Vito', seats: 4, inService: false, driverId: null, driverName: null });
    const list = await api().get('/api/internal/shuttle/vehicles').set(auth(driver.token));
    expect(list.body.data).toEqual([expect.objectContaining({ id, seats: 4, inService: false })]);
    // Out of service: not for a trip. Too few seats: refused too.
    expect((await start(driver.token, [b.reservation.id], { vehicleId: id })).body.code).toBe('vehicle_out_of_service');
    await api().patch(`/api/internal/shuttle/vehicles/${id}`).set(auth(b.op.token)).send({ inService: true, seats: 1 });
    const tooMany = await start(driver.token, [b.reservation.id], { vehicleId: id });
    expect(tooMany.status).toBe(422);
    expect(tooMany.body).toMatchObject({ code: 'too_many_passengers', details: { seats: 1, passengers: 2 } });
    await api().patch(`/api/internal/shuttle/vehicles/${id}`).set(auth(b.op.token)).send({ seats: 2 });
    expect((await start(driver.token, [b.reservation.id], { vehicleId: id })).status).toBe(201);
  });

  it('trajet vers le terminal (T-A) : les arrivés du jour, départ, fin = « Parti en navette »', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    // A traveller who just left their vehicle (arrival today, return in two days).
    const arriving = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${b.op.parking.id}`,
        arrivalAt: inDays(5, '06:30'),
        returnAt: inDays(7, '15:05'),
        customerName: 'Léa Durand',
        customerPhone: '06 98 76 54 32',
        customerEmail: `lea${b.op.parking.id}@example.com`,
        plate: 'gh456jk',
        passengers: 1,
        acceptTerms: true,
      });
    const row = await prisma.reservation.update({
      where: { reference: arriving.body.reference },
      data: { status: 'arrived', arrivedAt: minutesFromNow(-10), arrivalAt: minutesFromNow(-20), returnAt: minutesFromNow(2 * 24 * 60) },
    });
    const departures = await api().get('/api/internal/shuttle/departures').set(auth(driver.token));
    expect(departures.status).toBe(200);
    // The returning traveller (arrived three days ago) is not waiting for the terminal.
    expect(departures.body.rows).toEqual([
      expect.objectContaining({ reservationId: row.id, customerName: 'Léa Durand', passengers: 1, tripId: null }),
    ]);
    // Only arrived travellers board a drop-off.
    await prisma.reservation.update({ where: { id: b.reservation.id }, data: { status: 'shuttled_out' } });
    expect((await start(driver.token, [b.reservation.id], { direction: 'dropoff' })).body.code).toBe('invalid_passengers');
    expect((await start(driver.token, [row.id], { direction: 'sideways' })).status).toBe(400);
    const started = await start(driver.token, [row.id], { direction: 'dropoff', vehicle: { model: 'Vito' } });
    expect(started.status).toBe(201);
    expect(started.body.trip).toMatchObject({ direction: 'dropoff', status: 'running' });
    expect((await api().get('/api/internal/shuttle/departures').set(auth(driver.token))).body.rows[0].tripId).toBe(started.body.trip.id);
    // The pick-up card of the traveller's return is not this trip.
    expect(
      (await api().get(`/api/public/bookings/${arriving.body.reference}/shuttle`).set(bookingToken(arriving.body.manageToken))).body.shuttle,
    ).toBeNull();
    const ended = await api().post(`/api/internal/shuttle/trips/${started.body.trip.id}/end`).set(auth(driver.token));
    expect(ended.body.trip.status).toBe('ended');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('shuttled_out');
    expect((await api().get('/api/internal/shuttle/departures').set(auth(driver.token))).body.rows).toHaveLength(0);
  });

  it('navette en direct le jour J (S-A) : les navettes du parking, du jour d’arrivée au jour du retour', async () => {
    const b = await parkingWithReturningBooking();
    const driver = await addStaff(b.op.token, 'driver');
    const shuttles = (reference: string, token: string) => api().get(`/api/public/bookings/${reference}/shuttles`).set(bookingToken(token));
    // Nothing running: the return day still shows the block, empty.
    const quiet = await shuttles(b.reference, b.manageToken);
    expect(quiet.status).toBe(200);
    expect(quiet.body).toMatchObject({ phase: 'return', shuttles: [] });
    // Arrived today: the arrival day; upcoming in five days: nothing.
    const today = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${b.op.parking.id}`,
        arrivalAt: inDays(5, '06:30'),
        returnAt: inDays(7, '15:05'),
        customerName: 'Léa Durand',
        customerPhone: '06 98 76 54 32',
        customerEmail: `lea${b.op.parking.id}@example.com`,
        plate: 'gh456jk',
        passengers: 1,
        acceptTerms: true,
      });
    await prisma.reservation.update({
      where: { reference: today.body.reference },
      data: { status: 'arrived', arrivedAt: minutesFromNow(-10), arrivalAt: minutesFromNow(-20), returnAt: minutesFromNow(2 * 24 * 60) },
    });
    const later = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${b.op.parking.id}`,
        arrivalAt: inDays(5, '06:30'),
        returnAt: inDays(7, '15:05'),
        customerName: 'Noa Petit',
        customerPhone: '06 11 22 33 44',
        customerEmail: `noa${b.op.parking.id}@example.com`,
        plate: 'ab123cd',
        passengers: 1,
        acceptTerms: true,
      });
    expect((await shuttles(later.body.reference, later.body.manageToken)).body).toMatchObject({ phase: null, shuttles: [] });

    const started = await start(driver.token, [b.reservation.id], { vehicle: { model: 'Vito', colour: 'blanche' } });
    const trip = started.body.trip;
    await position(driver.token, trip.id, 45.735, 5.055);
    // The returning traveller: their own trip, measured to the meeting point.
    const mine = await shuttles(b.reference, b.manageToken);
    expect(mine.body.phase).toBe('return');
    expect(mine.body.shuttles).toHaveLength(1);
    expect(mine.body.shuttles[0]).toMatchObject({
      tripId: trip.id,
      direction: 'pickup',
      mine: true,
      driverFirstName: driver.session.user.name.split(' ')[0],
      vehicle: { model: 'Vito', colour: 'blanche' },
      position: { lat: 45.735, lng: 5.055 },
      destination: { kind: 'meeting_point', label: 'Terminal 1 · Porte 12' },
    });
    expect(mine.body.shuttles[0].etaMinutes).toBeGreaterThanOrEqual(1);
    // The traveller arrived today sees the same shuttle, not theirs, measured to the parking.
    const theirs = await shuttles(today.body.reference, today.body.manageToken);
    expect(theirs.body.phase).toBe('arrival');
    expect(theirs.body.shuttles[0]).toMatchObject({
      tripId: trip.id,
      mine: false,
      destination: { kind: 'parking', lat: RECEPTION.lat, lng: RECEPTION.lng },
    });
    expect(theirs.body.shuttles[0].distanceM).toBeGreaterThan(100);
    // Another parking's traveller never sees it.
    expect((await shuttles(b.reference, 'wrong-token')).status).toBe(404);
    await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(driver.token));
    expect((await shuttles(b.reference, b.manageToken)).body.shuttles).toHaveLength(0);
  });

  it('le point de rendez-vous du retour garde consignes et photo', async () => {
    const b = await parkingWithReturningBooking({ meetingPoint: false });
    const bad = await api()
      .put('/api/internal/parking/return-meeting-point')
      .set(auth(b.op.token))
      .send({ ...MEETING, label: 'T1', instructions: 'x'.repeat(501) });
    expect(bad.status).toBe(400);
    expect(bad.body.fields.instructions).toBe('too_long');
    expect(
      (
        await api()
          .put('/api/internal/parking/return-meeting-point')
          .set(auth(b.op.token))
          .send({ ...MEETING, photoUrl: 'not a url' })
      ).status,
    ).toBe(400);
    const ok = await api()
      .put('/api/internal/parking/return-meeting-point')
      .set(auth(b.op.token))
      .send({ ...MEETING, label: 'Terminal 1 · Porte 12', instructions: 'Porte 12, traversez.', photoUrl: 'https://example.com/p.jpg' });
    expect(ok.body.data).toMatchObject({
      label: 'Terminal 1 · Porte 12',
      instructions: 'Porte 12, traversez.',
      photoUrl: 'https://example.com/p.jpg',
    });
    const read = await api().get('/api/internal/parking/return-meeting-point').set(auth(b.op.token));
    expect(read.body.data.instructions).toBe('Porte 12, traversez.');
    expect((await getReturn(b)).body.meetingPoint).toMatchObject({ instructions: 'Porte 12, traversez.', photoUrl: 'https://example.com/p.jpg' });
  });
});
