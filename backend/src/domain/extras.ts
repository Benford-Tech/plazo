import type { ExtraKind, ExtraStatus, ReservationStatus } from '@/database';

/**
 * Services for the car (21/10/2026, « pouvoir demander un service lavage intérieur et shampouineuse, 50 € ; recharge
 * hybride, 15 € ; recharge électrique, 30 € via Plazo même après avoir déposé son véhicule », direction A of the mockups):
 * each parking turns them on and sets its price; the traveller orders them in the Plazo app, with the booking or later,
 * until `leadHours` before the booked return, and pays online. The team marks them done (« Fait ») or not possible
 * (« Pas possible »: refunded); one still to do when the car is handed back is refunded by itself.
 */

export const EXTRA_KINDS: readonly ExtraKind[] = ['interior_wash', 'hybrid_charge', 'ev_charge'];

export const EXTRA_DEFAULTS: Record<ExtraKind, { label: string; description: string; priceCents: number }> = {
  interior_wash: { label: 'Lavage intérieur et shampouineuse', description: 'Aspiration, plastiques et shampouineuse des sièges', priceCents: 5000 },
  hybrid_charge: { label: 'Recharge hybride', description: 'Batterie de votre hybride rechargeable remplie', priceCents: 1500 },
  ev_charge: { label: 'Recharge électrique', description: 'Votre voiture électrique rechargée avant le retour', priceCents: 3000 },
};

/** Every service with the parking's row (or its default, not offered), in the catalogue's order. */
export function offerList(rows: readonly { kind: ExtraKind; enabled: boolean; priceCents: number }[]) {
  return EXTRA_KINDS.map(kind => {
    const row = rows.find(r => r.kind === kind);
    const d = EXTRA_DEFAULTS[kind];
    return {
      kind,
      label: d.label,
      description: d.description,
      enabled: row?.enabled ?? false,
      priceCents: row?.priceCents ?? d.priceCents,
      defaultPriceCents: d.priceCents,
    };
  });
}

/** What a traveller can order on a parking: the offered services only. */
export function enabledOffersFrom(rows: readonly { kind: ExtraKind; enabled: boolean; priceCents: number }[]) {
  return offerList(rows)
    .filter(o => o.enabled)
    .map(({ kind, label, description, priceCents }) => ({ kind, label, description, priceCents }));
}

/** A car is one or the other: the two charges exclude each other. */
export const CHARGE_KINDS: readonly ExtraKind[] = ['hybrid_charge', 'ev_charge'];

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

export type OrderRefusal = 'not_offered' | 'closed' | 'too_late' | 'already_ordered' | 'one_charge' | 'not_online';

/** Why a service cannot be ordered on this booking now, or null. `active` = the kinds of its active orders. */
export function orderRefusal(
  booking: { status: ReservationStatus; returnAt: Date; channel: string; paymentStatus: string | null },
  kind: ExtraKind,
  options: { offered: boolean; leadHours: number; active: readonly ExtraKind[]; now: Date },
): OrderRefusal | null {
  if (!options.offered) return 'not_offered';
  if (booking.channel !== 'plazo' || booking.paymentStatus === null) return 'not_online';
  if (!ORDERABLE_BOOKING_STATUSES.includes(booking.status)) return 'closed';
  if (options.now >= orderDeadline(booking.returnAt, options.leadHours)) return 'too_late';
  if (options.active.includes(kind)) return 'already_ordered';
  if (CHARGE_KINDS.includes(kind) && options.active.some(k => k !== kind && CHARGE_KINDS.includes(k))) return 'one_charge';
  return null;
}

/** The kinds asked at booking, checked: known, offered, each once, one charge at most. Throws a code. */
export function checkBookingExtras(raw: unknown, offered: readonly ExtraKind[]): ExtraKind[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error('invalid');
  const kinds: ExtraKind[] = [];
  for (const value of raw) {
    if (typeof value !== 'string' || !EXTRA_KINDS.includes(value as ExtraKind)) throw new Error('invalid');
    const kind = value as ExtraKind;
    if (!offered.includes(kind)) throw new Error('not_offered');
    if (kinds.includes(kind)) throw new Error('invalid');
    kinds.push(kind);
  }
  if (kinds.filter(k => CHARGE_KINDS.includes(k)).length > 1) throw new Error('one_charge');
  return kinds;
}

/** Statuses of an order still to do: the team sees them, the handover refunds them. */
export const TO_DO: ExtraStatus = 'ordered';

/** A booking whose car is back or gone: an order still to do is refunded. */
export const CLOSED_BOOKING_STATUSES: readonly ReservationStatus[] = ['returned', 'cancelled', 'no_show'];

/** The traveller's push when the team marks a service done. */
export function extraDonePush(kind: ExtraKind): { title: string; body: string } {
  const titles: Record<ExtraKind, string> = {
    interior_wash: 'Votre lavage intérieur est fait',
    hybrid_charge: 'Votre recharge est faite',
    ev_charge: 'Votre recharge est faite',
  };
  return { title: titles[kind], body: 'Votre voiture vous attend au parking pour votre retour.' };
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
