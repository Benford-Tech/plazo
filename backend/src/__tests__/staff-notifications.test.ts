import { Container } from 'typedi';
import prisma from '@/database';
import { channelsOf } from '@/domain/staff-notifications';
import { ONESIGNAL_NOTIFICATIONS_URL, PushService } from '@/services/push.service';
import { StaffNotificationService, resetWebPushKeyCache } from '@/services/staff-notification.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 02/11/2026 (« Mets en place les notifs »): the bell, « Mes notifications » and the browsers. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
let fetchMock: jest.SpyInstance;
const pushCalls = () => fetchMock.mock.calls.filter(([url]) => String(url) === ONESIGNAL_NOTIFICATIONS_URL);

beforeEach(async () => {
  await resetDatabase();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  // Browser notifications off unless a test turns them on (Plazo would otherwise make its own keys).
  process.env.WEB_PUSH = 'off';
  resetWebPushKeyCache();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.WEB_PUSH;
});

describe('channelsOf (domain)', () => {
  const base = {
    post: null,
    notifyArrivals: true,
    notifyReturns: true,
    notifyShuttles: true,
    notifyPlatform: true,
    bookingNotify: 'hourly' as const,
    notificationChannels: null,
  };

  it('follows the role by default, the older columns for the phone', () => {
    expect(channelsOf({ ...base, role: 'manager' }, 'booking_new')).toEqual({ phone: true, browser: true, bell: true });
    expect(channelsOf({ ...base, role: 'driver' }, 'booking_new')).toEqual({ phone: true, browser: false, bell: false });
    expect(channelsOf({ ...base, role: 'driver' }, 'arrival')).toEqual({ phone: true, browser: false, bell: true });
    expect(channelsOf({ ...base, role: 'manager', notifyArrivals: false }, 'arrival').phone).toBe(false);
    // A driver never hears of the inbox, nor of the team's requests.
    expect(channelsOf({ ...base, role: 'driver' }, 'inbox')).toEqual({ phone: false, browser: false, bell: false });
    expect(channelsOf({ ...base, role: 'agent' }, 'team')).toEqual({ phone: false, browser: false, bell: false });
  });

  it('takes the member’s own switches, never for the phone of an event with an older column', () => {
    const staff = { ...base, role: 'manager' as const, notificationChannels: { arrival: { phone: false, bell: false }, inbox: { phone: true } } };
    expect(channelsOf(staff, 'arrival')).toEqual({ phone: true, browser: false, bell: false });
    expect(channelsOf(staff, 'inbox')).toEqual({ phone: true, browser: true, bell: true });
  });
});

describe('the bell', () => {
  it('records every notification for whoever asked for it, without OneSignal too, and marks them read', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');
    const valet = await addStaff(op.token, 'valet');
    const push = Container.get(PushService);

    expect(
      await push.notifyStaff(
        op.operator.id,
        'arrivals',
        { title: 'Client en route', body: 'Jean Dupont · 10 min' },
        { data: { reservationId: 'r1' } },
      ),
    ).toBe(0);
    await push.notifyStaff(op.operator.id, 'inbox', { title: 'Mail à vérifier', body: 'Onepark' }, { data: { type: 'inbox', emailId: 'e1' } });

    const mine = await api().get('/api/internal/notifications').set(auth(driver.token));
    expect(mine.status).toBe(200);
    expect(mine.body.unread).toBe(1);
    expect(mine.body.data).toEqual([
      expect.objectContaining({ event: 'arrival', title: 'Client en route', target: '/reservations/r1', readAt: null }),
    ]);

    const manager = await api().get('/api/internal/notifications').set(auth(op.token));
    expect(manager.body.data.map((n: { event: string }) => n.event)).toEqual(['inbox', 'arrival']);
    expect(manager.body.data[0].target).toBe('/reservations/a-verifier?mail=e1');
    // The valet's default bell has no arrivals.
    expect((await api().get('/api/internal/notifications/count').set(auth(valet.token))).body).toEqual({ unread: 0 });

    const filtered = await api().get('/api/internal/notifications?filter=bookings').set(auth(op.token));
    expect(filtered.body.data.map((n: { event: string }) => n.event)).toEqual(['inbox']);

    const read = await api()
      .post('/api/internal/notifications/read')
      .set(auth(op.token))
      .send({ ids: [manager.body.data[0].id] });
    expect(read.body).toEqual({ unread: 1 });
    expect((await api().post('/api/internal/notifications/read').set(auth(op.token)).send({})).body).toEqual({ unread: 0 });
    // The driver's are their own.
    expect((await api().get('/api/internal/notifications/count').set(auth(driver.token))).body).toEqual({ unread: 1 });
  });

  it('leaves out the member who acted, and the digest stays on the phones', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const push = Container.get(PushService);
    await push.notifyStaff(op.operator.id, 'bookings', { title: 'Nouvelle réservation', body: 'x' }, { excludeStaffId: agent.id });
    await push.notifyStaff(op.operator.id, 'bookingDigest', { title: '3 réservations reçues', body: 'y' }, { phoneOnly: true });
    expect((await api().get('/api/internal/notifications/count').set(auth(agent.token))).body.unread).toBe(0);
    const manager = await api().get('/api/internal/notifications').set(auth(op.token));
    expect(manager.body.data.map((n: { title: string }) => n.title)).toEqual(['Nouvelle réservation']);
  });

  it('forgets after 30 days', async () => {
    const op = await setupOperator();
    await Container.get(PushService).notifyStaff(op.operator.id, 'team', { title: 'Demande', body: 'z' });
    await prisma.staffNotification.updateMany({ data: { createdAt: new Date(Date.now() - 31 * 86400000) } });
    expect((await api().get('/api/internal/notifications').set(auth(op.token))).body.data).toEqual([]);
    expect(await Container.get(StaffNotificationService).purge()).toBe(1);
  });
});

describe('« Mes notifications »', () => {
  it('lists the events of the role with their channels, and saves a switch (phone column included)', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');
    const res = await api().get('/api/internal/notifications/channels').set(auth(driver.token));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.channels)).not.toContain('inbox');
    expect(res.body.channels.arrival).toEqual({ phone: true, browser: false, bell: true });
    expect(res.body.webPush).toEqual({ available: false, publicKey: null });

    const saved = await api()
      .put('/api/internal/notifications/channels')
      .set(auth(driver.token))
      .send({ channels: { arrival: { phone: false, browser: true }, shuttle: { bell: false } } });
    expect(saved.status).toBe(200);
    expect(saved.body.channels.arrival).toEqual({ phone: false, browser: true, bell: true });
    expect(saved.body.channels.shuttle.bell).toBe(false);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: driver.id } })).notifyArrivals).toBe(false);

    const bad = await api()
      .put('/api/internal/notifications/channels')
      .set(auth(driver.token))
      .send({ channels: { arrival: { sms: true } } });
    expect(bad.status).toBe(400);
  });

  it('a phone switched off for an event without column stops its pushes', async () => {
    process.env.ONESIGNAL_APP_ID = 'app-1';
    process.env.ONESIGNAL_REST_API_KEY = 'rest-key';
    const op = await setupOperator();
    await prisma.staffDevice.create({ data: { staffId: op.manager.id, subscriptionId: 'sub-manager' } });
    const push = Container.get(PushService);
    expect(await push.notifyStaff(op.operator.id, 'team', { title: 'Demande', body: 'z' })).toBe(1);
    await api()
      .put('/api/internal/notifications/channels')
      .set(auth(op.token))
      .send({ channels: { team: { phone: false } } });
    expect(await push.notifyStaff(op.operator.id, 'team', { title: 'Demande', body: 'z' })).toBe(0);
    expect(pushCalls()).toHaveLength(1);
  });

  it('refuses a browser when browser notifications are off, and sends a test to the bell and the phones', async () => {
    const op = await setupOperator();
    const sub = await api()
      .post('/api/internal/notifications/browsers')
      .set(auth(op.token))
      .send({ endpoint: 'https://push.example.com/abc', keys: { p256dh: 'k', auth: 'a' } });
    expect(sub.status).toBe(409);
    expect(sub.body.code).toBe('web_push_unavailable');

    const test = await api().post('/api/internal/notifications/test').set(auth(op.token));
    expect(test.status).toBe(200);
    expect(test.body).toEqual({ bell: true, browsers: 0, phones: 0, phonesConfigured: false });
    expect((await api().get('/api/internal/notifications/count').set(auth(op.token))).body.unread).toBe(1);
  });

  it('makes its own key pair once when Vercel has none, and keeps it', async () => {
    delete process.env.WEB_PUSH;
    await prisma.webPushKey.deleteMany();
    const op = await setupOperator();
    const first = await api().get('/api/internal/notifications/channels').set(auth(op.token));
    expect(first.body.webPush.available).toBe(true);
    expect(first.body.webPush.publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    // Another instance (no cache) reads the same pair back, never a new one.
    resetWebPushKeyCache();
    const again = await api().get('/api/internal/notifications/channels').set(auth(op.token));
    expect(again.body.webPush.publicKey).toBe(first.body.webPush.publicKey);
    expect(await prisma.webPushKey.count()).toBe(1);
    const res = await api()
      .post('/api/internal/notifications/browsers')
      .set(auth(op.token))
      .send({ endpoint: 'https://push.example.com/own', keys: { p256dh: 'k', auth: 'a' } });
    expect(res.status).toBe(200);
  });

  it('registers a browser once VAPID keys are set', async () => {
    delete process.env.WEB_PUSH;
    // A throwaway key pair, valid P-256 (web-push generates them).
    const webpush = await import('web-push');
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    const op = await setupOperator();
    const res = await api()
      .post('/api/internal/notifications/browsers')
      .set(auth(op.token))
      .send({ endpoint: 'https://push.example.com/abc', keys: { p256dh: 'k', auth: 'a' }, label: 'Chrome · Mac' });
    expect(res.status).toBe(200);
    expect(res.body.webPush.publicKey).toBe(keys.publicKey);
    expect(res.body.devices.browsers).toEqual([expect.objectContaining({ label: 'Chrome · Mac', endpoint: 'https://push.example.com/abc' })]);
    const removed = await api()
      .post('/api/internal/notifications/browsers/remove')
      .set(auth(op.token))
      .send({ endpoint: 'https://push.example.com/abc' });
    expect(removed.body.devices.browsers).toEqual([]);
  });
});
