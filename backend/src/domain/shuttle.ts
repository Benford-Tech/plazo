import { ReservationStatus } from '@/database';
import { AWAY_STATUSES, HOLDING_STATUSES } from './reservation';

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
export const PICKUP_STATUSES: ReservationStatus[] = AWAY_STATUSES;
/**
 * Returns listed for the driver (« À récupérer »): a rolling window around now, not the calendar day. A return (or a
 * flight's estimated landing) from this long before now…
 */
export const PICKUP_LIST_HOURS_BEFORE = 3;
/** …to this long after now… */
export const PICKUP_LIST_HOURS_AHEAD = 18;
/** …and still listed this long after its landing (else its estimate, else its return time), for late flights. */
export const PICKUP_LIST_HOURS_AFTER = 6;

/** Bookings whose traveller waits at the parking for the shuttle to the terminal. */
export const DROPOFF_STATUSES: ReservationStatus[] = ['arrived'];

/**
 * « Embarquer en un geste » (14/10/2026): a traveller not checked in yet ("upcoming") whose booked arrival is within this
 * many hours of now (before or after) may board a drop-off; they are checked in ("Sur place") when the trip starts.
 */
export const BOARDING_CHECK_IN_HOURS = 24;

/** Departures listed for the driver: arrivals this long before now (the expected ones too, late but still boardable)… */
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

/** Whether boarding a trip of this direction checks the traveller in: a drop-off of someone still expected. */
export function checksInAtBoarding(direction: ShuttleDirection, status: ReservationStatus): boolean {
  return direction === 'dropoff' && status === 'upcoming';
}

/**
 * Whether a booking can board a trip of this direction: a pick-up takes the travellers away (PICKUP_STATUSES); a
 * drop-off the checked-in ones, and those still expected around now (BOARDING_CHECK_IN_HOURS), checked in at boarding.
 */
export function canBoard(direction: ShuttleDirection, booking: { status: ReservationStatus; arrivalAt: Date }, now: Date): boolean {
  if (direction === 'pickup') return canPickUp(booking.status);
  if (checksInAtBoarding(direction, booking.status)) {
    return Math.abs(booking.arrivalAt.getTime() - now.getTime()) <= BOARDING_CHECK_IN_HOURS * 3600000;
  }
  return canDropOff(booking.status);
}

/** « Pointé à l'embarquement par Karim » (14/10/2026): a traveller checked in at the boarding of a drop-off. */
export interface BoardingCheckIn {
  /** The trip's driver, null when unknown (an erased account). */
  driverFirstName: string | null;
  /** When they were checked in (the booking's arrivedAt, ISO). */
  at: string;
}

/** What a booking query selects to tell a check-in at boarding (boardingCheckInOf). */
export const BOARDING_CHECK_IN_SELECT = {
  boardingTripId: true,
  arrivedAt: true,
  boardingTrip: { select: { driver: { select: { firstName: true } } } },
} as const;

type BoardingCheckInRow = {
  boardingTripId: string | null;
  arrivedAt: Date | null;
  boardingTrip: { driver: { firstName: string } } | null;
};

/** The check-in at boarding of a booking read with BOARDING_CHECK_IN_SELECT, null when it was checked in otherwise. */
export function boardingCheckInOf(row: BoardingCheckInRow): BoardingCheckIn | null {
  if (!row.boardingTripId || !row.arrivedAt) return null;
  return { driverFirstName: row.boardingTrip?.driver.firstName.trim() || null, at: row.arrivedAt.toISOString() };
}

/** The row with its check-in at boarding (`boardingCheckIn`), without the fields read to tell it. */
export function withBoardingCheckIn<T extends BoardingCheckInRow>(
  row: T,
): Omit<T, 'boardingTrip' | 'boardingTripId'> & { boardingCheckIn: BoardingCheckIn | null } {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { boardingTrip, boardingTripId, ...rest } = row;
  return { ...rest, boardingCheckIn: boardingCheckInOf(row) };
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
  if (!HOLDING_STATUSES.includes(booking.status)) return null;
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
