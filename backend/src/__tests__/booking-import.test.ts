import prisma from '@/database';
import {
  dateOrderOf,
  importedChannel,
  importedHandover,
  importedPhone,
  parseImportDate,
  parseImportPrice,
  parseImportTime,
  readImportRow,
} from '@/domain/booking-import';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// Import of old (and upcoming) bookings from a file, previewed before they are created (28/10/2026, direction A).
// Every traveller is fictional.

const TZ = 'Europe/Paris';
const NOW = new Date('2026-10-28T10:00:00Z');
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const IMPORT = '/api/internal/reservations/import';

describe('reading a row', () => {
  it('reads the dates French files give', () => {
    expect(parseImportDate('03/09/2025')).toEqual({ y: 2025, m: 9, d: 3 });
    expect(parseImportDate('3/9/25 7h30')).toEqual({ y: 2025, m: 9, d: 3, time: '07:30' });
    expect(parseImportDate('2025-09-03T07:30:00.000Z')).toEqual({ y: 2025, m: 9, d: 3, time: '07:30' });
    expect(parseImportDate('03.09.2025 à 21:15')).toEqual({ y: 2025, m: 9, d: 3, time: '21:15' });
    expect(parseImportDate('mer. 3 sept. 2025')).toEqual({ y: 2025, m: 9, d: 3 });
    expect(parseImportDate('45903.3125')).toEqual({ y: 2025, m: 9, d: 3, time: '07:30' });
    expect(parseImportDate('31/02/2025')).toBeNull();
    expect(parseImportDate('demain')).toBeNull();
    expect(parseImportTime('0.875')).toBe('21:00');
    expect(parseImportTime('25:00')).toBeNull();
  });

  it('reads an American export month first, and only when its dates say so', () => {
    // 29/10/2026: a file in month/day order (« 11/20/2026 ») read « 12/10/2026 » as 12 October.
    expect(dateOrderOf(['12/10/2026', '11/20/2026', '4/10/2026'])).toBe('mdy');
    expect(dateOrderOf(['12/10/2026', '20/11/2026'])).toBe('dmy');
    expect(dateOrderOf(['03/09/2025', '04/09/2025'])).toBe('dmy');
    expect(dateOrderOf(['2026-11-20', '22-Aug', undefined])).toBe('dmy');
    expect(parseImportDate('12/10/2026', 'mdy')).toEqual({ y: 2026, m: 12, d: 10 });
    expect(parseImportDate('11/20/2026 13h', 'mdy')).toEqual({ y: 2026, m: 11, d: 20, time: '13:00' });
    expect(parseImportDate('2026-11-20', 'mdy')).toEqual({ y: 2026, m: 11, d: 20 });
  });

  it('reads prices, phones and channels', () => {
    expect(parseImportPrice('54,00 €')).toBe(5400);
    expect(parseImportPrice('1 234,5')).toBe(123450);
    expect(parseImportPrice('1.234,50')).toBe(123450);
    expect(parseImportPrice('')).toBeNull();
    expect(parseImportPrice('gratuit')).toBe('invalid');
    expect(importedPhone('612345678')).toBe('0612345678');
    expect(importedPhone('06 12 34 56 78')).toBe('0612345678');
    expect(importedChannel('allopark.com')).toEqual({ channel: 'aggregator', channelDetail: 'Allopark' });
    expect(importedChannel('Tél')).toEqual({ channel: 'phone', channelDetail: null });
    expect(importedChannel('')).toEqual({ channel: 'import', channelDetail: null });
    expect(importedChannel('Zenpark')).toEqual({ channel: 'aggregator', channelDetail: 'Zenpark' });
  });

  it('reads the service and keeps a commission only for a comparator', () => {
    expect(importedHandover('')).toBe('shuttle');
    expect(importedHandover('Parking navette')).toBe('shuttle');
    expect(importedHandover('Voiturier')).toBe('valet');
    expect(importedHandover('Lavage')).toBeNull();
    const row = (channel: string, commission: string, handover = '') =>
      readImportRow({ line: 2, name: 'Claire Martin', arrivalDate: '12/11/2026', returnDate: '19/11/2026', channel, commission, handover }, TZ, NOW);
    const allopark = row('Allopark', '9,72 €', 'Voiturier');
    expect(allopark.booking).toMatchObject({ commissionOverrideCents: 972, handover: 'valet' });
    expect(row('', '5,00').booking?.commissionOverrideCents).toBe(500);
    expect(row('Téléphone', '5,00').booking?.commissionOverrideCents).toBeNull();
    const unreadable = row('Allopark', 'beaucoup', 'Lavage');
    expect(unreadable.booking).toMatchObject({ commissionOverrideCents: null, handover: 'shuttle' });
    expect(unreadable.warnings).toEqual(expect.arrayContaining(['handover_unreadable', 'commission_unreadable']));
  });

  it('gives each stay its status from the dates, unless the file says it', () => {
    const row = (arrivalDate: string, returnDate: string, status = '') =>
      readImportRow({ line: 2, name: 'Claire Martin', arrivalDate, returnDate, status }, TZ, NOW).booking?.status;
    expect(row('03/09/2025', '10/09/2025')).toBe('returned');
    expect(row('25/10/2026', '30/10/2026')).toBe('arrived');
    expect(row('12/11/2026', '19/11/2026')).toBe('upcoming');
    expect(row('03/09/2025', '10/09/2025', 'Annulée')).toBe('cancelled');
    expect(row('03/09/2025', '10/09/2025', 'Non venu')).toBe('no_show');
  });

  it('puts the default hours on a date without time and refuses impossible stays', () => {
    const ok = readImportRow({ line: 2, name: 'Claire Martin', arrivalDate: '12/11/2026', returnDate: '19/11/2026' }, TZ, NOW);
    expect(ok.booking?.arrivalAt.toISOString()).toBe('2026-11-12T07:00:00.000Z');
    expect(ok.booking?.returnAt.toISOString()).toBe('2026-11-19T17:00:00.000Z');
    expect(ok.warnings).toEqual(['no_phone']);
    const bad = readImportRow({ line: 3, arrivalDate: '15/09/2025', returnDate: '12/09/2025' }, TZ, NOW);
    expect(bad.errors).toEqual(['name_missing', 'return_before_arrival']);
    expect(readImportRow({ line: 4, name: 'X Y', arrivalDate: 'bientôt', returnDate: '' }, TZ, NOW).errors).toEqual([
      'arrival_invalid',
      'return_missing',
    ]);
  });
});

describe('POST /internal/reservations/import', () => {
  let op: Awaited<ReturnType<typeof setupOperator>>;

  beforeEach(async () => {
    await resetDatabase();
    op = await setupOperator('Import');
  });

  const rows = () => [
    {
      line: 2,
      name: 'Claire Martin',
      phone: '0612345678',
      plate: 'AB-123-CD',
      arrivalDate: '03/09/2025 07:30',
      returnDate: '10/09/2025 21:15',
      channel: 'Allopark',
      price: '54,00',
      commission: '9,72',
      handover: 'Voiturier',
      payment: 'Prépayé',
      reference: 'al-884880719',
    },
    {
      line: 3,
      name: 'Karim Benali',
      phone: '0698765432',
      plate: 'fg456hj',
      arrivalDate: '12/11/2030',
      arrivalTime: '06:00',
      returnDate: '19/11/2030',
      returnTime: '18:40',
      channel: 'tel',
    },
    { line: 4, name: 'Claire Martin', plate: 'AB-123-CD', arrivalDate: '03/09/2025', returnDate: '10/09/2025' },
    { line: 5, name: 'Paul Durand', arrivalDate: '15/09/2025', returnDate: '12/09/2025' },
  ];

  it('previews without writing, then imports without any message', async () => {
    const preview = await api().post(IMPORT).set(auth(op.token)).send({ rows: rows(), fileName: 'planning.csv' });
    expect(preview.status).toBe(200);
    expect(preview.body.dryRun).toBe(true);
    expect(preview.body.counts).toEqual({ create: 2, check: 0, duplicate: 1, error: 1 });
    expect(preview.body.rows[2]).toMatchObject({ outcome: 'duplicate', duplicateOf: { reference: null, line: 2 } });
    expect(preview.body.rows[3]).toMatchObject({ outcome: 'error', errors: ['return_before_arrival'] });
    expect(preview.body.rows[0].booking).toMatchObject({
      status: 'returned',
      channel: 'aggregator',
      channelDetail: 'Allopark',
      priceCents: 5400,
      externalReference: 'AL-884880719',
    });
    expect(await prisma.reservation.count()).toBe(0);

    const fetchSpy = jest.spyOn(global, 'fetch');
    const done = await api().post(IMPORT).set(auth(op.token)).send({ rows: rows(), fileName: 'planning.csv', dryRun: false });
    expect(done.status).toBe(200);
    expect(done.body.import.created).toBe(2);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();

    const created = await prisma.reservation.findMany({ orderBy: { arrivalAt: 'asc' } });
    expect(created.map(r => [r.customerName, r.status, r.channel, r.plate])).toEqual([
      ['Claire Martin', 'returned', 'aggregator', 'AB-123-CD'],
      ['Karim Benali', 'upcoming', 'phone', 'FG-456-HJ'],
    ]);
    expect(created[0]).toMatchObject({ commissionOverrideCents: 972, commissionOverrideBp: null, handover: 'valet', paymentMethod: 'comparator' });
    expect(created[1]).toMatchObject({ commissionOverrideCents: null, handover: 'shuttle' });
    expect(created[0].createdAt.toISOString()).toBe(created[0].arrivalAt.toISOString());
    expect(created[0].closingSentAt).not.toBeNull();
    expect(created[1].reminderExcludedAt).not.toBeNull();
    expect(created.every(r => r.importId === done.body.import.id)).toBe(true);

    // The same file again: everything is already in Plazo.
    const again = await api().post(IMPORT).set(auth(op.token)).send({ rows: rows() });
    expect(again.body.counts).toEqual({ create: 0, check: 0, duplicate: 3, error: 1 });
    expect(again.body.rows[0].duplicateOf.reference).toBe(created[0].reference);
  });

  it('flags a row whose night is already full, and imports it', async () => {
    await prisma.parking.updateMany({ where: { operatorId: op.operator.id }, data: { totalCapacity: 1, safetyMarginPct: 0 } });
    const two = [
      { line: 2, name: 'Anne Petit', plate: 'AA-111-AA', phone: '0611111111', arrivalDate: '12/11/2030', returnDate: '14/11/2030' },
      { line: 3, name: 'Marc Leroy', plate: 'BB-222-BB', phone: '0622222222', arrivalDate: '13/11/2030', returnDate: '15/11/2030' },
    ];
    const res = await api().post(IMPORT).set(auth(op.token)).send({ rows: two, dryRun: false });
    expect(res.body.rows.map((r: { outcome: string }) => r.outcome)).toEqual(['create', 'check']);
    expect(res.body.rows[1].warnings).toEqual(['full_night']);
    const marc = await prisma.reservation.findFirstOrThrow({ where: { customerName: 'Marc Leroy' } });
    expect(marc.overbooked).toBe(true);
  });

  it('removes an import at any time, keeping the bookings touched since', async () => {
    const done = await api().post(IMPORT).set(auth(op.token)).send({ rows: rows(), fileName: 'planning.csv', dryRun: false });
    const karim = await prisma.reservation.findFirstOrThrow({ where: { customerName: 'Karim Benali' } });
    const edit = await api().patch(`/api/internal/reservations/${karim.id}`).set(auth(op.token)).send({ passengers: 3 });
    expect(edit.status).toBe(200);
    // Each booking says the file it came from.
    const detail = await api().get(`/api/internal/reservations/${karim.id}`).set(auth(op.token));
    expect(detail.body.import).toMatchObject({ id: done.body.import.id, fileName: 'planning.csv', undoneAt: null });

    // 29/10/2026: no more 24-hour limit.
    await prisma.reservationImport.update({ where: { id: done.body.import.id }, data: { createdAt: new Date(Date.now() - 40 * 86400_000) } });
    const list = await api().get('/api/internal/reservations/imports').set(auth(op.token));
    expect(list.body.data[0]).toMatchObject({ id: done.body.import.id, createdCount: 2, undoable: true });

    const undo = await api().post(`/api/internal/reservations/imports/${done.body.import.id}/undo`).set(auth(op.token));
    expect(undo.body).toEqual({ removed: 1, kept: 1 });
    expect(await prisma.reservation.count()).toBe(1);
    const twice = await api().post(`/api/internal/reservations/imports/${done.body.import.id}/undo`).set(auth(op.token));
    expect(twice.status).toBe(409);
    expect(twice.body.code).toBe('already_undone');
    const after = await api().get('/api/internal/reservations/imports').set(auth(op.token));
    expect(after.body.data[0]).toMatchObject({ undoable: false, removedCount: 1 });
  });

  it('finds an imported booking by its name without accents, in any order, or by its comparator number', async () => {
    const accented = [
      { line: 2, name: 'Gwénaël Le Bihan', phone: '0611223344', arrivalDate: '12/11/2030', returnDate: '19/11/2030', reference: 'AL-1234' },
    ];
    await api().post(IMPORT).set(auth(op.token)).send({ rows: accented, dryRun: false });
    const search = async (q: string) =>
      (
        await api()
          .get(`/api/internal/reservations?q=${encodeURIComponent(q)}`)
          .set(auth(op.token))
      ).body.docs.map((r: { customerName: string }) => r.customerName);
    expect(await search('GWENAEL')).toEqual(['Gwénaël Le Bihan']);
    expect(await search('bihan gwenael')).toEqual(['Gwénaël Le Bihan']);
    expect(await search('al-1234')).toEqual(['Gwénaël Le Bihan']);
    expect(await search('Durand')).toEqual([]);
  });

  it('is for managers only, and their own imports', async () => {
    const other = await setupOperator('Autre');
    const done = await api().post(IMPORT).set(auth(op.token)).send({ rows: rows(), dryRun: false });
    const foreign = await api().post(`/api/internal/reservations/imports/${done.body.import.id}/undo`).set(auth(other.token));
    expect(foreign.status).toBe(404);
    const agent = await addStaff(op.token, 'agent');
    expect((await api().post(IMPORT).set(auth(agent.token)).send({ rows: rows() })).status).toBe(403);
    const empty = await api().post(IMPORT).set(auth(op.token)).send({ rows: [] });
    expect(empty.status).toBe(400);
  });
});
