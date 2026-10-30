import prisma from '@/database';
import { authorOf, changesOf, displayValue } from '@/domain/reservation-history';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** « Historique » of a reservation (30/10/2026, direction A): who did what, newest first, before → after. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const booking = {
  channel: 'phone',
  arrivalAt: '2026-11-04T06:30',
  returnAt: '2026-11-07T15:05',
  passengers: 3,
  customerFirstName: 'Claire',
  customerLastName: 'Laurent',
  customerPhone: '06 12 34 56 78',
  plate: 'gk318px',
};

describe('reservation history', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  it('lists creation, changes and status changes with their author', async () => {
    const op = await setupOperator();
    const created = await api().post('/api/internal/reservations').set(auth(op.token)).send(booking);
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    await api().patch(`/api/internal/reservations/${id}`).set(auth(op.token)).send({ passengers: 2, returnAt: '2026-11-08T10:00' });
    const driver = await addStaff(op.token, 'driver');
    // An entry written by Plazo itself and one by the traveller.
    await prisma.auditLog.createMany({
      data: [
        {
          operatorId: op.operator.id,
          action: 'reservation.updated',
          entityType: 'reservation',
          entityId: id,
          details: { by: 'traveller', childSeats: { from: { infant: 0, toddler: 0, booster: 0 }, to: { infant: 1, toddler: 0, booster: 0 } } },
        },
        {
          operatorId: op.operator.id,
          action: 'reservation.status_changed',
          entityType: 'reservation',
          entityId: id,
          details: { from: 'upcoming', to: 'cancelled', source: 'parkvia_cancellation' },
        },
      ],
    });

    const res = await api().get(`/api/internal/reservations/${id}/history`).set(auth(driver.token));
    expect(res.status).toBe(200);
    const events = res.body.data as any[];
    const created_ = events.find(e => e.action === 'reservation.created');
    expect(created_.author).toMatchObject({ kind: 'staff', name: 'Gérant' });
    expect(created_.group).toBe('change');
    const updated = events.find(e => e.action === 'reservation.updated' && e.author.kind === 'staff');
    expect(updated.changes).toEqual(
      expect.arrayContaining([
        { field: 'passengers', from: '3', to: '2' },
        { field: 'returnAt', from: '7 nov. 15:05', to: '8 nov. 10:00' },
      ]),
    );
    expect(updated.changes.map((c: any) => c.field)).not.toContain('updatedAt');
    const seats = events.find(e => e.author.kind === 'traveller');
    expect(seats.changes).toEqual([{ field: 'childSeats', from: 'aucun', to: '1 bébé' }]);
    const cancelled = events.find(e => e.action === 'reservation.status_changed');
    expect(cancelled).toMatchObject({
      group: 'status',
      author: { kind: 'comparator', name: 'ParkVia' },
      info: { from: 'upcoming', to: 'cancelled' },
    });
    // Newest first.
    const times = events.map(e => new Date(e.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("never shows another operator's reservation", async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    const created = await api().post('/api/internal/reservations').set(auth(a.token)).send(booking);
    const res = await api().get(`/api/internal/reservations/${created.body.data.id}/history`).set(auth(b.token));
    expect(res.status).toBe(404);
  });

  it('writes values for reading', () => {
    expect(displayValue('priceCents', 5400, 'Europe/Paris')).toBe('54,00 €');
    expect(displayValue('handover', 'valet', 'Europe/Paris')).toBe('Voiturier au terminal');
    expect(displayValue('notes', null, 'Europe/Paris')).toBe('—');
    expect(changesOf({ plate: { from: 'AB', to: 'AB' }, viewAs: true }, 'Europe/Paris')).toEqual([]);
    const row = { id: 'x', action: 'reservation.created', details: { channel: 'plazo' }, createdAt: new Date(), staff: null };
    expect(authorOf(row, { customerName: 'Claire Laurent', channelDetail: null })).toMatchObject({ kind: 'traveller', name: 'Claire Laurent' });
  });
});
