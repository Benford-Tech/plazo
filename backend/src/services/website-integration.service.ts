import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import { billableDays, quoteCents } from '@/domain/pricing';
import { parseInstant } from '@/domain/time';
import { hashSiteKey, looksLikeSiteKey, newSiteKey, readSiteBooking, SHOWN_KEY_LENGTH, siteHostOf } from '@/domain/website-integration';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { CapacityService } from './capacity.service';
import { ReservationService } from './reservation.service';
import { WordpressPluginService } from './wordpress-plugin.service';

const TOUCH_EVERY_MS = 5 * 60 * 1000;
const unknownKey = () => new HttpException(httpStatus.UNAUTHORIZED, 'Unknown site key', 'invalid_site_key');

/**
 * Site du parking (19/11/2026, niveau 2 « l'extension WordPress Plazo »): the key of the parking's WordPress site (Parking ›
 * Réglages), the places and price of a stay, and the bookings it creates (channel `website`, paid at the parking).
 */
@Service()
export class WebsiteIntegrationService {
  public audit = Container.get(AuditService);
  public capacity = Container.get(CapacityService);
  public reservations = Container.get(ReservationService);

  // ---- The staff's card ----------------------------------------------------------------------------------------------

  public async view(actor: AuthenticatedStaff) {
    const row = await prisma.websiteIntegration.findUnique({ where: { operatorId: actor.operatorId } });
    return {
      connected: !!row,
      keyPrefix: row?.keyPrefix ?? null,
      createdAt: row?.createdAt.toISOString() ?? null,
      lastUsedAt: row?.lastUsedAt?.toISOString() ?? null,
      lastBookingAt: row?.lastBookingAt?.toISOString() ?? null,
      siteHost: row?.siteHost ?? null,
      pluginVersion: WordpressPluginService.VERSION,
    };
  }

  /** « Créer la clé » / « Nouvelle clé »: the key is shown once; a new one stops the old one at once. */
  public async rotate(actor: AuthenticatedStaff) {
    const key = newSiteKey();
    const data = { keyHash: hashSiteKey(key), keyPrefix: key.slice(0, SHOWN_KEY_LENGTH), createdById: actor.id, createdAt: new Date() };
    const existing = await prisma.websiteIntegration.findUnique({ where: { operatorId: actor.operatorId }, select: { id: true } });
    await prisma.websiteIntegration.upsert({
      where: { operatorId: actor.operatorId },
      create: { operatorId: actor.operatorId, ...data },
      update: { ...data, lastUsedAt: null },
    });
    await this.audit.record(actor, {
      action: existing ? 'website_integration.key_renewed' : 'website_integration.key_created',
      entityType: 'website_integration',
    });
    return { key, ...(await this.view(actor)) };
  }

  public async revoke(actor: AuthenticatedStaff) {
    const { count } = await prisma.websiteIntegration.deleteMany({ where: { operatorId: actor.operatorId } });
    if (count) await this.audit.record(actor, { action: 'website_integration.key_revoked', entityType: 'website_integration' });
    return this.view(actor);
  }

  // ---- The plugin's calls ----------------------------------------------------------------------------------------------

  /** The operator of a key (an active, unarchived one), its first parking, its prices. */
  private async resolve(key: unknown) {
    if (!looksLikeSiteKey(key)) throw unknownKey();
    const row = await prisma.websiteIntegration.findUnique({
      where: { keyHash: hashSiteKey(key) },
      include: { operator: { select: { id: true, name: true, status: true, archivedAt: true } } },
    });
    if (!row) throw unknownKey();
    if (row.operator.status !== 'active' || row.operator.archivedAt) {
      throw new HttpException(httpStatus.FORBIDDEN, 'This parking does not take bookings', 'operator_inactive');
    }
    const parking = await prisma.parking.findFirst({
      where: { operatorId: row.operatorId },
      orderBy: { createdAt: 'asc' },
      include: { pricingTiers: { select: { days: true, priceCents: true } } },
    });
    if (!parking) throw new HttpException(httpStatus.CONFLICT, 'The parking is not set up yet', 'parking_missing');
    if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
      await prisma.websiteIntegration.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
    }
    return { row, parking };
  }

  /** The plugin checks its key: the parking's name, to show « Connecté à … ». */
  public async status(key: unknown) {
    const { row, parking } = await this.resolve(key);
    return { connected: true, operatorName: row.operator.name, parkingName: parking.name, timezone: parking.timezone };
  }

  /** Places and price of a stay (local dates of the parking, « YYYY-MM-DDTHH:mm »): the grid price, night fees aside. */
  public async quote(key: unknown, query: { arrivalAt?: unknown; returnAt?: unknown }) {
    const { parking } = await this.resolve(key);
    const arrivalAt = typeof query.arrivalAt === 'string' ? parseInstant(query.arrivalAt, parking.timezone) : null;
    const returnAt = typeof query.returnAt === 'string' ? parseInstant(query.returnAt, parking.timezone) : null;
    const fields: Record<string, string> = {};
    if (!arrivalAt) fields.arrivalAt = 'invalid_datetime';
    if (!returnAt) fields.returnAt = 'invalid_datetime';
    if (arrivalAt && returnAt && returnAt <= arrivalAt) fields.returnAt = 'return_before_arrival';
    if (arrivalAt && arrivalAt.getTime() < Date.now() - 60 * 60 * 1000) fields.arrivalAt = 'in_the_past';
    if (Object.keys(fields).length) throw new ValidationException(fields);
    const { full } = await this.capacity.fullNights(parking, arrivalAt!, returnAt!);
    const days = billableDays(arrivalAt!, returnAt!, parking.timezone);
    const priceCents = quoteCents(parking.pricingTiers, parking.extraDayPriceCents, days);
    return {
      available: full.length === 0 && priceCents !== null,
      reason: full.length ? 'full' : priceCents === null ? 'no_price' : null,
      fullNights: full.map(n => n.date),
      days,
      priceCents,
      currency: 'EUR',
    };
  }

  /** A booking from the parking's site: checked, priced on the grid, refused when a night is full; paid at the parking. */
  public async book(key: unknown, body: unknown, siteUrl: unknown) {
    const { row, parking } = await this.resolve(key);
    const read = readSiteBooking(body);
    if (!read.ok) throw new ValidationException(read.fields);
    const input = read.value;
    const quote = await this.quote(key, { arrivalAt: input.arrivalAt, returnAt: input.returnAt });
    if (quote.reason === 'no_price') throw new HttpException(httpStatus.CONFLICT, 'The grid cannot price this stay', 'no_price');
    const { reservation, duplicate } = await this.reservations.createFromImport(
      row.operatorId,
      {
        provider: 'Site du parking',
        channel: 'website',
        arrivalAt: input.arrivalAt,
        returnAt: input.returnAt,
        customerFirstName: input.firstName,
        customerLastName: input.lastName,
        customerName: `${input.firstName} ${input.lastName}`,
        customerPhone: input.phone,
        ...(input.email ? { customerEmail: input.email } : {}),
        ...(input.plate ? { plate: input.plate } : {}),
        ...(input.returnFlight ? { returnFlight: input.returnFlight } : {}),
        passengers: input.passengers,
        ...(quote.priceCents !== null ? { priceCents: quote.priceCents } : {}),
        ...(input.message ? { notes: `Message du client (site du parking) : ${input.message}` } : {}),
      },
      { by: 'website_plugin', refuseFull: true },
    );
    const host = siteHostOf(siteUrl);
    await prisma.websiteIntegration.update({ where: { id: row.id }, data: { lastBookingAt: new Date(), ...(host ? { siteHost: host } : {}) } });
    logger.info(`[Website] booking ${reservation.reference} from the site of operator ${row.operatorId}${duplicate ? ' (already there)' : ''}`);
    return {
      reference: reservation.reference,
      duplicate,
      priceCents: reservation.priceCents,
      arrivalAt: reservation.arrivalAt.toISOString(),
      returnAt: reservation.returnAt.toISOString(),
      parkingName: parking.name,
    };
  }
}
