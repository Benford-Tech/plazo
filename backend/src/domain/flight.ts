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
/** For an outbound flight (take-off), the departure itself is the end of the story. */
export const FINAL_DEPARTURE_STATUSES: FlightStatus[] = ['departed', 'landed', 'cancelled', 'diverted'];
/** An outbound flight is still refreshed this long after its expected take-off, then given up. */
export const DEPARTURE_LOOKUP_HOURS_AFTER = 2;

/** Which end of the flight a lookup is about: the landing (return) or the take-off (outbound). */
export type FlightRole = 'arrival' | 'departure';

/** What a provider knows about a flight. Times are instants (UTC). */
export interface FlightInfo {
  status: FlightStatus;
  scheduledArrivalAt: Date | null;
  estimatedArrivalAt: Date | null;
  actualArrivalAt: Date | null;
  arrivalAirport: string | null; // IATA
  terminal: string | null;
  gate: string | null;
  // The departure end (outbound flights, V-A 05/10/2026).
  scheduledDepartureAt: Date | null;
  estimatedDepartureAt: Date | null;
  actualDepartureAt: Date | null;
  departureAirport: string | null; // IATA
  departureTerminal: string | null;
}

export interface TrackedDepartureFields {
  departureStatus: FlightStatus | null;
  departureScheduledAt: Date | null;
  departureEstimatedAt: Date | null;
  departureCheckedAt: Date | null;
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

/**
 * Whether the provider should be asked now about the outbound flight: the traveller has not left
 * for the terminal yet, the take-off is less than 24 h away (and less than 2 h ago), the flight is
 * not final, and the last lookup is older than the cache.
 */
export function shouldLookupDeparture(
  booking: { departureFlight: string | null; status: string; arrivalAt: Date } & TrackedDepartureFields,
  now = new Date(),
): boolean {
  if (!booking.departureFlight) return false;
  if (!['upcoming', 'arrived'].includes(booking.status)) return false;
  if (booking.departureStatus && FINAL_DEPARTURE_STATUSES.includes(booking.departureStatus)) return false;
  const takeOff = booking.departureEstimatedAt ?? booking.departureScheduledAt ?? booking.arrivalAt;
  if (takeOff.getTime() - now.getTime() > FLIGHT_LOOKUP_HOURS_BEFORE * 3600000) return false;
  if (now.getTime() - takeOff.getTime() > DEPARTURE_LOOKUP_HOURS_AFTER * 3600000) return false;
  if (booking.departureCheckedAt && now.getTime() - booking.departureCheckedAt.getTime() < FLIGHT_CACHE_MINUTES * 60000) return false;
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
 * `airportIata` (role arrival) or taking off from it (role departure) is preferred, since a
 * flight number may cover several legs; else the last (arrival) or first (departure) one.
 */
export function mapAeroDataBox(body: unknown, airportIata: string | null, role: FlightRole = 'arrival'): FlightInfo | null {
  const legs = Array.isArray(body) ? body : body && typeof body === 'object' && Array.isArray((body as any).flights) ? (body as any).flights : [];
  if (!legs.length) return null;
  const end = role === 'arrival' ? 'arrival' : 'departure';
  const leg =
    (airportIata && legs.find((l: any) => String(l?.[end]?.airport?.iata ?? '').toUpperCase() === airportIata.toUpperCase())) ??
    (role === 'arrival' ? legs[legs.length - 1] : legs[0]);
  const arrival = leg?.arrival ?? {};
  const departure = leg?.departure ?? {};
  const actual = adbTime(arrival.runwayTime) ?? adbTime(arrival.actualTime);
  const takenOff = adbTime(departure.runwayTime) ?? adbTime(departure.actualTime);
  const status = aeroDataBoxStatus(leg?.status);
  return {
    status: status === 'unknown' && actual ? 'landed' : status === 'unknown' && takenOff ? 'departed' : status,
    scheduledArrivalAt: adbTime(arrival.scheduledTime),
    estimatedArrivalAt: adbTime(arrival.revisedTime) ?? adbTime(arrival.predictedTime),
    actualArrivalAt: actual,
    arrivalAirport: text(arrival.airport?.iata)?.toUpperCase() ?? null,
    terminal: text(arrival.terminal),
    gate: text(arrival.gate),
    scheduledDepartureAt: adbTime(departure.scheduledTime),
    estimatedDepartureAt: adbTime(departure.revisedTime) ?? adbTime(departure.predictedTime),
    actualDepartureAt: takenOff,
    departureAirport: text(departure.airport?.iata)?.toUpperCase() ?? null,
    departureTerminal: text(departure.terminal),
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
    scheduledDepartureAt: utc('dep_time_utc'),
    estimatedDepartureAt: utc('dep_estimated_utc'),
    actualDepartureAt: utc('dep_actual_utc'),
    departureAirport: text(flight.dep_iata)?.toUpperCase() ?? null,
    departureTerminal: text(flight.dep_terminal),
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

/** The outbound-flight fields to store from a provider's answer (null answer: only the check time moves). */
export function departureUpdate(info: FlightInfo | null, now: Date) {
  if (!info) return { departureStatus: 'unknown' as FlightStatus, departureCheckedAt: now };
  // A flight the provider reports as landed has taken off for sure.
  const status: FlightStatus = info.status === 'landed' ? 'departed' : info.status;
  return {
    departureStatus: status,
    departureScheduledAt: info.scheduledDepartureAt,
    departureEstimatedAt: info.actualDepartureAt ?? info.estimatedDepartureAt,
    departureTerminal: info.departureTerminal,
    departureCheckedAt: now,
  };
}

// ---------------------------------------------------------------- FlightAware AeroAPI v4

/** AeroAPI "status" texts ("Scheduled", "Delayed", "En Route", "Landed", "Arrived / Gate Arrival"…). */
export function aeroApiStatus(flight: {
  status?: unknown;
  cancelled?: unknown;
  diverted?: unknown;
  actual_on?: unknown;
  actual_off?: unknown;
}): FlightStatus {
  if (flight.cancelled === true) return 'cancelled';
  if (flight.diverted === true) return 'diverted';
  const status = String(flight.status ?? '').toLowerCase();
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('divert')) return 'diverted';
  if (flight.actual_on || status.includes('arrived') || status.includes('landed')) return 'landed';
  if (flight.actual_off || status.includes('en route') || status.includes('taxiing') || status.includes('departed')) return 'departed';
  if (status.includes('delay')) return 'delayed';
  if (status.includes('scheduled') || status.includes('on time') || status.includes('boarding')) return 'scheduled';
  return status ? 'unknown' : 'unknown';
}

/**
 * Maps the answer of GET /flights/{ident}?ident_type=designator ({ flights: [...] }): the leg landing
 * at (role arrival) or taking off from (role departure) `airportIata` is preferred, else the first.
 * Times are ISO 8601 (UTC); "on" is the landing, "off" the take-off.
 */
export function mapAeroApi(body: unknown, airportIata: string | null, role: FlightRole = 'arrival'): FlightInfo | null {
  const flights = body && typeof body === 'object' && Array.isArray((body as any).flights) ? ((body as any).flights as any[]) : [];
  if (!flights.length) return null;
  const end = role === 'arrival' ? 'destination' : 'origin';
  const leg = (airportIata && flights.find(f => String(f?.[end]?.code_iata ?? '').toUpperCase() === airportIata.toUpperCase())) ?? flights[0];
  const status = aeroApiStatus(leg);
  return {
    status,
    scheduledArrivalAt: parseDate(leg.scheduled_on) ?? parseDate(leg.scheduled_in),
    estimatedArrivalAt: parseDate(leg.estimated_on) ?? parseDate(leg.estimated_in),
    actualArrivalAt: parseDate(leg.actual_on) ?? parseDate(leg.actual_in),
    arrivalAirport: text(leg.destination?.code_iata)?.toUpperCase() ?? null,
    terminal: text(leg.terminal_destination),
    gate: text(leg.gate_destination),
    scheduledDepartureAt: parseDate(leg.scheduled_off) ?? parseDate(leg.scheduled_out),
    estimatedDepartureAt: parseDate(leg.estimated_off) ?? parseDate(leg.estimated_out),
    actualDepartureAt: parseDate(leg.actual_off) ?? parseDate(leg.actual_out),
    departureAirport: text(leg.origin?.code_iata)?.toUpperCase() ?? null,
    departureTerminal: text(leg.terminal_origin),
  };
}
