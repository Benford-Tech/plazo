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
import { CapacityService } from '@/services/capacity.service';
import { InboundEmailService } from '@/services/inbound-email.service';
import { NotificationService } from '@/services/notification.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { ReservationService } from '@/services/reservation.service';
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
    // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): the link first, then the parking's addresses (here the
    // manager's).
    expect(allopark()).toEqual([urlOf('contact@parking-lys.fr'), urlOf(op.manager.email)]);
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

  it('une annulation n’ouvre jamais la page ; depuis le 10/10/2026 (« C’est une modification »), une modification l’ouvre', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const mail = (subject: string, text: string) =>
      item('parking@example.com', text, { Recipients: [op.address], Subject: subject, From: { Name: 'ALLOPARK', Address: 'info@allopark.com' } });
    await post([
      mail('Annulation de votre réservation AL-884880719', 'Allopark\nVotre réservation AL-884880719 chez Aeroports Parking Lyon est annulée.'),
      mail('Votre réservation AL-884880719', 'ALLOPARK\nRéservation N° AL-884880719\nVotre réservation a été annulée.'),
    ]);
    expect(allopark()).toEqual([]);
    expect(await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id }, select: { status: true } })).toEqual([
      { status: 'unrecognised' },
      { status: 'unrecognised' },
    ]);
    expect(await prisma.reservation.count()).toBe(0);

    // A change: the page shows the booking as it is now; Plazo did not have it yet, it is created from the page
    // (10/10/2026, relecture: once Claude reads it as a change).
    read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Nouvelles dates pour la réservation AL-884880719' }));
    expect(
      (await post([mail('Votre réservation AL-884880719', 'Allopark\nModification de votre réservation AL-884880719 : nouvelles dates.')])).body,
    ).toEqual({
      received: 1,
      imported: 1,
      toCheck: 0,
      ignored: 0,
    });
    expect(allopark()).toEqual([urlOf('parking@example.com')]);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject(completed);
  });

  it('10/10/2026 (relecture, puis « C’est une modification ») : « Réservation AL-… annulée » n’ouvre pas la page et reste « À traiter » ; « Votre réservation AL-… a été modifiée » l’ouvre, Claude confirmant la modification', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    const mail = (subject: string, text: string) =>
      item('parking@example.com', text, { Recipients: [op.address], Subject: subject, From: { Name: 'ALLOPARK', Address: 'info@allopark.com' } });
    read.mockResolvedValueOnce(claude({ kind: 'cancellation', summary: 'Annulation de la réservation AL-884880719' }));
    await post([mail('Allopark AL-884880719', 'ALLOPARK\nRéservation AL-884880719 annulée.')]);
    expect(allopark()).toEqual([]);
    expect(read).toHaveBeenCalledTimes(1);
    const cancelled = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect([cancelled.status, (cancelled.reading as { kind: string } | null)?.kind, cancelled.change]).toEqual(['incomplete', 'cancellation', null]);
    expect(await prisma.reservation.count()).toBe(0);
    expect((await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.counts.todo).toBe(1);

    // The change is read from the page (the booking as it is now), once Claude confirms what the wording announced.
    read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Modification de la réservation AL-884880719' }));
    await post([
      mail(
        'Votre réservation AL-884880719',
        'Allopark\nVotre réservation AL-884880719 a été modifiée : du 2 octobre 2026 - 08:30 au 4 octobre 2026 - 17:00.',
      ),
    ]);
    expect(allopark()).toEqual([urlOf('parking@example.com')]);
    expect(read).toHaveBeenCalledTimes(2);
    expect(await prisma.reservation.count()).toBe(1);
  });

  it('10/10/2026 (relecture) : une modification que seul le texte annonce attend Claude ; lue comme une annulation ou sans réponse, rien n’est ouvert ni changé, le mail reste « À traiter »', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    // The booking is already there (its confirmation, complete); Allopark's page now shows a later return.
    expect((await post([item(op.address, filled)])).body.imported).toBe(1);
    const before = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    const later = page.replace('name="date_out" value="2026-10-03 17:00:00"', 'name="date_out" value="2026-10-04 17:00:00"');
    answer(url => (url.includes(`email=${encodeURIComponent('parking@example.com')}`) ? new Response(later, { status: 200 }) : new Response(home)));
    fetchMock.mockClear();
    read.mockClear();
    const change = (text: string) =>
      item('parking@example.com', `Allopark\n${text}`, { Recipients: [op.address], Subject: 'Modification de votre réservation AL-884880719' });

    // The wording says « modification », Claude reads a cancellation the patterns do not know: nothing is done.
    read.mockResolvedValueOnce(claude({ kind: 'cancellation', summary: 'Annulation de la réservation AL-884880719' }));
    expect((await post([change('Suite à votre demande, plus de séjour au parking.')])).body).toEqual({
      received: 1,
      imported: 0,
      toCheck: 1,
      ignored: 0,
    });
    expect(allopark()).toEqual([]);
    const cancelled = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id }, orderBy: { receivedAt: 'desc' } });
    expect(cancelled).toMatchObject({ status: 'unrecognised', reservationId: null, change: null, reading: { kind: 'cancellation' } });

    // Claude does not answer: the email waits, nothing opened, nothing changed; « Relancer l'analyse » tries again.
    expect((await post([change('Vos nouvelles dates : du 1er au 4 octobre.')])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    expect(allopark()).toEqual([]);
    expect(read).toHaveBeenCalledTimes(2);
    const waiting = await prisma.inboundEmail.findFirstOrThrow({
      where: { operatorId: op.operator.id, status: 'unrecognised', reading: { equals: Prisma.DbNull } },
    });
    expect(waiting).toMatchObject({ reservationId: null, change: null, pageLookup: null });
    const now = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect([now.returnAt, now.updatedAt]).toEqual([before.returnAt, before.updatedAt]);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.updated', entityId: before.id } })).toBe(0);

    // Claude reads the change at the re-analysis: applied from the page.
    read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Nouvelles dates pour la réservation AL-884880719' }));
    const res = await api().post(`/api/internal/inbound/emails/${waiting.id}/reanalyse`).set(auth(op.token));
    expect([res.body.outcome, res.body.email.status, res.body.email.change?.applied]).toEqual(['changed', 'imported', true]);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).returnAt.toISOString()).toBe('2026-10-04T15:00:00.000Z');
  });

  it('10/10/2026 (relecture) : un mail qui nomme deux réservations (l’objet l’une, le texte l’autre) n’applique jamais la page de l’une à l’autre', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    // AL-111111 is a booking of the parking, its own dates and traveller.
    expect((await post([item(op.address, filled)])).body.imported).toBe(1);
    const theirs = await prisma.reservation.update({
      where: { operatorId_externalReference: { operatorId: op.operator.id, externalReference: 'AL-884880719' } },
      data: { externalReference: 'AL-111111' },
    });
    // Allopark's page of AL-884880719 shows a later return than AL-111111's.
    const later = page.replace('name="date_out" value="2026-10-03 17:00:00"', 'name="date_out" value="2026-10-04 17:00:00"');
    answer(url => (url.includes(`email=${encodeURIComponent('parking@example.com')}`) ? new Response(later, { status: 200 }) : new Response(home)));
    fetchMock.mockClear();
    // Its subject names AL-111111, its text quotes AL-884880719 (a thread forwarded by hand); Claude reads a change.
    read.mockResolvedValue(claude({ kind: 'modification', externalReference: 'AL-111111', summary: 'Modification de la réservation AL-111111' }));
    const mixed = item('parking@example.com', email, { Recipients: [op.address], Subject: 'Votre réservation AL-111111' });
    expect((await post([mixed])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    // The page read for AL-884880719 is not used for AL-111111: AL-111111's page is opened, which Allopark does not show.
    expect(allopark().some(u => u.includes('reference=AL-111111'))).toBe(true);
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: theirs.id } });
    expect([after.updatedAt, after.externalReference]).toEqual([theirs.updatedAt, 'AL-111111']);
    expect(await prisma.reservation.count()).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.updated', entityId: theirs.id } })).toBe(0);
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, subject: 'Votre réservation AL-111111' } });
    expect(row).toMatchObject({ status: 'unrecognised', reservationId: null, change: null });
  });

  it('10/10/2026 (« C’est une modification ») : une modification que rien ne signale, que Claude lit comme telle, est appliquée depuis la page', async () => {
    const op = await connected();
    answer(pageFor('parking@example.com'));
    // The booking is already there (its confirmation, complete).
    expect((await post([item(op.address, filled)])).body.imported).toBe(1);
    const before = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // Allopark's page now shows a later return.
    const later = page.replace('name="date_out" value="2026-10-03 17:00:00"', 'name="date_out" value="2026-10-04 17:00:00"');
    answer(url => (url.includes(`email=${encodeURIComponent('parking@example.com')}`) ? new Response(later, { status: 200 }) : new Response(home)));
    const info = jest.spyOn(logger, 'info');
    try {
      read.mockResolvedValueOnce(claude({ kind: 'modification', summary: 'Nouvelles dates pour la réservation AL-884880719' }));
      const change = item('parking@example.com', 'Allopark\nVotre séjour AL-884880719 : du 2 octobre 2026 - 08:30 au 4 octobre 2026 - 17:00.', {
        Recipients: [op.address],
        Subject: 'Votre séjour AL-884880719',
      });
      expect((await post([change])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
      expect(allopark()).toEqual([urlOf('parking@example.com')]);
      expect(read).toHaveBeenCalledTimes(1);
      expect(info.mock.calls.map(([m]) => String(m))).toEqual(
        expect.arrayContaining([expect.stringMatching(/^\[Allopark\] AL-884880719: change applied to the booking \(.*returnAt.*\)$/)]),
      );
    } finally {
      info.mockRestore();
    }
    const row = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id, subject: 'Votre séjour AL-884880719' } });
    // Claude's reading stays with the email; the change says what was applied.
    expect(row).toMatchObject({ status: 'imported', provider: 'Allopark', reservationId: before.id, reading: { kind: 'modification' } });
    expect((row.change as { applied: boolean; changes: unknown[] }).applied).toBe(true);
    expect((row.change as { changes: unknown[] }).changes).toEqual(
      expect.arrayContaining([{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-04T17:00' }]),
    );
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).returnAt.toISOString()).toBe('2026-10-04T15:00:00.000Z');
    expect(await prisma.reservation.count()).toBe(1);
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
        // 10/10/2026: the link, then the manager's address (not opened: the link showed the booking).
        '[Allopark] AL-884880719: importer, 3 allopark.com link(s), confirmation link yes, 2 page(s) to try',
        '[Allopark] AL-884880719 page 1/2: HTTP 200 /fr/confirmation, booking form yes, reference yes',
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
    // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): the link first, then the recipients' pages.
    expect(allopark().map(([u]) => String(u))).toEqual([linkPageUrl, pageUrl, pageUrl.replace('parking%40example.com', 'gerant%40example.com')]);
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

describe('Allopark : prix de la page et vérification anti-robot (10/10/2026, « Prévent captcha, et récupère aussi le prix »)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  const urlOf = (address: string, reference = 'AL-884880719') =>
    `https://www.allopark.com/fr-be/confirmation?email=${encodeURIComponent(address)}&reference=${reference}&view=parking`;
  const link =
    '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
  const challenge =
    '<!DOCTYPE html><html><head><title>Just a moment...</title></head><body><div id="challenge-stage"></div><script>window._cf_chl_opt={cType: "managed"}</script></body></html>';
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const reader = Container.get(EmailReadingService);
  let read: jest.SpyInstance;
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/')).map(([u]) => String(u));
  const answer = (respond: (url: string) => Response) =>
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? respond(String(url)) : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    return { ...op, address: settings.body.address as string };
  };
  /** A forwarded email: addressed to the parking's mailbox (then the manager's: two pages to try), no link. */
  const forwarded = (address: string, subject: string, text = email) =>
    item('parking@example.com', text, { Recipients: [address], Subject: subject, To: [{ Name: 'Parking', Address: 'parking@example.com' }] });
  const bySubject = async (operatorId: string, subject: string) => prisma.inboundEmail.findFirstOrThrow({ where: { operatorId, subject } });
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    read = jest.spyOn(reader, 'read').mockResolvedValue(null);
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    read.mockRestore();
  });

  it('sans montant dans le mail, la réservation prend le montant payé de la page ; celui du mail reste quand il y est', async () => {
    const op = await connected();
    const cheaper = page.replace('</span>34,99</div>', '</span>24,00</div>');
    answer(() => new Response(cheaper, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
    const noAmount = email.replace('€ 34,99\n', '');
    expect(parseConfirmationEmail(noAmount)).not.toHaveProperty('priceCents');
    expect((await post([item(op.address, noAmount, { RawHtmlBody: link })])).body.imported).toBe(1);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({
      plate: 'GK-318-PX',
      priceCents: 2400,
    });

    await prisma.reservation.deleteMany({ where: { operatorId: op.operator.id } });
    expect((await post([item(op.address, email, { RawHtmlBody: link })])).body.imported).toBe(1);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({ priceCents: 3499 });
  });

  it('403 « cf-mitigated: challenge » : une seule page demandée, le mail reste « À traiter » avec la page à ouvrir à la main, un journal sans adresse', async () => {
    const op = await connected();
    const warn = jest.spyOn(logger, 'warn');
    try {
      answer(() => new Response(challenge, { status: 403, headers: { 'cf-mitigated': 'challenge', 'Content-Type': 'text/html' } }));
      expect((await post([forwarded(op.address, 'protégée')])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
      // Two candidates (the parking's mailbox, the manager's): Allopark is asked once, never again for this email.
      expect(allopark()).toEqual([urlOf('parking@example.com')]);
      // Claude is still asked for what the page did not give.
      expect(read).toHaveBeenCalledTimes(1);
      const row = await bySubject(op.operator.id, 'protégée');
      expect(row).toMatchObject({
        status: 'incomplete',
        missing: ['customerPhone', 'plate'],
        pageLookup: { outcome: 'protected', url: urlOf('parking@example.com'), at: expect.any(String) },
      });
      const logged = warn.mock.calls.map(([message]) => String(message)).filter(m => m.startsWith('[Allopark]'));
      expect(logged).toContain(
        '[Allopark] AL-884880719: page protected by an anti-robot check (captcha), left to the staff (page 1/2, HTTP 403 /fr-be/confirmation)',
      );
      for (const message of logged) expect(message).not.toMatch(/@|%40|email=/);
    } finally {
      warn.mockRestore();
    }

    // The inbox shows it, with the page to open.
    const inbox = (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.data;
    expect(inbox[0].pageLookup).toEqual({ outcome: 'protected', url: urlOf('parking@example.com'), at: expect.any(String) });

    // « Relancer l'analyse » once the check is gone: the page is read, the booking made, the link forgotten.
    fetchMock.mockClear();
    answer(() => new Response(page, { status: 200 }));
    const again = await api().post(`/api/internal/inbound/emails/${inbox[0].id}/reanalyse`).set(auth(op.token));
    expect(again.body).toMatchObject({ outcome: 'imported', email: { pageLookup: { outcome: 'read', url: null } } });
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: inbox[0].id } })).pageLookup).toMatchObject({ outcome: 'read', url: null });
  });

  it('page 200 « Just a moment » ou Turnstile sans formulaire : protégée ; la vraie page (script de Cloudflare compris) : lue ; 500 : indisponible ; une autre réservation : introuvable', async () => {
    const op = await connected();
    answer(() => new Response('<html><head><title>Just a moment...</title></head><body></body></html>', { status: 200 }));
    await post([forwarded(op.address, 'just a moment')]);
    expect(allopark()).toHaveLength(1);
    fetchMock.mockClear();
    answer(() => new Response('<html><body><div class="cf-turnstile" data-sitekey="0x4AAA"></div></body></html>', { status: 200 }));
    await post([forwarded(op.address, 'turnstile')]);
    expect(allopark()).toHaveLength(1);

    answer(() => new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
    expect((await post([item(op.address, email, { Subject: 'lue', RawHtmlBody: link })])).body.imported).toBe(1);

    fetchMock.mockClear();
    answer(() => new Response('Internal Server Error', { status: 500 }));
    await post([forwarded(op.address, 'en panne')]);
    // An error is read past: both pages are tried.
    expect(allopark()).toEqual([urlOf('parking@example.com'), urlOf(op.manager.email)]);

    // The page of AL-884880719 for an email about AL-884880720, at both addresses.
    fetchMock.mockClear();
    answer(() => new Response(page, { status: 200 }));
    await post([forwarded(op.address, 'autre réservation', email.replace(/AL-884880719/g, 'AL-884880720'))]);
    expect(allopark()).toHaveLength(2);

    const lookups = Object.fromEntries(
      await Promise.all(
        ['just a moment', 'turnstile', 'lue', 'en panne', 'autre réservation'].map(async subject => [
          subject,
          (await bySubject(op.operator.id, subject)).pageLookup,
        ]),
      ),
    );
    const at = expect.any(String);
    expect(lookups).toEqual({
      'just a moment': { outcome: 'protected', url: urlOf('parking@example.com'), at },
      turnstile: { outcome: 'protected', url: urlOf('parking@example.com'), at },
      lue: { outcome: 'read', url: null, at },
      'en panne': { outcome: 'unavailable', url: urlOf('parking@example.com'), at },
      'autre réservation': { outcome: 'not_found', url: urlOf('parking@example.com', 'AL-884880720'), at },
    });
    // The inbox's view: the link for a failure only; an email whose page was never tried has none.
    const todo = (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.data as { subject: string; pageLookup: unknown }[];
    expect(todo.find(e => e.subject === 'en panne')?.pageLookup).toEqual({ outcome: 'unavailable', url: urlOf('parking@example.com'), at });
    const done = (await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token))).body.data as {
      subject: string;
      pageLookup: unknown;
    }[];
    expect(done.find(e => e.subject === 'lue')?.pageLookup).toEqual({ outcome: 'read', url: null, at });
    await post([
      item(op.address, 'Bonjour, une place pour samedi ?', { From: { Name: 'Client', Address: 'client@example.com' }, Subject: 'question' }),
    ]);
    const question = (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.data.find(
      (e: { subject: string }) => e.subject === 'question',
    );
    expect(question.pageLookup).toBeNull();
  });

  it('le rattachement et la purge de nuit effacent la page à ouvrir (elle porte une adresse)', async () => {
    const op = await connected();
    answer(() => new Response(challenge, { status: 403, headers: { 'cf-mitigated': 'challenge' } }));
    await post([forwarded(op.address, 'rattaché'), forwarded(op.address, 'purgé')]);
    const attached = await bySubject(op.operator.id, 'rattaché');
    const purged = await bySubject(op.operator.id, 'purgé');
    expect([attached.pageLookup, purged.pageLookup]).toEqual([
      expect.objectContaining({ outcome: 'protected' }),
      expect.objectContaining({ outcome: 'protected' }),
    ]);

    // « Compléter »: the staff typed the booking from the page they opened themselves.
    const created = await api().post('/api/internal/reservations').set(auth(op.token)).send({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      passengers: 3,
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerPhone: '06 12 34 56 78',
      plate: 'GK-318-PX',
    });
    expect(created.status).toBe(201);
    const res = await api()
      .post(`/api/internal/inbound/emails/${attached.id}/attach`)
      .set(auth(op.token))
      .send({ reservationId: created.body.data.id });
    expect(res.status).toBe(200);
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: attached.id } })).pageLookup).toBeNull();

    await prisma.inboundEmail.updateMany({ where: { id: purged.id }, data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    expect(await Container.get(InboundEmailService).purge()).toEqual({ textsCleared: 1, rowsDeleted: 0 });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: purged.id } })).toMatchObject({ textBody: null, pageLookup: null });
    // Purged again the next night: nothing left to clear.
    expect(await Container.get(InboundEmailService).purge()).toEqual({ textsCleared: 0, rowsDeleted: 0 });
  });
});

describe('Allopark : une modification appliquée par Plazo (10/10/2026, « C’est une modification »)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';
  const link =
    '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
  /** The booking page as Allopark shows it after the change (local times, as the page prints them). */
  const pageWith = (over: { dateIn?: string; dateOut?: string; people?: number; outbound?: string; inbound?: string } = {}) => {
    let html = page;
    if (over.dateIn) html = html.replace('name="date_in" value="2026-10-01 08:30:00"', `name="date_in" value="${over.dateIn}:00"`);
    if (over.dateOut) html = html.replace('name="date_out" value="2026-10-03 17:00:00"', `name="date_out" value="${over.dateOut}:00"`);
    if (over.people) html = html.replace(/(name="people_navette"[^>]*?value=")3(")/, `$1${over.people}$2`);
    // The page's « vol aller » is fly_arrival, its « vol retour » fly_departure.
    if (over.outbound) html = html.replace(/(name="fly_arrival"\s+value=")TO 3626(")/, `$1${over.outbound}$2`);
    if (over.inbound) html = html.replace(/(name="fly_departure"\s+value=")TO 3627(")/, `$1${over.inbound}$2`);
    return html;
  };
  /** What Allopark answers now. */
  let shown: () => Response;
  const show = (html: string) => {
    shown = () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
  };
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const reanalyse = (id: string, token: string) => api().post(`/api/internal/inbound/emails/${id}/reanalyse`).set(auth(token));
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/')).map(([u]) => String(u));
  /** The pushes sent, as OneSignal reads them. */
  const sent = () =>
    pushes().map(([, init]) => JSON.parse(String((init as RequestInit).body)) as { data: Record<string, string>; [key: string]: unknown });
  const confirmation = (to: string) => item(to, email, { RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}` });
  const modification = (to: string, subject = 'Modification de votre réservation AL-884880719') =>
    item(
      to,
      'ALLOPARK\nVotre réservation AL-884880719 chez Aeroports Parking Lyon a été modifiée.\nConsultez votre réservation pour voir ses nouvelles informations.',
      { Subject: subject, RawHtmlBody: `<p>Votre réservation a été modifiée.</p>${link}` },
    );
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    // The manager hears of every booking at once (a manager's default is the hourly digest).
    await api()
      .put('/api/internal/notifications/devices')
      .set(auth(op.token))
      .send({ subscriptionId: `sub-${op.operator.id}` });
    await api().patch('/api/internal/notifications/preferences').set(auth(op.token)).send({ bookings: 'immediate' });
    return { ...op, address: settings.body.address as string };
  };
  /** The booking as its confirmation made it (the email and its page): 1 → 3 October, 3 people. */
  const booked = async (op: { address: string; operator: { id: string } }) => {
    expect((await post([confirmation(op.address)])).body.imported).toBe(1);
    return prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
  };
  const changeRow = (operatorId: string, subject = 'Modification de votre réservation AL-884880719') =>
    prisma.inboundEmail.findFirstOrThrow({ where: { operatorId, subject }, orderBy: { receivedAt: 'desc' } });
  const unchanged = async (before: { id: string; returnAt: Date; arrivalAt: Date; passengers: number; updatedAt: Date }) => {
    const now = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect([now.arrivalAt, now.returnAt, now.passengers, now.updatedAt]).toEqual([
      before.arrivalAt,
      before.returnAt,
      before.passengers,
      before.updatedAt,
    ]);
  };

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    show(page);
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? shown() : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  });

  it('une réservation connue : dates et personnes mises à jour, historique, push « Réservation modifiée », mail rattaché ; le même mail ensuite : doublon, rien ne change', async () => {
    const op = await connected();
    const before = await booked(op);
    expect(before).toMatchObject({ passengers: 3, departureFlight: 'TO 3626', customerEmail: 'jean.dupont@example.com', priceCents: 3499 });
    expect(sent().map(p => p.data.event)).toEqual(['created']);

    show(pageWith({ dateOut: '2026-10-05 18:00', people: 4 }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    expect(allopark().slice(-1)).toEqual([pageUrl]);
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    // 18:00 in Lyon on 5 October is 16:00 UTC.
    expect([after.returnAt.toISOString(), after.passengers, after.arrivalAt]).toEqual(['2026-10-05T16:00:00.000Z', 4, before.arrivalAt]);
    const row = await changeRow(op.operator.id);
    expect(row).toMatchObject({ status: 'imported', provider: 'Allopark', reservationId: before.id, recipients: [], links: [] });
    const changes = [
      { field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' },
      { field: 'passengers', from: 3, to: 4 },
    ];
    expect(row.change).toEqual({ applied: true, reservationId: before.id, reference: before.reference, changes, at: expect.any(String) });

    // The history: the entry of a staff member's change, by no one, with where it came from.
    const audits = await prisma.auditLog.findMany({ where: { action: 'reservation.updated', entityId: before.id } });
    expect(audits).toHaveLength(1);
    expect(audits[0].staffId).toBeNull();
    expect(audits[0].details).toEqual({
      returnAt: { from: before.returnAt.toISOString(), to: '2026-10-05T16:00:00.000Z' },
      passengers: { from: 3, to: 4 },
      by: 'inbound_email',
      source: 'allopark_change',
      provider: 'Allopark',
      inboundEmailId: row.id,
    });

    // The team hears of it: the reference and what changed, nothing more of the traveller.
    const push = sent().find(p => p.data.event === 'changed');
    expect(push).toMatchObject({
      include_subscription_ids: [`sub-${op.operator.id}`],
      headings: { fr: 'Réservation modifiée · Allopark' },
      contents: { fr: 'AL-884880719 · retour 5 oct. 18:00 · 4 personnes' },
      data: { type: 'booking', event: 'changed', reservationId: before.id },
    });

    // The inbox shows it in « Traités », with what was applied.
    const done = await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token));
    expect(done.body.data.find((e: { id: string }) => e.id === row.id)).toMatchObject({
      status: 'imported',
      reservationReference: before.reference,
      change: { applied: true, reason: null, reservationId: before.id, reference: before.reference, changes },
    });

    // The same email again (forwarded twice): the booking is up to date, nothing changes, nobody is told.
    const updated = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    const again = await changeRow(op.operator.id);
    expect(again.id).not.toBe(row.id);
    expect(again).toMatchObject({ status: 'duplicate', reservationId: before.id });
    expect(again.change).toEqual({ applied: false, reservationId: before.id, reference: before.reference, changes: [], at: expect.any(String) });
    await unchanged(updated);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.updated', entityId: before.id } })).toBe(1);
    expect(sent().filter(p => p.data.event === 'changed')).toHaveLength(1);
  });

  it('une réservation que Plazo n’a pas encore : créée depuis la page', async () => {
    const op = await connected();
    show(pageWith({ dateOut: '2026-10-05 18:00', people: 4 }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'AL-884880719',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      plate: 'GK-318-PX',
      passengers: 4,
      returnFlight: 'TO 3627',
      priceCents: 3499,
    });
    expect(booking.returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
    expect(await changeRow(op.operator.id)).toMatchObject({ status: 'imported', reservationId: booking.id, change: null });
    expect(sent().map(p => p.data.event)).toEqual(['created']);
  });

  it('une réservation rendue : rien n’est appliqué, le mail reste « À traiter » avec les changements (reservation_closed)', async () => {
    const op = await connected();
    const booking = await booked(op);
    const before = await prisma.reservation.update({ where: { id: booking.id }, data: { status: 'returned', returnedAt: new Date() } });
    show(pageWith({ dateOut: '2026-10-05 18:00', people: 4 }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    await unchanged(before);
    const row = await changeRow(op.operator.id);
    expect(row).toMatchObject({ status: 'unrecognised', provider: 'Allopark', reservationId: null });
    expect(row.change).toEqual({
      applied: false,
      reason: 'reservation_closed',
      reservationId: before.id,
      reference: before.reference,
      changes: [
        { field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' },
        { field: 'passengers', from: 3, to: 4 },
      ],
      at: expect.any(String),
    });
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([]);
    const todo = await api().get('/api/internal/inbound/emails').set(auth(op.token));
    expect(todo.body.counts.todo).toBe(1);
    expect(todo.body.data[0].change).toMatchObject({ applied: false, reason: 'reservation_closed', reference: before.reference });
  });

  it('la voiture déjà arrivée : une nouvelle arrivée n’est pas appliquée (already_arrived) ; un nouveau retour seul l’est, à la relance', async () => {
    const op = await connected();
    const booking = await booked(op);
    const before = await prisma.reservation.update({ where: { id: booking.id }, data: { status: 'arrived', arrivedAt: new Date() } });
    show(pageWith({ dateIn: '2026-10-01 10:00', dateOut: '2026-10-05 18:00' }));
    expect((await post([modification(op.address)])).body.toCheck).toBe(1);
    await unchanged(before);
    const row = await changeRow(op.operator.id);
    expect(row.status).toBe('unrecognised');
    expect(row.change).toMatchObject({
      applied: false,
      reason: 'already_arrived',
      changes: [
        { field: 'arrivalAt', from: '2026-10-01T08:30', to: '2026-10-01T10:00' },
        { field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' },
      ],
    });

    // Allopark's page keeps the arrival now: only the return moves, which is applied while the car is on the parking.
    show(pageWith({ dateOut: '2026-10-05 18:00' }));
    const res = await reanalyse(row.id, op.token);
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('changed');
    expect(res.body.email).toMatchObject({
      status: 'imported',
      reservationId: before.id,
      reservationReference: before.reference,
      change: { applied: true, reason: null, changes: [{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' }] },
    });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect([after.status, after.arrivalAt, after.returnAt.toISOString()]).toEqual(['arrived', before.arrivalAt, '2026-10-05T16:00:00.000Z']);
    // The change itself is by no one, even when a staff member asked for the analysis (traced as inbound.reanalysed).
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'reservation.updated', entityId: before.id } });
    expect(audit).toMatchObject({ staffId: null, details: { source: 'allopark_change', inboundEmailId: row.id } });
  });

  it('plus de place aux nouvelles dates : rien n’est appliqué (no_room) ; une place libérée, la relance l’applique', async () => {
    const op = await connected();
    const before = await booked(op);
    await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: 1, safetyMarginPct: 0 } });
    // Another car takes the only place from the evening of the 3rd.
    const other = await prisma.reservation.create({
      data: {
        reference: 'RTEST22',
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel: 'phone',
        arrivalAt: new Date('2026-10-03T18:00:00Z'),
        returnAt: new Date('2026-10-06T08:00:00Z'),
        passengers: 1,
        customerFirstName: 'Paul',
        customerLastName: 'Martin',
        customerName: 'Paul Martin',
        customerPhone: '06 00 00 00 00',
        plate: 'AA-111-AA',
        plateKey: 'AA111AA',
      },
    });
    show(pageWith({ dateOut: '2026-10-05 18:00' }));
    expect((await post([modification(op.address)])).body.toCheck).toBe(1);
    await unchanged(before);
    const row = await changeRow(op.operator.id);
    expect(row.change).toMatchObject({
      applied: false,
      reason: 'no_room',
      changes: [{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' }],
    });

    // Re-analysed while Allopark asks for an anti-robot check: nothing changes, the changes found before stay shown.
    shown = () => new Response('<html><title>Just a moment...</title></html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } });
    const protectedNow = await reanalyse(row.id, op.token);
    expect([protectedNow.body.outcome, protectedNow.body.email.status, protectedNow.body.email.pageLookup.outcome]).toEqual([
      'unrecognised',
      'unrecognised',
      'protected',
    ]);
    expect(protectedNow.body.email.change).toMatchObject({ applied: false, reason: 'no_room' });
    await unchanged(before);
    await prisma.inboundEmail.update({ where: { id: row.id }, data: { analysedAt: null } });

    // The other booking is cancelled: the change goes through at the next analysis.
    show(pageWith({ dateOut: '2026-10-05 18:00' }));
    await prisma.reservation.update({ where: { id: other.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
    const res = await reanalyse(row.id, op.token);
    expect([res.body.outcome, res.body.email.status, res.body.email.change.applied]).toEqual(['changed', 'imported', true]);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
  });

  it('une réservation faite sur Plazo n’est jamais changée par un mail de comparateur (plazo_booking)', async () => {
    const op = await connected();
    const booking = await booked(op);
    const before = await prisma.reservation.update({ where: { id: booking.id }, data: { channel: 'plazo', channelDetail: null } });
    show(pageWith({ people: 4 }));
    expect((await post([modification(op.address)])).body.toCheck).toBe(1);
    await unchanged(before);
    expect((await changeRow(op.operator.id)).change).toMatchObject({
      applied: false,
      reason: 'plazo_booking',
      reservationId: before.id,
      changes: [{ field: 'passengers', from: 3, to: 4 }],
    });
  });

  it('une annulation : rien, comme avant (la page n’est pas ouverte, la réservation reste)', async () => {
    const op = await connected();
    const before = await booked(op);
    fetchMock.mockClear();
    const res = await post([
      item(op.address, 'ALLOPARK\nVotre réservation AL-884880719 a été annulée.', {
        Subject: 'Annulation de votre réservation AL-884880719',
        RawHtmlBody: `<p>Votre réservation a été annulée.</p>${link}`,
      }),
    ]);
    expect(res.body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    expect(allopark()).toEqual([]);
    await unchanged(before);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).status).toBe('upcoming');
    expect(await changeRow(op.operator.id, 'Annulation de votre réservation AL-884880719')).toMatchObject({
      status: 'unrecognised',
      change: null,
      reservationId: null,
    });
  });

  it('la page protégée par une vérification anti-robot : rien ne change, le mail reste « À traiter » avec la page à ouvrir', async () => {
    const op = await connected();
    const before = await booked(op);
    shown = () => new Response('<html><title>Just a moment...</title></html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } });
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    await unchanged(before);
    const row = await changeRow(op.operator.id);
    expect(row).toMatchObject({ status: 'unrecognised', provider: 'Allopark', reservationId: null, change: null });
    expect(row.pageLookup).toEqual({ outcome: 'protected', url: pageUrl, at: expect.any(String) });
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([]);
  });

  it('la réservation d’un autre loueur avec la même référence n’est jamais touchée', async () => {
    const a = await connected();
    const b = await connected();
    const theirs = await booked(a);
    show(pageWith({ people: 4 }));
    expect((await post([modification(b.address)])).body.imported).toBe(1);
    await unchanged(theirs);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.updated', entityId: theirs.id } })).toBe(0);
    // B did not have it: its own booking is made from the page.
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: b.operator.id } })).toMatchObject({
      externalReference: 'AL-884880719',
      passengers: 4,
    });
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([]);
  });

  it('10/10/2026 (relecture) : un nouveau vol remet son suivi à zéro ; des dates qui ne font pas un séjour restent à faire à la main (invalid_stay)', async () => {
    const op = await connected();
    const booking = await booked(op);
    // Both flights are tracked, the return one already landed by the tracking.
    const tracked = {
      flightStatus: 'landed' as const,
      flightScheduledAt: new Date('2026-10-03T14:00:00Z'),
      flightEstimatedAt: new Date('2026-10-03T14:05:00Z'),
      flightLandedAt: new Date('2026-10-03T14:10:00Z'),
      flightLandedSource: 'tracking' as const,
      flightTerminal: '1',
      flightGate: 'B12',
      flightCheckedAt: new Date(),
      departureStatus: 'departed' as const,
      departureScheduledAt: new Date('2026-10-01T09:00:00Z'),
      departureEstimatedAt: new Date('2026-10-01T09:10:00Z'),
      departureTerminal: '1',
      departureCheckedAt: new Date(),
    };
    await prisma.reservation.update({ where: { id: booking.id }, data: tracked });
    show(pageWith({ outbound: 'TO 3630', inbound: 'TO 3631' }));
    expect((await post([modification(op.address)])).body.imported).toBe(1);
    expect((await changeRow(op.operator.id)).change).toMatchObject({
      applied: true,
      changes: [
        { field: 'departureFlight', from: 'TO 3626', to: 'TO 3630' },
        { field: 'returnFlight', from: 'TO 3627', to: 'TO 3631' },
      ],
    });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after).toMatchObject({ departureFlight: 'TO 3630', returnFlight: 'TO 3631' });
    for (const column of Object.keys(tracked)) expect([column, after[column as keyof typeof after]]).toEqual([column, null]);

    // A landing the traveller reported stays theirs when the return flight changes again.
    const landed = new Date('2026-10-03T14:20:00Z');
    await prisma.reservation.update({ where: { id: booking.id }, data: { flightLandedAt: landed, flightLandedSource: 'traveller' } });
    show(pageWith({ outbound: 'TO 3630', inbound: 'TO 3633' }));
    await post([modification(op.address)]);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).toMatchObject({
      returnFlight: 'TO 3633',
      flightLandedAt: landed,
      flightLandedSource: 'traveller',
    });

    // The page now ends the stay before it begins: nothing applied, the change waits with its reason.
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } });
    show(pageWith({ dateOut: '2026-09-30 10:00', outbound: 'TO 3630', inbound: 'TO 3633' }));
    expect((await post([modification(op.address)])).body.toCheck).toBe(1);
    await unchanged(before);
    expect((await changeRow(op.operator.id)).change).toMatchObject({
      applied: false,
      reason: 'invalid_stay',
      changes: [{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-09-30T10:00' }],
    });
  });

  it('10/10/2026 (relecture) : un gérant au récapitulatif horaire (son réglage par défaut) apprend aussi la modification ; « jamais » : rien', async () => {
    const op = await connected();
    const before = await booked(op);
    await api().patch('/api/internal/notifications/preferences').set(auth(op.token)).send({ bookings: 'hourly' });
    show(pageWith({ people: 4 }));
    await post([modification(op.address)]);
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([
      expect.objectContaining({
        include_subscription_ids: [`sub-${op.operator.id}`],
        headings: expect.objectContaining({ fr: 'Réservation modifiée · Allopark' }),
      }),
    ]);

    await api().patch('/api/internal/notifications/preferences').set(auth(op.token)).send({ bookings: 'never' });
    show(pageWith({ people: 5 }));
    await post([modification(op.address)]);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).passengers).toBe(5);
    expect(sent().filter(p => p.data.event === 'changed')).toHaveLength(1);
  });

  it('10/10/2026 (relecture) : relancé quand la page ne répond pas, un mail pré-rempli que le texte dit maintenant une modification garde ses champs', async () => {
    const op = await connected();
    shown = () => new Response('<html><title>Just a moment...</title></html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } });
    const parsed = {
      provider: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerName: 'Jean Dupont',
      priceCents: 3499,
    };
    // Stored « Incomplet » by an earlier analysis (the importer's fields), its text now read as a change.
    const row = await prisma.inboundEmail.create({
      data: {
        operatorId: op.operator.id,
        status: 'incomplete',
        fromAddress: 'info@allopark.com',
        fromName: 'ALLOPARK',
        subject: 'Votre séjour AL-884880719',
        textBody: 'ALLOPARK\nRéservation AL-884880719\nVos nouvelles dates : du 1er au 3 octobre.',
        provider: 'Allopark',
        parsed,
        missing: ['customerPhone', 'plate'],
        recipients: ['parking@example.com'],
      },
    });
    const res = await reanalyse(row.id, op.token);
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('incomplete');
    expect(res.body.email).toMatchObject({
      status: 'incomplete',
      parsed: expect.objectContaining({ externalReference: 'AL-884880719', priceCents: 3499, returnAt: '2026-10-03T17:00' }),
      missing: ['customerPhone', 'plate'],
      pageLookup: { outcome: 'protected' },
      change: null,
    });
    expect(allopark()).toEqual([pageUrl]);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('le rattachement et la purge de nuit effacent les changements (données personnelles)', async () => {
    const op = await connected();
    const booking = await booked(op);
    await prisma.reservation.update({ where: { id: booking.id }, data: { status: 'returned', returnedAt: new Date() } });
    show(pageWith({ people: 4 }));
    await post([modification(op.address, 'Votre réservation AL-884880719 a été modifiée'), modification(op.address, 'Modification AL-884880719')]);
    const attached = await changeRow(op.operator.id, 'Votre réservation AL-884880719 a été modifiée');
    const purged = await changeRow(op.operator.id, 'Modification AL-884880719');
    expect([attached.change, purged.change]).toEqual([
      expect.objectContaining({ reason: 'reservation_closed' }),
      expect.objectContaining({ reason: 'reservation_closed' }),
    ]);

    const res = await api().post(`/api/internal/inbound/emails/${attached.id}/attach`).set(auth(op.token)).send({ reservationId: booking.id });
    expect(res.status).toBe(200);
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: attached.id } })).change).toBeNull();

    await prisma.inboundEmail.updateMany({ where: { id: purged.id }, data: { receivedAt: new Date(Date.now() - 31 * 86400000) } });
    expect(await Container.get(InboundEmailService).purge()).toEqual({ textsCleared: 1, rowsDeleted: 0 });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: purged.id } })).toMatchObject({ textBody: null, change: null });
    expect(await Container.get(InboundEmailService).purge()).toEqual({ textsCleared: 0, rowsDeleted: 0 });
  });
});

describe('Allopark : vol illisible, réservation saisie sans référence, page après un mauvais lien (10/10/2026, « Tu n’as pas récupéré le prix pour la modif »)', () => {
  const page = readFileSync(join(__dirname, 'fixtures/allopark-page.html'), 'utf8');
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';
  const link =
    '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>';
  /**
   * The booking page as the traveller filled it: flights Allopark lets through but that are no flight numbers
   * (« U2AB3C »), the price paid (« € 26,00 »), the stay and the people changed.
   */
  const pageWith = (over: { outbound?: string; inbound?: string; price?: string; dateOut?: string; people?: number } = {}) => {
    let html = page;
    if (over.outbound) html = html.replace(/(name="fly_arrival"\s+value=")TO 3626(")/, `$1${over.outbound}$2`);
    if (over.inbound) html = html.replace(/(name="fly_departure"\s+value=")TO 3627(")/, `$1${over.inbound}$2`);
    if (over.price) html = html.replace('</span>34,99</div>', `</span>${over.price}</div>`);
    if (over.dateOut) html = html.replace('name="date_out" value="2026-10-03 17:00:00"', `name="date_out" value="${over.dateOut}:00"`);
    if (over.people) html = html.replace(/(name="people_navette"[^>]*?value=")3(")/, `$1${over.people}$2`);
    return html;
  };
  let shown: (url: string) => Response;
  const show = (html: string) => {
    shown = () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
  };
  const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
  const allopark = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith('https://www.allopark.com/')).map(([u]) => String(u));
  const sent = () =>
    pushes().map(([, init]) => JSON.parse(String((init as RequestInit).body)) as { data: Record<string, string>; [key: string]: unknown });
  const confirmation = (to: string) => item(to, email, { RawHtmlBody: `<p>Bonjour Jean Dupont,</p>${link}` });
  const modification = (to: string) =>
    item(
      to,
      'ALLOPARK\nVotre réservation AL-884880719 chez Aeroports Parking Lyon a été modifiée.\nConsultez votre réservation pour voir ses nouvelles informations.',
      { Subject: 'Modification de votre réservation AL-884880719', RawHtmlBody: `<p>Votre réservation a été modifiée.</p>${link}` },
    );
  const connected = async () => {
    const op = await setupOperator();
    const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
    await api()
      .put('/api/internal/notifications/devices')
      .set(auth(op.token))
      .send({ subscriptionId: `sub-${op.operator.id}` });
    await api().patch('/api/internal/notifications/preferences').set(auth(op.token)).send({ bookings: 'immediate' });
    return { ...op, address: settings.body.address as string };
  };
  const lastRow = (operatorId: string) => prisma.inboundEmail.findFirstOrThrow({ where: { operatorId }, orderBy: { receivedAt: 'desc' } });
  /** A booking typed by hand in the pro space, from the inbox's « Compléter » before the page was read: no reference. */
  const typed = async (token: string, over: Record<string, unknown> = {}) => {
    const res = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send({
        channel: 'aggregator',
        channelDetail: 'Allopark',
        arrivalAt: '2026-10-01T08:30',
        returnAt: '2026-10-03T17:00',
        passengers: 3,
        customerFirstName: 'Jean',
        customerLastName: 'Dupont',
        customerPhone: '06 12 34 56 78',
        plate: 'gk 318 px',
        ...over,
      });
    expect(res.status).toBe(201);
    return prisma.reservation.findUniqueOrThrow({ where: { id: res.body.data.id } });
  };
  const returnLine = 'Vol retour indiqué par Allopark : U2AB3C (numéro non reconnu)';

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    show(page);
    fetchMock.mockImplementation(async url =>
      String(url).includes('allopark.com') ? shown(String(url)) : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
  });

  it('une modification d’une réservation inconnue dont la page a un vol retour illisible : créée avec son prix, sans ce vol, le texte dans les notes ; un journal qui ne nomme que le champ', async () => {
    const op = await connected();
    const warn = jest.spyOn(logger, 'warn');
    try {
      show(pageWith({ inbound: 'U2AB3C', price: '26,00', people: 2 }));
      expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
      const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
      expect(booking).toMatchObject({
        channel: 'aggregator',
        channelDetail: 'Allopark',
        externalReference: 'AL-884880719',
        priceCents: 2600,
        passengers: 2,
        plate: 'GK-318-PX',
        departureFlight: 'TO 3626',
        returnFlight: null,
        notes: returnLine,
      });
      expect(await lastRow(op.operator.id)).toMatchObject({ status: 'imported', reservationId: booking.id });
      const logged = warn.mock.calls.map(([message]) => String(message));
      expect(logged).toContain('[Import] Allopark: returnFlight is no flight number, dropped and kept in the notes');
      for (const message of logged) expect(message).not.toMatch(/U2AB3C|@|Dupont/);
    } finally {
      warn.mockRestore();
    }
  });

  it('une confirmation dont la page a des vols illisibles : créée, les deux vols dans les notes ; un formulaire du personnel les refuse toujours', async () => {
    const op = await connected();
    show(pageWith({ outbound: 'EZ4BXYZ', inbound: 'U2AB3C' }));
    expect((await post([confirmation(op.address)])).body.imported).toBe(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({
      externalReference: 'AL-884880719',
      priceCents: 3499,
      departureFlight: null,
      returnFlight: null,
      notes: `Vol aller indiqué par Allopark : EZ4BXYZ (numéro non reconnu)\n${returnLine}`,
    });
    const refused = await api().patch(`/api/internal/reservations/${booking.id}`).set(auth(op.token)).send({ returnFlight: 'U2AB3C' });
    expect([refused.status, refused.body.fields]).toEqual([400, { returnFlight: 'invalid_flight' }]);
  });

  it('une modification avec un vol illisible sur la page : jamais un changement de vol ; le texte dans les notes une seule fois', async () => {
    const op = await connected();
    expect((await post([confirmation(op.address)])).body.imported).toBe(1);
    const before = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(before).toMatchObject({ returnFlight: 'TO 3627', notes: null });

    // The flight alone became unreadable: nothing changes, the text joins the notes quietly.
    show(pageWith({ inbound: 'U2AB3C' }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    let row = await lastRow(op.operator.id);
    expect(row).toMatchObject({ status: 'duplicate', reservationId: before.id });
    expect(row.change).toMatchObject({ applied: false, changes: [] });
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } })).toMatchObject({ returnFlight: 'TO 3627', notes: returnLine });
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([]);

    // Then the return moves: the change has no flight in it, the line is not written twice.
    show(pageWith({ inbound: 'U2AB3C', dateOut: '2026-10-05 18:00' }));
    expect((await post([modification(op.address)])).body.imported).toBe(1);
    row = await lastRow(op.operator.id);
    expect(row.change).toMatchObject({ applied: true, changes: [{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' }] });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect(after).toMatchObject({ returnFlight: 'TO 3627', notes: returnLine });
    expect(after.returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
    const pushed = sent().filter(p => p.data.event === 'changed');
    expect(pushed).toHaveLength(1);
    expect(pushed[0].contents).toMatchObject({ fr: 'AL-884880719 · retour 5 oct. 18:00' });
  });

  it('une réservation saisie à la main sans la référence (même plaque, séjour qui chevauche) reçoit la référence et la modification, prix compris', async () => {
    const op = await connected();
    const other = await connected();
    const hand = await typed(op.token);
    const theirs = await typed(other.token);
    // Not the booking: another car, a cancelled one, another stay.
    await typed(op.token, { plate: 'AB-123-CD' });
    const cancelled = await typed(op.token);
    await prisma.reservation.update({ where: { id: cancelled.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
    await typed(op.token, { arrivalAt: '2026-11-01T08:30', returnAt: '2026-11-03T17:00' });

    show(pageWith({ dateOut: '2026-10-05 18:00', people: 4 }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: hand.id } });
    expect(after).toMatchObject({ externalReference: 'AL-884880719', passengers: 4, priceCents: 3499 });
    expect(after.returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(4);
    const row = await lastRow(op.operator.id);
    expect(row).toMatchObject({ status: 'imported', reservationId: hand.id });
    expect(row.change).toMatchObject({ applied: true, reservationId: hand.id, reference: hand.reference });
    expect((row.change as { changes: { field: string }[] }).changes.map(c => c.field)).toEqual(
      expect.arrayContaining(['returnAt', 'passengers', 'priceCents']),
    );
    // The history says where the reference came from, by no staff member.
    const linked = await prisma.auditLog.findFirstOrThrow({
      where: { entityId: hand.id, action: 'reservation.updated', details: { path: ['externalReference', 'to'], equals: 'AL-884880719' } },
    });
    expect(linked.staffId).toBeNull();
    expect(linked.details).toMatchObject({ by: 'inbound_email', source: 'allopark_change', inboundEmailId: row.id });
    // Another operator's booking for the same car is never touched.
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: theirs.id } })).toMatchObject({ externalReference: null, passengers: 3 });
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: cancelled.id } })).toMatchObject({ externalReference: null });

    // The same change again: found by its reference, up to date.
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0 });
    expect(await lastRow(op.operator.id)).toMatchObject({ status: 'duplicate', reservationId: hand.id });
  });

  it('une référence tapée sans « AL- » compte comme la sienne ; celle d’un autre comparateur, non', async () => {
    const op = await connected();
    const hand = await typed(op.token, { externalReference: '884880719' });
    show(pageWith({ people: 4 }));
    expect((await post([modification(op.address)])).body.imported).toBe(1);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: hand.id } })).toMatchObject({
      externalReference: 'AL-884880719',
      passengers: 4,
    });

    const b = await connected();
    // A numeric reference of another comparator (Onepark's) is another booking: the page's is created.
    const onepark = await typed(b.token, { externalReference: '5512345', channelDetail: 'Onepark' });
    expect((await post([modification(b.address)])).body.imported).toBe(1);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: onepark.id } })).toMatchObject({ externalReference: '5512345', passengers: 3 });
    expect(await prisma.reservation.count({ where: { operatorId: b.operator.id, externalReference: 'AL-884880719' } })).toBe(1);
  });

  it('relecture : une réservation sans référence d’un autre comparateur, ou déjà rendue, n’est jamais la sienne ; « Allopark.com » tapé à la main l’est', async () => {
    const op = await connected();
    // Typed for Onepark (no reference), and an Allopark one handed back early: its planned stay still overlaps.
    const onepark = await typed(op.token, { channelDetail: 'Onepark' });
    const site = await typed(op.token, { channelDetail: 'Site du parking' });
    const returned = await typed(op.token);
    await prisma.reservation.update({ where: { id: returned.id }, data: { status: 'returned', returnedAt: new Date('2026-10-02T08:00:00Z') } });
    show(pageWith({ people: 4, price: '26,00' }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    for (const booking of [onepark, site, returned]) {
      expect(await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).toMatchObject({
        externalReference: null,
        passengers: 3,
        channelDetail: booking.channelDetail,
      });
    }
    // The page's booking is created, its price included.
    const created = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: 'AL-884880719' } });
    expect(created).toMatchObject({ channelDetail: 'Allopark', passengers: 4, priceCents: 2600 });
    expect(await lastRow(op.operator.id)).toMatchObject({ status: 'imported', reservationId: created.id });

    // « Allopark.com » typed by hand names Allopark: that booking takes the reference.
    const b = await connected();
    const hand = await typed(b.token, { channelDetail: 'Allopark.com' });
    expect((await post([modification(b.address)])).body.imported).toBe(1);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: hand.id } })).toMatchObject({
      externalReference: 'AL-884880719',
      passengers: 4,
    });
    expect(await prisma.reservation.count({ where: { operatorId: b.operator.id } })).toBe(1);
  });

  it('relecture : la référence posée sur une réservation saisie attend, sous le verrou du parking, une confirmation du même numéro en cours d’import', async () => {
    const op = await connected();
    const hand = await typed(op.token);
    const other = await typed(op.token, { plate: 'AB-123-CD' });
    let locked!: () => void;
    const lockTaken = new Promise<void>(resolve => (locked = resolve));
    let release!: () => void;
    const held = new Promise<void>(resolve => (release = resolve));
    // As createFromImport: under the parking's lock the reference is free when checked, then written.
    const confirmation = prisma.$transaction(async tx => {
      await Container.get(CapacityService).lock(tx, hand.parkingId);
      locked();
      await held;
      await tx.reservation.update({ where: { id: other.id }, data: { externalReference: 'AL-884880719' } });
    });
    await lockTaken;
    const link = Container.get(ReservationService).linkExternalReference(op.operator.id, hand.id, 'AL-884880719', {
      source: 'allopark_change',
      provider: 'Allopark',
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    release();
    // The confirmation is never refused; the link finds the reference taken.
    await expect(confirmation).resolves.toBeUndefined();
    await expect(link).resolves.toBe(false);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: hand.id } })).toMatchObject({ externalReference: null });
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: other.id } })).toMatchObject({ externalReference: 'AL-884880719' });
  });

  it('deux réservations saisies sans référence correspondent : rien n’est choisi, le mail reste « À traiter » (ambiguous)', async () => {
    const op = await connected();
    const first = await typed(op.token);
    const second = await typed(op.token, { arrivalAt: '2026-10-02T09:00', returnAt: '2026-10-04T12:00' });
    show(pageWith({ people: 4 }));
    expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0 });
    for (const booking of [first, second]) {
      expect(await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).toMatchObject({ externalReference: null, passengers: 3 });
    }
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(2);
    const row = await lastRow(op.operator.id);
    expect(row).toMatchObject({ status: 'unrecognised', reservationId: null, provider: 'Allopark' });
    expect(row.change).toEqual({ applied: false, reason: 'ambiguous', changes: [], at: expect.any(String) });
    const todo = await api().get('/api/internal/inbound/emails').set(auth(op.token));
    expect(todo.body.data[0]).toMatchObject({
      change: { applied: false, reason: 'ambiguous', reservationId: null, reference: null, changes: [] },
      parsed: { externalReference: 'AL-884880719', plate: 'GK-318-PX', passengers: 4 },
    });
    expect(sent().filter(p => p.data.event === 'changed')).toEqual([]);
  });

  it('un lien qui mène à une autre page (« gérer ma réservation ») : la page de la boîte du parking est essayée ensuite', async () => {
    const op = await connected();
    const linkUrl = 'https://www.allopark.com/fr-be/confirmation?email=contact%40parking-lys.fr&reference=AL-884880719&view=parking';
    const manage = '<html><body><h1>Gérer ma réservation</h1><form name="login"></form></body></html>';
    shown = url =>
      url === linkUrl
        ? new Response(null, { status: 302, headers: { Location: '/fr-be/gerer-ma-reservation' } })
        : url.includes('gerer-ma-reservation')
          ? new Response(manage, { status: 200 })
          : new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    const forwarded = item('parking@example.com', email, {
      Recipients: [op.address],
      To: [{ Name: 'Parking', Address: 'parking@example.com' }],
      RawHtmlBody: `<p>Bonjour Jean Dupont,</p><a href="${linkUrl.replace('%40', '@')}">Consulter ma réservation</a>`,
    });
    expect((await post([forwarded])).body.imported).toBe(1);
    expect(allopark()).toEqual([linkUrl, 'https://www.allopark.com/fr-be/gerer-ma-reservation', pageUrl]);
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } })).toMatchObject({
      externalReference: 'AL-884880719',
      plate: 'GK-318-PX',
      customerPhone: '+33 6 12 34 56 78',
    });
  });
});
