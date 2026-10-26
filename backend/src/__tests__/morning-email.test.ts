import { Container } from 'typedi';
import prisma from '@/database';
import { morningEmail, morningEmailDue, MorningDigest, wantsMorningEmail } from '@/domain/morning-email';
import { MorningEmailService } from '@/services/morning-email.service';
import { NotificationService } from '@/services/notification.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// « Mail du matin » (21/10/2026, choice A). Brevo is mocked; everything is fictional.

const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const notifications = Container.get(NotificationService);
const service = Container.get(MorningEmailService);
const defaultSettings = { ...notifications.settings };

// 07:30 in Paris (summer time ends on 25/10/2026).
const MORNING = new Date('2026-10-22T05:30:00Z');

type Op = Awaited<ReturnType<typeof setupOperator>>;
let op: Op;
let fetchMock: jest.SpyInstance;

// 26/10/2026: a member added by addStaff receives a team invitation; only the morning mails count here.
const emails = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_EMAIL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>)
    .filter(mail => !(mail.tags ?? []).includes('team_invitation'));

beforeEach(async () => {
  await resetDatabase();
  op = await setupOperator('Parking Fictif');
  Object.assign(notifications.settings, defaultSettings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
  process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    if (String(url) === BREVO_EMAIL) return new Response(JSON.stringify({ messageId: '<m@brevo>' }), { status: 201 });
    return new Response('{}', { status: 200 });
  });
});

afterEach(() => {
  fetchMock.mockRestore();
  Object.assign(notifications.settings, defaultSettings);
});

describe('rules', () => {
  it('is on for managers by default, and follows the choice', () => {
    expect(wantsMorningEmail(null, 'manager')).toBe(true);
    expect(wantsMorningEmail(null, 'agent')).toBe(false);
    expect(wantsMorningEmail(false, 'manager')).toBe(false);
    expect(wantsMorningEmail(true, 'driver')).toBe(true);
  });

  it('is due from the chosen hour until noon, once a day', () => {
    expect(morningEmailDue(6, 7, null, '2026-10-22')).toBe(false);
    expect(morningEmailDue(7, 7, null, '2026-10-22')).toBe(true);
    expect(morningEmailDue(9, 7, '2026-10-21', '2026-10-22')).toBe(true);
    expect(morningEmailDue(9, 7, '2026-10-22', '2026-10-22')).toBe(false);
    expect(morningEmailDue(12, 7, null, '2026-10-22')).toBe(false);
  });

  it('writes the planning, the revenue and the integrations, escaped', () => {
    const digest: MorningDigest = {
      firstName: 'Claire',
      parkingName: 'Parking <Fictif>',
      date: '2026-10-22',
      sendHour: 7,
      role: 'manager',
      onSite: 78,
      capacity: 120,
      arrivals: { count: 14, first: '05:30' },
      returns: { count: 1, last: '23:40' },
      tonight: { count: 83, bookable: 100 },
      moves: [{ time: '05:30', kind: 'arrival', customer: 'C. Exemple', source: 'Allopark', detail: 'vol AF7641' }],
      movesTotal: 15,
      revenue: {
        yesterdayCents: 61200,
        yesterdayCount: 11,
        monthLabel: 'Octobre',
        monthCents: 894000,
        commissionCents: 131200,
        netCents: 762800,
        withoutAmount: 3,
      },
      integrations: [{ label: 'Onepark · aucun mail depuis 4 jours', tone: 'warn', badge: 'À voir' }],
      links: {
        dashboard: 'https://site.example/pro/',
        unsubscribe: 'https://site.example/api/public/morning-email/unsubscribe/x.y',
        settings: 'https://site.example/pro/mon-compte',
      },
    };
    const message = morningEmail(digest);
    expect(message.subject).toBe('Parking <Fictif> · jeudi 22 oct. : 14 arrivées, 1 retour');
    expect(message.html).toContain('Parking &lt;Fictif&gt;');
    expect(message.html).not.toContain('Parking <Fictif>');
    expect(message.html).toContain('83 %');
    expect(message.html).toContain('et 14 autres mouvements');
    expect(message.html).toContain('3 réservations sans prix');
    expect(message.text).toContain('Ne plus le recevoir : https://site.example/api/public/morning-email/unsubscribe/x.y');
    expect(message.text).toContain('Octobre : 8 940,00 € encaissés');
    const agent = morningEmail({ ...digest, role: 'agent', revenue: null });
    expect(agent.text).not.toContain("CHIFFRE D'AFFAIRES");
  });
});

describe('the morning pass', () => {
  it('writes to the managers once, at their hour, with an opt-out header', async () => {
    await addStaff(op.token, 'agent');
    expect(await service.run(new Date('2026-10-22T04:30:00Z'))).toEqual({ sent: 0, failed: 0, skipped: 0 });
    const first = await service.run(MORNING);
    expect(first.sent).toBe(1);
    const [mail] = emails();
    expect(mail.to).toEqual([{ email: op.manager.email, name: expect.any(String) }]);
    expect(mail.subject).toMatch(/0 arrivée, 0 retour$/);
    expect(mail.headers['List-Unsubscribe']).toMatch(/^<https:\/\/site\.example\/api\/public\/morning-email\/unsubscribe\//);
    expect(mail.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(mail.textContent).toContain("CHIFFRE D'AFFAIRES");
    expect((await service.run(new Date(MORNING.getTime() + 15 * 60000))).sent).toBe(0);
    expect(emails()).toHaveLength(1);
  });

  it('skips members who turned it off, and suspended operators', async () => {
    await prisma.staff.update({ where: { email: op.manager.email }, data: { morningEmail: false } });
    expect((await service.run(MORNING)).sent).toBe(0);
    await prisma.staff.update({ where: { email: op.manager.email }, data: { morningEmail: true } });
    await prisma.operator.update({ where: { id: op.manager.operatorId }, data: { suspendedAt: new Date() } });
    expect((await service.run(MORNING)).sent).toBe(0);
  });

  it('writes to another role who turned it on, without the revenue', async () => {
    const agent = await addStaff(op.token, 'agent');
    await prisma.staff.update({ where: { email: op.manager.email }, data: { morningEmail: false } });
    await prisma.staff.update({ where: { id: agent.id }, data: { morningEmail: true, morningEmailHour: 6 } });
    expect((await service.run(MORNING)).sent).toBe(1);
    const [mail] = emails();
    expect(mail.to[0].email).toBe(agent.email);
    expect(mail.textContent).not.toContain("CHIFFRE D'AFFAIRES");
    expect(mail.htmlContent).toContain('INTÉGRATIONS');
  });
});

describe('the setting and the link', () => {
  it('reads and changes the setting', async () => {
    const res = await api().get('/api/internal/notifications/preferences').set(auth(op.token));
    expect(res.body.morningEmail).toEqual({ enabled: true, hour: 7, email: op.manager.email });
    const patched = await api()
      .patch('/api/internal/notifications/preferences')
      .set(auth(op.token))
      .send({ morningEmail: { enabled: false, hour: 8 } });
    expect(patched.status).toBe(200);
    expect(patched.body.morningEmail).toEqual({ enabled: false, hour: 8, email: op.manager.email });
    const bad = await api()
      .patch('/api/internal/notifications/preferences')
      .set(auth(op.token))
      .send({ morningEmail: { hour: 4 } });
    expect(bad.status).toBe(400);
  });

  it('sends today’s email on demand', async () => {
    const res = await api().post('/api/internal/notifications/morning-email/send').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(emails()).toHaveLength(1);
  });

  it('turns it off from the link, never on a mere visit', async () => {
    const staff = await prisma.staff.findUniqueOrThrow({ where: { email: op.manager.email } });
    const token = service.unsubscribeToken(staff.id);
    const page = await api().get(`/api/public/morning-email/unsubscribe/${token}`);
    expect(page.status).toBe(200);
    expect(page.text).toContain('Ne plus le recevoir');
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: staff.id } })).morningEmail).toBeNull();
    const done = await api().post(`/api/public/morning-email/unsubscribe/${token}`);
    expect(done.status).toBe(200);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: staff.id } })).morningEmail).toBe(false);
    expect((await api().get(`/api/public/morning-email/unsubscribe/${staff.id}.forged`)).status).toBe(404);
  });
});
