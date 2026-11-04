import { createHmac } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { nextWhatsappStatus, statusUpdatesOf, validWhatsappSignature, whatsappParam } from '@/domain/whatsapp';
import { NotificationService } from '@/services/notification.service';
import { SmsService } from '@/services/sms.service';
import { WhatsappService } from '@/services/whatsapp.service';
import { api, resetDatabase, setupOperator, useBrevoSms } from './utils/helpers';

// « Plazo envoie par WhatsApp », SMS en repli (03/11/2026). fetch is mocked: no network.

const GRAPH = /^https:\/\/graph\.facebook\.com\/v21\.0\/PHONE-ID\/messages$/;
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/send';
const SECRET = 'app-secret';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;

const whatsapp = Container.get(WhatsappService);
const sms = Container.get(SmsService);
const notifications = Container.get(NotificationService);
const defaultNotificationSettings = { ...notifications.settings };
const defaultConfig = whatsapp.config;
const configured = () => ({
  token: 'token',
  phoneNumberId: 'PHONE-ID',
  appSecret: SECRET,
  verifyToken: 'verify-me',
  template: 'plazo_message',
  language: 'fr',
  graphVersion: 'v21.0',
});

let fetchMock: jest.SpyInstance;
let metaAnswer: () => Response;
const calls = (url: string | RegExp) => fetchMock.mock.calls.filter(([u]) => (typeof url === 'string' ? String(u) === url : url.test(String(u))));

beforeEach(async () => {
  await resetDatabase();
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: 'brevo-key' });
  whatsapp.config = configured;
  let n = 0;
  metaAnswer = () => json({ messaging_product: 'whatsapp', messages: [{ id: `wamid.${++n}` }] });
  fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async (url: any) => (GRAPH.test(String(url)) ? metaAnswer() : json({ messageId: 1 }, 201)));
});
afterEach(() => {
  fetchMock.mockRestore();
  whatsapp.config = defaultConfig;
});
afterAll(() => prisma.$disconnect());

async function operatorWithWhatsapp(smsChannel = true) {
  const op = await setupOperator();
  if (smsChannel) await useBrevoSms(op.operator.id);
  const res = await api().put('/api/internal/whatsapp/settings').set(auth(op.token)).send({ enabled: true });
  expect(res.status).toBe(200);
  return op;
}

const reminder = (text = 'Bonjour Camille,\nnous vous attendons demain à 06:30.') => ({
  reservationId: null,
  kind: 'booking_reminder' as const,
  to: '06 12 34 56 78',
  text,
});

function statusDelivery(id: string, status: string, code?: number) {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id, status, ...(code ? { errors: [{ code }] } : {}) }] } }] }],
  });
}

const postWebhook = (body: string, signature = sign(body)) =>
  api().post('/api/public/whatsapp/webhook').set('content-type', 'application/json').set('x-hub-signature-256', signature).send(body);

describe('WhatsApp : règles', () => {
  it('met le texte du SMS sur une ligne et ne fait que avancer les états', () => {
    expect(whatsappParam('Bonjour,\n\nvotre   navette\tpart.')).toBe('Bonjour, · votre navette part.');
    expect(whatsappParam('a'.repeat(50), 10)).toHaveLength(10);
    expect(nextWhatsappStatus('sent', 'delivered')).toBe('delivered');
    expect(nextWhatsappStatus('read', 'delivered')).toBe('read');
    expect(nextWhatsappStatus('delivered', 'failed')).toBe('delivered');
    expect(nextWhatsappStatus('sent', 'failed')).toBe('failed');
    expect(nextWhatsappStatus('fallback', 'read')).toBe('fallback');
    expect(statusUpdatesOf(JSON.parse(statusDelivery('wamid.1', 'failed', 131026)))).toEqual([
      { id: 'wamid.1', status: 'failed', errorCode: 'meta_131026' },
    ]);
    const body = Buffer.from('{"a":1}');
    expect(validWhatsappSignature(body, sign('{"a":1}'), SECRET)).toBe(true);
    expect(validWhatsappSignature(body, sign('{"a":2}'), SECRET)).toBe(false);
    expect(validWhatsappSignature(body, undefined, SECRET)).toBe(false);
  });
});

describe('WhatsApp : réglages', () => {
  it('refuse de l’allumer sans le numéro de Plazo, et montre le repli SMS', async () => {
    const op = await setupOperator();
    whatsapp.config = defaultConfig;
    let res = await api().put('/api/internal/whatsapp/settings').set(auth(op.token)).send({ enabled: true });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('whatsapp_unavailable');
    whatsapp.config = configured;
    res = await api().put('/api/internal/whatsapp/settings').set(auth(op.token)).send({ enabled: true });
    expect(res.body).toMatchObject({ available: true, enabled: true, smsFallback: false });
    await useBrevoSms(op.operator.id);
    res = await api().get('/api/internal/whatsapp/settings').set(auth(op.token));
    expect(res.body).toMatchObject({ enabled: true, smsFallback: true, month: { whatsapp: 0, fallbacks: 0 } });
  });

  it('envoie un test par WhatsApp seulement, et dit le code de Meta quand il refuse', async () => {
    const op = await operatorWithWhatsapp();
    let res = await api().post('/api/internal/whatsapp/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(res.status).toBe(200);
    const body = JSON.parse(calls(GRAPH)[0][1].body);
    expect(body).toMatchObject({ to: '33612345678', type: 'template', template: { name: 'plazo_message', language: { code: 'fr' } } });
    metaAnswer = () => json({ error: { code: 131030, message: 'Recipient not in allowed list' } }, 400);
    res = await api().post('/api/internal/whatsapp/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('meta_131030');
    expect(calls(BREVO_SMS_URL)).toHaveLength(0);
  });
});

describe('WhatsApp : envoi et repli SMS', () => {
  it('passe par WhatsApp quand il est allumé, sans SMS ; le SMS reste pour les tests', async () => {
    const op = await operatorWithWhatsapp();
    expect(await sms.sendTravellerSms(op.operator.id, reminder())).toBe('sent');
    expect(calls(GRAPH)).toHaveLength(1);
    expect(calls(BREVO_SMS_URL)).toHaveLength(0);
    const params = JSON.parse(calls(GRAPH)[0][1].body).template.components[0].parameters.map((p: any) => p.text);
    expect(params).toEqual([op.operator.name, '-', 'Bonjour Camille, · nous vous attendons demain à 06:30.']);
    const row = await prisma.whatsappMessage.findFirstOrThrow();
    expect(row).toMatchObject({ status: 'sent', waMessageId: 'wamid.1', to: '+33612345678', kind: 'booking_reminder' });
    expect(row.fallbackText).toContain('Bonjour Camille');

    await sms.sendTravellerSms(op.operator.id, { ...reminder(), kind: 'test' });
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
    expect(calls(GRAPH)).toHaveLength(1);
  });

  it('envoie le SMS tout de suite quand Meta refuse le message', async () => {
    const op = await operatorWithWhatsapp();
    metaAnswer = () => json({ error: { code: 131047 } }, 400);
    expect(await sms.sendTravellerSms(op.operator.id, reminder())).toBe('sent');
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
    expect(await prisma.whatsappMessage.findFirstOrThrow()).toMatchObject({ status: 'failed', errorCode: 'meta_131047', fallbackText: null });
  });

  it('remis : plus de SMS ; échoué : le SMS part une seule fois', async () => {
    const op = await operatorWithWhatsapp();
    await sms.sendTravellerSms(op.operator.id, reminder());
    await sms.sendTravellerSms(op.operator.id, reminder());

    let res = await postWebhook(statusDelivery('wamid.1', 'delivered'));
    expect(res.status).toBe(200);
    expect(await prisma.whatsappMessage.findUniqueOrThrow({ where: { waMessageId: 'wamid.1' } })).toMatchObject({
      status: 'delivered',
      fallbackText: null,
    });
    res = await postWebhook(statusDelivery('wamid.1', 'read'));
    expect((await prisma.whatsappMessage.findUniqueOrThrow({ where: { waMessageId: 'wamid.1' } })).status).toBe('read');

    res = await postWebhook(statusDelivery('wamid.2', 'failed', 131026));
    expect(res.body).toEqual({ updated: 1, fallbacks: 1 });
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
    expect(JSON.parse(calls(BREVO_SMS_URL)[0][1].body).content).toBe('Bonjour Camille,\nnous vous attendons demain à 06:30.');
    expect(await prisma.whatsappMessage.findUniqueOrThrow({ where: { waMessageId: 'wamid.2' } })).toMatchObject({
      status: 'fallback',
      errorCode: 'meta_131026',
      smsOutcome: 'sent',
      fallbackText: null,
    });
    // Meta's retry of the same delivery, then the 15-minute pass: nothing sent again.
    await postWebhook(statusDelivery('wamid.2', 'failed', 131026));
    expect(await whatsapp.sweep(new Date(Date.now() + 10 * 60 * 1000))).toEqual({ fallbacks: 0, forgotten: 0 });
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);

    res = await api().get('/api/internal/whatsapp/settings').set(auth(op.token));
    expect(res.body.month).toEqual({ whatsapp: 1, read: 1, fallbacks: 1, failed: 0 });
  });

  it('refuse une livraison mal signée', async () => {
    const res = await postWebhook(statusDelivery('wamid.1', 'failed'), 'sha256=bad');
    expect(res.status).toBe(401);
    const check = await api()
      .get('/api/public/whatsapp/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '12345' });
    expect(check.status).toBe(200);
    expect(check.text).toBe('12345');
    const wrong = await api().get('/api/public/whatsapp/webhook').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'x', 'hub.challenge': '1' });
    expect(wrong.status).toBe(403);
  });

  it('non remis après 5 minutes : le SMS part ; après 2 heures, le texte est oublié', async () => {
    const op = await operatorWithWhatsapp();
    await sms.sendTravellerSms(op.operator.id, reminder());
    expect(await whatsapp.sweep(new Date(Date.now() + 60 * 1000))).toEqual({ fallbacks: 0, forgotten: 0 });
    expect(await whatsapp.sweep(new Date(Date.now() + 6 * 60 * 1000))).toEqual({ fallbacks: 1, forgotten: 0 });
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);

    await sms.sendTravellerSms(op.operator.id, reminder());
    expect(await whatsapp.sweep(new Date(Date.now() + 3 * 3600 * 1000))).toEqual({ fallbacks: 0, forgotten: 1 });
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
  });

  it('sans canal SMS : WhatsApp seul, rien en repli', async () => {
    const op = await operatorWithWhatsapp(false);
    expect(await sms.sendTravellerSms(op.operator.id, reminder())).toBe('sent');
    expect((await prisma.whatsappMessage.findFirstOrThrow()).fallbackText).toBeNull();
    await postWebhook(statusDelivery('wamid.1', 'failed', 131026));
    expect(calls(BREVO_SMS_URL)).toHaveLength(0);
    expect((await prisma.whatsappMessage.findFirstOrThrow()).status).toBe('failed');
  });

  it('éteint : le SMS comme avant', async () => {
    const op = await operatorWithWhatsapp();
    await api().put('/api/internal/whatsapp/settings').set(auth(op.token)).send({ enabled: false });
    await sms.sendTravellerSms(op.operator.id, reminder());
    expect(calls(GRAPH)).toHaveLength(0);
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
  });
});

describe('Messages au voyageur sur la fiche (04/11/2026)', () => {
  it('liste WhatsApp et SMS de la réservation, le repli en une ligne, et refuse un autre loueur', async () => {
    const op = await operatorWithWhatsapp();
    const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const created = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: `${day}T08:00`,
        returnAt: `${day}T20:00`,
        passengers: 1,
        customerFirstName: 'Camille',
        customerLastName: 'Martin',
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
      });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    // Whatever the booking itself sent (none by phone), two messages of ours: one read, one fallen back to SMS.
    await prisma.whatsappMessage.deleteMany({ where: { reservationId: id } });
    await prisma.smsOutbox.deleteMany({ where: { reservationId: id } });
    await sms.sendTravellerSms(op.operator.id, { ...reminder(), reservationId: id, kind: 'booking_confirmed' });
    await sms.sendTravellerSms(op.operator.id, { ...reminder(), reservationId: id });
    const [first, second] = await prisma.whatsappMessage.findMany({ where: { reservationId: id }, orderBy: { createdAt: 'asc' } });
    await postWebhook(statusDelivery(first.waMessageId!, 'read'));
    await postWebhook(statusDelivery(second.waMessageId!, 'failed', 131026));

    const res = await api().get(`/api/internal/reservations/${id}/messages`).set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.data.map((m: any) => [m.kind, m.channel, m.status, m.whatsappFallback])).toEqual([
      ['booking_reminder', 'sms', 'sent', true],
      ['booking_confirmed', 'whatsapp', 'read', false],
    ]);

    const other = await setupOperator('Autre parking');
    expect((await api().get(`/api/internal/reservations/${id}/messages`).set(auth(other.token))).status).toBe(404);
  });
});
