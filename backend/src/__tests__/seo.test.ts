import { generateKeyPairSync } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { cleanAcquisition, cleanLanding } from '@/domain/acquisition';
import { readRows, weightedPosition } from '@/domain/search-console';
import { NotificationService } from '@/services/notification.service';
import { SeoService } from '@/services/seo.service';
import {
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
} from './utils/helpers';

// SEO local, measurement (06/11/2026, A + M2): visits, the origin of the bookings, Search Console. fetch is mocked.

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const SITE = { 'x-plazo-site-key': 'test-site-key' };

describe('domain', () => {
  it('keeps a path of the site, never the pro space, the API or a reference', () => {
    expect(cleanLanding('/lyon-saint-exupery/guide/parking-pas-cher/?utm_source=x#top')).toBe('/lyon-saint-exupery/guide/parking-pas-cher');
    expect(cleanLanding('/')).toBe('/');
    expect(cleanLanding('/pro/plateforme')).toBeNull();
    expect(cleanLanding('/api/public/bookings')).toBeNull();
    expect(cleanLanding('//evil.example/x')).toBeNull();
    expect(cleanLanding('https://www.plazo.fr/')).toBeNull();
    expect(cleanLanding('/ma-reservation/R7KQ2M')).toBe('/ma-reservation');
  });

  it('checks the origin the site sends; « app » only from the API itself', () => {
    expect(cleanAcquisition({ source: 'search', detail: 'Google', landing: '/' })).toEqual({ source: 'search', detail: 'google', landing: '/' });
    expect(cleanAcquisition({ source: 'referral', detail: 'a b c', landing: '/x' })).toEqual({ source: 'referral', detail: '', landing: '/x' });
    expect(cleanAcquisition({ source: 'app' })).toBeNull();
    expect(cleanAcquisition({ source: 'hacker' })).toBeNull();
    expect(cleanAcquisition('search')).toBeNull();
  });

  it('reads Search Console rows as paths, the position weighted by impressions', () => {
    const rows = readRows({
      rows: [
        { keys: ['2026-11-01', 'parking aéroport lyon', 'https://www.plazo.fr/'], clicks: 4, impressions: 100, position: 8 },
        {
          keys: ['2026-11-01', 'parking lyon pas cher', 'https://www.plazo.fr/lyon-saint-exupery/guide/parking-pas-cher'],
          clicks: 1,
          impressions: 50,
          position: 14,
        },
        { keys: ['bad'] },
      ],
    });
    expect(rows.map(r => r.page)).toEqual(['/', '/lyon-saint-exupery/guide/parking-pas-cher']);
    expect(weightedPosition(rows)).toBeCloseTo(10, 5);
    expect(weightedPosition([])).toBeNull();
  });
});

describe('visits and bookings', () => {
  let stripe: ReturnType<typeof enableFakePayments>;
  beforeEach(async () => {
    await resetDatabase();
    Container.get(NotificationService).settings.apiKey = '';
    stripe = enableFakePayments();
    jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
  });
  afterEach(() => {
    jest.restoreAllMocks();
    disableFakePayments();
    delete process.env.PLATFORM_ADMIN_EMAILS;
    delete process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS;
  });
  afterAll(() => prisma.$disconnect());

  async function listing() {
    const op = await setupOperator();
    await onboardOperator(op.operator.id);
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
    await api()
      .put('/api/internal/listing')
      .set(auth(op.token))
      .send({
        airportCode: 'LYS',
        slug: `parking-${op.parking.id}`,
        title: 'Parking LYS',
        services: ['shuttle'],
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    await publishListing(op.parking.id);
    return op;
  }

  const book = (op: Awaited<ReturnType<typeof listing>>, n: number, extra: Record<string, unknown>, headers: Record<string, string> = {}) =>
    api()
      .post('/api/public/bookings')
      .set(headers)
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${op.parking.id}`,
        arrivalAt: `2027-03-0${n}T06:30`,
        returnAt: `2027-03-0${n + 1}T15:05`,
        customerFirstName: 'Camille',
        customerLastName: 'Martin',
        customerPhone: '06 12 34 56 78',
        customerEmail: `camille${n}@example.com`,
        plate: 'ab123cd',
        passengers: 1,
        acceptTerms: true,
        ...extra,
      });

  it('counts the visits per day, landing page and origin', async () => {
    for (const body of [
      { source: 'search', detail: 'google', landing: '/' },
      { source: 'search', detail: 'google', landing: '/' },
      { source: 'direct', landing: '/lyon-saint-exupery/gare-tgv' },
    ])
      expect((await api().post('/api/public/visits').send(body)).status).toBe(204);
    expect((await api().post('/api/public/visits').send({ source: 'app', landing: '/' })).status).toBe(400);
    const rows = await prisma.siteVisitDay.findMany({ orderBy: { visits: 'desc' } });
    expect(rows.map(r => [r.landing, r.source, r.detail, r.visits])).toEqual([
      ['/', 'search', 'google', 2],
      ['/lyon-saint-exupery/gare-tgv', 'direct', '', 1],
    ]);
  });

  it('a booking keeps the origin the site sends; from the app it is « app »; Référencement adds them up', async () => {
    const op = await listing();
    const fromGoogle = await book(
      op,
      1,
      { acquisition: { source: 'search', detail: 'google', landing: '/lyon-saint-exupery/depuis/grenoble' } },
      SITE,
    );
    expect(fromGoogle.status).toBe(201);
    await payBooking(fromGoogle.body.reference, fromGoogle.body.manageToken, stripe.sessions);
    // Someone else than the site cannot claim an origin.
    const fromApp = await book(op, 3, { acquisition: { source: 'search', detail: 'google', landing: '/' } });
    await payBooking(fromApp.body.reference, fromApp.body.manageToken, stripe.sessions);
    const saved = await prisma.reservation.findMany({
      orderBy: { arrivalAt: 'asc' },
      select: { acquisitionSource: true, acquisitionDetail: true, acquisitionLanding: true },
    });
    expect(saved).toEqual([
      { acquisitionSource: 'search', acquisitionDetail: 'google', acquisitionLanding: '/lyon-saint-exupery/depuis/grenoble' },
      { acquisitionSource: 'app', acquisitionDetail: null, acquisitionLanding: null },
    ]);

    await api().post('/api/public/visits').send({ source: 'search', detail: 'google', landing: '/lyon-saint-exupery/depuis/grenoble' });
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    expect((await api().get('/api/internal/platform/seo').set(auth(op.token))).status).toBe(403);
    const res = await api().get('/api/internal/platform/seo?days=7').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(7);
    expect(res.body.bookings.total).toBe(2);
    expect(res.body.bookings.search.count).toBe(1);
    expect(res.body.pages[0]).toMatchObject({ landing: '/lyon-saint-exupery/depuis/grenoble', visits: 1, searchVisits: 1, bookings: 1 });
    expect(res.body.searchConsole).toMatchObject({ configured: false, totals: null, queries: [] });
  });
});

describe('Search Console import', () => {
  const seo = Container.get(SeoService);
  let fetchMock: jest.SpyInstance;
  beforeEach(async () => {
    await resetDatabase();
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS = JSON.stringify({
      client_email: 'plazo-seo@plazo.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    });
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
      if (String(url).startsWith('https://oauth2.googleapis.com/token'))
        return new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 });
      return new Response(
        JSON.stringify({
          rows: [
            { keys: ['2026-11-04', 'parking aéroport lyon', 'https://www.plazo.fr/'], clicks: 3, impressions: 120, position: 9.2 },
            { keys: ['2026-11-05', 'parking aéroport lyon', 'https://www.plazo.fr/'], clicks: 5, impressions: 130, position: 8.1 },
          ],
        }),
        { status: 200 },
      );
    });
  });
  afterEach(() => {
    fetchMock.mockRestore();
    delete process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS;
  });
  afterAll(() => prisma.$disconnect());

  it('signs in with the service account, reads the days and replaces them', async () => {
    const now = new Date('2026-11-06T01:00:00Z');
    expect(await seo.syncSearchConsole(now)).toEqual({ configured: true, rows: 2 });
    const query = fetchMock.mock.calls.find(([u]) => String(u).includes('searchAnalytics'))!;
    expect(String(query[0])).toContain(encodeURIComponent('sc-domain:plazo.fr'));
    expect(JSON.parse(query[1].body)).toMatchObject({ endDate: '2026-11-05', dimensions: ['date', 'query', 'page'] });
    // Read again the next night: the same days are replaced, never doubled.
    await seo.syncSearchConsole(new Date('2026-11-07T01:00:00Z'));
    expect(await prisma.searchConsoleRow.count()).toBe(2);
    expect((await prisma.searchConsoleState.findUnique({ where: { id: 'default' } }))?.lastDate).toBe('2026-11-05');

    const report = await seo.report(7, new Date('2026-11-06T12:00:00Z'));
    expect(report.searchConsole.totals).toEqual({ clicks: 8, impressions: 250, position: 8.6 });
    expect(report.searchConsole.queries[0]).toMatchObject({ query: 'parking aéroport lyon', page: '/', clicks: 8 });
  });

  it('a refused key is kept as the import error, never thrown', async () => {
    fetchMock.mockImplementation(async () => new Response('{}', { status: 403 }));
    const result = await seo.syncSearchConsole(new Date('2026-11-06T01:00:00Z'));
    expect(result.error).toBe('search_console_forbidden');
    expect((await prisma.searchConsoleState.findUnique({ where: { id: 'default' } }))?.lastError).toBe('search_console_forbidden');
  });
});
