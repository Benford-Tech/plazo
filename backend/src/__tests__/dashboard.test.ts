import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
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
      stripe: { online: false, connected: false },
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
      // 21/10/2026: the seeded bookings have no price.
      ['price_missing', 'todo'],
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

    // 01/11/2026 (« Les voitures avec crochets ont une place »): Louis's keys on hook 7, his car counts as placed.
    await api().put(`/api/internal/reservations/${c.id}/keys`).set(auth(op.token)).send({ left: true, keyHook: '7' });
    const hooked = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(hooked.body.alerts.map((x: { kind: string }) => x.kind)).not.toContain('no_spot');
    expect((hooked.body.vehicles as { id: string }[]).find(v => v.id === c.id)).toMatchObject({ spotCode: '7', keyHook: '7' });
  });

  it("26/10/2026 : « Clés laissées » en un clic éteint l'alerte des clés et se voit sur le véhicule", async () => {
    const op = await setupOperator();
    const b = (await api().post('/api/internal/reservations').set(auth(op.token)).send(booking('GH-456-JK', 'Léa Durand'))).body.data;
    // Not on site yet: refused.
    const early = await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: true });
    expect(early.status).toBe(400);
    expect(early.body.code).toBe('vehicle_not_on_site');
    await api().post(`/api/internal/reservations/${b.id}/status`).set(auth(op.token)).send({ status: 'arrived' });
    await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
    const plan = await api().get(`/api/internal/parkings/${op.parking.id}/plan`).set(auth(op.token));
    await api().post(`/api/internal/reservations/${b.id}/spot`).set(auth(op.token)).send({ spotId: plan.body.spots[0].id });
    await prisma.reservation.update({ where: { id: b.id }, data: { arrivedAt: new Date(Date.now() - 45 * 60000) } });
    let dash = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dash.body.alerts.map((x: { kind: string }) => x.kind)).toContain('keys_missing');

    const left = await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: true });
    expect(left.status).toBe(200);
    expect(left.body.data.keysLeftAt).toBeTruthy();
    // 01/11/2026: the hook is the car's place.
    const spotCode = plan.body.spots[0].code as string;
    expect(left.body.data.keyHook).toBe(spotCode);
    dash = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dash.body.alerts.map((x: { kind: string }) => x.kind)).not.toContain('keys_missing');
    expect(dash.body.vehicles.find((v: { id: string }) => v.id === b.id)).toMatchObject({ keyHook: spotCode, keysLeftAt: left.body.data.keysLeftAt });
    const detail = await api().get(`/api/internal/reservations/${b.id}`).set(auth(op.token));
    expect(detail.body.keysLeftAt).toBe(left.body.data.keysLeftAt);
    const audit = await prisma.auditLog.findMany({ where: { action: 'reservation.keys', entityId: b.id } });
    expect(audit).toHaveLength(1);
    expect(audit[0].details).toMatchObject({ left: true, keyHook: spotCode });

    // The hook number through the same route (web vehicles table): a hook implies the keys were left.
    const hooked = await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: false, keyHook: ' 7 ' });
    expect(hooked.status).toBe(200);
    expect(hooked.body.data).toMatchObject({ keyHook: '7' });
    expect(hooked.body.data.keysLeftAt).toBeTruthy();
    // Keys left without a typed hook: back on the place's hook.
    const cleared = await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: true, keyHook: null });
    expect(cleared.body.data).toMatchObject({ keyHook: spotCode });
    expect(cleared.body.data.keysLeftAt).toBeTruthy();
    // Undone: the alert comes back; another operator's token is refused.
    const undone = await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: false });
    expect(undone.body.data.keysLeftAt).toBeNull();
    dash = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dash.body.alerts.map((x: { kind: string }) => x.kind)).toContain('keys_missing');
    // « Rendu » forgets it.
    await api().put(`/api/internal/reservations/${b.id}/keys`).set(auth(op.token)).send({ left: true });
    for (const status of ['shuttled_out', 'return_requested', 'back_at_parking', 'returned']) {
      await api().post(`/api/internal/reservations/${b.id}/status`).set(auth(op.token)).send({ status });
    }
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: b.id } })).keysLeftAt).toBeNull();
  });

  it('15/10/2026 : un retour bloqué derrière une voiture sans plaque nomme son client', async () => {
    const op = await setupOperator();
    const files = await api()
      .put(`/api/internal/parkings/${op.parking.id}/files`)
      .set(auth(op.token))
      .send({ files: [{ code: 'F01', capacity: 3 }] });
    expect(files.status).toBe(200);
    const fileId = files.body.data[0].id as string;
    const back = (await api().post('/api/internal/reservations').set(auth(op.token)).send(booking('AB-123-CD', 'Marie Martin'))).body.data;
    const front = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send(booking('', 'Jean Dupont', { channel: 'aggregator', channelDetail: 'Allopark', returnAt: `${addDays(today(), 1)}T18:00` }));
    expect(front.status).toBe(201);
    expect(front.body.data.plate).toBe('');
    for (const id of [back.id, front.body.data.id]) {
      expect((await api().post(`/api/internal/reservations/${id}/file`).set(auth(op.token)).send({ fileId })).status).toBe(200);
    }
    const res = await api().get('/api/internal/dashboard').set(auth(op.token));
    const alert = res.body.alerts.find((a: { kind: string }) => a.kind === 'blocked_return');
    expect(alert).toMatchObject({ reservationId: back.id, plate: 'AB-123-CD' });
    expect(alert.detail).toMatch(/^F01 · J\. Dupont retour /);
  });
});
