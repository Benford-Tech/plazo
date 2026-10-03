import { ReservationStatus } from '@/database';

/**
 * Rules of the shuttle trips (driver mode, see SPEC.md block 3): a driver shares their position
 * with the travellers they are picking up, from "Démarrer le trajet" to "Clients récupérés".
 */

/** A trip ends by itself this long after its start: the position is erased. */
export const TRIP_MAX_MINUTES = 90;
/** At most one position per this many seconds per trip. */
export const TRIP_POSITION_MIN_INTERVAL_SECONDS = 10;
/** A position recorded longer ago than this by the phone is refused. */
export const TRIP_POSITION_MAX_AGE_SECONDS = 300;
/** Bookings whose traveller can be picked up at the airport. */
export const PICKUP_STATUSES: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested'];
/** Returns listed for the driver: this long before the first return of the day… */
export const PICKUP_LIST_HOURS_BEFORE = 3;
/** …and this long after a return time, for late flights. */
export const PICKUP_LIST_HOURS_AFTER = 6;

/** Whether this booking can be put on a trip. */
export function canPickUp(status: ReservationStatus): boolean {
  return PICKUP_STATUSES.includes(status);
}

/** "Camille Martin" -> "Camille": what the traveller sees of the driver. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/** "Navette blanche · Mercedes Vito · GH-456-JK" pieces, for the traveller. */
export function vehicleDescription(vehicle: { model: string | null; colour: string | null; plate: string | null }): string {
  return [vehicle.colour ? `Navette ${vehicle.colour}` : 'Navette', vehicle.model, vehicle.plate].filter(Boolean).join(' · ');
}
