import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { isVerifiedPlatformAdmin } from '@/config';
import prisma, { Prisma } from '@/database';
import { displayPhone } from '@/domain/phone';
import { nextWhatsappStatus, WhatsappStatus, WhatsappStatusUpdate } from '@/domain/whatsapp';
import {
  INBOX_RETENTION_DAYS,
  inboundMessagesOf,
  InboundWhatsapp,
  MEDIA_MAX_BYTES,
  phoneTail,
  previewOf,
  REPLY_MAX_LENGTH,
  replyUntil,
} from '@/domain/whatsapp-inbox';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { PushService } from './push.service';
import { lookupNumber } from './public-booking.service';
import { WhatsappService } from './whatsapp.service';

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
  /** No parking found for this number: the platform's « Numéro inconnu ». */
  unknown: boolean;
}

const HANDLED_DAYS = 30;

/**
 * 12/11/2026 (« une boîte de réception des messages envoyés par WhatsApp », direction A of
 * https://claude.ai/artifact/E2oye5And3wLVphw6rE5ko): the messages travellers write to Plazo's number, placed on the
 * parking and the booking of the number that writes, the team told, and a free reply within Meta's 24 hours.
 */
@Service()
export class WhatsappInboxService {
  public audit = Container.get(AuditService);
  public push = Container.get(PushService);
  public whatsapp = Container.get(WhatsappService);

  // ---- Receiving (webhook) -----------------------------------------------------------------------

  /** The messages of a webhook payload, stored once each. Returns how many were new. Never throws. */
  public async receive(payload: unknown, now = new Date()): Promise<number> {
    let received = 0;
    for (const message of inboundMessagesOf(payload, now)) {
      try {
        if (await this.store(message, now)) received++;
      } catch (error) {
        logger.warn(`[WhatsApp inbox] message not stored: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return received;
  }

  private async store(message: InboundWhatsapp, now: Date): Promise<boolean> {
    if (await prisma.whatsappInboxMessage.findUnique({ where: { waMessageId: message.id }, select: { id: true } })) return false;
    const place = await this.place(message.from, now);
    const existing = await prisma.whatsappConversation.findFirst({ where: { operatorId: place.operatorId, phone: message.from } });
    const conversation = existing
      ? await prisma.whatsappConversation.update({
          where: { id: existing.id },
          data: {
            ...(place.reservationId ? { reservationId: place.reservationId } : {}),
            ...(message.profileName ? { profileName: message.profileName } : {}),
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
   * The parking and the booking of the number that writes: the last WhatsApp Plazo sent to it (45 days), else a booking
   * of that phone still running or of the last 30 days. None: the platform's « Numéro inconnu ».
   */
  private async place(phone: string, now: Date): Promise<{ operatorId: string | null; reservationId: string | null }> {
    const tail = phoneTail(phone);
    if (tail.length < 9) return { operatorId: null, reservationId: null };
    const sent = await prisma.whatsappMessage.findFirst({
      where: { to: { endsWith: tail }, createdAt: { gte: new Date(now.getTime() - 45 * 86400000) } },
      orderBy: { createdAt: 'desc' },
      select: { operatorId: true, reservationId: true },
    });
    const rows = await prisma.$queryRaw<{ id: string; operatorId: string }[]>`
      SELECT id, "operatorId" FROM reservations
      WHERE "deletedAt" IS NULL AND "anonymizedAt" IS NULL
        AND status NOT IN ('cancelled', 'no_show', 'pending_payment')
        AND "returnAt" >= ${new Date(now.getTime() - 30 * 86400000)}
        AND right(regexp_replace("customerPhone", '[^0-9]', '', 'g'), 9) = ${tail}
        ${sent ? Prisma.sql`AND "operatorId" = ${sent.operatorId}` : Prisma.empty}
      ORDER BY abs(extract(epoch FROM ("arrivalAt" - ${now}::timestamp))) ASC
      LIMIT 1`;
    if (sent) {
      const running = sent.reservationId
        ? await prisma.reservation.findFirst({
            where: { id: sent.reservationId, status: { notIn: ['cancelled', 'no_show'] } },
            select: { id: true },
          })
        : null;
      return { operatorId: sent.operatorId, reservationId: running?.id ?? rows[0]?.id ?? sent.reservationId };
    }
    if (rows[0]) return { operatorId: rows[0].operatorId, reservationId: rows[0].id };
    return { operatorId: null, reservationId: null };
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
      phone: displayPhone(row.phone),
      name: row.reservation?.customerName || row.profileName || null,
      profileName: row.profileName,
      reservation: row.reservation,
      lastMessageAt: row.lastMessageAt,
      lastInboundAt: row.lastInboundAt,
      unread: row.unread,
      handledAt: row.handledAt,
      preview: last ? { direction: last.direction, text: previewOf(last) } : null,
      replyUntil: replyUntil(row.lastInboundAt, now),
      unknown: row.operatorId === null,
    };
  }

  /** GET /internal/whatsapp/inbox?view= */
  public async list(actor: AuthenticatedStaff, view: InboxView, now = new Date()) {
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
    return { data: rows.map(row => this.view(row, now)), counts: { unread, all, handled, unknown } };
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
    const [messages, sent] = await Promise.all([
      prisma.whatsappInboxMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        take: 500,
        include: { staff: { select: { firstName: true } } },
      }),
      row.reservationId && row.operatorId
        ? prisma.whatsappMessage.findMany({
            where: { reservationId: row.reservationId, operatorId: row.operatorId },
            orderBy: { createdAt: 'asc' },
            take: 50,
            select: { id: true, kind: true, status: true, text: true, createdAt: true },
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
        at: m.createdAt,
        by: m.staff ? { firstName: m.staff.firstName } : null,
      })),
      sent: sent.map(s => ({ id: s.id, kind: s.kind, status: s.status, text: s.text, at: s.createdAt })),
    };
  }

  /** POST /internal/whatsapp/inbox/:id/reply { text } */
  public async reply(actor: AuthenticatedStaff, id: string, raw: unknown, now = new Date()) {
    const text = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : '';
    if (!text) throw new ValidationException({ text: 'required' });
    if (text.length > REPLY_MAX_LENGTH) throw new ValidationException({ text: 'too_long' });
    const row = await this.find(actor, id);
    if (!replyUntil(row.lastInboundAt, now))
      throw new HttpException(httpStatus.CONFLICT, 'Meta allows a free reply only within 24 hours', 'window_closed');
    if (!this.whatsapp.available()) throw new HttpException(httpStatus.CONFLICT, 'WhatsApp is not configured', 'whatsapp_unavailable');
    const result = await this.whatsapp.sendText(row.phone, text);
    if (!result.ok) {
      logger.warn(`[WhatsApp inbox] reply refused for conversation ${id}: ${result.code}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'WhatsApp refused the reply', result.code);
    }
    const message = await prisma.whatsappInboxMessage.create({
      data: { conversationId: id, direction: 'out', type: 'text', text, waMessageId: result.id, status: 'sent', staffId: actor.id },
    });
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
      at: message.createdAt,
      by: { firstName: actor.firstName },
    };
  }

  /** POST /internal/whatsapp/inbox/:id/handle | unhandle */
  public async setHandled(actor: AuthenticatedStaff, id: string, handled: boolean, now = new Date()) {
    await this.find(actor, id);
    await prisma.whatsappConversation.update({ where: { id }, data: handled ? { handledAt: now, unread: 0 } : { handledAt: null } });
    const row = await this.find(actor, id);
    return this.view(row, now);
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
