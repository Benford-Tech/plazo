import { ReservationStatus } from '@/database';

/**
 * Rules of the shuttle trips (driver mode, see SPEC.md block 3): a driver shares their position
 * with the travellers they are picking up, from "Démarrer le trajet" to "Clients récupérés".
 */

/** A trip ends by itself this long after its start: the position is erased. */
export const TRIP_MAX_MINUTES = 90;
/** At most one position per this many seconds per trip. */
export const TRIP_POSITION_MIN_INTERVAL_SECONDS = 10;
/** Tolerance on that interval: the phone paces by its send time, the server by the receive time (network jitter). */
export const POSITION_INTERVAL_TOLERANCE_MS = 2000;
/** A position recorded longer ago than this by the phone is refused. */
export const TRIP_POSITION_MAX_AGE_SECONDS = 300;
/** Bookings whose traveller can be picked up at the airport. */
export const PICKUP_STATUSES: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested'];
/** Returns listed for the driver: this long before the first return of the day… */
export const PICKUP_LIST_HOURS_BEFORE = 3;
/** …and this long after a return time, for late flights. */
export const PICKUP_LIST_HOURS_AFTER = 6;

/** Bookings whose traveller waits at the parking for the shuttle to the terminal. */
export const DROPOFF_STATUSES: ReservationStatus[] = ['arrived'];

/** Departures listed for the driver: arrivals this long before now… */
export const DROPOFF_LIST_HOURS_BEFORE = 6;
/** …and this long after now (early birds). */
export const DROPOFF_LIST_HOURS_AFTER = 3;

/** Where a trip goes (T-A "Deux sens", 04/10/2026). */
export type ShuttleDirection = 'pickup' | 'dropoff';
export const SHUTTLE_DIRECTIONS: ShuttleDirection[] = ['pickup', 'dropoff'];

/** Whether this booking can be put on a trip to the airport (pick-up of a returning traveller). */
export function canPickUp(status: ReservationStatus): boolean {
  return PICKUP_STATUSES.includes(status);
}

/** Whether this booking can be put on a trip to the terminal (drop-off after the arrival). */
export function canDropOff(status: ReservationStatus): boolean {
  return DROPOFF_STATUSES.includes(status);
}

/** Whether a booking can board a trip of this direction. */
export function canBoard(direction: ShuttleDirection, status: ReservationStatus): boolean {
  return direction === 'pickup' ? canPickUp(status) : canDropOff(status);
}

/**
 * The traveller's "Navette" block (S-A, 04/10/2026) shows the parking's running shuttles from the
 * arrival day to the return day. Returns which target the distance is measured to: the parking
 * (outbound: the shuttle comes back to take them to the terminal) or the meeting point (return).
 */
export function stayPhase(
  booking: { status: ReservationStatus; arrivalAt: Date; returnAt: Date },
  localToday: string,
  localArrivalDay: string,
  localReturnDay: string,
): 'arrival' | 'stay' | 'return' | null {
  if (!['upcoming', 'arrived', 'shuttled_out', 'return_requested'].includes(booking.status)) return null;
  if (localToday < localArrivalDay || localToday > localReturnDay) return null;
  if (localToday === localReturnDay && booking.status !== 'upcoming') return 'return';
  if (localToday === localArrivalDay) return 'arrival';
  return booking.status === 'upcoming' ? null : 'stay';
}

/** "Camille Martin" -> "Camille": what the traveller sees of the driver. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/** "Navette blanche · Mercedes Vito · GH-456-JK" pieces, for the traveller. */
export function vehicleDescription(vehicle: { model: string | null; colour: string | null; plate: string | null }): string {
  return [vehicle.colour ? `Navette ${vehicle.colour}` : 'Navette', vehicle.model, vehicle.plate].filter(Boolean).join(' · ');
}
