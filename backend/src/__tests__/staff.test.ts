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
    const res = await api().get('/api/internal/staff').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body.map((m: any) => m.role).sort()).toEqual(['driver', 'manager']);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('est réservée au gérant', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    expect((await api().get('/api/internal/staff').set(auth(driver.token))).status).toBe(403);
    const create = await api()
      .post('/api/internal/staff')
      .set(auth(driver.token))
      .send({ firstName: 'X', lastName: 'Y', email: 'x@example.com', role: 'agent', password: PASSWORD });
    expect(create.status).toBe(403);
  });

  it('refuse un email déjà utilisé et valide les champs', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    const dup = await api()
      .post('/api/internal/staff')
      .set(auth(token))
      .send({ firstName: 'X', lastName: 'Y', email: driver.email.toUpperCase(), role: 'agent', password: PASSWORD });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('email_taken');
    const bad = await api()
      .post('/api/internal/staff')
      .set(auth(token))
      .send({ firstName: '', lastName: 'Y', email: 'x', role: 'boss', password: 'court' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toMatchObject({ firstName: 'required', email: 'invalid_email', role: 'invalid_role', password: 'password_too_short' });
  });

  it('désactiver quelqu’un ferme ses sessions et l’empêche de se reconnecter', async () => {
    const { token } = await setupOperator();
    const valet = await addStaff(token, 'valet');
    const res = await api().patch(`/api/internal/staff/${valet.id}`).set(auth(token)).send({ isActive: false });
    expect(res.status).toBe(200);
    expect((await api().get('/api/internal/staff/me').set(auth(valet.token))).status).toBe(401);
    expect((await api().post('/api/internal/auth/login').send({ email: valet.email, password: PASSWORD })).status).toBe(401);
  });

  it('garde au moins un gérant actif et interdit de se retirer ses droits', async () => {
    const { manager, token } = await setupOperator();
    const self = await api().patch(`/api/internal/staff/${manager.id}`).set(auth(token)).send({ role: 'agent' });
    expect(self.body.code).toBe('cannot_demote_self');
    const second = await addStaff(token, 'manager');
    expect((await api().patch(`/api/internal/staff/${second.id}`).set(auth(token)).send({ role: 'agent' })).status).toBe(200);
    const last = await api().patch(`/api/internal/staff/${manager.id}`).set(auth(second.token)).send({ isActive: false });
    expect(last.status).toBe(403); // second is no longer a manager
  });

  it('ne gère pas le personnel d’un autre opérateur', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    expect((await api().patch(`/api/internal/staff/${b.manager.id}`).set(auth(a.token)).send({ isActive: false })).status).toBe(404);
    const reset = await api()
      .post(`/api/internal/staff/${b.manager.id}/reset-password`)
      .set(auth(a.token))
      .send({ password: 'nouveau-mot-de-passe' });
    expect(reset.status).toBe(404);
  });

  it('la réinitialisation et le changement de mot de passe invalident les anciens accès', async () => {
    const { token } = await setupOperator();
    const agent = await addStaff(token, 'agent');
    await api().post(`/api/internal/staff/${agent.id}/reset-password`).set(auth(token)).send({ password: 'provisoire-123' });
    expect((await api().get('/api/internal/staff/me').set(auth(agent.token))).status).toBe(401);
    expect((await api().post('/api/internal/auth/login').send({ email: agent.email, password: PASSWORD })).status).toBe(401);

    const session = await login(agent.email, 'provisoire-123');
    const t = session.tokenData.access.token;
    const wrong = await api().patch('/api/internal/staff/me/password').set(auth(t)).send({ currentPassword: 'faux', newPassword: 'definitif-456' });
    expect(wrong.body.code).toBe('wrong_current_password');
    expect(
      (await api().patch('/api/internal/staff/me/password').set(auth(t)).send({ currentPassword: 'provisoire-123', newPassword: 'definitif-456' }))
        .status,
    ).toBe(200);
    expect((await api().get('/api/internal/staff/me').set(auth(t))).status).toBe(401);
    await login(agent.email, 'definitif-456');
  });

  it('poste du jour (R-C) : parmi ceux que le rôle couvre, visible par le gérant', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    const me = await api().get('/api/internal/staff/me').set(auth(driver.token));
    expect(me.body).toMatchObject({ post: null, effectivePost: 'driver', allowedPosts: ['driver', 'valet'] });
    // A driver may park cars, not manage the team.
    const refused = await api().patch('/api/internal/staff/me/post').set(auth(driver.token)).send({ post: 'manager' });
    expect(refused.status).toBe(422);
    expect(refused.body.code).toBe('post_not_allowed');
    expect((await api().patch('/api/internal/staff/me/post').set(auth(driver.token)).send({ post: 'nope' })).status).toBe(400);
    const set = await api().patch('/api/internal/staff/me/post').set(auth(driver.token)).send({ post: 'valet' });
    expect(set.status).toBe(200);
    expect(set.body).toMatchObject({ post: 'valet', effectivePost: 'valet', role: 'driver' });
    expect(set.body.postSetAt).toBeTruthy();
    // The manager sees who holds which post today; a manager may take any post.
    const team = await api().get('/api/internal/staff').set(auth(token));
    expect(team.body.find((m: { id: string }) => m.id === driver.id)).toMatchObject({ post: 'valet', effectivePost: 'valet' });
    expect((await api().get('/api/internal/staff/me').set(auth(token))).body.allowedPosts).toEqual(['manager', 'agent', 'driver', 'valet']);
    expect((await api().patch('/api/internal/staff/me/post').set(auth(token)).send({ post: 'driver' })).body.effectivePost).toBe('driver');
  });
});

describe('prénom et nom du personnel (09/10/2026)', () => {
  it('« Votre nom » : chacun change son prénom et son nom ; réponse comme GET /me, nom affiché recalculé, tracé', async () => {
    const { token, manager } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    const res = await api().patch('/api/internal/staff/me').set(auth(driver.token)).send({ firstName: '  Jean-Luc ', lastName: ' Dupont  Martin ' });
    expect(res.status).toBe(200);
    const me = await api().get('/api/internal/staff/me').set(auth(driver.token));
    expect(res.body).toEqual(me.body);
    expect(me.body).toMatchObject({
      id: driver.id,
      firstName: 'Jean-Luc',
      lastName: 'Dupont Martin',
      name: 'Jean-Luc Dupont Martin',
      role: 'driver',
    });
    expect(me.body).not.toHaveProperty('password');
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'staff.renamed', entityId: driver.id } });
    expect(audit.details).toMatchObject({ name: { from: expect.stringContaining('driver'), to: 'Jean-Luc Dupont Martin' } });
    // The manager's name is untouched.
    expect(await prisma.staff.findUniqueOrThrow({ where: { id: manager.id } })).toMatchObject({ name: 'Gérant Test' });
  });

  it('« Votre nom » : les deux sont requis, sans espaces seuls, 60 caractères chacun', async () => {
    const { token } = await setupOperator();
    const me = (body: Record<string, unknown>) => api().patch('/api/internal/staff/me').set(auth(token)).send(body);
    expect((await me({})).body.fields).toEqual({ firstName: 'required', lastName: 'required' });
    expect((await me({ firstName: '   ', lastName: 'Dupont' })).body.fields).toEqual({ firstName: 'required' });
    expect((await me({ firstName: 'Jean', lastName: 'D'.repeat(61) })).body.fields).toEqual({ lastName: 'too_long' });
    expect((await api().get('/api/internal/staff/me').set(auth(token))).body.name).toBe('Gérant Test');
  });

  it('« Modifier le nom » : le gérant renomme un membre (l’un, l’autre ou les deux), pas un autre rôle', async () => {
    const { token } = await setupOperator();
    const valet = await addStaff(token, 'valet');
    const agent = await addStaff(token, 'agent');
    const patch = (who: string, body: Record<string, unknown>, as = token) => api().patch(`/api/internal/staff/${who}`).set(auth(as)).send(body);

    const both = await patch(valet.id, { firstName: ' Sami ', lastName: 'Benali' });
    expect(both.status).toBe(200);
    expect(both.body.data).toMatchObject({ firstName: 'Sami', lastName: 'Benali', name: 'Sami Benali', role: 'valet', isActive: true });
    expect(both.body.data).not.toHaveProperty('password');
    const last = await patch(valet.id, { lastName: 'Ben Ali' });
    expect(last.body.data).toMatchObject({ firstName: 'Sami', lastName: 'Ben Ali', name: 'Sami Ben Ali' });
    // With the role in the same request.
    expect((await patch(valet.id, { role: 'driver', firstName: 'Samir' })).body.data).toMatchObject({ role: 'driver', name: 'Samir Ben Ali' });

    expect((await patch(valet.id, { firstName: '  ' })).body.fields).toEqual({ firstName: 'required' });
    expect((await patch(valet.id, { lastName: null })).body.fields).toEqual({ lastName: 'required' });
    expect((await patch(valet.id, { firstName: 'S'.repeat(61) })).body.fields).toEqual({ firstName: 'too_long' });
    expect((await patch(valet.id, { firstName: 'Intrus' }, agent.token)).status).toBe(403);
    expect(await prisma.staff.findUniqueOrThrow({ where: { id: valet.id } })).toMatchObject({ name: 'Samir Ben Ali' });

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'staff.updated', entityId: valet.id }, orderBy: { createdAt: 'asc' } });
    expect(audit.details).toMatchObject({ name: { from: expect.stringContaining('valet'), to: 'Sami Benali' } });
  });

  it('un prénom ou un nom fait d’espaces est « required » à la création', async () => {
    const { token } = await setupOperator();
    const res = await api()
      .post('/api/internal/staff')
      .set(auth(token))
      .send({ firstName: '   ', lastName: ' \t ', email: 'blanc@example.com', role: 'agent', password: PASSWORD });
    expect(res.body.fields).toMatchObject({ firstName: 'required', lastName: 'required' });
    const trimmed = await api()
      .post('/api/internal/staff')
      .set(auth(token))
      .send({ firstName: ' Inès ', lastName: ' Rousseau ', email: 'ines@example.com', role: 'agent', password: PASSWORD });
    expect(trimmed.body.data).toMatchObject({ firstName: 'Inès', lastName: 'Rousseau', name: 'Inès Rousseau' });
  });
});
