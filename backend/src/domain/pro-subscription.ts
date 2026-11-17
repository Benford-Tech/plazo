// The Plazo Pro subscription paid with Stripe Billing (17/11/2026, « Branche stripe pour le paiement des abonnements
// plazo pro », direction B « Tout dans Plazo », « avec la mise en route »). Prices excluding VAT, in cents; VAT (20 %) is
// added on top by a Stripe tax rate. The plans are those of « Mon contrat » and of the site's Tarifs page.
import { PRO_PLANS, ProPlanId, yearlyMonthly } from './plazo-agreements';

export const SETUP_FEE_CENTS = 29000;
export const VAT_PERCENT = 20;
/** Payment methods offered: card, and SEPA direct debit for French and European bank accounts. */
export const PAYMENT_METHOD_TYPES = ['card', 'sepa_debit'] as const;

/** What a plan costs per billing period, excluding VAT: a month, or a year at the yearly monthly price. */
export function planPriceCents(plan: ProPlanId, yearly: boolean): number {
  const monthly = PRO_PLANS[plan].monthlyEuros;
  return yearly ? yearlyMonthly(monthly) * 12 * 100 : monthly * 100;
}

/** Monthly equivalent, to tell an upgrade from a downgrade. */
export function monthlyEquivalentCents(plan: ProPlanId, yearly: boolean): number {
  return yearly ? Math.round(planPriceCents(plan, true) / 12) : planPriceCents(plan, false);
}

/** The Stripe lookup key of a plan's price (found or created on first use). */
export const planLookupKey = (plan: ProPlanId, yearly: boolean) => `plazo_pro_${plan}_${yearly ? 'yearly' : 'monthly'}_v1`;
export const SETUP_LOOKUP_KEY = 'plazo_pro_setup_v1';

export function planOfLookupKey(key: string | null | undefined): { plan: ProPlanId; yearly: boolean } | null {
  const m = /^plazo_pro_(essentiel|operations|complet)_(monthly|yearly)_v1$/.exec(key ?? '');
  return m ? { plan: m[1] as ProPlanId, yearly: m[2] === 'yearly' } : null;
}

export const withVat = (cents: number) => cents + Math.round((cents * VAT_PERCENT) / 100);

/**
 * A change of plan is charged now (prorated) when it costs more per month or changes the billing interval
 * (Stripe restarts the period then); a cheaper plan on the same interval applies from the next renewal, nothing due now.
 */
export function chargedNow(from: { plan: ProPlanId; yearly: boolean }, to: { plan: ProPlanId; yearly: boolean }): boolean {
  if (from.yearly !== to.yearly) return true;
  return monthlyEquivalentCents(to.plan, to.yearly) > monthlyEquivalentCents(from.plan, from.yearly);
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
