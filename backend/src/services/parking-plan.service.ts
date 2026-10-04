import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ParkingPlan, ParkingSpot, Prisma } from '@/database';
import { estimate, frameFor, type Estimate, type EstimateInput } from '@/domain/layout/estimate';
import { spotsFromLayout } from '@/domain/layout/numbering';
import { settingsOf, type CapacityStudy, type LayoutKey } from '@/domain/layout/types';
import { GenerateSpotsDto, ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

export interface ParkingPlanView {
  plan: ParkingPlan;
  spots: ParkingSpot[];
  /** Active spots, what "Recalculer la capacité" would set. */
  activeSpots: number;
  totalCapacity: number;
}

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');

/**
 * The operator's parking plan (bloc 2, step "Plan"). Always scoped to the parking of the actor's
 * operator: the plan is created empty on first read. The geometry work (layouts, numbering) is done
 * by the pro space; the API stores the plan and its spots and keeps the declared capacity in line.
 */
@Service()
export class ParkingPlanService {
  public audit = Container.get(AuditService);

  public async get(actor: AuthenticatedStaff, parkingId: string): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const plan =
      (await prisma.parkingPlan.findUnique({ where: { parkingId: parking.id } })) ??
      (await prisma.parkingPlan.create({ data: { parkingId: parking.id } }));
    const spots = await prisma.parkingSpot.findMany({
      where: { parkingId: parking.id },
      orderBy: [{ zoneId: 'asc' }, { row: 'asc' }, { index: 'asc' }],
    });
    return { plan, spots, activeSpots: spots.filter(s => s.active).length, totalCapacity: parking.totalCapacity };
  }

  public async update(actor: AuthenticatedStaff, parkingId: string, data: UpdateParkingPlanDto): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const existing = data.settings != null ? await prisma.parkingPlan.findUnique({ where: { parkingId: parking.id }, select: { settings: true } }) : null;
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
    return this.get(actor, parkingId);
  }

  /** A new generation: every spot is replaced. Codes must be unique within the parking. */
  public async replaceSpots(actor: AuthenticatedStaff, parkingId: string, data: ReplaceSpotsDto): Promise<ParkingPlanView> {
    const parking = await this.parkingOf(actor, parkingId);
    const codes = new Set<string>();
    for (const s of data.spots) {
      if (codes.has(s.code)) throw new HttpException(httpStatus.BAD_REQUEST, `Duplicate spot code ${s.code}`, 'duplicate_code');
      codes.add(s.code);
    }
    await prisma.$transaction(async tx => {
      await tx.parkingPlan.upsert({ where: { parkingId: parking.id }, create: { parkingId: parking.id }, update: {} });
      await tx.parkingSpot.deleteMany({ where: { parkingId: parking.id } });
      if (data.spots.length) {
        await tx.parkingSpot.createMany({
          data: data.spots.map(s => {
            const [lon, lat] = centroid(s.geometry);
            return {
              parkingId: parking.id,
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
            };
          }),
        });
      }
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

  /** Sets the declared capacity to the number of active spots. */
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
