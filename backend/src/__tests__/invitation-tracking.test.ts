import { Container } from 'typedi';
import { SECRET_KEY } from '@/config';
import prisma from '@/database';
import { appPlatformOf, deviceOf, trackingIdOf, trackingKey, withOpenPixel } from '@/domain/invitation-tracking';
import { AccountTokenService } from '@/services/account-token.service';
import { addStaff, api, PASSWORD, resetDatabase, setupOperator } from './utils/helpers';

// 15/11/2026 (« traquer les ouvertures de mail d'invitation, par qui, sur quel support, s'ils téléchargent l'app »).

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Safari/605.1.15';

beforeEach(resetDatabase);
afterEach(() => delete process.env.PLATFORM_ADMIN_EMAILS);
afterAll(() => prisma.$disconnect());

describe('suivi des invitations : règles', () => {
  it('clé signée, appareil, appli et image', () => {
    const key = trackingKey('cabc1234567890', 'secret');
    expect(trackingIdOf(key, 'secret')).toBe('cabc1234567890');
    expect(trackingIdOf(key, 'autre')).toBeNull();
    expect(trackingIdOf('cabc1234567890.faux', 'secret')).toBeNull();
    expect(deviceOf(IPHONE)).toBe('iphone');
    expect(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
    expect(deviceOf(MAC)).toBe('computer');
    expect(deviceOf('Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)')).toBe('mail_proxy');
    expect(deviceOf(null)).toBeNull();
    expect(appPlatformOf('pro-ios', null)).toBe('ios');
    expect(appPlatformOf('pro-android', null)).toBe('android');
    expect(appPlatformOf(null, 'Dart/3.5 (dart:io)')).toBe('app');
    expect(appPlatformOf(null, MAC)).toBeNull();
    expect(withOpenPixel('<html><body>x</body></html>', 'https://p/o.gif')).toContain('<img src="https://p/o.gif" width="1" height="1"');
    expect(withOpenPixel('<p>x</p>', null)).toBe('<p>x</p>');
  });
});

describe('suivi des invitations : du mail à Plazo Pro', () => {
  it('ouverture, clic sur le store, page du mot de passe, mot de passe, puis connexion dans Plazo Pro', async () => {
    const op = await setupOperator();
    const member = await addStaff(op.token, 'driver');
    const row = await prisma.invitationTracking.findFirstOrThrow({ where: { staffId: member.id } });
    expect(row).toMatchObject({ kind: 'team', operatorId: op.operator.id, emailSent: false });
    const key = trackingKey(row.id, SECRET_KEY as string);

    const gif = await api().get(`/api/public/invitations/${key}/open.gif`).set('user-agent', IPHONE);
    expect(gif.status).toBe(200);
    expect(gif.headers['content-type']).toBe('image/gif');
    await api().get(`/api/public/invitations/${key}/open.gif`).set('user-agent', MAC);
    // A forged key still gets the image, records nothing.
    expect((await api().get(`/api/public/invitations/${row.id}.fausse-cle/open.gif`)).status).toBe(200);

    const go = await api().get(`/api/public/invitations/${key}/go/play`).set('user-agent', IPHONE);
    expect(go.status).toBe(302);
    expect(go.headers.location).toContain('play.google.com');
    expect((await api().get(`/api/public/invitations/${key}/go/ailleurs`)).status).toBe(404);

    const { token } = await Container.get(AccountTokenService).issue(member.id, 'invitation', 3600000);
    await api().post('/api/internal/auth/invitation').set('user-agent', IPHONE).send({ token });
    const accept = await api().post('/api/internal/auth/invitation/accept').set('user-agent', IPHONE).send({ token, password: PASSWORD });
    expect(accept.status).toBe(200);
    const login = await api()
      .post('/api/internal/auth/login')
      .set('x-plazo-client', 'pro-android')
      .set('user-agent', 'Dart/3.5 (dart:io)')
      .send({ email: member.email, password: PASSWORD });
    expect(login.status).toBe(200);

    const after = await prisma.invitationTracking.findUniqueOrThrow({ where: { id: row.id } });
    expect(after).toMatchObject({
      openCount: 2,
      openDevice: 'iphone',
      clickDevice: 'iphone',
      storeClick: 'play',
      appPlatform: 'android',
    });
    expect(after.passwordSetAt).toBeTruthy();
    // addStaff signed the member in on the web right after the invitation (no User-Agent in the tests).
    expect(after.webSignInAt).toBeTruthy();

    // Plateforme › Invitations: platform admins only.
    expect((await api().get('/api/internal/platform/invitations').set(auth(op.token))).status).toBe(403);
    process.env.PLATFORM_ADMIN_EMAILS = op.manager.email;
    const list = await api().get('/api/internal/platform/invitations').set(auth(op.token));
    expect(list.status).toBe(200);
    const item = list.body.data.find((i: any) => i.staff.id === member.id);
    expect(item).toMatchObject({ kind: 'team', sends: 1, opened: { count: 2, device: 'iphone' }, app: { platform: 'android' } });
    expect(list.body.counts.no_app).toBe(list.body.data.filter((i: any) => !i.app).length);
    const noApp = await api().get('/api/internal/platform/invitations?view=no_app').set(auth(op.token));
    expect(noApp.body.data.some((i: any) => i.staff.id === member.id)).toBe(false);
  });

  it('un renvoi crée un nouvel envoi, la liste garde le dernier', async () => {
    const op = await setupOperator();
    const member = await addStaff(op.token, 'agent');
    expect((await api().post(`/api/internal/staff/${member.id}/invite`).set(auth(op.token))).status).toBe(200);
    expect(await prisma.invitationTracking.count({ where: { staffId: member.id } })).toBe(2);
    process.env.PLATFORM_ADMIN_EMAILS = op.manager.email;
    const list = await api().get('/api/internal/platform/invitations').set(auth(op.token));
    expect(list.body.data.filter((i: any) => i.staff.id === member.id)).toEqual([expect.objectContaining({ sends: 2 })]);
  });

  // 17/11/2026 (« pouvoir reenvoyer une invitation »): Plateforme › Invitations « Renvoyer ».
  it("la plateforme renvoie l'invitation d'un membre ou d'un gérant invité, jamais à un compte fermé ni accepté", async () => {
    const op = await setupOperator();
    const member = await addStaff(op.token, 'driver');
    const resend = (id: string) => api().post(`/api/internal/platform/invitations/${id}/resend`).set(auth(op.token));
    expect((await resend(member.id)).status).toBe(403);
    process.env.PLATFORM_ADMIN_EMAILS = op.manager.email;

    const team = await resend(member.id);
    expect([team.status, team.body]).toEqual([200, { emailSent: expect.any(Boolean) }]);
    expect(await prisma.invitationTracking.count({ where: { staffId: member.id } })).toBe(2);
    expect(await prisma.accountToken.count({ where: { staffId: member.id, type: 'invitation', usedAt: null } })).toBeGreaterThan(0);
    expect(await prisma.auditLog.count({ where: { action: 'staff.invitation_resent' } })).toBe(1);

    const invited = await api().post('/api/internal/platform/invitations').set(auth(op.token)).send({
      operatorName: 'Parking invité',
      managerFirstName: 'Léon',
      managerLastName: 'Invité',
      managerEmail: 'invite@example.com',
      totalCapacity: 80,
    });
    const manager = await prisma.staff.findFirstOrThrow({ where: { operatorId: invited.body.operator.id } });
    expect((await resend(manager.id)).status).toBe(200);
    expect(await prisma.invitationTracking.count({ where: { staffId: manager.id, kind: 'operator' } })).toBe(2);
    await prisma.staff.update({ where: { id: manager.id }, data: { passwordSetAt: new Date() } });
    expect((await resend(manager.id)).body.code).toBe('already_accepted');

    await prisma.staff.update({ where: { id: member.id }, data: { isActive: false } });
    const closed = await resend(member.id);
    expect([closed.status, closed.body.code]).toEqual([409, 'staff_inactive']);
    expect((await resend('cinconnu000000')).status).toBe(404);
  });
});
