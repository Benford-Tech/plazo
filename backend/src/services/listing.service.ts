import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PLATFORM_COMMISSION_BPS } from '@/config';
import prisma from '@/database';
import { can } from '@/domain/roles';
import { UpdateListingDto, UpdatePricingDto } from '@/dtos/listing.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { ParkingService } from './parking.service';

/** The operator's public page on Plazo and its pricing grid. */
@Service()
export class ListingService {
  public audit = Container.get(AuditService);
  public parkings = Container.get(ParkingService);

  private requireManager(actor: AuthenticatedStaff) {
    if (!can(actor.role, 'parking:manage')) throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
  }

  public async getListing(actor: AuthenticatedStaff) {
    const parking = await this.parkings.getPrimary(actor);
    const listing = await prisma.listing.findUnique({ where: { parkingId: parking.id }, include: { airport: true } });
    return { listing, parking: { id: parking.id, name: parking.name, address: parking.address, shuttleTravelMinutes: parking.shuttleTravelMinutes } };
  }

  public async updateListing(actor: AuthenticatedStaff, data: UpdateListingDto) {
    this.requireManager(actor);
    const parking = await this.parkings.getPrimary(actor);
    const airport = await prisma.airport.findUnique({ where: { code: data.airportCode } });
    if (!airport) throw new ValidationException({ airportCode: 'unknown_airport' });

    const taken = await prisma.listing.findFirst({ where: { airportId: airport.id, slug: data.slug, NOT: { parkingId: parking.id } } });
    if (taken) throw new ValidationException({ slug: 'slug_taken' });

    // A page goes live only when travellers can actually book it.
    if (data.published) {
      const tiers = await prisma.pricingTier.count({ where: { parkingId: parking.id } });
      if (!tiers) throw new HttpException(httpStatus.BAD_REQUEST, 'Set prices before publishing', 'pricing_required');
    }

    const values = {
      airportId: airport.id,
      slug: data.slug,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      services: [...new Set(data.services)],
      shuttleMinutes: data.shuttleMinutes ?? null,
      distanceKm: data.distanceKm ?? null,
      openingHours: data.openingHours?.trim() || null,
      // The pro form does not edit it yet: keep it when the field is not sent.
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone?.trim() || null }),
      cancellationPolicy: data.cancellationPolicy,
      photos: data.photos,
      published: data.published,
    };
    const listing = await prisma.listing.upsert({
      where: { parkingId: parking.id },
      create: { parkingId: parking.id, ...values },
      update: values,
      include: { airport: true },
    });
    await this.audit.record(actor, {
      action: 'listing.updated',
      entityType: 'listing',
      entityId: listing.id,
      details: { published: listing.published, slug: listing.slug },
    });
    return listing;
  }

  public async getPricing(actor: AuthenticatedStaff) {
    const parking = await this.parkings.getPrimary(actor);
    const [tiers, operator] = await Promise.all([
      prisma.pricingTier.findMany({ where: { parkingId: parking.id }, orderBy: { days: 'asc' }, select: { days: true, priceCents: true } }),
      prisma.operator.findUnique({ where: { id: actor.operatorId }, select: { commissionBps: true } }),
    ]);
    // Shown to the operator next to the grid; null while no commission is configured.
    const commissionBps = operator?.commissionBps ?? PLATFORM_COMMISSION_BPS;
    return { tiers, extraDayPriceCents: parking.extraDayPriceCents, commissionBps };
  }

  /** Replaces the whole grid (it is edited as one table). */
  public async updatePricing(actor: AuthenticatedStaff, data: UpdatePricingDto) {
    this.requireManager(actor);
    const parking = await this.parkings.getPrimary(actor);
    const days = data.tiers.map(t => t.days);
    if (new Set(days).size !== days.length) throw new ValidationException({ tiers: 'duplicate_days' });

    await prisma.$transaction([
      prisma.pricingTier.deleteMany({ where: { parkingId: parking.id } }),
      prisma.pricingTier.createMany({ data: data.tiers.map(t => ({ parkingId: parking.id, days: t.days, priceCents: t.priceCents })) }),
      prisma.parking.update({ where: { id: parking.id }, data: { extraDayPriceCents: data.extraDayPriceCents ?? null } }),
    ]);
    await this.audit.record(actor, {
      action: 'pricing.updated',
      entityType: 'parking',
      entityId: parking.id,
      details: { tiers: data.tiers.length, extraDayPriceCents: data.extraDayPriceCents ?? null },
    });
    return this.getPricing(actor);
  }
}
