import prisma from '@/database';
import { localDate } from '@/domain/time';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** The pro space's home (05/10/2026): figures, services, alerts, vehicles. */

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const square = (lon: number, lat: number, d = 0.00003): [number, number][] => [
  [lon, lat],
  [lon + d, lat],
  [lon + d, lat + d],
  [lon, lat + d],
  [lon, lat],
];
const spots = Array.from({ length: 3 }, (_, i) => ({
  zoneId: 'z1',
  code: `A-01-0${i + 1}`,
  row: 1,
  index: i + 1,
  geometry: square(5.08 + i * 0.00004, 45.72),
}));
const today = () => localDate(new Date(), 'Europe/Paris');
const booking = (plate: string, name: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${today()}T06:30`,
  returnAt: `${today()}T23:00`,
  passengers: 2,
  customerName: name,
  customerPhone: '06 12 34 56 78',
  plate,
  ...overrides,
});

describe('GET /internal/dashboard', () => {
  it('chiffres du jour, état des services, alertes classées et véhicules sur le parking', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');
    const empty = await api().get('/api/internal/dashboard').set(auth(driver.token));
    expect(empty.status).toBe(200);
    expect(empty.body.counts).toMatchObject({ onSite: 0, arrivalsToday: 0, returnsToday: 0, shuttlesRunning: 0, freeSpots: null, toTreat: 0 });
    expect(empty.body.services).toMatchObject({
      flights: { configured: false },
      sms: { mode: 'none', pending: 0 },
      push: { configured: false, devices: 0 },
      stripe: { connected: false },
      lastImportAt: null,
    });
    expect(empty.body.alerts).toEqual([]);
    expect((await api().get('/api/internal/dashboard')).status).toBe(401);

    // A plan with three spots, three bookings: one placed with keys, one placed without keys for a while, one arrived without a spot.
    await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
    const a = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(op.token))
        .send(booking('AB-123-CD', 'Camille Martin', { returnFlight: 'TO 3627' }))
    ).body.data;
    const b = (await api().post('/api/internal/reservations').set(auth(op.token)).send(booking('GH-456-JK', 'Léa Durand'))).body.data;
    const c = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(op.token))
        .send(booking('LM-789-NP', 'Louis Leroy', { arrivalAt: `${today()}T05:00` }))
    ).body.data;
    const plan = await api().get(`/api/internal/parkings/${op.parking.id}/plan`).set(auth(op.token));
    const spotIds = plan.body.spots.map((s: { id: string }) => s.id);
    for (const r of [a, b, c]) await api().post(`/api/internal/reservations/${r.id}/status`).set(auth(op.token)).send({ status: 'arrived' });
    await api().post(`/api/internal/reservations/${a.id}/spot`).set(auth(op.token)).send({ spotId: spotIds[0], keyHook: '12' });
    await api().post(`/api/internal/reservations/${b.id}/spot`).set(auth(op.token)).send({ spotId: spotIds[1] });
    await prisma.reservation.update({ where: { id: b.id }, data: { arrivedAt: new Date(Date.now() - 45 * 60000) } });
    await prisma.reservation.update({ where: { id: c.id }, data: { arrivedAt: new Date(Date.now() - 10 * 60000) } });
    // Camille's flight is late by an hour.
    const sched = new Date(Date.now() + 2 * 3600000);
    await prisma.reservation.update({
      where: { id: a.id },
      data: { flightStatus: 'delayed', flightScheduledAt: sched, flightEstimatedAt: new Date(sched.getTime() + 60 * 60000) },
    });

    const res = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.parking).toMatchObject({ id: op.parking.id, plannedSpots: 3 });
    expect(res.body.counts).toMatchObject({ onSite: 3, arrivalsToday: 3, arrivedToday: 3, returnsToday: 3, freeSpots: 1, toTreat: 2 });
    expect(res.body.alerts.map((x: { kind: string; severity: string }) => [x.kind, x.severity])).toEqual([
      ['no_spot', 'urgent'],
      ['flight_delayed', 'watch'],
      ['keys_missing', 'todo'],
    ]);
    expect(res.body.alerts[0]).toMatchObject({ reservationId: c.id, customerName: 'Louis Leroy', minutes: 10 });
    expect(res.body.alerts[1]).toMatchObject({ reservationId: a.id, detail: 'TO 3627', minutes: 60 });
    expect(res.body.alerts[2]).toMatchObject({ reservationId: b.id, detail: 'A-01-02' });
    const vehicles = res.body.vehicles as { id: string }[];
    expect(vehicles).toHaveLength(3);
    expect(vehicles.find(v => v.id === a.id)).toMatchObject({
      spotCode: 'A-01-01',
      keyHook: '12',
      returnsToday: true,
      returnFlight: 'TO 3627',
      flightStatus: 'delayed',
    });
    expect(res.body.breakdown).toMatchObject({ toTreat: 2, freeSpots: 1, returnsThisWeek: 3 });
  });
});
