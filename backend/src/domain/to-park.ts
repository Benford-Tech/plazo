import { ReservationStatus } from '@/database';
import { ON_SITE_STATUSES } from '@/domain/reservation';

/** What tells whether a car is still to put away and whether its traveller has gone. */
export interface ToParkRow {
  status: ReservationStatus;
  spotId: string | null;
  fileId: string | null;
  keyHook?: string | null;
  /** The drop-off they were checked in on as they boarded (« Embarquer en un geste »), with the check-in time. */
  boardingTripId: string | null;
  arrivedAt: Date | null;
}

/** A car is placed once its spot, its file or its key hook (the hook is the car's place, 01/11/2026) is noted. */
export function isPlaced(r: { spotId: string | null; fileId: string | null; keyHook?: string | null }): boolean {
  return !!r.spotId || !!r.fileId || !!r.keyHook?.trim();
}

/**
 * 12/11/2026 (« Plus de « Sans place » une fois le client parti en navette »): the time the traveller left in the
 * shuttle while their car has no place yet, else null. Left = checked in as they boarded, on a running drop-off, or any
 * on-site status past « Sur place ». The car is then still to put away (« Arrivées à placer »), but no longer an alert:
 * « À garer · client en navette 11:22 ». `dropoffStartedAt`: the start of the running (or latest) drop-off carrying them.
 */
export function toParkSince(r: ToParkRow, dropoffStartedAt: Date | null): Date | null {
  if (isPlaced(r) || !ON_SITE_STATUSES.includes(r.status)) return null;
  if (r.boardingTripId && r.arrivedAt) return r.arrivedAt;
  if (r.status !== 'arrived') return dropoffStartedAt ?? r.arrivedAt;
  return dropoffStartedAt;
}

/**
 * The drop-off start that counts for `toParkSince`, from the booking's drop-off trips: the running one, else (once the
 * booking is past « Sur place ») the latest one.
 */
export function dropoffStartOf(status: ReservationStatus, trips: { startedAt: Date; status: string }[]): Date | null {
  const running = trips.find(t => t.status === 'running');
  if (running) return running.startedAt;
  if (status === 'arrived') return null;
  return trips.reduce<Date | null>((latest, t) => (!latest || t.startedAt > latest ? t.startedAt : latest), null);
}

/** What a booking query includes to tell its drop-off trips (`dropoffStartOf`). */
export const DROPOFF_TRIPS_INCLUDE = {
  where: { trip: { direction: 'dropoff' as const } },
  select: { trip: { select: { startedAt: true, status: true } } },
};
