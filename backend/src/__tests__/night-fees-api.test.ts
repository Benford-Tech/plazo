import { Container } from 'typedi';
import prisma from '@/database';
import { addDays, parseInstant } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { ReservationService } from '@/services/reservation.service';
import {
  addStaff,
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
  useBrevoSms,
} from './utils/helpers';

/**
 * Frais de nuit (12/10/2026, direction B « Dans le détail du prix seulement »): the parking's settings in « Mes tarifs »,
 * the total « tout compris » of the search and the parking page, the snapshot frozen on a Plazo booking (commission on
 * the total, Stripe, e-mails), and never on staff bookings or imports.
 */

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (token: string) => ({ 'x-booking-token': token });
const notifications = Container.get(NotificationService);
const defaultSettings = { ...notifications.settings };

/**
 * The clock seen by the code is fixed (15/10/2026). The stays used to be built from Date.now() + N × 24 h, which lands an
 * hour off on the wall clock once a clock change lies in between: run between 00:00 and 01:00 in Paris during the twelve
 * days before 25/10/2026, « in 9 days » and « in 10 days » were the same local date and the late drop-off lost its extra
 * day. Monday 11 January 2027, 10:00 in Paris: the stays below sit weeks away from any clock change, except the ones that
 * cross one on purpose (28/03/2027 and 31/10/2027). Only Date is faked: timers stay real, and the database's own
 * defaults (createdAt) keep the real time, which nothing here compares with the code's clock.
 */
const TODAY = '2027-01-11';
const NOW = parseInstant(`${TODAY}T10:00`, TZ)!;
function freezeClock() {
  jest.useFakeTimers({
    now: NOW,
    advanceTimers: true,
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'queueMicrotask',
      'hrtime',
      'performance',
    ],
  });
}

// Local parking time, N calendar days after TODAY.
const inDays = (days: number, time: string) => `${addDays(TODAY, days)}T${time}`;

const grid = {
  tiers: [
    { days: 1, priceCents: 1500 },
    { days: 3, priceCents: 3499 },
    { days: 7, priceCents: 5900 },
  ],
  extraDayPriceCents: 600,
};
const NIGHT = { enabled: true, start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1000 };
const OFF = { enabled: false, start: null, end: null, arrivalFeeCents: null, returnFeeCents: null };

async function publishedParking(options: { slug?: string; title?: string; pricing?: Record<string, unknown> } = {}) {
  const op = await setupOperator(options.title ?? 'Parking Nuit');
  const pricing = await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send(options.pricing ?? { ...grid, night: NIGHT });
  if (pricing.status !== 200) throw new Error(JSON.stringify(pricing.body));
  const res = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: options.slug ?? 'parking-nuit',
      title: options.title ?? 'Parking Nuit',
      services: ['shuttle'],
      shuttleMinutes: 8,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 00',
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  await publishListing(op.parking.id);
  await onboardOperator(op.operator.id);
  return op;
}

const traveller = {
  airport: 'lyon-saint-exupery',
  parking: 'parking-nuit',
  customerFirstName: 'Camille',
  customerLastName: 'Martin',
  customerPhone: '06 12 34 56 78',
  customerEmail: 'camille.martin@example.com',
  plate: 'GK-318-PX',
  passengers: 2,
  acceptTerms: true,
};

let fetchMock: jest.SpyInstance;
let stripe: ReturnType<typeof enableFakePayments>;
beforeEach(async () => {
  freezeClock();
  await resetDatabase();
  Object.assign(notifications.settings, defaultSettings, { apiKey: '' });
  stripe = enableFakePayments();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
});
afterEach(() => {
  jest.useRealTimers();
  fetchMock.mockRestore();
  disableFakePayments();
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

describe('Mes tarifs : frais de nuit', () => {
  it('sont coupés par défaut, s’enregistrent avec la grille et se tracent', async () => {
    const { token } = await setupOperator();
    expect((await api().get('/api/internal/pricing').set(auth(token))).body.night).toEqual(OFF);

    const saved = await api()
      .put('/api/internal/pricing')
      .set(auth(token))
      .send({ ...grid, night: NIGHT });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ tiers: grid.tiers, extraDayPriceCents: 600, night: NIGHT });
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'pricing.updated' }, orderBy: { createdAt: 'desc' } });
    expect(audit.details).toMatchObject({ night: NIGHT });

    // A client that does not send them never clears them.
    const grid2 = await api().put('/api/internal/pricing').set(auth(token)).send(grid);
    expect(grid2.body.data.night).toEqual(NIGHT);

    // Switched off: the values are kept, so that switching back on restores them.
    const off = await api()
      .put('/api/internal/pricing')
      .set(auth(token))
      .send({ ...grid, night: { ...NIGHT, enabled: false } });
    expect(off.status).toBe(200);
    expect(off.body.data.night).toEqual({ ...NIGHT, enabled: false });
    expect((await api().get('/api/internal/pricing').set(auth(token))).body.night).toEqual({ ...NIGHT, enabled: false });
  });

  it('refusent une fenêtre ou des frais invalides, sans rien enregistrer', async () => {
    const { token, parking } = await setupOperator();
    await api()
      .put('/api/internal/pricing')
      .set(auth(token))
      .send({ ...grid, night: NIGHT });
    const send = (night: unknown) =>
      api()
        .put('/api/internal/pricing')
        .set(auth(token))
        .send({ tiers: [{ days: 2, priceCents: 2500 }], night });

    const missing = await send({ enabled: true, start: null, end: null, arrivalFeeCents: 1500, returnFeeCents: null });
    expect(missing.status).toBe(400);
    expect(missing.body).toMatchObject({ code: 'validation_failed', fields: { 'night.start': 'required', 'night.end': 'required' } });
    expect((await send({ ...NIGHT, end: '22:00' })).body.fields).toEqual({ 'night.end': 'same_time' });
    expect((await send({ ...NIGHT, arrivalFeeCents: 0, returnFeeCents: null })).body.fields).toEqual({
      'night.arrivalFeeCents': 'fee_required',
      'night.returnFeeCents': 'fee_required',
    });
    expect((await send({ ...NIGHT, start: '24:00', end: '6h' })).body.fields).toEqual({ 'night.start': 'invalid_time', 'night.end': 'invalid_time' });
    expect((await send({ ...NIGHT, arrivalFeeCents: 100001, returnFeeCents: -1 })).body.fields).toEqual({
      'night.arrivalFeeCents': 'too_large',
      'night.returnFeeCents': 'min_0',
    });
    expect((await send({ ...NIGHT, returnFeeCents: 10.5 })).body.fields).toEqual({ 'night.returnFeeCents': 'integer' });
    expect((await send({ start: '22:00' })).body.fields).toMatchObject({ 'night.enabled': 'required' });
    expect((await send('22:00')).status).toBe(400);

    // Nothing written: neither the grid nor the night settings.
    expect(await prisma.pricingTier.count({ where: { parkingId: parking.id } })).toBe(3);
    expect(await prisma.parking.findUniqueOrThrow({ where: { id: parking.id } })).toMatchObject({
      nightFeeEnabled: true,
      nightStart: '22:00',
      nightEnd: '06:00',
      nightArrivalFeeCents: 1500,
      nightReturnFeeCents: 1000,
    });
  });

  it('sont réservés au gérant', async () => {
    const { token } = await setupOperator();
    const agent = await addStaff(token, 'agent');
    expect(
      (
        await api()
          .put('/api/internal/pricing')
          .set(auth(agent.token))
          .send({ ...grid, night: NIGHT })
      ).status,
    ).toBe(403);
  });
});

describe('offre publique', () => {
  it('recherche : prix total frais de nuit compris, trié sur le total, en plus du jour facturé', async () => {
    await publishedParking({ slug: 'nuit', title: 'Nuit' });
    // More expensive grid, no night fees.
    await publishedParking({
      slug: 'jour',
      title: 'Jour',
      pricing: { tiers: [{ days: 3, priceCents: 4500 }], extraDayPriceCents: 1000 },
    });

    const night = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${inDays(10, '23:30')}&returnAt=${inDays(12, '17:00')}`);
    expect(night.status).toBe(200);
    expect(night.body.results.map((r: any) => [r.slug, r.days, r.priceCents, r.basePriceCents, r.nightFee])).toEqual([
      ['jour', 3, 4500, 4500, null],
      ['nuit', 3, 3499 + 1500, 3499, { arrivalCents: 1500, returnCents: 0, totalCents: 1500 }],
    ]);

    // By day the cheaper grid wins again.
    const day = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${inDays(10, '08:30')}&returnAt=${inDays(12, '17:00')}`);
    expect(day.body.results.map((r: any) => [r.slug, r.priceCents, r.nightFee])).toEqual([
      ['nuit', 3499, null],
      ['jour', 4500, null],
    ]);

    // A drop-off at 23:30 already adds a billable day: the night fee comes on top of it.
    const late = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${inDays(9, '23:30')}&returnAt=${inDays(12, '17:00')}`);
    expect(late.body.results.find((r: any) => r.slug === 'nuit')).toMatchObject({ days: 4, basePriceCents: 5900, priceCents: 5900 + 1500 });

    // Both ends at night: the two fees add up. 22:00 pays, 06:00 does not.
    const both = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${inDays(10, '22:00')}&returnAt=${inDays(12, '05:59')}`);
    expect(both.body.results.find((r: any) => r.slug === 'nuit').nightFee).toEqual({ arrivalCents: 1500, returnCents: 1000, totalCents: 2500 });
    const edges = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${inDays(10, '06:00')}&returnAt=${inDays(12, '21:59')}`);
    expect(edges.body.results.find((r: any) => r.slug === 'nuit').nightFee).toBeNull();
  });

  it('passe le changement d’heure : jours et frais comptés sur l’horloge du parking', async () => {
    await publishedParking({ slug: 'nuit', title: 'Nuit' });
    const offer = async (arrivalAt: string, returnAt: string) => {
      const res = await api().get(`/api/public/search?airport=lyon-saint-exupery&arrivalAt=${arrivalAt}&returnAt=${returnAt}`);
      expect(res.status).toBe(200);
      const { days, basePriceCents, priceCents, nightFee } = res.body.results.find((r: any) => r.slug === 'nuit');
      return { days, basePriceCents, priceCents, nightFee };
    };

    // Heure d'hiver (31/10/2027, 03:00 → 02:00): an hour longer than 23:30 → 17:00 usually is, the same 4 days touched.
    expect(await offer('2027-10-30T23:30', '2027-11-02T17:00')).toEqual({
      days: 4,
      basePriceCents: 5900,
      priceCents: 5900 + 1500,
      nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 },
    });
    // The hour that happens twice is still night.
    expect(await offer('2027-10-29T08:00', '2027-10-31T02:30')).toEqual({
      days: 3,
      basePriceCents: 3499,
      priceCents: 3499 + 1000,
      nightFee: { arrivalCents: 0, returnCents: 1000, totalCents: 1000 },
    });
    // Heure d'été (28/03/2027, 02:00 → 03:00): an hour shorter, the same 4 days; 05:30 is still night, 06:30 is day
    // (04:30 UTC, 05:30 on the winter clock of the drop-off).
    expect(await offer('2027-03-27T23:30', '2027-03-30T05:30')).toEqual({
      days: 4,
      basePriceCents: 5900,
      priceCents: 5900 + 2500,
      nightFee: { arrivalCents: 1500, returnCents: 1000, totalCents: 2500 },
    });
    expect((await offer('2027-03-27T23:30', '2027-03-30T06:30')).nightFee).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
  });

  it('fiche : la règle de nuit et l’offre d’un retour de nuit', async () => {
    const op = await publishedParking();
    const page = await api().get(
      `/api/public/airports/lyon-saint-exupery/parkings/parking-nuit?arrivalAt=${inDays(5, '08:00')}&returnAt=${inDays(7, '05:30')}`,
    );
    expect(page.status).toBe(200);
    expect(page.body.parking.pricing).toEqual({
      tiers: grid.tiers,
      extraDayPriceCents: 600,
      night: { start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1000 },
    });
    expect(page.body.offer).toEqual({
      available: true,
      days: 3,
      priceCents: 3499 + 1000,
      basePriceCents: 3499,
      nightFee: { arrivalCents: 0, returnCents: 1000, totalCents: 1000 },
    });
    // The page states only the side that pays.
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ ...grid, night: { ...NIGHT, returnFeeCents: 0 } });
    const arrivalOnly = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-nuit');
    expect(arrivalOnly.body.parking.pricing.night).toEqual({ start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: null });
    expect(arrivalOnly.body.offer).toBeNull();
    // Switched off: no rule.
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ ...grid, night: { ...NIGHT, enabled: false } });
    expect((await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-nuit')).body.parking.pricing.night).toBeNull();
    // The airport's « dès » stays the cheapest package.
    const airport = await api().get('/api/public/airports/lyon-saint-exupery');
    expect(airport.body.listings[0]).toMatchObject({ fromPriceCents: 1500, fromDays: 1 });
  });

  it('Plateforme › Annonces montre la règle de nuit et le prix du jour en plus', async () => {
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    await publishedParking();
    const res = await api().get('/api/internal/platform/listings').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.listings).toEqual([
      expect.objectContaining({
        slug: 'parking-nuit',
        fromPriceCents: 1500,
        extraDayPriceCents: 600,
        night: { start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1000 },
      }),
    ]);
  });
});

describe('réservation sur Plazo', () => {
  it('fige les frais de nuit dans le total payé, commission comprise', async () => {
    const op = await publishedParking();
    await useBrevoSms(op.operator.id);
    Object.assign(notifications.settings, {
      apiKey: 'test-brevo-key',
      emailFrom: 'Plazo Lyon <reservations@example.com>',
      publicSiteUrl: 'https://site.example/',
    });
    const held = await api()
      .post('/api/public/bookings')
      .send({ ...traveller, arrivalAt: inDays(5, '23:30'), returnAt: inDays(7, '05:30'), priceCents: 1 });
    expect(held.status).toBe(201);
    const expected = { priceCents: 3499 + 2500, basePriceCents: 3499, nightFee: { arrivalCents: 1500, returnCents: 1000, totalCents: 2500 } };
    expect(held.body.booking).toMatchObject({ days: 3, ...expected });

    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.body.reference } });
    expect(saved).toMatchObject({
      channel: 'plazo',
      priceCents: 5999,
      nightArrivalFeeCents: 1500,
      nightReturnFeeCents: 1000,
      // Plazo's commission (12 %) on the whole total, night fees included.
      chargedCents: 5999,
      commissionCents: 720,
      operatorShareCents: 5279,
    });
    const created = await prisma.auditLog.findFirstOrThrow({ where: { action: 'reservation.created', entityId: saved.id } });
    expect(created.details).toMatchObject({ priceCents: 5999, nightArrivalFeeCents: 1500, nightReturnFeeCents: 1000, commissionCents: 720 });

    // One Stripe line for the total, naming the night fees.
    await payBooking(held.body.reference, held.body.manageToken, stripe.sessions);
    const [params] = stripe.fake.checkout.sessions.create.mock.calls[0];
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0].price_data.unit_amount).toBe(5999);
    expect(params.line_items[0].price_data.product_data.description).toMatch(
      /^Réservation R\w+ : dépôt le .+, retour le .+ · dont frais de nuit 25,00 €$/,
    );

    // The confirmation names them; the SMS does not change.
    const calls = fetchMock.mock.calls.map(([url, init]) => ({ url, body: JSON.parse(init.body) }));
    const email = calls.find(c => c.url === 'https://api.brevo.com/v3/smtp/email')!;
    expect(email.body.textContent).toContain('Total : 59,99 € (dont 25,00 € de frais de nuit), payé en ligne par carte.');
    const sms = calls.find(c => c.url === 'https://api.brevo.com/v3/transactionalSMS/send')!;
    expect(sms.body.content).toContain(' 59,99 € payés.');
    expect(sms.body.content).not.toContain('nuit');

    // The traveller's booking, and the staff's views.
    const read = await api().get(`/api/public/bookings/${held.body.reference}`).set(bookingToken(held.body.manageToken));
    expect(read.body).toMatchObject({ status: 'upcoming', payment: { status: 'paid' }, ...expected });
    const sheet = await api().get(`/api/internal/reservations/${saved.id}`).set(auth(op.token));
    expect(sheet.body).toMatchObject({ priceCents: 5999, nightArrivalFeeCents: 1500, nightReturnFeeCents: 1000 });
    const list = await api().get(`/api/internal/reservations?q=${held.body.reference}`).set(auth(op.token));
    expect(list.body.docs).toEqual([expect.objectContaining({ priceCents: 5999, nightArrivalFeeCents: 1500, nightReturnFeeCents: 1000 })]);
  });

  it('les frais restent ceux de la réservation : nouveaux tarifs, heures ou vol changés ne les recalculent pas', async () => {
    const op = await publishedParking();
    const held = await api()
      .post('/api/public/bookings')
      .send({ ...traveller, arrivalAt: inDays(5, '23:30'), returnAt: inDays(7, '15:00') });
    expect(held.status).toBe(201);
    await payBooking(held.body.reference, held.body.manageToken, stripe.sessions);
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.body.reference } });

    // The parking raises its fees, then the staff move the drop-off to the day and the return into the night.
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ ...grid, night: { ...NIGHT, arrivalFeeCents: 3000, returnFeeCents: 3000 } });
    const moved = await api()
      .patch(`/api/internal/reservations/${reservation.id}`)
      .set(auth(op.token))
      .send({ arrivalAt: inDays(5, '12:00'), returnAt: inDays(7, '23:00') });
    expect(moved.status).toBe(200);
    // The traveller changes the return flight.
    expect(
      (
        await api()
          .patch(`/api/public/bookings/${held.body.reference}/flight`)
          .set(bookingToken(held.body.manageToken))
          .send({ returnFlight: 'TO 3627' })
      ).status,
    ).toBe(200);

    const read = await api().get(`/api/public/bookings/${held.body.reference}`).set(bookingToken(held.body.manageToken));
    expect(read.body).toMatchObject({
      arrivalAt: inDays(5, '12:00'),
      returnAt: inDays(7, '23:00'),
      priceCents: 3499 + 1500,
      basePriceCents: 3499,
      nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 },
    });
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).toMatchObject({
      priceCents: 4999,
      nightArrivalFeeCents: 1500,
      nightReturnFeeCents: null,
      chargedCents: 4999,
    });
  });

  it('jamais pour une réservation saisie par l’équipe ni pour un import', async () => {
    const op = await publishedParking();
    const staff = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: inDays(5, '23:30'),
        returnAt: inDays(7, '05:30'),
        passengers: 1,
        customerFirstName: 'Jean',
        customerLastName: 'Dupont',
        customerPhone: '06 00 00 00 00',
        plate: 'AB-123-CD',
        priceCents: 4000,
      });
    expect(staff.status).toBe(201);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: staff.body.data.id } })).toMatchObject({
      priceCents: 4000,
      nightArrivalFeeCents: null,
      nightReturnFeeCents: null,
    });

    const { reservation } = await Container.get(ReservationService).createFromImport(op.operator.id, {
      provider: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: inDays(6, '23:00'),
      returnAt: inDays(8, '04:00'),
      customerFirstName: 'Léa',
      customerLastName: 'Bernard',
      customerPhone: '06 11 22 33 44',
      plate: 'EF-456-GH',
      priceCents: 4550,
    });
    expect(reservation).toMatchObject({ channel: 'aggregator', priceCents: 4550, nightArrivalFeeCents: null, nightReturnFeeCents: null });

    // The database refuses night fees on any other channel.
    await expect(prisma.reservation.update({ where: { id: reservation.id }, data: { nightArrivalFeeCents: 1500 } })).rejects.toThrow();
  });
});
