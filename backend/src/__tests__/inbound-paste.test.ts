import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma from '@/database';
import { NotificationService } from '@/services/notification.service';
import { pastedSenderOf, pastedSubjectOf } from '@/services/inbound-email.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 29/10/2026 (« pouvoir importer en collant le contenu du mail », direction A). Every traveller is fictional.
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const notice = fixture('parkvia-notification.txt');

describe('« Coller un mail » (domaine)', () => {
  it('lit l’expéditeur et l’objet d’un mail collé avec son en-tête', () => {
    const text = 'De : ParkVia <no-reply@mail.parkvia.com>\nObjet : ParkVia - Nouvelle notification de réservation\n\nBonjour';
    expect(pastedSenderOf(text)).toEqual({ address: 'no-reply@mail.parkvia.com', name: 'ParkVia' });
    expect(pastedSubjectOf(text)).toBe('ParkVia - Nouvelle notification de réservation');
    expect(pastedSenderOf('Bonjour, voici la réservation')).toBeNull();
  });
});

describe('POST /internal/inbound/emails/paste', () => {
  let op: Awaited<ReturnType<typeof setupOperator>>;
  beforeEach(async () => {
    await resetDatabase();
    Container.get(NotificationService).settings.apiKey = '';
    delete process.env.ANTHROPIC_API_KEY;
    op = await setupOperator('Collé');
  });
  afterAll(() => prisma.$disconnect());

  const paste = (body: object) => api().post('/api/internal/inbound/emails/paste').set(auth(op.token)).send(body);

  it('lit le mail collé comme un mail reçu et crée la réservation', async () => {
    const res = await paste({ subject: 'ParkVia - Nouvelle notification de réservation', text: notice });
    expect(res.status).toBe(201);
    expect(res.body.outcome).toBe('imported');
    expect(res.body.email).toMatchObject({ status: 'imported', delivery: 'pasted', provider: 'ParkVia' });
    expect(res.body.email.pastedBy).toBeTruthy();
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: 'PC90000001' } });
    expect(booking.channelDetail).toBe('ParkVia');
    expect(res.body.email.reservationId).toBe(booking.id);

    // The same mail pasted again: linked to its booking, never a second one.
    const again = await paste({ text: notice });
    expect(again.body.outcome).toBe('duplicate');
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, externalReference: 'PC90000001' } })).toBe(1);

    // In the inbox, among the handled mails, like a received one.
    const inbox = await api().get('/api/internal/inbound/emails?view=done').set(auth(op.token));
    expect(inbox.body.data.some((e: { delivery: string }) => e.delivery === 'pasted')).toBe(true);
  });

  it('un texte qui n’est pas un mail de réservation attend dans « À traiter »', async () => {
    const res = await paste({ text: 'Bonjour, pouvez-vous me rappeler au sujet de ma voiture ? Merci beaucoup, bonne journée.' });
    expect(res.status).toBe(201);
    expect(['unrecognised', 'incomplete']).toContain(res.body.outcome);
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(0);
  });

  it('refuse un texte vide ou trop court', async () => {
    expect((await paste({ text: '' })).body.fields).toEqual({ text: 'required' });
    expect((await paste({ text: 'Bonjour' })).body.fields).toEqual({ text: 'too_short' });
  });
  it('suit les liens du mail collé (le HTML du presse-papiers) jusqu’à la page Allopark', async () => {
    const page = fixture('allopark-page.html');
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async url =>
        String(url).includes('reference=AL-884880719')
          ? new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } })
          : new Response('<html><body>Comparez et réservez votre parking</body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
      );
    try {
      const text = fixture('allopark-confirmation.txt');
      const html = `<p>Bonjour</p><a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter ma réservation</a>`;
      const res = await paste({ subject: 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon', text, html });
      expect(res.status).toBe(201);
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('reference=AL-884880719'))).toBe(true);
      expect(res.body.outcome).toBe('imported');
      expect(await prisma.reservation.count({ where: { operatorId: op.operator.id, externalReference: 'AL-884880719' } })).toBe(1);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
