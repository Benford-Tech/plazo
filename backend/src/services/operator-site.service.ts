import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PUBLIC_SITE_URL, SECRET_KEY } from '@/config';
import prisma from '@/database';
import { accentInk, DEFAULT_BOOKING_PAGE_ACCENT, isReservedSlug, readAccent, readSlug, slugFrom } from '@/domain/booking-page';
import { blocksOf, readBlocks, SITE_ADDON_PRICE_CENTS, sitePreviewKey, siteUrl } from '@/domain/operator-site';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { dnsRecordFor, readDomain } from '@/domain/site-domain';
import { AuditService } from './audit.service';
import { SiteDomainHostService } from './site-domain-host.service';

/** A pending domain is checked again when the page is read, at most this often. */
const DOMAIN_RECHECK_MS = 60_000;

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Site not found', 'not_found');

/**
 * « Mon site » (22/11/2026): the parking's own site, plazo.fr/s/<slug>, made of blocks. Its address and colour are the
 * booking page's (one identity for both); it is a paid extra the platform switches on, and it goes online only with
 * the extra and a published listing. Publishing also opens the booking page, which the « Réserver » block uses.
 */
@Service()
export class OperatorSiteService {
  public audit = Container.get(AuditService);
  public hosts = Container.get(SiteDomainHostService);
  public settings = { siteUrl: PUBLIC_SITE_URL, secret: SECRET_KEY ?? '' };

  private async listingOf(operatorId: string) {
    return prisma.listing.findFirst({
      where: { parking: { operatorId } },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, status: true, title: true, airport: { select: { slug: true, name: true } } },
    });
  }

  private async state(operatorId: string) {
    const [operator, listing] = await Promise.all([
      prisma.operator.findUniqueOrThrow({
        where: { id: operatorId },
        select: { name: true, bookingPageSlug: true, bookingPageAccent: true, bookingPageEnabledAt: true, site: true },
      }),
      this.listingOf(operatorId),
    ]);
    return { operator, listing };
  }

  private toView(operatorId: string, { operator, listing }: Awaited<ReturnType<OperatorSiteService['state']>>) {
    const slug = operator.bookingPageSlug ?? slugFrom(listing?.title || operator.name);
    const site = this.settings.siteUrl;
    const url = site && slug ? siteUrl(site, slug) : null;
    const listingOnline = listing?.status === 'published';
    return {
      slug,
      saved: !!operator.bookingPageSlug,
      accent: operator.bookingPageAccent ?? DEFAULT_BOOKING_PAGE_ACCENT,
      blocks: blocksOf(operator.site?.blocks),
      published: !!operator.site?.publishedAt,
      listingOnline,
      listingTitle: listing?.title ?? null,
      url,
      // The preview needs a saved address and the listing online (the site reads the public listing).
      previewUrl: url && operator.bookingPageSlug && listingOnline ? `${url}?apercu=${sitePreviewKey(operatorId, this.settings.secret)}` : null,
      addon: {
        active: !!operator.site?.addonAt,
        requestedAt: operator.site?.addonRequestedAt ?? null,
        priceCents: SITE_ADDON_PRICE_CENTS,
      },
      domain: this.domainView(operator.site),
    };
  }

  /** The parking's own domain: the record to create, and where it stands (waiting for its DNS, for its attachment, active). */
  private domainView(site: { domain: string | null; domainActiveAt: Date | null; domainCheckedAt: Date | null; domainIssue: string | null } | null) {
    if (!site?.domain) return null;
    return {
      name: site.domain,
      record: dnsRecordFor(site.domain),
      active: !!site.domainActiveAt,
      issue: site.domainActiveAt ? null : (site.domainIssue ?? 'dns_missing'),
      checkedAt: site.domainCheckedAt,
      // Without the hosting's token, Plazo's team attaches the name once its DNS is in place.
      automatic: this.hosts.automatic,
    };
  }

  /** PUT /internal/site/domain { domain }: set the parking's own domain (null or empty removes it). Part of the paid option. */
  public async setDomain(actor: AuthenticatedStaff, value: unknown) {
    const { operator } = await this.state(actor.operatorId);
    const previous = operator.site?.domain ?? null;
    if (value === null || value === '' || value === undefined) {
      if (previous) {
        await prisma.operatorSite.update({
          where: { operatorId: actor.operatorId },
          data: { domain: null, domainSetAt: null, domainActiveAt: null, domainCheckedAt: null, domainIssue: null },
        });
        await this.hosts.detach(previous);
        await this.audit.record(actor, { action: 'site.domain_removed', entityType: 'operator', entityId: actor.operatorId });
      }
      return this.view(actor);
    }
    const domain = readDomain(value);
    if (!domain) throw new ValidationException({ domain: 'invalid' });
    if (!operator.site?.addonAt) throw new ValidationException({ domain: 'addon_required' });
    if (domain !== previous) {
      const taken = await prisma.operatorSite.findFirst({ where: { domain, NOT: { operatorId: actor.operatorId } }, select: { id: true } });
      if (taken) throw new ValidationException({ domain: 'taken' });
      await prisma.operatorSite.update({
        where: { operatorId: actor.operatorId },
        data: { domain, domainSetAt: new Date(), domainActiveAt: null, domainCheckedAt: null, domainIssue: 'dns_missing' },
      });
      if (previous) await this.hosts.detach(previous);
      await this.audit.record(actor, { action: 'site.domain_set', entityType: 'operator', entityId: actor.operatorId });
    }
    return this.checkDomain(actor);
  }

  /** POST /internal/site/domain/check: read the DNS again, attach the name when Plazo can, and say where it stands. */
  public async checkDomain(actor: AuthenticatedStaff) {
    await this.refreshDomain(actor.operatorId);
    return this.view(actor);
  }

  private async refreshDomain(operatorId: string) {
    const site = await prisma.operatorSite.findUnique({ where: { operatorId }, select: { domain: true, domainActiveAt: true } });
    if (!site?.domain) return;
    const now = new Date();
    const dnsState = await this.hosts.dns(site.domain);
    if (dnsState !== 'ok') {
      // The DNS no longer points here: the name stops opening the site until it is back.
      await prisma.operatorSite.update({ where: { operatorId }, data: { domainCheckedAt: now, domainIssue: dnsState, domainActiveAt: null } });
      return;
    }
    if (!this.hosts.automatic) {
      // The DNS is right; the platform attaches the name by hand and marks it (setDomainActive).
      await prisma.operatorSite.update({
        where: { operatorId },
        data: { domainCheckedAt: now, domainIssue: site.domainActiveAt ? null : 'not_attached' },
      });
      return;
    }
    const attached = await this.hosts.attach(site.domain);
    await prisma.operatorSite.update({
      where: { operatorId },
      data: {
        domainCheckedAt: now,
        domainIssue: attached === 'active' ? null : attached,
        domainActiveAt: attached === 'active' ? (site.domainActiveAt ?? now) : null,
      },
    });
  }

  /** Plateforme: the name is attached at the hosting (by hand, without the token) or taken off. */
  public async setDomainActive(actor: AuthenticatedStaff, operatorId: string, active: unknown) {
    if (typeof active !== 'boolean') throw new ValidationException({ active: 'invalid' });
    const site = await prisma.operatorSite.findUnique({ where: { operatorId }, select: { domain: true, domainActiveAt: true } });
    if (!site?.domain) throw new HttpException(httpStatus.CONFLICT, 'No domain set', 'no_domain');
    await prisma.operatorSite.update({
      where: { operatorId },
      data: { domainActiveAt: active ? (site.domainActiveAt ?? new Date()) : null, domainIssue: active ? null : 'not_attached' },
    });
    await this.audit.record(actor, { action: 'site.domain_marked', entityType: 'operator', entityId: operatorId, details: { active } });
    return this.platformView(operatorId);
  }

  /** GET /public/site-domains/:host: the site a parking's own host opens (online, name active), for the site's router. */
  public async byDomain(host: string) {
    const domain = readDomain(host);
    if (!domain) throw notFound();
    const site = await prisma.operatorSite.findUnique({
      where: { domain },
      select: { domainActiveAt: true, publishedAt: true, operator: { select: { bookingPageSlug: true, status: true, archivedAt: true } } },
    });
    if (
      !site?.domainActiveAt ||
      !site.publishedAt ||
      !site.operator.bookingPageSlug ||
      site.operator.status !== 'active' ||
      site.operator.archivedAt
    ) {
      throw notFound();
    }
    return { slug: site.operator.bookingPageSlug };
  }

  public async view(actor: AuthenticatedStaff) {
    const state = await this.state(actor.operatorId);
    const site = state.operator.site;
    // A domain still waiting is checked again when the manager looks (he has just set his DNS).
    if (site?.domain && !site.domainActiveAt && (!site.domainCheckedAt || Date.now() - site.domainCheckedAt.getTime() > DOMAIN_RECHECK_MS)) {
      await this.refreshDomain(actor.operatorId);
      return this.toView(actor.operatorId, await this.state(actor.operatorId));
    }
    return this.toView(actor.operatorId, state);
  }

  /** PUT /internal/site { blocks?, slug?, accent?, published? }: absent fields unchanged. */
  public async update(actor: AuthenticatedStaff, body: { blocks?: unknown; slug?: unknown; accent?: unknown; published?: unknown }) {
    const state = await this.state(actor.operatorId);
    const current = this.toView(actor.operatorId, state);
    const fields: Record<string, string> = {};
    const slug = body.slug === undefined ? current.slug : readSlug(body.slug);
    if (!slug) fields.slug = 'invalid';
    else if (isReservedSlug(slug)) fields.slug = 'reserved';
    const accent = body.accent === undefined ? current.accent : readAccent(body.accent);
    if (!accent) fields.accent = 'invalid';
    const read = body.blocks === undefined ? { blocks: current.blocks } : readBlocks(body.blocks);
    if ('error' in read) fields.blocks = read.error;
    const published = body.published === undefined ? current.published : body.published === true;
    if (published && !current.addon.active) fields.published = 'addon_required';
    else if (published && !current.listingOnline) fields.published = 'listing_offline';
    if (Object.keys(fields).length) throw new ValidationException(fields);

    const taken = await prisma.operator.findFirst({ where: { bookingPageSlug: slug!, NOT: { id: actor.operatorId } }, select: { id: true } });
    if (taken) throw new ValidationException({ slug: 'taken' });
    const blocks = 'blocks' in read ? read.blocks : current.blocks;
    const publishedAt = published ? (state.operator.site?.publishedAt ?? new Date()) : null;
    await prisma.$transaction([
      prisma.operator.update({
        where: { id: actor.operatorId },
        data: {
          bookingPageSlug: slug,
          bookingPageAccent: accent,
          // The « Réserver » block books through the booking page: an online site opens it.
          ...(published && !state.operator.bookingPageEnabledAt ? { bookingPageEnabledAt: new Date() } : {}),
        },
      }),
      prisma.operatorSite.upsert({
        where: { operatorId: actor.operatorId },
        create: { operatorId: actor.operatorId, blocks: blocks as object[] },
        update: { blocks: blocks as object[] },
      }),
      // Apart from the upsert: Postgres checks « online needs the extra » on the row an upsert would insert, even when
      // the row exists and is only updated.
      prisma.operatorSite.updateMany({ where: { operatorId: actor.operatorId }, data: { publishedAt } }),
    ]);
    await this.audit.record(actor, {
      action: 'site.updated',
      entityType: 'operator',
      entityId: actor.operatorId,
      details: { slug, accent, published, blocks: blocks.filter(b => b.enabled).map(b => b.kind) },
    });
    return this.view(actor);
  }

  /** « Demander mon site »: the manager asks for the extra; the platform sees it in « À traiter ». */
  public async request(actor: AuthenticatedStaff) {
    const now = new Date();
    await prisma.operatorSite.upsert({
      where: { operatorId: actor.operatorId },
      create: { operatorId: actor.operatorId, addonRequestedAt: now },
      update: { addonRequestedAt: now },
    });
    await this.audit.record(actor, { action: 'site.addon_requested', entityType: 'operator', entityId: actor.operatorId });
    return this.view(actor);
  }

  /** Plateforme › loueur: the extra's state. */
  public async platformView(operatorId: string) {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true } });
    if (!operator) throw notFound();
    const view = this.toView(operatorId, await this.state(operatorId));
    return { addon: view.addon, published: view.published, url: view.saved ? view.url : null, domain: view.domain };
  }

  /** The platform switches the extra on or off; off takes the site offline (the blocks stay). */
  public async setAddon(actor: AuthenticatedStaff, operatorId: string, active: unknown) {
    if (typeof active !== 'boolean') throw new ValidationException({ active: 'invalid' });
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true, site: { select: { addonAt: true } } } });
    if (!operator) throw notFound();
    const addonAt = active ? (operator.site?.addonAt ?? new Date()) : null;
    await prisma.operatorSite.upsert({
      where: { operatorId },
      create: { operatorId, addonAt },
      update: { addonAt, addonRequestedAt: active ? null : undefined, ...(active ? {} : { publishedAt: null, domainActiveAt: null }) },
    });
    await this.audit.record(actor, { action: 'site.addon_set', entityType: 'operator', entityId: operatorId, details: { active } });
    return this.platformView(operatorId);
  }

  /**
   * What a slug opens for the site: the listing it shows and its enabled blocks. Offline, only the manager's preview
   * key opens it. 404 for anything else (unknown slug, operator not active, listing not published).
   */
  public async publicSite(slug: string, previewKey?: string) {
    const clean = readSlug(slug);
    if (!clean || clean !== slug) throw notFound();
    const operator = await prisma.operator.findUnique({
      where: { bookingPageSlug: clean },
      select: { id: true, bookingPageAccent: true, bookingPageEnabledAt: true, status: true, archivedAt: true, site: true },
    });
    if (!operator || operator.status !== 'active' || operator.archivedAt) throw notFound();
    const online = !!operator.site?.publishedAt;
    const preview = !online && !!previewKey && previewKey === sitePreviewKey(operator.id, this.settings.secret);
    if (!online && !preview) throw notFound();
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
      blocks: blocksOf(operator.site?.blocks).filter(b => b.enabled),
      // The booking block takes bookings only once the booking page is open (always, for a site online).
      bookable: !!operator.bookingPageEnabledAt,
      preview,
      // The parking's own host, once it serves the site: the site's one address (plazo.fr/s/<slug> sends there).
      domain: online && operator.site?.domainActiveAt ? operator.site.domain : null,
    };
  }
}
