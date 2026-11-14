import { createHmac } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { readyToSend, registrationPin, splitPhone, statusAfterCheck } from '@/domain/whatsapp-number';
import { WhatsappService } from '@/services/whatsapp.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 14/11/2026 (« Un compte WhatsApp Business par parking », chemin 1): a parking's own number on Benford Tech's account,
// display name « Plazo ». fetch is mocked: no network.

const SECRET = 'app-secret';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;
const GRAPH = 'https://graph.facebook.com/v21.0/';

const whatsapp = Container.get(WhatsappService);
const defaultConfig = whatsapp.config;
const defaultNumbersConfig = whatsapp.numbers.config;
let fetchMock: jest.SpyInstance;
let meta: { nameStatus: string; status: string };
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => ({ url: String(url).replace(GRAPH, ''), body: init?.body ? JSON.parse(init.body) : null }));

beforeEach(async () => {
  await resetDatabase();
  meta = { nameStatus: 'PENDING_REVIEW', status: 'CONNECTED' };
  const config = () => ({
    token: 'token',
    phoneNumberId: 'PLAZO-ID',
    appSecret: SECRET,
    verifyToken: 'verify-me',
    template: 'plazo_message',
    language: 'fr',
    graphVersion: 'v21.0',
    templates: '',
    reminderTemplate: '',
    businessAccountId: 'WABA-1',
  });
  whatsapp.config = config;
  whatsapp.numbers.config = config;
  whatsapp.numbers.secret = 'secret';
  let sent = 0;
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
    const path = String(url).replace(GRAPH, '');
    if (path === 'WABA-1/phone_numbers') return json({ id: '1111111111' });
    if (path.startsWith('WABA-1/phone_numbers?')) return json({ data: [{ id: '2222222222', display_phone_number: '+33 6 12 00 00 01' }] });
    if (path === '1111111111/request_code' || path === '1111111111/verify_code' || path === '1111111111/register') return json({ success: true });
    if (path.startsWith('1111111111?') || path.startsWith('2222222222?'))
      return json({ name_status: meta.nameStatus, status: meta.status, quality_rating: 'GREEN', verified_name: 'Plazo' });
    if (/^\w+-?\w*\/messages$/.test(path) || /^\d+\/messages$/.test(path))
      return json({ messaging_product: 'whatsapp', messages: [{ id: `wamid.out.${++sent}` }] });
    return json({}, 404);
  });
});
afterEach(() => {
  fetchMock.mockRestore();
  whatsapp.config = defaultConfig;
  whatsapp.numbers.config = defaultNumbersConfig;
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

describe('numéro WhatsApp par parking : règles', () => {
  it('lit un numéro, dérive le code PIN, passe actif quand Meta valide le nom', () => {
    expect(splitPhone('06 39 98 12 40')).toEqual({ cc: '33', national: '639981240', e164: '+33639981240' });
    expect(splitPhone('+41 79 123 45 67')).toEqual({ cc: '41', national: '791234567', e164: '+41791234567' });
    expect(splitPhone('00352 621 123 456')?.cc).toBe('352');
    expect(splitPhone('pas un numéro')).toBeNull();
    const pin = registrationPin('s', '1111111111');
    expect(pin).toMatch(/^\d{6}$/);
    expect(registrationPin('s', '1111111111')).toBe(pin);
    expect(readyToSend({ nameStatus: 'PENDING_REVIEW', metaStatus: 'CONNECTED' })).toBe(false);
    expect(statusAfterCheck('registered', { nameStatus: 'APPROVED', metaStatus: 'CONNECTED' })).toBe('active');
    expect(statusAfterCheck('paused', { nameStatus: 'APPROVED', metaStatus: 'CONNECTED' })).toBe('paused');
  });
});

describe('numéro WhatsApp par parking : de la demande à l’envoi', () => {
  it('demande, ajout, code, vérification ; envoi depuis le numéro du parking une fois actif seulement', async () => {
    const admin = await setupOperator();
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const op = await setupOperator();

    // The parking asks: the platform sees it.
    const asked = await api().post('/api/internal/whatsapp/number/request').set(auth(op.token));
    expect(asked.status).toBe(200);
    expect(asked.body).toMatchObject({ status: 'requested', sending: false, displayName: 'Plazo' });
    const overview = await api().get('/api/internal/platform/overview').set(auth(admin.token));
    expect(overview.body.todos.some((t: any) => t.kind === 'whatsapp_requested' && t.operatorId === op.operator.id)).toBe(true);

    const base = `/api/internal/platform/operators/${op.operator.id}/whatsapp-number`;
    expect((await api().post(base).set(auth(admin.token)).send({ phone: 'abc' })).body.fields).toEqual({ phone: 'invalid' });
    const added = await api().post(base).set(auth(admin.token)).send({ phone: '06 39 98 12 40' });
    expect(added.status).toBe(200);
    expect(added.body).toMatchObject({ status: 'added', phone: '06 39 98 12 40', phoneNumberId: '1111111111' });
    expect(calls().find(c => c.url === 'WABA-1/phone_numbers')?.body).toEqual({ cc: '33', phone_number: '639981240', verified_name: 'Plazo' });
    expect((await api().post(base).set(auth(admin.token)).send({ phone: '06 39 98 12 41' })).body.code).toBe('number_exists');

    expect((await api().post(`${base}/code`).set(auth(admin.token)).send({ method: 'SMS' })).body.status).toBe('code_sent');
    expect((await api().post(`${base}/verify`).set(auth(admin.token)).send({ code: '12' })).body.fields).toEqual({ code: 'invalid' });
    const verified = await api().post(`${base}/verify`).set(auth(admin.token)).send({ code: '123 456' });
    expect(verified.body).toMatchObject({ status: 'registered', nameStatus: 'PENDING_REVIEW', sending: false });
    expect(calls().find(c => c.url === '1111111111/register')?.body).toEqual({
      messaging_product: 'whatsapp',
      pin: registrationPin('secret', '1111111111'),
    });

    // Not active yet: Plazo's number, as before.
    const t = await api().post('/api/internal/whatsapp/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(t.body).toEqual({ outcome: 'sent' });
    expect(
      calls()
        .filter(c => c.url.endsWith('/messages'))
        .pop()?.url,
    ).toBe('PLAZO-ID/messages');

    // Meta approves the name: the 15-minute pass turns it on.
    meta.nameStatus = 'APPROVED';
    await prisma.operatorWhatsappNumber.updateMany({ data: { checkedAt: null } });
    expect(await whatsapp.numbers.checkAll()).toEqual({ checked: 1, activated: 1 });
    const settings = await api().get('/api/internal/whatsapp/settings').set(auth(op.token));
    expect(settings.body.number).toMatchObject({ status: 'active', sending: true, phone: '06 39 98 12 40' });
    await api().post('/api/internal/whatsapp/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(
      calls()
        .filter(c => c.url.endsWith('/messages'))
        .pop()?.url,
    ).toBe('1111111111/messages');

    // Paused: Plazo's number again; resumed: the parking's.
    expect((await api().post(`${base}/pause`).set(auth(admin.token))).body.status).toBe('paused');
    await api().post('/api/internal/whatsapp/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(
      calls()
        .filter(c => c.url.endsWith('/messages'))
        .pop()?.url,
    ).toBe('PLAZO-ID/messages');
    expect((await api().post(`${base}/resume`).set(auth(admin.token))).body.status).toBe('active');

    // Only the platform.
    expect((await api().post(base).set(auth(op.token)).send({ phone: '06 39 98 12 40' })).status).toBe(403);
    expect((await api().delete(base).set(auth(admin.token))).body).toEqual({ removed: true });
    expect(await whatsapp.numbers.senderFor(op.operator.id)).toBeNull();
  });

  it('un numéro déjà ajouté chez Meta se relie par son identifiant', async () => {
    const admin = await setupOperator();
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const op = await setupOperator();
    const base = `/api/internal/platform/operators/${op.operator.id}/whatsapp-number`;
    expect((await api().post(`${base}/link`).set(auth(admin.token)).send({ phoneNumberId: '9999999999' })).body.code).toBe('number_not_in_account');
    const linked = await api().post(`${base}/link`).set(auth(admin.token)).send({ phoneNumberId: '2222222222' });
    expect(linked.body).toMatchObject({ phoneNumberId: '2222222222', phone: '06 12 00 00 01', nameStatus: 'PENDING_REVIEW' });
  });

  it('un message reçu au numéro du parking va à ce parking, et la réponse part de ce numéro', async () => {
    const op = await setupOperator();
    const other = await setupOperator();
    // The same traveller is a client of both parkings: on Plazo's number it would wait in « Numéro inconnu ».
    for (const o of [op, other]) {
      await prisma.reservation.create({
        data: {
          reference: `RWN${Math.floor(Math.random() * 900 + 100)}`,
          operatorId: o.operator.id,
          parkingId: o.parking.id,
          channel: 'phone',
          status: 'upcoming',
          arrivalAt: new Date(Date.now() + 20 * 3600000),
          returnAt: new Date(Date.now() + 90 * 3600000),
          passengers: 1,
          customerName: 'Camille Martin',
          customerFirstName: 'Camille',
          customerLastName: 'Martin',
          customerPhone: '06 12 34 56 78',
          plate: '',
          plateKey: '',
        },
      });
    }
    await prisma.operatorWhatsappNumber.create({
      data: { operatorId: op.operator.id, status: 'active', phone: '+33639981240', phoneNumberId: '1111111111' },
    });
    const body = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: '1111111111' },
                contacts: [{ wa_id: '33612345678', profile: { name: 'Camille' } }],
                messages: [
                  {
                    id: 'wamid.in.n1',
                    from: '33612345678',
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: 'text',
                    text: { body: 'Bonjour' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const hook = await api()
      .post('/api/public/whatsapp/webhook')
      .set('content-type', 'application/json')
      .set('x-hub-signature-256', sign(body))
      .send(body);
    expect(hook.body.received).toBe(1);
    const conversation = await prisma.whatsappConversation.findFirstOrThrow();
    expect(conversation).toMatchObject({ operatorId: op.operator.id, phoneNumberId: '1111111111' });
    expect(conversation.reservationId).not.toBeNull();

    const reply = await api().post(`/api/internal/whatsapp/inbox/${conversation.id}/reply`).set(auth(op.token)).send({ text: 'Bonjour !' });
    expect(reply.status).toBe(201);
    expect(
      calls()
        .filter(c => c.url.endsWith('/messages'))
        .pop()?.url,
    ).toBe('1111111111/messages');
  });
});
