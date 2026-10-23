import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma from '@/database';
import type { EmailReading } from '@/domain/email-reading';
import { stripHtml } from '@/domain/inbound-email';
import { EmailReadingService } from '@/services/email-reading.service';
import { ReservationService } from '@/services/reservation.service';
import { parseOneparkSummary } from '@/domain/importers/onepark';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 16/10/2026 (« trouve un moyen d'analyser sans passer par claude. faire du scrapping par type de mail par exemple »;
 * the Anthropic account ran out of credit that morning and every Allopark modification waited): the known mails of the
 * comparators are handled by the rules per mail type, whatever Claude does; Claude only reads the others, and when it
 * cannot (credit, key, load…) the email waits with the cause and is read again once Claude answers. The Anthropic client
 * is a fake: absent (no key), out of credit (its real 400), or answering.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const confirmationText = fixture('allopark-confirmation.txt');
const modificationHtml = fixture('allopark-modification.html');
const page = fixture('allopark-page.html');
const REF = 'AL-500000001';
const link = (ref: string) =>
  `<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=${ref}&amp;view=parking">Consulter ma réservation</a>`;
/** Allopark's booking page of `ref` (the fixture's booking, its return moved when asked). */
const pageOf = (ref: string, dateOut?: string) => {
  let html = page.replace(/AL-884880719/g, ref);
  if (dateOut) html = html.replace('name="date_out" value="2026-10-03 17:00:00"', `name="date_out" value="${dateOut}:00"`);
  return html;
};
const ALLOPARK = { Name: 'ALLOPARK', Address: 'info@allopark.com' };
const item = (to: string, text: string, over: Record<string, unknown> = {}) => ({
  Uuid: ['u1'],
  From: ALLOPARK,
  To: [{ Name: 'Parking', Address: to }],
  Subject: `Confirmation de votre réservation ${REF} chez Aeroports Parking Lyon`,
  RawTextBody: text,
  ...over,
});
/** Allopark's notice of a new booking, as a mailbox rule forwards it. */
const confirmation = (address: string, ref = REF) =>
  item('parking@example.com', confirmationText.replace(/AL-884880719/g, ref), {
    Recipients: [address],
    Subject: `Confirmation de votre réservation ${ref} chez Aeroports Parking Lyon`,
    RawHtmlBody: link(ref),
    AutoForwarded: true,
  });
/** The modification of the 16/10/2026, as a Gmail rule forwards it (its HTML only). */
const modification = (address: string, ref = REF) =>
  item('parking@example.com', '', {
    Recipients: [address],
    Subject: `Modification de votre réservation ${ref} chez Aeroports Parking Lyon`,
    RawHtmlBody: modificationHtml.replace(/AL-500000001/g, ref),
    AutoForwarded: true,
  });
/** The same, forwarded by hand from Gmail (« TR: », the forwarded header, then Allopark's message). */
const forwardedByHand = (address: string) =>
  item(
    address,
    [
      'Pour info.',
      '',
      '---------- Message transféré ---------',
      'De : ALLOPARK <info@allopark.com>',
      'Date : ven. 16 oct. 2026 à 07:12',
      `Objet : Modification de votre réservation ${REF} chez Aeroports Parking Lyon`,
      'À : <parking@example.com>',
      '',
      stripHtml(modificationHtml),
    ].join('\n'),
    {
      From: { Name: 'Parking', Address: 'parking@example.com' },
      Subject: `TR: Modification de votre réservation ${REF} chez Aeroports Parking Lyon`,
      RawHtmlBody: link(REF),
    },
  );
const parkosReading: EmailReading = {
  kind: 'booking',
  provider: 'Parkos',
  externalReference: 'PK-123456',
  arrivalAt: '2026-11-12T06:30',
  returnAt: '2026-11-19T22:15',
  customerName: 'Marie Dupont',
  customerFirstName: 'Marie',
  customerLastName: 'Dupont',
  customerPhone: '+33 6 12 34 56 78',
  customerEmail: null,
  plate: 'AB-123-CD',
  returnFlight: null,
  departureFlight: null,
  passengers: 2,
  priceCents: 18990,
  confidence: 0.92,
  summary: 'Réservation Parkos de Marie Dupont du 12 au 19 novembre',
};
const parkos = (address: string, subject = 'Nouvelle réservation PK-123456') =>
  item(address, 'Bonjour, nouvelle réservation sur Parkos pour Marie Dupont…', {
    From: { Name: 'Parkos', Address: 'noreply@parkos.fr' },
    Subject: subject,
  });
const CREDIT = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.';

const reader = Container.get(EmailReadingService);
const create = jest.fn();
type Mode = 'absent' | 'credit' | 'answering';
/** Claude as the test wants it: no key, its account out of credit (Anthropic's 400), or answering with a reading. */
const claudeIs = (mode: Mode, reading: EmailReading = parkosReading) => {
  if (mode === 'absent') delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  create.mockReset();
  if (mode === 'credit') {
    create.mockImplementation(async () => {
      throw Anthropic.APIError.generate(400, { type: 'error', error: { type: 'invalid_request_error', message: CREDIT } }, undefined, new Headers());
    });
  }
  if (mode === 'answering') {
    create.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify(reading) }],
      usage: { input_tokens: 800, output_tokens: 120 },
    });
  }
};

let fetchMock: jest.SpyInstance;
/** What Allopark's site answers, by URL. */
let allopark: (url: string) => string;
const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
const retry = () => api().post('/api/public/inbound/retry').set('X-Inbound-Secret', 'inbound-test-secret');
const connected = async () => {
  const op = await setupOperator();
  const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
  return { ...op, address: settings.body.address as string };
};
const latest = (operatorId: string) => prisma.inboundEmail.findFirstOrThrow({ where: { operatorId }, orderBy: { receivedAt: 'desc' } });

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  (reader as unknown as { client: unknown }).client = { messages: { create } };
  reader.lastCall = null;
  allopark = url => (url.includes(`reference=${REF}`) ? pageOf(REF) : '<html><body>Comparez et réservez votre parking</body></html>');
  fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async url =>
      String(url).includes('allopark.com')
        ? new Response(allopark(String(url)), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } })
        : new Response(JSON.stringify({ id: 'n1' }), { status: 200 }),
    );
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ANTHROPIC_API_KEY;
  (reader as unknown as { client: unknown }).client = undefined;
  reader.lastCall = null;
});
afterAll(() => prisma.$disconnect());

describe('les mails connus des comparateurs, sans Claude (16/10/2026)', () => {
  it('une annulation ParkVia (21/10/2026) annule la réservation attendue, une seule fois ; une voiture arrivée ou une réservation inconnue reste à l’équipe', async () => {
    const op = await connected();
    claudeIs('absent');
    const from = { From: { Name: 'ParkVia', Address: 'no-reply@mail.parkvia.com' } };
    const notice = item(op.address, fixture('parkvia-notification.txt'), { ...from, Subject: 'ParkVia - Nouvelle notification de réservation' });
    expect((await post([notice])).body).toMatchObject({ imported: 1 });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: 'PC90000001' } });
    expect(booking).toMatchObject({ status: 'upcoming', channelDetail: 'ParkVia' });

    const cancellation = (text = fixture('parkvia-cancellation.txt')) => item(op.address, text, { ...from, Subject: 'ParkVia - Cancellation' });
    await post([cancellation()]);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('cancelled');
    const row = await latest(op.operator.id);
    expect(row).toMatchObject({ status: 'imported', reservationId: booking.id });
    expect(row.reading).toMatchObject({ kind: 'cancellation', provider: 'ParkVia', rule: 'parkvia.cancellation' });
    expect(row.change).toMatchObject({ kind: 'cancellation', applied: true, changes: [{ field: 'status', from: 'upcoming', to: 'cancelled' }] });
    const history = await prisma.auditLog.findFirstOrThrow({ where: { entityId: booking.id, action: 'reservation.status_changed' } });
    expect(history.details).toMatchObject({ from: 'upcoming', to: 'cancelled', source: 'parkvia_cancellation', provider: 'ParkVia' });
    const inbox = await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token));
    expect(inbox.body.data[0].change).toMatchObject({ kind: 'cancellation', applied: true });

    // The same notice again: the booking was already cancelled, the mail is linked to it.
    await post([cancellation()]);
    expect(await latest(op.operator.id)).toMatchObject({ status: 'duplicate', reservationId: booking.id });

    // A car already on the parking: left to the staff, nothing changed.
    await prisma.reservation.update({ where: { id: booking.id }, data: { status: 'arrived', arrivedAt: new Date() } });
    await post([cancellation()]);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('arrived');
    expect(await latest(op.operator.id)).toMatchObject({
      status: 'unrecognised',
      reservationId: null,
      change: { kind: 'cancellation', applied: false, reason: 'already_arrived' },
    });

    // A booking Plazo does not have.
    await post([cancellation(fixture('parkvia-cancellation.txt').replace('PC90000001', 'PC90000002'))]);
    expect(await latest(op.operator.id)).toMatchObject({ status: 'unrecognised', change: { applied: false, reason: 'unknown_booking' } });
  });

  it('le récapitulatif Onepark (20/10/2026) complète la plaque et le numéro, garde la plaque de l’équipe et laisse à l’équipe ce qui diffère', async () => {
    const op = await connected();
    claudeIs('absent');
    const from = { From: { Name: 'Onepark', Address: 'noreply@onepark.co' } };
    const notice = item(op.address, '', { RawHtmlBody: fixture('onepark-notification-short.html'), ...from, Subject: 'Nouvelle réservation' });
    expect((await post([notice])).body).toMatchObject({ imported: 1 });
    // The second stay was typed by hand, with another plate.
    await prisma.reservation.create({
      data: {
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        reference: 'PZTEST2',
        channel: 'aggregator',
        channelDetail: 'Onepark',
        customerName: 'Jean Martin',
        customerFirstName: 'Jean',
        customerLastName: 'Martin',
        customerPhone: '06 98 76 54 32',
        plate: 'CD-456-EF',
        plateKey: 'CD456EF',
        arrivalAt: new Date('2026-10-11T04:30:00Z'),
        returnAt: new Date('2026-10-22T04:30:00Z'),
        passengers: 1,
        status: 'arrived',
      },
    });
    // Claude answers from now on: the summary is still read by its rule alone.
    claudeIs('answering');
    const summary = fixture('onepark-summary.txt');
    expect((await post([item(op.address, summary, { ...from, Subject: 'Résumé de vos réservations' })])).body).toMatchObject({
      imported: 0,
      toCheck: 0,
    });
    expect(create).not.toHaveBeenCalled();
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: '5900101' } })).toMatchObject({
      plate: 'AB-123-CD',
      customerFirstName: 'camille',
    });
    expect(await prisma.reservation.findFirstOrThrow({ where: { reference: 'PZTEST2' } })).toMatchObject({
      externalReference: '5900102',
      plate: 'CD-456-EF',
    });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(2);
    const left = await latest(op.operator.id);
    // 21/10/2026 (« Toujours dans Traités »): what is left is in its summary, the email waits for no one.
    expect(left).toMatchObject({
      status: 'handled',
      reservationId: null,
      reading: { kind: 'other', provider: 'Onepark', rule: 'onepark.summary' },
    });
    expect((left.reading as { summary: string }).summary).toBe(
      'Récapitulatif Onepark : 2 stationnements · 1 complété(s) (numéro ou plaque) · autre plaque dans Plazo : 5900102',
    );
    // Once all is known and alike, the summary needs no one: done.
    await prisma.reservation.update({ where: { reference: 'PZTEST2' }, data: { plate: 'VD274046', plateKey: 'VD274046' } });
    await post([item(op.address, summary, { ...from, Subject: 'Résumé de vos réservations  ' })]);
    expect(await latest(op.operator.id)).toMatchObject({ status: 'handled' });
  });

  it('le récapitulatif Onepark crée les séjours absents de Plazo (« Les créer », 20/10/2026), sans téléphone, une seule fois', async () => {
    const op = await connected();
    const reservations = Container.get(ReservationService);
    const stays = parseOneparkSummary(fixture('onepark-summary.txt'));
    const now = new Date('2026-10-20T12:00:00Z');
    // A car of the summary already typed by hand from the phone (same plate, same stay): it takes the number.
    await prisma.reservation.create({
      data: {
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        reference: 'PZPHONE',
        channel: 'phone',
        customerName: 'Camille Exemple',
        customerFirstName: 'Camille',
        customerLastName: 'Exemple',
        customerPhone: '06 11 22 33 44',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        arrivalAt: new Date('2026-10-23T07:00:00Z'),
        returnAt: new Date('2026-10-27T08:00:00Z'),
        passengers: 1,
      },
    });
    const report = await reservations.completeFromSummary(op.operator.id, stays, {}, now);
    expect(report).toMatchObject({ created: ['5900102'], completed: ['5900101'], missing: [], ambiguous: [] });
    expect(await prisma.reservation.findFirstOrThrow({ where: { reference: 'PZPHONE' } })).toMatchObject({ externalReference: '5900101' });
    expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: '5900102' } })).toMatchObject({
      channel: 'aggregator',
      channelDetail: 'Onepark',
      customerPhone: '',
      plate: 'VD274046',
      arrivalAt: new Date('2026-10-11T04:30:00Z'),
      returnAt: new Date('2026-10-22T04:30:00Z'),
    });
    // Read again: nothing more.
    expect(await reservations.completeFromSummary(op.operator.id, stays, {}, now)).toMatchObject({ created: [], upToDate: ['5900101', '5900102'] });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(2);
    // 21/10/2026 (« je veux voir les réservations même annulées »): a booking cancelled in Plazo is found and reported,
    // never changed nor created again.
    await prisma.reservation.update({ where: { reference: 'PZPHONE' }, data: { status: 'cancelled' } });
    expect(await reservations.completeFromSummary(op.operator.id, stays, {}, now)).toMatchObject({
      created: [],
      cancelled: ['5900101'],
      upToDate: ['5900102'],
    });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(2);
    // Cancelled without its number yet: found by its name and arrival, or its car, all the same.
    const third = await connected();
    await prisma.reservation.create({
      data: {
        operatorId: third.operator.id,
        parkingId: third.parking.id,
        reference: 'PZGONE',
        channel: 'aggregator',
        channelDetail: 'Onepark',
        customerName: 'Camille Exemple',
        customerFirstName: 'Camille',
        customerLastName: 'Exemple',
        customerPhone: '06 11 22 33 44',
        plate: '',
        plateKey: '',
        arrivalAt: new Date('2026-10-23T07:00:00Z'),
        returnAt: new Date('2026-10-27T07:00:00Z'),
        passengers: 1,
        status: 'cancelled',
      },
    });
    expect(await reservations.completeFromSummary(third.operator.id, stays, {}, now)).toMatchObject({ cancelled: ['5900101'] });
    expect(await prisma.reservation.findFirstOrThrow({ where: { reference: 'PZGONE' } })).toMatchObject({ externalReference: null, plate: '' });
    expect(await prisma.reservation.count({ where: { operatorId: third.operator.id, externalReference: '5900101' } })).toBe(0);
    // A stay already over is never created.
    const other = await connected();
    expect(await reservations.completeFromSummary(other.operator.id, stays, {}, new Date('2026-10-24T12:00:00Z'))).toMatchObject({
      created: ['5900101'],
      missing: ['5900102'],
    });
  });

  it.each<Mode>(['absent', 'credit'])(
    'Claude %s : l’avis court de Onepark (20/10/2026) crée la réservation sans numéro ni plaque, une seule fois',
    async mode => {
      const op = await connected();
      claudeIs(mode);
      const short = fixture('onepark-notification-short.html');
      const shortItem = item(op.address, '', {
        RawHtmlBody: short,
        From: { Name: 'Onepark', Address: 'noreply@onepark.co' },
        Subject: 'Nouvelle réservation',
      });
      expect((await post([shortItem])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0, setAside: 0 });
      expect(await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, channelDetail: 'Onepark' } })).toMatchObject({
        customerFirstName: 'camille',
        customerLastName: 'exemple',
        customerPhone: '+33 6 12 34 56 78',
        plate: '',
        priceCents: 2000,
      });
      // The same notice again is the same booking (same phone, name and arrival).
      expect((await post([shortItem])).body).toMatchObject({ imported: 0 });
      expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    },
  );

  it.each<Mode>(['absent', 'credit', 'answering'])(
    'Claude %s : la confirmation, la modification du 16/10 (règle Gmail, puis à la main), une modification d’une réservation inconnue, Onepark, une annulation et une réponse donnent le même résultat, sans appeler Claude',
    async mode => {
      const op = await connected();
      claudeIs(mode);

      // Allopark's notice of a new booking: imported with what its page shows.
      expect((await post([confirmation(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0, setAside: 0 });
      const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
      expect(booking).toMatchObject({ externalReference: REF, plate: 'GK-318-PX', passengers: 3 });

      // The modification of the 16/10 (its body a confirmation's, « est confirmée »): the page now shows a later return.
      allopark = url => (url.includes(`reference=${REF}`) ? pageOf(REF, '2026-10-05 18:00') : '<html></html>');
      expect((await post([modification(op.address)])).body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0, setAside: 0 });
      expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
      expect(await latest(op.operator.id)).toMatchObject({
        status: 'imported',
        reservationId: booking.id,
        change: { applied: true, changes: [{ field: 'returnAt', from: '2026-10-03T17:00', to: '2026-10-05T18:00' }] },
        reading: {
          kind: 'modification',
          provider: 'Allopark',
          source: 'rules',
          rule: 'allopark.change',
          summary: `Modification Allopark de la réservation ${REF}`,
        },
      });

      // The same forwarded by hand (« TR: »): the booking is up to date, a duplicate.
      expect((await post([forwardedByHand(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 0, setAside: 0 });
      expect(await latest(op.operator.id)).toMatchObject({ status: 'duplicate', reservationId: booking.id, reading: { kind: 'modification' } });

      // A modification of a booking Plazo did not have: created from its page.
      allopark = url => (url.includes('reference=AL-500000002') ? pageOf('AL-500000002').replace(/GK-318-PX/g, 'HJ-222-KL') : '<html></html>');
      expect((await post([modification(op.address, 'AL-500000002')])).body).toEqual({
        received: 1,
        imported: 1,
        toCheck: 0,
        ignored: 0,
        setAside: 0,
      });
      expect(await prisma.reservation.findFirstOrThrow({ where: { externalReference: 'AL-500000002' } })).toMatchObject({ plate: 'HJ-222-KL' });

      // Onepark's notice: imported by its reader.
      const onepark = fixture('onepark-notification.html');
      expect(
        (
          await post([
            item(op.address, '', { RawHtmlBody: onepark, From: { Name: 'Onepark', Address: 'noreply@onepark.co' }, Subject: 'Nouvelle réservation' }),
          ])
        ).body,
      ).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0, setAside: 0 });
      // A cancellation and a customer's reply: shown with their kind, nothing done.
      await post([item(op.address, `Allopark\nVotre réservation ${REF} a été annulée.`, { Subject: `Annulation de votre réservation ${REF}` })]);
      expect(await latest(op.operator.id)).toMatchObject({
        status: 'unrecognised',
        parsed: null,
        reading: { kind: 'cancellation', provider: 'Allopark', source: 'rules' },
      });
      await post([
        item(
          op.address,
          `Bonjour, mon vol a du retard.\n\nLe ven. 16 oct. 2026 à 07:12, ALLOPARK <info@allopark.com> a écrit :\n> ${REF} | Aeroports Parking Lyon`,
          {
            From: { Name: 'Client', Address: 'client@example.com' },
            Subject: `Re: Modification de votre réservation ${REF} chez Aeroports Parking Lyon`,
          },
        ),
      ]);
      expect(await latest(op.operator.id)).toMatchObject({ status: 'unrecognised', reading: { kind: 'other', rule: 'allopark.reply' } });

      expect(create).not.toHaveBeenCalled();
      expect(await prisma.reservation.count({ where: { status: { not: 'cancelled' } } })).toBe(3);
      // Nothing waits for Claude: no outage on any email.
      const rows = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id } });
      expect(rows.filter(r => (r.reading as { outage?: unknown } | null)?.outage)).toEqual([]);
    },
  );

  it.each<[Mode, string, number]>([
    ['absent', 'incomplete', 0],
    ['credit', 'incomplete', 1],
    ['answering', 'imported', 1],
  ])('Claude %s : une confirmation Parclick reste une réservation ; Claude ne lit que ses champs manquants (%s)', async (mode, status, calls) => {
    const op = await connected();
    claudeIs(mode, { ...parkosReading, provider: 'Parclick', externalReference: 'BQXY1234', kind: 'other' });
    // Claude reads its gaps but calls it « other »: the rules' kind stands, only its fields are taken… when it says booking.
    if (mode === 'answering') claudeIs(mode, { ...parkosReading, provider: 'Parclick', externalReference: 'BQXY1234' });
    const parclick = fixture('parclick-confirmation.html');
    await post([
      item(op.address, '', {
        RawHtmlBody: parclick,
        From: { Name: 'Parclick', Address: 'noreply@parclick.com' },
        Subject: 'Voici votre réservation !',
      }),
    ]);
    const row = await latest(op.operator.id);
    expect(row).toMatchObject({ status, provider: 'Parclick' });
    expect(create).toHaveBeenCalledTimes(calls);
    // Out of credit: the email waits with the cause, to be read again; its kind is the rules'.
    if (mode === 'credit') expect(row.reading).toMatchObject({ kind: 'booking', source: 'rules', outage: { cause: 'credit' } });
    if (mode === 'absent') expect(row.reading).toEqual(expect.objectContaining({ kind: 'booking', source: 'rules' }));
    if (mode === 'absent') expect((row.reading as { outage?: unknown }).outage).toBeUndefined();
  });
});

describe('une panne de Claude (16/10/2026, « Your credit balance is too low »)', () => {
  const age = async (id: string, minutes: number) => {
    const row = await prisma.inboundEmail.findUniqueOrThrow({ where: { id } });
    const reading = row.reading as Record<string, unknown>;
    const at = new Date(Date.now() - minutes * 60_000);
    await prisma.inboundEmail.update({
      where: { id },
      data: { reading: { ...reading, outage: { ...(reading.outage as object), at: at.toISOString() } }, analysedAt: at },
    });
  };

  it('un mail inconnu attend avec la cause, la boîte et le tableau de bord la disent, le relais le relit dès que Claude répond', async () => {
    const op = await connected();
    claudeIs('credit');
    expect((await post([parkos(op.address)])).body).toEqual({ received: 1, imported: 0, toCheck: 1, ignored: 0, setAside: 0 });
    expect(create).toHaveBeenCalledTimes(1);
    const first = await latest(op.operator.id);
    expect(first).toMatchObject({ status: 'unrecognised', reading: { outage: { cause: 'credit', at: expect.any(String) } } });

    // The inbox shows the cause (no reading by Claude), the dashboard's « Import » service too.
    const list = await api().get('/api/internal/inbound/emails').set(auth(op.token));
    expect(list.body.data[0]).toMatchObject({ id: first.id, reading: null, readingOutage: { cause: 'credit' } });
    const dashboard = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dashboard.body.services.reading).toEqual({ configured: true, outage: { cause: 'credit', at: expect.any(String) } });

    // « Relancer l'analyse » while Claude is still out of credit: the cause again.
    const relaunched = await api().post(`/api/internal/inbound/emails/${first.id}/reanalyse`).set(auth(op.token));
    expect([relaunched.body.outcome, relaunched.body.email.readingOutage?.cause]).toEqual(['unrecognised', 'credit']);
    expect(create).toHaveBeenCalledTimes(2);

    // The relay's cron: tried less than 5 minutes ago, nothing yet.
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    // Later, still out of credit: one email tried, the pass stops there (one call while Claude is down).
    await post([parkos(op.address, 'Nouvelle réservation PK-654321')]);
    const second = await latest(op.operator.id);
    await age(first.id, 6);
    await age(second.id, 7);
    expect((await retry()).body).toEqual({
      due: 0,
      tried: 0,
      outcomes: {},
      reading: { due: 2, tried: 1, outcomes: { unrecognised: 1 }, stopped: 'reading' },
    });
    expect(create).toHaveBeenCalledTimes(4);

    // Claude answers again: both are read, the booking made once, the cause gone; the dashboard is back to normal.
    claudeIs('answering');
    await age(first.id, 6);
    await age(second.id, 6);
    const back = await retry();
    expect(back.body.reading).toEqual({ due: 2, tried: 2, outcomes: { imported: 1, duplicate: 1 } });
    const rows = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id }, orderBy: { receivedAt: 'asc' } });
    expect(rows.map(r => r.status).sort()).toEqual(['duplicate', 'imported']);
    for (const row of rows)
      expect(row.reading).toEqual({
        kind: 'booking',
        provider: 'Parkos',
        confidence: 0.92,
        summary: parkosReading.summary,
        model: expect.any(String),
      });
    expect(await prisma.auditLog.count({ where: { action: 'inbound.reanalysed', staffId: null } })).toBe(3);
    const after = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(after.body.services.reading).toEqual({ configured: true, outage: null });
  });

  it('jamais un mail de plus de 7 jours, ni traité, ni sans clé Anthropic ; une panne passée ne s’affiche plus au tableau de bord après une heure', async () => {
    const op = await connected();
    claudeIs('credit');
    await post([parkos(op.address)]);
    const row = await latest(op.operator.id);
    await age(row.id, 70);
    expect((await api().get('/api/internal/dashboard').set(auth(op.token))).body.services.reading.outage).toBeNull();
    claudeIs('absent');
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    claudeIs('answering');
    // A credit run out on a Friday evening, topped up on the Monday: still read again (until 7 days).
    await prisma.inboundEmail.update({ where: { id: row.id }, data: { receivedAt: new Date(Date.now() - 3 * 86_400_000) } });
    const inbox = async () => (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body.data[0];
    expect((await inbox()).readingOutage).toMatchObject({ cause: 'credit' });
    await prisma.inboundEmail.update({ where: { id: row.id }, data: { receivedAt: new Date(Date.now() - 8 * 86_400_000) } });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    // Older, or handled meanwhile: no longer read again, so no longer promised in the inbox.
    expect((await inbox()).readingOutage).toBeNull();
    await prisma.inboundEmail.update({ where: { id: row.id }, data: { receivedAt: new Date() } });
    expect((await api().post(`/api/internal/inbound/emails/${row.id}/handle`).set(auth(op.token))).status).toBe(200);
    expect((await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token))).body.data[0]).toMatchObject({
      id: row.id,
      readingOutage: null,
    });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    // (claudeIs starts a new count.)
    expect(create).not.toHaveBeenCalled();
  });

  it('relecture : la réservation saisie à la main pendant la panne laisse le mail à l’équipe quand Claude répond, jamais deux fois la même voiture', async () => {
    const op = await connected();
    claudeIs('credit');
    await post([parkos(op.address)]);
    const row = await latest(op.operator.id);
    // Typed by phone while Claude could not read the email (half an hour off the email's arrival: no duplicate by plate).
    const typed = await api().post('/api/internal/reservations').set(auth(op.token)).send({
      channel: 'phone',
      arrivalAt: '2026-11-12T07:00',
      returnAt: '2026-11-19T22:00',
      passengers: 2,
      customerFirstName: 'Marie',
      customerLastName: 'Dupont',
      customerPhone: '+33 6 12 34 56 78',
      plate: 'AB-123-CD',
    });
    expect(typed.status).toBe(201);
    claudeIs('answering');
    await age(row.id, 6);
    expect((await retry()).body.reading).toEqual({ due: 1, tried: 1, outcomes: { incomplete: 1 } });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    const after = await latest(op.operator.id);
    expect(after).toMatchObject({ status: 'incomplete', reservationId: null, missing: ['confidence'] });
    expect(after.reading).toMatchObject({ kind: 'booking', provider: 'Parkos' });
    expect((after.reading as { outage?: unknown }).outage).toBeUndefined();
    // Read, no longer waiting for Claude: never tried again by itself.
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
  });

  it('les mails restés en attente de Claude avant les règles (le matin du 16/10) sont relus par le relais, sans Claude', async () => {
    const op = await connected();
    claudeIs('credit');
    expect((await post([confirmation(op.address)])).body.imported).toBe(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // Stored as the morning's emails were: « change announced, Claude did not answer », nothing read, nothing kept.
    const stuck = await prisma.inboundEmail.create({
      data: {
        operatorId: op.operator.id,
        status: 'unrecognised',
        fromAddress: 'info@allopark.com',
        fromName: 'ALLOPARK',
        subject: `Modification de votre réservation ${REF} chez Aeroports Parking Lyon`,
        textBody: stripHtml(modificationHtml),
        links: [`https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=${REF}&view=parking`],
        recipients: ['parking@example.com'],
        receivedAt: new Date(Date.now() - 3 * 3_600_000),
      },
    });
    allopark = url => (url.includes(`reference=${REF}`) ? pageOf(REF, '2026-10-05 18:00') : '<html></html>');
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {}, rules: { due: 1, tried: 1, outcomes: { changed: 1 } } });
    expect(await prisma.inboundEmail.findUniqueOrThrow({ where: { id: stuck.id } })).toMatchObject({
      status: 'imported',
      reservationId: booking.id,
      autoRetries: 1,
      reading: { kind: 'modification', source: 'rules' },
    });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).returnAt.toISOString()).toBe('2026-10-05T16:00:00.000Z');
    expect(create).not.toHaveBeenCalled();
    // It ends by itself: nothing more the next time.
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
  });
});
