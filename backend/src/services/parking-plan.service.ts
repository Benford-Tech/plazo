import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ParkingPlan, ParkingSpot, Prisma } from '@/database';
import { autoZones, estimate, frameFor, withIgnBuildings, type Estimate, type EstimateInput } from '@/domain/layout/estimate';
import { spotsFromLayout } from '@/domain/layout/numbering';
import { settingsOf, type CapacityStudy, type LayoutKey } from '@/domain/layout/types';
import { type CapacitySource } from '@/domain/capacity';
import { AddSpotsDto, GenerateSpotsDto, ReplaceSpotsDto, SpotInputDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { loadPlanCapacity, parkingCapacity } from './capacity.service';
import { GeoService, MAX_BBOX_SPAN } from './geo.service';

/** Names of the exclusions and zones the server makes itself (user-facing, in French like the app's "Zone A"). */
const IGN_BUILDING_NAME = 'Bâtiment';
const ZONE_NAME = (letter: string) => `Zone ${letter}`;
const newId = () => Math.random().toString(36).slice(2, 10);

function bboxOf(ring: [number, number][]): [number, number, number, number] | null {
  if (!ring.length) return null;
  let [w, s] = ring[0];
  let [e, n] = ring[0];
  for (const [x, y] of ring) {
    w = Math.min(w, x);
    e = Math.max(e, x);
    s = Math.min(s, y);
    n = Math.max(n, y);
  }
  return [w, s, e, n];
}

export interface ParkingPlanView {
  plan: ParkingPlan;
  spots: ParkingSpot[];
  /** Active spots (laid by hand and reserved ones included). */
  activeSpots: number;
  /** The declared figure (older apps read it; `applyCapacity` copies the active spots into it). */
  totalCapacity: number;
  /** The capacity used everywhere (09/10/2026): files, else active spots, else declared. */
  effectiveCapacity: number;
  capacitySource: CapacitySource;
}

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');

/**
 * The operator's parking plan (bloc 2, step "Plan"). Always scoped to the parking of the actor's
 * operator: the plan is created empty on first read. The geometry work (layouts, numbering) is done
 * by the pro space; the API stores the plan and its spots, whose number is the parking's capacity
 * (`effectiveCapacity`) as soon as there are active spots and no files.
 */
@Service()
export class ParkingPlanService {
  public audit = Container.get(AuditService);
  public geo = Container.get(GeoService);

  public async get(actor: AuthenticatedStaff, parkingId: string): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const plan =
      (await prisma.parkingPlan.findUnique({ where: { parkingId: parking.id } })) ??
      (await prisma.parkingPlan.create({ data: { parkingId: parking.id } }));
    const spots = await prisma.parkingSpot.findMany({
      where: { parkingId: parking.id },
      orderBy: [{ zoneId: 'asc' }, { row: 'asc' }, { index: 'asc' }],
    });
    const capacity = parkingCapacity(parking, (await loadPlanCapacity([parking.id])).get(parking.id)!);
    return {
      plan,
      spots,
      activeSpots: spots.filter(s => s.active).length,
      totalCapacity: parking.totalCapacity,
      effectiveCapacity: capacity.effectiveCapacity,
      capacitySource: capacity.capacitySource,
    };
  }

  public async update(actor: AuthenticatedStaff, parkingId: string, data: UpdateParkingPlanDto): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const existing =
      data.settings != null ? await prisma.parkingPlan.findUnique({ where: { parkingId: parking.id }, select: { settings: true } }) : null;
    const json = (value: unknown) => value as Prisma.InputJsonValue;
    const patch = {
      ...(data.outline !== undefined ? { outline: data.outline === null ? Prisma.DbNull : json(data.outline) } : {}),
      ...(data.parcels != null ? { parcels: json(data.parcels) } : {}),
      ...(data.scaleFactor != null ? { scaleFactor: data.scaleFactor } : {}),
      ...(data.zones != null ? { zones: json(data.zones) } : {}),
      ...(data.exclusions != null ? { exclusions: json(data.exclusions) } : {}),
      // Settings are merged: the app's outline autosave only sends `outlineSource`, the pro space the rest.
      ...(data.settings != null ? { settings: json({ ...((existing?.settings as Record<string, unknown> | null) ?? {}), ...data.settings }) } : {}),
      ...(data.landmarks != null ? { landmarks: json(data.landmarks) } : {}),
    };
    await prisma.parkingPlan.upsert({ where: { parkingId: parking.id }, create: { parkingId: parking.id, ...patch }, update: patch });
    if (data.outline || data.exclusions != null) await this.followLand(parking.id, data);
    return this.get(actor, parkingId);
  }

  /**
   * B-A and T-A (07/10/2026), for the app, which only sends the outline: the IGN buildings
   * overlapping the land become exclusions (unless `settings.ignBuildings` is false, or the patch
   * carries its own exclusions, as the pro space's does), then the zones follow the land when
   * they are automatic (`settings.zonesAuto`, or no zone yet) and the patch brought none.
   */
  private async followLand(parkingId: string, data: UpdateParkingPlanDto): Promise<void> {
    const plan = await prisma.parkingPlan.findUnique({ where: { parkingId } });
    if (!plan?.outline) return;
    const input = planInput(plan);
    const settings = settingsOf(input);
    let exclusions = input.exclusions;
    let changed = false;
    if (data.outline && data.exclusions == null && settings.ignBuildings !== false) {
      const bbox = bboxOf(input.outline!.coordinates[0]);
      if (bbox && bbox[2] - bbox[0] <= MAX_BBOX_SPAN && bbox[3] - bbox[1] <= MAX_BBOX_SPAN) {
        try {
          const buildings = await this.geo.buildingsIn(bbox);
          exclusions = withIgnBuildings(input, buildings, IGN_BUILDING_NAME);
          changed = true;
        } catch (error) {
          // The plan is saved all the same: the buildings are synced again on the next outline change.
          logger.warn(`[Plan] IGN buildings not synced: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }
    }
    const auto = settings.zonesAuto === true || (settings.zonesAuto == null && input.zones.length === 0);
    const zones = data.zones == null && auto ? autoZones({ ...input, exclusions }, ZONE_NAME, newId) : null;
    if (!changed && !zones) return;
    await prisma.parkingPlan.update({
      where: { parkingId },
      data: {
        ...(changed ? { exclusions: exclusions as unknown as Prisma.InputJsonValue } : {}),
        ...(zones ? { zones: zones as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  /** The rows to insert for a list of spots; codes must be unique within the parking. */
  private rowsOf(parkingId: string, spots: SpotInputDto[], manual: boolean, taken: Set<string>): Prisma.ParkingSpotCreateManyInput[] {
    const codes = new Set<string>();
    for (const s of spots) {
      if (codes.has(s.code) || taken.has(s.code)) throw new HttpException(httpStatus.BAD_REQUEST, `Duplicate spot code ${s.code}`, 'duplicate_code');
      codes.add(s.code);
    }
    return spots.map(s => {
      const [lon, lat] = centroid(s.geometry);
      return {
        parkingId,
        zoneId: s.zoneId,
        code: s.code,
        row: s.row,
        index: s.index,
        kind: s.kind ?? 'standard',
        active: s.active ?? true,
        geometry: s.geometry as Prisma.InputJsonValue,
        lon,
        lat,
        depth: s.depth ?? null,
        fileLength: s.fileLength ?? null,
        stayClass: s.stayClass ?? null,
        manual,
      };
    });
  }

  /** A new generation: every generated spot is replaced; the spots laid by hand stay (P-B). */
  public async replaceSpots(actor: AuthenticatedStaff, parkingId: string, data: ReplaceSpotsDto): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    // P-B: a regeneration keeps the spots laid by hand; a reset (includeManual) drops them too.
    const kept = data.includeManual
      ? []
      : await prisma.parkingSpot.findMany({ where: { parkingId: parking.id, manual: true }, select: { code: true } });
    const rows = this.rowsOf(parking.id, data.spots, false, new Set(kept.map(k => k.code)));
    await prisma.$transaction(async tx => {
      await tx.parkingPlan.upsert({ where: { parkingId: parking.id }, create: { parkingId: parking.id }, update: {} });
      await tx.parkingSpot.deleteMany({ where: { parkingId: parking.id, ...(data.includeManual ? {} : { manual: false }) } });
      if (rows.length) await tx.parkingSpot.createMany({ data: rows });
      await tx.parkingPlan.update({ where: { parkingId: parking.id }, data: { layout: data.layout, generatedAt: new Date() } });
      await this.audit.record(
        actor,
        {
          action: 'parking.spots_generated',
          entityType: 'parking',
          entityId: parking.id,
          details: { layout: data.layout, spots: data.spots.length },
        },
        tx,
      );
    });
    return this.get(actor, parkingId);
  }

  /** P-B (07/10/2026): spots laid by hand (a row drawn on the map), kept through regenerations. */
  public async addSpots(actor: AuthenticatedStaff, parkingId: string, data: AddSpotsDto): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    if (!data.spots.length) throw new HttpException(httpStatus.BAD_REQUEST, 'No spot to add', 'no_spots');
    const existing = await prisma.parkingSpot.findMany({ where: { parkingId: parking.id }, select: { code: true } });
    const rows = this.rowsOf(parking.id, data.spots, true, new Set(existing.map(e => e.code)));
    await prisma.$transaction(async tx => {
      await tx.parkingPlan.upsert({ where: { parkingId: parking.id }, create: { parkingId: parking.id }, update: {} });
      await tx.parkingSpot.createMany({ data: rows });
      await this.audit.record(
        actor,
        { action: 'parking.spots_added', entityType: 'parking', entityId: parking.id, details: { spots: rows.length } },
        tx,
      );
    });
    return this.get(actor, parkingId);
  }

  /** Only a spot laid by hand can be removed; a generated one is deactivated instead. */
  public async deleteSpot(actor: AuthenticatedStaff, parkingId: string, spotId: string): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const spot = await prisma.parkingSpot.findFirst({ where: { id: spotId, parkingId: parking.id } });
    if (!spot) throw new HttpException(httpStatus.NOT_FOUND, 'Spot not found', 'not_found');
    if (!spot.manual) throw new HttpException(httpStatus.CONFLICT, 'Only a spot laid by hand can be removed', 'not_manual');
    await prisma.parkingSpot.delete({ where: { id: spot.id } });
    return this.get(actor, parkingId);
  }

  public async updateSpot(actor: AuthenticatedStaff, parkingId: string, spotId: string, data: UpdateSpotDto): Promise<ParkingSpot> {
    const parking = await this.parkingOf(actor, parkingId);
    const spot = await prisma.parkingSpot.findFirst({ where: { id: spotId, parkingId: parking.id } });
    if (!spot) throw new HttpException(httpStatus.NOT_FOUND, 'Spot not found', 'not_found');
    if (data.code && data.code !== spot.code) {
      const taken = await prisma.parkingSpot.findUnique({ where: { parkingId_code: { parkingId: parking.id, code: data.code } } });
      if (taken) throw new HttpException(httpStatus.CONFLICT, `Spot code ${data.code} already used`, 'duplicate_code');
    }
    return prisma.parkingSpot.update({
      where: { id: spot.id },
      data: {
        ...(data.active != null ? { active: data.active } : {}),
        ...(data.kind ? { kind: data.kind } : {}),
        ...(data.code ? { code: data.code } : {}),
      },
    });
  }

  /**
   * Copies the number of active spots into the declared capacity. Kept for the app builds already
   * on the stores (« Générer et appliquer »): since 09/10/2026 the plan's figure counts by itself
   * (`effectiveCapacity`), so this only changes the fallback used without a plan.
   */
  public async applyCapacity(actor: AuthenticatedStaff, parkingId: string): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const active = await prisma.parkingSpot.count({ where: { parkingId: parking.id, active: true } });
    if (active < 1) throw new HttpException(httpStatus.BAD_REQUEST, 'No active spot', 'no_spots');
    if (active !== parking.totalCapacity) {
      await prisma.$transaction(async tx => {
        await tx.parking.update({ where: { id: parking.id }, data: { totalCapacity: active } });
        await this.audit.record(
          actor,
          {
            action: 'parking.settings_updated',
            entityType: 'parking',
            entityId: parking.id,
            details: { totalCapacity: { from: parking.totalCapacity, to: active }, source: 'plan' },
          },
          tx,
        );
      });
    }
    return this.get(actor, parkingId);
  }

  /** The three layouts compared on the stored plan (what the pro space computes in the browser). */
  public async estimate(actor: AuthenticatedStaff, parkingId: string) {
    const { plan } = await this.get(actor, parkingId);
    const input = planInput(plan);
    if (!input.zones.length) throw new HttpException(httpStatus.BAD_REQUEST, 'The plan has no zone', 'no_zones');
    const result = estimate(input);
    return {
      usableArea: Math.round(result.usableArea),
      totals: result.totals,
      zones: result.zones.map(z => ({
        zoneId: z.zoneId,
        name: z.name,
        area: Math.round(z.area),
        counts: {
          selfPark: z.layouts.selfPark.count,
          valet24: z.layouts.valet24.count,
          valet5: z.layouts.valet5.count,
          valetEdge: z.layouts.valetEdge.count,
        },
      })),
    };
  }

  /** Generates and stores the spots of a layout on the server (the app's "Générer et appliquer"). */
  public async generate(actor: AuthenticatedStaff, parkingId: string, data: GenerateSpotsDto): Promise<ParkingPlanView> {
    const { plan } = await this.get(actor, parkingId);
    const input = planInput(plan);
    const frame = frameFor(input);
    if (!input.zones.length || !frame) throw new HttpException(httpStatus.BAD_REQUEST, 'The plan has no zone', 'no_zones');
    const result: Estimate = estimate(input);
    const settings = settingsOf(input);
    const slotLength = (data.layout === 'selfPark' ? settings.selfParkSlot : settings.valetSlot).length;
    const spots = spotsFromLayout(result, input.zones, data.layout as LayoutKey, frame, slotLength);
    if (!spots.length) throw new HttpException(httpStatus.BAD_REQUEST, 'No spot fits the plan', 'no_spots');
    const view = await this.replaceSpots(actor, parkingId, {
      layout: data.layout,
      spots: spots.map(s => ({ ...s, depth: s.depth ?? undefined, fileLength: s.fileLength ?? undefined, stayClass: s.stayClass ?? undefined })),
    });
    return data.applyCapacity ? this.applyCapacity(actor, parkingId) : view;
  }

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw notFound();
    return parking;
  }
}

/** The stored plan as the engine reads it. */
function planInput(plan: ParkingPlan): EstimateInput {
  const landmarks = (plan.landmarks as { kind: string; geometry: { coordinates: [number, number] } }[] | null) ?? [];
  const anchor = landmarks.find(l => l.kind === 'entrance') ?? landmarks.find(l => l.kind === 'handover');
  return {
    anchor: anchor?.geometry?.coordinates ?? null,
    outline: plan.outline as unknown as CapacityStudy['outline'],
    zones: (plan.zones as unknown as CapacityStudy['zones']) ?? [],
    exclusions: (plan.exclusions as unknown as CapacityStudy['exclusions']) ?? [],
    scaleFactor: plan.scaleFactor,
    settings: (plan.settings as unknown as CapacityStudy['settings']) ?? {},
  };
}

function centroid(ring: [number, number][]): [number, number] {
  const pts = ring.length > 4 ? ring.slice(0, 4) : ring;
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}
