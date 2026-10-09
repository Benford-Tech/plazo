import { Container, Service } from 'typedi';
import { ON_SITE_STATUSES } from '@/domain/reservation';
import { flightTrackingSettings } from '@/config';
import prisma, { ReservationStatus } from '@/database';
import { ShuttleDirection } from '@/domain/shuttle';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { dayBounds, localDate, localDateTime } from '@/domain/time';
import { FileService } from './file.service';
import { OccupationService } from './occupation.service';
import { ArrivalService } from './arrival.service';
import { loadPlanCapacity, parkingCapacity } from './capacity.service';
import { FlightTrackingService } from './flight-tracking.service';
import { ParkingService } from './parking.service';
import { PushService } from './push.service';
import { ReservationService } from './reservation.service';
import { ShuttleForecastService } from './shuttle-forecast.service';
import { InboundEmailService } from './inbound-email.service';
import { ShuttleService } from './shuttle.service';
import { SmsService } from './sms.service';
import { OPERATOR_PAYMENT_FIELDS, PaymentService } from './payment.service';

/** The statuses of a vehicle on the parking. */
const ON_SITE: ReservationStatus[] = ON_SITE_STATUSES;
/** A flight is "delayed" from this many minutes past its schedule. */
const DELAY_MINUTES = 15;
/** A placed vehicle whose keys are not hung after this long is worth a nudge. */
const KEYS_MINUTES = 20;
/** An expected traveller still unplaced this long after their time is probably not coming. */
const NO_SHOW_MINUTES = 180;

export type AlertSeverity = 'urgent' | 'watch' | 'todo';
export type AlertKind =
  | 'no_spot'
  | 'no_free_spot'
  | 'arriving_unplaced'
  | 'flight_delayed'
  | 'flight_cancelled'
  | 'waiting_at_meeting_point'
  | 'keys_missing'
  | 'sms_pending'
  | 'overbooked'
  // Shuttle waves (V-A, 05/10/2026): an outbound flight cancelled or late, a wave beyond the seats.
  | 'departure_cancelled'
  | 'departure_delayed'
  | 'wave_overflow'
  // Decision A (06/10/2026): expected hours ago, no car placed; the staff decide (never automatic).
  | 'no_show_suspected'
  // M-A (06/10/2026): forwarded confirmation emails waiting for the staff.
  | 'inbound_to_check'
  // O-A (06/10/2026): a car returning today stands behind one that leaves later.
  | 'blocked_return';

export interface DashboardAlert {
  kind: AlertKind;
  severity: AlertSeverity;
  /** The booking concerned, when there is one. */
  reservationId: string | null;
  reference: string | null;
  customerName: string | null;
  plate: string | null;
  /** Free text for the row's detail (a spot code, a time, a count), already in French. */
  detail: string | null;
  /** When the situation started, for "depuis 06:40". */
  since: string | null;
  minutes: number | null;
}

export interface DashboardVehicle {
  id: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  returnAt: string;
  spotCode: string | null;
  stayClass: string | null;
  keyHook: string | null;
  returnFlight: string | null;
  flightStatus: string | null;
  flightScheduledAt: string | null;
  flightEstimatedAt: string | null;
  flightLandedAt: string | null;
  /** The running trip carrying this traveller, if any. */
  tripDirection: ShuttleDirection | null;
  stopName: string | null;
  /** Today's return (local day). */
  returnsToday: boolean;
}

export interface Dashboard {
  serverTime: string;
  date: string;
  /** `plannedSpots` is the room of the plan: the files' capacity when the parking is stored in files (S-C), else the active spots. */
  parking: { id: string; name: string; timezone: string; bookableCapacity: number; plannedSpots: number; storedInFiles: boolean };
  counts: {
    onSite: number;
    arrivalsToday: number;
    arrivedToday: number;
    returnsToday: number;
    shuttlesRunning: number;
    freeSpots: number | null;
    toTreat: number;
  };
  services: {
    flights: { configured: boolean; provider: string | null; lastCheckedAt: string | null };
    sms: { mode: string; pending: number; stale: boolean; lastSentAt: string | null };
    push: { configured: boolean; devices: number };
    /** `online`: travellers can pay on the site (platform keys + commission); the account only moves the payouts. */
    stripe: { online: boolean; connected: boolean; payoutsEnabled: boolean };
    lastImportAt: string | null;
  };
  alerts: DashboardAlert[];
  /** The next shuttle wave still to run today (V-A), for the "Navettes" tile. */
  nextWave: {
    leaveAt: string;
    direction: ShuttleDirection;
    stopName: string | null;
    passengers: number;
    vehiclesNeeded: number | null;
    flights: string[];
  } | null;
  /** S-C (07/10/2026): `movesToday` = cars to take out today so the returns of the day get out (0 is the goal). */
  breakdown: { onSiteQuiet: number; toPlaceToday: number; movesToday: number; returnsThisWeek: number; toTreat: number; freeSpots: number | null };
  vehicles: DashboardVehicle[];
}

/**
 * The pro space's home (fusion of the "Flotte" and "Opérations" boards, 05/10/2026): the day's
 * figures, the state of the services, what needs an action first, and the vehicles on the parking.
 * Reads only; the map of the running shuttles comes from GET /internal/shuttle/live.
 */
@Service()
export class DashboardService {
  public arrivals = Container.get(ArrivalService);
  public flights = Container.get(FlightTrackingService);
  public parkings = Container.get(ParkingService);
  public push = Container.get(PushService);
  public reservations = Container.get(ReservationService);
  public shuttle = Container.get(ShuttleService);
  public inbound = Container.get(InboundEmailService);
  public forecast = Container.get(ShuttleForecastService);
  public sms = Container.get(SmsService);
  public payments = Container.get(PaymentService);
  public occupation = Container.get(OccupationService);
  public files = Container.get(FileService);

  public async get(actor: AuthenticatedStaff): Promise<Dashboard> {
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    let planning = await this.reservations.planning(actor);
    const refreshed = await this.flights.refreshBookings(planning.returns.filter(r => r.returnFlight).map(r => r.id));
    if (refreshed) planning = await this.reservations.planning(actor);

    const [onSite, trips, signals, plan, operator, devices, lastImport, smsStatus, forecast] = await Promise.all([
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: ON_SITE } },
        include: { spot: { select: { code: true, stayClass: true } }, file: { select: { code: true } }, stop: { select: { name: true } } },
        orderBy: { returnAt: 'asc' },
      }),
      this.shuttle.running(actor),
      this.arrivals.live(actor).then(l => l.signals),
      loadPlanCapacity([parking.id]).then(m => m.get(parking.id)!),
      prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: OPERATOR_PAYMENT_FIELDS }),
      prisma.staffDevice.count({ where: { staff: { operatorId: actor.operatorId, isActive: true } } }),
      prisma.reservation.findFirst({
        where: { operatorId: actor.operatorId, channel: { in: ['import', 'aggregator'] } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.sms.status(actor),
      this.forecast.day(actor),
    ]);
    const todayIds = new Set(planning.returns.map(r => r.id));
    const tripOf = (id: string) => trips.find(t => t.reservationIds.includes(id)) ?? null;
    const placed = (r: { spotId: string | null; fileId: string | null }) => !!r.spotId || !!r.fileId;
    const occupied = onSite.filter(placed).length;
    // The plan's room, as everywhere (`effectiveCapacity`): the files' when the parking is stored in
    // files (S-C), else its active spots; nothing without a plan (the declared figure is no place).
    // The plan is read once, above, and the capacity derived from it here.
    const capacity = parkingCapacity(parking, plan);
    const spotsTotal = plan.activeSpots;
    const filesTotal = plan.activeFilesCapacity;
    const hasPlan = capacity.capacitySource !== 'declared';
    const plannedSpots = hasPlan ? capacity.effectiveCapacity : 0;
    const freeSpots = plannedSpots ? Math.max(0, plannedSpots - occupied) : null;

    const alerts: DashboardAlert[] = [];
    const minutesSince = (d: Date) => Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
    const row = (r: { id: string; reference: string; customerName: string; plate: string }) => ({
      reservationId: r.id,
      reference: r.reference,
      customerName: r.customerName,
      plate: r.plate,
    });

    // Arrived, no spot or file (only when the parking has a plan).
    if (hasPlan) {
      for (const r of onSite.filter(r => !placed(r) && r.status === 'arrived')) {
        const since = r.arrivedAt ?? r.arrivalAt;
        alerts.push({
          kind: freeSpots === 0 ? 'no_free_spot' : 'no_spot',
          severity: 'urgent',
          ...row(r),
          detail: null,
          since: since.toISOString(),
          minutes: minutesSince(since),
        });
      }
      // Placed, keys not hung.
      for (const r of onSite.filter(r => placed(r) && !r.keyHook && r.arrivedAt && minutesSince(r.arrivedAt) >= KEYS_MINUTES)) {
        alerts.push({
          kind: 'keys_missing',
          severity: 'todo',
          ...row(r),
          detail: r.spot?.code ?? r.file?.code ?? null,
          since: r.arrivedAt!.toISOString(),
          minutes: minutesSince(r.arrivedAt!),
        });
      }
    }
    // Today's return flights: cancelled or late.
    for (const r of planning.returns) {
      if (r.flightStatus === 'cancelled' || r.flightStatus === 'diverted') {
        alerts.push({ kind: 'flight_cancelled', severity: 'urgent', ...row(r), detail: r.returnFlight, since: null, minutes: null });
      } else if (r.flightScheduledAt && r.flightEstimatedAt && !r.flightLandedAt) {
        const late = Math.round((r.flightEstimatedAt.getTime() - r.flightScheduledAt.getTime()) / 60000);
        if (late >= DELAY_MINUTES)
          alerts.push({
            kind: 'flight_delayed',
            severity: 'watch',
            ...row(r),
            detail: r.returnFlight,
            since: r.flightEstimatedAt.toISOString(),
            minutes: late,
          });
      }
    }
    // Today's outbound flights: cancelled or late (the traveller has not left for the terminal yet).
    for (const w of forecast.waves.filter(w => w.direction === 'dropoff')) {
      for (const m of w.members.filter(m => m.state === 'planned' && m.flight)) {
        const f = m.flight!;
        const member = { reservationId: m.reservationId, reference: m.reference, customerName: m.customerName, plate: m.plate };
        if (f.status === 'cancelled' || f.status === 'diverted') {
          alerts.push({ kind: 'departure_cancelled', severity: 'urgent', ...member, detail: f.number, since: null, minutes: null });
        } else if (f.scheduledAt && f.estimatedAt && f.status !== 'departed') {
          const late = Math.round((new Date(f.estimatedAt).getTime() - new Date(f.scheduledAt).getTime()) / 60000);
          if (late >= DELAY_MINUTES)
            alerts.push({ kind: 'departure_delayed', severity: 'watch', ...member, detail: f.number, since: f.estimatedAt, minutes: late });
        }
      }
    }
    // A wave still to run that needs more than one shuttle.
    for (const w of forecast.waves.filter(w => w.state === 'planned' && (w.vehiclesNeeded ?? 1) > 1)) {
      alerts.push({
        kind: 'wave_overflow',
        severity: 'watch',
        reservationId: null,
        reference: null,
        customerName: null,
        plate: null,
        detail: w.direction,
        since: w.leaveAt,
        minutes: w.passengers,
      });
    }
    // At the meeting point, and no shuttle on its way.
    for (const s of signals.filter(s => s.kind === 'return' && s.state === 'at_meeting_point')) {
      const trip = tripOf(s.reservationId);
      if (!trip || trip.direction !== 'pickup') {
        const since = s.atMeetingPointAt ? new Date(s.atMeetingPointAt) : null;
        alerts.push({
          kind: 'waiting_at_meeting_point',
          severity: 'urgent',
          reservationId: s.reservationId,
          reference: s.reference,
          customerName: s.customerName,
          plate: s.plate,
          detail: null,
          since: since?.toISOString() ?? null,
          minutes: since ? minutesSince(since) : null,
        });
      }
    }
    // Arriving (live), no spot pre-assigned.
    if (spotsTotal) {
      for (const s of signals.filter(s => s.kind === 'outbound' && (s.state === 'sharing' || s.state === 'announced'))) {
        const booking = planning.arrivals.find(a => a.id === s.reservationId);
        if (booking && !booking.spotId) {
          alerts.push({
            kind: 'arriving_unplaced',
            severity: 'watch',
            reservationId: s.reservationId,
            reference: s.reference,
            customerName: s.customerName,
            plate: s.plate,
            detail: null,
            since: null,
            minutes: s.etaMinutes ?? s.announcedMinutes,
          });
        }
      }
    }
    // Expected for hours, nothing placed: probably a no-show (the staff decide).
    // Looked up over the last 24 h, not today's planning only: a traveller expected yesterday evening
    // and still missing after midnight is the same case.
    const lateArrivals = await prisma.reservation.findMany({
      where: {
        parkingId: parking.id,
        status: 'upcoming',
        spotId: null,
        arrivalAt: { gte: new Date(now.getTime() - 24 * 3600000), lte: new Date(now.getTime() - NO_SHOW_MINUTES * 60000) },
      },
      select: { id: true, reference: true, customerName: true, plate: true, arrivalAt: true },
      orderBy: { arrivalAt: 'asc' },
    });
    for (const r of lateArrivals) {
      alerts.push({
        kind: 'no_show_suspected',
        severity: 'watch',
        ...row(r),
        detail: null,
        since: r.arrivalAt.toISOString(),
        minutes: minutesSince(r.arrivalAt),
      });
    }
    // S-C (07/10/2026): on a parking stored in files, a return of the day behind a car leaving later.
    const bounds = dayBounds(localDate(now, parking.timezone), parking.timezone);
    let movesToday = 0;
    if (filesTotal) {
      for (const { car, fileCode, blockers } of await this.files.blockedReturns(parking.id, bounds.start, bounds.end)) {
        movesToday += blockers.length;
        const front = blockers[0];
        alerts.push({
          kind: 'blocked_return',
          severity: 'watch',
          reservationId: car.reservationId,
          reference: car.reference,
          customerName: car.customerName,
          plate: car.plate,
          detail: `${fileCode} · ${front.plate} retour ${localDateTime(front.returnAt, parking.timezone)}${blockers.length > 1 ? ` (+${blockers.length - 1})` : ''}`,
          since: null,
          minutes: null,
        });
      }
    }
    // O-A (06/10/2026): a car returning today behind one that leaves later: take the front one out first.
    if (spotsTotal && !filesTotal) {
      for (const { stay, blockers } of await this.occupation.blockedReturns(parking.id, bounds.start, bounds.end)) {
        const front = blockers[0];
        alerts.push({
          kind: 'blocked_return',
          severity: 'watch',
          reservationId: stay.reservationId,
          reference: stay.reference,
          customerName: stay.customerName,
          plate: stay.plate,
          detail: `${front.spotCode} · retour ${localDateTime(front.returnAt, parking.timezone)}${blockers.length > 1 ? ` (+${blockers.length - 1})` : ''}`,
          since: null,
          minutes: null,
        });
      }
    }
    const inboundToCheck = await this.inbound.toCheckCount(actor.operatorId);
    if (inboundToCheck > 0) {
      alerts.push({
        kind: 'inbound_to_check',
        severity: 'watch',
        reservationId: null,
        reference: null,
        customerName: null,
        plate: null,
        detail: String(inboundToCheck),
        since: null,
        minutes: null,
      });
    }
    if (planning.smsWarning) {
      alerts.push({
        kind: 'sms_pending',
        severity: 'watch',
        reservationId: null,
        reference: null,
        customerName: null,
        plate: null,
        detail: String(planning.smsWarning.pending),
        since: null,
        minutes: null,
      });
    }
    for (const night of planning.nights.filter(n => n.overbooked)) {
      alerts.push({
        kind: 'overbooked',
        severity: 'urgent',
        reservationId: null,
        reference: null,
        customerName: null,
        plate: null,
        detail: night.date,
        since: null,
        minutes: night.count - night.bookable,
      });
    }
    const rank: Record<AlertSeverity, number> = { urgent: 0, watch: 1, todo: 2 };
    alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || (b.minutes ?? 0) - (a.minutes ?? 0));

    const weekEnd = new Date(now.getTime() + 7 * 86400000);
    const flights = flightTrackingSettings();
    const lastChecked =
      planning.returns
        .map(r => r.flightCheckedAt)
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const toTreat = alerts.filter(a => a.severity !== 'todo').length;
    return {
      serverTime: now.toISOString(),
      date: planning.date,
      parking: {
        id: parking.id,
        name: parking.name,
        timezone: parking.timezone,
        bookableCapacity: capacity.bookableCapacity,
        plannedSpots,
        storedInFiles: capacity.capacitySource === 'files',
      },
      counts: {
        onSite: onSite.length,
        arrivalsToday: planning.stats.arrivals,
        arrivedToday: planning.stats.arrived,
        returnsToday: planning.stats.returns,
        shuttlesRunning: trips.length,
        freeSpots,
        toTreat,
      },
      services: {
        flights: { configured: !!flights, provider: flights?.provider ?? null, lastCheckedAt: lastChecked?.toISOString() ?? null },
        sms: { mode: smsStatus.mode, pending: smsStatus.pending, stale: smsStatus.pendingStale, lastSentAt: smsStatus.lastSentAt },
        push: { configured: this.push.enabled(), devices },
        stripe: {
          online: this.payments.modeFor(operator) === 'online',
          connected: !!operator.stripeAccountId,
          payoutsEnabled: operator.stripePayoutsEnabled,
        },
        lastImportAt: lastImport?.createdAt.toISOString() ?? null,
      },
      alerts,
      nextWave: (() => {
        const w = forecast.waves.find(w => w.state === 'planned' && new Date(w.leaveAt).getTime() >= now.getTime() - 30 * 60000);
        return w
          ? {
              leaveAt: w.leaveAt,
              direction: w.direction,
              stopName: w.stopName,
              passengers: w.passengers,
              vehiclesNeeded: w.vehiclesNeeded,
              flights: w.flights,
            }
          : null;
      })(),
      breakdown: {
        onSiteQuiet: onSite.filter(r => placed(r) && !alerts.some(a => a.reservationId === r.id) && !todayIds.has(r.id)).length,
        toPlaceToday: planning.arrivals.filter(a => a.status === 'upcoming' || (a.status === 'arrived' && !a.spotId && !a.fileId)).length,
        movesToday,
        returnsThisWeek: onSite.filter(r => r.returnAt <= weekEnd).length,
        toTreat,
        freeSpots,
      },
      vehicles: onSite.map(r => ({
        id: r.id,
        reference: r.reference,
        customerName: r.customerName,
        passengers: r.passengers,
        plate: r.plate,
        status: r.status,
        arrivalAt: r.arrivalAt.toISOString(),
        returnAt: r.returnAt.toISOString(),
        spotCode: r.spot?.code ?? r.file?.code ?? null,
        stayClass: r.spot?.stayClass ?? null,
        keyHook: r.keyHook,
        returnFlight: r.returnFlight,
        flightStatus: r.flightStatus,
        flightScheduledAt: r.flightScheduledAt?.toISOString() ?? null,
        flightEstimatedAt: r.flightEstimatedAt?.toISOString() ?? null,
        flightLandedAt: r.flightLandedAt?.toISOString() ?? null,
        tripDirection: tripOf(r.id)?.direction ?? null,
        stopName: r.stop?.name ?? null,
        returnsToday: todayIds.has(r.id),
      })),
    };
  }
}
