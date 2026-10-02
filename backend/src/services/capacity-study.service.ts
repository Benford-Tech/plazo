import httpStatus from 'http-status';
import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Study not found', 'not_found');

const createdBy = { select: { id: true, name: true } } as const;

/**
 * Capacity studies of the platform owner's internal tool. They are platform-level data, NOT
 * filtered by operatorId: every platform admin sees every study (the routes are restricted to
 * PLATFORM_ADMIN_EMAILS). Not audited: audit_logs rows belong to an operator (operatorId is
 * required), and these studies belong to none.
 */
@Service()
export class CapacityStudyService {
  public async list() {
    const studies = await prisma.capacityStudy.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: { id: true, name: true, parcels: true, results: true, createdAt: true, updatedAt: true, createdBy },
    });
    return studies;
  }

  public async get(id: string) {
    const study = await prisma.capacityStudy.findUnique({ where: { id }, include: { createdBy } });
    if (!study) throw notFound();
    return study;
  }

  public async create(actor: AuthenticatedStaff, data: CreateCapacityStudyDto) {
    return prisma.capacityStudy.create({
      data: { ...this.toData(data), name: data.name.trim(), createdBy: { connect: { id: actor.id } } },
      include: { createdBy },
    });
  }

  public async update(id: string, data: UpdateCapacityStudyDto) {
    await this.get(id);
    return prisma.capacityStudy.update({ where: { id }, data: this.toData(data), include: { createdBy } });
  }

  public async remove(id: string) {
    await this.get(id);
    await prisma.capacityStudy.delete({ where: { id } });
  }

  // `null` clears the outline; for the other fields (never null in the database) it means "unchanged".
  private toData(data: UpdateCapacityStudyDto) {
    const json = (value: unknown) => value as Prisma.InputJsonValue;
    return {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.outline !== undefined ? { outline: data.outline === null ? Prisma.DbNull : json(data.outline) } : {}),
      ...(data.parcels != null ? { parcels: json(data.parcels) } : {}),
      ...(data.scaleFactor != null ? { scaleFactor: data.scaleFactor } : {}),
      ...(data.zones != null ? { zones: json(data.zones) } : {}),
      ...(data.exclusions != null ? { exclusions: json(data.exclusions) } : {}),
      ...(data.settings != null ? { settings: json(data.settings) } : {}),
      ...(data.results != null ? { results: json(data.results) } : {}),
      ...(data.carMarkers != null ? { carMarkers: json(data.carMarkers) } : {}),
    };
  }
}
