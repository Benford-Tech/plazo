import prisma, { ReservationChannel } from '@/database';
import {
  commissionAmount,
  commissionOf,
  comparatorKey,
  percentToBp,
  rateOn,
  validateRate,
  type CommissionRate,
} from '@/domain/comparator-commission';
import { parseInstant } from '@/domain/time';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// 19/10/2026, « paramétrer le taux de commission de chaque comparateur » (choice « les 3 »).
const TZ = 'Europe/Paris';
const at = (local: string) => parseInstant(local, TZ)!;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const rate = (over: Partial<CommissionRate>): CommissionRate => ({
  comparatorKey: 'allopark',
  label: 'Allopark',
  rateBp: 1800,
  fixedCents: 0,
  effectiveFrom: '2026-10-01',
  ...over,
});
const booking = (over: Partial<Parameters<typeof commissionOf>[0]> = {}) => ({
  channel: 'aggregator' as ReservationChannel,
  channelDetail: 'Allopark',
  priceCents: 5400,
  createdAt: at('2026-10-10T12:00'),
  commissionOverrideBp: null,
  commissionOverrideCents: null,
  ...over,
});

describe('la commission des comparateurs (domaine)', () => {
  it('prend le taux du comparateur en vigueur le jour de la réservation, jamais un taux posé après', () => {
    const rates = [rate({}), rate({ rateBp: 2000, effectiveFrom: '2026-10-15' }), rate({ comparatorKey: 'onepark', label: 'Onepark', rateBp: 2500 })];
    expect(rateOn(rates, 'allopark', '2026-09-30')).toBeNull();
    expect(rateOn(rates, 'allopark', '2026-10-14')?.rateBp).toBe(1800);
    expect(rateOn(rates, 'allopark', '2026-10-15')?.rateBp).toBe(2000);
    expect(commissionOf(booking(), rates, TZ)).toEqual({
      comparator: 'Allopark',
      source: 'rate',
      rateBp: 1800,
      fixedCents: 0,
      amountCents: 972,
      netCents: 4428,
      effectiveFrom: '2026-10-01',
    });
    // Booked on the 15th in Paris (14th 22:30 UTC): the new rate.
    expect(commissionOf(booking({ createdAt: at('2026-10-15T00:30'), channelDetail: '  allopark ' }), rates, TZ)?.rateBp).toBe(2000);
  });

  it('ajoute les frais fixes, ne dépasse jamais le prix ; sans prix, pas de montant ; sans taux, rien de retenu', () => {
    expect(commissionAmount(6000, 1500, 150)).toBe(1050);
    expect(commissionAmount(500, 5000, 1000)).toBe(500);
    expect(commissionOf(booking({ priceCents: null }), [rate({})], TZ)).toMatchObject({ amountCents: null, netCents: null, rateBp: 1800 });
    expect(commissionOf(booking({ channelDetail: 'Parclick' }), [rate({})], TZ)).toMatchObject({ source: 'none', amountCents: 0, netCents: 5400 });
  });

  it('l’exception d’une réservation passe avant le taux ; rien pour un autre canal', () => {
    expect(commissionOf(booking({ commissionOverrideBp: 1200 }), [rate({})], TZ)).toMatchObject({
      source: 'override',
      rateBp: 1200,
      amountCents: 648,
    });
    expect(commissionOf(booking({ commissionOverrideCents: 9999 }), [rate({})], TZ)).toMatchObject({ amountCents: 5400, netCents: 0 });
    expect(commissionOf(booking({ channel: 'phone' }), [rate({})], TZ)).toBeNull();
    expect(commissionOf(booking({ channel: 'plazo', channelDetail: null }), [rate({})], TZ)).toBeNull();
  });

  it('lit un pourcentage, une clé, et refuse un taux mal formé', () => {
    expect(percentToBp('17,5')).toBe(1750);
    expect(percentToBp(18)).toBe(1800);
    expect(percentToBp('101')).toBeNull();
    expect(percentToBp('1.234')).toBeNull();
    expect(comparatorKey(' Park  Mundo ')).toBe('park mundo');
    expect(validateRate({ label: ' ', rateBp: 10001, fixedCents: 1.5, effectiveFrom: '2026-13-01' })).toEqual({
      ok: false,
      fields: { label: 'required', rateBp: 'rate_range', fixedCents: 'integer', effectiveFrom: 'invalid_date' },
    });
    expect(validateRate({ label: 'Allopark', rateBp: 1800, effectiveFrom: '2026-10-01' })).toEqual({
      ok: true,
      value: { label: 'Allopark', rateBp: 1800, fixedCents: 0, effectiveFrom: '2026-10-01' },
    });
  });
});

describe('la commission des comparateurs (API)', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  let seq = 0;
  const create = (
    op: Awaited<ReturnType<typeof setupOperator>>,
    channel: ReservationChannel,
    detail: string | null,
    priceCents: number | null,
    createdAt?: Date,
  ) => {
    seq += 1;
    const arrivalAt = at('2026-10-20T08:00');
    return prisma.reservation.create({
      data: {
        reference: `CM${String(seq).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel,
        channelDetail: detail,
        arrivalAt,
        returnAt: new Date(arrivalAt.getTime() + 2 * 86400000),
        passengers: 1,
        customerName: 'Camille Martin',
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        priceCents,
        ...(createdAt ? { createdAt } : {}),
      },
    });
  };

  it('règle un taux par comparateur, le montre au chiffre d’affaires, sur la fiche et dans la liste', async () => {
    const op = await setupOperator();
    const allo = await create(op, 'aggregator', 'Allopark', 5400, at('2026-10-10T12:00'));
    await create(op, 'phone', null, 4000, at('2026-10-10T12:00'));

    const put = (body: object, token = op.token) => api().put('/api/internal/comparators/commissions').set(auth(token)).send(body);
    expect((await put({ label: 'Allopark', rateBp: 1800, fixedCents: 0, effectiveFrom: '2026-10-01' })).status).toBe(200);
    // A later rate never moves the bookings made before it.
    expect((await put({ label: 'allopark', rateBp: 2500, effectiveFrom: '2026-11-01' })).status).toBe(200);
    expect((await put({ label: 'Allopark', rateBp: -1, effectiveFrom: '2026-10-01' })).body.fields).toEqual({ rateBp: 'rate_range' });

    const list = await api().get('/api/internal/comparators/commissions').set(auth(op.token));
    expect(list.status).toBe(200);
    const allopark = list.body.comparators.find((c: any) => c.key === 'allopark');
    expect(allopark.history.map((r: any) => r.effectiveFrom)).toEqual(['2026-11-01', '2026-10-01']);
    expect(list.body.comparators.map((c: any) => c.key)).toEqual(expect.arrayContaining(['onepark', 'parclick', 'parkmundo']));

    const report = await api().get('/api/internal/revenue?from=2026-10-01&to=2026-10-31').set(auth(op.token));
    expect(report.body).toMatchObject({ totalCents: 9400, commissionCents: 972, netCents: 8428 });
    expect(report.body.byChannel.find((c: any) => c.detail === 'Allopark')).toMatchObject({
      comparatorKey: 'allopark',
      commissionCents: 972,
      netCents: 4428,
    });

    const sheet = await api().get(`/api/internal/reservations/${allo.id}`).set(auth(op.token));
    expect(sheet.body.commission).toMatchObject({ source: 'rate', rateBp: 1800, amountCents: 972, netCents: 4428 });
    const rows = await api().get('/api/internal/reservations?q=Martin').set(auth(op.token));
    expect(rows.body.docs.find((r: any) => r.id === allo.id).commission.netCents).toBe(4428);

    // An agent sees neither the commission nor the settings.
    const agent = await addStaff(op.token, 'agent');
    expect((await api().get(`/api/internal/reservations/${allo.id}`).set(auth(agent.token))).body.commission).toBeNull();
    expect((await api().get('/api/internal/comparators/commissions').set(auth(agent.token))).status).toBe(403);
    expect((await put({ label: 'Allopark', rateBp: 1, effectiveFrom: '2026-10-01' }, agent.token)).status).toBe(403);

    // Taking out a rate set by mistake.
    expect((await api().delete('/api/internal/comparators/commissions/allopark/2026-11-01').set(auth(op.token))).status).toBe(204);
    expect((await api().delete('/api/internal/comparators/commissions/allopark/2026-11-01').set(auth(op.token))).status).toBe(404);
    expect(await prisma.auditLog.count({ where: { action: { startsWith: 'comparator_commission.' } } })).toBe(3);
  });

  it('PUT /internal/reservations/:id/commission : une exception par réservation de comparateur, ou retour au taux', async () => {
    const op = await setupOperator();
    const allo = await create(op, 'aggregator', 'Allopark', 5400);
    const phone = await create(op, 'phone', null, 4000);
    const put = (id: string, body: object) => api().put(`/api/internal/reservations/${id}/commission`).set(auth(op.token)).send(body);
    expect((await put(allo.id, { rateBp: 1200 })).body.commission).toMatchObject({ source: 'override', amountCents: 648 });
    expect((await put(allo.id, { amountCents: 500 })).body.commission).toMatchObject({ source: 'override', amountCents: 500, netCents: 4900 });
    expect((await put(allo.id, { rateBp: 1200, amountCents: 500 })).body.fields).toEqual({ amountCents: 'rate_or_amount' });
    expect((await put(allo.id, {})).body.commission).toMatchObject({ source: 'none', amountCents: 0 });
    expect((await put(phone.id, { rateBp: 1000 })).body.code).toBe('not_comparator');
    const other = await setupOperator('Autre');
    expect((await api().put(`/api/internal/reservations/${allo.id}/commission`).set(auth(other.token)).send({ rateBp: 1 })).status).toBe(404);
  });
});
