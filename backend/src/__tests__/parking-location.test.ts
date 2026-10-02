import { Container } from 'typedi';
import prisma from '@/database';
import { ParkingLocationService } from '@/services/parking-location.service';
import { api, resetDatabase, setupOperator, publishListing } from './utils/helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const geocoded = (lng: number, lat: number, score = 0.9) =>
  jsonResponse({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { label: 'x', score } }],
  });

const ADDRESS = '12 rue des Pistes, 69125 Colombier-Saugnieu';
const listing = {
  airportCode: 'LYS',
  slug: 'parking-carte',
  title: 'Parking Carte',
  services: ['shuttle'],
  shuttleMinutes: 8,
  distanceKm: 3,
  cancellationPolicy: 'free_24h',
  photos: [],
};
const grid = { tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 };
const future = (days: number, time: string) => `${new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)}T${time}`;

let fetchSpy: jest.SpyInstance;

beforeEach(async () => {
  await resetDatabase();
  Container.get(ParkingLocationService).resetFailures();
  fetchSpy = jest.spyOn(global, 'fetch');
});
afterEach(() => fetchSpy.mockRestore());
afterAll(() => prisma.$disconnect());

/** A published parking; with an address set directly in the database (no geocoding on the way). */
async function published(address: string | null = null) {
  const op = await setupOperator('Carte');
  await prisma.parking.update({ where: { id: op.parking.id }, data: { address } });
  fetchSpy.mockResolvedValue(jsonResponse({ features: [] }));
  await api().put('/api/internal/pricing').set(auth(op.token)).send(grid);
  const res = await api().put('/api/internal/listing').set(auth(op.token)).send(listing);
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  await publishListing(op.parking.id);
  await prisma.$executeRaw`UPDATE parkings SET location = NULL WHERE id = ${op.parking.id}`;
  Container.get(ParkingLocationService).resetFailures();
  fetchSpy.mockReset();
  return op;
}

async function storedLocation(parkingId: string) {
  const rows = await prisma.$queryRaw<{ lat: number | null; lng: number | null }[]>`
    SELECT ST_Y(location) AS lat, ST_X(location) AS lng FROM parkings WHERE id = ${parkingId}`;
  return rows[0]?.lat == null ? null : { lat: Number(rows[0].lat), lng: Number(rows[0].lng) };
}

describe('position des parkings pour la carte du site', () => {
  it('donne la position de l’aéroport et null pour un parking sans adresse, sans appeler le géocodeur', async () => {
    await published(null);
    const res = await api()
      .get('/api/public/search')
      .query({ airport: 'lyon-saint-exupery', arrivalAt: future(3, '08:00'), returnAt: future(6, '18:00') });
    expect(res.status).toBe(200);
    expect(res.body.airport.location).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(res.body.results[0].location).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('géocode l’adresse à l’enregistrement de la fiche et la garde', async () => {
    const op = await setupOperator('Carte');
    await prisma.parking.update({ where: { id: op.parking.id }, data: { address: ADDRESS } });
    await api().put('/api/internal/pricing').set(auth(op.token)).send(grid);
    fetchSpy.mockResolvedValue(geocoded(5.0702, 45.7311));
    expect((await api().put('/api/internal/listing').set(auth(op.token)).send(listing)).status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://data.geopf.fr/geocodage/search');
    expect(url.searchParams.get('q')).toBe(ADDRESS);
    expect(url.searchParams.get('limit')).toBe('1');
    expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
    expect(await storedLocation(op.parking.id)).toEqual({ lat: 45.7311, lng: 5.0702 });

    // Saved again: the stored position is reused.
    expect((await api().put('/api/internal/listing').set(auth(op.token)).send(listing)).status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await publishListing(op.parking.id);
    const page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-carte');
    expect(page.body.parking.location).toEqual({ lat: 45.7311, lng: 5.0702 });
    expect(page.body.airport.location).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
  });

  it('géocode une seule fois, à la première lecture, un parking qui a une adresse mais pas de position', async () => {
    const op = await published(ADDRESS);
    fetchSpy.mockResolvedValue(geocoded(5.07, 45.73));
    const first = await api().get('/api/public/airports/lyon-saint-exupery');
    expect(first.status).toBe(200);
    expect(first.body.listings[0].location).toEqual({ lat: 45.73, lng: 5.07 });
    expect(first.body.airport.location).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(await storedLocation(op.parking.id)).toEqual({ lat: 45.73, lng: 5.07 });
    const search = await api()
      .get('/api/public/search')
      .query({ airport: 'lyon-saint-exupery', arrivalAt: future(3, '08:00'), returnAt: future(6, '18:00') });
    expect(search.body.results[0].location).toEqual({ lat: 45.73, lng: 5.07 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('ignore une panne du géocodeur (page servie sans position) et ne la retente pas aussitôt', async () => {
    await published(ADDRESS);
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    fetchSpy.mockRejectedValue(timeout);
    const res = await api().get('/api/public/airports/lyon-saint-exupery');
    expect(res.status).toBe(200);
    expect(res.body.listings[0].location).toBeNull();
    await api().get('/api/public/airports/lyon-saint-exupery');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('écarte une réponse douteuse ou invalide du géocodeur', async () => {
    const op = await published(ADDRESS);
    const locations = Container.get(ParkingLocationService);
    fetchSpy.mockResolvedValueOnce(geocoded(5.07, 45.73, 0.1));
    expect(await locations.locate({ id: op.parking.id, address: ADDRESS }, 1000)).toBeNull();
    locations.resetFailures();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 503));
    expect(await locations.locate({ id: op.parking.id, address: ADDRESS }, 1000)).toBeNull();
    locations.resetFailures();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ features: [{ geometry: { type: 'Point', coordinates: ['x', 95] }, properties: { score: 1 } }] }));
    expect(await locations.locate({ id: op.parking.id, address: ADDRESS }, 1000)).toBeNull();
    expect(await storedLocation(op.parking.id)).toBeNull();
  });

  it('recalcule la position quand l’adresse du parking change', async () => {
    const op = await published(ADDRESS);
    await prisma.$executeRaw`UPDATE parkings SET location = ST_SetSRID(ST_MakePoint(5.0, 45.0), 4326) WHERE id = ${op.parking.id}`;
    const settings = { name: 'Carte LYS', totalCapacity: 200, safetyMarginPct: 0, shuttleTravelMinutes: 8 };

    // Same address: the position stays, nothing is looked up.
    await api()
      .patch(`/api/internal/parkings/${op.parking.id}`)
      .set(auth(op.token))
      .send({ ...settings, address: ADDRESS });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await storedLocation(op.parking.id)).toEqual({ lat: 45, lng: 5 });

    fetchSpy.mockResolvedValue(geocoded(5.08, 45.74));
    const res = await api()
      .patch(`/api/internal/parkings/${op.parking.id}`)
      .set(auth(op.token))
      .send({ ...settings, address: '1 avenue Nouvelle, 69125 Colombier-Saugnieu' });
    expect(res.status).toBe(200);
    expect(await storedLocation(op.parking.id)).toEqual({ lat: 45.74, lng: 5.08 });

    // Address removed: no position any more.
    await api()
      .patch(`/api/internal/parkings/${op.parking.id}`)
      .set(auth(op.token))
      .send({ ...settings, address: null });
    expect(await storedLocation(op.parking.id)).toBeNull();
  });
});
