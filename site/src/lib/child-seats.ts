import type { ChildSeats } from "./types";

/**
 * Child car seats for the shuttle (24/10/2026, direction B « par âge »): the traveller says how many children of
 * each age group ride along, the parking installs the matching seats in the shuttle, both ways, for free.
 * Children count in the booking's passengers, so a booking always has one adult at least: seats < passengers.
 * The same rules and words as the API's `domain/child-seats.ts`.
 */
export type ChildSeatKind = keyof ChildSeats;

export const CHILD_SEAT_KINDS: readonly ChildSeatKind[] = ["infant", "toddler", "booster"];

/** The most of one kind a booking may ask for (the API refuses more). */
export const MAX_CHILD_SEATS_PER_KIND = 4;

export const NO_CHILD_SEATS: ChildSeats = { infant: 0, toddler: 0, booster: 0 };

/** Name of the booking form's field for one kind (`childSeatsInfant`…). */
export const CHILD_SEAT_FIELDS: Record<ChildSeatKind, string> = {
  infant: "childSeatsInfant",
  toddler: "childSeatsToddler",
  booster: "childSeatsBooster",
};

/** French labels, singular and plural, as the summary prints them (« 1 siège bébé · 2 réhausseurs »). */
export const CHILD_SEAT_LABELS: Record<ChildSeatKind, { one: string; many: string }> = {
  infant: { one: "siège bébé", many: "sièges bébé" },
  toddler: { one: "siège 1 à 4 ans", many: "sièges 1 à 4 ans" },
  booster: { one: "réhausseur", many: "réhausseurs" },
};

export function childSeatsTotal(seats: ChildSeats | null | undefined): number {
  return seats ? seats.infant + seats.toddler + seats.booster : 0;
}

export function hasChildSeats(seats: ChildSeats | null | undefined): boolean {
  return childSeatsTotal(seats) > 0;
}

/** « 1 siège bébé · 2 réhausseurs », or '' without any seat. */
export function childSeatsSummary(seats: ChildSeats | null | undefined, separator = " · "): string {
  if (!seats) return "";
  return CHILD_SEAT_KINDS.filter(k => seats[k] > 0)
    .map(k => `${seats[k]} ${seats[k] > 1 ? CHILD_SEAT_LABELS[k].many : CHILD_SEAT_LABELS[k].one}`)
    .join(separator);
}

/**
 * Why a request would be refused, or null: fewer seats than passengers (one adult at least). The counts
 * themselves are kept in range by the steppers; the API checks them again.
 */
export function childSeatsProblem(seats: ChildSeats, passengers: number): "child_seats_exceed_passengers" | null {
  const total = childSeatsTotal(seats);
  return total > 0 && total >= passengers ? "child_seats_exceed_passengers" : null;
}

/** One count typed in the form ("2"): an integer from 0 to 4, anything else counts as none. */
export function parseChildSeatCount(value: string | null | undefined): number {
  if (!value || !/^\d{1,2}$/.test(value.trim())) return 0;
  const n = Number(value.trim());
  return n >= 0 && n <= MAX_CHILD_SEATS_PER_KIND ? n : 0;
}

/** The seats asked in the booking form's values (`childSeatsInfant`…), none when the fields are absent. */
export function childSeatsFromValues(values: Record<string, string | undefined>): ChildSeats {
  return {
    infant: parseChildSeatCount(values[CHILD_SEAT_FIELDS.infant]),
    toddler: parseChildSeatCount(values[CHILD_SEAT_FIELDS.toddler]),
    booster: parseChildSeatCount(values[CHILD_SEAT_FIELDS.booster]),
  };
}

/** The form values of a booking's seats, to refill the form (« Modifier » on the payment step). */
export function childSeatsToValues(seats: ChildSeats | null | undefined): Record<string, string> {
  const s = seats ?? NO_CHILD_SEATS;
  return {
    [CHILD_SEAT_FIELDS.infant]: String(s.infant),
    [CHILD_SEAT_FIELDS.toddler]: String(s.toddler),
    [CHILD_SEAT_FIELDS.booster]: String(s.booster),
  };
}
