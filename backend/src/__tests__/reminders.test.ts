import { Container } from 'typedi';
import prisma from '@/database';
import {
  defaultTemplate,
  outOfQuietHours,
  reminderDueAt,
  renderTemplate,
  shortTemplate,
  smsLength,
  unknownVariables,
  valuesOf,
} from '@/domain/day-before-sms';
import { addDays, localDate, parseInstant } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { ReminderService } from '@/services/reminder.service';
import { addStaff, api, resetDatabase, setupOperator, useBrevoSms } from './utils/helpers';

/**
 * « SMS de la veille » (S-A + S-B, 06/10/2026): the parking's time and text, an evening moved or
 * paused, a booking left out, the quiet hours, the late bookings, the test and "Envoyer maintenant".
 */

const TZ = 'Europe/Paris';
const BREVO_SMS = 'https://api.brevo.com/v3/transactionalSMS/send';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const at = (local: string) => parseInstant(local, TZ)!;
const VALUES = { prénom: 'Camille', nom: 'Martin', date: '15/06/2027', heure: '08:30', plaque: 'AB-123-CD', référence: 'R7KQ2M', lien: '' };

let fetchMock: jest.SpyInstance;
const smsSent = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_SMS)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as { content: string; tag: string });

beforeEach(async () => {
  await resetDatabase();
  Object.assign(Container.get(NotificationService).settings, { apiKey: 'test-brevo-key', publicSiteUrl: 'https://site.example' });
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  Container.get(NotificationService).settings.apiKey = '';
});
afterAll(() => prisma.$disconnect());

let seq = 0;
async function booking(
  op: Awaited<ReturnType<typeof setupOperator>>,
  arrivalLocal: string,
  extra: { phone?: string; name?: string; createdAt?: Date } = {},
) {
  seq += 1;
  const arrivalAt = at(arrivalLocal);
  return prisma.reservation.create({
    data: {
      reference: `RT${String(seq).padStart(4, '0')}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel: 'phone',
      status: 'upcoming',
      arrivalAt,
      returnAt: new Date(arrivalAt.getTime() + 3 * 86400000),
      passengers: 1,
      customerName: extra.name ?? 'Camille Martin',
      customerPhone: extra.phone ?? '06 12 34 56 78',
      plate: 'AB-123-CD',
      plateKey: 'AB123CD',
      ...(extra.createdAt ? { createdAt: extra.createdAt } : {}),
    },
  });
}

describe('les règles du SMS de la veille', () => {
  it('remplace les variables, accents facultatifs, et repère les inconnues', () => {
    expect(renderTemplate('Bonjour {prénom} {nom}, dépôt le {date} à {heure} ({plaque}, {reference}). {lien}', VALUES)).toBe(
      'Bonjour Camille Martin, dépôt le 15/06/2027 à 08:30 (AB-123-CD, R7KQ2M).',
    );
    expect(renderTemplate('{Prenom} : {heure}\n{lien}\nÀ demain', VALUES)).toBe('Camille : 08:30\n\nÀ demain');
    expect(unknownVariables('Bonjour {prénom}, {ville} et {ville} ! {lien}')).toEqual(['{ville}']);
    expect(
      valuesOf({ customerName: ' Camille  Martin ', arrivalAt: at('2027-06-15T08:30'), plate: 'AB-123-CD', reference: 'R7KQ2M' }, TZ, null),
    ).toEqual(VALUES);
    // 09/10/2026: the stored first and last name, not a guess from the display name.
    expect(
      valuesOf(
        {
          customerName: 'Marie Claire de La Tour',
          customerFirstName: 'Marie Claire',
          customerLastName: 'de La Tour',
          arrivalAt: at('2027-06-15T08:30'),
          plate: 'AB-123-CD',
          reference: 'R7KQ2M',
        },
        TZ,
        null,
      ),
    ).toMatchObject({ prénom: 'Marie Claire', nom: 'de La Tour' });
  });

  it('compte les SMS : 160 / 153 caractères en GSM-7, 70 / 67 dès un émoji ou un â', () => {
    expect(smsLength('a'.repeat(160))).toEqual({ encoding: 'gsm7', characters: 160, segments: 1 });
    expect(smsLength('a'.repeat(161))).toEqual({ encoding: 'gsm7', characters: 161, segments: 2 });
    expect(smsLength('Tarif : 10 €')).toEqual({ encoding: 'gsm7', characters: 13, segments: 1 });
    expect(smsLength('Bâtiment').encoding).toBe('unicode');
    expect(smsLength('📍'.repeat(36))).toEqual({ encoding: 'unicode', characters: 72, segments: 2 });
  });

  it('le texte de Plazo et la version courte', () => {
    const ctx = {
      productName: 'Plazo',
      parkingName: 'APL Parking Lyon',
      address: '3 avenue Maréchal Juin',
      phone: '04 72 00 00 00',
      shuttleMinutes: 5,
    };
    expect(defaultTemplate({ ...ctx, repliesReachParking: false })).toBe(
      "Plazo : à demain ! Dépôt le {date} à {heure} à APL Parking Lyon, 3 avenue Maréchal Juin. Navette 5 min jusqu'au terminal. Parking : 04 72 00 00 00. {lien}",
    );
    expect(shortTemplate({ ...ctx, repliesReachParking: true })).toBe(
      'APL Parking Lyon : bonjour {prénom}, à demain {heure} ! 3 avenue Maréchal Juin. Infos pratiques et retour : {lien} Une modification ? Répondez à ce SMS.',
    );
    expect(shortTemplate({ ...ctx, repliesReachParking: false })).toContain('Une question ? 04 72 00 00 00.');
  });

  it("l'heure d'envoi : celle du soir, à la réservation si elle est plus tardive, jamais de 22:00 à 07:00", () => {
    const evening = { sendTime: '18:00', paused: false };
    const arrivalAt = at('2027-06-15T10:00');
    const due = (createdAt: Date, rule = evening, arrival = arrivalAt) =>
      reminderDueAt({ arrivalAt: arrival, createdAt, timeZone: TZ, evening: rule });
    expect(due(at('2027-06-01T12:00'))).toEqual({ at: at('2027-06-14T18:00') });
    expect(due(at('2027-06-01T12:00'), { sendTime: '20:30', paused: false })).toEqual({ at: at('2027-06-14T20:30') });
    expect(due(at('2027-06-14T20:12'))).toEqual({ at: at('2027-06-14T20:12') });
    expect(due(at('2027-06-14T23:00'))).toEqual({ at: at('2027-06-15T07:00') });
    expect(due(at('2027-06-14T23:00'), evening, at('2027-06-15T06:30'))).toEqual({ reason: 'too_late' });
    expect(due(at('2027-06-15T00:30'))).toEqual({ reason: 'same_day' });
    expect(due(at('2027-06-01T12:00'), { sendTime: '18:00', paused: true })).toEqual({ reason: 'paused' });
    expect(outOfQuietHours(at('2027-06-14T21:59'), TZ)).toEqual(at('2027-06-14T21:59'));
    expect(outOfQuietHours(at('2027-06-15T06:59'), TZ)).toEqual(at('2027-06-15T07:00'));
  });
});

describe('le SMS de la veille dans l’espace pro', () => {
  it('montre la soirée, ses départs et ce que devient chaque SMS', async () => {
    // An evening three weeks ahead (an evening can be changed up to 60 days ahead).
    const E = addDays(localDate(new Date(), TZ), 20);
    const D = addDays(E, 1);
    const op = await setupOperator();
    await useBrevoSms(op.operator.id);
    const camille = await booking(op, `${D}T08:30`);
    await booking(op, `${D}T09:00`, { name: 'Julie Roux', phone: '04 72 00 00 31' });
    await booking(op, `${D}T14:20`, { name: 'Lou Peeters', phone: '+32 470 12 34 56' });
    const board = await api().get(`/api/internal/parkings/${op.parking.id}/reminders?evening=${E}`).set(auth(op.token));
    expect(board.status).toBe(200);
    expect(board.body.settings).toMatchObject({ enabled: true, sendTime: '18:00', custom: false });
    expect(board.body.settings.template).toContain('Dépôt le {date} à {heure}');
    expect(board.body.evenings).toHaveLength(7);
    expect(board.body.evening).toMatchObject({ date: E, departuresDate: D, when: 'future', sendTime: '18:00', paused: false });
    expect(board.body.evening.counts).toEqual({ departures: 3, planned: 1, sent: 0, waiting: 0, failed: 0, withoutSms: 2 });
    expect(board.body.evening.rows.map((r: { customerName: string; status: string; at: string | null }) => [r.customerName, r.status, r.at])).toEqual(
      [
        ['Camille Martin', 'planned', `${E}T18:00`],
        ['Julie Roux', 'no_mobile', null],
        ['Lou Peeters', 'foreign', null],
      ],
    );
    expect(board.body.sample).toMatchObject({ customerName: 'Camille Martin', values: { prénom: 'Camille', heure: '08:30' } });
    expect(board.body.can).toEqual({ edit: true, manage: true });

    // "Ne pas envoyer", then the evening moved to 20:00, then paused.
    const left = await api().put(`/api/internal/reservations/${camille.id}/reminder`).set(auth(op.token)).send({ excluded: true });
    expect(left.body).toEqual({ excluded: true });
    let rows = (await api().get(`/api/internal/parkings/${op.parking.id}/reminders?evening=${E}`).set(auth(op.token))).body.evening.rows;
    expect(rows[0]).toMatchObject({ status: 'excluded', excludedBy: 'Gérant' });
    await api().put(`/api/internal/reservations/${camille.id}/reminder`).set(auth(op.token)).send({ excluded: false });
    const moved = await api().put(`/api/internal/parkings/${op.parking.id}/reminders/evenings/${E}`).set(auth(op.token)).send({ sendTime: '20:00' });
    expect(moved.body.evening).toMatchObject({ sendTime: '20:00', timeChanged: true });
    expect(moved.body.evening.rows[0]).toMatchObject({ status: 'planned', at: `${E}T20:00` });
    const paused = await api().put(`/api/internal/parkings/${op.parking.id}/reminders/evenings/${E}`).set(auth(op.token)).send({ paused: true });
    expect(paused.body.evening).toMatchObject({ sendTime: '20:00', paused: true });
    expect(paused.body.evening.rows[0].status).toBe('paused');
    // Back to the usual rule: the evening's row goes.
    await api().put(`/api/internal/parkings/${op.parking.id}/reminders/evenings/${E}`).set(auth(op.token)).send({ sendTime: null, paused: false });
    expect(await prisma.reminderEvening.count()).toBe(0);
    rows = (await api().get(`/api/internal/parkings/${op.parking.id}/reminders?evening=${E}`).set(auth(op.token))).body.evening.rows;
    expect(rows[0]).toMatchObject({ status: 'planned', at: `${E}T18:00` });
  });

  it('le texte du parking : variables vérifiées, retour au texte de Plazo, réservé aux gérants', async () => {
    const op = await setupOperator();
    const url = `/api/internal/parkings/${op.parking.id}/reminders`;
    const unknown = await api().put(url).set(auth(op.token)).send({ template: 'Bonjour {prénom}, rendez-vous {ville}.' });
    expect(unknown.status).toBe(400);
    expect(unknown.body.fields).toEqual({ template: 'unknown_variable' });
    expect((await api().put(url).set(auth(op.token)).send({ sendTime: '15:00' })).body.fields).toEqual({ sendTime: 'invalid_time' });
    const saved = await api().put(url).set(auth(op.token)).send({ template: 'Bonjour {prenom}, à demain {heure} !', sendTime: '19:30' });
    expect(saved.status).toBe(200);
    expect(saved.body.settings).toMatchObject({
      custom: true,
      sendTime: '19:30',
      template: 'Bonjour {prenom}, à demain {heure} !',
      updatedBy: 'Gérant',
    });
    const back = await api().put(url).set(auth(op.token)).send({ template: saved.body.defaults.template });
    expect(back.body.settings.custom).toBe(false);
    const driver = await addStaff(op.token, 'driver');
    expect((await api().put(url).set(auth(driver.token)).send({ enabled: false })).status).toBe(403);
    const seen = await api().get(url).set(auth(driver.token));
    expect(seen.status).toBe(200);
    expect(seen.body.can).toEqual({ edit: false, manage: false });
  });

  it('envoie le texte du parking à son heure, une seule fois, sauf soirée en pause, réservation exclue ou envoi coupé', async () => {
    const op = await setupOperator();
    await useBrevoSms(op.operator.id);
    await api()
      .put(`/api/internal/parkings/${op.parking.id}/reminders`)
      .set(auth(op.token))
      .send({ template: 'Bonjour {prénom}, dépôt le {date} à {heure}. Plaque {plaque}. Réf. {référence}.', sendTime: '19:00' });
    const camille = await booking(op, '2027-06-15T08:30');
    const left = await booking(op, '2027-06-15T09:00', { name: 'Nadia Haddad', phone: '06 11 22 33 44' });
    await api().put(`/api/internal/reservations/${left.id}/reminder`).set(auth(op.token)).send({ excluded: true });
    const reminders = Container.get(ReminderService);

    expect(await reminders.dispatchDue(at('2027-06-14T18:55'))).toEqual({ checked: 1, sent: 0, failed: 0 });
    expect(await reminders.dispatchDue(at('2027-06-14T19:05'))).toEqual({ checked: 1, sent: 1, failed: 0 });
    expect(smsSent().map(s => [s.tag, s.content])).toEqual([
      ['booking_reminder', `Bonjour Camille, dépôt le 15/06/2027 à 08:30. Plaque AB-123-CD. Réf. ${camille.reference}.`],
    ]);
    expect(await reminders.dispatchDue(at('2027-06-14T19:20'))).toEqual({ checked: 0, sent: 0, failed: 0 });
    const board = await api().get(`/api/internal/parkings/${op.parking.id}/reminders?evening=2027-06-14`).set(auth(op.token));
    expect(board.body.evening.rows.map((r: { status: string }) => r.status)).toEqual(['sent', 'excluded']);
    expect(board.body.evening.counts).toMatchObject({ sent: 1, withoutSms: 1 });
    // Too late to leave it out.
    const late = await api().put(`/api/internal/reservations/${camille.id}/reminder`).set(auth(op.token)).send({ excluded: true });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('reminder_already_sent');

    // A paused evening, then the whole thing switched off.
    await booking(op, '2027-06-16T08:30', { name: 'Karim Benali' });
    await prisma.reminderEvening.create({ data: { parkingId: op.parking.id, date: '2027-06-15', paused: true } });
    expect(await reminders.dispatchDue(at('2027-06-15T19:05'))).toEqual({ checked: 1, sent: 0, failed: 0 });
    await prisma.reminderEvening.deleteMany();
    await api().put(`/api/internal/parkings/${op.parking.id}/reminders`).set(auth(op.token)).send({ enabled: false });
    expect(await reminders.dispatchDue(at('2027-06-15T19:05'))).toEqual({ checked: 0, sent: 0, failed: 0 });
    await api().put(`/api/internal/parkings/${op.parking.id}/reminders`).set(auth(op.token)).send({ enabled: true });
    // An archived operator (09/10/2026) is out of the crons: nothing is checked, nothing leaves.
    await prisma.operator.update({ where: { id: op.operator.id }, data: { status: 'suspended', suspendedAt: new Date(), archivedAt: new Date() } });
    expect(await reminders.dispatchDue(at('2027-06-15T19:05'))).toEqual({ checked: 0, sent: 0, failed: 0 });
    await prisma.operator.update({ where: { id: op.operator.id }, data: { status: 'active', suspendedAt: null, archivedAt: null } });
    expect((await reminders.dispatchDue(at('2027-06-15T19:05'))).sent).toBe(1);
  });

  it('rien la nuit : une réservation prise à 23:00 part à 07:00, et le jour même rien ne part', async () => {
    const op = await setupOperator();
    await useBrevoSms(op.operator.id);
    await booking(op, '2027-06-15T10:00', { createdAt: at('2027-06-14T23:00') });
    await booking(op, '2027-06-15T18:00', { name: 'Pierre Lefèvre', createdAt: at('2027-06-15T08:00') });
    const reminders = Container.get(ReminderService);
    expect((await reminders.dispatchDue(at('2027-06-14T23:30'))).sent).toBe(0);
    expect((await reminders.dispatchDue(at('2027-06-15T06:50'))).sent).toBe(0);
    expect(await reminders.dispatchDue(at('2027-06-15T07:05'))).toEqual({ checked: 2, sent: 1, failed: 0 });
    expect(smsSent()).toHaveLength(1);
    expect(smsSent()[0].content).toContain('Dépôt le 15/06/2027 à 10:00');
  });

  it('un envoi de la veille manqué (planificateur arrêté) ne part pas le jour du dépôt', async () => {
    const op = await setupOperator();
    await useBrevoSms(op.operator.id);
    await booking(op, '2027-06-15T15:00');
    const reminders = Container.get(ReminderService);
    expect(await reminders.dispatchDue(at('2027-06-15T07:05'))).toEqual({ checked: 1, sent: 0, failed: 0 });
    expect(smsSent()).toHaveLength(0);
  });

  it('« Envoyer maintenant » pour ce soir, et le test sur le téléphone du gérant', async () => {
    const op = await setupOperator();
    const url = `/api/internal/parkings/${op.parking.id}/reminders`;
    // No SMS channel yet: the test says so.
    const noChannel = await api().post(`${url}/test`).set(auth(op.token)).send({ to: '+33612345678' });
    expect(noChannel.status).toBe(409);
    expect(noChannel.body.code).toBe('sms_not_configured');
    await useBrevoSms(op.operator.id);
    const test = await api().post(`${url}/test`).set(auth(op.token)).send({ to: '+33612345678', template: 'Essai {prénom} à {heure}' });
    expect(test.status).toBe(200);
    expect(test.body).toEqual({ outcome: 'sent', to: '+33612345678' });
    expect(smsSent().map(s => [s.tag, s.content])).toEqual([['reminder_test', 'Essai Camille à 08:30']]);
    expect((await api().post(`${url}/test`).set(auth(op.token)).send({})).body.fields).toEqual({ to: 'required' });

    const today = localDate(new Date(), TZ);
    await booking(op, `${addDays(today, 1)}T12:00`, { name: 'Sophie Martin' });
    const later = await api()
      .post(`${url}/evenings/${addDays(today, 1)}/send`)
      .set(auth(op.token));
    expect(later.status).toBe(409);
    expect(later.body.code).toBe('reminder_not_tonight');
    const now = await api().post(`${url}/evenings/${today}/send`).set(auth(op.token));
    expect(now.status).toBe(200);
    expect(now.body.evening.rows.map((r: { customerName: string; status: string }) => [r.customerName, r.status])).toEqual([
      ['Sophie Martin', 'sent'],
    ]);
    expect(now.body.evening.canSendNow).toBe(false);
    expect(smsSent().filter(s => s.tag === 'booking_reminder')).toHaveLength(1);
  });
});

describe('en consultation (« Ouvrir son espace », 10/10/2026)', () => {
  it('le super admin règle le SMS de la veille, une soirée, un départ exclu, fait le test et envoie, tracés à son nom', async () => {
    const admin = await setupOperator('Plazo (plateforme)');
    const op = await setupOperator();
    await useBrevoSms(op.operator.id);
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    try {
      const view = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
      expect(view.status).toBe(201);
      const token = view.body.access.token as string;
      const url = `/api/internal/parkings/${op.parking.id}/reminders`;
      const today = localDate(new Date(), TZ);

      const settings = await api().put(url).set(auth(token)).send({ sendTime: '19:30', template: 'Bonjour {prénom}, dépôt demain à {heure}.' });
      expect([settings.status, settings.body.settings.sendTime, settings.body.settings.custom]).toEqual([200, '19:30', true]);
      const evening = await api()
        .put(`${url}/evenings/${addDays(today, 2)}`)
        .set(auth(token))
        .send({ paused: true });
      expect(evening.status).toBe(200);
      const kept = await booking(op, `${addDays(today, 1)}T12:00`, { name: 'Sophie Martin' });
      const left = await booking(op, `${addDays(today, 1)}T14:00`, { name: 'Paul Durand' });
      const excluded = await api().put(`/api/internal/reservations/${left.id}/reminder`).set(auth(token)).send({ excluded: true });
      expect([excluded.status, excluded.body]).toEqual([200, { excluded: true }]);
      // « M'envoyer un test »: to the number typed (the admin's own phone otherwise).
      const test = await api().post(`${url}/test`).set(auth(token)).send({ to: '+33612345678' });
      expect([test.status, test.body]).toEqual([200, { outcome: 'sent', to: '+33612345678' }]);
      const now = await api().post(`${url}/evenings/${today}/send`).set(auth(token));
      expect(now.status).toBe(200);
      expect(smsSent().map(s => s.tag)).toEqual(['reminder_test', 'booking_reminder']);
      expect(smsSent()[1].content).toBe('Bonjour Sophie, dépôt demain à 12:00.');

      expect(await prisma.reminderSettings.findUniqueOrThrow({ where: { parkingId: op.parking.id } })).toMatchObject({
        sendTime: '19:30',
        updatedById: admin.manager.id,
      });
      expect(await prisma.reminderEvening.findFirstOrThrow({ where: { parkingId: op.parking.id } })).toMatchObject({
        date: addDays(today, 2),
        paused: true,
        updatedById: admin.manager.id,
      });
      expect(await prisma.reservation.findUniqueOrThrow({ where: { id: left.id } })).toMatchObject({
        reminderExcludedById: admin.manager.id,
        reminderSentAt: null,
      });
      expect((await prisma.reservation.findUniqueOrThrow({ where: { id: kept.id } })).reminderSentAt).not.toBeNull();
      const writes = await prisma.auditLog.findMany({
        where: { operatorId: op.operator.id, staffId: admin.manager.id, action: 'view_as.write' },
        orderBy: { createdAt: 'asc' },
      });
      expect(writes.map(e => (e.details as { path: string }).path)).toEqual([
        url,
        `${url}/evenings/${addDays(today, 2)}`,
        `/api/internal/reservations/${left.id}/reminder`,
        `${url}/test`,
        `${url}/evenings/${today}/send`,
      ]);
    } finally {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    }
  });
});
