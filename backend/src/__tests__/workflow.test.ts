import { Container } from 'typedi';
import prisma from '@/database';
import { NotificationService } from '@/services/notification.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * Workflow decision A (06/10/2026): one gesture per step. Placing the car checks the traveller in,
 * the return shuttle brings them "De retour au parking", the handover clears the keys and keeps a
 * remark, the API tells each client the next statuses, the team hears of new bookings, and an
 * expected traveller unplaced for hours is flagged (never marked absent on its own).
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const square = (lon: number, lat: number, d = 0.00003): [number, number][] => [
  [lon, lat],
  [lon + d, lat],
  [lon + d, lat + d],
  [lon, lat + d],
  [lon, lat],
];
const spots = Array.from({ length: 2 }, (_, i) => ({
  zoneId: 'z1',
  code: `A-01-0${i + 1}`,
  row: 1,
  index: i + 1,
  geometry: square(5.08 + i * 0.00004, 45.72),
}));
const today = () => new Date().toISOString().slice(0, 10);
const booking = (plate: string, name: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${today()}T06:30`,
  returnAt: `${today()}T23:00`,
  passengers: 2,
  customerName: name,
  customerPhone: '06 12 34 56 78',
  plate,
  ...overrides,
});

let fetchMock: jest.SpyInstance;
const pushes = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL)
    .map(
      ([, init]) =>
        JSON.parse((init as RequestInit).body as string) as {
          headings: { fr: string };
          contents: { fr: string };
          include_subscription_ids: string[];
        },
    );

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  process.env.ONESIGNAL_APP_ID = 'app';
  process.env.ONESIGNAL_REST_API_KEY = 'key';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
});
afterAll(() => prisma.$disconnect());

describe('un seul geste par étape (A, 06/10/2026)', () => {
  it('placer la voiture enregistre l’arrivée ; la navette de retour ramène au parking ; rendre efface les clés et garde la remarque', async () => {
    const op = await setupOperator();
    const valet = await addStaff(op.token, 'valet');
    const driver = await addStaff(op.token, 'driver');
    await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
    const spotIds = (await api().get(`/api/internal/parkings/${op.parking.id}/plan`).set(auth(op.token))).body.spots.map((s: { id: string }) => s.id);
    const r = (await api().post('/api/internal/reservations').set(auth(op.token)).send(booking('AB-123-CD', 'Camille Martin'))).body.data;
    expect(r.status).toBe('upcoming');

    // The valet places the car: the traveller is "Sur place" without a second gesture.
    const placed = await api().post(`/api/internal/reservations/${r.id}/spot`).set(auth(valet.token)).send({ spotId: spotIds[0], keyHook: '12' });
    expect(placed.status).toBe(200);
    expect(placed.body.data).toMatchObject({ status: 'arrived', keyHook: '12' });
    expect(placed.body.data.arrivedAt).not.toBeNull();
    // Placing again (a move) does not touch the status; releasing the spot neither.
    await api().post(`/api/internal/reservations/${r.id}/spot`).set(auth(valet.token)).send({ spotId: spotIds[1] });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).status).toBe('arrived');

    // The drop-off leaves them "Parti en navette"; the pick-up brings them "De retour au parking".
    const dropoff = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(driver.token))
      .send({ reservationIds: [r.id], direction: 'dropoff' });
    expect(dropoff.status).toBe(201);
    await api().post(`/api/internal/shuttle/trips/${dropoff.body.trip.id}/end`).set(auth(driver.token));
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).status).toBe('shuttled_out');
    const pickup = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(driver.token))
      .send({ reservationIds: [r.id] });
    expect(pickup.status).toBe(201);
    await api().post(`/api/internal/shuttle/trips/${pickup.body.trip.id}/end`).set(auth(driver.token));
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: r.id } })).status).toBe('back_at_parking');
    // Back at the parking: no shuttle lists them any more, the car still holds its spot.
    expect((await api().get('/api/internal/shuttle/pickups').set(auth(driver.token))).body.rows).toEqual([]);
    const board = await api().get(`/api/internal/parkings/${op.parking.id}/occupation`).set(auth(valet.token));
    expect(board.body.spots.find((s: { id: string }) => s.id === spotIds[1]).occupant).toMatchObject({ reference: r.reference, onSite: true });

    // The API serves the next statuses by role: a valet may hand back, not cancel.
    const asValet = await api().get(`/api/internal/reservations/${r.id}`).set(auth(valet.token));
    expect(asValet.body.nextStatuses).toEqual(['returned', 'return_requested']);
    const expected = (await api().post('/api/internal/reservations').set(auth(op.token)).send(booking('CD-456-EF', 'Paul Dupont'))).body.data;
    expect((await api().get(`/api/internal/reservations/${expected.id}`).set(auth(valet.token))).body.nextStatuses).toEqual(['arrived']);
    expect((await api().get(`/api/internal/reservations/${expected.id}`).set(auth(op.token))).body.nextStatuses).toEqual([
      'arrived',
      'cancelled',
      'no_show',
    ]);

    // The handover: keys leave the hook, the remark joins the notes.
    const handed = await api()
      .post(`/api/internal/reservations/${r.id}/status`)
      .set(auth(valet.token))
      .send({ status: 'returned', note: 'Rayure aile avant droite signalée par le client' });
    expect(handed.status).toBe(200);
    expect(handed.body.data).toMatchObject({ status: 'returned', keyHook: null });
    expect(handed.body.data.notes).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2} · valet\] Rayure aile avant droite signalée par le client$/);
    expect(handed.body.data.returnedAt).not.toBeNull();
    expect((await api().get(`/api/internal/reservations/${r.id}`).set(auth(op.token))).body.nextStatuses).toEqual(['back_at_parking']);
    expect((await api().post(`/api/internal/reservations/${r.id}/status`).set(auth(op.token)).send({ status: 'return_requested' })).body.code).toBe(
      'invalid_transition',
    );
  });

  it('un client attendu depuis des heures sans voiture placée est signalé, jamais marqué absent tout seul', async () => {
    const op = await setupOperator();
    await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
    const late = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(op.token))
        .send(booking('AB-123-CD', 'Camille Martin', { arrivalAt: `${today()}T00:05`, returnAt: `${today()}T23:30` }))
    ).body.data;
    await prisma.reservation.update({ where: { id: late.id }, data: { arrivalAt: new Date(Date.now() - 4 * 3600000) } });
    const dashboard = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dashboard.status).toBe(200);
    const alert = dashboard.body.alerts.find((a: { kind: string }) => a.kind === 'no_show_suspected');
    expect(alert).toMatchObject({ severity: 'watch', reservationId: late.id, customerName: 'Camille Martin' });
    expect(alert.minutes).toBeGreaterThanOrEqual(240);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: late.id } })).status).toBe('upcoming');
  });

  it('l’équipe reçoit « Nouvelle réservation » pour ce qu’elle n’a pas saisi elle-même, selon son réglage', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const driver = await addStaff(op.token, 'driver');
    await api().put('/api/internal/notifications/devices').set(auth(op.token)).send({ subscriptionId: 'sub-manager' });
    await api().put('/api/internal/notifications/devices').set(auth(agent.token)).send({ subscriptionId: 'sub-agent' });
    await api().put('/api/internal/notifications/devices').set(auth(driver.token)).send({ subscriptionId: 'sub-driver' });
    const prefs = await api().patch('/api/internal/notifications/preferences').set(auth(driver.token)).send({ bookings: false });
    expect(prefs.body).toMatchObject({ bookings: false });

    const created = await api()
      .post('/api/internal/reservations')
      .set(auth(agent.token))
      .send(
        booking('AB-123-CD', 'Camille Martin', {
          channel: 'aggregator',
          channelDetail: 'Allopark',
          arrivalAt: '2027-03-01T06:30',
          returnAt: '2027-03-03T15:05',
        }),
      );
    expect(created.status).toBe(201);
    const sent = pushes();
    expect(sent).toHaveLength(1);
    expect(sent[0].headings.fr).toBe('Nouvelle réservation · Allopark');
    expect(sent[0].contents.fr).toBe('C. Martin · AB-123-CD · 2 pass. · arrivée 01/03 06:30 → retour 03/03');
    // The agent who typed it and the driver who opted out are left out.
    expect(sent[0].include_subscription_ids).toEqual(['sub-manager']);
  });
});
