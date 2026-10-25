import { createHmac, timingSafeEqual } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { inboundEmailAvailable } from '@/config';
import prisma, { InboundEmailStatus, Staff } from '@/database';
import { sourceLabel } from '@/domain/booking-digest';
import { COMPARATOR_PROVIDERS } from '@/domain/importers';
import { comparatorStates } from '@/domain/inbound-comparators';
import {
  COMPARATOR_QUIET_DAYS,
  MORNING_EMAIL_DEFAULT_HOUR,
  MORNING_EMAIL_HOURS,
  MORNING_EMAIL_MOVES,
  MorningDigest,
  morningEmail,
  morningEmailDue,
  MorningIntegration,
  MorningMove,
  wantsMorningEmail,
} from '@/domain/morning-email';
import { can } from '@/domain/roles';
import { addDays, localDate, localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { DashboardService } from './dashboard.service';
import { NotificationService } from './notification.service';
import { ParkingService } from './parking.service';
import { ReservationService } from './reservation.service';
import { RevenueService } from './revenue.service';

const DAY = 86400000;
/** Statuses of an email that came in (not Gmail's confirmation, not an email set aside). */
const RECEIVED: InboundEmailStatus[] = ['imported', 'duplicate', 'incomplete', 'unrecognised', 'dismissed', 'handled', 'archived'];
const TO_CHECK: InboundEmailStatus[] = ['incomplete', 'unrecognised'];
const MONTHS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
/** Members written to per pass at most (one Vercel function call). */
const PER_PASS = 40;

export interface MorningEmailPreference {
  enabled: boolean;
  hour: number;
  /** Where it goes: the member's own address. */
  email: string;
}

export interface MorningRunReport {
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * « Mail du matin » (21/10/2026, choice A): the day's planning, the revenue (managers) and the integrations, by email, every
 * morning at the hour each member chose (domain/morning-email.ts). Sent by the 15-minute pass of `remind-tomorrow` and by
 * GET /internal/cron/morning-email; once per member and local day (claimed before it is sent: two passes never send it twice).
 */
@Service()
export class MorningEmailService {
  public dashboard = Container.get(DashboardService);
  public notifications = Container.get(NotificationService);
  public parkings = Container.get(ParkingService);
  public reservations = Container.get(ReservationService);
  public revenue = Container.get(RevenueService);

  // ---- The member's setting --------------------------------------------------------------------------------------

  public async preference(actor: AuthenticatedStaff): Promise<MorningEmailPreference> {
    const staff = await prisma.staff.findUniqueOrThrow({
      where: { id: actor.id },
      select: { morningEmail: true, morningEmailHour: true, role: true, email: true },
    });
    return { enabled: wantsMorningEmail(staff.morningEmail, staff.role), hour: staff.morningEmailHour, email: staff.email };
  }

  public async updatePreference(actor: AuthenticatedStaff, patch: { enabled?: boolean; hour?: number }): Promise<MorningEmailPreference> {
    if (patch.hour !== undefined && !(MORNING_EMAIL_HOURS as readonly number[]).includes(patch.hour)) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid hour', 'validation_failed', { fields: { 'morningEmail.hour': 'invalid' } });
    }
    await prisma.staff.update({
      where: { id: actor.id },
      data: {
        ...(patch.enabled !== undefined ? { morningEmail: patch.enabled } : {}),
        ...(patch.hour !== undefined ? { morningEmailHour: patch.hour } : {}),
      },
    });
    return this.preference(actor);
  }

  /** « M'envoyer celui d'aujourd'hui »: today's email now, whatever the setting (it does not count as today's). */
  public async sendNow(actor: AuthenticatedStaff, now: Date = new Date()): Promise<{ sent: boolean }> {
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (!this.notifications.emailConfigured())
      throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Email is not configured', 'email_unavailable');
    const sent = await this.send(staff, actor.operatorName, now);
    if (!sent) throw new HttpException(httpStatus.BAD_GATEWAY, 'The email could not be sent', 'email_unavailable');
    return { sent };
  }

  // ---- The opt-out link ------------------------------------------------------------------------------------------

  private secret(): string {
    return process.env.SECRET_KEY || '';
  }

  private signature(id: string): string {
    return createHmac('sha256', this.secret()).update(`morning-email:${id}`).digest('base64url');
  }

  public unsubscribeToken(staffId: string): string {
    return `${staffId}.${this.signature(staffId)}`;
  }

  /** The member id of a valid token, else null (constant-time comparison). */
  public verifyToken(token: unknown): string | null {
    if (!this.secret() || typeof token !== 'string' || token.length > 200) return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const id = token.slice(0, dot);
    if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
    const given = Buffer.from(token.slice(dot + 1));
    const expected = Buffer.from(this.signature(id));
    return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
  }

  /** The page's state: whether the link is good and the email already off. */
  public async unsubscribeState(token: unknown): Promise<{ off: boolean } | null> {
    const id = this.verifyToken(token);
    if (!id) return null;
    const staff = await prisma.staff.findUnique({ where: { id }, select: { morningEmail: true, role: true } });
    return staff ? { off: !wantsMorningEmail(staff.morningEmail, staff.role) } : null;
  }

  /** « Ne plus le recevoir »: the button of the page, and the one-click unsubscription (RFC 8058). */
  public async unsubscribe(token: unknown): Promise<boolean> {
    const id = this.verifyToken(token);
    if (!id) return false;
    const { count } = await prisma.staff.updateMany({ where: { id }, data: { morningEmail: false } });
    if (count) logger.info(`[MorningEmail] Turned off by the link for staff ${id}`);
    return count > 0;
  }

  // ---- The pass ---------------------------------------------------------------------------------------------------

  /** Every member whose morning has come: claimed (today's date written), then written to. Never throws for one member. */
  public async run(now: Date = new Date()): Promise<MorningRunReport> {
    const report: MorningRunReport = { sent: 0, failed: 0, skipped: 0 };
    if (!this.notifications.emailConfigured()) return report;
    const members = await prisma.staff.findMany({
      where: {
        isActive: true,
        leftAt: null,
        deletedAt: null,
        OR: [{ morningEmail: true }, { morningEmail: null, role: 'manager' }],
        operator: { suspendedAt: null, archivedAt: null, isDemo: false, prospectDemo: false },
      },
      include: { operator: { select: { name: true, parkings: { select: { timezone: true }, orderBy: { createdAt: 'asc' }, take: 1 } } } },
      orderBy: { id: 'asc' },
    });
    let written = 0;
    for (const member of members) {
      if (written >= PER_PASS) break;
      const timezone = member.operator.parkings[0]?.timezone;
      if (!timezone) continue;
      const local = localDateTime(now, timezone);
      const today = local.slice(0, 10);
      if (!morningEmailDue(Number(local.slice(11, 13)), member.morningEmailHour, member.morningEmailSentOn, today)) continue;
      // Claimed first: a second pass at the same time finds the day already written.
      const claimed = await prisma.staff.updateMany({
        where: { id: member.id, OR: [{ morningEmailSentOn: null }, { morningEmailSentOn: { not: today } }] },
        data: { morningEmailSentOn: today },
      });
      if (!claimed.count) continue;
      written += 1;
      try {
        const ok = await this.send(member, member.operator.name, now);
        if (ok) report.sent += 1;
        else report.failed += 1;
      } catch (error) {
        report.failed += 1;
        logger.error(`[MorningEmail] Failed for staff ${member.id}: ${(error as Error)?.name ?? 'error'}`);
      }
    }
    return report;
  }

  /** Builds and sends one member's email. Returns whether Brevo accepted it. */
  private async send(staff: Staff, operatorName: string, now: Date): Promise<boolean> {
    const actor = { ...staff, operatorName } as AuthenticatedStaff;
    const digest = await this.digest(actor, now);
    const message = morningEmail(digest);
    const unsubscribe = digest.links.unsubscribe;
    return this.notifications.emailStaff({ email: staff.email, name: staff.name }, 'morning_email', `staff ${staff.id}`, message, {
      headers: unsubscribe.startsWith('https://')
        ? { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
        : {},
    });
  }

  /** What the email says, read with the member's own rights (the revenue for the managers only). */
  public async digest(actor: AuthenticatedStaff, now: Date = new Date()): Promise<MorningDigest> {
    const parking = await this.parkings.getPrimary(actor);
    const timezone = parking.timezone;
    const today = localDate(now, timezone);
    const [dashboard, planning] = await Promise.all([this.dashboard.get(actor), this.reservations.planning(actor, today)]);
    const time = (d: Date) => localDateTime(d, timezone).slice(11, 16);

    const moves: MorningMove[] = [
      ...planning.arrivals.map(r => ({
        at: r.arrivalAt,
        move: {
          time: time(r.arrivalAt),
          kind: 'arrival' as const,
          customer: r.customerName,
          source: sourceLabel(r.channel, r.channelDetail),
          detail: r.departureFlight ? `vol ${r.departureFlight}` : r.passengers ? `${r.passengers} pass.` : null,
        },
      })),
      ...planning.returns.map(r => ({
        at: r.returnAt,
        move: {
          time: time(r.returnAt),
          kind: 'return' as const,
          customer: r.customerName,
          source: sourceLabel(r.channel, r.channelDetail),
          detail: r.returnFlight ? `vol ${r.returnFlight}` : null,
        },
      })),
    ]
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map(m => m.move);

    const tonight = planning.nights[0] ?? null;
    const revenue = can(actor.role, 'revenue:view') ? await this.revenueOf(actor, today, now) : null;

    return {
      firstName: actor.firstName,
      parkingName: parking.name,
      date: today,
      sendHour: actor.morningEmailHour ?? MORNING_EMAIL_DEFAULT_HOUR,
      role: actor.role,
      onSite: dashboard.counts.onSite,
      capacity: dashboard.parking.plannedSpots || null,
      arrivals: { count: planning.arrivals.length, first: planning.arrivals[0] ? time(planning.arrivals[0].arrivalAt) : null },
      returns: {
        count: planning.returns.length,
        last: planning.returns.length ? time(planning.returns[planning.returns.length - 1].returnAt) : null,
      },
      tonight: tonight ? { count: tonight.count, bookable: tonight.bookable } : null,
      moves: moves.slice(0, MORNING_EMAIL_MOVES),
      movesTotal: moves.length,
      revenue,
      integrations: await this.integrations(actor, dashboard, now),
      links: {
        dashboard: this.notifications.proUrl('/'),
        unsubscribe: this.notifications.siteUrl(`/api/public/morning-email/unsubscribe/${this.unsubscribeToken(actor.id)}`) ?? '',
        settings: this.notifications.proUrl('/mon-compte'),
      },
    };
  }

  private async revenueOf(actor: AuthenticatedStaff, today: string, now: Date): Promise<MorningDigest['revenue']> {
    const yesterday = addDays(today, -1);
    const [summary, day] = await Promise.all([
      this.revenue.summary(actor, now),
      this.revenue.report(actor, { from: yesterday, to: yesterday, basis: 'booked' }, now),
    ]);
    return {
      yesterdayCents: day.totalCents,
      yesterdayCount: day.count,
      monthLabel: MONTHS_LONG[Number(today.slice(5, 7)) - 1],
      monthCents: summary.month.totalCents,
      commissionCents: summary.month.commissionCents,
      netCents: summary.month.netCents,
      withoutAmount: summary.month.withoutAmount,
    };
  }

  /** The comparators' emails and the services, as the dashboard reads them. */
  private async integrations(
    actor: AuthenticatedStaff,
    dashboard: Awaited<ReturnType<DashboardService['get']>>,
    now: Date,
  ): Promise<MorningIntegration[]> {
    const rows: MorningIntegration[] = [];
    if (inboundEmailAvailable()) {
      const since = new Date(now.getTime() - DAY);
      const [received, imported, toCheck, recent] = await Promise.all([
        prisma.inboundEmail.count({ where: { operatorId: actor.operatorId, status: { in: RECEIVED }, receivedAt: { gte: since } } }),
        prisma.inboundEmail.count({ where: { operatorId: actor.operatorId, status: { in: ['imported', 'duplicate'] }, receivedAt: { gte: since } } }),
        prisma.inboundEmail.count({ where: { operatorId: actor.operatorId, status: { in: TO_CHECK } } }),
        prisma.inboundEmail.findMany({
          where: { operatorId: actor.operatorId, status: { in: RECEIVED }, receivedAt: { gte: new Date(now.getTime() - 90 * DAY) } },
          select: { provider: true, fromAddress: true, status: true, delivery: true, receivedAt: true },
          orderBy: { receivedAt: 'desc' },
          take: 500,
        }),
      ]);
      rows.push({
        label: `Mails des comparateurs · ${received} reçu${received > 1 ? 's' : ''} en 24 h, ${imported} importé${imported > 1 ? 's' : ''}`,
        tone: toCheck ? 'warn' : 'ok',
        badge: toCheck ? `${toCheck} à traiter` : 'OK',
      });
      const timezone = dashboard.parking.timezone;
      for (const state of comparatorStates(recent, COMPARATOR_PROVIDERS, now)) {
        if (!state.lastReceivedAt) continue;
        const last = new Date(state.lastReceivedAt);
        const days = Math.floor((now.getTime() - last.getTime()) / DAY);
        rows.push(
          days >= COMPARATOR_QUIET_DAYS
            ? { label: `${state.provider} · aucun mail depuis ${days} jours`, tone: 'warn', badge: 'À voir' }
            : {
                label: `${state.provider} · dernier mail le ${localDateTime(last, timezone).slice(8, 10)}/${localDateTime(last, timezone).slice(5, 7)} à ${localDateTime(last, timezone).slice(11, 16)}`,
                tone: 'ok',
                badge: 'OK',
              },
        );
      }
    }
    const s = dashboard.services;
    rows.push({ label: 'Suivi des vols', tone: s.flights.configured ? 'ok' : 'off', badge: s.flights.configured ? 'OK' : 'Off' });
    rows.push(
      s.sms.mode === 'none'
        ? { label: 'SMS aux voyageurs', tone: 'off', badge: 'Off' }
        : s.sms.stale
          ? { label: `SMS aux voyageurs · ${s.sms.pending} en attente`, tone: 'warn', badge: 'À voir' }
          : { label: 'SMS aux voyageurs', tone: 'ok', badge: 'OK' },
    );
    rows.push({ label: 'Paiements en ligne', tone: s.stripe.online ? 'ok' : 'off', badge: s.stripe.online ? 'OK' : 'Off' });
    if (s.reading.configured) {
      rows.push(
        s.reading.outage
          ? { label: 'Lecture des mails par Claude · en panne', tone: 'warn', badge: 'À voir' }
          : { label: 'Lecture des mails par Claude', tone: 'ok', badge: 'OK' },
      );
    }
    return rows;
  }
}
