import { Container } from 'typedi';
import prisma from '@/database';
import { suppressionHash } from '@/domain/prospecting';
import { NotificationService } from '@/services/notification.service';
import { ProspectingService } from '@/services/prospecting.service';
import { logger } from '@/utils/logger';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// Prospection (18/10/2026, « ajoute un outil d'envoi d'email de prospection », choix « A avec les relances de B »).
// Brevo is mocked; every parking and address is fictional.

const P = '/api/internal/platform/prospects';
const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const notifications = Container.get(NotificationService);
const service = Container.get(ProspectingService);
const defaultNotificationSettings = { ...notifications.settings };

type Op = Awaited<ReturnType<typeof setupOperator>>;
let admin: Op;
let loueur: Op;
let fetchMock: jest.SpyInstance;
let brevoStatus = 201;
let messageCounter = 0;

const emails = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_EMAIL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>);

const prospect = (n: number, overrides: Record<string, unknown> = {}) => ({
  companyName: `Parking Fictif ${n}`,
  contactFirstName: 'Camille',
  contactLastName: `Exemple${n}`,
  email: `contact${n}@parking-fictif.example`,
  town: 'Pusignan',
  airportCode: 'LYS',
  ...overrides,
});

async function create(n: number, overrides: Record<string, unknown> = {}) {
  const res = await api().post(P).set(auth(admin.token)).send(prospect(n, overrides));
  expect(res.status).toBe(201);
  return res.body.data as { id: string; email: string };
}

beforeEach(async () => {
  await resetDatabase();
  admin = await setupOperator('Plazo (tests)');
  loueur = await setupOperator('Loueur');
  process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
  Object.assign(notifications.settings, defaultNotificationSettings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
  brevoStatus = 201;
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    if (String(url) !== BREVO_EMAIL) return new Response('{}', { status: 200 });
    if (brevoStatus >= 400) return new Response(JSON.stringify({ code: 'invalid_parameter', message: 'refused x@y.z' }), { status: brevoStatus });
    messageCounter += 1;
    return new Response(JSON.stringify({ messageId: `<msg-${messageCounter}@brevo.test>` }), { status: brevoStatus });
  });
});
afterEach(() => {
  delete process.env.PLATFORM_ADMIN_EMAILS;
  delete process.env.PROSPECTING_REPLY_TO;
  delete process.env.PROSPECTING_SENDER_EMAIL;
  delete process.env.PROSPECTING_SENDER_NAME;
  Object.assign(notifications.settings, defaultNotificationSettings);
  fetchMock.mockRestore();
});
afterAll(() => prisma.$disconnect());

describe('Plateforme › Prospection : accès et prospects', () => {
  it('réservé au super admin', async () => {
    expect((await api().get(P)).status).toBe(401);
    expect((await api().get(P).set(auth(loueur.token))).status).toBe(403);
    expect((await api().post(P).set(auth(loueur.token)).send(prospect(1))).status).toBe(403);
    expect(
      (
        await api()
          .post(`${P}/send`)
          .set(auth(loueur.token))
          .send({ ids: ['x'] })
      ).status,
    ).toBe(403);
    expect((await api().get(`${P}/settings`).set(auth(loueur.token))).status).toBe(403);
    expect((await api().get(P).set(auth(admin.token))).status).toBe(200);
  });

  it('ajout, modification, suppression ; adresse en minuscules et unique ; filtres et comptages', async () => {
    const a = await create(1, { email: 'Contact1@Parking-Fictif.Example' });
    expect(a.email).toBe('contact1@parking-fictif.example');
    expect((await api().post(P).set(auth(admin.token)).send(prospect(1))).body.code).toBe('prospect_exists');
    expect((await api().post(P).set(auth(admin.token)).send({ email: 'x' })).body.fields).toEqual({
      companyName: 'required',
      email: 'invalid_email',
    });
    await create(2, { airportCode: 'CDG' });

    const patched = await api().patch(`${P}/${a.id}`).set(auth(admin.token)).send({ town: 'Genas', notes: 'Rappeler en novembre' });
    expect(patched.body.data).toMatchObject({ town: 'Genas', notes: 'Rappeler en novembre', companyName: 'Parking Fictif 1' });

    await api().post(`${P}/${a.id}/status`).set(auth(admin.token)).send({ status: 'interested' });
    const list = await api().get(P).set(auth(admin.token));
    expect(list.body.counts).toEqual({ all: 2, to_contact: 1, contacted: 0, replied: 0, interested: 1, not_interested: 0, unsubscribed: 0 });
    expect(list.body.airports).toEqual([
      { code: 'CDG', name: null, count: 1 },
      { code: 'LYS', name: 'Lyon Saint-Exupéry', count: 1 },
    ]);
    expect(list.body.today).toEqual({ sent: 0, cap: 50, remaining: 50 });
    expect(list.body.configured).toBe(true);
    expect((await api().get(`${P}?status=interested`).set(auth(admin.token))).body.data.map((p: any) => p.id)).toEqual([a.id]);
    const lys = await api().get(`${P}?airport=lys`).set(auth(admin.token));
    expect(lys.body.data).toHaveLength(1);
    expect(lys.body.counts.all).toBe(1);
    expect((await api().get(`${P}?status=nope`).set(auth(admin.token))).body.fields).toEqual({ status: 'invalid_status' });

    expect((await api().delete(`${P}/${a.id}`).set(auth(admin.token))).status).toBe(200);
    expect((await api().delete(`${P}/${a.id}`).set(auth(admin.token))).status).toBe(404);
    // The platform's writes are in the admin's journal, without address or name.
    const logs = await prisma.auditLog.findMany({ where: { action: { startsWith: 'prospect' } } });
    expect(logs.map(l => l.action)).toEqual(
      expect.arrayContaining(['prospect.created', 'prospect.updated', 'prospect.status_changed', 'prospect.deleted']),
    );
    expect(JSON.stringify(logs)).not.toContain('parking-fictif.example');
  });

  it('import CSV : aperçu sans écriture, doublons (liste et fichier), désinscrits, lignes invalides', async () => {
    await create(1);
    await prisma.prospectSuppression.create({ data: { emailHash: suppressionHash('contact3@parking-fictif.example') } });
    const rows = [
      prospect(1),
      prospect(2),
      { ...prospect(2), companyName: 'Doublon dans le fichier' },
      prospect(3),
      { companyName: '', email: 'sans-parking@parking-fictif.example' },
      prospect(4, { airportCode: '' }),
    ];
    const preview = await api().post(`${P}/import`).set(auth(admin.token)).send({ rows, dryRun: true });
    expect(preview.status).toBe(200);
    expect(preview.body.counts).toEqual({ new: 2, duplicate: 2, suppressed: 1, invalid: 1 });
    expect(preview.body.results.map((r: any) => r.outcome)).toEqual(['duplicate', 'new', 'duplicate', 'suppressed', 'invalid', 'new']);
    expect(preview.body.results[4].fields).toEqual({ companyName: 'required' });
    expect(await prisma.prospect.count()).toBe(1);

    const done = await api().post(`${P}/import`).set(auth(admin.token)).send({ rows });
    expect(done.body.created).toBe(2);
    expect(await prisma.prospect.count({ where: { source: 'csv' } })).toBe(2);
    // A suppressed address can neither be imported nor typed again.
    expect((await api().post(P).set(auth(admin.token)).send(prospect(3))).body.code).toBe('suppressed');
    expect((await api().post(`${P}/import`).set(auth(admin.token)).send({ rows: [] })).body.fields).toEqual({ rows: 'required' });
  });
});

describe('Plateforme › Prospection : envoi et relances', () => {
  it('envoi immédiat : Brevo, en-têtes de désinscription, Reply-To de l’admin, mail 1 enregistré, relance planifiée', async () => {
    const a = await create(1);
    const b = await create(2, { contactFirstName: null });
    const res = await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id, b.id] });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ enrolled: 2, sent: 2, failed: 0, queued: 0, skipped: 0 });
    const sent = emails();
    expect(sent).toHaveLength(2);
    const first = sent.find(e => e.to[0].email === 'contact1@parking-fictif.example')!;
    expect(first.sender).toEqual({ name: 'Plazo', email: 'bonjour@plazo.test' });
    expect(first.replyTo).toEqual({ email: admin.manager.email });
    expect(first.subject).toBe('Camille, vos réservations des comparateurs au même endroit');
    expect(first.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(first.headers['List-Unsubscribe']).toMatch(/^<https:\/\/site\.example\/api\/public\/prospecting\/unsubscribe\/[^>]+>, <mailto:/);
    expect(first.textContent).toContain('Benford Tech');
    expect(first.htmlContent).toContain('Ne plus recevoir de messages de Plazo');
    // Without a first name, the subject still reads well.
    expect(sent.find(e => e.to[0].email === 'contact2@parking-fictif.example')!.subject).toBe('Vos réservations des comparateurs au même endroit');

    const row = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(row).toMatchObject({ status: 'contacted', step: 1, sendingAt: null, enrolledById: admin.manager.id });
    expect(row.nextSendAt!.getTime()).toBeGreaterThan(Date.now() + 3 * 86400000);
    const messages = await prisma.prospectMessage.findMany({ where: { prospectId: a.id } });
    expect(messages).toEqual([expect.objectContaining({ step: 1, status: 'sent', providerMessageId: expect.stringMatching(/^<msg-/) })]);

    // Already in the sequence: not sent twice.
    const again = await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    expect(again.body).toMatchObject({ enrolled: 0, sent: 0, skipped: 1 });
    expect(emails()).toHaveLength(2);
    const list = await api().get(P).set(auth(admin.token));
    expect(list.body.today).toMatchObject({ sent: 2, remaining: 48 });
    expect(list.body.data.find((p: any) => p.id === a.id)).toMatchObject({ status: 'contacted', step: 1, nextStep: 2 });
  });

  it('PROSPECTING_SENDER_* et PROSPECTING_REPLY_TO remplacent l’expéditeur et la réponse', async () => {
    process.env.PROSPECTING_SENDER_EMAIL = 'joanny@plazo.test';
    process.env.PROSPECTING_SENDER_NAME = 'Joanny de Plazo';
    process.env.PROSPECTING_REPLY_TO = 'Prospection@Plazo.test';
    const a = await create(1);
    await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    expect(emails()[0]).toMatchObject({
      sender: { name: 'Joanny de Plazo', email: 'joanny@plazo.test' },
      replyTo: { email: 'prospection@plazo.test' },
    });
  });

  it('sans Brevo : 409 prospecting_unavailable, rien n’est inscrit', async () => {
    const a = await create(1);
    notifications.settings.apiKey = '';
    const res = await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('prospecting_unavailable');
    expect((await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).nextSendAt).toBeNull();
  });

  it('plafond du jour : au-delà, en attente du prochain jour ouvré, puis envoyé dans la fenêtre', async () => {
    await api()
      .put(`${P}/settings`)
      .set(auth(admin.token))
      .send({ ...(await api().get(`${P}/settings`).set(auth(admin.token))).body.data, dailyCap: 2 });
    const ids = [];
    for (const n of [1, 2, 3]) ids.push((await create(n)).id);
    const res = await api().post(`${P}/send`).set(auth(admin.token)).send({ ids });
    expect(res.body).toMatchObject({ enrolled: 3, sent: 2, queued: 1 });
    expect(emails()).toHaveLength(2);
    const waiting = await prisma.prospect.findFirstOrThrow({ where: { step: 0 } });
    expect(waiting.status).toBe('to_contact');
    expect(waiting.nextSendAt!.toISOString()).toBe(res.body.nextOpening);
    expect(new Date(res.body.nextOpening).getTime()).toBeGreaterThan(Date.now());

    // Today's cap is reached: the pass sends nothing (even if it ran inside the window today).
    await service.runDue(new Date());
    expect(emails()).toHaveLength(2);
    // At the next opening, a new day: it leaves.
    const pass = await service.runDue(waiting.nextSendAt!);
    expect(pass).toMatchObject({ window: true, sent: 1 });
    expect(emails()).toHaveLength(3);
  });

  it('relances : J+4 puis J+10 dans la fenêtre, jamais deux fois, arrêt sur réponse ; hors fenêtre rien ne part', async () => {
    const a = await create(1);
    const b = await create(2);
    await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id, b.id] });
    const due = (await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).nextSendAt!;

    // Saturday noon: outside the window, nothing.
    expect(await service.runDue(new Date('2026-10-24T10:00:00Z'))).toMatchObject({ window: false, sent: 0 });

    // b replied in the meantime: its follow-up never leaves.
    await api().post(`${P}/${b.id}/status`).set(auth(admin.token)).send({ status: 'replied' });
    expect(await prisma.prospect.findUniqueOrThrow({ where: { id: b.id } })).toMatchObject({ status: 'replied', nextSendAt: null });

    // Two passes at once: one email only.
    const [one, two] = await Promise.all([service.runDue(due), service.runDue(due)]);
    expect(one.sent + two.sent).toBe(1);
    expect(emails()).toHaveLength(3);
    expect(emails()[2]).toMatchObject({ subject: 'Re : vos réservations au même endroit', to: [{ email: 'contact1@parking-fictif.example' }] });
    const afterTwo = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(afterTwo.step).toBe(2);
    expect(await service.runDue(due)).toMatchObject({ sent: 0 });

    // The last message, then the end of the sequence.
    expect(await service.runDue(afterTwo.nextSendAt!)).toMatchObject({ sent: 1 });
    const done = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(done).toMatchObject({ step: 3, nextSendAt: null, status: 'contacted' });
    expect(emails()[3].subject).toBe('Une démonstration de 15 minutes ?');
    expect(await prisma.prospectMessage.count({ where: { prospectId: a.id, status: 'sent' } })).toBe(3);
    expect(await prisma.prospectMessage.count({ where: { prospectId: b.id } })).toBe(1);
  });

  it('modifier les mails : relance éteinte sautée, délais revus pour les relances déjà prévues ; erreurs par champ', async () => {
    const a = await create(1);
    await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    const before = (await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).nextSendAt!;
    const current = (await api().get(`${P}/settings`).set(auth(admin.token))).body.data;
    const bad = await api()
      .put(`${P}/settings`)
      .set(auth(admin.token))
      .send({ steps: [current.steps[0], { ...current.steps[1], subject: '{société}' }, current.steps[2]], dailyCap: 1000 });
    expect(bad.body.fields).toEqual({ 'steps.2.subject': 'unknown_variable', dailyCap: 'cap_range' });

    const steps = [current.steps[0], { ...current.steps[1], enabled: false }, { ...current.steps[2], delayDays: 20 }];
    const saved = await api().put(`${P}/settings`).set(auth(admin.token)).send({ steps, dailyCap: 30 });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ dailyCap: 30, configured: true });
    const after = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(after.nextSendAt!.getTime()).toBeGreaterThan(before.getTime() + 10 * 86400000);
    await service.runDue(after.nextSendAt!);
    expect(emails().at(-1)!.subject).toBe('Une démonstration de 15 minutes ?');
    expect((await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).step).toBe(3);
  });

  it('refus de Brevo : enregistré, retenté, arrêté après 3 échecs ; journaux sans adresse', async () => {
    const logs = jest.spyOn(logger, 'error');
    const info = jest.spyOn(logger, 'info');
    const a = await create(1);
    brevoStatus = 400;
    const res = await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    expect(res.body).toMatchObject({ sent: 0, failed: 1 });
    let row = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(row).toMatchObject({ status: 'to_contact', step: 0, failedAttempts: 1 });
    await service.runDue(row.nextSendAt!);
    row = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    await service.runDue(row.nextSendAt!);
    row = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(row).toMatchObject({ failedAttempts: 3, nextSendAt: null });
    expect(row.stoppedAt).not.toBeNull();
    expect(await prisma.prospectMessage.count({ where: { prospectId: a.id, status: 'failed', error: 'http_400' } })).toBe(3);
    const list = await api().get(P).set(auth(admin.token));
    expect(list.body.data[0]).toMatchObject({ lastError: 'http_400', failedAttempts: 3 });
    const lines = [...logs.mock.calls, ...info.mock.calls].map(c => c.map(String).join(' ')).join('\n');
    expect(lines).not.toContain('parking-fictif.example');
    expect(lines).not.toContain('Camille');
    logs.mockRestore();
    info.mockRestore();
  });

  it('m’envoyer un test : à l’adresse de l’admin, texte non enregistré, hors plafond', async () => {
    const a = await create(1);
    const res = await api()
      .post(`${P}/test`)
      .set(auth(admin.token))
      .send({ step: 2, prospectId: a.id, subject: 'Essai pour {parking}', body: 'Bonjour {prénom}' });
    expect(res.body).toEqual({ sentTo: admin.manager.email });
    expect(emails()[0]).toMatchObject({ subject: '[Test] Essai pour Parking Fictif 1', to: [{ email: admin.manager.email }] });
    expect(await prisma.prospectMessage.count()).toBe(0);
    expect((await api().post(`${P}/test`).set(auth(admin.token)).send({ step: 4 })).body.fields).toEqual({ step: 'invalid' });
  });
});

describe('désinscription (lien public, RFC 8058) et conservation', () => {
  it('GET montre une page sans désinscrire ; POST désinscrit, arrête les relances et bloque l’adresse ; lien faux = 404', async () => {
    const a = await create(1);
    await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    const url = new URL(/<(https:[^>]+)>/.exec(emails()[0].headers['List-Unsubscribe'])![1]);
    const path = url.pathname;

    const page = await api().get(path);
    expect(page.status).toBe(200);
    expect(page.text).toContain('Ne plus recevoir de messages');
    expect(page.text).toContain(`action="${path}"`);
    expect((await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).status).toBe('contacted');

    const tampered = path.slice(0, -2) + (path.endsWith('AA') ? 'BB' : 'AA');
    expect((await api().get(tampered)).status).toBe(404);
    expect((await api().post(tampered).type('form').send('List-Unsubscribe=One-Click')).status).toBe(404);
    expect((await api().get('/api/public/prospecting/unsubscribe/n%27importe-quoi')).status).toBe(404);

    const done = await api().post(path).type('form').send('List-Unsubscribe=One-Click');
    expect(done.status).toBe(200);
    expect(done.text).toContain('Vous ne recevrez plus');
    const row = await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } });
    expect(row).toMatchObject({ status: 'unsubscribed', nextSendAt: null });
    expect(await prisma.prospectSuppression.count({ where: { emailHash: suppressionHash('contact1@parking-fictif.example') } })).toBe(1);
    expect((await api().post(path)).status).toBe(200); // idempotent
    expect((await api().get(path)).text).toContain('C’est noté');

    // Unsubscribed: no state change, no new enrolment, and the address stays blocked after deletion.
    expect((await api().post(`${P}/${a.id}/status`).set(auth(admin.token)).send({ status: 'interested' })).body.code).toBe('unsubscribed');
    await api().delete(`${P}/${a.id}`).set(auth(admin.token));
    expect(
      (
        await api()
          .post(`${P}/import`)
          .set(auth(admin.token))
          .send({ rows: [prospect(1)] })
      ).body.counts,
    ).toMatchObject({ suppressed: 1, new: 0 });
  });

  it('une désinscription notée à la main (réponse « ne plus me contacter ») bloque aussi l’adresse', async () => {
    const a = await create(1);
    await api().post(`${P}/${a.id}/status`).set(auth(admin.token)).send({ status: 'unsubscribed' });
    await api().delete(`${P}/${a.id}`).set(auth(admin.token));
    expect((await api().post(P).set(auth(admin.token)).send(prospect(1))).body.code).toBe('suppressed');
  });

  it('« Arrêter les relances » : plus rien ne part, l’état reste', async () => {
    const a = await create(1);
    await api()
      .post(`${P}/send`)
      .set(auth(admin.token))
      .send({ ids: [a.id] });
    const due = (await prisma.prospect.findUniqueOrThrow({ where: { id: a.id } })).nextSendAt!;
    const stopped = await api().post(`${P}/${a.id}/stop`).set(auth(admin.token));
    expect(stopped.body.data).toMatchObject({ status: 'contacted', nextSendAt: null });
    expect(await service.runDue(due)).toMatchObject({ sent: 0 });
  });

  it('la purge de nuit efface les prospects 3 ans après le dernier contact (ou la création), garde les désinscriptions', async () => {
    const old = await create(1);
    const recent = await create(2);
    const neverContacted = await create(3);
    const fourYears = new Date(Date.now() - 4 * 365 * 86400000);
    await prisma.prospect.update({ where: { id: old.id }, data: { lastContactedAt: fourYears, createdAt: fourYears } });
    await prisma.prospect.update({ where: { id: recent.id }, data: { createdAt: fourYears, lastContactedAt: new Date() } });
    await prisma.prospect.update({ where: { id: neverContacted.id }, data: { createdAt: fourYears } });
    await prisma.prospectSuppression.create({ data: { emailHash: suppressionHash('ancien@parking-fictif.example') } });
    const res = await api().get('/api/internal/cron/purge-expired-tokens').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.body.prospectsDeleted).toBe(2);
    expect((await prisma.prospect.findMany()).map(p => p.id)).toEqual([recent.id]);
    expect(await prisma.prospectSuppression.count()).toBe(1);
  });

  it('le passage de 15 minutes (remind-tomorrow) et la route dédiée ; une panne de la prospection ne change pas remind-tomorrow', async () => {
    const cron = (path: string) => api().get(`/api/internal/cron/${path}`).set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect((await api().get('/api/internal/cron/prospecting')).status).toBe(401);
    const dedicated = await cron('prospecting');
    expect(dedicated.status).toBe(200);
    expect(dedicated.body).toMatchObject({ configured: true, sent: 0 });
    const spy = jest.spyOn(service, 'runDue').mockRejectedValueOnce(new Error('boom'));
    const remind = await cron('remind-tomorrow');
    expect(remind.status).toBe(200);
    expect(remind.body.prospecting).toEqual({ error: true });
    spy.mockRestore();
    expect((await cron('remind-tomorrow')).body.prospecting).toHaveProperty('configured', true);
  });
});
