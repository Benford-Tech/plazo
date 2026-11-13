import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { PromotionFilters } from '@/domain/promotion';
import { ValidationException } from '@/middlewares/validation.middleware';

/** A phone not heard of for 13 months is forgotten (its consent with it). */
const FORGOTTEN_AFTER_MS = 400 * 86400_000;
const SUBSCRIPTION_ID = /^[A-Za-z0-9_-]{8,100}$/;

/**
 * The Plazo app's phones, booking or not (13/11/2026, promotions choix A): the « Offres et bons plans » switch of Plus ›
 * Notifications, off by default, with when it was changed; only the phones that said yes receive a promotion.
 */
@Service()
export class TravellerAppDeviceService {
  /** PUT /public/app-devices/:id: the app tells it exists (start-up) or changes the switch. */
  public async register(subscriptionId: string, data: { offers?: boolean; platform?: string }) {
    if (!SUBSCRIPTION_ID.test(subscriptionId)) {
      throw new ValidationException({ subscriptionId: 'invalid' });
    }
    const now = new Date();
    const existing = await prisma.travellerAppDevice.findUnique({ where: { subscriptionId } });
    const changed = data.offers !== undefined && data.offers !== (existing?.offers ?? false);
    const row = await prisma.travellerAppDevice.upsert({
      where: { subscriptionId },
      create: {
        subscriptionId,
        platform: data.platform ?? null,
        offers: data.offers ?? false,
        offersAt: data.offers !== undefined ? now : null,
        lastSeenAt: now,
      },
      update: {
        lastSeenAt: now,
        ...(data.platform ? { platform: data.platform } : {}),
        ...(changed ? { offers: data.offers, offersAt: now } : {}),
      },
    });
    return { offers: row.offers, offersAt: row.offersAt?.toISOString() ?? null };
  }

  /** DELETE /public/app-devices/:id: the phone is forgotten (the app's notifications turned off). */
  public async forget(subscriptionId: string): Promise<void> {
    await prisma.travellerAppDevice.deleteMany({ where: { subscriptionId } });
  }

  /** The phones a promotion goes to: offers accepted, then the filters. */
  public async offerIds(filters: PromotionFilters = {}, now = new Date()): Promise<string[]> {
    const where: Prisma.TravellerAppDeviceWhereInput = { offers: true };
    const and: Prisma.Sql[] = [];
    if (filters.airport) {
      and.push(Prisma.sql`EXISTS (
        SELECT 1 FROM traveller_devices td
        JOIN reservations r ON r.id = td."reservationId"
        JOIN listings l ON l."parkingId" = r."parkingId"
        JOIN airports a ON a.id = l."airportId"
        WHERE td."subscriptionId" = d."subscriptionId" AND a.slug = ${filters.airport} AND r.status::text NOT IN ('pending_payment')
      )`);
    }
    if (filters.noUpcoming) {
      and.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM traveller_devices td
        JOIN reservations r ON r.id = td."reservationId"
        WHERE td."subscriptionId" = d."subscriptionId" AND r."returnAt" >= ${now}
          AND r.status::text NOT IN ('cancelled', 'no_show', 'returned') AND r."deletedAt" IS NULL
      )`);
    }
    if (and.length === 0) {
      const rows = await prisma.travellerAppDevice.findMany({ where, select: { subscriptionId: true } });
      return rows.map(r => r.subscriptionId);
    }
    const rows = await prisma.$queryRaw<{ subscriptionId: string }[]>`
      SELECT d."subscriptionId" FROM traveller_app_devices d
      WHERE d.offers = true AND ${Prisma.join(and, ' AND ')}`;
    return rows.map(r => r.subscriptionId);
  }

  /** Nightly: phones not heard of for 13 months. */
  public async purge(now = new Date()): Promise<number> {
    const { count } = await prisma.travellerAppDevice.deleteMany({ where: { lastSeenAt: { lt: new Date(now.getTime() - FORGOTTEN_AFTER_MS) } } });
    return count;
  }
}
