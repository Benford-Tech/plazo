import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking } from '@/database';
import { bookableCapacity } from '@/domain/capacity';
import { can } from '@/domain/roles';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

export type ParkingSummary = Parking & { bookableCapacity: number };

const SETTINGS = ['name', 'address', 'totalCapacity', 'safetyMarginPct', 'shuttleTravelMinutes'] as const;

function summarize(parking: Parking): ParkingSummary {
  return { ...parking, bookableCapacity: bookableCapacity(parking.totalCapacity, parking.safetyMarginPct) };
}

@Service()
export class ParkingService {
  public audit = Container.get(AuditService);

  /** MVP: one parking per operator in the UI; the data model already allows several. */
  public async getPrimary(actor: AuthenticatedStaff): Promise<ParkingSummary> {
    const parking = await prisma.parking.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return summarize(parking);
  }

  public async update(actor: AuthenticatedStaff, parkingId: string, data: UpdateParkingDto): Promise<ParkingSummary> {
    if (!can(actor.role, 'parking:manage')) {
      throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
    }
    return prisma.$transaction(async tx => {
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
        },
      });

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of SETTINGS) {
        if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
      }
      await this.audit.record(actor, { action: 'parking.settings_updated', entityType: 'parking', entityId: parkingId, details: changes as any }, tx);
      return summarize(after);
    });
  }
}
