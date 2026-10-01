import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const listing = (overrides: Record<string, unknown> = {}) => ({
  airportCode: 'LYS',
  slug: 'parking-demo',
  title: 'Parking Démo LYS',
  description: 'Parking extérieur clôturé, navette gratuite.',
  services: ['shuttle', 'open_24h', 'fenced'],
  shuttleMinutes: 8,
  distanceKm: 4.5,
  openingHours: '24h/24',
  cancellationPolicy: 'free_24h',
  photos: ['https://example.com/photo-1.jpg'],
  published: false,
  ...overrides,
});
const grid = {
  tiers: [
    { days: 1, priceCents: 1500 },
    { days: 3, priceCents: 3499 },
    { days: 7, priceCents: 5900 },
  ],
  extraDayPriceCents: 600,
};

// Dates in the future so the public API accepts them.
const future = (days: number, time: string) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.toISOString().slice(0, 10)}T${time}`;
};

async function publishedOperator(name: string, slug: string, gridOverride = grid) {
  const op = await setupOperator(name);
  await api().put('/internal/pricing').set(auth(op.token)).send(gridOverride);
  const res = await api()
    .put('/internal/listing')
    .set(auth(op.token))
    .send(listing({ slug, title: name, published: true }));
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  return op;
}

describe('fiche Plazo du loueur', () => {
  it('se crée, se relit et se trace', async () => {
    const { token } = await setupOperator();
    expect((await api().get('/internal/listing').set(auth(token))).body.listing).toBeNull();
    const res = await api().put('/internal/listing').set(auth(token)).send(listing());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'parking-demo', published: false, airport: { code: 'LYS' } });
    expect((await api().get('/internal/listing').set(auth(token))).body.listing.title).toBe('Parking Démo LYS');
    expect(await prisma.auditLog.count({ where: { action: 'listing.updated' } })).toBe(1);
  });

  it('ne se publie pas sans grille tarifaire', async () => {
    const { token } = await setupOperator();
    const res = await api()
      .put('/internal/listing')
      .set(auth(token))
      .send(listing({ published: true }));
    expect(res.body.code).toBe('pricing_required');
  });

  it('refuse une adresse déjà prise à cet aéroport, un aéroport inconnu et les champs invalides', async () => {
    await publishedOperator('A', 'parking-demo');
    const b = await setupOperator('B');
    expect((await api().put('/internal/listing').set(auth(b.token)).send(listing())).body.fields).toEqual({ slug: 'slug_taken' });
    expect(
      (
        await api()
          .put('/internal/listing')
          .set(auth(b.token))
          .send(listing({ slug: 'autre', airportCode: 'XXX' }))
      ).body.fields,
    ).toEqual({
      airportCode: 'unknown_airport',
    });
    const bad = await api()
      .put('/internal/listing')
      .set(auth(b.token))
      .send(listing({ slug: 'Pas Bon', services: ['jacuzzi'], photos: ['http://insecure.example.com/a.jpg'] }));
    expect(bad.body.fields).toMatchObject({ slug: 'invalid_slug', services: 'invalid_service', photos: 'invalid_url' });
  });

  it('est réservée au gérant', async () => {
    const { token } = await setupOperator();
    const agent = await addStaff(token, 'agent');
    expect((await api().put('/internal/listing').set(auth(agent.token)).send(listing())).status).toBe(403);
    expect((await api().put('/internal/pricing').set(auth(agent.token)).send(grid)).status).toBe(403);
    expect((await api().get('/internal/pricing').set(auth(agent.token))).status).toBe(200);
  });
});

describe('grille tarifaire', () => {
  it('remplace la grille entière', async () => {
    const { token } = await setupOperator();
    await api().put('/internal/pricing').set(auth(token)).send(grid);
    const res = await api()
      .put('/internal/pricing')
      .set(auth(token))
      .send({ tiers: [{ days: 2, priceCents: 2500 }], extraDayPriceCents: null });
    expect(res.body.data).toEqual({ tiers: [{ days: 2, priceCents: 2500 }], extraDayPriceCents: null });
  });

  it('refuse les doublons et les valeurs absurdes', async () => {
    const { token } = await setupOperator();
    const dup = await api()
      .put('/internal/pricing')
      .set(auth(token))
      .send({
        tiers: [
          { days: 2, priceCents: 1 },
          { days: 2, priceCents: 2 },
        ],
      });
    expect(dup.body.fields).toEqual({ tiers: 'duplicate_days' });
    expect(
      (
        await api()
          .put('/internal/pricing')
          .set(auth(token))
          .send({ tiers: [{ days: 0, priceCents: -5 }] })
      ).status,
    ).toBe(400);
  });
});

describe('API publique', () => {
  it('liste les parkings publiés d’un aéroport avec leur prix de départ, et rien de privé', async () => {
    await publishedOperator('Parking A', 'parking-a');
    const hidden = await setupOperator('Caché');
    await api()
      .put('/internal/listing')
      .set(auth(hidden.token))
      .send(listing({ slug: 'cache' }));
    const res = await api().get('/public/airports/lyon-saint-exupery');
    expect(res.status).toBe(200);
    expect(res.body.airport).toMatchObject({ code: 'LYS', name: 'Lyon Saint-Exupéry' });
    expect(res.body.listings).toEqual([expect.objectContaining({ slug: 'parking-a', fromPriceCents: 1500, shuttleMinutes: 8 })]);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/operatorId|parkingId|totalCapacity|email/);
  });

  it('cherche par séjour : prix total, disponibles d’abord puis les moins chers', async () => {
    await publishedOperator('Cher', 'cher', { tiers: [{ days: 7, priceCents: 9000 }], extraDayPriceCents: 1000 });
    await publishedOperator('Malin', 'malin');
    const full = await publishedOperator('Plein', 'plein');
    await prisma.parking.updateMany({ where: { operatorId: full.operator.id }, data: { totalCapacity: 1 } });
    await api()
      .post('/internal/reservations')
      .set(auth(full.token))
      .send({
        channel: 'phone',
        arrivalAt: future(10, '06:00'),
        returnAt: future(13, '10:00'),
        passengers: 1,
        customerName: 'X',
        customerPhone: '0600000000',
        plate: 'AB123CD',
      });

    const res = await api().get(`/public/search?airport=lyon-saint-exupery&arrivalAt=${future(10, '08:30')}&returnAt=${future(12, '17:00')}`);
    expect(res.status).toBe(200);
    expect(res.body.results.map((r: any) => [r.slug, r.available, r.priceCents, r.days])).toEqual([
      ['malin', true, 3499, 3],
      ['cher', true, 9000, 3],
      ['plein', false, 3499, 3],
    ]);
  });

  it('valide les dates de recherche', async () => {
    const past = await api().get('/public/search?airport=lyon-saint-exupery&arrivalAt=2020-01-01T08:00&returnAt=2020-01-03T08:00');
    expect(past.body.fields).toEqual({ arrivalAt: 'arrival_in_past' });
    const missing = await api().get('/public/search?airport=lyon-saint-exupery');
    expect(missing.status).toBe(400);
    expect((await api().get('/public/search?airport=inconnu&arrivalAt=x&returnAt=y')).status).toBe(404);
  });

  it('donne la fiche d’un parking publié, avec l’offre si on passe des dates', async () => {
    await publishedOperator('Parking A', 'parking-a');
    const res = await api().get(
      `/public/airports/lyon-saint-exupery/parkings/parking-a?arrivalAt=${future(5, '08:00')}&returnAt=${future(20, '08:00')}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.parking).toMatchObject({ title: 'Parking A', photos: ['https://example.com/photo-1.jpg'], cancellationPolicy: 'free_24h' });
    expect(res.body.offer).toEqual({ available: true, days: 16, priceCents: 5900 + 9 * 600 });
    expect((await api().get('/public/airports/lyon-saint-exupery/parkings/inexistant')).status).toBe(404);
  });
});
