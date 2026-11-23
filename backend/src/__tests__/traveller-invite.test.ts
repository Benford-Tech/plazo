import { Container } from 'typedi';
import prisma from '@/database';
import { inviteHour, isStop, phoneHash, stayLabel } from '@/domain/traveller-invite';
import { NotificationService } from '@/services/notification.service';
import { TravellerInviteService } from '@/services/traveller-invite.service';
import { WhatsappService } from '@/services/whatsapp.service';
import { resetDatabase, setupOperator } from './utils/helpers';

// 23/11/2026 (« envoyer des messages WhatsApp pour inviter à utiliser Plazo lorsqu'on ne connaît pas le mail »). Meta is mocked.

const notifications = Container.get(NotificationService);
const whatsapp = Container.get(WhatsappService);
const service = Container.get(TravellerInviteService);
const defaultSettings = { ...notifications.settings };
const defaultConfig = whatsapp.config;
const NOW = new Date('2026-11-23T10:00:00Z');
const defaultTemplate = service.template;
const configured = () => ({ ...defaultConfig(), token: 'token', phoneNumberId: '111' });

let fetchMock: jest.SpyInstance;
const sent = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u).includes('graph.facebook.com') && String(u).endsWith('/messages'))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>);

type Op = Awaited<ReturnType<typeof setupOperator>>;
let n = 0;
async function booking(op: Op, data: Record<string, unknown> = {}) {
  n++;
  return prisma.reservation.create({
    data: {
      reference: `RINV${n}${Math.floor(Math.random() * 900 + 100)}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel: 'aggregator',
      channelDetail: 'Onepark',
      status: 'upcoming',
      arrivalAt: new Date('2026-11-28T05:30:00Z'),
      returnAt: new Date('2026-12-03T20:40:00Z'),
      passengers: 1,
      customerName: 'Camille Martin',
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: null,
      plate: '',
      plateKey: '',
      ...data,
    },
  });
}

async function withListing(op: Op) {
  const airport = await prisma.airport.findFirstOrThrow();
  await prisma.listing.upsert({
    where: { parkingId: op.parking.id },
    create: { parkingId: op.parking.id, airportId: airport.id, slug: `p-${op.parking.id}`, title: 'Parking des Cèdres' },
    update: { title: 'Parking des Cèdres' },
  });
}

beforeEach(async () => {
  await resetDatabase();
  Object.assign(notifications.settings, defaultSettings, { publicSiteUrl: 'https://site.example' });
  whatsapp.config = configured;
  service.template = () => 'plazo_invitation';
  fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async () => new Response(JSON.stringify({ messages: [{ id: `wamid.${Math.random()}` }] }), { status: 200 }));
});

afterEach(() => {
  fetchMock.mockRestore();
  whatsapp.config = defaultConfig;
  service.template = defaultTemplate;
  Object.assign(notifications.settings, defaultSettings);
});

describe('the wording', () => {
  it('names the stay in words', () => {
    expect(stayLabel(new Date('2026-11-20T05:30:00Z'), new Date('2026-11-27T20:40:00Z'), 'Europe/Paris')).toBe('du 20 au 27 novembre');
    expect(stayLabel(new Date('2026-11-28T05:30:00Z'), new Date('2026-12-01T20:40:00Z'), 'Europe/Paris')).toBe('du 28 novembre au 1er décembre');
    expect(stayLabel(new Date('2026-11-20T05:30:00Z'), new Date('2026-11-20T20:40:00Z'), 'Europe/Paris')).toBe('pour le 20 novembre');
  });

  it('reads a STOP, and keeps the night quiet', () => {
    expect(isStop(' Stop.')).toBe(true);
    expect(isStop('STOP pub')).toBe(true);
    expect(isStop('Je ne peux pas stopper la voiture')).toBe(false);
    expect(isStop(null)).toBe(false);
    expect(inviteHour(new Date('2026-11-23T10:00:00Z'), 'Europe/Paris')).toBe(true);
    expect(inviteHour(new Date('2026-11-23T22:30:00Z'), 'Europe/Paris')).toBe(false);
    expect(inviteHour(new Date('2026-11-23T05:30:00Z'), 'Europe/Paris')).toBe(false);
  });
});

describe('the pass', () => {
  it('invites a traveller without email once, with the stay and the short link', async () => {
    const op = await setupOperator();
    await withListing(op);
    const first = await booking(op);
    const second = await booking(op);
    expect(await service.run(NOW)).toEqual({ sent: 1, skipped: 1, failed: 0 });
    const [message] = sent();
    expect(sent()).toHaveLength(1);
    expect(message.to).toBe('33612345678');
    expect(message.template.name).toBe('plazo_invitation');
    const [header, body, button] = message.template.components;
    expect(header.parameters[0].image.link).toBe('https://site.example/whatsapp/plazo-invitation.jpg');
    expect(body.parameters.map((p: { text: string }) => p.text)).toEqual(['Camille', 'Parking des Cèdres', 'du 28 novembre au 3 décembre']);
    expect(button).toMatchObject({ type: 'button', sub_type: 'url', index: '0' });
    expect(button.parameters[0].text).toMatch(new RegExp(`^${first.reference}-`));
    const rows = await prisma.reservation.findMany({ where: { id: { in: [first.id, second.id] } }, orderBy: { createdAt: 'asc' } });
    expect(rows.map(r => r.appInviteOutcome).sort()).toEqual(['repeat', 'sent']);
    const log = await prisma.whatsappMessage.findFirstOrThrow({ where: { reservationId: first.id } });
    expect(log.kind).toBe('app_invite');
    expect(log.body).toContain('votre navette suivie en direct');
    // A second pass sends nothing more.
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 0 });
  });

  it('leaves the travellers it must not write to', async () => {
    const op = await setupOperator();
    await withListing(op);
    const withEmail = await booking(op, { customerEmail: 'camille@example.org' });
    const landline = await booking(op, { customerPhone: '04 72 00 00 00' });
    const stopped = await booking(op, { customerPhone: '07 11 22 33 44' });
    await booking(op, { channel: 'plazo' });
    await booking(op, { arrivalAt: new Date(NOW.getTime() - 3600_000) });
    await service.optOut('+33711223344');
    expect(await prisma.travellerPhoneOptout.findUnique({ where: { phoneHash: phoneHash('+33711223344') } })).not.toBeNull();
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 3, failed: 0 });
    expect(sent()).toHaveLength(0);
    const outcome = async (id: string) => (await prisma.reservation.findUniqueOrThrow({ where: { id } })).appInviteOutcome;
    expect(await outcome(withEmail.id)).toBe('has_email');
    expect(await outcome(landline.id)).toBe('no_phone');
    expect(await outcome(stopped.id)).toBe('opted_out');
  });

  it('waits for the morning, and for the template', async () => {
    const op = await setupOperator();
    await withListing(op);
    const b = await booking(op);
    expect(await service.run(new Date('2026-11-23T22:30:00Z'))).toEqual({ sent: 0, skipped: 0, failed: 0 });
    service.template = () => '';
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 0 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: b.id } })).appInviteAt).toBeNull();
    service.template = () => 'plazo_invitation';
    expect(await service.run(new Date('2026-11-24T07:15:00Z'))).toEqual({ sent: 1, skipped: 0, failed: 0 });
  });

  it('marks a message Meta refuses, without trying again', async () => {
    const op = await setupOperator();
    await withListing(op);
    await booking(op);
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ error: { code: 131026 } }), { status: 400 }));
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 1 });
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 0 });
  });
});
