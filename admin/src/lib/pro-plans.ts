// The Plazo Pro plans shown on « Mon contrat Plazo » (13/11/2026, « Min 99, puis 199, 299 », « intègre-le à Plazo Pro dans
// l'onglet Mon contrat Plazo »): the same plans as the site's Tarifs page (site/src/lib/pro-pricing.ts). Excluding VAT, in
// euros per month; every feature named here exists in Plazo today.

export type PlanId = "essentiel" | "operations" | "complet";

export interface PlazoPlan {
  id: PlanId;
  name: string;
  monthlyEuros: number;
  pitch: string;
  /** The first line of a plan after the first one says it carries the previous plan. */
  features: string[];
  recommended?: boolean;
}

export const YEARLY_DISCOUNT_PERCENT = 10;
export const MARKETPLACE_RATE_PERCENT = 15;

export const PLAZO_PLANS: PlazoPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    monthlyEuros: 99,
    pitch: "Pour sortir des carnets et des mails.",
    features: [
      "Mails des comparateurs lus tout seuls, annulations comprises",
      "Planning du jour et prévisionnel sur 3 mois",
      "Message de la veille par WhatsApp, SMS en repli",
      "Import de vos anciennes réservations",
      "Tableau de bord et chiffre d'affaires",
      "Web, iPhone et Android, équipe illimitée",
    ],
  },
  {
    id: "operations",
    name: "Opérations",
    monthlyEuros: 199,
    recommended: true,
    pitch: "Pour les parkings avec navette et voituriers.",
    features: [
      "Tout Essentiel, plus :",
      "Navette Aller / Retour, embarquement en un geste",
      "Vols suivis, message au client à l'atterrissage",
      "Plan du parking, files de voiturier, clés au crochet",
      "WhatsApp avec vos clients, chauffeur compris",
      "Services et suppléments encaissés au parking",
    ],
  },
  {
    id: "complet",
    name: "Complet",
    monthlyEuros: 299,
    pitch: "Pour piloter la marge et se protéger en cas de litige.",
    features: [
      "Tout Opérations, plus :",
      "Ce que chaque comparateur vous prend, votre net",
      "Statistiques : quelle plateforme rapporte",
      "Contrat signé au comptoir, état des lieux en photos",
      "Factures et avoirs à votre nom",
      "Mail du matin, mails inconnus lus par Claude",
    ],
  },
];

/** Monthly price billed yearly, in whole euros (the discount rounded down to the euro: 99 € → 89 €). */
export function yearlyMonthly(monthlyEuros: number): number {
  return Math.floor((monthlyEuros * (100 - YEARLY_DISCOUNT_PERCENT)) / 100);
}

export interface SavingsInput {
  bookingsPerMonth: number;
  minutesPerBooking: number;
  callsPerDay: number;
  hourlyCost: number;
  planEuros: number;
}

/** One avoided call counted 2 minutes, 30 days a month: only typing and calls are counted, nothing else. */
export function savings(i: SavingsInput) {
  const hours = (i.bookingsPerMonth * i.minutesPerBooking + i.callsPerDay * 30 * 2) / 60;
  const value = hours * i.hourlyCost;
  const net = value - i.planEuros;
  const paidBackInDays = value > 0 ? Math.ceil(i.planEuros / (value / 30)) : null;
  return { hours, value, net, paidBackInDays };
}
