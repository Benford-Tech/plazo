import prisma from '@/database';
import { GeoService } from '@/services/geo.service';
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

describe('disposition « peigne » (M-A, ex-files depuis le bord) et zones de séjour (Z-A)', () => {
  it('génère plus de places qu’en bandes sur un terrain en triangle, et classe chaque place par son rang dans la file', async () => {
    const { token, parking } = await setupOperator();
    // A right triangle of about 60 m × 45 m (1° of latitude ≈ 111 km; longitude scaled by cos 45.72°).
    const tri = {
      type: 'Polygon',
      coordinates: [
        [
          [5.08, 45.72],
          [5.08077, 45.72],
          [5.08, 45.7204],
          [5.08, 45.72],
        ],
      ],
    };
    await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({ outline: tri, zones: [{ id: 'z1', name: 'Zone A', geometry: tri }], settings: { setback: 0 } });
    const est = await api().post(`/api/internal/parkings/${parking.id}/plan/estimate`).set(auth(token));
    expect(est.status).toBe(200);
    expect(est.body.totals.valetEdge).toBeGreaterThan(est.body.totals.valet24);
    expect(est.body.zones[0].counts.valetEdge).toBe(est.body.totals.valetEdge);

    const gen = await api()
      .post(`/api/internal/parkings/${parking.id}/plan/generate`)
      .set(auth(token))
      .send({ layout: 'valetEdge', applyCapacity: true });
    expect(gen.status).toBe(200);
    const spots = gen.body.data.spots as { stayClass: string | null; depth: number; fileLength: number }[];
    expect(spots.length).toBe(est.body.totals.valetEdge);
    expect(spots.every(s => s.stayClass === 'short' || s.stayClass === 'medium' || s.stayClass === 'long')).toBe(true);
    expect(spots.filter(s => s.depth === 0).every(s => s.stayClass === 'short')).toBe(true);
    expect(spots.filter(s => s.fileLength >= 3 && s.depth === s.fileLength - 1).every(s => s.stayClass === 'long')).toBe(true);
    expect(spots.some(s => s.stayClass === 'medium')).toBe(true);
  });
});

describe('bâtiments IGN et zones automatiques à l’enregistrement du terrain (B-A, T-A, 07/10/2026)', () => {
  const lon0 = 5.08;
  const lat0 = 45.72;
  const dx = 100 / (111320 * Math.cos((lat0 * Math.PI) / 180));
  const dy = 60 / 110540;
  const box = (x: number, y: number, w: number, h: number) => ({
    type: 'Polygon',
    coordinates: [
      [
        [lon0 + (x / 100) * dx, lat0 + (y / 60) * dy],
        [lon0 + ((x + w) / 100) * dx, lat0 + (y / 60) * dy],
        [lon0 + ((x + w) / 100) * dx, lat0 + ((y + h) / 60) * dy],
        [lon0 + (x / 100) * dx, lat0 + ((y + h) / 60) * dy],
        [lon0 + (x / 100) * dx, lat0 + (y / 60) * dy],
      ],
    ],
  });
  const land = box(0, 0, 100, 60);
  let buildings: jest.SpyInstance;
  beforeEach(() => {
    // A building across the middle of the land, and one next to it.
    buildings = jest.spyOn(GeoService.prototype, 'buildingsIn').mockResolvedValue([
      { id: 'BAT1', nature: 'Indifférenciée', geometry: box(40, 0, 20, 60) as any },
      { id: 'BAT2', nature: 'Indifférenciée', geometry: box(150, 0, 10, 10) as any },
    ]);
  });
  afterEach(() => buildings.mockRestore());

  it('l’app n’envoie que le contour : les bâtiments deviennent des exclusions et les zones suivent', async () => {
    const { token, parking } = await setupOperator();
    const saved = await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({ outline: land, settings: { outlineSource: 'drawn', zonesAuto: true } });
    expect(saved.status).toBe(200);
    expect(buildings).toHaveBeenCalledTimes(1);
    const plan = saved.body.data.plan;
    expect(plan.exclusions).toHaveLength(1);
    expect(plan.exclusions[0]).toMatchObject({ id: 'ign-BAT1', kind: 'building', clearance: 1, source: 'ign', ref: 'BAT1', name: 'Bâtiment' });
    expect(plan.zones.map((z: { name: string }) => z.name)).toEqual(['Zone A', 'Zone B']);

    // The estimate runs on both pieces; the comb is on offer.
    const est = await api().post(`/api/internal/parkings/${parking.id}/plan/estimate`).set(auth(token));
    expect(est.status).toBe(200);
    expect(est.body.zones).toHaveLength(2);
    expect(est.body.totals.valetEdge).toBeGreaterThan(0);

    // The pro space sends its own exclusions and zones: the server keeps its hands off.
    const web = await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({ outline: land, exclusions: [], zones: [{ id: 'z1', name: 'Zone A', geometry: land }], settings: { zonesAuto: false } });
    expect(web.body.data.plan.exclusions).toEqual([]);
    expect(web.body.data.plan.zones).toHaveLength(1);
    expect(buildings).toHaveBeenCalledTimes(1);
  });

  it('un service IGN en panne n’empêche pas d’enregistrer le terrain', async () => {
    buildings.mockRejectedValue(new Error('down'));
    const { token, parking } = await setupOperator();
    const saved = await api().patch(`/api/internal/parkings/${parking.id}/plan`).set(auth(token)).send({ outline: land });
    expect(saved.status).toBe(200);
    expect(saved.body.data.plan.exclusions).toEqual([]);
    expect(saved.body.data.plan.zones.map((z: { name: string }) => z.name)).toEqual(['Zone A']);
  });

  it('la route des bâtiments contrôle sa boîte', async () => {
    const { token } = await setupOperator();
    expect((await api().get('/api/internal/geo/buildings?bbox=5,45').set(auth(token))).body.fields).toEqual({ bbox: 'invalid_bbox' });
    expect((await api().get('/api/internal/geo/buildings?bbox=5,45,5.2,45.2').set(auth(token))).body.fields).toEqual({ bbox: 'bbox_too_large' });
    const ok = await api().get('/api/internal/geo/buildings?bbox=5.08,45.72,5.081,45.721').set(auth(token));
    expect(ok.status).toBe(200);
    expect(ok.body.buildings).toHaveLength(2);
  });
});
