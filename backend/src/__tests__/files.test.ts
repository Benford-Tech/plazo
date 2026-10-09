import prisma from '@/database';
import { localDate, addDays } from '@/domain/time';
import { api, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = () => localDate(new Date(), 'Europe/Paris');
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
const files = [
  {
    code: 'F01',
    capacity: 3,
    geometry: [
      [5.08, 45.72],
      [5.0801, 45.72],
    ],
  },
  {
    code: 'F02',
    capacity: 3,
    geometry: [
      [5.08, 45.7201],
      [5.0801, 45.7201],
    ],
  },
  { code: 'F03', capacity: 2 },
];

describe('files (S-C, 07/10/2026)', () => {
  it('saves the files of the plan, refuses a duplicate code and keeps a file that holds cars', async () => {
    const { token, parking } = await setupOperator();
    const put = await api().put(`/api/internal/parkings/${parking.id}/files`).set(auth(token)).send({ files });
    expect(put.status).toBe(200);
    expect(put.body.data.map((f: { code: string }) => f.code)).toEqual(['F01', 'F02', 'F03']);
    const dup = await api()
      .put(`/api/internal/parkings/${parking.id}/files`)
      .set(auth(token))
      .send({
        files: [
          { code: 'f01', capacity: 2 },
          { code: 'F01', capacity: 2 },
        ],
      });
    expect(dup.status).toBe(400);
    expect(dup.body.code).toBe('duplicate_code');
    // Put a car in F01, then try to drop it.
    const r = (await api().post('/api/internal/reservations').set(auth(token)).send(booking('GK-318-PX', today()))).body.data;
    const f01 = put.body.data[0];
    await api().post(`/api/internal/reservations/${r.id}/file`).set(auth(token)).send({ fileId: f01.id, keyHook: '4' });
    const drop = await api()
      .put(`/api/internal/parkings/${parking.id}/files`)
      .set(auth(token))
      .send({ files: [put.body.data[1]] });
    expect(drop.status).toBe(409);
    expect(drop.body.code).toBe('file_occupied');
    // Renaming and swapping codes works in one save.
    const swap = await api()
      .put(`/api/internal/parkings/${parking.id}/files`)
      .set(auth(token))
      .send({ files: [{ ...put.body.data[0], code: 'F02' }, { ...put.body.data[1], code: 'F01' }, put.body.data[2]] });
    expect(swap.status).toBe(200);
    expect(swap.body.data.map((f: { id: string; code: string }) => [f.id === f01.id, f.code])).toEqual([
      [true, 'F02'],
      [false, 'F01'],
      [false, 'F03'],
    ]);
  });

  it('places each arrival in the file whose front car leaves just after it, and counts the moves', async () => {
    const { token, parking } = await setupOperator();
    const saved = (await api().put(`/api/internal/parkings/${parking.id}/files`).set(auth(token)).send({ files })).body.data;
    const d = (n: number) => addDays(today(), n);
    const long = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking('AA-111-AA', d(10)))
    ).body.data;
    const mid = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking('BB-222-BB', d(5)))
    ).body.data;
    const short = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking('CC-333-CC', d(2)))
    ).body.data;

    // The first car opens a file; the board suggests the next ones behind it only if they leave earlier.
    const place = (id: string, fileId: string, keyHook?: string) =>
      api().post(`/api/internal/reservations/${id}/file`).set(auth(token)).send({ fileId, keyHook });
    expect((await place(long.id, saved[0].id, '1')).body.data).toMatchObject({
      status: 'arrived',
      fileRank: 1,
      filePosition: 1,
      file: { code: 'F01' },
    });

    let board = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    expect(board.status).toBe(200);
    expect(board.body.stats).toMatchObject({ files: 3, capacity: 8, cars: 1, onSite: 1, movesToday: 0, unsound: 0 });
    expect(board.body.arrivals).toHaveLength(2);
    const midRow = board.body.arrivals.find((a: { id: string }) => a.id === mid.id);
    expect(midRow.suggested).toMatchObject({ code: 'F01', reason: 'tight_fit', moves: 0, cars: 1, capacity: 3 });
    const shortRow = board.body.arrivals.find((a: { id: string }) => a.id === short.id);
    // The mid car is counted in F01 already: the short one still fits behind it.
    expect(shortRow.suggested).toMatchObject({ code: 'F01', moves: 0, cars: 2 });

    // Put the short stay first (the valet did not follow): the mid car now costs a move in F01.
    await place(short.id, saved[0].id);
    board = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    const midAgain = board.body.arrivals.find((a: { id: string }) => a.id === mid.id);
    expect(midAgain.suggested.code).toBe('F02');
    expect(midAgain.suggested.reason).toBe('empty');
    expect(midAgain.choices.find((c: { code: string }) => c.code === 'F01')).toMatchObject({ reason: 'moves', moves: 1 });
    const f01 = board.body.files.find((f: { code: string }) => f.code === 'F01');
    expect(f01.sound).toBe(true);
    expect(f01.cars.map((c: { plate: string; position: number }) => [c.plate, c.position])).toEqual([
      ['CC-333-CC', 1],
      ['AA-111-AA', 2],
    ]);

    // Force the mid car into F01 anyway: the file is no longer sound and the short car's return is blocked.
    await place(mid.id, saved[0].id);
    board = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    const unsound = board.body.files.find((f: { code: string }) => f.code === 'F01');
    expect(unsound.sound).toBe(false);
    expect(unsound.cars[1].blockedBy.map((b: { plate: string }) => b.plate)).toEqual(['BB-222-BB']);
    expect(board.body.stats.unsound).toBe(1);
    // Full: a fourth car is refused.
    const extra = (
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking('DD-444-DD', d(1)))
    ).body.data;
    const full = await place(extra.id, saved[0].id);
    expect(full.status).toBe(409);
    expect(full.body.code).toBe('file_full');

    // The sheet says where the car stands; handing the car back frees the file.
    const sheet = await api().get(`/api/internal/reservations/${short.id}`).set(auth(token));
    expect(sheet.body).toMatchObject({ file: { code: 'F01' }, filePosition: 2 });
    for (const status of ['shuttled_out', 'return_requested', 'back_at_parking', 'returned'])
      await api().post(`/api/internal/reservations/${short.id}/status`).set(auth(token)).send({ status });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: short.id } });
    expect(after.fileId).toBeNull();
    expect(after.fileRank).toBeNull();
    const choices = await api().get(`/api/internal/parkings/${parking.id}/files/choices?reservationId=${extra.id}`).set(auth(token));
    expect(choices.body.choices[0]).toMatchObject({ code: 'F01', moves: 0 });
  });

  it('the night preparation keeps empty files for the busiest return days (cron and on demand)', async () => {
    const { token, parking } = await setupOperator();
    const many = Array.from({ length: 6 }, (_, i) => ({ code: `F0${i + 1}`, capacity: 2 }));
    await api().put(`/api/internal/parkings/${parking.id}/files`).set(auth(token)).send({ files: many });
    const busy = addDays(today(), 3);
    for (let i = 0; i < 4; i++)
      await api()
        .post('/api/internal/reservations')
        .set(auth(token))
        .send(booking(`BU-00${i}-SY`, busy, { arrivalAt: `${addDays(today(), 1)}T08:00` }));
    await api()
      .post('/api/internal/reservations')
      .set(auth(token))
      .send(booking('QU-000-ET', addDays(today(), 6), { arrivalAt: `${addDays(today(), 1)}T08:00` }));

    // An archived operator (09/10/2026) is out of the crons: its files are not prepared.
    const archived = await setupOperator('Archivé');
    await api()
      .put(`/api/internal/parkings/${archived.parking.id}/files`)
      .set(auth(archived.token))
      .send({ files: [{ code: 'F01', capacity: 2 }] });
    await prisma.operator.update({
      where: { id: archived.operator.id },
      data: { status: 'suspended', suspendedAt: new Date(), archivedAt: new Date() },
    });

    const cron = await api().get('/api/internal/cron/prepare-files').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(cron.status).toBe(200);
    expect(cron.body).toEqual({ parkings: 1, planned: 3 });
    const board = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    expect(board.body.files.map((f: { code: string; plannedDay: string | null }) => [f.code, f.plannedDay])).toEqual([
      ['F01', busy],
      ['F02', busy],
      ['F03', addDays(today(), 6)],
      ['F04', null],
      ['F05', null],
      ['F06', null],
    ]);
    // A car of the busy day arriving goes to a file kept for it; the file then takes its role from the car.
    const r = (await api().post('/api/internal/reservations').set(auth(token)).send(booking('ZZ-999-ZZ', busy))).body.data;
    const b2 = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    const row = b2.body.arrivals.find((a: { id: string }) => a.id === r.id);
    expect(row.suggested).toMatchObject({ code: 'F01', reason: 'planned_day' });
    await api().post(`/api/internal/reservations/${r.id}/file`).set(auth(token)).send({ fileId: row.suggested.fileId });
    const b3 = await api().get(`/api/internal/parkings/${parking.id}/files`).set(auth(token));
    expect(b3.body.files[0]).toMatchObject({ code: 'F01', plannedDay: null, day: busy });
    const prepared = await api().post(`/api/internal/parkings/${parking.id}/files/prepare`).set(auth(token));
    expect(prepared.body.data).toEqual({ planned: 3, free: 2 });
  });

  it('builds the files from the valet lanes of the plan', async () => {
    const { token, parking } = await setupOperator();
    const square = (lon: number, lat: number, d = 0.00003): [number, number][] => [
      [lon, lat],
      [lon + d, lat],
      [lon + d, lat + d],
      [lon, lat + d],
      [lon, lat],
    ];
    // Two lanes of three spots heading north from the aisle.
    const spots = [0, 1].flatMap(lane =>
      [0, 1, 2].map(depth => ({
        zoneId: 'z1',
        code: `A-0${lane + 1}-0${depth + 1}`,
        row: lane + 1,
        index: depth + 1,
        depth,
        fileLength: 3,
        geometry: square(5.08 + lane * 0.00004, 45.72 + depth * 0.00005),
      })),
    );
    await api().put(`/api/internal/parkings/${parking.id}/plan/spots`).set(auth(token)).send({ layout: 'valetEdge', spots });
    const built = await api().post(`/api/internal/parkings/${parking.id}/files/from-plan`).set(auth(token));
    expect(built.status).toBe(200);
    expect(built.body.data.map((f: { code: string; capacity: number }) => [f.code, f.capacity])).toEqual([
      ['F01', 3],
      ['F02', 3],
    ]);
    expect(built.body.data[0].geometry[0][1]).toBeCloseTo(45.72 + 0.000015, 5);
    const none = await setupOperator('Sans plan');
    const empty = await api().post(`/api/internal/parkings/${none.parking.id}/files/from-plan`).set(auth(none.token));
    expect(empty.status).toBe(409);
    expect(empty.body.code).toBe('no_valet_spots');
  });
});
