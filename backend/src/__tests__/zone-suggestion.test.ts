import prisma from '@/database';
import { Container } from 'typedi';
import { metresPerPixel, tilesCovering, toLonLat, toPixel, zoomFor } from '@/domain/layout/tiles';
import { ZoneSuggestionService, drawRing } from '@/services/zone-suggestion.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
// A 100 m × 60 m land near Lyon Saint-Exupéry.
const lon0 = 5.0811;
const lat0 = 45.7256;
const dx = 100 / (111320 * Math.cos((lat0 * Math.PI) / 180));
const dy = 60 / 110540;
const box = (x: number, y: number, w: number, h: number): [number, number][] => [
  [lon0 + (x / 100) * dx, lat0 + (y / 60) * dy],
  [lon0 + ((x + w) / 100) * dx, lat0 + (y / 60) * dy],
  [lon0 + ((x + w) / 100) * dx, lat0 + ((y + h) / 60) * dy],
  [lon0 + (x / 100) * dx, lat0 + ((y + h) / 60) * dy],
  [lon0 + (x / 100) * dx, lat0 + (y / 60) * dy],
];
const land = { type: 'Polygon', coordinates: [box(0, 0, 100, 60)] };
// Taller than the land: it cuts it in two for sure (a building flush with the edge leaves a sliver).
const building = { type: 'Polygon', coordinates: [box(40, -5, 20, 70)] };

describe('tuiles IGN (arithmétique Web Mercator)', () => {
  it('retrouve une position après passage par les pixels, et donne une résolution de 30 cm au zoom 19', () => {
    const bbox: [number, number, number, number] = [lon0, lat0, lon0 + dx, lat0 + dy];
    const zoom = zoomFor(bbox, 4);
    expect(zoom).toBe(19);
    const range = tilesCovering(bbox, zoom);
    const [px, py] = toPixel(range, lon0 + dx / 2, lat0 + dy / 2);
    const [lon, lat] = toLonLat(range, px, py);
    expect(lon).toBeCloseTo(lon0 + dx / 2, 7);
    expect(lat).toBeCloseTo(lat0 + dy / 2, 7);
    expect(metresPerPixel(lat0, 19)).toBeCloseTo(0.21, 2);
    // A land of 2 km needs a lower zoom to fit in 4 tiles per side.
    expect(zoomFor([lon0, lat0, lon0 + dx * 20, lat0 + dy * 30], 4)).toBeLessThan(19);
  });

  it('trace le contour sur l’image', () => {
    const img = { width: 20, height: 20, data: Buffer.alloc(20 * 20 * 4, 0) };
    drawRing(
      img,
      [
        [2, 2],
        [17, 2],
        [17, 17],
        [2, 17],
      ],
      [163, 230, 53],
    );
    const at = (x: number, y: number) => img.data[(y * 20 + x) * 4 + 1];
    expect(at(10, 2)).toBe(230);
    expect(at(10, 10)).toBe(0);
  });
});

describe('proposition des zones par Claude (V-A, 07/10/2026)', () => {
  const service = Container.get(ZoneSuggestionService);
  let tile: jest.SpyInstance;
  let ask: jest.SpyInstance;
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    // Grey tiles: the IGN is not called.
    tile = jest.spyOn(service, 'fetchTile').mockResolvedValue({ width: 256, height: 256, data: Buffer.alloc(256 * 256 * 4, 128) });
    ask = jest.spyOn(service, 'ask');
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    tile.mockRestore();
    ask.mockRestore();
  });

  it('assemble la photo, interroge Claude et renvoie ses surfaces en zones coupées au contour et hors bâtiments', async () => {
    const { token, parking } = await setupOperator();
    const saved = await api()
      .patch(`/api/internal/parkings/${parking.id}/plan`)
      .set(auth(token))
      .send({
        outline: land,
        exclusions: [{ id: 'b', name: 'Bâtiment', kind: 'building', clearance: 0, geometry: building }],
        zones: [],
        settings: { zonesAuto: false },
      });
    expect(saved.status).toBe(200);
    expect(saved.body.data.plan.exclusions).toHaveLength(1);
    // Claude answers with the whole land plus a bit outside it, in the pixels of the stitched image.
    ask.mockImplementation(async (_img: string, _w: number, _h: number, _mpp: number, outlinePx: [number, number][]) => {
      const xs = outlinePx.map(p => p[0]);
      const ys = outlinePx.map(p => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      return {
        surfaces: [
          {
            points: [
              [x0 - 40, y0 - 40],
              [x1 + 40, y0 - 40],
              [x1 + 40, y1 + 40],
              [x0 - 40, y1 + 40],
            ],
            label: 'Cour en enrobé',
            surface: 'asphalt',
            confidence: 0.9,
          },
          {
            points: [
              [x0, y0],
              [x0 + 1, y0],
              [x0, y0 + 1],
            ],
            label: 'Trop petit',
            surface: 'other',
            confidence: 0.2,
          },
        ],
        usage: { inputTokens: 1200, outputTokens: 300 },
      };
    });
    const res = await api().post(`/api/internal/parkings/${parking.id}/plan/suggest-zones`).set(auth(token));
    expect(res.status).toBe(200);
    expect(tile).toHaveBeenCalled();
    expect(ask).toHaveBeenCalledTimes(1);
    const [image, width, height, mpp] = ask.mock.calls[0];
    expect(typeof image).toBe('string');
    expect(image.length).toBeGreaterThan(1000);
    expect(width % 256).toBe(0);
    expect(height % 256).toBe(0);
    expect(mpp).toBeCloseTo(0.21, 2);
    // The land is cut in two by the building: two zones, the surface outside the land dropped.
    expect(res.body.zones.map((z: { name: string }) => z.name)).toEqual(['Zone A', 'Zone B']);
    expect(res.body.surfaces).toHaveLength(2);
    expect(res.body.surfaces[0]).toMatchObject({ name: 'Zone A', label: 'Cour en enrobé', surface: 'asphalt', confidence: 0.9 });
    expect(res.body.surfaces[1]).toMatchObject({ name: 'Zone B', label: 'Cour en enrobé' });
    expect(res.body.surfaces[0].area).toBeGreaterThan(2000);
    expect(res.body.image).toMatchObject({ zoom: 19 });
    expect(res.body.usage).toEqual({ inputTokens: 1200, outputTokens: 300 });
    // Nothing is saved: the pro space applies the proposal itself.
    const plan = await prisma.parkingPlan.findUniqueOrThrow({ where: { parkingId: parking.id } });
    expect(plan.zones).toEqual([]);
  });

  it('refuse sans clé API, sans contour, et à un autre loueur', async () => {
    const { token, parking } = await setupOperator();
    expect((await api().post(`/api/internal/parkings/${parking.id}/plan/suggest-zones`).set(auth(token))).body.code).toBe('no_outline');
    delete process.env.ANTHROPIC_API_KEY;
    const off = await api().post(`/api/internal/parkings/${parking.id}/plan/suggest-zones`).set(auth(token));
    expect(off.status).toBe(409);
    expect(off.body.code).toBe('ai_unavailable');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const other = await setupOperator('B');
    expect((await api().post(`/api/internal/parkings/${parking.id}/plan/suggest-zones`).set(auth(other.token))).status).toBe(404);
    expect(ask).not.toHaveBeenCalled();
  });
});
