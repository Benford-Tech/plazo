import { createHmac } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { manageToken } from '@/domain/booking';
import { appConversationPhone, inboundMessagesOf, previewOf, replyChannelOf, replyUntil } from '@/domain/whatsapp-inbox';
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
    expect(list.body.counts).toMatchObject({ unread: 1, all: 1, handled: 0, unknown: null, sent: 0 });
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

  it('liste les messages envoyés par Plazo, avec leur texte et la conversation du numéro', async () => {
    const op = await setupOperator();
    const res = await booking(op.operator.id, op.parking.id);
    await prisma.whatsappMessage.create({
      data: {
        operatorId: op.operator.id,
        reservationId: res.id,
        kind: 'booking_reminder',
        to: '+33612345678',
        status: 'read',
        body: 'Bonjour Camille, à demain 8h.',
      },
    });
    await prisma.whatsappMessage.create({
      data: {
        operatorId: op.operator.id,
        kind: 'booking_confirmed',
        to: '+33699999999',
        status: 'sent',
        createdAt: new Date(Date.now() - 40 * 86400000),
      },
    });
    await postWebhook(incoming('wamid.in.9', '33612345678', 'Merci'));
    const list = await api().get('/api/internal/whatsapp/sent').set(auth(op.token));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      kind: 'booking_reminder',
      status: 'read',
      text: 'Bonjour Camille, à demain 8h.',
      phone: '06 12 34 56 78',
    });
    expect(list.body.data[0].reservation.id).toBe(res.id);
    expect(list.body.data[0].conversationId).toBeTruthy();
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(op.token))).body.counts.sent).toBe(1);
    const open = await api().get(`/api/internal/whatsapp/inbox/${list.body.data[0].conversationId}`).set(auth(op.token));
    expect(open.body.sent[0].text).toBe('Bonjour Camille, à demain 8h.');
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/whatsapp/sent').set(auth(other.token))).body.data).toHaveLength(0);
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

  it('un client de deux parkings : aucun parking ne voit le message, sauf celui dont il cite la réservation', async () => {
    const a = await setupOperator();
    const b = await setupOperator('Autre');
    const resA = await booking(a.operator.id, a.parking.id);
    const resB = await booking(b.operator.id, b.parking.id);
    await prisma.whatsappMessage.create({
      data: { operatorId: b.operator.id, reservationId: resB.id, kind: 'booking_reminder', to: '+33612345678' },
    });

    await postWebhook(incoming('wamid.in.30', '33612345678', 'Bonjour, je serai en retard'));
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(a.token))).body.data).toHaveLength(0);
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(b.token))).body.data).toHaveLength(0);
    expect(await prisma.whatsappConversation.count({ where: { operatorId: null } })).toBe(1);

    await postWebhook(incoming('wamid.in.31', '33612345678', `C'est pour la réservation ${resA.reference.toLowerCase()}`));
    const mine = await api().get('/api/internal/whatsapp/inbox').set(auth(a.token));
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].reservation.id).toBe(resA.id);
    expect((await api().get('/api/internal/whatsapp/inbox').set(auth(b.token))).body.data).toHaveLength(0);
    const open = await api().get(`/api/internal/whatsapp/inbox/${mine.body.data[0].id}`).set(auth(a.token));
    expect(open.body.messages.map((m: any) => m.text)).toEqual([`C'est pour la réservation ${resA.reference.toLowerCase()}`]);
    expect((await api().get(`/api/internal/whatsapp/inbox/${mine.body.data[0].id}`).set(auth(b.token))).status).toBe(404);
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

// The traveller's link reads only bookings of a parking with a listing.
async function withListing(token: string) {
  const listing = await api()
    .put('/api/internal/listing')
    .set(auth(token))
    .send({
      airportCode: 'LYS',
      slug: `parking-messages-${Math.floor(Math.random() * 1e6)}`,
      title: 'Parking Messages',
      services: ['shuttle'],
      shuttleMinutes: 8,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 00',
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  expect(listing.status).toBe(200);
}

describe('« Écrire au parking » depuis l’app Plazo (12/11/2026)', () => {
  it('choisit où part la réponse et la clé de la conversation', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const hourAgo = new Date(now.getTime() - 3600000);
    expect(replyChannelOf({ phone: '+33612345678', lastInboundAt: hourAgo, lastAppAt: null }, now)).toBe('whatsapp');
    expect(replyChannelOf({ phone: '+33612345678', lastInboundAt: hourAgo, lastAppAt: now }, now)).toBe('app');
    expect(replyChannelOf({ phone: '+33612345678', lastInboundAt: now, lastAppAt: hourAgo }, now)).toBe('whatsapp');
    expect(replyChannelOf({ phone: '+33612345678', lastInboundAt: new Date(now.getTime() - 30 * 3600000), lastAppAt: hourAgo }, now)).toBe('app');
    expect(replyChannelOf({ phone: '+33612345678', lastInboundAt: new Date(now.getTime() - 30 * 3600000), lastAppAt: null }, now)).toBeNull();
    expect(appConversationPhone('06 12 34 56 78', 'r1')).toBe('+33612345678');
    expect(appConversationPhone('+41 79 123 45 67', 'r1')).toBe('+41791234567');
    expect(appConversationPhone('', 'r1')).toBe('app:r1');
  });

  it('le message du voyageur arrive dans la conversation WhatsApp, la réponse repart dans l’app', async () => {
    const op = await setupOperator();
    await withListing(op.token);
    const res = await booking(op.operator.id, op.parking.id);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: res.id } });
    const tok = { 'x-booking-token': manageToken(res.id, process.env.SECRET_KEY!, row.manageTokenVersion) };
    // He first wrote on WhatsApp: the app message joins the same conversation.
    await postWebhook(incoming('wamid.in.20', '33612345678', 'Bonjour'));

    expect((await api().post(`/api/public/bookings/${res.reference}/messages`).send({ text: 'x' })).status).toBe(404);
    const write = await api().post(`/api/public/bookings/${res.reference}/messages`).set(tok).send({ text: ' On arrive à 8h, c’est bon ? ' });
    expect(write.status).toBe(201);
    expect(write.body).toMatchObject({ from: 'me', text: 'On arrive à 8h, c’est bon ?' });
    expect((await api().post(`/api/public/bookings/${res.reference}/messages`).set(tok).send({ text: '  ' })).status).toBe(400);

    const list = await api().get('/api/internal/whatsapp/inbox?view=unread').set(auth(op.token));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ unread: 2, replyBy: 'app' });
    const conv = list.body.data[0].id;
    const open = await api().get(`/api/internal/whatsapp/inbox/${conv}`).set(auth(op.token));
    expect(open.body.messages.map((m: any) => m.channel)).toEqual(['whatsapp', 'app']);

    const calls = fetchMock.mock.calls.length;
    const reply = await api().post(`/api/internal/whatsapp/inbox/${conv}/reply`).set(auth(op.token)).send({ text: 'Oui, à demain.' });
    expect(reply.status).toBe(201);
    expect(reply.body.channel).toBe('app');
    // Nothing went to Meta.
    expect(fetchMock.mock.calls.slice(calls).some(([u]) => GRAPH.test(String(u)))).toBe(false);

    const thread = await api().get(`/api/public/bookings/${res.reference}/messages`).set(tok);
    expect(thread.body.canWrite).toBe(true);
    // The whole conversation: his WhatsApp « Bonjour », the app message, the reply, and what Plazo sent the booking.
    await prisma.whatsappMessage.create({
      data: { operatorId: op.operator.id, reservationId: res.id, kind: 'booking_reminder', to: '+33612345678', status: 'read', body: 'À demain 8h.' },
    });
    const all = await api().get(`/api/public/bookings/${res.reference}/messages`).set(tok);
    expect(all.body.messages.map((m: any) => [m.from, m.channel, m.text])).toEqual([
      ['me', 'whatsapp', 'Bonjour'],
      ['me', 'app', 'On arrive à 8h, c’est bon ?'],
      ['parking', 'app', 'Oui, à demain.'],
      ['plazo', 'whatsapp', 'À demain 8h.'],
    ]);
    expect(all.body.messages[2].by).toBe('Gérant');
    expect(all.body.messages[3].kind).toBe('booking_reminder');
  });

  it('sans numéro utilisable, une conversation par réservation', async () => {
    const op = await setupOperator();
    await withListing(op.token);
    const res = await booking(op.operator.id, op.parking.id, '');
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: res.id } });
    const tok = { 'x-booking-token': manageToken(res.id, process.env.SECRET_KEY!, row.manageTokenVersion) };
    expect((await api().post(`/api/public/bookings/${res.reference}/messages`).set(tok).send({ text: 'Bonjour' })).status).toBe(201);
    const list = await api().get('/api/internal/whatsapp/inbox').set(auth(op.token));
    expect(list.body.data[0]).toMatchObject({ phone: '', replyBy: 'app', replyUntil: null, name: 'Camille Martin' });
  });
});
