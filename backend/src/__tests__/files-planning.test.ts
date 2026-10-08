import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
import { api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = () => localDate(new Date(), 'Europe/Paris');
const d = (n: number) => addDays(today(), n);
const booking = (plate: string, returnDay: string, overrides: Record<string, unknown> = {}) => ({
  channel: 'phone',
  arrivalAt: `${today()}T06:30`,
  returnAt: `${returnDay}T18:00`,
  passengers: 2,
  customerName: 'Mme Laurent',
  customerPhone: '06 12 34 56 78',
  plate,
  ...overrides,
});

type Saved = { id: string; code: string };
type PlanningFile = {
  code: string;
  active: boolean;
  cars: number;
  day: string | null;
  plannedDay: string | null;
  keptByHand: boolean;
  sound: boolean;
};

async function setup(files: { code: string; capacity: number }[]) {
  const { token, parking } = await setupOperator();
  const saved: Saved[] = (await api().put(`/api/internal/parkings/${parking.id}/files`).set(auth(token)).send({ files })).body.data;
  const book = async (plate: string, returnDay: string, overrides: Record<string, unknown> = {}) => {
    const res = await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking(plate, returnDay, overrides));
    if (res.status !== 201) throw new Error(`booking failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.data as { id: string };
  };
  const place = (reservationId: string, fileId: string) =>
    api().post(`/api/internal/reservations/${reservationId}/file`).set(auth(token)).send({ fileId });
  const planning = (query = '') => api().get(`/api/internal/parkings/${parking.id}/files/planning${query}`).set(auth(token));
  const keep = (fileId: string, body: object) => api().put(`/api/internal/parkings/${parking.id}/files/${fileId}/keep`).set(auth(token)).send(body);
  const byCode = (code: string) => saved.find(f => f.code === code) as Saved;
  return { token, parking, saved, book, place, planning, keep, byCode };
}

describe('planning des files (08/10/2026)', () => {
  it('gives the load of each day of the window: returns, placed, room of the files serving or kept', async () => {
    const t = await setup([
      { code: 'F01', capacity: 3 },
      { code: 'F02', capacity: 3 },
      { code: 'F03', capacity: 2 },
    ]);
    const a = await t.book('AA-111-AA', d(2));
    await t.book('BB-222-BB', d(2));
    await t.book('CC-333-CC', d(2));
    for (const plate of ['DD-444-DD', 'EE-555-EE', 'FF-666-FF']) await t.book(plate, d(4));
    expect((await t.place(a.id, t.byCode('F01').id)).status).toBe(200);

    const res = await t.planning('?days=5');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ from: today(), today: today(), days: 5, timezone: 'Europe/Paris', capacity: 8, alerts: [] });
    // The first read of the day runs the preparation: F02 is kept for the three returns of d+4.
    expect(res.body.files.map((f: PlanningFile) => [f.code, f.cars, f.day, f.plannedDay, f.keptByHand, f.sound])).toEqual([
      ['F01', 1, d(2), null, false, true],
      ['F02', 0, d(4), d(4), false, true],
      ['F03', 0, null, null, false, true],
    ]);
    expect(res.body.load).toHaveLength(5);
    expect(res.body.load[0]).toEqual({
      date: today(),
      returns: 0,
      placed: 0,
      toCome: 0,
      onSite: 6,
      filesServing: [],
      filesKept: [],
      room: 0,
      missing: 0,
    });
    expect(res.body.load[2]).toEqual({
      date: d(2),
      returns: 3,
      placed: 1,
      toCome: 2,
      onSite: 6,
      filesServing: ['F01'],
      filesKept: [],
      room: 2,
      missing: 0,
    });
    expect(res.body.load[3]).toMatchObject({ date: d(3), returns: 0, onSite: 3, filesServing: [], filesKept: [], room: 0 });
    expect(res.body.load[4]).toEqual({
      date: d(4),
      returns: 3,
      placed: 0,
      toCome: 3,
      onSite: 3,
      filesServing: [],
      filesKept: ['F02'],
      room: 3,
      missing: 0,
    });

    // The window: seven days by default, from any local day.
    const week = await t.planning();
    expect(week.body.days).toBe(7);
    expect(week.body.load).toHaveLength(7);
    const one = await t.planning(`?from=${d(2)}&days=1`);
    expect(one.body).toMatchObject({ from: d(2), today: today(), days: 1 });
    expect(one.body.load.map((l: { date: string }) => l.date)).toEqual([d(2)]);
    for (const bad of ['?days=0', '?days=32', '?days=abc', '?from=2026-1-1', '?from=2026-13-45']) {
      const r = await t.planning(bad);
      expect(r.status).toBe(400);
      expect(r.body.code).toBe('invalid_window');
    }
  });

  it('warns about a day short of room, a day over capacity and a file whose order is broken', async () => {
    const t = await setup([
      { code: 'F01', capacity: 2 },
      { code: 'F02', capacity: 2 },
      { code: 'F03', capacity: 2 },
      { code: 'F04', capacity: 2 },
    ]);
    const a = await t.book('AA-111-AA', d(2));
    const b = await t.book('BB-222-BB', d(5));
    // B enters F01 in front of A and leaves later: A is blocked.
    await t.place(a.id, t.byCode('F01').id);
    await t.place(b.id, t.byCode('F01').id);
    for (let i = 0; i < 6; i++) await t.book(`CC-00${i}-CC`, d(2));
    await t.book('II-999-II', d(3));

    const res = await t.planning('?days=6');
    expect(res.status).toBe(200);
    expect(res.body.capacity).toBe(8);
    const f01 = res.body.files.find((f: PlanningFile) => f.code === 'F01');
    expect(f01).toMatchObject({ cars: 2, day: d(5), sound: false });
    // Two of the three empty files are kept for d+2 (a third stays free): room for 4 of the 6 cars to come.
    expect(res.body.load[2]).toEqual({
      date: d(2),
      returns: 7,
      placed: 1,
      toCome: 6,
      onSite: 9,
      filesServing: [],
      filesKept: ['F02', 'F03'],
      room: 4,
      missing: 2,
    });
    // The car of d+3 has no file kept for it either (a third of the empty files stays free).
    expect(res.body.load[3]).toMatchObject({ date: d(3), returns: 1, toCome: 1, filesServing: [], filesKept: [], room: 0, missing: 1 });
    expect(res.body.load[5]).toMatchObject({ date: d(5), returns: 1, placed: 1, toCome: 0, filesServing: ['F01'], room: 0, missing: 0 });
    // Nine cars on site today and tomorrow, for eight slots in the files.
    expect(res.body.alerts).toEqual([
      { kind: 'over_capacity', date: today(), count: 1 },
      { kind: 'over_capacity', date: d(1), count: 1 },
      { kind: 'missing_room', date: d(2), count: 2 },
      { kind: 'over_capacity', date: d(2), count: 1 },
      { kind: 'missing_room', date: d(3), count: 1 },
      { kind: 'unsound', fileCode: 'F01', count: 1 },
    ]);
  });

  it('lists a closed file that still holds cars among the files serving its day, but counts no room in it', async () => {
    const t = await setup([
      { code: 'F01', capacity: 3 },
      { code: 'F02', capacity: 3 },
    ]);
    const a = await t.book('AA-111-AA', d(2));
    const b = await t.book('BB-222-BB', d(2));
    expect((await t.place(a.id, t.byCode('F01').id)).status).toBe(200);
    // F01 is closed while it holds A: PUT /files only refuses to delete an occupied file, not to close it.
    const closed = await api()
      .put(`/api/internal/parkings/${t.parking.id}/files`)
      .set(auth(t.token))
      .send({ files: [{ ...t.byCode('F01'), active: false }, t.byCode('F02')].map(f => ({ ...f, capacity: 3 })) });
    expect(closed.status).toBe(200);
    // Nothing enters a closed file any more: its two free slots are no room for B.
    const refused = await t.place(b.id, t.byCode('F01').id);
    expect(refused.status).toBe(400);
    expect(refused.body.code).toBe('file_inactive');

    const res = await t.planning('?days=3');
    expect(res.status).toBe(200);
    // The capacity is that of the active files; the preparation keeps F02 for no one (one car to come is not worth a file).
    expect(res.body.capacity).toBe(3);
    expect(res.body.files.map((f: PlanningFile) => [f.code, f.active, f.cars, f.day, f.plannedDay, f.sound])).toEqual([
      ['F01', false, 1, d(2), null, true],
      ['F02', true, 0, null, null, true],
    ]);
    // F01 is listed (the staff sees where A is) but offers no room: B has nowhere to go.
    expect(res.body.load[2]).toEqual({
      date: d(2),
      returns: 2,
      placed: 1,
      toCome: 1,
      onSite: 2,
      filesServing: ['F01'],
      filesKept: [],
      room: 0,
      missing: 1,
    });
    expect(res.body.alerts).toEqual([{ kind: 'missing_room', date: d(2), count: 1 }]);
  });

  it('keeps an empty file for a day by hand and frees it, refusing a bad day or a file that holds cars', async () => {
    const t = await setup([
      { code: 'F01', capacity: 3 },
      { code: 'F02', capacity: 3 },
      { code: 'F03', capacity: 2 },
    ]);
    const f02 = t.byCode('F02');
    const kept = await t.keep(f02.id, { day: d(3) });
    expect(kept.status).toBe(200);
    expect(kept.body.message).toBe('File kept');
    expect(kept.body.data).toMatchObject({ id: f02.id, plannedDay: d(3), keptByHand: true });

    const res = await t.planning();
    expect(res.body.files.find((f: PlanningFile) => f.code === 'F02')).toMatchObject({ plannedDay: d(3), keptByHand: true, day: d(3), cars: 0 });
    expect(res.body.load[3]).toMatchObject({ date: d(3), filesKept: ['F02'], room: 3 });
    const board = await api().get(`/api/internal/parkings/${t.parking.id}/files`).set(auth(t.token));
    expect(board.body.files.find((f: PlanningFile) => f.code === 'F02')).toMatchObject({ plannedDay: d(3), keptByHand: true });

    // The day: shape checked by the DTO, calendar and past checked by the service.
    const shape = await t.keep(f02.id, { day: 'nope' });
    expect(shape.status).toBe(400);
    expect(shape.body.fields).toEqual({ day: 'invalid_day' });
    expect((await t.keep(f02.id, {})).status).toBe(400);
    const calendar = await t.keep(f02.id, { day: '2026-13-45' });
    expect(calendar.status).toBe(400);
    expect(calendar.body.code).toBe('invalid_day');
    const past = await t.keep(f02.id, { day: d(-1) });
    expect(past.status).toBe(400);
    expect(past.body.code).toBe('invalid_day');
    const missing = await t.keep('nope', { day: d(3) });
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('file_not_found');

    // A file with cars has nothing to keep.
    const a = await t.book('AA-111-AA', d(2));
    await t.place(a.id, t.byCode('F01').id);
    const occupied = await t.keep(t.byCode('F01').id, { day: d(2) });
    expect(occupied.status).toBe(409);
    expect(occupied.body.code).toBe('file_occupied');
    // Nor a closed file.
    const f03 = t.byCode('F03');
    await api()
      .put(`/api/internal/parkings/${t.parking.id}/files`)
      .set(auth(t.token))
      .send({ files: [t.byCode('F01'), f02, { ...f03, active: false }].map(f => ({ ...f, capacity: 3 })) });
    const closed = await t.keep(f03.id, { day: d(3) });
    expect(closed.status).toBe(400);
    expect(closed.body.code).toBe('file_inactive');

    // Freed: back to the automatic pool.
    const freed = await t.keep(f02.id, { day: null });
    expect(freed.status).toBe(200);
    expect(freed.body.message).toBe('File freed');
    expect(freed.body.data).toMatchObject({ plannedDay: null, keptByHand: false });
    expect(await prisma.auditLog.count({ where: { action: 'parking.file_kept', entityId: t.parking.id } })).toBe(2);
  });

  it('the night preparation leaves a file kept by hand, until a car enters it or its day has passed', async () => {
    const t = await setup(Array.from({ length: 6 }, (_, i) => ({ code: `F0${i + 1}`, capacity: 2 })));
    const busy = d(3);
    const f05 = t.byCode('F05');
    expect((await t.keep(f05.id, { day: busy })).status).toBe(200);
    for (let i = 0; i < 4; i++) await t.book(`BU-00${i}-SY`, busy, { arrivalAt: `${d(1)}T08:00` });
    await t.book('QU-000-ET', d(6), { arrivalAt: `${d(1)}T08:00` });

    // F05 already holds two of the four cars of the busy day: the preparation keeps one more file, not two.
    const prepared = await api().post(`/api/internal/parkings/${t.parking.id}/files/prepare`).set(auth(t.token));
    expect(prepared.body.data).toEqual({ planned: 3, free: 3 });
    const files = async () =>
      ((await api().get(`/api/internal/parkings/${t.parking.id}/files`).set(auth(t.token))).body.files as PlanningFile[]).map(f => [
        f.code,
        f.plannedDay,
        f.keptByHand,
      ]);
    const expected = [
      ['F01', busy, false],
      ['F02', d(6), false],
      ['F03', null, false],
      ['F04', null, false],
      ['F05', busy, true],
      ['F06', null, false],
    ];
    expect(await files()).toEqual(expected);
    // The cron does the same.
    const cron = await api().get('/api/internal/cron/prepare-files').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(cron.body).toEqual({ parkings: 1, planned: 3 });
    expect(await files()).toEqual(expected);
    // The planning says which files are kept for the busy day.
    const planning = await t.planning();
    expect(planning.body.load[3]).toMatchObject({ date: busy, toCome: 4, filesKept: ['F01', 'F05'], room: 4, missing: 0 });

    // A car enters F05: the file takes its role from the car, by hand or not.
    const car = await t.book('ZZ-999-ZZ', busy);
    await t.place(car.id, f05.id);
    expect((await files()).find(f => f[0] === 'F05')).toEqual(['F05', null, false]);
    // A day kept by hand that has passed goes back to the automatic pool.
    await prisma.parkingFile.update({ where: { id: t.byCode('F06').id }, data: { plannedDay: d(-1), keptByHand: true } });
    await api().post(`/api/internal/parkings/${t.parking.id}/files/prepare`).set(auth(t.token));
    expect((await files()).find(f => f[0] === 'F06')).toEqual(['F06', null, false]);
  });
});
