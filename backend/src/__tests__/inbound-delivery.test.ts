import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma from '@/database';
import { comparatorOf, comparatorStates, latestAutomatic, type ComparatorRow } from '@/domain/inbound-comparators';
import { deliveryOf, isAutoForwarded, looksLikeBooking } from '@/domain/inbound-delivery';
import { domainOf, isReservedDomain, providerOfDomain, providerOfMx } from '@/domain/mail-provider';
import { InboundEmailService } from '@/services/inbound-email.service';
import { MailProviderService } from '@/services/mail-provider.service';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * C + A (14/10/2026, « C puis A »): how a booking email reached the Plazo address (the comparators' table of the
 * Mails entrants block), the emails a too-wide mailbox rule sends on (set aside), the mail service the setup wizard
 * opens on, and what it ticks.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const allopark = readFileSync(join(__dirname, 'fixtures/allopark-confirmation.txt'), 'utf8')
  .replace('Nombre personne*\n', 'Nombre personne*\n3\n')
  .replace('Numéro de plaque du véhicule*\n', 'Numéro de plaque du véhicule*\nGK-318-PX\n')
  .replace('Numéro du vol retour\n', 'Numéro du vol retour\nTO 3627\n')
  .replace('Numéro de téléphone*\n', 'Numéro de téléphone*\n06 12 34 56 78\n')
  .replace('Nom*\n', 'Nom*\nDupont\n')
  .replace('Prénom*\n', 'Prénom*\nJean\n');

/** A raw email as the Cloudflare relay posts it: headers, then a plain-text body. */
function raw(headers: Record<string, string>, text: string): string {
  const lines = Object.entries({ Date: 'Tue, 14 Oct 2026 10:00:00 +0200', 'MIME-Version': '1.0', ...headers }).map(([k, v]) => `${k}: ${v}`);
  return [...lines, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', text, ''].join('\r\n');
}

const relay = (address: string, body: string) =>
  api()
    .post('/api/public/inbound/email')
    .set({
      'Content-Type': 'message/rfc822',
      'X-Inbound-Secret': 'inbound-test-secret',
      'X-Envelope-From': 'bounce@example.com',
      'X-Envelope-To': address,
    })
    .send(body);

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('comment un mail arrive (domaine)', () => {
  it('reconnaît les en-têtes d’une règle de transfert, jamais un transfert à la main', () => {
    expect(isAutoForwarded([{ key: 'x-forwarded-to', value: 'parkair@plazo.fr' }])).toBe(true);
    expect(isAutoForwarded([{ key: 'X-Forwarded-For', value: 'boss@gmail.com parkair@plazo.fr' }])).toBe(true);
    expect(isAutoForwarded([{ key: 'x-ms-exchange-inbox-rules-loop', value: 'contact@parkair.fr' }])).toBe(true);
    expect(isAutoForwarded([{ key: 'resent-to', value: 'parkair@plazo.fr' }])).toBe(true);
    expect(isAutoForwarded([{ key: 'auto-submitted', value: 'auto-forwarded' }])).toBe(true);
    expect(isAutoForwarded([{ key: 'auto-submitted', value: 'auto-replied' }])).toBe(false);
    expect(isAutoForwarded([{ key: 'subject', value: 'TR: Confirmation' }])).toBe(false);
  });

  it('direct, transféré par une règle ou à la main', () => {
    const base = { inboundDomain: 'plazo.fr', autoForwarded: false };
    expect(deliveryOf({ ...base, headerRecipients: ['parkair@plazo.fr'], fromIsComparator: true })).toBe('direct');
    // The comparator also writes to the parking's own address: still direct.
    expect(deliveryOf({ ...base, headerRecipients: ['contact@parkair.fr', 'parkair@plazo.fr'], fromIsComparator: true })).toBe('direct');
    expect(deliveryOf({ ...base, headerRecipients: ['contact@parkair.fr'], fromIsComparator: true })).toBe('forwarded');
    expect(deliveryOf({ ...base, autoForwarded: true, headerRecipients: ['parkair@plazo.fr'], fromIsComparator: false })).toBe('forwarded');
    expect(deliveryOf({ ...base, headerRecipients: ['parkair@plazo.fr'], fromIsComparator: false })).toBe('manual');
    // The former JSON payload, without headers: what the recipients say.
    expect(deliveryOf({ ...base, autoForwarded: undefined, headerRecipients: ['contact@parkair.fr'], fromIsComparator: true })).toBe('forwarded');
  });

  it('les mots d’un mail de réservation', () => {
    expect(looksLikeBooking('Confirmation de votre réservation AL-884880719', '')).toBe(true);
    expect(looksLikeBooking(null, 'Your booking at Parkair Lyon')).toBe(true);
    expect(looksLikeBooking('Dîner samedi', 'On se voit à 20 h ?')).toBe(false);
  });

  it('une ligne par comparateur : directement, par la messagerie, à la main, avant le 14/10, rien', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const at = (days: number) => new Date(now.getTime() - days * 86400000);
    const rows: ComparatorRow[] = [
      // Forwarded copies after a direct email of the last 30 days: the comparator writes to Plazo.
      { provider: 'Allopark', fromAddress: 'info@allopark.com', status: 'imported', delivery: 'forwarded', receivedAt: at(1) },
      { provider: 'Allopark', fromAddress: 'info@allopark.com', status: 'imported', delivery: 'direct', receivedAt: at(3) },
      // An email of Onepark that no importer read: its sender's domain names it.
      { provider: null, fromAddress: 'noreply@onepark.fr', status: 'unrecognised', delivery: 'forwarded', receivedAt: at(2) },
      { provider: 'Parclick', fromAddress: 'boss@parkair.fr', status: 'imported', delivery: 'manual', receivedAt: at(4) },
      // Received before Plazo told them apart.
      { provider: 'ParkMundo', fromAddress: 'info@parkmundo.com', status: 'duplicate', delivery: null, receivedAt: at(45) },
      { provider: 'Parkos', fromAddress: 'info@parkos.fr', status: 'imported', delivery: 'direct', receivedAt: at(1) },
    ];
    const providers = ['Allopark', 'Onepark', 'Parclick', 'ParkMundo', 'Zenpark'];
    expect(comparatorOf({ provider: 'allopark', fromAddress: null }, providers)).toBe('Allopark');
    expect(comparatorOf({ provider: null, fromAddress: 'boss@parkair.fr' }, providers)).toBeNull();
    expect(comparatorStates(rows, providers, now)).toEqual([
      { provider: 'Allopark', lastReceivedAt: at(1).toISOString(), lastStatus: 'imported', arrival: 'direct' },
      { provider: 'Onepark', lastReceivedAt: at(2).toISOString(), lastStatus: 'unrecognised', arrival: 'forwarded' },
      { provider: 'Parclick', lastReceivedAt: at(4).toISOString(), lastStatus: 'imported', arrival: 'manual' },
      { provider: 'ParkMundo', lastReceivedAt: at(45).toISOString(), lastStatus: 'duplicate', arrival: 'unknown' },
      { provider: 'Zenpark', lastReceivedAt: null, lastStatus: null, arrival: 'none' },
    ]);
    // The wizard's « Premier mail d'un comparateur »: the latest that came by itself, never one forwarded by hand.
    expect(latestAutomatic(rows, providers)).toEqual({ at: at(1).toISOString(), provider: 'Allopark' });
    expect(
      latestAutomatic(
        rows.filter(r => r.provider === 'Parclick'),
        providers,
      ),
    ).toBeNull();
  });

  it('la messagerie : webmail par son domaine, domaine propre par ses MX, jamais un domaine d’exemple', () => {
    expect(domainOf(' Boss@Gmail.com ')).toBe('gmail.com');
    expect(domainOf('pas une adresse')).toBeNull();
    expect(providerOfDomain('gmail.com')).toEqual({ id: 'gmail', business: false });
    expect(providerOfDomain('hotmail.fr')).toEqual({ id: 'outlook', business: false });
    expect(providerOfDomain('orange.fr')).toEqual({ id: 'other', business: false });
    expect(providerOfDomain('parkair.fr')).toBeNull();
    expect(providerOfMx(['aspmx.l.google.com.', 'alt1.aspmx.l.google.com'])).toEqual({ id: 'gmail', business: true });
    expect(providerOfMx(['parkair-fr.mail.protection.outlook.com'])).toEqual({ id: 'outlook', business: true });
    expect(providerOfMx(['mx1.mail.ovh.net'])).toEqual({ id: 'ovh', business: true });
    expect(providerOfMx(['mx.ionos.fr'])).toEqual({ id: 'other', business: true });
    expect(isReservedDomain('example.com')).toBe(true);
    expect(isReservedDomain('parking.test')).toBe(true);
    expect(isReservedDomain('parkair.fr')).toBe(false);
  });
});

describe('réception : comment le mail est arrivé, et les mails écartés (14/10/2026)', () => {
  it('un mail d’Allopark direct, un de Onepark par une règle Gmail, un transféré à la main : la ligne de chaque comparateur', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    // Allopark writes to the Plazo address itself.
    const direct = await relay(
      address,
      raw(
        {
          From: 'ALLOPARK <info@allopark.com>',
          To: address,
          Subject: 'Confirmation de votre réservation AL-884880719',
          'Message-ID': '<d1@allopark.com>',
        },
        allopark,
      ),
    );
    expect(direct.body).toEqual({ received: 1, imported: 1, toCheck: 0, ignored: 0 });
    // A Gmail filter forwards Onepark's email (no importer reads this one: it waits).
    await relay(
      address,
      raw(
        {
          From: 'Onepark <noreply@onepark.fr>',
          To: 'contact@parkair.fr',
          Subject: 'Votre réservation de parking',
          'X-Forwarded-To': address,
          'X-Forwarded-For': `contact@parkair.fr ${address}`,
          'Message-ID': '<f1@onepark.fr>',
        },
        'Bonjour, voici le récapitulatif de la réservation de parking.',
      ),
    );
    // The manager forwards a Parclick email by hand: a new email, from the parking's mailbox, to the Plazo address.
    await relay(
      address,
      raw(
        { From: 'Parkair <contact@parkair.fr>', To: address, Subject: 'TR: Réservation Parclick', 'Message-ID': '<m1@parkair.fr>' },
        'Message transféré. Réservation Parclick.',
      ),
    );
    const stored = await prisma.inboundEmail.findMany({
      where: { operatorId: op.operator.id },
      orderBy: { receivedAt: 'asc' },
      select: { fromAddress: true, delivery: true },
    });
    expect(stored).toEqual([
      { fromAddress: 'info@allopark.com', delivery: 'direct' },
      { fromAddress: 'noreply@onepark.fr', delivery: 'forwarded' },
      { fromAddress: 'contact@parkair.fr', delivery: 'manual' },
    ]);
    const settings = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(settings.comparators).toEqual([
      { provider: 'Allopark', lastReceivedAt: expect.any(String), lastStatus: 'imported', arrival: 'direct' },
      { provider: 'Onepark', lastReceivedAt: expect.any(String), lastStatus: 'unrecognised', arrival: 'forwarded' },
      { provider: 'Parclick', lastReceivedAt: null, lastStatus: null, arrival: 'none' },
      { provider: 'ParkMundo', lastReceivedAt: null, lastStatus: null, arrival: 'none' },
      { provider: 'ParkVia', lastReceivedAt: null, lastStatus: null, arrival: 'none' },
    ]);
    expect(settings.progress).toEqual({
      confirmationAt: null,
      comparatorMailAt: expect.any(String),
      comparator: expect.any(String),
      bookingAt: expect.any(String),
    });
    expect(settings.unexpected).toEqual({ count: 0, lastAt: null });
  });

  it('les mails personnels qu’une règle trop large transfère : écartés sans rien garder, comptés pour l’alerte, jamais listés', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const reader = jest.spyOn(Container.get(InboundEmailService).reader, 'read');
    const personal = (n: number, subject: string, text: string) =>
      relay(
        address,
        raw(
          {
            From: `Ami ${n} <ami${n}@example.org>`,
            To: 'contact@parkair.fr',
            Subject: subject,
            'X-Forwarded-To': address,
            'Message-ID': `<p${n}@example.org>`,
          },
          text,
        ),
      );
    const first = await personal(1, 'Dîner samedi', 'On se voit à 20 h ?');
    expect(first.body).toEqual({ received: 1, imported: 0, toCheck: 0, ignored: 1 });
    await personal(2, 'Photos des vacances', 'Les voici.');
    const set = await prisma.inboundEmail.findMany({ where: { operatorId: op.operator.id, status: 'ignored' } });
    expect(set).toHaveLength(2);
    // Nothing personal is kept, and Claude never read them.
    for (const row of set) expect(row).toMatchObject({ fromAddress: null, fromName: null, subject: null, textBody: null, delivery: 'forwarded' });
    expect(reader).not.toHaveBeenCalled();
    // An email forwarded the same way that speaks of a booking still goes through the usual reading.
    await personal(3, 'Votre réservation au restaurant', 'Table pour deux, samedi.');
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, status: 'unrecognised' } })).toBe(1);

    const settings = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(settings.unexpected).toEqual({ count: 2, lastAt: expect.any(String) });
    expect(settings.recent.map((r: { status: string }) => r.status)).toEqual(['unrecognised']);
    const inbox = (await api().get('/api/internal/inbound/emails').set(auth(op.token))).body;
    expect(inbox.counts).toEqual({ todo: 1, done: 0, archived: 0 });
    expect((await api().get('/api/internal/inbound/emails?status=ignored').set(auth(op.token))).body.data).toEqual([]);
    expect((await api().post(`/api/internal/inbound/emails/${set[0].id}/archive`).set(auth(op.token))).status).toBe(404);

    // The nightly purge deletes them after 7 days (the others stay 90).
    await prisma.inboundEmail.updateMany({ where: { operatorId: op.operator.id }, data: { receivedAt: new Date(Date.now() - 8 * 86400000) } });
    await Container.get(InboundEmailService).purge();
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id, status: 'ignored' } })).toBe(0);
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id } })).toBe(1);
  });

  it('la messagerie de l’assistant : Gmail quand Gmail a demandé à transférer, sinon celle de l’adresse du gérant', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const guess = jest.spyOn(Container.get(MailProviderService), 'guess');
    // The manager's address is on example.com: nothing is looked up, the manager picks.
    expect((await api().get('/api/internal/inbound/settings').set(auth(op.token))).body.mailProvider).toBeNull();
    guess.mockResolvedValueOnce({ id: 'ovh', business: true });
    expect((await api().get('/api/internal/inbound/settings').set(auth(op.token))).body.mailProvider).toEqual({
      id: 'ovh',
      business: true,
      email: op.manager.email,
      source: 'account',
    });
    // Gmail's confirmation names the Gmail address that forwards: Gmail, whatever the manager's address says.
    await relay(
      address,
      raw(
        {
          From: 'Gmail Team <forwarding-noreply@google.com>',
          To: address,
          Subject: '(Gmail) Confirmation de transfert – Recevez les messages de parkair.lyon@gmail.com',
        },
        'Code de confirmation : 482913507\nhttps://mail-settings.google.com/mail/vf-xyz',
      ),
    );
    const settings = (await api().get('/api/internal/inbound/settings').set(auth(op.token))).body;
    expect(settings.mailProvider).toEqual({ id: 'gmail', business: false, email: 'parkair.lyon@gmail.com', source: 'forwarding' });
    expect(settings.progress.confirmationAt).toEqual(expect.any(String));
  });
});
