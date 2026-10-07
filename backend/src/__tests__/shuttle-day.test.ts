import { Container } from 'typedi';
import prisma from '@/database';
import { ArrivalService } from '@/services/arrival.service';
import { NotificationService } from '@/services/notification.service';
import { ParkingLocationService } from '@/services/parking-location.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import {
  addStaff,
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
  shareShuttlesWithTravellers,
} from './utils/helpers';

/** Shuttle, 05/10/2026: the vehicle of the day (V-A), the stops (D-A), the live map (P-A), the pushes (N-A). */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const RECEPTION = { lat: 45.73, lng: 5.05 };
const MEETING = { lat: 45.7205, lng: 5.0817 };
const STATION = { lat: 45.7209, lng: 5.0756 };
const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60000);

let fetchMock: jest.SpyInstance;
const pushes = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL)
    .map(
      ([, init]) =>
        JSON.parse((init as RequestInit).body as string) as {
          app_id: string;
          headings: { fr: string };
          contents: { fr: string };
          include_subscription_ids: string[];
        },
    );

beforeEach(async () => {
  await resetDatabase();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.ONESIGNAL_TRAVELLER_APP_ID;
  delete process.env.ONESIGNAL_TRAVELLER_REST_API_KEY;
  Container.get(NotificationService).settings.apiKey = '';
  stripe = enableFakePayments();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  disableFakePayments();
});
let stripe: ReturnType<typeof enableFakePayments>;
afterAll(() => prisma.$disconnect());

/** An operator with a published listing, its meeting point and a traveller on site returning in an hour. */
async function setup() {
  const op = await setupOperator();
  await onboardOperator(op.operator.id);
  await shareShuttlesWithTravellers(op.token, op.parking.id);
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
  await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: `parking-${op.parking.id}`,
      title: 'Parking LYS',
      services: ['shuttle'],
      cancellationPolicy: 'free_24h',
      photos: [],
      contactPhone: '04 72 00 00 00',
    });
  await publishListing(op.parking.id);
  await Container.get(ParkingLocationService).store(op.parking.id, RECEPTION);
  await Container.get(ArrivalService).setReturnMeetingPoint(op.parking.id, {
    ...MEETING,
    label: 'Terminal 1 · Porte 12',
    instructions: null,
    photoUrl: null,
  });
  const res = await api()
    .post('/api/public/bookings')
    .send({
      airport: 'lyon-saint-exupery',
      parking: `parking-${op.parking.id}`,
      arrivalAt: '2027-03-01T06:30',
      returnAt: '2027-03-03T15:05',
      customerName: 'Camille Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: `camille${op.parking.id}@example.com`,
      plate: 'ab123cd',
      passengers: 2,
      acceptTerms: true,
    });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
  const reservation = await prisma.reservation.update({
    where: { reference: res.body.reference },
    data: { status: 'arrived', arrivedAt: minutesFromNow(-3 * 24 * 60), arrivalAt: minutesFromNow(-3 * 24 * 60), returnAt: minutesFromNow(60) },
  });
  return { op, reference: res.body.reference as string, manageToken: res.body.manageToken as string, reservation };
}

describe('véhicule du jour (V-A)', () => {
  it('le chauffeur prend un véhicule en service et libre ; l’équipe le voit ; un autre poste le rend', async () => {
    const { op } = await setup();
    const karim = await addStaff(op.token, 'driver');
    const lea = await addStaff(op.token, 'driver');
    const vito = (await api().post('/api/internal/shuttle/vehicles').set(auth(op.token)).send({ model: 'Mercedes Vito', colour: 'blanc', seats: 8 }))
      .body.data;
    const garage = (await api().post('/api/internal/shuttle/vehicles').set(auth(op.token)).send({ model: 'Trafic', inService: false })).body.data;

    expect((await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: 'nope' })).status).toBe(404);
    expect((await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: garage.id })).body.code).toBe(
      'vehicle_out_of_service',
    );
    const taken = await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: vito.id });
    expect(taken.status).toBe(200);
    expect(taken.body.vehicle).toMatchObject({ id: vito.id, model: 'Mercedes Vito', colour: 'blanc', seats: 8 });
    expect((await api().get('/api/internal/staff/me').set(auth(karim.token))).body.vehicle.id).toBe(vito.id);

    // Taken: Léa cannot have it, and the vehicles list says who holds it.
    const refused = await api().patch('/api/internal/staff/me/vehicle').set(auth(lea.token)).send({ vehicleId: vito.id });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'vehicle_taken', details: { holderId: karim.id } });
    const list = await api().get('/api/internal/shuttle/vehicles').set(auth(lea.token));
    expect(list.body.data.find((v: { id: string }) => v.id === vito.id)).toMatchObject({ holderId: karim.id, holderName: karim.session.user.name });
    const team = await api().get('/api/internal/staff').set(auth(op.token));
    expect(team.body.find((m: { id: string }) => m.id === karim.id).vehicle).toMatchObject({ id: vito.id });

    // A trip started without a vehicle takes the one of the day.
    const b = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    const trip = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(karim.token))
      .send({ reservationIds: [b.id] });
    expect(trip.status).toBe(201);
    expect(trip.body.trip.vehicle).toMatchObject({ model: 'Mercedes Vito', colour: 'blanc' });
    await api().post(`/api/internal/shuttle/trips/${trip.body.trip.id}/end`).set(auth(karim.token));

    // Yesterday's holding does not count; another post hands the vehicle back.
    await prisma.staff.update({ where: { id: karim.id }, data: { vehicleSetAt: minutesFromNow(-26 * 60) } });
    expect((await api().get('/api/internal/staff/me').set(auth(karim.token))).body.vehicle).toBeNull();
    expect((await api().patch('/api/internal/staff/me/vehicle').set(auth(lea.token)).send({ vehicleId: vito.id })).status).toBe(200);
    const asValet = await api().patch('/api/internal/staff/me/post').set(auth(lea.token)).send({ post: 'valet' });
    expect(asValet.body.vehicle).toBeNull();
    expect((await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: vito.id })).status).toBe(200);
    expect((await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: null })).body.vehicle).toBeNull();
  });
});

describe('dessertes (D-A)', () => {
  it('l’aéroport est la desserte intégrée ; le gérant ajoute une gare ; une réservation et un trajet la prennent', async () => {
    const { op, reservation, reference, manageToken } = await setup();
    const driver = await addStaff(op.token, 'driver');
    const stops0 = await api().get('/api/internal/shuttle/stops').set(auth(driver.token));
    expect(stops0.body.data).toEqual([
      expect.objectContaining({ id: null, kind: 'airport', name: 'Terminal 1 · Porte 12', builtIn: true, lat: MEETING.lat }),
    ]);

    expect(
      (
        await api()
          .post('/api/internal/shuttle/stops')
          .set(auth(driver.token))
          .send({ name: 'Gare', ...STATION })
      ).status,
    ).toBe(403);
    expect(
      (
        await api()
          .post('/api/internal/shuttle/stops')
          .set(auth(op.token))
          .send({ name: '', ...STATION })
      ).status,
    ).toBe(400);
    const station = (
      await api()
        .post('/api/internal/shuttle/stops')
        .set(auth(op.token))
        .send({ kind: 'station', name: 'Gare Saint-Exupéry TGV', ...STATION, instructions: 'Dépose-minute, côté parvis.' })
    ).body.data;
    expect(station).toMatchObject({ kind: 'station', name: 'Gare Saint-Exupéry TGV', builtIn: false, instructions: 'Dépose-minute, côté parvis.' });
    const stops = await api().get('/api/internal/shuttle/stops').set(auth(driver.token));
    expect(stops.body.data.map((s: { name: string }) => s.name)).toEqual(['Terminal 1 · Porte 12', 'Gare Saint-Exupéry TGV']);
    // Another operator, without a meeting point nor a listing: no stop at all.
    expect(
      (
        await api()
          .get('/api/internal/shuttle/stops')
          .set(auth((await setupOperator('Autre')).token))
      ).body.data,
    ).toHaveLength(0);

    // The booking is served at the station: the driver's list says so.
    expect((await api().patch(`/api/internal/reservations/${reservation.id}`).set(auth(op.token)).send({ stopId: 'nope' })).status).toBe(400);
    const updated = await api().patch(`/api/internal/reservations/${reservation.id}`).set(auth(op.token)).send({ stopId: station.id });
    expect(updated.status).toBe(200);
    expect((await api().get(`/api/internal/reservations/${reservation.id}`).set(auth(op.token))).body.stop).toMatchObject({
      id: station.id,
      name: 'Gare Saint-Exupéry TGV',
    });
    const pickups = await api().get('/api/internal/shuttle/pickups').set(auth(driver.token));
    expect(pickups.body.rows[0]).toMatchObject({ stopId: station.id, stopName: 'Gare Saint-Exupéry TGV', terminal: 'Gare Saint-Exupéry TGV' });

    // The trip goes to the station: the staff's trip and the traveller's block are measured to it.
    expect(
      (
        await api()
          .post('/api/internal/shuttle/trips')
          .set(auth(driver.token))
          .send({ reservationIds: [reservation.id], stopId: 'nope' })
      ).status,
    ).toBe(400);
    const trip = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(driver.token))
      .send({ reservationIds: [reservation.id], stopId: station.id, vehicle: { model: 'Vito' } });
    expect(trip.status).toBe(201);
    expect(trip.body.trip.stop).toMatchObject({ id: station.id, name: 'Gare Saint-Exupéry TGV', kind: 'station' });
    await api()
      .post(`/api/internal/shuttle/trips/${trip.body.trip.id}/position`)
      .set(auth(driver.token))
      .send({ lat: 45.7209, lng: 5.09, recordedAt: new Date().toISOString() });
    const mine = await api().get(`/api/public/bookings/${reference}/shuttles`).set('x-booking-token', manageToken);
    expect(mine.body.shuttles[0]).toMatchObject({ mine: true, destination: { label: 'Gare Saint-Exupéry TGV', lat: STATION.lat, lng: STATION.lng } });

    // Removing the stop: the booking and the trip fall back to the airport.
    expect((await api().delete(`/api/internal/shuttle/stops/${station.id}`).set(auth(op.token))).status).toBe(204);
    expect((await api().get(`/api/internal/reservations/${reservation.id}`).set(auth(op.token))).body.stop).toBeNull();
    const stored = await prisma.shuttleTrip.findUniqueOrThrow({ where: { id: trip.body.trip.id } });
    expect(stored).toMatchObject({ stopId: null, stopName: 'Gare Saint-Exupéry TGV' });
  });
});

describe('tournée du chauffeur (F-A)', () => {
  it('liste les attendus grisés avec l’heure de départ conseillée, puis range les déposés par jour de retour', async () => {
    const { op, reservation } = await setup();
    const driver = await addStaff(op.token, 'driver');
    // Still expected, in an hour: greyed on the drop-off list, with a leave time.
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'upcoming', arrivedAt: null, arrivalAt: minutesFromNow(60), returnAt: minutesFromNow(60 * 48) },
    });
    const departures = await api().get('/api/internal/shuttle/departures').set(auth(driver.token));
    expect(departures.status).toBe(200);
    expect(departures.body.rows).toHaveLength(1);
    expect(departures.body.rows[0]).toMatchObject({ reservationId: reservation.id, expected: true, status: 'upcoming' });
    expect(departures.body.rows[0].leaveAt).toEqual(expect.any(String));
    // Dropped at the terminal: on the staying list, under its return day.
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'shuttled_out' } });
    const staying = await api().get('/api/internal/shuttle/staying').set(auth(driver.token));
    expect(staying.status).toBe(200);
    expect(staying.body.days).toHaveLength(1);
    expect(staying.body.days[0].rows[0]).toMatchObject({ reservationId: reservation.id, status: 'shuttled_out', plate: 'AB-123-CD' });
    expect(staying.body.returnedToday).toEqual([]);
    // Back at the parking: on the return side's "Rendus".
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'back_at_parking' } });
    const back = await api().get('/api/internal/shuttle/staying').set(auth(driver.token));
    expect(back.body.days).toEqual([]);
    expect(back.body.returnedToday[0]).toMatchObject({ reservationId: reservation.id, status: 'back_at_parking' });
    // The pick-up list carries a leave time too.
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'arrived', arrivalAt: minutesFromNow(-60), returnAt: minutesFromNow(120) },
    });
    const pickups = await api().get('/api/internal/shuttle/pickups').set(auth(driver.token));
    expect(pickups.body.rows[0].leaveAt).toEqual(expect.any(String));
  });
});

describe('navettes en direct (P-A) et notifications (N-A)', () => {
  it('toute l’équipe voit les navettes en cours ; départs, arrivée au point et retour sont notifiés', async () => {
    const { op, reservation, reference, manageToken } = await setup();
    process.env.ONESIGNAL_APP_ID = 'staff-app';
    process.env.ONESIGNAL_REST_API_KEY = 'key';
    process.env.ONESIGNAL_TRAVELLER_APP_ID = 'traveller-app';
    process.env.ONESIGNAL_TRAVELLER_REST_API_KEY = 'tkey';
    const driver = await addStaff(op.token, 'driver');
    const agent = await addStaff(op.token, 'agent');
    const quiet = await addStaff(op.token, 'valet');
    await api().put('/api/internal/notifications/devices').set(auth(driver.token)).send({ subscriptionId: 'sub-driver' });
    await api().put('/api/internal/notifications/devices').set(auth(agent.token)).send({ subscriptionId: 'sub-agent' });
    await api().put('/api/internal/notifications/devices').set(auth(quiet.token)).send({ subscriptionId: 'sub-quiet' });
    const prefs = await api().patch('/api/internal/notifications/preferences').set(auth(quiet.token)).send({ shuttles: false });
    expect(prefs.body).toMatchObject({ arrivals: true, returns: true, shuttles: false });
    // The traveller's phone, through the booking token only.
    expect((await api().put(`/api/public/bookings/${reference}/devices`).send({ subscriptionId: 'sub-camille' })).status).toBe(404);
    expect(
      (
        await api()
          .put(`/api/public/bookings/${reference}/devices`)
          .set('x-booking-token', manageToken)
          .send({ subscriptionId: 'sub-camille', platform: 'android' })
      ).status,
    ).toBe(200);

    const empty = await api().get('/api/internal/shuttle/live').set(auth(agent.token));
    expect(empty.body).toMatchObject({ parking: { id: op.parking.id, lat: RECEPTION.lat, lng: RECEPTION.lng }, trips: [] });
    expect(empty.body.stops).toHaveLength(1);

    const trip = (
      await api()
        .post('/api/internal/shuttle/trips')
        .set(auth(driver.token))
        .send({ reservationIds: [reservation.id], vehicle: { model: 'Vito', colour: 'blanc' } })
    ).body.trip;
    // Departure: the team (not the driver, not the one who opted out) and the passenger.
    let sent = pushes();
    expect(sent).toHaveLength(2);
    const toStaff = sent.find(p => p.app_id === 'staff-app')!;
    expect(toStaff.include_subscription_ids).toEqual(['sub-agent']);
    expect(toStaff.headings.fr).toBe('Navette partie chercher des clients');
    expect(toStaff.contents.fr).toContain('Vito blanc · driver');
    expect(toStaff.contents.fr).toContain('2 clients');
    const toTraveller = sent.find(p => p.app_id === 'traveller-app')!;
    expect(toTraveller.include_subscription_ids).toEqual(['sub-camille']);
    expect(toTraveller.headings.fr).toBe('Votre navette est partie');
    expect(toTraveller.contents.fr).toMatch(/arrivée dans ~\d+ min/);

    // Live: position, distances to the stop and to the parking.
    await api()
      .post(`/api/internal/shuttle/trips/${trip.id}/position`)
      .set(auth(driver.token))
      .send({ lat: 45.7255, lng: 5.065, recordedAt: new Date().toISOString() });
    const live = await api().get('/api/internal/shuttle/live').set(auth(quiet.token));
    expect(live.body.trips).toHaveLength(1);
    expect(live.body.trips[0]).toMatchObject({
      id: trip.id,
      direction: 'pickup',
      driverName: driver.session.user.name,
      vehicle: { model: 'Vito', colour: 'blanc' },
      stop: { kind: 'airport', name: 'Terminal 1 · Porte 12' },
      passengers: 2,
      position: { lat: 45.7255, lng: 5.065 },
    });
    expect(live.body.trips[0].toStop.distanceM).toBeGreaterThan(500);
    expect(live.body.trips[0].toParking.distanceM).toBeGreaterThan(500);
    expect(pushes()).toHaveLength(2);

    // At the meeting point (within 150 m): "Votre navette est là", once.
    await prisma.shuttleTrip.update({ where: { id: trip.id }, data: { positionReceivedAt: minutesFromNow(-1) } });
    await api()
      .post(`/api/internal/shuttle/trips/${trip.id}/position`)
      .set(auth(driver.token))
      .send({ lat: MEETING.lat + 0.0005, lng: MEETING.lng, recordedAt: new Date().toISOString() });
    sent = pushes();
    expect(sent).toHaveLength(3);
    expect(sent[2]).toMatchObject({ app_id: 'traveller-app', headings: { fr: 'Votre navette est là' } });
    await prisma.shuttleTrip.update({ where: { id: trip.id }, data: { positionReceivedAt: minutesFromNow(-1) } });
    await api()
      .post(`/api/internal/shuttle/trips/${trip.id}/position`)
      .set(auth(driver.token))
      .send({ lat: MEETING.lat, lng: MEETING.lng, recordedAt: new Date().toISOString() });
    expect(pushes()).toHaveLength(3);

    // End: the team hears the shuttle is back.
    await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(driver.token));
    sent = pushes();
    expect(sent).toHaveLength(4);
    expect(sent[3]).toMatchObject({ app_id: 'staff-app', headings: { fr: 'Navette de retour au parking' }, include_subscription_ids: ['sub-agent'] });
    expect((await api().get('/api/internal/shuttle/live').set(auth(agent.token))).body.trips).toEqual([]);

    // The traveller forgets their phone; the cron purges the old ones.
    expect((await api().delete(`/api/public/bookings/${reference}/devices/sub-camille`).set('x-booking-token', manageToken)).status).toBe(204);
    expect(await prisma.travellerDevice.count()).toBe(0);
    await prisma.travellerDevice.create({ data: { reservationId: reservation.id, subscriptionId: 'old' } });
    await prisma.reservation.update({ where: { id: reservation.id }, data: { returnAt: minutesFromNow(-3 * 24 * 60) } });
    const cron = await api().get('/api/internal/cron/purge-expired-tokens').set(auth('test-cron-secret'));
    expect(cron.body.travellerDevicesPurged).toBe(1);
  });
});
