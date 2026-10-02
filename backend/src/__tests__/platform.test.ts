import prisma from '@/database';
import { CAPACITY_LIMITS } from '@/domain/geojson';
import { api, login, resetDatabase, setupOperator } from './utils/helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const square = (lon: number, lat: number, d = 0.001) => ({
  type: 'Polygon',
  coordinates: [
    [
      [lon, lat],
      [lon + d, lat],
      [lon + d, lat + d],
      [lon, lat + d],
      [lon, lat],
    ],
  ],
});

let admin: { token: string; email: string };
let other: { token: string };

beforeEach(async () => {
  await resetDatabase();
  const a = await setupOperator('Plateforme');
  const b = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = ` autre@example.com , ${a.manager.email.toUpperCase()} `;
  admin = { token: a.token, email: a.manager.email };
  other = { token: b.token };
});

afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('accès à l’outil interne', () => {
  it('signale l’administrateur de la plateforme dans /me et à la connexion', async () => {
    expect((await api().get('/api/internal/staff/me').set(auth(admin.token))).body.isPlatformAdmin).toBe(true);
    expect((await api().get('/api/internal/staff/me').set(auth(other.token))).body.isPlatformAdmin).toBe(false);
    expect((await login(admin.email)).user.isPlatformAdmin).toBe(true);
  });

  it('refuse les routes de la plateforme aux autres (403) et aux anonymes (401)', async () => {
    const routes = [
      ['get', '/api/internal/platform/capacity-studies'],
      ['post', '/api/internal/platform/capacity-studies'],
      ['get', '/api/internal/platform/capacity-studies/x'],
      ['patch', '/api/internal/platform/capacity-studies/x'],
      ['delete', '/api/internal/platform/capacity-studies/x'],
      ['get', '/api/internal/platform/geo/parcels?lon=5&lat=45'],
      ['get', '/api/internal/platform/geo/parkings?bbox=5,45,5.01,45.01'],
      ['get', '/api/internal/platform/geo/geocode?q=Lyon'],
    ] as const;
    const fetchSpy = jest.spyOn(global, 'fetch');
    for (const [method, url] of routes) {
      const res = await api()[method](url).set(auth(other.token)).send({ name: 'x' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('forbidden');
      expect((await api()[method](url)).status).toBe(401);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sans PLATFORM_ADMIN_EMAILS, personne n’y a accès', async () => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    expect((await api().get('/api/internal/platform/capacity-studies').set(auth(admin.token))).status).toBe(403);
  });
});

describe('études de capacité', () => {
  it('crée, liste, enregistre, relit et supprime une étude', async () => {
    const created = await api()
      .post('/api/internal/platform/capacity-studies')
      .set(auth(admin.token))
      .send({ name: '  Terrain client n°1 — Colombier-Saugnieu ' });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    expect(created.body.data).toMatchObject({ name: 'Terrain client n°1 — Colombier-Saugnieu', outline: null, scaleFactor: 1, zones: [] });
    expect(created.body.data.createdBy.name).toBe('Gérant Test');

    const outline = square(5.08, 45.72);
    const patch = await api()
      .patch(`/api/internal/platform/capacity-studies/${id}`)
      .set(auth(admin.token))
      .send({
        outline,
        parcels: [{ id: '692990000E1033', section: '0E', numero: '1033' }],
        scaleFactor: 1.012,
        zones: [{ id: 'zone-a', name: 'Zone A', geometry: outline }],
        exclusions: [
          { id: 'tree-1', name: 'Arbre', kind: 'tree', clearance: 2, geometry: { type: 'Point', coordinates: [5.0805, 45.7205] } },
          {
            id: 'lane',
            name: 'Voie navette',
            kind: 'shuttle_lane',
            clearance: 3,
            geometry: {
              type: 'LineString',
              coordinates: [
                [5.08, 45.72],
                [5.081, 45.72],
              ],
            },
          },
        ],
        settings: { aisleWidth: 6 },
        results: { valet: 324 },
        carMarkers: [[5.0801, 45.7201]],
      });
    expect(patch.status).toBe(200);

    const list = await api().get('/api/internal/platform/capacity-studies').set(auth(admin.token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id, results: { valet: 324 } });
    expect(list.body[0]).not.toHaveProperty('zones');

    const read = await api().get(`/api/internal/platform/capacity-studies/${id}`).set(auth(admin.token));
    expect(read.body).toMatchObject({ outline, scaleFactor: 1.012, carMarkers: [[5.0801, 45.7201]] });
    expect(read.body.exclusions).toHaveLength(2);

    // null clears the outline, other fields stay as they were.
    const cleared = await api().patch(`/api/internal/platform/capacity-studies/${id}`).set(auth(admin.token)).send({ outline: null, zones: null });
    expect(cleared.body.data.outline).toBeNull();
    expect(cleared.body.data.zones).toHaveLength(1);

    expect((await api().delete(`/api/internal/platform/capacity-studies/${id}`).set(auth(admin.token))).status).toBe(204);
    expect((await api().get(`/api/internal/platform/capacity-studies/${id}`).set(auth(admin.token))).status).toBe(404);
  });

  it('valide les champs et limite la taille des données', async () => {
    const send = (body: object) => api().post('/api/internal/platform/capacity-studies').set(auth(admin.token)).send(body);
    expect((await send({ name: '' })).body.fields).toMatchObject({ name: 'required' });
    const tooManyVertices = {
      type: 'Polygon',
      coordinates: [[...Array.from({ length: CAPACITY_LIMITS.maxVertices + 1 }, (_, i) => [5 + i * 1e-6, 45]), [5, 45]]],
    };
    const bad = await send({
      name: 'x'.repeat(121),
      outline: tooManyVertices,
      scaleFactor: 3,
      zones: [{ id: 'a', name: 'A', geometry: { type: 'Polygon', coordinates: [[[5, 45]]] } }],
      exclusions: [{ id: 'b', name: 'B', kind: 'volcano', clearance: 1, geometry: { type: 'Point', coordinates: [5, 45] } }],
      carMarkers: Array.from({ length: CAPACITY_LIMITS.maxCarMarkers + 1 }, () => [5, 45]),
      settings: { blob: 'x'.repeat(CAPACITY_LIMITS.maxSettingsBytes) },
      parcels: 'ZK 112',
    });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({
      name: 'too_long',
      outline: 'too_many_vertices',
      scaleFactor: 'scale_range',
      zones: 'invalid_geometry',
      exclusions: 'invalid_item',
      carMarkers: 'too_many_items',
      settings: 'too_large',
      parcels: 'invalid_item',
    });
    const outOfRange = await send({ name: 'x', outline: square(200, 45) });
    expect(outOfRange.body.fields).toEqual({ outline: 'invalid_geometry' });
    const tooManyZones = await send({
      name: 'x',
      zones: Array.from({ length: CAPACITY_LIMITS.maxZones + 1 }, (_, i) => ({ id: `z${i}`, name: 'Z', geometry: square(5, 45) })),
    });
    expect(tooManyZones.body.fields).toEqual({ zones: 'too_many_items' });
  });
});

describe('services IGN relayés', () => {
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  it('renvoie les parcelles cadastrales au point cliqué', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [5.07, 45.72],
                    [5.08, 45.72],
                    [5.08, 45.73],
                    [5.07, 45.72],
                  ],
                ],
              ],
            },
            properties: {
              idu: '692990000E1033',
              section: '0E',
              numero: '1033',
              nom_com: 'Colombier-Saugnieu',
              code_insee: '69299',
              contenance: 7450,
            },
          },
        ],
      }),
    );
    const res = await api().get('/api/internal/platform/geo/parcels?lon=5.078&lat=45.722').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.parcels[0]).toMatchObject({
      id: '692990000E1033',
      section: '0E',
      numero: '1033',
      commune: 'Colombier-Saugnieu',
      contenance: 7450,
    });
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url.startsWith('https://apicarto.ign.fr/api/cadastre/parcelle?geom=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('{"type":"Point","coordinates":[5.078,45.722]}');
    expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
  });

  it('renvoie les parkings BD TOPO de la vue, sans altitude', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        features: [
          {
            id: 'equipement_de_transport.1',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [5.07, 45.72, -1000],
                    [5.08, 45.72, -1000],
                    [5.08, 45.73, -1000],
                    [5.07, 45.72, -1000],
                  ],
                ],
              ],
            },
            properties: { cleabs: 'EQ1', nature: 'Parking', toponyme: null },
          },
        ],
      }),
    );
    const res = await api().get('/api/internal/platform/geo/parkings?bbox=5.07,45.715,5.09,45.73').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.parkings[0]).toMatchObject({ id: 'EQ1', geometry: { type: 'MultiPolygon' } });
    expect(res.body.parkings[0].geometry.coordinates[0][0][0]).toEqual([5.07, 45.72]);
    const url = decodeURIComponent(String(fetchSpy.mock.calls[0][0]).replace(/\+/g, ' '));
    expect(url).toContain("nature='Parking' AND BBOX(geometrie,5.07,45.715,5.09,45.73,'EPSG:4326')");
    expect(url).toContain('TYPENAMES=BDTOPO_V3:equipement_de_transport');

    const tooLarge = await api().get('/api/internal/platform/geo/parkings?bbox=5,45,5.5,45.5').set(auth(admin.token));
    expect(tooLarge.body.fields).toEqual({ bbox: 'bbox_too_large' });
    const invalid = await api().get('/api/internal/platform/geo/parkings?bbox=5,45,abc,45.01').set(auth(admin.token));
    expect(invalid.body.fields).toEqual({ bbox: 'invalid_bbox' });
  });

  it('cherche une adresse et signale les pannes du service', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        features: [{ geometry: { type: 'Point', coordinates: [5.103, 45.7216] }, properties: { label: 'Colombier-Saugnieu', type: 'municipality' } }],
      }),
    );
    const ok = await api().get('/api/internal/platform/geo/geocode?q=Colombier').set(auth(admin.token));
    expect(ok.body.results).toEqual([{ label: 'Colombier-Saugnieu', type: 'municipality', lon: 5.103, lat: 45.7216 }]);

    jest.spyOn(global, 'fetch').mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 503));
    const down = await api().get('/api/internal/platform/geo/geocode?q=Colombier').set(auth(admin.token));
    expect(down.status).toBe(502);
    expect(down.body.code).toBe('geo_unavailable');

    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(timeout);
    const slow = await api().get('/api/internal/platform/geo/parcels?lon=5&lat=45').set(auth(admin.token));
    expect(slow.status).toBe(504);
    expect(slow.body.code).toBe('geo_timeout');

    expect((await api().get('/api/internal/platform/geo/geocode?q=a').set(auth(admin.token))).body.fields).toEqual({ q: 'too_short' });
    expect((await api().get('/api/internal/platform/geo/parcels?lon=abc&lat=95').set(auth(admin.token))).body.fields).toEqual({
      lon: 'invalid_coordinate',
      lat: 'invalid_coordinate',
    });
  });
});
