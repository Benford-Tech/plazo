import prisma from '@/database';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/** 12/11/2026, « Archiver un contrat signé » (section 3 des maquettes) : rangé à part, rien n'est effacé. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function booking(token: string, arrivalAt: string, returnAt: string, plate: string) {
  const res = await api().post('/api/internal/reservations').set(auth(token)).send({
    channel: 'phone',
    arrivalAt,
    returnAt,
    passengers: 1,
    customerFirstName: 'Claire',
    customerLastName: 'Laurent',
    customerPhone: '06 12 34 56 78',
    plate,
  });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}

async function signed(reservationId: string) {
  return prisma.reservationContract.create({
    data: {
      reservationId,
      version: '2026-10-19',
      text: 'Contrat',
      textSha256: 'a'.repeat(64),
      signerName: 'Claire Laurent',
      method: 'handwritten',
      device: 'staff_device',
      proofSha256: 'b'.repeat(64),
      signedBlobKey: 'contracts/signed.pdf',
    },
  });
}

describe('archiver un contrat signé', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  it('archive, désarchive, compte et trace dans l’historique', async () => {
    const op = await setupOperator();
    const first = await booking(op.token, '2026-11-01T08:00', '2026-11-05T18:00', 'ab123cd');
    const second = await booking(op.token, '2026-11-02T08:00', '2026-11-20T18:00', 'ef456gh');
    const a = await signed(first);
    await signed(second);

    let list = await api().get('/api/internal/contracts').set(auth(op.token));
    expect(list.body).toMatchObject({ total: 2, signedCount: 2, archivedCount: 0 });
    expect(list.body.data[0]).toHaveProperty('id');

    const res = await api().post(`/api/internal/contracts/${a.id}/archive`).set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).toEqual(expect.any(String));
    // Idempotent: a second archive writes nothing more.
    expect((await api().post(`/api/internal/contracts/${a.id}/archive`).set(auth(op.token))).status).toBe(200);

    list = await api().get('/api/internal/contracts').set(auth(op.token));
    expect(list.body).toMatchObject({ total: 1, signedCount: 1, archivedCount: 1 });
    const archived = await api().get('/api/internal/contracts?archived=1').set(auth(op.token));
    expect(archived.body.total).toBe(1);
    expect(archived.body.data[0]).toMatchObject({ id: a.id, reservationId: first });

    // Nothing is erased: the files stay.
    const row = await prisma.reservationContract.findUniqueOrThrow({ where: { id: a.id } });
    expect(row.signedBlobKey).toBe('contracts/signed.pdf');
    expect(row.archivedById).toBe(op.manager.id);

    const back = await api().post(`/api/internal/contracts/${a.id}/unarchive`).set(auth(op.token));
    expect(back.body.archivedAt).toBeNull();
    expect((await api().get('/api/internal/contracts').set(auth(op.token))).body.total).toBe(2);

    const logs = await prisma.auditLog.findMany({ where: { entityType: 'reservation', entityId: first, action: { startsWith: 'contract.' } } });
    expect(logs.map(l => l.action).sort()).toEqual(['contract.archived', 'contract.unarchived']);
    const history = await api().get(`/api/internal/reservations/${first}/history`).set(auth(op.token));
    expect(history.body.data.map((e: { action: string }) => e.action)).toEqual(expect.arrayContaining(['contract.archived', 'contract.unarchived']));
  });

  it('refuse le contrat d’un autre loueur', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre');
    const contract = await signed(await booking(op.token, '2026-11-01T08:00', '2026-11-05T18:00', 'ab123cd'));
    const res = await api().post(`/api/internal/contracts/${contract.id}/archive`).set(auth(other.token));
    expect([res.status, res.body.code]).toEqual([404, 'not_found']);
    expect((await api().post('/api/internal/contracts/inconnu/unarchive').set(auth(op.token))).status).toBe(404);
  });

  it('archive d’un coup les séjours terminés avant un jour (heure du parking)', async () => {
    const op = await setupOperator();
    await signed(await booking(op.token, '2026-11-01T08:00', '2026-11-05T23:30', 'ab123cd'));
    await signed(await booking(op.token, '2026-11-02T08:00', '2026-11-06T00:30', 'ef456gh'));
    await signed(await booking(op.token, '2026-11-02T08:00', '2026-11-20T18:00', 'ij789kl'));

    expect((await api().post('/api/internal/contracts/archive-before').set(auth(op.token)).send({})).body.fields).toEqual({ before: 'required' });
    expect((await api().post('/api/internal/contracts/archive-before').set(auth(op.token)).send({ before: '2026-02-31' })).status).toBe(400);

    const res = await api().post('/api/internal/contracts/archive-before').set(auth(op.token)).send({ before: '2026-11-06' });
    expect(res.body).toEqual({ archived: 1 });
    const again = await api().post('/api/internal/contracts/archive-before').set(auth(op.token)).send({ before: '2026-11-07' });
    expect(again.body).toEqual({ archived: 1 });
    const list = await api().get('/api/internal/contracts').set(auth(op.token));
    expect(list.body).toMatchObject({ total: 1, archivedCount: 2 });
  });
});
