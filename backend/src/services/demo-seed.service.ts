import { hash } from 'bcrypt';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS } from '@/config';
import prisma, { Prisma } from '@/database';
import { defaultBookingNotify } from '@/domain/roles';
import {
  DEMO_AIRPORT_CODE,
  DEMO_BOOKINGS,
  DEMO_EMAIL_DOMAIN,
  DEMO_MANAGER_NAME,
  DEMO_OPERATORS,
  DemoBooking,
  DemoOperator,
  demoPricing,
} from '@/domain/demo-data';
import { billableDays, quoteCents } from '@/domain/pricing';
import { formatFlight, plateKey } from '@/domain/reservation';
import { addDays, localDate, parseInstant } from '@/domain/time';
import { allocateInboundSlug } from './inbound-slug';
import { ParkingLocationService } from './parking-location.service';

export const DEMO_PASSWORD_MIN_LENGTH = 10;

export interface DemoApplyResult {
  operatorsCreated: number;
  operatorsUpdated: number;
  bookingsCreated: number;
  bookingsUpdated: number;
}

export interface DemoArchiveResult {
  /** Demo operators that were active and are now suspended. */
  operators: number;
}

export interface DemoRemoveResult {
  operators: number;
  parkings: number;
  reservations: number;
  staff: number;
}

/** Thrown when asked to remove an operator that the demo seed did not create. */
export class NotDemoOperatorError extends Error {
  constructor(public readonly operatorId: string) {
    super('Only operators flagged as demo can be removed by the demo seed');
    this.name = 'NotDemoOperatorError';
  }
}

export const demoManagerEmail = (slug: string) => `demo-${slug.replace(/^demo-/, '')}@${DEMO_EMAIL_DOMAIN}`;

/**
 * Fictional operators, listings and bookings for trying the site and the apps (see
 * src/domain/demo-data.ts). `apply` is idempotent (operators by slug, bookings by reference),
 * `archive` suspends the demo operators (kept in the database, `apply` restores them) and
 * `remove` only ever deletes what carries the `isDemo` flag.
 */
@Service()
export class DemoSeedService {
  public locations = Container.get(ParkingLocationService);

  /** Creates or refreshes the demo operators and bookings. The password is only used for new accounts. */
  public async apply(password: string): Promise<DemoApplyResult> {
    if (password.length < DEMO_PASSWORD_MIN_LENGTH) throw new Error(`The demo password must be at least ${DEMO_PASSWORD_MIN_LENGTH} characters long`);
    const airport = await prisma.airport.findUnique({ where: { code: DEMO_AIRPORT_CODE } });
    if (!airport) throw new Error(`Airport ${DEMO_AIRPORT_CODE} is missing: run the migrations first`);
    const hashed = await hash(password, BCRYPT_ROUNDS);

    const result: DemoApplyResult = { operatorsCreated: 0, operatorsUpdated: 0, bookingsCreated: 0, bookingsUpdated: 0 };
    let firstParkingId: string | null = null;
    for (const demo of DEMO_OPERATORS) {
      const { parkingId, created } = await this.upsertOperator(demo, airport.id, hashed);
      result[created ? 'operatorsCreated' : 'operatorsUpdated'] += 1;
      firstParkingId ??= parkingId;
    }
    if (firstParkingId) {
      for (const booking of DEMO_BOOKINGS) {
        const created = await this.upsertBooking(firstParkingId, booking);
        result[created ? 'bookingsCreated' : 'bookingsUpdated'] += 1;
      }
    }
    return result;
  }

  private async upsertOperator(demo: DemoOperator, airportId: string, hashedPassword: string): Promise<{ parkingId: string; created: boolean }> {
    const existing = await prisma.operator.findUnique({
      where: { slug: demo.slug },
      include: { parkings: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (existing && !existing.isDemo) throw new NotDemoOperatorError(existing.id);
    const email = demoManagerEmail(demo.slug);
    const grid = demoPricing(demo.pricing);

    const parkingId = await prisma.$transaction(async tx => {
      // Every operator has its inbound address from the start (08/10/2026); older demo operators get theirs here.
      const operator = existing
        ? await tx.operator.update({
            where: { id: existing.id },
            data: {
              name: demo.name,
              status: 'active',
              suspendedAt: null,
              isDemo: true,
              ...(existing.inboundSlug ? {} : { inboundSlug: await allocateInboundSlug(tx, demo.slug) }),
            },
          })
        : await tx.operator.create({
            data: { name: demo.name, slug: demo.slug, isDemo: true, inboundSlug: await allocateInboundSlug(tx, demo.slug) },
          });

      const parkingData = {
        name: demo.parkingName,
        address: demo.address,
        totalCapacity: demo.totalCapacity,
        shuttleTravelMinutes: demo.shuttleTravelMinutes,
        returnMeetingLabel: demo.meetingPoint.label,
        returnMeetingInstructions: demo.meetingPoint.instructions,
        returnMeetingPhotoUrl: null,
        extraDayPriceCents: grid.extraDayPriceCents,
        // The demo shows every feature of the site, "EN DIRECT" included (R-B + I-C).
        shuttleTracking: 'everyone' as const,
      };
      const parking = existing?.parkings[0]
        ? await tx.parking.update({ where: { id: existing.parkings[0].id }, data: parkingData })
        : await tx.parking.create({ data: { operatorId: operator.id, ...parkingData } });

      await this.locations.store(parking.id, demo.location, tx);
      await tx.$executeRaw`
        UPDATE parkings SET "returnMeetingPoint" = ST_SetSRID(ST_MakePoint(${demo.meetingPoint.location.lng}, ${demo.meetingPoint.location.lat}), 4326)
        WHERE id = ${parking.id}`;

      await tx.pricingTier.deleteMany({ where: { parkingId: parking.id } });
      await tx.pricingTier.createMany({ data: grid.tiers.map(t => ({ parkingId: parking.id, ...t })) });

      const listingData = {
        airportId,
        slug: demo.listing.slug,
        status: 'published' as const,
        reviewMessage: null,
        submittedAt: new Date(),
        reviewedAt: new Date(),
        title: demo.listing.title,
        description: demo.listing.description,
        services: [...demo.listing.services],
        shuttleMinutes: demo.listing.shuttleMinutes,
        distanceKm: demo.listing.distanceKm,
        openingHours: demo.listing.openingHours,
        contactPhone: demo.listing.contactPhone,
        cancellationPolicy: demo.listing.cancellationPolicy,
        photos: demo.listing.photos,
      };
      await tx.listing.upsert({ where: { parkingId: parking.id }, create: { parkingId: parking.id, ...listingData }, update: listingData });

      // The manager keeps its password (and whatever it changed) once it exists.
      const manager = await tx.staff.findUnique({ where: { email } });
      if (!manager) {
        await tx.staff.create({
          data: {
            operatorId: operator.id,
            email,
            name: DEMO_MANAGER_NAME,
            role: 'manager',
            password: hashedPassword,
            emailVerifiedAt: new Date(),
            bookingNotify: defaultBookingNotify('manager'),
          },
        });
      } else if (manager.operatorId !== operator.id) {
        throw new Error(`The account ${email} belongs to another operator`);
      } else {
        await tx.staff.update({ where: { id: manager.id }, data: { isActive: true } });
      }

      const vehicle = await tx.shuttleVehicle.findFirst({ where: { operatorId: operator.id } });
      const vehicleData = { model: demo.shuttle.model, colour: demo.shuttle.colour, plate: demo.shuttle.plate };
      if (vehicle) await tx.shuttleVehicle.update({ where: { id: vehicle.id }, data: vehicleData });
      else await tx.shuttleVehicle.create({ data: { operatorId: operator.id, ...vehicleData } });

      return parking.id;
    });
    return { parkingId, created: !existing };
  }

  /** A demo booking on the parking, with dates recomputed from today so the planning stays current. */
  private async upsertBooking(parkingId: string, booking: DemoBooking): Promise<boolean> {
    const parking = await prisma.parking.findUniqueOrThrow({ where: { id: parkingId }, include: { pricingTiers: true } });
    const today = localDate(new Date(), parking.timezone);
    const arrivalAt = parseInstant(`${addDays(today, booking.arrivalInDays)}T${booking.arrivalTime}`, parking.timezone);
    const returnAt = parseInstant(`${addDays(today, booking.arrivalInDays + booking.stayDays)}T${booking.returnTime}`, parking.timezone);
    if (!arrivalAt || !returnAt) throw new Error(`Invalid demo booking dates for ${booking.reference}`);
    const priceCents = quoteCents(parking.pricingTiers, parking.extraDayPriceCents, billableDays(arrivalAt, returnAt, parking.timezone));

    const data = {
      arrivalAt,
      returnAt,
      passengers: booking.passengers,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      plate: booking.plate,
      plateKey: plateKey(booking.plate),
      returnFlight: formatFlight(booking.returnFlight) ?? booking.returnFlight,
      priceCents,
    };
    const existing = await prisma.reservation.findUnique({ where: { reference: booking.reference } });
    if (existing) {
      if (existing.parkingId !== parkingId) throw new Error(`Reference ${booking.reference} is used by another parking`);
      // Dates and flight are refreshed; the status the staff gave it is kept.
      await prisma.reservation.update({ where: { id: existing.id }, data });
      return false;
    }
    await prisma.reservation.create({
      data: {
        reference: booking.reference,
        operatorId: parking.operatorId,
        parkingId,
        channel: 'plazo',
        status: 'upcoming',
        cancellationPolicy: 'free_24h',
        confirmationSentAt: new Date(),
        ...data,
      },
    });
    return true;
  }

  /**
   * Suspends every active demo operator, exactly as the platform admin suspends an operator
   * (`status: 'suspended'`, `suspendedAt`): their listings leave the site and the apps, their staff can
   * no longer sign in, and nothing is deleted, so `apply` brings them back. Idempotent; never touches
   * an operator that is not a demo.
   */
  public async archive(): Promise<DemoArchiveResult> {
    const archived = await prisma.operator.updateMany({
      where: { isDemo: true, status: 'active' },
      data: { status: 'suspended', suspendedAt: new Date() },
    });
    return { operators: archived.count };
  }

  /** Deletes every operator flagged as demo, with everything that hangs from it (cascades). */
  public async remove(): Promise<DemoRemoveResult> {
    const operators = await prisma.operator.findMany({ where: { isDemo: true }, select: { id: true } });
    const result: DemoRemoveResult = { operators: 0, parkings: 0, reservations: 0, staff: 0 };
    for (const { id } of operators) {
      const counts = await this.removeOperator(id);
      result.operators += 1;
      result.parkings += counts.parkings;
      result.reservations += counts.reservations;
      result.staff += counts.staff;
    }
    return result;
  }

  /** Deletes one operator; refuses (NotDemoOperatorError) one that is not a demo. */
  public async removeOperator(id: string): Promise<Omit<DemoRemoveResult, 'operators'>> {
    const operator = await prisma.operator.findUnique({
      where: { id },
      include: { _count: { select: { parkings: true, reservations: true, staff: true } } },
    });
    if (!operator) return { parkings: 0, reservations: 0, staff: 0 };
    if (!operator.isDemo) throw new NotDemoOperatorError(id);
    // The guard above is re-checked by the delete itself: a flag removed meanwhile keeps the operator.
    const deleted = await prisma.operator.deleteMany({ where: { id, isDemo: true } satisfies Prisma.OperatorWhereInput });
    if (deleted.count === 0) throw new NotDemoOperatorError(id);
    return { parkings: operator._count.parkings, reservations: operator._count.reservations, staff: operator._count.staff };
  }
}
