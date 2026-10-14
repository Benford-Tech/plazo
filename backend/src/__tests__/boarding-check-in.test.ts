import prisma from '@/database';
import { BOARDING_CHECK_IN_HOURS, canBoard, checksInAtBoarding } from '@/domain/shuttle';
import { localDate } from '@/domain/time';
import { PASSWORD, api, login, resetDatabase, runTodayAt, setupOperator } from './utils/helpers';

/**
 * « Embarquer en un geste » (14/10/2026): the driver boards the travellers still expected; they are checked in when the
 * drop-off starts, and the valet sees « Pointé à l'embarquement par Karim » next to the car to put away.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600000);
const today = () => localDate(new Date(), 'Europe/Paris');

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  jest.useRealTimers();
});
afterAll(() => prisma.$disconnect());

/** A driver called Karim, logged in. */
async function addDriver(managerToken: string, firstName = 'Karim') {
  const email = `${firstName.toLowerCase()}${Date.now()}@example.com`;
  const res = await api()
    .post('/api/internal/staff')
    .set(auth(managerToken))
    .send({ firstName, lastName: 'Chauffeur', email, role: 'driver', password: PASSWORD });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  return { id: res.body.data.id as string, token: (await login(email)).tokenData.access.token };
}

/** A booking typed by the desk, then moved to the given status and arrival. */
async function booking(token: string, plate: string, data: { status?: 'upcoming' | 'arrived' | 'cancelled'; arrivalAt: Date; passengers?: number }) {
  const created = await api()
    .post('/api/internal/reservations')
    .set(auth(token))
    .send({
      channel: 'phone',
      arrivalAt: `${today()}T06:30`,
      returnAt: `${today()}T23:00`,
      passengers: data.passengers ?? 1,
      customerFirstName: 'Vincent',
      customerLastName: `Blanc ${plate}`,
      customerPhone: '06 12 34 56 78',
      plate,
    });
  if (created.status !== 201) throw new Error(JSON.stringify(created.body));
  const status = data.status ?? 'upcoming';
  return prisma.reservation.update({
    where: { id: created.body.data.id },
    data: {
      status,
      arrivalAt: data.arrivalAt,
      returnAt: hoursFromNow(72),
      arrivedAt: status === 'arrived' ? hoursFromNow(-0.2) : null,
      cancelledAt: status === 'cancelled' ? new Date() : null,
    },
  });
}

/** An operator with a shuttle (8 seats) its driver Karim took for the day. */
async function setup(seats = 8) {
  const op = await setupOperator();
  const karim = await addDriver(op.token);
  const vito = (
    await api().post('/api/internal/shuttle/vehicles').set(auth(op.token)).send({ model: 'Vito', colour: 'blanc', plate: 'GH-456-JK', seats })
  ).body.data;
  const taken = await api().patch('/api/internal/staff/me/vehicle').set(auth(karim.token)).send({ vehicleId: vito.id });
  if (taken.status !== 200) throw new Error(JSON.stringify(taken.body));
  return { op, karim, vito };
}

const start = (token: string, reservationIds: string[], direction: 'pickup' | 'dropoff' = 'dropoff') =>
  api().post('/api/internal/shuttle/trips').set(auth(token)).send({ reservationIds, direction });

/** Runs `meanwhile` once the request's checks are made, just before its transaction (another request, the desk…). */
function beforeNextTransaction(meanwhile: () => Promise<unknown>) {
  const transaction = prisma.$transaction.bind(prisma);
  return jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (fn: any, options?: any) => {
    await meanwhile();
    return transaction(fn, options);
  });
}

describe('règles (domain/shuttle)', () => {
  it('un attendu monte dans une dépose à ±24 h de son arrivée ; la récupération ne change pas', () => {
    const now = new Date('2026-10-14T08:00:00Z');
    const at = (hours: number) => new Date(now.getTime() + hours * 3600000);
    expect(canBoard('dropoff', { status: 'upcoming', arrivalAt: at(2) }, now)).toBe(true);
    expect(canBoard('dropoff', { status: 'upcoming', arrivalAt: at(-BOARDING_CHECK_IN_HOURS) }, now)).toBe(true);
    expect(canBoard('dropoff', { status: 'upcoming', arrivalAt: at(BOARDING_CHECK_IN_HOURS + 0.1) }, now)).toBe(false);
    expect(canBoard('dropoff', { status: 'upcoming', arrivalAt: at(-30) }, now)).toBe(false);
    expect(canBoard('dropoff', { status: 'arrived', arrivalAt: at(-72) }, now)).toBe(true);
    for (const status of ['cancelled', 'no_show', 'shuttled_out', 'returned', 'pending_payment'] as const) {
      expect(canBoard('dropoff', { status, arrivalAt: at(0) }, now)).toBe(false);
    }
    expect(canBoard('pickup', { status: 'upcoming', arrivalAt: at(0) }, now)).toBe(false);
    expect(canBoard('pickup', { status: 'shuttled_out', arrivalAt: at(-72) }, now)).toBe(true);
    expect(checksInAtBoarding('dropoff', 'upcoming')).toBe(true);
    expect(checksInAtBoarding('dropoff', 'arrived')).toBe(false);
    expect(checksInAtBoarding('pickup', 'upcoming')).toBe(false);
  });
});

describe('embarquer en un geste (14/10/2026)', () => {
  it('pointe à l’embarquement l’attendu, avec le véhicule du jour, et le voiturier le voit dans « À ranger »', async () => {
    const { op, karim } = await setup();
    const here = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-0.5), passengers: 2 });
    const late = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(-3) });
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/files`)
      .set(auth(op.token))
      .send({ files: [{ code: 'F07', capacity: 3 }] });

    // A late traveller not checked in yet stays on the driver's list, selectable.
    const departures = await api().get('/api/internal/shuttle/departures').set(auth(karim.token));
    expect(departures.status).toBe(200);
    expect(departures.body.rows).toEqual([
      expect.objectContaining({ reservationId: here.id, expected: false, status: 'arrived', tripId: null }),
      expect.objectContaining({ reservationId: late.id, expected: true, status: 'upcoming', tripId: null }),
    ]);

    // « Embarquer et partir »: no vehicle sent, the one of the day; the expected traveller is checked in.
    const started = await start(karim.token, [here.id, late.id]);
    expect(started.status).toBe(201);
    const trip = started.body.trip;
    expect(trip).toMatchObject({ direction: 'dropoff', status: 'running', vehicle: { model: 'Vito', colour: 'blanc', plate: 'GH-456-JK' } });
    const passenger = (id: string) => trip.passengers.find((p: { reservationId: string }) => p.reservationId === id);
    expect(passenger(here.id)).toMatchObject({ checkedInAtBoarding: false, arrivedAt: here.arrivedAt!.toISOString() });
    expect(passenger(late.id)).toMatchObject({ checkedInAtBoarding: true, arrivedAt: expect.any(String) });
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: late.id } });
    expect(stored).toMatchObject({ status: 'arrived', boardingTripId: trip.id });
    expect(stored.arrivedAt!.toISOString()).toBe(passenger(late.id).arrivedAt);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: here.id } })).boardingTripId).toBeNull();
    const history = await prisma.auditLog.findMany({ where: { entityId: late.id, action: 'reservation.status_changed' } });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ staffId: karim.id, details: { from: 'upcoming', to: 'arrived', via: 'boarding', tripId: trip.id } });
    expect(await prisma.auditLog.count({ where: { entityId: trip.id, action: 'shuttle.trip_started' } })).toBe(1);
    expect((await api().get('/api/internal/shuttle/trips/current').set(auth(karim.token))).body.trip.passengers).toEqual(trip.passengers);

    // « Pointé à l'embarquement par Karim »: the sheet, the arrivals to place (spots and files) and the dashboard.
    const checkIn = { driverFirstName: 'Karim', at: passenger(late.id).arrivedAt };
    const sheet = await api().get(`/api/internal/reservations/${late.id}`).set(auth(op.token));
    expect(sheet.body.boardingCheckIn).toEqual(checkIn);
    expect(sheet.body).not.toHaveProperty('boardingTrip');
    expect((await api().get(`/api/internal/reservations/${here.id}`).set(auth(op.token))).body.boardingCheckIn).toBeNull();
    const occupation = await api().get(`/api/internal/parkings/${op.parking.id}/occupation`).set(auth(op.token));
    expect(occupation.status).toBe(200);
    const arrival = (rows: { id: string }[], id: string) => rows.find(r => r.id === id) as Record<string, unknown> | undefined;
    expect(arrival(occupation.body.arrivals, late.id)).toMatchObject({ status: 'arrived', boardingCheckIn: checkIn });
    expect(arrival(occupation.body.arrivals, late.id)).not.toHaveProperty('boardingTrip');
    expect(arrival(occupation.body.arrivals, here.id)).toMatchObject({ boardingCheckIn: null });
    const files = await api().get(`/api/internal/parkings/${op.parking.id}/files`).set(auth(op.token));
    expect(files.status).toBe(200);
    expect(arrival(files.body.arrivals, late.id)).toMatchObject({ onSite: true, boardingCheckIn: checkIn });
    expect(arrival(files.body.arrivals, here.id)).toMatchObject({ boardingCheckIn: null });
    const dashboard = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dashboard.status).toBe(200);
    expect(arrival(dashboard.body.vehicles, late.id)).toMatchObject({ spotCode: null, boardingCheckIn: checkIn });

    // « Terminer ce trajet »: both leave in the shuttle, as before; the check-in stays told.
    const ended = await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(karim.token));
    expect(ended.status).toBe(200);
    const after = await prisma.reservation.findMany({ where: { id: { in: [here.id, late.id] } }, orderBy: { plate: 'asc' } });
    expect(after.map(r => r.status)).toEqual(['shuttled_out', 'shuttled_out']);
    expect((await api().get(`/api/internal/reservations/${late.id}`).set(auth(op.token))).body.boardingCheckIn).toEqual(checkIn);
  });

  it('le nom manque quand le compte du chauffeur a été effacé', async () => {
    const { op, karim } = await setup();
    const late = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(1) });
    expect((await start(karim.token, [late.id])).status).toBe(201);
    await prisma.staff.update({ where: { id: karim.id }, data: { firstName: '', lastName: '', name: 'Compte supprimé' } });
    const sheet = await api().get(`/api/internal/reservations/${late.id}`).set(auth(op.token));
    expect(sheet.body.boardingCheckIn).toEqual({ driverFirstName: null, at: expect.any(String) });
  });

  it('refuse un attendu trop loin, un annulé ou déjà parti, et ne pointe personne', async () => {
    const { op, karim } = await setup();
    const here = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-0.5) });
    const tomorrow = await booking(op.token, 'KL-204-BA', { arrivalAt: hoursFromNow(30) });
    const cancelled = await booking(op.token, 'AZ-902-LC', { status: 'cancelled', arrivalAt: hoursFromNow(1) });
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(1) });

    for (const ids of [
      [soon.id, tomorrow.id],
      [soon.id, cancelled.id],
    ]) {
      const refused = await start(karim.token, ids);
      expect(refused.status).toBe(422);
      expect(refused.body.code).toBe('invalid_passengers');
    }
    // Already gone to the terminal: refused too.
    await prisma.reservation.update({ where: { id: here.id }, data: { status: 'shuttled_out' } });
    expect((await start(karim.token, [soon.id, here.id])).body.code).toBe('invalid_passengers');
    expect(await prisma.shuttleTrip.count()).toBe(0);
    const rows = await prisma.reservation.findMany({ where: { id: { in: [soon.id, tomorrow.id] } } });
    expect(rows.map(r => [r.status, r.arrivedAt, r.boardingTripId])).toEqual([
      ['upcoming', null, null],
      ['upcoming', null, null],
    ]);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.status_changed' } })).toBe(0);
  });

  it('trop de passagers pour le véhicule du jour : l’attendu reste attendu', async () => {
    const { op, karim } = await setup(2);
    const here = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-0.5), passengers: 2 });
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5), passengers: 1 });
    const refused = await start(karim.token, [here.id, soon.id]);
    expect(refused.status).toBe(422);
    expect(refused.body).toMatchObject({ code: 'too_many_passengers', details: { seats: 2, passengers: 3 } });
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({
      status: 'upcoming',
      arrivedAt: null,
      boardingTripId: null,
    });
    expect(await prisma.shuttleTrip.count()).toBe(0);
  });

  it('un passager annulé pendant le départ défait tout : ni trajet, ni pointage', async () => {
    const { op, karim } = await setup();
    const here = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-0.5) });
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    const transaction = prisma.$transaction.bind(prisma);
    // The desk cancels the arrived traveller after the checks, just before the trip is written.
    const spy = jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (fn: any, options?: any) => {
      await prisma.reservation.update({ where: { id: here.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
      return transaction(fn, options);
    });
    try {
      const refused = await start(karim.token, [here.id, soon.id]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(refused.status).toBe(422);
      expect(refused.body.code).toBe('invalid_passengers');
    } finally {
      spy.mockRestore();
    }
    expect(await prisma.shuttleTrip.count()).toBe(0);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({
      status: 'upcoming',
      arrivedAt: null,
      boardingTripId: null,
    });
    expect(await prisma.auditLog.count({ where: { action: { in: ['reservation.status_changed', 'shuttle.trip_started'] } } })).toBe(0);
  });

  it('remis « Attendu », le client n’est plus pointé à l’embarquement', async () => {
    const { op, karim } = await setup();
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    const trip = (await start(karim.token, [soon.id])).body.trip;
    await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(karim.token));
    // Back from "Parti en navette" to "Sur place": still checked in at the boarding.
    expect((await api().post(`/api/internal/reservations/${soon.id}/status`).set(auth(op.token)).send({ status: 'arrived' })).status).toBe(200);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).boardingTripId).toBe(trip.id);
    // Then "Attendu": the check-in is undone.
    const back = await api().post(`/api/internal/reservations/${soon.id}/status`).set(auth(op.token)).send({ status: 'upcoming' });
    expect(back.status).toBe(200);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({
      status: 'upcoming',
      arrivedAt: null,
      boardingTripId: null,
    });
    expect((await api().get(`/api/internal/reservations/${soon.id}`).set(auth(op.token))).body.boardingCheckIn).toBeNull();
  });

  it('la récupération au retour ne change pas : pas d’attendu, personne pointé', async () => {
    const { op, karim } = await setup();
    const away = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-48) });
    await prisma.reservation.update({ where: { id: away.id }, data: { status: 'shuttled_out', returnAt: hoursFromNow(1) } });
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    expect((await start(karim.token, [soon.id], 'pickup')).body.code).toBe('invalid_passengers');
    const started = await start(karim.token, [away.id], 'pickup');
    expect(started.status).toBe(201);
    expect(started.body.trip.passengers).toEqual([expect.objectContaining({ reservationId: away.id, checkedInAtBoarding: false })]);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({ status: 'upcoming', boardingTripId: null });
    await api().post(`/api/internal/shuttle/trips/${started.body.trip.id}/end`).set(auth(karim.token));
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: away.id } })).toMatchObject({ status: 'back_at_parking', boardingTripId: null });
  });

  it('liste un attendu en retard jusqu’à 6 h ; plus en retard, il ne l’est plus mais monte encore', async () => {
    runTodayAt('14:00');
    const { op, karim } = await setup();
    const late = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(-5.9) });
    const later = await booking(op.token, 'KL-204-BA', { arrivalAt: hoursFromNow(-7) });
    const departures = await api().get('/api/internal/shuttle/departures').set(auth(karim.token));
    expect(departures.body.rows.map((r: { reservationId: string }) => r.reservationId)).toEqual([late.id]);
    const started = await start(karim.token, [later.id]);
    expect(started.status).toBe(201);
    expect(started.body.trip.passengers).toEqual([expect.objectContaining({ reservationId: later.id, checkedInAtBoarding: true })]);
  });

  it('un client pointé par l’accueil pendant le départ monte sans être pointé à l’embarquement', async () => {
    const { op, karim } = await setup();
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    const spy = beforeNextTransaction(() =>
      prisma.reservation.update({ where: { id: soon.id }, data: { status: 'arrived', arrivedAt: hoursFromNow(-0.01) } }),
    );
    try {
      const started = await start(karim.token, [soon.id]);
      expect(started.status).toBe(201);
      expect(started.body.trip.passengers).toEqual([expect.objectContaining({ reservationId: soon.id, checkedInAtBoarding: false })]);
    } finally {
      spy.mockRestore();
    }
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({ status: 'arrived', boardingTripId: null });
    expect(await prisma.auditLog.count({ where: { entityId: soon.id, action: 'reservation.status_changed' } })).toBe(0);
  });

  it('deux départs au même moment avec le même client : le second est refusé', async () => {
    const { op, karim } = await setup();
    const samir = await addDriver(op.token, 'Samir');
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    // Another driver takes the same traveller after Karim's checks.
    let spy = beforeNextTransaction(() => start(samir.token, [soon.id]).expect(201));
    try {
      const refused = await start(karim.token, [soon.id]);
      expect(refused.status).toBe(409);
      expect(refused.body.code).toBe('already_on_trip');
    } finally {
      spy.mockRestore();
    }
    const trips = await prisma.shuttleTrip.findMany();
    expect(trips.map(t => t.driverId)).toEqual([samir.id]);
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({ status: 'arrived', boardingTripId: trips[0].id });
    expect(await prisma.auditLog.count({ where: { entityId: soon.id, action: 'reservation.status_changed' } })).toBe(1);

    // A double tap: the second start finds the first one running.
    const next = await booking(op.token, 'KL-204-BA', { arrivalAt: hoursFromNow(0.5) });
    spy = beforeNextTransaction(() => start(karim.token, [next.id]).expect(201));
    try {
      const refused = await start(karim.token, [next.id]);
      expect(refused.status).toBe(409);
      expect(refused.body.code).toBe('trip_already_running');
    } finally {
      spy.mockRestore();
    }
    expect(await prisma.shuttleTrip.count({ where: { driverId: karim.id } })).toBe(1);
  });

  it('l’accueil ne peut plus annuler un client pointé à l’embarquement entre-temps', async () => {
    const { op, karim } = await setup();
    const soon = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(0.5) });
    // The desk opened the sheet while it was « Attendu »; the driver boards the traveller before the cancel is written.
    const spy = beforeNextTransaction(() => start(karim.token, [soon.id]).expect(201));
    try {
      const refused = await api().post(`/api/internal/reservations/${soon.id}/status`).set(auth(op.token)).send({ status: 'cancelled' });
      expect(refused.status).toBe(400);
      expect(refused.body.code).toBe('invalid_transition');
    } finally {
      spy.mockRestore();
    }
    expect(await prisma.reservation.findUniqueOrThrow({ where: { id: soon.id } })).toMatchObject({
      status: 'arrived',
      cancelledAt: null,
      boardingTripId: expect.any(String),
    });
    const history = await prisma.auditLog.findMany({ where: { entityId: soon.id, action: 'reservation.status_changed' } });
    expect(history.map(h => (h.details as { to: string }).to)).toEqual(['arrived']);
  });

  it('pointé avant minuit pour une arrivée du lendemain : la voiture est dans « À ranger » ce soir', async () => {
    runTodayAt('22:30');
    const { op, karim } = await setup();
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/files`)
      .set(auth(op.token))
      .send({ files: [{ code: 'F07', capacity: 3 }] });
    const early = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(6) });
    expect(localDate(early.arrivalAt, 'Europe/Paris')).not.toBe(today());
    const started = await start(karim.token, [early.id]);
    expect(started.status).toBe(201);
    const checkIn = { driverFirstName: 'Karim', at: started.body.trip.passengers[0].arrivedAt };
    const arrival = (rows: { id: string }[]) => rows.find(r => r.id === early.id);
    const occupation = await api().get(`/api/internal/parkings/${op.parking.id}/occupation`).set(auth(op.token));
    expect(arrival(occupation.body.arrivals)).toMatchObject({ status: 'arrived', boardingCheckIn: checkIn });
    const files = await api().get(`/api/internal/parkings/${op.parking.id}/files`).set(auth(op.token));
    expect(arrival(files.body.arrivals)).toMatchObject({ onSite: true, boardingCheckIn: checkIn });
  });

  it('le tableau de bord garde la voiture pointée à l’embarquement « à placer » après la dépose', async () => {
    runTodayAt('10:00');
    const { op, karim } = await setup();
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/files`)
      .set(auth(op.token))
      .send({ files: [{ code: 'F07', capacity: 3 }] });
    const here = await booking(op.token, 'BN-655-RT', { status: 'arrived', arrivalAt: hoursFromNow(-1) });
    const late = await booking(op.token, 'DJ-150-MX', { arrivalAt: hoursFromNow(-3) });
    const trip = (await start(karim.token, [here.id, late.id])).body.trip;
    expect((await api().post(`/api/internal/shuttle/trips/${trip.id}/end`).set(auth(karim.token))).status).toBe(200);
    const dashboard = await api().get('/api/internal/dashboard').set(auth(op.token));
    expect(dashboard.status).toBe(200);
    const unplaced = dashboard.body.alerts
      .filter((a: { kind: string }) => a.kind === 'no_spot')
      .map((a: { reservationId: string }) => a.reservationId);
    // The boarded car stays to put away; one checked in at the desk keeps the former rule (« Sur place » only).
    expect(unplaced).toEqual([late.id]);
    expect(dashboard.body.breakdown.toPlaceToday).toBe(1);
  });
});
