import prisma from '@/database';
import { addDays } from '@/domain/time';
import { api, resetDatabase, setupOperator } from './utils/helpers';

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
/** Two rows of two spots, row 1 nearest the handover point at 5.08, 45.72. */
const spots = [1, 2].flatMap(row =>
  [1, 2].map(index => ({
    zoneId: 'z1',
    code: `A-0${row}-0${index}`,
    row,
    index,
    geometry: square(5.08 + index * 0.00004, 45.72 + row * 0.00005),
  })),
);
const today = new Date().toISOString().slice(0, 10);
const booking = (plate: string, arrival: string, ret: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${arrival}T06:30`,
  returnAt: `${ret}T18:00`,
  passengers: 2,
  customerName: `Client ${plate}`,
  customerPhone: '06 12 34 56 78',
  plate,
  ...overrides,
});

async function parkingWithSpots() {
  const op = await setupOperator();
  await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
  await api()
    .patch(`/api/internal/parkings/${op.parking.id}/plan`)
    .set(auth(op.token))
    .send({ landmarks: [{ id: 'h', kind: 'handover', geometry: { type: 'Point', coordinates: [5.08, 45.72] } }] });
  return op;
}

describe('planning des places (bloc 2, step 3)', () => {
  it('une ligne par place sur la fenêtre, les réservations sans place, et l’alerte des jours trop pleins', async () => {
    const { token, parking } = await parkingWithSpots();
    const d = (n: number) => addDays(today, n);
    const create = (plate: string, a: number, r: number) =>
      api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking(plate, d(a), d(r)));
    const a = (await create('AA-111-AA', 0, 3)).body.data;
    await create('BB-222-BB', 1, 4);
    await create('CC-333-CC', 2, 5);
    await create('DD-444-DD', 2, 6);
    await create('EE-555-EE', 2, 3); // day 2: five stays for four spots
    const list = (await api().get(`/api/internal/parkings/${parking.id}/plan`).set(auth(token))).body.spots;
    await api().post(`/api/internal/reservations/${a.id}/spot`).set(auth(token)).send({ spotId: list[0].id });

    const res = await api().get(`/api/internal/parkings/${parking.id}/spot-planning?from=${today}&days=7`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ from: today, days: 7, capacity: 4 });
    expect(res.body.spots).toHaveLength(4);
    expect(res.body.spots[0].stays).toHaveLength(1);
    expect(res.body.spots[0].stays[0]).toMatchObject({ plate: 'AA-111-AA', onSite: false });
    expect(res.body.unplaced.map((r: { plate: string }) => r.plate)).toEqual(['BB-222-BB', 'CC-333-CC', 'DD-444-DD', 'EE-555-EE']);
    expect(res.body.load[2]).toMatchObject({ date: d(2), placed: 1, unplaced: 4, capacity: 4 });
    expect(res.body.alerts).toEqual(
      expect.arrayContaining([
        { kind: 'over_capacity', date: d(2), count: 1 },
        { kind: 'unplaced', count: 4 },
      ]),
    );
    // Out of the window: nothing.
    const later = await api()
      .get(`/api/internal/parkings/${parking.id}/spot-planning?from=${d(10)}&days=3`)
      .set(auth(token));
    expect(later.body.unplaced).toHaveLength(0);
    expect(later.body.load).toHaveLength(3);
    // A bad date falls back to today, days are clamped to 31; another operator sees nothing.
    expect((await api().get(`/api/internal/parkings/${parking.id}/spot-planning?from=x&days=999`).set(auth(token))).body).toMatchObject({
      from: today,
      days: 31,
    });
    const other = await setupOperator('B');
    expect((await api().get(`/api/internal/parkings/${parking.id}/spot-planning`).set(auth(other.token))).status).toBe(404);
  });

  it('la pré-affectation donne une place libre sur tout le séjour, la plus proche de la remise, et saute ce qui ne rentre pas', async () => {
    const { token, parking } = await parkingWithSpots();
    const d = (n: number) => addDays(today, n);
    const create = (plate: string, a: number, r: number) =>
      api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking(plate, d(a), d(r)));
    await create('AA-111-AA', 0, 3);
    await create('BB-222-BB', 1, 4);
    await create('CC-333-CC', 2, 5);
    await create('DD-444-DD', 2, 6);
    await create('EE-555-EE', 2, 3);
    await create('FF-666-FF', 4, 8); // after AA and BB left: a spot frees up

    const run = await api().post(`/api/internal/parkings/${parking.id}/spot-planning/preassign?from=${today}&days=14`).set(auth(token));
    expect(run.status).toBe(200);
    const codes = Object.fromEntries(run.body.data.assigned.map((x: { reference: string; code: string }) => [x.reference, x.code]));
    const byPlate = async (plate: string) => (await prisma.reservation.findFirst({ where: { plate } }))!;
    const aa = await byPlate('AA-111-AA');
    expect(codes[aa.reference]).toBe('A-01-01'); // nearest the handover point
    expect(run.body.data.assigned).toHaveLength(5);
    expect(run.body.data.skipped).toHaveLength(1);
    expect(run.body.data.skipped[0].reference).toBe((await byPlate('EE-555-EE')).reference);
    // Everyone placed holds a different spot during overlaps; FF reuses AA's spot after it leaves.
    const ff = await byPlate('FF-666-FF');
    expect(ff.spotId).toBe(aa.spotId);
    const board = await api().get(`/api/internal/parkings/${parking.id}/spot-planning?from=${today}&days=14`).set(auth(token));
    expect(board.body.unplaced.map((r: { plate: string }) => r.plate)).toEqual(['EE-555-EE']);
    expect(board.body.alerts).toEqual(expect.arrayContaining([{ kind: 'unplaced', count: 1 }]));
    const logs = await prisma.auditLog.findMany({ where: { action: 'reservation.spot_assigned' } });
    expect(logs).toHaveLength(5);
    expect(logs[0].details).toMatchObject({ by: 'preassign' });
    // A second run has nothing left to do.
    expect((await api().post(`/api/internal/parkings/${parking.id}/spot-planning/preassign`).set(auth(token))).body.data.assigned).toHaveLength(0);
  });
});

describe('zones de séjour (Z-A)', () => {
  it('la pré-affectation et les suggestions préfèrent la zone de la durée du séjour, puis la zone voisine', async () => {
    const { token, parking } = await setupOperator();
    // One file of three spots from the aisle: short (A-01-01), medium (A-01-02), long (A-01-03), plus a short one.
    const file = [
      { code: 'A-01-01', index: 1, depth: 0, fileLength: 3, stayClass: 'short' },
      { code: 'A-01-02', index: 2, depth: 1, fileLength: 3, stayClass: 'medium' },
      { code: 'A-01-03', index: 3, depth: 2, fileLength: 3, stayClass: 'long' },
      { code: 'A-01-04', index: 4, depth: 0, fileLength: 1, stayClass: 'short' },
    ].map((s, i) => ({ zoneId: 'z1', row: 1, geometry: square(5.08 + i * 0.00004, 45.72), ...s }));
    await api().put(`/api/internal/parkings/${parking.id}/plan/spots`).set(auth(token)).send({ layout: 'valetEdge', spots: file });
    const d = (n: number) => addDays(today, n);
    const create = (plate: string, a: number, r: number) =>
      api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking(plate, d(a), d(r)));
    const long = (await create('LL-111-LL', 0, 12)).body.data; // 12 nights: long
    const short = (await create('SS-222-SS', 0, 2)).body.data; // 2 nights: short
    const medium = (await create('MM-333-MM', 0, 5)).body.data; // 5 nights: medium

    const board = await api().get(`/api/internal/parkings/${parking.id}/occupation`).set(auth(token));
    const suggestionFor = (id: string) => board.body.arrivals.find((r: { id: string }) => r.id === id).suggestions[0];
    expect(suggestionFor(long.id)).toMatchObject({ code: 'A-01-03', stayClass: 'long' });
    expect(suggestionFor(short.id)).toMatchObject({ code: 'A-01-01', stayClass: 'short' });
    expect(suggestionFor(medium.id)).toMatchObject({ code: 'A-01-02', stayClass: 'medium' });

    const run = await api().post(`/api/internal/parkings/${parking.id}/spot-planning/preassign`).set(auth(token));
    const codes = Object.fromEntries(run.body.data.assigned.map((x: { reservationId: string; code: string }) => [x.reservationId, x.code]));
    expect(codes[long.id]).toBe('A-01-03');
    expect(codes[short.id]).toBe('A-01-01');
    expect(codes[medium.id]).toBe('A-01-02');
    // A second long stay: its zone is full, the neighbouring (medium) zone is not; it never takes a short spot first.
    const long2 = (await create('LL-444-LL', 0, 10)).body.data;
    const again = await api().post(`/api/internal/parkings/${parking.id}/spot-planning/preassign`).set(auth(token));
    expect(again.body.data.assigned.find((x: { reservationId: string }) => x.reservationId === long2.id)?.code).toBe('A-01-04');
    const rows = await api().get(`/api/internal/parkings/${parking.id}/spot-planning?from=${today}&days=3`).set(auth(token));
    expect(rows.body.spots.map((s: { stayClass: string | null }) => s.stayClass)).toEqual(['short', 'medium', 'long', 'short']);
  });
});
