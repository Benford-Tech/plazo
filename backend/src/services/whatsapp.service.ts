import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { whatsappConfig } from '@/config';
import prisma from '@/database';
import { smsRecipient } from '@/domain/phone';
import { namesOfCustomer } from '@/domain/customer-name';
import {
  arrivalDateLabel,
  arrivalTimeLabel,
  nextWhatsappStatus,
  parseTemplateRules,
  templateRuleFor,
  TemplateParam,
  statusUpdatesOf,
  validWhatsappSignature,
  WHATSAPP_FALLBACK_AFTER_MS,
  WHATSAPP_RETENTION_DAYS,
  WHATSAPP_TEXT_TTL_MS,
  WhatsappStatus,
  whatsappParam,
  whatsappRecipient,
} from '@/domain/whatsapp';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import type { SendOutcome, TravellerSms } from './sms.service';

export interface WhatsappSettingsView {
  /** Plazo's WhatsApp Business number is configured server-side. */
  available: boolean;
  enabled: boolean;
  /** The parking has an SMS channel: a message WhatsApp cannot deliver goes by SMS. */
  smsFallback: boolean;
  month: { whatsapp: number; read: number; fallbacks: number; failed: number };
}

type SendResult = { ok: true; id: string } | { ok: false; code: string };

const startOfMonth = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

/**
 * « Plazo envoie par WhatsApp », SMS en repli (03/11/2026). The confirmation, day-before and landing messages go first by
 * WhatsApp from Plazo's WhatsApp Business number (Meta's Cloud API, one approved template), then by the parking's SMS
 * channel when Meta refuses the message, reports it failed, or has not delivered it within 5 minutes. Logs carry ids and
 * Meta's codes only.
 */
@Service()
export class WhatsappService {
  public audit = Container.get(AuditService);
  /** Read from the environment on each use; tests override it. */
  public config = whatsappConfig;
  public timeoutMs = 5000;

  public available(): boolean {
    const { token, phoneNumberId } = this.config();
    return !!(token && phoneNumberId);
  }

  // ---- Sending ------------------------------------------------------------------------------------

  /**
   * One template message to Meta: `plazo_message` by default, or a parking's own template (`options.name`), with an image
   * header when `options.image` is given (Meta fetches it from that https address). Never throws.
   */
  public async sendTemplate(
    e164: string,
    params: string[],
    options: { name?: string; language?: string | null; image?: string | null } = {},
  ): Promise<SendResult> {
    const { token, phoneNumberId, template, language, graphVersion } = this.config();
    if (!token || !phoneNumberId) return { ok: false, code: 'whatsapp_unavailable' };
    const components: unknown[] = [];
    if (options.image) components.push({ type: 'header', parameters: [{ type: 'image', image: { link: options.image } }] });
    components.push({ type: 'body', parameters: params.map(text => ({ type: 'text', text })) });
    try {
      const res = await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: whatsappRecipient(e164),
          type: 'template',
          template: {
            name: options.name ?? template,
            language: { code: options.language ?? language },
            components,
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const data: any = await res.json().catch(() => null);
      const id = data?.messages?.[0]?.id;
      if (res.ok && typeof id === 'string') return { ok: true, id };
      const code = data?.error?.code;
      return { ok: false, code: code === undefined || code === null ? `http_${res.status}` : `meta_${String(code).slice(0, 20)}` };
    } catch (error) {
      return { ok: false, code: error instanceof Error && error.name === 'TimeoutError' ? 'whatsapp_timeout' : 'whatsapp_network' };
    }
  }

  /** WhatsApp is on for this operator (its setting) and Plazo's number is configured. */
  public async enabledFor(operatorId: string): Promise<boolean> {
    if (!this.available()) return false;
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId }, select: { whatsappEnabled: true } });
    return !!settings?.whatsappEnabled;
  }

  /**
   * A traveller message by WhatsApp. True: Meta took it (its delivery is followed by webhook, the SMS waits as the
   * fallback when the parking has an SMS channel). False: Meta refused it at once, the caller sends the SMS.
   */
  public async trySend(operatorId: string, sms: TravellerSms, recipient: string, smsFallback: boolean): Promise<boolean> {
    const about = sms.reservationId ? `reservation ${sms.reservationId}` : `operator ${operatorId}`;
    const [operator, booking] = await Promise.all([
      prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true, name: true, inboundSlug: true } }),
      sms.reservationId
        ? prisma.reservation.findUnique({
            where: { id: sms.reservationId },
            select: {
              reference: true,
              arrivalAt: true,
              customerName: true,
              customerFirstName: true,
              customerLastName: true,
              parking: { select: { timezone: true } },
            },
          })
        : null,
    ]);
    const parkingName = whatsappParam(operator?.name ?? 'Votre parking', 80);
    const rule = operator ? templateRuleFor(parseTemplateRules(this.config().templates), operator, sms.kind) : null;
    let result: SendResult;
    if (rule && booking) {
      const timeZone = booking.parking?.timezone ?? 'Europe/Paris';
      const firstName = namesOfCustomer(booking).firstName || booking.customerName || 'Madame, Monsieur';
      const value: Record<TemplateParam, string> = {
        firstName: whatsappParam(firstName, 60),
        arrivalDate: arrivalDateLabel(booking.arrivalAt, timeZone),
        arrivalTime: arrivalTimeLabel(booking.arrivalAt, timeZone),
        parking: parkingName,
        reference: booking.reference,
        text: whatsappParam(sms.text),
      };
      result = await this.sendTemplate(
        recipient,
        rule.params.map(p => value[p]),
        rule,
      );
    } else if (this.config().reminderTemplate && sms.whatsapp) {
      // 09/11/2026: the common day-before template (its 16 values and the meeting point's photo), when it is set and no
      // rule of the parking's own takes the message.
      result = await this.sendTemplate(recipient, sms.whatsapp.params, { name: this.config().reminderTemplate, image: sms.whatsapp.image });
    } else {
      result = await this.sendTemplate(recipient, [parkingName, booking?.reference ?? '-', whatsappParam(sms.text)]);
    }
    await prisma.whatsappMessage.create({
      data: {
        operatorId,
        reservationId: sms.reservationId,
        kind: sms.kind,
        to: recipient,
        waMessageId: result.ok ? result.id : null,
        status: result.ok ? 'sent' : 'failed',
        errorCode: result.ok ? null : result.code,
        fallbackText: result.ok && smsFallback ? sms.text : null,
        smsOutcome: null,
      },
    });
    if (result.ok) logger.info(`[WhatsApp] ${sms.kind} handed to Meta for ${about}`);
    else logger.warn(`[WhatsApp] ${sms.kind} refused for ${about}: ${result.code}${smsFallback ? ', sent by SMS' : ''}`);
    return result.ok;
  }

  // ---- Webhook -----------------------------------------------------------------------------------

  /** GET /public/whatsapp/webhook: Meta's subscription check. Returns the challenge to echo, or null (403). */
  public verifySubscription(mode: unknown, token: unknown, challenge: unknown): string | null {
    const { verifyToken } = this.config();
    if (!verifyToken || mode !== 'subscribe' || token !== verifyToken || typeof challenge !== 'string') return null;
    return challenge;
  }

  /** POST /public/whatsapp/webhook: the delivery statuses of our messages. A failed one falls back to SMS. */
  public async handleWebhook(raw: Buffer | undefined, signature: string | undefined): Promise<{ updated: number; fallbacks: number }> {
    const { appSecret } = this.config();
    if (!appSecret) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'WhatsApp webhook not configured', 'whatsapp_unavailable');
    if (!raw || !validWhatsappSignature(raw, signature, appSecret))
      throw new HttpException(httpStatus.UNAUTHORIZED, 'Invalid signature', 'invalid_signature');
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid JSON', 'invalid_payload');
    }
    let updated = 0;
    let fallbacks = 0;
    for (const update of statusUpdatesOf(payload)) {
      const row = await prisma.whatsappMessage.findUnique({ where: { waMessageId: update.id } });
      if (!row) continue;
      const status = nextWhatsappStatus(row.status as WhatsappStatus, update.status);
      if (status === row.status) continue;
      await prisma.whatsappMessage.updateMany({
        where: { id: row.id, status: row.status },
        data: {
          status,
          errorCode: status === 'failed' ? update.errorCode : row.errorCode,
          // Delivered: the SMS will not be needed.
          ...(status === 'delivered' || status === 'read' ? { fallbackText: null } : {}),
        },
      });
      updated++;
      if (status === 'failed' && (await this.fallBack(row.id))) fallbacks++;
    }
    return { updated, fallbacks };
  }

  /** Sends the SMS of a message WhatsApp did not deliver. Claimed first: two passes never send it twice. */
  private async fallBack(id: string): Promise<boolean> {
    const row = await prisma.whatsappMessage.findUnique({ where: { id } });
    if (!row?.fallbackText) return false;
    const claimed = await prisma.whatsappMessage.updateMany({
      where: { id, status: { in: ['sent', 'failed'] }, fallbackText: { not: null } },
      data: { status: 'fallback', fallbackText: null },
    });
    if (claimed.count !== 1) return false;
    const { SmsService } = await import('./sms.service');
    const outcome: SendOutcome = await Container.get(SmsService).sendSmsOnly(row.operatorId, {
      reservationId: row.reservationId,
      kind: row.kind as TravellerSms['kind'],
      to: row.to,
      text: row.fallbackText,
    });
    await prisma.whatsappMessage.update({ where: { id }, data: { smsOutcome: outcome } });
    logger.info(`[WhatsApp] ${row.kind} not delivered for reservation ${row.reservationId ?? '-'}: SMS ${outcome}`);
    return true;
  }

  /**
   * The 15-minute pass: a message Meta has not delivered after 5 minutes goes by SMS; a text older than 2 hours is
   * forgotten (an SMS would come too late).
   */
  public async sweep(now = new Date()): Promise<{ fallbacks: number; forgotten: number }> {
    const forgotten = await prisma.whatsappMessage.updateMany({
      where: { fallbackText: { not: null }, createdAt: { lt: new Date(now.getTime() - WHATSAPP_TEXT_TTL_MS) } },
      data: { fallbackText: null },
    });
    const late = await prisma.whatsappMessage.findMany({
      where: {
        status: { in: ['sent', 'failed'] },
        fallbackText: { not: null },
        createdAt: { lt: new Date(now.getTime() - WHATSAPP_FALLBACK_AFTER_MS) },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    let fallbacks = 0;
    for (const { id } of late) if (await this.fallBack(id)) fallbacks++;
    return { fallbacks, forgotten: forgotten.count };
  }

  public async purgeOld(now = new Date()): Promise<number> {
    const { count } = await prisma.whatsappMessage.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - WHATSAPP_RETENTION_DAYS * 86400000) } },
    });
    return count;
  }

  // ---- Settings (Parking › Réglages) -------------------------------------------------------------

  public async settings(actor: AuthenticatedStaff, now = new Date()): Promise<WhatsappSettingsView> {
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });
    const rows = await prisma.whatsappMessage.groupBy({
      by: ['status'],
      where: { operatorId: actor.operatorId, createdAt: { gte: startOfMonth(now) } },
      _count: { _all: true },
    });
    const count = (status: string) => rows.find(row => row.status === status)?._count._all ?? 0;
    return {
      available: this.available(),
      enabled: !!settings?.whatsappEnabled,
      smsFallback: !!settings && settings.mode !== 'none',
      month: {
        whatsapp: count('sent') + count('delivered') + count('read'),
        read: count('read'),
        fallbacks: count('fallback'),
        failed: count('failed'),
      },
    };
  }

  public async update(actor: AuthenticatedStaff, enabled: boolean): Promise<WhatsappSettingsView> {
    if (enabled && !this.available()) throw new HttpException(httpStatus.CONFLICT, 'WhatsApp is not configured', 'whatsapp_unavailable');
    await prisma.operatorSmsSettings.upsert({
      where: { operatorId: actor.operatorId },
      create: { operatorId: actor.operatorId, whatsappEnabled: enabled },
      update: { whatsappEnabled: enabled },
    });
    await this.audit.record(actor, { action: 'whatsapp.settings', entityType: 'operator', entityId: actor.operatorId, details: { enabled } });
    return this.settings(actor);
  }

  /** « M'envoyer un test sur WhatsApp »: by WhatsApp only, no fallback. Throws Meta's code when it refuses it. */
  public async test(actor: AuthenticatedStaff, to: string): Promise<{ outcome: 'sent' }> {
    if (!this.available()) throw new HttpException(httpStatus.CONFLICT, 'WhatsApp is not configured', 'whatsapp_unavailable');
    const recipient = smsRecipient(to);
    if (!recipient) throw new ValidationException({ to: 'invalid_phone' });
    const operator = await prisma.operator.findUnique({ where: { id: actor.operatorId }, select: { id: true, name: true, inboundSlug: true } });
    const parkingName = whatsappParam(operator?.name ?? 'Votre parking', 80);
    const testText =
      'Ceci est un message de test : vos voyageurs recevront ici leur confirmation, le rappel de la veille et le rendez-vous de la navette.';
    // A parking with its own day-before template gets that one, as a traveller would (tomorrow 06:30, the tester's name).
    const rule = operator ? templateRuleFor(parseTemplateRules(this.config().templates), operator, 'booking_reminder') : null;
    let result: SendResult;
    if (rule) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const value: Record<TemplateParam, string> = {
        firstName: whatsappParam(actor.firstName || 'Madame, Monsieur', 60),
        arrivalDate: arrivalDateLabel(tomorrow, 'Europe/Paris'),
        arrivalTime: '06:30',
        parking: parkingName,
        reference: 'TEST',
        text: testText,
      };
      result = await this.sendTemplate(
        recipient,
        rule.params.map(p => value[p]),
        rule,
      );
    } else {
      result = await this.sendTemplate(recipient, [parkingName, 'TEST', testText]);
    }
    if (!result.ok) {
      logger.warn(`[WhatsApp] Test refused for operator ${actor.operatorId}: ${result.code}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Test WhatsApp failed', result.code);
    }
    return { outcome: 'sent' };
  }
}
