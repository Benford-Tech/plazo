import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const settings = { name: 'P1', address: null, totalCapacity: 300, safetyMarginPct: 5, shuttleTravelMinutes: 10 };

describe('parking', () => {
  it('renvoie le parking avec sa capacité réservable', async () => {
    const { token } = await setupOperator();
    const res = await api().get('/internal/parking').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalCapacity: 200, safetyMarginPct: 0, bookableCapacity: 200 });
  });

  it('met à jour les réglages et trace la modification', async () => {
    const { token, parking, manager } = await setupOperator();
    const res = await api().patch(`/internal/parkings/${parking.id}`).set(auth(token)).send(settings);
    expect(res.status).toBe(200);
    expect(res.body.data.bookableCapacity).toBe(285);
    const logs = await prisma.auditLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'parking.settings_updated', staffId: manager.id });
    expect(logs[0].details).toMatchObject({ totalCapacity: { from: 200, to: 300 } });
  });

  it('est réservé au gérant', async () => {
    const { token, parking } = await setupOperator();
    const agent = await addStaff(token, 'agent');
    expect((await api().get('/internal/parking').set(auth(agent.token))).status).toBe(200);
    expect((await api().patch(`/internal/parkings/${parking.id}`).set(auth(agent.token)).send(settings)).status).toBe(403);
  });

  it('ne touche jamais le parking d’un autre opérateur', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    expect((await api().patch(`/internal/parkings/${b.parking.id}`).set(auth(a.token)).send(settings)).status).toBe(404);
    expect((await api().get('/internal/parking').set(auth(b.token))).body.totalCapacity).toBe(200);
  });

  it('valide les valeurs et la base les protège aussi', async () => {
    const { token, parking } = await setupOperator();
    const res = await api()
      .patch(`/internal/parkings/${parking.id}`)
      .set(auth(token))
      .send({ ...settings, safetyMarginPct: 80 });
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ safetyMarginPct: 'margin_range' });
    await expect(prisma.parking.update({ where: { id: parking.id }, data: { safetyMarginPct: 80 } })).rejects.toThrow();
  });
});
