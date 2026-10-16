import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma, { InboundEmailStatus, Prisma } from '@/database';
import { stripHtml, textOf } from '@/domain/inbound-email';
import { EmailReadingService } from '@/services/email-reading.service';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 16/10/2026 (« relie les mail deja traité »): the emails received and dealt with before the rules per mail type (« À
 * traiter », or marked as handled without their booking, these 30 days) are read once more with them by the relay's
 * cron (POST /public/inbound/retry, `reread`): the bookings Plazo can now read are made, or the emails linked to the
 * booking it has; a stay that is over is never created; a booking the staff typed meanwhile leaves the email to them.
 * Claude is out of credit all along (the morning of the 16th) and never called. Fictional data only.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const confirmationText = fixture('allopark-confirmation.txt');
const modificationHtml = fixture('allopark-modification.html');
const page = fixture('allopark-page.html');
const ALLOPARK = { Name: 'ALLOPARK', Address: 'info@allopark.com' };
const DAY = 86_400_000;
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** A stay `days` from today (negative: already over), 08:30 → 17:00 two days later, in the parking's local time. */
const stayIn = (days: number) => {
  const day = (offset: number) => new Date(Date.now() + (days + offset) * DAY);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const french = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return { arrival: iso(day(0)), ret: iso(day(2)), arrivalFr: french(day(0)), returnFr: french(day(2)) };
};
type Stay = ReturnType<typeof stayIn>;
/** Allopark's notice of a new booking for `ref` and this stay. */
const confirmationOf = (ref: string, stay: Stay) =>
  confirmationText
    .replace(/AL-884880719/g, ref)
    .replace('Du 1 octobre 2026 - 08:30', `Du ${stay.arrivalFr} - 08:30`)
    .replace('au 3 octobre 2026 - 17:00', `au ${stay.returnFr} - 17:00`);
/** Allopark's booking page of `ref` for this stay (its return later when asked). */
const pageOf = (ref: string, stay: Stay, returnTime = '17:00') =>
  page
    .replace(/AL-884880719/g, ref)
    .replace(/name="date_in" value="2026-10-01 08:30:00"/g, `name="date_in" value="${stay.arrival} 08:30:00"`)
    .replace(/name="date_out" value="2026-10-03 17:00:00"/g, `name="date_out" value="${stay.ret} ${returnTime}:00"`);
const linkOf = (ref: string) => `https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=${ref}&view=parking`;

const create = jest.fn();
const reader = Container.get(EmailReadingService);
const CREDIT = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.';

let fetchMock: jest.SpyInstance;
/** The booking pages Allopark shows, by reference. */
let pages: Record<string, string>;
const post = (items: unknown[]) => api().post('/api/public/inbound/email').set('X-Inbound-Secret', 'inbound-test-secret').send({ items });
const retry = () => api().post('/api/public/inbound/retry').set('X-Inbound-Secret', 'inbound-test-secret');
const connected = async () => {
  const op = await setupOperator();
  const settings = await api().get('/api/internal/inbound/settings').set(auth(op.token));
  return { ...op, address: settings.body.address as string };
};

/** An email stored as the former code left it (no rules' reading, never analysed again), received `daysAgo`. */
const stored = (
  operatorId: string,
  over: { status: InboundEmailStatus; subject: string; textBody: string; daysAgo: number } & Partial<Prisma.InboundEmailUncheckedCreateInput>,
) => {
  const { daysAgo, ...data } = over;
  return prisma.inboundEmail.create({
    data: {
      operatorId,
      fromAddress: 'info@allopark.com',
      fromName: 'ALLOPARK',
      recipients: ['parking@example.com'],
      receivedAt: new Date(Date.now() - daysAgo * DAY),
      ...data,
    },
  });
};
const storedConfirmation = (operatorId: string, ref: string, stay: Stay, status: InboundEmailStatus, daysAgo: number, extra = {}) =>
  stored(operatorId, {
    status,
    subject: `Confirmation de votre réservation ${ref} chez Aeroports Parking Lyon`,
    textBody: confirmationOf(ref, stay),
    links: [linkOf(ref)],
    daysAgo,
    ...extra,
  });
const row = (id: string) => prisma.inboundEmail.findUniqueOrThrow({ where: { id } });

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  // Claude out of credit (Anthropic's real 400): any call would show in `create`.
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  create.mockReset();
  create.mockImplementation(async () => {
    throw Anthropic.APIError.generate(400, { type: 'error', error: { type: 'invalid_request_error', message: CREDIT } }, undefined, new Headers());
  });
  (reader as unknown as { client: unknown }).client = { messages: { create } };
  reader.lastCall = null;
  pages = {};
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    const ref = /reference=(AL-\d+)/.exec(String(url))?.[1];
    if (!String(url).includes('allopark.com')) return new Response(JSON.stringify({ id: 'n1' }), { status: 200 });
    const html = (ref && pages[ref]) || '<html><body>Comparez et réservez votre parking</body></html>';
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
  });
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ANTHROPIC_API_KEY;
  (reader as unknown as { client: unknown }).client = undefined;
  reader.lastCall = null;
});
afterAll(() => prisma.$disconnect());

describe('relecture des mails déjà traités avec les règles (16/10/2026, « relie les mail deja traité »)', () => {
  it('une modification Allopark marquée comme traitée : la page est lue, la modification appliquée, le mail rattaché', async () => {
    const op = await connected();
    const stay = stayIn(20);
    const ref = 'AL-600000001';
    pages[ref] = pageOf(ref, stay);
    const notice = {
      Uuid: ['u1'],
      From: ALLOPARK,
      To: [{ Name: 'Parking', Address: 'parking@example.com' }],
      Recipients: [op.address],
      Subject: `Confirmation de votre réservation ${ref} chez Aeroports Parking Lyon`,
      RawTextBody: confirmationOf(ref, stay),
      RawHtmlBody: `<a href="${linkOf(ref).replace(/&/g, '&amp;')}">Consulter ma réservation</a>`,
      AutoForwarded: true,
    };
    expect((await post([notice])).body.imported).toBe(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: ref } });

    // The modification the staff marked as handled while Claude could not confirm it; Allopark now shows a later return.
    const handled = await stored(op.operator.id, {
      status: 'handled',
      subject: `Modification de votre réservation ${ref} chez Aeroports Parking Lyon`,
      textBody: stripHtml(modificationHtml.replace(/AL-500000001/g, ref)),
      links: [linkOf(ref)],
      daysAgo: 3,
    });
    pages[ref] = pageOf(ref, stay, '19:00');
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {}, reread: { due: 1, tried: 1, outcomes: { changed: 1 } } });
    expect(await row(handled.id)).toMatchObject({
      status: 'imported',
      reservationId: booking.id,
      change: { applied: true, changes: [{ field: 'returnAt', from: `${stay.ret}T17:00`, to: `${stay.ret}T19:00` }] },
      reading: { kind: 'modification', provider: 'Allopark', source: 'rules', rule: 'allopark.change' },
    });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).returnAt.getTime()).toBe(
      booking.returnAt.getTime() + 2 * 3_600_000,
    );
    expect(await prisma.auditLog.findFirst({ where: { action: 'inbound.reanalysed', entityId: handled.id } })).toMatchObject({
      staffId: null,
      details: { auto: true, outcome: 'changed', from: 'handled', to: 'imported' },
    });
    // Once: nothing more the next time.
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(create).not.toHaveBeenCalled();
  });

  it('une modification Allopark relancée par l’équipe avec l’ancien code ce matin (après le commit des règles, Claude sans crédit) : relue une fois, appliquée', async () => {
    const op = await connected();
    const stay = stayIn(9);
    const ref = 'AL-600000030';
    pages[ref] = pageOf(ref, stay);
    const booking = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(op.token))
        .send({
          channel: 'aggregator',
          channelDetail: 'Allopark',
          externalReference: ref,
          arrivalAt: `${stay.arrival}T08:30`,
          returnAt: `${stay.ret}T17:00`,
          passengers: 3,
          customerFirstName: 'Paul',
          customerLastName: 'Martin',
          customerPhone: '+33 6 98 76 54 32',
          plate: 'GK-318-PX',
          force: true,
        })
    ).body.data;
    // « Relancer l'analyse » at 09:50 UTC by the former code: Claude without credit, nothing read, `analysedAt` set.
    const relaunched = await stored(op.operator.id, {
      status: 'handled',
      subject: `Modification de votre réservation ${ref} chez Aeroports Parking Lyon`,
      textBody: stripHtml(modificationHtml.replace(/AL-500000001/g, ref)),
      links: [linkOf(ref)],
      daysAgo: 0.2,
      analysedAt: new Date('2026-10-16T09:50:00Z'),
    });
    pages[ref] = pageOf(ref, stay, '19:00');
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { changed: 1 } });
    expect(await row(relaunched.id)).toMatchObject({ status: 'imported', reservationId: booking.id, change: { applied: true } });
    expect(await prisma.auditLog.count({ where: { action: 'inbound.reread', entityId: relaunched.id, staffId: null } })).toBe(1);
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(create).not.toHaveBeenCalled();
  });

  it('relu une seule fois même quand la relecture ne laisse pas la lecture des règles (la trace de la prise suffit)', async () => {
    const op = await connected();
    const past = stayIn(-20);
    const ref = 'AL-600000031';
    pages[ref] = pageOf(ref, past);
    const handled = await storedConfirmation(op.operator.id, ref, past, 'handled', 25);
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { incomplete: 1 } });
    // Whatever reading the row ends with (a staff edit, an error mid-way…), the mark keeps it from a second re-reading.
    await prisma.inboundEmail.update({ where: { id: handled.id }, data: { reading: Prisma.DbNull, analysedAt: null } });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(await prisma.auditLog.count({ where: { action: 'inbound.reanalysed', entityId: handled.id } })).toBe(1);
  });

  it('une confirmation Allopark restée « À traiter » avec une panne de Claude (il y a 10 jours) : importée par les règles, sans Claude', async () => {
    const op = await connected();
    const stay = stayIn(12);
    const ref = 'AL-600000002';
    pages[ref] = pageOf(ref, stay);
    const outage = { cause: 'credit', at: new Date(Date.now() - 10 * DAY).toISOString() };
    const waiting = await storedConfirmation(op.operator.id, ref, stay, 'unrecognised', 10, { reading: { outage } });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {}, reread: { due: 1, tried: 1, outcomes: { imported: 1 } } });
    const after = await row(waiting.id);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(booking).toMatchObject({ externalReference: ref, plate: 'GK-318-PX', passengers: 3, channelDetail: 'Allopark' });
    expect(after).toMatchObject({ status: 'imported', reservationId: booking.id, reading: { kind: 'booking', source: 'rules' } });
    expect((after.reading as { outage?: unknown }).outage).toBeUndefined();
    const inbox = await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token));
    expect(inbox.body.data[0]).toMatchObject({ id: waiting.id, readingOutage: null, reservationReference: booking.reference });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(create).not.toHaveBeenCalled();
  });

  it('un avis Onepark marqué comme traité dont la réservation existe déjà : rattaché à elle (doublon), rien de créé', async () => {
    const op = await connected();
    const onepark = fixture('onepark-notification.html');
    const item = {
      Uuid: ['u2'],
      From: { Name: 'Onepark', Address: 'noreply@onepark.co' },
      To: [{ Name: 'Parking', Address: op.address }],
      Subject: 'Nouvelle réservation',
      RawHtmlBody: onepark,
    };
    expect((await post([item])).body.imported).toBe(1);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    // The same notice, forwarded twice and marked as handled by the staff before the rules.
    const handled = await stored(op.operator.id, {
      status: 'handled',
      fromAddress: 'noreply@onepark.co',
      fromName: 'Onepark',
      subject: 'Nouvelle réservation',
      textBody: textOf({ RawHtmlBody: onepark }),
      daysAgo: 2,
    });
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { duplicate: 1 } });
    expect(await row(handled.id)).toMatchObject({ status: 'duplicate', reservationId: booking.id });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('un séjour déjà terminé n’est jamais créé : un mail traité garde son état, un mail « À traiter » est rattaché s’il a sa réservation ; une seule fois', async () => {
    const op = await connected();
    const past = stayIn(-20);
    // Over, no booking: nothing created, the handled email stays handled (« Séjour déjà terminé » for the inbox).
    const gone = 'AL-600000003';
    pages[gone] = pageOf(gone, past);
    const handled = await storedConfirmation(op.operator.id, gone, past, 'handled', 25);
    // Over, its booking made at the time (typed by the staff with its reference): the email waiting in « À traiter » is linked.
    const kept = 'AL-600000004';
    pages[kept] = pageOf(kept, past).replace(/GK-318-PX/g, 'HJ-222-KL');
    const typed = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'aggregator',
        channelDetail: 'Allopark',
        externalReference: kept,
        arrivalAt: `${past.arrival}T08:30`,
        returnAt: `${past.ret}T17:00`,
        passengers: 3,
        customerFirstName: 'Paul',
        customerLastName: 'Martin',
        customerPhone: '+33 6 98 76 54 32',
        plate: 'HJ-222-KL',
        force: true,
      });
    expect(typed.status).toBe(201);
    const waiting = await storedConfirmation(op.operator.id, kept, past, 'unrecognised', 24);
    const first = await retry();
    expect(first.body.reread).toEqual({ due: 2, tried: 2, outcomes: { incomplete: 1, duplicate: 1 } });
    expect(await row(handled.id)).toMatchObject({ status: 'handled', reservationId: null, missing: ['stay_over'] });
    expect(await row(waiting.id)).toMatchObject({ status: 'duplicate', reservationId: typed.body.data.id });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    // Once: the handled email is never read again by this pass.
    const analysedAt = (await row(handled.id)).analysedAt;
    expect(analysedAt).not.toBeNull();
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect((await row(handled.id)).analysedAt).toEqual(analysedAt);
    expect(create).not.toHaveBeenCalled();
  });

  it('la réservation saisie à la main pendant que le mail attendait : le mail reste à l’équipe, jamais deux fois la même voiture', async () => {
    const op = await connected();
    const stay = stayIn(15);
    const ref = 'AL-600000005';
    pages[ref] = pageOf(ref, stay);
    const handled = await storedConfirmation(op.operator.id, ref, stay, 'handled', 3);
    // Typed by phone after the email came (half an hour off: no duplicate by plate), without Allopark's reference.
    const typed = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: `${stay.arrival}T09:00`,
        returnAt: `${stay.ret}T17:00`,
        passengers: 3,
        customerFirstName: 'Jean',
        customerLastName: 'Dupont',
        customerPhone: '+33 6 12 34 56 78',
        plate: 'GK-318-PX',
      });
    expect(typed.status).toBe(201);
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { incomplete: 1 } });
    expect(await row(handled.id)).toMatchObject({ status: 'handled', reservationId: null, missing: ['confidence'] });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(create).not.toHaveBeenCalled();
  });

  it('la réservation saisie à la main avant même la réception du mail : le mail reste à l’équipe, pas de seconde réservation', async () => {
    const op = await connected();
    const stay = stayIn(15);
    const ref = 'AL-600000024';
    pages[ref] = pageOf(ref, stay);
    // Typed by phone (no reference) an hour before Allopark's notice came, then the notice marked as handled.
    const typed = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send({
        channel: 'phone',
        arrivalAt: `${stay.arrival}T08:30`,
        returnAt: `${stay.ret}T17:00`,
        passengers: 3,
        customerFirstName: 'Jean',
        customerLastName: 'Dupont',
        customerPhone: '+33 6 12 34 56 78',
        plate: 'GK-318-PX',
      });
    expect(typed.status).toBe(201);
    await prisma.reservation.update({ where: { id: typed.body.data.id }, data: { createdAt: new Date(Date.now() - 3 * DAY - 3_600_000) } });
    const handled = await storedConfirmation(op.operator.id, ref, stay, 'handled', 3);
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { incomplete: 1 } });
    expect(await row(handled.id)).toMatchObject({ status: 'handled', reservationId: null, missing: ['confidence'] });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('jamais : un mail archivé, de plus de 30 jours, déjà relu ou reçu depuis les règles, une annulation (même lue par Claude), un mail inconnu, un loueur suspendu, ni le mail d’une autre relecture', async () => {
    const op = await connected();
    const other = await connected();
    const stay = stayIn(10);
    const refs = ['AL-600000006', 'AL-600000007', 'AL-600000008', 'AL-600000009', 'AL-600000020', 'AL-600000021', 'AL-600000022', 'AL-600000023'];
    for (const ref of refs) pages[ref] = pageOf(ref, stay);
    const archived = await storedConfirmation(op.operator.id, refs[0], stay, 'archived', 2);
    const old = await storedConfirmation(op.operator.id, refs[1], stay, 'unrecognised', 31);
    // « Relancer l'analyse » a minute ago, with the rules: their reading is on it.
    const relaunched = await storedConfirmation(op.operator.id, refs[2], stay, 'handled', 2, {
      analysedAt: new Date(Date.now() - 60_000),
      missing: ['confidence'],
      reading: { kind: 'booking', provider: 'Allopark', confidence: 1, summary: `Réservation Allopark ${refs[2]}`, model: '', source: 'rules' },
    });
    const cancellation = await stored(op.operator.id, {
      status: 'handled',
      subject: `Annulation de votre réservation ${refs[3]}`,
      textBody: `Allopark\nVotre réservation ${refs[3]} a été annulée.`,
      links: [linkOf(refs[3])],
      daysAgo: 2,
    });
    const unknown = await stored(op.operator.id, {
      status: 'handled',
      fromAddress: 'noreply@parkos.fr',
      fromName: 'Parkos',
      subject: 'Nouvelle réservation PK-123456',
      textBody: 'Bonjour, nouvelle réservation sur Parkos pour Marie Dupont…',
      daysAgo: 2,
    });
    const suspended = await storedConfirmation(other.operator.id, refs[3], stay, 'unrecognised', 2);
    // Received since the rules are live: their reading is kept on it.
    const rulesRead = await storedConfirmation(op.operator.id, refs[4], stay, 'incomplete', 0, {
      reading: { kind: 'booking', provider: 'Allopark', confidence: 1, summary: `Réservation Allopark ${refs[4]}`, model: '', source: 'rules' },
    });
    // Read by Claude as a cancellation (a note above it, a wording the rules do not know): never touched.
    const claudeCancellation = await storedConfirmation(op.operator.id, refs[5], stay, 'handled', 2, {
      reading: { kind: 'cancellation', provider: 'Allopark', confidence: 0.9, summary: 'Annulation', model: 'claude-test' },
    });
    await prisma.operator.update({ where: { id: other.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    // Another pass's: an Allopark page not read 5 minutes ago (retryAllopark tries again at 10), an email Claude could not
    // read a minute ago (retryReading, after 5 minutes).
    const pageNotRead = await storedConfirmation(op.operator.id, refs[6], stay, 'unrecognised', 5 / 1440, {
      pageLookup: { outcome: 'not_found', url: null, at: new Date().toISOString() },
    });
    const waitingClaude = await storedConfirmation(op.operator.id, refs[7], stay, 'unrecognised', 1, {
      reading: { outage: { cause: 'credit', at: new Date(Date.now() - 60_000).toISOString() } },
    });
    const before = await prisma.inboundEmail.findMany({ orderBy: { id: 'asc' } });

    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(await prisma.inboundEmail.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    expect(await prisma.reservation.count()).toBe(0);
    for (const id of [
      archived.id,
      old.id,
      relaunched.id,
      cancellation.id,
      unknown.id,
      suspended.id,
      rulesRead.id,
      claudeCancellation.id,
      pageNotRead.id,
      waitingClaude.id,
    ])
      expect(await prisma.auditLog.count({ where: { action: 'inbound.reanalysed', entityId: id } })).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('trois mails par passage, les plus récents d’abord, puis les suivants au passage d’après', async () => {
    const op = await connected();
    const past = stayIn(-15);
    const ids: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const ref = `AL-60000001${i}`;
      pages[ref] = pageOf(ref, past);
      ids.push((await storedConfirmation(op.operator.id, ref, past, 'handled', 10 - i)).id);
    }
    expect((await retry()).body.reread).toEqual({ due: 4, tried: 3, outcomes: { incomplete: 3 } });
    // The oldest waits for the next pass.
    expect((await row(ids[0])).analysedAt).toBeNull();
    for (const id of ids.slice(1)) expect((await row(id)).analysedAt).not.toBeNull();
    expect((await retry()).body.reread).toEqual({ due: 1, tried: 1, outcomes: { incomplete: 1 } });
    expect((await retry()).body).toEqual({ due: 0, tried: 0, outcomes: {} });
    expect(await prisma.reservation.count()).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });
});
