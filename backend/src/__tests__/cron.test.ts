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
    expect(res.body).toEqual({ deleted: 1, arrivalSignalsEnded: 0 });
    expect(await prisma.staffToken.count()).toBe(2); // the login's access + refresh pair
  });
});
