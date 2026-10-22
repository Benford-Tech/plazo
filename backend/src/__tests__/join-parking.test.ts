import { Container } from 'typedi';
import { joinCodeSecret } from '@/config';
import prisma from '@/database';
import { formatJoinCode, joinCodeFor, joinCodeValidUntil } from '@/domain/join-code';
import { subjectKeyOf } from '@/domain/join-request';
import { addDays, localDate } from '@/domain/time';
import { OnboardingService } from '@/services/onboarding.service';
import { OperatorService } from '@/services/operator.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { APPLE_REVOKE_URL, APPLE_TOKEN_URL } from '@/services/identity-verification.service';
import { addStaff, api, login, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';
import { appleIdentityToken, FakeProviders, googleIdToken, installFakeProviders, removeFakeProviders } from './utils/identity';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
type Op = Awaited<ReturnType<typeof setupOperator>>;

let fake: FakeProviders;
let fetchMock: jest.SpyInstance;

beforeEach(async () => {
  await resetDatabase();
  fake = installFakeProviders();
  process.env.ONESIGNAL_APP_ID = 'app';
  process.env.ONESIGNAL_REST_API_KEY = 'key';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  removeFakeProviders();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.PLATFORM_ADMIN_EMAILS;
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

// ---------------------------------------------------------------- helpers

function appleSignIn(sub = 'apple-julie', options: { email?: string | null; names?: boolean } = {}) {
  return api()
    .post('/api/internal/auth/apple')
    .send({
      identityToken: appleIdentityToken({ sub, email: options.email === undefined ? 'julie.m@icloud.com' : options.email, rawNonce: 'nonce-1' }),
      rawNonce: 'nonce-1',
      ...(options.names === false ? {} : { givenName: 'Julie', familyName: 'Martin' }),
    });
}

function googleSignIn(sub = 'google-karim', email = 'karim.b@gmail.com') {
  return api()
    .post('/api/internal/auth/google')
    .send({ idToken: googleIdToken({ sub, email }) });
}

/** Signs in with Apple and returns the onboarding token. */
async function onboard(sub = 'apple-julie', email: string | null = 'julie.m@icloud.com') {
  const res = await appleSignIn(sub, { email });
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('onboarding');
  return res.body.onboardingToken as string;
}

/** Today's code of an operator, as its managers read it. */
async function codeOf(op: Op) {
  const res = await api().get('/api/internal/staff/join-code').set(auth(op.token));
  expect(res.status).toBe(200);
  return res.body.code as string;
}

function join(token: string, code: string, body: Record<string, unknown> = {}) {
  return api()
    .post('/api/internal/auth/onboarding/join')
    .set(auth(token))
    .send({ code, firstName: 'Julie', lastName: 'Martin', wishedRole: 'driver', ...body });
}

/** A pending request of an Apple identity to join `op`; returns the onboarding token and the request id. */
async function pendingRequest(op: Op, sub = 'apple-julie', email = 'julie.m@icloud.com') {
  const token = await onboard(sub, email);
  const res = await join(token, await codeOf(op));
  expect(res.status).toBe(201);
  return { token, requestId: res.body.request.id as string };
}

/** An Apple identity accepted into `op` with its staff session. */
async function joinedMember(op: Op, role = 'driver', sub = 'apple-julie', email = 'julie.m@icloud.com') {
  const { token, requestId } = await pendingRequest(op, sub, email);
  const accepted = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role });
  expect(accepted.status).toBe(201);
  const session = await api().post('/api/internal/auth/onboarding/session').set(auth(token));
  expect(session.status).toBe(200);
  return { staffId: accepted.body.staff.id as string, staffToken: session.body.tokenData.access.token as string, user: session.body.user, sub };
}

const pushes = () =>
  fetchMock.mock.calls
    .filter(([url]) => url === ONESIGNAL_NOTIFICATIONS_URL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>);

// ---------------------------------------------------------------- sign-in

describe('connexion avec Apple ou Google', () => {
  it('dit quels boutons montrer', async () => {
    expect((await api().get('/api/internal/auth/providers')).body).toEqual({
      apple: true,
      google: true,
      googleClientId: 'autre-client.apps.googleusercontent.com',
    });
    removeFakeProviders();
    expect((await api().get('/api/internal/auth/providers')).body).toEqual({ apple: false, google: false, googleClientId: null });
  });

  it('Apple : une identité inconnue reçoit une session d’accueil, son nom est gardé', async () => {
    const res = await appleSignIn();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'onboarding',
      identity: { provider: 'apple', email: 'julie.m@icloud.com', isPrivateEmail: false, firstName: 'Julie', lastName: 'Martin' },
      request: null,
    });
    expect(typeof res.body.onboardingToken).toBe('string');
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000);

    // Apple sends the name only once: a later sign-in without it keeps it.
    const again = await appleSignIn('apple-julie', { names: false });
    expect(again.body.identity).toMatchObject({ firstName: 'Julie', lastName: 'Martin' });
    expect(await prisma.staffIdentity.count()).toBe(1);
    const state = await api().get('/api/internal/auth/onboarding').set(auth(again.body.onboardingToken));
    expect(state.status).toBe(200);
    expect(state.body).toEqual({ identity: again.body.identity, request: null });
  });

  it('Google : le nom vient du jeton', async () => {
    const res = await googleSignIn();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'onboarding',
      identity: { provider: 'google', email: 'karim.b@gmail.com', firstName: 'Karim', lastName: 'Benali' },
    });
  });

  it('refuse un jeton invalide, un fournisseur non configuré, et répond 503 quand il est injoignable', async () => {
    const bad = await api()
      .post('/api/internal/auth/apple')
      .send({ identityToken: appleIdentityToken({ sub: 'x', rawNonce: 'a' }), rawNonce: 'b' });
    expect(bad.status).toBe(401);
    expect(bad.body.code).toBe('identity_invalid');
    expect((await api().post('/api/internal/auth/apple').send({})).body).toMatchObject({
      code: 'validation_failed',
      fields: { identityToken: 'required', rawNonce: 'required' },
    });
    fake.down = true;
    expect((await googleSignIn()).body.code).toBe('provider_unreachable');
    removeFakeProviders();
    const off = await googleSignIn();
    expect(off.status).toBe(409);
    expect(off.body.code).toBe('provider_unavailable');
    expect(await prisma.staffIdentity.count()).toBe(0);
  });

  it('le jeton d’accueil ne vaut rien sur les routes du personnel, ni l’inverse', async () => {
    const op = await setupOperator();
    const token = await onboard();
    expect((await api().get('/api/internal/staff/me').set(auth(token))).status).toBe(401);
    expect((await api().get('/api/internal/dashboard').set(auth(token))).status).toBe(401);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(op.token))).status).toBe(401);
    expect((await api().get('/api/internal/auth/onboarding').set(auth('pas-un-jeton'))).status).toBe(401);
    expect((await api().get('/api/internal/auth/onboarding')).status).toBe(401);
    // « Utiliser un autre compte » revokes it.
    expect((await api().post('/api/internal/auth/onboarding/logout').set(auth(token))).status).toBe(204);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).status).toBe(401);
  });

  it('un membre relié se connecte comme avec son mot de passe ; suspendu ou désactivé, il est refusé', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op, 'valet');
    const res = await appleSignIn('apple-julie', { names: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'signed_in', user: { id: member.staffId, role: 'valet', hasPassword: false } });
    expect((await api().get('/api/internal/staff/me').set(auth(res.body.tokenData.access.token))).status).toBe(200);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } })).lastLoginAt).not.toBeNull();

    await api().patch(`/api/internal/staff/${member.staffId}`).set(auth(op.token)).send({ isActive: false });
    expect((await appleSignIn()).body.code).toBe('account_disabled');
    await prisma.operator.update({ where: { id: op.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    const suspended = await appleSignIn();
    expect(suspended.status).toBe(403);
    expect(suspended.body.code).toBe('account_suspended');
  });
});

// ---------------------------------------------------------------- joining

describe('rejoindre un parking avec le code du jour', () => {
  it('le gérant lit le code, la recrue le tape, le gérant accepte, la recrue entre', async () => {
    const op = await setupOperator('Parkair');
    const agent = await addStaff(op.token, 'agent');
    await prisma.staffDevice.createMany({
      data: [
        { staffId: op.manager.id, subscriptionId: 'tel-gerant' },
        { staffId: agent.id, subscriptionId: 'tel-agent' },
      ],
    });

    const codeRes = await api().get('/api/internal/staff/join-code').set(auth(op.token));
    expect(codeRes.status).toBe(200);
    const today = localDate(new Date(), 'Europe/Paris');
    expect(codeRes.body).toEqual({
      code: formatJoinCode(joinCodeFor(joinCodeSecret(), op.operator.id, today)),
      day: today,
      validUntil: joinCodeValidUntil(today, 'Europe/Paris').toISOString(),
      operatorName: op.operator.name,
      accepting: true,
    });
    expect(codeRes.body.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);

    const token = await onboard();
    // Pasted in lower case without the dash: still the code.
    const typed = codeRes.body.code.toLowerCase().replace('-', ' ');
    const sent = await join(token, typed, { wishedRole: 'driver' });
    expect(sent.status).toBe(201);
    expect(sent.body.request).toMatchObject({
      status: 'pending',
      operatorName: op.operator.name,
      firstName: 'Julie',
      lastName: 'Martin',
      wishedRole: 'driver',
      role: null,
      decidedAt: null,
    });
    const requestId = sent.body.request.id;

    // The managers only, always: « Demande pour rejoindre l’équipe ».
    const [push] = pushes();
    expect(push).toMatchObject({
      include_subscription_ids: ['tel-gerant'],
      headings: { fr: 'Demande pour rejoindre l’équipe' },
      contents: { fr: `Julie Martin veut rejoindre ${op.operator.name} comme chauffeur.` },
      data: { type: 'join_request', requestId },
    });
    expect(pushes()).toHaveLength(1);
    expect(await prisma.auditLog.findFirst({ where: { action: 'staff.join_requested' } })).toMatchObject({
      operatorId: op.operator.id,
      staffId: null,
      entityId: requestId,
      details: { wishedRole: 'driver' },
    });
    // The code typed is never stored.
    const attempts = await prisma.joinAttempt.findMany();
    expect(attempts).toHaveLength(1);
    expect(JSON.stringify(attempts)).not.toContain(codeRes.body.code.replace('-', ''));

    const list = await api().get('/api/internal/staff/join-requests').set(auth(op.token));
    expect(list.body).toEqual({
      data: [
        {
          id: requestId,
          firstName: 'Julie',
          lastName: 'Martin',
          email: 'julie.m@icloud.com',
          isPrivateEmail: false,
          provider: 'apple',
          wishedRole: 'driver',
          createdAt: expect.any(String),
          expiresAt: expect.any(String),
        },
      ],
    });
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toMatchObject({ id: requestId, status: 'pending' });
    const early = await api().post('/api/internal/auth/onboarding/session').set(auth(token));
    expect(early.status).toBe(409);
    expect(early.body.code).toBe('join_request_pending');

    // The manager accepts as valet (not the post asked for).
    const accepted = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'valet' });
    expect(accepted.status).toBe(201);
    expect(accepted.body.staff).toMatchObject({
      role: 'valet',
      email: 'julie.m@icloud.com',
      name: 'Julie Martin',
      signIn: ['apple'],
      isActive: true,
    });
    expect(accepted.body.staff).not.toHaveProperty('password');
    const staffId = accepted.body.staff.id;
    const row = await prisma.staff.findUniqueOrThrow({ where: { id: staffId } });
    expect(row).toMatchObject({ operatorId: op.operator.id, passwordSetAt: null, bookingNotify: 'immediate' });
    expect(row.emailVerifiedAt).not.toBeNull();
    expect(await prisma.auditLog.findFirst({ where: { action: 'staff.joined' } })).toMatchObject({
      staffId: op.manager.id,
      entityId: staffId,
      details: { via: 'join_code', role: 'valet', requestId },
    });

    // The waiting screen sees the answer, then opens the staff session.
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toMatchObject({ status: 'accepted', role: 'valet' });
    const session = await api().post('/api/internal/auth/onboarding/session').set(auth(token));
    expect(session.status).toBe(200);
    expect(session.body.user).toMatchObject({
      id: staffId,
      role: 'valet',
      operatorName: op.operator.name,
      hasPassword: false,
      identities: [{ provider: 'apple', email: 'julie.m@icloud.com' }],
    });
    expect(session.body.user).not.toHaveProperty('password');
    expect((await api().get('/api/internal/staff/me').set(auth(session.body.tokenData.access.token))).status).toBe(200);
    // The onboarding is over.
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).status).toBe(401);

    const team = await api().get('/api/internal/staff').set(auth(op.token));
    expect(team.body.find((m: any) => m.id === staffId).signIn).toEqual(['apple']);
    expect(team.body.find((m: any) => m.id === op.manager.id).signIn).toEqual(['password']);
    expect((await api().get('/api/internal/staff/join-requests').set(auth(op.token))).body.data).toEqual([]);
  });

  it('refuser : la personne le voit et peut redemander avec un nouveau code', async () => {
    const op = await setupOperator();
    const { token, requestId } = await pendingRequest(op);
    const refused = await api().post(`/api/internal/staff/join-requests/${requestId}/refuse`).set(auth(op.token));
    expect(refused.status).toBe(200);
    expect(refused.body.request).toMatchObject({ id: requestId, status: 'refused', decidedAt: expect.any(String) });
    expect(await prisma.auditLog.count({ where: { action: 'staff.join_refused', entityId: requestId } })).toBe(1);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toMatchObject({ status: 'refused' });
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'agent' })).body.code).toBe(
      'join_request_closed',
    );
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/refuse`).set(auth(op.token))).status).toBe(409);
    expect((await join(token, await codeOf(op))).status).toBe(201);
    // A refusal older than a week is no longer shown.
    await prisma.staffJoinRequest.updateMany({ where: { id: requestId }, data: { decidedAt: new Date(Date.now() - 8 * 86_400_000) } });
    await prisma.staffJoinRequest.deleteMany({ where: { NOT: { id: requestId } } });
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toBeNull();
  });

  it('annuler sa demande', async () => {
    const op = await setupOperator();
    const { token, requestId } = await pendingRequest(op);
    const cancelled = await api().delete('/api/internal/auth/onboarding/request').set(auth(token));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.request).toMatchObject({ id: requestId, status: 'cancelled' });
    expect((await api().delete('/api/internal/auth/onboarding/request').set(auth(token))).body.code).toBe('join_request_closed');
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' })).status).toBe(409);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toMatchObject({ status: 'cancelled' });
  });

  it('une demande sans réponse expire après 7 jours ; la nuit la marque', async () => {
    const op = await setupOperator();
    const { token, requestId } = await pendingRequest(op);
    expect(new Date((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).expiresAt).getTime()).toBeGreaterThan(
      Date.now() + 6.9 * 86_400_000,
    );
    await prisma.staffJoinRequest.update({ where: { id: requestId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).body.request).toMatchObject({ status: 'expired' });
    expect((await api().get('/api/internal/staff/join-requests').set(auth(op.token))).body.data).toEqual([]);
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' })).body.code).toBe(
      'join_request_closed',
    );
    const purge = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(purge.body.joinRequestsExpired).toBe(1);
    expect((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe('expired');
    // A new request can be sent.
    expect((await join(token, await codeOf(op))).status).toBe(201);
  });

  it('même réponse pour un code faux, d’hier, ou d’un loueur suspendu, archivé ou de démonstration', async () => {
    const op = await setupOperator();
    const today = localDate(new Date(), 'Europe/Paris');
    const codeFor = (operatorId: string, day = today) => formatJoinCode(joinCodeFor(joinCodeSecret(), operatorId, day));
    const expectInvalid = async (sub: string, code: string) => {
      const res = await join(await onboard(sub, `${sub}@icloud.com`), code);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: 'join_code_invalid' });
    };
    await expectInvalid('faux', 'K7QM2-XP9TD');
    await expectInvalid('court', 'K7QM2');
    await expectInvalid('hier', codeFor(op.operator.id, addDays(today, -1)));

    const suspended = await setupOperator('Suspendu');
    await prisma.operator.update({ where: { id: suspended.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    await expectInvalid('suspendu', codeFor(suspended.operator.id));
    const archived = await setupOperator('Archivé');
    await prisma.operator.update({
      where: { id: archived.operator.id },
      data: { status: 'suspended', suspendedAt: new Date(), archivedAt: new Date() },
    });
    await expectInvalid('archive', codeFor(archived.operator.id));
    const demo = await setupOperator('Démo');
    await prisma.operator.update({ where: { id: demo.operator.id }, data: { isDemo: true } });
    await expectInvalid('demo', codeFor(demo.operator.id));
    expect((await api().get('/api/internal/staff/join-code').set(auth(demo.token))).body.accepting).toBe(false);

    // « Plazo (tests) », the platform's own account, accepts codes.
    const platform = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = platform.manager.email;
    expect((await join(await onboard('plateforme', 'p@icloud.com'), await codeOf(platform))).status).toBe(201);
    expect(await prisma.staffJoinRequest.count()).toBe(1);
  });

  it('valide les champs : jamais gérant, prénom et nom requis', async () => {
    const op = await setupOperator();
    const token = await onboard();
    const res = await join(token, await codeOf(op), { wishedRole: 'manager', firstName: '  ', lastName: 'x'.repeat(61) });
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ wishedRole: 'invalid_role', firstName: 'required', lastName: 'too_long' });
    expect((await join(token, '')).body.fields).toMatchObject({ code: 'required' });
    const { requestId } = await pendingRequest(op, 'autre', 'autre@icloud.com');
    const promote = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'manager' });
    expect(promote.body).toMatchObject({ code: 'validation_failed', fields: { role: 'invalid_role' } });
  });

  it('une demande à la fois, un seul parking par compte', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    const { token, requestId } = await pendingRequest(op);
    const twice = await join(token, await codeOf(other));
    expect(twice.status).toBe(409);
    expect(twice.body.code).toBe('join_request_pending');
    await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' });
    const member = await join(token, await codeOf(other));
    expect(member.status).toBe(409);
    expect(member.body.code).toBe('already_member');
  });

  it('refuse une adresse déjà utilisée par un compte Plazo, à la demande comme à l’acceptation', async () => {
    const op = await setupOperator();
    await api()
      .post('/api/internal/staff')
      .set(auth(op.token))
      .send({ firstName: 'Julie', lastName: 'Martin', email: 'julie.m@icloud.com', role: 'agent', password: PASSWORD });
    const taken = await join(await onboard(), await codeOf(op));
    expect(taken.status).toBe(409);
    expect(taken.body.code).toBe('email_taken');

    const { requestId } = await pendingRequest(op, 'apple-karim', 'karim@icloud.com');
    await api()
      .post('/api/internal/staff')
      .set(auth(op.token))
      .send({ firstName: 'Karim', lastName: 'B', email: 'karim@icloud.com', role: 'agent', password: PASSWORD });
    const late = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('email_taken');
    expect((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe('pending');
  });

  it('une identité sans adresse reçoit une adresse de remplacement', async () => {
    const op = await setupOperator();
    const token = await onboard('sans-adresse', null);
    expect((await join(token, await codeOf(op))).status).toBe(201);
    const request = await prisma.staffJoinRequest.findFirstOrThrow({ include: { identity: true } });
    expect(request.email).toBe(`apple-${request.identity.id}@plazo.invalid`);
  });

  it('limite les codes faux : 5 en 15 minutes par compte, 20 en 24 heures, 30 par heure par adresse', async () => {
    const op = await setupOperator();
    const token = await onboard();
    for (let i = 0; i < 5; i += 1) expect((await join(token, `AAAAA-AAAA${i}`)).status).toBe(400);
    const blocked = await join(token, await codeOf(op));
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('too_many_attempts');
    const subjectKey = subjectKeyOf({ provider: 'apple', subject: 'apple-julie' });
    const ipKey = (await prisma.joinAttempt.findFirstOrThrow()).ipKey;
    // Counted on the account's hash, never its raw subject; the refused attempt is not kept.
    expect(await prisma.joinAttempt.count({ where: { subjectKey } })).toBe(5);

    // A quarter of an hour later the short window is clear, but not the day's.
    await prisma.joinAttempt.updateMany({ data: { createdAt: new Date(Date.now() - 20 * 60_000) } });
    expect((await join(token, await codeOf(op))).status).toBe(201);
    await prisma.staffJoinRequest.deleteMany();
    await prisma.joinAttempt.createMany({
      data: Array.from({ length: 15 }, () => ({
        subjectKey,
        ipKey: 'ailleurs',
        success: false,
        createdAt: new Date(Date.now() - 3 * 3600_000),
      })),
    });
    expect((await join(token, await codeOf(op))).body.code).toBe('too_many_attempts');

    // The same address, whatever the account.
    await prisma.joinAttempt.deleteMany();
    await prisma.joinAttempt.createMany({
      data: Array.from({ length: 30 }, () => ({ subjectKey: subjectKeyOf({ provider: 'apple', subject: 'x' }), ipKey, success: false })),
    });
    expect((await join(await onboard('autre', 'autre@icloud.com'), await codeOf(op))).status).toBe(429);
  });

  it('le gérant d’un autre loueur ne voit ni ne traite la demande ; un chauffeur non plus', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    const { requestId } = await pendingRequest(op);
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(other.token)).send({ role: 'driver' })).status).toBe(
      404,
    );
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/refuse`).set(auth(other.token))).body.code).toBe('not_found');
    expect((await api().get('/api/internal/staff/join-requests').set(auth(other.token))).body.data).toEqual([]);
    const driver = await addStaff(op.token, 'driver');
    expect((await api().get('/api/internal/staff/join-code').set(auth(driver.token))).status).toBe(403);
    expect((await api().get('/api/internal/staff/join-requests').set(auth(driver.token))).status).toBe(403);
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(driver.token)).send({ role: 'driver' })).status).toBe(
      403,
    );
  });

  it('supprimer son compte avant d’avoir rejoint (Apple révoqué quand un code est donné)', async () => {
    const op = await setupOperator();
    const { token } = await pendingRequest(op);
    fake.appleCodes.set('code-suppression', 'apple-julie');
    const res = await api().delete('/api/internal/auth/onboarding').set(auth(token)).send({ authorizationCode: 'code-suppression' });
    expect(res.status).toBe(204);
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(1);
    expect(await prisma.staffIdentity.count()).toBe(0);
    expect(await prisma.staffJoinRequest.count()).toBe(0);
    expect(await prisma.identityToken.count()).toBe(0);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(token))).status).toBe(401);

    // Without a code: deleted all the same, nothing asked from Apple.
    const google = await googleSignIn();
    expect((await api().delete('/api/internal/auth/onboarding').set(auth(google.body.onboardingToken))).status).toBe(204);
    expect(fake.callsTo(APPLE_TOKEN_URL)).toHaveLength(1);

    // Apple down: nothing deleted.
    const again = await onboard();
    fake.appleCodes.set('code-2', 'apple-julie');
    fake.revokeStatus = 500;
    const failed = await api().delete('/api/internal/auth/onboarding').set(auth(again)).send({ authorizationCode: 'code-2' });
    expect(failed.status).toBe(503);
    expect(failed.body.code).toBe('provider_unreachable');
    expect(await prisma.staffIdentity.count()).toBe(1);
  });
});

// ---------------------------------------------------------------- consultation and platform

describe('consultation de la plateforme', () => {
  it('le super admin lit le code et les demandes d’un client, sans y répondre', async () => {
    const admin = await setupOperator('Plazo (tests)');
    const loueur = await setupOperator('Loueur');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const { requestId } = await pendingRequest(loueur);
    const open = await api().post(`/api/internal/platform/operators/${loueur.operator.id}/view-as`).set(auth(admin.token));
    const token = open.body.access.token as string;
    expect((await api().get('/api/internal/staff/join-code').set(auth(token))).body.code).toBe(await codeOf(loueur));
    expect((await api().get('/api/internal/staff/join-requests').set(auth(token))).body.data).toHaveLength(1);
    const accept = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(token)).send({ role: 'driver' });
    expect(accept.status).toBe(403);
    expect(accept.body.code).toBe('view_as_read_only');
    expect((await api().post(`/api/internal/staff/join-requests/${requestId}/refuse`).set(auth(token))).status).toBe(403);
    // Its own account settings are out of reach there.
    expect((await api().post('/api/internal/staff/me/leave').set(auth(token))).status).toBe(403);
    expect((await api().delete('/api/internal/staff/me').set(auth(token)).send({ password: PASSWORD })).status).toBe(403);
    expect((await api().delete('/api/internal/staff/me/identities/apple').set(auth(token))).status).toBe(403);
    expect((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe('pending');
  });

  it('dans le compte de la plateforme, un autre super admin accepte (tracé en consultation)', async () => {
    const admin = await setupOperator('Plazo (tests)');
    const other = await setupOperator('Compte personnel');
    process.env.PLATFORM_ADMIN_EMAILS = `${other.manager.email},${admin.manager.email}`;
    const { requestId } = await pendingRequest(admin);
    const open = await api().post(`/api/internal/platform/operators/${admin.operator.id}/view-as`).set(auth(other.token));
    const accepted = await api()
      .post(`/api/internal/staff/join-requests/${requestId}/accept`)
      .set(auth(open.body.access.token))
      .send({ role: 'agent' });
    expect(accepted.status).toBe(201);
    expect(accepted.body.staff.operatorId).toBe(admin.operator.id);
    expect(await prisma.auditLog.count({ where: { action: 'view_as.write', staffId: other.manager.id } })).toBe(1);
    expect((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).decidedById).toBe(other.manager.id);
  });

  it('une adresse de la plateforme n’est jamais vérifiée par une demande, et son compte ne se supprime pas', async () => {
    const op = await setupOperator();
    process.env.PLATFORM_ADMIN_EMAILS = `julie.m@icloud.com,${op.manager.email}`;
    const member = await joinedMember(op);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } })).emailVerifiedAt).toBeNull();
    const refused = await api().delete('/api/internal/staff/me').set(auth(op.token)).send({ password: PASSWORD });
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('cannot_delete_platform');
    expect((await api().post('/api/internal/staff/me/leave').set(auth(op.token))).body.code).toBe('cannot_delete_platform');
  });
});

// ---------------------------------------------------------------- Mon compte

describe('Mon compte : identités reliées', () => {
  it('relier Apple à un compte e-mail, s’en servir pour se connecter, puis le délier', async () => {
    const op = await setupOperator();
    const me = await api().get('/api/internal/staff/me').set(auth(op.token));
    expect(me.body).toMatchObject({ hasPassword: true, identities: [] });

    const linked = await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(op.token))
      .send({ identityToken: appleIdentityToken({ sub: 'apple-gerant', email: 'gerant@icloud.com', rawNonce: 'n' }), rawNonce: 'n' });
    expect(linked.status).toBe(200);
    expect(linked.body.user).toMatchObject({ id: op.manager.id, hasPassword: true, identities: [{ provider: 'apple', email: 'gerant@icloud.com' }] });
    expect(await prisma.auditLog.count({ where: { action: 'staff.identity_linked' } })).toBe(1);

    const signIn = await appleSignIn('apple-gerant', { email: 'gerant@icloud.com' });
    expect(signIn.body).toMatchObject({ status: 'signed_in', user: { id: op.manager.id } });
    const team = await api().get('/api/internal/staff').set(auth(op.token));
    expect(team.body.find((m: any) => m.id === op.manager.id).signIn).toEqual(['password', 'apple']);

    const second = await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(op.token))
      .send({ identityToken: appleIdentityToken({ sub: 'apple-autre', rawNonce: 'n' }), rawNonce: 'n' });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('already_linked');

    const unlinked = await api().delete('/api/internal/staff/me/identities/apple').set(auth(op.token));
    expect(unlinked.status).toBe(200);
    expect(unlinked.body.user.identities).toEqual([]);
    expect((await api().delete('/api/internal/staff/me/identities/apple').set(auth(op.token))).status).toBe(404);
    expect((await api().delete('/api/internal/staff/me/identities/facebook').set(auth(op.token))).status).toBe(404);
    expect((await appleSignIn('apple-gerant')).body.status).toBe('onboarding');
  });

  it('refuse une identité reliée à quelqu’un d’autre, et garde au moins un moyen de connexion', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    const taken = await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(op.token))
      .send({ identityToken: appleIdentityToken({ sub: member.sub, rawNonce: 'n' }), rawNonce: 'n' });
    expect(taken.status).toBe(409);
    expect(taken.body.code).toBe('identity_taken');

    // Apple is the member's only way in.
    const only = await api().delete('/api/internal/staff/me/identities/apple').set(auth(member.staffToken));
    expect(only.status).toBe(409);
    expect(only.body.code).toBe('sign_in_required');
    // With Google linked too, Apple can go.
    const google = await api()
      .post('/api/internal/staff/me/identities/google')
      .set(auth(member.staffToken))
      .send({ idToken: googleIdToken({ sub: 'google-julie', email: 'julie@gmail.com' }) });
    expect(google.body.user.identities.map((i: any) => i.provider)).toEqual(['apple', 'google']);
    expect((await api().delete('/api/internal/staff/me/identities/apple').set(auth(member.staffToken))).status).toBe(200);
    expect((await googleSignIn('google-julie', 'julie@gmail.com')).body).toMatchObject({ status: 'signed_in', user: { id: member.staffId } });
  });

  it('relier une identité qui attendait une réponse annule sa demande', async () => {
    const op = await setupOperator();
    const { requestId } = await pendingRequest(op, 'apple-gerant', 'gerant@icloud.com');
    await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(op.token))
      .send({ identityToken: appleIdentityToken({ sub: 'apple-gerant', rawNonce: 'n' }), rawNonce: 'n' });
    expect((await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe('cancelled');
    expect(await prisma.identityToken.count()).toBe(0);
  });
});

describe('Quitter ce parking', () => {
  it('libère l’adresse, ferme les sessions et renvoie vers « Rejoindre un parking »', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    await prisma.staffDevice.create({ data: { staffId: member.staffId, subscriptionId: 'tel-julie' } });
    await prisma.staff.update({ where: { id: member.staffId }, data: { phone: '0612345678' } });
    const res = await api().post('/api/internal/staff/me/leave').set(auth(member.staffToken));
    expect(res.status).toBe(200);
    expect(res.body.onboarding).toMatchObject({
      onboardingToken: expect.any(String),
      identity: { provider: 'apple', email: 'julie.m@icloud.com' },
      request: null,
    });
    const row = await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } });
    expect(row).toMatchObject({ isActive: false, email: `left-${member.staffId}@plazo.invalid`, name: 'Julie Martin', phone: null });
    expect(row.leftAt).not.toBeNull();
    expect(await prisma.staffDevice.count({ where: { staffId: member.staffId } })).toBe(0);
    expect(await prisma.staffToken.count({ where: { staffId: member.staffId } })).toBe(0);
    expect((await api().get('/api/internal/staff/me').set(auth(member.staffToken))).status).toBe(401);
    expect((await api().get('/api/internal/staff').set(auth(op.token))).body.map((m: any) => m.id)).not.toContain(member.staffId);
    expect((await api().patch(`/api/internal/staff/${member.staffId}`).set(auth(op.token)).send({ isActive: true })).status).toBe(404);
    expect(await prisma.auditLog.count({ where: { action: 'staff.left', staffId: member.staffId } })).toBe(1);

    // Straight to another parking, with the same Apple account.
    const other = await setupOperator('Autre');
    const again = await join(res.body.onboarding.onboardingToken, await codeOf(other));
    expect(again.status).toBe(201);
    expect((await appleSignIn()).body.status).toBe('onboarding');
  });

  it('sans identité Apple ou Google, rien à rejoindre ; le compte e-mail ne se connecte plus', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const res = await api().post('/api/internal/staff/me/leave').set(auth(agent.token));
    expect(res.body).toEqual({ onboarding: null });
    expect((await api().post('/api/internal/auth/login').send({ email: agent.email, password: PASSWORD })).status).toBe(401);
    // The email is free again.
    const reused = await api()
      .post('/api/internal/staff')
      .set(auth(op.token))
      .send({ firstName: 'Agent', lastName: 'Revenu', email: agent.email, role: 'agent', password: PASSWORD });
    expect(reused.status).toBe(201);
  });

  it('le dernier gérant ne part pas, ni un chauffeur en plein trajet', async () => {
    const op = await setupOperator();
    const last = await api().post('/api/internal/staff/me/leave').set(auth(op.token));
    expect(last.status).toBe(409);
    expect(last.body.code).toBe('last_manager');
    const driver = await addStaff(op.token, 'driver');
    await prisma.shuttleTrip.create({
      data: {
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        driverId: driver.id,
        status: 'running',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    const driving = await api().post('/api/internal/staff/me/leave').set(auth(driver.token));
    expect(driving.status).toBe(409);
    expect(driving.body.code).toBe('trip_running');
    expect((await api().delete('/api/internal/staff/me').set(auth(driver.token)).send({ password: PASSWORD })).body.code).toBe('trip_running');
  });
});

describe('Supprimer mon compte', () => {
  it('confirmé par Apple : révoqué chez Apple, compte anonymisé, historique gardé', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    await prisma.staff.update({ where: { id: member.staffId }, data: { phone: '0612345678' } });
    fake.appleCodes.set('code-frais', member.sub);
    const res = await api().delete('/api/internal/staff/me').set(auth(member.staffToken)).send({ appleAuthorizationCode: 'code-frais' });
    expect(res.status).toBe(204);
    expect(fake.callsTo(APPLE_REVOKE_URL)[0].form).toMatchObject({ token: `refresh-${member.sub}`, token_type_hint: 'refresh_token' });

    const row = await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } });
    expect(row).toMatchObject({
      firstName: '',
      lastName: '',
      name: 'Compte supprimé',
      email: `deleted-${member.staffId}@plazo.invalid`,
      phone: null,
      isActive: false,
      passwordSetAt: null,
      emailVerifiedAt: null,
    });
    expect(row.deletedAt).not.toBeNull();
    expect(await prisma.staffIdentity.count()).toBe(0);
    expect(await prisma.staffJoinRequest.count()).toBe(0);
    expect(await prisma.staffToken.count({ where: { staffId: member.staffId } })).toBe(0);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'staff.deleted' } });
    expect(audit).toMatchObject({ staffId: member.staffId, details: { role: 'driver' } });
    expect(JSON.stringify(audit.details)).not.toMatch(/Julie|icloud/);
    expect((await api().get('/api/internal/staff').set(auth(op.token))).body.map((m: any) => m.id)).not.toContain(member.staffId);
    // A new sign-in with that Apple ID starts from scratch.
    expect((await appleSignIn()).body).toMatchObject({ status: 'onboarding', request: null });
  });

  it('confirmé par le mot de passe ; un mauvais ou aucun est refusé', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    expect((await api().delete('/api/internal/staff/me').set(auth(agent.token)).send({ password: 'mauvais-mot-de-passe' })).body.code).toBe(
      'reauth_failed',
    );
    expect((await api().delete('/api/internal/staff/me').set(auth(agent.token)).send({})).status).toBe(401);
    expect((await api().delete('/api/internal/staff/me').set(auth(agent.token)).send({ password: PASSWORD })).status).toBe(204);
    expect((await api().post('/api/internal/auth/login').send({ email: agent.email, password: PASSWORD })).status).toBe(401);
    // The last manager may delete their account (the app warns them).
    expect((await api().delete('/api/internal/staff/me').set(auth(op.token)).send({ password: PASSWORD })).status).toBe(204);
  });

  it('confirmé par Google : le jeton doit être celui du compte relié', async () => {
    const op = await setupOperator();
    const token = (await googleSignIn()).body.onboardingToken;
    const sent = await join(token, await codeOf(op));
    await api().post(`/api/internal/staff/join-requests/${sent.body.request.id}/accept`).set(auth(op.token)).send({ role: 'agent' });
    const staffToken = (await api().post('/api/internal/auth/onboarding/session').set(auth(token))).body.tokenData.access.token;
    const wrong = await api()
      .delete('/api/internal/staff/me')
      .set(auth(staffToken))
      .send({ googleIdToken: googleIdToken({ sub: 'quelquun-dautre' }) });
    expect(wrong.status).toBe(401);
    expect(wrong.body.code).toBe('reauth_failed');
    const forged = await api().delete('/api/internal/staff/me').set(auth(staffToken)).send({ googleIdToken: 'faux' });
    expect(forged.body.code).toBe('reauth_failed');
    // An Apple code for a member without Apple proves nothing.
    expect((await api().delete('/api/internal/staff/me').set(auth(staffToken)).send({ appleAuthorizationCode: 'x' })).body.code).toBe(
      'reauth_failed',
    );
    expect(
      (
        await api()
          .delete('/api/internal/staff/me')
          .set(auth(staffToken))
          .send({ googleIdToken: googleIdToken({ sub: 'google-karim' }) })
      ).status,
    ).toBe(204);
  });

  it('Apple injoignable ou code d’un autre compte : rien n’est supprimé', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    fake.appleCodes.set('code-autre', 'autre-apple-id');
    const other = await api().delete('/api/internal/staff/me').set(auth(member.staffToken)).send({ appleAuthorizationCode: 'code-autre' });
    expect(other.body.code).toBe('reauth_failed');
    // Another Apple ID's grant is left alone.
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(0);
    fake.appleCodes.set('code-frais', member.sub);
    fake.revokeStatus = 503;
    const down = await api().delete('/api/internal/staff/me').set(auth(member.staffToken)).send({ appleAuthorizationCode: 'code-frais' });
    expect(down.status).toBe(503);
    expect(down.body.code).toBe('provider_unreachable');
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } })).isActive).toBe(true);
    expect(await prisma.staffIdentity.count({ where: { staffId: member.staffId } })).toBe(1);
  });
});

// ---------------------------------------------------------------- dashboard, passwords, purge

describe('tableau de bord', () => {
  it('signale les demandes en attente aux gérants seulement', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    await pendingRequest(op);
    await pendingRequest(op, 'apple-karim', 'karim@icloud.com');
    const board = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(board.status).toBe(200);
    expect(board.body.alerts.find((a: any) => a.kind === 'join_request')).toMatchObject({
      severity: 'todo',
      detail: '2',
      customerName: 'Julie Martin',
      since: expect.any(String),
    });
    const forAgent = await api().get('/api/internal/dashboard').set(auth(agent.token));
    expect(forAgent.body.alerts.some((a: any) => a.kind === 'join_request')).toBe(false);
  });
});

describe('mot de passe choisi (passwordSetAt)', () => {
  it('connu après une création, une réinitialisation ou un changement ; absent pour un gérant invité', async () => {
    const op = await setupOperator();
    expect((await login(op.manager.email)).user.hasPassword).toBe(true);
    const agent = await addStaff(op.token, 'agent');
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: agent.id } })).passwordSetAt).not.toBeNull();

    const member = await joinedMember(op);
    await api().post(`/api/internal/staff/${member.staffId}/reset-password`).set(auth(op.token)).send({ password: 'nouveau-mot-de-passe' });
    expect((await login('julie.m@icloud.com', 'nouveau-mot-de-passe')).user).toMatchObject({
      hasPassword: true,
      identities: [{ provider: 'apple' }],
    });
    const team = await api().get('/api/internal/staff').set(auth(op.token));
    expect(team.body.find((m: any) => m.id === member.staffId).signIn).toEqual(['password', 'apple']);

    const invited = await Container.get(OperatorService).createWithManager({
      operatorName: 'Invité',
      parkingName: 'Invité LYS',
      totalCapacity: 10,
      managerFirstName: 'Inès',
      managerLastName: 'Vitée',
      managerEmail: 'invitee@example.com',
      managerPassword: null,
    });
    expect(invited.manager.passwordSetAt).toBeNull();
  });
});

describe('suppression d’un loueur par la plateforme', () => {
  it('emporte les identités Apple et Google de ses membres', async () => {
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const op = await setupOperator();
    await joinedMember(op);
    await onboard('pas-encore', 'p@icloud.com');
    await prisma.operator.update({ where: { id: op.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    const res = await api().delete(`/api/internal/platform/operators/${op.operator.id}`).set(auth(admin.token));
    expect(res.status).toBe(200);
    // The identity that never joined anyone is not the operator's.
    expect((await prisma.staffIdentity.findMany()).map(i => i.subject)).toEqual(['pas-encore']);
  });
});

describe('purge de nuit', () => {
  it('efface les tentatives de plus de 7 jours, les jetons d’accueil expirés et les identités jamais reliées depuis 30 jours', async () => {
    const op = await setupOperator();
    await onboard('ancienne', 'a@icloud.com');
    await onboard('recente', 'r@icloud.com');
    await pendingRequest(op, 'en-attente', 'e@icloud.com');
    const old = new Date(Date.now() - 31 * 86_400_000);
    await prisma.staffIdentity.updateMany({ where: { subject: { in: ['ancienne', 'en-attente'] } }, data: { createdAt: old, lastSignInAt: old } });
    // Their onboarding sessions have expired too (an identity with a valid one is never purged).
    await prisma.identityToken.updateMany({
      where: { identity: { subject: { in: ['recente', 'ancienne'] } } },
      data: { createdAt: new Date(Date.now() - 8 * 86_400_000), expiresAt: new Date(Date.now() - 86_400_000) },
    });
    await prisma.joinAttempt.createMany({
      data: [
        {
          subjectKey: subjectKeyOf({ provider: 'apple', subject: 'x' }),
          ipKey: 'x',
          success: false,
          createdAt: new Date(Date.now() - 8 * 86_400_000),
        },
        { subjectKey: subjectKeyOf({ provider: 'apple', subject: 'x' }), ipKey: 'x', success: false },
      ],
    });
    const res = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ identityTokensDeleted: 2, joinAttemptsDeleted: 1, identitiesDeleted: 1, joinRequestsExpired: 0 });
    // The one with a pending request stays, the recent one too.
    expect((await prisma.staffIdentity.findMany({ orderBy: { subject: 'asc' } })).map(i => i.subject)).toEqual(['en-attente', 'recente']);
  });
});

// ---------------------------------------------------------------- review fixes (13/10/2026)

describe('jetons à usage unique et sessions d’accueil', () => {
  it('le même jeton Apple ne connecte qu’une fois ; 5 sessions d’accueil au plus par identité', async () => {
    const body = {
      identityToken: appleIdentityToken({ sub: 'apple-julie', rawNonce: 'n' }),
      rawNonce: 'n',
      givenName: 'Julie',
      familyName: 'Martin',
    };
    expect((await api().post('/api/internal/auth/apple').send(body)).status).toBe(200);
    const replay = await api().post('/api/internal/auth/apple').send(body);
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('identity_invalid');
    const idToken = googleIdToken({ sub: 'google-karim' });
    expect((await api().post('/api/internal/auth/google').send({ idToken })).status).toBe(200);
    expect((await api().post('/api/internal/auth/google').send({ idToken })).body.code).toBe('identity_invalid');

    const first = (await appleSignIn()).body.onboardingToken;
    for (let i = 0; i < 5; i += 1) await appleSignIn();
    const identity = await prisma.staffIdentity.findFirstOrThrow({ where: { subject: 'apple-julie' } });
    expect(await prisma.identityToken.count({ where: { identityId: identity.id } })).toBe(5);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(first))).status).toBe(401);
  });

  it('se connecter comme membre, un nouveau mot de passe ou une déconnexion ferment les sessions d’accueil restées ailleurs', async () => {
    const op = await setupOperator();
    // Phone A asked to join; the manager accepts; phone B signs in with Apple: A's onboarding session goes.
    const { token: phoneA, requestId } = await pendingRequest(op);
    const accepted = await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' });
    const staffId = accepted.body.staff.id as string;
    const phoneB = await appleSignIn('apple-julie', { names: false });
    expect(phoneB.body.status).toBe('signed_in');
    expect((await api().post('/api/internal/auth/onboarding/session').set(auth(phoneA))).status).toBe(401);

    // An onboarding session alive when the manager resets the password (sign out everywhere): gone too.
    const identity = await prisma.staffIdentity.findFirstOrThrow({ where: { staffId } });
    const leftover = await Container.get(OnboardingService).tokens.generateOnboardingToken(identity.id);
    await api().post(`/api/internal/staff/${staffId}/reset-password`).set(auth(op.token)).send({ password: 'nouveau-mot-de-passe' });
    expect((await api().post('/api/internal/auth/onboarding/session').set(auth(leftover.onboardingToken))).status).toBe(401);

    // And at a staff logout.
    const another = await Container.get(OnboardingService).tokens.generateOnboardingToken(identity.id);
    const session = (await appleSignIn('apple-julie', { names: false })).body.tokenData.access.token;
    const again = await Container.get(OnboardingService).tokens.generateOnboardingToken(identity.id);
    expect((await api().post('/api/internal/auth/logout').set(auth(session))).status).toBe(204);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(again.onboardingToken))).status).toBe(401);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(another.onboardingToken))).status).toBe(401);

    // Deactivated then reactivated: no old onboarding session opens a staff session.
    const later = await Container.get(OnboardingService).tokens.generateOnboardingToken(identity.id);
    await api().patch(`/api/internal/staff/${staffId}`).set(auth(op.token)).send({ isActive: false });
    await api().patch(`/api/internal/staff/${staffId}`).set(auth(op.token)).send({ isActive: true });
    expect((await api().post('/api/internal/auth/onboarding/session').set(auth(later.onboardingToken))).status).toBe(401);
  });
});

describe('limites de « Rejoindre un parking »', () => {
  it('supprimer son identité puis se reconnecter ne remet pas les compteurs à zéro', async () => {
    const op = await setupOperator();
    const token = await onboard();
    for (let i = 0; i < 5; i += 1) expect((await join(token, `AAAAA-AAAA${i}`)).status).toBe(400);
    expect((await api().delete('/api/internal/auth/onboarding').set(auth(token))).status).toBe(204);
    const fresh = await onboard();
    const blocked = await join(fresh, await codeOf(op));
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('too_many_attempts');
  });

  it('des codes faux envoyés en même temps ne passent pas tous sous la limite', async () => {
    await setupOperator();
    const token = await onboard();
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => join(token, `BBBBB-BBBB${i % 10}`)));
    const statuses = results.map(r => r.status);
    expect(statuses.filter(status => status === 400).length).toBeLessThanOrEqual(5);
    expect(statuses.filter(status => status === 429).length).toBeGreaterThanOrEqual(7);
    expect(await prisma.joinAttempt.count({ where: { success: false } })).toBeLessThanOrEqual(5);
  });

  it('3 demandes envoyées par jour et par compte au plus', async () => {
    const op = await setupOperator();
    await prisma.staffDevice.create({ data: { staffId: op.manager.id, subscriptionId: 'tel-gerant' } });
    const token = await onboard();
    for (let i = 0; i < 3; i += 1) {
      expect((await join(token, await codeOf(op))).status).toBe(201);
      expect((await api().delete('/api/internal/auth/onboarding/request').set(auth(token))).status).toBe(200);
    }
    const fourth = await join(token, await codeOf(op));
    expect(fourth.status).toBe(429);
    expect(fourth.body.code).toBe('too_many_attempts');
    expect(pushes()).toHaveLength(3);
  });
});

describe('écritures concurrentes', () => {
  it('délier Apple et Google en même temps laisse toujours un moyen de se connecter', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    await api()
      .post('/api/internal/staff/me/identities/google')
      .set(auth(member.staffToken))
      .send({ idToken: googleIdToken({ sub: 'google-julie', email: 'julie@gmail.com' }) });
    const [apple, google] = await Promise.all([
      api().delete('/api/internal/staff/me/identities/apple').set(auth(member.staffToken)),
      api().delete('/api/internal/staff/me/identities/google').set(auth(member.staffToken)),
    ]);
    expect([apple.status, google.status].sort()).toEqual([200, 409]);
    expect(await prisma.staffIdentity.count({ where: { staffId: member.staffId } })).toBe(1);
  });

  it('deux gérants qui quittent en même temps : un seul part', async () => {
    const op = await setupOperator();
    const second = await addStaff(op.token, 'manager');
    const [a, b] = await Promise.all([
      api().post('/api/internal/staff/me/leave').set(auth(op.token)),
      api().post('/api/internal/staff/me/leave').set(auth(second.token)),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await prisma.staff.count({ where: { operatorId: op.operator.id, role: 'manager', isActive: true } })).toBe(1);
  });

  it('supprimer une identité qu’un gérant vient de relier : refusé, rien n’est effacé', async () => {
    const op = await setupOperator();
    const { requestId } = await pendingRequest(op);
    const stale = await prisma.staffIdentity.findFirstOrThrow({ where: { subject: 'apple-julie' } });
    await api().post(`/api/internal/staff/join-requests/${requestId}/accept`).set(auth(op.token)).send({ role: 'driver' });
    await expect(Container.get(OnboardingService).deleteIdentity(stale)).rejects.toMatchObject({ code: 'already_member' });
    expect((await prisma.staffIdentity.findUniqueOrThrow({ where: { id: stale.id } })).staffId).not.toBeNull();
  });
});

describe('supprimer son compte : Apple et preuves', () => {
  it('Apple relié : le code Apple est exigé même avec le mot de passe, et Apple est révoqué', async () => {
    const op = await setupOperator();
    await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(op.token))
      .send({ identityToken: appleIdentityToken({ sub: 'apple-gerant', email: 'gerant@icloud.com', rawNonce: 'n' }), rawNonce: 'n' });
    const agent = await addStaff(op.token, 'agent');
    await api()
      .post('/api/internal/staff/me/identities/apple')
      .set(auth(agent.token))
      .send({ identityToken: appleIdentityToken({ sub: 'apple-agent', email: 'agent@icloud.com', rawNonce: 'n' }), rawNonce: 'n' });

    const refused = await api().delete('/api/internal/staff/me').set(auth(agent.token)).send({ password: PASSWORD });
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('apple_confirmation_required');
    expect(fake.callsTo(APPLE_TOKEN_URL)).toHaveLength(0);
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: agent.id } })).isActive).toBe(true);

    fake.appleCodes.set('code-agent', 'apple-agent');
    const deleted = await api()
      .delete('/api/internal/staff/me')
      .set(auth(agent.token))
      .send({ password: PASSWORD, appleAuthorizationCode: 'code-agent' });
    expect(deleted.status).toBe(204);
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(1);
    expect(fake.callsTo(APPLE_REVOKE_URL)[0].form.token).toBe('refresh-apple-agent');
  });

  it('Apple refuse la clé de Plazo (invalid_client) : 503, rien n’est supprimé', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    fake.appleCodes.set('code-frais', member.sub);
    fake.tokenError = { status: 400, error: 'invalid_client' };
    const res = await api().delete('/api/internal/staff/me').set(auth(member.staffToken)).send({ appleAuthorizationCode: 'code-frais' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('provider_unreachable');
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } })).deletedAt).toBeNull();
    expect(await prisma.staffIdentity.count({ where: { staffId: member.staffId } })).toBe(1);
  });

  it('le mot de passe compte dans le verrouillage de la connexion', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    for (let i = 0; i < 8; i += 1) {
      expect(
        (
          await api()
            .delete('/api/internal/staff/me')
            .set(auth(agent.token))
            .send({ password: `mauvais-${i}` })
        ).body.code,
      ).toBe('reauth_failed');
    }
    const locked = await api().delete('/api/internal/staff/me').set(auth(agent.token)).send({ password: PASSWORD });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('too_many_attempts');
    expect((await api().post('/api/internal/auth/login').send({ email: agent.email, password: PASSWORD })).status).toBe(429);
    // Changing one's password too.
    const change = await api()
      .patch('/api/internal/staff/me/password')
      .set(auth(agent.token))
      .send({ currentPassword: PASSWORD, newPassword: 'nouveau-mot-de-passe' });
    expect(change.status).toBe(429);
  });

  it('un jeton Google de plus de 5 minutes ne confirme pas ; des types faux sont des codes', async () => {
    const op = await setupOperator();
    const token = (await googleSignIn()).body.onboardingToken;
    const sent = await join(token, await codeOf(op));
    await api().post(`/api/internal/staff/join-requests/${sent.body.request.id}/accept`).set(auth(op.token)).send({ role: 'agent' });
    const staffToken = (await api().post('/api/internal/auth/onboarding/session').set(auth(token))).body.tokenData.access.token;
    const old = await api()
      .delete('/api/internal/staff/me')
      .set(auth(staffToken))
      .send({ googleIdToken: googleIdToken({ sub: 'google-karim', issuedSecondsAgo: 400 }) });
    expect(old.status).toBe(401);
    expect(old.body.code).toBe('reauth_failed');
    const wrongType = await api().delete('/api/internal/staff/me').set(auth(staffToken)).send({ password: 123, googleIdToken: true });
    expect(wrongType.status).toBe(400);
    expect(wrongType.body.fields).toEqual({ password: 'invalid', googleIdToken: 'invalid' });
    const fresh = googleIdToken({ sub: 'google-karim' });
    expect((await api().delete('/api/internal/staff/me').set(auth(staffToken)).send({ googleIdToken: fresh })).status).toBe(204);
  });
});

describe('effacement complet', () => {
  it('« Supprimer mon compte » efface aussi tentatives de connexion, noms du journal et identités des demandes', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    // Signs in with Google too, then unlinks Apple (the identity that joined stays, unlinked).
    await api()
      .post('/api/internal/staff/me/identities/google')
      .set(auth(member.staffToken))
      .send({ idToken: googleIdToken({ sub: 'google-julie', email: 'julie@gmail.com' }) });
    await api().delete('/api/internal/staff/me/identities/apple').set(auth(member.staffToken));
    await api().patch('/api/internal/staff/me').set(auth(member.staffToken)).send({ firstName: 'Juliette', lastName: 'Martin' });
    await api().patch(`/api/internal/staff/${member.staffId}`).set(auth(op.token)).send({ firstName: 'Julie', lastName: 'Martin-Durand' });
    await prisma.loginAttempt.create({ data: { email: 'julie.m@icloud.com', success: false } });

    const res = await api()
      .delete('/api/internal/staff/me')
      .set(auth(member.staffToken))
      .send({ googleIdToken: googleIdToken({ sub: 'google-julie', email: 'julie@gmail.com' }) });
    expect(res.status).toBe(204);
    expect(await prisma.loginAttempt.count({ where: { email: 'julie.m@icloud.com' } })).toBe(0);
    expect(await prisma.staffIdentity.count()).toBe(0);
    const entries = await prisma.auditLog.findMany({ where: { entityId: member.staffId, action: { in: ['staff.updated', 'staff.renamed'] } } });
    expect(entries.length).toBe(2);
    expect(JSON.stringify(entries.map(e => e.details))).not.toMatch(/Julie|Juliette|Martin/);
  });

  it('« Supprimer mon compte » après « Quitter ce parking » efface aussi l’ancien membre', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    await prisma.staff.update({ where: { id: member.staffId }, data: { phone: '0612345678' } });
    const left = await api().post('/api/internal/staff/me/leave').set(auth(member.staffToken));
    const token = left.body.onboarding.onboardingToken as string;
    expect((await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } })).phone).toBeNull();

    fake.appleCodes.set('code-frais', member.sub);
    expect((await api().delete('/api/internal/auth/onboarding').set(auth(token)).send({ authorizationCode: 'code-frais' })).status).toBe(204);
    const row = await prisma.staff.findUniqueOrThrow({ where: { id: member.staffId } });
    expect(row).toMatchObject({ firstName: '', lastName: '', name: 'Compte supprimé', phone: null, passwordSetAt: null, isActive: false });
    expect(row.email).toBe(`deleted-${member.staffId}@plazo.invalid`);
    expect(row.deletedAt).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { action: 'staff.deleted', entityId: member.staffId, operatorId: op.operator.id } })).toBe(1);
    expect(await prisma.staffIdentity.count()).toBe(0);
  });

  it('après « Quitter ce parking », la purge de nuit garde l’identité qui a une session d’accueil', async () => {
    const op = await setupOperator();
    const member = await joinedMember(op);
    const old = new Date(Date.now() - 40 * 86_400_000);
    await prisma.staffIdentity.updateMany({ where: { staffId: member.staffId }, data: { lastSignInAt: old, createdAt: old } });
    await prisma.$executeRaw`UPDATE "staff_join_requests" SET "updatedAt" = ${old} WHERE "staffId" = ${member.staffId}`;
    const left = await api().post('/api/internal/staff/me/leave').set(auth(member.staffToken));
    const purge = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(purge.body.identitiesDeleted).toBe(0);
    expect((await api().get('/api/internal/auth/onboarding').set(auth(left.body.onboarding.onboardingToken))).status).toBe(200);

    // Even with the session expired, the departure counts as the last sign-in.
    await prisma.identityToken.deleteMany();
    expect(
      (await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`)).body.identitiesDeleted,
    ).toBe(0);
  });

  it('la purge de nuit efface les jetons déjà servis expirés et les tentatives de connexion de plus de 30 jours', async () => {
    await prisma.usedIdentityToken.createMany({
      data: [
        { tokenHash: 'a'.repeat(64), expiresAt: new Date(Date.now() - 1000) },
        { tokenHash: 'b'.repeat(64), expiresAt: new Date(Date.now() + 600_000) },
      ],
    });
    await prisma.loginAttempt.createMany({
      data: [
        { email: 'ancien@example.com', success: false, createdAt: new Date(Date.now() - 31 * 86_400_000) },
        { email: 'recent@example.com', success: false },
      ],
    });
    const res = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.body).toMatchObject({ usedIdentityTokensDeleted: 1, loginAttemptsDeleted: 1 });
    expect(await prisma.loginAttempt.count()).toBe(1);
  });
});
