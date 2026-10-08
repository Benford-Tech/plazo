import { Container, Service } from 'typedi';
import { AWAY_STATUSES } from '@/domain/reservation';
import { flightTrackingSettings, FlightProviderName, PRODUCT_NAME } from '@/config';
import prisma, { FlightLandedSource, Prisma, Reservation } from '@/database';
import { manageToken } from '@/domain/booking';
import { WITH_LISTING, BookingRecord } from '@/domain/booking-view';
import {
  departureUpdate,
  FINAL_DEPARTURE_STATUSES,
  FINAL_FLIGHT_STATUSES,
  FlightInfo,
  FlightRole,
  flightNumberKey,
  flightUpdate,
  mapAeroApi,
  mapAeroDataBox,
  mapAirLabs,
  shouldLookupDeparture,
  shouldLookupFlight,
} from '@/domain/flight';
import { landedPush, landedSms } from '@/domain/return-messages';
import { localDate, localDateTime } from '@/domain/time';
import { SECRET_KEY } from '@/config';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';

/**
 * A flight data provider. `date` is the local date of the landing (role arrival, the default) or
 * of the take-off (role departure, outbound flights); `airportIata` the parking's airport.
 */
export interface FlightTrackingProvider {
  readonly name: FlightProviderName | 'none';
  lookup(flightKey: string, date: string, airportIata: string | null, role?: FlightRole): Promise<FlightInfo | null>;
}

export interface FlightCheck {
  provider: string;
  host: string | null;
  flight: string;
  date: string;
  role: FlightRole;
  outcome: 'not_configured' | 'found' | 'not_found' | 'error';
  info: FlightInfo | null;
  error: string | null;
}

const LOOKUP_TIMEOUT_MS = 6000;
/** At most this many bookings asked to the provider per refresh (the free plans are small). */
const MAX_LOOKUPS_PER_RUN = 50;

const PICKUP_STATUSES = AWAY_STATUSES;

/** AeroDataBox "Flight status by flight number and date" (RapidAPI, or API.Market with another base URL). */
export class AeroDataBoxProvider implements FlightTrackingProvider {
  public readonly name = 'aerodatabox' as const;
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeoutMs = LOOKUP_TIMEOUT_MS,
  ) {}

  public async lookup(flightKey: string, date: string, airportIata: string | null, role: FlightRole = 'arrival'): Promise<FlightInfo | null> {
    const dateRole = role === 'arrival' ? 'Arrival' : 'Departure';
    const url = `${this.baseUrl}/flights/number/${encodeURIComponent(flightKey)}/${date}?withAircraftImage=false&withLocation=false&dateLocalRole=${dateRole}`;
    const rapid = /rapidapi\.com/.test(this.baseUrl);
    const headers: Record<string, string> = rapid
      ? { 'x-rapidapi-key': this.apiKey, 'x-rapidapi-host': new URL(this.baseUrl).host }
      : { 'x-magicapi-key': this.apiKey, 'x-api-key': this.apiKey };
    const res = await fetch(url, { headers: { ...headers, accept: 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs) });
    // 204 / 404: the provider does not know this flight on that day.
    if (res.status === 204 || res.status === 404) return null;
    if (!res.ok) throw new Error(`AeroDataBox answered ${res.status}`);
    return mapAeroDataBox(await res.json(), airportIata, role);
  }
}

/** AirLabs "flight" endpoint (the current or next occurrence of a flight number). */
export class AirLabsProvider implements FlightTrackingProvider {
  public readonly name = 'airlabs' as const;
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeoutMs = LOOKUP_TIMEOUT_MS,
  ) {}

  public async lookup(flightKey: string, date: string, airportIata: string | null, role: FlightRole = 'arrival'): Promise<FlightInfo | null> {
    const url = `${this.baseUrl}/flight?flight_iata=${encodeURIComponent(flightKey)}&api_key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new Error(`AirLabs answered ${res.status}`);
    const info = mapAirLabs(await res.json());
    if (!info) return null;
    // The endpoint has no date: an occurrence on another day is not this booking's flight.
    const when =
      role === 'arrival'
        ? (info.actualArrivalAt ?? info.estimatedArrivalAt ?? info.scheduledArrivalAt)
        : (info.actualDepartureAt ?? info.estimatedDepartureAt ?? info.scheduledDepartureAt);
    if (when && Math.abs(when.getTime() - new Date(`${date}T12:00:00Z`).getTime()) > 36 * 3600000) return null;
    const airport = role === 'arrival' ? info.arrivalAirport : info.departureAirport;
    if (airportIata && airport && airport !== airportIata.toUpperCase()) return null;
    return info;
  }
}

/**
 * FlightAware AeroAPI v4 "GET /flights/{ident}" (Personal plan: 5 $ of queries offered per month,
 * 0,005 $ per result set of 15 flights). The IATA designator (TO3627) is accepted as ident; the
 * day is bounded with start/end so that one result set covers the booking's date.
 */
export class FlightAwareProvider implements FlightTrackingProvider {
  public readonly name = 'flightaware' as const;
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeoutMs = LOOKUP_TIMEOUT_MS,
  ) {}

  public async lookup(flightKey: string, date: string, airportIata: string | null, role: FlightRole = 'arrival'): Promise<FlightInfo | null> {
    // The local day, widened by a day on each side (AeroAPI filters on the scheduled departure, UTC).
    const start = new Date(`${date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(`${date}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 2);
    const params = new URLSearchParams({
      ident_type: 'designator',
      start: start.toISOString().slice(0, 19) + 'Z',
      end: end.toISOString().slice(0, 19) + 'Z',
    });
    const url = `${this.baseUrl}/flights/${encodeURIComponent(flightKey)}?${params}`;
    const res = await fetch(url, { headers: { 'x-apikey': this.apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`FlightAware answered ${res.status}`);
    const body = await res.json();
    // Several days may come back: keep the legs of the booking's day (local date of the relevant end).
    const flights = body && typeof body === 'object' && Array.isArray((body as any).flights) ? ((body as any).flights as any[]) : [];
    const sameDay = flights.filter(f => {
      const at = role === 'arrival' ? (f.actual_on ?? f.estimated_on ?? f.scheduled_on) : (f.actual_off ?? f.estimated_off ?? f.scheduled_off);
      return typeof at === 'string' && Math.abs(new Date(at).getTime() - new Date(`${date}T12:00:00Z`).getTime()) <= 18 * 3600000;
    });
    return mapAeroApi({ flights: sameDay.length ? sameDay : flights }, airportIata, role);
  }
}

export class NoopFlightProvider implements FlightTrackingProvider {
  public readonly name = 'none' as const;
  public async lookup(): Promise<FlightInfo | null> {
    return null;
  }
}

type TrackedBooking = Reservation & { parking: { timezone: string; name: string; listing: { airport: { code: string } } | null } };

const WITH_AIRPORT = { parking: { select: { timezone: true, name: true, listing: { select: { airport: { select: { code: true } } } } } } } as const;

/**
 * Return flight tracking: asks the active provider (AeroDataBox or AirLabs, see config) for the
 * return flights of the bookings whose vehicle is on site, within 24 h of the landing, at most
 * once per 5 minutes per booking (the cron and the lazy reads share the cache), and stops once
 * the flight is final. On landing: the staff get a push (once) and the traveller an SMS (once).
 * Nothing personal is logged (references only).
 */
@Service()
export class FlightTrackingService {
  public audit = Container.get(AuditService);
  public notifications = Container.get(NotificationService);
  public push = Container.get(PushService);
  public sms = Container.get(SmsService);
  /** Tests may set one; otherwise built from the environment on every call. */
  public providerOverride: FlightTrackingProvider | null = null;

  public provider(): FlightTrackingProvider {
    if (this.providerOverride) return this.providerOverride;
    const settings = flightTrackingSettings();
    if (!settings) return new NoopFlightProvider();
    switch (settings.provider) {
      case 'flightaware':
        return new FlightAwareProvider(settings.apiKey, settings.baseUrl);
      case 'airlabs':
        return new AirLabsProvider(settings.apiKey, settings.baseUrl);
      default:
        return new AeroDataBoxProvider(settings.apiKey, settings.baseUrl);
    }
  }

  public enabled(): boolean {
    return this.provider().name !== 'none';
  }

  /**
   * Diagnostic for the manager ("Tester le suivi de vol"): asks the provider about one flight and
   * returns its answer or the error, so that a wrong key, plan or host shows up without the logs.
   */
  public async check(flight: string, date: string, airportIata: string | null, role: FlightRole): Promise<FlightCheck> {
    const settings = flightTrackingSettings();
    const provider = this.provider();
    const base = { provider: provider.name, host: settings ? new URL(settings.baseUrl).host : null, flight: flightNumberKey(flight), date, role };
    if (provider.name === 'none') return { ...base, outcome: 'not_configured', info: null, error: null };
    try {
      const info = await provider.lookup(flightNumberKey(flight), date, airportIata, role);
      return { ...base, outcome: info ? 'found' : 'not_found', info, error: null };
    } catch (error) {
      return { ...base, outcome: 'error', info: null, error: error instanceof Error ? error.message : 'unknown error' };
    }
  }

  /** Refreshes the given bookings' flights when due (the lazy path of the reads). */
  public async refreshBookings(reservationIds: string[]): Promise<number> {
    if (!reservationIds.length || !this.enabled()) return 0;
    const rows = await prisma.reservation.findMany({ where: { id: { in: reservationIds }, returnFlight: { not: null } }, include: WITH_AIRPORT });
    return (await this.refreshRows(rows)).checked;
  }

  /** Refreshes the given bookings' outbound flights when due (the shuttle forecast's lazy path). */
  public async refreshDepartures(reservationIds: string[]): Promise<number> {
    if (!reservationIds.length || !this.enabled()) return 0;
    const rows = await prisma.reservation.findMany({ where: { id: { in: reservationIds }, departureFlight: { not: null } }, include: WITH_AIRPORT });
    return this.refreshDepartureRows(rows);
  }

  /** The cron: every booking whose outbound flight is due for a lookup (take-off within 24 h). */
  public async refreshDueDepartures(): Promise<number> {
    if (!this.enabled()) return 0;
    const now = new Date();
    const rows = await prisma.reservation.findMany({
      where: {
        status: { in: ['upcoming', 'arrived'] },
        departureFlight: { not: null },
        arrivalAt: { gte: new Date(now.getTime() - 12 * 3600000), lte: new Date(now.getTime() + 30 * 3600000) },
        OR: [{ departureStatus: null }, { departureStatus: { notIn: [...FINAL_DEPARTURE_STATUSES] } }],
      },
      include: WITH_AIRPORT,
      orderBy: { arrivalAt: 'asc' },
      take: MAX_LOOKUPS_PER_RUN,
    });
    return this.refreshDepartureRows(rows);
  }

  /** The cron: every active booking whose return flight is due for a lookup. */
  public async refreshDue(): Promise<{ checked: number; landed: number; errors: number; skipped: boolean }> {
    if (!this.enabled()) return { checked: 0, landed: 0, errors: 0, skipped: true };
    const now = new Date();
    const rows = await prisma.reservation.findMany({
      where: {
        status: { in: [...PICKUP_STATUSES] },
        returnFlight: { not: null },
        returnAt: { gte: new Date(now.getTime() - 12 * 3600000), lte: new Date(now.getTime() + 30 * 3600000) },
        OR: [{ flightStatus: null }, { flightStatus: { notIn: [...FINAL_FLIGHT_STATUSES] } }],
      },
      include: WITH_AIRPORT,
      orderBy: { returnAt: 'asc' },
      take: MAX_LOOKUPS_PER_RUN,
    });
    const landedBefore = rows.filter(r => r.flightStatus === 'landed').length;
    const { checked, errors } = await this.refreshRows(rows);
    const landedAfter = await prisma.reservation.count({ where: { id: { in: rows.map(r => r.id) }, flightStatus: 'landed' } });
    return { checked, landed: landedAfter - landedBefore, errors, skipped: false };
  }

  /** The traveller says "J'ai atterri": the flight is landed from now on, whatever the provider says. */
  public async markLandedByTraveller(booking: BookingRecord): Promise<void> {
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({
      where: { id: booking.id, status: { in: [...PICKUP_STATUSES] }, OR: [{ flightStatus: null }, { flightStatus: { not: 'landed' } }] },
      data: { flightStatus: 'landed', flightLandedAt: now, flightLandedSource: 'traveller', flightCheckedAt: now },
    });
    if (!count) return;
    await this.audit.record(
      { id: null, operatorId: booking.operatorId },
      { action: 'return.landed', entityType: 'reservation', entityId: booking.id, details: { source: 'traveller', flight: booking.returnFlight } },
    );
    await this.notifyLanded(booking.id, 'traveller');
  }

  // ---------------------------------------------------------------- internals

  /** Looks up the due rows once each; `errors` counts the lookups the provider failed (down, quota, bad key). */
  private async refreshRows(rows: TrackedBooking[]): Promise<{ checked: number; errors: number }> {
    const now = new Date();
    const due = rows.filter(r => shouldLookupFlight(r, now));
    if (!due.length) return { checked: 0, errors: 0 };
    // Claim the lookups first (conditional on the cache): two concurrent reads ask the provider once.
    const claimed: TrackedBooking[] = [];
    for (const row of due) {
      const { count } = await prisma.reservation.updateMany({
        where: { id: row.id, OR: [{ flightCheckedAt: null }, { flightCheckedAt: row.flightCheckedAt }] },
        data: { flightCheckedAt: now },
      });
      if (count) claimed.push(row);
    }
    const provider = this.provider();
    const outcomes = await Promise.all(claimed.map(row => this.refreshOne(provider, row, now)));
    return { checked: claimed.length, errors: outcomes.filter(ok => !ok).length };
  }

  private async refreshDepartureRows(rows: TrackedBooking[]): Promise<number> {
    const now = new Date();
    const due = rows.filter(r => shouldLookupDeparture(r, now));
    if (!due.length) return 0;
    const claimed: TrackedBooking[] = [];
    for (const row of due) {
      const { count } = await prisma.reservation.updateMany({
        where: { id: row.id, OR: [{ departureCheckedAt: null }, { departureCheckedAt: row.departureCheckedAt }] },
        data: { departureCheckedAt: now },
      });
      if (count) claimed.push(row);
    }
    const provider = this.provider();
    await Promise.all(
      claimed.map(async row => {
        const date = localDate(row.departureEstimatedAt ?? row.departureScheduledAt ?? row.arrivalAt, row.parking.timezone);
        let info: FlightInfo | null;
        try {
          info = await provider.lookup(flightNumberKey(row.departureFlight!), date, row.parking.listing?.airport.code ?? null, 'departure');
        } catch (error) {
          logger.warn(
            `[Flights] ${provider.name} departure lookup failed for booking ${row.reference}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
          return;
        }
        await prisma.reservation.updateMany({ where: { id: row.id }, data: departureUpdate(info, now) });
      }),
    );
    return claimed.length;
  }

  /** One lookup and its consequences; false when the provider failed. */
  private async refreshOne(provider: FlightTrackingProvider, row: TrackedBooking, now: Date): Promise<boolean> {
    const date = localDate(row.flightEstimatedAt ?? row.flightScheduledAt ?? row.returnAt, row.parking.timezone);
    let info: FlightInfo | null;
    try {
      info = await provider.lookup(flightNumberKey(row.returnFlight!), date, row.parking.listing?.airport.code ?? null);
    } catch (error) {
      // The cache time already moved: the provider is not hammered when it is down.
      logger.warn(
        `[Flights] ${provider.name} lookup failed for booking ${row.reference}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
    const data: Prisma.ReservationUpdateManyMutationInput = flightUpdate(info, now);
    const landedNow = data.flightStatus === 'landed';
    if (landedNow) data.flightLandedSource = 'tracking';
    const { count } = await prisma.reservation.updateMany({
      where: {
        id: row.id,
        OR: landedNow
          ? [{ flightStatus: null }, { flightStatus: { not: 'landed' } }]
          : [{ flightLandedSource: null }, { flightLandedSource: { not: 'traveller' } }],
      },
      data,
    });
    if (!count) {
      // The traveller already said they landed: keep their word, but take the terminal and gate.
      if (!landedNow)
        await prisma.reservation.updateMany({ where: { id: row.id }, data: { flightTerminal: data.flightTerminal, flightGate: data.flightGate } });
      return true;
    }
    if (landedNow) {
      await this.audit.record(
        { id: null, operatorId: row.operatorId },
        { action: 'return.landed', entityType: 'reservation', entityId: row.id, details: { source: 'tracking', flight: row.returnFlight } },
      );
      await this.notifyLanded(row.id, 'tracking');
    }
    return true;
  }

  /** The push to the staff (once per booking) and, when the API saw the landing, the SMS to the traveller (once). */
  private async notifyLanded(reservationId: string, source: FlightLandedSource) {
    const now = new Date();
    const booking = await prisma.reservation.findUnique({ where: { id: reservationId }, include: WITH_LISTING });
    if (!booking) return;
    const landedAt = localDateTime(booking.flightLandedAt ?? now, booking.parking.timezone).slice(11, 16);
    const pushClaim = await prisma.reservation.updateMany({
      where: { id: reservationId, landingNotifiedAt: null },
      data: { landingNotifiedAt: now },
    });
    if (pushClaim.count) {
      await this.push.notifyStaff(
        booking.operatorId,
        'returns',
        landedPush({ flight: booking.returnFlight, customerName: booking.customerName, plate: booking.plate, source, landedAt }),
        { data: { type: 'flight', event: 'landed', reservationId }, collapseId: `flight-${reservationId}` },
      );
    }
    // The traveller who tapped "J'ai atterri" is in the app already: no SMS for them. B (06/10/2026): every
    // channel gets it (phone, comparator…), as long as the number is a mobile and the parking is on Plazo.
    if (source !== 'tracking' || !booking.parking.listing) return;
    const smsClaim = await prisma.reservation.updateMany({ where: { id: reservationId, landingSmsAt: null }, data: { landingSmsAt: now } });
    if (!smsClaim.count) return;
    const [point] = await prisma.$queryRaw<{ label: string | null; instructions: string | null }[]>`
      SELECT "returnMeetingLabel" AS label, "returnMeetingInstructions" AS instructions FROM parkings WHERE id = ${booking.parkingId}`;
    const url = SECRET_KEY ? this.notifications.manageUrl(booking.reference, manageToken(booking.id, SECRET_KEY, booking.manageTokenVersion)) : null;
    // Through the operator's own SMS channel (their phone, Brevo, or none).
    await this.sms.sendTravellerSms(booking.operatorId, {
      reservationId: booking.id,
      kind: 'flight_landed',
      to: booking.customerPhone,
      text: landedSms({
        productName: PRODUCT_NAME,
        parkingName: booking.parking.listing.title,
        meetingLabel: point?.label ?? booking.parking.listing.airport.name,
        instructions: point?.instructions ?? null,
        phone: booking.parking.listing.contactPhone,
        manageUrl: url,
      }),
    });
  }
}
