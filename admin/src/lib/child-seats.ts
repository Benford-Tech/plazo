/**
 * Child car seats for the shuttle (24/10/2026, direction B « par âge »): the traveller says how many children of each
 * age group ride along, the parking installs the matching seats in the shuttle. Children count in the booking's
 * passengers, so a booking always has at least one adult: seats < passengers. Mirrors `backend/src/domain/child-seats.ts`.
 */
export type ChildSeatKind = "infant" | "toddler" | "booster";

export const CHILD_SEAT_KINDS: readonly ChildSeatKind[] = ["infant", "toddler", "booster"];

/** The most of one kind a booking may ask for. */
export const MAX_CHILD_SEATS_PER_KIND = 4;

export interface ChildSeats {
  /** Up to 12 months: rear-facing seat. */
  infant: number;
  /** 1 to 4 years: child seat. */
  toddler: number;
  /** 4 to 10 years: booster. */
  booster: number;
}

export const NO_CHILD_SEATS: ChildSeats = { infant: 0, toddler: 0, booster: 0 };

/** French labels: the form's age group and hint, the driver's pill, the summary's singular and plural. */
export const CHILD_SEAT_LABELS: Record<ChildSeatKind, { ages: string; hint: string; badge: string; one: string; many: string; load: string }> = {
  infant: { ages: "Bébé · jusqu'à 12 mois", hint: "Siège dos à la route", badge: "Siège bébé", one: "siège bébé", many: "sièges bébé", load: "siège bébé (dos à la route)" },
  toddler: { ages: "1 à 4 ans", hint: "Siège enfant", badge: "Siège 1 à 4 ans", one: "siège 1 à 4 ans", many: "sièges 1 à 4 ans", load: "siège 1 à 4 ans" },
  booster: { ages: "4 à 10 ans", hint: "Réhausseur", badge: "Réhausseur", one: "réhausseur", many: "réhausseurs", load: "réhausseur" },
};

export function childSeatsTotal(seats: ChildSeats | null | undefined): number {
  return seats ? seats.infant + seats.toddler + seats.booster : 0;
}

export const hasChildSeats = (seats: ChildSeats | null | undefined): boolean => childSeatsTotal(seats) > 0;

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** « 1 siège bébé · 2 réhausseurs », or "" without any seat. */
export function childSeatsSummary(seats: ChildSeats | null | undefined): string {
  if (!seats) return "";
  return CHILD_SEAT_KINDS.filter(k => seats[k] > 0)
    .map(k => plural(seats[k], CHILD_SEAT_LABELS[k].one, CHILD_SEAT_LABELS[k].many))
    .join(" · ");
}

/** The driver's pill for one kind: « Réhausseur », « 2 réhausseurs ». */
export function childSeatBadge(kind: ChildSeatKind, n: number): string {
  const l = CHILD_SEAT_LABELS[kind];
  return n > 1 ? `${n} ${l.many}` : l.badge;
}

/** The seats to load for several bookings at once (the driver's « À charger avant de partir »). */
export function sumChildSeats(all: (ChildSeats | null | undefined)[]): ChildSeats {
  const out: ChildSeats = { ...NO_CHILD_SEATS };
  for (const s of all) {
    if (!s) continue;
    for (const k of CHILD_SEAT_KINDS) out[k] += s[k];
  }
  return out;
}

/** « 1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 1 réhausseur », or "" without any seat. */
export function childSeatsLoadLine(seats: ChildSeats | null | undefined): string {
  if (!seats) return "";
  return CHILD_SEAT_KINDS.filter(k => seats[k] > 0)
    .map(k => (seats[k] > 1 ? `${seats[k]} ${CHILD_SEAT_LABELS[k].many}${k === "infant" ? " (dos à la route)" : ""}` : `1 ${CHILD_SEAT_LABELS[k].load}`))
    .join(" · ");
}

/** True when two requests ask for the same seats (an edit sends them only when changed). */
export const sameChildSeats = (a: ChildSeats | null | undefined, b: ChildSeats | null | undefined): boolean =>
  CHILD_SEAT_KINDS.every(k => (a?.[k] ?? 0) === (b?.[k] ?? 0));
