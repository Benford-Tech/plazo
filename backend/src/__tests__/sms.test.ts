import { createHash, randomBytes } from 'crypto';
import { Container } from 'typedi';
import prisma from '@/database';
import { localDateTime } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { SMS_GATEWAY_CLOUD_URL } from '@/services/sms-gateway.service';
import { SmsService } from '@/services/sms.service';
import { decryptSecret, encryptSecret, SecretBoxError } from '@/utils/secret-box';
import {
  addStaff,
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
  useBrevoSms,
} from './utils/helpers';

// SMS through the operator's own Android phone ("SMS Gateway for Android", cloud mode). fetch is mocked: no network.

const TZ = 'Europe/Paris';
const KEY = randomBytes(32).toString('base64');
const GATEWAY_MESSAGES = `${SMS_GATEWAY_CLOUD_URL}/messages`;
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/send';
const auth = (value: string) => ({ Authorization: `Bearer ${value}` });
const inDays = (days: number, time: string) => `${localDateTime(new Date(Date.now() + days * 86400000), TZ).slice(0, 10)}T${time}`;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000);

const sms = Container.get(SmsService);
const notifications = Container.get(NotificationService);
const defaultNotificationSettings = { ...notifications.settings };

const GATEWAY_FORM = { mode: 'gateway', login: 'AB12CD', password: 's3cret-from-the-app', senderPhone: '+33612345678' };

let fetchMock: jest.SpyInstance;
const calls = (url: string | RegExp) => fetchMock.mock.calls.filter(([u]) => (typeof url === 'string' ? String(u) === url : url.test(String(u))));
const lastBody = (url: string | RegExp) => JSON.parse(calls(url).at(-1)![1].body);

beforeEach(async () => {
  await resetDatabase();
  process.env.SMS_GATEWAY_ENCRYPTION_KEY = KEY;
  delete process.env.PLATFORM_ADMIN_EMAILS;
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: '' });
  stripe = enableFakePayments();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => json({ id: 'gw-1', state: 'Pending' }, 202));
});
let stripe: ReturnType<typeof enableFakePayments>;
afterEach(() => {
  fetchMock.mockRestore();
  disableFakePayments();
  delete process.env.SMS_GATEWAY_ENCRYPTION_KEY;
});
afterAll(() => prisma.$disconnect());

/** The operator's gateway, linked through the API. */
async function linkedOperator() {
  const op = await setupOperator();
  const res = await api().put('/api/internal/sms/settings').set(auth(op.token)).send(GATEWAY_FORM);
  expect(res.status).toBe(200);
  return op;
}

/** A parking bookable on the site (bookings send the confirmation SMS). */
async function publishedParking(op: Awaited<ReturnType<typeof setupOperator>>) {
  await onboardOperator(op.operator.id);
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
  const res = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: `parking-${op.parking.id}`,
      title: 'Parking Démo LYS',
      services: ['shuttle'],
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  expect(res.status).toBe(200);
  await publishListing(op.parking.id);
}

const book = (op: Awaited<ReturnType<typeof setupOperator>>) =>
  api()
    .post('/api/public/bookings')
    .send({
      airport: 'lyon-saint-exupery',
      parking: `parking-${op.parking.id}`,
      arrivalAt: inDays(5, '06:30'),
      returnAt: inDays(7, '15:05'),
      customerName: 'Camille Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'camille.martin@example.com',
      plate: 'GK-318-PX',
      passengers: 2,
      acceptTerms: true,
    });

describe('chiffrement du mot de passe de la passerelle', () => {
  it('chiffre et déchiffre avec la clé du serveur, jamais sans', () => {
    const stored = encryptSecret('mot-de-passe-appli', KEY);
    expect(stored).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(stored).not.toContain('mot-de-passe');
    expect(decryptSecret(stored, KEY)).toBe('mot-de-passe-appli');
    // Two encryptions of the same value differ (random IV).
    expect(encryptSecret('mot-de-passe-appli', KEY)).not.toBe(stored);
    expect(() => decryptSecret(stored, randomBytes(32).toString('base64'))).toThrow(SecretBoxError);
    expect(() => decryptSecret(stored, '')).toThrow(expect.objectContaining({ code: 'key_missing' }));
    expect(() => encryptSecret('x', 'trop-court')).toThrow(expect.objectContaining({ code: 'key_invalid' }));
    expect(() => decryptSecret('v1.abc', KEY)).toThrow(expect.objectContaining({ code: 'ciphertext_invalid' }));
  });
});

describe('réglages du canal SMS', () => {
  it('est « pas de SMS » par défaut, réservé aux gérants', async () => {
    const op = await setupOperator();
    const res = await api().get('/api/internal/sms/settings').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mode: 'none', brevoAvailable: false, gateway: null });
    const agent = await addStaff(op.token, 'agent');
    expect((await api().get('/api/internal/sms/settings').set(auth(agent.token))).status).toBe(403);
    expect((await api().get('/api/internal/sms/status').set(auth(agent.token))).status).toBe(403);
    expect((await api().get('/api/internal/sms/settings')).status).toBe(401);
  });

  it('relie le téléphone : mot de passe chiffré en base et jamais renvoyé, réglages propres à chaque loueur', async () => {
    const op = await linkedOperator();
    const res = await api().get('/api/internal/sms/settings').set(auth(op.token));
    expect(res.body).toMatchObject({ mode: 'gateway', gateway: { baseUrl: null, login: 'AB12CD', senderPhone: '+33612345678' } });
    expect(res.body.gateway.linkedAt).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('s3cret');

    const row = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(row.gatewayPasswordEncrypted).not.toContain('s3cret');
    expect(decryptSecret(row.gatewayPasswordEncrypted!, KEY)).toBe('s3cret-from-the-app');
    expect(await prisma.auditLog.count({ where: { operatorId: op.operator.id, action: 'sms.settings' } })).toBe(1);

    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/sms/settings').set(auth(other.token))).body.mode).toBe('none');
  });

  it('valide le formulaire : identifiant, numéro E.164, mot de passe (sauf s’il est déjà enregistré), serveur https', async () => {
    const op = await setupOperator();
    const missing = await api().put('/api/internal/sms/settings').set(auth(op.token)).send({ mode: 'gateway' });
    expect(missing.status).toBe(400);
    expect(missing.body.fields).toEqual({ login: 'required', senderPhone: 'required', password: 'required' });
    const badPhone = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ ...GATEWAY_FORM, senderPhone: '06 12 34 56 78' });
    expect(badPhone.body.fields).toEqual({ senderPhone: 'invalid_phone' });
    const badUrl = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ ...GATEWAY_FORM, baseUrl: 'http://gateway.local/api' });
    expect(badUrl.body.fields).toEqual({ baseUrl: 'invalid_url' });
    expect((await api().put('/api/internal/sms/settings').set(auth(op.token)).send({ mode: 'pigeon' })).body.fields).toEqual({
      mode: 'invalid_sms_mode',
    });

    expect((await api().put('/api/internal/sms/settings').set(auth(op.token)).send(GATEWAY_FORM)).status).toBe(200);
    // "Modifier" without retyping the password: the stored one is kept; a new login needs a password.
    const edit = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ mode: 'gateway', login: 'AB12CD', senderPhone: '+33698765432' });
    expect(edit.status).toBe(200);
    expect(edit.body.gateway.senderPhone).toBe('+33698765432');
    const newLogin = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ mode: 'gateway', login: 'ZZ99', senderPhone: '+33698765432' });
    expect(newLogin.body.fields).toEqual({ password: 'required' });
    // A private server (advanced); the cloud URL itself is stored as the default.
    const privateServer = await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ ...GATEWAY_FORM, baseUrl: 'https://sms.parking.example/api/' });
    expect(privateServer.body.gateway.baseUrl).toBe('https://sms.parking.example/api');
    expect(
      (
        await api()
          .put('/api/internal/sms/settings')
          .set(auth(op.token))
          .send({ ...GATEWAY_FORM, baseUrl: SMS_GATEWAY_CLOUD_URL })
      ).body.gateway.baseUrl,
    ).toBeNull();
  });

  it('refuse la passerelle sans clé de chiffrement, et Brevo quand la plateforme n’en a pas', async () => {
    const op = await setupOperator();
    delete process.env.SMS_GATEWAY_ENCRYPTION_KEY;
    const res = await api().put('/api/internal/sms/settings').set(auth(op.token)).send(GATEWAY_FORM);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('sms_encryption_key_missing');
    const brevo = await api().put('/api/internal/sms/settings').set(auth(op.token)).send({ mode: 'brevo' });
    expect(brevo.status).toBe(409);
    expect(brevo.body.code).toBe('brevo_unavailable');

    notifications.settings.apiKey = 'brevo-key';
    const ok = await api().put('/api/internal/sms/settings').set(auth(op.token)).send({ mode: 'brevo' });
    expect(ok.body).toEqual({ mode: 'brevo', brevoAvailable: true, gateway: null });
  });

  it('désactive : plus de SMS, identifiants oubliés', async () => {
    const op = await linkedOperator();
    const res = await api().post('/api/internal/sms/disable').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mode: 'none', brevoAvailable: false, gateway: null });
    const row = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(row).toMatchObject({ mode: 'none', gatewayLogin: null, gatewayPasswordEncrypted: null, senderPhone: null, linkedAt: null });
  });

  it('en consultation (view-as), un super admin lit mais ne modifie pas', async () => {
    const admin = await setupOperator('Plazo (tests)');
    const op = await linkedOperator();
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const session = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
    expect(session.status).toBe(201);
    const token = session.body.access.token as string;
    expect((await api().get('/api/internal/sms/settings').set(auth(token))).body.gateway.login).toBe('AB12CD');
    expect((await api().get('/api/internal/sms/status').set(auth(token))).status).toBe(200);
    for (const [method, path, body] of [
      ['put', '/api/internal/sms/settings', GATEWAY_FORM],
      ['post', '/api/internal/sms/test', { to: '+33612345678' }],
      ['post', '/api/internal/sms/disable', {}],
    ] as const) {
      const res = await api()[method](path).set(auth(token)).send(body);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('view_as_read_only');
    }
    expect(calls(/sms-gate/).length).toBe(0);
  });
});

describe('envoi par le téléphone du parking', () => {
  it('passe par la passerelle en Basic auth avec le texte, puis attend que le téléphone l’envoie', async () => {
    const op = await linkedOperator();
    const text = 'Plazo : votre vol a atterri. Rendez-vous navette : Terminal 1.';
    const outcome = await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'flight_landed', to: '06 12 34 56 78', text });
    expect(outcome).toBe('queued');

    expect(calls(GATEWAY_MESSAGES)).toHaveLength(1);
    const [, init] = calls(GATEWAY_MESSAGES)[0];
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe(`Basic ${Buffer.from('AB12CD:s3cret-from-the-app').toString('base64')}`);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({ textMessage: { text }, phoneNumbers: ['+33612345678'], ttl: expect.any(Number) });
    expect(JSON.parse(init.body).ttl).toBeLessThanOrEqual(7200);

    const [row] = await prisma.smsOutbox.findMany({ where: { operatorId: op.operator.id } });
    expect(row).toMatchObject({
      kind: 'flight_landed',
      to: '+33612345678',
      provider: 'gateway',
      providerMessageId: 'gw-1',
      status: 'queued',
      attempts: 1,
      bodyHash: sha256(text),
    });
    expect(JSON.stringify(row)).not.toContain('atterri');
  });

  it('utilise le serveur privé du loueur quand il en a un', async () => {
    const op = await setupOperator();
    await api()
      .put('/api/internal/sms/settings')
      .set(auth(op.token))
      .send({ ...GATEWAY_FORM, baseUrl: 'https://sms.parking.example/api' });
    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'test' });
    expect(calls('https://sms.parking.example/api/messages')).toHaveLength(1);
    expect(calls(GATEWAY_MESSAGES)).toHaveLength(0);
  });

  it('une réservation sur le site envoie la confirmation par le téléphone, et un SMS en échec est renvoyé avec le texte reconstruit', async () => {
    const op = await linkedOperator();
    await publishedParking(op);
    const res = await book(op);
    expect(res.status).toBe(201);
    // Confirmed (and the SMS sent) once the traveller paid.
    expect(calls(GATEWAY_MESSAGES)).toHaveLength(0);
    await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
    expect(calls(GATEWAY_MESSAGES)).toHaveLength(1);
    expect(lastBody(GATEWAY_MESSAGES).textMessage.text).toContain(res.body.reference);
    const row = await prisma.smsOutbox.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(row).toMatchObject({ kind: 'booking_confirmed', status: 'queued', providerMessageId: 'gw-1' });
    expect(row.reservationId).toBeTruthy();

    // The gateway reports the phone failed: retried at the next refresh with the same text (rebuilt from the booking).
    fetchMock.mockImplementation(async (url, init) =>
      init?.method === 'POST' ? json({ id: 'gw-2', state: 'Pending' }, 202) : json({ id: 'gw-1', state: 'Failed' }),
    );
    const first = await sms.refreshQueue(op.operator.id, { force: true });
    expect(first).toEqual({ checked: 1, sent: 0, abandoned: 0 });
    expect((await prisma.smsOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('failed');
    const second = await sms.refreshQueue(op.operator.id, { force: true });
    expect(second.checked).toBe(1);
    const retried = await prisma.smsOutbox.findUniqueOrThrow({ where: { id: row.id } });
    expect(retried).toMatchObject({ status: 'queued', providerMessageId: 'gw-2', attempts: 2 });
    expect(lastBody(GATEWAY_MESSAGES).textMessage.text).toContain(res.body.reference);
    expect(sha256(lastBody(GATEWAY_MESSAGES).textMessage.text)).toBe(row.bodyHash);
  });

  it('téléphone injoignable : l’envoi échoue sans faire échouer l’action, est réessayé, puis abandonné après 2 h', async () => {
    const op = await linkedOperator();
    fetchMock.mockImplementation(async () => {
      throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    });
    expect(await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'x' })).toBe('failed');
    const row = await prisma.smsOutbox.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(row).toMatchObject({ status: 'failed', attempts: 1, lastError: 'sms_gateway_unreachable', providerMessageId: null });
    let settings = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(settings.lastError).toBe('sms_gateway_unreachable');

    // Back online: the retry goes through (test SMS: fixed text).
    fetchMock.mockImplementation(async () => json({ id: 'gw-9', state: 'Pending' }, 202));
    await sms.refreshQueue(op.operator.id, { force: true });
    expect(await prisma.smsOutbox.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({
      status: 'queued',
      attempts: 2,
      providerMessageId: 'gw-9',
    });
    settings = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(settings.lastError).toBeNull();

    // The phone sends it: counted for the month.
    fetchMock.mockImplementation(async () => json({ id: 'gw-9', state: 'Sent' }));
    expect(await sms.refreshQueue(op.operator.id, { force: true })).toEqual({ checked: 1, sent: 1, abandoned: 0 });
    expect((await prisma.smsOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('sent');
    settings = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(settings).toMatchObject({ monthSent: 1, monthFailed: 0 });
    expect(settings.lastSentAt).not.toBeNull();

    // Another one, still waiting after 2 hours: abandoned.
    fetchMock.mockImplementation(async () => json({ id: 'gw-10', state: 'Pending' }, 202));
    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'y' });
    const old = await prisma.smsOutbox.findFirstOrThrow({ where: { providerMessageId: 'gw-10' } });
    await prisma.smsOutbox.update({ where: { id: old.id }, data: { createdAt: hoursAgo(2.1) } });
    expect(await sms.refreshQueue(op.operator.id, { force: true })).toEqual({ checked: 0, sent: 0, abandoned: 1 });
    expect((await prisma.smsOutbox.findUniqueOrThrow({ where: { id: old.id } })).status).toBe('abandoned');
    settings = await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: op.operator.id } });
    expect(settings).toMatchObject({ monthSent: 1, monthFailed: 1 });
  });

  it('les lectures ne consultent la passerelle qu’une fois par minute', async () => {
    const op = await linkedOperator();
    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'x' });
    fetchMock.mockImplementation(async () => json({ id: 'gw-1', state: 'Pending' }));
    await sms.refreshQueue(op.operator.id);
    await sms.refreshQueue(op.operator.id);
    expect(calls(/\/messages\/gw-1$/)).toHaveLength(1);
  });

  it('« Pas de SMS » : rien ne part, rien n’est enregistré ; Brevo : l’ancien chemin, tracé dans la boîte d’envoi', async () => {
    const none = await setupOperator();
    expect(await sms.sendTravellerSms(none.operator.id, { reservationId: null, kind: 'flight_landed', to: '0612345678', text: 'x' })).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await prisma.smsOutbox.count()).toBe(0);
    // A number that is not a French mobile gets no SMS either (any mode).
    const brevo = await setupOperator('Brevo');
    await useBrevoSms(brevo.operator.id);
    notifications.settings.apiKey = 'brevo-key';
    expect(await sms.sendTravellerSms(brevo.operator.id, { reservationId: null, kind: 'flight_landed', to: '+41791234567', text: 'x' })).toBe(
      'skipped',
    );
    expect(await sms.sendTravellerSms(brevo.operator.id, { reservationId: null, kind: 'flight_landed', to: '0612345678', text: 'Bonjour' })).toBe(
      'sent',
    );
    expect(calls(BREVO_SMS_URL)).toHaveLength(1);
    expect(lastBody(BREVO_SMS_URL)).toMatchObject({ recipient: '33612345678', content: 'Bonjour', tag: 'flight_landed' });
    expect(calls(/sms-gate/)).toHaveLength(0);
    expect(await prisma.smsOutbox.findFirst({ where: { operatorId: brevo.operator.id } })).toMatchObject({
      provider: 'brevo',
      status: 'sent',
      bodyHash: sha256('Bonjour'),
    });
    expect((await prisma.operatorSmsSettings.findUniqueOrThrow({ where: { operatorId: brevo.operator.id } })).monthSent).toBe(1);
  });
});

describe('SMS de test', () => {
  it('part par le téléphone et répond « queued » tant que le téléphone ne l’a pas envoyé', async () => {
    const op = await linkedOperator();
    const res = await api().post('/api/internal/sms/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ outcome: 'queued' });
    expect(lastBody(GATEWAY_MESSAGES)).toMatchObject({
      phoneNumbers: ['+33612345678'],
      textMessage: { text: expect.stringContaining('SMS de test') },
    });
    expect(await prisma.smsOutbox.count({ where: { operatorId: op.operator.id, kind: 'test' } })).toBe(1);
  });

  it('remonte le refus de la passerelle (identifiants faux, téléphone hors ligne) et les réglages manquants', async () => {
    const none = await setupOperator();
    const notConfigured = await api().post('/api/internal/sms/test').set(auth(none.token)).send({ to: '+33612345678' });
    expect(notConfigured.status).toBe(409);
    expect(notConfigured.body.code).toBe('sms_not_configured');

    const op = await linkedOperator();
    expect((await api().post('/api/internal/sms/test').set(auth(op.token)).send({ to: '0612345678' })).body.fields).toEqual({ to: 'invalid_phone' });

    fetchMock.mockImplementation(async () => json({ message: 'unauthorized' }, 401));
    const unauthorized = await api().post('/api/internal/sms/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(unauthorized.status).toBe(502);
    expect(unauthorized.body.code).toBe('sms_gateway_unauthorized');
    expect((await api().get('/api/internal/sms/status').set(auth(op.token))).body.lastError).toBe('sms_gateway_unauthorized');

    fetchMock.mockImplementation(async () => json({ message: 'queue limits exceeded' }, 503));
    expect((await api().post('/api/internal/sms/test').set(auth(op.token)).send({ to: '+33612345678' })).body.code).toBe('sms_gateway_offline');

    // The key disappeared from the server: nothing is queued, the operator is told.
    delete process.env.SMS_GATEWAY_ENCRYPTION_KEY;
    const noKey = await api().post('/api/internal/sms/test').set(auth(op.token)).send({ to: '+33612345678' });
    expect(noKey.status).toBe(503);
    expect(noKey.body.code).toBe('sms_encryption_key_missing');
  });
});

describe('état, planning et rétention', () => {
  it('GET /internal/sms/status : compteurs du mois, SMS en attente, dernier code d’erreur', async () => {
    const op = await linkedOperator();
    const empty = await api().get('/api/internal/sms/status').set(auth(op.token));
    expect(empty.body).toMatchObject({
      mode: 'gateway',
      senderPhone: '+33612345678',
      month: { sent: 0, failed: 0 },
      pending: 0,
      pendingStale: false,
      lastError: null,
    });
    expect(empty.body.linkedAt).toBeTruthy();

    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'x' });
    fetchMock.mockImplementation(async () => json({ id: 'gw-1', state: 'Pending' }));
    const waiting = await api().get('/api/internal/sms/status').set(auth(op.token));
    expect(waiting.body).toMatchObject({ pending: 1, pendingStale: false });
    await prisma.smsOutbox.updateMany({ where: { operatorId: op.operator.id }, data: { createdAt: new Date(Date.now() - 11 * 60000) } });
    await prisma.operatorSmsSettings.update({ where: { operatorId: op.operator.id }, data: { queueCheckedAt: null } });
    const stale = await api().get('/api/internal/sms/status').set(auth(op.token));
    expect(stale.body).toMatchObject({ pending: 1, pendingStale: true });

    // Counters belong to the current month: an older month's are not shown.
    await prisma.operatorSmsSettings.update({ where: { operatorId: op.operator.id }, data: { monthKey: '2020-01', monthSent: 7, monthFailed: 2 } });
    expect((await api().get('/api/internal/sms/status').set(auth(op.token))).body.month).toEqual({ sent: 0, failed: 0 });
  });

  it('le planning signale un SMS en attente depuis plus de 10 minutes, et relance la file en passant', async () => {
    const op = await linkedOperator();
    const agent = await addStaff(op.token, 'agent');
    expect((await api().get('/api/internal/planning').set(auth(agent.token))).body.smsWarning).toBeNull();

    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'x' });
    expect((await api().get('/api/internal/planning').set(auth(agent.token))).body.smsWarning).toBeNull(); // fresh: no warning yet
    await prisma.smsOutbox.updateMany({ where: { operatorId: op.operator.id }, data: { createdAt: new Date(Date.now() - 11 * 60000) } });
    await prisma.operatorSmsSettings.update({ where: { operatorId: op.operator.id }, data: { queueCheckedAt: null } });
    fetchMock.mockImplementation(async () => json({ id: 'gw-1', state: 'Pending' }));
    expect((await api().get('/api/internal/planning').set(auth(agent.token))).body.smsWarning).toEqual({ pending: 1 });
    expect(calls(/\/messages\/gw-1$/)).toHaveLength(1);

    // The phone sent it in the meantime: the warning goes.
    await prisma.operatorSmsSettings.update({ where: { operatorId: op.operator.id }, data: { queueCheckedAt: null } });
    fetchMock.mockImplementation(async () => json({ id: 'gw-1', state: 'Delivered' }));
    expect((await api().get('/api/internal/planning').set(auth(agent.token))).body.smsWarning).toBeNull();
    expect((await prisma.smsOutbox.findFirstOrThrow({ where: { operatorId: op.operator.id } })).status).toBe('delivered');
  });

  it('le cron de nuit réessaie ou abandonne les SMS en attente et purge la boîte d’envoi après 30 jours', async () => {
    const op = await linkedOperator();
    await sms.sendTravellerSms(op.operator.id, { reservationId: null, kind: 'test', to: '0612345678', text: 'x' });
    const [row] = await prisma.smsOutbox.findMany({ where: { operatorId: op.operator.id } });
    await prisma.smsOutbox.update({ where: { id: row.id }, data: { createdAt: hoursAgo(3) } });
    await prisma.smsOutbox.create({
      data: {
        operatorId: op.operator.id,
        kind: 'test',
        to: '+33612345678',
        bodyHash: 'h',
        provider: 'gateway',
        status: 'sent',
        createdAt: hoursAgo(31 * 24),
      },
    });
    const res = await api().get('/api/internal/cron/purge-expired-tokens').set(auth(process.env.CRON_SECRET!));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ smsAbandoned: 1, smsPurged: 1 });
    expect(await prisma.smsOutbox.findMany({ where: { operatorId: op.operator.id } })).toEqual([
      expect.objectContaining({ id: row.id, status: 'abandoned' }),
    ]);
  });
});
