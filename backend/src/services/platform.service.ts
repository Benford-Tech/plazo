import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { isPlatformAdmin, PLATFORM_COMMISSION_BPS, PRODUCT_NAME } from '@/config';
import prisma, { ListingStatus, PlatformAudience, Prisma } from '@/database';
import { listingApprovedEmail, listingRejectedEmail, listingUnpublishedEmail } from '@/domain/account-messages';
import { DATE_RE, dayBounds, localDate } from '@/domain/time';
import { InviteOperatorDto, PlatformNotificationDto } from '@/dtos/platform.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AccountService } from './account.service';
import { AuditService } from './audit.service';
import { normalizeEmail } from './auth.service';
import { ListingService } from './listing.service';
import { NotificationService } from './notification.service';
import { OperatorService } from './operator.service';
import { PaymentService } from './payment.service';
import { PushService } from './push.service';
import { TokenService } from './token.service';

// The platform's dashboards read every operator's data: they use Europe/Paris for "this month".
const PLATFORM_TZ = 'Europe/Paris';
const PAGE_SIZE = 50;
/** C-A: broadcasts to every traveller are rare; this many per local day at most. */
export const TRAVELLER_BROADCASTS_PER_DAY = 2;
export const LISTING_STATUSES = Object.values(ListingStatus);

const notFound = (what: string) => new HttpException(httpStatus.NOT_FOUND, `${what} not found`, 'not_found');

/** A booking that counts in the figures: neither an abandoned online payment nor its expired hold. */
const COUNTED_BOOKING: Prisma.ReservationWhereInput = {
  status: { not: 'pending_payment' },
  OR: [{ paymentStatus: null }, { paymentStatus: { not: 'expired' } }],
};

/** A booking paid online (or refunded, or with a transfer): accounting records, never deleted with its operator. */
const PAID_ONLINE: Prisma.ReservationWhereInput = {
  OR: [{ paymentStatus: { in: ['paid', 'refunded'] } }, { payoutStatus: { not: null } }, { stripeChargeId: { not: null } }],
};

/** A booking whose online payment is under way: its hold still runs, the traveller may be on the payment page. */
const PAYMENT_OPEN: Prisma.ReservationWhereInput = { status: 'pending_payment' };

export type DeletionBlocker = 'cannot_delete_platform' | 'not_suspended' | 'has_payments' | 'payment_in_progress';

function deletionRefused(reason: DeletionBlocker): HttpException {
  if (reason === 'cannot_delete_platform') {
    return new HttpException(httpStatus.BAD_REQUEST, "The platform's own account cannot be deleted", reason);
  }
  if (reason === 'not_suspended') return new HttpException(httpStatus.CONFLICT, 'Suspend the operator before deleting it', reason);
  if (reason === 'payment_in_progress') return new HttpException(httpStatus.CONFLICT, 'An online payment is under way: try again later', reason);
  return new HttpException(httpStatus.CONFLICT, 'The operator has online payments: archive it instead', reason);
}

function monthStart(now = new Date()): Date {
  return dayBounds(`${localDate(now, PLATFORM_TZ).slice(0, 7)}-01`, PLATFORM_TZ).start;
}

/**
 * The platform owner's space (/api/internal/platform, PLATFORM_ADMIN_EMAILS only): every operator,
 * the review of their listings, their bookings and payouts, invitations, suspension and the
 * "open their space" sessions. Personal data of travellers is kept out of the lists.
 */
@Service()
export class PlatformService {
  public accounts = Container.get(AccountService);
  public audit = Container.get(AuditService);
  public listings = Container.get(ListingService);
  public notifications = Container.get(NotificationService);
  public operatorService = Container.get(OperatorService);
  public paymentService = Container.get(PaymentService);
  public push = Container.get(PushService);
  public tokens = Container.get(TokenService);

  private async operatorOrThrow(id: string) {
    const operator = await prisma.operator.findUnique({ where: { id } });
    if (!operator) throw notFound('Operator');
    return operator;
  }

  /** Audit entry about an operator, by the platform admin (real staff id). */
  private record(actor: AuthenticatedStaff, operatorId: string, action: string, details: Prisma.InputJsonValue = {}) {
    return this.audit.record({ id: actor.id, operatorId }, { action, entityType: 'operator', entityId: operatorId, details });
  }

  // ---- Notifications (E-A, 05/10/2026) ------------------------------------------------------------

  /** How many phones a broadcast would reach, before sending ("Envoyer à N téléphones"). */
  public async notificationAudience(audience: PlatformAudience, operatorId?: string | null): Promise<{ devices: number; configured: boolean }> {
    const ids = await this.broadcastIds(audience, operatorId);
    return { devices: ids.length, configured: this.push.enabled() };
  }

  private async broadcastIds(audience: PlatformAudience, operatorId?: string | null): Promise<string[]> {
    if (audience === 'travellers') return this.push.travellerBroadcastIds();
    if (audience === 'operator') {
      if (!operatorId) throw new ValidationException({ operatorId: 'required' });
      await this.operatorOrThrow(operatorId);
      return this.push.staffBroadcastIds(operatorId);
    }
    return this.push.staffBroadcastIds();
  }

  /** Sends the push, keeps the row and the audit entry; 429 daily_limit past the travellers' cap (C-A). */
  public async sendNotification(actor: AuthenticatedStaff, data: PlatformNotificationDto) {
    const audience = data.audience as PlatformAudience;
    const operatorId = audience === 'operator' ? (data.operatorId ?? null) : null;
    const ids = await this.broadcastIds(audience, operatorId);
    const now = new Date();
    if (audience === 'travellers') {
      const since = dayBounds(localDate(now, PLATFORM_TZ), PLATFORM_TZ).start;
      const today = await prisma.platformNotification.count({ where: { audience: 'travellers', createdAt: { gte: since } } });
      if (today >= TRAVELLER_BROADCASTS_PER_DAY) {
        throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Daily limit of traveller broadcasts reached', 'daily_limit', {
          limit: TRAVELLER_BROADCASTS_PER_DAY,
        });
      }
    }
    const message = { title: data.title.trim(), body: data.body.trim() };
    const url = data.url?.trim() || null;
    const options = { data: { type: 'platform' }, ...(url ? { url } : {}) };
    const recipients =
      audience === 'travellers' ? await this.push.broadcastTravellers(ids, message, options) : await this.push.broadcastStaff(ids, message, options);
    const row = await prisma.platformNotification.create({
      data: { audience, operatorId, title: message.title, body: message.body, url, recipients, sentById: actor.id, sentByName: actor.name },
      include: { operator: { select: { name: true } } },
    });
    await this.audit.record(
      { id: actor.id, operatorId: actor.operatorId },
      {
        action: 'platform.notification_sent',
        entityType: 'platform_notification',
        entityId: row.id,
        details: { audience, operatorId, title: message.title, body: message.body, recipients },
      },
    );
    return this.notificationView(row);
  }

  /** The last broadcasts, newest first. */
  public async listNotifications() {
    const rows = await prisma.platformNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      include: { operator: { select: { name: true } } },
    });
    return rows.map(r => this.notificationView(r));
  }

  private notificationView(r: {
    id: string;
    audience: PlatformAudience;
    operatorId: string | null;
    operator: { name: string } | null;
    title: string;
    body: string;
    url: string | null;
    recipients: number;
    sentByName: string;
    createdAt: Date;
  }) {
    return {
      id: r.id,
      audience: r.audience,
      operatorId: r.operatorId,
      operatorName: r.operator?.name ?? null,
      title: r.title,
      body: r.body,
      url: r.url,
      recipients: r.recipients,
      sentByName: r.sentByName,
      createdAt: r.createdAt.toISOString(),
    };
  }

  // ---- Operators ----------------------------------------------------------------------------------

  /**
   * The Loueurs tab: the current operators (active and suspended), or the archived ones with view
   * « archived » (09/10/2026), with the size of both lists.
   */
  public async operators(view?: unknown) {
    if (view !== undefined && view !== 'current' && view !== 'archived') throw new ValidationException({ view: 'invalid_view' });
    const archived = view === 'archived';
    const since = monthStart();
    const [operators, monthly, archivedCount, currentCount] = await Promise.all([
      prisma.operator.findMany({
        where: { archivedAt: archived ? { not: null } : null },
        orderBy: archived ? { archivedAt: 'desc' } : { createdAt: 'desc' },
        include: {
          parkings: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, totalCapacity: true, listing: { select: { id: true, status: true } } },
          },
          staff: {
            orderBy: { createdAt: 'asc' },
            select: {
              email: true,
              name: true,
              role: true,
              emailVerifiedAt: true,
              accountTokens: { where: { type: 'invitation', usedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      }),
      prisma.reservation.groupBy({ by: ['operatorId'], where: { createdAt: { gte: since }, ...COUNTED_BOOKING }, _count: { _all: true } }),
      prisma.operator.count({ where: { archivedAt: { not: null } } }),
      prisma.operator.count({ where: { archivedAt: null } }),
    ]);
    const bookings = new Map(monthly.map(m => [m.operatorId, m._count._all]));
    const now = new Date();

    return {
      defaultCommissionBps: PLATFORM_COMMISSION_BPS,
      counts: { current: currentCount, archived: archivedCount },
      operators: operators.map(o => {
        const manager = o.staff.find(s => s.role === 'manager') ?? null;
        const invitation = manager?.accountTokens[0] ?? null;
        const listing = o.parkings.find(p => p.listing)?.listing ?? null;
        return {
          id: o.id,
          name: o.name,
          status: o.status,
          suspendedAt: o.suspendedAt,
          archivedAt: o.archivedAt,
          createdAt: o.createdAt,
          // The platform owner's own operator ("Plazo (tests)"): cannot be suspended.
          isPlatform: o.staff.some(s => isPlatformAdmin(s.email)),
          // Fictional operator of the demo seed (scripts/seed-demo.ts).
          isDemo: o.isDemo,
          parkings: o.parkings.length,
          places: o.parkings.reduce((sum, p) => sum + p.totalCapacity, 0),
          manager: manager ? { name: manager.name, email: manager.email, emailVerified: !!manager.emailVerifiedAt } : null,
          listing,
          payments: { connected: !!o.stripeAccountId, chargesEnabled: o.stripeChargesEnabled, payoutsEnabled: o.stripePayoutsEnabled },
          commissionBps: o.commissionBps,
          bookingsThisMonth: bookings.get(o.id) ?? 0,
          invitation: invitation ? { sentAt: invitation.createdAt, expiresAt: invitation.expiresAt, expired: invitation.expiresAt <= now } : null,
        };
      }),
    };
  }

  public async setCommission(actor: AuthenticatedStaff, operatorId: string, commissionBps: number | null) {
    const operator = await this.operatorOrThrow(operatorId);
    await prisma.operator.update({ where: { id: operatorId }, data: { commissionBps } });
    await this.record(actor, operatorId, 'operator.commission_changed', { from: operator.commissionBps, to: commissionBps });
    return { id: operatorId, commissionBps };
  }

  /** Suspends an operator: its staff are signed out and cannot log in, its listings leave the site. */
  public async suspend(actor: AuthenticatedStaff, operatorId: string) {
    const operator = await this.operatorOrThrow(operatorId);
    const staff = await prisma.staff.findMany({ where: { operatorId }, select: { email: true } });
    if (staff.some(s => isPlatformAdmin(s.email))) {
      throw new HttpException(httpStatus.BAD_REQUEST, "The platform's own account cannot be suspended", 'cannot_suspend_platform');
    }
    if (operator.status === 'suspended') return { id: operatorId, status: operator.status };
    await prisma.operator.update({ where: { id: operatorId }, data: { status: 'suspended', suspendedAt: new Date() } });
    await this.tokens.revokeOperator(operatorId);
    await this.record(actor, operatorId, 'operator.suspended');
    return { id: operatorId, status: 'suspended' as const };
  }

  /** Reactivates an operator, archived or not: it is back in the lists, on the site and in the crons. */
  public async reactivate(actor: AuthenticatedStaff, operatorId: string) {
    const operator = await this.operatorOrThrow(operatorId);
    if (operator.status === 'active') return { id: operatorId, status: operator.status };
    await prisma.operator.update({ where: { id: operatorId }, data: { status: 'active', suspendedAt: null, archivedAt: null } });
    await this.record(actor, operatorId, 'operator.reactivated');
    return { id: operatorId, status: 'active' as const };
  }

  /**
   * Archives a suspended operator (09/10/2026, « archive les parkings suspendus »): it leaves the Loueurs and
   * Annonces lists and the crons, and keeps all its data. An active operator is suspended first (409 not_suspended).
   */
  public async archive(actor: AuthenticatedStaff, operatorId: string) {
    const operator = await this.operatorOrThrow(operatorId);
    if (operator.status !== 'suspended') {
      throw new HttpException(httpStatus.CONFLICT, 'Only a suspended operator can be archived', 'not_suspended');
    }
    if (operator.archivedAt) return { id: operatorId, archivedAt: operator.archivedAt };
    const archivedAt = new Date();
    await prisma.operator.update({ where: { id: operatorId }, data: { archivedAt } });
    await this.record(actor, operatorId, 'operator.archived');
    return { id: operatorId, archivedAt };
  }

  /** Takes an operator out of the archive: back in the Loueurs list, still suspended. */
  public async unarchive(actor: AuthenticatedStaff, operatorId: string) {
    const operator = await this.operatorOrThrow(operatorId);
    if (!operator.archivedAt) return { id: operatorId, archivedAt: null };
    await prisma.operator.update({ where: { id: operatorId }, data: { archivedAt: null } });
    await this.record(actor, operatorId, 'operator.unarchived');
    return { id: operatorId, archivedAt: null };
  }

  // ---- Deletion (09/10/2026, « pouvoir supprimer un parking ») -------------------------------------

  /**
   * Whether an operator can be deleted, and what would go with it. Never the platform's own account; an operator
   * that was used must be suspended first (only an invitation never accepted goes straight away); an online payment
   * keeps it (accounting records: archive it instead), and one under way makes it wait; neither counts on a demo
   * operator (test payments only).
   */
  private async deletionCheck(operatorId: string) {
    // A hold whose time is over no longer counts as a payment under way.
    await this.paymentService.expireLapsedHolds();
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        staff: {
          select: {
            email: true,
            lastLoginAt: true,
            accountTokens: { where: { type: 'invitation', usedAt: null }, select: { id: true }, take: 1 },
          },
        },
        parkings: { select: { id: true, listing: { select: { id: true } } } },
        _count: { select: { parkings: true, reservations: true, staff: true } },
      },
    });
    if (!operator) throw notFound('Operator');
    const [paid, open] = operator.isDemo
      ? [0, 0]
      : await Promise.all([
          prisma.reservation.count({ where: { operatorId, ...PAID_ONLINE } }),
          prisma.reservation.count({ where: { operatorId, ...PAYMENT_OPEN } }),
        ]);
    const neverUsed = operator.staff.every(s => !s.lastLoginAt) && operator.staff.some(s => s.accountTokens.length > 0);
    const reason: DeletionBlocker | null = operator.staff.some(s => isPlatformAdmin(s.email))
      ? 'cannot_delete_platform'
      : operator.status !== 'suspended' && !neverUsed
        ? 'not_suspended'
        : paid > 0
          ? 'has_payments'
          : open > 0
            ? 'payment_in_progress'
            : null;
    const { parkings, reservations, staff } = operator._count;
    const listings = operator.parkings.filter(p => p.listing).length;
    return { operator, reason, counts: { parkings, listings, reservations, staff, paidReservations: paid } };
  }

  /** What « Supprimer » would erase, and whether it is allowed (the confirmation shows it before anything happens). */
  public async deletionPreview(operatorId: string) {
    const { operator, reason, counts } = await this.deletionCheck(operatorId);
    return { id: operator.id, name: operator.name, deletable: reason === null, reason, counts };
  }

  /**
   * Deletes an operator with everything that hangs from it (parkings, plan, listing, prices, bookings, team, mails,
   * shuttles: cascades). The entry of the journal goes to the admin's own operator, the deleted one's going with it.
   */
  public async deleteOperator(actor: AuthenticatedStaff, operatorId: string) {
    const first = await this.deletionCheck(operatorId);
    if (first.reason) throw deletionRefused(first.reason);
    // No payment may land on a booking that is gone: the ones Stripe could still take are closed first (one that
    // went through meanwhile turns its booking paid, and the second check keeps the operator).
    const underWay = first.operator.isDemo ? 0 : await this.paymentService.closeLingeringPayments(operatorId);
    if (underWay > 0) throw deletionRefused('payment_in_progress');
    const { operator, reason, counts } = await this.deletionCheck(operatorId);
    if (reason) throw deletionRefused(reason);

    const deleted = await prisma.$transaction(async tx => {
      // The lock of a payment's confirmation: one in flight ends first, and the conditions below see it.
      for (const parking of operator.parkings) await this.paymentService.capacity.lock(tx, parking.id);
      // The checks are repeated by the delete itself: a payment or a sign-in in between keeps the operator.
      const { count } = await tx.operator.deleteMany({
        where: {
          id: operatorId,
          OR: [
            { status: 'suspended' },
            { staff: { every: { lastLoginAt: null }, some: { accountTokens: { some: { type: 'invitation', usedAt: null } } } } },
          ],
          ...(operator.isDemo ? {} : { reservations: { none: { OR: [PAID_ONLINE, PAYMENT_OPEN] } } }),
        },
      });
      if (count === 0) return false;
      await this.audit.record(
        { id: actor.id, operatorId: actor.actingAs?.realOperatorId ?? actor.operatorId },
        {
          action: 'operator.deleted',
          entityType: 'operator',
          entityId: operatorId,
          details: { name: operator.name, isDemo: operator.isDemo, counts },
        },
        tx,
      );
      return true;
    });
    if (!deleted) {
      const again = await this.deletionCheck(operatorId);
      throw deletionRefused(again.reason ?? 'not_suspended');
    }
    return { id: operatorId, name: operator.name, counts };
  }

  /**
   * "Open their space": a short-lived access token for the admin, scoped to the operator (see
   * TokenService.generateViewAsToken). Every write made with it is audited with the admin's id.
   */
  public async viewAs(actor: AuthenticatedStaff, operatorId: string, metadata: { userAgent: string | null }) {
    const operator = await this.operatorOrThrow(operatorId);
    const access = await this.tokens.generateViewAsToken(actor.id, operator.id, metadata);
    await this.record(actor, operator.id, 'operator.view_as_started');
    return { access, operator: { id: operator.id, name: operator.name } };
  }

  // ---- Invitations ----------------------------------------------------------------------------------

  /** Creates the operator, its parking and its manager, and sends the manager a link to set a password. */
  public async invite(actor: AuthenticatedStaff, data: InviteOperatorDto) {
    const { operator, manager } = await this.operatorService.createWithManager({
      operatorName: data.operatorName,
      parkingName: data.operatorName,
      totalCapacity: data.totalCapacity,
      managerFirstName: data.managerFirstName,
      managerLastName: data.managerLastName,
      managerName: data.managerName?.trim() || data.operatorName,
      managerEmail: normalizeEmail(data.managerEmail),
      managerPassword: null,
      emailVerified: false,
      commissionBps: data.commissionBps ?? null,
    });
    const sent = await this.accounts.sendInvitation(manager, operator.name);
    await this.record(actor, operator.id, 'operator.invited', { emailSent: sent.emailSent });
    return { operator: { id: operator.id, name: operator.name }, ...sent };
  }

  public async resendInvitation(actor: AuthenticatedStaff, operatorId: string) {
    const operator = await this.operatorOrThrow(operatorId);
    const manager = await prisma.staff.findFirst({
      where: { operatorId, role: 'manager', accountTokens: { some: { type: 'invitation', usedAt: null } } },
      orderBy: { createdAt: 'asc' },
    });
    if (!manager) throw new HttpException(httpStatus.CONFLICT, 'No pending invitation for this operator', 'no_pending_invitation');
    const sent = await this.accounts.sendInvitation(manager, operator.name);
    await this.record(actor, operator.id, 'operator.invitation_resent', { emailSent: sent.emailSent });
    return { operator: { id: operator.id, name: operator.name }, ...sent };
  }

  // ---- Listings -----------------------------------------------------------------------------------

  public async listListings(status?: string) {
    if (status && !LISTING_STATUSES.includes(status as ListingStatus)) throw new ValidationException({ status: 'invalid_status' });
    // The listings of an archived operator are filed away with it (09/10/2026).
    const current = { parking: { operator: { archivedAt: null } } } satisfies Prisma.ListingWhereInput;
    const [listings, counts] = await Promise.all([
      prisma.listing.findMany({
        where: status ? { status: status as ListingStatus, ...current } : current,
        // Oldest request first: the queue is handled in order.
        orderBy: [{ submittedAt: 'asc' }, { updatedAt: 'desc' }],
        include: {
          airport: { select: { code: true, name: true, slug: true } },
          parking: {
            select: {
              id: true,
              name: true,
              address: true,
              totalCapacity: true,
              operator: { select: { id: true, name: true, status: true } },
              pricingTiers: { select: { days: true, priceCents: true }, orderBy: { days: 'asc' } },
            },
          },
        },
      }),
      prisma.listing.groupBy({ by: ['status'], where: current, _count: { _all: true } }),
    ]);
    return {
      counts: Object.fromEntries(LISTING_STATUSES.map(s => [s, counts.find(c => c.status === s)?._count._all ?? 0])),
      listings: listings.map(({ parking: { pricingTiers, operator, ...parking }, ...l }) => ({
        ...l,
        parking,
        operator,
        pricingTiers,
        fromPriceCents: pricingTiers.length ? Math.min(...pricingTiers.map(t => t.priceCents)) : null,
      })),
    };
  }

  public async approveListing(actor: AuthenticatedStaff, listingId: string) {
    const listing = await this.listings.transition(actor, listingId, 'approve', { reviewedAt: new Date(), reviewMessage: null });
    await this.notifyListing(listing.id, 'approved', null);
    return listing;
  }

  public async rejectListing(actor: AuthenticatedStaff, listingId: string, message: string) {
    const listing = await this.listings.transition(actor, listingId, 'reject', { reviewedAt: new Date(), reviewMessage: message.trim() });
    await this.notifyListing(listing.id, 'rejected', message.trim());
    return listing;
  }

  public async unpublishListing(actor: AuthenticatedStaff, listingId: string, message?: string) {
    const listing = await this.listings.transition(actor, listingId, 'unpublish', { reviewedAt: new Date(), reviewMessage: message?.trim() || null });
    await this.notifyListing(listing.id, 'unpublished', message?.trim() || null);
    return listing;
  }

  /** Emails the operator's managers about the platform's decision (when emails are configured). */
  private async notifyListing(listingId: string, decision: 'approved' | 'rejected' | 'unpublished', message: string | null) {
    if (!this.notifications.emailConfigured()) {
      logger.info(`[Notifications] Email not configured: listing_${decision} not sent for listing ${listingId}`);
      return;
    }
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId }, include: { airport: true, parking: true } });
    const managers = await prisma.staff.findMany({ where: { operatorId: listing.parking.operatorId, role: 'manager', isActive: true } });
    const editUrl = this.notifications.proUrl('/plazo/fiche');
    const email =
      decision === 'approved'
        ? listingApprovedEmail(PRODUCT_NAME, {
            title: listing.title,
            url: `${this.notifications.settings.publicSiteUrl.replace(/\/+$/, '')}/${listing.airport.slug}/${listing.slug}`,
          })
        : decision === 'rejected'
          ? listingRejectedEmail(PRODUCT_NAME, { title: listing.title, message: message ?? '', url: editUrl })
          : listingUnpublishedEmail(PRODUCT_NAME, { title: listing.title, message, url: editUrl });
    await Promise.all(managers.map(m => this.notifications.emailStaff(m, `listing_${decision}`, `listing ${listing.id}`, email)));
  }

  // ---- Bookings -----------------------------------------------------------------------------------

  /** Every operator's bookings (no contact details), filtered by operator and arrival dates. */
  public async reservations(query: { operatorId?: string; from?: string; to?: string; page?: number }) {
    const fields: Record<string, string> = {};
    if (query.from && !DATE_RE.test(query.from)) fields.from = 'invalid_date';
    if (query.to && !DATE_RE.test(query.to)) fields.to = 'invalid_date';
    if (Object.keys(fields).length) throw new ValidationException(fields);
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const arrivalAt: Prisma.DateTimeFilter = {};
    if (query.from) arrivalAt.gte = dayBounds(query.from, PLATFORM_TZ).start;
    if (query.to) arrivalAt.lt = dayBounds(query.to, PLATFORM_TZ).end;
    const where: Prisma.ReservationWhereInput = {
      status: { not: 'pending_payment' },
      ...(query.operatorId ? { operatorId: query.operatorId } : {}),
      ...(query.from || query.to ? { arrivalAt } : {}),
    };
    const [docs, totalDocs, operators] = await Promise.all([
      prisma.reservation.findMany({
        where,
        orderBy: { arrivalAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          reference: true,
          status: true,
          channel: true,
          channelDetail: true,
          arrivalAt: true,
          returnAt: true,
          createdAt: true,
          plate: true,
          priceCents: true,
          chargedCents: true,
          paymentStatus: true,
          operator: { select: { id: true, name: true } },
          parking: { select: { name: true } },
        },
      }),
      prisma.reservation.count({ where }),
      prisma.operator.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE));
    return {
      docs: docs.map(({ chargedCents, priceCents, ...r }) => ({ ...r, amountCents: chargedCents ?? priceCents })),
      totalDocs,
      page,
      limit: PAGE_SIZE,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      operators,
    };
  }

  // ---- Payments -----------------------------------------------------------------------------------

  /** Per operator: Stripe account, payout schedule, payouts waiting and payouts refused by Stripe. */
  public async paymentsOverview() {
    const [operators, pending, failed] = await Promise.all([
      prisma.operator.findMany({ orderBy: { name: 'asc' } }),
      prisma.reservation.groupBy({
        by: ['operatorId'],
        where: { payoutStatus: 'pending', paymentStatus: 'paid', status: { not: 'cancelled' } },
        _count: { _all: true },
        _sum: { operatorShareCents: true },
      }),
      prisma.reservation.findMany({
        where: { payoutStatus: 'failed' },
        orderBy: { returnAt: 'asc' },
        select: { id: true, reference: true, operatorId: true, operatorShareCents: true, arrivalAt: true, returnAt: true },
      }),
    ]);
    return {
      paymentsEnabled: this.paymentService.enabled(),
      operators: operators.map(o => {
        const waiting = pending.find(p => p.operatorId === o.id);
        return {
          id: o.id,
          name: o.name,
          status: o.status,
          stripe: { connected: !!o.stripeAccountId, chargesEnabled: o.stripeChargesEnabled, payoutsEnabled: o.stripePayoutsEnabled },
          payoutSchedule: o.payoutSchedule,
          commissionBps: o.commissionBps,
          pending: { count: waiting?._count._all ?? 0, amountCents: waiting?._sum.operatorShareCents ?? 0 },
          failed: failed
            .filter(f => f.operatorId === o.id)
            .map(f => ({
              reservationId: f.id,
              reference: f.reference,
              amountCents: f.operatorShareCents,
              arrivalAt: f.arrivalAt,
              returnAt: f.returnAt,
            })),
        };
      }),
    };
  }

  /** Tries again a payout Stripe refused, with the cron's logic (one transfer per booking, ever). */
  public async retryPayout(actor: AuthenticatedStaff, reservationId: string) {
    if (!this.paymentService.enabled())
      throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Online payments are not enabled', 'payments_disabled');
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { operator: true } });
    if (!reservation) throw notFound('Reservation');
    if (reservation.payoutStatus !== 'failed') throw new HttpException(httpStatus.CONFLICT, 'This payout has not failed', 'payout_not_failed');
    const { operator } = reservation;
    if (!operator.stripeAccountId || !operator.stripeChargesEnabled) {
      throw new HttpException(httpStatus.CONFLICT, "The operator's Stripe account cannot receive transfers", 'operator_account_not_ready');
    }
    const { count } = await prisma.reservation.updateMany({
      where: { id: reservationId, payoutStatus: 'failed' },
      data: { payoutStatus: 'pending' },
    });
    if (!count) throw new HttpException(httpStatus.CONFLICT, 'This payout has not failed', 'payout_not_failed');
    const result = await this.paymentService.transferShare(reservationId, operator.stripeAccountId);
    await this.audit.record(
      { id: actor.id, operatorId: operator.id },
      { action: 'payments.payout_retried', entityType: 'reservation', entityId: reservationId, details: { result } },
    );
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId }, select: { payoutStatus: true } });
    return { result, payoutStatus: after.payoutStatus };
  }
}
