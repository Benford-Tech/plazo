import { Container, Service } from 'typedi';
import { PRODUCT_NAME, platformAdminEmails } from '@/config';
import prisma, { InboundEmailStatus } from '@/database';
import { classifyMail } from '@/domain/inbound-kind';
import {
  inboundReportEmail,
  mayAlert,
  REPORT_MAX_ROWS,
  ReportEmail,
  ReportOperator,
  reportDay,
  STALE_AFTER_MS,
  STALE_WINDOW_MS,
  staleAlert,
} from '@/domain/inbound-watch';
import { DEFAULT_TIMEZONE } from '@/domain/booking-digest';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

const TO_CHECK: InboundEmailStatus[] = ['incomplete', 'unrecognised'];
const IMPORTED: InboundEmailStatus[] = ['imported', 'duplicate'];
const KIND_LABELS: Record<string, string> = {
  booking: 'Réservation',
  modification: 'Modification',
  cancellation: 'Annulation',
  other: 'Autre',
};

export interface InboundWatchReport {
  alerted: number;
  operators: number;
  report: 'sent' | 'not_due' | 'already_sent' | 'not_sent';
}

/**
 * 09/11/2026 (« faut un job qui parcourt les mails en continu pour voir si tout est ok »): every 15 minutes (the pass of
 * remind-tomorrow), the managers hear of a comparator's email still « À traiter » two hours after it came, once per
 * email, and each morning the platform's administrators get the report of the inbound emails (domain/inbound-watch.ts).
 * The emails the rules now read otherwise are read again by the relay's pass (InboundEmailService.rereadWithNewRules).
 * Logged without personal data.
 */
@Service()
export class InboundWatchService {
  private push = Container.get(PushService);
  private notifications = Container.get(NotificationService);

  public async run(now = new Date()): Promise<InboundWatchReport> {
    const { alerted, operators } = await this.alertStale(now);
    const report = await this.sendReport(now);
    if (alerted || report === 'sent') logger.info(`[Inbound watch] ${alerted} emails told to ${operators} operators; report ${report}`);
    return { alerted, operators, report };
  }

  /** The comparators' emails still « À traiter » two hours after they came: one push per operator, each email once. */
  public async alertStale(now = new Date()): Promise<{ alerted: number; operators: number }> {
    const rows = await prisma.inboundEmail.findMany({
      where: {
        status: { in: TO_CHECK },
        reservationId: null,
        staleAlertedAt: null,
        receivedAt: { gte: new Date(now.getTime() - STALE_WINDOW_MS), lte: new Date(now.getTime() - STALE_AFTER_MS) },
        operator: { status: 'active', suspendedAt: null, archivedAt: null, prospectDemo: false, isDemo: false },
      },
      select: {
        id: true,
        operatorId: true,
        subject: true,
        fromName: true,
        fromAddress: true,
        textBody: true,
        links: true,
        reading: true,
        operator: { select: { parkings: { select: { timezone: true }, orderBy: { createdAt: 'asc' }, take: 1 } } },
      },
      orderBy: { receivedAt: 'asc' },
      take: 200,
    });
    const byOperator = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byOperator.get(row.operatorId) ?? [];
      list.push(row);
      byOperator.set(row.operatorId, list);
    }
    let alerted = 0;
    let operators = 0;
    for (const [operatorId, list] of byOperator) {
      const timeZone = list[0].operator.parkings[0]?.timezone ?? DEFAULT_TIMEZONE;
      // The night's emails are told at 07:00 (they stay unmarked meanwhile).
      if (!mayAlert(now, timeZone)) continue;
      // A comparator's email only: the others (a customer's question, a newsletter) are the staff's to read when they will.
      const comparators = list
        .map(row => ({ row, provider: this.providerOf(row) }))
        .filter((e): e is { row: (typeof list)[number]; provider: string } => !!e.provider);
      const ids = list.map(row => row.id);
      // Each email considered once, told or not: never twice, never a later push about an old non-comparator email.
      const { count } = await prisma.inboundEmail.updateMany({ where: { id: { in: ids }, staleAlertedAt: null }, data: { staleAlertedAt: now } });
      if (!count || !comparators.length) continue;
      const message = staleAlert(comparators.map(e => ({ sender: e.provider, subject: e.row.subject })));
      await this.push.notifyStaff(operatorId, 'inbox', message, {
        data: { type: 'inbox', event: 'stale', ...(comparators.length === 1 ? { emailId: comparators[0].row.id } : {}) },
        collapseId: `inbox-stale-${operatorId}`,
      });
      alerted += comparators.length;
      operators += 1;
    }
    return { alerted, operators };
  }

  private providerOf(row: {
    subject: string | null;
    fromName: string | null;
    fromAddress: string | null;
    textBody: string | null;
    links: string[];
    reading: unknown;
  }): string | null {
    const sender = [row.fromName, row.fromAddress].filter(Boolean).join(' ');
    const type = row.textBody !== null ? classifyMail({ subject: row.subject, text: row.textBody, from: sender, links: row.links }) : null;
    return type?.provider ?? null;
  }

  /** The platform's morning report, once per Paris day (the row taken first: two passes never send it twice). */
  public async sendReport(now = new Date()): Promise<InboundWatchReport['report']> {
    const day = reportDay(now);
    if (!day) return 'not_due';
    const recipients = platformAdminEmails();
    if (!recipients.length || !this.notifications.canSendEmail()) return 'not_sent';
    const { count } = await prisma.inboundWatchReport.createMany({ data: [{ day }], skipDuplicates: true });
    if (!count) return 'already_sent';
    try {
      const message = await this.report(day, now);
      const names = await prisma.staff.findMany({
        where: { email: { in: recipients, mode: 'insensitive' } },
        select: { email: true, firstName: true, lastName: true },
      });
      let sent = 0;
      for (const email of recipients) {
        const staff = names.find(s => s.email.toLowerCase() === email);
        const name = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') : '';
        if (await this.notifications.emailStaff({ email, name }, 'inbound-report', day, message)) sent += 1;
      }
      if (sent) return 'sent';
    } catch (error) {
      logger.error(`[Inbound watch] report of ${day} failed: ${error instanceof Error ? error.name : 'unknown error'}`);
    }
    // Not sent: the next pass tries again (until noon).
    await prisma.inboundWatchReport.delete({ where: { day } }).catch(() => undefined);
    return 'not_sent';
  }

  /** The last 24 hours of every real operator (no demo, no prospects' demo). */
  private async report(day: string, now: Date) {
    const since = new Date(now.getTime() - 24 * 3_600_000);
    const rows = await prisma.inboundEmail.findMany({
      where: {
        receivedAt: { gte: since },
        status: { notIn: ['ignored', 'forwarding'] },
        operator: { prospectDemo: false, isDemo: false },
      },
      select: {
        status: true,
        receivedAt: true,
        subject: true,
        fromName: true,
        fromAddress: true,
        reading: true,
        reservationId: true,
        operator: { select: { name: true } },
      },
      orderBy: { receivedAt: 'asc' },
    });
    const operators = new Map<string, ReportOperator>();
    const emails: ReportEmail[] = [];
    for (const row of rows) {
      const name = row.operator.name;
      const entry = operators.get(name) ?? { name, received: 0, imported: 0, toCheck: 0 };
      entry.received += 1;
      if (IMPORTED.includes(row.status)) entry.imported += 1;
      const waiting = TO_CHECK.includes(row.status) && !row.reservationId;
      if (waiting) {
        entry.toCheck += 1;
        const reading = (row.reading ?? null) as { kind?: string; provider?: string | null; rule?: string } | null;
        emails.push({
          operator: name,
          receivedAt: row.receivedAt,
          sender: row.fromName || row.fromAddress || 'Expéditeur inconnu',
          subject: row.subject,
          state: row.status === 'incomplete' ? 'À compléter' : 'Non reconnu',
          reading: reading?.kind
            ? [KIND_LABELS[reading.kind] ?? reading.kind, reading.provider, reading.rule].filter(Boolean).join(' · ')
            : 'Aucune lecture',
        });
      }
      operators.set(name, entry);
    }
    const list = [...operators.values()].sort((a, b) => b.toCheck - a.toCheck || a.name.localeCompare(b.name, 'fr'));
    return inboundReportEmail(PRODUCT_NAME, {
      day,
      operators: list,
      emails: emails.slice(0, REPORT_MAX_ROWS),
      more: Math.max(0, emails.length - REPORT_MAX_ROWS),
      inboxUrl: /^https?:\/\//.test(this.notifications.proUrl('/plateforme')) ? this.notifications.proUrl('/plateforme') : null,
    });
  }
}
