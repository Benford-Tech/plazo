import http from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { Container } from 'typedi';
import prisma, { PayoutSchedule } from '@/database';
import { payoutDueAt, payoutDueDate } from '@/domain/payout';
import { localDateTime } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { PaymentService } from '@/services/payment.service';
import { StripeApi, StripeService } from '@/services/stripe.service';
import { ValidateEnv } from '@/utils/validateEnv';
import { addStaff, api, app, resetDatabase, setupOperator, publishListing, useBrevoSms } from './utils/helpers';

// Online payment with Stripe Connect. The Stripe SDK is replaced by mocks: no network.

const TZ = 'Europe/Paris';
const WEBHOOK_SECRET = 'whsec_test_secret';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const bookingToken = (value: string) => ({ 'x-booking-token': value });
const inDays = (days: number, time: string) => `${localDateTime(new Date(Date.now() + days * 86400000), TZ).slice(0, 10)}T${time}`;

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

/** The traveller pays on the (fake) Stripe page. */
function pay(sessionId: string) {
  const session = sessions.get(sessionId)!;
  Object.assign(session, { status: 'complete', payment_status: 'paid', url: null, payment_intent: 'pi_test_1' });
  return { ...session };
}

/** The traveller pays in the app's (fake) payment sheet. */
function payIntent(id: string) {
  const intent = intents.get(id)!;
  Object.assign(intent, { status: 'succeeded', amount_received: intent.amount, latest_charge: 'ch_sheet_1' });
  return { ...intent };
}

function signedEvent(type: string, object: unknown, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, object: 'event', type, data: { object } });
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
const checkout = (reference: string, manageToken: string) => api().post(`/api/public/bookings/${reference}/checkout`).set(bookingToken(manageToken));
const getBooking = (reference: string, manageToken: string) => api().get(`/api/public/bookings/${reference}`).set(bookingToken(manageToken));

/** A booking held, then paid through the webhook. */
async function paidBooking(overrides: Record<string, unknown> = {}) {
  const { body } = await book(overrides);
  const res = await checkout(body.reference, body.manageToken);
  const sessionId = [...sessions.keys()].pop()!;
  const event = signedEvent('checkout.session.completed', pay(sessionId));
  expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
  return { ...body, url: res.body.url as string, sessionId };
}

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

const withBrevo = () =>
  Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'reservations@example.com', publicSiteUrl: 'https://site.example' });
const brevoCalls = (tag: string) =>
  fetchMock.mock.calls.filter(([, init]) => {
    const body = JSON.parse(init.body);
    return (body.tags ?? [body.tag]).includes(tag);
  });

// ---- Tests ------------------------------------------------------------------------------------

describe('paiement désactivé (sans STRIPE_SECRET_KEY)', () => {
  it('garde le paiement sur place : réservation confirmée tout de suite, aucun appel à Stripe', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await publishedParking({ onboarded: false });
    expect((await api().get('/api/public/config')).body).toEqual({ payments: 'on_site' });
    const page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body).toMatchObject({ payments: 'on_site', parking: { payment: 'on_site' } });
    const res = await book();
    expect(res.status).toBe(201);
    expect(res.body.booking).toMatchObject({ status: 'upcoming', paymentMode: 'on_site', payment: null });
    expect(fake.checkout.sessions.create).not.toHaveBeenCalled();
    expect((await checkout(res.body.reference, res.body.manageToken)).status).toBe(404);
  });
});

describe('paiement en ligne : place tenue pendant le paiement', () => {
  it('un parking dont le loueur n’encaisse pas encore n’est pas réservable en ligne', async () => {
    await publishedParking({ onboarded: false });
    expect((await api().get('/api/public/config')).body).toEqual({ payments: 'online' });
    const page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body.parking.payment).toBe('unavailable');
    const res = await book();
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('online_booking_unavailable');
  });

  it('sans commission configurée non plus', async () => {
    await publishedParking({ commissionBps: null });
    expect((await api().get('/api/public/airports/lyon-saint-exupery')).body.listings[0].payment).toBe('unavailable');
  });

  it('crée la réservation en attente de paiement, avec la commission calculée par le serveur, sans message', async () => {
    withBrevo();
    const { operator } = await publishedParking();
    const page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body.parking.payment).toBe('online');
    const res = await book({ priceCents: 1, commissionCents: 0, operatorShareCents: 1 });
    expect(res.status).toBe(201);
    expect(res.body.booking).toMatchObject({ status: 'pending_payment', paymentMode: 'online', priceCents: 3499, canCancel: false });
    expect(res.body.booking.payment.status).toBe('pending');
    expect(res.body.booking.payment.holdSecondsLeft).toBeGreaterThan(29 * 60);
    expect(res.body.booking.payment.holdSecondsLeft).toBeLessThanOrEqual(30 * 60);
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } });
    // 12 % of 34,99 € = 4,1988 € -> 4,20 € for Plazo, 30,79 € for the operator.
    expect(saved).toMatchObject({
      operatorId: operator.id,
      chargedCents: 3499,
      commissionCents: 420,
      operatorShareCents: 3079,
      paymentStatus: 'pending',
      payoutStatus: null,
      confirmationSentAt: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('la place tenue compte dans la capacité, et le personnel ne voit pas la réservation non payée', async () => {
    const op = await publishedParking({ capacity: 1 });
    const held = await book();
    expect(held.status).toBe(201);
    const other = await book({ plate: 'BB-222-BB', customerEmail: 'autre@example.com', customerPhone: '06 99 99 99 99' });
    expect(other.status).toBe(409);
    expect(other.body.code).toBe('overbooked');
    const search = await api()
      .get('/api/public/search')
      .query({ airport: 'lyon-saint-exupery', arrivalAt: bookingBody().arrivalAt, returnAt: bookingBody().returnAt });
    expect(search.body.results[0].available).toBe(false);

    const list = await api().get('/api/internal/reservations').set(auth(op.token));
    expect(list.body.docs).toHaveLength(0);
    const planning = await api()
      .get('/api/internal/planning')
      .query({ date: bookingBody().arrivalAt.slice(0, 10) })
      .set(auth(op.token));
    expect(planning.body.arrivals).toHaveLength(0);
    expect(planning.body.nights[0].count).toBe(1);
    const id = (await prisma.reservation.findFirstOrThrow()).id;
    expect((await api().get(`/api/internal/reservations/${id}`).set(auth(op.token))).status).toBe(404);
    expect((await api().post(`/api/internal/reservations/${id}/status`).set(auth(op.token)).send({ status: 'arrived' })).status).toBe(404);
  });

  it('à l’expiration, la place est libérée (même avant le nettoyage), puis la réservation se lit « expirée »', async () => {
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    // Capacity ignores a lapsed hold right away.
    const search = await api()
      .get('/api/public/search')
      .query({ airport: 'lyon-saint-exupery', arrivalAt: bookingBody().arrivalAt, returnAt: bookingBody().returnAt });
    expect(search.body.results[0].available).toBe(true);
    const read = await getBooking(held.reference, held.manageToken);
    expect(read.body).toMatchObject({ status: 'cancelled', payment: { status: 'expired', holdExpiresAt: null } });
    const again = await checkout(held.reference, held.manageToken);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('hold_expired');
    // The same vehicle can book again.
    expect((await book()).status).toBe(201);
  });

  it('la tâche planifiée expire les places tenues trop longtemps', async () => {
    await publishedParking();
    const held = (await book()).body;
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    expect((await api().get('/api/internal/cron/expire-payment-holds')).status).toBe(401);
    const res = await api().get('/api/internal/cron/expire-payment-holds').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ expired: 1 });
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(saved).toMatchObject({ status: 'cancelled', paymentStatus: 'expired' });
  });
});

describe('Stripe Checkout', () => {
  it('crée la session : paiement encaissé par Plazo (transfer_group), montant en centimes', async () => {
    const op = await publishedParking();
    const held = (await book()).body;
    const res = await checkout(held.reference, held.manageToken);
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.stripe.test/c/pay/cs_test_1');
    expect(fake.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const [params, options] = fake.checkout.sessions.create.mock.calls[0];
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(params).toMatchObject({
      mode: 'payment',
      locale: 'fr',
      currency: 'eur',
      customer_email: 'camille.martin@example.com',
      metadata: { reservationId: reservation.id },
      client_reference_id: reservation.id,
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: 3499 } }],
      // Separate charges and transfers: charged on Plazo's account, the share is transferred later.
      payment_intent_data: { transfer_group: reservation.id, metadata: { reservationId: reservation.id } },
      success_url: `https://site.example/ma-reservation/${held.reference}?paiement=retour`,
      cancel_url: `https://site.example/ma-reservation/${held.reference}/paiement`,
    });
    expect(params.payment_intent_data).not.toHaveProperty('transfer_data');
    expect(params.payment_intent_data).not.toHaveProperty('application_fee_amount');
    expect(op.operator.id).toBeTruthy();
    // Stripe needs at least 30 minutes: the hold follows the payment page.
    expect(params.expires_at).toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) + 30 * 60);
    expect(reservation.holdExpiresAt!.getTime()).toBe(params.expires_at * 1000);
    expect(reservation.stripeCheckoutSessionId).toBe('cs_test_1');
    expect(options.idempotencyKey).toMatch(new RegExp(`^plazo-checkout-${reservation.id}-first-\\d+$`));
    // No personal data beyond the email Stripe needs for its receipt.
    expect(JSON.stringify(params)).not.toMatch(/Camille|GK-318|06 12/);
  });

  it('réutilise la session encore ouverte', async () => {
    await publishedParking();
    const held = (await book()).body;
    const first = await checkout(held.reference, held.manageToken);
    const second = await checkout(held.reference, held.manageToken);
    expect(second.body.url).toBe(first.body.url);
    expect(fake.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('refuse sans la clé de la réservation', async () => {
    await publishedParking();
    const held = (await book()).body;
    expect((await checkout(held.reference, 'x'.repeat(32))).status).toBe(404);
    expect(fake.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe('webhook Stripe', () => {
  it('refuse une signature invalide ou absente', async () => {
    const event = signedEvent('checkout.session.completed', { id: 'cs_x' }, 'whsec_wrong');
    const res = await sendWebhook(event.payload, event.signature);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_signature');
    const tampered = signedEvent('checkout.session.completed', { id: 'cs_x' });
    expect((await sendWebhook(tampered.payload.replace('cs_x', 'cs_y'), tampered.signature)).status).toBe(400);
    expect((await api().post('/api/public/stripe/webhook').send({ type: 'checkout.session.completed' })).status).toBe(400);
  });

  it('répond 503 tant qu’aucun secret n’est configuré', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const event = signedEvent('account.updated', { id: 'acct_x' });
    const res = await sendWebhook(event.payload, event.signature);
    expect(res.status).toBe(503);
  });

  it('lit le corps brut aussi derrière les assistants de Vercel (corps déjà lu puis rejoué)', async () => {
    // What @vercel/node does before calling the app: read the stream, replay it to "data"/"end"
    // listeners, and expose a lazily parsed req.body.
    const server = http.createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      const { PassThrough } = await import('stream');
      const replay = new PassThrough();
      const on = replay.on.bind(replay);
      const originalOn = req.on.bind(req);
      (req as any).read = replay.read.bind(replay);
      (req as any).on = (req as any).addListener = (name: string, cb: any) =>
        name === 'data' || name === 'end' ? on(name, cb) : originalOn(name, cb);
      replay.end(body);
      let parsed: unknown;
      Object.defineProperty(req, 'body', {
        configurable: true,
        enumerable: true,
        get: () => (parsed ??= JSON.parse(body.toString())),
        set: value => Object.defineProperty(req, 'body', { value, writable: true, configurable: true, enumerable: true }),
      });
      app(req as any, res as any);
    });
    await new Promise<void>(resolve => server.listen(0, resolve));
    try {
      const { port } = server.address() as AddressInfo;
      // Pretty-printed JSON: re-serialising the parsed body would change the signed bytes.
      const payload = JSON.stringify({ id: 'evt_v', object: 'event', type: 'account.updated', data: { object: { id: 'acct_none' } } }, null, 2);
      const ok = await request(`http://localhost:${port}`)
        .post('/api/public/stripe/webhook')
        .set('content-type', 'application/json')
        .set('stripe-signature', stripeService.signatureFor(payload, WEBHOOK_SECRET))
        .send(payload);
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ received: true, type: 'account.updated' });
      // Other routes still get their JSON.
      const json = await request(`http://localhost:${port}`).post('/api/public/bookings/lookup').send({ reference: 'RXXXXX', email: 'a@b.fr' });
      expect(json.status).toBe(404);
    } finally {
      server.close();
    }
  });

  it('confirme une seule fois, que le webhook ou le retour du voyageur arrive en premier ; messages envoyés une fois', async () => {
    withBrevo();
    await publishedParking();
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    const paid = pay('cs_test_1');

    // The traveller is back first: reading the booking asks Stripe.
    const first = await getBooking(held.reference, held.manageToken);
    expect(first.body).toMatchObject({ status: 'upcoming', payment: { status: 'paid', holdExpiresAt: null }, canCancel: true });
    // Then the webhook, twice (Stripe retries), and another read.
    const event = signedEvent('checkout.session.completed', paid);
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    await getBooking(held.reference, held.manageToken);
    await Promise.all([sendWebhook(event.payload, event.signature), getBooking(held.reference, held.manageToken)]);

    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(saved).toMatchObject({ status: 'upcoming', paymentStatus: 'paid', stripePaymentIntentId: 'pi_test_1' });
    expect(saved.confirmationSentAt).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { action: 'reservation.paid', entityId: saved.id } })).toBe(1);
    expect(brevoCalls('booking_confirmed')).toHaveLength(2); // one email, one SMS
    const email = JSON.parse(brevoCalls('booking_confirmed').find(([url]) => String(url).endsWith('/smtp/email'))![1].body);
    expect(email.textContent).toContain('34,99 €, payé en ligne par carte');
    expect(email.textContent).not.toContain('sur place');
    const sms = JSON.parse(brevoCalls('booking_confirmed').find(([url]) => String(url).endsWith('/transactionalSMS/send'))![1].body);
    expect(sms.content).toContain('34,99 € payés');
  });

  it('webhook d’abord, puis retour : même résultat', async () => {
    withBrevo();
    await publishedParking();
    const held = await paidBooking();
    const read = await getBooking(held.reference, held.manageToken);
    expect(read.body.status).toBe('upcoming');
    expect(brevoCalls('booking_confirmed')).toHaveLength(2);
    // Already paid: "Payer" again does not open another page.
    expect((await checkout(held.reference, held.manageToken)).body).toEqual({ paid: true });
    expect(fake.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('n’accepte pas un montant différent', async () => {
    await publishedParking();
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    const event = signedEvent('checkout.session.completed', { ...pay('cs_test_1'), amount_total: 100 });
    await sendWebhook(event.payload, event.signature);
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(saved.status).toBe('pending_payment');
  });

  it('checkout.session.expired libère la place', async () => {
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    const event = signedEvent('checkout.session.expired', { ...sessions.get('cs_test_1'), status: 'expired' });
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'cancelled',
      paymentStatus: 'expired',
    });
    expect((await book({ plate: 'BB-222-BB', customerEmail: 'b@example.com', customerPhone: '06 99 99 99 99' })).status).toBe(201);
  });

  it('un paiement arrivé après l’expiration garde la réservation si la place est libre…', async () => {
    withBrevo();
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    await payments.expireLapsedHolds();
    const event = signedEvent('checkout.session.completed', pay('cs_test_1'));
    await sendWebhook(event.payload, event.signature);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'upcoming',
      paymentStatus: 'paid',
    });
    expect(fake.refunds.create).not.toHaveBeenCalled();
    expect(brevoCalls('booking_confirmed')).toHaveLength(2);
  });

  it('… et le rembourse si la place a été prise entre-temps', async () => {
    withBrevo();
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    expect((await book({ plate: 'BB-222-BB', customerEmail: 'b@example.com', customerPhone: '06 99 99 99 99' })).status).toBe(201);
    const event = signedEvent('checkout.session.completed', pay('cs_test_1'));
    await sendWebhook(event.payload, event.signature);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'cancelled',
      paymentStatus: 'refunded',
      stripeRefundId: 're_test_1',
    });
    expect(fake.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_test_1' }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^plazo-refund-/) }),
    );
    expect(brevoCalls('booking_confirmed')).toHaveLength(0);
    expect(brevoCalls('booking_cancelled')).toHaveLength(1);
  });
});

describe('feuille de paiement de l’app (PaymentIntent)', () => {
  const intent = (reference: string, manageToken: string) =>
    api().post(`/api/public/bookings/${reference}/payment-intent`).set(bookingToken(manageToken));
  const sheetPaid = async (overrides: Record<string, unknown> = {}) => {
    const { body } = await book(overrides);
    const res = await intent(body.reference, body.manageToken);
    const event = signedEvent('payment_intent.succeeded', payIntent(res.body.paymentIntentId));
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    return { ...body, paymentIntentId: res.body.paymentIntentId as string, event };
  };

  it('réglages publics : clé publiable seulement si le paiement est actif', async () => {
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake';
    expect((await api().get('/api/public/payments/config')).body).toEqual({
      payments: 'online',
      publishableKey: 'pk_test_fake',
      merchantDisplayName: 'Plazo',
      merchantCountryCode: 'FR',
      currency: 'eur',
    });
    delete process.env.STRIPE_PUBLISHABLE_KEY;
    expect((await api().get('/api/public/payments/config')).body).toMatchObject({ payments: 'online', publishableKey: null });
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake';
    expect((await api().get('/api/public/payments/config')).body).toMatchObject({ payments: 'on_site', publishableKey: null });
    // The site's config route keeps its exact answer.
    expect((await api().get('/api/public/config')).body).toEqual({ payments: 'on_site' });
  });

  it('crée le PaymentIntent : même montant et même commission que Checkout, metadata, clé d’idempotence', async () => {
    await publishedParking();
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    expect(res.status).toBe(200);
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(res.body).toEqual({
      clientSecret: 'pi_sheet_1_secret_abc',
      paymentIntentId: 'pi_sheet_1',
      amountCents: 3499,
      currency: 'eur',
      holdExpiresAt: reservation.holdExpiresAt!.toISOString(),
    });
    const [params, options] = fake.paymentIntents.create.mock.calls[0];
    expect(params).toMatchObject({
      amount: 3499,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: 'camille.martin@example.com',
      metadata: { reservationId: reservation.id },
      transfer_group: reservation.id,
    });
    expect(params).not.toHaveProperty('application_fee_amount');
    expect(options.idempotencyKey).toBe(`plazo-intent-${reservation.id}-nosession-first`);
    expect(JSON.stringify(params)).not.toMatch(/Camille|GK-318|06 12/);
    expect(reservation).toMatchObject({ stripePaymentIntentId: 'pi_sheet_1', chargedCents: 3499, commissionCents: 420, operatorShareCents: 3079 });
    // The hold is not extended by the payment sheet.
    expect(reservation.holdExpiresAt!.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60000);

    // Asked again (sheet reopened): the same intent.
    const again = await intent(held.reference, held.manageToken);
    expect(again.body.clientSecret).toBe('pi_sheet_1_secret_abc');
    expect(fake.paymentIntents.create).toHaveBeenCalledTimes(1);
  });

  it('refuse sans la clé de la réservation, pour un paiement sur place, ou paiement désactivé', async () => {
    await publishedParking();
    const held = (await book()).body;
    expect((await intent(held.reference, 'x'.repeat(32))).status).toBe(404);
    delete process.env.STRIPE_SECRET_KEY;
    const disabled = await intent(held.reference, held.manageToken);
    expect(disabled.status).toBe(409);
    expect(disabled.body.code).toBe('online_booking_unavailable');
    const onSite = (await book({ plate: 'BB-222-BB', customerEmail: 'b@example.com', customerPhone: '06 99 99 99 99' })).body;
    expect(onSite.booking.paymentMode).toBe('on_site');
    expect((await intent(onSite.reference, onSite.manageToken)).status).toBe(404);
    expect(fake.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('payment_intent.succeeded confirme une seule fois ; messages envoyés une fois', async () => {
    withBrevo();
    await publishedParking();
    const held = await sheetPaid();
    // Stripe retries, the app reads the booking, and asks again for the intent.
    expect((await sendWebhook(held.event.payload, held.event.signature)).status).toBe(200);
    const read = await getBooking(held.reference, held.manageToken);
    expect(read.body).toMatchObject({ status: 'upcoming', payment: { status: 'paid', holdExpiresAt: null } });
    expect((await intent(held.reference, held.manageToken)).body).toEqual({ paid: true });
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(saved).toMatchObject({ status: 'upcoming', paymentStatus: 'paid', payoutStatus: 'pending', stripePaymentIntentId: 'pi_sheet_1' });
    expect(await prisma.auditLog.count({ where: { action: 'reservation.paid', entityId: saved.id } })).toBe(1);
    expect(brevoCalls('booking_confirmed')).toHaveLength(2); // one email, one SMS
  });

  it('retour de l’app avant le webhook : la lecture interroge Stripe et confirme', async () => {
    withBrevo();
    await publishedParking();
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    const paid = payIntent(res.body.paymentIntentId);
    expect((await getBooking(held.reference, held.manageToken)).body.status).toBe('upcoming');
    const event = signedEvent('payment_intent.succeeded', paid);
    await sendWebhook(event.payload, event.signature);
    expect(brevoCalls('booking_confirmed')).toHaveLength(2);
  });

  it('n’accepte pas un montant différent', async () => {
    await publishedParking();
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    const event = signedEvent('payment_intent.succeeded', { ...payIntent(res.body.paymentIntentId), amount: 100, amount_received: 100 });
    await sendWebhook(event.payload, event.signature);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).status).toBe('pending_payment');
  });

  it('payment_intent.payment_failed : la place reste tenue, le voyageur peut réessayer', async () => {
    withBrevo();
    await publishedParking();
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    const failed = { ...intents.get(res.body.paymentIntentId)!, last_payment_error: { code: 'card_declined' } };
    const event = signedEvent('payment_intent.payment_failed', failed);
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'pending_payment',
      paymentStatus: 'pending',
    });
    expect((await intent(held.reference, held.manageToken)).body.clientSecret).toBe(res.body.clientSecret);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('délai dépassé : 409 hold_expired ; un paiement tardif est gardé si la place est libre…', async () => {
    withBrevo();
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    const late = await intent(held.reference, held.manageToken);
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('hold_expired');
    const event = signedEvent('payment_intent.succeeded', payIntent(res.body.paymentIntentId));
    await sendWebhook(event.payload, event.signature);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'upcoming',
      paymentStatus: 'paid',
    });
    expect(brevoCalls('booking_confirmed')).toHaveLength(2);
  });

  it('… et remboursé si la place a été prise entre-temps', async () => {
    withBrevo();
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    await prisma.reservation.update({ where: { reference: held.reference }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    expect((await book({ plate: 'BB-222-BB', customerEmail: 'b@example.com', customerPhone: '06 99 99 99 99' })).status).toBe(201);
    const event = signedEvent('payment_intent.succeeded', payIntent(res.body.paymentIntentId));
    await sendWebhook(event.payload, event.signature);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'cancelled',
      paymentStatus: 'refunded',
    });
    expect(fake.refunds.create).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: 'pi_sheet_1' }), expect.anything());
    expect(brevoCalls('booking_confirmed')).toHaveLength(0);
    expect(brevoCalls('booking_cancelled')).toHaveLength(1);
  });

  it('une seule façon de payer : la page Checkout ouverte est fermée, et inversement', async () => {
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    const res = await intent(held.reference, held.manageToken);
    expect(fake.checkout.sessions.expire).toHaveBeenCalledWith('cs_test_1', {}, expect.anything());
    // The "expired" webhook of that page does not release the place held for the sheet.
    const expired = signedEvent('checkout.session.expired', { ...sessions.get('cs_test_1') });
    await sendWebhook(expired.payload, expired.signature);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).status).toBe('pending_payment');
    // Back to Checkout (web fallback): the intent is cancelled, a new page opens.
    const page = await checkout(held.reference, held.manageToken);
    expect(page.body.url).toBe('https://checkout.stripe.test/c/pay/cs_test_2');
    expect(intents.get(res.body.paymentIntentId)!.status).toBe('canceled');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).stripePaymentIntentId).toBeNull();
    // And the sheet again: a new intent (another idempotency key).
    const second = await intent(held.reference, held.manageToken);
    expect(second.body.paymentIntentId).toBe('pi_sheet_2');
  });

  it('« Modifier » annule le PaymentIntent et libère la place ; refusé s’il est payé (et confirmé)', async () => {
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    const res = await intent(held.reference, held.manageToken);
    const release = await api().post(`/api/public/bookings/${held.reference}/release`).set(bookingToken(held.manageToken));
    expect(release.status).toBe(200);
    expect(release.body).toMatchObject({ status: 'cancelled', payment: { status: 'expired' } });
    expect(intents.get(res.body.paymentIntentId)!.status).toBe('canceled');

    const other = (await book()).body;
    const otherIntent = await intent(other.reference, other.manageToken);
    payIntent(otherIntent.body.paymentIntentId);
    const refused = await api().post(`/api/public/bookings/${other.reference}/release`).set(bookingToken(other.manageToken));
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('already_paid');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { reference: other.reference } })).status).toBe('upcoming');
  });

  it('annulation d’une réservation payée dans l’app : remboursement intégral sur son PaymentIntent', async () => {
    await publishedParking();
    const held = await sheetPaid();
    const res = await api().post(`/api/public/bookings/${held.reference}/cancel`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'cancelled', payment: { status: 'refunded' } });
    expect(fake.refunds.create).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: 'pi_sheet_1' }), expect.anything());
  });
});

describe('« Modifier » : la place est rendue', () => {
  it('ferme la page de paiement ouverte et libère la place ; le même véhicule peut réserver de nouveau', async () => {
    await publishedParking({ capacity: 1 });
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    const res = await api().post(`/api/public/bookings/${held.reference}/release`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'cancelled', payment: { status: 'expired' } });
    expect(fake.checkout.sessions.expire).toHaveBeenCalledWith('cs_test_1', {}, { idempotencyKey: 'plazo-expire-cs_test_1' });
    expect((await book({ passengers: 3 })).status).toBe(201);
  });

  it('refuse si le paiement est passé entre-temps (et confirme la réservation)', async () => {
    await publishedParking();
    const held = (await book()).body;
    await checkout(held.reference, held.manageToken);
    pay('cs_test_1');
    const res = await api().post(`/api/public/bookings/${held.reference}/release`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('already_paid');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).status).toBe('upcoming');
  });
});

describe('remboursements', () => {
  it('annulation par le voyageur avant le reversement : remboursement intégral depuis Plazo, reversement annulé', async () => {
    withBrevo();
    await publishedParking();
    const held = await paidBooking();
    fetchMock.mockClear();
    const res = await api().post(`/api/public/bookings/${held.reference}/cancel`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'cancelled', payment: { status: 'refunded' } });
    expect(fake.refunds.create).toHaveBeenCalledTimes(1);
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(fake.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_test_1', metadata: { reservationId: reservation.id } },
      { idempotencyKey: `plazo-refund-${reservation.id}` },
    );
    expect(reservation).toMatchObject({ paymentStatus: 'refunded', stripeRefundId: 're_test_1', payoutStatus: 'cancelled' });
    expect(fake.transfers.createReversal).not.toHaveBeenCalled();
    // Nothing to transfer any more.
    expect((await payments.runPayouts(new Date(Date.now() + 30 * 86400000))).transferred).toBe(0);
    expect(fake.transfers.create).not.toHaveBeenCalled();
    const email = JSON.parse(brevoCalls('booking_cancelled')[0][1].body);
    expect(email.textContent).toContain('Remboursement intégral de 34,99 € sur votre carte, sous 5 à 10 jours.');
  });

  it('si Stripe refuse le remboursement, rien ne change', async () => {
    await publishedParking();
    const held = await paidBooking();
    fake.refunds.create.mockRejectedValueOnce(Object.assign(new Error('boom camille.martin@example.com'), { type: 'StripeAPIError' }));
    const res = await api().post(`/api/public/bookings/${held.reference}/cancel`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('refund_failed');
    expect(await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } })).toMatchObject({
      status: 'upcoming',
      paymentStatus: 'paid',
    });
  });

  it('hors délai : règles actuelles (pas d’annulation en ligne, pas de remboursement)', async () => {
    await publishedParking();
    const held = await paidBooking({ arrivalAt: inDays(0, '23:50'), returnAt: inDays(3, '10:00') });
    const res = await api().post(`/api/public/bookings/${held.reference}/cancel`).set(bookingToken(held.manageToken));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('cancellation_closed');
    expect(fake.refunds.create).not.toHaveBeenCalled();
  });

  it('annulation par le loueur dans l’espace pro : remboursement aussi ; réouverture refusée', async () => {
    withBrevo();
    const op = await publishedParking();
    const held = await paidBooking();
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    fetchMock.mockClear();
    const res = await api().post(`/api/internal/reservations/${reservation.id}/status`).set(auth(op.token)).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'cancelled', paymentStatus: 'refunded' });
    expect(fake.refunds.create).toHaveBeenCalledTimes(1);
    expect(brevoCalls('booking_cancelled')).toHaveLength(1);
    const reopen = await api().post(`/api/internal/reservations/${reservation.id}/status`).set(auth(op.token)).send({ status: 'upcoming' });
    expect(reopen.status).toBe(409);
    expect(reopen.body.code).toBe('booking_refunded');
  });
});

describe('compte Stripe du loueur', () => {
  it('le gérant crée son compte Express une seule fois et reçoit un lien d’inscription', async () => {
    const op = await setupOperator();
    const res = await api().post('/api/internal/payments/onboarding').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://connect.stripe.test/setup/e/acct_test_new');
    expect(fake.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'express',
        country: 'FR',
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      }),
      { idempotencyKey: `plazo-account-${op.operator.id}` },
    );
    expect(fake.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        account: 'acct_test_new',
        type: 'account_onboarding',
        return_url: 'https://site.example/pro/plazo/fiche?stripe=retour',
        refresh_url: 'https://site.example/pro/plazo/fiche?stripe=relance',
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: op.operator.id } })).stripeAccountId).toBe('acct_test_new');
    await api().post('/api/internal/payments/onboarding').set(auth(op.token));
    expect(fake.accounts.create).toHaveBeenCalledTimes(1);
    expect(fake.accountLinks.create).toHaveBeenCalledTimes(2);
  });

  it('statut par loueur, rafraîchi depuis Stripe ; réservé au gérant', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    const commissionBps = payments.commissionBps({ commissionBps: null });
    expect((await api().get('/api/internal/payments/status').set(auth(a.token))).body).toEqual({
      enabled: true,
      testMode: true,
      connected: false,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      commissionBps,
      payoutSchedule: 'AFTER_STAY',
    });
    await api().post('/api/internal/payments/onboarding').set(auth(a.token));
    const status = await api().get('/api/internal/payments/status').set(auth(a.token));
    expect(status.body).toEqual({
      enabled: true,
      testMode: true,
      connected: true,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      commissionBps,
      payoutSchedule: 'AFTER_STAY',
    });
    expect(fake.accounts.retrieve).toHaveBeenCalledWith('acct_test_new');
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: a.operator.id } })).stripeChargesEnabled).toBe(true);
    // Operator B sees its own (absent) account, never A's.
    expect((await api().get('/api/internal/payments/status').set(auth(b.token))).body.connected).toBe(false);

    const agent = await addStaff(a.token, 'agent');
    expect((await api().get('/api/internal/payments/status').set(auth(agent.token))).status).toBe(403);
    expect((await api().post('/api/internal/payments/onboarding').set(auth(agent.token))).status).toBe(403);
    expect((await api().get('/api/internal/payments/status')).status).toBe(401);
  });

  it('account.updated met à jour le seul loueur concerné', async () => {
    const a = await publishedParking({ name: 'A' });
    const b = await publishedParking({ name: 'B', slug: 'parking-b' });
    const event = signedEvent('account.updated', { id: `acct_${a.operator.id}`, object: 'account', charges_enabled: false, payouts_enabled: false });
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: a.operator.id } })).stripePayoutsEnabled).toBe(false);
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: b.operator.id } })).stripePayoutsEnabled).toBe(true);
    const page = await api().get('/api/public/airports/lyon-saint-exupery/parkings/parking-demo');
    expect(page.body.parking.payment).toBe('unavailable');
  });

  it('vérification en cours : dossier envoyé, virements pas encore ouverts ; commission du loueur', async () => {
    const op = await setupOperator();
    await prisma.operator.update({ where: { id: op.operator.id }, data: { commissionBps: 900 } });
    await api().post('/api/internal/payments/onboarding').set(auth(op.token));
    fake.accounts.retrieve.mockResolvedValueOnce({
      id: 'acct_test_new',
      object: 'account',
      details_submitted: true,
      charges_enabled: false,
      payouts_enabled: false,
    });
    const status = await api().get('/api/internal/payments/status').set(auth(op.token));
    expect(status.body).toMatchObject({ connected: true, detailsSubmitted: true, payoutsEnabled: false, commissionBps: 900 });
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: op.operator.id } })).stripeDetailsSubmitted).toBe(true);
  });

  it('account.updated enregistre l’envoi du dossier', async () => {
    const op = await setupOperator();
    await prisma.operator.update({ where: { id: op.operator.id }, data: { stripeAccountId: 'acct_sent' } });
    const event = signedEvent('account.updated', {
      id: 'acct_sent',
      object: 'account',
      details_submitted: true,
      charges_enabled: false,
      payouts_enabled: false,
    });
    expect((await sendWebhook(event.payload, event.signature)).status).toBe(200);
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: op.operator.id } })).stripeDetailsSubmitted).toBe(true);
  });

  it('lien vers le tableau de bord Stripe : gérant, compte inscrit, chacun le sien', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    const before = await api().post('/api/internal/payments/dashboard-link').set(auth(a.token));
    expect([before.status, before.body.code]).toEqual([409, 'payments_not_connected']);
    expect(fake.accounts.createLoginLink).not.toHaveBeenCalled();

    await prisma.operator.update({ where: { id: a.operator.id }, data: { stripeAccountId: 'acct_a', stripeDetailsSubmitted: true } });
    const res = await api().post('/api/internal/payments/dashboard-link').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: 'https://connect.stripe.test/express/acct_a' });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(fake.accounts.createLoginLink).toHaveBeenCalledWith('acct_a');
    // B has no account: never A's dashboard.
    expect((await api().post('/api/internal/payments/dashboard-link').set(auth(b.token))).status).toBe(409);

    const agent = await addStaff(a.token, 'agent');
    expect((await api().post('/api/internal/payments/dashboard-link').set(auth(agent.token))).status).toBe(403);
    expect((await api().post('/api/internal/payments/dashboard-link')).status).toBe(401);

    fake.accounts.createLoginLink.mockRejectedValueOnce(Object.assign(new Error('down'), { type: 'StripeConnectionError' }));
    const down = await api().post('/api/internal/payments/dashboard-link').set(auth(a.token));
    expect([down.status, down.body.code]).toEqual([502, 'payments_unavailable']);
  });

  it('sans clé Stripe : statut « désactivé », lien du tableau de bord refusé', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const op = await setupOperator();
    const status = await api().get('/api/internal/payments/status').set(auth(op.token));
    expect(status.body).toMatchObject({ enabled: false, testMode: false, connected: false });
    const res = await api().post('/api/internal/payments/dashboard-link').set(auth(op.token));
    expect([res.status, res.body.code]).toEqual([503, 'payments_disabled']);
  });

  it('sans clé Stripe : 503', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const op = await setupOperator();
    const res = await api().post('/api/internal/payments/onboarding').set(auth(op.token));
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('payments_disabled');
  });
});

describe('reversement au loueur (charges et transferts séparés)', () => {
  const DAY = 86400000;

  it('transfère la part du loueur le lendemain de la fin du séjour, une seule fois', async () => {
    const op = await publishedParking();
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(r).toMatchObject({ payoutStatus: 'pending', stripePaymentIntentId: 'pi_test_1' });
    const due = payoutDueAt('AFTER_STAY', r, TZ);
    expect(localDateTime(due, TZ)).toBe(`${localDateTime(new Date(r.returnAt.getTime() + DAY), TZ).slice(0, 10)}T00:00`);

    // During the stay and on the return day: not due.
    expect(await payments.runPayouts(new Date(r.returnAt.getTime() + 1000))).toMatchObject({ transferred: 0, notDue: 1 });
    expect(await payments.runPayouts(new Date(due.getTime() - 1000))).toMatchObject({ transferred: 0, notDue: 1 });
    expect(fake.transfers.create).not.toHaveBeenCalled();

    expect(await payments.runPayouts(due)).toMatchObject({ transferred: 1 });
    expect(fake.transfers.create).toHaveBeenCalledWith(
      {
        amount: 3079,
        currency: 'eur',
        destination: `acct_${op.operator.id}`,
        transfer_group: r.id,
        source_transaction: 'ch_test_1',
        metadata: { reservationId: r.id },
      },
      { idempotencyKey: `plazo-transfer-${r.id}` },
    );
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).toMatchObject({
      payoutStatus: 'transferred',
      stripeTransferId: 'tr_test_1',
      stripeChargeId: 'ch_test_1',
    });
    // Idempotent: later runs (and concurrent ones) transfer nothing more.
    await Promise.all([payments.runPayouts(new Date(due.getTime() + DAY)), payments.runPayouts(new Date(due.getTime() + DAY))]);
    expect(fake.transfers.create).toHaveBeenCalledTimes(1);
  });

  it('ne reverse rien pour une réservation annulée', async () => {
    const op = await publishedParking();
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    await api().post(`/api/internal/reservations/${r.id}/status`).set(auth(op.token)).send({ status: 'cancelled' });
    // A cancelled booking that kept a pending payout (e.g. edited by hand) is skipped too.
    await prisma.reservation.update({ where: { id: r.id }, data: { payoutStatus: 'pending', paymentStatus: 'paid' } });
    expect(await payments.runPayouts(new Date(r.returnAt.getTime() + 3 * DAY))).toMatchObject({ transferred: 0, skipped: 1 });
    expect(fake.transfers.create).not.toHaveBeenCalled();
  });

  it('garde le reversement en attente tant que le compte du loueur n’est pas prêt, puis le fait', async () => {
    const op = await publishedParking();
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    await prisma.operator.update({ where: { id: op.operator.id }, data: { stripeChargesEnabled: false } });
    const later = new Date(r.returnAt.getTime() + 3 * DAY);
    expect(await payments.runPayouts(later)).toMatchObject({ transferred: 0, waitingForAccount: 1 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).payoutStatus).toBe('pending');
    await prisma.operator.update({ where: { id: op.operator.id }, data: { stripeChargesEnabled: true } });
    expect(await payments.runPayouts(later)).toMatchObject({ transferred: 1 });
  });

  it('une erreur passagère de Stripe laisse le reversement en attente ; un refus le marque en échec', async () => {
    await publishedParking();
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    const later = new Date(r.returnAt.getTime() + 3 * DAY);
    fake.transfers.create.mockRejectedValueOnce(Object.assign(new Error('timeout'), { type: 'StripeConnectionError' }));
    expect(await payments.runPayouts(later)).toMatchObject({ transferred: 0, skipped: 1 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).payoutStatus).toBe('pending');
    fake.transfers.create.mockRejectedValueOnce(Object.assign(new Error('insufficient funds'), { type: 'StripeInvalidRequestError' }));
    expect(await payments.runPayouts(later)).toMatchObject({ failed: 1 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).payoutStatus).toBe('failed');
  });

  it('remboursement après le reversement (ne devrait pas arriver) : transfert repris', async () => {
    const op = await publishedParking({ payoutSchedule: 'AT_DROP_OFF' });
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    expect(await payments.runPayouts(new Date(r.arrivalAt.getTime() + DAY))).toMatchObject({ transferred: 1 });
    const res = await api().post(`/api/internal/reservations/${r.id}/status`).set(auth(op.token)).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(fake.transfers.createReversal).toHaveBeenCalledWith(
      'tr_test_1',
      { metadata: { reservationId: r.id } },
      { idempotencyKey: `plazo-transfer-reversal-${r.id}` },
    );
    expect(fake.refunds.create).toHaveBeenCalledTimes(1);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).toMatchObject({
      paymentStatus: 'refunded',
      payoutStatus: 'reversed',
    });
  });

  it('suit le calendrier choisi par le loueur au moment du reversement', async () => {
    const op = await publishedParking({ payoutSchedule: 'MONTHLY' });
    const held = await paidBooking();
    const r = await prisma.reservation.findUniqueOrThrow({ where: { reference: held.reference } });
    const nextDay = new Date(r.returnAt.getTime() + DAY + 3600000);
    const monthly = payoutDueAt('MONTHLY', r, TZ);
    if (nextDay < monthly) expect(await payments.runPayouts(nextDay)).toMatchObject({ transferred: 0, notDue: 1 });
    // The operator switches to "after the stay": the next run uses the new schedule.
    await api().put('/api/internal/payments/settings').set(auth(op.token)).send({ payoutSchedule: 'AFTER_STAY' });
    expect(await payments.runPayouts(nextDay)).toMatchObject({ transferred: 1 });
  });
});

describe('date de reversement selon le calendrier (heure de Paris)', () => {
  // Instants in UTC; Paris is UTC+2 until 25 Oct 2026 and from 28 Mar 2027, UTC+1 in between.
  const stay = (arrival: string, ret: string) => ({ arrivalAt: new Date(arrival), returnAt: new Date(ret) });

  it('AFTER_STAY : le lendemain du retour, à minuit heure locale', () => {
    const s = stay('2026-10-20T08:00:00Z', '2026-10-31T22:30:00Z'); // 31 Oct 23:30 Paris
    expect(payoutDueDate('AFTER_STAY', s, TZ)).toBe('2026-11-01');
    expect(payoutDueAt('AFTER_STAY', s, TZ).toISOString()).toBe('2026-10-31T23:00:00.000Z');
    // 23:30 UTC on 31 Oct is already 1 Nov in Paris: due on 2 Nov.
    expect(payoutDueDate('AFTER_STAY', stay('2026-10-20T08:00:00Z', '2026-10-31T23:30:00Z'), TZ)).toBe('2026-11-02');
  });

  it('AT_DROP_OFF : le lendemain du dépôt', () => {
    expect(payoutDueDate('AT_DROP_OFF', stay('2026-12-31T22:00:00Z', '2027-01-05T10:00:00Z'), TZ)).toBe('2027-01-01'); // 31 Dec 23:00 Paris
    expect(payoutDueDate('AT_DROP_OFF', stay('2026-12-31T23:30:00Z', '2027-01-05T10:00:00Z'), TZ)).toBe('2027-01-02'); // 1 Jan 00:30 Paris
  });

  it('WEEKLY : le lundi suivant la semaine (lundi-dimanche) de fin du séjour', () => {
    expect(payoutDueDate('WEEKLY', stay('2026-10-01T08:00:00Z', '2026-10-05T10:00:00Z'), TZ)).toBe('2026-10-12'); // Monday -> next Monday
    expect(payoutDueDate('WEEKLY', stay('2026-10-01T08:00:00Z', '2026-10-07T10:00:00Z'), TZ)).toBe('2026-10-12'); // Wednesday
    expect(payoutDueDate('WEEKLY', stay('2026-10-01T08:00:00Z', '2026-10-11T21:30:00Z'), TZ)).toBe('2026-10-12'); // Sunday 23:30 Paris
    expect(payoutDueDate('WEEKLY', stay('2026-10-01T08:00:00Z', '2026-10-11T22:30:00Z'), TZ)).toBe('2026-10-19'); // Monday 00:30 Paris
    expect(payoutDueDate('WEEKLY', stay('2026-12-20T08:00:00Z', '2026-12-31T10:00:00Z'), TZ)).toBe('2027-01-04'); // across the year
  });

  it('MONTHLY : le 1er du mois suivant la fin du séjour', () => {
    expect(payoutDueDate('MONTHLY', stay('2026-10-01T08:00:00Z', '2026-10-31T21:30:00Z'), TZ)).toBe('2026-11-01'); // 31 Oct 22:30 Paris
    expect(payoutDueDate('MONTHLY', stay('2026-10-01T08:00:00Z', '2026-10-31T23:30:00Z'), TZ)).toBe('2026-12-01'); // already 1 Nov in Paris
    expect(payoutDueDate('MONTHLY', stay('2026-12-01T08:00:00Z', '2026-12-15T10:00:00Z'), TZ)).toBe('2027-01-01');
    expect(payoutDueDate('MONTHLY', stay('2027-02-01T08:00:00Z', '2027-02-28T10:00:00Z'), TZ)).toBe('2027-03-01');
    expect(payoutDueAt('MONTHLY', stay('2027-03-01T08:00:00Z', '2027-03-20T10:00:00Z'), TZ).toISOString()).toBe('2027-03-31T22:00:00.000Z'); // summer time
  });

  it('suit le fuseau du parking', () => {
    const s = stay('2026-10-01T08:00:00Z', '2026-10-31T23:30:00Z');
    expect(payoutDueDate('MONTHLY', s, 'UTC')).toBe('2026-11-01');
    expect(payoutDueDate('MONTHLY', s, 'Europe/Paris')).toBe('2026-12-01');
    expect(payoutDueDate('AFTER_STAY', s, 'America/Martinique')).toBe('2026-11-01'); // 19:30 on 31 Oct there
  });
});

describe('réglages de reversement', () => {
  it('le gérant lit et choisit son calendrier ; valeurs vérifiées ; chacun le sien', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    expect((await api().get('/api/internal/payments/settings').set(auth(a.token))).body).toEqual({ payoutSchedule: 'AFTER_STAY' });
    const res = await api().put('/api/internal/payments/settings').set(auth(a.token)).send({ payoutSchedule: 'WEEKLY' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ payoutSchedule: 'WEEKLY' });
    expect((await api().get('/api/internal/payments/status').set(auth(a.token))).body.payoutSchedule).toBe('WEEKLY');
    expect((await api().get('/api/internal/payments/settings').set(auth(b.token))).body).toEqual({ payoutSchedule: 'AFTER_STAY' });
    expect(await prisma.auditLog.count({ where: { action: 'payments.payout_schedule_changed', operatorId: a.operator.id } })).toBe(1);

    const bad = await api().put('/api/internal/payments/settings').set(auth(a.token)).send({ payoutSchedule: 'DAILY' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ payoutSchedule: 'invalid_payout_schedule' });
    expect((await api().put('/api/internal/payments/settings').set(auth(a.token)).send({})).status).toBe(400);
  });

  it('réservé au gérant', async () => {
    const a = await setupOperator();
    const agent = await addStaff(a.token, 'agent');
    const driver = await addStaff(a.token, 'driver');
    for (const t of [agent.token, driver.token]) {
      expect((await api().get('/api/internal/payments/settings').set(auth(t))).status).toBe(403);
      expect((await api().put('/api/internal/payments/settings').set(auth(t)).send({ payoutSchedule: 'WEEKLY' })).status).toBe(403);
    }
    expect((await api().get('/api/internal/payments/settings')).status).toBe(401);
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: a.operator.id } })).payoutSchedule).toBe('AFTER_STAY');
  });

  it('la tâche planifiée /internal/cron/payouts exige le secret', async () => {
    expect((await api().get('/api/internal/cron/payouts')).status).toBe(401);
    const res = await api().get('/api/internal/cron/payouts').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ transferred: 0, notDue: 0, waitingForAccount: 0, failed: 0, skipped: 0 });
  });
});

describe('garde-fou clé live', () => {
  const base = { NODE_ENV: 'production', SECRET_KEY: 's', DATABASE_URL: 'postgresql://x', CRON_SECRET: 'c', SITE_API_KEY: 'k' };
  it('refuse une clé live en production sans STRIPE_ALLOW_LIVE=true', () => {
    process.env = { ...savedEnv, ...base, STRIPE_SECRET_KEY: 'sk_live_abc' };
    expect(() => ValidateEnv()).toThrow(/live Stripe key/);
    process.env = { ...savedEnv, ...base, STRIPE_SECRET_KEY: 'rk_live_abc', STRIPE_ALLOW_LIVE: 'false' };
    expect(() => ValidateEnv()).toThrow(/live Stripe key/);
    process.env = { ...savedEnv, ...base, STRIPE_SECRET_KEY: 'sk_live_abc', STRIPE_ALLOW_LIVE: 'true' };
    expect(() => ValidateEnv()).not.toThrow();
  });

  it('accepte une clé de test, ou aucune clé', () => {
    process.env = { ...savedEnv, ...base, STRIPE_SECRET_KEY: 'sk_test_abc' };
    expect(() => ValidateEnv()).not.toThrow();
    process.env = { ...savedEnv, ...base };
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => ValidateEnv()).not.toThrow();
  });
});
