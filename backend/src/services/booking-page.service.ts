import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PUBLIC_SITE_URL } from '@/config';
import prisma from '@/database';
import { accentInk, bookingPageUrls, DEFAULT_BOOKING_PAGE_ACCENT, isReservedSlug, readAccent, readSlug, slugFrom } from '@/domain/booking-page';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Booking page not found', 'not_found');

/**
 * « Ma page de réservation » (Site du parking, niveau 3, 19/11/2026): the operator's address on plazo.fr/r/<slug>, its
 * button colour, the code for its site; and, for the site, what a slug opens (the published listing it books).
 */
@Service()
export class BookingPageService {
  public audit = Container.get(AuditService);
  public settings = { siteUrl: PUBLIC_SITE_URL };

  /** The first listing of the operator, with its airport, and whether it is online on plazo.fr. */
  private async listingOf(operatorId: string) {
    return prisma.listing.findFirst({
      where: { parking: { operatorId } },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, status: true, title: true, airport: { select: { slug: true } } },
    });
  }

  public async view(actor: AuthenticatedStaff) {
    const operator = await prisma.operator.findUniqueOrThrow({
      where: { id: actor.operatorId },
      select: { name: true, bookingPageSlug: true, bookingPageAccent: true, bookingPageEnabledAt: true },
    });
    const listing = await this.listingOf(actor.operatorId);
    const slug = operator.bookingPageSlug ?? slugFrom(listing?.title || operator.name);
    const site = this.settings.siteUrl;
    return {
      enabled: !!operator.bookingPageEnabledAt,
      slug,
      saved: !!operator.bookingPageSlug,
      accent: operator.bookingPageAccent ?? DEFAULT_BOOKING_PAGE_ACCENT,
      listingOnline: listing?.status === 'published',
      listingTitle: listing?.title ?? null,
      ...(site && slug ? bookingPageUrls(site, slug) : { page: null, embed: null }),
    };
  }

  /** PUT /internal/booking-page { enabled?, slug?, accent? }: absent fields unchanged. */
  public async update(actor: AuthenticatedStaff, body: { enabled?: unknown; slug?: unknown; accent?: unknown }) {
    const current = await this.view(actor);
    const fields: Record<string, string> = {};
    const slug = body.slug === undefined ? current.slug : readSlug(body.slug);
    if (!slug) fields.slug = 'invalid';
    else if (isReservedSlug(slug)) fields.slug = 'reserved';
    const accent = body.accent === undefined ? current.accent : readAccent(body.accent);
    if (!accent) fields.accent = 'invalid';
    const enabled = body.enabled === undefined ? current.enabled : body.enabled === true;
    if (enabled && !current.listingOnline) fields.enabled = 'listing_offline';
    if (Object.keys(fields).length) throw new ValidationException(fields);

    const taken = await prisma.operator.findFirst({ where: { bookingPageSlug: slug!, NOT: { id: actor.operatorId } }, select: { id: true } });
    if (taken) throw new ValidationException({ slug: 'taken' });
    await prisma.operator.update({
      where: { id: actor.operatorId },
      data: {
        bookingPageSlug: slug,
        bookingPageAccent: accent,
        bookingPageEnabledAt: enabled ? (current.enabled ? undefined : new Date()) : null,
      },
    });
    await this.audit.record(actor, {
      action: 'booking_page.updated',
      entityType: 'operator',
      entityId: actor.operatorId,
      details: { enabled, slug, accent },
    });
    return this.view(actor);
  }

  /** What a slug opens for the site: the listing it books (published, operator active), and the page's colour. */
  public async publicPage(slug: string) {
    const clean = readSlug(slug);
    if (!clean || clean !== slug) throw notFound();
    const operator = await prisma.operator.findUnique({
      where: { bookingPageSlug: clean },
      select: { id: true, name: true, bookingPageAccent: true, bookingPageEnabledAt: true, status: true, archivedAt: true, logoUpdatedAt: true },
    });
    if (!operator?.bookingPageEnabledAt || operator.status !== 'active' || operator.archivedAt) throw notFound();
    const listing = await prisma.listing.findFirst({
      where: { status: 'published', parking: { operatorId: operator.id } },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, title: true, airport: { select: { slug: true, name: true } } },
    });
    if (!listing) throw notFound();
    const accent = operator.bookingPageAccent ?? DEFAULT_BOOKING_PAGE_ACCENT;
    return {
      slug: clean,
      title: listing.title,
      airport: listing.airport.slug,
      airportName: listing.airport.name,
      parking: listing.slug,
      accent,
      accentInk: accentInk(accent),
    };
  }

  /**
   * A booking sent with a booking page: true when that page is the listing's operator's, enabled. Any other value is a
   * refusal (a page cannot book another parking).
   */
  public async allows(slug: string | undefined, operatorId: string): Promise<boolean> {
    if (slug === undefined || slug === null || slug === '') return false;
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { bookingPageSlug: true, bookingPageEnabledAt: true } });
    if (operator?.bookingPageSlug !== slug || !operator.bookingPageEnabledAt) {
      throw new HttpException(httpStatus.CONFLICT, 'This booking page does not book this parking', 'booking_page_unavailable');
    }
    return true;
  }
}
