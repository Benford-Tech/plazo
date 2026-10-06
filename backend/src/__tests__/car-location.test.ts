import { Container } from 'typedi';
import prisma from '@/database';
import { ArrivalService } from '@/services/arrival.service';
import { NotificationService } from '@/services/notification.service';
import { ParkingLocationService } from '@/services/parking-location.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

/** Where the car is parked (06/10/2026): recorded by whoever parks it, the valet's position prevails. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (token: string) => ({ 'x-booking-token': token });
const CAR = { lat: 45.7301, lng: 5.0502, accuracyM: 6, note: 'Rangée 3, près du portail' };

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => prisma.$disconnect());

async function setup() {
  const op = await setupOperator();
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
    });
  await publishListing(op.parking.id);
  await Container.get(ParkingLocationService).store(op.parking.id, { lat: 45.73, lng: 5.05 });
  await Container.get(ArrivalService).setReturnMeetingPoint(op.parking.id, {
    lat: 45.7205,
    lng: 5.0817,
    label: 'T1',
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
  expect(res.status).toBe(201);
  return {
    op,
    reference: res.body.reference as string,
    token: res.body.manageToken as string,
    id: (await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } })).id,
  };
}

describe('position de la voiture', () => {
  it('le voyageur enregistre, corrige et efface sa position ; validation', async () => {
    const b = await setup();
    const bad = await api().put(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token)).send({ lat: 95, lng: 5 });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ lat: 'invalid_position' });
    const saved = await api().put(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token)).send(CAR);
    expect(saved.status).toBe(200);
    expect(saved.body.car).toMatchObject({ lat: 45.7301, lng: 5.0502, accuracyM: 6, by: 'traveller', note: 'Rangée 3, près du portail' });
    // Without the token: nothing.
    expect((await api().put(`/api/public/bookings/${b.reference}/car-location`).send(CAR)).status).toBe(404);
    // The occupation board and the traveller's return carry it.
    await prisma.reservation.update({ where: { id: b.id }, data: { status: 'arrived', arrivedAt: new Date() } });
    const ret = await api().get(`/api/public/bookings/${b.reference}/return`).set(bookingToken(b.token));
    expect(ret.body.car).toMatchObject({ lat: 45.7301, by: 'traveller' });
    const cleared = await api().delete(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token));
    expect(cleared.body.car).toBeNull();
  });

  it('le voiturier enregistre la position en affectant la place, et elle prime sur celle du voyageur', async () => {
    const b = await setup();
    await prisma.reservation.update({
      where: { id: b.id },
      data: { status: 'arrived', arrivedAt: new Date(), arrivalAt: new Date(Date.now() - 3600000) },
    });
    await api().put(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token)).send(CAR);
    const staffFix = { lat: 45.7311, lng: 5.0511, accuracyM: 4 };
    const assigned = await api()
      .post(`/api/internal/reservations/${b.id}/spot`)
      .set(auth(b.op.token))
      .send({ spotId: null, keyHook: 'A3', car: staffFix });
    expect(assigned.status).toBe(200);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: b.id } });
    expect(row).toMatchObject({ carLat: 45.7311, carLng: 5.0511, carAccuracyM: 4, carLocatedBy: 'staff', carNote: null, keyHook: 'A3' });
    // The traveller can neither replace nor clear the valet's position.
    const refused = await api().put(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token)).send(CAR);
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('car_location_locked');
    expect((await api().delete(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token))).status).toBe(409);
    // The staff corrects or clears it from the dedicated route; the board shows it.
    const corrected = await api()
      .put(`/api/internal/reservations/${b.id}/car-location`)
      .set(auth(b.op.token))
      .send({ ...staffFix, note: 'Fond, rangée 2' });
    expect(corrected.body.data.car).toMatchObject({ by: 'staff', note: 'Fond, rangée 2' });
    const board = await api().get(`/api/internal/parkings/${b.op.parking.id}/occupation`).set(auth(b.op.token));
    const occupant = [...board.body.arrivals, ...board.body.spots.map((s: any) => s.occupant).filter(Boolean)].find((r: any) => r.id === b.id);
    expect(occupant?.carLat).toBe(45.7311);
    expect((await api().delete(`/api/internal/reservations/${b.id}/car-location`).set(auth(b.op.token))).body.data.car).toBeNull();
    // Not after the hand-back.
    await prisma.reservation.update({ where: { id: b.id }, data: { status: 'returned' } });
    expect((await api().put(`/api/internal/reservations/${b.id}/car-location`).set(auth(b.op.token)).send(staffFix)).status).toBe(400);
  });

  it('cron : la position est effacée deux jours après le retour', async () => {
    const b = await setup();
    await api().put(`/api/public/bookings/${b.reference}/car-location`).set(bookingToken(b.token)).send(CAR);
    await prisma.reservation.update({
      where: { id: b.id },
      data: { status: 'returned', arrivalAt: new Date(Date.now() - 5 * 86400000), returnAt: new Date(Date.now() - 3 * 86400000) },
    });
    const run = await api().get('/api/internal/cron/purge-expired-tokens').set(auth('test-cron-secret'));
    expect(run.body.carLocationsPurged).toBe(1);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: b.id } });
    expect(row.carLat).toBeNull();
    expect(row.carLocatedBy).toBeNull();
  });
});
