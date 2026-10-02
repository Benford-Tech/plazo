import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PLATFORM_COMMISSION_BPS } from '@/config';
import prisma, { Prisma } from '@/database';
import { ListingAction, nextListingStatus } from '@/domain/listing';
import { can } from '@/domain/roles';
import { UpdateListingDto, UpdatePricingDto } from '@/dtos/listing.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { ParkingLocationService, SAVE_GEOCODE_TIMEOUT_MS } from './parking-location.service';
import { ParkingService } from './parking.service';

/** The operator's public page on Plazo and its pricing grid. */
@Service()
export class ListingService {
  public audit = Container.get(AuditService);
  public parkings = Container.get(ParkingService);
  public locations = Container.get(ParkingLocationService);

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
    };
    const before = await prisma.listing.findUnique({ where: { parkingId: parking.id } });
    // The status never changes here: a published page stays online while edited.
    const listing = await prisma.listing.upsert({
      where: { parkingId: parking.id },
      create: { parkingId: parking.id, ...values },
      update: values,
      include: { airport: true },
    });
    const changed = before
      ? (Object.keys(values) as (keyof typeof values)[]).filter(k => JSON.stringify(before[k]) !== JSON.stringify(values[k]))
      : Object.keys(values);
    await this.audit.record(actor, {
      action: before ? 'listing.updated' : 'listing.created',
      entityType: 'listing',
      entityId: listing.id,
      details: { status: listing.status, slug: listing.slug, changed },
    });
    // Position on the site's map, from the parking's address when it has none yet (never fails the save).
    await this.locations.locate(parking, SAVE_GEOCODE_TIMEOUT_MS);
    return listing;
  }

  /** The operator sends its page for validation by the platform (draft or refused). */
  public async submit(actor: AuthenticatedStaff) {
    this.requireManager(actor);
    const parking = await this.parkings.getPrimary(actor);
    const listing = await prisma.listing.findUnique({ where: { parkingId: parking.id } });
    if (!listing) throw new HttpException(httpStatus.BAD_REQUEST, 'Fill in the listing first', 'listing_required');
    // Only bookable pages go online.
    const tiers = await prisma.pricingTier.count({ where: { parkingId: parking.id } });
    if (!tiers) throw new HttpException(httpStatus.BAD_REQUEST, 'Set prices before sending the listing', 'pricing_required');
    // The person sending it must have confirmed their email (a platform admin viewing the space has).
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id }, select: { emailVerifiedAt: true } });
    if (!me.emailVerifiedAt) throw new HttpException(httpStatus.FORBIDDEN, 'Confirm your email first', 'email_not_verified');
    return this.transition(actor, listing.id, 'submit', { submittedAt: new Date(), reviewMessage: null });
  }

  /** The operator takes its page offline, or cancels its request for validation. */
  public async withdraw(actor: AuthenticatedStaff) {
    this.requireManager(actor);
    const parking = await this.parkings.getPrimary(actor);
    const listing = await prisma.listing.findUnique({ where: { parkingId: parking.id } });
    if (!listing) throw new HttpException(httpStatus.NOT_FOUND, 'Listing not found', 'not_found');
    return this.transition(actor, listing.id, 'withdraw', {});
  }

  /**
   * Moves a listing along the review flow (domain/listing.ts), atomically: 409 invalid_transition
   * when its status does not allow the action (e.g. validated twice at once). Audited for the
   * listing's operator, with the actor's staff id (a platform admin for approve/reject/unpublish).
   */
  public async transition(
    actor: { id: string; operatorId: string; actingAs?: AuthenticatedStaff['actingAs'] },
    listingId: string,
    action: ListingAction,
    data: Prisma.ListingUpdateManyMutationInput,
  ) {
    const current = await prisma.listing.findUnique({ where: { id: listingId }, include: { parking: { select: { operatorId: true } } } });
    if (!current) throw new HttpException(httpStatus.NOT_FOUND, 'Listing not found', 'not_found');
    const to = nextListingStatus(current.status, action);
    const invalid = () => new HttpException(httpStatus.CONFLICT, 'This listing cannot change to that status now', 'invalid_transition');
    if (!to) throw invalid();
    const { count } = await prisma.listing.updateMany({ where: { id: listingId, status: current.status }, data: { ...data, status: to } });
    if (!count) throw invalid();
    await this.audit.record(
      { ...actor, operatorId: current.parking.operatorId },
      { action: `listing.${action}`, entityType: 'listing', entityId: listingId, details: { from: current.status, to } },
    );
    return prisma.listing.findUniqueOrThrow({ where: { id: listingId }, include: { airport: true } });
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
