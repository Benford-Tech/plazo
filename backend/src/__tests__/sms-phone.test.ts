import { randomBytes } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { daySegments, failureEvents, offlineAlert, PhoneCheck, stateChanges } from '@/domain/sms-phone';
import { PushService } from '@/services/push.service';
import { SMS_GATEWAY_CLOUD_URL } from '@/services/sms-gateway.service';
import { SmsPhoneService } from '@/services/sms-phone.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// The parking's SMS phone (06/11/2026): checked every 15 minutes, a 7-day ribbon, one alert per outage. fetch is mocked.

const TZ = 'Europe/Paris';
const KEY = randomBytes(32).toString('base64');
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const at = (local: string) => new Date(`${local}:00+01:00`); // November: Paris is UTC+1
const minutes = (n: number) => n * 60_000;

describe('domain: the ribbon and the changes', () => {
  const check = (time: string, state: PhoneCheck['state'], lastSeen?: string): PhoneCheck => ({
    checkedAt: at(`2026-11-05T${time}`),
    state,
    lastSeenAt: lastSeen ? at(`2026-11-05T${lastSeen}`) : null,
  });

  it('colours the day by the checks, grey where nothing is known', () => {
    const checks = [
      check('17:30', 'online', '17:29'),
      check('17:45', 'online', '17:38'),
      check('18:00', 'offline', '17:38'),
      check('18:15', 'offline', '17:38'),
    ];
    const segments = daySegments(checks, '2026-11-05', TZ, at('2026-11-05T18:20'));
    expect(segments.map(s => [s.from, s.to, s.state])).toEqual([
      ['00:00', '17:30', 'none'],
      ['17:30', '18:00', 'online'],
      ['18:00', '18:20', 'offline'],
      ['18:20', '24:00', 'none'],
    ]);
    expect(segments[0].start).toBe(0);
    expect(segments.at(-1)!.end).toBe(1);
  });

  it('a check stands for 20 minutes at most', () => {
    const segments = daySegments([check('10:00', 'online')], '2026-11-05', TZ, at('2026-11-05T12:00'));
    expect(segments.map(s => [s.from, s.to, s.state])).toEqual([
      ['00:00', '10:00', 'none'],
      ['10:00', '10:20', 'online'],
      ['10:20', '24:00', 'none'],
    ]);
  });

  it('lists the outage from the last sign of life, and how long it lasted', () => {
    const checks = [
      check('17:30', 'online', '17:29'),
      check('17:45', 'offline', '17:38'),
      check('18:00', 'offline', '17:38'),
      check('21:15', 'online', '21:14'),
    ];
    const events = stateChanges(checks);
    expect(events).toEqual([
      { kind: 'state', at: at('2026-11-05T17:45'), state: 'offline', lastSeenAt: at('2026-11-05T17:38'), afterMs: minutes(8) },
      { kind: 'state', at: at('2026-11-05T21:15'), state: 'online', lastSeenAt: at('2026-11-05T21:14'), afterMs: minutes(217) },
    ]);
  });

  it('groups the SMS that did not leave by kind and burst', () => {
    const row = (kind: string, status: 'failed' | 'abandoned', created: string, updated = created) => ({
      kind,
      status,
      createdAt: at(`2026-11-05T${created}`),
      updatedAt: at(`2026-11-05T${updated}`),
    });
    const events = failureEvents([
      ...Array.from({ length: 8 }, (_, i) => row('booking_reminder', 'abandoned', `18:0${i}`, '20:05')),
      row('booking_confirmed', 'abandoned', '18:03', '20:10'),
      row('booking_reminder', 'abandoned', '23:00', '23:59'),
    ]);
    expect(events.map(e => e.kind === 'sms_failed' && [e.smsKind, e.count, e.at])).toEqual([
      ['booking_reminder', 8, at('2026-11-05T20:05')],
      ['booking_confirmed', 1, at('2026-11-05T20:10')],
      ['booking_reminder', 1, at('2026-11-05T23:59')],
    ]);
  });

  it('the alert names the day-before SMS when it is due', () => {
    expect(offlineAlert({ lastSeenAt: at('2026-11-05T17:38'), reminderAt: '18:00', tz: TZ })).toEqual({
      title: 'Téléphone SMS hors ligne',
      body: "Plus de nouvelles depuis 17:38. Le SMS de la veille part à 18:00 : ouvrez l'appli SMS.",
    });
    expect(offlineAlert({ lastSeenAt: null, reminderAt: null, tz: TZ }).body).toBe(
      "Le téléphone ne s'est pas manifesté. Les SMS aux voyageurs attendront son retour : ouvrez l'appli SMS.",
    );
  });
});

describe('the phone checks', () => {
  const phone = Container.get(SmsPhoneService);
  const push = Container.get(PushService);
  let fetchMock: jest.SpyInstance;
  let pushMock: jest.SpyInstance;
  let lastSeen: string | null;
  let ping: number | null;
  let spacing: { send_interval_min: number; send_interval_max: number } | null;

  beforeEach(async () => {
    await resetDatabase();
    process.env.SMS_GATEWAY_ENCRYPTION_KEY = KEY;
    lastSeen = new Date().toISOString();
    ping = null;
    spacing = null;
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      const u = String(url);
      if (u === `${SMS_GATEWAY_CLOUD_URL}/devices`) return json([{ id: 'dev-1', name: 'Pixel', lastSeen }]);
      if (u === `${SMS_GATEWAY_CLOUD_URL}/settings` && (init?.method ?? 'GET') === 'GET')
        return json({ ...(ping ? { ping: { interval_seconds: ping } } : {}), ...(spacing ? { messages: spacing } : {}) });
      if (u === `${SMS_GATEWAY_CLOUD_URL}/settings`) return json({});
      return json({ id: 'gw-1', state: 'Pending' }, 202);
    });
    pushMock = jest.spyOn(push, 'notifyStaff').mockResolvedValue(0);
  });
  afterEach(() => {
    fetchMock.mockRestore();
    pushMock.mockRestore();
    delete process.env.SMS_GATEWAY_ENCRYPTION_KEY;
  });
  afterAll(() => prisma.$disconnect());

  async function linked() {
    const op = await setupOperator();
    const res = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ mode: 'gateway', login: 'AB12CD', password: 's3cret-from-the-app', senderPhone: '+33612345678' });
    expect(res.status).toBe(200);
    return op;
  }

  it('records the phone online, and asks the app once to ping every 5 minutes and to space its SMS', async () => {
    const op = await linked();
    const now = new Date();
    expect(await phone.checkAll(now)).toEqual({ checked: 1, offline: 0, alerted: 0 });
    const checks = await prisma.smsPhoneCheck.findMany({ where: { operatorId: op.operator.id } });
    expect(checks).toHaveLength(1);
    expect(checks[0].state).toBe('online');
    const patch = fetchMock.mock.calls.filter(([u, init]) => String(u).endsWith('/settings') && init?.method === 'PATCH');
    expect(patch.map(([, init]) => JSON.parse(init.body))).toEqual([
      { ping: { interval_seconds: 300 } },
      // 07/11/2026 (« Faudrait espacer les envois »): 30 to 60 s between two SMS.
      { messages: { send_interval_min: 30, send_interval_max: 60 } },
    ]);

    // Ten minutes later: no new check (two crons at once); twenty minutes later, a check, and no second PATCH.
    expect((await phone.checkAll(new Date(now.getTime() + minutes(5)))).checked).toBe(0);
    expect((await phone.checkAll(new Date(now.getTime() + minutes(20)))).checked).toBe(1);
    expect(fetchMock.mock.calls.filter(([u, init]) => String(u).endsWith('/settings') && init?.method === 'PATCH')).toHaveLength(2);
  });

  it('keeps a ping and a spacing the app already has', async () => {
    ping = 120;
    spacing = { send_interval_min: 45, send_interval_max: 90 };
    await linked();
    await phone.checkAll(new Date());
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(0);
  });

  it('tells the managers once per outage, and again after the phone came back', async () => {
    const op = await linked();
    const t0 = new Date();
    lastSeen = new Date(t0.getTime() - minutes(30)).toISOString();
    expect(await phone.checkAll(t0)).toEqual({ checked: 1, offline: 1, alerted: 1 });
    expect(pushMock).toHaveBeenCalledWith(op.operator.id, 'team', expect.objectContaining({ title: 'Téléphone SMS hors ligne' }), expect.anything());
    expect((await phone.checkAll(new Date(t0.getTime() + minutes(15)))).alerted).toBe(0);
    lastSeen = new Date(t0.getTime() + minutes(29)).toISOString();
    expect((await phone.checkAll(new Date(t0.getTime() + minutes(30)))).offline).toBe(0);
    lastSeen = new Date(t0.getTime() + minutes(29)).toISOString();
    expect((await phone.checkAll(new Date(t0.getTime() + minutes(60)))).alerted).toBe(1);
    expect(pushMock).toHaveBeenCalledTimes(2);
  });

  it('no alert when the manager turned it off; the app’s server down is « unknown », never an alert', async () => {
    const op = await linked();
    expect((await api().put('/api/internal/sms/phone/alerts').set(auth(op.token)).send({ enabled: false })).body).toEqual({ alerts: false });
    lastSeen = null;
    expect((await phone.checkAll(new Date())).alerted).toBe(0);

    await prisma.operatorSmsSettings.updateMany({ data: { phoneAlerts: true, phoneCheckedAt: null } });
    fetchMock.mockImplementation(async () => json({ message: 'down' }, 500));
    expect((await phone.checkAll(new Date())).alerted).toBe(0);
    const last = await prisma.smsPhoneCheck.findFirst({ orderBy: { checkedAt: 'desc' } });
    expect(last).toMatchObject({ state: 'unknown', errorCode: 'sms_gateway_error' });
  });

  it('serves the 7 days, the changes and the SMS that did not leave', async () => {
    const op = await linked();
    const now = new Date();
    const old = (ms: number) => new Date(now.getTime() - ms);
    await prisma.smsPhoneCheck.createMany({
      data: [
        { operatorId: op.operator.id, checkedAt: old(minutes(60)), state: 'online', lastSeenAt: old(minutes(61)) },
        { operatorId: op.operator.id, checkedAt: old(minutes(45)), state: 'offline', lastSeenAt: old(minutes(61)) },
        { operatorId: op.operator.id, checkedAt: old(minutes(10)), state: 'online', lastSeenAt: old(minutes(11)) },
      ],
    });
    await prisma.smsOutbox.createMany({
      data: Array.from({ length: 3 }, () => ({
        operatorId: op.operator.id,
        kind: 'booking_reminder',
        to: '+33600000000',
        bodyHash: 'x',
        provider: 'gateway',
        status: 'abandoned' as const,
        createdAt: old(minutes(50)),
      })),
    });
    const res = await api().get('/api/internal/sms/phone').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(7);
    expect(res.body.days[0].reminderAt).toBe('18:00');
    expect(res.body.now).toMatchObject({ state: 'online' });
    expect(res.body.alerts).toBe(true);
    const kinds = res.body.events.map((e: { kind: string; state?: string; count?: number }) => (e.kind === 'state' ? e.state : `failed×${e.count}`));
    expect(kinds).toEqual(expect.arrayContaining(['online', 'offline', 'failed×3']));
    const today = res.body.days[0];
    const total = today.segments.reduce((sum: number, s: { start: number; end: number }) => sum + (s.end - s.start), 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('is for managers only', async () => {
    const op = await linked();
    const driver = await addStaff(op.token, 'driver');
    expect((await api().get('/api/internal/sms/phone').set(auth(driver.token))).status).toBe(403);
  });
});
