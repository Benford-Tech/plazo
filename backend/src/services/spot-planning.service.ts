import httpStatus from 'http-status';
import { HOLDING_STATUSES, ON_SITE_STATUSES } from '@/domain/reservation';
import { Container, Service } from 'typedi';
import prisma, { ParkingSpot, Prisma, ReservationStatus } from '@/database';
import { activeSpotCount, effectiveCapacity } from '@/domain/capacity';
import { settingsOf, stayClassDistance, stayClassForNights, type StayClass } from '@/domain/layout/types';
import { type Blocker, blockersOf, buildFiles, type FileSpot, type FileStay, scoreSpot } from '@/domain/files';
import { addDays, dayBounds, DATE_RE, localDate, nightsBetween } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { loadPlanCapacity } from './capacity.service';

const HOLDING: ReservationStatus[] = HOLDING_STATUSES;
const ON_SITE: ReservationStatus[] = ON_SITE_STATUSES;
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
  /** `blocked` (O-A, 06/10/2026): stays whose car stands behind one that leaves later. */
  kind: 'over_capacity' | 'unplaced' | 'inactive_spot_used' | 'blocked';
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
    const [spots, holding, plan] = await Promise.all([
      prisma.parkingSpot.findMany({ where: { parkingId: parking.id }, orderBy: [{ zoneId: 'asc' }, { row: 'asc' }, { index: 'asc' }] }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: HOLDING }, arrivalAt: { lt: end }, returnAt: { gt: start } },
        select: staySelect,
        orderBy: { arrivalAt: 'asc' },
      }),
      loadPlanCapacity([parking.id]).then(m => m.get(parking.id)!),
    ]);
    const bySpot = new Map<string, Stay[]>();
    const unplaced: Stay[] = [];
    for (const r of holding) {
      if (!r.spotId) unplaced.push(r);
      else bySpot.set(r.spotId, [...(bySpot.get(r.spotId) ?? []), r]);
    }
    const spotById = new Map(spots.map(s => [s.id, s]));
    // O-A (06/10/2026): a stay is "blocked" by the cars in front of it that leave later.
    const files = buildFiles(spots);
    const staysBySpot = new Map<string, FileStay[]>();
    for (const [spotId, list] of bySpot) {
      staysBySpot.set(
        spotId,
        list.map(r => ({ reservationId: r.id, reference: r.reference, spotId, arrivalAt: r.arrivalAt, returnAt: r.returnAt })),
      );
    }
    const blockedBy = (spot: ParkingSpot, r: Stay) =>
      blockersOf(
        { reservationId: r.id, reference: r.reference, spotId: spot.id, arrivalAt: r.arrivalAt, returnAt: r.returnAt },
        spot,
        files.get(spot.id) ?? [spot],
        staysBySpot,
      ).map((b: Blocker) => ({ ...b, returnAt: b.returnAt.toISOString() }));
    let blockedCount = 0;
    const withStays = spots.map(s => ({
      id: s.id,
      zoneId: s.zoneId,
      code: s.code,
      row: s.row,
      index: s.index,
      kind: s.kind,
      active: s.active,
      stayClass: s.stayClass ?? null,
      depth: s.depth ?? null,
      stays: (bySpot.get(s.id) ?? []).map(r => {
        const blockers = blockedBy(s, r);
        if (blockers.length) blockedCount += 1;
        return { ...r, onSite: ON_SITE.includes(r.status), blockedBy: blockers };
      }),
    }));
    // The capacity used everywhere (09/10/2026): the active spots on a parking stored in spots.
    const capacity = effectiveCapacity({ declared: parking.totalCapacity, ...plan, activeSpots: activeSpotCount(spots) }).total;
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
    if (blockedCount) alerts.push({ kind: 'blocked', count: blockedCount });
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
   * Gives a spot to every booking of the window that has none, earliest arrival first: a free spot
   * (over the whole stay) in the zone of the stay's class (Z-A), nearest the handover point, and
   * among equals the one whose row neighbours leave closest to the same day, so a row empties together.
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
    const files = buildFiles(spots);
    const landmarks = ((plan?.landmarks as { kind: string; geometry: { coordinates: [number, number] } }[] | null) ?? []).filter(
      l => l.geometry?.coordinates,
    );
    const target = landmarks.find(l => l.kind === 'handover') ?? landmarks.find(l => l.kind === 'entrance') ?? null;
    const settings = settingsOf({ settings: (plan?.settings as object) ?? {} });
    const placed: Stay[] = holding.filter(r => r.spotId);
    const todo = holding.filter(r => !r.spotId && r.arrivalAt < end && r.returnAt > start);
    const assigned: { reservationId: string; reference: string; spotId: string; code: string }[] = [];
    const skipped: { reservationId: string; reference: string }[] = [];
    for (const r of todo) {
      const spot = this.pick(spots, files, placed, r, target, stayClassForNights(nightsBetween(r.arrivalAt, r.returnAt, parking.timezone), settings));
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

  private pick(
    spots: ParkingSpot[],
    files: Map<string, FileSpot[]>,
    placed: Stay[],
    r: Stay,
    target: { geometry: { coordinates: [number, number] } } | null,
    wanted: StayClass,
  ): ParkingSpot | null {
    const overlapping = placed.filter(p => p.arrivalAt < r.returnAt && p.returnAt > r.arrivalAt);
    const busy = new Set(overlapping.map(p => p.spotId as string));
    const free = spots.filter(s => !busy.has(s.id));
    if (!free.length) return null;
    const staysBySpot = new Map<string, FileStay[]>();
    for (const p of overlapping) {
      const st: FileStay = { reservationId: p.id, reference: p.reference, spotId: p.spotId as string, arrivalAt: p.arrivalAt, returnAt: p.returnAt };
      staysBySpot.set(st.spotId, [...(staysBySpot.get(st.spotId) ?? []), st]);
    }
    const scored = free.map(s => {
      const score = scoreSpot(s, files.get(s.id) ?? [s], r, staysBySpot);
      return {
        spot: s,
        moves: score.moves,
        zone: stayClassDistance(s.stayClass, wanted),
        fit: score.fitMinutes ?? Number.MAX_SAFE_INTEGER,
        distance: target ? distanceM([s.lon, s.lat], target.geometry.coordinates) : s.row * 1000 + s.index,
      };
    });
    // O-A (06/10/2026): no move first (the file keeps its returns decreasing from the aisle), then
    // the stay's zone (Z-A), then distance in 10 m bands, then the tightest fit behind the car in
    // front, then the plan order.
    scored.sort(
      (a, b) =>
        a.moves - b.moves || a.zone - b.zone || Math.floor(a.distance / 10) - Math.floor(b.distance / 10) || a.fit - b.fit || a.distance - b.distance,
    );
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
