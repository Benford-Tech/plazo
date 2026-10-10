import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
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

describe('prix modifiable après l’import d’un mail (10/10/2026)', () => {
  const patch = (token: string, id: string, body: Record<string, unknown>) =>
    api().patch(`/api/internal/reservations/${id}`).set(auth(token)).send(body);

  it('change, efface et trace le prix ; refuse un montant invalide ; un autre champ ne le touche pas', async () => {
    const { token } = await setupOperator();
    const created = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking({ channel: 'aggregator', channelDetail: 'Allopark', priceCents: 2600 }));
    expect(created.body.data.priceCents).toBe(2600);
    const id = created.body.data.id;

    const changed = await patch(token, id, { priceCents: 3150 });
    expect(changed.status).toBe(200);
    expect(changed.body.data.priceCents).toBe(3150);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'reservation.updated', entityId: id }, orderBy: { createdAt: 'desc' } });
    expect(audit.details).toMatchObject({ priceCents: { from: 2600, to: 3150 } });

    expect((await patch(token, id, { passengers: 2 })).body.data.priceCents).toBe(3150);
    expect((await patch(token, id, { priceCents: null })).body.data.priceCents).toBeNull();
    for (const [priceCents, code] of [
      [-1, 'min_0'],
      [12.5, 'integer'],
      ['abc', 'integer'],
      [10000001, 'too_large'],
    ] as const) {
      const bad = await patch(token, id, { priceCents });
      expect(bad.status).toBe(400);
      expect(bad.body.fields).toEqual({ priceCents: code });
    }
  });

  it('« Compléter » garde à part le montant lu dans le mail (référence du comparateur seulement)', async () => {
    const { token } = await setupOperator();
    const create = (body: Record<string, unknown>) =>
      api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking({ channel: 'aggregator', ...body }));
    const corrected = await create({ plate: 'AA-001-AA', externalReference: 'al-1', priceCents: 2600, importedPriceCents: 3150 });
    expect(corrected.body.data).toMatchObject({ externalReference: 'AL-1', priceCents: 2600, importedPriceCents: 3150 });
    expect((await create({ plate: 'AA-002-AA', externalReference: 'AL-2', priceCents: 2600 })).body.data.importedPriceCents).toBe(2600);
    expect((await create({ plate: 'AA-003-AA', priceCents: 2600, importedPriceCents: 3150 })).body.data.importedPriceCents).toBeNull();
    // Staff changes leave the comparator's amount alone.
    const changed = await api().patch(`/api/internal/reservations/${corrected.body.data.id}`).set(auth(token)).send({ priceCents: 2800 });
    expect(changed.body.data).toMatchObject({ priceCents: 2800, importedPriceCents: 3150 });
  });

  it('jamais celui d’une réservation payée sur Plazo (un prix inchangé passe)', async () => {
    const { token } = await setupOperator();
    const created = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking({ priceCents: 4500 }))
    ).body.data;
    await prisma.reservation.update({ where: { id: created.id }, data: { channel: 'plazo' } });
    const locked = await patch(token, created.id, { priceCents: 1000 });
    expect(locked.status).toBe(400);
    expect(locked.body.fields).toEqual({ priceCents: 'price_locked' });
    const same = await patch(token, created.id, { priceCents: 4500, passengers: 1 });
    expect(same.status).toBe(200);
    expect(same.body.data).toMatchObject({ priceCents: 4500, passengers: 1 });
    // The revenue page's route says the same.
    const put = await api().put(`/api/internal/reservations/${created.id}/price`).set(auth(token)).send({ priceCents: 1000 });
    expect(put.body.fields).toEqual({ priceCents: 'price_locked' });
  });

  it('après le séjour, le prix se corrige encore par « Modifier le prix » (PUT …/price), pas par la fiche', async () => {
    const { token } = await setupOperator();
    const created = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking({ channel: 'aggregator', priceCents: 2600 }))
    ).body.data;
    await prisma.reservation.update({ where: { id: created.id }, data: { status: 'returned' } });
    expect((await patch(token, created.id, { priceCents: 2900 })).body.code).toBe('reservation_closed');
    const put = await api().put(`/api/internal/reservations/${created.id}/price`).set(auth(token)).send({ priceCents: 2900 });
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ priceCents: 2900 });
  });
});

describe('liste dans l’ordre chronologique (10/10/2026)', () => {
  const day = (offset: number) => addDays(localDate(new Date(), 'Europe/Paris'), offset);
  const list = (token: string, query = '') => api().get(`/api/internal/reservations?limit=2${query}`).set(auth(token));
  const plates = (res: { body: { docs: { plate: string }[] } }) => res.body.docs.map(r => r.plate);

  it('par arrivée, la page 1 commence aujourd’hui, les pages d’avant remontent le temps', async () => {
    const { token } = await setupOperator();
    expect((await list(token)).body).toMatchObject({ docs: [], page: 1, pageNumber: 1, totalPages: 1, hasPrevPage: false, hasNextPage: false });
    // Created out of order; « hier 23:30 » is before today in the parking's day, « aujourd'hui 00:30 » is today.
    const stays: [string, number, string][] = [
      ['AA-002-AA', 1, '08:00'],
      ['AA-000-AA', -5, '10:00'],
      ['AA-003-AA', 0, '00:30'],
      ['AA-005-AA', 2, '08:00'],
      ['AA-001-AA', -3, '10:00'],
      ['AA-004-AA', -1, '23:30'],
    ];
    for (const [plate, offset, time] of stays) {
      const res = await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking({ plate, arrivalAt: `${day(offset)}T${time}`, returnAt: `${day(offset + 3)}T10:00`, returnFlight: '' }));
      expect(res.status).toBe(201);
    }
    const first = await list(token);
    expect(plates(first)).toEqual(['AA-003-AA', 'AA-002-AA']);
    expect(first.body).toMatchObject({ totalDocs: 6, page: 1, pageNumber: 3, totalPages: 4, hasPrevPage: true, hasNextPage: true });
    const next = await list(token, '&page=2');
    expect(plates(next)).toEqual(['AA-005-AA']);
    expect(next.body).toMatchObject({ page: 2, pageNumber: 4, hasNextPage: false });
    const earlier = await list(token, '&page=0');
    expect(plates(earlier)).toEqual(['AA-001-AA', 'AA-004-AA']);
    expect(earlier.body).toMatchObject({ page: 0, pageNumber: 2, hasPrevPage: true, hasNextPage: true });
    const earliest = await list(token, '&page=-1');
    expect(plates(earliest)).toEqual(['AA-000-AA']);
    expect(earliest.body).toMatchObject({ page: -1, pageNumber: 1, hasPrevPage: false });
    // Out of range: the nearest page.
    expect((await list(token, '&page=-7')).body.page).toBe(-1);
    expect((await list(token, '&page=9')).body.page).toBe(2);
    // A search lists every match from the earliest.
    const search = await list(token, '&q=laurent');
    expect(plates(search)).toEqual(['AA-000-AA', 'AA-001-AA']);
    expect(search.body).toMatchObject({ page: 1, pageNumber: 1, totalPages: 3, hasPrevPage: false, hasNextPage: true });
    expect(plates(await list(token, '&q=laurent&page=3'))).toEqual(['AA-002-AA', 'AA-005-AA']);
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
