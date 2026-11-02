import { Response } from 'express';
import { Container } from 'typedi';
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS, ChannelOverrides } from '@/domain/staff-notifications';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { PushService } from '@/services/push.service';
import { StaffNotificationService } from '@/services/staff-notification.service';
import catchAsync from '@/utils/catchAsync';
import { HttpException } from '@/utils/httpException';

const invalid = (field: string) => new HttpException(400, 'Invalid value', 'validation_failed', { [field]: 'invalid' });

/** `{ booking_new: { browser: true }, … }`: only known events and channels, booleans only. */
function channelsPatch(body: unknown): ChannelOverrides {
  const channels = (body as { channels?: unknown })?.channels;
  if (!channels || typeof channels !== 'object' || Array.isArray(channels)) throw invalid('channels');
  const patch: ChannelOverrides = {};
  for (const [event, change] of Object.entries(channels as Record<string, unknown>)) {
    if (!(NOTIFICATION_EVENTS as readonly string[]).includes(event) || !change || typeof change !== 'object') throw invalid(`channels.${event}`);
    const set: Record<string, boolean> = {};
    for (const [channel, value] of Object.entries(change as Record<string, unknown>)) {
      if (!(NOTIFICATION_CHANNELS as readonly string[]).includes(channel) || typeof value !== 'boolean')
        throw invalid(`channels.${event}.${channel}`);
      set[channel] = value;
    }
    patch[event as keyof ChannelOverrides] = set;
  }
  return patch;
}

const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null);

export class StaffNotificationController {
  public bell = Container.get(StaffNotificationService);
  public push = Container.get(PushService);

  /** GET /internal/notifications?filter=&before= */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const filter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;
    res.json(await this.bell.list(req.staff, filter, before));
  });

  /** GET /internal/notifications/count */
  public count = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json({ unread: await this.bell.unreadCount(req.staff) });
  });

  /** POST /internal/notifications/read { ids? } */
  public read = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const ids = (req.body as { ids?: unknown })?.ids;
    if (ids !== undefined && (!Array.isArray(ids) || ids.length > 200 || ids.some(id => typeof id !== 'string'))) throw invalid('ids');
    res.json(await this.bell.markRead(req.staff, ids as string[] | undefined));
  });

  /** GET /internal/notifications/channels */
  public channels = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.bell.channels(req.staff));
  });

  /** PUT /internal/notifications/channels { channels } */
  public setChannels = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.bell.setChannels(req.staff, channelsPatch(req.body)));
  });

  /** POST /internal/notifications/browsers { endpoint, keys: { p256dh, auth }, label? } */
  public subscribe = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const body = req.body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; label?: unknown };
    const endpoint = text(body?.endpoint, 1000);
    const p256dh = text(body?.keys?.p256dh, 200);
    const auth = text(body?.keys?.auth, 100);
    if (!endpoint) throw invalid('endpoint');
    if (!p256dh || !auth) throw invalid('keys');
    res.json(await this.bell.subscribeBrowser(req.staff, { endpoint, p256dh, auth, label: text(body.label, 80) }));
  });

  /** POST /internal/notifications/browsers/remove { endpoint } */
  public unsubscribe = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const endpoint = text((req.body as { endpoint?: unknown })?.endpoint, 1000);
    if (!endpoint) throw invalid('endpoint');
    res.json(await this.bell.unsubscribeBrowser(req.staff, endpoint));
  });

  /** POST /internal/notifications/test: the bell, every browser and every phone of the member. */
  public test = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const message = { title: 'Notification de test', body: 'Si vous lisez ceci, les notifications de Plazo arrivent bien.' };
    const browsers = await this.bell.testBell(req.staff, message);
    const phones = await this.push.testPhones(req.staff.id, message);
    res.json({ bell: true, browsers, phones, phonesConfigured: this.push.enabled() });
  });
}
