import { Container } from 'typedi';
import prisma, { PayoutSchedule } from '@/database';
import { addDays, localDate } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { ExtraService } from '@/services/extra.service';
import { PaymentService } from '@/services/payment.service';
import { StripeApi, StripeService } from '@/services/stripe.service';
import { addStaff, api, resetDatabase, setupOperator, publishListing, useBrevoSms } from './utils/helpers';

// Services for the car (21/10/2026), ordered and paid on Plazo. The Stripe SDK is replaced by mocks: no network.

const TZ = 'Europe/Paris';
const WEBHOOK_SECRET = 'whsec_test_secret';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const bookingToken = (value: string) => ({ 'x-booking-token': value });
// N calendar days after today on the parking's clock, never now + N × 24 h: run between 23:00 and 24:00 in Paris on
// 21 or 22/03/2027, those steps skip the 28th (clock change) and the 3-day stay was billed 4 days (40,99 € for 34,99 €).
const inDays = (days: number, time: string) => `${addDays(localDate(new Date(), TZ), days)}T${time}`;

const stripeService = Container.get(StripeService);
const payments = Container.get(PaymentService);
const notifications = Container.get(NotificationService);
const defaultNotificationSettings = { ...notifications.settings };

// ---- A fake Stripe ----------------------------------------------------------------------------

type FakeSession = {
  id: string;
  object: 'checkout.session';
  status: 'open' | 'complete' | 'expired';
  payment_status: 'unpaid' | 'paid';
  url: string | null;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  client_reference_id: string;
  payment_intent: string | null;
};

type FakeIntent = {
  id: string;
  object: 'payment_intent';
  status: 'requires_payment_method' | 'succeeded' | 'canceled';
  client_secret: string;
  amount: number;
  amount_received: number;
  currency: string;
  metadata: Record<string, string>;
  latest_charge: string | null;
  last_payment_error?: { code: string } | null;
};

let sessions: Map<string, FakeSession>;
let intents: Map<string, FakeIntent>;
let fake: {
  checkout: { sessions: { create: jest.Mock; retrieve: jest.Mock; expire: jest.Mock } };
  refunds: { create: jest.Mock };
  paymentIntents: { retrieve: jest.Mock; create: jest.Mock; cancel: jest.Mock };
  transfers: { create: jest.Mock; createReversal: jest.Mock };
  accounts: { create: jest.Mock; retrieve: jest.Mock; createLoginLink: jest.Mock };
  accountLinks: { create: jest.Mock };
};

function makeFake() {
  sessions = new Map();
  intents = new Map();
  let n = 0;
  let m = 0;
  fake = {
    checkout: {
      sessions: {
        create: jest.fn(async (params: any) => {
          n += 1;
          const session: FakeSession = {
            id: `cs_test_${n}`,
            object: 'checkout.session',
            status: 'open',
            payment_status: 'unpaid',
            url: `https://checkout.stripe.test/c/pay/cs_test_${n}`,
            amount_total: params.line_items[0].price_data.unit_amount,
            currency: params.currency,
            metadata: params.metadata,
            client_reference_id: params.client_reference_id,
            payment_intent: null,
          };
          sessions.set(session.id, session);
          return session;
        }),
        retrieve: jest.fn(async (id: string) => {
          const session = sessions.get(id);
          if (!session) throw Object.assign(new Error('No such session'), { type: 'StripeInvalidRequestError' });
          return { ...session };
        }),
        expire: jest.fn(async (id: string) => {
          const session = sessions.get(id)!;
          session.status = 'expired';
          return { ...session };
        }),
      },
    },
    refunds: { create: jest.fn(async () => ({ id: 're_test_1', object: 'refund', status: 'succeeded' })) },
    paymentIntents: {
      retrieve: jest.fn(async (id: string) => {
        const intent = intents.get(id);
        return intent ? { ...intent } : { id, object: 'payment_intent', status: 'succeeded', latest_charge: 'ch_test_1' };
      }),
      create: jest.fn(async (params: any) => {
        m += 1;
        const intent: FakeIntent = {
          id: `pi_sheet_${m}`,
          object: 'payment_intent',
          status: 'requires_payment_method',
          client_secret: `pi_sheet_${m}_secret_abc`,
          amount: params.amount,
          amount_received: 0,
          currency: params.currency,
          metadata: params.metadata,
          latest_charge: null,
        };
        intents.set(intent.id, intent);
        return { ...intent };
      }),
      cancel: jest.fn(async (id: string) => {
        const intent = intents.get(id)!;
        intent.status = 'canceled';
        return { ...intent };
      }),
    },
    transfers: {
      create: jest.fn(async () => ({ id: 'tr_test_1', object: 'transfer' })),
      createReversal: jest.fn(async () => ({ id: 'trr_test_1', object: 'transfer_reversal' })),
    },
    accounts: {
      create: jest.fn(async () => ({ id: 'acct_test_new', object: 'account', charges_enabled: false, payouts_enabled: false })),
      retrieve: jest.fn(async (id: string) => ({ id, object: 'account', details_submitted: true, charges_enabled: true, payouts_enabled: true })),
      createLoginLink: jest.fn(async (id: string) => ({ object: 'login_link', url: `https://connect.stripe.test/express/${id}` })),
    },
    accountLinks: {
      create: jest.fn(async () => ({
        object: 'account_link',
        url: 'https://connect.stripe.test/setup/e/acct_test_new',
        expires_at: Math.floor(Date.now() / 1000) + 300,
      })),
    },
  };
  stripeService.override = fake as unknown as StripeApi;
}

/** The traveller pays in the app's (fake) payment sheet. */
function payIntent(id: string) {
  const intent = intents.get(id)!;
  Object.assign(intent, { status: 'succeeded', amount_received: intent.amount, latest_charge: 'ch_sheet_1' });
  return { ...intent };
}

function signedEvent(type: string, object: unknown, secret = WEBHOOK_SECRET, livemode?: boolean) {
  const payload = JSON.stringify({
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: 'event',
    type,
    ...(livemode === undefined ? {} : { livemode }),
    data: { object },
  });
  return { payload, signature: stripeService.signatureFor(payload, secret) };
}

const sendWebhook = (payload: string, signature: string) =>
  api().post('/api/public/stripe/webhook').set('content-type', 'application/json').set('stripe-signature', signature).send(payload);

// ---- Fixtures ---------------------------------------------------------------------------------

const grid = { tiers: [{ days: 3, priceCents: 3499 }], extraDayPriceCents: 600 };

async function publishedParking(
  options: {
    capacity?: number;
    onboarded?: boolean;
    commissionBps?: number | null;
    slug?: string;
    name?: string;
    payoutSchedule?: PayoutSchedule;
  } = {},
) {
  const op = await setupOperator(options.name);
  await api().put('/api/internal/pricing').set(auth(op.token)).send(grid);
  const res = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: options.slug ?? 'parking-demo',
      title: 'Parking Démo LYS',
      services: ['shuttle'],
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  await publishListing(op.parking.id);
  await useBrevoSms(op.operator.id);
  if (options.capacity) await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: options.capacity, safetyMarginPct: 0 } });
  await prisma.operator.update({
    where: { id: op.operator.id },
    data:
      options.onboarded === false
        ? { commissionBps: options.commissionBps === undefined ? 1200 : options.commissionBps }
        : {
            commissionBps: options.commissionBps === undefined ? 1200 : options.commissionBps,
            stripeAccountId: `acct_${op.operator.id}`,
            stripeChargesEnabled: true,
            stripePayoutsEnabled: true,
            ...(options.payoutSchedule ? { payoutSchedule: options.payoutSchedule } : {}),
          },
  });
  return op;
}

const bookingBody = (overrides: Record<string, unknown> = {}) => ({
  airport: 'lyon-saint-exupery',
  parking: 'parking-demo',
  arrivalAt: inDays(5, '06:30'),
  returnAt: inDays(7, '15:05'),
  customerName: 'Camille Martin',
  customerPhone: '06 12 34 56 78',
  customerEmail: 'camille.martin@example.com',
  plate: 'GK-318-PX',
  passengers: 2,
  acceptTerms: true,
  ...overrides,
});
const book = (overrides: Record<string, unknown> = {}) => api().post('/api/public/bookings').send(bookingBody(overrides));

let fetchMock: jest.SpyInstance;
const savedEnv = { ...process.env };

beforeEach(async () => {
  await resetDatabase();
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = `whsec_other,${WEBHOOK_SECRET}`;
  payments.settings.siteUrl = 'https://site.example';
  makeFake();
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: '' });
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  process.env = { ...savedEnv };
  stripeService.override = null;
});
afterAll(() => prisma.$disconnect());

// ---- Helpers ----------------------------------------------------------------------------------

const extrasOf = (reference: string, manageToken: string) => api().get(`/api/public/bookings/${reference}/extras`).set(bookingToken(manageToken));
const order = (reference: string, manageToken: string, kind: string) =>
  api().post(`/api/public/bookings/${reference}/extras`).set(bookingToken(manageToken)).send({ kind });
const offerAll = (token: string, leadHours?: number) =>
  api()
    .put(`/api/internal/parkings/${currentParkingId}/extras`)
    .set(auth(token))
    .send({
      ...(leadHours === undefined ? {} : { leadHours }),
      offers: [
        { kind: 'interior_wash', enabled: true, priceCents: 5000 },
        { kind: 'hybrid_charge', enabled: true, priceCents: 1500 },
        { kind: 'ev_charge', enabled: true, priceCents: 3000 },
      ],
    });
let currentParkingId = '';

/** A booking paid in the app's payment sheet (with its services, if any). */
async function paidInApp(overrides: Record<string, unknown> = {}) {
  const res = await book(overrides);
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  const sheet = await api().post(`/api/public/bookings/${res.body.reference}/payment-intent`).set(bookingToken(res.body.manageToken));
  const event = signedEvent('payment_intent.succeeded', payIntent(sheet.body.paymentIntentId));
  expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
  return { ...res.body, amountCents: sheet.body.amountCents as number, paymentIntentId: sheet.body.paymentIntentId as string };
}

/** Orders a service after the booking and pays its sheet through the webhook. */
async function orderAndPay(reference: string, manageToken: string, kind: string) {
  const res = await order(reference, manageToken, kind);
  expect(res.status).toBe(201);
  const event = signedEvent('payment_intent.succeeded', payIntent(res.body.payment.paymentIntentId));
  expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
  return res.body.extra.id as string;
}

async function parkingWithExtras(options: Parameters<typeof publishedParking>[0] = {}, leadHours?: number) {
  const op = await publishedParking(options);
  currentParkingId = op.parking.id;
  expect((await offerAll(op.token, leadHours)).status).toBe(200);
  return op;
}

// ---- Tests ------------------------------------------------------------------------------------

describe('réglages des services', () => {
  it('par défaut rien n’est proposé, aux prix de 50, 15 et 30 € ; le gérant les active et règle ses prix', async () => {
    const op = await publishedParking();
    currentParkingId = op.parking.id;
    const before = await api().get(`/api/internal/parkings/${op.parking.id}/extras`).set(auth(op.token));
    expect(before.status).toBe(200);
    expect(before.body.leadHours).toBe(24);
    expect(before.body.offers.map((o: any) => [o.kind, o.enabled, o.priceCents])).toEqual([
      ['interior_wash', false, 5000],
      ['hybrid_charge', false, 1500],
      ['ev_charge', false, 3000],
    ]);
    let page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body.parking.extras).toEqual({ offers: [], leadHours: 24 });

    const put = await api()
      .put(`/api/internal/parkings/${op.parking.id}/extras`)
      .set(auth(op.token))
      .send({ leadHours: 12, offers: [{ kind: 'ev_charge', enabled: true, priceCents: 3500 }] });
    expect(put.status).toBe(200);
    expect(put.body.leadHours).toBe(12);
    page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body.parking.extras.offers).toEqual([
      expect.objectContaining({ kind: 'ev_charge', label: 'Recharge électrique', icon: 'ev', group: 'charge', leadHours: 12, priceCents: 3500 }),
    ]);
    expect(page.body.parking.extras.leadHours).toBe(12);

    const bad = await api()
      .put(`/api/internal/parkings/${op.parking.id}/extras`)
      .set(auth(op.token))
      .send({ leadHours: 500, offers: [{ kind: 'interior_wash', enabled: true, priceCents: 50 }] });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ leadHours: 'invalid', 'offers.interior_wash.priceCents': 'range' });

    const driver = await addStaff(op.token, 'driver');
    expect((await api().put(`/api/internal/parkings/${op.parking.id}/extras`).set(auth(driver.token)).send({})).status).toBe(403);
  });
});

describe('services du parking (B + C du 27/10/2026)', () => {
  const service = (over: Record<string, unknown> = {}) => ({
    label: 'Lavage intérieur et shampouineuse',
    description: 'Aspiration, plastiques et shampouineuse des sièges',
    icon: 'interior',
    group: null,
    leadHours: 24,
    enabled: true,
    priceCents: 5000,
    ...over,
  });
  const put = (token: string, parkingId: string, services: unknown[]) =>
    api().put(`/api/internal/parkings/${parkingId}/extras`).set(auth(token)).send({ services });

  it('catalogue, service personnalisé, ordre, délai et groupe par service', async () => {
    const op = await publishedParking();
    currentParkingId = op.parking.id;
    const empty = await api().get(`/api/internal/parkings/${op.parking.id}/extras`).set(auth(op.token));
    expect(empty.body.services).toEqual([]);
    expect(empty.body.maxServices).toBe(10);
    expect(empty.body.catalogue.map((c: any) => c.kind)).toEqual([
      'interior_wash',
      'exterior_wash',
      'hybrid_charge',
      'ev_charge',
      'fuel',
      'tyres',
      'luggage',
    ]);

    const saved = await put(op.token, op.parking.id, [
      service({ kind: 'ev_charge', label: 'Recharge électrique', icon: 'ev', group: 'charge', leadHours: 12, priceCents: 3000 }),
      service({
        label: '  Lustrage   des jantes ',
        description: 'Jantes nettoyées et lustrées',
        icon: 'star',
        group: 'wash',
        leadHours: 36,
        priceCents: 2500,
      }),
      service({ kind: 'exterior_wash', label: 'Lavage complet', icon: 'exterior', group: 'wash', leadHours: 36, priceCents: 7500 }),
    ]);
    expect(saved.status).toBe(200);
    expect(saved.body.services.map((s: any) => [s.kind.startsWith('custom_') ? 'custom' : s.kind, s.label, s.group, s.leadHours, s.custom])).toEqual([
      ['ev_charge', 'Recharge électrique', 'charge', 12, false],
      ['custom', 'Lustrage des jantes', 'wash', 36, true],
      ['exterior_wash', 'Lavage complet', 'wash', 36, false],
    ]);
    expect(saved.body.catalogue.find((c: any) => c.kind === 'exterior_wash').added).toBe(true);
    // The old switches of Plazo Pro read the same rows.
    expect(saved.body.offers.map((o: any) => [o.kind, o.enabled])).toEqual([
      ['interior_wash', false],
      ['hybrid_charge', false],
      ['ev_charge', true],
    ]);

    // Drag: the order is the list's.
    const custom = saved.body.services[1];
    const reordered = await put(op.token, op.parking.id, [{ ...saved.body.services[2] }, { ...custom }, { ...saved.body.services[0] }]);
    expect(reordered.body.services.map((s: any) => s.label)).toEqual(['Lavage complet', 'Lustrage des jantes', 'Recharge électrique']);
    expect(reordered.body.services[1].kind).toBe(custom.kind);

    // The traveller: one per group, each service its own deadline.
    const held = await book({ extras: [custom.kind, 'exterior_wash'] });
    expect(held.body.fields).toEqual({ extras: 'one_of_group' });
    const ok = await book({ extras: [custom.kind, 'ev_charge'] });
    expect(ok.status).toBe(201);
    const view = await extrasOf(ok.body.reference, ok.body.manageToken);
    expect(view.body.offers.map((o: any) => [o.label, o.icon, o.leadHours])).toEqual([
      ['Lavage complet', 'exterior', 36],
      ['Lustrage des jantes', 'star', 36],
      ['Recharge électrique', 'ev', 12],
    ]);
    const returnAt = new Date(view.body.offers[0].orderUntil).getTime() + 36 * 3600000;
    expect(new Date(view.body.offers[2].orderUntil).getTime()).toBe(returnAt - 12 * 3600000);
    expect(new Date(view.body.orderUntil).getTime()).toBe(returnAt - 12 * 3600000);
  });

  it('retirer un service : ses commandes restent, il n’est plus proposé, et revient du catalogue', async () => {
    const op = await parkingWithExtras();
    const held = await book({ extras: ['interior_wash'] });
    const sheet = await api().post(`/api/public/bookings/${held.body.reference}/payment-intent`).set(bookingToken(held.body.manageToken));
    const event = signedEvent('payment_intent.succeeded', payIntent(sheet.body.paymentIntentId));
    await sendWebhook(event.payload, event.signature);

    const before = await api().get(`/api/internal/parkings/${currentParkingId}/extras`).set(auth(op.token));
    expect(before.body.services.find((s: any) => s.kind === 'interior_wash').toDo).toBe(1);
    const kept = before.body.services.filter((s: any) => s.kind !== 'interior_wash');
    const after = await put(op.token, currentParkingId, kept);
    expect(after.status).toBe(200);
    expect(after.body.services.map((s: any) => s.kind)).toEqual(['hybrid_charge', 'ev_charge']);
    const row = await prisma.parkingExtra.findFirstOrThrow({ where: { parkingId: currentParkingId, kind: 'interior_wash' } });
    expect(row).toMatchObject({ enabled: false, archivedAt: expect.any(Date) });

    // The order stays to do, under its frozen label, and the service is no longer offered.
    const view = await extrasOf(held.body.reference, held.body.manageToken);
    expect(view.body.orders).toEqual([
      expect.objectContaining({ kind: 'interior_wash', status: 'ordered', label: 'Lavage intérieur et shampouineuse', icon: 'interior' }),
    ]);
    expect(view.body.offers.map((o: any) => o.kind)).toEqual(['hybrid_charge', 'ev_charge']);
    const again = await book({ extras: ['interior_wash'], plate: 'HB-219-QR' });
    expect([again.status, again.body]).toEqual([400, expect.objectContaining({ fields: { extras: 'not_offered' } })]);

    // Back from the catalogue: the same row.
    const back = await put(op.token, currentParkingId, [...kept, service({ kind: 'interior_wash', priceCents: 5500 })]);
    expect(back.body.services.map((s: any) => [s.kind, s.priceCents])).toEqual([
      ['hybrid_charge', 1500],
      ['ev_charge', 3000],
      ['interior_wash', 5500],
    ]);
    expect(back.body.services[2].id).toBe(row.id);
  });

  it('refuse plus de 10 services et les champs invalides', async () => {
    const op = await publishedParking();
    const eleven = Array.from({ length: 11 }, (_, i) => service({ label: `Service ${i + 1}`, icon: 'star' }));
    expect((await put(op.token, op.parking.id, eleven)).body.fields).toEqual({ services: 'too_many' });
    const bad = await put(op.token, op.parking.id, [
      service({ label: ' ', icon: 'rocket', group: 'other', leadHours: 200, priceCents: 50 }),
      service({ kind: 'unknown', description: 'x'.repeat(141) }),
    ]);
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({
      'services.0.label': 'required',
      'services.0.icon': 'invalid',
      'services.0.group': 'invalid',
      'services.0.leadHours': 'invalid',
      'services.0.priceCents': 'range',
      'services.1.kind': 'invalid',
      'services.1.description': 'too_long',
    });
  });
});

describe('services commandés avec la réservation', () => {
  it('un seul paiement : le séjour et les services, comptés à part', async () => {
    await parkingWithExtras();
    const held = await book({ extras: ['interior_wash', 'ev_charge'] });
    expect(held.status).toBe(201);
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.body.reference } });
    // The stay's commission and share stay those of the stay; the services carry theirs.
    expect(saved).toMatchObject({ priceCents: 3499, chargedCents: 3499, extrasChargedCents: 8000, commissionCents: 420, operatorShareCents: 3079 });
    const extras = await prisma.reservationExtra.findMany({ where: { reservationId: saved.id }, orderBy: { priceCents: 'desc' } });
    expect(extras.map(e => [e.kind, e.status, e.withBooking, e.priceCents, e.commissionCents])).toEqual([
      ['interior_wash', 'pending_payment', true, 5000, 600],
      ['ev_charge', 'pending_payment', true, 3000, 360],
    ]);
    // Not shown before the payment.
    expect((await extrasOf(held.body.reference, held.body.manageToken)).body.orders).toEqual([]);

    const sheet = await api().post(`/api/public/bookings/${held.body.reference}/payment-intent`).set(bookingToken(held.body.manageToken));
    expect(sheet.body.amountCents).toBe(11499);
    const event = signedEvent('payment_intent.succeeded', payIntent(sheet.body.paymentIntentId));
    await sendWebhook(event.payload, event.signature);
    const view = await extrasOf(held.body.reference, held.body.manageToken);
    expect(view.body.orders.map((o: any) => [o.kind, o.status, o.withBooking])).toEqual([
      ['interior_wash', 'ordered', true],
      ['ev_charge', 'ordered', true],
    ]);
    // Ordered already: not again, and no other charge.
    expect(view.body.offers.map((o: any) => [o.kind, o.available, o.reason])).toEqual([
      ['interior_wash', false, 'already_ordered'],
      ['hybrid_charge', false, 'one_charge'],
      ['ev_charge', false, 'already_ordered'],
    ]);
  });

  it('refuse deux recharges, un service non proposé ou inconnu', async () => {
    const op = await publishedParking();
    currentParkingId = op.parking.id;
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/extras`)
      .set(auth(op.token))
      .send({
        offers: [
          { kind: 'hybrid_charge', enabled: true, priceCents: 1500 },
          { kind: 'ev_charge', enabled: true, priceCents: 3000 },
        ],
      });
    expect((await book({ extras: ['hybrid_charge', 'ev_charge'] })).body.fields).toEqual({ extras: 'one_charge' });
    const again = await book({ extras: ['interior_wash'], plate: 'HB-219-QR' });
    expect([again.status, again.body]).toEqual([400, expect.objectContaining({ fields: { extras: 'not_offered' } })]);
    expect((await book({ extras: ['polish'] })).status).toBe(400);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('une annulation remboursée rembourse aussi les services payés avec elle', async () => {
    await parkingWithExtras();
    const paid = await paidInApp({ extras: ['interior_wash'] });
    const cancel = await api().post(`/api/public/bookings/${paid.reference}/cancel`).set(bookingToken(paid.manageToken));
    expect(cancel.status).toBe(200);
    expect(fake.refunds.create).toHaveBeenCalledTimes(1);
    const extra = await prisma.reservationExtra.findFirstOrThrow();
    expect(extra).toMatchObject({ status: 'refunded', payoutStatus: 'cancelled' });
  });

  it('« Pas possible » sur un service payé avec la réservation : remboursement partiel du paiement de la réservation', async () => {
    const op = await parkingWithExtras();
    const paid = await paidInApp({ extras: ['interior_wash'] });
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: paid.reference } });
    const extra = await prisma.reservationExtra.findFirstOrThrow();
    const res = await api()
      .post(`/api/internal/reservations/${r.id}/extras/${extra.id}/refuse`)
      .set(auth(op.token))
      .send({ reason: 'Aspirateur en panne' });
    expect(res.status).toBe(200);
    expect(res.body.extras[0]).toMatchObject({ status: 'refused', refusedReason: 'Aspirateur en panne' });
    expect(fake.refunds.create).toHaveBeenCalledWith(
      { payment_intent: paid.paymentIntentId, amount: 5000, metadata: { extraId: extra.id } },
      { idempotencyKey: `plazo-extra-refund-${extra.id}` },
    );
    // Once only.
    expect((await api().post(`/api/internal/reservations/${r.id}/extras/${extra.id}/refuse`).set(auth(op.token))).body.code).toBe('not_to_do');
  });
});

describe('services commandés après la réservation, même après le dépôt', () => {
  it('commande, paiement par la feuille, « Fait », puis reversement à la date de la réservation', async () => {
    const op = await parkingWithExtras();
    const paid = await paidInApp();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: paid.reference } });
    // The car is dropped off: still orderable.
    await prisma.reservation.update({ where: { id: r.id }, data: { status: 'arrived', arrivedAt: new Date() } });

    const res = await order(paid.reference, paid.manageToken, 'ev_charge');
    expect(res.status).toBe(201);
    expect(res.body.payment).toMatchObject({ amountCents: 3000, currency: 'eur', clientSecret: expect.any(String) });
    const created = fake.paymentIntents.create.mock.calls.at(-1)!;
    expect(created[0]).toMatchObject({ amount: 3000, metadata: { extraId: res.body.extra.id }, transfer_group: r.id });
    // Ordering it again before paying gives the same sheet.
    const again = await order(paid.reference, paid.manageToken, 'ev_charge');
    expect(again.body.payment.paymentIntentId).toBe(res.body.payment.paymentIntentId);

    payIntent(res.body.payment.paymentIntentId);
    const synced = await api().post(`/api/public/bookings/${paid.reference}/extras/${res.body.extra.id}/sync`).set(bookingToken(paid.manageToken));
    expect(synced.body.orders).toEqual([expect.objectContaining({ kind: 'ev_charge', status: 'ordered', withBooking: false })]);
    // The booking itself is untouched.
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).toMatchObject({ paymentStatus: 'paid', chargedCents: 3499 });

    const staff = await api().get(`/api/internal/reservations/${r.id}/extras`).set(auth(op.token));
    expect(staff.body.extras).toEqual([expect.objectContaining({ kind: 'ev_charge', status: 'ordered', priceCents: 3000 })]);
    const done = await api().post(`/api/internal/reservations/${r.id}/extras/${res.body.extra.id}/done`).set(auth(op.token));
    expect(done.status).toBe(200);
    expect(done.body.extras[0]).toMatchObject({ status: 'done', doneBy: expect.any(String), doneAt: expect.any(String) });

    const later = new Date(r.returnAt.getTime() + 10 * 86400000);
    const payouts = await Container.get(ExtraService).runPayouts(later);
    expect(payouts).toMatchObject({ transferred: 1 });
    expect(fake.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3000 - 360,
        destination: `acct_${op.operator.id}`,
        metadata: { extraId: res.body.extra.id, reservationId: r.id },
      }),
      { idempotencyKey: `plazo-extra-transfer-${res.body.extra.id}` },
    );
  });

  it('le délai, une seconde recharge et un service non proposé sont refusés', async () => {
    const op = await parkingWithExtras({}, 24);
    const paid = await paidInApp();
    await orderAndPay(paid.reference, paid.manageToken, 'hybrid_charge');
    expect((await order(paid.reference, paid.manageToken, 'ev_charge')).body.code).toBe('one_charge');
    expect((await order(paid.reference, paid.manageToken, 'hybrid_charge')).body.code).toBe('already_ordered');
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/extras`)
      .set(auth(op.token))
      .send({ offers: [{ kind: 'interior_wash', enabled: false, priceCents: 5000 }] });
    expect((await order(paid.reference, paid.manageToken, 'interior_wash')).body.code).toBe('not_offered');
    // 23 hours before the return: too late.
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: paid.reference } });
    await prisma.reservation.update({
      where: { id: r.id },
      data: { returnAt: new Date(Date.now() + 23 * 3600000), arrivalAt: new Date(Date.now() - 3600000) },
    });
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/extras`)
      .set(auth(op.token))
      .send({ offers: [{ kind: 'interior_wash', enabled: true, priceCents: 5000 }] });
    expect((await order(paid.reference, paid.manageToken, 'interior_wash')).body.code).toBe('too_late');
    const view = await extrasOf(paid.reference, paid.manageToken);
    expect(view.body.canOrder).toBe(false);
  });

  it('une feuille fermée sans payer ne bloque pas une autre recharge', async () => {
    await parkingWithExtras();
    const paid = await paidInApp();
    const first = await order(paid.reference, paid.manageToken, 'hybrid_charge');
    const closed = await api().delete(`/api/public/bookings/${paid.reference}/extras/${first.body.extra.id}`).set(bookingToken(paid.manageToken));
    expect(closed.status).toBe(200);
    expect(fake.paymentIntents.cancel).toHaveBeenCalledWith(first.body.payment.paymentIntentId, {}, expect.anything());
    expect((await order(paid.reference, paid.manageToken, 'ev_charge')).status).toBe(201);
    expect((await prisma.reservationExtra.findUniqueOrThrow({ where: { id: first.body.extra.id } })).status).toBe('expired');
  });

  it('un service encore à faire quand la voiture est rendue est remboursé par la passe de 15 minutes', async () => {
    await parkingWithExtras();
    const paid = await paidInApp();
    const extraId = await orderAndPay(paid.reference, paid.manageToken, 'interior_wash');
    await prisma.reservation.update({ where: { reference: paid.reference }, data: { status: 'returned', returnedAt: new Date() } });
    const res = await api().get('/api/internal/cron/remind-tomorrow').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.body.extras).toMatchObject({ refunded: 1, failed: 0 });
    const intent = (await prisma.reservationExtra.findUniqueOrThrow({ where: { id: extraId } })).stripePaymentIntentId;
    expect(fake.refunds.create).toHaveBeenCalledWith(
      { payment_intent: intent, metadata: { extraId } },
      { idempotencyKey: `plazo-extra-refund-${extraId}` },
    );
    expect(await prisma.reservationExtra.findUniqueOrThrow({ where: { id: extraId } })).toMatchObject({
      status: 'refunded',
      payoutStatus: 'cancelled',
    });
  });

  it('le tableau de bord signale les services à faire avant un retour proche', async () => {
    const op = await parkingWithExtras();
    const paid = await paidInApp();
    await orderAndPay(paid.reference, paid.manageToken, 'interior_wash');
    await orderAndPay(paid.reference, paid.manageToken, 'ev_charge');
    await prisma.reservation.update({
      where: { reference: paid.reference },
      data: { status: 'arrived', arrivedAt: new Date(), arrivalAt: new Date(Date.now() - 86400000), returnAt: new Date(Date.now() + 4 * 3600000) },
    });
    const dash = await api().get('/api/internal/dashboard').set(auth(op.token));
    const alert = dash.body.alerts.find((a: any) => a.kind === 'extras_due');
    expect(alert).toMatchObject({ severity: 'watch', detail: 'Lavage intérieur et shampouineuse, Recharge électrique', plate: 'GK-318-PX' });
  });

  it('une commande refusée hors d’une réservation Plazo payée, sans jeton', async () => {
    await parkingWithExtras();
    const held = (await book()).body;
    expect((await order(held.reference, held.manageToken, 'interior_wash')).body.code).toBe('not_online');
    expect((await order(held.reference, 'mauvais', 'interior_wash')).status).toBe(404);
  });
});
