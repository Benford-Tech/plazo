import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/** « Planning prévisionnel » (28/10/2026, direction A « Calendrier par mois »). */

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = localDate(new Date(), 'Europe/Paris');
const booking = (plate: string, arrival: string, ret: string) => ({
  channel: 'phone',
  arrivalAt: `${arrival}T09:30`,
  returnAt: `${ret}T18:00`,
  passengers: 2,
  customerFirstName: 'Client',
  customerLastName: plate,
  customerPhone: '06 12 34 56 78',
  plate,
});

describe('GET /internal/planning/forecast', () => {
  it('compte arrivées, départs et voitures garées la nuit, sans les annulées', async () => {
    const op = await setupOperator();
    const d1 = addDays(today, 2);
    const d3 = addDays(today, 4);
    for (const plate of ['ab123cd', 'ef456gh']) {
      expect(
        (
          await api()
            .post('/api/internal/reservations')
            .set(auth(op.token))
            .send(booking(plate, d1, d3))
        ).status,
      ).toBe(201);
    }
    const cancelled = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send(booking('ij789kl', d1, d3));
    await prisma.reservation.update({ where: { id: cancelled.body.data.id }, data: { status: 'cancelled' } });

    const res = await api().get(`/api/internal/planning/forecast?from=${today}&days=7`).set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ today, from: today, to: addDays(today, 6), bookableCapacity: 200 });
    expect(res.body.days).toHaveLength(7);
    const day = (date: string) => res.body.days.find((d: { date: string }) => d.date === date);
    expect(day(d1)).toMatchObject({ arrivals: 2, returns: 0, parked: 2, free: 198, overbooked: false });
    expect(day(addDays(today, 3))).toMatchObject({ arrivals: 0, returns: 0, parked: 2 });
    expect(day(d3)).toMatchObject({ arrivals: 0, returns: 2, parked: 0 });
    expect(day(today)).toMatchObject({ arrivals: 0, returns: 0, parked: 0 });
  });

  it('borne la période à 92 jours et prend aujourd’hui par défaut', async () => {
    const op = await setupOperator();
    const long = await api().get('/api/internal/planning/forecast?days=400').set(auth(op.token));
    expect(long.body.days).toHaveLength(92);
    expect(long.body.from).toBe(today);
    const other = await setupOperator('Autre');
    await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send(booking('ab123cd', addDays(today, 1), addDays(today, 2)));
    const theirs = await api().get('/api/internal/planning/forecast?days=7').set(auth(other.token));
    expect(theirs.body.days.every((d: { arrivals: number }) => d.arrivals === 0)).toBe(true);
  });
});
