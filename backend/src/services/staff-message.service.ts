import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import { smsRecipient } from '@/domain/phone';
import { whatsappParam } from '@/domain/whatsapp';
import { appConversationPhone, phoneTail, REPLY_MAX_LENGTH, replyUntil } from '@/domain/whatsapp-inbox';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { isProspectDemoOperator } from './demo-guard';
import { STAFF_VISIBLE } from './reservation.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';

/** A message the team writes: as WhatsApp allows a text (the template's value is shorter, see whatsappParam). */
export const STAFF_MESSAGE_MAX_LENGTH = 900;

/** The approved common template wraps the team's words between these lines (« plazo_message »). */
export const templateFrame = (parking: string, reference: string) => ({
  before: `Message de ${parking} pour votre réservation ${reference} :`,
  after: "Merci d'avoir choisi votre parking avec Plazo.",
});

/**
 * « Écrire au client » (13/11/2026, « Ajoute l'envoi par WhatsApp et par le numéro Plazo dans l'app pro », choix « Écrire
 * depuis Plazo »): the team writes to a booking's traveller from Plazo's WhatsApp number. Within Meta's 24 hours after the
 * traveller's last WhatsApp, a free text; otherwise inside the approved common template. The message joins the parking's
 * conversation of that number (« Messages WhatsApp »), where the answer lands. When WhatsApp is off or refuses, the
 * parking's SMS channel takes it.
 */
@Service()
export class StaffMessageService {
  public whatsapp = Container.get(WhatsappService);
  public sms = Container.get(SmsService);
  public audit = Container.get(AuditService);

  private async load(actor: AuthenticatedStaff, id: string) {
    const r = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      select: { id: true, reference: true, customerPhone: true, anonymizedAt: true, operator: { select: { name: true } } },
    });
    if (!r) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    return r;
  }

  private async channels(actor: AuthenticatedStaff, r: Awaited<ReturnType<StaffMessageService['load']>>, now: Date) {
    const phone = appConversationPhone(r.customerPhone, r.id);
    const hasPhone = !phone.startsWith('app:');
    const demo = await isProspectDemoOperator(actor.operatorId);
    const whatsappOn = hasPhone && !demo && (await this.whatsapp.enabledFor(actor.operatorId));
    const conversation = hasPhone
      ? await prisma.whatsappConversation.findFirst({
          where: { operatorId: actor.operatorId, phone: { endsWith: phoneTail(phone) } },
          orderBy: { lastMessageAt: 'desc' },
          select: { id: true, lastInboundAt: true },
        })
      : null;
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId }, select: { mode: true } });
    const smsOn = !demo && (settings?.mode ?? 'none') !== 'none' && !!smsRecipient(r.customerPhone);
    return {
      phone,
      hasPhone,
      whatsappOn,
      smsOn,
      conversationId: conversation?.id ?? null,
      replyUntil: conversation ? replyUntil(conversation.lastInboundAt, now) : null,
    };
  }

  /** GET /internal/reservations/:id/write: what « Écrire au client » can do for this booking. */
  public async status(actor: AuthenticatedStaff, id: string, now = new Date()) {
    const r = await this.load(actor, id);
    const c = await this.channels(actor, r, now);
    return {
      whatsapp: { available: c.whatsappOn, freeUntil: c.replyUntil, frame: templateFrame(r.operator.name, r.reference) },
      sms: { available: c.smsOn },
      conversationId: c.conversationId,
      canWrite: !r.anonymizedAt && (c.whatsappOn || c.smsOn),
      refusal: r.anonymizedAt ? 'anonymized' : !c.hasPhone ? 'no_phone' : !c.whatsappOn && !c.smsOn ? 'no_channel' : null,
      maxLength: STAFF_MESSAGE_MAX_LENGTH,
    };
  }

  /** POST /internal/reservations/:id/write { text, channel }: sent by WhatsApp (SMS on refusal), or by SMS. */
  public async send(actor: AuthenticatedStaff, id: string, raw: { text?: unknown; channel?: unknown }, now = new Date()) {
    const text = typeof raw?.text === 'string' ? raw.text.replace(/\r\n?/g, '\n').trim() : '';
    if (!text) throw new ValidationException({ text: 'required' });
    if (text.length > STAFF_MESSAGE_MAX_LENGTH) throw new ValidationException({ text: 'too_long' });
    const asked = raw?.channel === 'sms' ? 'sms' : 'whatsapp';
    const r = await this.load(actor, id);
    if (r.anonymizedAt) throw new HttpException(httpStatus.CONFLICT, 'Booking anonymized', 'anonymized');
    const c = await this.channels(actor, r, now);
    if (!c.hasPhone) throw new HttpException(httpStatus.CONFLICT, 'No phone number', 'no_phone');

    let whatsappRefused: string | null = null;
    if (asked === 'whatsapp' && c.whatsappOn) {
      const free = !!c.replyUntil;
      const result = free
        ? await this.whatsapp.sendText(c.phone, text.slice(0, REPLY_MAX_LENGTH))
        : await this.whatsapp.sendTemplate(c.phone, [whatsappParam(r.operator.name, 80), r.reference, whatsappParam(text)]);
      if (result.ok) {
        const conversationId = await this.store(actor, r.id, c.phone, c.conversationId, text, result.id, now);
        await this.record(actor, r.id, { channel: 'whatsapp', via: free ? 'text' : 'template' });
        return { channel: 'whatsapp', via: free ? 'text' : 'template', conversationId, fallback: false };
      }
      whatsappRefused = result.code;
      logger.warn(`[Staff message] WhatsApp refused for reservation ${r.id}: ${result.code}`);
    } else if (asked === 'whatsapp' && !c.smsOn) {
      throw new HttpException(httpStatus.CONFLICT, 'WhatsApp is not available', 'whatsapp_unavailable');
    }

    if (!c.smsOn) throw new HttpException(httpStatus.BAD_GATEWAY, 'WhatsApp refused the message', whatsappRefused ?? 'sms_unavailable');
    const outcome = await this.sms.sendSmsOnly(actor.operatorId, { reservationId: r.id, kind: 'staff_message', to: r.customerPhone, text });
    if (outcome === 'failed' || outcome === 'skipped') throw new HttpException(httpStatus.BAD_GATEWAY, 'The SMS did not leave', 'sms_failed');
    await this.record(actor, r.id, { channel: 'sms', ...(whatsappRefused ? { whatsappRefused } : {}) });
    return { channel: 'sms', via: 'sms', conversationId: c.conversationId, fallback: asked === 'whatsapp', queued: outcome === 'queued' };
  }

  /** The message joins the parking's conversation of that number (created if needed): the answer lands there. */
  private async store(
    actor: AuthenticatedStaff,
    reservationId: string,
    phone: string,
    conversationId: string | null,
    text: string,
    waMessageId: string,
    now: Date,
  ) {
    const id =
      conversationId ??
      (
        await prisma.whatsappConversation.create({
          data: { operatorId: actor.operatorId, reservationId, phone, lastMessageAt: now, unread: 0 },
          select: { id: true },
        })
      ).id;
    await prisma.whatsappInboxMessage.create({
      data: { conversationId: id, direction: 'out', type: 'text', text, waMessageId, status: 'sent', staffId: actor.id, createdAt: now },
    });
    await prisma.whatsappConversation.update({ where: { id }, data: { lastMessageAt: now, reservationId } });
    return id;
  }

  private record(actor: AuthenticatedStaff, reservationId: string, details: Record<string, string>) {
    return this.audit.record(actor, { action: 'traveller.message_sent', entityType: 'reservation', entityId: reservationId, details });
  }
}
