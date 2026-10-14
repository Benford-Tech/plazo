import type { DepartureRow, Reservation } from "@/lib/types";

/**
 * « Embarquer en un geste » (14/10/2026): a traveller still expected (status upcoming) whose booked arrival is this many
 * hours from now (before or after) may board a trip to the terminal; the server checks them in when the trip starts and
 * stays the authority (BOARDING_CHECK_IN_HOURS on the server).
 */
export const BOARDING_CHECK_IN_HOURS = 24;

/** Whether an expected traveller arriving at `arrivalAt` may board a trip to the terminal now. */
export function boardableUpcoming(arrivalAt: string, now: number = Date.now()): boolean {
  const at = new Date(arrivalAt).getTime();
  return Number.isFinite(at) && Math.abs(at - now) <= BOARDING_CHECK_IN_HOURS * 3_600_000;
}

/** Whether a booking can board a trip to the terminal: checked in, or still expected around now. */
export function canBoardDropoff(
  r: Pick<Reservation, "status" | "arrivalAt">,
  now: number = Date.now(),
): boolean {
  return r.status === "arrived" || (r.status === "upcoming" && boardableUpcoming(r.arrivalAt, now));
}

/** A booking as a row of the drop-off list, for a traveller the list does not hold (an early or late one). */
export function departureRowOf(r: Reservation): DepartureRow {
  return {
    reservationId: r.id,
    reference: r.reference,
    customerName: r.customerName,
    passengers: r.passengers,
    plate: r.plate,
    status: r.status,
    arrivalAt: r.arrivalAt,
    arrivedAt: r.arrivedAt,
    spot: r.file?.code ?? r.spot?.code ?? null,
    stopId: r.stopId ?? null,
    stopName: r.stop?.name ?? null,
    tripId: null,
    expected: r.status === "upcoming",
  };
}
