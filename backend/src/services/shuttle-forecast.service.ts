import { Container, Service } from 'typedi';
import prisma, { Prisma, ReservationStatus } from '@/database';
import { buildWaves, dropoffTimes, pickupTimes, ShuttleWave, WaveMember, WaveTimes } from '@/domain/shuttle-waves';
import { DATE_RE, dayBounds, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { FlightTrackingService } from './flight-tracking.service';
import { ParkingService } from './parking.service';
import { ShuttleService } from './shuttle.service';

export interface ShuttleForecast {
  serverTime: string;
  date: string;
  times: WaveTimes;
  /** Seats of the largest vehicle in service, and how many vehicles are in service. */
  seats: number | null;
  vehiclesInService: number;
  waves: ShuttleWave[];
}

/** Drop-offs: the travellers arriving that day (done once they left for the terminal). */
const DROPOFF_DAY_STATUSES: ReservationStatus[] = ['upcoming', 'arrived', 'shuttled_out', 'return_requested', 'returned'];
const DROPOFF_DONE: ReservationStatus[] = ['shuttled_out', 'return_requested', 'returned'];
/** Pick-ups: the travellers returning that day (done once the vehicle is handed back). */
const PICKUP_DAY_STATUSES: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested', 'returned'];

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

type Row = Prisma.ReservationGetPayload<{ include: { stop: { select: { id: true; name: true } } } }>;

/**
 * The shuttle forecast of a day (V-A "Ligne du jour", 05/10/2026): every traveller to drive to
 * the terminal (before their outbound flight) or to fetch at the airport (after their return
 * flight), grouped into waves with the passengers against the seats. Flights are refreshed on
 * the way, like the driver's lists.
 */
@Service()
export class ShuttleForecastService {
  public flights = Container.get(FlightTrackingService);
  public parkings = Container.get(ParkingService);
  public shuttle = Container.get(ShuttleService);

  public async day(actor: AuthenticatedStaff, date?: string): Promise<ShuttleForecast> {
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    const day = date && DATE_RE.test(date) ? date : localDate(now, parking.timezone);
    const { start, end } = dayBounds(day, parking.timezone);
    const times: WaveTimes = {
      shuttleTravelMinutes: parking.shuttleTravelMinutes,
      terminalLeadMinutes: parking.terminalLeadMinutes,
      landingDelayMinutes: parking.landingDelayMinutes,
    };
    const include = { stop: { select: { id: true, name: true } } } as const;
    const pick = (where: Prisma.ReservationWhereInput) => prisma.reservation.findMany({ where: { parkingId: parking.id, ...where }, include });
    const [dropoffs, pickups] = await Promise.all([
      pick({
        status: { in: DROPOFF_DAY_STATUSES },
        OR: [{ arrivalAt: { gte: start, lt: end } }, { departureScheduledAt: { gte: start, lt: end } }],
      }),
      pick({
        status: { in: PICKUP_DAY_STATUSES },
        OR: [{ returnAt: { gte: start, lt: end } }, { flightEstimatedAt: { gte: start, lt: end } }],
      }),
    ]);
    // Flights refreshed when due (cache of 5 minutes), then read again.
    const refreshed = (await this.flights.refreshDepartures(dropoffs.map(r => r.id))) + (await this.flights.refreshBookings(pickups.map(r => r.id)));
    const [freshDrop, freshPick, trips, vehicles] = await Promise.all([
      refreshed ? prisma.reservation.findMany({ where: { id: { in: dropoffs.map(r => r.id) } }, include }) : dropoffs,
      refreshed ? prisma.reservation.findMany({ where: { id: { in: pickups.map(r => r.id) } }, include }) : pickups,
      this.shuttle.running(actor),
      prisma.shuttleVehicle.findMany({ where: { operatorId: actor.operatorId, inService: true }, select: { seats: true } }),
    ]);
    const tripOf = (id: string, direction: 'pickup' | 'dropoff') =>
      trips.find(t => t.direction === direction && t.reservationIds.includes(id)) ?? null;
    const seats = vehicles.reduce<number | null>((max, v) => (v.seats && (!max || v.seats > max) ? v.seats : max), null);

    const base = (r: Row) => ({
      reservationId: r.id,
      reference: r.reference,
      customerName: r.customerName,
      passengers: r.passengers,
      plate: r.plate,
      status: r.status,
      stopId: r.stop?.id ?? null,
      stopName: r.stop?.name ?? null,
    });
    const members: WaveMember[] = [];
    for (const r of freshDrop) {
      const { leaveAt, noFlight } = dropoffTimes(r, times);
      const trip = tripOf(r.id, 'dropoff');
      members.push({
        ...base(r),
        direction: 'dropoff',
        leaveAt: leaveAt.toISOString(),
        meetAt: null,
        flight: r.departureFlight
          ? {
              number: r.departureFlight,
              status: r.departureStatus,
              scheduledAt: iso(r.departureScheduledAt),
              estimatedAt: iso(r.departureEstimatedAt),
              actualAt: r.departureStatus === 'departed' ? iso(r.departureEstimatedAt) : null,
              terminal: r.departureTerminal,
            }
          : null,
        noFlight,
        state: trip ? 'running' : DROPOFF_DONE.includes(r.status) ? 'done' : 'planned',
        tripId: trip?.id ?? null,
      });
    }
    for (const r of freshPick) {
      const { leaveAt, meetAt, noFlight } = pickupTimes(r, times);
      const trip = tripOf(r.id, 'pickup');
      members.push({
        ...base(r),
        direction: 'pickup',
        leaveAt: leaveAt.toISOString(),
        meetAt: meetAt.toISOString(),
        flight: r.returnFlight
          ? {
              number: r.returnFlight,
              status: r.flightStatus,
              scheduledAt: iso(r.flightScheduledAt),
              estimatedAt: iso(r.flightEstimatedAt),
              actualAt: iso(r.flightLandedAt),
              terminal: r.flightTerminal,
            }
          : null,
        noFlight,
        state: trip ? 'running' : r.status === 'returned' ? 'done' : 'planned',
        tripId: trip?.id ?? null,
      });
    }
    return {
      serverTime: now.toISOString(),
      date: day,
      times,
      seats,
      vehiclesInService: vehicles.length,
      waves: buildWaves(members, seats),
    };
  }
}
