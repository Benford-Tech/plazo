import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma, { Prisma } from '@/database';
import { allocateInboundSlug } from '@/services/inbound-slug';
import { forwardingConfirmationOf, inboundSlugOf, newInboundSlug, recipientsOf, stripHtml, textOf } from '@/domain/inbound-email';
import type { EmailReading } from '@/domain/email-reading';
import { EmailReadingService, type EmailReadingResult } from '@/services/email-reading.service';
import { InboundEmailService } from '@/services/inbound-email.service';
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

  it('10/10/2026 : le super admin archive les mails d’un parking depuis « Ouvrir son espace », les autres gestes restent au loueur', async () => {
    const { op, imported, unrecognised } = await inbox({ incomplete: 'Allopark incomplet', unknown: 'Question' });
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
      for (const [action, body] of [
        ['handle', {}],
        ['dismiss', {}],
        ['attach', { reservationId: imported.reservationId }],
      ] as const) {
        const refused = await post(imported.id, action, body);
        expect([action, refused.status, refused.body.code]).toEqual([action, 403, 'view_as_read_only']);
      }
      // Traced under the admin's real name, in the operator's journal.
      const entries = await prisma.auditLog.findMany({ where: { operatorId: op.operator.id, staffId: admin.manager.id } });
      expect(entries.filter(e => e.action === 'inbound.archived').map(e => e.entityId)).toEqual([unrecognised.id]);
      expect(entries.filter(e => e.action === 'view_as.write').map(e => (e.details as { path: string }).path)).toContain(
        `/api/internal/inbound/emails/${unrecognised.id}/archive`,
      );
      // The operator finds it in « Archivés ».
      const list = (await api().get('/api/internal/inbound/emails?view=archived').set(auth(op.token))).body;
      expect(list.data.map((e: { id: string }) => e.id)).toEqual([unrecognised.id]);
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
