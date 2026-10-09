import prisma, { ReservationChannel, ReservationStatus } from '@/database';
import { revenueCsv, revenueReport, type RevenueBooking } from '@/domain/revenue';
import { parseInstant } from '@/domain/time';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// CA-B + CA-A (09/10/2026): the revenue of the bookings.
const TZ = 'Europe/Paris';
const at = (local: string) => parseInstant(local, TZ)!;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

let seq = 0;
const booking = (over: Partial<RevenueBooking> & { arrival: string; days?: number; booked?: string }): RevenueBooking & { plate: string } => {
  seq += 1;
  const arrivalAt = at(over.arrival);
  return {
    id: `r${seq}`,
    reference: `R${String(seq).padStart(4, '0')}`,
    customerName: 'Camille Martin',
    plate: 'AB-123-CD',
    arrivalAt,
    returnAt: new Date(arrivalAt.getTime() + (over.days ?? 3) * 86400000),
    createdAt: at(over.booked ?? '2026-09-20T10:00'),
    channel: 'aggregator',
    channelDetail: 'Allopark',
    priceCents: 3400,
    ...over,
  };
};

describe('le chiffre d’affaires (domaine)', () => {
  const period = { from: '2026-10-01', to: '2026-10-31', basis: 'arrival' as const, timeZone: TZ };

  it('additionne les montants du mois par jour d’arrivée, par canal (comparateurs par nom), et compte à part ceux sans montant', () => {
    const report = revenueReport(
      [
        booking({ arrival: '2026-10-01T00:30', priceCents: 3400 }),
        booking({ arrival: '2026-10-09T08:00', channelDetail: ' allopark ', priceCents: 3600 }),
        booking({ arrival: '2026-10-09T09:00', channelDetail: 'Onepark', priceCents: 4500, days: 8 }),
        booking({ arrival: '2026-10-12T09:00', channel: 'plazo', channelDetail: null, priceCents: 5290 }),
        booking({ arrival: '2026-10-13T09:00', channel: 'phone', channelDetail: 'Monsieur X', priceCents: null }),
        // Outside the month, local time: 30/09 23:30 in Paris.
        booking({ arrival: '2026-09-30T23:30', priceCents: 9999 }),
      ],
      period,
    );
    expect(report).toMatchObject({ totalCents: 3400 + 3600 + 4500 + 5290, count: 4, withoutAmount: 1, averageCents: Math.round(16790 / 4) });
    expect(report.byChannel).toEqual([
      { channel: 'aggregator', detail: 'Allopark', count: 2, totalCents: 7000 },
      { channel: 'plazo', detail: null, count: 1, totalCents: 5290 },
      { channel: 'aggregator', detail: 'Onepark', count: 1, totalCents: 4500 },
    ]);
    expect(report.byDay).toHaveLength(31);
    expect(report.byDay.find(d => d.date === '2026-10-09')).toEqual({ date: '2026-10-09', count: 2, totalCents: 8100 });
    // Billable days: 4, 4, 9 and 4.
    expect(report.averageDays).toBe(5.3);
  });

  it('compte au jour de réservation quand on le demande ; rien sur la période : des zéros, pas de moyenne', () => {
    const list = [booking({ arrival: '2026-11-05T09:00', booked: '2026-10-02T21:00' })];
    expect(revenueReport(list, period)).toMatchObject({
      totalCents: 0,
      count: 0,
      averageCents: null,
      averageDays: null,
      withoutAmount: 0,
      byChannel: [],
    });
    expect(revenueReport(list, { ...period, basis: 'booked' })).toMatchObject({ totalCents: 3400, count: 1 });
  });

  it('exporte un CSV que le tableur ouvre tel quel', () => {
    const csv = revenueCsv(
      [
        booking({ arrival: '2026-10-09T08:00', reference: 'RZZ2', customerName: 'Léa "Lili" Petit', priceCents: 104550 }),
        booking({ arrival: '2026-10-02T08:00', reference: 'RZZ1', priceCents: null }),
      ],
      period,
      (channel, detail) => detail ?? channel,
    );
    const lines = csv.split('\r\n');
    expect(csv.startsWith('﻿Référence;Réservée le;Arrivée;Retour;Canal;Client;Plaque;Montant (€)')).toBe(true);
    expect(lines[1]).toBe('RZZ1;2026-09-20;2026-10-02;2026-10-05;Allopark;Camille Martin;AB-123-CD;');
    expect(lines[2]).toBe('RZZ2;2026-09-20;2026-10-09;2026-10-12;Allopark;"Léa ""Lili"" Petit";AB-123-CD;1045,50');
  });
});

describe('GET /internal/revenue', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  const create = (
    op: Awaited<ReturnType<typeof setupOperator>>,
    local: string,
    channel: ReservationChannel,
    detail: string | null,
    priceCents: number | null,
    status: ReservationStatus = 'upcoming',
  ) => {
    seq += 1;
    const arrivalAt = at(local);
    return prisma.reservation.create({
      data: {
        reference: `RV${String(seq).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel,
        channelDetail: detail,
        status,
        arrivalAt,
        returnAt: new Date(arrivalAt.getTime() + 2 * 86400000),
        passengers: 1,
        customerName: 'Camille Martin',
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        priceCents,
      },
    });
  };

  it('donne au gérant le total, les canaux, les jours et les réservations sans montant ; ni annulées ni autres loueurs', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    await create(op, '2026-10-03T08:00', 'aggregator', 'Onepark', 4500);
    await create(op, '2026-10-04T08:00', 'aggregator', 'ParkMundo', 3000);
    await create(op, '2026-10-05T08:00', 'aggregator', 'Allopark', 3400, 'cancelled');
    const missing = await create(op, '2026-10-06T08:00', 'phone', null, null);
    await create(other, '2026-10-03T08:00', 'aggregator', 'Onepark', 9900);
    const res = await api().get('/api/internal/revenue?from=2026-10-01&to=2026-10-31').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-31',
      basis: 'arrival',
      timezone: TZ,
      totalCents: 7500,
      count: 2,
      withoutAmount: 1,
    });
    expect(res.body.byChannel.map((c: any) => c.detail)).toEqual(['Onepark', 'ParkMundo']);
    expect(res.body.missing).toEqual([expect.objectContaining({ id: missing.id, reference: missing.reference, channel: 'phone', detail: null })]);

    const csv = await api().get('/api/internal/revenue/export?from=2026-10-01&to=2026-10-31').set(auth(op.token));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toMatch(/^text\/csv/);
    expect(csv.headers['content-disposition']).toBe('attachment; filename="chiffre-affaires_2026-10-01_2026-10-31.csv"');
    expect(csv.text.split('\r\n').filter(Boolean)).toHaveLength(4);
  });

  it('refuse une période invalide, trop longue ou un mode inconnu ; réservé aux gérants', async () => {
    const op = await setupOperator();
    const get = (q: string, token = op.token) => api().get(`/api/internal/revenue${q}`).set(auth(token));
    expect((await get('?from=2026-10-31&to=2026-10-01')).body.fields).toEqual({ to: 'invalid_date' });
    expect((await get('?from=2026-01-01&to=2027-01-02')).body.fields).toEqual({ to: 'range_too_long' });
    expect((await get('?from=2026-10-01&to=2026-10-31&basis=paid')).body.fields).toEqual({ basis: 'invalid_basis' });
    expect((await get('?to=2026-10-31')).status).toBe(400);
    const agent = await addStaff(op.token, 'agent');
    expect((await get('?from=2026-10-01&to=2026-10-31', agent.token)).status).toBe(403);
    expect((await api().get('/api/internal/revenue/summary').set(auth(agent.token))).status).toBe(403);
  });

  it('résume le mois, le jour et les 7 derniers jours pour la tuile du tableau de bord', async () => {
    const op = await setupOperator();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
    await create(op, `${today}T08:00`, 'aggregator', 'Onepark', 4500);
    await create(op, `${today}T09:00`, 'counter', null, null);
    const res = await api().get('/api/internal/revenue/summary').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      today,
      todayCents: 4500,
      weekCents: 4500,
      month: { from: `${today.slice(0, 7)}-01`, totalCents: 4500, count: 1, withoutAmount: 1 },
    });
  });

  it('PUT /internal/reservations/:id/price : complète ou corrige un montant, jamais celui d’une réservation Plazo', async () => {
    const op = await setupOperator();
    const phone = await create(op, '2026-10-06T08:00', 'phone', null, null, 'returned');
    const plazo = await create(op, '2026-10-06T08:00', 'plazo', null, 5290);
    const put = (id: string, body: object, token = op.token) => api().put(`/api/internal/reservations/${id}/price`).set(auth(token)).send(body);
    expect((await put(phone.id, { priceCents: 4200 })).body).toEqual({ id: phone.id, priceCents: 4200 });
    expect((await prisma.auditLog.findFirstOrThrow({ where: { entityId: phone.id } })).details).toEqual({ priceCents: { from: null, to: 4200 } });
    expect((await put(phone.id, { priceCents: null })).body.priceCents).toBeNull();
    expect((await put(phone.id, {})).body.fields).toEqual({ priceCents: 'integer' });
    expect((await put(phone.id, { priceCents: -1 })).body.fields).toEqual({ priceCents: 'min_0' });
    expect((await put(plazo.id, { priceCents: 100 })).body.fields).toEqual({ priceCents: 'price_locked' });
    const driver = await addStaff(op.token, 'driver');
    expect((await put(phone.id, { priceCents: 1 }, driver.token)).status).toBe(403);
    const other = await setupOperator('Autre');
    expect((await put(phone.id, { priceCents: 1 }, other.token)).status).toBe(404);
  });
});
