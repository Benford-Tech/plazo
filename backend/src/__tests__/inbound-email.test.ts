import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma, { Prisma } from '@/database';
import { allocateInboundSlug } from '@/services/inbound-slug';
import { parseConfirmationEmail } from '@/domain/importers';
import { forwardingConfirmationOf, inboundSlugOf, newInboundSlug, recipientsOf, stripHtml, textOf } from '@/domain/inbound-email';
import { parseRawEmail } from '@/domain/inbound-mime';
import type { EmailReading } from '@/domain/email-reading';
import { EmailReadingService, type EmailReadingResult } from '@/services/email-reading.service';
import { InboundEmailService } from '@/services/inbound-email.service';
import { NotificationService } from '@/services/notification.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { logger } from '@/utils/logger';
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
    ).toEqual({ provider: 'gmail', code: '482913507', link: null, requester: 'boss.parking@gmail.com' });
    expect(
      forwardingConfirmationOf({
        from: 'Forwarding-NoReply@google.com',
        subject: '(n° 123456789) Confirmation de transfert Gmail - Recevoir des messages de contact@parking.fr',
        text: '',
      }),
    ).toEqual({ provider: 'gmail', code: '123456789', link: null, requester: 'contact@parking.fr' });
    expect(forwardingConfirmationOf({ from: google, subject: 'Gmail', text: 'Code de confirmation : 555666777' })?.code).toBe('555666777');
    expect(forwardingConfirmationOf({ from: 'pirate@example.com', subject: '(#482913507) Gmail Forwarding Confirmation', text: '' })).toBeNull();
    expect(forwardingConfirmationOf({ from: google, subject: 'Autre chose', text: 'rien' })).toBeNull();
    // 08/10/2026: Gmail's subject no longer carries the code; the body says it, and the acceptance link counts too.
    const link = 'https://mail-settings.google.com/mail/vf-%5BANGjdJ8abc%5D-xyz_123';
    expect(
      forwardingConfirmationOf({
        from: google,
        subject: '(Gmail) Confirmation de transfert – Recevez les messages de joanny@gmail.com',
        text: `joanny@gmail.com a demandé le transfert de ses messages.\nCode de confirmation : 740215896\nCliquez sur le lien ci-dessous :\n${link}\nPour annuler : https://mail-settings.google.com/mail/uf-abc`,
      }),
    ).toEqual({ provider: 'gmail', code: '740215896', link, requester: 'joanny@gmail.com' });
    // Only a 9-digit number in the body, no "code" word: still the code; a link alone is enough too.
    expect(forwardingConfirmationOf({ from: google, subject: '(Gmail) Confirmation de transfert', text: 'Votre numéro : 740215896.' })?.code).toBe(
      '740215896',
    );
    expect(forwardingConfirmationOf({ from: google, subject: '(Gmail) Confirmation de transfert', text: `Lien : ${link}` })).toEqual({
      provider: 'gmail',
      code: null,
      link,
      requester: null,
    });
    // Two 9-digit numbers and no "code" word: no guess.
    expect(forwardingConfirmationOf({ from: google, subject: 'Gmail', text: '123456789 987654321' })).toBeNull();
  });
});

describe('adresse de réception dès le départ (08/10/2026)', () => {
  it('la migration inbound_slug_for_all donne une adresse unique aux loueurs créés avant, et ne touche pas les autres', async () => {
    const a = await setupOperator();
    const b = await setupOperator();
    const c = await setupOperator();
    const before = await prisma.operator.findUniqueOrThrow({ where: { id: a.operator.id }, select: { inboundSlug: true, slug: true } });
    expect(before.inboundSlug).toMatch(/^parking-test-\d+-[0-9a-f]{8}$/);
    const untouched = (await prisma.operator.findUniqueOrThrow({ where: { id: b.operator.id }, select: { inboundSlug: true } })).inboundSlug;
    // a: a usual slug; c: a long slug whose 24-character cut ends on a hyphen, which the SQL trims like newInboundSlug().
    await prisma.operator.update({ where: { id: a.operator.id }, data: { inboundSlug: null } });
    await prisma.operator.update({ where: { id: c.operator.id }, data: { inboundSlug: null, slug: 'abcdefghijklmnopqrstuvw-xyz-long' } });
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261008120000_inbound_slug_for_all/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    const slugOf = async (id: string) => (await prisma.operator.findUniqueOrThrow({ where: { id }, select: { inboundSlug: true } })).inboundSlug;
    expect(await slugOf(a.operator.id)).toMatch(new RegExp(`^${before.slug}-[0-9a-f]{4}$`));
    expect(await slugOf(c.operator.id)).toMatch(/^abcdefghijklmnopqrstuvw-[0-9a-f]{4}$/);
    expect(await slugOf(b.operator.id)).toBe(untouched);
    expect(await slugOf(a.operator.id)).not.toBe(untouched);
  });
});

describe('allocateInboundSlug', () => {
  it('tire un nouveau suffixe tant que le candidat existe déjà', async () => {
    const findUnique = jest.fn().mockResolvedValueOnce({ id: 'taken' }).mockResolvedValueOnce({ id: 'taken' }).mockResolvedValueOnce(null);
    const slug = await allocateInboundSlug({ operator: { findUnique } } as unknown as Prisma.TransactionClient, 'Parking Démo LYS');
    expect(findUnique).toHaveBeenCalledTimes(3);
    expect(slug).toMatch(/^parking-demo-lys-[0-9a-f]{8}$/);
    expect(findUnique.mock.calls.map(([args]) => args.where.inboundSlug)).toContain(slug);
  });
});

describe('POST /public/inbound/email', () => {
  it('refuse sans le secret ; ignore un destinataire inconnu ; crée la réservation, prévient l’équipe, refuse le doublon', async () => {
    const op = await setupOperator();
    await api().put('/api/internal/notifications/devices').set(auth(op.token)).send({ subscriptionId: 'sub-manager' });
    // The manager wants a push per booking (the default of a manager is the hourly digest, N-A 08/10/2026).
    await api().patch('/api/internal/notifications/preferences').set(auth(op.token)).send({ bookings: 'immediate' });
    expect((await api().post('/api/public/inbound/email').send({ items: [] })).status).toBe(401);
    expect((await api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'wrong').send({ items: [] })).status).toBe(401);

    // The address exists from the operator's creation (08/10/2026): no activation step, the route just returns it.
    const before = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    expect(before.body).toMatchObject({ available: true, toCheck: 0 });
    expect(before.body.address).toMatch(/^parking-test-\d+-[0-9a-f]{8}@in\.plazo\.test$/);
    const enabled = await api().post('/api/internal/inbound/address').set(auth(op.token)).send({});
    expect(enabled.status).toBe(200);
    expect(enabled.body.address).toBe(before.body.address);
    const address = enabled.body.address as string;

    const unknown = await api()
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({ items: [item('someone@in.plazo.test', filled)] });
    expect(unknown.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 1 });

    const res = await api()
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({ items: [item(address, filled)] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      customerName: 'Jean Dupont',
      // 09/10/2026: Allopark's form gives the first and the last name apart.
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
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
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
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
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
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
    // /dismiss is the deprecated alias of /handle (T-A, 08/10/2026): the text stays readable in « Traités ».
    const dismissed = await api().post(`/api/internal/inbound/emails/${unrecognised.id}/dismiss`).set(auth(agent.token));
    expect(dismissed.body.data).toMatchObject({ status: 'handled', textBody: 'Bonjour, pouvez-vous me réserver une place ?' });
    const after = await api().get('/api/internal/inbound/settings').set(auth(agent.token));
    expect(after.body.toCheck).toBe(0);
    expect(after.body.counts).toMatchObject({ imported: 1, handled: 1, archived: 0, dismissed: 0 });
    const todo = (await api().get('/api/internal/inbound/emails').set(auth(agent.token))).body;
    expect(todo).toEqual({ data: [], counts: { todo: 0, done: 2, archived: 0 } });
    const done = (await api().get('/api/internal/inbound/emails?view=done').set(auth(agent.token))).body;
    expect(done.data.map((e: { status: string }) => e.status).sort()).toEqual(['handled', 'imported']);
    expect(done.data.find((e: { status: string }) => e.status === 'imported')).toMatchObject({ reservationReference: created.body.data.reference });

    // The nightly purge clears old texts, then old rows.
    await prisma.inboundEmail.updateMany({ data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    const purge = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    // The handled email kept its text (T-A), the attached one lost it at once.
    expect(purge.body.inboundEmails).toEqual({ textsCleared: 1, rowsDeleted: 0 });
    expect((await prisma.inboundEmail.findMany()).every(e => e.textBody === null)).toBe(true);
  });

  it('G-B : le code de Gmail est montré à l’assistant, pas dans « À vérifier » ; les derniers mails et les expéditeurs aussi', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const before = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(before.forwarding).toBeNull();
    expect(before.recent).toEqual([]);
    expect(before.senders).toEqual([
      { provider: 'Allopark', address: 'info@allopark.com' },
      // 09/10/2026: the comparators whose sender address is not known yet are filtered on their name (Gmail matches it).
      { provider: 'Onepark', address: 'onepark' },
      { provider: 'Parclick', address: 'parclick' },
      { provider: 'ParkMundo', address: 'parkmundo' },
    ]);

    const confirmation = item(address, 'Confirmation code: 482913507\nhttps://mail-settings.google.com/mail/vf-xyz', {
      From: { Name: 'Gmail Team', Address: 'forwarding-noreply@google.com' },
      Subject: '(#482913507) Gmail Forwarding Confirmation - Receive Mail from boss@gmail.com',
    });
    const received = await api()
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({ items: [confirmation] });
    expect(received.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { status: 'forwarding' } });
    // Minimal: the code and who asked, never the confirmation link.
    expect(row.textBody).toBeNull();

    await api()
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({ items: [item(address, filled)] });
    const after = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(after.forwarding).toEqual({
      provider: 'gmail',
      code: '482913507',
      link: 'https://mail-settings.google.com/mail/vf-xyz',
      requester: 'boss@gmail.com',
      receivedAt: expect.any(String),
    });
    expect(after.toCheck).toBe(0);
    expect(after.recent.map((r: { status: string }) => r.status)).toEqual(['imported', 'forwarding']);
    expect(after.recent[0]).toMatchObject({ fromAddress: 'info@allopark.com', reservationReference: expect.any(String) });
    expect(after.recent[0].textBody).toBeUndefined();
    const list = (await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token))).body.data as { status: string }[];
    expect(list.map(e => e.status)).toEqual(['imported']);
    expect((await api().get('/api/internal/inbound/emails?view=done&status=forwarding').set(auth(op.token))).body.data).toEqual([]);
    expect((await api().get('/api/internal/inbound/emails?status=forwarding').set(auth(op.token))).body.counts).toEqual({
      todo: 0,
      done: 1,
      archived: 0,
    });
    // A forwarding confirmation is unknown to the inbox: neither handled nor archived.
    expect((await api().post(`/api/internal/inbound/emails/${row.id}/handle`).set(auth(op.token))).status).toBe(404);
    const archive = await api().post(`/api/internal/inbound/emails/${row.id}/archive`).set(auth(op.token));
    expect(archive.status).toBe(409);
    expect(archive.body.code).toBe('forwarding');

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

  it('relais Cloudflare (08/10/2026, soir) : le mail brut (message/rfc822) est décodé ici, même coupé par le relais', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const b64 = (value: string | Buffer) =>
      Buffer.from(value)
        .toString('base64')
        .replace(/(.{76})/g, '$1\r\n');
    const raw = (from: string, subject: string, text: string, attachment: Buffer) =>
      [
        `From: ${from}`,
        'To: Parking Air Lyon <contact@parkair.fr>',
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'Date: Tue, 07 Oct 2026 14:32:00 +0200',
        `Message-ID: <${subject.length}@example.com>`,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="m1"',
        '',
        '--m1',
        'Content-Type: multipart/alternative; boundary="a1"',
        '',
        '--a1',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64(text),
        '--a1',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64(`<html><body>${text.replace(/\n/g, '<br>')}</body></html>`),
        '--a1--',
        '--m1',
        'Content-Type: image/png; name="plan.png"',
        'Content-Disposition: attachment; filename="plan.png"',
        'Content-Transfer-Encoding: base64',
        '',
        b64(attachment),
        '--m1--',
        '',
      ].join('\r\n');
    const relay = (body: string | Buffer, headers: Record<string, string> = {}) =>
      api()
        .post('/api/public/inbound/email')
        .set({
          'Content-Type': 'message/rfc822',
          'X-Inbound-Secret': 'inbound-test-secret',
          'X-Envelope-From': 'bounce@gmail.com',
          'X-Envelope-To': address,
          ...headers,
        })
        .send(body);
    // Without the secret: refused before anything is read.
    expect((await api().post('/api/public/inbound/email').set('Content-Type', 'message/rfc822').send('From: a@b.c\r\n\r\nx')).status).toBe(401);
    // A real confirmation with a 300 KB attachment: decoded here, the booking created.
    const whole = raw('ALLOPARK <info@allopark.com>', 'Confirmation de votre réservation AL-884880719', filled, randomBytes(300 * 1024));
    const res = await relay(whole);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    const stored = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(stored).toMatchObject({
      fromAddress: 'info@allopark.com',
      fromName: 'ALLOPARK',
      subject: 'Confirmation de votre réservation AL-884880719',
      status: 'imported',
    });
    expect(stored.textBody).toContain('GK-318-PX');
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, externalReference: 'AL-884880719' } })).toBe(1);
    // The relay cut a bigger message at 4 MB, inside the attachment: the text parts, which come first, are still read.
    const cut = raw(
      'Marie Dupont <marie@example.com>',
      'Question sur ma réservation',
      'Bonjour, est-ce que la navette passe à 5 h ?',
      randomBytes(300 * 1024),
    );
    const truncated = await relay(cut.slice(0, Math.floor(cut.length * 0.6)), { 'X-Inbound-Truncated': '1' });
    expect(truncated.body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    const question = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, status: 'unrecognised' } });
    expect(question).toMatchObject({ fromAddress: 'marie@example.com', subject: 'Question sur ma réservation' });
    expect(question.textBody).toContain('navette passe à 5 h');
    // Bytes that are no message at all: the envelope is kept, so the parking still sees that something arrived.
    const garbage = await relay(Buffer.from([0xff, 0xfe, 0x00, 0x01]), { 'X-Envelope-From': 'someone@example.com' });
    expect(garbage.body.received).toBe(1);
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, fromAddress: 'someone@example.com' } })).toBe(1);
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
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({ items: [item(first, filled)] });
    expect(old.body.ignored).toBe(1);
  });
});

describe('la boîte de réception (M-A + T-A, 08/10/2026)', () => {
  const statuses = (body: { data: { status: string }[] }) => body.data.map(e => e.status);

  async function inbox(subjects: Record<string, string>) {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const unknown = (subject: string) => item(address, `Bonjour, ${subject}`, { RawTextBody: `Bonjour, ${subject}`, Subject: subject });
    await api()
      .post('/api/public/inbound/email')
      .set('X-Inbound-Secret', 'inbound-test-secret')
      .send({
        items: [item(address, filled), item(address, filled), item(address, email, { Subject: subjects.incomplete }), unknown(subjects.unknown)],
      });
    const rows = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id } });
    const of = (status: string) => rows.find(r => r.status === status)!;
    return { op, imported: of('imported'), duplicate: of('duplicate'), incomplete: of('incomplete'), unrecognised: of('unrecognised') };
  }

  it('trois onglets avec leurs comptages, du plus récent au plus ancien, 30 jours pour les traités et 90 pour les archivés', async () => {
    const { op, imported, duplicate, incomplete, unrecognised } = await inbox({ incomplete: 'Allopark incomplet', unknown: 'Question' });
    const agent = await addStaff(op.token, 'agent');
    // Older rows: an incomplete one of 40 days (still to do), an imported one of 40 days (out of « Traités »), an old dismissed one (moved to handled by the migration).
    const old = (status: 'incomplete' | 'imported' | 'dismissed' | 'archived', days: number, subject: string) =>
      prisma.inboundEmail.create({ data: { operatorId: op.operator.id, status, subject, receivedAt: new Date(Date.now() - days * 86400000) } });
    await old('incomplete', 40, 'vieux incomplet');
    await old('imported', 40, 'vieil import');
    await old('dismissed', 10, 'classé avant');
    await old('archived', 100, 'archive trop vieille');
    await old('archived', 80, 'archive récente');
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261008150100_inbound_statuses_data/migration.sql'), 'utf8');
    // The data migration's first statement (the staff part needs the old column, covered by booking-digest.test.ts).
    await prisma.$executeRawUnsafe(sql.split('\n\n')[0]);
    expect(await prisma.inboundEmail.count({ where: { status: 'dismissed' } })).toBe(0);

    const todo = (await api().get('/api/internal/inbound/emails').set(auth(agent.token))).body;
    expect(todo.counts).toEqual({ todo: 3, done: 3, archived: 1 });
    expect(todo.data.map((e: { subject: string }) => e.subject)).toEqual(['Question', 'Allopark incomplet', 'vieux incomplet']);
    expect(statuses(todo)).toEqual(['unrecognised', 'incomplete', 'incomplete']);
    expect(todo.data[0]).toMatchObject({ id: unrecognised.id, textBody: 'Bonjour, Question', missing: [], parsed: null });
    expect(todo.data[1]).toMatchObject({ id: incomplete.id, provider: 'Allopark', missing: ['customerPhone', 'plate'] });

    const done = (await api().get('/api/internal/inbound/emails?view=done').set(auth(agent.token))).body;
    expect(done.counts).toEqual(todo.counts);
    expect(done.data.map((e: { subject: string }) => e.subject)).toEqual([
      'Confirmation de votre réservation AL-884880719',
      'Confirmation de votre réservation AL-884880719',
      'classé avant',
    ]);
    expect(statuses(done)).toEqual(['duplicate', 'imported', 'handled']);
    expect(done.data.map((e: { id: string }) => e.id).slice(0, 2)).toEqual([duplicate.id, imported.id]);
    expect(done.data[1].reservationReference).toEqual(expect.any(String));
    expect(statuses((await api().get('/api/internal/inbound/emails?view=done&status=imported').set(auth(agent.token))).body)).toEqual(['imported']);
    // The old filter alone finds its tab: ?status=incomplete lists the two to-do ones, ?status=imported the imported one in « Traités ».
    expect(statuses((await api().get('/api/internal/inbound/emails?status=incomplete').set(auth(agent.token))).body)).toEqual([
      'incomplete',
      'incomplete',
    ]);
    // A bare status filter looks in the tab that holds it (review, 08/10/2026).
    expect(statuses((await api().get('/api/internal/inbound/emails?status=imported').set(auth(agent.token))).body)).toEqual(['imported']);

    const archived = (await api().get('/api/internal/inbound/emails?view=archived').set(auth(agent.token))).body;
    expect(archived.data.map((e: { subject: string }) => e.subject)).toEqual(['archive récente']);
    expect((await api().get('/api/internal/inbound/emails?view=nimporte').set(auth(agent.token))).body.counts).toEqual(todo.counts);
    // Another operator sees nothing of it.
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/inbound/emails').set(auth(other.token))).body).toEqual({
      data: [],
      counts: { todo: 0, done: 0, archived: 0 },
    });
  });

  it('T-A : « Marquer comme traité » et « Archiver », leurs refus, et la sélection qui avance', async () => {
    const { op, imported, duplicate, incomplete, unrecognised } = await inbox({ incomplete: 'Allopark incomplet', unknown: 'Question' });
    const agent = await addStaff(op.token, 'agent');
    const driver = await addStaff(op.token, 'driver');
    const post = (id: string, action: string, token = agent.token) => api().post(`/api/internal/inbound/emails/${id}/${action}`).set(auth(token));

    // Handled: incomplete and unrecognised leave « À traiter », the text stays; a duplicate too; imported stays imported.
    const handled = await post(incomplete.id, 'handle');
    expect(handled.status).toBe(200);
    expect(handled.body.data).toMatchObject({ id: incomplete.id, status: 'handled', provider: 'Allopark', missing: ['customerPhone', 'plate'] });
    expect(handled.body.data.textBody).toContain('ALLOPARK');
    expect((await post(duplicate.id, 'handle')).body.data).toMatchObject({ status: 'handled', reservationReference: expect.any(String) });
    expect((await post(imported.id, 'handle')).body.data).toMatchObject({ status: 'imported' });
    expect((await post(incomplete.id, 'handle')).body.data.status).toBe('handled'); // again: no change
    let list = (await api().get('/api/internal/inbound/emails').set(auth(agent.token))).body;
    expect(list.counts).toEqual({ todo: 1, done: 3, archived: 0 });
    expect(statuses(list)).toEqual(['unrecognised']);

    // Archived: from any status; readable in « Archivés » with its text; handled refuses once archived.
    const archived = await post(unrecognised.id, 'archive');
    expect(archived.status).toBe(200);
    expect(archived.body.data).toMatchObject({ id: unrecognised.id, status: 'archived', textBody: 'Bonjour, Question' });
    expect((await post(imported.id, 'archive')).body.data.status).toBe('archived');
    expect((await post(unrecognised.id, 'archive')).body.data.status).toBe('archived'); // again: no change
    const refused = await post(unrecognised.id, 'handle');
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('archived');
    expect((await post(unrecognised.id, 'dismiss')).status).toBe(409);
    list = (await api().get('/api/internal/inbound/emails?view=archived').set(auth(agent.token))).body;
    expect(list.counts).toEqual({ todo: 0, done: 2, archived: 2 });
    expect(list.data.map((e: { id: string }) => e.id).sort()).toEqual([imported.id, unrecognised.id].sort());
    expect((await api().get('/api/internal/inbound/settings').set(auth(agent.token))).body.counts).toMatchObject({
      handled: 2,
      archived: 2,
      imported: 0,
    });
    expect(
      (await api().get('/api/internal/dashboard').set(auth(op.token))).body.alerts.find((a: { kind: string }) => a.kind === 'inbound_to_check'),
    ).toBeUndefined();

    // Unknown id, another operator's email, a driver: refused.
    expect((await post('nope', 'handle')).status).toBe(404);
    const other = await setupOperator('Autre');
    expect((await post(duplicate.id, 'archive', other.token)).status).toBe(404);
    expect((await post(duplicate.id, 'archive', driver.token)).status).toBe(403);
    expect(
      (await prisma.auditLog.findMany({ where: { action: { in: ['inbound.handled', 'inbound.archived'] } } })).map(a => a.action).sort(),
    ).toEqual(['inbound.archived', 'inbound.archived', 'inbound.handled', 'inbound.handled']);

    // The purge still clears the texts after 30 days, archived included, and the rows after 90.
    await prisma.inboundEmail.updateMany({ data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    await Container.get(InboundEmailService).purge();
    expect((await prisma.inboundEmail.findMany()).every(e => e.textBody === null)).toBe(true);
    expect((await api().get('/api/internal/inbound/emails?view=archived').set(auth(agent.token))).body.data).toHaveLength(2);
    await prisma.inboundEmail.updateMany({ data: { receivedAt: new Date(Date.now() - 91 * 86400000) } });
    expect((await Container.get(InboundEmailService).purge()).rowsDeleted).toBe(4);
  });

  it('10/10/2026 : le super admin traite, archive et rattache les mails d’un parking depuis « Ouvrir son espace », tracés à son nom', async () => {
    const { op, imported, duplicate, incomplete, unrecognised } = await inbox({ incomplete: 'Allopark incomplet', unknown: 'Question' });
    const admin = await setupOperator('Plazo (plateforme)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    try {
      const view = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
      expect(view.status).toBe(201);
      const token = view.body.access.token as string;
      const post = (id: string, action: string, body: Record<string, unknown> = {}) =>
        api().post(`/api/internal/inbound/emails/${id}/${action}`).set(auth(token)).send(body);

      const archived = await post(unrecognised.id, 'archive');
      expect([archived.status, archived.body.data.status]).toEqual([200, 'archived']);
      const handled = await post(incomplete.id, 'handle');
      expect([handled.status, handled.body.data.status]).toEqual([200, 'handled']);
      const dismissed = await post(duplicate.id, 'dismiss');
      expect([dismissed.status, dismissed.body.data.status]).toEqual([200, 'handled']);
      // « Compléter »: the email is linked to the booking typed from it.
      expect((await post(incomplete.id, 'attach', { reservationId: imported.reservationId })).status).toBe(200);
      expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: incomplete.id } })).toMatchObject({
        status: 'imported',
        reservationId: imported.reservationId,
        textBody: null,
      });
      // A new address too (the old one stops working).
      const slugOf = async () => (await prisma.operator.findUniqueOrThrow({ where: { id: op.operator.id } })).inboundSlug;
      const before = await slugOf();
      const address = await api().post('/api/internal/inbound/address').set(auth(token)).send({ regenerate: true });
      expect(address.status).toBe(200);
      expect(await slugOf()).not.toBe(before);

      // Traced under the admin's real name, in the operator's journal.
      const entries = await prisma.auditLog.findMany({ where: { operatorId: op.operator.id, staffId: admin.manager.id } });
      expect(entries.filter(e => e.action === 'inbound.archived').map(e => e.entityId)).toEqual([unrecognised.id]);
      expect(
        entries
          .filter(e => e.action === 'inbound.handled')
          .map(e => e.entityId)
          .sort(),
      ).toEqual([duplicate.id, incomplete.id].sort());
      expect(entries.find(e => e.action === 'inbound.address_regenerated')?.details).toMatchObject({ viewAs: true });
      expect(entries.filter(e => e.action === 'view_as.write').map(e => (e.details as { path: string }).path)).toEqual(
        expect.arrayContaining([
          `/api/internal/inbound/emails/${unrecognised.id}/archive`,
          `/api/internal/inbound/emails/${incomplete.id}/handle`,
          `/api/internal/inbound/emails/${duplicate.id}/dismiss`,
          `/api/internal/inbound/emails/${incomplete.id}/attach`,
          '/api/internal/inbound/address',
        ]),
      );
      // The operator finds them in « Archivés » and « Traités ».
      const archivedList = (await api().get('/api/internal/inbound/emails?view=archived').set(auth(op.token))).body;
      expect(archivedList.data.map((e: { id: string }) => e.id)).toEqual([unrecognised.id]);
      const done = (await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token))).body;
      expect(done.counts).toMatchObject({ todo: 0, done: 3, archived: 1 });
    } finally {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    }
  });
});

describe('lecture par Claude des mails inconnus (L-A, 08/10/2026)', () => {
  const reader = Container.get(EmailReadingService);
  let read: jest.SpyInstance;
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const parkos = (to: string, text = 'Bonjour, nouvelle réservation sur Parkos pour Marie Dupont…') =>
    item(to, text, { From: { Name: 'Parkos', Address: 'noreply@parkos.fr' }, Subject: 'Nouvelle réservation PK-123456' });
  const answer = (over: Partial<EmailReading> = {}): EmailReadingResult => ({
    reading: {
      kind: 'booking',
      provider: 'Parkos',
      externalReference: 'PK-123456',
      arrivalAt: '2026-07-12T06:30',
      returnAt: '2026-07-19T22:15',
      customerName: 'Marie Dupont',
      customerFirstName: null,
      customerLastName: null,
      customerPhone: '+33 6 12 34 56 78',
      customerEmail: 'marie@example.com',
      plate: 'ab 123 cd',
      returnFlight: 'AF1234',
      departureFlight: null,
      passengers: 2,
      priceCents: 18990,
      confidence: 0.92,
      summary: 'Réservation Parkos de Marie Dupont du 12 au 19 juillet',
      ...over,
    },
    model: 'claude-test',
    usage: { inputTokens: 800, outputTokens: 120 },
  });
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    return { ...op, address: settings.body.address as string };
  };
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read = jest.spyOn(reader, 'read');
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    read.mockRestore();
  });

  it('crée la réservation d’un mail inconnu que Claude lit avec assurance, et refuse le même mail une seconde fois', async () => {
    const { token, address, operator } = await connected();
    read.mockResolvedValue(answer());
    const res = await post([parkos(address)]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0][0]).toMatchObject({
      from: 'noreply@parkos.fr',
      fromName: 'Parkos',
      subject: 'Nouvelle réservation PK-123456',
      timezone: 'Europe/Paris',
    });
    const row = await prisma.inboundEmail.findFirstOrThrow({ include: { reservation: true } });
    expect(row.status).toBe('imported');
    expect(row.provider).toBe('Parkos');
    expect(row.reading).toEqual({
      kind: 'booking',
      provider: 'Parkos',
      confidence: 0.92,
      summary: 'Réservation Parkos de Marie Dupont du 12 au 19 juillet',
      model: 'claude-test',
    });
    expect(row.reservation).toMatchObject({
      operatorId: operator.id,
      channel: 'aggregator',
      channelDetail: 'Parkos',
      externalReference: 'PK-123456',
      customerName: 'Marie Dupont',
      // Claude did not tell them apart: the display name is split at its first space.
      customerFirstName: 'Marie',
      customerLastName: 'Dupont',
      customerPhone: '+33612345678',
      customerEmail: 'marie@example.com',
      plate: 'AB-123-CD',
      returnFlight: 'AF 1234',
      passengers: 2,
      priceCents: 18990,
    });
    // The inbox shows the reading.
    const list = await api().get('/api/internal/inbound/emails?view=done').set(auth(token));
    expect(list.body.data[0].reading).toMatchObject({ kind: 'booking', confidence: 0.92 });
    // The same mail forwarded twice: one booking, by the reference; without a reference, by the car and its arrival.
    const again = await post([parkos(address)]);
    expect(again.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    read.mockResolvedValue(answer({ externalReference: null }));
    const third = await post([parkos(address)]);
    expect(third.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    expect(await prisma.reservation.count()).toBe(1);
    expect(await prisma.inboundEmail.count({ where: { status: 'duplicate' } })).toBe(2);
  });

  it('09/10/2026 : enregistre le prénom et le nom tels que Claude les distingue', async () => {
    const { address } = await connected();
    read.mockResolvedValueOnce(
      answer({ customerName: 'Marie-Claire DE LA TOUR', customerFirstName: 'Marie-Claire', customerLastName: 'DE LA TOUR' }),
    );
    expect((await post([parkos(address)])).body.imported).toBe(1);
    expect(await prisma.reservation.findFirstOrThrow()).toMatchObject({
      customerName: 'Marie-Claire DE LA TOUR',
      customerFirstName: 'Marie-Claire',
      customerLastName: 'DE LA TOUR',
    });
  });

  it('laisse en « À traiter », pré-rempli, une lecture incomplète ou peu sûre', async () => {
    const { address } = await connected();
    read.mockResolvedValueOnce(answer({ customerPhone: null }));
    expect((await post([parkos(address)])).body.toCheck).toBe(1);
    read.mockResolvedValueOnce(answer({ confidence: 0.4 }));
    expect((await post([parkos(address)])).body.toCheck).toBe(1);
    const rows = await prisma.inboundEmail.findMany({ orderBy: { receivedAt: 'asc' } });
    expect(rows.map(r => r.status)).toEqual(['incomplete', 'incomplete']);
    expect(rows[0].missing).toEqual(['customerPhone']);
    expect(rows[0].parsed).toMatchObject({ provider: 'Parkos', plate: 'AB-123-CD', arrivalAt: '2026-07-12T06:30' });
    expect(rows[1].missing).toEqual(['confidence']);
    expect(rows[1].reading).toMatchObject({ confidence: 0.4 });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('signale annulations, modifications et autres mails sans rien créer', async () => {
    const { address } = await connected();
    read.mockResolvedValueOnce(answer({ kind: 'cancellation', summary: 'Annulation Parkos de Marie Dupont' }));
    await post([parkos(address)]);
    read.mockResolvedValueOnce(answer({ kind: 'other', provider: null, summary: 'Lettre d’information' }));
    await post([parkos(address)]);
    const rows = await prisma.inboundEmail.findMany({ orderBy: { receivedAt: 'asc' } });
    expect(rows.map(r => r.status)).toEqual(['unrecognised', 'unrecognised']);
    expect(rows.map(r => r.provider)).toEqual([null, null]);
    expect(rows[0].reading).toMatchObject({ kind: 'cancellation', provider: 'Parkos', summary: 'Annulation Parkos de Marie Dupont' });
    expect(rows[1].reading).toMatchObject({ kind: 'other', provider: null });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('09/10/2026 : un mail Onepark entièrement lu crée la réservation avec son montant et la voiture, sans Claude', async () => {
    const { address } = await connected();
    const onepark = readFileSync(join(__dirname, 'fixtures/onepark-notification.html'), 'utf8');
    const res = await post([
      item(address, '', { RawHtmlBody: onepark, From: { Name: 'Onepark', Address: 'noreply@onepark.co' }, Subject: 'Nouvelle réservation' }),
    ]);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(read).not.toHaveBeenCalled();
    const r = await prisma.reservation.findFirstOrThrow();
    expect(r).toMatchObject({
      channel: 'aggregator',
      channelDetail: 'Onepark',
      externalReference: '5900001',
      customerName: 'JEAN MARTIN',
      customerFirstName: 'JEAN',
      customerLastName: 'MARTIN',
      plate: 'AB-123-CD',
      priceCents: 4500,
      vehicleModel: 'PEUGEOT 3008',
      passengers: 2,
      returnFlight: 'SN 3587',
    });
    // Paris time: arrival 10/10 04:30, the car picked up on 18/10 at 14:00.
    expect([r.arrivalAt.toISOString(), r.returnAt.toISOString()]).toEqual(['2026-10-10T02:30:00.000Z', '2026-10-18T12:00:00.000Z']);
  });

  it('09/10/2026 : Claude complète un mail reconnu mais incomplet (Parclick), sans écraser ce que le lecteur a lu', async () => {
    const { address } = await connected();
    const parclick = readFileSync(join(__dirname, 'fixtures/parclick-confirmation.html'), 'utf8');
    read.mockResolvedValueOnce(
      answer({
        provider: 'Parclick',
        externalReference: 'AUTRE',
        arrivalAt: '2026-10-09T20:00',
        customerName: 'Marc Leroy',
        customerFirstName: 'Marc',
        customerLastName: 'Leroy',
        customerPhone: '+33 6 00 00 00 01',
        plate: 'gh 789 jk',
        priceCents: 4990,
      }),
    );
    const res = await post([
      item(address, '', { RawHtmlBody: parclick, From: { Name: 'Parclick', Address: 'noreply@parclick.com' }, Subject: 'Voici votre réservation !' }),
    ]);
    expect(res.body.imported).toBe(1);
    expect(read).toHaveBeenCalledTimes(1);
    const r = await prisma.reservation.findFirstOrThrow();
    expect(r).toMatchObject({
      channelDetail: 'Parclick',
      externalReference: 'BQXY1234',
      customerName: 'Marc Leroy',
      // The importer read no name: Claude's comes whole, first and last name apart.
      customerFirstName: 'Marc',
      customerLastName: 'Leroy',
      plate: 'GH-789-JK',
      priceCents: 4990,
    });
    expect(r.arrivalAt.toISOString()).toBe('2026-10-09T17:45:00.000Z');
    // Claude unsure: what it brought waits for a human eye.
    read.mockResolvedValueOnce(
      answer({ provider: 'Parclick', customerName: 'Marc Leroy', customerPhone: '+33 6 00 00 00 01', plate: 'gh 789 jk', confidence: 0.4 }),
    );
    const other = parclick.replace('BQXY1234', 'BQXY5678');
    expect((await post([item(address, '', { RawHtmlBody: other })])).body.toCheck).toBe(1);
    expect(await prisma.inboundEmail.findFirstOrThrow({ where: { status: 'incomplete' } })).toMatchObject({
      provider: 'Parclick',
      missing: ['confidence'],
    });
  });

  it('ne consulte pas Claude pour un mail Allopark reconnu, ni sans clé ; un échec laisse le mail en « À traiter »', async () => {
    const { address } = await connected();
    await post([item(address, filled)]);
    expect(read).not.toHaveBeenCalled();
    read.mockResolvedValueOnce(null);
    expect((await post([parkos(address)])).body.toCheck).toBe(1);
    const failed = await prisma.inboundEmail.findFirstOrThrow({ where: { status: 'unrecognised' } });
    expect(failed.reading).toBeNull();
    delete process.env.ANTHROPIC_API_KEY;
    await post([parkos(address)]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(await prisma.inboundEmail.count({ where: { status: 'unrecognised' } })).toBe(2);
  });
});

describe('Allopark : la page de la réservation complète le mail (10/10/2026)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';
  const link =
    '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const reader = Container.get(EmailReadingService);
  let read: jest.SpyInstance;
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/'));
  const answer = (respond: (url: string) => Response) =>
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? respond(String(url)) : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    return { ...op, address: settings.body.address as string };
  };
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read = jest.spyOn(reader, 'read').mockResolvedValue(null);
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    read.mockRestore();
  });

  it('ouvre le lien « Consulter ma réservation » et crée la réservation avec ce que la page montre', async () => {
    const op = await connected();
    answer(() => new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
    // The email as Allopark sends it: « Vos informations » blank, the link in its HTML part.
    const res = await post([item(op.address, email, { RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}` })]);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(allopark()).toHaveLength(1);
    const [url, init] = allopark()[0];
    expect(String(url)).toBe(pageUrl);
    expect(init).toMatchObject({ redirect: 'manual' });
    // 10/10/2026 (relecture): Claude is asked whether the email is a booking; without its answer, the importer's word stands.
    expect(read).toHaveBeenCalledTimes(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      customerName: 'Jean Dupont',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerPhone: '+33 6 12 34 56 78',
      customerEmail: 'jean.dupont@example.com',
      plate: 'GK-318-PX',
      passengers: 3,
      departureFlight: 'TO 3626',
      returnFlight: 'TO 3627',
      vehicleModel: 'Peugeot 308',
      // The email's amount.
      priceCents: 3499,
    });
  });

  it('sans lien, la page de la boîte du parking (destinataire du mail transféré) ; une page en erreur ou qui renvoie ailleurs laisse le mail à vérifier', async () => {
    const op = await connected();
    // A forwarded email: still addressed to the parking's mailbox, the Plazo address only in the envelope.
    const forwarded = (subject: string) =>
      item('parking@example.com', email, { Recipients: [op.address], Subject: subject, To: [{ Name: 'Parking', Address: 'parking@example.com' }] });

    answer(() => new Response('Service Unavailable', { status: 503 }));
    expect((await post([forwarded('en erreur')])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    // 10/10/2026: then the manager's mailbox, last.
    expect(allopark().map(([u]) => String(u))).toEqual([pageUrl, pageUrl.replace('parking%40example.com', encodeURIComponent(op.manager.email))]);
    // Claude is still asked for what the page did not give.
    expect(read).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    answer(() => new Response(null, { status: 302, headers: { Location: 'https://example.test/ailleurs' } }));
    expect((await post([forwarded('ailleurs')])).body.toCheck).toBe(1);
    expect(fetchMock.mock.calls.map(([u]) => String(u))).not.toContain('https://example.test/ailleurs');

    fetchMock.mockClear();
    answer(url =>
      url.includes('/fr-be/confirmation') ? new Response(null, { status: 301, headers: { Location: '/fr/confirmation?x=1' } }) : new Response(page),
    );
    expect((await post([forwarded('redirigé')])).body.imported).toBe(1);
    expect(allopark().map(([u]) => String(u))).toEqual([pageUrl, 'https://www.allopark.com/fr/confirmation?x=1']);

    const waiting = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id, status: 'incomplete' }, orderBy: { subject: 'asc' } });
    expect(waiting.map(e => [e.subject, e.missing])).toEqual([
      ['ailleurs', ['customerPhone', 'plate']],
      ['en erreur', ['customerPhone', 'plate']],
    ]);
  });
});

describe('Allopark : la page sans le lien du mail (10/10/2026, « tu ne vas pas chercher dans les liens »)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  // What Allopark shows for an address that is not the booking's: its home page, without the form.
  const home = '<html><body>Comparez et réservez votre parking AL-884880719</body></html>';
  const urlOf = (address: string) =>
    `https://www.allopark.com/fr-be/confirmation?email=${encodeURIComponent(address)}&reference=AL-884880719&view=parking`;
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const reader = Container.get(EmailReadingService);
  let read: jest.SpyInstance;
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/')).map(([u]) => String(u));
  const answer = (respond: (url: string) => Response) =>
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? respond(String(url)) : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  /** Allopark knows the booking under this address only. */
  const pageFor = (address: string) => (url: string) =>
    url.includes(`email=${encodeURIComponent(address)}`)
      ? new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } })
      : new Response(home, { status: 200 });
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    return { ...op, address: settings.body.address as string };
  };
  const completed = {
    channelDetail: 'Allopark',
    externalReference: 'AL-884880719',
    customerFirstName: 'Jean',
    customerLastName: 'Dupont',
    customerPhone: '+33 6 12 34 56 78',
    plate: 'GK-318-PX',
    passengers: 3,
  };
  /** What Claude reads of an Allopark email: the stay, the name and the amount, « Vos informations » blank. */
  const claude = (over: Partial<EmailReading> = {}): EmailReadingResult => ({
    reading: {
      kind: 'booking',
      provider: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      customerName: 'Jean Dupont',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerPhone: null,
      customerEmail: null,
      plate: null,
      returnFlight: null,
      departureFlight: null,
      passengers: null,
      priceCents: 3499,
      confidence: 0.9,
      summary: 'Réservation Allopark AL-884880719 de Jean Dupont',
      ...over,
    },
    model: 'claude-test',
    usage: { inputTokens: 800, outputTokens: 120 },
  });
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read = jest.spyOn(reader, 'read').mockResolvedValue(null);
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    read.mockRestore();
  });

  it('un mail transféré à la main (de la boîte du parking, à l’adresse Plazo seule, sans lien) est complété par la page de cette boîte', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const res = await post([
      item(op.address, email, {
        From: { Name: 'Parking Air Lyon', Address: 'Parking@Example.com' },
        Subject: 'TR: Confirmation de votre réservation AL-884880719',
      }),
    ]);
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(allopark()).toEqual([urlOf('parking@example.com')]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({ ...completed, priceCents: 3499 });
  });

  it('l’en-tête « À : » du message transféré mène à la boîte du parking, à la réception comme à la relance', async () => {
    const op = await connected();
    const forwarded = [
      'Voici la réservation de ce matin.',
      '',
      '---------- Message transféré ---------',
      'De : ALLOPARK <info@allopark.com>',
      'Date : mer. 30 sept. 2026 à 22:31',
      'Objet : Confirmation de votre réservation AL-884880719',
      'À : <parking@example.com>',
      '',
      email,
    ].join('\n');
    const mail = item(op.address, forwarded, { From: { Name: 'Joanny', Address: 'joanny@example.org' }, Subject: 'Fwd: Confirmation AL-884880719' });
    // Allopark is down at the reception: the header's address, then the sender, then the manager (three pages).
    answer(() => new Response('Service Unavailable', { status: 503 }));
    expect((await post([mail])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    expect(allopark()).toEqual([urlOf('parking@example.com'), urlOf('joanny@example.org'), urlOf(op.manager.email)]);
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, status: 'incomplete' } });
    // Nothing but the Plazo address in its own recipients; no confirmation link among its links.
    expect(row.recipients).toEqual([]);
    expect(row.links.filter(l => l.includes('/confirmation'))).toEqual([]);

    // « Relancer l'analyse » reads the stored text and sender the same way.
    fetchMock.mockClear();
    answer(pageFor('parking@example.com'));
    const res = await api().post(`/api/internal/inbound/emails/${row.id}/reanalyse`).set(auth(op.token));
    expect(res.body.outcome).toBe('imported');
    expect(allopark()).toEqual([urlOf('parking@example.com')]);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject(completed);
  });

  it('mail brut : le bouton « Consulter ma réservation » au-delà des 100 000 caractères gardés du HTML est quand même suivi', async () => {
    const op = await connected();
    const link =
      '<a href="https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
    const html = `<html><body><p>Bonjour Jean Dupont,</p>${'<p style="margin:0">&nbsp;</p>'.repeat(5000)}${link}</body></html>`;
    expect(html.length).toBeGreaterThan(150_000);
    const b64 = (value: string) =>
      Buffer.from(value)
        .toString('base64')
        .replace(/(.{76})/g, '$1\r\n');
    const raw = [
      'From: ALLOPARK <info@allopark.com>',
      `To: ${op.address}`,
      `Subject: =?UTF-8?B?${Buffer.from('Confirmation de votre réservation AL-884880719').toString('base64')}?=`,
      'Date: Wed, 30 Sep 2026 22:31:00 +0200',
      'Message-ID: <long-html@allopark.com>',
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="a1"',
      '',
      '--a1',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64(email),
      '--a1',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64(html),
      '--a1--',
      '',
    ].join('\r\n');
    // The kept HTML stops before the button; the links come from the whole message.
    const parsed = await parseRawEmail(Buffer.from(raw), { from: 'info@allopark.com', to: op.address });
    expect(parsed.RawHtmlBody).toHaveLength(100_000);
    expect(parsed.RawHtmlBody).not.toContain('/confirmation');
    expect(parsed.Links?.[0]).toBe('https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&reference=AL-884880719&view=parking');

    answer(pageFor('contact@parking-lys.fr'));
    const res = await api()
      .post('/api/public/inbound/email')
      .set({
        'Content-Type': 'message/rfc822',
        'X-Inbound-Secret': 'inbound-test-secret',
        'X-Envelope-From': 'info@allopark.com',
        'X-Envelope-To': op.address,
      })
      .send(Buffer.from(raw));
    expect(res.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(allopark()).toEqual([urlOf('contact@parking-lys.fr')]);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({ ...completed, priceCents: 3499 });
  });

  it('10/10/2026 (relecture) : une entité HTML sans caractère (« &#99999999; ») n’empêche ni la lecture des liens ni la réception du mail brut', async () => {
    const op = await connected();
    const html =
      '<p>Bonjour &#99999999; &#x110000; Jean Dupont,</p>' +
      '<a href="https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&amp;reference=AL-884880719&amp;view=parking">Consulter</a>';
    const raw = (to: string) =>
      Buffer.from(
        [
          'From: ALLOPARK <info@allopark.com>',
          `To: ${to}`,
          'Subject: Confirmation AL-884880719',
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=UTF-8',
          '',
          html,
          '',
        ].join('\r\n'),
      );
    const parsed = await parseRawEmail(raw(op.address), { from: 'info@allopark.com', to: op.address });
    expect(parsed.Links).toEqual(['https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&reference=AL-884880719&view=parking']);
    const send = (to: string) =>
      api()
        .post('/api/public/inbound/email')
        .set({
          'Content-Type': 'message/rfc822',
          'X-Inbound-Secret': 'inbound-test-secret',
          'X-Envelope-From': 'info@allopark.com',
          'X-Envelope-To': to,
        })
        .send(raw(to));
    answer(() => new Response('Service Unavailable', { status: 503 }));
    const res = await send(op.address);
    expect([res.status, res.body.received, res.body.toCheck]).toEqual([200, 1, 1]);
    expect(allopark()).toEqual([urlOf('contact@parking-lys.fr')]);
    // For no parking: ignored, as any other.
    const nobody = await send(`personne-0000@${op.address.split('@')[1]}`);
    expect([nobody.status, nobody.body.ignored]).toEqual([200, 1]);
  });

  it('un mail Allopark que l’importeur ne reconnaît pas (« Allopark » dans l’expéditeur ou le texte, la référence dans l’objet) prend la réservation de la page, quand Claude y lit une réservation', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const text = [
      'Bonjour Jean Dupont,',
      'Votre réservation de parking chez Aeroports Parking Lyon est confirmée.',
      'Du 1 octobre 2026 - 08:30',
      'au 3 octobre 2026 - 17:00',
    ].join('\n');
    expect(parseConfirmationEmail(text)).toBeNull();
    const forwarded = (body: string, from: string) =>
      item('parking@example.com', body, {
        Recipients: [op.address],
        From: { Name: 'Expéditeur', Address: from },
        Subject: 'Confirmation de votre réservation AL-884880719',
      });
    read.mockResolvedValue(claude());
    expect((await post([forwarded(text, 'info@allopark.com')])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(allopark()).toEqual([urlOf('parking@example.com')]);
    // 10/10/2026 (relecture): no importer, so Claude says whether the email is a booking at all.
    expect(read).toHaveBeenCalledTimes(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // The page's fields; the amount the page does not give, Claude's.
    expect(booking).toMatchObject({ ...completed, vehicleModel: 'Peugeot 308', returnFlight: 'TO 3627', priceCents: 3499 });
    expect(await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({
      status: 'imported',
      provider: 'Allopark',
      reservationId: booking.id,
    });
    // « Allopark » in the text only, the reference in the subject only: the same page, the same booking.
    const again = await post([forwarded(`Allopark\n${text}`, 'parking@example.com')]);
    expect(again.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, status: 'duplicate' } })).toBe(1);
    // Neither in the text, the subject nor the sender: no page, Claude alone.
    fetchMock.mockClear();
    read.mockClear();
    await post([item('parking@example.com', text, { Recipients: [op.address], From: { Address: 'parking@example.com' }, Subject: 'AL-884880719' })]);
    expect(allopark()).toEqual([]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('10/10/2026 (relecture) : sans importeur, la page seule ne crée rien ; Claude absent ou peu sûr, la réservation attend, pré-remplie ; lue comme autre chose, rien', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const mail = (subject: string, text: string) =>
      item('parking@example.com', text, { Recipients: [op.address], From: { Name: 'Joanny', Address: 'parking@example.com' }, Subject: subject });
    // A customer quoting the booking: « Allopark » and the reference, nothing that says a change or a cancellation.
    const question = mail('Re: Allopark AL-884880719', 'Bonjour, réservé sur Allopark, mon vol a du retard : pouvez-vous m’attendre ?');
    expect(parseConfirmationEmail(question.RawTextBody)).toBeNull();

    // Claude does not answer: the page's booking waits for a human eye.
    read.mockResolvedValueOnce(null);
    expect((await post([question])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    // Claude reads another mail: nothing created, nothing taken from the page.
    read.mockResolvedValueOnce(claude({ kind: 'other', provider: null, summary: 'Question d’un client sur son retour' }));
    expect((await post([{ ...question, Subject: 'Re: Allopark AL-884880719 (2)' }])).body.toCheck).toBe(1);
    // Claude reads a booking but is unsure of it: waits too.
    read.mockResolvedValueOnce(claude({ confidence: 0.4 }));
    expect((await post([{ ...question, Subject: 'Re: Allopark AL-884880719 (3)' }])).body.toCheck).toBe(1);
    // Without a key at all: the same as no answer.
    delete process.env.ANTHROPIC_API_KEY;
    expect((await post([{ ...question, Subject: 'Re: Allopark AL-884880719 (4)' }])).body.toCheck).toBe(1);

    expect(allopark()).toHaveLength(4);
    expect(read).toHaveBeenCalledTimes(3);
    expect(await prisma.reservation.count()).toBe(0);
    const rows = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id }, orderBy: { subject: 'asc' } });
    expect(rows.map(r => [r.status, r.provider, r.missing])).toEqual([
      ['incomplete', 'Allopark', ['confidence']],
      ['unrecognised', null, null],
      ['incomplete', 'Allopark', ['confidence']],
      ['incomplete', 'Allopark', ['confidence']],
    ]);
    // Prefilled from the page for « Compléter »; the other mail keeps nothing of it.
    expect(rows[0].parsed).toMatchObject({ externalReference: 'AL-884880719', plate: 'GK-318-PX', customerPhone: '+33 6 12 34 56 78' });
    expect(rows[1]).toMatchObject({ parsed: null, reading: { kind: 'other' } });

    // « Relancer l'analyse » while Claude is still away: the booking still waits.
    const waiting = await api().post(`/api/internal/inbound/emails/${rows[0].id}/reanalyse`).set(auth(op.token));
    expect([waiting.body.outcome, waiting.body.email.missing]).toEqual(['incomplete', ['confidence']]);
    // Claude back, sure it is a booking: created.
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValueOnce(claude());
    await prisma.inboundEmail.update({ where: { id: rows[0].id }, data: { analysedAt: new Date(Date.now() - 31000) } });
    const made = await api().post(`/api/internal/inbound/emails/${rows[0].id}/reanalyse`).set(auth(op.token));
    expect(made.body.outcome).toBe('imported');
    // The mail read as another one stays so, even when Claude does not answer at its re-analysis.
    read.mockResolvedValueOnce(null);
    const other = await api().post(`/api/internal/inbound/emails/${rows[1].id}/reanalyse`).set(auth(op.token));
    expect([other.body.outcome, other.body.email.status, other.body.email.reading.kind]).toEqual(['unrecognised', 'unrecognised', 'other']);
    expect(await prisma.reservation.count()).toBe(1);
  });

  it('une annulation ou une modification n’ouvre jamais la page', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const mail = (subject: string, text: string) =>
      item('parking@example.com', text, { Recipients: [op.address], Subject: subject, From: { Name: 'ALLOPARK', Address: 'info@allopark.com' } });
    await post([
      mail('Annulation de votre réservation AL-884880719', 'Allopark\nVotre réservation AL-884880719 chez Aeroports Parking Lyon est annulée.'),
      mail('Votre réservation AL-884880719', 'Allopark\nModification de votre réservation AL-884880719 : nouvelles dates.'),
      mail('Votre réservation AL-884880719', 'ALLOPARK\nRéservation N° AL-884880719\nVotre réservation a été annulée.'),
    ]);
    expect(allopark()).toEqual([]);
    expect(await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id }, select: { status: true } })).toEqual([
      { status: 'unrecognised' },
      { status: 'unrecognised' },
      { status: 'unrecognised' },
    ]);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('10/10/2026 (relecture) : « Votre réservation AL-… a été modifiée », « Réservation AL-… annulée » n’ouvrent pas la page, ne créent rien et restent « À traiter »', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const mail = (subject: string, text: string) =>
      item('parking@example.com', text, { Recipients: [op.address], Subject: subject, From: { Name: 'ALLOPARK', Address: 'info@allopark.com' } });
    read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Modification de la réservation AL-884880719' }));
    read.mockResolvedValueOnce(claude({ kind: 'cancellation', summary: 'Annulation de la réservation AL-884880719' }));
    await post([
      mail(
        'Votre réservation AL-884880719',
        'Allopark\nVotre réservation AL-884880719 a été modifiée : du 2 octobre 2026 - 08:30 au 4 octobre 2026 - 17:00.',
      ),
      mail('Allopark AL-884880719', 'ALLOPARK\nRéservation AL-884880719 annulée.'),
    ]);
    expect(allopark()).toEqual([]);
    expect(read).toHaveBeenCalledTimes(2);
    const rows = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id }, orderBy: { subject: 'asc' } });
    expect(rows.map(r => [r.subject, r.status, (r.reading as { kind: string } | null)?.kind])).toEqual([
      ['Allopark AL-884880719', 'incomplete', 'cancellation'],
      ['Votre réservation AL-884880719', 'incomplete', 'modification'],
    ]);
    expect(await prisma.reservation.count()).toBe(0);
    expect((await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.counts.todo).toBe(2);
  });

  it('10/10/2026 (relecture) : une modification que rien ne signale ouvre la page, mais Claude la lit comme telle : ni doublon ni réservation, elle reste « À traiter », même relancée sans Claude', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    // The booking is already there (its confirmation, complete).
    expect((await post([item(op.address, filled)])).body.imported).toBe(1);
    const info = jest.spyOn(logger, 'info');
    try {
      read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Nouvelles dates pour la réservation AL-884880719' }));
      const change = item(
        'parking@example.com',
        'Allopark\nNouvelles dates pour votre séjour AL-884880719 : du 2 octobre 2026 - 08:30 au 4 octobre 2026 - 17:00.',
        {
          Recipients: [op.address],
          Subject: 'Votre séjour AL-884880719',
        },
      );
      expect((await post([change])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
      expect(allopark()).toEqual([urlOf('parking@example.com')]);
      expect(info.mock.calls.map(([m]) => String(m))).toContain(
        '[Allopark] AL-884880719: read as modification by Claude, nothing taken from the booking page',
      );
    } finally {
      info.mockRestore();
    }
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, status: 'incomplete' } });
    // The email's own fields wait, as they would without the page; Claude's reading says why.
    expect(row).toMatchObject({ provider: 'Allopark', reservationId: null, reading: { kind: 'modification' } });
    expect(row.parsed).not.toHaveProperty('plate');
    expect(row.missing).toEqual(expect.arrayContaining(['customerPhone', 'plate']));

    // Re-analysed while Claude is away: the page answers again, its booking is still not taken.
    delete process.env.ANTHROPIC_API_KEY;
    const res = await api().post(`/api/internal/inbound/emails/${row.id}/reanalyse`).set(auth(op.token));
    expect([res.body.outcome, res.body.email.status, res.body.email.reading.kind]).toEqual(['incomplete', 'incomplete', 'modification']);
    expect(allopark()).toHaveLength(2);
    expect(await prisma.reservation.count()).toBe(1);
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, status: 'duplicate' } })).toBe(0);
  });

  it('trois pages au plus, la boîte du gérant en dernier ; jamais un autre membre, un gérant inactif ni le gérant d’un autre loueur', async () => {
    const op = await connected();
    const agent = await addStaff(op.token, 'agent');
    const former = await addStaff(op.token, 'manager');
    await prisma.staff.update({ where: { id: former.id }, data: { isActive: false } });
    const other = await setupOperator('Autre parking');
    answer(() => new Response(home, { status: 200 }));

    // Forwarded by hand: the sender, then the manager.
    await post([item(op.address, email, { From: { Address: 'parking@example.com' } })]);
    expect(allopark()).toEqual([urlOf('parking@example.com'), urlOf(op.manager.email)]);

    // Three addresses before the manager's: three pages, the manager's not tried.
    fetchMock.mockClear();
    await post([
      item('a@example.com', email, {
        Recipients: [op.address],
        To: [{ Address: 'a@example.com' }, { Address: op.address }],
        Cc: [{ Address: 'b@example.com' }],
        From: { Address: 'c@example.com' },
      }),
    ]);
    expect(allopark()).toEqual([urlOf('a@example.com'), urlOf('b@example.com'), urlOf('c@example.com')]);

    const tried = fetchMock.mock.calls.map(([u]) => decodeURIComponent(String(u)));
    for (const address of [agent.email, former.email, other.manager.email]) expect(tried.join(' ')).not.toContain(address);
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, status: 'incomplete' } })).toBe(2);
  });

  it('les journaux disent ce qui a été tenté (référence, lien, pages, statut, chemin, formulaire, champs remplis), sans aucune adresse', async () => {
    const op = await connected();
    const info = jest.spyOn(logger, 'info');
    const warn = jest.spyOn(logger, 'warn');
    const error = jest.spyOn(logger, 'error');
    try {
      // The email's link, redirected to another language with the address in its query: the page is found there.
      const link =
        '<a href="https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&amp;reference=AL-884880719&amp;view=parking">Consulter</a>';
      answer(url =>
        url.includes('/fr-be/')
          ? new Response(null, { status: 301, headers: { Location: '/fr/confirmation?email=contact%40parking-lys.fr&reference=AL-884880719' } })
          : new Response(page, { status: 200 }),
      );
      expect((await post([item(op.address, email, { RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}` })])).body.imported).toBe(1);

      // Without the link: Allopark down for the parking's address, its home page for the manager's.
      answer(url => (url.includes('parking%40example.com') ? new Response('Service Unavailable', { status: 503 }) : new Response(home)));
      await post([
        item('parking@example.com', email.replace(/AL-884880719/g, 'AL-884880720'), {
          Recipients: [op.address],
          Subject: 'Confirmation de votre réservation AL-884880720',
        }),
      ]);

      const logged = [...info.mock.calls, ...warn.mock.calls, ...error.mock.calls].map(([message]) => String(message));
      const allopark = logged.filter(m => m.startsWith('[Allopark]'));
      expect(allopark).toEqual([
        '[Allopark] AL-884880719: importer, 3 allopark.com link(s), confirmation link yes, 1 page(s) to try',
        '[Allopark] AL-884880719 page 1/1: HTTP 200 /fr/confirmation, booking form yes, reference yes',
        expect.stringMatching(/^\[Allopark\] AL-884880719: \d+ field\(s\) filled from the booking page$/),
        '[Allopark] AL-884880720: importer, 2 allopark.com link(s), confirmation link no, 2 page(s) to try',
        '[Allopark] AL-884880720 page 1/2: HTTP 503 /fr-be/confirmation',
        "[Allopark] AL-884880720 page 2/2: HTTP 200 /fr-be/confirmation, booking form no, reference no, not this booking's page",
        '[Allopark] AL-884880720: no booking found on 2 page(s)',
      ]);
      // Never an address, a query or a name.
      for (const message of logged) {
        expect(message).not.toContain('@');
        expect(message).not.toMatch(/%40|email=|\?|Dupont|GK-318-PX/);
      }
    } finally {
      info.mockRestore();
      warn.mockRestore();
      error.mockRestore();
    }
  });
});

describe('relancer l’analyse d’un mail (10/10/2026)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';
  // The link carries an address that is neither a recipient nor the Gmail box: only the link leads to its page.
  const link =
    '<a href="https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
  const linkPageUrl = 'https://www.allopark.com/fr-be/confirmation?email=contact%40parking-lys.fr&reference=AL-884880719&view=parking';
  const reader = Container.get(EmailReadingService);
  let read: jest.SpyInstance;
  const receive = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const reanalyse = (id: string, token: string) => api().post(`/api/internal/inbound/emails/${id}/reanalyse`).set(auth(token));
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/'));
  const answerPage = (respond: (url: string) => Response) =>
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? respond(String(url)) : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  const gmail = (to: string, requester: string) =>
    item(to, 'Code de confirmation : 740215896', {
      From: { Name: 'Gmail Team', Address: 'forwarding-noreply@google.com' },
      Subject: `(Gmail) Confirmation de transfert – Recevez les messages de ${requester}`,
    });
  const parkos = (to: string) =>
    item(to, 'Bonjour, nouvelle réservation sur Parkos pour Marie Dupont…', {
      From: { Name: 'Parkos', Address: 'noreply@parkos.fr' },
      Subject: 'Nouvelle réservation PK-123456',
    });
  const claude = (over: Partial<EmailReading> = {}): EmailReadingResult => ({
    reading: {
      kind: 'booking',
      provider: 'Parkos',
      externalReference: 'PK-123456',
      arrivalAt: '2026-07-12T06:30',
      returnAt: '2026-07-19T22:15',
      customerName: 'Marie Dupont',
      customerFirstName: 'Marie',
      customerLastName: 'Dupont',
      customerPhone: '+33 6 12 34 56 78',
      customerEmail: 'marie@example.com',
      plate: 'ab 123 cd',
      returnFlight: 'AF1234',
      departureFlight: null,
      passengers: 2,
      priceCents: 18990,
      confidence: 0.92,
      summary: 'Réservation Parkos de Marie Dupont du 12 au 19 juillet',
      ...over,
    },
    model: 'claude-test',
    usage: { inputTokens: 800, outputTokens: 120 },
  });
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    return { ...op, address: settings.body.address as string };
  };
  const rowOf = (operatorId: string, status: 'incomplete' | 'unrecognised' | 'imported' | 'forwarding') =>
    prisma.inboundEmail.findFirstOrThrow({ where: { operatorId, status } });

  beforeEach(() => {
    // Claude is off unless a test gives it a key.
    delete process.env.ANTHROPIC_API_KEY;
    read = jest.spyOn(reader, 'read').mockResolvedValue(null);
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    read.mockRestore();
  });

  it('un ancien mail Allopark incomplet (sans liens ni destinataires) est relu avec la boîte Gmail qui transfère : la page crée la réservation', async () => {
    const op = await connected();
    // Received before Gmail's forwarding was confirmed: only the manager's page (10/10/2026), which shows Allopark's home
    // page for an address that is not the booking's; no Claude.
    expect((await receive([item(op.address, email)])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    expect(allopark().map(([u]) => String(u))).toEqual([pageUrl.replace('parking%40example.com', encodeURIComponent(op.manager.email))]);
    const row = await rowOf(op.operator.id, 'incomplete');
    // Stored before 10/10/2026: neither links nor recipients; Claude had read it then, without finding the phone.
    await prisma.inboundEmail.update({
      where: { id: row.id },
      data: {
        links: [],
        recipients: [],
        reading: { kind: 'booking', provider: 'Allopark', confidence: 0.9, summary: 'Réservation Allopark de Jean Dupont', model: 'claude-old' },
      },
    });
    await receive([gmail(op.address, 'Parking@Example.com')]);

    // Claude is there now: asked whether the mail is a booking (10/10/2026, relecture), it does not answer this time; its
    // former reading said so, the page says everything: the booking is made, the former reading goes.
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    fetchMock.mockClear();
    answerPage(() => new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
    const res = await reanalyse(row.id, op.token);
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('imported');
    expect(allopark().map(([u]) => String(u))).toEqual([pageUrl]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ reading: null, recipients: [], links: [] });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerPhone: '+33 6 12 34 56 78',
      plate: 'GK-318-PX',
      passengers: 3,
      priceCents: 3499,
    });
    expect(res.body.email).toMatchObject({
      id: row.id,
      status: 'imported',
      provider: 'Allopark',
      missing: [],
      reading: null,
      reservationId: booking.id,
      reservationReference: booking.reference,
      analysedAt: expect.any(String),
    });
    expect(Date.now() - new Date(res.body.email.analysedAt).getTime()).toBeLessThan(60000);
    expect(await prisma.auditLog.findFirstOrThrow({ where: { action: 'inbound.reanalysed' } })).toMatchObject({
      operatorId: op.operator.id,
      staffId: op.manager.id,
      entityType: 'inbound_email',
      entityId: row.id,
      details: { from: 'incomplete', to: 'imported', outcome: 'imported', reservationId: booking.id },
    });
    // The inbox lists it in « Traités »; analysing it again is refused.
    const done = (await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token))).body;
    expect(done.data.map((e: { id: string }) => e.id)).toEqual([row.id]);
    expect(done.data[0].analysedAt).toEqual(res.body.email.analysedAt);
  });

  it('un mail inconnu que Claude lit maintenant comme une réservation complète est importé', async () => {
    const op = await connected();
    // Received while Claude had no key: waiting, without a reading.
    await receive([parkos(op.address)]);
    const row = await rowOf(op.operator.id, 'unrecognised');
    expect(row.reading).toBeNull();
    expect(row.analysedAt).toBeNull();

    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValue(claude());
    const res = await reanalyse(row.id, op.token);
    expect([res.status, res.body.outcome]).toEqual([200, 'imported']);
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0][0]).toMatchObject({
      from: 'noreply@parkos.fr',
      fromName: 'Parkos',
      subject: 'Nouvelle réservation PK-123456',
      text: 'Bonjour, nouvelle réservation sur Parkos pour Marie Dupont…',
      timezone: 'Europe/Paris',
    });
    expect(res.body.email).toMatchObject({
      status: 'imported',
      provider: 'Parkos',
      reading: { kind: 'booking', provider: 'Parkos', confidence: 0.92, model: 'claude-test' },
      reservationReference: expect.any(String),
    });
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({
      channelDetail: 'Parkos',
      externalReference: 'PK-123456',
      plate: 'AB-123-CD',
      priceCents: 18990,
    });
  });

  it('un mail toujours incomplet reste « À traiter », ses champs manquants recalculés', async () => {
    const op = await connected();
    await receive([item(op.address, email)]);
    const row = await rowOf(op.operator.id, 'incomplete');
    expect(row.missing).toEqual(['customerPhone', 'plate']);

    // Claude now finds the plate, still not the phone.
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValue(claude({ provider: 'Allopark', externalReference: 'AL-884880719', customerPhone: null, plate: 'gk 318 px' }));
    const res = await reanalyse(row.id, op.token);
    expect([res.status, res.body.outcome]).toEqual([200, 'incomplete']);
    expect(res.body.email).toMatchObject({
      status: 'incomplete',
      provider: 'Allopark',
      missing: ['customerPhone'],
      parsed: { externalReference: 'AL-884880719', plate: 'GK-318-PX', customerName: 'Jean Dupont' },
      reading: { kind: 'booking', provider: 'Allopark' },
      reservationId: null,
    });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({
      status: 'incomplete',
      missing: ['customerPhone'],
    });
    expect(await prisma.reservation.count()).toBe(0);
    expect((await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.counts.todo).toBe(1);
  });

  it('un mail archivé ou traité qui ne donne toujours rien garde son état ; la lecture précédente reste quand Claude ne répond pas', async () => {
    const op = await connected();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValueOnce(claude({ kind: 'other', provider: null, summary: 'Lettre d’information' }));
    await receive([parkos(op.address)]);
    const row = await rowOf(op.operator.id, 'unrecognised');
    expect((await api().post(`/api/internal/inbound/emails/${row.id}/archive`).set(auth(op.token))).status).toBe(200);

    read.mockResolvedValueOnce(null);
    const res = await reanalyse(row.id, op.token);
    expect([res.status, res.body.outcome]).toEqual([200, 'unrecognised']);
    expect(res.body.email).toMatchObject({
      status: 'archived',
      reading: { kind: 'other', summary: 'Lettre d’information' },
      analysedAt: expect.any(String),
    });
    expect((await api().get('/api/internal/inbound/emails?view=archived').set(auth(op.token))).body.counts).toEqual({
      todo: 0,
      done: 0,
      archived: 1,
    });
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'inbound.reanalysed', entityId: row.id } });
    expect(entry.details).toEqual({ from: 'archived', to: 'archived', outcome: 'unrecognised' });

    // A handled email that is still incomplete stays handled, its fields refreshed.
    delete process.env.ANTHROPIC_API_KEY;
    await receive([item(op.address, email)]);
    const incomplete = await rowOf(op.operator.id, 'incomplete');
    await api().post(`/api/internal/inbound/emails/${incomplete.id}/handle`).set(auth(op.token));
    await prisma.inboundEmail.update({ where: { id: incomplete.id }, data: { missing: ['plate'] } });
    const handled = await reanalyse(incomplete.id, op.token);
    expect([handled.body.outcome, handled.body.email.status, handled.body.email.missing]).toEqual([
      'incomplete',
      'handled',
      ['customerPhone', 'plate'],
    ]);
  });

  it('refuse un mail déjà importé, sans texte, une confirmation de Gmail, le mail d’un autre parking, une seconde analyse immédiate et un chauffeur', async () => {
    const op = await connected();
    const driver = await addStaff(op.token, 'driver');
    await receive([item(op.address, filled), item(op.address, email, { Subject: 'incomplet' }), gmail(op.address, 'parking@example.com')]);
    const imported = await rowOf(op.operator.id, 'imported');
    const incomplete = await rowOf(op.operator.id, 'incomplete');
    const forwarding = await rowOf(op.operator.id, 'forwarding');
    const refused = async (id: string, token = op.token) => {
      const res = await reanalyse(id, token);
      return [res.status, res.body.code];
    };

    expect(await refused(imported.id)).toEqual([409, 'already_imported']);
    // Typed by hand from the email (« Compléter »): it has its booking too.
    const attached = await prisma.inboundEmail.create({
      data: { operatorId: op.operator.id, status: 'handled', textBody: 'Bonjour', reservationId: imported.reservationId },
    });
    expect(await refused(attached.id)).toEqual([409, 'already_imported']);
    // The text purged after 30 days.
    const old = await prisma.inboundEmail.create({ data: { operatorId: op.operator.id, status: 'incomplete', subject: 'vieux' } });
    expect(await refused(old.id)).toEqual([409, 'text_gone']);
    expect(await refused(forwarding.id)).toEqual([404, 'not_found']);
    expect(await refused('nope')).toEqual([404, 'not_found']);
    const other = await setupOperator('Autre');
    expect(await refused(incomplete.id, other.token)).toEqual([404, 'not_found']);
    expect((await reanalyse(incomplete.id, driver.token)).status).toBe(403);

    // Two clicks at once: one analysis, the other refused; again within 30 s, refused; after, allowed.
    const both = await Promise.all([reanalyse(incomplete.id, op.token), reanalyse(incomplete.id, op.token)]);
    expect(both.map(r => [r.status, r.body.code ?? r.body.outcome]).sort()).toEqual([
      [200, 'incomplete'],
      [409, 'analysis_running'],
    ]);
    expect(await refused(incomplete.id)).toEqual([409, 'analysis_running']);
    await prisma.inboundEmail.update({ where: { id: incomplete.id }, data: { analysedAt: new Date(Date.now() - 31000) } });
    expect((await reanalyse(incomplete.id, op.token)).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: 'inbound.reanalysed' } })).toBe(2);
  });

  it('le super admin relance l’analyse depuis « Ouvrir son espace », tracé sous son nom', async () => {
    const op = await connected();
    await receive([item(op.address, email)]);
    const row = await rowOf(op.operator.id, 'incomplete');
    const admin = await setupOperator('Plazo (plateforme)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    try {
      const view = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
      expect(view.status).toBe(201);
      const res = await reanalyse(row.id, view.body.access.token as string);
      expect([res.status, res.body.outcome, res.body.email.status]).toEqual([200, 'incomplete', 'incomplete']);
      const entries = await prisma.auditLog.findMany({ where: { operatorId: op.operator.id, staffId: admin.manager.id } });
      expect(entries.find(e => e.action === 'inbound.reanalysed')).toMatchObject({
        entityId: row.id,
        details: { from: 'incomplete', to: 'incomplete', outcome: 'incomplete', viewAs: true },
      });
      expect(entries.filter(e => e.action === 'view_as.write').map(e => (e.details as { path: string }).path)).toContain(
        `/api/internal/inbound/emails/${row.id}/reanalyse`,
      );
    } finally {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    }
  });

  it('la réception garde les destinataires du mail (sans l’adresse Plazo) et ses liens Allopark, que la relance réutilise ; la purge les efface avec le texte', async () => {
    const op = await connected();
    answerPage(() => new Response('Service Unavailable', { status: 503 }));
    await receive([
      item('parking@example.com', email, {
        Recipients: [op.address],
        To: [
          { Name: 'Parking', Address: 'Parking@Example.com' },
          { Name: 'Plazo', Address: op.address },
        ],
        Cc: [{ Address: 'gerant@example.com' }, { Address: 'GERANT@example.com' }, { Address: 'pas-une-adresse' }],
        RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}`,
      }),
    ]);
    const row = await rowOf(op.operator.id, 'incomplete');
    expect(row.recipients).toEqual(['parking@example.com', 'gerant@example.com']);
    expect(row.links).toEqual([
      'https://www.allopark.com/fr-be/confirmation?email=contact@parking-lys.fr&reference=AL-884880719&view=parking',
      'https://www.allopark.com/fr-be/parkings-aeroport-lyon-saint-exupery/aeroports-parking-lyon',
      'https://www.allopark.com/fr-be/contactez-nous',
    ]);
    expect(allopark().map(([u]) => String(u))).toEqual([linkPageUrl]);
    // Gmail's confirmation keeps neither.
    await receive([gmail(op.address, 'parking@example.com')]);
    expect(await rowOf(op.operator.id, 'forwarding')).toMatchObject({ recipients: [], links: [] });

    // The page answers now: the stored link is opened again (not the page of a recipient or of the Gmail box).
    fetchMock.mockClear();
    answerPage(() => new Response(page, { status: 200 }));
    const res = await reanalyse(row.id, op.token);
    expect(res.body.outcome).toBe('imported');
    expect(allopark().map(([u]) => String(u))).toEqual([linkPageUrl]);
    expect(linkPageUrl).not.toBe(pageUrl);
    // Of no use once the booking is made: gone at once, the text stays until the purge.
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({
      status: 'imported',
      recipients: [],
      links: [],
      textBody: expect.any(String),
    });

    await prisma.inboundEmail.updateMany({ data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    expect(await Container.get(InboundEmailService).purge()).toEqual({ textsCleared: 1, rowsDeleted: 0 });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ textBody: null, recipients: [], links: [] });
  });

  it('un mail importé dès sa réception ne garde ni ses destinataires ni ses liens', async () => {
    const op = await connected();
    await receive([
      item('parking@example.com', filled, {
        Recipients: [op.address],
        Cc: [{ Address: 'gerant@example.com' }],
        RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}`,
      }),
    ]);
    expect(await rowOf(op.operator.id, 'imported')).toMatchObject({ recipients: [], links: [], textBody: expect.any(String) });
  });

  it('une relance pendant une panne de Claude garde ce que Claude avait lu ; une lecture incertaine reste à vérifier', async () => {
    const op = await connected();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValueOnce(claude({ customerPhone: null }));
    await receive([parkos(op.address)]);
    const row = await rowOf(op.operator.id, 'incomplete');
    const before = { provider: 'Parkos', parsed: row.parsed, missing: ['customerPhone'] };
    expect(row).toMatchObject({ provider: 'Parkos', missing: ['customerPhone'], reading: { kind: 'booking', confidence: 0.92 } });
    const again = async () => {
      await prisma.inboundEmail.update({ where: { id: row.id }, data: { analysedAt: new Date(Date.now() - 31000) } });
      return reanalyse(row.id, op.token);
    };

    // Claude times out (or is busy, or refuses): the email stays as it was, « Compléter » still prefilled.
    read.mockResolvedValueOnce(null);
    const failed = await again();
    expect([failed.status, failed.body.outcome]).toEqual([200, 'incomplete']);
    expect(failed.body.email).toMatchObject({ status: 'incomplete', ...before, reading: { kind: 'booking', confidence: 0.92 } });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: 'incomplete', ...before });
    // Without a key at all, the same.
    delete process.env.ANTHROPIC_API_KEY;
    expect((await again()).body.email).toMatchObject({ status: 'incomplete', ...before });

    // Claude now reads it as a cancellation: what it read before goes.
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValueOnce(claude({ kind: 'cancellation', summary: 'Annulation Parkos de Marie Dupont' }));
    expect((await again()).body).toMatchObject({
      outcome: 'unrecognised',
      email: { status: 'unrecognised', provider: null, parsed: null, missing: [], reading: { kind: 'cancellation' } },
    });

    // A complete but unsure reading never becomes a booking because Claude is down at the re-analysis.
    read.mockResolvedValueOnce(claude({ externalReference: 'PK-654321', confidence: 0.4 }));
    await receive([parkos(op.address)]);
    const unsure = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, status: 'incomplete' } });
    expect(unsure.missing).toEqual(['confidence']);
    read.mockResolvedValueOnce(null);
    const kept = await reanalyse(unsure.id, op.token);
    expect([kept.body.outcome, kept.body.email.status, kept.body.email.missing]).toEqual(['incomplete', 'incomplete', ['confidence']]);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('un mail archivé pendant l’analyse reste archivé ; rattaché à la main pendant l’analyse, il garde sa réservation', async () => {
    const op = await connected();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read.mockResolvedValueOnce(claude({ customerPhone: null }));
    await receive([parkos(op.address)]);
    const row = await rowOf(op.operator.id, 'incomplete');

    // A colleague archives it while Claude thinks (then Claude does not answer).
    read.mockImplementationOnce(async () => {
      expect((await api().post(`/api/internal/inbound/emails/${row.id}/archive`).set(auth(op.token))).status).toBe(200);
      return null;
    });
    const res = await reanalyse(row.id, op.token);
    expect([res.status, res.body.outcome, res.body.email.status]).toEqual([200, 'incomplete', 'archived']);
    expect((await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.counts).toEqual({ todo: 0, done: 0, archived: 1 });
    expect((await prisma.auditLog.findFirstOrThrow({ where: { action: 'inbound.reanalysed', entityId: row.id } })).details).toEqual({
      from: 'archived',
      to: 'archived',
      outcome: 'incomplete',
    });

    // Another one is typed by hand from the email (« Compléter ») while Claude reads it complete: the hand-made link stays.
    await receive([item(op.address, filled)]);
    const typed = await rowOf(op.operator.id, 'imported');
    await receive([parkos(op.address)]);
    const waiting = await rowOf(op.operator.id, 'unrecognised');
    read.mockImplementationOnce(async () => {
      await prisma.inboundEmail.update({ where: { id: waiting.id }, data: { status: 'imported', reservationId: typed.reservationId } });
      return claude();
    });
    const attached = await reanalyse(waiting.id, op.token);
    expect([attached.status, attached.body.code]).toEqual([409, 'already_imported']);
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: waiting.id } })).toMatchObject({
      status: 'imported',
      reservationId: typed.reservationId,
    });
    // The booking the analysis made meanwhile is traced.
    const made = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: 'PK-123456' } });
    expect((await prisma.auditLog.findFirstOrThrow({ where: { action: 'inbound.reanalysed', entityId: waiting.id } })).details).toEqual({
      from: 'imported',
      to: 'imported',
      outcome: 'imported',
      reservationId: made.id,
    });
  });
});
