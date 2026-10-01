import { LOGIN_MAX_FAILURES } from '@/config';
import prisma from '@/database';
import { api, login, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('POST /internal/auth/login', () => {
  it('connecte sans tenir compte de la casse et ne renvoie jamais le mot de passe', async () => {
    const { manager } = await setupOperator();
    const session = await login(manager.email.toUpperCase());
    expect(session.user).toMatchObject({ id: manager.id, role: 'manager', operatorName: expect.any(String) });
    expect(session.user).not.toHaveProperty('password');
    const me = await api().get('/internal/staff/me').set('Authorization', `Bearer ${session.tokenData.access.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(manager.email);
  });

  it('répond pareil pour un mauvais mot de passe et un email inconnu', async () => {
    const { manager } = await setupOperator();
    const wrong = await api().post('/internal/auth/login').send({ email: manager.email, password: 'nope' });
    const unknown = await api().post('/internal/auth/login').send({ email: 'personne@example.com', password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.code).toBe('invalid_credentials');
  });

  it('bloque un email après trop d’échecs, même avec le bon mot de passe', async () => {
    const { manager } = await setupOperator();
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      await api().post('/internal/auth/login').send({ email: manager.email, password: 'nope' });
    }
    const res = await api().post('/internal/auth/login').send({ email: manager.email, password: PASSWORD });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('too_many_attempts');
  });

  it('valide le corps de la requête', async () => {
    const res = await api().post('/internal/auth/login').send({ email: 'pas-un-email' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toMatchObject({ email: 'invalid_email', password: 'required' });
  });
});

describe('jetons', () => {
  it('refuse les requêtes sans jeton ou avec un jeton invalide', async () => {
    expect((await api().get('/internal/staff/me')).status).toBe(401);
    expect((await api().get('/internal/staff/me').set('Authorization', 'Bearer abc')).status).toBe(401);
  });

  it('refuse un jeton de rafraîchissement utilisé comme jeton d’accès', async () => {
    const { session } = await setupOperator();
    const res = await api().get('/internal/staff/me').set('Authorization', `Bearer ${session.tokenData.refresh.token}`);
    expect(res.status).toBe(401);
  });

  it('le rafraîchissement remplace la paire et révoque l’ancienne', async () => {
    const { session } = await setupOperator();
    const res = await api().post('/internal/auth/refresh').send({ refreshToken: session.tokenData.refresh.token });
    expect(res.status).toBe(200);
    const fresh = res.body.tokenData.access.token;
    expect((await api().get('/internal/staff/me').set('Authorization', `Bearer ${fresh}`)).status).toBe(200);
    expect((await api().get('/internal/staff/me').set('Authorization', `Bearer ${session.tokenData.access.token}`)).status).toBe(401);
    const reuse = await api().post('/internal/auth/refresh').send({ refreshToken: session.tokenData.refresh.token });
    expect(reuse.status).toBe(401);
  });

  it('la déconnexion ne révoque que la session courante', async () => {
    const { manager, token } = await setupOperator();
    const other = await login(manager.email);
    expect((await api().post('/internal/auth/logout').set('Authorization', `Bearer ${token}`)).status).toBe(204);
    expect((await api().get('/internal/staff/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect((await api().get('/internal/staff/me').set('Authorization', `Bearer ${other.tokenData.access.token}`)).status).toBe(200);
  });

  it('un jeton expiré est refusé', async () => {
    const { token } = await setupOperator();
    await prisma.staffToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().get('/internal/staff/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });
});
