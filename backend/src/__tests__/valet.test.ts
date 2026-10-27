import { Container } from 'typedi';
import prisma from '@/database';
import { landedSms } from '@/domain/return-messages';
import { runNoticeDue, valetMeetingPointOf } from '@/domain/valet';
import { runPush, ValetService } from '@/services/valet.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** « Voiturier au terminal » (27/10/2026, direction B): the arrival and departure runs of a valet booking. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600000);

const booking = (overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: '2027-03-04T06:30',
  returnAt: '2027-03-07T15:05',
  passengers: 2,
  customerFirstName: 'Claire',
  customerLastName: 'Laurent',
  customerPhone: '06 12 34 56 78',
  plate: 'gk318px',
  ...overrides,
});

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

/** A valet booking arriving in an hour, returning in two days. */
async function setup() {
  const op = await setupOperator();
  const created = await api()
    .post('/api/internal/reservations')
    .set(auth(op.token))
    .send(booking({ handover: 'valet' }));
  expect(created.status).toBe(201);
  const id = created.body.data.id as string;
  await prisma.reservation.update({ where: { id }, data: { arrivalAt: hoursFromNow(1), returnAt: hoursFromNow(48) } });
  return { op, id };
}

describe('domaine', () => {
  it('point de rendez-vous, texte du SMS d’atterrissage et du push', () => {
    expect(valetMeetingPointOf({ valetMeetingPoint: null }, 'LYS')).toBe('Terminal 1 · dépose-minute');
    expect(valetMeetingPointOf({ valetMeetingPoint: '  ' }, 'NCE')).toBe('Aéroport · dépose-minute');
    expect(valetMeetingPointOf({ valetMeetingPoint: 'Parking P0, niveau -1' }, 'LYS')).toBe('Parking P0, niveau -1');
    const sms = landedSms({
      productName: 'Plazo',
      parkingName: 'Parking',
      meetingLabel: 'Porte 12',
      instructions: 'Côté arrivées',
      phone: null,
      manageUrl: null,
      valetMeetingPoint: 'Terminal 1 · dépose-minute',
    });
    expect(sms).toContain('Votre voiture vous attend : Terminal 1 · dépose-minute.');
    expect(sms).not.toContain('navette');
    const push = runPush(
      'departure',
      { plate: 'GK-318-PX', customerFirstName: 'Claire', customerLastName: 'Laurent', customerName: 'Claire Laurent' },
      new Date('2027-03-07T14:05:00Z'),
      'Terminal 1',
    );
    expect(push).toEqual({ title: 'Course à prendre · 15:05 · Terminal 1', body: 'Rendre la voiture : GK-318-PX · C. Laurent' });
    const now = new Date();
    expect(runNoticeDue(new Date(now.getTime() + 20 * 60000), now)).toBe(true);
    expect(runNoticeDue(new Date(now.getTime() + 45 * 60000), now)).toBe(false);
  });
});

describe('courses du voiturier', () => {
  it('liste la course d’arrivée, la prend, refuse un autre voiturier, la rend, puis la termine', async () => {
    const { op, id } = await setup();
    const valet = await addStaff(op.token, 'valet');
    const other = await addStaff(op.token, 'valet');

    const list = await api().get('/api/internal/valet/runs').set(auth(valet.token));
    expect(list.status).toBe(200);
    expect(list.body.meetingPoint).toBe('Aéroport · dépose-minute');
    expect(list.body.runs).toHaveLength(1);
    expect(list.body.runs[0]).toMatchObject({ reservationId: id, kind: 'arrival', state: 'todo', takenBy: null, plate: 'GK-318-PX' });
    expect(list.body.counts).toEqual({ todo: 1, taken: 0, done: 0 });

    const taken = await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(valet.token));
    expect(taken.status).toBe(200);
    expect(taken.body.data).toMatchObject({ state: 'taken', mine: true, takenBy: { id: valet.id } });
    expect((await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(valet.token))).status).toBe(200);
    const refused = await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(other.token));
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('run_taken');
    expect((await api().post(`/api/internal/valet/runs/${id}/arrival/release`).set(auth(other.token))).status).toBe(403);
    // A manager may give it back.
    const released = await api().post(`/api/internal/valet/runs/${id}/arrival/release`).set(auth(op.token));
    expect(released.body.data).toMatchObject({ state: 'todo', takenBy: null });

    // Done without taking it first: the run becomes this valet's, the car is « Sur place ».
    const done = await api().post(`/api/internal/valet/runs/${id}/arrival/done`).set(auth(other.token));
    expect(done.status).toBe(200);
    expect(done.body.data).toMatchObject({ state: 'done', status: 'arrived', takenBy: { id: other.id } });
    expect((await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(valet.token))).body.code).toBe('run_closed');

    // The departure run: soon on the list once the return comes near, done → Rendu.
    await prisma.reservation.update({ where: { id }, data: { returnAt: hoursFromNow(2) } });
    const after = await api().get('/api/internal/valet/runs').set(auth(valet.token));
    expect(after.body.runs.map((r: { kind: string; state: string }) => `${r.kind}:${r.state}`)).toEqual(['departure:todo', 'arrival:done']);
    const back = await api().post(`/api/internal/valet/runs/${id}/departure/done`).set(auth(valet.token)).send({ note: 'RAS' });
    expect(back.body.data).toMatchObject({ state: 'done', status: 'returned' });
    const history = await prisma.auditLog.findMany({ where: { entityId: id }, select: { action: true } });
    expect(history.map(h => h.action)).toEqual(expect.arrayContaining(['reservation.valet_run_taken', 'reservation.valet_run_released']));
  });

  it('refuse une réservation navette et une réservation d’un autre loueur', async () => {
    const { op, id } = await setup();
    const shuttle = await api().post('/api/internal/reservations').set(auth(op.token)).send(booking());
    expect(shuttle.body.data.handover).toBe('shuttle');
    const res = await api().post(`/api/internal/valet/runs/${shuttle.body.data.id}/arrival/take`).set(auth(op.token));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('not_valet');
    const stranger = await setupOperator('Autre');
    expect((await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(stranger.token))).status).toBe(404);
  });

  it('une réservation voiturier n’est jamais sur les listes de la navette et ne part pas en navette', async () => {
    const { op, id } = await setup();
    const driver = await addStaff(op.token, 'driver');
    const departures = await api().get('/api/internal/shuttle/departures').set(auth(driver.token));
    expect(departures.body.rows.map((r: { reservationId: string }) => r.reservationId)).not.toContain(id);
    await prisma.reservation.update({ where: { id }, data: { status: 'arrived', arrivedAt: new Date(), returnAt: hoursFromNow(1) } });
    const pickups = await api().get('/api/internal/shuttle/pickups').set(auth(driver.token));
    expect(pickups.body.rows.map((r: { reservationId: string }) => r.reservationId)).not.toContain(id);
    const trip = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(driver.token))
      .send({ reservationIds: [id] });
    expect(trip.status).toBe(422);
    const detail = await api().get(`/api/internal/reservations/${id}`).set(auth(op.token));
    expect(detail.body.handover).toBe('valet');
    expect(detail.body.nextStatuses).not.toContain('shuttled_out');
  });

  it('repasser en navette efface les courses ; le point de rendez-vous se règle sur le parking', async () => {
    const { op, id } = await setup();
    await api().post(`/api/internal/valet/runs/${id}/arrival/take`).set(auth(op.token));
    const patched = await api().patch(`/api/internal/reservations/${id}`).set(auth(op.token)).send({ handover: 'shuttle' });
    expect(patched.status).toBe(200);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id } });
    expect(stored).toMatchObject({ handover: 'shuttle', valetArrivalById: null, valetArrivalTakenAt: null });
    expect((await api().patch(`/api/internal/reservations/${id}`).set(auth(op.token)).send({ handover: 'bike' })).body.fields).toMatchObject({
      handover: 'invalid_handover',
    });

    const set = await api()
      .patch(`/api/internal/parkings/${op.parking.id}`)
      .set(auth(op.token))
      .send({ name: 'Parking LYS', totalCapacity: 200, safetyMarginPct: 0, shuttleTravelMinutes: 8, valetMeetingPoint: 'Terminal 1 · Porte 4' });
    expect(set.status).toBe(200);
    await api().patch(`/api/internal/reservations/${id}`).set(auth(op.token)).send({ handover: 'valet' });
    expect((await api().get('/api/internal/valet/runs').set(auth(op.token))).body.meetingPoint).toBe('Terminal 1 · Porte 4');
  });

  it('« Course à prendre » : une fois par course, une demi-heure avant de partir', async () => {
    const { op, id } = await setup();
    await prisma.reservation.update({ where: { id }, data: { arrivalAt: hoursFromNow(0.5) } });
    const valets = Container.get(ValetService);
    expect(await valets.announceDue()).toBe(1);
    expect(await valets.announceDue()).toBe(0);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id } })).valetArrivalNotifiedAt).not.toBeNull();
    // A run taken is never announced.
    const later = await api()
      .post('/api/internal/reservations')
      .set(auth(op.token))
      .send(booking({ handover: 'valet', plate: 'ab123cd' }));
    await prisma.reservation.update({ where: { id: later.body.data.id }, data: { arrivalAt: hoursFromNow(0.5) } });
    await api().post(`/api/internal/valet/runs/${later.body.data.id}/arrival/take`).set(auth(op.token));
    expect(await valets.announceDue()).toBe(0);
  });
});
