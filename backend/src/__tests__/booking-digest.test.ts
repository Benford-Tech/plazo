import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma, { ReservationChannel } from '@/database';
import { digestMessage, digestSources, digestWindow, isQuietHour, sourceLabel } from '@/domain/booking-digest';
import { defaultBookingNotify } from '@/domain/roles';
import { parseInstant } from '@/domain/time';
import { BookingDigestService } from '@/services/booking-digest.service';
import { NotificationService } from '@/services/notification.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * N-A « Récapitulatif horaire » (08/10/2026): one push an hour to the staff on `hourly`, summing up the bookings of
 * every channel since the last digest; nothing during the quiet hours, whose bookings the 07:00 digest covers.
 */

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const at = (local: string) => parseInstant(local, TZ)!;

let fetchMock: jest.SpyInstance;
type Push = {
  headings: { fr: string };
  contents: { fr: string };
  include_subscription_ids: string[];
  data: Record<string, string>;
  collapse_id?: string;
};
const pushes = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === ONESIGNAL_NOTIFICATIONS_URL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Push);

beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  process.env.ONESIGNAL_APP_ID = 'app';
  process.env.ONESIGNAL_REST_API_KEY = 'key';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 'n1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_REST_API_KEY;
});
afterAll(() => prisma.$disconnect());

let seq = 0;
async function booking(
  op: Awaited<ReturnType<typeof setupOperator>>,
  createdLocal: string,
  channel: ReservationChannel,
  channelDetail: string | null = null,
) {
  seq += 1;
  const arrivalAt = at('2027-06-20T08:30');
  return prisma.reservation.create({
    data: {
      reference: `RD${String(seq).padStart(4, '0')}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel,
      channelDetail,
      status: 'upcoming',
      arrivalAt,
      returnAt: new Date(arrivalAt.getTime() + 3 * 86400000),
      passengers: 1,
      customerName: 'Camille Martin',
      customerPhone: '06 12 34 56 78',
      plate: 'AB-123-CD',
      plateKey: 'AB123CD',
      createdAt: at(createdLocal),
    },
  });
}

const digestAt = async (operatorId: string) => (await prisma.operator.findUniqueOrThrow({ where: { id: operatorId } })).bookingDigestAt;

describe('les règles du récapitulatif (domaine)', () => {
  it('heures creuses, fenêtre et pause de 50 minutes', () => {
    expect(isQuietHour('21:59')).toBe(false);
    expect(isQuietHour('22:00')).toBe(true);
    expect(isQuietHour('03:30')).toBe(true);
    expect(isQuietHour('06:59')).toBe(true);
    expect(isQuietHour('07:00')).toBe(false);
    const now = at('2027-06-15T10:00');
    expect(digestWindow(now, null)).toEqual({ start: at('2027-06-15T09:00'), end: now, minutes: 60 });
    expect(digestWindow(now, at('2027-06-15T09:20'))).toBeNull();
    expect(digestWindow(now, at('2027-06-15T09:10'))).toEqual({ start: at('2027-06-15T09:10'), end: now, minutes: 50 });
    expect(digestWindow(now, at('2027-06-14T21:00'))?.minutes).toBe(13 * 60);
  });

  it('nomme les sources et compose le message, au singulier comme au pluriel', () => {
    expect(sourceLabel('plazo', null)).toBe('Plazo');
    expect(sourceLabel('website', null)).toBe('votre site');
    expect(sourceLabel('phone', null)).toBe('téléphone');
    expect(sourceLabel('counter', null)).toBe('comptoir');
    expect(sourceLabel('aggregator', ' Allopark ')).toBe('Allopark');
    expect(sourceLabel('aggregator', null)).toBe('import');
    expect(sourceLabel('import', '')).toBe('import');
    expect(
      digestSources([
        { channel: 'aggregator', channelDetail: 'Allopark' },
        { channel: 'plazo', channelDetail: null },
        { channel: 'counter', channelDetail: null },
        { channel: 'plazo', channelDetail: null },
      ]),
    ).toEqual([
      { label: 'Plazo', count: 2 },
      { label: 'Allopark', count: 1 },
      { label: 'comptoir', count: 1 },
    ]);
    expect(
      digestMessage({
        sources: [
          { label: 'Plazo', count: 2 },
          { label: 'Allopark', count: 1 },
        ],
        toCheck: 1,
        since: null,
      }),
    ).toEqual({ title: '3 réservations reçues', body: '2 Plazo, 1 Allopark · 1 mail à vérifier' });
    expect(digestMessage({ sources: [{ label: 'comptoir', count: 1 }], toCheck: 0, since: '21:00' })).toEqual({
      title: '1 réservation reçue',
      body: '1 comptoir · depuis 21:00',
    });
    expect(digestMessage({ sources: [{ label: 'votre site', count: 2 }], toCheck: 2, since: '22:00' }).body).toBe(
      '2 votre site · 2 mails à vérifier · depuis 22:00',
    );
    expect(defaultBookingNotify('manager')).toBe('hourly');
    expect(defaultBookingNotify('agent')).toBe('immediate');
    expect(defaultBookingNotify('driver')).toBe('immediate');
  });
});

describe('GET /internal/cron/booking-digest', () => {
  it('exige le secret du cron et répond { operators, sent, skipped }', async () => {
    expect((await api().get('/api/internal/cron/booking-digest')).status).toBe(401);
    expect((await api().get('/api/internal/cron/booking-digest').set(auth('wrong'))).status).toBe(401);
    const res = await api().get('/api/internal/cron/booking-digest').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ operators: expect.any(Number), sent: 0, skipped: expect.any(Number) });
  });

  it('une heure de réservations, tous canaux, aux gérants en « hourly » seulement ; la fenêtre suit le repère', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const driver = await addStaff(op.token, 'driver');
    await api().put('/api/internal/notifications/devices').set(auth(op.token)).send({ subscriptionId: 'sub-manager' });
    await api().put('/api/internal/notifications/devices').set(auth(agent.token)).send({ subscriptionId: 'sub-agent' });
    await api().put('/api/internal/notifications/devices').set(auth(driver.token)).send({ subscriptionId: 'sub-driver' });
    await api().patch('/api/internal/notifications/preferences').set(auth(driver.token)).send({ bookings: 'hourly' });
    await api().patch('/api/internal/notifications/preferences').set(auth(driver.token)).send({ bookings: 'never' });
    // Another operator with a device and nothing new: no push for it.
    const other = await setupOperator('Autre');
    await api().put('/api/internal/notifications/devices').set(auth(other.token)).send({ subscriptionId: 'sub-other' });
    const digest = Container.get(BookingDigestService);

    await booking(op, '2027-06-15T08:30', 'phone'); // before the window
    await booking(op, '2027-06-15T09:15', 'plazo');
    await booking(op, '2027-06-15T09:30', 'plazo');
    await booking(op, '2027-06-15T09:40', 'aggregator', 'Allopark');
    await prisma.inboundEmail.create({ data: { operatorId: op.operator.id, status: 'unrecognised', subject: 'Question', textBody: 'Bonjour' } });
    await prisma.inboundEmail.create({ data: { operatorId: other.operator.id, status: 'incomplete', subject: 'Ailleurs' } });

    // 10:00: the first digest counts the last hour.
    expect(await digest.run(at('2027-06-15T10:00'))).toEqual({ operators: 2, sent: 1, skipped: 0 });
    expect(pushes()).toHaveLength(1);
    expect(pushes()[0]).toMatchObject({
      headings: { fr: '3 réservations reçues' },
      contents: { fr: '2 Plazo, 1 Allopark · 1 mail à vérifier' },
      include_subscription_ids: ['sub-manager'],
      data: { type: 'booking', event: 'digest' },
      collapse_id: `digest-${op.operator.id}`,
    });
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-15T10:00'));
    expect(await digestAt(other.operator.id)).toEqual(at('2027-06-15T10:00'));

    // 10:20: the scheduler fired again: nothing, the watermark stays.
    await booking(op, '2027-06-15T10:05', 'counter');
    expect(await digest.run(at('2027-06-15T10:20'))).toEqual({ operators: 0, sent: 0, skipped: 2 });
    expect(pushes()).toHaveLength(1);
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-15T10:00'));

    // 11:00: the booking of 10:05 (after the watermark), the one of 09:40 is not counted twice; the mail was handled meanwhile.
    await prisma.inboundEmail.updateMany({ where: { operatorId: op.operator.id }, data: { status: 'handled' } });
    expect(await digest.run(at('2027-06-15T11:00'))).toEqual({ operators: 2, sent: 1, skipped: 0 });
    expect(pushes()[1]).toMatchObject({ headings: { fr: '1 réservation reçue' }, contents: { fr: '1 comptoir' } });
    expect(pushes()[1].contents.fr).not.toContain('depuis');

    // 12:00: nothing new: no push, the watermark moves anyway.
    expect(await digest.run(at('2027-06-15T12:00'))).toEqual({ operators: 2, sent: 0, skipped: 0 });
    expect(pushes()).toHaveLength(2);
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-15T12:00'));

    // A suspended operator is left alone.
    await prisma.operator.update({ where: { id: other.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    expect(await digest.run(at('2027-06-15T13:00'))).toEqual({ operators: 1, sent: 0, skipped: 0 });
  });

  it('rien de 22:00 à 07:00 : le récapitulatif de 07:00 couvre la nuit et dit depuis quand', async () => {
    const op = await setupOperator();
    await api().put('/api/internal/notifications/devices').set(auth(op.token)).send({ subscriptionId: 'sub-manager' });
    const digest = Container.get(BookingDigestService);
    await prisma.operator.update({ where: { id: op.operator.id }, data: { bookingDigestAt: at('2027-06-15T21:00') } });

    await booking(op, '2027-06-15T21:30', 'website');
    expect(await digest.run(at('2027-06-15T22:00'))).toEqual({ operators: 0, sent: 0, skipped: 1 });
    await booking(op, '2027-06-15T23:10', 'plazo');
    await booking(op, '2027-06-16T06:20', 'plazo');
    expect(await digest.run(at('2027-06-16T03:00'))).toEqual({ operators: 0, sent: 0, skipped: 1 });
    expect(await digest.run(at('2027-06-16T06:59'))).toEqual({ operators: 0, sent: 0, skipped: 1 });
    expect(pushes()).toHaveLength(0);
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-15T21:00'));

    expect(await digest.run(at('2027-06-16T07:00'))).toEqual({ operators: 1, sent: 1, skipped: 0 });
    expect(pushes()[0]).toMatchObject({ headings: { fr: '3 réservations reçues' }, contents: { fr: '2 Plazo, 1 votre site · depuis 21:00' } });
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-16T07:00'));

    // A parking on another clock: 07:00 in Paris is still the night in Montréal.
    await prisma.parking.update({ where: { id: op.parking.id }, data: { timezone: 'America/Montreal' } });
    await booking(op, '2027-06-16T07:30', 'plazo');
    expect(await digest.run(at('2027-06-16T08:00'))).toEqual({ operators: 0, sent: 0, skipped: 1 });
    expect(await digest.run(at('2027-06-16T13:00'))).toEqual({ operators: 1, sent: 1, skipped: 0 });
    expect(pushes()[1].contents.fr).toBe('1 Plazo · depuis 01:00');

    // Without OneSignal nothing is sent, but the window still closes.
    delete process.env.ONESIGNAL_REST_API_KEY;
    await booking(op, '2027-06-16T13:30', 'plazo');
    expect(await digest.run(at('2027-06-16T14:00'))).toEqual({ operators: 1, sent: 0, skipped: 0 });
    expect(await digestAt(op.operator.id)).toEqual(at('2027-06-16T14:00'));
  });

  it('la migration garde le sens du réglage de chacun : désactivé → jamais, gérant → récapitulatif, sinon chaque réservation', async () => {
    const op = await setupOperator();
    const agent = await addStaff(op.token, 'agent');
    const driver = await addStaff(op.token, 'driver');
    await prisma.$executeRawUnsafe('ALTER TABLE "staff" ADD COLUMN "notifyBookings" BOOLEAN NOT NULL DEFAULT true');
    await prisma.$executeRawUnsafe('UPDATE "staff" SET "notifyBookings" = false WHERE "id" = $1', driver.id);
    await prisma.$executeRawUnsafe(`UPDATE "staff" SET "bookingNotify" = 'never'`);
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261008150100_inbound_statuses_data/migration.sql'), 'utf8');
    // One statement per call (a prepared statement takes one command).
    for (const statement of sql
      .replace(/^\s*--.*$/gm, '')
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement);
    }
    const prefOf = async (id: string) => (await prisma.staff.findUniqueOrThrow({ where: { id } })).bookingNotify;
    expect(await prefOf(op.manager.id)).toBe('hourly');
    expect(await prefOf(agent.id)).toBe('immediate');
    expect(await prefOf(driver.id)).toBe('never');
    expect(
      await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'notifyBookings'`,
      ),
    ).toEqual([]);
  });
});
