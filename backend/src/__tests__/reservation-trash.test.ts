import { Container } from 'typedi';
import prisma, { prismaWithDeleted, ReservationChannel, ReservationStatus } from '@/database';
import { ReservationTrashService } from '@/services/reservation-trash.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// 03/11/2026, « Pouvoir supprimer une réservation… elle s'archive 45 jours ».
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const DAY = 86400000;

describe('supprimer une réservation', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  let seq = 0;
  const create = (
    op: Awaited<ReturnType<typeof setupOperator>>,
    options: { status?: ReservationStatus; channel?: ReservationChannel; arrivalAt?: Date; priceCents?: number | null } = {},
  ) => {
    seq += 1;
    const arrivalAt = options.arrivalAt ?? new Date(Date.now() + DAY);
    return prisma.reservation.create({
      data: {
        reference: `TR${String(seq).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel: options.channel ?? 'phone',
        status: options.status ?? 'upcoming',
        arrivalAt,
        returnAt: new Date(arrivalAt.getTime() + 2 * DAY),
        passengers: 1,
        customerFirstName: 'Jean',
        customerLastName: `Dupont ${seq}`,
        customerName: `Jean Dupont ${seq}`,
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        priceCents: options.priceCents === undefined ? 5400 : options.priceCents,
      },
    });
  };

  it('la retire de partout, la garde 45 jours dans Supprimées et la restaure telle quelle', async () => {
    const op = await setupOperator();
    const kept = await create(op);
    const doomed = await create(op);

    const res = await api()
      .delete(`/api/internal/reservations/${doomed.id}`)
      .set(auth(op.token))
      .send({ reason: 'Doublon de la réservation saisie au téléphone' });
    expect(res.status).toBe(200);
    expect(new Date(res.body.purgeAt).getTime() - new Date(res.body.deletedAt).getTime()).toBe(45 * DAY);

    // Gone from the list, the reservation itself, the planning and the revenue.
    const list = await api().get('/api/internal/reservations').set(auth(op.token));
    expect(list.body.docs.map((r: { id: string }) => r.id)).toEqual([kept.id]);
    expect(list.body.deletedCount).toBe(1);
    expect((await api().get(`/api/internal/reservations/${doomed.id}`).set(auth(op.token))).status).toBe(404);
    expect(await prisma.reservation.count({ where: { operatorId: op.operator.id } })).toBe(1);
    const date = new Date(Date.now() + DAY).toISOString().slice(0, 10);
    const forecast = await api().get(`/api/internal/planning/forecast?from=${date}&days=1`).set(auth(op.token));
    expect(forecast.body.days[0].arrivals).toBe(1);

    // The trash.
    const trash = await api().get('/api/internal/reservations/deleted').set(auth(op.token));
    expect(trash.status).toBe(200);
    expect(trash.body.retentionDays).toBe(45);
    expect(trash.body.data).toEqual([
      expect.objectContaining({
        id: doomed.id,
        deleteReason: 'Doublon de la réservation saisie au téléphone',
        deletedBy: { firstName: expect.any(String) },
      }),
    ]);

    const restored = await api().post(`/api/internal/reservations/${doomed.id}/restore`).set(auth(op.token));
    expect(restored.status).toBe(200);
    expect(restored.body.reservation).toMatchObject({ id: doomed.id, status: 'upcoming', priceCents: 5400 });
    expect(restored.body.overbooked).toBe(false);
    expect((await api().get('/api/internal/reservations').set(auth(op.token))).body.deletedCount).toBe(0);
    expect((await api().post(`/api/internal/reservations/${doomed.id}/restore`).set(auth(op.token))).status).toBe(404);

    const history = await api().get(`/api/internal/reservations/${doomed.id}/history`).set(auth(op.token));
    expect(history.body.data.map((e: { action: string }) => e.action)).toEqual(
      expect.arrayContaining(['reservation.deleted', 'reservation.restored']),
    );
  });

  it('refuse une réservation payée sur Plazo, une voiture au parking, un autre rôle et un autre loueur', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    const plazo = await create(op, { channel: 'plazo' });
    const onSite = await create(op, { status: 'arrived', arrivalAt: new Date(Date.now() - DAY) });
    const fine = await create(op, { status: 'cancelled' });
    const agent = await addStaff(op.token, 'agent');

    const paid = await api().delete(`/api/internal/reservations/${plazo.id}`).set(auth(op.token));
    expect(paid.status).toBe(409);
    expect(paid.body.code).toBe('plazo_booking');
    const there = await api().delete(`/api/internal/reservations/${onSite.id}`).set(auth(op.token));
    expect(there.status).toBe(409);
    expect(there.body.code).toBe('vehicle_on_site');
    expect((await api().delete(`/api/internal/reservations/${fine.id}`).set(auth(agent.token))).status).toBe(403);
    expect((await api().get('/api/internal/reservations/deleted').set(auth(agent.token))).status).toBe(403);
    expect((await api().delete(`/api/internal/reservations/${fine.id}`).set(auth(other.token))).status).toBe(404);
    expect((await api().delete(`/api/internal/reservations/${fine.id}`).set(auth(op.token))).status).toBe(200);
    // Already deleted: not found again.
    expect((await api().delete(`/api/internal/reservations/${fine.id}`).set(auth(op.token))).status).toBe(404);
    expect((await api().get('/api/internal/reservations/deleted').set(auth(other.token))).body.data).toEqual([]);
  });

  it('efface pour de bon après 45 jours, avec ses mails liés', async () => {
    const op = await setupOperator();
    const old = await create(op);
    const recent = await create(op);
    await api().delete(`/api/internal/reservations/${old.id}`).set(auth(op.token));
    await api().delete(`/api/internal/reservations/${recent.id}`).set(auth(op.token));
    await prismaWithDeleted.reservation.update({ where: { id: old.id }, data: { deletedAt: new Date(Date.now() - 46 * DAY) } });
    await prisma.inboundEmail.create({
      data: { operatorId: op.operator.id, status: 'imported', reservationId: old.id, fromAddress: 'info@allopark.com', subject: 'Confirmation' },
    });

    expect(await Container.get(ReservationTrashService).purge()).toBe(1);
    expect(await prismaWithDeleted.reservation.findUnique({ where: { id: old.id } })).toBeNull();
    expect(await prisma.inboundEmail.count({ where: { operatorId: op.operator.id } })).toBe(0);
    expect(await prismaWithDeleted.reservation.findUnique({ where: { id: recent.id } })).not.toBeNull();
    // Past the 45 days it leaves the trash even before the night's purge.
    const trash = await api().get('/api/internal/reservations/deleted').set(auth(op.token));
    expect(trash.body.data.map((r: { id: string }) => r.id)).toEqual([recent.id]);
  });
});
