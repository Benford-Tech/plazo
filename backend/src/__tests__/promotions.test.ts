import prisma from '@/database';
import { nextPromotionAt, promotionLinkErrors, promotionPath } from '@/domain/promotion';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

/** Promotions to the Plazo app's travellers (13/11/2026, choix A « Message promo »). */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const P = '/api/internal/platform/notifications';
const DEVICES = '/api/public/app-devices';

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;
let fetchMock: jest.SpyInstance;
const pushes = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>);

const inDays = (n: number, time: string) => `${new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10)}T${time}`;

async function bookingWithPhone(subscriptionId: string, arrival: number, ret: number) {
  const res = await api()
    .post('/api/internal/reservations')
    .set(auth(loueur.token))
    .send({
      channel: 'phone',
      arrivalAt: inDays(arrival, '08:00'),
      returnAt: inDays(ret, '18:00'),
      passengers: 1,
      customerName: 'Jean Dupont',
      customerPhone: '06 12 34 56 78',
      plate: `AB-${100 + Math.floor(Math.random() * 800)}-CD`,
    });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  await prisma.travellerDevice.create({ data: { reservationId: res.body.data.id, subscriptionId } });
}

beforeEach(async () => {
  await resetDatabase();
  await prisma.travellerAppDevice.deleteMany();
  admin = await setupOperator('Plazo (tests)');
  loueur = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
  process.env.ONESIGNAL_TRAVELLER_APP_ID = 'traveller-app';
  process.env.ONESIGNAL_TRAVELLER_REST_API_KEY = 'tkey';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  delete process.env.ONESIGNAL_TRAVELLER_APP_ID;
  delete process.env.ONESIGNAL_TRAVELLER_REST_API_KEY;
  fetchMock.mockRestore();
});
afterAll(() => prisma.$disconnect());

describe('règles des promotions', () => {
  it('le lien, son chemin et deux promotions par semaine', () => {
    expect(promotionLinkErrors(null)).toEqual({});
    expect(promotionLinkErrors({ kind: 'search', airport: 'lyon-saint-exupery' })).toEqual({});
    expect(promotionLinkErrors({ kind: 'search', airport: 'Lyon !' })).toEqual({ 'link.airport': 'invalid' });
    expect(promotionLinkErrors({ kind: 'parking', airport: 'lyon-saint-exupery' })).toEqual({ 'link.parking': 'invalid' });
    expect(promotionLinkErrors({ kind: 'search', airport: 'lyon', arrival: '2026-12-19T08:00' })).toEqual({ 'link.return': 'required' });
    expect(promotionLinkErrors({ kind: 'search', airport: 'lyon', arrival: '2026-12-19T08:00', return: '2026-12-18T08:00' })).toEqual({
      'link.return': 'before_arrival',
    });
    expect(promotionPath({ kind: 'search', airport: 'lyon-saint-exupery', arrival: '2026-12-19T08:00', return: '2027-01-03T18:00' })).toBe(
      '/lyon-saint-exupery/recherche?arrivee=2026-12-19T08%3A00&retour=2027-01-03T18%3A00',
    );
    expect(promotionPath({ kind: 'parking', airport: 'lyon-saint-exupery', parking: 'parking-du-lac' })).toBe('/lyon-saint-exupery/parking-du-lac');
    const now = new Date('2026-11-13T12:00:00Z');
    expect(nextPromotionAt([new Date('2026-11-10T12:00:00Z')], now)).toBeNull();
    expect(nextPromotionAt([new Date('2026-11-10T12:00:00Z'), new Date('2026-11-12T12:00:00Z')], now)?.toISOString()).toBe(
      '2026-11-17T12:00:00.000Z',
    );
    expect(nextPromotionAt([new Date('2026-11-01T12:00:00Z'), new Date('2026-11-12T12:00:00Z')], now)).toBeNull();
  });
});

describe('téléphones de l’app et accord aux offres', () => {
  it('un téléphone neuf n’a pas les offres ; l’interrupteur les change et date le choix ; oublié sur demande', async () => {
    const first = await api().put(`${DEVICES}/sub-phone-0001`).send({ platform: 'ios' });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ offers: false, offersAt: null });
    const on = await api().put(`${DEVICES}/sub-phone-0001`).send({ offers: true });
    expect(on.body.offers).toBe(true);
    expect(on.body.offersAt).not.toBeNull();
    // A start-up without the switch keeps the choice.
    expect((await api().put(`${DEVICES}/sub-phone-0001`).send({})).body.offers).toBe(true);
    expect((await api().put(`${DEVICES}/bad id`).send({})).status).toBe(400);
    expect((await api().put(`${DEVICES}/sub-phone-0001`).send({ offers: 'yes' })).status).toBe(400);
    expect((await api().delete(`${DEVICES}/sub-phone-0001`)).status).toBe(204);
    expect(await prisma.travellerAppDevice.count()).toBe(0);
  });
});

describe('envoi d’une promotion', () => {
  it('seulement aux téléphones qui ont dit oui, avec les filtres ; ouvre l’app sur la recherche ; deux par semaine', async () => {
    const put = await api()
      .put('/api/internal/listing')
      .set(auth(loueur.token))
      .send({
        airportCode: 'LYS',
        slug: 'parking-du-lac',
        title: 'Parking du Lac',
        description: 'Parking extérieur clôturé, navette gratuite.',
        services: ['shuttle'],
        shuttleMinutes: 8,
        distanceKm: 4.5,
        openingHours: '24h/24',
        cancellationPolicy: 'free_24h',
        photos: ['https://example.com/photo-1.jpg'],
      });
    if (put.status !== 200) throw new Error(JSON.stringify(put.body));
    await publishListing(loueur.parking.id);
    const listing = await prisma.listing.findUniqueOrThrow({ where: { parkingId: loueur.parking.id }, include: { airport: true } });
    const airport = listing.airport.slug;
    for (const id of ['sub-yes-past', 'sub-yes-coming', 'sub-yes-never', 'sub-no-0000']) {
      await api()
        .put(`${DEVICES}/${id}`)
        .send({ offers: id !== 'sub-no-0000' });
    }
    await bookingWithPhone('sub-yes-past', -10, -3);
    await bookingWithPhone('sub-yes-coming', 5, 9);

    const count = async (q: string) => (await api().get(`${P}/audience?audience=promotion${q}`).set(auth(admin.token))).body;
    expect(await count('')).toMatchObject({ devices: 3, configured: true, nextPromotionAt: null });
    expect((await count(`&airport=${airport}`)).devices).toBe(2);
    expect((await count('&noUpcoming=1')).devices).toBe(2);
    expect((await count(`&airport=${airport}&noUpcoming=1`)).devices).toBe(1);

    const bad = await api()
      .post(P)
      .set(auth(admin.token))
      .send({
        audience: 'promotion',
        title: 'x',
        body: 'y',
        link: { kind: 'parking', airport, parking: 'nulle-part' },
        filters: { airport: 'nulle-part' },
      });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toMatchObject({ 'link.parking': 'not_found', 'filters.airport': 'not_found' });

    const link = { kind: 'search', airport, arrival: '2026-12-19T08:00', return: '2027-01-03T18:00' };
    const sent = await api()
      .post(P)
      .set(auth(admin.token))
      .send({ audience: 'promotion', title: 'Vacances de Noël', body: 'Réservez tôt.', link, filters: { noUpcoming: true } });
    expect(sent.status).toBe(201);
    expect(sent.body.data).toMatchObject({ audience: 'promotion', recipients: 2, link, filters: { airport: null, noUpcoming: true } });
    const [push] = pushes();
    expect(push.app_id).toBe('traveller-app');
    expect(push.include_subscription_ids.sort()).toEqual(['sub-yes-never', 'sub-yes-past']);
    expect(push.data).toEqual({ type: 'promotion', path: `/${airport}/recherche?arrivee=2026-12-19T08%3A00&retour=2027-01-03T18%3A00` });
    expect(push.url).toBeUndefined();

    const second = await api()
      .post(P)
      .set(auth(admin.token))
      .send({ audience: 'promotion', title: 'Deux', body: 'Encore.', link: { kind: 'parking', airport, parking: listing.slug } });
    expect(second.status).toBe(201);
    const third = await api().post(P).set(auth(admin.token)).send({ audience: 'promotion', title: 'Trois', body: 'Trop.' });
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('weekly_limit');
    expect((await count('')).nextPromotionAt).not.toBeNull();

    // A loueur never sends one.
    expect((await api().post(P).set(auth(loueur.token)).send({ audience: 'promotion', title: 'x', body: 'y' })).status).toBe(403);
  });
});
