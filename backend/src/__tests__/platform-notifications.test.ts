import prisma from '@/database';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** E-A / C-A (05/10/2026): the super admin's broadcasts to the staff or the travellers. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const P = '/api/internal/platform/notifications';

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;
let fetchMock: jest.SpyInstance;
const pushes = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL)
    .map(
      ([, init]) =>
        JSON.parse((init as RequestInit).body as string) as {
          app_id: string;
          headings: { fr: string };
          url?: string;
          include_subscription_ids: string[];
        },
    );

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  loueur = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
  process.env.ONESIGNAL_APP_ID = 'staff-app';
  process.env.ONESIGNAL_REST_API_KEY = 'key';
  process.env.ONESIGNAL_TRAVELLER_APP_ID = 'traveller-app';
  process.env.ONESIGNAL_TRAVELLER_REST_API_KEY = 'tkey';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
  delete process.env.ONESIGNAL_TRAVELLER_APP_ID;
  delete process.env.ONESIGNAL_TRAVELLER_REST_API_KEY;
  fetchMock.mockRestore();
});
afterAll(() => prisma.$disconnect());

describe('notifications de la plateforme', () => {
  it('réservées au super admin ; compte les téléphones avant l’envoi ; respecte le réglage « Messages de Plazo » et les loueurs suspendus', async () => {
    const driver = await addStaff(loueur.token, 'driver');
    const quiet = await addStaff(loueur.token, 'agent');
    await api().put('/api/internal/notifications/devices').set(auth(driver.token)).send({ subscriptionId: 'sub-driver' });
    await api().put('/api/internal/notifications/devices').set(auth(quiet.token)).send({ subscriptionId: 'sub-quiet' });
    await api().put('/api/internal/notifications/devices').set(auth(admin.token)).send({ subscriptionId: 'sub-admin' });
    const prefs = await api().patch('/api/internal/notifications/preferences').set(auth(quiet.token)).send({ platform: false });
    expect(prefs.body).toMatchObject({ platform: false, shuttles: true });

    expect((await api().get(P).set(auth(loueur.token))).status).toBe(403);
    expect((await api().post(P).set(auth(driver.token)).send({ audience: 'staff', title: 'x', body: 'y' })).status).toBe(403);

    expect((await api().get(`${P}/audience?audience=staff`).set(auth(admin.token))).body).toEqual({ devices: 2, configured: true });
    expect((await api().get(`${P}/audience?audience=operator&operatorId=${loueur.operator.id}`).set(auth(admin.token))).body.devices).toBe(1);
    expect((await api().get(`${P}/audience?audience=operator`).set(auth(admin.token))).status).toBe(400);
    expect((await api().get(`${P}/audience?audience=nope`).set(auth(admin.token))).status).toBe(400);

    // Validation.
    expect((await api().post(P).set(auth(admin.token)).send({ audience: 'staff', title: '', body: 'y' })).body.fields).toMatchObject({
      title: 'required',
    });
    expect(
      (await api().post(P).set(auth(admin.token)).send({ audience: 'staff', title: 'x', body: 'y', url: 'http://plazo.test' })).body.fields,
    ).toMatchObject({ url: 'invalid_url' });

    const sent = await api()
      .post(P)
      .set(auth(admin.token))
      .send({ audience: 'staff', title: 'Mise à jour', body: 'Nouvelle version de Plazo Pro.', url: 'https://plazo.test/pro' });
    expect(sent.status).toBe(201);
    expect(sent.body.data).toMatchObject({ audience: 'staff', recipients: 2, sentByName: admin.manager.name, operatorName: null });
    expect(pushes()).toHaveLength(1);
    expect(pushes()[0]).toMatchObject({ app_id: 'staff-app', headings: { fr: 'Mise à jour' }, url: 'https://plazo.test/pro' });
    expect(pushes()[0].include_subscription_ids.sort()).toEqual(['sub-admin', 'sub-driver']);

    // One operator only; a suspended one gets nothing.
    const one = await api()
      .post(P)
      .set(auth(admin.token))
      .send({ audience: 'operator', operatorId: loueur.operator.id, title: 'Bonjour', body: 'Pour vous seulement.' });
    expect(one.body.data).toMatchObject({ audience: 'operator', operatorName: loueur.operator.name, recipients: 1 });
    await api().post(`/api/internal/platform/operators/${loueur.operator.id}/suspend`).set(auth(admin.token));
    expect((await api().get(`${P}/audience?audience=staff`).set(auth(admin.token))).body.devices).toBe(1);

    const history = await api().get(P).set(auth(admin.token));
    expect(history.body.data.map((n: { title: string }) => n.title)).toEqual(['Bonjour', 'Mise à jour']);
    const audit = await prisma.auditLog.findMany({ where: { action: 'platform.notification_sent' } });
    expect(audit).toHaveLength(2);
    expect(audit[0].details).toMatchObject({ title: 'Mise à jour', recipients: 2 });
  });

  it('voyageurs : téléphones des réservations en cours seulement, deux envois par jour au plus (C-A)', async () => {
    const r = await prisma.reservation.create({
      data: {
        reference: 'R1',
        operatorId: loueur.operator.id,
        parkingId: loueur.parking.id,
        channel: 'phone',
        status: 'arrived',
        arrivalAt: new Date(Date.now() - 86400000),
        returnAt: new Date(Date.now() + 86400000),
        passengers: 2,
        customerName: 'Camille Martin',
        customerPhone: '0612345678',
        plate: 'AB-123-CD',
        plateKey: 'AB123CD',
      },
    });
    const old = await prisma.reservation.create({
      data: {
        reference: 'R2',
        operatorId: loueur.operator.id,
        parkingId: loueur.parking.id,
        channel: 'phone',
        status: 'returned',
        arrivalAt: new Date(Date.now() - 10 * 86400000),
        returnAt: new Date(Date.now() - 5 * 86400000),
        passengers: 1,
        customerName: 'Léa Durand',
        customerPhone: '0698765432',
        plate: 'GH-456-JK',
        plateKey: 'GH456JK',
      },
    });
    await prisma.travellerDevice.createMany({
      data: [
        { reservationId: r.id, subscriptionId: 'sub-camille' },
        { reservationId: old.id, subscriptionId: 'sub-lea' },
      ],
    });
    expect((await api().get(`${P}/audience?audience=travellers`).set(auth(admin.token))).body.devices).toBe(1);
    const send = () =>
      api().post(P).set(auth(admin.token)).send({ audience: 'travellers', title: 'Neige', body: 'Prévoyez 20 min de plus pour la navette.' });
    expect((await send()).body.data).toMatchObject({ recipients: 1 });
    expect(pushes()[0]).toMatchObject({ app_id: 'traveller-app', include_subscription_ids: ['sub-camille'] });
    expect((await send()).status).toBe(201);
    const third = await send();
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('daily_limit');
    expect(pushes()).toHaveLength(2);
  });
});
