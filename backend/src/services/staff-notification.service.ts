import { Container, Service } from 'typedi';
import webpush from 'web-push';
import { PUBLIC_SITE_URL, webPushDisabled, webPushSettings, webPushSubject } from '@/config';
import prisma, { Prisma } from '@/database';
import type { PushMessage } from '@/domain/arrival-messages';
import {
  BELL_RETENTION_DAYS,
  ChannelOverrides,
  NotificationEvent,
  NotifiedStaff,
  channelMatrix,
  channelsOf,
  eventsFor,
  mergeOverrides,
  notificationTarget,
  phoneColumn,
} from '@/domain/staff-notifications';
import { HttpException } from '@/utils/httpException';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';

/** The fields `channelsOf` reads. */
export const NOTIFIED_STAFF_SELECT = {
  id: true,
  role: true,
  post: true,
  notifyArrivals: true,
  notifyReturns: true,
  notifyShuttles: true,
  notifyPlatform: true,
  bookingNotify: true,
  notificationChannels: true,
} satisfies Prisma.StaffSelect;

export type NotifiedRow = NotifiedStaff & { id: string };

const PAGE_SIZE = 40;

type VapidKeys = { publicKey: string; privateKey: string; subject: string };
/** Plazo's own pair, read once per instance (it never changes once created). */
let storedKeys: Promise<VapidKeys | null> | null = null;

/** Tests: forget the pair read from the database. */
export function resetWebPushKeyCache(): void {
  storedKeys = null;
}

async function loadStoredKeys(): Promise<VapidKeys | null> {
  const existing = await prisma.webPushKey.findUnique({ where: { id: 'default' } });
  if (existing) return { publicKey: existing.publicKey, privateKey: existing.privateKey, subject: webPushSubject() };
  const fresh = webpush.generateVAPIDKeys();
  // Two instances starting together: the first insert wins, both read it back.
  await prisma.webPushKey.createMany({ data: [{ id: 'default', ...fresh }], skipDuplicates: true });
  const row = await prisma.webPushKey.findUniqueOrThrow({ where: { id: 'default' } });
  logger.info('[WebPush] browser notification keys created');
  return { publicKey: row.publicKey, privateKey: row.privateKey, subject: webPushSubject() };
}

/** « 21:42 » categories of the bell's filters. */
export const BELL_FILTERS: Record<string, NotificationEvent[]> = {
  bookings: ['booking_new', 'booking_change', 'inbox', 'extra'],
  shuttle: ['arrival', 'return', 'shuttle', 'valet'],
  team: ['team', 'platform'],
};

/**
 * 02/11/2026: the bell (`staff_notifications`) and the browsers of the pro space (Web Push). PushService decides who
 * hears of what and calls this for the two new channels; a failure here never fails the push nor the action.
 */
@Service()
export class StaffNotificationService {
  public audit = Container.get(AuditService);
  public timeoutMs = 5000;

  /**
   * The VAPID keys: Vercel's when set, else Plazo's own pair (created on first use, 03/11/2026: no key to generate by
   * hand). Null with `WEB_PUSH=off` or when the database cannot be read.
   */
  public async webPushKeys(): Promise<VapidKeys | null> {
    if (webPushDisabled()) return null;
    const fromEnv = webPushSettings();
    if (fromEnv) return fromEnv;
    if (!storedKeys) {
      storedKeys = loadStoredKeys().catch(error => {
        storedKeys = null;
        logger.warn(`[WebPush] could not read the keys: ${error instanceof Error ? error.message : 'unknown error'}`);
        return null;
      });
    }
    return storedKeys;
  }

  /** Writes the bell rows and sends to the browsers of these members. */
  public async deliver(
    operatorId: string,
    event: NotificationEvent,
    message: PushMessage,
    recipients: { bell: string[]; browser: string[] },
    data?: Record<string, string>,
  ): Promise<void> {
    const target = notificationTarget(data);
    try {
      if (recipients.bell.length) {
        await prisma.staffNotification.createMany({
          data: recipients.bell.map(staffId => ({
            operatorId,
            staffId,
            event,
            title: message.title.slice(0, 200),
            body: message.body.slice(0, 600),
            target,
            data: data ?? Prisma.JsonNull,
          })),
        });
      }
    } catch (error) {
      logger.warn(`[Bell] could not record a notification: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    if (recipients.browser.length) await this.sendBrowsers(recipients.browser, message, target, event);
  }

  /** Sends to every browser of these members; a browser that is gone (404 / 410) is forgotten. Returns how many took it. */
  public async sendBrowsers(staffIds: string[], message: PushMessage, target: string | null, tag: string): Promise<number> {
    if (!staffIds.length) return 0;
    const settings = await this.webPushKeys();
    if (!settings) return 0;
    try {
      const subscriptions = await prisma.staffWebPushSubscription.findMany({ where: { staffId: { in: staffIds } } });
      if (!subscriptions.length) return 0;
      const payload = JSON.stringify({
        title: message.title,
        body: message.body,
        url: `${PUBLIC_SITE_URL.replace(/\/$/, '')}/pro${target ?? '/'}`,
        tag,
      });
      const results = await Promise.allSettled(
        subscriptions.map(s =>
          webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
            TTL: 3600,
            timeout: this.timeoutMs,
            vapidDetails: { subject: settings.subject, publicKey: settings.publicKey, privateKey: settings.privateKey },
          }),
        ),
      );
      const gone: string[] = [];
      const sent: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') sent.push(subscriptions[i].id);
        else {
          const status = (result.reason as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) gone.push(subscriptions[i].id);
          else logger.warn(`[WebPush] a browser refused the push (${status ?? 'network'})`);
        }
      });
      if (gone.length) await prisma.staffWebPushSubscription.deleteMany({ where: { id: { in: gone } } });
      if (sent.length) await prisma.staffWebPushSubscription.updateMany({ where: { id: { in: sent } }, data: { lastSentAt: new Date() } });
      return sent.length;
    } catch (error) {
      logger.warn(`[WebPush] could not notify the browsers: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** The members of the operator who hear of this event on this channel. */
  public pick(staff: NotifiedRow[], event: NotificationEvent, channel: 'bell' | 'browser'): string[] {
    return staff.filter(s => channelsOf(s, event)[channel]).map(s => s.id);
  }

  // ------------------------------------------------------------------ the bell

  public async list(actor: AuthenticatedStaff, filter?: string, before?: string) {
    const since = new Date(Date.now() - BELL_RETENTION_DAYS * 86400000);
    const events = filter && BELL_FILTERS[filter] ? BELL_FILTERS[filter] : null;
    const beforeDate = before ? new Date(before) : null;
    const rows = await prisma.staffNotification.findMany({
      where: {
        staffId: actor.id,
        createdAt: { gte: since, ...(beforeDate && !Number.isNaN(beforeDate.getTime()) ? { lt: beforeDate } : {}) },
        ...(events ? { event: { in: events } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
    });
    const unread = await this.unreadCount(actor);
    return {
      data: rows.slice(0, PAGE_SIZE).map(r => ({
        id: r.id,
        event: r.event,
        title: r.title,
        body: r.body,
        target: r.target,
        createdAt: r.createdAt.toISOString(),
        readAt: r.readAt?.toISOString() ?? null,
      })),
      hasMore: rows.length > PAGE_SIZE,
      unread,
    };
  }

  public async unreadCount(actor: AuthenticatedStaff): Promise<number> {
    const since = new Date(Date.now() - BELL_RETENTION_DAYS * 86400000);
    return prisma.staffNotification.count({ where: { staffId: actor.id, readAt: null, createdAt: { gte: since } } });
  }

  /** Marks some (or all) of the member's notifications read. */
  public async markRead(actor: AuthenticatedStaff, ids: string[] | undefined) {
    await prisma.staffNotification.updateMany({
      where: { staffId: actor.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
    return { unread: await this.unreadCount(actor) };
  }

  /** Nightly: the bell forgets after 30 days. */
  public async purge(now = new Date()): Promise<number> {
    const { count } = await prisma.staffNotification.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - BELL_RETENTION_DAYS * 86400000) } },
    });
    return count;
  }

  // ------------------------------------------------------------------ « Mes notifications »

  public async channels(actor: AuthenticatedStaff) {
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id }, select: NOTIFIED_STAFF_SELECT });
    const keys = await this.webPushKeys();
    const [phones, browsers] = await Promise.all([
      prisma.staffDevice.findMany({ where: { staffId: actor.id }, select: { platform: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }),
      prisma.staffWebPushSubscription.findMany({
        where: { staffId: actor.id },
        select: { id: true, label: true, endpoint: true, createdAt: true, lastSentAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      role: staff.role,
      bookings: staff.bookingNotify,
      channels: channelMatrix(staff),
      webPush: { available: keys !== null, publicKey: keys?.publicKey ?? null },
      devices: {
        phones: phones.map(p => ({ platform: p.platform, updatedAt: p.updatedAt.toISOString() })),
        browsers: browsers.map(b => ({
          id: b.id,
          label: b.label,
          endpoint: b.endpoint,
          createdAt: b.createdAt.toISOString(),
          lastSentAt: b.lastSentAt?.toISOString() ?? null,
        })),
      },
    };
  }

  /**
   * Saves the member's switches; a phone switch of an event with an older column writes that column. The phone of the
   * new bookings is the « Toutes les heures / À chaque réservation / Jamais » choice (`bookings` of the preferences).
   */
  public async setChannels(actor: AuthenticatedStaff, patch: ChannelOverrides) {
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id }, select: NOTIFIED_STAFF_SELECT });
    const allowed = new Set(eventsFor(staff.role));
    const columns: Prisma.StaffUpdateInput = {};
    const json: ChannelOverrides = {};
    for (const [event, change] of Object.entries(patch) as [NotificationEvent, ChannelOverrides[NotificationEvent]][]) {
      if (!change || !allowed.has(event)) continue;
      const column = phoneColumn(event);
      const { phone, ...rest } = change;
      if (phone !== undefined && column) columns[column] = phone;
      json[event] = column || event === 'booking_new' ? rest : change;
    }
    await prisma.staff.update({
      where: { id: actor.id },
      data: { ...columns, notificationChannels: mergeOverrides(staff.notificationChannels, json) as Prisma.InputJsonValue },
    });
    return this.channels(actor);
  }

  // ------------------------------------------------------------------ browsers

  public async subscribeBrowser(actor: AuthenticatedStaff, sub: { endpoint: string; p256dh: string; auth: string; label?: string | null }) {
    if (!(await this.webPushKeys())) throw new HttpException(409, 'Browser notifications are not configured', 'web_push_unavailable');
    if (!/^https:\/\//.test(sub.endpoint)) throw new HttpException(400, 'Invalid endpoint', 'validation_failed', { endpoint: 'invalid' });
    await prisma.staffWebPushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: { staffId: actor.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, label: sub.label ?? null },
      update: { staffId: actor.id, p256dh: sub.p256dh, auth: sub.auth, label: sub.label ?? null },
    });
    return this.channels(actor);
  }

  public async unsubscribeBrowser(actor: AuthenticatedStaff, endpoint: string) {
    await prisma.staffWebPushSubscription.deleteMany({ where: { staffId: actor.id, endpoint } });
    return this.channels(actor);
  }

  /** « M'envoyer une notification de test »: the bell, every browser, and (by PushService) every phone. */
  public async testBell(actor: AuthenticatedStaff, message: PushMessage) {
    await this.deliver(actor.operatorId, 'platform', message, { bell: [actor.id], browser: [] });
    return this.sendBrowsers([actor.id], message, null, 'test');
  }
}
