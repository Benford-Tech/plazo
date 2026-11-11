import prisma from '@/database';
import { operatorKind, platformTodos } from '@/domain/platform-overview';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 11/11/2026 (« A avec la page loueur de C »): the cockpit of the platform counts the real operators apart, lists what
 * waits on the platform, and each operator has its own page. Fictional data only.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

let admin: Awaited<ReturnType<typeof setupOperator>>;
let real: Awaited<ReturnType<typeof setupOperator>>;
let other: Awaited<ReturnType<typeof setupOperator>>;

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plateforme');
  real = await setupOperator('Parking Exemple');
  other = await setupOperator('Parking Essai');
  await prisma.operator.update({ where: { id: other.operator.id }, data: { name: 'Parking Essai (tests)' } });
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
});
afterEach(() => delete process.env.PLATFORM_ADMIN_EMAILS);
afterAll(() => prisma.$disconnect());

describe('le genre d’un loueur', () => {
  it('réel, de test, démo ou le compte de la plateforme', () => {
    const base = { isDemo: false, prospectDemo: false, isPlatform: false };
    expect(operatorKind({ ...base, name: 'Parking Exemple' })).toBe('real');
    expect(operatorKind({ ...base, name: 'Plazo (tests)' })).toBe('test');
    expect(operatorKind({ ...base, name: 'Parking des Cèdres (démo)', prospectDemo: true })).toBe('demo');
    expect(operatorKind({ ...base, name: 'Plazo (tests)', isPlatform: true })).toBe('platform');
  });

  it('« À traiter » : annonce à valider d’abord, puis ce qui manque à un vrai loueur actif', () => {
    const op = (over: object) => ({
      id: 'o1',
      name: 'Parking Exemple',
      kind: 'real' as const,
      status: 'active',
      listing: null,
      payments: { connected: false },
      contract: null,
      invitation: null,
      ...over,
    });
    const todos = platformTodos(
      [op({}), op({ id: 'o2', kind: 'test', listing: { id: 'l2', status: 'pending_review' } }), op({ id: 'o3', invitation: { expired: true } })],
      new Map([['o1', 2]]),
    );
    expect(todos.map(t => [t.kind, t.operatorId])).toEqual([
      ['listing_review', 'o2'],
      ['payout_failed', 'o1'],
      ['stripe_missing', 'o1'],
      ['invitation_expired', 'o3'],
      ['contract_missing', 'o1'],
    ]);
    expect(todos[1].count).toBe(2);
  });
});

describe('GET /internal/platform/overview', () => {
  it('compte les vrais loueurs à part ; réservé à la plateforme', async () => {
    await api().get('/api/internal/platform/overview').set(auth(real.token)).expect(403);
    const res = await api().get('/api/internal/platform/overview').set(auth(admin.token)).expect(200);
    expect(res.body.operators).toMatchObject({ real: 1, realActive: 1, other: 2 });
    expect(res.body.operatorsList.map((o: { kind: string }) => o.kind).sort()).toEqual(['platform', 'real', 'test']);
    expect(res.body.todos).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'stripe_missing', operatorId: real.operator.id })]));
    expect(res.body.todos.some((t: { operatorId: string }) => t.operatorId === other.operator.id)).toBe(false);
  });
});

describe('GET /internal/platform/operators/:id', () => {
  it('la page d’un loueur : sa ligne, son activité, son équipe et le journal des actions de la plateforme', async () => {
    await api()
      .patch(`/api/internal/platform/operators/${real.operator.id}/commission`)
      .set(auth(admin.token))
      .send({ commissionBps: 1200 })
      .expect(200);
    const res = await api().get(`/api/internal/platform/operators/${real.operator.id}`).set(auth(admin.token)).expect(200);
    expect(res.body).toMatchObject({ id: real.operator.id, kind: 'real', commissionBps: 1200, activity: { bookingsThisMonth: 0, inboxToCheck: 0 } });
    expect(res.body.team).toEqual([expect.objectContaining({ email: real.manager.email, role: 'manager' })]);
    expect(res.body.journal[0]).toMatchObject({ action: 'operator.commission_changed', by: 'Gérant' });
    await api().get('/api/internal/platform/operators/inconnu').set(auth(admin.token)).expect(404);
  });
});
