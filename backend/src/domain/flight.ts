import { FlightStatus } from '@/database';

/**
 * Return flight tracking rules (see SPEC.md, block 3). Pure functions: the providers' answers are
 * mapped here so that they can be tested without the network.
 */

/** A provider's lookup is not repeated within this delay (the cron and the lazy reads share it). */
export const FLIGHT_CACHE_MINUTES = 5;
/** No lookup earlier than this before the scheduled landing (the booking's return time). */
export const FLIGHT_LOOKUP_HOURS_BEFORE = 24;
/** A flight is still refreshed this long after its expected landing, then given up. */
export const FLIGHT_LOOKUP_HOURS_AFTER = 6;
/** Statuses after which nothing changes any more. */
export const FINAL_FLIGHT_STATUSES: FlightStatus[] = ['landed', 'cancelled', 'diverted'];

/** What a provider knows about a flight. Times are instants (UTC). */
export interface FlightInfo {
  status: FlightStatus;
  scheduledArrivalAt: Date | null;
  estimatedArrivalAt: Date | null;
  actualArrivalAt: Date | null;
  arrivalAirport: string | null; // IATA
  terminal: string | null;
  gate: string | null;
}

export interface TrackedFlightFields {
  flightStatus: FlightStatus | null;
  flightScheduledAt: Date | null;
  flightEstimatedAt: Date | null;
  flightLandedAt: Date | null;
  flightCheckedAt: Date | null;
}

/** "TO 3627" -> "TO3627" (the providers' flight number form). */
export function flightNumberKey(flight: string): string {
  return flight.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Whether the provider should be asked now: the booking has a flight and the vehicle is on site,
 * the landing is less than 24 h away (and less than 6 h ago), the flight is not final, and the
 * last lookup is older than the cache.
 */
export function shouldLookupFlight(
  booking: { returnFlight: string | null; status: string; returnAt: Date } & TrackedFlightFields,
  now = new Date(),
): boolean {
  if (!booking.returnFlight) return false;
  if (!['arrived', 'shuttled_out', 'return_requested'].includes(booking.status)) return false;
  if (booking.flightStatus && FINAL_FLIGHT_STATUSES.includes(booking.flightStatus)) return false;
  const landing = booking.flightEstimatedAt ?? booking.flightScheduledAt ?? booking.returnAt;
  if (landing.getTime() - now.getTime() > FLIGHT_LOOKUP_HOURS_BEFORE * 3600000) return false;
  if (now.getTime() - landing.getTime() > FLIGHT_LOOKUP_HOURS_AFTER * 3600000) return false;
  if (booking.flightCheckedAt && now.getTime() - booking.flightCheckedAt.getTime() < FLIGHT_CACHE_MINUTES * 60000) return false;
  return true;
}

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value) return null;
  // AeroDataBox local times come as "2026-10-03 10:02+02:00": make them ISO.
  const d = new Date(value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};
const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

// ---------------------------------------------------------------- AeroDataBox

/** AeroDataBox "Flight status by flight number and date" statuses. */
export function aeroDataBoxStatus(status: unknown): FlightStatus {
  switch (String(status ?? '').toLowerCase()) {
    case 'expected':
    case 'checkin':
    case 'boarding':
    case 'gateclosed':
      return 'scheduled';
    case 'delayed':
      return 'delayed';
    case 'departed':
    case 'enroute':
    case 'approaching':
      return 'departed';
    case 'arrived':
      return 'landed';
    case 'canceled':
    case 'cancelled':
    case 'canceleduncertain':
      return 'cancelled';
    case 'diverted':
      return 'diverted';
    default:
      return 'unknown';
  }
}

/** The utc time of an AeroDataBox time object ({ utc, local }) or a bare string. */
function adbTime(value: unknown): Date | null {
  if (value && typeof value === 'object') return parseDate((value as { utc?: unknown }).utc) ?? parseDate((value as { local?: unknown }).local);
  return parseDate(value);
}

/**
 * Maps the answer of GET /flights/number/{number}/{date} (an array of legs). The leg landing at
 * `arrivalIata` is preferred (a flight number may cover several legs), else the last one.
 */
export function mapAeroDataBox(body: unknown, arrivalIata: string | null): FlightInfo | null {
  const legs = Array.isArray(body) ? body : body && typeof body === 'object' && Array.isArray((body as any).flights) ? (body as any).flights : [];
  if (!legs.length) return null;
  const leg =
    (arrivalIata && legs.find((l: any) => String(l?.arrival?.airport?.iata ?? '').toUpperCase() === arrivalIata.toUpperCase())) ??
    legs[legs.length - 1];
  const arrival = leg?.arrival ?? {};
  const actual = adbTime(arrival.runwayTime) ?? adbTime(arrival.actualTime);
  const status = aeroDataBoxStatus(leg?.status);
  return {
    status: status === 'unknown' && actual ? 'landed' : status,
    scheduledArrivalAt: adbTime(arrival.scheduledTime),
    estimatedArrivalAt: adbTime(arrival.revisedTime) ?? adbTime(arrival.predictedTime),
    actualArrivalAt: actual,
    arrivalAirport: text(arrival.airport?.iata)?.toUpperCase() ?? null,
    terminal: text(arrival.terminal),
    gate: text(arrival.gate),
  };
}

// ---------------------------------------------------------------- AirLabs

export function airLabsStatus(status: unknown): FlightStatus {
  switch (String(status ?? '').toLowerCase()) {
    case 'scheduled':
      return 'scheduled';
    case 'en-route':
    case 'active':
      return 'departed';
    case 'landed':
      return 'landed';
    case 'cancelled':
      return 'cancelled';
    case 'diverted':
      return 'diverted';
    default:
      return 'unknown';
  }
}

/** Maps the answer of GET /v9/flight?flight_iata=… ({ response: {...} }) or /v9/schedules (one row). */
export function mapAirLabs(body: unknown): FlightInfo | null {
  const raw = body && typeof body === 'object' ? ((body as any).response ?? body) : null;
  const flight = Array.isArray(raw) ? raw[0] : raw;
  if (!flight || typeof flight !== 'object' || !Object.keys(flight).length) return null;
  const utc = (key: string) => parseDate(flight[key] ? `${String(flight[key]).replace(' ', 'T')}Z` : null);
  const delayed = typeof flight.delayed === 'number' && flight.delayed > 0;
  const status = airLabsStatus(flight.status);
  return {
    status: status === 'scheduled' && delayed ? 'delayed' : status,
    scheduledArrivalAt: utc('arr_time_utc'),
    estimatedArrivalAt: utc('arr_estimated_utc'),
    actualArrivalAt: utc('arr_actual_utc'),
    arrivalAirport: text(flight.arr_iata)?.toUpperCase() ?? null,
    terminal: text(flight.arr_terminal),
    gate: text(flight.arr_gate),
  };
}

/** The fields to store from a provider's answer (null answer: only the check time moves). */
export function flightUpdate(info: FlightInfo | null, now: Date) {
  if (!info) return { flightStatus: 'unknown' as FlightStatus, flightCheckedAt: now };
  const landed = info.status === 'landed';
  return {
    flightStatus: info.status,
    flightScheduledAt: info.scheduledArrivalAt,
    flightEstimatedAt: info.estimatedArrivalAt,
    ...(landed ? { flightLandedAt: info.actualArrivalAt ?? info.estimatedArrivalAt ?? now } : {}),
    flightTerminal: info.terminal,
    flightGate: info.gate,
    flightCheckedAt: now,
  };
}
