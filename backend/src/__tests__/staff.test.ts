import prisma from '@/database';
import { addStaff, api, login, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('équipe', () => {
  it('ne liste que le personnel de l’opérateur, sans mot de passe', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    await addStaff(a.token, 'driver');
    await addStaff(b.token, 'agent');
    const res = await api().get('/internal/staff').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body.map((m: any) => m.role).sort()).toEqual(['driver', 'manager']);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('est réservée au gérant', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    expect((await api().get('/internal/staff').set(auth(driver.token))).status).toBe(403);
    const create = await api()
      .post('/internal/staff')
      .set(auth(driver.token))
      .send({ name: 'X', email: 'x@example.com', role: 'agent', password: PASSWORD });
    expect(create.status).toBe(403);
  });

  it('refuse un email déjà utilisé et valide les champs', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    const dup = await api()
      .post('/internal/staff')
      .set(auth(token))
      .send({ name: 'X', email: driver.email.toUpperCase(), role: 'agent', password: PASSWORD });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('email_taken');
    const bad = await api().post('/internal/staff').set(auth(token)).send({ name: '', email: 'x', role: 'boss', password: 'court' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toMatchObject({ name: 'required', email: 'invalid_email', role: 'invalid_role', password: 'password_too_short' });
  });

  it('désactiver quelqu’un ferme ses sessions et l’empêche de se reconnecter', async () => {
    const { token } = await setupOperator();
    const valet = await addStaff(token, 'valet');
    const res = await api().patch(`/internal/staff/${valet.id}`).set(auth(token)).send({ isActive: false });
    expect(res.status).toBe(200);
    expect((await api().get('/internal/staff/me').set(auth(valet.token))).status).toBe(401);
    expect((await api().post('/internal/auth/login').send({ email: valet.email, password: PASSWORD })).status).toBe(401);
  });

  it('garde au moins un gérant actif et interdit de se retirer ses droits', async () => {
    const { manager, token } = await setupOperator();
    const self = await api().patch(`/internal/staff/${manager.id}`).set(auth(token)).send({ role: 'agent' });
    expect(self.body.code).toBe('cannot_demote_self');
    const second = await addStaff(token, 'manager');
    expect((await api().patch(`/internal/staff/${second.id}`).set(auth(token)).send({ role: 'agent' })).status).toBe(200);
    const last = await api().patch(`/internal/staff/${manager.id}`).set(auth(second.token)).send({ isActive: false });
    expect(last.status).toBe(403); // second is no longer a manager
  });

  it('ne gère pas le personnel d’un autre opérateur', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    expect((await api().patch(`/internal/staff/${b.manager.id}`).set(auth(a.token)).send({ isActive: false })).status).toBe(404);
    const reset = await api().post(`/internal/staff/${b.manager.id}/reset-password`).set(auth(a.token)).send({ password: 'nouveau-mot-de-passe' });
    expect(reset.status).toBe(404);
  });

  it('la réinitialisation et le changement de mot de passe invalident les anciens accès', async () => {
    const { token } = await setupOperator();
    const agent = await addStaff(token, 'agent');
    await api().post(`/internal/staff/${agent.id}/reset-password`).set(auth(token)).send({ password: 'provisoire-123' });
    expect((await api().get('/internal/staff/me').set(auth(agent.token))).status).toBe(401);
    expect((await api().post('/internal/auth/login').send({ email: agent.email, password: PASSWORD })).status).toBe(401);

    const session = await login(agent.email, 'provisoire-123');
    const t = session.tokenData.access.token;
    const wrong = await api().patch('/internal/staff/me/password').set(auth(t)).send({ currentPassword: 'faux', newPassword: 'definitif-456' });
    expect(wrong.body.code).toBe('wrong_current_password');
    expect(
      (await api().patch('/internal/staff/me/password').set(auth(t)).send({ currentPassword: 'provisoire-123', newPassword: 'definitif-456' }))
        .status,
    ).toBe(200);
    expect((await api().get('/internal/staff/me').set(auth(t))).status).toBe(401);
    await login(agent.email, 'definitif-456');
  });
});
