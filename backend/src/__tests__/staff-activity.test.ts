import prisma from '@/database';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 14/11/2026 (« l'heure de dernière connexion doit être l'heure de dernière activité »).

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('dernière activité du personnel', () => {
  it('chaque requête la tient à jour, au plus toutes les 5 minutes, et la page Équipe la reçoit', async () => {
    const op = await setupOperator();
    const auth = { Authorization: `Bearer ${op.token}` };
    await prisma.staff.update({ where: { id: op.manager.id }, data: { lastActiveAt: null } });

    await api().get('/api/internal/staff/me').set(auth);
    const first = (await prisma.staff.findUniqueOrThrow({ where: { id: op.manager.id } })).lastActiveAt;
    expect(first).not.toBeNull();

    // Within 5 minutes: not rewritten.
    await api().get('/api/internal/staff/me').set(auth);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: op.manager.id } })).lastActiveAt).toEqual(first);

    // Older than 5 minutes: moved forward.
    const old = new Date(Date.now() - 6 * 60 * 1000);
    await prisma.staff.update({ where: { id: op.manager.id }, data: { lastActiveAt: old } });
    await api().get('/api/internal/staff/me').set(auth);
    const moved = (await prisma.staff.findUniqueOrThrow({ where: { id: op.manager.id } })).lastActiveAt!;
    expect(moved.getTime()).toBeGreaterThan(old.getTime());

    const team = await api().get('/api/internal/staff').set(auth);
    const me = (team.body.data ?? team.body).find((m: any) => m.id === op.manager.id);
    expect(new Date(me.lastActiveAt).getTime()).toBe(moved.getTime());
  });
});
