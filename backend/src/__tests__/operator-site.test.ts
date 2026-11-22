import { Container } from 'typedi';
import prisma from '@/database';
import { blocksOf, defaultBlocks, readBlocks } from '@/domain/operator-site';
import { OperatorSiteService } from '@/services/operator-site.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

// 22/11/2026 (« pouvoir créer un site dédié au parking », « le plus modulaire possible », « le site est en supplément »).

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const service = Container.get(OperatorSiteService);

async function parkingWithListing(name = 'Parking Fictif', slug = 'parking-fictif') {
  const op = await setupOperator(name);
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({ tiers: [{ days: 3, priceCents: 3499 }], extraDayPriceCents: 600 });
  const res = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({ airportCode: 'LYS', slug, title: 'Parking des Cèdres', services: ['shuttle'], cancellationPolicy: 'free_24h', photos: [] });
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  await publishListing(op.parking.id);
  return op;
}

beforeEach(async () => {
  await resetDatabase();
  service.settings.siteUrl = 'https://site.example';
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

describe('les blocs', () => {
  it('par défaut : tous les blocs Plazo, « Réserver » en tête', () => {
    expect(defaultBlocks()[0]).toEqual({ id: 'booking', kind: 'booking', enabled: true, title: null, text: null });
    expect(blocksOf(null).map(b => b.kind)).toEqual([
      'booking',
      'highlights',
      'steps',
      'pricing',
      'photos',
      'access',
      'services',
      'conditions',
      'faq',
      'contact',
    ]);
    expect(blocksOf('n’importe quoi')).toEqual(defaultBlocks());
  });

  it('ordre, titres et textes libres gardés ; un bloc oublié revient éteint à la fin ; « Réserver » ne s’éteint pas', () => {
    const read = readBlocks([
      { kind: 'text', title: '  Depuis  2014 ', text: 'Une  affaire de famille.\n\n\n\nÀ Colombier.' },
      { kind: 'booking', enabled: false, title: 'Réservez votre place' },
      { kind: 'faq', enabled: false },
    ]);
    if (!('blocks' in read)) throw new Error(read.error);
    expect(read.blocks.slice(0, 3)).toEqual([
      { id: 'text-1', kind: 'text', enabled: true, title: 'Depuis 2014', text: 'Une affaire de famille.\n\nÀ Colombier.' },
      { id: 'booking', kind: 'booking', enabled: true, title: 'Réservez votre place', text: null },
      { id: 'faq', kind: 'faq', enabled: false, title: null, text: null },
    ]);
    expect(read.blocks.find(b => b.kind === 'pricing')).toMatchObject({ enabled: false });
  });

  it('refuse un genre inconnu, un doublon, un texte vide et un site sans « Réserver »', () => {
    expect(readBlocks([{ kind: 'booking' }, { kind: 'carrousel' }])).toEqual({ error: 'invalid_kind' });
    expect(readBlocks([{ kind: 'booking' }, { kind: 'faq' }, { kind: 'faq' }])).toEqual({ error: 'duplicate' });
    expect(readBlocks([{ kind: 'booking' }, { kind: 'text', text: '  ' }])).toEqual({ error: 'text_required' });
    expect(readBlocks([{ kind: 'faq' }])).toEqual({ error: 'booking_required' });
    expect(readBlocks('x')).toEqual({ error: 'invalid' });
  });
});

describe('Mon site', () => {
  it('le gérant range ses blocs et voit l’aperçu ; en ligne seulement avec le supplément', async () => {
    const op = await parkingWithListing();
    const first = await api().get('/api/internal/site').set(auth(op.token));
    expect(first.body.data).toMatchObject({
      slug: 'parking-des-cedres',
      saved: false,
      published: false,
      listingOnline: true,
      previewUrl: null,
      addon: { active: false, requestedAt: null, priceCents: 2900 },
    });

    const blocks = [{ kind: 'pricing', title: 'Nos tarifs' }, { kind: 'booking' }, { kind: 'text', text: 'Bienvenue chez nous.' }];
    const saved = await api().put('/api/internal/site').set(auth(op.token)).send({ blocks, slug: 'Cèdres Lyon', accent: '#0e5fa8' });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ slug: 'cedres-lyon', saved: true, accent: '#0E5FA8', url: 'https://site.example/s/cedres-lyon' });
    expect(saved.body.data.blocks.slice(0, 3).map((b: { kind: string }) => b.kind)).toEqual(['pricing', 'booking', 'text']);

    // Offline: the address answers 404, the manager's preview key opens it.
    expect((await api().get('/api/public/sites/cedres-lyon')).status).toBe(404);
    const key = new URL(saved.body.data.previewUrl).searchParams.get('apercu')!;
    expect((await api().get('/api/public/sites/cedres-lyon?apercu=faux')).status).toBe(404);
    const preview = await api().get(`/api/public/sites/cedres-lyon?apercu=${key}`);
    expect(preview.body).toMatchObject({
      title: 'Parking des Cèdres',
      airport: 'lyon-saint-exupery',
      parking: 'parking-fictif',
      preview: true,
      bookable: false,
    });
    expect(preview.body.blocks.map((b: { kind: string }) => b.kind)).toEqual(['pricing', 'booking', 'text']);
    expect(preview.headers['cache-control']).toBe('no-store');

    // Publishing needs the extra.
    const refused = await api().put('/api/internal/site').set(auth(op.token)).send({ published: true });
    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual({ published: 'addon_required' });
    expect(
      (
        await api()
          .put('/api/internal/site')
          .set(auth(op.token))
          .send({ blocks: [{ kind: 'faq' }] })
      ).body.fields,
    ).toEqual({ blocks: 'booking_required' });
  });

  it('demande du supplément, activation par la plateforme, mise en ligne, puis coupure', async () => {
    const op = await parkingWithListing();
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    await api().put('/api/internal/site').set(auth(op.token)).send({ slug: 'cedres' });

    const asked = await api().post('/api/internal/site/request').set(auth(op.token));
    expect(asked.body.data.addon.requestedAt).not.toBeNull();
    const overview = await api().get('/api/internal/platform/overview').set(auth(admin.token));
    expect((overview.body.data ?? overview.body).todos).toContainEqual(
      expect.objectContaining({ kind: 'site_requested', operatorId: op.operator.id }),
    );

    // Only the platform switches it on.
    expect((await api().put(`/api/internal/platform/operators/${op.operator.id}/site`).set(auth(op.token)).send({ active: true })).status).toBe(403);
    const on = await api().put(`/api/internal/platform/operators/${op.operator.id}/site`).set(auth(admin.token)).send({ active: true });
    expect(on.body.data).toMatchObject({ addon: { active: true, requestedAt: null }, published: false });

    const online = await api().put('/api/internal/site').set(auth(op.token)).send({ published: true });
    expect(online.body.data.published).toBe(true);
    const site = await api().get('/api/public/sites/cedres');
    expect(site.body).toMatchObject({ slug: 'cedres', preview: false, bookable: true });
    expect(site.headers['cache-control']).toBe('public, max-age=60');
    // The booking page is open with it: the « Réserver » block books.
    expect((await api().get('/api/public/booking-pages/cedres')).status).toBe(200);

    const off = await api().put(`/api/internal/platform/operators/${op.operator.id}/site`).set(auth(admin.token)).send({ active: false });
    expect(off.body.data).toMatchObject({ addon: { active: false }, published: false });
    expect((await api().get('/api/public/sites/cedres')).status).toBe(404);
  });

  it('un autre loueur ne prend pas la même adresse, ni une adresse réservée', async () => {
    const op = await parkingWithListing();
    await api().put('/api/internal/site').set(auth(op.token)).send({ slug: 'cedres' });
    const other = await parkingWithListing('Autre Parking', 'autre');
    expect((await api().put('/api/internal/site').set(auth(other.token)).send({ slug: 'cedres' })).body.fields).toEqual({ slug: 'taken' });
    expect((await api().put('/api/internal/site').set(auth(other.token)).send({ slug: 'api' })).body.fields).toEqual({ slug: 'reserved' });
  });
});
