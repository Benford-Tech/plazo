import { CarLocatedBy, ReservationStatus } from '@/database';
import { HOLDING_STATUSES } from './reservation';

/**
 * Where the car is parked (06/10/2026): recorded by whoever parks it, the traveller (self-parking,
 * from the app) or a staff member (valet, from Plazo Pro). The staff's position prevails: once a
 * valet recorded one, the traveller can no longer replace it.
 */

/** Statuses during which the position can be recorded: from the booking's start to the hand-back. */
export const CAR_LOCATABLE_STATUSES: ReservationStatus[] = HOLDING_STATUSES;
/** Beyond this, the position is flagged as rough in the apps (the phone may retry). */
export const CAR_ACCURACY_ROUGH_M = 30;
export const CAR_NOTE_MAX = 120;

export interface CarLocation {
  lat: number;
  lng: number;
  accuracyM: number | null;
  at: string;
  by: CarLocatedBy;
  note: string | null;
}

export interface CarLocationFields {
  carLat: number | null;
  carLng: number | null;
  carAccuracyM: number | null;
  carLocatedAt: Date | null;
  carLocatedBy: CarLocatedBy | null;
  carNote: string | null;
}

/** The recorded position, or null when none (or an incomplete one). */
export function carView(r: CarLocationFields): CarLocation | null {
  if (r.carLat === null || r.carLng === null || !r.carLocatedAt || !r.carLocatedBy) return null;
  return { lat: r.carLat, lng: r.carLng, accuracyM: r.carAccuracyM, at: r.carLocatedAt.toISOString(), by: r.carLocatedBy, note: r.carNote };
}

export function canLocateCar(status: ReservationStatus): boolean {
  return CAR_LOCATABLE_STATUSES.includes(status);
}

/** Whether `by` may replace the recorded position: the staff always, the traveller unless a valet recorded it. */
export function canReplaceCarLocation(by: CarLocatedBy, current: CarLocatedBy | null): boolean {
  return by === 'staff' || current !== 'staff';
}

export const CLEARED_CAR_LOCATION = { carLat: null, carLng: null, carAccuracyM: null, carLocatedAt: null, carLocatedBy: null, carNote: null };
