import { Service } from 'typedi';
import { oneSignalSettings, oneSignalTravellerSettings } from '@/config';
import prisma, { Prisma } from '@/database';
import { PushMessage } from '@/domain/arrival-messages';
import { logger } from '@/utils/logger';

export const ONESIGNAL_NOTIFICATIONS_URL = 'https://api.onesignal.com/notifications?c=push';
/** OneSignal accepts at most this many subscription ids per call. */
const MAX_SUBSCRIPTIONS_PER_CALL = 2000;

/** What a staff member subscribed to: travellers' arrivals, returns, the shuttles' trips (N-A), or the platform's messages (E-A). */
export type PushAudience = 'arrivals' | 'returns' | 'shuttles' | 'platform';

/** Travellers reachable by a platform broadcast: a booking not cancelled, whose return is at most a day past. */
const currentTravellers = (now: Date): Prisma.TravellerDeviceWhereInput => ({
  reservation: { status: { notIn: ['cancelled', 'no_show'] }, returnAt: { gte: new Date(now.getTime() - 86400000) } },
});

export interface PushOptions {
  data?: Record<string, string>;
  /** A newer push replaces an older one with the same id on the phone. */
  collapseId?: string;
  /** Opened when the notification is tapped (platform broadcasts). */
  url?: string;
  /** Staff: not notified about their own action (the driver who started the trip). */
  excludeStaffId?: string;
}

type Settings = { appId: string; restApiKey: string };

const wantsAudience = (audience: PushAudience): Prisma.StaffWhereInput =>
  audience === 'arrivals'
    ? { notifyArrivals: true }
    : audience === 'returns'
      ? { notifyReturns: true }
      : audience === 'shuttles'
        ? { notifyShuttles: true }
        : { notifyPlatform: true };

/**
 * Push notifications through the OneSignal REST API: to the staff's phones (StaffDevice), and to
 * the travellers' (TravellerDevice, the traveller app). Off (a no-op) unless the OneSignal values
 * are set. A push never fails the action that caused it: errors are caught and logged without the
 * message (it names a traveller).
 */
@Service()
export class PushService {
  public timeoutMs = 5000;

  public enabled(): boolean {
    return oneSignalSettings() !== null;
  }

  /** Subscription ids of the operator's active staff who want this kind of notification. */
  public async subscriptionsFor(operatorId: string, audience: PushAudience, excludeStaffId?: string): Promise<string[]> {
    const devices = await prisma.staffDevice.findMany({
      where: { staff: { operatorId, isActive: true, ...wantsAudience(audience), ...(excludeStaffId ? { id: { not: excludeStaffId } } : {}) } },
      select: { subscriptionId: true },
    });
    return devices.map(d => d.subscriptionId);
  }

  // ---------------------------------------------------------------- platform broadcasts (E-A)

  /** Phones of the active staff of every active operator (or of one operator) who accept the platform's messages. */
  public async staffBroadcastIds(operatorId?: string): Promise<string[]> {
    const devices = await prisma.staffDevice.findMany({
      where: { staff: { isActive: true, notifyPlatform: true, operator: { status: 'active', ...(operatorId ? { id: operatorId } : {}) } } },
      select: { subscriptionId: true },
    });
    return devices.map(d => d.subscriptionId);
  }

  /** Phones of the travellers with a current booking (the traveller app). */
  public async travellerBroadcastIds(now = new Date()): Promise<string[]> {
    const devices = await prisma.travellerDevice.findMany({ where: currentTravellers(now), select: { subscriptionId: true } });
    return devices.map(d => d.subscriptionId);
  }

  /** Sends to the given staff phones; returns how many got it (0 without OneSignal). */
  public async broadcastStaff(ids: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalSettings();
    if (!settings) return 0;
    try {
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] staff broadcast failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** Sends to the given traveller phones; returns how many got it (0 without OneSignal). */
  public async broadcastTravellers(ids: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalTravellerSettings();
    if (!settings) return 0;
    try {
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] traveller broadcast failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** Sends a push to the operator's staff. Returns the number of recipients. */
  public async notifyStaff(operatorId: string, audience: PushAudience, message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalSettings();
    if (!settings) return 0;
    try {
      const ids = await this.subscriptionsFor(operatorId, audience, options.excludeStaffId);
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] could not notify operator ${operatorId}: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** Sends a push to the phones registered on these bookings (the traveller app). Returns the number of recipients. */
  public async notifyTravellers(reservationIds: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalTravellerSettings();
    if (!settings || !reservationIds.length) return 0;
    try {
      const devices = await prisma.travellerDevice.findMany({ where: { reservationId: { in: reservationIds } }, select: { subscriptionId: true } });
      const ids = devices.map(d => d.subscriptionId);
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] could not notify travellers: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  private async sendAll(settings: Settings, ids: string[], message: PushMessage, options: PushOptions) {
    for (let i = 0; i < ids.length; i += MAX_SUBSCRIPTIONS_PER_CALL) {
      await this.send(settings, ids.slice(i, i + MAX_SUBSCRIPTIONS_PER_CALL), message, options);
    }
  }

  private async send(settings: Settings, subscriptionIds: string[], message: PushMessage, options: PushOptions) {
    if (!subscriptionIds.length) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(ONESIGNAL_NOTIFICATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${settings.restApiKey}` },
        body: JSON.stringify({
          app_id: settings.appId,
          target_channel: 'push',
          include_subscription_ids: subscriptionIds,
          // OneSignal requires an English entry: the apps are French only.
          headings: { en: message.title, fr: message.title },
          contents: { en: message.body, fr: message.body },
          data: options.data ?? {},
          ...(options.url ? { url: options.url } : {}),
          ...(options.collapseId ? { collapse_id: options.collapseId } : {}),
          // An arrival or shuttle push is useless an hour later.
          ttl: 3600,
          priority: 10,
        }),
        signal: controller.signal,
      });
      if (!res.ok) logger.warn(`[Push] OneSignal answered ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
