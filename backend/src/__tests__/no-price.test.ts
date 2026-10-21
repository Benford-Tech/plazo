import prisma, { ReservationChannel, ReservationStatus } from '@/database';
import { Container } from 'typedi';
import { DashboardService } from '@/services/dashboard.service';
import { ReservationService } from '@/services/reservation.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// 21/10/2026, « Mets en évidence les réservations sans prix » (choice A + C).
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const DAY = 86400000;

describe('les réservations sans prix', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  let seq = 0;
  const create = (
    op: Awaited<ReturnType<typeof setupOperator>>,
    arrivalAt: Date,
    priceCents: number | null,
    status: ReservationStatus = 'upcoming',
    channel: ReservationChannel = 'aggregator',
  ) => {
    seq += 1;
    return prisma.reservation.create({
      data: {
        reference: `NP${String(seq).padStart(4, '0')}`,
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        channel,
        channelDetail: channel === 'aggregator' ? 'Onepark' : null,
        status,
        arrivalAt,
        returnAt: new Date(arrivalAt.getTime() + 2 * DAY),
        passengers: 1,
        customerName: `Client ${seq}`,
        customerPhone: '06 12 34 56 78',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        priceCents,
      },
    });
  };

  it('filtre la liste et la compte pour les gérants, jamais une annulée ; rien pour un autre rôle', async () => {
    const op = await setupOperator();
    const now = Date.now();
    const soon = await create(op, new Date(now + DAY), null);
    const past = await create(op, new Date(now - 3 * DAY), null, 'returned');
    await create(op, new Date(now + 2 * DAY), 4500);
    await create(op, new Date(now + 3 * DAY), null, 'cancelled');

    const all = await api().get('/api/internal/reservations').set(auth(op.token));
    expect(all.status).toBe(200);
    expect(all.body.noPriceCount).toBe(2);

    const only = await api().get('/api/internal/reservations?noPrice=1&page=0').set(auth(op.token));
    expect(only.body.docs.map((r: any) => r.id)).toEqual([past.id]);
    const coming = await api().get('/api/internal/reservations?noPrice=1').set(auth(op.token));
    expect(coming.body.docs.map((r: any) => r.id)).toEqual([soon.id]);
    expect(coming.body.totalDocs).toBe(2);

    // An agent sees no price: no count, and the filter is ignored.
    const agent = await addStaff(op.token, 'agent');
    const agentList = await api().get('/api/internal/reservations?noPrice=1').set(auth(agent.token));
    expect(agentList.body.noPriceCount).toBeNull();
    expect(agentList.body.docs).toHaveLength(3);
  });

  it('les met au tableau de bord : alerte « À faire » et les plus proches à compléter', async () => {
    const op = await setupOperator();
    const now = new Date();
    const later = await create(op, new Date(now.getTime() + 5 * DAY), null);
    const soon = await create(op, new Date(now.getTime() + DAY), null);
    const past = await create(op, new Date(now.getTime() - 2 * DAY), null, 'returned');
    await create(op, new Date(now.getTime() - 9 * DAY), null, 'returned');

    const manager = await prisma.staff.findUniqueOrThrow({ where: { email: op.manager.email } });
    const noPrice = await Container.get(ReservationService).noPrice({ ...manager, operatorName: '' }, now);
    expect(noPrice).toMatchObject({ count: 4 });
    expect(noPrice!.next.map(b => b.id)).toEqual([soon.id, later.id, past.id]);
    expect(noPrice!.next[0].detail).toBe('Onepark');

    const dashboard = await Container.get(DashboardService).get({ ...manager, operatorName: '' });
    expect(dashboard.noPrice?.count).toBe(4);
    expect(dashboard.alerts).toContainEqual(expect.objectContaining({ kind: 'price_missing', severity: 'todo', detail: '4' }));

    // Typed in place: it leaves the count.
    expect((await api().put(`/api/internal/reservations/${soon.id}/price`).set(auth(op.token)).send({ priceCents: 4850 })).status).toBe(200);
    expect((await api().get('/api/internal/dashboard').set(auth(op.token))).body.noPrice.count).toBe(3);

    const agent = await addStaff(op.token, 'agent');
    const agentDashboard = await api().get('/api/internal/dashboard').set(auth(agent.token));
    expect(agentDashboard.body.noPrice).toBeNull();
    expect(agentDashboard.body.alerts.some((a: any) => a.kind === 'price_missing')).toBe(false);
  });
});
