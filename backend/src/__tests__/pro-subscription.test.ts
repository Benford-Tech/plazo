import { Container } from 'typedi';
import prisma from '@/database';
import { chargedNow, planLookupKey, planOfLookupKey, planPriceCents, paymentMethodSummary } from '@/domain/pro-subscription';
import { StripeApi, StripeService } from '@/services/stripe.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// 17/11/2026, « Branche stripe pour le paiement des abonnements plazo pro », direction B with the setup fee.
const WEBHOOK_SECRET = 'whsec_test_secret';
const stripeService = Container.get(StripeService);
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

type Sub = {
  id: string;
  object: 'subscription';
  status: string;
  customer: string;
  cancel_at_period_end: boolean;
  metadata: Record<string, string>;
  default_payment_method: unknown;
  items: { data: { id: string; price: { id: string; lookup_key: string }; current_period_end: number }[] };
  latest_invoice?: unknown;
};

let subs: Map<string, Sub>;
let prices: Map<string, string>;
let calls: Record<string, any[]>;

function installFake() {
  subs = new Map();
  prices = new Map();
  calls = { createSub: [], updateSub: [], preview: [], pay: [] };
  let n = 0;
  const lookupOf = (priceId: string) => [...prices.entries()].find(([, id]) => id === priceId)?.[0] ?? '';
  const card = { id: 'pm_1', type: 'card', card: { brand: 'visa', last4: '4242', exp_month: 8, exp_year: 2028 } };
  const fake = {
    prices: {
      list: jest.fn(async ({ lookup_keys }: { lookup_keys: string[] }) => ({
        data: lookup_keys.filter(k => prices.has(k)).map(k => ({ id: prices.get(k), lookup_key: k })),
      })),
      create: jest.fn(async (p: { lookup_key: string }) => {
        const id = `price_${++n}`;
        prices.set(p.lookup_key, id);
        return { id, lookup_key: p.lookup_key };
      }),
    },
    products: { create: jest.fn(async () => ({ id: `prod_${++n}` })) },
    taxRates: { list: jest.fn(async () => ({ data: [] })), create: jest.fn(async () => ({ id: 'txr_20' })) },
    customers: { create: jest.fn(async () => ({ id: 'cus_1' })), update: jest.fn(async () => ({ id: 'cus_1' })) },
    subscriptions: {
      create: jest.fn(async (p: any) => {
        calls.createSub.push(p);
        const sub: Sub = {
          id: `sub_${++n}`,
          object: 'subscription',
          status: 'incomplete',
          customer: p.customer,
          cancel_at_period_end: false,
          metadata: p.metadata,
          default_payment_method: null,
          items: {
            data: [{ id: 'si_1', price: { id: p.items[0].price, lookup_key: lookupOf(p.items[0].price) }, current_period_end: 1_800_000_000 }],
          },
        };
        subs.set(sub.id, sub);
        const setup = p.add_invoice_items ? 29000 : 0;
        const ht = 29900 + setup;
        return {
          ...sub,
          latest_invoice: { id: 'in_1', total: Math.round(ht * 1.2), total_excluding_tax: ht, confirmation_secret: { client_secret: 'pi_secret_1' } },
        };
      }),
      retrieve: jest.fn(async (id: string) => ({ ...subs.get(id)! })),
      update: jest.fn(async (id: string, p: any) => {
        calls.updateSub.push(p);
        const sub = subs.get(id)!;
        if (p.items) sub.items.data[0].price = { id: p.items[0].price, lookup_key: lookupOf(p.items[0].price) };
        if (p.cancel_at_period_end !== undefined) sub.cancel_at_period_end = p.cancel_at_period_end;
        if (p.metadata) sub.metadata = p.metadata;
        if (p.default_payment_method) sub.default_payment_method = card;
        return { ...sub };
      }),
      cancel: jest.fn(async (id: string) => ({ ...subs.get(id)!, status: 'canceled' })),
    },
    invoices: {
      createPreview: jest.fn(async (p: any) => {
        calls.preview.push(p);
        return { amount_due: 24000 };
      }),
      list: jest.fn(async () => ({
        data: [
          {
            id: 'in_1',
            number: 'ABC-0001',
            created: 1_790_000_000,
            total: 59640,
            status: 'paid',
            invoice_pdf: 'https://pay.stripe.test/in_1.pdf',
            hosted_invoice_url: null,
          },
        ],
      })),
      pay: jest.fn(async (id: string, p: unknown) => {
        calls.pay.push([id, p]);
        return {};
      }),
    },
    setupIntents: {
      create: jest.fn(async () => ({ id: 'seti_1', client_secret: 'seti_secret' })),
      retrieve: jest.fn(async (id: string) => ({ id, status: 'succeeded', customer: 'cus_1', payment_method: 'pm_1' })),
    },
    paymentMethods: { retrieve: jest.fn(async () => card) },
  };
  stripeService.override = fake as unknown as StripeApi;
  return fake;
}

function webhook(type: string, object: unknown) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, object: 'event', type, data: { object } });
  return api()
    .post('/api/public/stripe/webhook')
    .set('content-type', 'application/json')
    .set('stripe-signature', stripeService.signatureFor(payload, WEBHOOK_SECRET))
    .send(payload);
}

const savedEnv = { ...process.env };
beforeEach(async () => {
  await resetDatabase();
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  installFake();
});
afterEach(() => {
  process.env = { ...savedEnv };
  stripeService.override = null;
});

describe('abonnement Plazo Pro (domaine)', () => {
  it('donne les prix HT et reconnaît une montée de formule', () => {
    expect(planPriceCents('operations', false)).toBe(29900);
    expect(planPriceCents('operations', true)).toBe(269 * 12 * 100);
    expect(planOfLookupKey(planLookupKey('complet', true))).toEqual({ plan: 'complet', yearly: true });
    expect(planOfLookupKey('autre')).toBeNull();
    expect(chargedNow({ plan: 'essentiel', yearly: false }, { plan: 'complet', yearly: false })).toBe(true);
    expect(chargedNow({ plan: 'complet', yearly: false }, { plan: 'essentiel', yearly: false })).toBe(false);
    expect(chargedNow({ plan: 'complet', yearly: false }, { plan: 'essentiel', yearly: true })).toBe(true);
    expect(paymentMethodSummary({ type: 'sepa_debit', sepa_debit: { last4: '3000' } })).toEqual({
      type: 'sepa_debit',
      brand: null,
      last4: '3000',
      expMonth: null,
      expYear: null,
    });
  });
});

describe('abonnement Plazo Pro (API)', () => {
  it("abonne le gérant avec la mise en route, puis l'active par le webhook", async () => {
    const { token, operator } = await setupOperator();
    const start = await api().get('/api/internal/subscription').set(auth(token));
    expect(start.status).toBe(200);
    expect(start.body).toMatchObject({
      available: true,
      publishableKey: 'pk_test_fake',
      setupFeeDue: true,
      setupFeeCents: 29000,
      vatPercent: 20,
      subscription: null,
    });

    const res = await api().post('/api/internal/subscription').set(auth(token)).send({ plan: 'operations', yearly: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ clientSecret: 'pi_secret_1', totalCents: 70680, taxCents: 11780, setupFeeCents: 29000 });
    const created = calls.createSub[0];
    expect(created.add_invoice_items).toHaveLength(1);
    expect(created.default_tax_rates).toEqual(['txr_20']);
    expect(created.payment_behavior).toBe('default_incomplete');
    expect(created.payment_settings.payment_method_types).toEqual(['card', 'sepa_debit']);

    // Paid: Stripe's webhook says the subscription is active.
    const sub = [...subs.values()][0];
    sub.status = 'active';
    sub.default_payment_method = 'pm_1';
    expect((await webhook('customer.subscription.updated', sub)).status).toBe(200);
    const view = await api().get('/api/internal/subscription').set(auth(token));
    expect(view.body.setupFeeDue).toBe(false);
    expect(view.body.subscription).toMatchObject({ status: 'active', running: true, plan: 'operations', yearly: false, priceCents: 29900 });
    expect(view.body.subscription.paymentMethod).toMatchObject({ type: 'card', brand: 'visa', last4: '4242' });
    expect((await prisma.operator.findUnique({ where: { id: operator.id } }))!.proPlan).toBe('operations');

    // Already subscribed: changing plan is another route.
    expect((await api().post('/api/internal/subscription').set(auth(token)).send({ plan: 'complet' })).body.code).toBe('already_subscribed');

    // Upgrade: previewed with the proration, charged now.
    const preview = await api().get('/api/internal/subscription/preview?plan=complet&yearly=false').set(auth(token));
    expect(preview.body).toMatchObject({ chargedNow: true, dueNowCents: 24000 });
    const up = await api().post('/api/internal/subscription/change').set(auth(token)).send({ plan: 'complet', yearly: false });
    expect(up.status).toBe(200);
    expect(calls.updateSub.at(-1)).toMatchObject({ proration_behavior: 'always_invoice', payment_behavior: 'error_if_incomplete' });
    expect(up.body.subscription.plan).toBe('complet');

    // Downgrade: from the renewal, nothing now.
    const down = await api().get('/api/internal/subscription/preview?plan=essentiel').set(auth(token));
    expect(down.body).toMatchObject({ chargedNow: false, dueNowCents: 0, nextCents: 17880 });
    await api().post('/api/internal/subscription/change').set(auth(token)).send({ plan: 'essentiel' });
    expect(calls.updateSub.at(-1).proration_behavior).toBe('none');

    // Cancel at period end, then resume.
    expect((await api().post('/api/internal/subscription/cancel').set(auth(token))).body.subscription.cancelAtPeriodEnd).toBe(true);
    expect((await api().post('/api/internal/subscription/resume').set(auth(token))).body.subscription.cancelAtPeriodEnd).toBe(false);

    const invoices = await api().get('/api/internal/subscription/invoices').set(auth(token));
    expect(invoices.body.data[0]).toMatchObject({ number: 'ABC-0001', totalCents: 59640, pdfUrl: 'https://pay.stripe.test/in_1.pdf' });
  });

  it("note l'échec d'un prélèvement et réessaie avec le nouveau moyen", async () => {
    const { token } = await setupOperator();
    await api().post('/api/internal/subscription').set(auth(token)).send({ plan: 'essentiel', yearly: true });
    const sub = [...subs.values()][0];
    sub.status = 'past_due';
    expect(
      (await webhook('invoice.payment_failed', { id: 'in_2', object: 'invoice', parent: { subscription_details: { subscription: sub.id } } })).status,
    ).toBe(200);
    const view = await api().get('/api/internal/subscription').set(auth(token));
    expect(view.body.subscription).toMatchObject({ status: 'past_due', running: true, lastPaymentError: 'payment_failed', yearly: true });

    expect((await api().post('/api/internal/subscription/payment-method').set(auth(token))).body.clientSecret).toBe('seti_secret');
    const confirmed = await api().post('/api/internal/subscription/payment-method/confirm').set(auth(token)).send({ setupIntentId: 'seti_1' });
    expect(confirmed.status).toBe(200);
    expect(calls.updateSub.at(-1)).toMatchObject({ default_payment_method: 'pm_1' });
  });

  it('refuse sans clés, les autres rôles et les formules inconnues', async () => {
    const { token } = await setupOperator();
    expect((await api().post('/api/internal/subscription').set(auth(token)).send({ plan: 'gratuit' })).status).toBe(400);
    const driver = await addStaff(token, 'driver');
    expect((await api().get('/api/internal/subscription').set(auth(driver.token))).status).toBe(403);
    delete process.env.STRIPE_SECRET_KEY;
    const off = await api().get('/api/internal/subscription').set(auth(token));
    expect(off.body).toMatchObject({ available: false, refusal: 'unavailable', publishableKey: null });
    expect((await api().post('/api/internal/subscription').set(auth(token)).send({ plan: 'essentiel' })).body.code).toBe('subscriptions_unavailable');
  });
});
