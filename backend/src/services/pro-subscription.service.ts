import httpStatus from 'http-status';
import Stripe from 'stripe';
import { Container, Service } from 'typedi';
import { isLiveStripeKey, paymentsEnabled, stripePublishableKey, stripeSecretKey } from '@/config';
import prisma, { Prisma } from '@/database';
import { isProPlan, PRO_PLANS, ProPlanId } from '@/domain/plazo-agreements';
import {
  chargedNow,
  isRunning,
  PAYMENT_METHOD_TYPES,
  paymentMethodSummary,
  PaymentMethodSummary,
  planLookupKey,
  planOfLookupKey,
  planPriceCents,
  SETUP_FEE_CENTS,
  SETUP_LOOKUP_KEY,
  VAT_PERCENT,
  withVat,
} from '@/domain/pro-subscription';
import { isTestOperatorName } from '@/domain/test-feed';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { StripeApi, StripeService } from './stripe.service';

type Row = Prisma.ProSubscriptionGetPayload<object>;

export interface ProSubscriptionView {
  /** Stripe keys in place and the operator may subscribe. */
  available: boolean;
  /** Why it is not available: `unavailable` (no keys) or `test_operator` (a test or demo operator with live keys). */
  refusal: 'unavailable' | 'test_operator' | null;
  publishableKey: string | null;
  vatPercent: number;
  setupFeeCents: number;
  /** The setup fee is still due (never paid): it goes on the first invoice. */
  setupFeeDue: boolean;
  plans: { id: ProPlanId; name: string; monthlyCents: number; yearlyCents: number }[];
  subscription: {
    status: string;
    running: boolean;
    plan: ProPlanId;
    yearly: boolean;
    priceCents: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    paymentMethod: PaymentMethodSummary | null;
    lastPaymentError: string | null;
  } | null;
}

export interface InvoiceRow {
  id: string;
  number: string | null;
  date: string;
  totalCents: number;
  status: string | null;
  pdfUrl: string | null;
  url: string | null;
}

const PLAN_ERROR = () => new ValidationException({ plan: 'invalid' });

/** Stripe's ids are safe to log; nothing else about the operator goes to the logs. */
function errorCode(error: unknown): string {
  const e = error as { code?: string; decline_code?: string; type?: string };
  return e?.decline_code || e?.code || e?.type || 'unknown';
}

/**
 * The Plazo Pro subscription (17/11/2026, direction B « Tout dans Plazo », with the setup fee): the manager chooses a plan,
 * pays the first invoice in Plazo with Stripe's Payment Element (card or SEPA), changes plan with a prorated preview, changes
 * the payment method, reads the invoices and cancels at the end of the paid period. Stripe Billing renews, retries and
 * sends the invoices; the webhook and each call keep `pro_subscriptions` in step.
 */
@Service()
export class ProSubscriptionService {
  public stripe = Container.get(StripeService);
  public audit = Container.get(AuditService);
  private catalog: { key: string; prices: Map<string, string>; taxRate: string } | null = null;

  private live(): boolean {
    return isLiveStripeKey(stripeSecretKey());
  }

  private api(): StripeApi {
    return this.stripe.api();
  }

  /** The row of the keys' mode: a customer made with test keys does not exist for live keys. */
  private async rowOf(operatorId: string): Promise<Row | null> {
    const row = await prisma.proSubscription.findUnique({ where: { operatorId } });
    return row && row.live === this.live() ? row : null;
  }

  private async refusalFor(operatorId: string): Promise<ProSubscriptionView['refusal']> {
    if (!paymentsEnabled() || !stripePublishableKey()) return 'unavailable';
    if (this.live()) {
      const o = await prisma.operator.findUnique({ where: { id: operatorId }, select: { name: true, isDemo: true, prospectDemo: true } });
      if (!o || o.isDemo || o.prospectDemo || isTestOperatorName(o.name)) return 'test_operator';
    }
    return null;
  }

  private async assertAvailable(operatorId: string) {
    const refusal = await this.refusalFor(operatorId);
    if (refusal === 'unavailable') throw new HttpException(httpStatus.CONFLICT, 'Subscriptions are not available', 'subscriptions_unavailable');
    if (refusal) throw new HttpException(httpStatus.CONFLICT, 'A test operator pays nothing with live keys', 'test_operator');
  }

  // ---- Catalog ---------------------------------------------------------------------------------

  /** The plans' prices and the setup fee (found by lookup key, created once), and the VAT rate. Cached per key. */
  private async ensureCatalog(): Promise<{ prices: Map<string, string>; taxRate: string }> {
    const key = stripeSecretKey();
    if (this.catalog?.key === key) return this.catalog;
    const api = this.api();
    const wanted: { lookupKey: string; name: string; cents: number; interval: 'month' | 'year' | null }[] = [
      { lookupKey: SETUP_LOOKUP_KEY, name: 'Plazo Pro · Mise en route', cents: SETUP_FEE_CENTS, interval: null },
    ];
    for (const plan of Object.keys(PRO_PLANS) as ProPlanId[]) {
      for (const yearly of [false, true]) {
        wanted.push({
          lookupKey: planLookupKey(plan, yearly),
          name: `Plazo Pro · ${PRO_PLANS[plan].name}`,
          cents: planPriceCents(plan, yearly),
          interval: yearly ? 'year' : 'month',
        });
      }
    }
    const found = await api.prices.list({ lookup_keys: wanted.map(w => w.lookupKey), active: true, limit: 100 });
    const prices = new Map(found.data.map(p => [p.lookup_key ?? '', p.id]));
    const products = new Map<string, string>();
    for (const w of wanted) {
      if (prices.has(w.lookupKey)) continue;
      let product = products.get(w.name);
      if (!product) {
        product = (await api.products.create({ name: w.name, metadata: { plazo: 'pro' } })).id;
        products.set(w.name, product);
      }
      const price = await api.prices.create({
        product,
        currency: 'eur',
        unit_amount: w.cents,
        tax_behavior: 'exclusive',
        lookup_key: w.lookupKey,
        ...(w.interval ? { recurring: { interval: w.interval } } : {}),
      });
      prices.set(w.lookupKey, price.id);
    }
    const rates = await api.taxRates.list({ active: true, limit: 100 });
    let taxRate = rates.data.find(r => r.metadata?.plazo === 'vat20' && r.percentage === VAT_PERCENT && !r.inclusive)?.id;
    if (!taxRate) {
      taxRate = (
        await api.taxRates.create({
          display_name: 'TVA',
          percentage: VAT_PERCENT,
          inclusive: false,
          country: 'FR',
          jurisdiction: 'FR',
          metadata: { plazo: 'vat20' },
        })
      ).id;
    }
    this.catalog = { key, prices, taxRate };
    return this.catalog;
  }

  // ---- Reading ---------------------------------------------------------------------------------

  /** GET /internal/subscription */
  public async view(operatorId: string): Promise<ProSubscriptionView> {
    const refusal = await this.refusalFor(operatorId);
    const row = await this.rowOf(operatorId);
    const shown = row && row.subscriptionId && row.status !== 'incomplete_expired' && isProPlan(row.plan);
    return {
      available: refusal === null,
      refusal,
      publishableKey: refusal === null ? stripePublishableKey() : null,
      vatPercent: VAT_PERCENT,
      setupFeeCents: SETUP_FEE_CENTS,
      setupFeeDue: !row?.setupFeePaidAt,
      plans: (Object.keys(PRO_PLANS) as ProPlanId[]).map(id => ({
        id,
        name: PRO_PLANS[id].name,
        monthlyCents: planPriceCents(id, false),
        yearlyCents: planPriceCents(id, true),
      })),
      subscription: shown
        ? {
            status: row.status,
            running: isRunning(row.status),
            plan: row.plan as ProPlanId,
            yearly: row.yearly,
            priceCents: planPriceCents(row.plan as ProPlanId, row.yearly),
            currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: row.cancelAtPeriodEnd,
            paymentMethod: (row.paymentMethod as unknown as PaymentMethodSummary | null) ?? null,
            lastPaymentError: row.lastPaymentError,
          }
        : null,
    };
  }

  /** GET /internal/subscription/invoices */
  public async invoices(operatorId: string): Promise<{ data: InvoiceRow[] }> {
    const row = await this.rowOf(operatorId);
    if (!row || (await this.refusalFor(operatorId)) === 'unavailable') return { data: [] };
    const list = await this.api().invoices.list({ customer: row.customerId, limit: 24 });
    return {
      data: list.data
        .filter(i => i.status !== 'draft')
        .map(i => ({
          id: i.id ?? '',
          number: i.number ?? null,
          date: new Date(i.created * 1000).toISOString(),
          totalCents: i.total,
          status: i.status ?? null,
          pdfUrl: i.invoice_pdf ?? null,
          url: i.hosted_invoice_url ?? null,
        })),
    };
  }

  // ---- Subscribing -----------------------------------------------------------------------------

  private readPlan(body: { plan?: unknown; yearly?: unknown }): { plan: ProPlanId; yearly: boolean } {
    if (!isProPlan(body.plan)) throw PLAN_ERROR();
    if (body.yearly !== undefined && typeof body.yearly !== 'boolean') throw new ValidationException({ yearly: 'invalid' });
    return { plan: body.plan, yearly: body.yearly === true };
  }

  private async customerFor(staff: AuthenticatedStaff, row: Row | null): Promise<string> {
    if (row?.customerId) return row.customerId;
    const o = await prisma.operator.findUniqueOrThrow({ where: { id: staff.operatorId }, select: { name: true, billingLegalName: true } });
    const customer = await this.api().customers.create({
      name: o.billingLegalName?.trim() || o.name,
      email: staff.email,
      preferred_locales: ['fr'],
      metadata: { operatorId: staff.operatorId },
    });
    return customer.id;
  }

  /**
   * POST /internal/subscription { plan, yearly }: the subscription is created waiting for its first payment
   * (`default_incomplete`), the setup fee on the first invoice when never paid before; Plazo shows the Payment Element
   * with the returned secret and confirms it in the browser. An earlier subscription left unpaid is cancelled first.
   */
  public async subscribe(staff: AuthenticatedStaff, body: { plan?: unknown; yearly?: unknown }) {
    const { plan, yearly } = this.readPlan(body);
    await this.assertAvailable(staff.operatorId);
    const api = this.api();
    const row = await this.rowOf(staff.operatorId);
    if (row?.subscriptionId && isRunning(row.status)) {
      throw new HttpException(httpStatus.CONFLICT, 'Already subscribed: change the plan instead', 'already_subscribed');
    }
    if (row?.subscriptionId && row.status === 'incomplete') {
      await api.subscriptions
        .cancel(row.subscriptionId)
        .catch(error => logger.warn(`[Subscription] Could not cancel ${row.subscriptionId}: ${errorCode(error)}`));
    }
    const { prices, taxRate } = await this.ensureCatalog();
    const customerId = await this.customerFor(staff, row);
    // Paid once per operator (in the keys' mode: a test payment is not one).
    const setupFee = !row?.setupFeePaidAt;
    const sub = await api.subscriptions.create({
      customer: customerId,
      items: [{ price: prices.get(planLookupKey(plan, yearly))! }],
      default_tax_rates: [taxRate],
      ...(setupFee ? { add_invoice_items: [{ price: prices.get(SETUP_LOOKUP_KEY)! }] } : {}),
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription', payment_method_types: [...PAYMENT_METHOD_TYPES] },
      metadata: { operatorId: staff.operatorId, plan, yearly: String(yearly) },
      expand: ['latest_invoice.confirmation_secret'],
    });
    const invoice = sub.latest_invoice as Stripe.Invoice | null;
    const clientSecret = invoice?.confirmation_secret?.client_secret ?? null;
    const data = {
      live: this.live(),
      customerId,
      subscriptionId: sub.id,
      status: sub.status,
      plan,
      yearly,
      currentPeriodEnd: periodEndOf(sub),
      cancelAtPeriodEnd: false,
      setupFeeIncluded: setupFee,
      lastPaymentError: null,
    };
    await prisma.proSubscription.upsert({
      where: { operatorId: staff.operatorId },
      create: { operatorId: staff.operatorId, ...data },
      update: { ...data, setupFeePaidAt: row?.setupFeePaidAt ?? null },
    });
    await this.audit.record(staff, {
      action: 'subscription.started',
      entityType: 'operator',
      entityId: staff.operatorId,
      details: { plan, yearly, setupFee },
    });
    const totalCents = invoice?.total ?? withVat(planPriceCents(plan, yearly) + (setupFee ? SETUP_FEE_CENTS : 0));
    const excludingTax = invoice?.total_excluding_tax ?? planPriceCents(plan, yearly) + (setupFee ? SETUP_FEE_CENTS : 0);
    return {
      clientSecret,
      totalCents,
      taxCents: totalCents - excludingTax,
      setupFeeCents: setupFee ? SETUP_FEE_CENTS : 0,
      subscription: (await this.view(staff.operatorId)).subscription,
    };
  }

  /** POST /internal/subscription/sync: after the browser confirmed a payment, read the subscription back from Stripe. */
  public async refresh(operatorId: string) {
    const row = await this.rowOf(operatorId);
    if (row?.subscriptionId && (await this.refusalFor(operatorId)) !== 'unavailable') {
      const sub = await this.api().subscriptions.retrieve(row.subscriptionId, { expand: ['default_payment_method'] });
      await this.sync(sub);
    }
    return this.view(operatorId);
  }

  // ---- Changing --------------------------------------------------------------------------------

  private async running(operatorId: string): Promise<Row & { subscriptionId: string }> {
    const row = await this.rowOf(operatorId);
    if (!row?.subscriptionId || !isRunning(row.status)) throw new HttpException(httpStatus.CONFLICT, 'No subscription running', 'no_subscription');
    return row as Row & { subscriptionId: string };
  }

  /** GET /internal/subscription/preview?plan=&yearly=: what changing plan costs now, and from the next renewal. */
  public async preview(operatorId: string, query: { plan?: unknown; yearly?: unknown }) {
    const to = this.readPlan({ plan: query.plan, yearly: query.yearly === 'true' || query.yearly === true });
    await this.assertAvailable(operatorId);
    const row = await this.running(operatorId);
    const from = { plan: row.plan as ProPlanId, yearly: row.yearly };
    if (from.plan === to.plan && from.yearly === to.yearly) throw new HttpException(httpStatus.CONFLICT, 'Same plan', 'same_plan');
    const nextCents = withVat(planPriceCents(to.plan, to.yearly));
    if (!chargedNow(from, to)) {
      return { chargedNow: false, dueNowCents: 0, nextCents, effectiveAt: row.currentPeriodEnd?.toISOString() ?? null };
    }
    const api = this.api();
    const { prices } = await this.ensureCatalog();
    const sub = await api.subscriptions.retrieve(row.subscriptionId);
    const preview = await api.invoices.createPreview({
      customer: row.customerId,
      subscription: row.subscriptionId,
      subscription_details: {
        items: [{ id: sub.items.data[0].id, price: prices.get(planLookupKey(to.plan, to.yearly))! }],
        proration_behavior: 'always_invoice',
      },
    });
    return { chargedNow: true, dueNowCents: Math.max(0, preview.amount_due), nextCents, effectiveAt: null };
  }

  /** POST /internal/subscription/change { plan, yearly }: charged now (prorated) when dearer, from the renewal otherwise. */
  public async change(staff: AuthenticatedStaff, body: { plan?: unknown; yearly?: unknown }) {
    const to = this.readPlan(body);
    await this.assertAvailable(staff.operatorId);
    const row = await this.running(staff.operatorId);
    const from = { plan: row.plan as ProPlanId, yearly: row.yearly };
    if (from.plan === to.plan && from.yearly === to.yearly) throw new HttpException(httpStatus.CONFLICT, 'Same plan', 'same_plan');
    const api = this.api();
    const { prices } = await this.ensureCatalog();
    const sub = await api.subscriptions.retrieve(row.subscriptionId);
    const now = chargedNow(from, to);
    let updated: Stripe.Subscription;
    try {
      updated = await api.subscriptions.update(row.subscriptionId, {
        items: [{ id: sub.items.data[0].id, price: prices.get(planLookupKey(to.plan, to.yearly))! }],
        proration_behavior: now ? 'always_invoice' : 'none',
        ...(now ? { payment_behavior: 'error_if_incomplete' as const } : {}),
        cancel_at_period_end: false,
        metadata: { operatorId: staff.operatorId, plan: to.plan, yearly: String(to.yearly) },
        expand: ['default_payment_method'],
      });
    } catch (error) {
      logger.warn(`[Subscription] Change refused for ${row.subscriptionId}: ${errorCode(error)}`);
      throw new HttpException(httpStatus.CONFLICT, 'The payment for the change did not go through', 'payment_failed');
    }
    await this.sync(updated);
    await this.audit.record(staff, {
      action: 'subscription.changed',
      entityType: 'operator',
      entityId: staff.operatorId,
      details: { from, to, chargedNow: now },
    });
    return this.view(staff.operatorId);
  }

  /** POST /internal/subscription/payment-method: a SetupIntent the Payment Element confirms (card or SEPA). */
  public async paymentMethodSetup(operatorId: string) {
    await this.assertAvailable(operatorId);
    const row = await this.rowOf(operatorId);
    if (!row) throw new HttpException(httpStatus.CONFLICT, 'No subscription', 'no_subscription');
    const intent = await this.api().setupIntents.create({
      customer: row.customerId,
      allowed_payment_method_types: [...PAYMENT_METHOD_TYPES],
      usage: 'off_session',
      metadata: { operatorId, plazo: 'pro_subscription' },
    });
    return { clientSecret: intent.client_secret };
  }

  /**
   * POST /internal/subscription/payment-method/confirm { setupIntentId }: the confirmed method becomes the default of the
   * customer and the subscription; an unpaid invoice is tried again with it at once.
   */
  public async paymentMethodConfirm(staff: AuthenticatedStaff, body: { setupIntentId?: unknown }) {
    if (typeof body.setupIntentId !== 'string' || !body.setupIntentId) throw new ValidationException({ setupIntentId: 'required' });
    await this.assertAvailable(staff.operatorId);
    const row = await this.rowOf(staff.operatorId);
    if (!row) throw new HttpException(httpStatus.CONFLICT, 'No subscription', 'no_subscription');
    const api = this.api();
    const intent = await api.setupIntents.retrieve(body.setupIntentId);
    const customer = typeof intent.customer === 'string' ? intent.customer : intent.customer?.id;
    if (customer !== row.customerId || intent.status !== 'succeeded' || !intent.payment_method) {
      throw new HttpException(httpStatus.CONFLICT, 'The payment method is not confirmed', 'setup_not_confirmed');
    }
    const pm = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method.id;
    await api.customers.update(row.customerId, { invoice_settings: { default_payment_method: pm } });
    if (row.subscriptionId) {
      await api.subscriptions.update(row.subscriptionId, { default_payment_method: pm });
      if (row.status === 'past_due' || row.status === 'unpaid') {
        const open = await api.invoices.list({ customer: row.customerId, status: 'open', limit: 5 });
        for (const invoice of open.data) {
          if (!invoice.id) continue;
          await api.invoices
            .pay(invoice.id, { payment_method: pm })
            .catch(error => logger.warn(`[Subscription] Retry of ${invoice.id} refused: ${errorCode(error)}`));
        }
      }
    }
    await this.audit.record(staff, { action: 'subscription.payment_method', entityType: 'operator', entityId: staff.operatorId });
    return this.refresh(staff.operatorId);
  }

  /** POST /internal/subscription/cancel | resume: stops at the end of the paid period, or keeps it going. */
  public async setCancelAtPeriodEnd(staff: AuthenticatedStaff, cancel: boolean) {
    await this.assertAvailable(staff.operatorId);
    const row = await this.running(staff.operatorId);
    const updated = await this.api().subscriptions.update(row.subscriptionId, { cancel_at_period_end: cancel, expand: ['default_payment_method'] });
    await this.sync(updated);
    await this.audit.record(staff, {
      action: cancel ? 'subscription.cancelled' : 'subscription.resumed',
      entityType: 'operator',
      entityId: staff.operatorId,
    });
    return this.view(staff.operatorId);
  }

  // ---- Stripe's side ---------------------------------------------------------------------------

  /** Copies a subscription's state from Stripe (webhook, return of the browser, each change). Unknown ones are ignored. */
  public async sync(sub: Stripe.Subscription): Promise<void> {
    const operatorId = sub.metadata?.operatorId;
    const row =
      (await prisma.proSubscription.findUnique({ where: { subscriptionId: sub.id } })) ??
      (operatorId ? await prisma.proSubscription.findUnique({ where: { operatorId } }) : null);
    if (!row || (row.subscriptionId && row.subscriptionId !== sub.id)) return;
    const price = sub.items.data[0]?.price;
    const plan = planOfLookupKey(price?.lookup_key) ?? (isProPlan(row.plan) ? { plan: row.plan, yearly: row.yearly } : null);
    let pm: PaymentMethodSummary | null | undefined;
    const dpm = sub.default_payment_method;
    if (dpm && typeof dpm !== 'string') pm = paymentMethodSummary(dpm);
    else if (typeof dpm === 'string')
      pm = paymentMethodSummary(
        await this.api()
          .paymentMethods.retrieve(dpm)
          .catch(() => null),
      );
    const paid = sub.status === 'active' || sub.status === 'trialing';
    await prisma.proSubscription.update({
      where: { id: row.id },
      data: {
        subscriptionId: sub.id,
        status: sub.status,
        ...(plan ? { plan: plan.plan, yearly: plan.yearly } : {}),
        currentPeriodEnd: periodEndOf(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        ...(pm !== undefined ? { paymentMethod: pm ? (pm as unknown as Prisma.InputJsonValue) : Prisma.DbNull } : {}),
        ...(paid ? { lastPaymentError: null } : {}),
        ...(paid && row.setupFeeIncluded && !row.setupFeePaidAt ? { setupFeePaidAt: new Date() } : {}),
      },
    });
    // The plan on the operator follows a running subscription (the contract of use names it).
    if (plan && isRunning(sub.status)) {
      await prisma.operator.update({ where: { id: row.operatorId }, data: { proPlan: plan.plan, proPlanYearly: plan.yearly } });
    }
  }

  /** invoice.paid / invoice.payment_failed: the failure noted (a banner for the manager), then the subscription's state. */
  public async invoiceEvent(invoice: Stripe.Invoice, failed: boolean): Promise<void> {
    const ref = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof ref === 'string' ? ref : ref?.id;
    if (!subscriptionId) return;
    const row = await prisma.proSubscription.findUnique({ where: { subscriptionId } });
    if (!row) return;
    if (failed) await prisma.proSubscription.update({ where: { id: row.id }, data: { lastPaymentError: 'payment_failed' } });
    const sub = await this.api().subscriptions.retrieve(subscriptionId, { expand: ['default_payment_method'] });
    await this.sync(sub);
  }
}

/** The end of the period paid (on its first item since Stripe's 2025 API). */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}
