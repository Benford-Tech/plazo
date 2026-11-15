import { Container } from 'typedi';
import prisma from '@/database';
import { AppUsageService } from '@/services/app-usage.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// Plateforme › Applications (15/11/2026, « Suivre le nombre de téléchargements et d'utilisation de plazo »).

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(() => resetDatabase());
afterAll(() => prisma.$disconnect());

describe('applications', () => {
  it('counts the Plazo phones once a day, the Plazo Pro members, and refuses everyone but the platform', async () => {
    const op = await setupOperator();
    const admin = await setupOperator('Plateforme');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;

    // Two phones open the app, one of them twice.
    for (const [id, platform] of [
      ['phone-ios-0001', 'ios'],
      ['phone-android-01', 'android'],
      ['phone-ios-0001', 'ios'],
    ]) {
      expect((await api().put(`/api/public/app-devices/${id}`).send({ platform })).status).toBe(200);
    }
    // A member of the parking uses Plazo Pro.
    expect((await api().get('/api/internal/staff/me').set(auth(op.token))).status).toBe(200);
    // The prospects' demo and a test operator are not counted in Plazo Pro.
    const test = await setupOperator('Essais');
    await prisma.operator.update({ where: { id: test.operator.id }, data: { name: 'Essais (tests)' } });
    await Container.get(AppUsageService).recordPro(test.manager.id);

    expect((await api().get('/api/internal/platform/apps').set(auth(op.token))).status).toBe(403);
    const res = await api().get('/api/internal/platform/apps?days=7').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(7);
    expect(res.body.series).toHaveLength(7);
    expect(res.body.plazo).toMatchObject({ installs: 2, installsBefore: 0, activeToday: 2, active7: 2, phones: 2, bookings: 0 });
    expect(res.body.plazo.platforms).toEqual(
      expect.arrayContaining([
        { platform: 'ios', count: 1 },
        { platform: 'android', count: 1 },
      ]),
    );
    // The parking's manager and the platform admin (both real operators) used Plazo Pro today.
    expect(res.body.pro.activeToday).toBe(2);
    expect(res.body.pro.members).toBe(2);
    expect(res.body.pro.activeOperators7).toBe(2);
    const today = res.body.series[res.body.series.length - 1];
    expect(today).toMatchObject({ installs: 2, plazoActive: 2, proActive: 2 });
    expect(res.body.measuredSince).toBe(res.body.to);

    // Unknown period → 30 days; old rows are purged after 400 days.
    expect((await api().get('/api/internal/platform/apps?days=12').set(auth(admin.token))).body.days).toBe(30);
    await prisma.$executeRaw`INSERT INTO app_activity_days ("day", "app", "subject") VALUES (CURRENT_DATE - 500, 'plazo', 'old')`;
    expect(await Container.get(AppUsageService).purge()).toBe(1);
  });
});
