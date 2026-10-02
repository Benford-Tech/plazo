import { Container } from 'typedi';
import prisma from '@/database';
import { PaymentService } from '@/services/payment.service';
import { addStaff, api, login, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const P = '/api/internal/platform';

const listingBody = (overrides: Record<string, unknown> = {}) => ({
  airportCode: 'LYS',
  slug: 'parking-loueur',
  title: 'Parking Loueur',
  services: ['shuttle'],
  cancellationPolicy: 'free_24h',
  photos: [],
  ...overrides,
});
const grid = { tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 };

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  loueur = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  delete process.env.STRIPE_SECRET_KEY;
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

/** The operator's listing, sent for validation. */
async function submittedListing(op: Op = loueur, overrides: Record<string, unknown> = {}) {
  await api().put('/api/internal/pricing').set(auth(op.token)).send(grid);
  expect((await api().put('/api/internal/listing').set(auth(op.token)).send(listingBody(overrides))).status).toBe(200);
  const res = await api().post('/api/internal/listing/submit').set(auth(op.token));
  expect(res.status).toBe(200);
  return res.body.data as { id: string; status: string; slug: string };
}

const publicPage = (slug = 'parking-loueur') => api().get(`/api/public/airports/lyon-saint-exupery/parkings/${slug}`);
const publicSlugs = async () => (await api().get('/api/public/airports/lyon-saint-exupery')).body.listings.map((l: { slug: string }) => l.slug);

async function viewAs(operatorId = loueur.operator.id) {
  const res = await api().post(`${P}/operators/${operatorId}/view-as`).set(auth(admin.token));
  expect(res.status).toBe(201);
  return res.body.access.token as string;
}

describe('accès à l’espace Plateforme', () => {
  const routes = [
    ['get', `${P}/operators`],
    ['patch', `${P}/operators/x/commission`],
    ['post', `${P}/operators/x/suspend`],
    ['post', `${P}/operators/x/reactivate`],
    ['post', `${P}/operators/x/view-as`],
    ['post', `${P}/operators/x/invitation`],
    ['post', `${P}/invitations`],
    ['get', `${P}/listings`],
    ['post', `${P}/listings/x/approve`],
    ['post', `${P}/listings/x/reject`],
    ['post', `${P}/listings/x/unpublish`],
    ['get', `${P}/reservations`],
    ['get', `${P}/payments`],
    ['post', `${P}/payouts/x/retry`],
  ] as const;

  it('refuse toutes les routes aux loueurs (403), à leur équipe (403) et aux anonymes (401)', async () => {
    const agent = await addStaff(loueur.token, 'agent');
    for (const [method, url] of routes) {
      for (const token of [loueur.token, agent.token]) {
        const res = await api()[method](url).set(auth(token)).send({});
        expect([url, res.status, res.body.code]).toEqual([url, 403, 'forbidden']);
      }
      expect((await api()[method](url)).status).toBe(401);
    }
    // A manager cannot open another operator's space.
    expect((await api().post(`${P}/operators/${admin.operator.id}/view-as`).set(auth(loueur.token))).status).toBe(403);
    expect(await prisma.staffToken.count({ where: { metadata: { path: ['actingAs'], not: 'null' } } })).toBe(0);
  });

  it('liste les loueurs avec leurs chiffres', async () => {
    await prisma.operator.update({
      where: { id: loueur.operator.id },
      data: { commissionBps: 1200, stripeAccountId: 'acct_1', stripePayoutsEnabled: true, stripeChargesEnabled: true },
    });
    await submittedListing();
    await api().post('/api/internal/reservations').set(auth(loueur.token)).send({
      channel: 'phone',
      arrivalAt: '2030-01-10T08:00',
      returnAt: '2030-01-12T18:00',
      passengers: 2,
      customerName: 'Client Test',
      customerPhone: '0612345678',
      plate: 'AB-123-CD',
    });
    const res = await api().get(`${P}/operators`).set(auth(admin.token));
    expect(res.status).toBe(200);
    const row = res.body.operators.find((o: { id: string }) => o.id === loueur.operator.id);
    expect(row).toMatchObject({
      name: loueur.operator.name,
      status: 'active',
      isPlatform: false,
      parkings: 1,
      places: 200,
      manager: { email: loueur.manager.email, emailVerified: true },
      listing: { status: 'pending_review' },
      payments: { connected: true, chargesEnabled: true, payoutsEnabled: true },
      commissionBps: 1200,
      bookingsThisMonth: 1,
      invitation: null,
    });
    expect(res.body.operators.find((o: { id: string }) => o.id === admin.operator.id).isPlatform).toBe(true);
  });

  it('règle la commission d’un loueur', async () => {
    const res = await api().patch(`${P}/operators/${loueur.operator.id}/commission`).set(auth(admin.token)).send({ commissionBps: 1250 });
    expect(res.status).toBe(200);
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: loueur.operator.id } })).commissionBps).toBe(1250);
    expect(
      (await api().patch(`${P}/operators/${loueur.operator.id}/commission`).set(auth(admin.token)).send({ commissionBps: 6000 })).body.fields,
    ).toEqual({
      commissionBps: 'commission_range',
    });
    await api().patch(`${P}/operators/${loueur.operator.id}/commission`).set(auth(admin.token)).send({ commissionBps: null });
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: loueur.operator.id } })).commissionBps).toBeNull();
    expect(
      await prisma.auditLog.count({ where: { operatorId: loueur.operator.id, action: 'operator.commission_changed', staffId: admin.manager.id } }),
    ).toBe(2);
  });
});

describe('suspension d’un loueur', () => {
  it('bloque son équipe et retire ses fiches du site, jusqu’à la réactivation', async () => {
    const listing = await submittedListing();
    await api().post(`${P}/listings/${listing.id}/approve`).set(auth(admin.token));
    expect((await publicPage()).status).toBe(200);
    const agent = await addStaff(loueur.token, 'agent');

    const res = await api().post(`${P}/operators/${loueur.operator.id}/suspend`).set(auth(admin.token));
    expect(res.status).toBe(200);
    // Sessions revoked, login refused, refresh refused.
    expect((await api().get('/api/internal/planning').set(auth(loueur.token))).status).toBe(401);
    expect((await api().get('/api/internal/planning').set(auth(agent.token))).status).toBe(401);
    const loginRes = await api().post('/api/internal/auth/login').send({ email: loueur.manager.email, password: PASSWORD });
    expect([loginRes.status, loginRes.body.code]).toEqual([403, 'account_suspended']);
    expect((await api().post('/api/internal/auth/refresh').send({ refreshToken: loueur.session.tokenData.refresh.token })).status).toBe(401);
    // Hidden from the site, and cannot be booked.
    expect((await publicPage()).status).toBe(404);
    expect(await publicSlugs()).not.toContain('parking-loueur');
    expect(
      (await api().get('/api/public/search?airport=lyon-saint-exupery&arrivalAt=2030-01-10T08:00&returnAt=2030-01-12T08:00')).body.results,
    ).toEqual([]);

    // A token issued before the suspension (not revoked by mistake) is still refused.
    await prisma.operator.update({ where: { id: loueur.operator.id }, data: { status: 'active', suspendedAt: null } });
    const fresh = await login(loueur.manager.email);
    await prisma.operator.update({ where: { id: loueur.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    const blocked = await api().get('/api/internal/planning').set(auth(fresh.tokenData.access.token));
    expect([blocked.status, blocked.body.code]).toEqual([401, 'account_suspended']);

    expect((await api().post(`${P}/operators/${loueur.operator.id}/reactivate`).set(auth(admin.token))).status).toBe(200);
    expect((await login(loueur.manager.email)).user.email).toBe(loueur.manager.email);
    expect((await publicPage()).status).toBe(200);
    expect(
      await prisma.auditLog.count({ where: { operatorId: loueur.operator.id, action: { in: ['operator.suspended', 'operator.reactivated'] } } }),
    ).toBe(2);
  });

  it('refuse de suspendre le compte de la plateforme', async () => {
    const res = await api().post(`${P}/operators/${admin.operator.id}/suspend`).set(auth(admin.token));
    expect([res.status, res.body.code]).toEqual([400, 'cannot_suspend_platform']);
  });
});

describe('ouvrir l’espace d’un loueur (view-as)', () => {
  it('agit dans l’espace du loueur, et trace chaque écriture avec l’identité du super admin', async () => {
    const token = await viewAs();
    const me = await api().get('/api/internal/staff/me').set(auth(token));
    expect(me.body).toMatchObject({
      id: admin.manager.id,
      email: admin.manager.email,
      operatorId: loueur.operator.id,
      operatorName: loueur.operator.name,
      role: 'manager',
      viewAs: { operatorId: loueur.operator.id, operatorName: loueur.operator.name },
    });
    const parking = await api().get('/api/internal/parking').set(auth(token));
    expect(parking.body.id).toBe(loueur.parking.id);

    const write = await api()
      .patch(`/api/internal/parkings/${loueur.parking.id}`)
      .set(auth(token))
      .send({ name: 'Renommé par la plateforme', address: null, totalCapacity: 210, safetyMarginPct: 5, shuttleTravelMinutes: 9 });
    expect(write.status).toBe(200);
    expect((await prisma.parking.findUniqueOrThrow({ where: { id: loueur.parking.id } })).totalCapacity).toBe(210);

    const entries = await prisma.auditLog.findMany({
      where: { operatorId: loueur.operator.id, staffId: admin.manager.id },
      orderBy: { createdAt: 'asc' },
    });
    const request = entries.find(e => e.action === 'view_as.write');
    expect(request?.details).toMatchObject({ method: 'PATCH', path: `/api/internal/parkings/${loueur.parking.id}`, viewAs: true });
    // The service's own entry carries the admin's id and the view-as mark too.
    expect(entries.find(e => e.action !== 'view_as.write' && e.action !== 'operator.view_as_started')?.details).toMatchObject({ viewAs: true });
    // The admin's own operator is not touched.
    expect((await api().get('/api/internal/parking').set(auth(admin.token))).body.id).toBe(admin.parking.id);
  });

  it('laisse l’équipe, les mots de passe et le compte du loueur en lecture seule', async () => {
    const token = await viewAs();
    expect((await api().get('/api/internal/staff').set(auth(token))).status).toBe(200);
    const attempts = [
      api().post('/api/internal/staff').set(auth(token)).send({ name: 'Intrus', email: 'intrus@example.com', role: 'manager', password: PASSWORD }),
      api().patch(`/api/internal/staff/${loueur.manager.id}`).set(auth(token)).send({ isActive: false }),
      api().post(`/api/internal/staff/${loueur.manager.id}/reset-password`).set(auth(token)).send({ password: 'nouveau-mot-de-passe' }),
      api().patch('/api/internal/staff/me/password').set(auth(token)).send({ currentPassword: PASSWORD, newPassword: 'nouveau-mot-de-passe' }),
      api().post('/api/internal/auth/verify-email/resend').set(auth(token)),
    ];
    for (const res of await Promise.all(attempts)) expect([res.status, res.body.code]).toEqual([403, 'view_as_read_only']);
    expect(await prisma.staff.count({ where: { operatorId: loueur.operator.id } })).toBe(1);
    expect((await login(loueur.manager.email)).user.isActive).toBe(true);
  });

  it('ne vaut que tant que la personne est super admin', async () => {
    const token = await viewAs();
    // Still an admin: the platform routes accept the session too.
    expect((await api().get(`${P}/operators`).set(auth(token))).status).toBe(200);
    process.env.PLATFORM_ADMIN_EMAILS = 'quelquun-dautre@example.com';
    expect((await api().get('/api/internal/parking').set(auth(token))).status).toBe(401);
    expect((await api().get(`${P}/operators`).set(auth(token))).status).toBe(401);
    // Its own session is not a view-as one: it stays a plain operator session.
    expect((await api().get('/api/internal/parking').set(auth(admin.token))).body.id).toBe(admin.parking.id);
  });

  it('est révoquée par une déconnexion faite avec elle, sans toucher la session principale', async () => {
    const token = await viewAs();
    expect((await api().post('/api/internal/auth/logout').set(auth(token))).status).toBe(204);
    expect((await api().get('/api/internal/parking').set(auth(token))).status).toBe(401);
    expect((await api().get(`${P}/operators`).set(auth(admin.token))).status).toBe(200);
  });
});

describe('validation des annonces', () => {
  it('brouillon → à valider → publiée, visible sur le site', async () => {
    await api().put('/api/internal/pricing').set(auth(loueur.token)).send(grid);
    await api().put('/api/internal/listing').set(auth(loueur.token)).send(listingBody());
    expect(await publicSlugs()).toEqual([]);
    const id = (await api().get('/api/internal/listing').set(auth(loueur.token))).body.listing.id;
    // A draft cannot be validated directly.
    expect((await api().post(`${P}/listings/${id}/approve`).set(auth(admin.token))).body.code).toBe('invalid_transition');

    await api().post('/api/internal/listing/submit').set(auth(loueur.token));
    expect((await api().post('/api/internal/listing/submit').set(auth(loueur.token))).body.code).toBe('invalid_transition');
    expect((await publicPage()).status).toBe(404);
    const queue = await api().get(`${P}/listings?status=pending_review`).set(auth(admin.token));
    expect(queue.body.counts).toMatchObject({ pending_review: 1, published: 0 });
    expect(queue.body.listings[0]).toMatchObject({ id, title: 'Parking Loueur', operator: { id: loueur.operator.id }, fromPriceCents: 1500 });

    const approved = await api().post(`${P}/listings/${id}/approve`).set(auth(admin.token));
    expect(approved.body.data.status).toBe('published');
    expect((await api().post(`${P}/listings/${id}/approve`).set(auth(admin.token))).status).toBe(409);
    expect((await publicPage()).status).toBe(200);
    expect(await publicSlugs()).toEqual(['parking-loueur']);
    expect(await prisma.auditLog.count({ where: { action: 'listing.approve', staffId: admin.manager.id, operatorId: loueur.operator.id } })).toBe(1);
  });

  it('refus avec un message obligatoire, montré au loueur, puis nouvel envoi', async () => {
    const { id } = await submittedListing();
    const noMessage = await api().post(`${P}/listings/${id}/reject`).set(auth(admin.token)).send({ message: '  ' });
    expect([noMessage.status, noMessage.body.fields]).toEqual([400, { message: 'required' }]);
    const rejected = await api().post(`${P}/listings/${id}/reject`).set(auth(admin.token)).send({ message: 'Ajoutez une photo du parking.' });
    expect(rejected.body.data).toMatchObject({ status: 'rejected', reviewMessage: 'Ajoutez une photo du parking.' });
    expect((await api().get('/api/internal/listing').set(auth(loueur.token))).body.listing).toMatchObject({
      status: 'rejected',
      reviewMessage: 'Ajoutez une photo du parking.',
    });
    expect((await publicPage()).status).toBe(404);

    await api()
      .put('/api/internal/listing')
      .set(auth(loueur.token))
      .send(listingBody({ photos: ['https://example.com/p.jpg'] }));
    const resent = await api().post('/api/internal/listing/submit').set(auth(loueur.token));
    expect(resent.body.data).toMatchObject({ status: 'pending_review', reviewMessage: null });
  });

  it('une fiche publiée reste en ligne quand le loueur la modifie (tracé), et peut être dépubliée', async () => {
    const { id } = await submittedListing();
    await api().post(`${P}/listings/${id}/approve`).set(auth(admin.token));
    await api()
      .put('/api/internal/listing')
      .set(auth(loueur.token))
      .send(listingBody({ title: 'Nouveau nom' }));
    expect((await publicPage()).body.parking.title).toBe('Nouveau nom');
    const edit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'listing.updated', entityId: id }, orderBy: { createdAt: 'desc' } });
    expect(edit.details).toMatchObject({ status: 'published', changed: ['title'] });

    // By the platform, with an optional message.
    const off = await api().post(`${P}/listings/${id}/unpublish`).set(auth(admin.token)).send({});
    expect(off.body.data).toMatchObject({ status: 'draft', reviewMessage: null });
    expect((await publicPage()).status).toBe(404);
    expect((await api().post(`${P}/listings/${id}/unpublish`).set(auth(admin.token)).send({})).status).toBe(409);

    // By the operator.
    await api().post('/api/internal/listing/submit').set(auth(loueur.token));
    await api().post(`${P}/listings/${id}/approve`).set(auth(admin.token));
    expect((await api().post('/api/internal/listing/withdraw').set(auth(loueur.token))).body.data.status).toBe('draft');
    expect((await publicPage()).status).toBe(404);
  });

  it('seul le gérant envoie ou retire sa fiche', async () => {
    await submittedListing();
    const agent = await addStaff(loueur.token, 'agent');
    expect((await api().post('/api/internal/listing/withdraw').set(auth(agent.token))).status).toBe(403);
    expect((await api().post('/api/internal/listing/submit').set(auth(agent.token))).status).toBe(403);
  });

  it('prévient le loueur par email quand Brevo est configuré', async () => {
    const { NotificationService } = await import('@/services/notification.service');
    const notifications = Container.get(NotificationService);
    const saved = { ...notifications.settings };
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'pro@example.com', publicSiteUrl: 'https://site.example' });
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 201 }));
    try {
      const { id } = await submittedListing();
      await api().post(`${P}/listings/${id}/reject`).set(auth(admin.token)).send({ message: 'Photo manquante' });
      const bodies = fetchSpy.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
      const rejection = bodies.find(b => b.tags?.[0] === 'listing_rejected');
      expect(rejection.to).toEqual([{ email: loueur.manager.email, name: loueur.manager.name }]);
      expect(rejection.textContent).toContain('Photo manquante');
    } finally {
      Object.assign(notifications.settings, saved);
    }
  });
});

describe('invitations', () => {
  const invite = (body: Record<string, unknown> = {}) =>
    api()
      .post(`${P}/invitations`)
      .set(auth(admin.token))
      .send({ operatorName: 'Parking Invité', managerEmail: 'M.Martin@Example.com', totalCapacity: 120, commissionBps: 1200, ...body });
  const tokenOf = (url: string) => url.split('#')[1];

  it('crée le loueur, donne le lien quand l’email ne peut pas partir, et le lien sert une fois', async () => {
    const res = await invite();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ emailSent: false, operator: { name: 'Parking Invité' } });
    expect(res.body.inviteUrl).toMatch(/\/pro\/invitation#[\w-]{43}$/);
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: res.body.operator.id }, include: { parkings: true } });
    expect(operator).toMatchObject({ commissionBps: 1200 });
    expect(operator.parkings[0]).toMatchObject({ name: 'Parking Invité', totalCapacity: 120 });
    // Nobody knows the password yet.
    expect((await api().post('/api/internal/auth/login').send({ email: 'm.martin@example.com', password: PASSWORD })).status).toBe(401);
    const row = (await api().get(`${P}/operators`).set(auth(admin.token))).body.operators.find((o: { id: string }) => o.id === operator.id);
    expect(row.invitation).toMatchObject({ expired: false });
    expect(row.manager).toMatchObject({ email: 'm.martin@example.com', emailVerified: false });

    const token = tokenOf(res.body.inviteUrl);
    expect((await api().post('/api/internal/auth/invitation').send({ token })).body).toEqual({
      email: 'm.martin@example.com',
      operatorName: 'Parking Invité',
    });
    const accepted = await api().post('/api/internal/auth/invitation/accept').send({ token, password: 'mon-nouveau-mot-de-passe' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.user).toMatchObject({ email: 'm.martin@example.com', emailVerified: true, role: 'manager' });
    expect((await api().get('/api/internal/staff/me').set(auth(accepted.body.tokenData.access.token))).status).toBe(200);
    expect((await login('m.martin@example.com', 'mon-nouveau-mot-de-passe')).user.operatorName).toBe('Parking Invité');

    const reused = await api().post('/api/internal/auth/invitation/accept').send({ token, password: 'encore-un-autre-mdp' });
    expect([reused.status, reused.body.code]).toEqual([400, 'invalid_link']);
    expect(
      (await api().get(`${P}/operators`).set(auth(admin.token))).body.operators.find((o: { id: string }) => o.id === operator.id).invitation,
    ).toBeNull();
    expect((await api().post(`${P}/operators/${operator.id}/invitation`).set(auth(admin.token))).body.code).toBe('no_pending_invitation');
  });

  it('expire au bout de 7 jours ; « Renvoyer » donne un nouveau lien et invalide l’ancien', async () => {
    const res = await invite();
    const first = tokenOf(res.body.inviteUrl);
    const stored = await prisma.accountToken.findFirstOrThrow({ where: { type: 'invitation' } });
    expect(stored.expiresAt.getTime() - stored.createdAt.getTime()).toBeGreaterThan(6.9 * 86400000);
    await prisma.accountToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().post('/api/internal/auth/invitation/accept').send({ token: first, password: 'mon-nouveau-mot-de-passe' })).body.code).toBe(
      'invalid_link',
    );
    expect(
      (await api().get(`${P}/operators`).set(auth(admin.token))).body.operators.find((o: { id: string }) => o.id === res.body.operator.id).invitation
        .expired,
    ).toBe(true);

    const again = await api().post(`${P}/operators/${res.body.operator.id}/invitation`).set(auth(admin.token));
    expect(again.status).toBe(200);
    expect(again.body.inviteUrl).not.toBe(res.body.inviteUrl);
    expect((await api().post('/api/internal/auth/invitation').send({ token: first })).status).toBe(400);
    expect(
      (
        await api()
          .post('/api/internal/auth/invitation/accept')
          .send({ token: tokenOf(again.body.inviteUrl), password: 'mon-nouveau-mot-de-passe' })
      ).status,
    ).toBe(200);
  });

  it('refuse un email déjà utilisé et valide le formulaire', async () => {
    expect((await invite({ managerEmail: loueur.manager.email })).body.code).toBe('email_taken');
    expect((await invite({ operatorName: '', totalCapacity: 0, managerEmail: 'x' })).body.fields).toEqual({
      operatorName: 'required',
      totalCapacity: 'min_1',
      managerEmail: 'invalid_email',
    });
  });
});

describe('réservations et paiements de toute la plateforme', () => {
  it('liste les réservations de tous les loueurs, sans coordonnées, filtrées par loueur et par date', async () => {
    const book = (op: Op, arrivalAt: string) =>
      api().post('/api/internal/reservations').set(auth(op.token)).send({
        channel: 'phone',
        arrivalAt,
        returnAt: '2030-02-20T18:00',
        passengers: 1,
        customerName: 'Client Secret',
        customerPhone: '0612345678',
        customerEmail: 'client@example.com',
        plate: 'AB-123-CD',
        priceCents: 4500,
      });
    expect((await book(loueur, '2030-02-10T08:00')).status).toBe(201);
    expect((await book(admin, '2030-02-15T08:00')).status).toBe(201);

    const all = await api().get(`${P}/reservations`).set(auth(admin.token));
    expect(all.body.totalDocs).toBe(2);
    expect(all.body.docs[0]).toMatchObject({
      plate: 'AB-123-CD',
      amountCents: 4500,
      channel: 'phone',
      operator: { id: admin.operator.id },
      parking: { name: expect.any(String) },
    });
    for (const doc of all.body.docs) {
      expect(doc).not.toHaveProperty('customerName');
      expect(doc).not.toHaveProperty('customerPhone');
      expect(doc).not.toHaveProperty('customerEmail');
    }
    expect((await api().get(`${P}/reservations?operatorId=${loueur.operator.id}`).set(auth(admin.token))).body.totalDocs).toBe(1);
    expect(
      (await api().get(`${P}/reservations?from=2030-02-12&to=2030-02-15`).set(auth(admin.token))).body.docs.map(
        (d: { operator: { id: string } }) => d.operator.id,
      ),
    ).toEqual([admin.operator.id]);
    expect((await api().get(`${P}/reservations?from=12/02/2030`).set(auth(admin.token))).body.fields).toEqual({ from: 'invalid_date' });
  });

  it('montre les reversements et relance un reversement refusé', async () => {
    const make = (payoutStatus: 'failed' | 'pending', reference: string) =>
      prisma.reservation.create({
        data: {
          reference,
          operatorId: loueur.operator.id,
          parkingId: loueur.parking.id,
          channel: 'plazo',
          status: 'returned',
          arrivalAt: new Date('2026-09-01T08:00:00Z'),
          returnAt: new Date('2026-09-03T08:00:00Z'),
          passengers: 1,
          customerName: 'X',
          customerPhone: '0600000000',
          plate: 'AA-111-AA',
          plateKey: 'AA111AA',
          paymentStatus: 'paid',
          payoutStatus,
          chargedCents: 5000,
          commissionCents: 600,
          operatorShareCents: 4400,
          stripePaymentIntentId: 'pi_1',
        },
      });
    const failed = await make('failed', 'FAIL01');
    await make('pending', 'PEND01');
    const overview = await api().get(`${P}/payments`).set(auth(admin.token));
    const row = overview.body.operators.find((o: { id: string }) => o.id === loueur.operator.id);
    expect(row).toMatchObject({
      payoutSchedule: 'AFTER_STAY',
      stripe: { connected: false },
      pending: { count: 1, amountCents: 4400 },
      failed: [{ reservationId: failed.id, reference: 'FAIL01', amountCents: 4400 }],
    });

    expect((await api().post(`${P}/payouts/${failed.id}/retry`).set(auth(admin.token))).body.code).toBe('payments_disabled');
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    expect((await api().post(`${P}/payouts/${failed.id}/retry`).set(auth(admin.token))).body.code).toBe('operator_account_not_ready');
    await prisma.operator.update({ where: { id: loueur.operator.id }, data: { stripeAccountId: 'acct_x', stripeChargesEnabled: true } });
    const transfer = jest.spyOn(Container.get(PaymentService), 'transferShare').mockImplementation(async id => {
      await prisma.reservation.update({ where: { id }, data: { payoutStatus: 'transferred' } });
      return 'transferred';
    });
    const retried = await api().post(`${P}/payouts/${failed.id}/retry`).set(auth(admin.token));
    expect(retried.body).toEqual({ result: 'transferred', payoutStatus: 'transferred' });
    expect(transfer).toHaveBeenCalledWith(failed.id, 'acct_x');
    expect((await api().post(`${P}/payouts/${failed.id}/retry`).set(auth(admin.token))).body.code).toBe('payout_not_failed');
  });
});
