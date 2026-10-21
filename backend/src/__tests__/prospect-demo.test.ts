import { Container } from 'typedi';
import prisma from '@/database';
import { nextDemoReset } from '@/domain/prospect-demo';
import { ProspectDemoService } from '@/services/prospect-demo.service';
import { SmsService } from '@/services/sms.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// Démo des prospects (21/10/2026, « mets un environnement de démo de l'app », choix A + B + C). Everything fictional.

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const demo = Container.get(ProspectDemoService);

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;

async function enter(role: string, token?: string) {
  return api()
    .post('/api/internal/auth/demo')
    .send({ role, ...(token ? { token } : {}) });
}

async function createProspect() {
  const res = await api().post('/api/internal/platform/prospects').set(auth(admin.token)).send({
    companyName: 'Parking Fictif',
    contactFirstName: 'Camille',
    contactLastName: 'Exemple',
    email: 'contact@parking-fictif.example',
    airportCode: 'LYS',
  });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
});

describe('entering the demo', () => {
  it('seeds the demo on the first entry and signs in each role', async () => {
    for (const role of ['manager', 'agent', 'driver', 'valet']) {
      const res = await enter(role);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe(role);
      expect(res.body.user.demo.resetsAt).toBe(nextDemoReset(new Date()).toISOString());
      expect(res.body.user.operatorName).toContain('(démo)');
    }
    expect(await prisma.operator.count({ where: { prospectDemo: true } })).toBe(1);
    const op = await prisma.operator.findFirstOrThrow({ where: { prospectDemo: true }, select: { id: true } });
    expect(await prisma.reservation.count({ where: { operatorId: op.id } })).toBeGreaterThan(0);
    // No public listing: the demo is never on the site.
    expect(await prisma.listing.count({ where: { parking: { operatorId: op.id } } })).toBe(0);
  });

  it('refuses an unknown role', async () => {
    const res = await enter('owner');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_role');
  });

  it('reads the demo but refuses the team, passwords and outside writes', async () => {
    const res = await enter('manager');
    const token = res.body.tokenData.access.token;
    expect(token).toBeTruthy();
    const me = await api().get('/api/internal/staff/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.demo).not.toBeNull();
    const list = await api().get('/api/internal/reservations').set(auth(token));
    expect(list.status).toBe(200);
    const add = await api()
      .post('/api/internal/staff')
      .set(auth(token))
      .send({ firstName: 'Nouveau', lastName: 'Membre', email: 'nouveau@exemple.example', role: 'agent', password: 'mot-de-passe-solide' });
    expect(add.status).toBe(403);
    expect(add.body.code).toBe('demo_read_only');
  });

  it('never sends an SMS for the demo operator', async () => {
    const { operatorId } = await demo.ensure();
    const sms = Container.get(SmsService);
    const result = await sms.sendTravellerSms(operatorId, { reservationId: null, kind: 'test', to: '+33639980001', text: 'Texte de test' });
    expect(result).toBe('skipped');
  });
});

describe('prospect links', () => {
  it('creates a 14-day link, counts its opens and lists it with the prospect', async () => {
    const id = await createProspect();
    const created = await api().post(`/api/internal/platform/prospects/${id}/demo-link`).set(auth(admin.token)).send({});
    expect(created.status).toBe(200);
    const link = created.body.data as { url: string; expiresAt: string; opens: number };
    expect(link.opens).toBe(0);
    const token = link.url.split('/').pop()!;
    expect(new Date(link.expiresAt).getTime() - Date.now()).toBeGreaterThan(13 * 86400000);

    // Kept while valid.
    const again = await api().post(`/api/internal/platform/prospects/${id}/demo-link`).set(auth(admin.token)).send({});
    expect(again.body.data.url).toBe(link.url);

    const status = await api().get(`/api/public/demo/links/${token}`);
    expect(status.status).toBe(200);
    expect(status.body.status).toBe('valid');

    expect((await enter('driver', token)).status).toBe(200);
    expect((await enter('valet', token)).status).toBe(200);

    const listed = await api().get('/api/internal/platform/prospects').set(auth(admin.token));
    const row = listed.body.data.find((p: { id: string }) => p.id === id);
    expect(row.demo.opens).toBe(2);
    expect(row.demo.lastOpenedAt).not.toBeNull();
  });

  it('refuses an unknown or expired link', async () => {
    expect((await enter('manager', 'Inconnu12345')).body.code).toBe('demo_link_unknown');
    const id = await createProspect();
    const created = await api().post(`/api/internal/platform/prospects/${id}/demo-link`).set(auth(admin.token)).send({});
    const token = (created.body.data.url as string).split('/').pop()!;
    await prisma.demoLink.update({ where: { token }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await enter('manager', token);
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('demo_link_expired');
    expect((await api().get(`/api/public/demo/links/${token}`)).body.status).toBe('expired');
  });

  it('is for platform admins only', async () => {
    const id = await createProspect();
    const other = await setupOperator('Loueur');
    const res = await api().post(`/api/internal/platform/prospects/${id}/demo-link`).set(auth(other.token)).send({});
    expect(res.status).toBe(403);
  });
});

describe('nightly reset', () => {
  it('wipes the demo and seeds a fresh one, revoking its sessions', async () => {
    const res = await enter('manager');
    const token = res.body.tokenData.access.token;
    const before = await prisma.operator.findFirstOrThrow({ where: { prospectDemo: true } });
    expect(await demo.reset()).toBe(true);
    const after = await prisma.operator.findFirstOrThrow({ where: { prospectDemo: true } });
    expect(after.id).not.toBe(before.id);
    expect((await api().get('/api/internal/staff/me').set(auth(token))).status).toBe(401);
    // Real operators are untouched.
    expect(await prisma.operator.count({ where: { prospectDemo: false } })).toBe(1);
  });
});
