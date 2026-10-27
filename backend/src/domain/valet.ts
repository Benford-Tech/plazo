import { Handover, ReservationStatus } from '@/database';
import { pickupTimes, WaveTimes } from './shuttle-waves';

/**
 * « Voiturier au terminal » (27/10/2026, direction B of https://claude.ai/artifact/5Xu8o9kZgNxKTjfpG3HxqP): a valet
 * booking takes no shuttle. Its car is taken at the terminal on arrival and brought back there on departure: two runs,
 * each taken by one valet (« Je prends ») and done with one gesture (« Voiture récupérée » → Sur place, « Voiture rendue »
 * → Rendu).
 */
export type ValetRunKind = 'arrival' | 'departure';
export type ValetRunState = 'todo' | 'taken' | 'done';

export const VALET_RUN_KINDS: readonly ValetRunKind[] = ['arrival', 'departure'];

/** The arrival run is open while the car is still expected; done once the valet has it. */
export const ARRIVAL_OPEN_STATUSES: readonly ReservationStatus[] = ['upcoming'];
/** The departure run is open while the car is on the parking (a valet booking never goes out by shuttle). */
export const DEPARTURE_OPEN_STATUSES: readonly ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested', 'back_at_parking'];

/** The status a run's « done » sets. */
export const RUN_DONE_STATUS: Record<ValetRunKind, ReservationStatus> = { arrival: 'arrived', departure: 'returned' };

/** The runs of the day reach back this far (a late traveller stays on the list) and this far ahead. */
export const RUN_LIST_HOURS_BEFORE = 6;
export const RUN_LIST_HOURS_AHEAD = 18;
/** « Course à prendre »: the valets hear of a run nobody took this long before they should leave. */
export const RUN_NOTICE_MINUTES = 30;

/** The meeting point said when the parking wrote none: Terminal 1 at Lyon (Terminal 2 closed since 01/04/2026). */
export function valetMeetingPointOf(parking: { valetMeetingPoint: string | null }, airportCode: string | null): string {
  const own = parking.valetMeetingPoint?.trim();
  if (own) return own;
  return airportCode === 'LYS' ? 'Terminal 1 · dépose-minute' : 'Aéroport · dépose-minute';
}

/** Statuses a valet booking may be moved to by hand: never « Parti en navette ». */
export function valetStatuses(statuses: ReservationStatus[], handover: Handover): ReservationStatus[] {
  return handover === 'valet' ? statuses.filter(s => s !== 'shuttled_out') : statuses;
}

/** Where a run stands, from the booking's status and who took it. */
export function runState(kind: ValetRunKind, booking: { status: ReservationStatus; takenAt: Date | null }): ValetRunState | null {
  const open = kind === 'arrival' ? ARRIVAL_OPEN_STATUSES : DEPARTURE_OPEN_STATUSES;
  if (open.includes(booking.status)) return booking.takenAt ? 'taken' : 'todo';
  if (kind === 'arrival' && [...DEPARTURE_OPEN_STATUSES, 'returned'].includes(booking.status)) return 'done';
  if (kind === 'departure' && booking.status === 'returned') return 'done';
  return null;
}

/** Why a run cannot be taken or done now (null: it can). */
export function runRefusal(kind: ValetRunKind, booking: { handover: Handover; status: ReservationStatus }): 'not_valet' | 'run_closed' | null {
  if (booking.handover !== 'valet') return 'not_valet';
  const open = kind === 'arrival' ? ARRIVAL_OPEN_STATUSES : DEPARTURE_OPEN_STATUSES;
  return open.includes(booking.status) ? null : 'run_closed';
}

/**
 * When the valet meets the traveller and should leave the parking for it. Arrival: the time the traveller gave, the
 * drive to the terminal before it. Departure: the landing and the parking's delay to walk out (like the return shuttle),
 * else the return time given.
 */
export function runTimes(
  kind: ValetRunKind,
  booking: {
    arrivalAt: Date;
    returnAt: Date;
    flightLandedAt: Date | null;
    flightEstimatedAt: Date | null;
    flightScheduledAt: Date | null;
    flightStatus: string | null;
  },
  times: WaveTimes,
): { meetAt: Date; leaveAt: Date } {
  if (kind === 'arrival') {
    return { meetAt: booking.arrivalAt, leaveAt: new Date(booking.arrivalAt.getTime() - times.shuttleTravelMinutes * 60000) };
  }
  const { meetAt, leaveAt } = pickupTimes(booking, times);
  return { meetAt, leaveAt };
}

/** « Course à prendre » is due: nobody took it, it was not announced yet, and the valet should leave within the notice. */
export function runNoticeDue(leaveAt: Date, now: Date, minutes = RUN_NOTICE_MINUTES): boolean {
  const ahead = leaveAt.getTime() - now.getTime();
  return ahead <= minutes * 60000 && ahead > -60 * 60000;
}
