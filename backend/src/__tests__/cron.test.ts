import prisma from '@/database';
import { api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /internal/cron/purge-expired-tokens', () => {
  it('exige le secret de Vercel Cron', async () => {
    expect((await api().get('/api/internal/cron/purge-expired-tokens')).status).toBe(401);
    expect((await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', 'Bearer faux')).status).toBe(401);
  });

  it('supprime uniquement les jetons expirés', async () => {
    const { manager } = await setupOperator();
    await prisma.staffToken.create({ data: { staffId: manager.id, type: 'access', expiresAt: new Date(Date.now() - 1000) } });
    const res = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      deleted: 1,
      arrivalSignalsEnded: 0,
      shuttleTripsEnded: 0,
      smsAbandoned: 0,
      smsPurged: 0,
      travellerDevicesPurged: 0,
      carLocationsPurged: 0,
      inboundEmails: { textsCleared: 0, rowsDeleted: 0 },
      reservationsAnonymized: 0,
    });
    expect(await prisma.staffToken.count()).toBe(2); // the login's access + refresh pair
  });
});

describe('anonymisation des réservations 12 mois après le retour (politique de confidentialité)', () => {
  const DAY = 86400000;
  const cron = () => api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);

  async function booking(operatorId: string, parkingId: string, reference: string, returnedDaysAgo: number) {
    return prisma.reservation.create({
      data: {
        reference,
        operatorId,
        parkingId,
        channel: 'aggregator',
        channelDetail: 'Allopark',
        externalReference: `AL-${reference}`,
        status: 'returned',
        arrivalAt: new Date(Date.now() - (returnedDaysAgo + 5) * DAY),
        returnAt: new Date(Date.now() - returnedDaysAgo * DAY),
        passengers: 3,
        customerName: 'Camille Martin',
        customerPhone: '0612345678',
        customerEmail: 'camille@example.com',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        returnFlight: 'TO 3627',
        departureFlight: 'AF 7641',
        notes: 'Siège bébé',
        priceCents: 5500,
        keyHook: 'C12',
        carLat: 45.72,
        carLng: 5.08,
        carLocatedAt: new Date(),
        carLocatedBy: 'staff',
        carNote: 'Au fond',
      },
    });
  }

  it("efface l'identité du voyageur, garde la référence, les dates et les montants, et nettoie le journal", async () => {
    const { operator, parking, token } = await setupOperator();
    const old = await booking(operator.id, parking.id, 'OLD1', 370);
    const recent = await booking(operator.id, parking.id, 'NEW1', 300);

    // A real change by the staff while the booking was open: the audit entry holds the old and new values.
    await prisma.reservation.update({ where: { id: old.id }, data: { status: 'upcoming' } });
    const patch = await api()
      .patch(`/api/internal/reservations/${old.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Camille Martin-Durand', customerPhone: '0699999999', passengers: 2 });
    expect(patch.body).toMatchObject({ data: { customerName: 'Camille Martin-Durand' } });
    await prisma.reservation.update({ where: { id: old.id }, data: { status: 'returned' } });
    await prisma.auditLog.create({
      data: {
        operatorId: operator.id,
        action: 'return.landed',
        entityType: 'reservation',
        entityId: old.id,
        details: { source: 'tracking', flight: 'TO 3627' },
      },
    });
    await prisma.travellerDevice.create({ data: { reservationId: old.id, subscriptionId: 'sub-old' } });
    await prisma.smsOutbox.create({
      data: {
        operatorId: operator.id,
        reservationId: old.id,
        kind: 'flight_landed',
        to: '+33612345678',
        bodyHash: 'x',
        provider: 'brevo',
        status: 'sent',
      },
    });

    const res = await cron();
    expect(res.status).toBe(200);
    expect(res.body.reservationsAnonymized).toBe(1);

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: old.id } });
    expect(after).toMatchObject({
      customerName: 'Client anonymisé',
      customerPhone: '',
      customerEmail: null,
      plate: '—',
      plateKey: '',
      returnFlight: null,
      departureFlight: null,
      notes: null,
      carLat: null,
      carLng: null,
      carNote: null,
      carLocatedBy: null,
      // Kept: accounting and the operator's reconciliations.
      reference: 'OLD1',
      channelDetail: 'Allopark',
      externalReference: 'AL-OLD1',
      passengers: 2,
      priceCents: 5500,
      status: 'returned',
      keyHook: 'C12',
    });
    expect(after.anonymizedAt).toBeInstanceOf(Date);
    expect(after.arrivalAt).toEqual(old.arrivalAt);

    const entries = await prisma.auditLog.findMany({ where: { entityId: old.id } });
    const text = JSON.stringify(entries.map(e => e.details));
    for (const value of ['Camille', '0612345678', '0699999999', 'TO 3627']) expect(text).not.toContain(value);
    const updated = entries.find(e => e.action === 'reservation.updated')!;
    expect(updated.details).toEqual({ passengers: { from: 3, to: 2 }, anonymized: true });
    expect(entries.find(e => e.action === 'return.landed')!.details).toEqual({ source: 'tracking', anonymized: true });
    expect(await prisma.travellerDevice.count({ where: { reservationId: old.id } })).toBe(0);
    expect(await prisma.smsOutbox.count({ where: { reservationId: old.id } })).toBe(0);

    // Returned 300 days ago: untouched.
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: recent.id } })).toMatchObject({
      customerName: 'Camille Martin',
      plate: 'AB-123-CD',
      anonymizedAt: null,
    });

    // Idempotent: nothing more the next night, and the date of the first pass stays.
    expect((await cron()).body.reservationsAnonymized).toBe(0);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: old.id } })).anonymizedAt).toEqual(after.anonymizedAt);
  });

  it("une réservation anonymisée n'est plus retrouvée par le nom, le téléphone ou la plaque", async () => {
    const { operator, parking, token } = await setupOperator();
    await booking(operator.id, parking.id, 'OLD2', 400);
    const search = async (q: string) => {
      const res = await api().get('/api/internal/reservations').query({ q }).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      return JSON.stringify(res.body).includes('OLD2');
    };
    const queries = ['Camille', '0612345678', 'AB-123-CD'];
    for (const q of queries) expect(await search(q)).toBe(true);
    await cron();
    for (const q of queries) expect(await search(q)).toBe(false);
    expect(await search('OLD2')).toBe(true); // the reference stays
  });
});
