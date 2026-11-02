import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 02/11/2026, « les actions doivent être synchronisées entre l'espace admin et l'application »: the live sync signal. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const version = async (token: string) => {
  const res = await api().get('/api/internal/sync').set(auth(token));
  expect(res.status).toBe(200);
  expect(res.headers['cache-control']).toBe('no-store');
  return res.body.version as string;
};

describe('GET /internal/sync', () => {
  beforeEach(resetDatabase);

  it('moves on every write of the operator, and only of this operator', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre parking');
    const driver = await addStaff(op.token, 'driver');
    const first = await version(driver.token);
    expect(await version(op.token)).toBe(first);

    const created = await api().post('/api/internal/reservations').set(auth(op.token)).send({
      channel: 'phone',
      arrivalAt: '2026-10-04T06:30',
      returnAt: '2026-10-07T15:05',
      passengers: 2,
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerPhone: '06 12 34 56 78',
      plate: 'gk318px',
    });
    expect(created.status).toBe(201);
    const afterCreate = await version(driver.token);
    expect(afterCreate).not.toBe(first);

    // A change that leaves no trace (an import, the test feed) still moves it.
    await prisma.reservation.update({ where: { id: created.body.data.id }, data: { notes: 'mot', updatedAt: new Date(Date.now() + 1000) } });
    const afterUpdate = await version(driver.token);
    expect(afterUpdate).not.toBe(afterCreate);

    const otherBefore = await version(other.token);
    await prisma.reservation.update({ where: { id: created.body.data.id }, data: { notes: 'autre' } });
    expect(await version(other.token)).toBe(otherBefore);
  });

  it('needs a session', async () => {
    expect((await api().get('/api/internal/sync')).status).toBe(401);
  });
});
