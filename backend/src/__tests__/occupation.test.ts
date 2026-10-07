import prisma from '@/database';
import { localDate } from '@/domain/time';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

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
/** Six spots in a row heading east from the handover point at 5.08, 45.72. */
const spots = Array.from({ length: 6 }, (_, i) => ({
  zoneId: 'z1',
  code: `A-01-${String(i + 1).padStart(2, '0')}`,
  row: 1,
  index: i + 1,
  geometry: square(5.08 + i * 0.00004, 45.72),
}));
const today = () => localDate(new Date(), 'Europe/Paris');
const booking = (plate: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${today()}T06:30`,
  returnAt: `${today()}T23:00`,
  passengers: 2,
  customerName: 'Mme Laurent',
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

describe('occupation (bloc 2, step 2)', () => {
  it('propose les places libres les plus proches de la remise, place le véhicule et retrouve ses clés', async () => {
    const { token, parking, manager } = await parkingWithSpots();
    const a = (await api().post('/api/internal/reservations').set(auth(token)).send(booking('GK-318-PX'))).body.data;
    const b = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking('AB-123-CD', { customerName: 'M. Petit' }))
    ).body.data;
    await api().post(`/api/internal/reservations/${a.id}/status`).set(auth(token)).send({ status: 'arrived' });

    const board = await api().get(`/api/internal/parkings/${parking.id}/occupation`).set(auth(token));
    expect(board.status).toBe(200);
    expect(board.body.stats).toEqual({ active: 6, occupied: 0, leavingToday: 0 });
    expect(board.body.arrivals).toHaveLength(2);
    const first = board.body.arrivals.find((r: { id: string }) => r.id === a.id);
    expect(first.suggestions.map((s: { code: string }) => s.code)).toEqual(['A-01-01', 'A-01-02', 'A-01-03']);
    expect(first.suggestions[0].reason).toBe('near_handover');
    expect(first.suggestions[0].distanceM).toBeLessThan(3);
    // The second arrival is offered the next spot, not the same one.
    const second = board.body.arrivals.find((r: { id: string }) => r.id === b.id);
    expect(second.suggestions[0].code).toBe('A-01-02');

    const put = await api()
      .post(`/api/internal/reservations/${a.id}/spot`)
      .set(auth(token))
      .send({ spotId: first.suggestions[0].spotId, keyHook: '17' });
    expect(put.status).toBe(200);
    expect(put.body.data).toMatchObject({ keyHook: '17', spot: { code: 'A-01-01' } });

    // Occupied now: the other arrival's suggestions skip it, the board shows the vehicle, the search finds it.
    const after = await api().get(`/api/internal/parkings/${parking.id}/occupation`).set(auth(token));
    expect(after.body.stats).toMatchObject({ occupied: 1, leavingToday: 1 });
    expect(after.body.arrivals).toHaveLength(1);
    expect(after.body.arrivals[0].suggestions[0].code).toBe('A-01-02');
    const taken = after.body.spots.find((s: { code: string }) => s.code === 'A-01-01');
    expect(taken.occupant).toMatchObject({ plate: 'GK-318-PX', onSite: true, leavesToday: true, keyHook: '17' });
    // D-B: the stay's nights and class travel with the occupant, for the plan coloured by stay.
    expect(taken.occupant.nights).toBeGreaterThanOrEqual(1);
    expect(['short', 'medium', 'long']).toContain(taken.occupant.stayClass);

    const found = await api().get(`/api/internal/parkings/${parking.id}/occupation/search?q=gk 318`).set(auth(token));
    expect(found.body.results).toHaveLength(1);
    expect(found.body.results[0]).toMatchObject({ plate: 'GK-318-PX', spot: { code: 'A-01-01' }, keyHook: '17', onSite: true });
    expect((await api().get(`/api/internal/parkings/${parking.id}/occupation/search?q=petit`).set(auth(token))).body.results[0].plate).toBe(
      'AB-123-CD',
    );

    // The same spot cannot take another vehicle during the stay; a move is traced.
    const clash = await api().post(`/api/internal/reservations/${b.id}/spot`).set(auth(token)).send({ spotId: first.suggestions[0].spotId });
    expect(clash.status).toBe(409);
    expect(clash.body.code).toBe('spot_taken');
    const move = await api().post(`/api/internal/reservations/${a.id}/spot`).set(auth(token)).send({ spotId: first.suggestions[2].spotId });
    expect(move.body.data.spot.code).toBe('A-01-03');
    const logs = await prisma.auditLog.findMany({ where: { action: 'reservation.spot_assigned' }, orderBy: { createdAt: 'asc' } });
    expect(logs).toHaveLength(2);
    expect(logs[1].details).toMatchObject({ from: 'A-01-01', to: 'A-01-03' });
    expect(logs[1].staffId).toBe(manager.id);
    // Released.
    const off = await api().post(`/api/internal/reservations/${a.id}/spot`).set(auth(token)).send({ spotId: null });
    expect(off.body.data.spotId).toBeNull();
  });

  it('refuse une place inactive, une réservation annulée, et le parking d’un autre loueur ; un agent peut placer', async () => {
    const { token, parking } = await parkingWithSpots();
    const other = await setupOperator('B');
    const agent = await addStaff(token, 'agent');
    const r = (await api().post('/api/internal/reservations').set(auth(token)).send(booking('ZZ-999-ZZ'))).body.data;
    const list = (await api().get(`/api/internal/parkings/${parking.id}/plan`).set(auth(token))).body.spots;
    await api().patch(`/api/internal/parkings/${parking.id}/plan/spots/${list[5].id}`).set(auth(token)).send({ active: false });
    expect((await api().post(`/api/internal/reservations/${r.id}/spot`).set(auth(token)).send({ spotId: list[5].id })).body.code).toBe(
      'spot_inactive',
    );
    expect(
      (await api().post(`/api/internal/reservations/${r.id}/spot`).set(auth(agent.token)).send({ spotId: list[0].id, keyHook: 'B3' })).status,
    ).toBe(200);
    expect((await api().get(`/api/internal/parkings/${parking.id}/occupation`).set(auth(other.token))).status).toBe(404);
    // Placed today: checked in (A, 06/10/2026). A cancelled booking cannot be placed.
    expect((await api().get(`/api/internal/reservations/${r.id}`).set(auth(token))).body.status).toBe('arrived');
    const gone = (await api().post('/api/internal/reservations').set(auth(token)).send(booking('YY-888-YY'))).body.data;
    await api().post(`/api/internal/reservations/${gone.id}/status`).set(auth(token)).send({ status: 'cancelled' });
    expect((await api().post(`/api/internal/reservations/${gone.id}/spot`).set(auth(token)).send({ spotId: list[1].id })).body.code).toBe(
      'not_placeable',
    );
    expect((await api().post(`/api/internal/reservations/${r.id}/spot`).set(auth(token)).send({ keyHook: 'nope!!' })).status).toBe(400);
  });
});
