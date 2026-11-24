import { createHash } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { isVerifiedPlatformAdmin } from '@/config';
import prisma, { Prisma } from '@/database';
import { displayPhone } from '@/domain/phone';
import { nextWhatsappStatus, WhatsappStatus, WhatsappStatusUpdate } from '@/domain/whatsapp';
import { ReceivedSms } from '@/domain/sms-webhook';
import {
  appConversationPhone,
  hasNoNumber,
  INBOX_RETENTION_DAYS,
  inboundMessagesOf,
  InboundWhatsapp,
  MEDIA_MAX_BYTES,
  phoneTail,
  previewOf,
  APP_MESSAGE_MAX_LENGTH,
  REPLY_MAX_LENGTH,
  replyChannelOf,
  replyUntil,
} from '@/domain/whatsapp-inbox';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { DemoMessagesService } from './demo-messages.service';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { PushService } from './push.service';
import { lookupNumber } from './public-booking.service';
import { isStop, PLATFORM_ONLY_KINDS, teamVisibleKinds } from '@/domain/traveller-invite';
import { TravellerInviteService } from './traveller-invite.service';
import { WhatsappService } from './whatsapp.service';
import { WhatsappNumberService } from './whatsapp-number.service';

export type InboxView = 'unread' | 'all' | 'handled' | 'unknown';
export const INBOX_VIEWS: InboxView[] = ['unread', 'all', 'handled', 'unknown'];

const RESERVATION_SELECT = {
  id: true,
  reference: true,
  externalReference: true,
  channelDetail: true,
  customerName: true,
  status: true,
  arrivalAt: true,
  returnAt: true,
} satisfies Prisma.ReservationSelect;

const CONVERSATION_INCLUDE = {
  reservation: { select: RESERVATION_SELECT },
  messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { direction: true, type: true, text: true } },
} satisfies Prisma.WhatsappConversationInclude;

type ConversationRow = Prisma.WhatsappConversationGetPayload<{ include: typeof CONVERSATION_INCLUDE }>;

export interface ConversationView {
  id: string;
  phone: string;
  name: string | null;
  profileName: string | null;
  reservation: Prisma.ReservationGetPayload<{ select: typeof RESERVATION_SELECT }> | null;
  lastMessageAt: Date;
  lastInboundAt: Date | null;
  unread: number;
  handledAt: Date | null;
  preview: { direction: string; text: string } | null;
  replyUntil: Date | null;
  /** 12/11/2026: where a reply goes (the Plazo app, WhatsApp within Meta's 24 hours), null: only a call. */
  replyBy: 'app' | 'whatsapp' | 'sms' | null;
  /** No parking found for this number: the platform's « Numéro inconnu ». */
  unknown: boolean;
}

const HANDLED_DAYS = 30;

/**
 * 12/11/2026 (« une boîte de réception des messages envoyés par WhatsApp », direction A of
 * https://claude.ai/artifact/E2oye5And3wLVphw6rE5ko): the messages travellers write to Plazo's number, placed on the
 * parking and the booking of the number that writes, the team told, and a free reply within Meta's 24 hours.
 */
/**
 * Security pass of 13/11/2026: a message Plazo sent carries the traveller's booking link, whose code opens the booking as
 * the traveller (cancel, refund…). The team never needs it: it is hidden from what the inbox shows.
 */
export function maskBookingLinks(text: string | null): string | null {
  if (!text) return text;
  return text.replace(/https?:\/\/\S*(?:\/a\/|\/ma-reservation\/|[?&]cle=)\S*/gi, '[lien de la réservation]');
}

@Service()
export class WhatsappInboxService {
  public audit = Container.get(AuditService);
  public push = Container.get(PushService);
  public whatsapp = Container.get(WhatsappService);
  public numbers = Container.get(WhatsappNumberService);

  // ---- Receiving (webhook) -----------------------------------------------------------------------

  /** The messages of a webhook payload, stored once each. Returns how many were new. Never throws. */
  public async receive(payload: unknown, now = new Date()): Promise<number> {
    let received = 0;
    for (const message of inboundMessagesOf(payload, now)) {
      try {
        if (await this.store(message, now)) {
          received++;
          // 23/11/2026: STOP answered to a message of Plazo: no invitation to that number again.
          if (isStop(message.text)) await Container.get(TravellerInviteService).optOut(message.from);
        }
      } catch (error) {
        logger.warn(`[WhatsApp inbox] message not stored: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return received;
  }

  private async store(message: InboundWhatsapp, now: Date): Promise<boolean> {
    if (await prisma.whatsappInboxMessage.findUnique({ where: { waMessageId: message.id }, select: { id: true } })) return false;
    // 14/11/2026: a message to a parking's own number belongs to that parking, whatever else the number booked.
    const ownerOfNumber = await this.numbers.operatorOf(message.toPhoneNumberId);
    const place = ownerOfNumber ? await this.placeIn(ownerOfNumber, message.from, now) : await this.place(message.from, message.text, now);
    const phoneNumberId = ownerOfNumber ? message.toPhoneNumberId : null;
    const existing = await prisma.whatsappConversation.findFirst({ where: { operatorId: place.operatorId, phone: message.from } });
    const conversation = existing
      ? await prisma.whatsappConversation.update({
          where: { id: existing.id },
          data: {
            ...(place.reservationId ? { reservationId: place.reservationId } : {}),
            ...(message.profileName ? { profileName: message.profileName } : {}),
            ...(!existing.lastInboundAt || message.at >= existing.lastInboundAt ? { phoneNumberId } : {}),
            lastMessageAt: message.at > existing.lastMessageAt ? message.at : existing.lastMessageAt,
            lastInboundAt: !existing.lastInboundAt || message.at > existing.lastInboundAt ? message.at : existing.lastInboundAt,
            unread: { increment: 1 },
            handledAt: null,
          },
        })
      : await prisma.whatsappConversation.create({
          data: {
            operatorId: place.operatorId,
            reservationId: place.reservationId,
            phone: message.from,
            profileName: message.profileName,
            phoneNumberId,
            lastMessageAt: message.at,
            lastInboundAt: message.at,
            unread: 1,
          },
        });
    try {
      await prisma.whatsappInboxMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'in',
          type: message.type,
          text: message.text,
          mediaId: message.mediaId,
          mediaMime: message.mediaMime,
          waMessageId: message.id,
          createdAt: message.at,
        },
      });
    } catch (error) {
      // Meta delivered it twice at the same moment: the other one stored it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        await prisma.whatsappConversation.update({ where: { id: conversation.id }, data: { unread: { decrement: 1 } } }).catch(() => undefined);
        return false;
      }
      throw error;
    }
    logger.info(`[WhatsApp inbox] ${message.type} received for ${place.operatorId ? `operator ${place.operatorId}` : 'an unknown number'}`);
    if (place.operatorId) await this.notify(place.operatorId, conversation.id, message, place.reservationId);
    return true;
  }

  /**
   * 14/11/2026 (« faudrait que les sms écrits au numéro du parking arrivent sur la messagerie de Plazo aussi »): an SMS the
   * parking's own phone received (the SMS app's `sms:received`). It joins the parking's conversation with that number
   * (WhatsApp included), placed on its booking; a reply then leaves by SMS from the same phone. Only the parking's clients:
   * a number with a booking running or of the last 30 days, or already in a conversation; the phone's other SMS (its
   * operator, a bank, a friend) never reach Plazo. Stored once per gateway message. True when it was stored.
   */
  public async receiveSms(operatorId: string, sms: ReceivedSms): Promise<boolean> {
    const phone = appConversationPhone(sms.from, '');
    if (hasNoNumber(phone) || phoneTail(phone).length < 9) return false;
    const key = `sms:${operatorId}:${sms.messageId}`;
    if (await prisma.whatsappInboxMessage.findUnique({ where: { waMessageId: key }, select: { id: true } })) return false;
    const [place, existing] = await Promise.all([
      this.placeIn(operatorId, phone, sms.at),
      prisma.whatsappConversation.findFirst({
        // Security pass of 15/11/2026: the whole number, never its last 9 digits (another country's number would join, and
        // the reply go to the other person).
        where: { operatorId, phone },
        orderBy: { lastMessageAt: 'desc' },
      }),
    ]);
    // 14/11/2026 (« Les sms envoyés au numéro de service doivent arriver dans la messagerie »): the phone is the parking's
    // own, so every SMS written to it reaches its messaging, with its booking when the number has one, else without.
    const conversation = existing
      ? await prisma.whatsappConversation.update({
          where: { id: existing.id },
          data: {
            ...(place.reservationId ? { reservationId: place.reservationId } : {}),
            lastMessageAt: sms.at > existing.lastMessageAt ? sms.at : existing.lastMessageAt,
            lastSmsAt: !existing.lastSmsAt || sms.at > existing.lastSmsAt ? sms.at : existing.lastSmsAt,
            unread: { increment: 1 },
            handledAt: null,
          },
        })
      : await prisma.whatsappConversation.create({
          data: { operatorId, reservationId: place.reservationId, phone, lastMessageAt: sms.at, lastSmsAt: sms.at, unread: 1 },
        });
    try {
      await prisma.whatsappInboxMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'in',
          type: 'text',
          text: sms.text,
          waMessageId: key,
          channel: 'sms',
          reservationId: place.reservationId,
          createdAt: sms.at,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        await prisma.whatsappConversation.update({ where: { id: conversation.id }, data: { unread: { decrement: 1 } } }).catch(() => undefined);
        return false;
      }
      throw error;
    }
    // 24/11/2026: a STOP answered to the parking's phone closes the invitations to that number too.
    if (isStop(sms.text)) await Container.get(TravellerInviteService).optOut(phone);
    const reservation = place.reservationId
      ? await prisma.reservation.findUnique({ where: { id: place.reservationId }, select: { customerName: true, reference: true } })
      : null;
    const said = sms.text.replace(/\s+/g, ' ');
    await this.push.notifyStaff(
      operatorId,
      'whatsapp',
      {
        title: `SMS · ${reservation?.customerName || conversation.profileName || displayPhone(phone)}`,
        body: [reservation?.reference, `« ${said.length > 110 ? `${said.slice(0, 109)}…` : said} »`].filter(Boolean).join(' · '),
      },
      { data: { type: 'whatsapp', conversationId: conversation.id }, collapseId: `whatsapp-${conversation.id}`, ttl: 6 * 3600 },
    );
    logger.info(`[SMS inbox] SMS received for operator ${operatorId}`);
    return true;
  }

  /**
   * The parking and the booking of the number that writes: the last WhatsApp Plazo sent to it (45 days), else a booking
   * of that phone still running or of the last 30 days. None: the platform's « Numéro inconnu ».
   *
   * 12/11/2026 (« les parkings ne doivent pas voir les messages des autres parkings et de leurs clients »): Plazo has one
   * number for every parking. When that number is a client of several parkings, the message goes to one of them only if
   * it names one of its bookings (Plazo's reference or the comparator's number); otherwise it waits in « Numéro inconnu »
   * for the platform, never guessed.
   */
  private async place(phone: string, text: string | null, now: Date): Promise<{ operatorId: string | null; reservationId: string | null }> {
    const tail = phoneTail(phone);
    const none = { operatorId: null, reservationId: null };
    if (tail.length < 9) return none;
    const [sentRows, rows] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where: { to: { endsWith: tail }, createdAt: { gte: new Date(now.getTime() - 45 * 86400000) } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { operatorId: true, reservationId: true },
      }),
      prisma.$queryRaw<{ id: string; operatorId: string; reference: string; externalReference: string | null }[]>`
        SELECT id, "operatorId", reference, "externalReference" FROM reservations
        WHERE "deletedAt" IS NULL AND "anonymizedAt" IS NULL
          AND status NOT IN ('cancelled', 'no_show', 'pending_payment')
          AND "returnAt" >= ${new Date(now.getTime() - 30 * 86400000)}
          AND right(regexp_replace("customerPhone", '[^0-9]', '', 'g'), 9) = ${tail}
        ORDER BY abs(extract(epoch FROM ("arrivalAt" - ${now}::timestamp))) ASC
        LIMIT 50`,
    ]);
    const operators = new Set([...sentRows.map(r => r.operatorId), ...rows.map(r => r.operatorId)]);
    if (operators.size === 0) return none;
    if (operators.size > 1) {
      const said = (text ?? '').toUpperCase().replace(/[\s#]/g, '');
      const named = rows.filter(r => {
        const numbers = [r.reference, r.externalReference ? lookupNumber(r.externalReference) : ''].filter(n => n.length >= 5);
        return numbers.some(n => said.includes(n.toUpperCase()));
      });
      const namedOperators = new Set(named.map(r => r.operatorId));
      if (namedOperators.size !== 1) return none;
      return { operatorId: named[0].operatorId, reservationId: named[0].id };
    }
    const [operatorId] = [...operators];
    const sent = sentRows[0];
    if (sent?.reservationId) {
      const running = await prisma.reservation.findFirst({
        where: { id: sent.reservationId, operatorId, status: { notIn: ['cancelled', 'no_show'] } },
        select: { id: true },
      });
      return { operatorId, reservationId: running?.id ?? rows[0]?.id ?? sent.reservationId };
    }
    return { operatorId, reservationId: rows[0]?.id ?? null };
  }

  /** The booking of the number that writes, within one parking (its own WhatsApp number was written to). */
  private async placeIn(operatorId: string, phone: string, now: Date): Promise<{ operatorId: string; reservationId: string | null }> {
    const tail = phoneTail(phone);
    if (tail.length < 9) return { operatorId, reservationId: null };
    const [sent, rows] = await Promise.all([
      prisma.whatsappMessage.findFirst({
        where: { operatorId, to: { endsWith: tail }, reservationId: { not: null }, createdAt: { gte: new Date(now.getTime() - 45 * 86400000) } },
        orderBy: { createdAt: 'desc' },
        select: { reservationId: true },
      }),
      prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM reservations
        WHERE "operatorId" = ${operatorId} AND "deletedAt" IS NULL AND "anonymizedAt" IS NULL
          AND status NOT IN ('cancelled', 'no_show', 'pending_payment')
          AND "returnAt" >= ${new Date(now.getTime() - 30 * 86400000)}
          AND right(regexp_replace("customerPhone", '[^0-9]', '', 'g'), 9) = ${tail}
        ORDER BY abs(extract(epoch FROM ("arrivalAt" - ${now}::timestamp))) ASC
        LIMIT 1`,
    ]);
    return { operatorId, reservationId: rows[0]?.id ?? sent?.reservationId ?? null };
  }

  private async notify(operatorId: string, conversationId: string, message: InboundWhatsapp, reservationId: string | null) {
    const reservation = reservationId
      ? await prisma.reservation.findUnique({ where: { id: reservationId }, select: { customerName: true, reference: true } })
      : null;
    const who = reservation?.customerName || message.profileName || displayPhone(message.from);
    const said = previewOf(message);
    await this.push.notifyStaff(
      operatorId,
      'whatsapp',
      {
        title: `Message WhatsApp · ${who}`,
        body: [reservation?.reference, `« ${said.length > 110 ? `${said.slice(0, 109)}…` : said} »`].filter(Boolean).join(' · '),
      },
      { data: { type: 'whatsapp', conversationId }, collapseId: `whatsapp-${conversationId}`, ttl: 6 * 3600 },
    );
  }

  /** A reply's delivery status (sent, delivered, read, failed), only forward. True when it changed. */
  public async applyStatus(update: WhatsappStatusUpdate): Promise<boolean> {
    const row = await prisma.whatsappInboxMessage.findUnique({ where: { waMessageId: update.id }, select: { id: true, status: true } });
    if (!row || row.status === null) return false;
    const status = nextWhatsappStatus(row.status as WhatsappStatus, update.status);
    if (status === row.status) return false;
    const { count } = await prisma.whatsappInboxMessage.updateMany({
      where: { id: row.id, status: row.status },
      data: { status, ...(status === 'failed' ? { errorCode: update.errorCode } : {}) },
    });
    return count === 1;
  }

  // ---- The team ----------------------------------------------------------------------------------

  private platformAdmin(actor: AuthenticatedStaff): boolean {
    return isVerifiedPlatformAdmin(actor);
  }

  private whereOf(actor: AuthenticatedStaff, view: InboxView, now: Date): Prisma.WhatsappConversationWhereInput {
    if (view === 'unknown') return { operatorId: null };
    const mine = { operatorId: actor.operatorId };
    if (view === 'unread') return { ...mine, unread: { gt: 0 }, handledAt: null };
    if (view === 'handled') return { ...mine, handledAt: { gte: new Date(now.getTime() - HANDLED_DAYS * 86400000) } };
    return { ...mine, handledAt: null };
  }

  private view(row: ConversationRow, now: Date): ConversationView {
    const last = row.messages[0];
    return {
      id: row.id,
      phone: hasNoNumber(row.phone) ? '' : displayPhone(row.phone),
      name: row.reservation?.customerName || row.profileName || null,
      profileName: row.profileName,
      reservation: row.reservation,
      lastMessageAt: row.lastMessageAt,
      lastInboundAt: row.lastInboundAt,
      unread: row.unread,
      handledAt: row.handledAt,
      preview: last ? { direction: last.direction, text: previewOf(last) } : null,
      replyUntil: hasNoNumber(row.phone) ? null : replyUntil(row.lastInboundAt, now),
      replyBy: replyChannelOf(row, now),
      unknown: row.operatorId === null,
    };
  }

  /** GET /internal/whatsapp/inbox?view= */
  public async list(actor: AuthenticatedStaff, view: InboxView, now = new Date()) {
    if (actor.demo) await Container.get(DemoMessagesService).tick(actor.operatorId, now);
    const admin = this.platformAdmin(actor);
    if (view === 'unknown' && !admin) throw new HttpException(httpStatus.FORBIDDEN, 'Platform admins only', 'forbidden');
    const [rows, unread, all, handled, unknown] = await Promise.all([
      prisma.whatsappConversation.findMany({
        where: this.whereOf(actor, view, now),
        include: CONVERSATION_INCLUDE,
        orderBy: { lastMessageAt: 'desc' },
        take: 200,
      }),
      prisma.whatsappConversation.count({ where: this.whereOf(actor, 'unread', now) }),
      prisma.whatsappConversation.count({ where: this.whereOf(actor, 'all', now) }),
      prisma.whatsappConversation.count({ where: this.whereOf(actor, 'handled', now) }),
      admin ? prisma.whatsappConversation.count({ where: { operatorId: null } }) : Promise.resolve(null),
    ]);
    const [sentWhatsapp, sentSms] = await Promise.all([
      prisma.whatsappMessage.count({ where: this.sentWhere(actor, now) }),
      prisma.smsOutbox.count({ where: this.sentSmsWhere(actor.operatorId, now, undefined, this.platformAdmin(actor)) }),
    ]);
    return { data: rows.map(row => this.view(row, now)), counts: { unread, all, handled, unknown, sent: sentWhatsapp + sentSms } };
  }

  private sentWhere(actor: AuthenticatedStaff, now: Date): Prisma.WhatsappMessageWhereInput {
    return {
      operatorId: actor.operatorId,
      createdAt: { gte: new Date(now.getTime() - INBOX_RETENTION_DAYS * 86400000) },
      ...teamVisibleKinds(this.platformAdmin(actor)),
    };
  }

  /**
   * 15/11/2026 (« les SMS reçus ou envoyés sont dans la messagerie de Plazo »): the SMS Plazo sent a traveller of the parking
   * these 30 days. Not the team's own messages (« Écrire au client », replies: already in their conversation), not the
   * tests to a member, never a signature code.
   */
  private sentSmsWhere(operatorId: string | null, now: Date, reservationId?: string, platformAdmin = false): Prisma.SmsOutboxWhereInput {
    return {
      operatorId: operatorId ?? '',
      ...(reservationId ? { reservationId } : {}),
      // 24/11/2026: the invitation to install the app is the platform's to see, by SMS as by WhatsApp.
      kind: { notIn: ['staff_message', 'test', 'reminder_test', 'signature_code', ...(platformAdmin ? [] : PLATFORM_ONLY_KINDS)] },
      createdAt: { gte: new Date(now.getTime() - INBOX_RETENTION_DAYS * 86400000) },
    };
  }

  /**
   * GET /internal/whatsapp/sent (12/11/2026, « Affiche aussi les messages envoyés »): what Plazo sent the parking's
   * travellers by WhatsApp these 30 days, the newest first, with its text (kept since that day) and the conversation of
   * that number when the traveller answered.
   */
  public async sent(actor: AuthenticatedStaff, now = new Date()) {
    const smsRows = await prisma.smsOutbox.findMany({
      where: this.sentSmsWhere(actor.operatorId, now, undefined, this.platformAdmin(actor)),
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        kind: true,
        to: true,
        status: true,
        body: true,
        createdAt: true,
        reservation: { select: { id: true, reference: true, externalReference: true, customerName: true } },
      },
    });
    const rows = await prisma.whatsappMessage.findMany({
      where: this.sentWhere(actor, now),
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        kind: true,
        to: true,
        status: true,
        body: true,
        smsOutcome: true,
        createdAt: true,
        reservation: { select: { id: true, reference: true, externalReference: true, customerName: true } },
      },
    });
    const phones = [...new Set([...rows.map(r => r.to), ...smsRows.map(r => r.to)])];
    const conversations = phones.length
      ? await prisma.whatsappConversation.findMany({
          where: { operatorId: actor.operatorId, phone: { in: phones } },
          select: { id: true, phone: true },
        })
      : [];
    const byPhone = new Map(conversations.map(c => [c.phone, c.id]));
    const data = [
      ...rows.map(r => ({
        id: r.id,
        channel: 'whatsapp' as const,
        kind: r.kind,
        status: r.status as string,
        text: maskBookingLinks(r.body),
        phone: displayPhone(r.to),
        at: r.createdAt,
        smsFallback: r.status === 'fallback' || r.smsOutcome === 'sent',
        reservation: r.reservation,
        conversationId: byPhone.get(r.to) ?? null,
      })),
      ...smsRows.map(r => ({
        id: r.id,
        channel: 'sms' as const,
        kind: r.kind,
        status: r.status as string,
        text: maskBookingLinks(r.body),
        phone: displayPhone(r.to),
        at: r.createdAt,
        smsFallback: false,
        reservation: r.reservation,
        conversationId: byPhone.get(r.to) ?? null,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
    return { data: data.slice(0, 300) };
  }

  /** The conversations with something unread, for the menu's counter. */
  public unreadCount(operatorId: string): Promise<number> {
    return prisma.whatsappConversation.count({ where: { operatorId, unread: { gt: 0 }, handledAt: null } });
  }

  private async find(actor: AuthenticatedStaff, id: string): Promise<ConversationRow> {
    const row = await prisma.whatsappConversation.findUnique({ where: { id }, include: CONVERSATION_INCLUDE });
    const visible = row && (row.operatorId === actor.operatorId || (row.operatorId === null && this.platformAdmin(actor)));
    if (!row || !visible) throw new HttpException(httpStatus.NOT_FOUND, 'Conversation not found', 'not_found');
    return row;
  }

  /** GET /internal/whatsapp/inbox/:id: the conversation (marked read), with what Plazo sent this booking by WhatsApp. */
  public async get(actor: AuthenticatedStaff, id: string, now = new Date()) {
    const row = await this.find(actor, id);
    const [messages, sent, sentSms] = await Promise.all([
      prisma.whatsappInboxMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        take: 500,
        include: { staff: { select: { firstName: true } } },
      }),
      row.reservationId && row.operatorId
        ? prisma.whatsappMessage.findMany({
            where: { reservationId: row.reservationId, operatorId: row.operatorId, ...teamVisibleKinds(this.platformAdmin(actor)) },
            orderBy: { createdAt: 'asc' },
            take: 50,
            select: { id: true, kind: true, status: true, body: true, createdAt: true },
          })
        : Promise.resolve([]),
      row.reservationId && row.operatorId
        ? prisma.smsOutbox.findMany({
            where: this.sentSmsWhere(row.operatorId, now, row.reservationId, this.platformAdmin(actor)),
            orderBy: { createdAt: 'asc' },
            take: 50,
            select: { id: true, kind: true, status: true, body: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    if (row.unread > 0) await prisma.whatsappConversation.update({ where: { id }, data: { unread: 0 } });
    return {
      conversation: { ...this.view(row, now), unread: 0 },
      messages: messages.map(m => ({
        id: m.id,
        direction: m.direction,
        type: m.type,
        text: m.text,
        hasMedia: !!m.mediaId,
        mediaMime: m.mediaMime,
        status: m.status,
        channel: m.channel,
        at: m.createdAt,
        by: m.staff ? { firstName: m.staff.firstName } : null,
      })),
      sent: [
        ...sent.map(s => ({
          id: s.id,
          channel: 'whatsapp' as const,
          kind: s.kind,
          status: s.status as string,
          text: maskBookingLinks(s.body),
          at: s.createdAt,
        })),
        ...sentSms.map(s => ({
          id: s.id,
          channel: 'sms' as const,
          kind: s.kind,
          status: s.status as string,
          text: maskBookingLinks(s.body),
          at: s.createdAt,
        })),
      ].sort((a, b) => a.at.getTime() - b.at.getTime()),
    };
  }

  /** POST /internal/whatsapp/inbox/:id/reply { text } */
  public async reply(actor: AuthenticatedStaff, id: string, raw: unknown, now = new Date()) {
    const text = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : '';
    if (!text) throw new ValidationException({ text: 'required' });
    if (text.length > REPLY_MAX_LENGTH) throw new ValidationException({ text: 'too_long' });
    const row = await this.find(actor, id);
    const channel = replyChannelOf(row, now);
    let message;
    if (actor.demo) {
      // 18/11/2026 (« Simule les messages reçus sur les env de démo »): in the prospects' demo the reply is kept and shown,
      // never sent (no Meta, no SMS, no push: its travellers are fictional).
      message = await prisma.whatsappInboxMessage.create({
        data: {
          conversationId: id,
          direction: 'out',
          type: 'text',
          text,
          status: 'delivered',
          staffId: actor.id,
          channel: channel === 'app' || channel === 'sms' ? channel : 'whatsapp',
          reservationId: row.reservationId,
        },
      });
    } else if (channel === 'app') {
      // The traveller wrote from the Plazo app: the reply shows there, with a push to their phone.
      const last = await prisma.whatsappInboxMessage.findFirst({
        where: { conversationId: id, channel: 'app', direction: 'in' },
        orderBy: { createdAt: 'desc' },
        select: { reservationId: true },
      });
      const reservationId = last?.reservationId ?? row.reservationId;
      message = await prisma.whatsappInboxMessage.create({
        data: { conversationId: id, direction: 'out', type: 'text', text, status: 'sent', staffId: actor.id, channel: 'app', reservationId },
      });
      if (reservationId) {
        const parking = await prisma.reservation.findUnique({
          where: { id: reservationId },
          select: { reference: true, parking: { select: { name: true } } },
        });
        await this.push.notifyTravellers(
          [reservationId],
          { title: `Message de ${parking?.parking.name ?? 'votre parking'}`, body: text.length > 140 ? `${text.slice(0, 139)}…` : text },
          { data: { type: 'parking_message', reference: parking?.reference ?? '' }, collapseId: `parking-message-${reservationId}`, ttl: 24 * 3600 },
        );
      }
    } else if (channel === 'sms') {
      // 14/11/2026: the traveller wrote to the parking's phone: the reply leaves by SMS from that phone (the SMS app).
      if (!row.operatorId) throw new HttpException(httpStatus.CONFLICT, 'No parking for this number', 'sms_unavailable');
      const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: row.operatorId }, select: { mode: true } });
      if (settings?.mode !== 'gateway') throw new HttpException(httpStatus.CONFLICT, 'The parking has no SMS phone', 'sms_unavailable');
      const { SmsService } = await import('./sms.service');
      const outcome = await Container.get(SmsService).sendSmsOnly(row.operatorId, {
        reservationId: row.reservationId,
        kind: 'staff_message',
        to: row.phone,
        text,
        answersSender: true,
      });
      if (outcome === 'failed' || outcome === 'skipped') {
        logger.warn(`[SMS inbox] reply ${outcome} for conversation ${id}`);
        // 15/11/2026: 409, not 502: a 502 body is replaced on the way (Cloudflare) and the page read « no answer in time ».
        throw new HttpException(httpStatus.CONFLICT, 'The SMS did not leave', 'sms_failed');
      }
      message = await prisma.whatsappInboxMessage.create({
        data: {
          conversationId: id,
          direction: 'out',
          type: 'text',
          text,
          status: 'sent',
          staffId: actor.id,
          channel: 'sms',
          reservationId: row.reservationId,
        },
      });
    } else {
      if (channel !== 'whatsapp') throw new HttpException(httpStatus.CONFLICT, 'Meta allows a free reply only within 24 hours', 'window_closed');
      if (!this.whatsapp.available()) throw new HttpException(httpStatus.CONFLICT, 'WhatsApp is not configured', 'whatsapp_unavailable');
      const result = await this.whatsapp.sendText(row.phone, text, row.phoneNumberId);
      if (!result.ok) {
        logger.warn(`[WhatsApp inbox] reply refused for conversation ${id}: ${result.code}`);
        throw new HttpException(httpStatus.BAD_GATEWAY, 'WhatsApp refused the reply', result.code);
      }
      message = await prisma.whatsappInboxMessage.create({
        data: {
          conversationId: id,
          direction: 'out',
          type: 'text',
          text,
          waMessageId: result.id,
          status: 'sent',
          staffId: actor.id,
          reservationId: row.reservationId,
        },
      });
    }
    await prisma.whatsappConversation.update({ where: { id }, data: { lastMessageAt: message.createdAt, unread: 0 } });
    await this.audit.record(actor, {
      action: 'whatsapp.reply',
      entityType: row.reservationId ? 'reservation' : 'whatsapp_conversation',
      entityId: row.reservationId ?? id,
      details: { conversationId: id },
    });
    return {
      id: message.id,
      direction: 'out',
      type: 'text',
      text,
      hasMedia: false,
      mediaMime: null,
      status: 'sent',
      channel: message.channel,
      at: message.createdAt,
      by: { firstName: actor.firstName },
    };
  }

  // ---- The traveller, from the Plazo app (12/11/2026, « Écrire au parking ») ----------------------

  /**
   * GET /public/bookings/:ref/messages: the whole conversation of this traveller with the parking (« Tout dans l'app du
   * client », 12/11/2026), oldest first: what they wrote by WhatsApp or in the app, the team's replies either way, and
   * what Plazo sent this booking by WhatsApp. WhatsApp messages of the number count from two days before the booking
   * was made to 30 days after its return; app messages are those of this booking.
   */
  public async travellerThread(reservation: {
    id: string;
    operatorId: string;
    customerPhone: string;
    createdAt: Date;
    returnAt: Date;
    anonymizedAt?: Date | null;
  }) {
    // Security pass of 13/11/2026: the app messages of this booking only. WhatsApp traffic is placed on a booking by the
    // number alone, and a booking's number is typed by whoever books: shown here, someone booking with another person's
    // number would read that person's WhatsApp exchange with the parking. WhatsApp stays in WhatsApp.
    const [messages, sent] = await Promise.all([
      prisma.whatsappInboxMessage.findMany({
        where: { reservationId: reservation.id, channel: 'app', conversation: { operatorId: reservation.operatorId } },
        orderBy: { createdAt: 'asc' },
        take: 300,
        include: { staff: { select: { firstName: true } } },
      }),
      prisma.whatsappMessage.findMany({
        where: { reservationId: reservation.id, operatorId: reservation.operatorId, status: { not: 'failed' }, ...teamVisibleKinds(false) },
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: { id: true, kind: true, body: true, createdAt: true },
      }),
    ]);
    const items = [
      ...messages.map(m => ({
        id: m.id,
        from: m.direction === 'in' ? 'me' : 'parking',
        text: m.text ?? previewOf(m),
        at: m.createdAt,
        by: m.direction === 'out' ? (m.staff?.firstName ?? null) : null,
        channel: m.channel,
        kind: null as string | null,
      })),
      ...sent.map(s => ({
        id: s.id,
        from: 'plazo',
        text: s.body ?? '',
        at: s.createdAt,
        by: null,
        channel: 'whatsapp',
        kind: s.kind as string | null,
      })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());
    return { messages: items, canWrite: !reservation.anonymizedAt };
  }

  /** POST /public/bookings/:ref/messages { text }: lands in the parking's conversation of that traveller, the team told. */
  public async travellerWrite(
    reservation: {
      id: string;
      operatorId: string;
      customerPhone: string;
      customerName: string;
      reference: string;
      status: string;
      anonymizedAt?: Date | null;
    },
    raw: unknown,
    now = new Date(),
  ) {
    if (reservation.anonymizedAt) throw new HttpException(httpStatus.CONFLICT, 'Booking anonymized', 'anonymized');
    // Security pass of 15/11/2026: an unpaid hold (free to make) or a cancelled booking never writes to the parking: its
    // name and text would reach every member's phone as a push.
    if (reservation.status === 'pending_payment' || reservation.status === 'cancelled')
      throw new HttpException(httpStatus.CONFLICT, 'Messages are closed for this booking', 'messages_closed');
    const text = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : '';
    if (!text) throw new ValidationException({ text: 'required' });
    if (text.length > APP_MESSAGE_MAX_LENGTH) throw new ValidationException({ text: 'too_long' });
    // Security pass of 13/11/2026: the booking's own `app:<id>` conversation, never the number's WhatsApp one: a booking
    // made with someone else's number must neither join nor redirect that person's conversation.
    const ownPhone = `app:${reservation.id}`;
    const existing = await prisma.whatsappConversation.findFirst({ where: { operatorId: reservation.operatorId, phone: ownPhone } });
    const conversation = existing
      ? await prisma.whatsappConversation.update({
          where: { id: existing.id },
          data: { reservationId: reservation.id, lastMessageAt: now, lastAppAt: now, unread: { increment: 1 }, handledAt: null },
        })
      : await prisma.whatsappConversation.create({
          data: { operatorId: reservation.operatorId, reservationId: reservation.id, phone: ownPhone, lastMessageAt: now, lastAppAt: now, unread: 1 },
        });
    const message = await prisma.whatsappInboxMessage.create({
      data: { conversationId: conversation.id, direction: 'in', type: 'text', text, channel: 'app', reservationId: reservation.id, createdAt: now },
    });
    const said = text.replace(/\s+/g, ' ');
    await this.push.notifyStaff(
      reservation.operatorId,
      'whatsapp',
      {
        title: `Message · ${reservation.customerName || 'Client'}`,
        body: `${reservation.reference} · « ${said.length > 110 ? `${said.slice(0, 109)}…` : said} » (app Plazo)`,
      },
      { data: { type: 'whatsapp', conversationId: conversation.id }, collapseId: `whatsapp-${conversation.id}`, ttl: 6 * 3600 },
    );
    logger.info(`[WhatsApp inbox] app message received for operator ${reservation.operatorId}`);
    return { id: message.id, from: 'me', text, at: message.createdAt, by: null };
  }

  /**
   * A message of the contact form of the parking's own site (24/11/2026, « tout »): one `site:<key>` conversation per
   * address that writes (never the WhatsApp conversation of the phone the visitor typed: anyone can type any number), the
   * visitor's details at the head of the text so that the team answers by e-mail or by phone, unread, pushed to the team.
   */
  public async siteWrite(
    operatorId: string,
    visitor: { name: string; email: string; phone?: string | null; reference?: string | null; message: string },
    now = new Date(),
  ) {
    const key = `site:${createHash('sha256').update(visitor.email.trim().toLowerCase()).digest('hex').slice(0, 24)}`;
    const lines = [
      'Message envoyé depuis le site du parking',
      `E-mail : ${visitor.email}`,
      ...(visitor.phone ? [`Téléphone : ${visitor.phone}`] : []),
      ...(visitor.reference ? [`Réservation : ${visitor.reference}`] : []),
      '',
      visitor.message,
    ];
    const text = lines.join('\n').slice(0, 4096);
    const existing = await prisma.whatsappConversation.findFirst({ where: { operatorId, phone: key } });
    const conversation = existing
      ? await prisma.whatsappConversation.update({
          where: { id: existing.id },
          data: { profileName: visitor.name, lastMessageAt: now, unread: { increment: 1 }, handledAt: null },
        })
      : await prisma.whatsappConversation.create({
          data: { operatorId, phone: key, profileName: visitor.name, lastMessageAt: now, unread: 1 },
        });
    await prisma.whatsappInboxMessage.create({
      data: { conversationId: conversation.id, direction: 'in', type: 'text', text, channel: 'site', createdAt: now },
    });
    const said = visitor.message.replace(/\s+/g, ' ');
    await this.push.notifyStaff(
      operatorId,
      'whatsapp',
      {
        title: `Message · ${visitor.name}`,
        body: `Site du parking · « ${said.length > 110 ? `${said.slice(0, 109)}…` : said} »`,
      },
      { data: { type: 'whatsapp', conversationId: conversation.id }, collapseId: `whatsapp-${conversation.id}`, ttl: 6 * 3600 },
    );
    logger.info(`[WhatsApp inbox] site message received for operator ${operatorId}`);
    return { conversationId: conversation.id };
  }

  /** POST /internal/whatsapp/inbox/:id/handle | unhandle */
  public async setHandled(actor: AuthenticatedStaff, id: string, handled: boolean, now = new Date()) {
    await this.find(actor, id);
    await prisma.whatsappConversation.update({ where: { id }, data: handled ? { handledAt: now, unread: 0 } : { handledAt: null } });
    const row = await this.find(actor, id);
    return this.view(row, now);
  }

  /**
   * DELETE /internal/whatsapp/inbox/:id (15/11/2026, « Pouvoir supprimer les SMS », both choices, managers and reception):
   * the conversation and every message in it leave Plazo for the whole team. Nothing changes on the parking's phone, at
   * Meta or for the traveller; what Plazo itself sent the booking (confirmation, day before…) stays on the booking. A new
   * message from that number opens a new conversation. The audit keeps who and when, never the text.
   */
  public async remove(actor: AuthenticatedStaff, id: string) {
    const row = await this.find(actor, id);
    const messages = await prisma.$transaction(async tx => {
      const deleted = await tx.whatsappInboxMessage.deleteMany({ where: { conversationId: id } });
      await tx.whatsappConversation.delete({ where: { id } });
      return deleted.count;
    });
    await this.audit.record(actor, {
      action: 'whatsapp.conversation_deleted',
      entityType: row.reservationId ? 'reservation' : 'whatsapp_conversation',
      entityId: row.reservationId ?? id,
      details: { conversationId: id, messages },
    });
    return { id, deleted: true, messages };
  }

  /**
   * DELETE /internal/whatsapp/inbox/:id/messages/:messageId: one message (the traveller's or the team's) leaves Plazo. The
   * conversation follows when it was its last message.
   */
  public async removeMessage(actor: AuthenticatedStaff, id: string, messageId: string) {
    const row = await this.find(actor, id);
    const message = await prisma.whatsappInboxMessage.findFirst({ where: { id: messageId, conversationId: id }, select: { id: true } });
    if (!message) throw new HttpException(httpStatus.NOT_FOUND, 'Message not found', 'message_not_found');
    const conversationDeleted = await prisma.$transaction(async tx => {
      await tx.whatsappInboxMessage.delete({ where: { id: messageId } });
      const latest = await tx.whatsappInboxMessage.findFirst({
        where: { conversationId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (!latest) {
        await tx.whatsappConversation.delete({ where: { id } });
        return true;
      }
      await tx.whatsappConversation.update({ where: { id }, data: { lastMessageAt: latest.createdAt } });
      return false;
    });
    await this.audit.record(actor, {
      action: 'whatsapp.message_deleted',
      entityType: row.reservationId ? 'reservation' : 'whatsapp_conversation',
      entityId: row.reservationId ?? id,
      details: { conversationId: id, conversationDeleted },
    });
    return { id: messageId, deleted: true, conversationDeleted };
  }

  /**
   * POST /internal/whatsapp/inbox/:id/attach { reference } (platform admins, « Numéro inconnu »): the conversation goes
   * to the parking of that booking (Plazo's reference or the comparator's number), merged with one it already has.
   */
  public async attach(actor: AuthenticatedStaff, id: string, raw: unknown) {
    if (!this.platformAdmin(actor)) throw new HttpException(httpStatus.FORBIDDEN, 'Platform admins only', 'forbidden');
    const row = await this.find(actor, id);
    if (row.operatorId) throw new HttpException(httpStatus.CONFLICT, 'Already placed', 'already_placed');
    const number = typeof raw === 'string' ? lookupNumber(raw) : '';
    if (!number) throw new ValidationException({ reference: 'required' });
    const byNumber = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM reservations
      WHERE "deletedAt" IS NULL AND "externalReference" IS NOT NULL
        AND upper(regexp_replace("externalReference", '[[:space:]#]', '', 'g')) = ${number}
      LIMIT 5`;
    const reservation = await prisma.reservation.findFirst({
      where: { OR: [{ reference: number }, { id: { in: byNumber.map(r => r.id) } }] },
      orderBy: { arrivalAt: 'desc' },
      select: { id: true, operatorId: true, reference: true },
    });
    if (!reservation) throw new ValidationException({ reference: 'not_found' });
    const target = await prisma.whatsappConversation.findFirst({ where: { operatorId: reservation.operatorId, phone: row.phone } });
    const keptId = await prisma.$transaction(async tx => {
      if (!target) {
        await tx.whatsappConversation.update({ where: { id }, data: { operatorId: reservation.operatorId, reservationId: reservation.id } });
        return id;
      }
      await tx.whatsappInboxMessage.updateMany({ where: { conversationId: id }, data: { conversationId: target.id } });
      const latest = (a: Date | null, b: Date | null) => (a && b ? (a > b ? a : b) : (a ?? b));
      await tx.whatsappConversation.update({
        where: { id: target.id },
        data: {
          reservationId: reservation.id,
          unread: target.unread + row.unread,
          handledAt: null,
          lastMessageAt: latest(target.lastMessageAt, row.lastMessageAt) ?? row.lastMessageAt,
          lastInboundAt: latest(target.lastInboundAt, row.lastInboundAt),
        },
      });
      await tx.whatsappConversation.delete({ where: { id } });
      return target.id;
    });
    await this.audit.record(actor, {
      action: 'whatsapp.attached',
      entityType: 'reservation',
      entityId: reservation.id,
      details: { conversationId: keptId },
    });
    return { id: keptId, reservation: { id: reservation.id, reference: reservation.reference } };
  }

  /** GET /internal/whatsapp/inbox/messages/:messageId/media: a photo or voice note, through Plazo. */
  public async media(actor: AuthenticatedStaff, messageId: string) {
    const message = await prisma.whatsappInboxMessage.findUnique({ where: { id: messageId }, select: { conversationId: true, mediaId: true } });
    if (!message?.mediaId) throw new HttpException(httpStatus.NOT_FOUND, 'Media not found', 'not_found');
    await this.find(actor, message.conversationId);
    const media = await this.whatsapp.fetchMedia(message.mediaId, MEDIA_MAX_BYTES);
    if (media === 'too_large') throw new HttpException(413, 'Media too large', 'media_too_large');
    if (!media) throw new HttpException(httpStatus.NOT_FOUND, 'Media no longer available', 'media_gone');
    return media;
  }

  /** The reservation page's « Messages au voyageur »: its conversation, if the traveller wrote. */
  public async forReservation(operatorId: string, reservationId: string) {
    const row = await prisma.whatsappConversation.findFirst({
      where: { operatorId, reservationId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { staff: { select: { firstName: true } } },
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      unread: row.unread,
      messages: row.messages.map(m => ({
        id: m.id,
        direction: m.direction,
        text: previewOf(m),
        status: m.status,
        at: m.createdAt,
        by: m.staff ? { firstName: m.staff.firstName } : null,
      })),
    };
  }

  /** The night's purge: messages and conversations after 30 days. */
  public async purge(now = new Date()): Promise<number> {
    const before = new Date(now.getTime() - INBOX_RETENTION_DAYS * 86400000);
    const messages = await prisma.whatsappInboxMessage.deleteMany({ where: { createdAt: { lt: before } } });
    const conversations = await prisma.whatsappConversation.deleteMany({ where: { lastMessageAt: { lt: before } } });
    return messages.count + conversations.count;
  }
}
