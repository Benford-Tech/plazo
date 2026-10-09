import { Container } from 'typedi';
import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ParkingService } from '@/services/parking.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = localDate(new Date(), 'Europe/Paris');
const day = (n: number) => addDays(today, n);
const square = (lon: number, lat: number, d = 0.00003): [number, number][] => [
  [lon, lat],
  [lon + d, lat],
  [lon + d, lat + d],
  [lon, lat + d],
  [lon, lat],
];
const spotsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    zoneId: 'z1',
    code: `A-01-${String(i + 1).padStart(2, '0')}`,
    row: 1,
    index: i + 1,
    geometry: square(5.08 + i * 0.00004, 45.72),
  }));
const booking = (plate: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${day(10)}T08:00`,
  returnAt: `${day(13)}T18:00`,
  passengers: 1,
  customerName: `Client ${plate}`,
  customerPhone: '06 12 34 56 78',
  plate,
  ...overrides,
});

/** A parking whose declared figure is `declared` (margin 0), with `spots` active spots on its plan. */
async function parking({ declared = 200, spots = 0, margin = 0, name = 'Parking Test' } = {}) {
  const op = await setupOperator(name);
  await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: declared, safetyMarginPct: margin } });
  if (spots) {
    const res = await api()
      .put(`/api/internal/parkings/${op.parking.id}/plan/spots`)
      .set(auth(op.token))
      .send({ layout: 'valet24', spots: spotsOf(spots) });
    if (res.status !== 200) throw new Error(`spots failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const book = (plate: string, overrides: Record<string, unknown> = {}) =>
    api().post('/api/internal/reservations').set(auth(op.token)).send(booking(plate, overrides));
  const putFiles = (files: { code: string; capacity: number; active?: boolean }[]) =>
    api().put(`/api/internal/parkings/${op.parking.id}/files`).set(auth(op.token)).send({ files });
  const read = async () => (await api().get('/api/internal/parking').set(auth(op.token))).body;
  return { ...op, book, putFiles, read };
}

describe('capacité = places du plan (09/10/2026)', () => {
  it('refuse la réservation de trop dès que les places actives du plan sont prises, quel que soit le chiffre déclaré', async () => {
    const big = await parking({ declared: 200, spots: 2 });
    expect((await big.book('AA-111-AA')).status).toBe(201);
    expect((await big.book('BB-222-BB')).status).toBe(201);
    const refused = await big.book('CC-333-CC');
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('overbooked');
    expect(refused.body.details.nights[0]).toMatchObject({ count: 2, bookable: 2, free: 0 });
    // Forcing is still possible, and flagged.
    const forced = await big.book('CC-333-CC', { force: true });
    expect(forced.status).toBe(201);
    expect(forced.body.data.overbooked).toBe(true);

    // A declared figure lower than the plan does not hold the bookings back either.
    const small = await parking({ declared: 1, spots: 3, name: 'Petit' });
    for (const plate of ['AA-111-AA', 'BB-222-BB', 'CC-333-CC']) expect((await small.book(plate)).status).toBe(201);
    expect((await small.book('DD-444-DD')).body.code).toBe('overbooked');
  });

  it('sans plan, le chiffre déclaré compte', async () => {
    const p = await parking({ declared: 1 });
    expect((await p.book('AA-111-AA')).status).toBe(201);
    expect((await p.book('BB-222-BB')).body.code).toBe('overbooked');
    expect(await p.read()).toMatchObject({
      totalCapacity: 1,
      declaredCapacity: 1,
      effectiveCapacity: 1,
      capacitySource: 'declared',
      bookableCapacity: 1,
    });
  });

  it('la capacité des files prime sur les places ; une file fermée ou une place inactive ne compte pas', async () => {
    const p = await parking({ declared: 200, spots: 3 });
    const put = await p.putFiles([{ code: 'F01', capacity: 2 }]);
    expect(put.status).toBe(200);
    expect(await p.read()).toMatchObject({ effectiveCapacity: 2, capacitySource: 'files', bookableCapacity: 2 });
    expect((await p.book('AA-111-AA')).status).toBe(201);
    expect((await p.book('BB-222-BB')).status).toBe(201);
    expect((await p.book('CC-333-CC')).body.code).toBe('overbooked');

    // The file closed: the three spots count again.
    expect((await p.putFiles([{ ...put.body.data[0], active: false }])).status).toBe(200);
    expect(await p.read()).toMatchObject({ effectiveCapacity: 3, capacitySource: 'spots' });
    expect((await p.book('CC-333-CC')).status).toBe(201);

    // One spot made inactive: two left, three cars already booked.
    const spot = await prisma.parkingSpot.findFirstOrThrow({ where: { parkingId: p.parking.id, code: 'A-01-03' } });
    expect(
      (await api().patch(`/api/internal/parkings/${p.parking.id}/plan/spots/${spot.id}`).set(auth(p.token)).send({ active: false })).status,
    ).toBe(200);
    expect(await p.read()).toMatchObject({ effectiveCapacity: 2, capacitySource: 'spots' });
    expect((await p.book('DD-444-DD')).body.code).toBe('overbooked');
  });

  it('GET /internal/parking : chiffre déclaré gardé, capacité retenue et réservable avec la marge', async () => {
    const p = await parking({ declared: 200, spots: 10, margin: 10 });
    expect(await p.read()).toMatchObject({
      totalCapacity: 200,
      declaredCapacity: 200,
      effectiveCapacity: 10,
      capacitySource: 'spots',
      bookableCapacity: 9,
    });
    // The settings still store the declared figure; the plan's keeps counting.
    const saved = await api()
      .patch(`/api/internal/parkings/${p.parking.id}`)
      .set(auth(p.token))
      .send({ name: 'P1', address: null, totalCapacity: 300, safetyMarginPct: 0, shuttleTravelMinutes: 10 });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ totalCapacity: 300, declaredCapacity: 300, effectiveCapacity: 10, bookableCapacity: 10 });
    // The plan view says the same.
    const plan = (await api().get(`/api/internal/parkings/${p.parking.id}/plan`).set(auth(p.token))).body;
    expect(plan).toMatchObject({ activeSpots: 10, totalCapacity: 300, effectiveCapacity: 10, capacitySource: 'spots' });
    // Older apps: "apply" still copies the spots into the declared figure.
    const applied = await api().post(`/api/internal/parkings/${p.parking.id}/plan/apply-capacity`).set(auth(p.token));
    expect(applied.body.data).toMatchObject({ totalCapacity: 10, effectiveCapacity: 10 });
  });

  it('l’aperçu du formulaire et le planning suivent le plan', async () => {
    const p = await parking({ declared: 200, spots: 1 });
    await p.book('AA-111-AA');
    const preview = await api()
      .get(`/api/internal/capacity?arrivalAt=${day(10)}T08:00&returnAt=${day(12)}T08:00`)
      .set(auth(p.token));
    expect(preview.body.fullNights).toEqual([day(10), day(11)]);
    const planning = await api()
      .get(`/api/internal/planning?date=${day(10)}`)
      .set(auth(p.token));
    expect(planning.body.parking.bookableCapacity).toBe(1);
    expect(planning.body.nights[0]).toMatchObject({ date: day(10), count: 1, bookable: 1, free: 0 });
  });

  it('le planning prend la capacité réservable avec ses nuits, marge comprise', async () => {
    const p = await parking({ declared: 200, spots: 10, margin: 10 });
    const planning = await api()
      .get(`/api/internal/planning?date=${day(10)}`)
      .set(auth(p.token));
    expect(planning.body.parking.bookableCapacity).toBe(9);
    expect(planning.body.nights.every((n: { bookable: number }) => n.bookable === 9)).toBe(true);
  });

  it('getPrimary rend la ligne seule, sans lire le plan ; getPrimaryWithCapacity y ajoute la capacité', async () => {
    const p = await parking({ declared: 200, spots: 3, margin: 10 });
    const actor = { ...p.manager, operatorName: 'Test' } as AuthenticatedStaff;
    const service = Container.get(ParkingService);
    const raw = jest.spyOn(prisma, '$queryRaw');
    try {
      const plain = await service.getPrimary(actor);
      expect(raw).not.toHaveBeenCalled();
      expect(plain).toMatchObject({ id: p.parking.id, totalCapacity: 200 });
      expect(plain).not.toHaveProperty('effectiveCapacity');
      expect(plain).not.toHaveProperty('bookableCapacity');
    } finally {
      raw.mockRestore();
    }
    expect(await service.getPrimaryWithCapacity(actor)).toMatchObject({
      declaredCapacity: 200,
      effectiveCapacity: 3,
      capacitySource: 'spots',
      bookableCapacity: 2,
    });
  });

  it('le tableau de bord lit la capacité partagée', async () => {
    const p = await parking({ declared: 200, spots: 4 });
    let dash = (await api().get('/api/internal/dashboard').set(auth(p.token))).body;
    expect(dash.parking).toMatchObject({ bookableCapacity: 4, plannedSpots: 4, storedInFiles: false });
    await p.putFiles([
      { code: 'F01', capacity: 3 },
      { code: 'F02', capacity: 3 },
    ]);
    dash = (await api().get('/api/internal/dashboard').set(auth(p.token))).body;
    expect(dash.parking).toMatchObject({ bookableCapacity: 6, plannedSpots: 6, storedInFiles: true });
    const bare = await parking({ declared: 120, name: 'Sans plan' });
    dash = (await api().get('/api/internal/dashboard').set(auth(bare.token))).body;
    expect(dash.parking).toMatchObject({ bookableCapacity: 120, plannedSpots: 0, storedInFiles: false });
    expect(dash.counts.freeSpots).toBeNull();
  });

  it('la recherche du site dit « complet » d’après le plan', async () => {
    const p = await parking({ declared: 200, spots: 1 });
    await api()
      .put('/api/internal/pricing')
      .set(auth(p.token))
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
    const listing = await api()
      .put('/api/internal/listing')
      .set(auth(p.token))
      .send({
        airportCode: 'LYS',
        slug: 'parking-plan',
        title: 'Parking Plan',
        services: ['shuttle'],
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    expect(listing.status).toBe(200);
    await publishListing(p.parking.id);
    const search = () => api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${day(10)}T09:00&returnAt=${day(12)}T17:00`);
    expect((await search()).body.results.map((r: { slug: string; available: boolean }) => [r.slug, r.available])).toEqual([['parking-plan', true]]);
    await p.book('AA-111-AA');
    expect((await search()).body.results.map((r: { slug: string; available: boolean }) => [r.slug, r.available])).toEqual([['parking-plan', false]]);
  });

  it('la plateforme compte les places du plan (loueurs et annonces)', async () => {
    const admin = await parking({ name: 'Plazo (tests)' });
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const p = await parking({ declared: 200, spots: 7, name: 'Loueur' });
    await api()
      .put('/api/internal/listing')
      .set(auth(p.token))
      .send({ airportCode: 'LYS', slug: 'parking-loueur', title: 'Parking Loueur', services: [], cancellationPolicy: 'free_24h', photos: [] });
    const operators = (await api().get('/api/internal/platform/operators').set(auth(admin.token))).body.operators;
    expect(operators.find((o: { id: string }) => o.id === p.operator.id)).toMatchObject({ parkings: 1, places: 7 });
    expect(operators.find((o: { id: string }) => o.id === admin.operator.id)).toMatchObject({ places: 200 });
    const listings = (await api().get('/api/internal/platform/listings').set(auth(admin.token))).body.listings;
    expect(listings[0].parking).toMatchObject({ totalCapacity: 200, effectiveCapacity: 7 });
  });
});
