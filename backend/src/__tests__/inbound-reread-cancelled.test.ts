import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma, { InboundEmailStatus } from '@/database';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * Review (16/10/2026, « relie les mail deja traité »): the re-reading of the emails already received never makes the
 * booking of a confirmation whose reference another email of the operator cancelled (the staff left the confirmation
 * because the traveller cancelled). No Anthropic key: Claude is never called. Fictional data only.
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const confirmationText = fixture('allopark-confirmation.txt');
const page = fixture('allopark-page.html');
const DAY = 86_400_000;
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const day = (offset: number) => new Date(Date.now() + offset * DAY);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const french = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const confirmationOf = (ref: string) =>
  confirmationText
    .replace(/AL-884880719/g, ref)
    .replace('Du 1 octobre 2026 - 08:30', `Du ${french(day(12))} - 08:30`)
    .replace('au 3 octobre 2026 - 17:00', `au ${french(day(14))} - 17:00`);
const pageOf = (ref: string) =>
  page
    .replace(/AL-884880719/g, ref)
    .replace(/name="date_in" value="2026-10-01 08:30:00"/g, `name="date_in" value="${iso(day(12))} 08:30:00"`)
    .replace(/name="date_out" value="2026-10-03 17:00:00"/g, `name="date_out" value="${iso(day(14))} 17:00:00"`);
const linkOf = (ref: string) => `https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=${ref}&view=parking`;
const retry = () => api().post('/api/public/inbound/retry').set('X-Inbound-Secret', 'inbound-test-secret');

const store = (operatorId: string, status: InboundEmailStatus, subject: string, textBody: string | null, ref: string, extra = {}) =>
  prisma.inboundEmail.create({
    data: {
      operatorId,
      fromAddress: 'info@allopark.com',
      fromName: 'ALLOPARK',
      recipients: ['parking@example.com'],
      receivedAt: new Date(Date.now() - 2 * DAY),
      status,
      subject,
      textBody,
      links: [linkOf(ref)],
      ...extra,
    },
  });

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    const ref = /reference=(AL-\d+)/.exec(String(url))?.[1];
    if (!String(url).includes('allopark.com') || !ref) return new Response('{}', { status: 200 });
    return new Response(pageOf(ref), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
  });
});
afterEach(() => fetchMock.mockRestore());
afterAll(() => prisma.$disconnect());

describe('relecture des mails déjà traités : jamais une réservation annulée par un autre mail', () => {
  it('une confirmation traitée dont la réservation a été annulée ensuite (autre mail) : rien n’est créé', async () => {
    const op = await setupOperator();
    const ref = 'AL-600000901';
    const confirmation = await store(
      op.operator.id,
      'handled',
      `Confirmation de votre réservation ${ref} chez Aeroports Parking Lyon`,
      confirmationOf(ref),
      ref,
    );
    // The cancellation the staff handled too (as Claude read it before the rules), its text since gone.
    await store(op.operator.id, 'handled', `Annulation de votre réservation ${ref}`, null, ref, {
      reading: { kind: 'cancellation', provider: 'Allopark', confidence: 0.95, summary: 'Annulation', model: 'x' },
    });
    const body = (await retry()).body;
    expect(body.reread).toBeUndefined();
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(0);
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: confirmation.id } })).status).toBe('handled');
  });

  it('la même confirmation sans annulation : la réservation est créée (témoin)', async () => {
    const op = await setupOperator();
    const ref = 'AL-600000902';
    const confirmation = await store(
      op.operator.id,
      'handled',
      `Confirmation de votre réservation ${ref} chez Aeroports Parking Lyon`,
      confirmationOf(ref),
      ref,
    );
    // A cancellation of another booking changes nothing.
    await store(op.operator.id, 'handled', 'Annulation de votre réservation AL-600000999', null, 'AL-600000999');
    expect((await retry()).body.reread).toMatchObject({ due: 1, tried: 1, outcomes: { imported: 1 } });
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, externalReference: ref } })).toBe(1);
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: confirmation.id } })).status).toBe('imported');
  });
});
