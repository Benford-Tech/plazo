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

  it('compte les voitures vraiment là (01/11/2026) : rendue en avance, encore là après sa date, attendue jamais venue', async () => {
    const op = await setupOperator();
    const create = async (plate: string, arrival: string, ret: string) =>
      (
        await api()
          .post('/api/internal/reservations')
          .set(auth(op.token))
          .send({ ...booking(plate, arrival, ret), force: true })
      ).body.data.id as string;
    const at = (date: string, time = '10:00') => new Date(`${date}T${time}:00Z`);
    // Handed back two days early: gone from that day.
    const early = await create('aa111aa', addDays(today, -3), addDays(today, 3));
    await prisma.reservation.update({
      where: { id: early },
      data: { status: 'returned', arrivedAt: at(addDays(today, -3)), returnedAt: at(addDays(today, 1)) },
    });
    // Due back an hour ago, still on site: there tonight.
    const late = await create('bb222bb', addDays(today, -4), addDays(today, 1));
    await prisma.reservation.update({
      where: { id: late },
      data: { status: 'arrived', arrivedAt: at(addDays(today, -4)), returnAt: new Date(Date.now() - 3600000) },
    });
    // Due back yesterday and never handed back (« il devrait avoir 39 voitures sur place »): taken as gone after its return.
    const stale = await create('dd444dd', addDays(today, -4), addDays(today, -1));
    await prisma.reservation.update({ where: { id: stale }, data: { status: 'arrived', arrivedAt: at(addDays(today, -4)) } });
    // Expected two days ago, never came: not parked on the nights before today.
    await create('cc333cc', addDays(today, -2), addDays(today, 2));

    const res = await api()
      .get(`/api/internal/planning/forecast?from=${addDays(today, -3)}&days=7`)
      .set(auth(op.token));
    const parked = (date: string) => res.body.days.find((d: { date: string }) => d.date === date).parked;
    expect(parked(addDays(today, -3))).toBe(3); // early + late + stale
    expect(parked(addDays(today, -1))).toBe(2); // early + late (stale's last booked night was the night before)
    expect(parked(today)).toBe(3); // early + late, still there + the expected one, from today
    expect(parked(addDays(today, 1))).toBe(1); // early gone, late's stay ended at tonight: only the expected one
    expect(parked(addDays(today, 3))).toBe(0);
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
