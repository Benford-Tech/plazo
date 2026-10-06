import { ArrivalKind, ReservationStatus } from '@/database';
import { AWAY_STATUSES } from './reservation';

/**
 * Rules of the "Prévenir de son arrivée" feature: a traveller tells the parking they are coming,
 * with their live position or a simple "J'arrive dans 10 / 20 / 30 min". See SPEC.md.
 */

export type LatLng = { lat: number; lng: number };

/** A sharing session (and an announce) lasts at most this long, then everything is erased. */
export const SIGNAL_MAX_MINUTES = 120;
/** Within this distance of the meeting point, the traveller has arrived: sharing stops. */
export const ARRIVED_WITHIN_METERS = 150;
/** At most one position per this many seconds per booking. */
export const POSITION_MIN_INTERVAL_SECONDS = 10;
/** Staff get a second push once the estimate drops to this many minutes. */
export const SOON_THRESHOLD_MINUTES = 10;
/** A "start" push is not repeated when the traveller stops and starts again within this delay. */
export const START_PUSH_COOLDOWN_MINUTES = 15;
/** The block shows (and the routes open) this long before the drop-off or return time. */
export const WINDOW_OPENS_MINUTES_BEFORE = 120;
/** ...and stays open this long after it (late travellers, delayed flights). */
export const OUTBOUND_WINDOW_CLOSES_MINUTES_AFTER = 120;
export const RETURN_WINDOW_CLOSES_MINUTES_AFTER = 360;
/** A position recorded longer ago than this by the phone is refused (stale queue). */
export const POSITION_MAX_AGE_SECONDS = 300;
export const ANNOUNCE_MINUTES = [10, 20, 30] as const;

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type ArrivalEstimate = { distanceM: number; etaMinutes: number };
/** Swappable: a routing API could replace the straight-line estimate without touching the rest. */
export type ArrivalEstimator = (from: LatLng, to: LatLng) => ArrivalEstimate;

/** Average speed of the straight-line estimate (roads around an airport, traffic included). */
export const AVERAGE_SPEED_KMH = 40;

/** Straight-line distance at an average speed, never under one minute. Free, no routing API. */
export const straightLineEstimate: ArrivalEstimator = (from, to) => {
  const distanceM = Math.round(haversineMeters(from, to));
  const etaMinutes = Math.max(1, Math.ceil((distanceM / 1000 / AVERAGE_SPEED_KMH) * 60));
  return { distanceM, etaMinutes };
};

/** Statuses in which each moment can be signalled. */
const OUTBOUND_STATUSES: ReservationStatus[] = ['upcoming'];
const RETURN_STATUSES: ReservationStatus[] = AWAY_STATUSES;

export type ArrivalWindow = { kind: ArrivalKind; opensAt: Date; closesAt: Date };

/** The two windows of a booking (whatever its status). */
export function arrivalWindows(booking: { arrivalAt: Date; returnAt: Date }): Record<ArrivalKind, ArrivalWindow> {
  const before = WINDOW_OPENS_MINUTES_BEFORE * 60000;
  return {
    outbound: {
      kind: 'outbound',
      opensAt: new Date(booking.arrivalAt.getTime() - before),
      closesAt: new Date(booking.arrivalAt.getTime() + OUTBOUND_WINDOW_CLOSES_MINUTES_AFTER * 60000),
    },
    return: {
      kind: 'return',
      opensAt: new Date(booking.returnAt.getTime() - before),
      closesAt: new Date(booking.returnAt.getTime() + RETURN_WINDOW_CLOSES_MINUTES_AFTER * 60000),
    },
  };
}

/** Whether the traveller can signal this moment now. */
export function canSignal(kind: ArrivalKind, booking: { status: ReservationStatus; arrivalAt: Date; returnAt: Date }, now = new Date()): boolean {
  const statuses = kind === 'outbound' ? OUTBOUND_STATUSES : RETURN_STATUSES;
  const window = arrivalWindows(booking)[kind];
  return statuses.includes(booking.status) && now >= window.opensAt && now <= window.closesAt;
}

/**
 * The moment the app should offer now, or the next one to come (with when it opens), or null when
 * the booking has nothing left to signal.
 */
export function currentMoment(
  booking: { status: ReservationStatus; arrivalAt: Date; returnAt: Date },
  now = new Date(),
): { kind: ArrivalKind; open: boolean; opensAt: Date; closesAt: Date } | null {
  const windows = arrivalWindows(booking);
  for (const kind of ['outbound', 'return'] as const) {
    if (canSignal(kind, booking, now)) return { ...windows[kind], open: true };
  }
  if (booking.status === 'upcoming' && now < windows.outbound.opensAt) return { ...windows.outbound, open: false };
  if (RETURN_STATUSES.includes(booking.status) && now < windows.return.opensAt) return { ...windows.return, open: false };
  return null;
}

/** "Camille Martin" -> "C. Martin": enough for staff to recognise them in a push. */
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0][0].toUpperCase()}. ${parts.slice(1).join(' ')}`;
}

/** Whether the estimate just crossed the "soon" threshold (and the start push did not already say so). */
export function crossesSoonThreshold(previousEta: number | null, nextEta: number | null): boolean {
  if (nextEta === null || nextEta > SOON_THRESHOLD_MINUTES) return false;
  return previousEta === null || previousEta > SOON_THRESHOLD_MINUTES;
}
