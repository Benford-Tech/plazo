import { Service } from 'typedi';
import { oneSignalSettings } from '@/config';
import prisma from '@/database';
import { PushMessage } from '@/domain/arrival-messages';
import { logger } from '@/utils/logger';

export const ONESIGNAL_NOTIFICATIONS_URL = 'https://api.onesignal.com/notifications?c=push';
/** OneSignal accepts at most this many subscription ids per call. */
const MAX_SUBSCRIPTIONS_PER_CALL = 2000;

export type PushAudience = 'arrivals' | 'returns';

/**
 * Push notifications to the staff's phones, through the OneSignal REST API. Off (a no-op) unless
 * ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY are set. A push never fails the action that caused
 * it: errors are caught and logged without the message (it names a traveller).
 */
@Service()
export class PushService {
  public timeoutMs = 5000;

  public enabled(): boolean {
    return oneSignalSettings() !== null;
  }

  /** Subscription ids of the operator's active staff who want this kind of notification. */
  public async subscriptionsFor(operatorId: string, audience: PushAudience): Promise<string[]> {
    const devices = await prisma.staffDevice.findMany({
      where: {
        staff: { operatorId, isActive: true, ...(audience === 'arrivals' ? { notifyArrivals: true } : { notifyReturns: true }) },
      },
      select: { subscriptionId: true },
    });
    return devices.map(d => d.subscriptionId);
  }

  /**
   * Sends a push to the operator's staff. `collapseId` makes a newer push replace an older one on
   * the phone (one notification per traveller, not a pile). Returns the number of recipients.
   */
  public async notifyStaff(
    operatorId: string,
    audience: PushAudience,
    message: PushMessage,
    options: { data?: Record<string, string>; collapseId?: string } = {},
  ): Promise<number> {
    const settings = oneSignalSettings();
    if (!settings) return 0;
    try {
      const ids = await this.subscriptionsFor(operatorId, audience);
      for (let i = 0; i < ids.length; i += MAX_SUBSCRIPTIONS_PER_CALL) {
        await this.send(settings, ids.slice(i, i + MAX_SUBSCRIPTIONS_PER_CALL), message, options);
      }
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] could not notify operator ${operatorId}: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  private async send(
    settings: { appId: string; restApiKey: string },
    subscriptionIds: string[],
    message: PushMessage,
    options: { data?: Record<string, string>; collapseId?: string },
  ) {
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
          // OneSignal requires an English entry: the staff app is French only.
          headings: { en: message.title, fr: message.title },
          contents: { en: message.body, fr: message.body },
          data: options.data ?? {},
          ...(options.collapseId ? { collapse_id: options.collapseId } : {}),
          // An arrival push is useless an hour later.
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
