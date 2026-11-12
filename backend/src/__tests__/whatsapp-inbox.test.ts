import { createHmac } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { inboundMessagesOf, previewOf, replyUntil } from '@/domain/whatsapp-inbox';
import { WhatsappService } from '@/services/whatsapp.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// « Une boîte de réception des messages envoyés par WhatsApp » (12/11/2026, direction A). fetch is mocked: no network.

const GRAPH = /^https:\/\/graph\.facebook\.com\/v21\.0\/PHONE-ID\/messages$/;
const SECRET = 'app-secret';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;

const whatsapp = Container.get(WhatsappService);
const defaultConfig = whatsapp.config;
let fetchMock: jest.SpyInstance;
let sent = 0;

beforeEach(async () => {
  await resetDatabase();
  whatsapp.config = () => ({
    token: 'token',
    phoneNumberId: 'PHONE-ID',
    appSecret: SECRET,
    verifyToken: 'verify-me',
    template: 'plazo_message',
    language: 'fr',
    graphVersion: 'v21.0',
    templates: '',
    reminderTemplate: '',
    businessAccountId: '',
  });
  fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async (url: any) =>
      GRAPH.test(String(url)) ? json({ messaging_product: 'whatsapp', messages: [{ id: `wamid.out.${++sent}` }] }) : json({}, 404),
    );
});
afterEach(() => {
  fetchMock.mockRestore();
  whatsapp.config = defaultConfig;
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

const incoming = (id: string, from: string, text: string, name = 'Camille') =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              contacts: [{ wa_id: from, profile: { name } }],
              messages: [{ id, from, timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: text } }],
            },
          },
        ],
      },
    ],
  });

const postWebhook = (body: string) =>
  api().post('/api/public/whatsapp/webhook').set('content-type', 'application/json').set('x-hub-signature-256', sign(body)).send(body);

async function booking(operatorId: string, parkingId: string, phone = '06 12 34 56 78') {
  const arrivalAt = new Date(Date.now() + 20 * 3600000);
  return prisma.reservation.create({
    data: {
      reference: `RWI${Math.floor(Math.random() * 900 + 100)}`,
      operatorId,
      parkingId,
      channel: 'phone',
      status: 'upcoming',
      arrivalAt,
      returnAt: new Date(arrivalAt.getTime() + 3 * 86400000),
      passengers: 2,
      customerName: 'Camille Martin',
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: phone,
      plate: 'AB-123-CD',
      plateKey: 'AB123CD',
    },
  });
}

describe('Boîte WhatsApp : lecture des messages de Meta', () => {
  it('lit le texte, le nom, les photos et ignore les états', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const messages = inboundMessagesOf(
      {
        entry: [
          {
            changes: [
              {
                value: {
                  contacts: [{ wa_id: '33612345678', profile: { name: ' Camille ' } }],
                  messages: [
                    { id: 'w1', from: '33612345678', timestamp: '1794477600', type: 'text', text: { body: ' On arrive à 8h ' } },
                    { id: 'w2', from: '33612345678', timestamp: '1794477660', type: 'image', image: { id: 'M1', mime_type: 'image/jpeg' } },
                    { id: 'w3', from: 'x', type: 'text', text: { body: 'sans numéro' } },
                  ],
                  statuses: [{ id: 'wamid.1', status: 'read' }],
                },
              },
            ],
          },
        ],
      },
      now,
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ from: '+33612345678', text: 'On arrive à 8h', profileName: 'Camille', type: 'text' });
    expect(messages[1]).toMatchObject({ type: 'image', mediaId: 'M1', text: null });
    expect(previewOf(messages[1])).toBe('Photo');
    expect(replyUntil(new Date(now.getTime() - 3600000), now)).not.toBeNull();
    expect(replyUntil(new Date(now.getTime() - 25 * 3600000), now)).toBeNull();
  });
});

describe('Boîte WhatsApp : réception, réponse, traité', () => {
  it('range le message sur la réservation du numéro, prévient et permet de répondre dans les 24 h', async () => {
    const op = await setupOperator();
    const res = await booking(op.operator.id, op.parking.id);

    const first = await postWebhook(incoming('wamid.in.1', '33612345678', 'On arrive plutôt vers 8h, c’est possible ?'));
    expect(first.status).toBe(200);
    expect(first.body.received).toBe(1);
    // Delivered twice by Meta: stored once.
    expect((await postWebhook(incoming('wamid.in.1', '33612345678', 'On arrive plutôt vers 8h, c’est possible ?'))).body.received).toBeUndefined();

    const list = await api().get('/api/internal/whatsapp/inbox?view=unread').set(auth(op.token));
    expect(list.status).toBe(200);
    expect(list.body.counts).toMatchObject({ unread: 1, all: 1, handled: 0, unknown: null });
    const conv = list.body.data[0];
    expect(conv).toMatchObject({ name: 'Camille Martin', unread: 1, phone: '06 12 34 56 78' });
    expect(conv.reservation.id).toBe(res.id);
    expect(conv.preview.text).toContain('8h');

    const bell = await prisma.staffNotification.findMany({ where: { operatorId: op.operator.id } });
    expect(bell.some(n => n.event === 'whatsapp')).toBe(true);
    expect((await api().get('/api/internal/nav/counts').set(auth(op.token))).body.whatsapp).toBe(1);

    const open = await api().get(`/api/internal/whatsapp/inbox/${conv.id}`).set(auth(op.token));
    expect(open.body.messages).toHaveLength(1);
    expect(open.body.conversation.replyUntil).toBeTruthy();
    expect((await api().get('/api/internal/nav/counts').set(auth(op.token))).body.whatsapp).toBe(0);

    const reply = await api().post(`/api/internal/whatsapp/inbox/${conv.id}/reply`).set(auth(op.token)).send({ text: 'Oui, à demain 8h.' });
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({ direction: 'out', status: 'sent', by: { firstName: 'Gérant' } });
    const body = JSON.parse(fetchMock.mock.calls.find(([u]) => GRAPH.test(String(u)))[1].body);
    expect(body).toMatchObject({ to: '33612345678', type: 'text', text: { body: 'Oui, à demain 8h.' } });

    // Meta's status of the reply moves it forward.
    const status = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.out.' + sent, status: 'read' }] } }] }] });
    await postWebhook(status);
    expect((await prisma.whatsappInboxMessage.findFirst({ where: { direction: 'out' } }))?.status).toBe('read');

    const messages = await api().get(`/api/internal/reservations/${res.id}/messages`).set(auth(op.token));
    expect(messages.body.conversation.messages.map((m: any) => m.direction)).toEqual(['out', 'in']);

    const handled = await api().post(`/api/internal/whatsapp/inbox/${conv.id}/handle`).set(auth(op.token));
    expect(handled.body.handledAt).toBeTruthy();
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(op.token))).body.counts).toMatchObject({ all: 0, handled: 1 });
    // A new message brings it back.
    await postWebhook(incoming('wamid.in.2', '33612345678', 'Merci !'));
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(op.token))).body.counts).toMatchObject({ all: 1, unread: 1, handled: 0 });
  });

  it('refuse une réponse après 24 h, et un autre parking ne voit pas la conversation', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    await booking(op.operator.id, op.parking.id);
    await postWebhook(incoming('wamid.in.3', '33612345678', 'Bonjour'));
    const conv = await prisma.whatsappConversation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect((await api().get(`/api/internal/whatsapp/inbox/${conv.id}`).set(auth(other.token))).status).toBe(404);
    await prisma.whatsappConversation.update({ where: { id: conv.id }, data: { lastInboundAt: new Date(Date.now() - 25 * 3600000) } });
    const late = await api().post(`/api/internal/whatsapp/inbox/${conv.id}/reply`).set(auth(op.token)).send({ text: 'Bonjour' });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('window_closed');
    const driver = await addStaff(op.token, 'driver');
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(driver.token))).status).toBe(403);
  });

  it('garde un numéro inconnu pour la plateforme, qui le rattache par la référence', async () => {
    const op = await setupOperator();
    const res = await booking(op.operator.id, op.parking.id, '06 99 88 77 66');
    process.env.PLATFORM_ADMIN_EMAILS = op.manager.email;
    await prisma.staff.update({ where: { id: op.manager.id }, data: { emailVerifiedAt: new Date() } });
    await postWebhook(incoming('wamid.in.4', '33611111111', 'C’est pour la réservation de mon père'));
    const unknown = await api().get('/api/internal/whatsapp/inbox?view=unknown').set(auth(op.token));
    expect(unknown.body.data).toHaveLength(1);
    expect(unknown.body.counts.unknown).toBe(1);
    const attach = await api()
      .post(`/api/internal/whatsapp/inbox/${unknown.body.data[0].id}/attach`)
      .set(auth(op.token))
      .send({ reference: res.reference.toLowerCase() });
    expect(attach.status).toBe(200);
    const mine = await api().get('/api/internal/whatsapp/inbox').set(auth(op.token));
    expect(mine.body.data[0].reservation.id).toBe(res.id);
    expect(mine.body.counts.unknown).toBe(0);
  });
});
