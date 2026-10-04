import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ParkingSpot, Prisma, ReservationStatus } from '@/database';
import { addDays, dayBounds, DATE_RE, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

const HOLDING: ReservationStatus[] = ['upcoming', 'arrived', 'shuttled_out', 'return_requested'];
const ON_SITE: ReservationStatus[] = ['arrived', 'shuttled_out', 'return_requested'];
const MAX_DAYS = 31;

const staySelect = {
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
} as const;
type Stay = Prisma.ReservationGetPayload<{ select: typeof staySelect }>;

export interface PlanningWindow {
  from: string;
  days: number;
}

export interface DayLoad {
  date: string;
  /** Stays placed on a spot that overlap the day. */
  placed: number;
  /** Bookings without a spot that overlap the day. */
  unplaced: number;
  capacity: number;
}

export interface PlanningAlert {
  kind: 'over_capacity' | 'unplaced' | 'inactive_spot_used';
  date?: string;
  count?: number;
  spotCode?: string;
  reference?: string;
}

/**
 * Bloc 2, step "Planning des places": one line per spot over a window of days, the bookings
 * without a spot, the days where demand exceeds the spots, and a pre-assignment by return
 * date and distance to the handover point. Scoped to the actor's operator.
 */
@Service()
export class SpotPlanningService {
  public audit = Container.get(AuditService);

  public parseWindow(query: { from?: unknown; days?: unknown }, timezone: string): PlanningWindow {
    const from = typeof query.from === 'string' && DATE_RE.test(query.from) ? query.from : localDate(new Date(), timezone);
    const raw = typeof query.days === 'string' ? Number(query.days) : 14;
    const days = Number.isInteger(raw) ? Math.min(MAX_DAYS, Math.max(1, raw)) : 14;
    return { from, days };
  }

  public async board(actor: AuthenticatedStaff, parkingId: string, query: { from?: unknown; days?: unknown }) {
    const parking = await this.parkingOf(actor, parkingId);
    const window = this.parseWindow(query, parking.timezone);
    const { start } = dayBounds(window.from, parking.timezone);
    const { end } = dayBounds(addDays(window.from, window.days - 1), parking.timezone);
    const [spots, holding] = await Promise.all([
      prisma.parkingSpot.findMany({ where: { parkingId: parking.id }, orderBy: [{ zoneId: 'asc' }, { row: 'asc' }, { index: 'asc' }] }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: HOLDING }, arrivalAt: { lt: end }, returnAt: { gt: start } },
        select: staySelect,
        orderBy: { arrivalAt: 'asc' },
      }),
    ]);
    const bySpot = new Map<string, Stay[]>();
    const unplaced: Stay[] = [];
    for (const r of holding) {
      if (!r.spotId) unplaced.push(r);
      else bySpot.set(r.spotId, [...(bySpot.get(r.spotId) ?? []), r]);
    }
    const spotById = new Map(spots.map(s => [s.id, s]));
    const withStays = spots.map(s => ({
      id: s.id,
      zoneId: s.zoneId,
      code: s.code,
      row: s.row,
      index: s.index,
      kind: s.kind,
      active: s.active,
      stays: (bySpot.get(s.id) ?? []).map(r => ({ ...r, onSite: ON_SITE.includes(r.status) })),
    }));
    const capacity = spots.filter(s => s.active).length;
    const days: DayLoad[] = [];
    const alerts: PlanningAlert[] = [];
    for (let i = 0; i < window.days; i += 1) {
      const date = addDays(window.from, i);
      const bounds = dayBounds(date, parking.timezone);
      const overlaps = (r: Stay) => r.arrivalAt < bounds.end && r.returnAt > bounds.start;
      const placed = holding.filter(r => r.spotId && overlaps(r)).length;
      const open = unplaced.filter(overlaps).length;
      days.push({ date, placed, unplaced: open, capacity });
      if (placed + open > capacity) alerts.push({ kind: 'over_capacity', date, count: placed + open - capacity });
    }
    if (unplaced.length) alerts.push({ kind: 'unplaced', count: unplaced.length });
    for (const r of holding) {
      const spot = r.spotId ? spotById.get(r.spotId) : null;
      if (spot && !spot.active) alerts.push({ kind: 'inactive_spot_used', spotCode: spot.code, reference: r.reference });
    }
    return {
      from: window.from,
      days: window.days,
      timezone: parking.timezone,
      capacity,
      spots: withStays,
      unplaced: unplaced.map(r => ({ ...r, onSite: ON_SITE.includes(r.status) })),
      load: days,
      alerts,
    };
  }

  /**
   * Gives a spot to every booking of the window that has none, earliest arrival first: the free
   * spot (over the whole stay) nearest the handover point, and among equals the one whose row
   * neighbours leave closest to the same day, so a row empties together.
   */
  public async preassign(actor: AuthenticatedStaff, parkingId: string, query: { from?: unknown; days?: unknown }) {
    const parking = await this.parkingOf(actor, parkingId);
    const window = this.parseWindow(query, parking.timezone);
    const { start } = dayBounds(window.from, parking.timezone);
    const { end } = dayBounds(addDays(window.from, window.days - 1), parking.timezone);
    const [spots, plan, holding] = await Promise.all([
      prisma.parkingSpot.findMany({ where: { parkingId: parking.id, active: true, kind: { not: 'reserved' } } }),
      prisma.parkingPlan.findUnique({ where: { parkingId: parking.id } }),
      prisma.reservation.findMany({ where: { parkingId: parking.id, status: { in: HOLDING } }, select: staySelect, orderBy: { arrivalAt: 'asc' } }),
    ]);
    const landmarks = ((plan?.landmarks as { kind: string; geometry: { coordinates: [number, number] } }[] | null) ?? []).filter(
      l => l.geometry?.coordinates,
    );
    const target = landmarks.find(l => l.kind === 'handover') ?? landmarks.find(l => l.kind === 'entrance') ?? null;
    const placed: Stay[] = holding.filter(r => r.spotId);
    const todo = holding.filter(r => !r.spotId && r.arrivalAt < end && r.returnAt > start);
    const assigned: { reservationId: string; reference: string; spotId: string; code: string }[] = [];
    const skipped: { reservationId: string; reference: string }[] = [];
    for (const r of todo) {
      const spot = this.pick(spots, placed, r, target);
      if (!spot) {
        skipped.push({ reservationId: r.id, reference: r.reference });
        continue;
      }
      await prisma.$transaction(async tx => {
        await tx.reservation.update({ where: { id: r.id }, data: { spotId: spot.id } });
        await this.audit.record(
          actor,
          {
            action: 'reservation.spot_assigned',
            entityType: 'reservation',
            entityId: r.id,
            details: { from: null, to: spot.code, keyHook: r.keyHook, by: 'preassign' },
          },
          tx,
        );
      });
      placed.push({ ...r, spotId: spot.id });
      assigned.push({ reservationId: r.id, reference: r.reference, spotId: spot.id, code: spot.code });
    }
    return { assigned, skipped };
  }

  private pick(spots: ParkingSpot[], placed: Stay[], r: Stay, target: { geometry: { coordinates: [number, number] } } | null): ParkingSpot | null {
    const overlapping = placed.filter(p => p.arrivalAt < r.returnAt && p.returnAt > r.arrivalAt);
    const busy = new Set(overlapping.map(p => p.spotId as string));
    const free = spots.filter(s => !busy.has(s.id));
    if (!free.length) return null;
    const spotById = new Map(spots.map(s => [s.id, s]));
    // Days between this stay's return and the returns already planned in the same row.
    const rowSpread = (s: ParkingSpot) => {
      const returns = placed
        .filter(p => {
          const ps = p.spotId ? spotById.get(p.spotId) : null;
          return ps && ps.zoneId === s.zoneId && ps.row === s.row && p.returnAt > r.arrivalAt;
        })
        .map(p => Math.abs(p.returnAt.getTime() - r.returnAt.getTime()) / 86_400_000);
      return returns.length ? Math.min(...returns) : 0.5;
    };
    const scored = free.map(s => ({
      spot: s,
      distance: target ? distanceM([s.lon, s.lat], target.geometry.coordinates) : s.row * 1000 + s.index,
      spread: rowSpread(s),
    }));
    // Distance in 10 m bands, then the row that empties with this vehicle, then the plan order.
    scored.sort((a, b) => Math.floor(a.distance / 10) - Math.floor(b.distance / 10) || a.spread - b.spread || a.distance - b.distance);
    return scored[0].spot;
  }

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }
}

function distanceM(a: [number, number], b: [number, number]): number {
  const kx = 111320 * Math.cos((a[1] * Math.PI) / 180);
  const dx = (b[0] - a[0]) * kx;
  const dy = (b[1] - a[1]) * 110540;
  return Math.sqrt(dx * dx + dy * dy);
}
