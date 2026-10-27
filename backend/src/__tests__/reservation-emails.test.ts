import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** « Mails liés » (27/10/2026, « pouvoir retrouver le mail qui a permis de créer la réservation », direction C). */
describe('mails liés d’une réservation', () => {
  beforeEach(resetDatabase);

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function booking(token: string, plate = 'AB123CD', externalReference = 'AL-884880719') {
    const res = await api().post('/api/internal/reservations').set(auth(token)).send({
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference,
      arrivalAt: '2026-12-12T06:30',
      returnAt: '2026-12-13T20:30',
      passengers: 2,
      customerFirstName: 'Léa',
      customerLastName: 'Petit',
      customerPhone: '06 12 34 56 78',
      plate,
    });
    expect(res.status).toBe(201);
    return res.body.data as { id: string; reference: string };
  }

  it('rend la création, la modification (même laissée à l’équipe), le doublon, du plus ancien au plus récent', async () => {
    const op = await setupOperator();
    const operatorId = (await prisma.staff.findFirstOrThrow({ where: { email: op.manager.email } })).operatorId;
    const before = new Date(Date.now() - 60_000);
    // The email the booking was typed from (« Compléter »), received before the booking.
    const source = await prisma.inboundEmail.create({
      data: {
        operatorId,
        status: 'incomplete',
        subject: 'Confirmation AL-884880719',
        textBody: 'Bonjour Léa',
        fromAddress: 'info@allopark.com',
        receivedAt: before,
      },
    });
    const created = await booking(op.token);
    expect(
      (await api().post(`/api/internal/inbound/emails/${source.id}/attach`).set(auth(op.token)).send({ reservationId: created.id })).status,
    ).toBe(200);
    const later = (minutes: number) => new Date(Date.now() + minutes * 60_000);
    const duplicate = await prisma.inboundEmail.create({
      data: { operatorId, status: 'duplicate', subject: 'TR: Confirmation', reservationId: created.id, receivedAt: later(1) },
    });
    // A change Plazo left to the staff is not attached: found by the booking its change names.
    const change = await prisma.inboundEmail.create({
      data: {
        operatorId,
        status: 'unrecognised',
        subject: 'Modification AL-884880719',
        receivedAt: later(2),
        change: {
          applied: false,
          reason: 'already_arrived',
          reservationId: created.id,
          reference: created.reference,
          changes: [],
          at: later(2).toISOString(),
        },
      },
    });
    const cancellation = await prisma.inboundEmail.create({
      data: {
        operatorId,
        status: 'imported',
        subject: 'ParkVia - Cancellation',
        reservationId: created.id,
        receivedAt: later(3),
        change: {
          kind: 'cancellation',
          applied: true,
          reason: null,
          reservationId: created.id,
          reference: created.reference,
          changes: [],
          at: later(3).toISOString(),
        },
      },
    });
    // Another booking's email, and a forwarding confirmation, never listed.
    const other = await booking(op.token, 'XY987ZW', 'AL-123456789');
    await prisma.inboundEmail.create({ data: { operatorId, status: 'imported', subject: 'Autre', reservationId: other.id } });
    await prisma.inboundEmail.create({ data: { operatorId, status: 'forwarding', subject: 'Gmail', reservationId: created.id } });

    const res = await api().get(`/api/internal/reservations/${created.id}/emails`).set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.data.map((e: { id: string; role: string; inboxView: string | null }) => [e.id, e.role, e.inboxView])).toEqual([
      [source.id, 'created', 'done'],
      [duplicate.id, 'duplicate', 'done'],
      [change.id, 'change', 'todo'],
      [cancellation.id, 'cancellation', 'done'],
    ]);
    // The text of the email the booking was typed from stays (until the 30-day purge).
    expect(res.body.data[0]).toMatchObject({
      subject: 'Confirmation AL-884880719',
      textBody: 'Bonjour Léa',
      reservationReference: created.reference,
    });
  });

  it('un mail sorti de son onglet n’a plus de lien vers la boîte ; aucun mail : liste vide', async () => {
    const op = await setupOperator();
    const operatorId = (await prisma.staff.findFirstOrThrow({ where: { email: op.manager.email } })).operatorId;
    const created = await booking(op.token);
    expect((await api().get(`/api/internal/reservations/${created.id}/emails`).set(auth(op.token))).body.data).toEqual([]);
    await prisma.inboundEmail.create({
      data: { operatorId, status: 'imported', subject: 'Ancien', reservationId: created.id, receivedAt: new Date(Date.now() - 40 * 86400000) },
    });
    const res = await api().get(`/api/internal/reservations/${created.id}/emails`).set(auth(op.token));
    expect(res.body.data).toEqual([expect.objectContaining({ role: 'created', inboxView: null })]);
  });

  it('404 pour la réservation d’un autre loueur, 403 sans accès à la boîte de réception', async () => {
    const op = await setupOperator();
    const created = await booking(op.token);
    const stranger = await setupOperator('Autre');
    expect((await api().get(`/api/internal/reservations/${created.id}/emails`).set(auth(stranger.token))).status).toBe(404);
    const driver = await addStaff(op.token, 'driver');
    expect((await api().get(`/api/internal/reservations/${created.id}/emails`).set(auth(driver.token))).status).toBe(403);
  });
});
