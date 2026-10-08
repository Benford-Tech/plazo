import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma from '@/database';
import { forwardingConfirmationOf, inboundSlugOf, newInboundSlug, recipientsOf, stripHtml, textOf } from '@/domain/inbound-email';
import { NotificationService } from '@/services/notification.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * M-A (06/10/2026): the operator's mailbox forwards the comparators' confirmations to their Plazo
 * address; Brevo's inbound parsing posts them; a complete Allopark email becomes a booking at once,
 * the others wait in "À vérifier".
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const email = readFileSync(join(__dirname, 'fixtures/allopark-confirmation.txt'), 'utf8');
const filled = email
  .replace('Nombre personne*\n', 'Nombre personne*\n3\n')
  .replace('Numéro de plaque du véhicule*\n', 'Numéro de plaque du véhicule*\nGK-318-PX\n')
  .replace('Numéro du vol retour\n', 'Numéro du vol retour\nTO 3627\n')
  .replace('Numéro de téléphone*\n', 'Numéro de téléphone*\n06 12 34 56 78\n')
  .replace('Nom*\n', 'Nom*\nDupont\n')
  .replace('Prénom*\n', 'Prénom*\nJean\n');

const item = (to: string, text: string, over: Record<string, unknown> = {}) => ({
  Uuid: ['u1'],
  From: { Name: 'ALLOPARK', Address: 'info@allopark.com' },
  To: [{ Name: 'Parking', Address: to }],
  Subject: 'Confirmation de votre réservation AL-884880719',
  RawTextBody: text,
  ...over,
});

let fetchMock: jest.SpyInstance;
const pushes = () => fetchMock.mock.calls.filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL);

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  process.env.ONESIGNAL_APP_ID = 'app';
  process.env.ONESIGNAL_REST_API_KEY = 'key';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
});
afterAll(() => prisma.$disconnect());

describe('lecture du webhook (domaine)', () => {
  it('trouve le destinataire sur le domaine, le texte lisible et une adresse imprévisible', () => {
    const recipients = recipientsOf({ To: [{ Address: 'Boss@Parking.fr' }], Recipients: ['lys-demo-7f3a@in.plazo.test'], Cc: [{ Address: null }] });
    // Brevo's table documents Recipients as Mailbox objects: both shapes are read.
    expect(recipientsOf({ Recipients: [{ Address: 'LYS-demo-7f3a@in.plazo.test' }, null] })).toEqual(['lys-demo-7f3a@in.plazo.test']);
    expect(recipients).toEqual(['lys-demo-7f3a@in.plazo.test', 'boss@parking.fr']);
    expect(inboundSlugOf(recipients, 'in.plazo.test')).toBe('lys-demo-7f3a');
    expect(inboundSlugOf(['boss@parking.fr'], 'in.plazo.test')).toBeNull();
    expect(textOf({ RawHtmlBody: '<p>Bonjour&nbsp;<b>Jean</b></p><br><p>AL-1</p>' })).toBe('Bonjour Jean\nAL-1');
    expect(textOf({ RawTextBody: '  texte  ', RawHtmlBody: '<p>html</p>' })).toBe('texte');
    expect(stripHtml('<style>p{}</style><div>a</div><div>b</div>')).toBe('a\nb');
    expect(newInboundSlug('Parking Démo LYS', () => '7f3a')).toBe('parking-demo-lys-7f3a');
  });

  it('G-B : lit le code de confirmation de transfert de Gmail, en anglais comme en français, et seulement de Google', () => {
    const google = 'forwarding-noreply@google.com';
    expect(
      forwardingConfirmationOf({
        from: google,
        subject: '(#482913507) Gmail Forwarding Confirmation - Receive Mail from Boss.Parking@gmail.com',
        text: 'Confirmation code: 482913507',
      }),
    ).toEqual({ provider: 'gmail', code: '482913507', requester: 'boss.parking@gmail.com' });
    expect(
      forwardingConfirmationOf({
        from: 'Forwarding-NoReply@google.com',
        subject: '(n° 123456789) Confirmation de transfert Gmail - Recevoir des messages de contact@parking.fr',
        text: '',
      }),
    ).toEqual({ provider: 'gmail', code: '123456789', requester: 'contact@parking.fr' });
    expect(forwardingConfirmationOf({ from: google, subject: 'Gmail', text: 'Code de confirmation : 555666777' })?.code).toBe('555666777');
    expect(forwardingConfirmationOf({ from: 'pirate@example.com', subject: '(#482913507) Gmail Forwarding Confirmation', text: '' })).toBeNull();
    expect(forwardingConfirmationOf({ from: google, subject: 'Autre chose', text: 'rien' })).toBeNull();
  });
});

describe('POST /public/inbound/email', () => {
  it('refuse sans le secret ; ignore un destinataire inconnu ; crée la réservation, prévient l’équipe, refuse le doublon', async () => {
    const op = await setupOperator();
    await api().put('/api/internal/notifications/devices').set(auth(op.token)).send({ subscriptionId: 'sub-manager' });
    expect((await api().post('/api/public/inbound/email').send({ items: [] })).status).toBe(401);
    expect((await api().post('/api/public/inbound/email?secret=wrong').send({ items: [] })).status).toBe(401);

    // Nothing arrives before the manager enables the address.
    const before = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    expect(before.body).toMatchObject({ available: true, address: null, toCheck: 0 });
    const enabled = await api().post('/api/internal/inbound/address').set(auth(op.token)).send({});
    expect(enabled.status).toBe(200);
    expect(enabled.body.address).toMatch(/^parking-test-\d+-[0-9a-f]{4}@in\.plazo\.test$/);
    const address = enabled.body.address as string;

    const unknown = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [item('someone@in.plazo.test', filled)] });
    expect(unknown.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 1 });

    const res = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [item(address, filled)] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      customerName: 'Jean Dupont',
      customerPhone: '06 12 34 56 78',
      plate: 'GK-318-PX',
      passengers: 3,
      returnFlight: 'TO 3627',
      priceCents: 3499,
      createdById: null,
    });
    expect(pushes()).toHaveLength(1);

    // The same email forwarded twice: no second booking.
    const again = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [item(address, filled)] });
    expect(again.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);

    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    expect(settings.body.counts).toMatchObject({ imported: 1, duplicate: 1, incomplete: 0, unrecognised: 0 });
    expect(settings.body.lastReceivedAt).not.toBeNull();
  });

  it('un mail incomplet ou inconnu attend dans « À vérifier » ; l’équipe le complète ou le classe ; le tableau de bord le signale', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const driver = await addStaff(op.token, 'driver');
    const { address } = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body as { address: string };
    const res = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({
        items: [
          item(address, email, { Subject: 'Allopark incomplet' }),
          item(address, '<html><body>Bonjour, pouvez-vous me réserver une place ?</body></html>', {
            RawTextBody: null,
            RawHtmlBody: '<html><body>Bonjour, pouvez-vous me réserver une place ?</body></html>',
            Subject: 'Question',
          }),
        ],
      });
    expect(res.body).toEqual({ received: 2, imported: 0, toCheck: 2, ignored: 0 });

    const list = await api().get('/api/internal/inbound/emails').set(auth(agent.token));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    const incomplete = list.body.data.find((e: { status: string }) => e.status === 'incomplete');
    expect(incomplete).toMatchObject({ provider: 'Allopark', subject: 'Allopark incomplet', missing: ['customerPhone', 'plate'] });
    expect(incomplete.parsed).toMatchObject({ externalReference: 'AL-884880719', customerName: 'Jean Dupont' });
    const unrecognised = list.body.data.find((e: { status: string }) => e.status === 'unrecognised');
    expect(unrecognised.textBody).toBe('Bonjour, pouvez-vous me réserver une place ?');
    // A driver reads neither the list nor the settings' address.
    expect((await api().get('/api/internal/inbound/emails').set(auth(driver.token))).status).toBe(403);

    const dashboard = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dashboard.body.alerts.find((a: { kind: string }) => a.kind === 'inbound_to_check')).toMatchObject({ severity: 'watch', detail: '2' });

    // The staff type the booking from the incomplete email and link it.
    const created = await api().post('/api/internal/reservations').set(auth(agent.token)).send({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      passengers: 2,
      customerName: 'Jean Dupont',
      customerPhone: '06 12 34 56 78',
      plate: 'GK-318-PX',
    });
    expect(created.status).toBe(201);
    expect(
      (await api().post(`/api/internal/inbound/emails/${incomplete.id}/attach`).set(auth(agent.token)).send({ reservationId: created.body.data.id }))
        .status,
    ).toBe(200);
    const dismissed = await api().post(`/api/internal/inbound/emails/${unrecognised.id}/dismiss`).set(auth(agent.token));
    expect(dismissed.body.data).toMatchObject({ status: 'dismissed', textBody: null });
    const after = await api().get('/api/internal/inbound/settings').set(auth(agent.token));
    expect(after.body.toCheck).toBe(0);
    expect(
      (await api().get('/api/internal/inbound/emails').set(auth(agent.token))).body.data.map((e: { status: string }) => e.status).sort(),
    ).toEqual(['dismissed', 'imported']);

    // The nightly purge clears old texts, then old rows.
    await prisma.inboundEmail.updateMany({ data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    const purge = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(purge.body.inboundEmails).toEqual({ textsCleared: 0, rowsDeleted: 0 });
    expect((await prisma.inboundEmail.findMany()).every(e => e.textBody === null)).toBe(true);
  });

  it('G-B : le code de Gmail est montré à l’assistant, pas dans « À vérifier » ; les derniers mails et les expéditeurs aussi', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const before = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(before.forwarding).toBeNull();
    expect(before.recent).toEqual([]);
    expect(before.senders).toEqual([{ provider: 'Allopark', address: 'info@allopark.com' }]);

    const confirmation = item(address, 'Confirmation code: 482913507\nhttps://mail-settings.google.com/mail/vf-xyz', {
      From: { Name: 'Gmail Team', Address: 'forwarding-noreply@google.com' },
      Subject: '(#482913507) Gmail Forwarding Confirmation - Receive Mail from boss@gmail.com',
    });
    const received = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [confirmation] });
    expect(received.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { status: 'forwarding' } });
    // Minimal: the code and who asked, never the confirmation link.
    expect(row.textBody).toBeNull();

    await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [item(address, filled)] });
    const after = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(after.forwarding).toEqual({ provider: 'gmail', code: '482913507', requester: 'boss@gmail.com', receivedAt: expect.any(String) });
    expect(after.toCheck).toBe(0);
    expect(after.recent.map((r: { status: string }) => r.status)).toEqual(['imported', 'forwarding']);
    expect(after.recent[0]).toMatchObject({ fromAddress: 'info@allopark.com', reservationReference: expect.any(String) });
    expect(after.recent[0].textBody).toBeUndefined();
    const list = (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.data as { status: string }[];
    expect(list.map(e => e.status)).toEqual(['imported']);

    // After a week the code is no longer shown.
    await prisma.inboundEmail.update({ where: { id: row.id }, data: { receivedAt: new Date(Date.now() - 8 * 86400000) } });
    expect((await api().get('/api/internal/inbound/settings').set(auth(op.token))).body.forwarding).toBeNull();
  });

  it('relais Cloudflare (08/10/2026) : secret en en-tête, adresse Plazo seulement dans l’enveloppe', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const relay = (secret: string, items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', secret).send({ items });
    expect((await relay('wrong', [])).status).toBe(401);
    // What email-worker/ posts for a forwarded Allopark email: still addressed to the parking, the Plazo address in Recipients.
    const forwarded = {
      MessageId: '<abc123@allopark.com>',
      From: { Name: 'ALLOPARK', Address: 'info@allopark.com' },
      To: [{ Name: 'Parking Air Lyon', Address: 'contact@parkair.fr' }],
      Cc: [],
      Recipients: [address],
      Subject: 'Confirmation de votre réservation AL-884880719',
      SentAtDate: '2026-10-07T12:32:00.000Z',
      RawTextBody: filled,
      RawHtmlBody: null,
    };
    const res = await relay('inbound-test-secret', [forwarded]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, externalReference: 'AL-884880719' } })).toBe(1);
  });

  it('une nouvelle adresse remplace l’ancienne ; un gérant seulement', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    expect((await api().post('/api/internal/inbound/address').set(auth(agent.token)).send({})).status).toBe(403);
    const first = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    expect((await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address).toBe(first);
    const second = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({ regenerate: true })).body.address as string;
    expect(second).not.toBe(first);
    const old = await api()
      .post('/api/public/inbound/email?secret=inbound-test-secret')
      .send({ items: [item(first, filled)] });
    expect(old.body.ignored).toBe(1);
  });
});
