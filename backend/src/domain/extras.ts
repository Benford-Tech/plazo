import type { ExtraStatus, ReservationStatus } from '@/database';

/**
 * Services for the car (21/10/2026, « pouvoir demander un service lavage intérieur et shampouineuse, 50 € ; recharge
 * hybride, 15 € ; recharge électrique, 30 € via Plazo même après avoir déposé son véhicule », direction A of the mockups):
 * each parking turns them on and sets its price; the traveller orders them in the Plazo app, with the booking or later,
 * until `leadHours` before the booked return, and pays online. The team marks them done (« Fait ») or not possible
 * (« Pas possible »: refunded); one still to do when the car is handed back is refunded by itself.
 */

/**
 * 27/10/2026 (« pouvoir ajouter ou supprimer des Services additionnels », choice B + C): each parking composes its own
 * list, from this catalogue (one click, texts written) or as « Service personnalisé »; each service has its icon, its
 * lead time before the return, an optional « one per booking » group and its place in the list.
 */
export const EXTRA_ICONS = ['interior', 'exterior', 'fuel', 'ev', 'hybrid', 'tyre', 'luggage', 'star'] as const;
export type ExtraIcon = (typeof EXTRA_ICONS)[number];

/** « One per booking »: a car is charged one way, washed one way. */
export const EXTRA_GROUPS = ['charge', 'wash'] as const;
export type ExtraGroup = (typeof EXTRA_GROUPS)[number];

export type CatalogueService = {
  label: string;
  description: string;
  icon: ExtraIcon;
  group: ExtraGroup | null;
  leadHours: number;
  priceCents: number;
};

/** The standard services, added in one click (their keys are the orders' `kind`; the first three date from 21/10/2026). */
export const EXTRA_CATALOGUE: Record<string, CatalogueService> = {
  interior_wash: {
    label: 'Lavage intérieur et shampouineuse',
    description: 'Aspiration, plastiques et shampouineuse des sièges',
    icon: 'interior',
    group: null,
    leadHours: 24,
    priceCents: 5000,
  },
  exterior_wash: {
    label: 'Lavage extérieur complet',
    description: 'Carrosserie, vitres et jantes lavées avant votre retour',
    icon: 'exterior',
    group: null,
    leadHours: 36,
    priceCents: 4000,
  },
  hybrid_charge: {
    label: 'Recharge hybride',
    description: 'Batterie de votre hybride rechargeable remplie',
    icon: 'hybrid',
    group: 'charge',
    leadHours: 24,
    priceCents: 1500,
  },
  ev_charge: {
    label: 'Recharge électrique',
    description: 'Votre voiture électrique rechargée avant le retour',
    icon: 'ev',
    group: 'charge',
    leadHours: 24,
    priceCents: 3000,
  },
  fuel: {
    label: 'Plein de carburant',
    description: 'Réservoir rempli avant votre retour',
    icon: 'fuel',
    group: null,
    leadHours: 24,
    priceCents: 9000,
  },
  tyres: {
    label: 'Gonflage des pneus',
    description: 'Pression des pneus vérifiée et ajustée avant votre retour',
    icon: 'tyre',
    group: null,
    leadHours: 24,
    priceCents: 1000,
  },
  luggage: {
    label: 'Garde de bagages',
    description: 'Vos bagages gardés au parking pendant votre voyage',
    icon: 'luggage',
    group: null,
    leadHours: 24,
    priceCents: 1500,
  },
};
export const CATALOGUE_KEYS = Object.keys(EXTRA_CATALOGUE);

/** 10 services at most per parking (removed ones do not count). */
export const MAX_SERVICES = 10;
export const MAX_LABEL_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 140;

/** A parking's service row, as the rules read it. */
export type ServiceRow = {
  id: string;
  kind: string;
  label: string;
  description: string;
  icon: string;
  groupKey: string | null;
  leadHours: number;
  position: number;
  custom: boolean;
  enabled: boolean;
  priceCents: number;
  archivedAt: Date | null;
};

/** A service the traveller can order. */
export type ExtraOffer = {
  id: string;
  kind: string;
  label: string;
  description: string;
  icon: string;
  group: string | null;
  leadHours: number;
  priceCents: number;
};

export const byPosition = <T extends { position: number; kind: string }>(rows: readonly T[]): T[] =>
  [...rows].sort((a, b) => a.position - b.position || a.kind.localeCompare(b.kind));

/** The parking's services, removed ones left out, in its order. */
export const activeServices = <T extends ServiceRow>(rows: readonly T[]): T[] => byPosition(rows.filter(r => r.archivedAt === null));

export function offerOf(row: ServiceRow): ExtraOffer {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    description: row.description,
    icon: row.icon,
    group: row.groupKey,
    leadHours: row.leadHours,
    priceCents: row.priceCents,
  };
}

/** What a traveller can order on a parking: the offered services, in the parking's order. */
export function enabledOffersFrom(rows: readonly ServiceRow[]): ExtraOffer[] {
  return activeServices(rows)
    .filter(r => r.enabled)
    .map(offerOf);
}

/** The icon of an order's service (the parking's row, removed or not), for the apps. */
export function iconOf(kind: string, rows: readonly Pick<ServiceRow, 'kind' | 'icon'>[]): string {
  return rows.find(r => r.kind === kind)?.icon ?? EXTRA_CATALOGUE[kind]?.icon ?? 'star';
}

/** The services of 21/10/2026, for Plazo Pro before 27/10/2026 (`offers` of the settings: three switches). */
export const LEGACY_KINDS = ['interior_wash', 'hybrid_charge', 'ev_charge'] as const;

export function legacyOfferList(rows: readonly ServiceRow[]) {
  return LEGACY_KINDS.map(kind => {
    const row = rows.find(r => r.kind === kind);
    const d = EXTRA_CATALOGUE[kind];
    return {
      kind,
      label: row?.label ?? d.label,
      description: row?.description ?? d.description,
      enabled: !!row && row.archivedAt === null && row.enabled,
      priceCents: row?.priceCents ?? d.priceCents,
      defaultPriceCents: d.priceCents,
    };
  });
}

/** A new custom service's key. */
export function customKey(random: () => string): string {
  return `custom_${random()}`;
}

export const DEFAULT_LEAD_HOURS = 24;
export const MAX_LEAD_HOURS = 168;
export const MIN_EXTRA_PRICE_CENTS = 100;
export const MAX_EXTRA_PRICE_CENTS = 100000;

/** Orders that count: being paid, to do, or done. */
export const ACTIVE_EXTRA_STATUSES: readonly ExtraStatus[] = ['pending_payment', 'ordered', 'done'];

/** A booking takes new orders until the car is on its way back (and never once cancelled). */
export const ORDERABLE_BOOKING_STATUSES: readonly ReservationStatus[] = ['pending_payment', 'upcoming', 'arrived', 'shuttled_out'];

/** When a booking stops taking orders. */
export function orderDeadline(returnAt: Date, leadHours: number): Date {
  return new Date(returnAt.getTime() - leadHours * 3600000);
}

export type OrderRefusal = 'not_offered' | 'closed' | 'too_late' | 'already_ordered' | 'one_charge' | 'one_of_group' | 'not_online';

/** An active order, with its service's group (read from the parking's row). */
export type ActiveOrder = { kind: string; group: string | null };

/** The refusal when the group already has an order: `one_charge` for the charges (the code of 21/10/2026). */
const groupRefusal = (group: string): OrderRefusal => (group === 'charge' ? 'one_charge' : 'one_of_group');

/** Why a service cannot be ordered on this booking now, or null. `active` = its active orders. */
export function orderRefusal(
  booking: { status: ReservationStatus; returnAt: Date; channel: string; paymentStatus: string | null },
  offer: Pick<ExtraOffer, 'kind' | 'group' | 'leadHours'> | null,
  options: { active: readonly ActiveOrder[]; now: Date },
): OrderRefusal | null {
  if (!offer) return 'not_offered';
  if (booking.channel !== 'plazo' || booking.paymentStatus === null) return 'not_online';
  if (!ORDERABLE_BOOKING_STATUSES.includes(booking.status)) return 'closed';
  if (options.now >= orderDeadline(booking.returnAt, offer.leadHours)) return 'too_late';
  if (options.active.some(a => a.kind === offer.kind)) return 'already_ordered';
  if (offer.group && options.active.some(a => a.kind !== offer.kind && a.group === offer.group)) return groupRefusal(offer.group);
  return null;
}

/**
 * The kinds asked at booking, checked: offered, each once, one per group at most. Throws a code (invalid, not_offered,
 * one_charge, one_of_group).
 */
export function checkBookingExtras(raw: unknown, offered: readonly Pick<ExtraOffer, 'kind' | 'group'>[]): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error('invalid');
  const kinds: string[] = [];
  for (const value of raw) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 40) throw new Error('invalid');
    if (!offered.some(o => o.kind === value)) throw new Error('not_offered');
    if (kinds.includes(value)) throw new Error('invalid');
    kinds.push(value);
  }
  for (const group of EXTRA_GROUPS) {
    if (kinds.filter(k => offered.find(o => o.kind === k)?.group === group).length > 1) throw new Error(groupRefusal(group));
  }
  return kinds;
}

/** Statuses of an order still to do: the team sees them, the handover refunds them. */
export const TO_DO: ExtraStatus = 'ordered';

/** A booking whose car is back or gone: an order still to do is refunded. */
export const CLOSED_BOOKING_STATUSES: readonly ReservationStatus[] = ['returned', 'cancelled', 'no_show'];

/** The traveller's push when the team marks a service done. */
export function extraDonePush(kind: string, label: string): { title: string; body: string } {
  const titles: Record<string, string> = {
    interior_wash: 'Votre lavage intérieur est fait',
    exterior_wash: 'Votre lavage est fait',
    hybrid_charge: 'Votre recharge est faite',
    ev_charge: 'Votre recharge est faite',
    fuel: 'Votre plein est fait',
  };
  return { title: titles[kind] ?? `${label} : c'est fait`, body: 'Votre voiture vous attend au parking pour votre retour.' };
}

/** The traveller's push when a service is refunded (not possible, or not done by the handover). */
export function extraRefundedPush(label: string, priceCents: number): { title: string; body: string } {
  const euros = (priceCents / 100).toFixed(2).replace('.', ',');
  return { title: `${label} : remboursé`, body: `Le parking n'a pas pu le faire. ${euros} € vous sont remboursés sur votre carte.` };
}

/** The team's push when a traveller orders a service. */
export function extraOrderedPush(label: string, plate: string, customerName: string): { title: string; body: string } {
  const who = plate.trim() || customerName;
  return { title: `Service commandé · ${label}`, body: `${who} · à faire avant le retour` };
}

/** The traveller's push when the team accepts a service (29/10/2026): it will be done before the return. */
export function extraAcceptedPush(label: string): { title: string; body: string } {
  return { title: `${label} : accepté`, body: "Le parking s'en occupe : ce sera fait avant votre retour." };
}

/** A service is to be done this long before the traveller is back (29/10/2026, « à faire avant le retour »). */
export const EXTRA_DUE_BEFORE_MS = 60 * 60000;

type ReturnTimes = {
  returnAt: Date;
  flightScheduledAt?: Date | null;
  flightEstimatedAt?: Date | null;
  flightLandedAt?: Date | null;
};

/** When the traveller is expected back: the flight's landing when it is known (landed, revised, scheduled), else the booked return. */
export function expectedReturnOf(r: ReturnTimes): Date {
  return r.flightLandedAt ?? r.flightEstimatedAt ?? r.flightScheduledAt ?? r.returnAt;
}

/** « À faire avant »: one hour before the expected return. */
export function extraDueAt(r: ReturnTimes): Date {
  return new Date(expectedReturnOf(r).getTime() - EXTRA_DUE_BEFORE_MS);
}
