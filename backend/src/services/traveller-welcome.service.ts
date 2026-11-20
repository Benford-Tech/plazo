import { createHmac, timingSafeEqual } from 'crypto';
import { Container, Service } from 'typedi';
import { PLAZO_APP_STORE_URL, PLAZO_PLAY_STORE_URL, PRODUCT_COMPANY, PRODUCT_NAME, SUPPORT_EMAIL } from '@/config';
import prisma from '@/database';
import { travellerStoreBadges } from '@/domain/account-messages';
import { publisherLine } from '@/domain/prospecting';
import { localDateTime } from '@/domain/time';
import { travellerEmail } from '@/domain/traveller-email';
import { EmailMessage } from '@/domain/booking-messages';
import { welcomeEmail, welcomeEmailHash } from '@/domain/traveller-welcome';
import { isTestOperatorName } from '@/domain/test-feed';
import { maskEmail, NOT_SENT_REASONS, NotSentReason, shortName, WelcomeOutcome, welcomeStateOf } from '@/domain/welcome-report';
import { HttpException } from '@/utils/httpException';
import { isSilentOperator } from '@/services/demo-guard';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';

/** One welcome email per address and operator in this time. */
export const WELCOME_REPEAT_MS = 365 * 24 * 3600_000;
const PER_PASS = 40;
/** A mail the provider refused is tried again after this long, while the booking is still in its window. */
export const WELCOME_RETRY_MS = 3600_000;

const REPORT_PERIODS = [7, 30, 90];
/** The list shows at most this many handled bookings (the counts cover them all). */
const REPORT_ROWS = 300;

export interface WelcomeReportRow {
  id: string;
  operatorId: string;
  operatorName: string;
  parking: string;
  traveller: string;
  email: string | null;
  reference: string;
  channel: string;
  channelDetail: string | null;
  createdAt: string;
  arrivalAt: string;
  handledAt: string;
  outcome: WelcomeOutcome | 'in_progress';
}

export interface WelcomeReport {
  days: number;
  from: string;
  counts: { bookings: number; sent: number; handledNotSent: number; notCandidate: number; pending: number };
  reasons: { reason: NotSentReason; count: number }[];
  outcomes: { outcome: WelcomeOutcome | 'in_progress'; count: number }[];
  rows: WelcomeReportRow[];
  truncated: boolean;
  operators: { id: string; name: string }[];
}

export interface WelcomeRunReport {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * 15/11/2026 (« Mail d'intro de Plazo au client avec message pour installer l'App », direction B): the welcome email to a
 * traveller whose booking did not come through Plazo (comparator, phone, counter, the parking's site, an imported mail).
 * Sent by the 15-minute pass, once per address and operator in 12 months, never for a file import, a stay already near,
 * an operator who sends nothing (test, demo), a parking without a listing (the link would not find the booking), nor an
 * address that opted out. Each booking is claimed before its email (two passes never send twice).
 */
@Service()
export class TravellerWelcomeService {
  public notifications = Container.get(NotificationService);

  public async run(now: Date = new Date()): Promise<WelcomeRunReport> {
    const report: WelcomeRunReport = { sent: 0, skipped: 0, failed: 0 };
    if (!this.notifications.canSendEmail() || !this.secret()) return report;
    const candidates = await prisma.reservation.findMany({
      where: {
        // 19/11/2026 (« les mails d'invitation ne semblent pas être envoyés »): a mail Brevo refused (its outage of the
        // day) was marked `failed` for good; it is now tried again every hour while the booking is in its window.
        OR: [{ welcomeEmailAt: null }, { welcomeEmailOutcome: 'failed', welcomeEmailAt: { lt: new Date(now.getTime() - WELCOME_RETRY_MS) } }],
        channel: { not: 'plazo' },
        status: 'upcoming',
        importId: null,
        anonymizedAt: null,
        // As soon as the traveller's email is known, however late (« il faut envoyer quand on a le mail », 20/11/2026):
        // a drop-off an hour away or an email added days after the booking still gets it, until the drop-off has passed.
        arrivalAt: { gt: now },
        customerEmail: { not: null },
        parking: { listing: { isNot: null } },
        operator: { suspendedAt: null, archivedAt: null, isDemo: false, prospectDemo: false },
        // Never a traveller who booked through Allopark (« ne pas envoyer le mail d'invitation quand c'est un mail
        // Allopark », 15/11/2026): neither its name on the booking nor its AL-… number. Written to keep the rows
        // whose name or number is empty (a NOT over a null column would drop them).
        AND: [
          { OR: [{ channelDetail: null }, { NOT: { channelDetail: { equals: 'Allopark', mode: 'insensitive' } } }] },
          { OR: [{ externalReference: null }, { NOT: { externalReference: { startsWith: 'AL-', mode: 'insensitive' } } }] },
        ],
      },
      // The id breaks a tie (two bookings of the same instant): the first booked of a traveller gets the mail, every time.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: PER_PASS,
      select: {
        id: true,
        welcomeEmailAt: true,
        operatorId: true,
        reference: true,
        externalReference: true,
        manageTokenVersion: true,
        customerEmail: true,
        customerFirstName: true,
        arrivalAt: true,
        returnAt: true,
        parking: { select: { name: true, timezone: true, listing: { select: { title: true } } } },
      },
    });
    for (const r of candidates) {
      // Claimed first: a second pass at the same time finds nothing to send.
      const claimed = await prisma.reservation.updateMany({
        where: { id: r.id, welcomeEmailAt: r.welcomeEmailAt },
        data: { welcomeEmailAt: now },
      });
      if (!claimed.count) continue;
      const outcome = await this.handle(r, now);
      await prisma.reservation.update({ where: { id: r.id }, data: { welcomeEmailOutcome: outcome } });
      if (outcome === 'sent') report.sent++;
      else if (outcome === 'failed') report.failed++;
      else report.skipped++;
    }
    return report;
  }

  private async handle(
    r: {
      id: string;
      operatorId: string;
      reference: string;
      externalReference: string | null;
      manageTokenVersion: number;
      customerEmail: string | null;
      customerFirstName: string | null;
      arrivalAt: Date;
      returnAt: Date;
      parking: { name: string; timezone: string; listing: { title: string } | null };
    },
    now: Date,
  ): Promise<'sent' | 'repeat' | 'opted_out' | 'no_email' | 'failed'> {
    if (await isSilentOperator(r.operatorId)) return 'no_email';
    const email = travellerEmail(r.customerEmail);
    if (!email) return 'no_email';
    const optedOut = await prisma.travellerEmailOptout.findUnique({ where: { emailHash: welcomeEmailHash(email) } });
    if (optedOut) return 'opted_out';
    const before = await prisma.reservation.count({
      where: {
        id: { not: r.id },
        operatorId: r.operatorId,
        customerEmail: { equals: email, mode: 'insensitive' },
        welcomeEmailOutcome: 'sent',
        welcomeEmailAt: { gte: new Date(now.getTime() - WELCOME_REPEAT_MS) },
      },
    });
    if (before) return 'repeat';
    const link = this.notifications.appLinkUrl(r);
    const unsubscribeUrl = this.notifications.siteUrl(`/api/public/traveller-emails/unsubscribe/${this.unsubscribeToken(r.id)}`);
    if (!link || !unsubscribeUrl) return 'failed';
    const message = this.compose({
      firstName: (r.customerFirstName ?? '').trim(),
      parkingName: r.parking.listing?.title || r.parking.name,
      arrivalLocal: localDateTime(r.arrivalAt, r.parking.timezone),
      returnLocal: localDateTime(r.returnAt, r.parking.timezone),
      reference: r.externalReference || r.reference,
      link,
      unsubscribeUrl,
    });
    const ok = await this.notifications.emailTraveller(
      { email, name: (r.customerFirstName ?? '').trim() || email },
      'traveller_welcome',
      r.id,
      message,
      [],
      {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      this.sender(),
    );
    return ok ? 'sent' : 'failed';
  }

  /** The service client's address sends it (« passe par contact@plazo.fr », 15/11/2026); else EMAIL_FROM. */
  private sender(): string | undefined {
    return SUPPORT_EMAIL ? `${PRODUCT_NAME} <${SUPPORT_EMAIL}>` : undefined;
  }

  private compose(fields: {
    firstName: string;
    parkingName: string;
    arrivalLocal: string;
    returnLocal: string;
    reference: string;
    link: string;
    unsubscribeUrl: string;
  }): EmailMessage {
    const imagesBase = this.notifications.siteUrl('');
    return welcomeEmail({
      productName: PRODUCT_NAME,
      ...fields,
      imagesBase,
      badges: imagesBase
        ? travellerStoreBadges(PRODUCT_NAME, { badgesBase: imagesBase, playStoreUrl: PLAZO_PLAY_STORE_URL, appStoreUrl: PLAZO_APP_STORE_URL })
        : [],
      publisher: publisherLine(PRODUCT_COMPANY) || PRODUCT_NAME,
    });
  }

  /**
   * 18/11/2026 (« affiche une liste des mails d'invitation envoyés côté plateforme », direction B): Plateforme › Mails
   * d'accueil. The bookings of the other channels created over the period (no demo, no test operator), the welcome
   * emails handled (newest first) and, for the others, the first reason they never were candidates.
   */
  public async report(requestedDays: number, operatorId: string | null, now: Date = new Date()): Promise<WelcomeReport> {
    const days = REPORT_PERIODS.includes(requestedDays) ? requestedDays : 30;
    const from = new Date(now.getTime() - days * 86400_000);
    const [marked, operators] = await Promise.all([
      prisma.reservation.aggregate({ _min: { welcomeEmailAt: true } }),
      prisma.operator.findMany({
        where: { isDemo: false, prospectDemo: false },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    const real = operators.filter(o => !isTestOperatorName(o.name));
    const realIds = real.map(o => o.id);
    const ids = operatorId ? realIds.filter(id => id === operatorId) : realIds;
    const rows = await prisma.reservation.findMany({
      where: { operatorId: { in: ids }, channel: { not: 'plazo' }, createdAt: { gte: from } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        operatorId: true,
        reference: true,
        externalReference: true,
        channel: true,
        channelDetail: true,
        status: true,
        importId: true,
        anonymizedAt: true,
        customerEmail: true,
        customerFirstName: true,
        customerLastName: true,
        createdAt: true,
        arrivalAt: true,
        welcomeEmailAt: true,
        welcomeEmailOutcome: true,
        operator: { select: { name: true, suspendedAt: true, archivedAt: true } },
        parking: { select: { name: true, listing: { select: { title: true } } } },
      },
    });
    const markedAt = marked._min.welcomeEmailAt ?? null;
    const reasons = new Map<NotSentReason, number>();
    const outcomes = new Map<WelcomeOutcome | 'in_progress', number>();
    const handled: WelcomeReportRow[] = [];
    for (const r of rows) {
      const state = welcomeStateOf(
        {
          ...r,
          hasListing: !!r.parking.listing,
          operatorOff: !!(r.operator.suspendedAt || r.operator.archivedAt),
        },
        now,
        markedAt,
      );
      if (state.kind === 'not_sent') {
        reasons.set(state.reason, (reasons.get(state.reason) ?? 0) + 1);
        continue;
      }
      outcomes.set(state.outcome, (outcomes.get(state.outcome) ?? 0) + 1);
      handled.push({
        id: r.id,
        operatorId: r.operatorId,
        operatorName: r.operator.name,
        parking: r.parking.listing?.title || r.parking.name,
        traveller: r.anonymizedAt ? 'Client anonymisé' : shortName(r.customerFirstName, r.customerLastName),
        email: r.anonymizedAt ? null : maskEmail(r.customerEmail),
        reference: r.externalReference || r.reference,
        channel: r.channel,
        channelDetail: r.channelDetail,
        createdAt: r.createdAt.toISOString(),
        arrivalAt: r.arrivalAt.toISOString(),
        handledAt: (r.welcomeEmailAt as Date).toISOString(),
        outcome: state.outcome,
      });
    }
    handled.sort((a, b) => b.handledAt.localeCompare(a.handledAt));
    const sent = outcomes.get('sent') ?? 0;
    const pending = reasons.get('pending') ?? 0;
    const notCandidate = [...reasons.entries()].reduce((n, [k, v]) => (k === 'pending' ? n : n + v), 0);
    return {
      days,
      from: from.toISOString(),
      counts: { bookings: rows.length, sent, handledNotSent: handled.length - sent, notCandidate, pending },
      reasons: NOT_SENT_REASONS.filter(k => reasons.get(k)).map(reason => ({ reason, count: reasons.get(reason) as number })),
      outcomes: [...outcomes.entries()].map(([outcome, count]) => ({ outcome, count })),
      rows: handled.slice(0, REPORT_ROWS),
      truncated: handled.length > REPORT_ROWS,
      operators: real,
    };
  }

  /**
   * 15/11/2026 (« mets-le à dispo sur Plazo, je ferai le test d'envoi », Plateforme › Notifications): the welcome email of an
   * example booking (in 5 days, 7 nights, a Onepark number) for the operator chosen, sent to the admin who asks. Nothing is
   * recorded on any booking; the links go to the site's « Ma réservation » page.
   */
  public async sendTest(to: { email: string; firstName: string }, operatorId: string | null, now: Date = new Date()) {
    if (!this.notifications.canSendEmail()) throw new HttpException(409, 'Email is not configured', 'email_unavailable');
    const parking = operatorId
      ? await prisma.parking.findFirst({
          where: { operatorId },
          orderBy: { createdAt: 'asc' },
          select: { name: true, timezone: true, listing: { select: { title: true } } },
        })
      : null;
    if (operatorId && !parking) throw new HttpException(404, 'Operator not found', 'not_found');
    const timezone = parking?.timezone ?? 'Europe/Paris';
    const day = localDateTime(new Date(now.getTime() + 5 * 86400_000), timezone).slice(0, 10);
    const back = localDateTime(new Date(now.getTime() + 12 * 86400_000), timezone).slice(0, 10);
    const link = this.notifications.siteUrl('/ma-reservation') || 'https://www.plazo.fr/ma-reservation';
    const message = this.compose({
      firstName: to.firstName,
      parkingName: parking?.listing?.title || parking?.name || 'Parking des Cèdres',
      arrivalLocal: `${day}T06:30`,
      returnLocal: `${back}T21:40`,
      reference: '#5908369',
      link,
      unsubscribeUrl: link,
    });
    const ok = await this.notifications.emailTraveller(
      { email: to.email, name: to.firstName || to.email },
      'traveller_welcome_test',
      operatorId ?? 'platform',
      { ...message, subject: `[Test] ${message.subject}` },
      [],
      {},
      this.sender(),
    );
    if (!ok) throw new HttpException(502, 'The email could not be sent', 'email_failed');
    return { to: to.email, from: SUPPORT_EMAIL || null, subject: message.subject };
  }

  // ---- « Ne plus recevoir ces messages » ----------------------------------------------------------------------------

  private secret(): string {
    return process.env.SECRET_KEY || '';
  }

  private signature(id: string): string {
    return createHmac('sha256', this.secret()).update(`traveller-welcome:${id}`).digest('base64url');
  }

  public unsubscribeToken(reservationId: string): string {
    return `${reservationId}.${this.signature(reservationId)}`;
  }

  private verifyToken(token: unknown): string | null {
    if (!this.secret() || typeof token !== 'string' || token.length > 200) return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const id = token.slice(0, dot);
    if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
    const given = Buffer.from(token.slice(dot + 1));
    const expected = Buffer.from(this.signature(id));
    return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
  }

  /** The page's state: null for a bad link (or a booking erased since), else whether the address already opted out. */
  public async unsubscribeState(token: unknown): Promise<{ off: boolean } | null> {
    const email = await this.emailOf(token);
    if (!email) return null;
    return { off: !!(await prisma.travellerEmailOptout.findUnique({ where: { emailHash: welcomeEmailHash(email) } })) };
  }

  /** The page's button and the one-click unsubscription (RFC 8058): the address never gets a welcome email again. */
  public async unsubscribe(token: unknown): Promise<boolean> {
    const email = await this.emailOf(token);
    if (!email) return false;
    const emailHash = welcomeEmailHash(email);
    await prisma.travellerEmailOptout.upsert({ where: { emailHash }, create: { emailHash }, update: {} });
    logger.info('[TravellerWelcome] An address opted out');
    return true;
  }

  private async emailOf(token: unknown): Promise<string | null> {
    const id = this.verifyToken(token);
    if (!id) return null;
    const r = await prisma.reservation.findUnique({ where: { id }, select: { customerEmail: true } });
    return travellerEmail(r?.customerEmail);
  }
}
