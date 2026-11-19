import { Container } from 'typedi';
import prisma from '@/database';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { smsTarget, validateSmsText } from '@/domain/prospect-sms';
import { suppressionHash } from '@/domain/prospecting';
import { NotificationService } from '@/services/notification.service';
import { ProspectingService } from '@/services/prospecting.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// SMS de prospection (19/11/2026, « pouvoir envoyer un sms de prospection », choix C). Brevo is mocked; every parking and
// number is fictional.

const P = '/api/internal/platform/prospects';
const BREVO_SMS = 'https://api.brevo.com/v3/transactionalSMS/send';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const notifications = Container.get(NotificationService);
const service = Container.get(ProspectingService);
const defaultNotificationSettings = { ...notifications.settings };
// Tuesday 17/11/2026, 10:00 in Paris: inside the window.
const TUESDAY = new Date('2026-11-17T09:00:00Z');

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let fetchMock: jest.SpyInstance;
let brevoStatus = 201;

const sms = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_SMS)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>);

const actor = () => ({ ...admin.manager, operatorName: 'Plazo (tests)' }) as unknown as AuthenticatedStaff;

async function create(n: number, overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post(P)
    .set(auth(admin.token))
    .send({
      companyName: `Parking Fictif ${n}`,
      contactFirstName: 'Camille',
      email: `contact${n}@parking-fictif.example`,
      airportCode: 'LYS',
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
  Object.assign(notifications.settings, defaultNotificationSettings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
  brevoStatus = 201;
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    if (String(url) !== BREVO_SMS) return new Response('{}', { status: 200 });
    if (brevoStatus >= 400) return new Response(JSON.stringify({ code: 'invalid_parameter' }), { status: brevoStatus });
    return new Response(JSON.stringify({ messageId: 1 }), { status: brevoStatus });
  });
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  delete process.env.PROSPECTING_PHONE;
  Object.assign(notifications.settings, defaultNotificationSettings);
  fetchMock.mockRestore();
});
afterAll(() => prisma.$disconnect());

describe('SMS de prospection : règles', () => {
  it('mobiles seulement, pas les désinscrits, un par semaine', () => {
    const base = { status: 'to_contact' as const, lastSmsAt: null, suppressed: false };
    expect(smsTarget({ ...base, phone: '06 12 34 56 78' }, TUESDAY)).toEqual({ to: '+33612345678' });
    expect(smsTarget({ ...base, phone: '01 23 45 67 89' }, TUESDAY)).toEqual({ skip: 'not_mobile' });
    expect(smsTarget({ ...base, phone: '+1 312 555 0100' }, TUESDAY)).toEqual({ skip: 'not_mobile' });
    expect(smsTarget({ ...base, phone: null }, TUESDAY)).toEqual({ skip: 'no_phone' });
    expect(smsTarget({ ...base, phone: '06 12 34 56 78', suppressed: true }, TUESDAY)).toEqual({ skip: 'unsubscribed' });
    expect(smsTarget({ ...base, phone: '06 12 34 56 78', status: 'not_interested' }, TUESDAY)).toEqual({ skip: 'closed' });
    expect(smsTarget({ ...base, phone: '06 12 34 56 78', lastSmsAt: new Date('2026-11-12T09:00:00Z') }, TUESDAY)).toEqual({ skip: 'recent' });
    expect(smsTarget({ ...base, phone: '06 12 34 56 78', lastSmsAt: new Date('2026-11-09T09:00:00Z') }, TUESDAY)).toEqual({ to: '+33612345678' });
  });

  it('le texte : requis, variables connues, longueur', () => {
    expect(validateSmsText('')).toEqual({ ok: false, error: 'required' });
    expect(validateSmsText('Bonjour {inconnu}')).toEqual({ ok: false, error: 'unknown_variable' });
    expect(validateSmsText('a'.repeat(481))).toEqual({ ok: false, error: 'too_long' });
    expect(validateSmsText(' Bonjour {prénom} ')).toEqual({ ok: true, value: 'Bonjour {prénom}' });
  });
});

describe('SMS de prospection : envoi', () => {
  it('aperçu : qui le recevra, sans rien envoyer', async () => {
    const mobile = await create(1, { phone: '06 12 34 56 78' });
    const fixed = await create(2, { phone: '01 23 45 67 89' });
    const none = await create(3);
    const res = await api()
      .post(`${P}/sms`)
      .set(auth(admin.token))
      .send({ ids: [mobile.id, fixed.id, none.id], text: 'Bonjour {prénom}, démo : {lien_demo}', dryRun: true });
    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ ready: 1, sent: 0, failed: 0, skipped: 2 });
    expect(res.body.results).toEqual([
      { id: mobile.id, outcome: 'ready' },
      { id: fixed.id, outcome: 'skipped', reason: 'not_mobile' },
      { id: none.id, outcome: 'skipped', reason: 'no_phone' },
    ]);
    expect(sms()).toHaveLength(0);
  });

  it('envoie à chacun avec ses variables, en marketing, puis plus pendant 7 jours', async () => {
    const a = await create(1, { phone: '06 12 34 56 78', contactFirstName: 'Camille' });
    const b = await create(2, { phone: '+32 470 12 34 56', contactFirstName: 'Lou', airportCode: 'CRL' });
    const out = await service.sendSms(actor(), { ids: [a.id, b.id], text: 'Bonjour {prénom}, Plazo Pro pour {parking} : {lien_demo}' }, TUESDAY);
    expect(out.counts).toEqual({ ready: 0, sent: 2, failed: 0, skipped: 0 });
    const sent = sms();
    expect(sent.map(s => s.recipient)).toEqual(['33612345678', '32470123456']);
    expect(sent[0].type).toBe('marketing');
    expect(sent[0].content).toMatch(/^Bonjour Camille, Plazo Pro pour Parking Fictif 1 : https:\/\//);
    expect(sent[1].content).toContain('Bonjour Lou');
    const rows = await prisma.prospectMessage.findMany({ where: { channel: 'sms' } });
    expect(rows).toHaveLength(2);
    expect(await service.sentToday(TUESDAY)).toBe(0);
    expect(await service.smsSentToday(TUESDAY)).toBe(2);

    const again = await service.sendSms(actor(), { ids: [a.id], text: 'Encore' }, new Date('2026-11-18T09:00:00Z'));
    expect(again.results).toEqual([{ id: a.id, outcome: 'skipped', reason: 'recent' }]);
    const list = await api().get(P).set(auth(admin.token));
    expect(list.body.data.find((p: { id: string }) => p.id === a.id).lastSmsAt).toBe(TUESDAY.toISOString());
    expect(list.body.sms).toMatchObject({ cap: 200, configured: true });
  });

  it('jamais à une adresse désinscrite ; un refus de Brevo peut être retenté', async () => {
    const out1 = await create(1, { phone: '06 12 34 56 78' });
    await prisma.prospectSuppression.create({ data: { emailHash: suppressionHash('contact1@parking-fictif.example') } });
    const ok = await create(2, { phone: '06 98 76 54 32' });
    brevoStatus = 400;
    const out = await service.sendSms(actor(), { ids: [out1.id, ok.id], text: 'Bonjour' }, TUESDAY);
    expect(out.results).toEqual([
      { id: out1.id, outcome: 'skipped', reason: 'unsubscribed' },
      { id: ok.id, outcome: 'failed' },
    ]);
    expect((await prisma.prospect.findUnique({ where: { id: ok.id } }))!.lastSmsAt).toBeNull();
    brevoStatus = 201;
    expect((await service.sendSms(actor(), { ids: [ok.id], text: 'Bonjour' }, TUESDAY)).counts.sent).toBe(1);
  });

  it("hors des heures d'envoi et sans Brevo : refusé", async () => {
    const a = await create(1, { phone: '06 12 34 56 78' });
    const sunday = new Date('2026-11-22T10:00:00Z');
    await expect(service.sendSms(actor(), { ids: [a.id], text: 'Bonjour' }, sunday)).rejects.toMatchObject({ code: 'outside_window' });
    notifications.settings.apiKey = '';
    await expect(service.sendSms(actor(), { ids: [a.id], text: 'Bonjour' }, TUESDAY)).rejects.toMatchObject({ code: 'prospecting_sms_unavailable' });
    expect(sms()).toHaveLength(0);
  });

  it('réservé au super admin ; texte vérifié', async () => {
    const loueur = await setupOperator('Loueur');
    const a = await create(1, { phone: '06 12 34 56 78' });
    expect(
      (
        await api()
          .post(`${P}/sms`)
          .set(auth(loueur.token))
          .send({ ids: [a.id], text: 'x', dryRun: true })
      ).status,
    ).toBe(403);
    const bad = await api()
      .post(`${P}/sms`)
      .set(auth(admin.token))
      .send({ ids: [a.id], text: 'Bonjour {inconnu}', dryRun: true });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ text: 'unknown_variable' });
  });

  it("« M'envoyer un test » part au téléphone de PROSPECTING_PHONE", async () => {
    const res1 = await api().post(`${P}/sms/test`).set(auth(admin.token)).send({ text: 'Bonjour {prénom}' });
    expect(res1.status).toBe(409);
    expect(res1.body.code).toBe('no_test_phone');
    process.env.PROSPECTING_PHONE = '07 00 00 00 01';
    const a = await create(1, { phone: '06 12 34 56 78', contactFirstName: 'Camille' });
    const res = await api().post(`${P}/sms/test`).set(auth(admin.token)).send({ text: 'Bonjour {prénom}', prospectId: a.id });
    expect(res.status).toBe(200);
    expect(sms()).toEqual([expect.objectContaining({ recipient: '33700000001', content: 'Bonjour Camille', type: 'marketing' })]);
    expect(await prisma.prospectMessage.count()).toBe(0);
  });
});
