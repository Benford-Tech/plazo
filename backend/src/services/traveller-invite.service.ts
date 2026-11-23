import { Container, Service } from 'typedi';
import { SECRET_KEY, whatsappInviteTemplate } from '@/config';
import prisma from '@/database';
import { appLinkCode } from '@/domain/app-link';
import { smsRecipient } from '@/domain/phone';
import { travellerEmail } from '@/domain/traveller-email';
import { INVITE_KIND, INVITE_REPEAT_MS, inviteHour, InviteOutcome, inviteParams, inviteText, phoneHash, stayLabel } from '@/domain/traveller-invite';
import { whatsappImage } from '@/domain/whatsapp';
import { logger } from '@/utils/logger';
import { isSilentOperator } from './demo-guard';
import { NotificationService } from './notification.service';
import { WhatsappService } from './whatsapp.service';

const PER_PASS = 40;

export interface InviteRunReport {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * 23/11/2026: the WhatsApp invitation to install Plazo, to a traveller of another channel whose email is unknown. Sent by
 * the 15-minute pass, once per number and operator in 12 months, by day only, never after a STOP, for an operator who
 * sends nothing (test, demo) or who turned WhatsApp off. Nothing leaves until WHATSAPP_INVITE_TEMPLATE names the template
 * Meta approved. Each booking is claimed before its message.
 */
@Service()
export class TravellerInviteService {
  public notifications = Container.get(NotificationService);
  public whatsapp = Container.get(WhatsappService);
  /** Read from the environment on each use; tests override it. */
  public template = whatsappInviteTemplate;

  public async run(now: Date = new Date()): Promise<InviteRunReport> {
    const report: InviteRunReport = { sent: 0, skipped: 0, failed: 0 };
    const template = this.template();
    if (!template || !SECRET_KEY || !this.whatsapp.available()) return report;
    const candidates = await prisma.reservation.findMany({
      where: {
        appInviteAt: null,
        channel: { not: 'plazo' },
        status: 'upcoming',
        anonymizedAt: null,
        arrivalAt: { gt: now },
        parking: { listing: { isNot: null } },
        operator: { suspendedAt: null, archivedAt: null, isDemo: false, prospectDemo: false },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: PER_PASS * 5,
      select: {
        id: true,
        operatorId: true,
        reference: true,
        manageTokenVersion: true,
        customerEmail: true,
        customerPhone: true,
        customerFirstName: true,
        arrivalAt: true,
        returnAt: true,
        parking: { select: { name: true, timezone: true, listing: { select: { title: true } } } },
      },
    });
    let handled = 0;
    for (const r of candidates) {
      if (handled >= PER_PASS) break;
      if (!inviteHour(now, r.parking.timezone)) continue;
      const claimed = await prisma.reservation.updateMany({ where: { id: r.id, appInviteAt: null }, data: { appInviteAt: now } });
      if (!claimed.count) continue;
      handled++;
      const outcome = await this.handle(r, template, now);
      await prisma.reservation.update({ where: { id: r.id }, data: { appInviteOutcome: outcome } });
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
      manageTokenVersion: number;
      customerEmail: string | null;
      customerPhone: string;
      customerFirstName: string | null;
      arrivalAt: Date;
      returnAt: Date;
      parking: { name: string; timezone: string; listing: { title: string } | null };
    },
    template: string,
    now: Date,
  ): Promise<InviteOutcome> {
    // The welcome email is theirs.
    if (travellerEmail(r.customerEmail)) return 'has_email';
    if (await isSilentOperator(r.operatorId)) return 'off';
    if (!(await this.whatsapp.enabledFor(r.operatorId))) return 'off';
    const recipient = smsRecipient(r.customerPhone ?? '');
    if (!recipient) return 'no_phone';
    if (await prisma.travellerPhoneOptout.findUnique({ where: { phoneHash: phoneHash(recipient) } })) return 'opted_out';
    const before = await prisma.whatsappMessage.count({
      where: {
        operatorId: r.operatorId,
        kind: INVITE_KIND,
        to: recipient,
        status: { not: 'failed' },
        createdAt: { gte: new Date(now.getTime() - INVITE_REPEAT_MS) },
      },
    });
    // The rows are purged at 30 days: the bookings keep the longer memory.
    const earlier = before
      ? 1
      : await prisma.reservation.count({
          where: {
            id: { not: r.id },
            operatorId: r.operatorId,
            customerPhone: r.customerPhone,
            appInviteOutcome: 'sent',
            appInviteAt: { gte: new Date(now.getTime() - INVITE_REPEAT_MS) },
          },
        });
    if (earlier) return 'repeat';
    const params = inviteParams({
      firstName: (r.customerFirstName ?? '').trim(),
      parking: r.parking.listing?.title || r.parking.name,
      stay: stayLabel(r.arrivalAt, r.returnAt, r.parking.timezone),
    });
    const from = await this.whatsapp.numbers.senderFor(r.operatorId);
    const result = await this.whatsapp.sendTemplate(recipient, params, {
      name: template,
      image: whatsappImage(this.notifications.siteUrl('/whatsapp/plazo-invitation.jpg')),
      button: appLinkCode(r, SECRET_KEY as string),
      from,
    });
    await prisma.whatsappMessage.create({
      data: {
        operatorId: r.operatorId,
        reservationId: r.id,
        kind: INVITE_KIND,
        to: recipient,
        waMessageId: result.ok ? result.id : null,
        status: result.ok ? 'sent' : 'failed',
        errorCode: result.ok ? null : result.code,
        body: inviteText(params),
        fromPhoneNumberId: from,
      },
    });
    if (result.ok) logger.info(`[WhatsApp] ${INVITE_KIND} handed to Meta for reservation ${r.id}`);
    else logger.warn(`[WhatsApp] ${INVITE_KIND} refused for reservation ${r.id}: ${result.code}`);
    return result.ok ? 'sent' : 'failed';
  }

  /** A traveller answered STOP to Plazo's number: no invitation to that number again. */
  public async optOut(e164: string): Promise<void> {
    const hash = phoneHash(e164);
    await prisma.travellerPhoneOptout.upsert({ where: { phoneHash: hash }, create: { phoneHash: hash }, update: {} });
  }
}
