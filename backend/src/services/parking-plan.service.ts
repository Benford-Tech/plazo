import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ParkingPlan, ParkingSpot, Prisma } from '@/database';
import { ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
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
    const json = (value: unknown) => value as Prisma.InputJsonValue;
    const patch = {
      ...(data.outline !== undefined ? { outline: data.outline === null ? Prisma.DbNull : json(data.outline) } : {}),
      ...(data.parcels != null ? { parcels: json(data.parcels) } : {}),
      ...(data.scaleFactor != null ? { scaleFactor: data.scaleFactor } : {}),
      ...(data.zones != null ? { zones: json(data.zones) } : {}),
      ...(data.exclusions != null ? { exclusions: json(data.exclusions) } : {}),
      ...(data.settings != null ? { settings: json(data.settings) } : {}),
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

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw notFound();
    return parking;
  }
}

function centroid(ring: [number, number][]): [number, number] {
  const pts = ring.length > 4 ? ring.slice(0, 4) : ring;
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}
