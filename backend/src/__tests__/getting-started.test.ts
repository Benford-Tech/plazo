import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 26/10/2026, « Bien démarrer avec Plazo Pro » (choice T-A): the setup steps of a parking, ticked from what Plazo sees. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const get = (token: string) => api().get('/api/internal/getting-started').set(auth(token));

describe('GET /internal/getting-started', () => {
  beforeEach(resetDatabase);

  it('lists the manager’s eight steps, ticked as the parking gets set up', async () => {
    const op = await setupOperator();
    let res = await get(op.token);
    expect(res.status).toBe(200);
    expect(res.body.post).toBe('manager');
    expect(res.body.total).toBe(8);
    expect(res.body.steps.map((s: any) => s.key)).toEqual(['parking', 'bookings', 'team', 'shuttles', 'listing', 'contract', 'sms', 'photo']);
    const byKey = (body: any) => Object.fromEntries(body.steps.map((s: any) => [s.key, s]));
    let steps = byKey(res.body);
    expect(steps.team.done).toBe(false);
    expect(steps.team.detail).toBe('1 membre');
    expect(steps.shuttles.done).toBe(false);
    expect(steps.contract.done).toBe(false);
    expect(steps.contract.detail).toBe('Le modèle Plazo pour l’instant');
    expect(steps.sms.done).toBe(false);

    await addStaff(op.token, 'driver');
    await prisma.shuttleVehicle.create({ data: { operatorId: op.operator.id, model: 'Mercedes Vito', inService: true } });
    await prisma.parking.update({ where: { id: op.parking.id }, data: { address: '1 route de l’aéroport, 69125 Colombier-Saugnieu' } });
    await prisma.reminderSettings.create({ data: { parkingId: op.parking.id } });
    res = await get(op.token);
    steps = byKey(res.body);
    expect(steps.team.done).toBe(true);
    expect(steps.team.detail).toBe('2 membres');
    expect(steps.shuttles.done).toBe(true);
    expect(steps.shuttles.detail).toContain('1 véhicule en service');
    expect(steps.parking.done).toBe(true);
    expect(steps.parking.detail).toBe('200 places déclarées');
    expect(steps.sms.done).toBe(true);
    expect(res.body.done).toBe(4);

    // « Votre photo » (30/10/2026): ticked once the member has a photo.
    expect(steps.photo).toMatchObject({ done: false, detail: 'Ajoutez votre photo dans Mon compte' });
    await prisma.staff.update({ where: { id: op.manager.id }, data: { photoKey: 'staff-photos/x.jpg', photoUpdatedAt: new Date() } });
    steps = byKey((await get(op.token)).body);
    expect(steps.photo).toMatchObject({ done: true, detail: null });
  });

  it('gives a driver their own short list, following their post of the day', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');
    let res = await get(driver.token);
    expect(res.status).toBe(200);
    expect(res.body.post).toBe('driver');
    expect(res.body.steps.map((s: any) => s.key)).toEqual(['post', 'vehicle', 'notifications', 'tracking', 'photo']);
    expect(res.body.steps[0].done).toBe(false);
    expect(res.body.steps[3].done).toBe(true);

    await api().patch('/api/internal/staff/me/post').set(auth(driver.token)).send({ post: 'driver' });
    res = await get(driver.token);
    expect(res.body.steps[0].done).toBe(true);

    // The manager who takes the valet post for the day gets the valet's list.
    await api().patch('/api/internal/staff/me/post').set(auth(op.token)).send({ post: 'valet' });
    res = await get(op.token);
    expect(res.body.post).toBe('valet');
    expect(res.body.steps.map((s: any) => s.key)).toEqual(['post', 'plan', 'keys', 'notifications', 'photo']);
  });

  it('needs a staff session', async () => {
    expect((await api().get('/api/internal/getting-started')).status).toBe(401);
  });
});
