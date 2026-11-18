import { Container } from 'typedi';
import prisma from '@/database';
import { DEMO_MESSAGE_EVERY_MIN, DEMO_THREADS } from '@/domain/demo-messages';
import { DemoMessagesService } from '@/services/demo-messages.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 18/11/2026 (« Simule les messages reçus sur les env de démo »). Everything fictional, nothing leaves Plazo.

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const messages = Container.get(DemoMessagesService);

let fetchMock: jest.SpyInstance;

beforeEach(async () => {
  await resetDatabase();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
});
afterEach(() => fetchMock.mockRestore());
afterAll(() => prisma.$disconnect());

async function enter(role: string) {
  const res = await api().post('/api/internal/auth/demo').send({ role });
  expect(res.status).toBe(200);
  return res.body.tokenData.access.token as string;
}

describe('les messages de la démo des prospects', () => {
  it('arrivent avec la démo, liés à ses réservations, et un nouveau par créneau', async () => {
    const token = await enter('agent');
    const op = await prisma.operator.findFirstOrThrow({ where: { prospectDemo: true }, select: { id: true } });
    const conversations = await prisma.whatsappConversation.findMany({ where: { operatorId: op.id } });
    expect(conversations).toHaveLength(DEMO_THREADS.length);
    expect(conversations.every(c => c.reservationId)).toBe(true);

    const inbox = await api().get('/api/internal/whatsapp/inbox?view=all').set(auth(token));
    expect(inbox.status).toBe(200);
    const before = await prisma.whatsappInboxMessage.count();
    // The read above added the message of this slot; a second read of the same slot adds nothing.
    await api().get('/api/internal/nav/counts').set(auth(token));
    expect(await prisma.whatsappInboxMessage.count()).toBe(before);

    const later = new Date(Date.now() + DEMO_MESSAGE_EVERY_MIN * 60000);
    expect(await messages.tick(op.id, later)).toBe(true);
    expect(await messages.tick(op.id, later)).toBe(false);
    expect(await prisma.whatsappInboxMessage.count()).toBe(before + 1);
  });

  it('gardent la réponse de l’équipe sans rien envoyer', async () => {
    const token = await enter('agent');
    const op = await prisma.operator.findFirstOrThrow({ where: { prospectDemo: true }, select: { id: true } });
    const open = await prisma.whatsappConversation.findFirstOrThrow({
      where: { operatorId: op.id, unread: { gt: 0 }, NOT: { phone: { startsWith: 'app:' } } },
    });
    fetchMock.mockClear();
    const res = await api().post(`/api/internal/whatsapp/inbox/${open.id}/reply`).set(auth(token)).send({ text: 'Bonjour, on s’en occupe.' });
    expect(res.status).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await prisma.whatsappConversation.findUniqueOrThrow({ where: { id: open.id } })).unread).toBe(0);
  });

  it('ne touchent jamais un vrai parking', async () => {
    const real = await setupOperator('Parking Fictif');
    expect(await messages.tick(real.operator.id)).toBe(false);
    expect(await prisma.whatsappConversation.count({ where: { operatorId: real.operator.id } })).toBe(0);
  });
});
