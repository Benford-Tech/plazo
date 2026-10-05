import { ShuttleDirection } from './shuttle';

/**
 * Shuttle waves (V-A "Ligne du jour", 05/10/2026): the travellers whose shuttles must leave the
 * parking within the same window, in the same direction and for the same stop, form a wave. Pure
 * functions; the service feeds them the day's bookings and the vehicles' seats.
 */

/** Travellers whose shuttle times fall within this many minutes of a wave's first one join it. */
export const WAVE_WINDOW_MINUTES = 15;

export type WaveState = 'planned' | 'running' | 'done';

/** The flight end that matters for the direction: take-off (drop-off) or landing (pick-up). */
export interface WaveFlight {
  number: string;
  status: string | null;
  scheduledAt: string | null;
  estimatedAt: string | null;
  /** Actual take-off or landing. */
  actualAt: string | null;
  terminal: string | null;
}

export interface WaveMember {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: string;
  direction: ShuttleDirection;
  stopId: string | null;
  stopName: string | null;
  /** When the shuttle must leave the parking (ISO). */
  leaveAt: string;
  /** Pick-ups: when the traveller is expected at the meeting point (ISO). */
  meetAt: string | null;
  flight: WaveFlight | null;
  /** The time comes from the booking itself (no flight, or the flight is unknown). */
  noFlight: boolean;
  state: WaveState;
  tripId: string | null;
}

export interface ShuttleWave {
  id: string;
  direction: ShuttleDirection;
  stopId: string | null;
  stopName: string | null;
  leaveAt: string;
  meetAt: string | null;
  passengers: number;
  /** Seats of the largest vehicle in service; null when no vehicle has a known number of seats. */
  seats: number | null;
  /** How many shuttles the wave needs, from `seats`; null when unknown. */
  vehiclesNeeded: number | null;
  /** How many of the members have no flight behind their time. */
  noFlight: number;
  /** Flight numbers of the wave, in order, without repeats. */
  flights: string[];
  state: WaveState;
  members: WaveMember[];
}

export interface WaveTimes {
  shuttleTravelMinutes: number;
  terminalLeadMinutes: number;
  landingDelayMinutes: number;
}

const minutes = (n: number) => n * 60000;

/** The drop-off shuttle's time: before the take-off, else when the traveller arrives at the parking. */
export function dropoffTimes(
  booking: {
    arrivalAt: Date;
    arrivedAt: Date | null;
    departureScheduledAt: Date | null;
    departureEstimatedAt: Date | null;
    departureStatus: string | null;
  },
  times: WaveTimes,
): { leaveAt: Date; noFlight: boolean } {
  const takeOff = booking.departureStatus === 'cancelled' ? null : (booking.departureEstimatedAt ?? booking.departureScheduledAt);
  if (!takeOff) return { leaveAt: booking.arrivedAt ?? booking.arrivalAt, noFlight: true };
  return { leaveAt: new Date(takeOff.getTime() - minutes(times.terminalLeadMinutes + times.shuttleTravelMinutes)), noFlight: false };
}

/** The pick-up shuttle's times: after the landing, else at the return time the traveller gave. */
export function pickupTimes(
  booking: {
    returnAt: Date;
    flightLandedAt: Date | null;
    flightEstimatedAt: Date | null;
    flightScheduledAt: Date | null;
    flightStatus: string | null;
  },
  times: WaveTimes,
): { leaveAt: Date; meetAt: Date; noFlight: boolean } {
  const landing =
    booking.flightStatus === 'cancelled' || booking.flightStatus === 'diverted'
      ? null
      : (booking.flightLandedAt ?? booking.flightEstimatedAt ?? booking.flightScheduledAt);
  const meetAt = landing ? new Date(landing.getTime() + minutes(times.landingDelayMinutes)) : booking.returnAt;
  return { leaveAt: new Date(meetAt.getTime() - minutes(times.shuttleTravelMinutes)), meetAt, noFlight: !landing };
}

function stateOf(members: WaveMember[]): WaveState {
  if (members.some(m => m.state === 'running')) return 'running';
  if (members.every(m => m.state === 'done')) return 'done';
  return 'planned';
}

/** Groups the members into waves (same direction and stop, within the window), soonest first. */
export function buildWaves(members: WaveMember[], seats: number | null, windowMinutes = WAVE_WINDOW_MINUTES): ShuttleWave[] {
  const sorted = [...members].sort((a, b) => a.leaveAt.localeCompare(b.leaveAt));
  const waves: ShuttleWave[] = [];
  const open = new Map<string, ShuttleWave>();
  for (const m of sorted) {
    const key = `${m.direction}:${m.stopId ?? 'airport'}`;
    let wave = open.get(key);
    if (wave && new Date(m.leaveAt).getTime() - new Date(wave.leaveAt).getTime() > minutes(windowMinutes)) wave = undefined;
    if (!wave) {
      wave = {
        id: `${key}:${m.leaveAt}`,
        direction: m.direction,
        stopId: m.stopId,
        stopName: m.stopName,
        leaveAt: m.leaveAt,
        meetAt: m.meetAt,
        passengers: 0,
        seats,
        vehiclesNeeded: null,
        noFlight: 0,
        flights: [],
        state: 'planned',
        members: [],
      };
      open.set(key, wave);
      waves.push(wave);
    }
    wave.members.push(m);
    wave.passengers += m.passengers;
    if (m.noFlight) wave.noFlight += 1;
    if (m.flight && !wave.flights.includes(m.flight.number)) wave.flights.push(m.flight.number);
  }
  for (const wave of waves) {
    wave.state = stateOf(wave.members);
    wave.vehiclesNeeded = seats ? Math.max(1, Math.ceil(wave.passengers / seats)) : null;
  }
  return waves.sort((a, b) => a.leaveAt.localeCompare(b.leaveAt));
}
