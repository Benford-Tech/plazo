import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, ShuttleTracking } from '@/database';
import { can } from '@/domain/roles';
import { sharesPosition } from '@/domain/shuttle-tracking';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { loadPlanCapacity, parkingCapacity, type ParkingCapacity } from './capacity.service';
import { ParkingLocationService, READ_GEOCODE_TIMEOUT_MS, SAVE_GEOCODE_TIMEOUT_MS, type LatLng } from './parking-location.service';

/**
 * The parking with its capacity (09/10/2026): `totalCapacity` stays the declared figure (older apps
 * read it), `effectiveCapacity` is the one used everywhere (plan's files, else spots, else declared)
 * and `bookableCapacity` is taken from it.
 */
export type ParkingSummary = Parking & ParkingCapacity;
/** What GET /internal/parking serves: the summary plus the parking's position (its address's when not placed). */
export type ParkingSummaryWithPosition = ParkingSummary & { lat: number | null; lng: number | null };

const SETTINGS = [
  'name',
  'address',
  'totalCapacity',
  'safetyMarginPct',
  'shuttleTravelMinutes',
  'terminalLeadMinutes',
  'landingDelayMinutes',
] as const;

async function summarize(parking: Parking, client: Prisma.TransactionClient | typeof prisma = prisma): Promise<ParkingSummary> {
  const plan = (await loadPlanCapacity([parking.id], client)).get(parking.id)!;
  return { ...parking, ...parkingCapacity(parking, plan) };
}

@Service()
export class ParkingService {
  public audit = Container.get(AuditService);
  public locations = Container.get(ParkingLocationService);

  /** MVP: one parking per operator in the UI; the data model already allows several. */
  public async getPrimary(actor: AuthenticatedStaff): Promise<ParkingSummary> {
    const parking = await prisma.parking.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return summarize(parking);
  }

  /** The pro space's and the app's read: the plan opens its map on the parking (07/10/2026), so its position comes along. */
  public async getPrimaryWithPosition(actor: AuthenticatedStaff): Promise<ParkingSummaryWithPosition> {
    const summary = await this.getPrimary(actor);
    const position: LatLng | null = await this.locations.locate(summary, READ_GEOCODE_TIMEOUT_MS);
    return { ...summary, lat: position?.lat ?? null, lng: position?.lng ?? null };
  }

  public async update(actor: AuthenticatedStaff, parkingId: string, data: UpdateParkingDto): Promise<ParkingSummary> {
    if (!can(actor.role, 'parking:manage')) {
      throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
    }
    const saved = await prisma.$transaction(async tx => {
      const before = await tx.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
      if (!before) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');

      const after = await tx.parking.update({
        where: { id: parkingId },
        data: {
          name: data.name.trim(),
          address: data.address?.trim() || null,
          totalCapacity: data.totalCapacity,
          safetyMarginPct: data.safetyMarginPct,
          shuttleTravelMinutes: data.shuttleTravelMinutes,
          terminalLeadMinutes: data.terminalLeadMinutes,
          landingDelayMinutes: data.landingDelayMinutes,
        },
      });

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of SETTINGS) {
        if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
      }
      await this.audit.record(actor, { action: 'parking.settings_updated', entityType: 'parking', entityId: parkingId, details: changes as any }, tx);
      // A position geocoded from the old address no longer holds.
      if (changes.address) await this.locations.store(parkingId, null, tx);
      return { summary: await summarize(after, tx), addressChanged: !!changes.address };
    });
    // The new address's position for the site's map (never fails the save).
    if (saved.addressChanged) await this.locations.locate(saved.summary, SAVE_GEOCODE_TIMEOUT_MS);
    return saved.summary;
  }

  /** R-B (07/10/2026): who sees the position of the parking's shuttles (managers, audited). */
  public async setShuttleTracking(actor: AuthenticatedStaff, parkingId: string, tracking: ShuttleTracking): Promise<ParkingSummary> {
    if (!can(actor.role, 'parking:manage')) {
      throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
    }
    return prisma.$transaction(async tx => {
      const before = await tx.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
      if (!before) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
      const after = await tx.parking.update({ where: { id: parkingId }, data: { shuttleTracking: tracking } });
      // "Pas de suivi": the trips under way forget the position they already sent.
      if (!sharesPosition(tracking)) {
        await tx.shuttleTrip.updateMany({
          where: { parkingId, status: 'running' },
          data: { lat: null, lng: null, accuracyM: null, positionRecordedAt: null },
        });
      }
      if (before.shuttleTracking !== tracking) {
        await this.audit.record(
          actor,
          {
            action: 'parking.settings_updated',
            entityType: 'parking',
            entityId: parkingId,
            details: { shuttleTracking: { from: before.shuttleTracking, to: tracking } },
          },
          tx,
        );
      }
      return summarize(after, tx);
    });
  }
}
