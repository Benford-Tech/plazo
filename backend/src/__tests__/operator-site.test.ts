import { Container } from 'typedi';
import prisma from '@/database';
import { blocksOf, defaultBlocks, readBlocks, readRating, siteDestinations } from '@/domain/operator-site';
import { dnsRecordFor, dnsState, isApex, readDomain } from '@/domain/site-domain';
import { OperatorSiteService } from '@/services/operator-site.service';
import { SiteDomainHostService } from '@/services/site-domain-host.service';
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
      'destinations',
      'cta',
    ]);
    // The showcase blocks wait for the manager: no site changes by itself.
    expect(
      blocksOf(null)
        .filter(b => !b.enabled)
        .map(b => b.kind),
    ).toEqual(['destinations', 'cta']);
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

describe('le site vitrine à plusieurs pages (24/11/2026)', () => {
  const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);

  it('lit la note Google tapée et nomme les pages des destinations', () => {
    expect(readRating({ value: '4,8', count: 193 })).toEqual({ tenths: 48, count: 193 });
    expect(readRating({ value: 4.9 })).toEqual({ tenths: 49, count: null });
    expect(readRating(null)).toEqual({ tenths: null, count: null });
    expect(readRating({ value: 5.4 })).toEqual({ error: 'rating' });
    expect(readRating({ value: '', count: 12 })).toEqual({ error: 'rating' });
    expect(readRating({ value: 4, count: 0 })).toEqual({ error: 'ratingCount' });
    expect(
      siteDestinations('Lyon Saint-Exupéry', [
        { name: 'Gare TGV Saint-Exupéry', kind: 'station', instructions: ' Sortie Est ' },
        { name: 'Contact', kind: 'other' },
        { name: 'Gare TGV Saint-Exupéry', kind: 'station' },
      ]),
    ).toEqual([
      { slug: 'aeroport', kind: 'airport', name: 'Lyon Saint-Exupéry', instructions: null },
      { slug: 'gare-tgv-saint-exupery', kind: 'station', name: 'Gare TGV Saint-Exupéry', instructions: 'Sortie Est' },
    ]);
  });

  it('présentation, deuxième couleur, note, photo du bandeau et pages : le site public les rend', async () => {
    const op = await parkingWithListing();
    await api()
      .post('/api/internal/shuttle/stops')
      .set(auth(op.token))
      .send({ name: 'Gare TGV', kind: 'station', lat: 45.72, lng: 5.08, instructions: 'Devant le hall' });
    const refused = await api()
      .put('/api/internal/site')
      .set(auth(op.token))
      .send({ theme: 'neon', accent2: 'jaune', rating: { value: 9 } });
    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual({ theme: 'invalid', accent2: 'invalid', rating: 'invalid' });

    const saved = await api()
      .put('/api/internal/site')
      .set(auth(op.token))
      .send({ slug: 'cedres', theme: 'showcase', accent2: '#f2b705', rating: { value: '4,8', count: 193 }, pages: true, showLogo: true });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({
      theme: 'showcase',
      accent2: '#F2B705',
      rating: { value: 4.8, count: 193 },
      pages: true,
      showLogo: true,
      hasLogo: false,
      heroPhotoUrl: null,
    });

    expect(
      (await api().post('/api/internal/site/hero-photo').set(auth(op.token)).set('Content-Type', 'image/jpeg').send(Buffer.from('texte'))).body
        .fields,
    ).toEqual({
      photo: 'not_an_image',
    });
    const photo = await api().post('/api/internal/site/hero-photo').set(auth(op.token)).set('Content-Type', 'image/jpeg').send(JPEG);
    expect(photo.status).toBe(200);
    const heroUrl: string = photo.body.data.heroPhotoUrl;
    expect(heroUrl).toMatch(/^\/api\/public\/sites\/cedres\/hero\/[0-9a-f]{18}\.jpeg$/);
    const served = await api().get(heroUrl);
    expect(served.status).toBe(200);
    expect(served.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect((await api().get('/api/public/sites/cedres/hero/000000000000000000.jpeg')).status).toBe(404);
    // No logo uploaded: nothing to show, even switched on.
    expect((await api().get('/api/public/sites/cedres/logo')).status).toBe(404);

    const key = new URL(photo.body.data.previewUrl).searchParams.get('apercu')!;
    const site = (await api().get(`/api/public/sites/cedres?apercu=${key}`)).body;
    expect(site).toMatchObject({
      theme: 'showcase',
      accent2: '#F2B705',
      accent2Ink: '#1A1D1A',
      heroPhotoUrl: heroUrl,
      logoUrl: null,
      rating: { value: 4.8, count: 193 },
      pages: ['aeroport', 'gare-tgv', 'questions', 'contact', 'mentions-legales'],
    });
    expect(site.destinations).toEqual([
      { slug: 'aeroport', kind: 'airport', name: expect.any(String), instructions: null },
      { slug: 'gare-tgv', kind: 'station', name: 'Gare TGV', instructions: 'Devant le hall' },
    ]);

    // Cleared again: null takes the second colour and the rating away, the photo is removed.
    const cleared = await api().put('/api/internal/site').set(auth(op.token)).send({ accent2: null, rating: null, pages: false });
    expect(cleared.body.data).toMatchObject({ accent2: null, rating: null, pages: false, theme: 'showcase' });
    expect((await api().delete('/api/internal/site/hero-photo').set(auth(op.token))).body.data.heroPhotoUrl).toBeNull();
    expect((await api().get(heroUrl)).status).toBe(404);
    expect((await api().get(`/api/public/sites/cedres?apercu=${key}`)).body.pages).toEqual([]);
  });
});

describe('le nom de domaine du parking (22/11/2026)', () => {
  const hosts = Container.get(SiteDomainHostService);
  afterEach(() => jest.restoreAllMocks());

  it('lit un nom de domaine, donne l’enregistrement à créer et juge la réponse du DNS', () => {
    expect(readDomain(' https://WWW.Parking-des-Cedres.fr/accueil?x=1 ')).toBe('www.parking-des-cedres.fr');
    expect(readDomain('parking-des-cedres.fr.')).toBe('parking-des-cedres.fr');
    for (const bad of [
      'cedres',
      'www.plazo.fr',
      'plazo.fr',
      'x.vercel.app',
      '192.168.1.1',
      'parking des cedres.fr',
      '-x.fr',
      'parking-cèdres.fr',
      42,
    ]) {
      expect(readDomain(bad)).toBeNull();
    }
    expect(isApex('parking-des-cedres.fr')).toBe(true);
    expect(isApex('www.parking-des-cedres.fr')).toBe(false);
    expect(isApex('exemple.co.uk')).toBe(true);
    expect(dnsRecordFor('www.parking-des-cedres.fr')).toEqual({ type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' });
    expect(dnsRecordFor('parking-des-cedres.fr')).toEqual({ type: 'A', name: '@', value: '76.76.21.21' });
    expect(dnsRecordFor('reservation.exemple.co.uk')).toEqual({ type: 'CNAME', name: 'reservation', value: 'cname.vercel-dns.com' });
    expect(dnsState('www.x.fr', { cname: ['cname.vercel-dns.com.'], a: [] })).toBe('ok');
    expect(dnsState('x.fr', { cname: [], a: ['76.76.21.21'] })).toBe('ok');
    expect(dnsState('x.fr', { cname: [], a: [] })).toBe('dns_missing');
    expect(dnsState('www.x.fr', { cname: ['autre.exemple.net'], a: ['203.0.113.9'] })).toBe('dns_wrong');
  });

  it('sans l’option aussi : le gérant pose son domaine, Plazo suit les DNS, la plateforme le branche, le site y répond', async () => {
    const op = await parkingWithListing();
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const put = (domain: unknown) => api().put('/api/internal/site/domain').set(auth(op.token)).send({ domain });
    const dns = jest.spyOn(hosts, 'dns').mockResolvedValue('dns_missing');
    await api().put('/api/internal/site').set(auth(op.token)).send({ slug: 'cedres' });

    // Not part of the paid option (23/11/2026): set before the option is on.
    expect((await put('plazo.fr')).body.fields).toEqual({ domain: 'invalid' });

    const set = await put('https://www.Parking-des-Cedres.fr/');
    expect(set.body.data.domain).toMatchObject({
      name: 'www.parking-des-cedres.fr',
      record: { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
      active: false,
      issue: 'dns_missing',
      automatic: false,
    });
    // The site itself still needs the option to go online.
    await api().put(`/api/internal/platform/operators/${op.operator.id}/site`).set(auth(admin.token)).send({ active: true });
    await api().put('/api/internal/site').set(auth(op.token)).send({ published: true });
    expect((await api().get('/api/public/site-domains/www.parking-des-cedres.fr')).status).toBe(404);

    // The DNS is in place: without the hosting's token, the platform attaches the name and marks it.
    dns.mockResolvedValue('ok');
    const checked = await api().post('/api/internal/site/domain/check').set(auth(op.token));
    expect(checked.body.data.domain).toMatchObject({ active: false, issue: 'not_attached' });
    const overview = await api().get('/api/internal/platform/overview').set(auth(admin.token));
    expect((overview.body.data ?? overview.body).todos).toContainEqual(expect.objectContaining({ kind: 'site_domain', operatorId: op.operator.id }));
    const marked = await api().put(`/api/internal/platform/operators/${op.operator.id}/site/domain`).set(auth(admin.token)).send({ active: true });
    expect(marked.body.data.domain).toMatchObject({ active: true, issue: null });

    expect((await api().get('/api/public/site-domains/www.parking-des-cedres.fr')).body).toEqual({ slug: 'cedres', pages: [] });
    expect((await api().get('/api/public/sites/cedres')).body.domain).toBe('www.parking-des-cedres.fr');

    // Another parking cannot take it; removing it closes the host.
    const other = await parkingWithListing('Autre Parking', 'autre');
    await api().put(`/api/internal/platform/operators/${other.operator.id}/site`).set(auth(admin.token)).send({ active: true });
    expect((await api().put('/api/internal/site/domain').set(auth(other.token)).send({ domain: 'www.parking-des-cedres.fr' })).body.fields).toEqual({
      domain: 'taken',
    });
    expect((await put(null)).body.data.domain).toBeNull();
    expect((await api().get('/api/public/site-domains/www.parking-des-cedres.fr')).status).toBe(404);
  });

  it('avec le jeton de l’hébergeur : le nom s’active seul une fois ses DNS en place', async () => {
    const op = await parkingWithListing();
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    await api().put('/api/internal/site').set(auth(op.token)).send({ slug: 'cedres' });
    await api().put(`/api/internal/platform/operators/${op.operator.id}/site`).set(auth(admin.token)).send({ active: true });
    jest.spyOn(hosts, 'automatic', 'get').mockReturnValue(true);
    jest.spyOn(hosts, 'dns').mockResolvedValue('ok');
    const attach = jest.spyOn(hosts, 'attach').mockResolvedValue('not_attached');
    const set = await api().put('/api/internal/site/domain').set(auth(op.token)).send({ domain: 'parking-des-cedres.fr' });
    expect(set.body.data.domain).toMatchObject({ record: { type: 'A', name: '@' }, active: false, issue: 'not_attached', automatic: true });
    attach.mockResolvedValue('active');
    const checked = await api().post('/api/internal/site/domain/check').set(auth(op.token));
    expect(checked.body.data.domain).toMatchObject({ active: true, issue: null });
    expect(attach).toHaveBeenCalledWith('parking-des-cedres.fr');
  });
});
