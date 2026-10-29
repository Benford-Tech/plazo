import prisma, { PaymentMethod, ReservationChannel } from '@/database';
import { importedPaymentMethod, paidBy } from '@/domain/payment-method';
import { parseInstant } from '@/domain/time';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 29/10/2026 (« le moyen de paiement », direction A « Payé par »). Every traveller is fictional.
const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('le moyen de paiement (domaine)', () => {
  it('lit la colonne « Paiement » des fichiers', () => {
    expect(importedPaymentMethod('CB')).toBe('card');
    expect(importedPaymentMethod('Carte bancaire')).toBe('card');
    expect(importedPaymentMethod('Espèces')).toBe('cash');
    expect(importedPaymentMethod('liquide')).toBe('cash');
    expect(importedPaymentMethod('Chèque')).toBe('cheque');
    expect(importedPaymentMethod('ANCV')).toBe('holiday_vouchers');
    expect(importedPaymentMethod('Chèques-vacances')).toBe('holiday_vouchers');
    expect(importedPaymentMethod('Virement')).toBe('transfer');
    expect(importedPaymentMethod('Prépayé')).toBe('comparator');
    expect(importedPaymentMethod('Allopark')).toBe('comparator');
    expect(importedPaymentMethod('')).toBeNull();
    expect(importedPaymentMethod('bitcoin')).toBe('invalid');
  });

  it('une réservation Plazo est toujours payée en ligne', () => {
    expect(paidBy({ channel: 'plazo', paymentMethod: null })).toBe('online');
    expect(paidBy({ channel: 'phone', paymentMethod: 'cash' })).toBe('cash');
    expect(paidBy({ channel: 'phone', paymentMethod: null })).toBeNull();
  });
});

describe('« Payé par » d’une réservation', () => {
  let op: Awaited<ReturnType<typeof setupOperator>>;
  let seq = 0;
  beforeEach(async () => {
    await resetDatabase();
    op = await setupOperator('Paiement');
  });
  afterAll(() => prisma.$disconnect());

  const create = (local: string, channel: ReservationChannel, priceCents: number | null, paymentMethod: PaymentMethod | null = null) => {
    seq += 1;
    const arrivalAt = parseInstant(local, TZ)!;
    return prisma.reservation.create({
      data: {
        reference: `PM${String(seq).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel,
        status: 'upcoming',
        arrivalAt,
        returnAt: new Date(arrivalAt.getTime() + 2 * 86400000),
        passengers: 1,
        customerName: 'Camille Martin',
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        priceCents,
        paymentMethod,
      },
    });
  };

  it('se choisit à la création et se change ; jamais sur une réservation Plazo', async () => {
    const created = await api().post('/api/internal/reservations').set(auth(op.token)).send({
      channel: 'phone',
      arrivalAt: '2030-11-12T08:00',
      returnAt: '2030-11-19T18:00',
      passengers: 1,
      customerFirstName: 'Karim',
      customerLastName: 'Benali',
      customerPhone: '0698765432',
      plate: 'FG-456-HJ',
      priceCents: 7200,
      paymentMethod: 'cash',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.paymentMethod).toBe('cash');

    const changed = await api().patch(`/api/internal/reservations/${created.body.data.id}`).set(auth(op.token)).send({ paymentMethod: 'card' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.paymentMethod).toBe('card');
    const bad = await api().patch(`/api/internal/reservations/${created.body.data.id}`).set(auth(op.token)).send({ paymentMethod: 'bitcoin' });
    expect(bad.status).toBe(400);

    const plazo = await create('2030-11-12T08:00', 'plazo', 5000);
    const locked = await api().patch(`/api/internal/reservations/${plazo.id}`).set(auth(op.token)).send({ paymentMethod: 'cash' });
    expect(locked.status).toBe(400);
    expect(locked.body.fields).toEqual({ paymentMethod: 'price_locked' });
  });

  it('se saisit avec le prix depuis le chiffre d’affaires', async () => {
    const booking = await create('2026-10-10T08:00', 'phone', null);
    const put = (body: object) => api().put(`/api/internal/reservations/${booking.id}/price`).set(auth(op.token)).send(body);
    const res = await put({ priceCents: 6000, paymentMethod: 'cheque' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: booking.id, priceCents: 6000, paymentMethod: 'cheque' });
    // Without the field, the method stays.
    await put({ priceCents: 6500 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).paymentMethod).toBe('cheque');
  });

  it('donne le chiffre d’affaires par moyen de paiement, « non précisé » en dernier', async () => {
    await create('2026-10-03T08:00', 'aggregator', 4500, 'comparator');
    await create('2026-10-04T08:00', 'phone', 3000, 'card');
    await create('2026-10-05T08:00', 'counter', 2000, 'card');
    await create('2026-10-06T08:00', 'plazo', 5000);
    await create('2026-10-07T08:00', 'phone', 9000);
    const res = await api().get('/api/internal/revenue?from=2026-10-01&to=2026-10-31').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.byPaymentMethod).toEqual([
      { method: 'card', count: 2, totalCents: 5000 },
      { method: 'online', count: 1, totalCents: 5000 },
      { method: 'comparator', count: 1, totalCents: 4500 },
      { method: null, count: 1, totalCents: 9000 },
    ]);
    const csv = await api().get('/api/internal/revenue/export?from=2026-10-01&to=2026-10-31').set(auth(op.token));
    expect(csv.text).toContain('Payé par');
    expect(csv.text).toContain(';Carte bancaire;');
    expect(csv.text).toContain(';En ligne sur Plazo;');
  });
});
