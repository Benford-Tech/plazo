import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking } from '@/database';
import { bookableCapacity } from '@/domain/capacity';
import { can } from '@/domain/roles';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { ParkingLocationService, READ_GEOCODE_TIMEOUT_MS, SAVE_GEOCODE_TIMEOUT_MS, type LatLng } from './parking-location.service';

export type ParkingSummary = Parking & { bookableCapacity: number };
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

function summarize(parking: Parking): ParkingSummary {
  return { ...parking, bookableCapacity: bookableCapacity(parking.totalCapacity, parking.safetyMarginPct) };
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
      return { summary: summarize(after), addressChanged: !!changes.address };
    });
    // The new address's position for the site's map (never fails the save).
    if (saved.addressChanged) await this.locations.locate(saved.summary, SAVE_GEOCODE_TIMEOUT_MS);
    return saved.summary;
  }
}
