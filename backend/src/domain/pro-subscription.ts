// The Plazo Pro subscription paid with Stripe Billing (17/11/2026, « Branche stripe pour le paiement des abonnements
// plazo pro », direction B « Tout dans Plazo », « avec la mise en route »). Prices excluding VAT, in cents; VAT (20 %) is
// added on top by a Stripe tax rate. The plans are those of « Mon contrat » and of the site's Tarifs page.
import { isProPlan, PRO_PLANS, ProPlanId, YEARLY_DISCOUNT_PERCENT, yearlyMonthly } from './plazo-agreements';

export const SETUP_FEE_CENTS = 29000;
export const VAT_PERCENT = 20;
/** Payment methods offered: card, and SEPA direct debit for French and European bank accounts. */
export const PAYMENT_METHOD_TYPES = ['card', 'sepa_debit'] as const;

/**
 * The price the platform agreed with one operator (24/11/2026, « appliquer un tarif au plan mensuel d'un parking »,
 * direction A « Prix négocié »): a monthly price excluding VAT for one plan, and the setup fee (0 = offered). Null fields
 * mean the grid.
 */
export interface AgreedPrice {
  plan: ProPlanId | null;
  monthlyCents: number | null;
  setupFeeCents: number | null;
}

export const NO_AGREED_PRICE: AgreedPrice = { plan: null, monthlyCents: null, setupFeeCents: null };
/** Bounds of an agreed price (excluding VAT): 1 € to 10 000 € a month, a setup fee from 0 to 10 000 €. */
export const AGREED_MONTHLY_MIN_CENTS = 100;
export const AGREED_MAX_CENTS = 1_000_000;

/** The grid's monthly price of a plan, excluding VAT. */
export const gridMonthlyCents = (plan: ProPlanId) => PRO_PLANS[plan].monthlyEuros * 100;

/** The agreed monthly price when it is for this plan, else null. */
export function agreedMonthlyFor(plan: ProPlanId, agreed: AgreedPrice | null | undefined): number | null {
  return agreed && agreed.plan === plan && agreed.monthlyCents !== null ? agreed.monthlyCents : null;
}

/**
 * What a plan costs per billing period, excluding VAT: a month, or a year at the yearly monthly price. An agreed price for
 * the plan replaces the grid's monthly price; the year keeps the same discount on it.
 */
export function planPriceCents(plan: ProPlanId, yearly: boolean, agreed?: AgreedPrice | null): number {
  const custom = agreedMonthlyFor(plan, agreed);
  if (custom !== null) return yearly ? Math.round((custom * (100 - YEARLY_DISCOUNT_PERCENT)) / 100) * 12 : custom;
  const monthly = PRO_PLANS[plan].monthlyEuros;
  return yearly ? yearlyMonthly(monthly) * 12 * 100 : monthly * 100;
}

/** The setup fee due on the first invoice, excluding VAT: the agreed one (0 = offered), else the grid's. */
export const setupFeeCentsOf = (agreed?: AgreedPrice | null) => agreed?.setupFeeCents ?? SETUP_FEE_CENTS;

/** Monthly equivalent, to tell an upgrade from a downgrade. */
export function monthlyEquivalentCents(plan: ProPlanId, yearly: boolean, agreed?: AgreedPrice | null): number {
  return yearly ? Math.round(planPriceCents(plan, true, agreed) / 12) : planPriceCents(plan, false, agreed);
}

/**
 * The Stripe lookup key of a plan's price (found or created on first use). It carries the amount: a new price in
 * PRO_PLANS, or a price agreed with an operator, makes (or reuses) the Stripe price of that amount; running subscriptions
 * keep theirs until their plan or their agreed price changes.
 */
export const planLookupKey = (plan: ProPlanId, yearly: boolean, agreed?: AgreedPrice | null) =>
  `plazo_pro_${plan}_${yearly ? 'yearly' : 'monthly'}_${planPriceCents(plan, yearly, agreed)}`;
export const setupLookupKey = (cents: number) => `plazo_pro_setup_${cents}`;
export const SETUP_LOOKUP_KEY = setupLookupKey(SETUP_FEE_CENTS);

/** Checks a platform's agreed price: { plan, monthlyCents | null, setupFeeCents | null }. */
export function readAgreedPrice(body: { plan?: unknown; monthlyCents?: unknown; setupFeeCents?: unknown }): AgreedPrice {
  const fields: Record<string, string> = {};
  const plan = body.plan === null || body.plan === undefined || body.plan === '' ? null : body.plan;
  if (plan !== null && !isProPlan(plan)) fields.plan = 'invalid';
  const cents = (v: unknown, min: number, key: string): number | null => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v !== 'number' || !Number.isInteger(v)) {
      fields[key] = 'invalid';
      return null;
    }
    if (v < min || v > AGREED_MAX_CENTS) fields[key] = 'range';
    return v;
  };
  const monthlyCents = cents(body.monthlyCents, AGREED_MONTHLY_MIN_CENTS, 'monthlyCents');
  const setupFeeCents = cents(body.setupFeeCents, 0, 'setupFeeCents');
  if (monthlyCents !== null && plan === null) fields.plan = 'required';
  if (Object.keys(fields).length) throw Object.assign(new Error('invalid agreed price'), { fields });
  return { plan: monthlyCents === null ? null : (plan as ProPlanId), monthlyCents, setupFeeCents };
}

export function planOfLookupKey(key: string | null | undefined): { plan: ProPlanId; yearly: boolean } | null {
  const m = /^plazo_pro_(essentiel|operations|complet)_(monthly|yearly)_\d+$/.exec(key ?? '');
  return m ? { plan: m[1] as ProPlanId, yearly: m[2] === 'yearly' } : null;
}

export const withVat = (cents: number) => cents + Math.round((cents * VAT_PERCENT) / 100);

/**
 * A change of plan is charged now (prorated) when it costs more per month or changes the billing interval
 * (Stripe restarts the period then); a cheaper plan on the same interval applies from the next renewal, nothing due now.
 */
export function chargedNow(
  from: { plan: ProPlanId; yearly: boolean },
  to: { plan: ProPlanId; yearly: boolean },
  agreed?: AgreedPrice | null,
): boolean {
  if (from.yearly !== to.yearly) return true;
  return monthlyEquivalentCents(to.plan, to.yearly, agreed) > monthlyEquivalentCents(from.plan, from.yearly, agreed);
}

/** States in which the operator has a subscription running (paid, or a payment being retried). */
export const RUNNING_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];
export const isRunning = (status: string | null | undefined) => RUNNING_STATUSES.includes(status ?? '');

export interface PaymentMethodSummary {
  type: 'card' | 'sepa_debit' | 'other';
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

/** The parts of a Stripe payment method worth showing (no holder name, no fingerprint). */
export function paymentMethodSummary(
  pm:
    | {
        type?: string;
        card?: { brand?: string | null; last4?: string | null; exp_month?: number | null; exp_year?: number | null } | null;
        sepa_debit?: { last4?: string | null } | null;
      }
    | null
    | undefined,
): PaymentMethodSummary | null {
  if (!pm) return null;
  if (pm.type === 'card' && pm.card) {
    return {
      type: 'card',
      brand: pm.card.brand ?? null,
      last4: pm.card.last4 ?? null,
      expMonth: pm.card.exp_month ?? null,
      expYear: pm.card.exp_year ?? null,
    };
  }
  if (pm.type === 'sepa_debit' && pm.sepa_debit)
    return { type: 'sepa_debit', brand: null, last4: pm.sepa_debit.last4 ?? null, expMonth: null, expYear: null };
  return { type: 'other', brand: null, last4: null, expMonth: null, expYear: null };
}
