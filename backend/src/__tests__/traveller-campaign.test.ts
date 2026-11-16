import { Container } from 'typedi';
import prisma from '@/database';
import { campaignEmail, campaignEmailHash, nextCampaignAt, offerPrice, readCampaign } from '@/domain/traveller-campaign';
import { NotificationService } from '@/services/notification.service';
import { TravellerCampaignService } from '@/services/traveller-campaign.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

// 15/11/2026 (« Mail de promotion à Plazo… pensez à Plazo pour la prochaine location de parking », direction C, tous les
// voyageurs, campagne à la main). Brevo is mocked.

const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const P = '/api/internal/platform/traveller-campaigns';
const notifications = Container.get(NotificationService);
const service = Container.get(TravellerCampaignService);
const defaultSettings = { ...notifications.settings };

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;
let airportSlug: string;
let fetchMock: jest.SpyInstance;
const sent = (tag = 'traveller_campaign') =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_EMAIL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>)
    .filter(m => (m.tags ?? []).includes(tag));
const auth = (op: Op) => ({ Authorization: `Bearer ${op.token}` });

let n = 0;
async function booking(op: Op, data: Record<string, unknown> = {}) {
  n++;
  return prisma.reservation.create({
    data: {
      reference: `RCMP${n}${Math.floor(Math.random() * 900 + 100)}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel: 'aggregator',
      channelDetail: 'Allopark',
      status: 'returned',
      arrivalAt: new Date('2026-10-01T05:30:00Z'),
      returnAt: new Date('2026-10-08T20:40:00Z'),
      passengers: 1,
      customerName: 'Camille Martin',
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'camille@example.org',
      plate: '',
      plateKey: '',
      ...data,
    },
  });
}

const body = {
  subject: 'Les vacances approchent',
  title: 'Votre parking, c’est réglé ?',
  body: 'Les places partent vite.\n\nRéservez maintenant.',
  airport: '',
};

beforeEach(async () => {
  await resetDatabase();
  await prisma.travellerEmailOptout.deleteMany();
  admin = await setupOperator('Plazo');
  // The helper numbers its operators: named back « … (tests) », the platform's test operator, whose travellers are fictional.
  await prisma.operator.update({ where: { id: admin.operator.id }, data: { name: 'Plazo (tests)' } });
  loueur = await setupOperator('Parking des Cèdres');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
  const airport = await prisma.airport.findFirstOrThrow();
  airportSlug = airport.slug;
  body.airport = airportSlug;
  await prisma.listing.upsert({
    where: { parkingId: loueur.parking.id },
    create: { parkingId: loueur.parking.id, airportId: airport.id, slug: 'cedres', title: 'Parking des Cèdres', services: ['shuttle'] },
    update: { airportId: airport.id, title: 'Parking des Cèdres', services: ['shuttle'] },
  });
  await prisma.pricingTier.create({ data: { parkingId: loueur.parking.id, days: 7, priceCents: 5400 } });
  await publishListing(loueur.parking.id);
  Object.assign(notifications.settings, defaultSettings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    if (String(url) === BREVO_EMAIL) return new Response(JSON.stringify({ messageId: '<m@brevo>' }), { status: 201 });
    return new Response('{}', { status: 200 });
  });
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  fetchMock.mockRestore();
  Object.assign(notifications.settings, defaultSettings);
});
afterAll(() => prisma.$disconnect());

describe('les règles', () => {
  it('valide les champs et les dates', () => {
    expect(readCampaign({ ...body }).errors).toEqual({});
    expect(readCampaign({}).errors).toEqual({ subject: 'required', title: 'required', body: 'required', airport: 'required' });
    expect(readCampaign({ ...body, arrival: '2026-12-19T08:00' }).errors).toEqual({ return: 'required' });
    expect(readCampaign({ ...body, arrival: '2026-12-19T08:00', return: '2026-12-18T08:00' }).errors).toEqual({ return: 'before_arrival' });
    expect(readCampaign({ ...body, subject: 'x'.repeat(121) }).errors).toEqual({ subject: 'too_long' });
  });

  it('une campagne par semaine', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    expect(nextCampaignAt(null, now)).toBeNull();
    expect(nextCampaignAt(new Date('2026-11-14T10:00:00Z'), now)?.toISOString()).toBe('2026-11-21T10:00:00.000Z');
    expect(nextCampaignAt(new Date('2026-11-01T10:00:00Z'), now)).toBeNull();
  });

  it('le mail : badges, prix réels, bouton vers la recherche et désinscription', () => {
    const offer = { title: 'Parking des Cèdres', slug: 'cedres', priceCents: 13600, days: 8, forStay: true, shuttleMinutes: 8, valet: false };
    expect(offerPrice(offer)).toBe('136,00 € · 8 jours');
    expect(offerPrice({ ...offer, forStay: false, days: 7, priceCents: 5400 })).toBe('dès 54,00 € pour 7 jours');
    const m = campaignEmail({
      productName: 'Plazo',
      campaign: { ...body, arrival: '2026-12-19T08:00', return: '2026-12-26T18:00' },
      firstName: 'Camille',
      airportName: 'Lyon Saint-Exupéry',
      offers: [offer],
      searchUrl: 'https://site.example/lyon/recherche',
      parkingUrl: slug => `https://site.example/lyon/${slug}`,
      badges: [
        {
          label: 'Plazo sur Google Play (Android)',
          url: 'https://play.example',
          imageUrl: 'https://site.example/badges/g.png',
          width: 155,
          height: 60,
        },
      ],
      imagesBase: 'https://site.example',
      unsubscribeUrl: 'https://site.example/unsub',
      publisher: 'Benford Tech',
    });
    expect(m.subject).toBe('Les vacances approchent');
    expect(m.html).toContain('Bonjour Camille,');
    expect(m.html).toContain('136,00 € · 8 jours');
    expect(m.html).toContain('https://play.example');
    expect(m.html).toContain('Voir les parkings pour mes dates');
    expect(m.html).toContain('https://site.example/unsub');
    expect(m.text).toContain('Ne plus recevoir ces messages : https://site.example/unsub');
  });
});

describe('la campagne', () => {
  it('écrit une fois à chaque voyageur, sans les désinscrits, les adresses de comparateur ni le parking de test', async () => {
    await booking(loueur, { customerEmail: 'camille@example.org' });
    await booking(loueur, { customerEmail: 'Camille@Example.org', customerFirstName: 'Cam' });
    await booking(loueur, { customerEmail: 'paul@example.org', customerFirstName: 'Paul', channel: 'phone', channelDetail: null });
    await booking(loueur, { customerEmail: 'parti@example.org' });
    await prisma.travellerEmailOptout.create({ data: { emailHash: campaignEmailHash('parti@example.org') } });
    await booking(loueur, { customerEmail: 'reservation@allopark.com' });
    await booking(loueur, {
      customerEmail: 'ancien@example.org',
      returnAt: new Date('2022-01-01T10:00:00Z'),
      arrivalAt: new Date('2021-12-20T10:00:00Z'),
    });
    await booking(admin, { customerEmail: 'fictif@example.org' });

    const overview = await api().get(P).set(auth(admin));
    expect(overview.status).toBe(200);
    expect(overview.body.audience).toBe(2);
    expect(overview.body.nextAt).toBeNull();

    const preview = await api().post(`${P}/preview`).set(auth(admin)).send(body);
    expect(preview.status).toBe(200);
    expect(preview.body.html).toContain('Parking des Cèdres');
    expect(preview.body.html).toContain('dès 54,00 € pour 7 jours');

    const started = await api().post(P).set(auth(admin)).send(body);
    expect(started.status).toBe(201);
    expect(started.body).toMatchObject({ recipients: 2, sent: 2 });
    const mails = sent();
    expect(mails.map(m => m.to[0].email).sort()).toEqual(['camille@example.org', 'paul@example.org']);
    expect(mails[0].headers['List-Unsubscribe']).toMatch(/\/api\/public\/traveller-emails\/unsubscribe\//);
    expect(mails[0].sender.email).toBe('contact@plazo.fr');

    // The addresses are erased once sent, the campaign is finished, and a second pass sends nothing.
    expect(await prisma.travellerCampaignRecipient.count({ where: { email: { not: null } } })).toBe(0);
    const campaign = await prisma.travellerCampaign.findFirstOrThrow();
    expect(campaign).toMatchObject({ recipients: 2, sent: 2, failed: 0 });
    expect(campaign.finishedAt).not.toBeNull();
    expect(await service.run()).toEqual({ sent: 0, failed: 0, skipped: 0 });

    // One a week.
    const again = await api().post(P).set(auth(admin)).send(body);
    expect(again.status).toBe(429);
    expect(again.body.code).toBe('campaign_too_soon');
  });

  it('le lien « Ne plus recevoir » écarte l’adresse des campagnes suivantes', async () => {
    const r = await booking(loueur);
    const token = Container.get(TravellerCampaignService).welcome.unsubscribeToken(r.id);
    const res = await api().post(`/api/public/traveller-emails/unsubscribe/${token}`);
    expect(res.status).toBe(200);
    expect((await api().get(P).set(auth(admin))).body.audience).toBe(0);
    expect((await api().post(P).set(auth(admin)).send(body)).body.code).toBe('no_audience');
  });

  it('montre les prix du séjour quand des dates sont données, et le test part à l’administrateur', async () => {
    const res = await api()
      .post(`${P}/test`)
      .set(auth(admin))
      .send({ ...body, arrival: '2027-01-10T08:00', return: '2027-01-17T08:00' });
    expect(res.status).toBe(200);
    const [mail] = sent('traveller_campaign_test');
    expect(mail.to[0].email).toBe(admin.manager.email);
    expect(mail.subject).toBe('[Test] Les vacances approchent');
    expect(mail.htmlContent).toContain('Voir les parkings pour mes dates');
    expect(mail.htmlContent).toContain('arrivee=2027-01-10T08%3A00');
    expect(await prisma.travellerCampaign.count()).toBe(0);
  });

  it('refuse les champs invalides et un loueur', async () => {
    const bad = await api()
      .post(P)
      .set(auth(admin))
      .send({ ...body, subject: '' });
    expect(bad.status).toBe(400);
    expect((await api().get(P).set(auth(loueur))).status).toBe(403);
  });
});
