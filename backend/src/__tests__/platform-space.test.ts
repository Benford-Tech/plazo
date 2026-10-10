import { Container } from 'typedi';
import prisma from '@/database';
import { PaymentService } from '@/services/payment.service';
import { StripeApi, StripeService } from '@/services/stripe.service';
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
  Container.get(StripeService).override = null;
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
    ['post', `${P}/operators/x/archive`],
    ['post', `${P}/operators/x/unarchive`],
    ['get', `${P}/operators/x/deletion`],
    ['delete', `${P}/operators/x`],
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

describe('archivage d’un loueur suspendu (09/10/2026)', () => {
  const listIds = async (view?: string) => {
    const res = await api()
      .get(`${P}/operators${view ? `?view=${view}` : ''}`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    return { ids: (res.body.operators as { id: string }[]).map(o => o.id).sort(), counts: res.body.counts };
  };

  it('le range hors des listes Loueurs et Annonces, garde ses données, et le ramène sur demande', async () => {
    const listing = await submittedListing();
    await api().post(`${P}/listings/${listing.id}/approve`).set(auth(admin.token));

    // Only a suspended operator can be archived.
    const active = await api().post(`${P}/operators/${loueur.operator.id}/archive`).set(auth(admin.token));
    expect([active.status, active.body.code]).toEqual([409, 'not_suspended']);
    await api().post(`${P}/operators/${loueur.operator.id}/suspend`).set(auth(admin.token));
    const res = await api().post(`${P}/operators/${loueur.operator.id}/archive`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.archivedAt).toEqual(expect.any(String));
    // Twice: nothing changes.
    expect((await api().post(`${P}/operators/${loueur.operator.id}/archive`).set(auth(admin.token))).body.data.archivedAt).toBe(
      res.body.data.archivedAt,
    );

    expect(await listIds()).toEqual({ ids: [admin.operator.id], counts: { current: 1, archived: 1 } });
    const archived = await api().get(`${P}/operators?view=archived`).set(auth(admin.token));
    expect(archived.body.operators).toEqual([
      expect.objectContaining({ id: loueur.operator.id, status: 'suspended', archivedAt: expect.any(String) }),
    ]);
    expect((await api().get(`${P}/operators?view=all`).set(auth(admin.token))).status).toBe(400);
    // Its listing leaves the Annonces tab and its counts.
    const listings = await api().get(`${P}/listings`).set(auth(admin.token));
    expect(listings.body.listings).toEqual([]);
    expect(listings.body.counts.published).toBe(0);
    // Data kept.
    expect(await prisma.listing.count({ where: { id: listing.id } })).toBe(1);

    // Back in the list, still suspended.
    expect((await api().post(`${P}/operators/${loueur.operator.id}/unarchive`).set(auth(admin.token))).status).toBe(200);
    expect(await listIds()).toEqual({ ids: [admin.operator.id, loueur.operator.id].sort(), counts: { current: 2, archived: 0 } });
    expect((await prisma.operator.findUniqueOrThrow({ where: { id: loueur.operator.id } })).status).toBe('suspended');
    expect((await api().get(`${P}/listings?status=published`).set(auth(admin.token))).body.listings).toHaveLength(1);

    // Reactivating an archived operator takes it out of the archive too.
    await api().post(`${P}/operators/${loueur.operator.id}/archive`).set(auth(admin.token));
    expect((await api().post(`${P}/operators/${loueur.operator.id}/reactivate`).set(auth(admin.token))).status).toBe(200);
    expect(await prisma.operator.findUniqueOrThrow({ where: { id: loueur.operator.id } })).toMatchObject({ status: 'active', archivedAt: null });
    expect((await publicPage()).status).toBe(200);

    expect(
      await prisma.auditLog.count({
        where: { operatorId: loueur.operator.id, staffId: admin.manager.id, action: { in: ['operator.archived', 'operator.unarchived'] } },
      }),
    ).toBe(3);
  });

  it('la base refuse un loueur archivé qui ne serait pas suspendu', async () => {
    await expect(prisma.operator.update({ where: { id: loueur.operator.id }, data: { archivedAt: new Date() } })).rejects.toThrow();
  });
});

describe('suppression d’un loueur (09/10/2026)', () => {
  let refs = 0;
  const reservationOf = (op: { id: string }, parkingId: string, extra: Record<string, unknown> = {}) =>
    prisma.reservation.create({
      data: {
        reference: `DEL${String(++refs).padStart(4, '0')}`,
        operatorId: op.id,
        parkingId,
        channel: 'phone',
        arrivalAt: new Date('2026-11-02T08:00:00Z'),
        returnAt: new Date('2026-11-09T18:00:00Z'),
        passengers: 1,
        customerName: 'Client Test',
        customerPhone: '0612345678',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
        ...extra,
      },
    });
  const preview = (id: string) => api().get(`${P}/operators/${id}/deletion`).set(auth(admin.token));
  const remove = (id: string) => api().delete(`${P}/operators/${id}`).set(auth(admin.token));
  const suspend = (id: string) => api().post(`${P}/operators/${id}/suspend`).set(auth(admin.token));

  it('efface un loueur invité jamais connecté sans le suspendre, et le trace dans le journal de la plateforme', async () => {
    const invited = await api().post(`${P}/invitations`).set(auth(admin.token)).send({
      operatorName: 'Invité par erreur',
      managerFirstName: 'Léon',
      managerLastName: 'Erreur',
      managerEmail: 'erreur@example.com',
      totalCapacity: 80,
    });
    const id = invited.body.operator.id as string;
    expect((await preview(id)).body.data).toMatchObject({
      name: 'Invité par erreur',
      deletable: true,
      reason: null,
      counts: { parkings: 1, listings: 0, reservations: 0, staff: 1, paidReservations: 0 },
    });

    const res = await remove(id);
    expect([res.status, res.body.data]).toEqual([
      200,
      { id, name: 'Invité par erreur', counts: { parkings: 1, listings: 0, reservations: 0, staff: 1, paidReservations: 0 } },
    ]);
    expect(await prisma.operator.count({ where: { id } })).toBe(0);
    expect(await prisma.parking.count({ where: { operatorId: id } })).toBe(0);
    expect(await prisma.staff.count({ where: { email: 'erreur@example.com' } })).toBe(0);
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'operator.deleted' } });
    expect(entry).toMatchObject({ operatorId: admin.operator.id, staffId: admin.manager.id, entityId: id });
    expect(entry.details).toMatchObject({ name: 'Invité par erreur', counts: { parkings: 1 } });
    expect((await preview(id)).status).toBe(404);
    expect((await remove(id)).status).toBe(404);
  });

  it('demande de suspendre un loueur qui a servi ; suspendu, il part avec ses réservations, son équipe et sa fiche', async () => {
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({ deletable: false, reason: 'not_suspended' });
    expect([(await remove(loueur.operator.id)).status, (await remove(loueur.operator.id)).body.code]).toEqual([409, 'not_suspended']);

    await submittedListing();
    await reservationOf(loueur.operator, loueur.parking.id);
    await addStaff(loueur.token, 'agent');
    expect((await suspend(loueur.operator.id)).status).toBe(200);
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({
      deletable: true,
      counts: { parkings: 1, listings: 1, reservations: 1, staff: 2, paidReservations: 0 },
    });
    await reservationOf(admin.operator, admin.parking.id);
    const platformData = () =>
      Promise.all([
        prisma.parking.count({ where: { operatorId: admin.operator.id } }),
        prisma.staff.count({ where: { operatorId: admin.operator.id } }),
        prisma.reservation.count({ where: { operatorId: admin.operator.id } }),
      ]);
    const before = await platformData();

    expect((await remove(loueur.operator.id)).status).toBe(200);
    expect(await platformData()).toEqual(before);
    expect(await prisma.reservation.count({ where: { operatorId: loueur.operator.id } })).toBe(0);
    expect(await prisma.listing.count({ where: { parkingId: loueur.parking.id } })).toBe(0);
    expect(await prisma.staff.count({ where: { operatorId: loueur.operator.id } })).toBe(0);
    expect((await api().get('/api/internal/staff/me').set(auth(loueur.token))).status).toBe(401);
    // The platform's own data is untouched.
    expect((await api().get(`${P}/operators`).set(auth(admin.token))).body.operators.map((o: { id: string }) => o.id)).toEqual([admin.operator.id]);
  });

  it('garde un loueur qui a des paiements en ligne (à archiver), sauf une démo, payée en test', async () => {
    await reservationOf(loueur.operator, loueur.parking.id, { channel: 'plazo', paymentStatus: 'paid', paidAt: new Date(), chargedCents: 4500 });
    await suspend(loueur.operator.id);
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({
      deletable: false,
      reason: 'has_payments',
      counts: { paidReservations: 1 },
    });
    const refused = await remove(loueur.operator.id);
    expect([refused.status, refused.body.code]).toEqual([409, 'has_payments']);
    expect(await prisma.operator.count({ where: { id: loueur.operator.id } })).toBe(1);

    await prisma.operator.update({ where: { id: loueur.operator.id }, data: { isDemo: true } });
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({ deletable: true, reason: null });
    expect((await remove(loueur.operator.id)).status).toBe(200);
    expect(await prisma.operator.count({ where: { id: loueur.operator.id } })).toBe(0);
  });

  it('demande de suspendre un loueur dont l’invitation a été acceptée ; une invitation expirée part directement', async () => {
    const invite = (email: string) =>
      api()
        .post(`${P}/invitations`)
        .set(auth(admin.token))
        .send({ operatorName: `Loueur ${email}`, managerFirstName: 'Jeanne', managerLastName: 'Loueur', managerEmail: email, totalCapacity: 50 });
    const accepted = await invite('accepte@example.com');
    const token = String(accepted.body.inviteUrl).split('#')[1];
    expect((await api().post('/api/internal/auth/invitation/accept').send({ token, password: PASSWORD })).status).toBe(200);
    expect((await preview(accepted.body.operator.id)).body.data).toMatchObject({ deletable: false, reason: 'not_suspended' });
    expect((await remove(accepted.body.operator.id)).body.code).toBe('not_suspended');

    const expired = await invite('expire@example.com');
    await prisma.accountToken.updateMany({
      where: { staff: { operatorId: expired.body.operator.id } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await remove(expired.body.operator.id)).status).toBe(200);
  });

  it.each([
    ['remboursée', { paymentStatus: 'refunded' as const }],
    ['reversement annulé', { payoutStatus: 'cancelled' as const }],
    ['transfert fait', { stripeChargeId: 'ch_test_1' }],
  ])('garde un loueur dont une réservation est %s', async (_label, extra) => {
    await reservationOf(loueur.operator, loueur.parking.id, { channel: 'plazo', ...extra });
    await suspend(loueur.operator.id);
    const res = await remove(loueur.operator.id);
    expect([res.status, res.body.code]).toEqual([409, 'has_payments']);
  });

  it('attend la fin d’un paiement en cours ; une attente échue ne compte plus', async () => {
    await suspend(loueur.operator.id);
    const hold = await reservationOf(loueur.operator, loueur.parking.id, {
      channel: 'plazo',
      status: 'pending_payment',
      paymentStatus: 'pending',
      holdExpiresAt: new Date(Date.now() + 30 * 60000),
      priceCents: 4500,
      chargedCents: 4500,
    });
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({ deletable: false, reason: 'payment_in_progress' });
    const refused = await remove(loueur.operator.id);
    expect([refused.status, refused.body.code]).toEqual([409, 'payment_in_progress']);
    expect(await prisma.operator.count({ where: { id: loueur.operator.id } })).toBe(1);

    await prisma.reservation.update({ where: { id: hold.id }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    expect((await preview(loueur.operator.id)).body.data).toMatchObject({ deletable: true, reason: null });
    expect((await remove(loueur.operator.id)).status).toBe(200);
  });

  describe('paiements restés ouverts chez Stripe', () => {
    let intents: Record<
      string,
      {
        id: string;
        status: string;
        amount: number;
        amount_received: number;
        currency: string;
        metadata: Record<string, string>;
        latest_charge: string | null;
      }
    >;
    let sessions: Record<string, { id: string; status: string; payment_status: string }>;
    let fake: { paymentIntents: { retrieve: jest.Mock; cancel: jest.Mock }; checkout: { sessions: { retrieve: jest.Mock; expire: jest.Mock } } };

    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
      intents = {};
      sessions = {};
      fake = {
        paymentIntents: {
          retrieve: jest.fn(async (id: string) => ({ object: 'payment_intent', ...intents[id] })),
          cancel: jest.fn(async (id: string) => Object.assign(intents[id], { status: 'canceled' })),
        },
        checkout: {
          sessions: {
            retrieve: jest.fn(async (id: string) => ({ object: 'checkout.session', ...sessions[id] })),
            expire: jest.fn(async (id: string) => Object.assign(sessions[id], { status: 'expired' })),
          },
        },
      };
      Container.get(StripeService).override = fake as unknown as StripeApi;
    });

    const expiredHold = (extra: Record<string, unknown>) =>
      reservationOf(loueur.operator, loueur.parking.id, {
        channel: 'plazo',
        status: 'cancelled',
        paymentStatus: 'expired',
        cancelledAt: new Date(),
        priceCents: 4500,
        chargedCents: 4500,
        ...extra,
      });

    it('ferme le paiement d’une attente échue avant d’effacer, pour qu’aucun argent n’arrive sur une réservation disparue', async () => {
      await suspend(loueur.operator.id);
      await expiredHold({ stripePaymentIntentId: 'pi_open' });
      await expiredHold({ stripeCheckoutSessionId: 'cs_open' });
      intents.pi_open = {
        id: 'pi_open',
        status: 'requires_payment_method',
        amount: 4500,
        amount_received: 0,
        currency: 'eur',
        metadata: {},
        latest_charge: null,
      };
      sessions.cs_open = { id: 'cs_open', status: 'open', payment_status: 'unpaid' };

      expect((await remove(loueur.operator.id)).status).toBe(200);
      expect(fake.paymentIntents.cancel).toHaveBeenCalledWith('pi_open', {}, expect.anything());
      expect(fake.checkout.sessions.expire).toHaveBeenCalledWith('cs_open', {}, expect.anything());
    });

    it('garde le loueur quand un paiement est passé entre-temps, ou encore en traitement à la banque', async () => {
      await suspend(loueur.operator.id);
      const late = await expiredHold({ stripePaymentIntentId: 'pi_paid' });
      intents.pi_paid = {
        id: 'pi_paid',
        status: 'succeeded',
        amount: 4500,
        amount_received: 4500,
        currency: 'eur',
        metadata: { reservationId: late.id },
        latest_charge: 'ch_late',
      };
      const paid = await remove(loueur.operator.id);
      expect([paid.status, paid.body.code]).toEqual([409, 'has_payments']);
      expect((await prisma.reservation.findUniqueOrThrow({ where: { id: late.id } })).paymentStatus).toBe('paid');

      await prisma.reservation.delete({ where: { id: late.id } });
      await expiredHold({ stripePaymentIntentId: 'pi_bank' });
      intents.pi_bank = { id: 'pi_bank', status: 'processing', amount: 4500, amount_received: 0, currency: 'eur', metadata: {}, latest_charge: null };
      const processing = await remove(loueur.operator.id);
      expect([processing.status, processing.body.code]).toEqual([409, 'payment_in_progress']);
      expect(await prisma.operator.count({ where: { id: loueur.operator.id } })).toBe(1);
    });
  });

  it('trace la suppression chez la plateforme même depuis une session « ouvrir son espace »', async () => {
    await suspend(loueur.operator.id);
    const res = await api()
      .delete(`${P}/operators/${loueur.operator.id}`)
      .set(auth(await viewAs()));
    expect(res.status).toBe(200);
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'operator.deleted' } });
    expect(entry).toMatchObject({ operatorId: admin.operator.id, staffId: admin.manager.id });
  });

  it('ne supprime jamais le compte de la plateforme', async () => {
    expect((await preview(admin.operator.id)).body.data).toMatchObject({ deletable: false, reason: 'cannot_delete_platform' });
    const res = await remove(admin.operator.id);
    expect([res.status, res.body.code]).toEqual([400, 'cannot_delete_platform']);
    expect(await prisma.operator.count({ where: { id: admin.operator.id } })).toBe(1);
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

  it('laisse l’équipe, les mots de passe et les réglages personnels en lecture seule', async () => {
    const token = await viewAs();
    expect((await api().get('/api/internal/staff').set(auth(token))).status).toBe(200);
    const attempts = [
      api()
        .post('/api/internal/staff')
        .set(auth(token))
        .send({ firstName: 'Intrus', lastName: 'Inconnu', email: 'intrus@example.com', role: 'manager', password: PASSWORD }),
      api().patch(`/api/internal/staff/${loueur.manager.id}`).set(auth(token)).send({ firstName: 'Intrus' }),
      api().patch('/api/internal/staff/me').set(auth(token)).send({ firstName: 'Intrus', lastName: 'Inconnu' }),
      api().patch(`/api/internal/staff/${loueur.manager.id}`).set(auth(token)).send({ isActive: false }),
      api().post(`/api/internal/staff/${loueur.manager.id}/reset-password`).set(auth(token)).send({ password: 'nouveau-mot-de-passe' }),
      api().patch('/api/internal/staff/me/password').set(auth(token)).send({ currentPassword: PASSWORD, newPassword: 'nouveau-mot-de-passe' }),
      api().post('/api/internal/auth/verify-email/resend').set(auth(token)),
      // The signed-in person's own settings: post, vehicle, phones and notification preferences.
      api().patch('/api/internal/staff/me/post').set(auth(token)).send({ post: 'driver' }),
      api().patch('/api/internal/staff/me/vehicle').set(auth(token)).send({ vehicleId: null }),
      api().put('/api/internal/notifications/devices').set(auth(token)).send({ subscriptionId: 'sub-admin', platform: 'web' }),
      api().delete('/api/internal/notifications/devices/sub-admin').set(auth(token)),
      api().patch('/api/internal/notifications/preferences').set(auth(token)).send({ bookings: 'never' }),
    ];
    for (const res of await Promise.all(attempts)) expect([res.status, res.body.code]).toEqual([403, 'view_as_read_only']);
    expect(await prisma.staff.count({ where: { operatorId: loueur.operator.id } })).toBe(1);
    expect((await login(loueur.manager.email)).user.isActive).toBe(true);
  });

  it('laisse le compte Stripe et le calendrier de reversement du loueur en lecture seule', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const token = await viewAs();
    expect((await api().get('/api/internal/payments/status').set(auth(token))).status).toBe(200);
    expect((await api().get('/api/internal/payments/settings').set(auth(token))).status).toBe(200);
    const attempts = [
      api().post('/api/internal/payments/onboarding').set(auth(token)),
      api().post('/api/internal/payments/dashboard-link').set(auth(token)),
      api().put('/api/internal/payments/settings').set(auth(token)).send({ payoutSchedule: 'WEEKLY' }),
    ];
    for (const res of await Promise.all(attempts)) expect([res.status, res.body.code]).toEqual([403, 'view_as_read_only']);
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: loueur.operator.id } });
    expect([operator.stripeAccountId, operator.payoutSchedule]).toEqual([null, 'AFTER_STAY']);
  });

  it('10/10/2026 : règle le suivi des navettes et les dessertes du loueur, tracés à son nom', async () => {
    const token = await viewAs();
    const tracking = await api().put(`/api/internal/parkings/${loueur.parking.id}/shuttle-tracking`).set(auth(token)).send({ tracking: 'off' });
    expect(tracking.status).toBe(200);
    expect((await prisma.parking.findUniqueOrThrow({ where: { id: loueur.parking.id } })).shuttleTracking).toBe('off');

    const added = await api()
      .post('/api/internal/shuttle/stops')
      .set(auth(token))
      .send({ kind: 'station', name: 'Gare TGV', lat: 45.72, lng: 5.075 });
    expect(added.status).toBe(201);
    const stopId = added.body.data.id as string;
    const edited = await api().patch(`/api/internal/shuttle/stops/${stopId}`).set(auth(token)).send({ instructions: 'Sortie Est, quai 2' });
    expect([edited.status, edited.body.data.instructions]).toEqual([200, 'Sortie Est, quai 2']);
    expect((await api().get('/api/internal/shuttle/stops').set(auth(loueur.token))).body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: stopId, name: 'Gare TGV', instructions: 'Sortie Est, quai 2' })]),
    );
    expect((await api().delete(`/api/internal/shuttle/stops/${stopId}`).set(auth(token))).status).toBe(204);

    const entries = await prisma.auditLog.findMany({
      where: { operatorId: loueur.operator.id, staffId: admin.manager.id },
      orderBy: { createdAt: 'asc' },
    });
    const own = entries.filter(e => e.action !== 'view_as.write' && e.action !== 'operator.view_as_started');
    expect(own.map(e => [e.action, (e.details as { viewAs?: boolean }).viewAs])).toEqual([
      ['parking.settings_updated', true],
      ['shuttle.stop_added', true],
      ['shuttle.stop_updated', true],
      ['shuttle.stop_removed', true],
    ]);
    expect(entries.filter(e => e.action === 'view_as.write').map(e => (e.details as { path: string }).path)).toEqual([
      `/api/internal/parkings/${loueur.parking.id}/shuttle-tracking`,
      '/api/internal/shuttle/stops',
      `/api/internal/shuttle/stops/${stopId}`,
      `/api/internal/shuttle/stops/${stopId}`,
    ]);
  });

  it('10/10/2026 : ne conduit pas la navette du loueur (view_as_not_driver), mais termine un trajet resté ouvert', async () => {
    const driver = await addStaff(loueur.token, 'driver');
    const created = await api().post('/api/internal/reservations').set(auth(loueur.token)).send({
      channel: 'phone',
      arrivalAt: '2030-01-10T08:00',
      returnAt: '2030-01-12T18:00',
      passengers: 2,
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: '0612345678',
      plate: 'AB-123-CD',
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    await prisma.reservation.update({ where: { id }, data: { status: 'arrived' } });
    const token = await viewAs();

    const start = (bearer: string) =>
      api()
        .post('/api/internal/shuttle/trips')
        .set(auth(bearer))
        .send({ reservationIds: [id], direction: 'dropoff' });
    const refused = await start(token);
    expect([refused.status, refused.body.code]).toEqual([403, 'view_as_not_driver']);
    const trip = await start(driver.token);
    expect(trip.status).toBe(201);
    const tripId = trip.body.trip.id as string;
    const position = await api()
      .post(`/api/internal/shuttle/trips/${tripId}/position`)
      .set(auth(token))
      .send({ lat: 45.74, lng: 5.06, accuracy: 8, recordedAt: new Date().toISOString() });
    expect([position.status, position.body.code]).toEqual([403, 'view_as_not_driver']);
    expect(await prisma.shuttleTrip.count({ where: { driverId: admin.manager.id } })).toBe(0);

    // A trip left running (the driver's phone off): support ends it, the passengers left for the terminal.
    const ended = await api().post(`/api/internal/shuttle/trips/${tripId}/end`).set(auth(token));
    expect([ended.status, ended.body.trip.status]).toEqual([200, 'ended']);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id } })).status).toBe('shuttled_out');
    const entries = await prisma.auditLog.findMany({ where: { operatorId: loueur.operator.id, staffId: admin.manager.id } });
    expect(entries.find(e => e.action === 'shuttle.trip_ended')).toMatchObject({ entityId: tripId, details: { viewAs: true } });
    expect(entries.filter(e => e.action === 'view_as.write').map(e => (e.details as { path: string }).path)).toContain(
      `/api/internal/shuttle/trips/${tripId}/end`,
    );
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
      .send({
        operatorName: 'Parking Invité',
        managerFirstName: 'Marc',
        managerLastName: 'Martin',
        managerEmail: 'M.Martin@Example.com',
        totalCapacity: 120,
        commissionBps: 1200,
        ...body,
      });
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
    // 09/10/2026: the manager is named as typed, never after the company.
    expect(await prisma.staff.findUniqueOrThrow({ where: { email: 'm.martin@example.com' } })).toMatchObject({
      firstName: 'Marc',
      lastName: 'Martin',
      name: 'Marc Martin',
    });

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

  it('la plateforme prépare le parking pendant l’invitation ; le gérant le retrouve en acceptant (09/10/2026)', async () => {
    const res = await invite();
    const operatorId = res.body.operator.id as string;
    const token = await viewAs(operatorId);
    const parking = await api().get('/api/internal/parking').set(auth(token));
    expect(parking.status).toBe(200);

    const settings = await api()
      .patch(`/api/internal/parkings/${parking.body.id}`)
      .set(auth(token))
      .send({ name: 'Parking Invité Lyon', address: null, totalCapacity: 150, safetyMarginPct: 5, shuttleTravelMinutes: 8 });
    expect(settings.status).toBe(200);
    expect((await api().put('/api/internal/pricing').set(auth(token)).send(grid)).status).toBe(200);
    expect(
      (
        await api()
          .put('/api/internal/listing')
          .set(auth(token))
          .send(listingBody({ slug: 'parking-invite', title: 'Parking Invité' }))
      ).status,
    ).toBe(200);
    const row = (await api().get(`${P}/operators`).set(auth(admin.token))).body.operators.find((o: { id: string }) => o.id === operatorId);
    expect(row).toMatchObject({ invitation: { expired: false }, listing: { status: 'draft' } });
    expect(await prisma.auditLog.count({ where: { operatorId, staffId: admin.manager.id, action: 'view_as.write' } })).toBe(3);

    const accepted = await api()
      .post('/api/internal/auth/invitation/accept')
      .send({ token: tokenOf(res.body.inviteUrl), password: 'mon-nouveau-mot-de-passe' });
    expect(accepted.status).toBe(200);
    const own = auth(accepted.body.tokenData.access.token);
    expect((await api().get('/api/internal/parking').set(own)).body).toMatchObject({ name: 'Parking Invité Lyon', totalCapacity: 150 });
    expect((await api().get('/api/internal/listing').set(own)).body.listing).toMatchObject({ slug: 'parking-invite', status: 'draft' });
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
    // 09/10/2026: the manager's first and last name are required (trimmed), 60 characters each; the company name is no fallback.
    expect((await invite({ managerFirstName: '   ', managerLastName: undefined, managerName: 'Marc Martin' })).body.fields).toEqual({
      managerFirstName: 'required',
      managerLastName: 'required',
    });
    expect((await invite({ managerLastName: 'M'.repeat(61) })).body.fields).toEqual({ managerLastName: 'too_long' });
    expect(await prisma.staff.count({ where: { email: 'm.martin@example.com' } })).toBe(0);
    const trimmed = await invite({ managerFirstName: '  Marc ', managerLastName: ' Martin  ' });
    expect(trimmed.status).toBe(201);
    expect(await prisma.staff.findUniqueOrThrow({ where: { email: 'm.martin@example.com' } })).toMatchObject({ name: 'Marc Martin' });
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
