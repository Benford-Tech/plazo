import prisma from '@/database';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const booking = (overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: '2026-10-04T06:30',
  returnAt: '2026-10-07T15:05',
  passengers: 3,
  customerFirstName: 'Claire',
  customerLastName: 'Laurent',
  customerPhone: '06 12 34 56 78',
  plate: 'gk318px',
  returnFlight: 'to3627',
  ...overrides,
});

async function smallParking(capacity = 2) {
  const op = await setupOperator();
  await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: capacity, safetyMarginPct: 0 } });
  return op;
}

describe('création', () => {
  it('enregistre, normalise et trace', async () => {
    const { token, manager } = await setupOperator();
    const res = await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      plate: 'GK-318-PX',
      returnFlight: 'TO 3627',
      status: 'upcoming',
      arrivalAt: '2026-10-04T04:30:00.000Z',
      overbooked: false,
      createdById: manager.id,
    });
    expect(res.body.data.reference).toMatch(/^R/);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.created' } })).toBe(1);
  });

  it('valide les champs et l’ordre des dates', async () => {
    const { token } = await setupOperator();
    const bad = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ passengers: 0, customerPhone: 'abc', plate: '' }));
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toMatchObject({ passengers: 'passengers_range', customerPhone: 'invalid_phone', plate: 'invalid_plate' });
    const order = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ returnAt: '2026-10-03T10:00' }));
    expect(order.body.fields).toEqual({ returnAt: 'return_before_arrival' });
    const flight = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ returnFlight: 'xx' }));
    expect(flight.body.fields).toEqual({ returnFlight: 'invalid_flight' });
  });

  it('est interdite aux chauffeurs et voituriers', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    expect((await api().post('/api/internal/reservations').set(auth(driver.token)).send(booking())).status).toBe(403);
    expect((await api().get('/api/internal/planning').set(auth(driver.token))).status).toBe(200);
  });
});

describe('capacité par nuit', () => {
  it('refuse quand une nuit est pleine et indique laquelle', async () => {
    const { token } = await smallParking(2);
    await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ arrivalAt: '2026-10-06T08:00', returnAt: '2026-10-09T10:00' }));
    // 4 → 7 is full on the 6th only.
    const res = await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('overbooked');
    expect(res.body.details.nights.map((n: any) => n.date)).toEqual(['2026-10-06']);
    // The day of return does not hold a spot: a stay starting on the 7th fits.
    const after = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ arrivalAt: '2026-10-07T09:00', returnAt: '2026-10-08T09:00' }));
    expect(after.status).toBe(201);
  });

  it('un agent peut forcer : la réservation est marquée et tracée', async () => {
    const { token } = await smallParking(1);
    const agent = await addStaff(token, 'agent');
    await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    const forced = await api()
      .post('/api/internal/reservations')
      .set(auth(agent.token))
      .send(booking({ force: true }));
    expect(forced.status).toBe(201);
    expect(forced.body.data.overbooked).toBe(true);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.created_overbooked' } })).toBe(1);
    const planning = await api().get('/api/internal/planning?date=2026-10-04').set(auth(token));
    expect(planning.body.nights[0]).toMatchObject({ date: '2026-10-04', count: 2, bookable: 1, overbooked: true });
  });

  it('ne donne jamais la dernière place à deux demandes simultanées', async () => {
    const { token } = await smallParking(1);
    const results = await Promise.all([1, 2, 3].map(() => api().post('/api/internal/reservations').set(auth(token)).send(booking())));
    expect(results.map(r => r.status).sort()).toEqual([201, 409, 409]);
  });

  it('libère la place à l’annulation et revérifie à la réouverture', async () => {
    const { token } = await smallParking(1);
    const first = await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    await api().post(`/api/internal/reservations/${first.body.data.id}/status`).set(auth(token)).send({ status: 'cancelled' });
    expect((await api().post('/api/internal/reservations').set(auth(token)).send(booking())).status).toBe(201);
    const reopen = await api().post(`/api/internal/reservations/${first.body.data.id}/status`).set(auth(token)).send({ status: 'upcoming' });
    expect(reopen.status).toBe(409);
  });

  it('revérifie la capacité quand on change les dates, sans se compter soi-même', async () => {
    const { token } = await smallParking(1);
    const res = await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    const id = res.body.data.id;
    expect((await api().patch(`/api/internal/reservations/${id}`).set(auth(token)).send({ returnAt: '2026-10-08T10:00' })).status).toBe(200);
    await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ arrivalAt: '2026-10-09T08:00', returnAt: '2026-10-10T08:00' }));
    const clash = await api().patch(`/api/internal/reservations/${id}`).set(auth(token)).send({ returnAt: '2026-10-10T10:00' });
    expect(clash.status).toBe(409);
  });

  it('prévisualise la charge d’un séjour', async () => {
    const { token } = await smallParking(1);
    await api().post('/api/internal/reservations').set(auth(token)).send(booking());
    const res = await api().get('/api/internal/capacity?arrivalAt=2026-10-05T08:00&returnAt=2026-10-09T08:00').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.fullNights).toEqual(['2026-10-05', '2026-10-06']);
    expect(res.body.nights).toHaveLength(4);
    expect(res.body.canForce).toBe(true);
  });
});

describe('statuts', () => {
  it('suit le parcours et refuse les sauts', async () => {
    const { token } = await setupOperator();
    const driver = await addStaff(token, 'driver');
    const id = (await api().post('/api/internal/reservations').set(auth(token)).send(booking())).body.data.id;
    expect((await api().post(`/api/internal/reservations/${id}/status`).set(auth(driver.token)).send({ status: 'returned' })).body.code).toBe(
      'invalid_transition',
    );
    const arrived = await api().post(`/api/internal/reservations/${id}/status`).set(auth(driver.token)).send({ status: 'arrived' });
    expect(arrived.body.data.arrivedAt).toBeTruthy();
    for (const status of ['shuttled_out', 'return_requested', 'returned']) {
      expect((await api().post(`/api/internal/reservations/${id}/status`).set(auth(driver.token)).send({ status })).status).toBe(200);
    }
    const closed = await api().patch(`/api/internal/reservations/${id}`).set(auth(token)).send({ passengers: 2 });
    expect(closed.body.code).toBe('reservation_closed');
  });

  it('seuls agents et gérants annulent', async () => {
    const { token } = await setupOperator();
    const valet = await addStaff(token, 'valet');
    const id = (await api().post('/api/internal/reservations').set(auth(token)).send(booking())).body.data.id;
    expect((await api().post(`/api/internal/reservations/${id}/status`).set(auth(valet.token)).send({ status: 'cancelled' })).status).toBe(403);
  });
});

describe('planning et recherche', () => {
  it('range arrivées et retours selon la date locale', async () => {
    const { token } = await setupOperator();
    // 00:30 in Paris on the 5th is still the 4th in UTC: it must appear on the 5th.
    await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ arrivalAt: '2026-10-05T00:30', returnAt: '2026-10-08T10:00' }));
    await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ arrivalAt: '2026-10-01T10:00', returnAt: '2026-10-05T18:00', returnFlight: '' }));
    const res = await api().get('/api/internal/planning?date=2026-10-05').set(auth(token));
    expect(res.body.arrivals).toHaveLength(1);
    expect(res.body.returns).toHaveLength(1);
    expect(res.body.nights).toHaveLength(7);
    expect(res.body.stats).toMatchObject({ arrivals: 1, arrived: 0, returns: 1, returnsWithFlight: 0 });
  });

  it('retrouve par plaque, nom ou référence, chez soi seulement', async () => {
    const a = await setupOperator('A');
    const b = await setupOperator('B');
    const created = (await api().post('/api/internal/reservations').set(auth(a.token)).send(booking())).body.data;
    await api().post('/api/internal/reservations').set(auth(b.token)).send(booking());
    for (const q of ['gk 318', 'GK-318-PX', 'laurent', 'claire laurent', created.reference]) {
      const res = await api()
        .get(`/api/internal/reservations?q=${encodeURIComponent(q)}`)
        .set(auth(a.token));
      expect(res.body.totalDocs).toBe(1);
    }
    expect((await api().get(`/api/internal/reservations/${created.id}`).set(auth(b.token))).status).toBe(404);
    expect((await api().patch(`/api/internal/reservations/${created.id}`).set(auth(b.token)).send({ passengers: 1 })).status).toBe(404);
  });
});

describe('prénom et nom du voyageur (09/10/2026)', () => {
  const create = (token: string, body: Record<string, unknown>) => api().post('/api/internal/reservations').set(auth(token)).send(body);

  it('enregistre le prénom et le nom à part, le nom affiché « Prénom Nom » recalculé par le serveur', async () => {
    const { token } = await setupOperator();
    const res = await create(token, booking({ customerFirstName: '  Marie  Claire ', customerLastName: ' de  La Tour ' }));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      customerFirstName: 'Marie Claire',
      customerLastName: 'de La Tour',
      customerName: 'Marie Claire de La Tour',
    });
    // The sheet, the list and the planning carry the three.
    const sheet = await api().get(`/api/internal/reservations/${res.body.data.id}`).set(auth(token));
    expect(sheet.body).toMatchObject({ customerFirstName: 'Marie Claire', customerLastName: 'de La Tour', customerName: 'Marie Claire de La Tour' });
    const list = await api().get('/api/internal/reservations?q=tour').set(auth(token));
    expect(list.body.docs[0]).toMatchObject({ customerFirstName: 'Marie Claire', customerLastName: 'de La Tour' });
    const planning = await api().get('/api/internal/planning?date=2026-10-04').set(auth(token));
    expect(planning.body.arrivals[0]).toMatchObject({ customerFirstName: 'Marie Claire', customerLastName: 'de La Tour' });
  });

  it('exige les deux, sans espaces seuls, 60 caractères chacun', async () => {
    const { token } = await setupOperator();
    expect((await create(token, booking({ customerFirstName: undefined, customerLastName: undefined }))).body.fields).toMatchObject({
      customerFirstName: 'required',
      customerLastName: 'required',
    });
    expect((await create(token, booking({ customerFirstName: '   ' }))).body.fields).toEqual({ customerFirstName: 'required' });
    expect((await create(token, booking({ customerLastName: '' }))).body.fields).toEqual({ customerLastName: 'required' });
    expect((await create(token, booking({ customerLastName: 'L'.repeat(61) }))).body.fields).toEqual({ customerLastName: 'too_long' });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('accepte encore le seul customerName d’une ancienne version de l’app, coupé au premier espace', async () => {
    const { token } = await setupOperator();
    const legacy = booking({ customerFirstName: undefined, customerLastName: undefined, customerName: ' Jean   Dupont Martin ' });
    const res = await create(token, legacy);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ customerFirstName: 'Jean', customerLastName: 'Dupont Martin', customerName: 'Jean Dupont Martin' });
    const blank = await create(token, booking({ customerFirstName: undefined, customerLastName: undefined, customerName: '  ' }));
    expect(blank.body.fields).toEqual({ customerName: 'required' });
  });

  it('modifie le prénom ou le nom (fusionné avec l’autre), refuse un vide, découpe un ancien customerName ; tracé', async () => {
    const { token } = await setupOperator();
    const id = (await create(token, booking())).body.data.id;
    const patch = (body: Record<string, unknown>) => api().patch(`/api/internal/reservations/${id}`).set(auth(token)).send(body);

    const first = await patch({ customerFirstName: ' Clara ' });
    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({ customerFirstName: 'Clara', customerLastName: 'Laurent', customerName: 'Clara Laurent' });
    const both = await patch({ customerFirstName: 'Anne', customerLastName: 'Martin-Laurent' });
    expect(both.body.data).toMatchObject({ customerName: 'Anne Martin-Laurent' });

    expect((await patch({ customerLastName: '  ' })).body.fields).toEqual({ customerLastName: 'required' });
    expect((await patch({ customerFirstName: null })).body.fields).toEqual({ customerFirstName: 'required' });
    expect((await patch({ customerFirstName: 'A'.repeat(61) })).body.fields).toEqual({ customerFirstName: 'too_long' });

    const legacy = await patch({ customerName: 'Paul  Moreau' });
    expect(legacy.body.data).toMatchObject({ customerFirstName: 'Paul', customerLastName: 'Moreau', customerName: 'Paul Moreau' });
    // Other fields leave the name alone.
    expect((await patch({ passengers: 2 })).body.data).toMatchObject({ customerName: 'Paul Moreau', customerFirstName: 'Paul' });
    // An older app sends the unchanged display name back with each edit: the stored split stays.
    await patch({ customerFirstName: 'Marie Claire', customerLastName: 'Dupont' });
    expect((await patch({ customerName: 'Marie Claire Dupont', passengers: 3 })).body.data).toMatchObject({
      customerFirstName: 'Marie Claire',
      customerLastName: 'Dupont',
    });

    const audits = await prisma.auditLog.findMany({ where: { action: 'reservation.updated', entityId: id }, orderBy: { createdAt: 'asc' } });
    expect(audits[0].details).toMatchObject({
      customerFirstName: { from: 'Claire', to: 'Clara' },
      customerName: { from: 'Claire Laurent', to: 'Clara Laurent' },
    });
  });
});
