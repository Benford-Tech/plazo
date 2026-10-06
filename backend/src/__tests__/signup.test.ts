import { Container } from 'typedi';
import prisma from '@/database';
import { hashToken } from '@/services/account-token.service';
import { NotificationService } from '@/services/notification.service';
import { api, login, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const notifications = Container.get(NotificationService);
const defaultNotificationSettings = { ...notifications.settings };

let ipCounter = 0;
/** Every test signs up from its own address: the sign-up limit is per IP. */
const signup = (body: Record<string, unknown>, ip = `198.51.100.${++ipCounter}`) =>
  api().post('/api/internal/auth/signup').set('X-Forwarded-For', ip).send(body);

const form = (overrides: Record<string, unknown> = {}) => ({
  companyName: 'Parking Express SARL',
  parkingName: 'Parking Express LYS',
  totalCapacity: 180,
  airportCode: 'LYS',
  firstName: 'Lucie',
  lastName: 'Martin',
  email: 'Lucie.Martin@Example.com',
  phone: '06 12 34 56 78',
  password: PASSWORD,
  passwordConfirmation: PASSWORD,
  acceptTerms: true,
  website: '',
  ...overrides,
});

const tokenOf = (url: string) => url.split('#')[1];

beforeEach(async () => {
  await resetDatabase();
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: '' });
});
afterEach(() => {
  delete process.env.TEST_RATE_LIMITS;
  delete process.env.PLATFORM_ADMIN_EMAILS;
  process.env.NODE_ENV = 'test';
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('inscription libre d’un loueur', () => {
  it('crée le loueur, son parking, sa fiche en brouillon et son gérant (email à confirmer)', async () => {
    const res = await signup(form());
    expect(res.status).toBe(201);
    expect(res.body.message).toEqual(expect.any(String));
    // Brevo is not configured in the tests: the link comes back outside production.
    expect(res.body.devVerificationUrl).toMatch(/\/pro\/verifier-email#[\w-]{43}$/);

    const manager = await prisma.staff.findUniqueOrThrow({
      where: { email: 'lucie.martin@example.com' },
      include: { operator: { include: { parkings: { include: { listing: true } } } } },
    });
    expect(manager).toMatchObject({ role: 'manager', name: 'Lucie Martin', phone: '06 12 34 56 78', emailVerifiedAt: null });
    expect(manager.operator).toMatchObject({ name: 'Parking Express SARL', status: 'active', commissionBps: null });
    expect(manager.operator.parkings).toHaveLength(1);
    expect(manager.operator.parkings[0]).toMatchObject({ name: 'Parking Express LYS', totalCapacity: 180 });
    expect(manager.operator.parkings[0].listing).toMatchObject({ status: 'draft', slug: 'parking-express-lys', title: 'Parking Express LYS' });
    // Only the hash of the link's token is stored.
    const stored = await prisma.accountToken.findFirstOrThrow({ where: { staffId: manager.id } });
    expect(stored.tokenHash).toBe(hashToken(tokenOf(res.body.devVerificationUrl)));
    expect(stored.tokenHash).not.toContain(tokenOf(res.body.devVerificationUrl));

    // Logged in right away; the email is still to confirm.
    const session = await login('lucie.martin@example.com');
    expect(session.user).toMatchObject({ emailVerified: false, isPlatformAdmin: false, viewAs: null, operatorName: 'Parking Express SARL' });
  });

  it('ne laisse pas envoyer la fiche en validation avant la confirmation de l’email', async () => {
    const res = await signup(form());
    const { tokenData } = await login('lucie.martin@example.com');
    const token = tokenData.access.token;
    await api()
      .put('/api/internal/pricing')
      .set(auth(token))
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
    const refused = await api().post('/api/internal/listing/submit').set(auth(token));
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('email_not_verified');

    // The link works once, without a session.
    const verify = await api()
      .post('/api/internal/auth/verify-email')
      .send({ token: tokenOf(res.body.devVerificationUrl) });
    expect(verify.status).toBe(200);
    const again = await api()
      .post('/api/internal/auth/verify-email')
      .send({ token: tokenOf(res.body.devVerificationUrl) });
    expect(again.status).toBe(400);
    expect(again.body.code).toBe('invalid_link');
    expect((await api().get('/api/internal/staff/me').set(auth(token))).body.emailVerified).toBe(true);

    const sent = await api().post('/api/internal/listing/submit').set(auth(token));
    expect(sent.status).toBe(200);
    expect(sent.body.data.status).toBe('pending_review');
  });

  it('renvoie un nouveau lien (l’ancien ne marche plus) et refuse un lien expiré', async () => {
    const first = await signup(form());
    const { tokenData } = await login('lucie.martin@example.com');
    const resent = await api().post('/api/internal/auth/verify-email/resend').set(auth(tokenData.access.token));
    expect(resent.status).toBe(200);
    expect(resent.body.alreadyVerified).toBe(false);
    expect(
      (
        await api()
          .post('/api/internal/auth/verify-email')
          .send({ token: tokenOf(first.body.devVerificationUrl) })
      ).body.code,
    ).toBe('invalid_link');

    await prisma.accountToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(
      (
        await api()
          .post('/api/internal/auth/verify-email')
          .send({ token: tokenOf(resent.body.devVerificationUrl) })
      ).body.code,
    ).toBe('invalid_link');
    expect((await api().post('/api/internal/auth/verify-email').send({ token: 'nimporte-quoi' })).status).toBe(400);
  });

  it('ne dit pas si l’email a déjà un compte : même réponse, et un email au titulaire', async () => {
    const existing = await setupOperator('Déjà là');
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'pro@example.com', publicSiteUrl: 'https://site.example' });
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 201 }));
    const operatorsBefore = await prisma.operator.count();

    const taken = await signup(form({ email: existing.manager.email.toUpperCase() }));
    const fresh = await signup(form({ email: 'nouveau@example.com' }));
    expect(taken.status).toBe(201);
    expect(fresh.status).toBe(201);
    // Brevo configured: no link in either answer, and both answers are identical.
    expect(taken.body).toEqual(fresh.body);
    expect(await prisma.operator.count()).toBe(operatorsBefore + 1);

    const sentTo = fetchSpy.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(sentTo.find(b => b.to[0].email === existing.manager.email)?.tags).toEqual(['signup_existing_account']);
    expect(sentTo.find(b => b.to[0].email === 'nouveau@example.com')?.tags).toEqual(['email_verification']);
    // The existing account is untouched.
    expect((await login(existing.manager.email)).user.email).toBe(existing.manager.email);
  });

  it('ne renvoie jamais le lien en production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await signup(form());
    expect(res.status).toBe(201);
    expect(res.body.devVerificationUrl).toBeUndefined();
  });

  it('ignore les robots (pot de miel) avec la même réponse', async () => {
    const bot = await signup(form({ website: 'https://spam.example' }));
    expect(bot.status).toBe(201);
    expect(bot.body.message).toBe((await signup(form({ email: 'humain@example.com' }))).body.message);
    expect(await prisma.staff.count({ where: { email: 'lucie.martin@example.com' } })).toBe(0);
  });

  it('valide le formulaire', async () => {
    const res = await signup(form({ passwordConfirmation: 'autre-chose-1234' }));
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ passwordConfirmation: 'password_mismatch' });
    expect((await signup(form({ acceptTerms: false }))).body.fields).toEqual({ acceptTerms: 'terms_required' });
    expect((await signup(form({ airportCode: 'XXX' }))).body.fields).toEqual({ airportCode: 'unknown_airport' });
    expect((await signup(form({ password: 'court', passwordConfirmation: 'court' }))).body.fields).toEqual({ password: 'password_too_short' });
    const empty = await signup({});
    expect(Object.keys(empty.body.fields)).toEqual(
      expect.arrayContaining([
        'companyName',
        'parkingName',
        'totalCapacity',
        'airportCode',
        'firstName',
        'lastName',
        'email',
        'phone',
        'password',
        'acceptTerms',
      ]),
    );
    expect(await prisma.operator.count()).toBe(0);
  });

  it('limite les inscriptions par adresse IP', async () => {
    process.env.TEST_RATE_LIMITS = '1';
    const ip = '203.0.113.77';
    for (let i = 0; i < 5; i += 1) expect((await signup(form({ email: `robot${i}@example.com` }), ip)).status).toBe(201);
    const blocked = await signup(form({ email: 'robot6@example.com' }), ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('too_many_requests');
    // Another address is not affected.
    expect((await signup(form({ email: 'autre@example.com' }), '203.0.113.78')).status).toBe(201);
  });

  it('liste les aéroports pour le formulaire', async () => {
    const res = await api().get('/api/public/airports');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'LYS', name: expect.any(String), slug: 'lyon-saint-exupery' })]),
    );
  });
});
