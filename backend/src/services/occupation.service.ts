import httpStatus from 'http-status';
import { HOLDING_STATUSES, ON_SITE_STATUSES } from '@/domain/reservation';
import { canLocateCar, carView, CLEARED_CAR_LOCATION } from '@/domain/car-location';
import { CarLocationDto } from '@/dtos/public-booking.dto';
import { Container, Service } from 'typedi';
import prisma, { ParkingPlan, ParkingSpot, Prisma, Reservation, ReservationStatus } from '@/database';
import { settingsOf, stayClassDistance, stayClassForNights, type StayClass } from '@/domain/layout/types';
import { dayBounds, localDate, nightsBetween } from '@/domain/time';
import { AssignSpotDto } from '@/dtos/occupation.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

/** Statuses that hold a spot: the vehicle is on site, or booked and already placed. */
/** A car placed this long before its booked arrival counts as a check-in (an early traveller), later as a pre-assignment. */
const CHECK_IN_AHEAD_HOURS = 6;
const HOLDING: ReservationStatus[] = HOLDING_STATUSES;
const ON_SITE: ReservationStatus[] = ON_SITE_STATUSES;

const occupantSelect = {
  id: true,
  reference: true,
  customerName: true,
  plate: true,
  status: true,
  arrivalAt: true,
  returnAt: true,
  returnFlight: true,
  spotId: true,
  keyHook: true,
  carLat: true,
  carLng: true,
  carAccuracyM: true,
  carLocatedAt: true,
  carLocatedBy: true,
  carNote: true,
} as const;
type Occupant = Prisma.ReservationGetPayload<{ select: typeof occupantSelect }>;

export interface Suggestion {
  spotId: string;
  code: string;
  /** Metres to the handover point (or the entrance), when the plan has one. */
  distanceM: number | null;
  reason: 'near_handover' | 'near_entrance' | 'free';
  /** The spot's stay class, when the plan has them (Z-A). */
  stayClass: StayClass | null;
}

export interface SpotState {
  id: string;
  zoneId: string;
  code: string;
  row: number;
  index: number;
  kind: string;
  active: boolean;
  geometry: unknown;
  stayClass: StayClass | null;
  /** The vehicle on it now (on site), else the next booking placed on it. */
  occupant: (Occupant & { onSite: boolean; leavesToday: boolean }) | null;
}

/**
 * Bloc 2, step "Occupation": which vehicle is on which spot, where its keys are, and where the
 * arrivals of the day should go. Scoped to the actor's operator.
 */
@Service()
export class OccupationService {
  public audit = Container.get(AuditService);

  public async board(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await this.parkingOf(actor, parkingId);
    const now = new Date();
    const today = localDate(now, parking.timezone);
    const { start, end } = dayBounds(today, parking.timezone);
    const [spots, plan, holding] = await Promise.all([
      prisma.parkingSpot.findMany({ where: { parkingId: parking.id }, orderBy: [{ zoneId: 'asc' }, { row: 'asc' }, { index: 'asc' }] }),
      prisma.parkingPlan.findUnique({ where: { parkingId: parking.id } }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: HOLDING }, OR: [{ spotId: { not: null } }, { arrivalAt: { lt: end } }] },
        select: occupantSelect,
        orderBy: { arrivalAt: 'asc' },
      }),
    ]);
    const bySpot = new Map<string, Occupant>();
    for (const r of holding) {
      if (!r.spotId) continue;
      const current = bySpot.get(r.spotId);
      // On site wins over a future booking; otherwise the earliest arrival.
      if (!current || (ON_SITE.includes(r.status) && !ON_SITE.includes(current.status))) bySpot.set(r.spotId, r);
    }
    const states: SpotState[] = spots.map(s => {
      const o = bySpot.get(s.id) ?? null;
      return {
        id: s.id,
        zoneId: s.zoneId,
        code: s.code,
        row: s.row,
        index: s.index,
        kind: s.kind,
        active: s.active,
        geometry: s.geometry,
        stayClass: s.stayClass ?? null,
        occupant: o ? { ...o, onSite: ON_SITE.includes(o.status), leavesToday: o.returnAt >= start && o.returnAt < end } : null,
      };
    });
    // Arrivals to place: on site without a spot, or booked for today and not placed yet.
    const unplaced = holding
      .filter(r => !r.spotId && (ON_SITE.includes(r.status) || (r.arrivalAt >= start && r.arrivalAt < end)))
      // Vehicles already on site first, then by arrival time.
      .sort((a, b) => Number(ON_SITE.includes(b.status)) - Number(ON_SITE.includes(a.status)) || a.arrivalAt.getTime() - b.arrivalAt.getTime());
    const landmarks = ((plan?.landmarks as { kind: string; geometry: { coordinates: [number, number] } }[] | null) ?? []).filter(
      l => l.geometry?.coordinates,
    );
    const arrivals = [];
    const taken = new Set<string>();
    for (const r of unplaced) {
      const suggestions = await this.suggest(parking.id, spots, r, landmarks, taken, plan, parking.timezone);
      // Each arrival gets its own first choice: the next one skips it.
      if (suggestions[0]) taken.add(suggestions[0].spotId);
      arrivals.push({ ...r, suggestions });
    }
    const zones = new Map<string, { zoneId: string; total: number; occupied: number }>();
    for (const s of states) {
      if (!s.active) continue;
      const z = zones.get(s.zoneId) ?? { zoneId: s.zoneId, total: 0, occupied: 0 };
      z.total += 1;
      if (s.occupant?.onSite) z.occupied += 1;
      zones.set(s.zoneId, z);
    }
    return {
      date: today,
      timezone: parking.timezone,
      plan: plan ? { outline: plan.outline, zones: plan.zones, landmarks: plan.landmarks } : null,
      spots: states,
      arrivals,
      zones: [...zones.values()],
      stats: {
        active: states.filter(s => s.active).length,
        occupied: states.filter(s => s.occupant?.onSite).length,
        leavingToday: states.filter(s => s.occupant?.leavesToday).length,
      },
    };
  }

  /** Plate (any spacing), name or reference, among the bookings that still matter. */
  public async search(actor: AuthenticatedStaff, parkingId: string, query: string) {
    const parking = await this.parkingOf(actor, parkingId);
    const q = query.trim();
    if (q.length < 2) return [];
    const plateKey = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const since = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const rows = await prisma.reservation.findMany({
      where: {
        parkingId: parking.id,
        status: { in: HOLDING },
        returnAt: { gte: since },
        OR: [
          ...(plateKey.length >= 2 ? [{ plateKey: { contains: plateKey } }] : []),
          { customerName: { contains: q, mode: 'insensitive' as const } },
          { reference: { equals: q.toUpperCase() } },
        ],
      },
      select: { ...occupantSelect, spot: { select: { code: true } } },
      orderBy: [{ status: 'asc' }, { arrivalAt: 'asc' }],
      take: 10,
    });
    return rows.map(r => ({ ...r, onSite: ON_SITE.includes(r.status) }));
  }

  /** Puts the vehicle on a spot (or releases it); a move is traced. */
  public async assign(actor: AuthenticatedStaff, reservationId: string, data: AssignSpotDto) {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId }, include: { spot: true } });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    if (!HOLDING.includes(reservation.status)) throw new HttpException(httpStatus.BAD_REQUEST, 'This booking cannot be placed', 'not_placeable');
    let spot: ParkingSpot | null = null;
    if (data.spotId) {
      spot = await prisma.parkingSpot.findFirst({ where: { id: data.spotId, parkingId: reservation.parkingId } });
      if (!spot) throw new HttpException(httpStatus.NOT_FOUND, 'Spot not found', 'spot_not_found');
      if (!spot.active) throw new HttpException(httpStatus.BAD_REQUEST, 'This spot is inactive', 'spot_inactive');
      const clash = await this.overlapOn(spot.id, reservation, reservation.id);
      if (clash) throw new HttpException(httpStatus.CONFLICT, `Spot ${spot.code} is taken by ${clash.reference}`, 'spot_taken');
    }
    const keyHook = data.keyHook === undefined ? reservation.keyHook : data.keyHook?.trim() || null;
    // The valet's fix where the car stands (06/10/2026); the staff's position always wins.
    const car = data.car
      ? {
          carLat: data.car.lat,
          carLng: data.car.lng,
          carAccuracyM: data.car.accuracyM ?? null,
          carLocatedAt: new Date(),
          carLocatedBy: 'staff' as const,
          carNote: data.car.note?.trim() || null,
        }
      : {};
    // Decision A (06/10/2026): placing the car of a traveller expected today (or late) is the check-in;
    // a spot given days ahead is a pre-assignment and changes nothing.
    const checkIn = !!spot && reservation.status === 'upcoming' && reservation.arrivalAt.getTime() - Date.now() <= CHECK_IN_AHEAD_HOURS * 3600000;
    const updated = await prisma.$transaction(async tx => {
      const row = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          spotId: spot?.id ?? null,
          keyHook,
          ...car,
          ...(checkIn ? { status: 'arrived', arrivedAt: reservation.arrivedAt ?? new Date() } : {}),
        },
        include: { spot: { select: { code: true } } },
      });
      if (checkIn) {
        await this.audit.record(
          actor,
          {
            action: 'reservation.status_changed',
            entityType: 'reservation',
            entityId: reservation.id,
            details: { from: 'upcoming', to: 'arrived', by: 'spot_assigned' },
          },
          tx,
        );
      }
      await this.audit.record(
        actor,
        {
          action: 'reservation.spot_assigned',
          entityType: 'reservation',
          entityId: reservation.id,
          details: { from: reservation.spot?.code ?? null, to: spot?.code ?? null, keyHook, carLocated: !!data.car },
        },
        tx,
      );
      return row;
    });
    return updated;
  }

  /** A staff member records (or corrects) where the car stands, apart from a spot assignment. */
  public async locateCar(actor: AuthenticatedStaff, reservationId: string, data: CarLocationDto) {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId } });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    if (!canLocateCar(reservation.status)) throw new HttpException(httpStatus.BAD_REQUEST, 'This booking cannot be located', 'car_location_closed');
    const row = await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        carLat: data.lat,
        carLng: data.lng,
        carAccuracyM: data.accuracyM ?? null,
        carLocatedAt: new Date(),
        carLocatedBy: 'staff',
        carNote: data.note?.trim() || null,
      },
    });
    await this.audit.record(actor, {
      action: 'reservation.car_located',
      entityType: 'reservation',
      entityId: reservation.id,
      details: { by: 'staff', accuracyM: data.accuracyM ?? null },
    });
    return { car: carView(row) };
  }

  public async clearCar(actor: AuthenticatedStaff, reservationId: string) {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId } });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    await prisma.reservation.update({ where: { id: reservation.id }, data: CLEARED_CAR_LOCATION });
    await this.audit.record(actor, {
      action: 'reservation.car_located',
      entityType: 'reservation',
      entityId: reservation.id,
      details: { by: 'staff', cleared: true },
    });
    return { car: null };
  }

  /**
   * Top 3 free spots for a stay: in the zone of the stay's class first (Z-A, a neighbouring zone
   * when it is full), then nearest the handover point (else the entrance); never "reserved".
   */
  private async suggest(
    parkingId: string,
    spots: ParkingSpot[],
    r: Pick<Reservation, 'id' | 'arrivalAt' | 'returnAt'>,
    landmarks: { kind: string; geometry: { coordinates: [number, number] } }[],
    skip: Set<string>,
    plan: ParkingPlan | null,
    timezone: string,
  ): Promise<Suggestion[]> {
    const wanted = stayClassForNights(nightsBetween(r.arrivalAt, r.returnAt, timezone), settingsOf({ settings: (plan?.settings as object) ?? {} }));
    const busy = await prisma.reservation.findMany({
      where: {
        parkingId,
        status: { in: HOLDING },
        spotId: { not: null },
        id: { not: r.id },
        arrivalAt: { lt: r.returnAt },
        returnAt: { gt: r.arrivalAt },
      },
      select: { spotId: true },
    });
    const busyIds = new Set(busy.map(b => b.spotId as string));
    const target = landmarks.find(l => l.kind === 'handover') ?? landmarks.find(l => l.kind === 'entrance') ?? null;
    const reason: Suggestion['reason'] = target ? (target.kind === 'handover' ? 'near_handover' : 'near_entrance') : 'free';
    const candidates = spots
      .filter(s => s.active && s.kind !== 'reserved' && !busyIds.has(s.id) && !skip.has(s.id))
      .map(s => {
        const distance = target ? Math.round(distanceM([s.lon, s.lat], target.geometry.coordinates)) : null;
        return {
          suggestion: { spotId: s.id, code: s.code, distanceM: distance, reason, stayClass: s.stayClass ?? null },
          zone: stayClassDistance(s.stayClass, wanted),
          order: distance ?? s.row * 1000 + s.index,
        };
      });
    candidates.sort((a, b) => a.zone - b.zone || a.order - b.order);
    return candidates.slice(0, 3).map(c => c.suggestion);
  }

  private async overlapOn(spotId: string, stay: Pick<Reservation, 'arrivalAt' | 'returnAt'>, exceptId: string) {
    return prisma.reservation.findFirst({
      where: { spotId, id: { not: exceptId }, status: { in: HOLDING }, arrivalAt: { lt: stay.returnAt }, returnAt: { gt: stay.arrivalAt } },
      select: { id: true, reference: true },
    });
  }

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }
}

/** Metres between two WGS84 positions, flat-earth (fine within a parking). */
function distanceM(a: [number, number], b: [number, number]): number {
  const kx = 111320 * Math.cos((a[1] * Math.PI) / 180);
  const dx = (b[0] - a[0]) * kx;
  const dy = (b[1] - a[1]) * 110540;
  return Math.sqrt(dx * dx + dy * dy);
}
