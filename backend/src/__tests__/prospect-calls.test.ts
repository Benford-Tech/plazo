import prisma from '@/database';
import { readCall } from '@/domain/prospect-calls';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// Prospection › Appels (25/11/2026, « A · File d'appels »). Every parking and number is fictional.

const P = '/api/internal/platform/prospects';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;

async function create(overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post(P)
    .set(auth(admin.token))
    .send({ companyName: 'Parking Fictif', email: 'contact@parking-fictif.example', airportCode: 'LYS', phone: '04 72 00 00 08', ...overrides });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}
const call = (id: string, body: Record<string, unknown>, token = admin.token) => api().post(`${P}/${id}/calls`).set(auth(token)).send(body);
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  loueur = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterAll(() => prisma.$disconnect());

describe('readCall', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  it('asks for a known outcome, a short note and a future callback', () => {
    expect(readCall({ outcome: 'later' }, now)).toEqual({ ok: false, fields: { outcome: 'invalid' } });
    expect(readCall({ outcome: 'no_answer', note: 'x'.repeat(301) }, now)).toEqual({ ok: false, fields: { note: 'too_long' } });
    expect(readCall({ outcome: 'callback' }, now)).toEqual({ ok: false, fields: { callbackAt: 'required' } });
    expect(readCall({ outcome: 'callback', callbackAt: '2026-11-25T09:00:00Z' }, now)).toEqual({ ok: false, fields: { callbackAt: 'past' } });
    expect(readCall({ outcome: 'callback', callbackAt: '2028-01-01T09:00:00Z' }, now)).toEqual({ ok: false, fields: { callbackAt: 'too_far' } });
    expect(readCall({ outcome: 'voicemail', note: '  rappeler   lundi ', callbackAt: '2026-12-01T09:00:00Z' }, now)).toEqual({
      ok: true,
      value: { outcome: 'voicemail', note: 'rappeler lundi', callbackAt: null },
    });
  });
});

describe('Plateforme › Prospection : appels', () => {
  it('is for platform admins only', async () => {
    const p = await create();
    expect((await call(p.id, { outcome: 'no_answer' }, loueur.token)).status).toBe(403);
    expect((await api().get(`${P}/${p.id}/calls`).set(auth(loueur.token))).status).toBe(403);
  });

  it('counts the calls nobody answered and resets them when someone does', async () => {
    const p = await create();
    await call(p.id, { outcome: 'no_answer' });
    const second = await call(p.id, { outcome: 'voicemail', note: 'message laissé' });
    expect(second.status).toBe(200);
    expect(second.body.data.calls).toMatchObject({ count: 2, missed: 2, lastOutcome: 'voicemail', callbackAt: null, wrongNumber: false });
    expect(second.body.data.status).toBe('to_contact');

    const at = tomorrow();
    const third = await call(p.id, { outcome: 'callback', callbackAt: at, note: 'en congé' });
    expect(third.body.data.calls).toMatchObject({ count: 3, missed: 0, lastOutcome: 'callback', callbackAt: at });

    const history = await api().get(`${P}/${p.id}/calls`).set(auth(admin.token));
    expect(history.body.data.map((c: { outcome: string }) => c.outcome)).toEqual(['callback', 'voicemail', 'no_answer']);
    expect(history.body.data[0]).toMatchObject({ note: 'en congé', callbackAt: at, by: admin.manager.firstName });

    // The list carries the same summary, and the next call clears the callback.
    const listed = await api().get(P).set(auth(admin.token));
    expect(listed.body.data[0].calls.callbackAt).toBe(at);
    expect((await call(p.id, { outcome: 'no_answer' })).body.data.calls).toMatchObject({ callbackAt: null, missed: 1 });
  });

  it('marks the prospect on « Intéressé » and « Pas intéressé » and stops the follow-ups', async () => {
    const p = await create();
    await prisma.prospect.update({ where: { id: p.id }, data: { status: 'contacted', step: 1, nextSendAt: new Date(Date.now() + 3_600_000) } });
    const res = await call(p.id, { outcome: 'interested', note: 'veut une démo jeudi' });
    expect(res.body.data).toMatchObject({ status: 'interested', statusNote: 'veut une démo jeudi', nextSendAt: null });
    expect(res.body.data.stoppedAt).not.toBeNull();
    expect((await call(p.id, { outcome: 'not_interested' })).body.data.status).toBe('not_interested');
    const log = await prisma.auditLog.findMany({ where: { action: 'prospect.call_logged' } });
    expect(log).toHaveLength(2);
  });

  it('puts a wrong number aside until the number changes', async () => {
    const p = await create();
    expect((await call(p.id, { outcome: 'wrong_number' })).body.data.calls.wrongNumber).toBe(true);
    const fixed = await api().patch(`${P}/${p.id}`).set(auth(admin.token)).send({ companyName: 'Parking Fictif', phone: '04 72 00 00 09' });
    expect(fixed.status).toBe(200);
    expect(fixed.body.data.calls).toMatchObject({ wrongNumber: false, missed: 0 });
  });

  it('refuses a prospect without a number, an unsubscribed one and a bad result', async () => {
    const none = await create({ phone: null });
    expect((await call(none.id, { outcome: 'no_answer' })).body.code).toBe('no_phone');
    const out = await create({ companyName: 'Autre Parking', email: 'autre@parking-fictif.example' });
    await api().post(`${P}/${out.id}/status`).set(auth(admin.token)).send({ status: 'unsubscribed' });
    expect((await call(out.id, { outcome: 'no_answer' })).body.code).toBe('unsubscribed');
    const bad = await call(none.id, { outcome: 'callback' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ callbackAt: 'required' });
    expect((await call('missing', { outcome: 'no_answer' })).status).toBe(404);
  });
});
