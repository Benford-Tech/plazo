import { Container, Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { DEMO_BOOKINGS } from '@/domain/prospect-demo';
import { DEMO_THREADS, DemoChannel, demoPhone, demoPoolLine, demoSlot } from '@/domain/demo-messages';
import { logger } from '@/utils/logger';
import { isProspectDemoOperator } from './demo-guard';
import { PushService } from './push.service';

type Tx = Prisma.TransactionClient;

/** The conversation's « last message of this channel » column (the reply goes back the same way). */
function lastOf(channel: DemoChannel, at: Date) {
  if (channel === 'app') return { lastAppAt: at };
  if (channel === 'sms') return { lastSmsAt: at };
  return { lastInboundAt: at };
}

/**
 * 18/11/2026 (« Simule les messages reçus sur les env de démo »): the prospects' demo receives messages like a real
 * parking. Its conversations are seeded with it (DEMO_THREADS), then `tick` adds one message of the pool per slot of
 * 20 minutes while someone reads the demo's counters or its messages (bell included). Nothing ever leaves Plazo.
 */
@Service()
export class DemoMessagesService {
  public push = Container.get(PushService);

  /** With the demo's seeding: its conversations, linked to its bookings (in DEMO order). */
  public async seed(tx: Tx, operatorId: string, bookingIds: string[], agentId: string | null, now: Date): Promise<void> {
    for (const thread of DEMO_THREADS) {
      const reservationId = bookingIds[thread.booking] ?? null;
      const ins = thread.lines.filter(l => l.dir === 'in');
      const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000);
      const last = thread.lines[thread.lines.length - 1];
      const lastIn = ins[ins.length - 1];
      const lastOut = thread.lines.map(l => l.dir).lastIndexOf('out');
      const unread = thread.handled ? 0 : thread.lines.slice(lastOut + 1).filter(l => l.dir === 'in').length;
      const phone = thread.channel === 'app' ? `app:${reservationId}` : demoPhone(thread.booking);
      const conversation = await tx.whatsappConversation.create({
        data: {
          operatorId,
          reservationId,
          phone,
          lastMessageAt: at(last.minutesAgo),
          ...(lastIn ? lastOf(thread.channel, at(lastIn.minutesAgo)) : {}),
          unread,
          handledAt: thread.handled ? at(last.minutesAgo) : null,
        },
      });
      await tx.whatsappInboxMessage.createMany({
        data: thread.lines.map((l, i) => ({
          conversationId: conversation.id,
          direction: l.dir,
          type: 'text',
          text: l.text,
          channel: thread.channel,
          reservationId,
          waMessageId: `demo:${conversation.id}:${i}`,
          ...(l.dir === 'out' ? { status: 'read', staffId: agentId } : {}),
          createdAt: at(l.minutesAgo),
        })),
      });
    }
  }

  /**
   * A new message of the pool when this slot has none yet (the slot's key is unique: two instances or two reads never
   * add it twice). Only for the prospects' demo; never throws.
   */
  public async tick(operatorId: string, now: Date = new Date()): Promise<boolean> {
    try {
      if (!(await isProspectDemoOperator(operatorId))) return false;
      const slot = demoSlot(now);
      const key = `demo:${operatorId}:slot:${slot}`;
      if (await prisma.whatsappInboxMessage.findUnique({ where: { waMessageId: key }, select: { id: true } })) return false;
      const line = demoPoolLine(slot);
      const booking = await prisma.reservation.findFirst({
        where: { operatorId, externalReference: DEMO_BOOKINGS[line.booking].ref },
        select: { id: true, customerName: true, reference: true },
      });
      if (!booking) return false;
      const phone = line.channel === 'app' ? `app:${booking.id}` : demoPhone(line.booking);
      const existing = await prisma.whatsappConversation.findFirst({ where: { operatorId, phone }, orderBy: { lastMessageAt: 'desc' } });
      const created = await prisma.$transaction(async tx => {
        const conversation = existing
          ? await tx.whatsappConversation.update({
              where: { id: existing.id },
              data: { lastMessageAt: now, ...lastOf(line.channel, now), unread: { increment: 1 }, handledAt: null },
            })
          : await tx.whatsappConversation.create({
              data: { operatorId, reservationId: booking.id, phone, lastMessageAt: now, ...lastOf(line.channel, now), unread: 1 },
            });
        await tx.whatsappInboxMessage.create({
          data: {
            conversationId: conversation.id,
            direction: 'in',
            type: 'text',
            text: line.text,
            channel: line.channel,
            reservationId: booking.id,
            waMessageId: key,
            createdAt: now,
          },
        });
        return conversation;
      });
      const label = line.channel === 'sms' ? 'SMS' : line.channel === 'app' ? 'Message' : 'Message WhatsApp';
      await this.push.notifyStaff(
        operatorId,
        'whatsapp',
        { title: `${label} · ${booking.customerName}`, body: `${booking.reference} · « ${line.text} »` },
        { data: { type: 'whatsapp', conversationId: created.id }, collapseId: `whatsapp-${created.id}`, ttl: 6 * 3600 },
      );
      return true;
    } catch (error) {
      // A second read of the same slot lost the race on the unique key: nothing to do.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      logger.warn(`[Demo] message tick failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
