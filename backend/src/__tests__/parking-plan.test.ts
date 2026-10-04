import prisma from '@/database';
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
const outline = { type: 'Polygon', coordinates: [square(5.08, 45.72, 0.001)] };
const spots = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    zoneId: 'z1',
    code: `A-01-${String(i + 1).padStart(2, '0')}`,
    row: 1,
    index: i + 1,
    geometry: square(5.08 + i * 0.00004, 45.72),
  }));

describe('parking plan (bloc 2, step Plan)', () => {
  it('crée un plan vide à la première lecture, puis l’enregistre au fil du tracé', async () => {
    const { token, parking } = await setupOperator();
    const first = await api().get(`/api/internal/parkings/${parking.id}/plan`).set(auth(token));
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ plan: { parkingId: parking.id, outline: null, zones: [] }, spots: [], activeSpots: 0, totalCapacity: 200 });

    const saved = await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({
        outline,
        zones: [{ id: 'z1', name: 'Zone A', geometry: outline }],
        landmarks: [{ id: 'e', kind: 'entrance', geometry: { type: 'Point', coordinates: [5.08, 45.72] } }],
      });
    expect(saved.status).toBe(200);
    expect(saved.body.data.plan.zones).toHaveLength(1);
    expect(saved.body.data.plan.landmarks[0].kind).toBe('entrance');
  });

  it('refuse un repère d’un genre inconnu et une échelle hors bornes', async () => {
    const { token, parking } = await setupOperator();
    const bad = await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({ landmarks: [{ id: 'x', kind: 'tower', geometry: { type: 'Point', coordinates: [5, 45] } }], scaleFactor: 3 });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ landmarks: 'invalid_kind', scaleFactor: 'scale_range' });
  });

  it('remplace les places, les numérote de façon unique et recalcule la capacité', async () => {
    const { token, parking, manager } = await setupOperator();
    const gen = await api()
      .put(`/api/internal/parkings/${parking.id}/plan/spots`)
      .set(auth(token))
      .send({ layout: 'valet24', spots: spots(12) });
    expect(gen.status).toBe(200);
    expect(gen.body.data.spots).toHaveLength(12);
    expect(gen.body.data.plan.layout).toBe('valet24');
    expect(gen.body.data.spots[0]).toMatchObject({ code: 'A-01-01', row: 1, index: 1, kind: 'standard', active: true });
    expect(gen.body.data.spots[0].lon).toBeCloseTo(5.080015, 5);

    const dup = await api()
      .put(`/api/internal/parkings/${parking.id}/plan/spots`)
      .set(auth(token))
      .send({ layout: 'valet24', spots: [...spots(2), spots(1)[0]] });
    expect(dup.status).toBe(400);
    expect(dup.body.code).toBe('duplicate_code');

    const spot = gen.body.data.spots[3];
    const off = await api().patch(`/api/internal/parkings/${parking.id}/plan/spots/${spot.id}`).set(auth(token)).send({ active: false, kind: 'pmr' });
    expect(off.status).toBe(200);
    expect(off.body.data).toMatchObject({ active: false, kind: 'pmr' });
    const clash = await api().patch(`/api/internal/parkings/${parking.id}/plan/spots/${spot.id}`).set(auth(token)).send({ code: 'A-01-01' });
    expect(clash.status).toBe(409);

    const applied = await api().post(`/api/internal/parkings/${parking.id}/plan/apply-capacity`).set(auth(token));
    expect(applied.status).toBe(200);
    expect(applied.body.data).toMatchObject({ activeSpots: 11, totalCapacity: 11 });
    expect((await prisma.parking.findUniqueOrThrow({ where: { id: parking.id } })).totalCapacity).toBe(11);
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } });
    expect(logs.map(l => l.action)).toEqual(['parking.spots_generated', 'parking.settings_updated']);
    expect(logs[1].staffId).toBe(manager.id);

    // A second generation replaces everything, codes included.
    const again = await api()
      .put(`/api/internal/parkings/${parking.id}/plan/spots`)
      .set(auth(token))
      .send({ layout: 'selfPark', spots: spots(3) });
    expect(again.body.data.spots).toHaveLength(3);
    expect(again.body.data.spots.every((s: { active: boolean }) => s.active)).toBe(true);
  });

  it('est réservé au gérant pour l’écriture, et jamais au parking d’un autre loueur', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    const agent = await addStaff(a.token, 'agent');
    expect((await api().get(`/api/internal/parkings/${a.parking.id}/plan`).set(auth(agent.token))).status).toBe(200);
    expect((await api().patch(`/api/internal/parkings/${a.parking.id}/plan`).set(auth(agent.token)).send({ outline })).status).toBe(403);
    expect((await api().get(`/api/internal/parkings/${b.parking.id}/plan`).set(auth(a.token))).status).toBe(404);
    expect(
      (
        await api()
          .put(`/api/internal/parkings/${b.parking.id}/plan/spots`)
          .set(auth(a.token))
          .send({ layout: 'valet5', spots: spots(1) })
      ).status,
    ).toBe(404);
    expect((await api().get('/api/internal/geo/geocode?q=ab').set(auth(a.token))).status).toBe(400);
    expect((await api().get('/api/internal/geo/geocode?q=lyon').set(auth(agent.token))).status).toBe(403);
  });

  it('estime et génère les places côté serveur depuis le plan enregistré (l’app)', async () => {
    const { token, parking } = await setupOperator();
    // A 60 m × 40 m rectangle.
    const lon0 = 5.08;
    const lat0 = 45.72;
    const dx = 60 / (111320 * Math.cos((lat0 * Math.PI) / 180));
    const dy = 40 / 110540;
    const rect = {
      type: 'Polygon',
      coordinates: [
        [
          [lon0, lat0],
          [lon0 + dx, lat0],
          [lon0 + dx, lat0 + dy],
          [lon0, lat0 + dy],
          [lon0, lat0],
        ],
      ],
    };
    expect((await api().post(`/api/internal/parkings/${parking.id}/plan/estimate`).set(auth(token))).body.code).toBe('no_zones');
    await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({ outline: rect, zones: [{ id: 'z1', name: 'Zone A', geometry: rect }] });

    const est = await api().post(`/api/internal/parkings/${parking.id}/plan/estimate`).set(auth(token));
    expect(est.status).toBe(200);
    expect(est.body.totals.selfPark).toBeGreaterThan(60);
    expect(est.body.totals.valet24).toBeGreaterThan(est.body.totals.selfPark);
    expect(est.body.zones[0]).toMatchObject({ zoneId: 'z1', name: 'Zone A' });

    const gen = await api()
      .post(`/api/internal/parkings/${parking.id}/plan/generate`)
      .set(auth(token))
      .send({ layout: 'valet24', applyCapacity: true });
    expect(gen.status).toBe(200);
    expect(gen.body.data.spots.length).toBe(est.body.totals.valet24);
    expect(gen.body.data.spots[0].code).toBe('A-01-01');
    expect(gen.body.data.plan.layout).toBe('valet24');
    expect(gen.body.data.totalCapacity).toBe(est.body.totals.valet24);
    expect((await prisma.parking.findUniqueOrThrow({ where: { id: parking.id } })).totalCapacity).toBe(est.body.totals.valet24);
    expect((await api().post(`/api/internal/parkings/${parking.id}/plan/generate`).set(auth(token)).send({ layout: 'grid' })).status).toBe(400);
  });
});
