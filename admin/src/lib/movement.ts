import type { ReservationStatus } from "@/lib/types";

/**
 * « Arrivées · Départs » (27/10/2026 in Plazo Pro, the whole pro space on 28/10/2026): an arrival is green, a departure
 * indigo; a card of either kind has a pale ground of its colour, a 4 px edge on the left and a filled pill (`MovementPill`).
 */
export type Movement = "arrival" | "departure";

/** The booking's next movement at the parking: its arrival while expected, its departure while the car is there. */
export function nextMovementOf(status: ReservationStatus | string): Movement | null {
  if (status === "upcoming") return "arrival";
  if (status === "arrived" || status === "shuttled_out" || status === "return_requested" || status === "back_at_parking") return "departure";
  return null;
}

/** Pale ground and left edge of a card of this kind. */
export const MOVEMENT_CARD: Record<Movement, string> = {
  arrival: "border-l-4 border-l-ok bg-ok-soft",
  departure: "border-l-4 border-l-info bg-info-soft",
};

export const MOVEMENT_TEXT: Record<Movement, string> = { arrival: "text-ok-text", departure: "text-info-text" };
export const MOVEMENT_DOT: Record<Movement, string> = { arrival: "bg-ok", departure: "bg-info" };
