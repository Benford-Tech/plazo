import 'reflect-metadata';
import request from 'supertest';
import { Container } from 'typedi';
import { App } from '@/app';
import prisma from '@/database';
import AppRoutes from '@/routes';
import { OperatorService } from '@/services/operator.service';
import { PaymentService } from '@/services/payment.service';
import { StripeApi, StripeService } from '@/services/stripe.service';

export const PASSWORD = 'mot-de-passe-solide';
export const app = new App(AppRoutes).getServer();
export const api = () => request(app);

export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE operators, login_attempts RESTART IDENTITY CASCADE');
}

let counter = 0;

export async function login(email: string, password = PASSWORD) {
  const res = await api().post('/api/internal/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { tokenData: { access: { token: string }; refresh: { token: string } }; user: any };
}

/** Creates an operator with its parking and manager, and logs the manager in. */
export async function setupOperator(name = 'Parking Test') {
  counter += 1;
  const created = await Container.get(OperatorService).createWithManager({
    operatorName: `${name} ${counter}`,
    parkingName: `${name} LYS`,
    totalCapacity: 200,
    managerFirstName: 'Gérant',
    managerLastName: 'Test',
    managerEmail: `gerant${counter}@example.com`,
    managerPassword: PASSWORD,
  });
  const session = await login(created.manager.email);
  return { ...created, token: session.tokenData.access.token, session };
}

/** Adds a staff member through the API and logs them in. */
export async function addStaff(managerToken: string, role: string) {
  counter += 1;
  const email = `${role}${counter}@example.com`;
  const res = await api()
    .post('/api/internal/staff')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ firstName: role, lastName: `${counter}`, email, role, password: PASSWORD });
  if (res.status !== 201) throw new Error(`addStaff failed: ${res.status} ${JSON.stringify(res.body)}`);
  const session = await login(email);
  return { id: res.body.data.id as string, email, token: session.tokenData.access.token, session };
}

/** R-B (07/10/2026): the parking shows its shuttles to the travellers too (new parkings: the team only). */
export async function shareShuttlesWithTravellers(managerToken: string, parkingId: string) {
  const res = await api()
    .put(`/api/internal/parkings/${parkingId}/shuttle-tracking`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ tracking: 'everyone' });
  if (res.status !== 200) throw new Error(`shareShuttlesWithTravellers failed: ${res.status} ${JSON.stringify(res.body)}`);
}

/** Puts a parking's listing online directly (the review flow itself is covered by platform-space.test.ts). */
export async function publishListing(parkingId: string) {
  await prisma.listing.update({ where: { parkingId }, data: { status: 'published', reviewedAt: new Date() } });
}

/** Routes the operator's SMS through Brevo ("Plazo envoie pour moi"), the channel the older tests assume. */
export async function useBrevoSms(operatorId: string) {
  await prisma.operatorSmsSettings.upsert({ where: { operatorId }, create: { operatorId, mode: 'brevo' }, update: { mode: 'brevo' } });
}

// ---- Online payment (every Plazo booking is paid online, 06/10/2026) --------------------------

export const TEST_WEBHOOK_SECRET = 'whsec_test_secret';

/**
 * A minimal fake Stripe behind the StripeService, so that tests which only need a confirmed
 * booking can create and pay one without the network. Returns the fake's checkout sessions.
 */
export function enableFakePayments() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  const payments = Container.get(PaymentService);
  if (!payments.settings.siteUrl) payments.settings.siteUrl = 'https://site.example';
  const sessions = new Map<string, any>();
  let n = 0;
  const fake = {
    checkout: {
      sessions: {
        create: jest.fn(async (params: any) => {
          n += 1;
          const session = {
            id: `cs_test_${n}`,
            object: 'checkout.session',
            status: 'open',
            payment_status: 'unpaid',
            url: `https://checkout.stripe.test/c/pay/cs_test_${n}`,
            amount_total: params.line_items[0].price_data.unit_amount,
            currency: params.currency,
            metadata: params.metadata,
            client_reference_id: params.client_reference_id,
            payment_intent: null as string | null,
          };
          sessions.set(session.id, session);
          return session;
        }),
        retrieve: jest.fn(async (id: string) => ({ ...sessions.get(id) })),
        expire: jest.fn(async (id: string) => Object.assign(sessions.get(id), { status: 'expired' })),
      },
    },
    refunds: { create: jest.fn(async () => ({ id: 're_test_1', object: 'refund', status: 'succeeded' })) },
    paymentIntents: {
      retrieve: jest.fn(async (id: string) => ({ id, object: 'payment_intent', status: 'succeeded', latest_charge: 'ch_test_1' })),
      create: jest.fn(async () => ({
        id: 'pi_sheet_1',
        object: 'payment_intent',
        status: 'requires_payment_method',
        client_secret: 'pi_sheet_1_secret',
      })),
      cancel: jest.fn(async (id: string) => ({ id, object: 'payment_intent', status: 'canceled' })),
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
    accountLinks: { create: jest.fn(async () => ({ object: 'account_link', url: 'https://connect.stripe.test/setup', expires_at: 0 })) },
  };
  Container.get(StripeService).override = fake as unknown as StripeApi;
  return { fake, sessions };
}

export function disableFakePayments() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  Container.get(StripeService).override = null;
}

/** The operator's connected account can take payments (payouts enabled, a commission). */
export async function onboardOperator(operatorId: string) {
  await prisma.operator.update({
    where: { id: operatorId },
    data: { commissionBps: 1200, stripeAccountId: `acct_${operatorId}`, stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });
}

/** The traveller pays the held booking on the (fake) Stripe page: checkout, then the webhook. */
export async function payBooking(reference: string, manageToken: string, sessions: Map<string, any>) {
  const res = await api().post(`/api/public/bookings/${reference}/checkout`).set('x-booking-token', manageToken);
  // Already paid (a replayed form): nothing to do.
  if (res.status === 200 && res.body.paid) return;
  if (res.status !== 200) throw new Error(`checkout failed: ${res.status} ${JSON.stringify(res.body)}`);
  const sessionId = [...sessions.keys()].pop()!;
  const session = Object.assign(sessions.get(sessionId), { status: 'complete', payment_status: 'paid', url: null, payment_intent: 'pi_test_1' });
  const payload = JSON.stringify({ id: `evt_${sessionId}`, object: 'event', type: 'checkout.session.completed', data: { object: { ...session } } });
  const signature = Container.get(StripeService).signatureFor(payload, TEST_WEBHOOK_SECRET);
  const hook = await api()
    .post('/api/public/stripe/webhook')
    .set('content-type', 'application/json')
    .set('stripe-signature', signature)
    .send(payload);
  if (hook.status !== 200) throw new Error(`webhook failed: ${hook.status} ${JSON.stringify(hook.body)}`);
  const row = await prisma.reservation.findUniqueOrThrow({ where: { reference }, select: { status: true, paymentStatus: true } });
  if (row.status !== 'upcoming') throw new Error(`booking not confirmed after the payment: ${JSON.stringify({ ...row, hook: hook.body, session })}`);
}

/** A booking made on the site and paid: the way every Plazo booking is confirmed. */
export async function bookAndPay(body: Record<string, unknown>, sessions: Map<string, any>) {
  const res = await api().post('/api/public/bookings').send(body);
  if (res.status !== 201) throw new Error(`booking failed: ${res.status} ${JSON.stringify(res.body)}`);
  await payBooking(res.body.reference, res.body.manageToken, sessions);
  return res.body as { reference: string; manageToken: string; booking: any };
}

/**
 * Day-J tests ("arriving today", "the return day") at any hour (09/10/2026): moves the clock seen by the code to a set
 * local time of the current day in Paris (default 10:00) and lets it run from there; timers stay real. The database
 * defaults (createdAt) keep the real time, so use it only where they do not matter. Undo with jest.useRealTimers().
 */
export function runTodayAt(time = '10:00') {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const offset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${day}T12:00:00Z`))
    .find(p => p.type === 'timeZoneName')!
    .value.replace('GMT', '');
  jest.useFakeTimers({
    now: new Date(`${day}T${time}:00${offset || 'Z'}`),
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
