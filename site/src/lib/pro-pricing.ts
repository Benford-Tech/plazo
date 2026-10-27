// « Tarifs » of Plazo Pro (27/10/2026, mockup https://claude.ai/artifact/S4fcSrSC28DS8UMSwwdcJ3 validated by Joanny,
// « garde ces prix pour l'instant »): three plans, the listing on Plazo at a commission, options, and the total of a
// selection. Prices are excluding VAT, in cents; every feature named here exists in Plazo today.

export type PlanId = "essentiel" | "operations" | "complet";
export type OptionId = "setup" | "sms" | "booking_page" | "second_parking";

export interface ProPlan {
  id: PlanId;
  name: string;
  monthlyCents: number;
  pitch: string;
  /** The first line of a plan after the first one says it carries the previous plan. */
  features: string[];
  recommended?: boolean;
}

export interface ProOption {
  id: OptionId;
  name: string;
  description: string;
  /** Null: « Sur devis », not selectable yet. */
  priceCents: number | null;
  /** Paid once at the order instead of every month. */
  once?: boolean;
  soon?: boolean;
}

/** Plazo's commission on a booking paid on Plazo, in percent (shown on the page; the real one is the operator's own rate). */
export const MARKETPLACE_RATE_PERCENT = 15;
/** The yearly price is the monthly one less this share, paid for twelve months. */
export const YEARLY_DISCOUNT_PERCENT = 10;

export const PRO_PLANS: ProPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    monthlyCents: 7900,
    pitch: "Pour sortir des carnets et des mails : toutes les réservations au même endroit.",
    features: [
      "Saisie au téléphone et au comptoir",
      "Mails des comparateurs lus tout seuls : Allopark, Onepark, Parclick, ParkMundo, ParkVia",
      "Planning des arrivées et des retours",
      "SMS de la veille au voyageur",
      "Tableau de bord et chiffre d’affaires",
    ],
  },
  {
    id: "operations",
    name: "Opérations",
    monthlyCents: 14900,
    recommended: true,
    pitch: "Pour les parkings avec navette et voituriers.",
    features: [
      "Toutes les fonctions d’Essentiel",
      "Plan du parking sur photo aérienne et files de voiturier",
      "Navette : liste du chauffeur, aller et retour",
      "Suivi des vols et SMS à l’atterrissage",
      "Équipe, postes du jour et code pour rejoindre",
    ],
  },
  {
    id: "complet",
    name: "Complet",
    monthlyCents: 22900,
    pitch: "Pour piloter les marges et protéger le parking en cas de litige.",
    features: [
      "Toutes les fonctions d’Opérations",
      "Commission de chaque comparateur et chiffre d’affaires net",
      "Contrat signé au comptoir et état des lieux en photos",
      "Mail du matin : planning, chiffre, intégrations",
      "Lecture par Claude des mails inconnus",
    ],
  },
];

export const PRO_OPTIONS: ProOption[] = [
  {
    id: "setup",
    name: "Mise en route sur place",
    description: "Plan du parking, transfert des mails des comparateurs, formation de l’équipe.",
    priceCents: 29000,
    once: true,
  },
  {
    id: "sms",
    name: "Pack de 1 000 SMS",
    description: "Rappels de la veille et SMS d’atterrissage au-delà des SMS inclus.",
    priceCents: 4900,
    once: true,
  },
  {
    id: "booking_page",
    name: "Page de réservation à votre nom",
    description: "Votre propre page de réservation, sans passer par les comparateurs.",
    priceCents: 2900,
  },
  {
    id: "second_parking",
    name: "Deuxième parking",
    description: "Un autre parking du même loueur, avec son plan et son équipe.",
    priceCents: null,
    soon: true,
  },
];

export const DEFAULT_PLAN: PlanId = "operations";

export interface ProSelection {
  plan: PlanId;
  yearly: boolean;
  marketplace: boolean;
  options: OptionId[];
}

export interface QuoteLine {
  label: string;
  /** Monthly price after the yearly discount, or the one-off price. Null for the commission line. */
  cents: number | null;
  /** The monthly price before the discount, shown struck through when billed yearly. */
  fullCents?: number;
  kind: "monthly" | "once" | "commission";
}

export interface ProQuote {
  lines: QuoteLine[];
  /** Per month, after the yearly discount. */
  monthlyCents: number;
  /** What is billed at each due date: one month, or twelve when billed yearly. */
  periodCents: number;
  /** Paid once, at the order. */
  onceCents: number;
}

/** Monthly price billed yearly: the discount rounded to the cent. */
export function discounted(monthlyCents: number, yearly: boolean): number {
  return yearly ? Math.round((monthlyCents * (100 - YEARLY_DISCOUNT_PERCENT)) / 100) : monthlyCents;
}

/** The total of a selection; an unknown plan falls back to the recommended one, unknown or « soon » options are left out. */
export function quote(selection: ProSelection): ProQuote {
  const plan = PRO_PLANS.find(p => p.id === selection.plan) ?? PRO_PLANS.find(p => p.id === DEFAULT_PLAN)!;
  const lines: QuoteLine[] = [];
  let monthlyCents = discounted(plan.monthlyCents, selection.yearly);
  let onceCents = 0;
  lines.push({
    label: `Logiciel ${plan.name}`,
    cents: monthlyCents,
    kind: "monthly",
    ...(selection.yearly ? { fullCents: plan.monthlyCents } : {}),
  });
  if (selection.marketplace) lines.push({ label: "Fiche sur Plazo", cents: null, kind: "commission" });
  for (const option of PRO_OPTIONS) {
    if (!selection.options.includes(option.id) || option.priceCents === null || option.soon) continue;
    if (option.once) {
      onceCents += option.priceCents;
      lines.push({ label: option.name, cents: option.priceCents, kind: "once" });
    } else {
      const cents = discounted(option.priceCents, selection.yearly);
      monthlyCents += cents;
      lines.push({ label: option.name, cents, kind: "monthly", ...(selection.yearly ? { fullCents: option.priceCents } : {}) });
    }
  }
  return { lines, monthlyCents, periodCents: selection.yearly ? monthlyCents * 12 : monthlyCents, onceCents };
}

/** The selection in words, for the quote request sent to the support address. */
export function selectionSummary(selection: ProSelection, format: (cents: number) => string): string {
  const q = quote(selection);
  const rows = q.lines.map(line =>
    line.kind === "commission"
      ? `- ${line.label} : ${MARKETPLACE_RATE_PERCENT} % par réservation payée sur Plazo`
      : `- ${line.label} : ${format(line.cents ?? 0)}${line.kind === "once" ? " une fois" : " HT / mois"}`,
  );
  const total = selection.yearly
    ? `Total : ${format(q.periodCents)} HT par an (${format(q.monthlyCents)} par mois)`
    : `Total : ${format(q.periodCents)} HT par mois`;
  return [`Facturation : ${selection.yearly ? "annuelle" : "mensuelle"}`, ...rows, total, ...(q.onceCents ? [`À la commande : ${format(q.onceCents)} HT`] : [])].join(
    "\n",
  );
}

/** The commission example of the listing block: a one-week stay at 60 €. */
export function commissionExample(priceCents = 6000) {
  const commission = Math.round((priceCents * MARKETPLACE_RATE_PERCENT) / 100);
  return { priceCents, commissionCents: commission, netCents: priceCents - commission };
}
