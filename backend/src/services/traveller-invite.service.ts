import { Container, Service } from 'typedi';
import { prospectingSettings, SECRET_KEY, whatsappInviteTemplate } from '@/config';
import prisma from '@/database';
import { appLinkCode } from '@/domain/app-link';
import { smsRecipient } from '@/domain/phone';
import {
  INVITE_KIND,
  INVITE_REPEAT_MS,
  inviteHour,
  InviteOutcome,
  inviteParams,
  inviteSms,
  inviteText,
  phoneHash,
  stayLabel,
} from '@/domain/traveller-invite';
import { whatsappImage } from '@/domain/whatsapp';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { isSilentOperator } from './demo-guard';
import { NotificationService } from './notification.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';

const PER_PASS = 40;
/** Meta's answers for a template it has not approved yet, paused or disabled: not the traveller's fault, tried again. */
const TEMPLATE_NOT_READY = new Set(['meta_132001', 'meta_132015', 'meta_132016']);

export interface InviteRunReport {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * 23/11/2026: the invitation to install Plazo, to a traveller of another channel whose email is unknown. Sent by the
 * 15-minute pass, once per number and operator in 12 months, by day only, never after a STOP nor for an operator who
 * sends nothing (test, demo). By WhatsApp once WHATSAPP_INVITE_TEMPLATE names a template Meta approved; until then, or
 * where WhatsApp is off, as one SMS from the parking's own phone (24/11/2026). Each booking is claimed before its message.
 */
@Service()
export class TravellerInviteService {
  public notifications = Container.get(NotificationService);
  public whatsapp = Container.get(WhatsappService);
  public sms = Container.get(SmsService);
  /** Read from the environment on each use; tests override it. */
  public template = whatsappInviteTemplate;

  public async run(now: Date = new Date()): Promise<InviteRunReport> {
    const report: InviteRunReport = { sent: 0, skipped: 0, failed: 0 };
    if (!SECRET_KEY) return report;
    // WhatsApp only with a template Meta can use; once Meta says it is not ready, no other booking of the pass asks.
    const meta = { template: this.whatsapp.available() ? this.template() : '' };
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
      const outcome = await this.handle(r, meta, now);
      if (outcome === 'not_ready') {
        // Released: it waits for the template (or for the parking's phone), and does not use the pass's budget.
        await prisma.reservation.updateMany({ where: { id: r.id, appInviteAt: now }, data: { appInviteAt: null } });
        continue;
      }
      handled++;
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
    meta: { template: string },
    now: Date,
  ): Promise<InviteOutcome | 'not_ready'> {
    // 25/11/2026: travellers with an email get the invite too (on top of the welcome email).
    if (await isSilentOperator(r.operatorId)) return 'off';
    const recipient = smsRecipient(r.customerPhone ?? '');
    if (!recipient) return 'no_phone';
    if (await prisma.travellerPhoneOptout.findUnique({ where: { phoneHash: phoneHash(recipient) } })) return 'opted_out';
    const since = new Date(now.getTime() - INVITE_REPEAT_MS);
    const before = await prisma.whatsappMessage.count({
      where: { operatorId: r.operatorId, kind: INVITE_KIND, to: recipient, status: { not: 'failed' }, createdAt: { gte: since } },
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
            appInviteAt: { gte: since },
          },
        });
    if (earlier) return 'repeat';
    const firstName = (r.customerFirstName ?? '').trim();
    const parking = r.parking.listing?.title || r.parking.name;
    const byWhatsapp = !!meta.template && (await this.whatsapp.enabledFor(r.operatorId));
    if (byWhatsapp) {
      const params = inviteParams({ firstName, parking, stay: stayLabel(r.arrivalAt, r.returnAt, r.parking.timezone) });
      const from = await this.whatsapp.numbers.senderFor(r.operatorId);
      const result = await this.whatsapp.sendTemplate(recipient, params, {
        name: meta.template,
        image: whatsappImage(this.notifications.siteUrl('/whatsapp/plazo-invitation.jpg')),
        button: appLinkCode(r, SECRET_KEY as string),
        from,
      });
      if (!result.ok && TEMPLATE_NOT_READY.has(result.code)) {
        // 24/11/2026: still under Meta's review (or paused): the SMS of the parking's phone instead, for the whole pass.
        logger.warn(`[WhatsApp] ${INVITE_KIND} template not usable yet (${result.code}): the parking's phone instead`);
        meta.template = '';
      } else {
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
    }
    // The SMS leaves from the parking's own phone only, never from Plazo's Brevo account.
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: r.operatorId }, select: { mode: true } });
    const link = this.notifications.appLinkUrl(r);
    if (settings?.mode !== 'gateway' || !link) {
      // Nothing to send it with today: it waits for the template where WhatsApp is on, and is closed elsewhere.
      return (await this.whatsapp.enabledFor(r.operatorId)) ? 'not_ready' : 'off';
    }
    const outcome = await this.sms.sendSmsOnly(r.operatorId, {
      reservationId: r.id,
      kind: INVITE_KIND,
      to: r.customerPhone,
      text: inviteSms({ firstName, parking, arrivalAt: r.arrivalAt, timeZone: r.parking.timezone, link }),
    });
    return outcome === 'sent' || outcome === 'queued' ? 'sent' : 'failed';
  }

  /**
   * 24/11/2026 (« essaie de m'envoyer un sms avec le modèle en cours de validation »): the invitation SMS of an example booking
   * in 5 days, sent to the admin's phone (PROSPECTING_PHONE, or `phone`) from the parking's own phone (the operator chosen,
   * else the first one sending its SMS from its phone). Nothing is recorded on a booking; the WhatsApp template itself can
   * only be tried once Meta approves it.
   */
  public async sendTest(firstName: string, body: { operatorId?: unknown; phone?: unknown }) {
    const phone = (typeof body.phone === 'string' && body.phone.trim()) || prospectingSettings().phone;
    if (!phone || !smsRecipient(phone)) throw new HttpException(409, 'No mobile number to send the test to', 'no_test_phone');
    const operatorId = typeof body.operatorId === 'string' && body.operatorId.trim() ? body.operatorId.trim() : null;
    const settings = await prisma.operatorSmsSettings.findFirst({
      where: {
        mode: 'gateway',
        ...(operatorId ? { operatorId } : { operator: { status: 'active', archivedAt: null, isDemo: false, prospectDemo: false } }),
      },
      orderBy: { updatedAt: 'desc' },
      select: { operatorId: true },
    });
    if (!settings) throw new HttpException(409, 'No parking sends its SMS from its own phone', 'no_gateway');
    const parking = await prisma.parking.findFirst({
      where: { operatorId: settings.operatorId },
      orderBy: { createdAt: 'asc' },
      select: { name: true, timezone: true, listing: { select: { title: true } } },
    });
    const name = parking?.listing?.title || parking?.name || 'Parking';
    const link = this.notifications.siteUrl('/ma-reservation') ?? 'https://www.plazo.fr/ma-reservation';
    const text = inviteSms({
      firstName,
      parking: name,
      arrivalAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      timeZone: parking?.timezone ?? 'Europe/Paris',
      link,
    });
    const outcome = await this.sms.sendSmsOnly(settings.operatorId, { reservationId: null, kind: 'test', to: phone, text });
    if (outcome !== 'sent' && outcome !== 'queued') throw new HttpException(409, `The test SMS was not sent (${outcome})`, 'sms_failed');
    return { outcome, parking: name, text };
  }

  /** A traveller answered STOP to Plazo's number: no invitation to that number again. */
  public async optOut(e164: string): Promise<void> {
    const hash = phoneHash(e164);
    await prisma.travellerPhoneOptout.upsert({ where: { phoneHash: hash }, create: { phoneHash: hash }, update: {} });
  }
}
