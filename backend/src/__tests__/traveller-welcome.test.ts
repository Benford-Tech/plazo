import { Container } from 'typedi';
import prisma from '@/database';
import { welcomeEmail, welcomeEmailHash } from '@/domain/traveller-welcome';
import { NotificationService } from '@/services/notification.service';
import { TravellerWelcomeService } from '@/services/traveller-welcome.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// 15/11/2026 (« Mail d'intro de Plazo au client avec message pour installer l'App », direction B). Brevo is mocked.

const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const notifications = Container.get(NotificationService);
const service = Container.get(TravellerWelcomeService);
const defaultSettings = { ...notifications.settings };
const NOW = new Date('2026-11-15T10:00:00Z');

let fetchMock: jest.SpyInstance;
const emails = () =>
  fetchMock.mock.calls
    .filter(([u]) => String(u) === BREVO_EMAIL)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>)
    .filter(m => (m.tags ?? []).includes('traveller_welcome'));

type Op = Awaited<ReturnType<typeof setupOperator>>;
let n = 0;
async function booking(op: Op, data: Record<string, unknown> = {}) {
  n++;
  return prisma.reservation.create({
    data: {
      reference: `RWEL${n}${Math.floor(Math.random() * 900 + 100)}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel: 'aggregator',
      channelDetail: 'Onepark',
      externalReference: `#59083${n}`,
      status: 'upcoming',
      arrivalAt: new Date('2026-11-20T05:30:00Z'),
      returnAt: new Date('2026-11-27T20:40:00Z'),
      passengers: 1,
      customerName: 'Camille Martin',
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'camille@example.org',
      plate: '',
      plateKey: '',
      createdAt: new Date(NOW.getTime() - 3600_000),
      ...data,
    },
  });
}

async function withListing(op: Op) {
  const airport = await prisma.airport.findFirstOrThrow();
  await prisma.listing.upsert({
    where: { parkingId: op.parking.id },
    create: { parkingId: op.parking.id, airportId: airport.id, slug: `p-${op.parking.id}`, title: 'Parking des Cèdres' },
    update: { title: 'Parking des Cèdres' },
  });
}

beforeEach(async () => {
  await resetDatabase();
  Object.assign(notifications.settings, defaultSettings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async url => {
    if (String(url) === BREVO_EMAIL) return new Response(JSON.stringify({ messageId: '<m@brevo>' }), { status: 201 });
    return new Response('{}', { status: 200 });
  });
});
afterEach(() => {
  fetchMock.mockRestore();
  Object.assign(notifications.settings, defaultSettings);
});
afterAll(() => prisma.$disconnect());

describe('le mail', () => {
  it('met l’installation en tête, avec les dates du parking et le numéro du comparateur', () => {
    const m = welcomeEmail({
      productName: 'Plazo',
      firstName: 'Camille',
      parkingName: 'Parking des Cèdres',
      arrivalLocal: '2026-11-20T06:30',
      returnLocal: '2026-11-27T21:40',
      reference: 'AL-884880719',
      link: 'https://site.example/a/R7KQ2M-abcdefgh',
      imagesBase: 'https://site.example',
      badges: [],
      unsubscribeUrl: 'https://site.example/api/public/traveller-emails/unsubscribe/x.y',
      publisher: 'Benford Tech',
    });
    expect(m.subject).toBe('Camille, installez Plazo avant votre départ du 20 novembre');
    expect(m.html).toContain('Installez Plazo avant votre départ');
    expect(m.html).toContain('https://site.example/mail/plazo-atterrissage.jpg');
    expect(m.text).toContain('dépôt le vendredi 20 novembre à 06:30, retour le vendredi 27 novembre à 21:40');
    expect(m.text).toContain('AL-884880719');
    expect(m.text).toContain('https://site.example/a/R7KQ2M-abcdefgh');
  });
});

describe('l’envoi', () => {
  it('une fois par adresse et par parking, jamais pour Plazo ni pour un dépôt passé', async () => {
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    const first = await booking(op);
    await booking(op, { customerEmail: 'Camille@Example.org' }); // the same traveller again
    await booking(op, { channel: 'plazo', channelDetail: null, externalReference: null, customerEmail: 'plazo@example.org' });
    await booking(op, { customerEmail: 'passe@example.org', arrivalAt: new Date(NOW.getTime() - 60_000) });
    await booking(op, { customerEmail: 'robot@allopark.com' });

    const report = await service.run(NOW);
    expect(report).toEqual({ sent: 1, skipped: 2, failed: 0 });
    const sent = emails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to[0].email).toBe('camille@example.org');
    expect(sent[0].headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(sent[0].htmlContent).toContain('Parking des Cèdres');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: first.id } })).welcomeEmailOutcome).toBe('sent');

    // A second pass sends nothing more.
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 0 });
  });

  it('dès que l’e-mail est connu : dépôt dans une heure, réservation d’il y a 5 jours (20/11/2026)', async () => {
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    await booking(op, { customerEmail: 'proche@example.org', arrivalAt: new Date(NOW.getTime() + 3600_000) });
    const old = await booking(op, { customerEmail: null, createdAt: new Date(NOW.getTime() - 5 * 86400_000) });
    expect(await service.run(NOW)).toEqual({ sent: 1, skipped: 0, failed: 0 });
    // The email is typed later by the team: it goes at the next pass.
    await prisma.reservation.update({ where: { id: old.id }, data: { customerEmail: 'ancienne@example.org' } });
    expect(await service.run(NOW)).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(
      emails()
        .map(m => m.to[0].email)
        .sort(),
    ).toEqual(['ancienne@example.org', 'proche@example.org']);
  });

  it('un mail refusé par Brevo est réessayé une heure plus tard (19/11/2026)', async () => {
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    const b = await booking(op);
    fetchMock.mockImplementation(async url => {
      if (String(url) === BREVO_EMAIL) return new Response(JSON.stringify({ message: 'unrecognised IP address' }), { status: 401 });
      return new Response('{}', { status: 200 });
    });
    expect(await service.run(NOW)).toEqual({ sent: 0, skipped: 0, failed: 1 });
    // Not before an hour has passed.
    expect(await service.run(new Date(NOW.getTime() + 15 * 60_000))).toEqual({ sent: 0, skipped: 0, failed: 0 });

    fetchMock.mockImplementation(async url => {
      if (String(url) === BREVO_EMAIL) return new Response(JSON.stringify({ messageId: '<m@brevo>' }), { status: 201 });
      return new Response('{}', { status: 200 });
    });
    expect(await service.run(new Date(NOW.getTime() + 61 * 60_000))).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: b.id } })).welcomeEmailOutcome).toBe('sent');
    expect(await service.run(new Date(NOW.getTime() + 3 * 3600_000))).toEqual({ sent: 0, skipped: 0, failed: 0 });
  });

  it('Allopark et import de fichier : envoyé dès que l’e-mail du voyageur est connu (20/11/2026)', async () => {
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    const file = await prisma.reservationImport.create({ data: { operatorId: op.operator.id, fileName: 'planning.xlsx' } });
    await booking(op, { channelDetail: 'Allopark', externalReference: 'AL-884880719', customerEmail: 'allo@example.org' });
    await booking(op, { channelDetail: 'Allopark', externalReference: 'AL-884880720', customerEmail: 'resa@allopark.com' });
    await booking(op, { importId: file.id, customerEmail: 'fichier@example.org' });
    expect(await service.run(NOW)).toEqual({ sent: 2, skipped: 1, failed: 0 });
    expect(
      emails()
        .map(m => m.to[0].email)
        .sort(),
    ).toEqual(['allo@example.org', 'fichier@example.org']);
  });

  it('rien sans fiche Plazo, ni depuis le parking de test', async () => {
    const op = await setupOperator('Parking Sans Fiche');
    await prisma.listing.deleteMany({ where: { parkingId: op.parking.id } });
    await booking(op);
    const test = await setupOperator('Plazo');
    await prisma.operator.update({ where: { id: test.operator.id }, data: { name: 'Plazo (tests)' } });
    await withListing(test);
    await booking(test, { customerEmail: 'test@example.org' });
    expect((await service.run(NOW)).sent).toBe(0);
    expect(emails()).toHaveLength(0);
  });

  it('« Ne plus recevoir ces messages » : une page avec un bouton, puis plus jamais', async () => {
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    await booking(op);
    await service.run(NOW);
    const url: string = emails()[0].headers['List-Unsubscribe'].slice(1, -1);
    const path = url.replace('https://site.example', '');
    const page = await api().get(path);
    expect(page.status).toBe(200);
    expect(page.text).toContain('Ne plus les recevoir');
    expect((await api().post(path)).status).toBe(200);
    expect(await prisma.travellerEmailOptout.findUnique({ where: { emailHash: welcomeEmailHash('camille@example.org') } })).not.toBeNull();
    expect((await api().get('/api/public/traveller-emails/unsubscribe/abc.def')).status).toBe(404);

    // A new booking of the same address, a year later, stays silent.
    await booking(op, {
      createdAt: new Date(NOW.getTime() + 400 * 86400_000 - 3600_000),
      arrivalAt: new Date(NOW.getTime() + 410 * 86400_000),
      returnAt: new Date(NOW.getTime() + 412 * 86400_000),
    });
    const later = await service.run(new Date(NOW.getTime() + 400 * 86400_000));
    expect(later).toEqual({ sent: 0, skipped: 1, failed: 0 });
  });
});

describe('le test depuis Plateforme › Notifications', () => {
  afterEach(() => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('part vers l’administrateur, depuis l’adresse du service client, au nom du parking choisi', async () => {
    const admin = await setupOperator('Plazo (tests)');
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const res = await api()
      .post('/api/internal/platform/traveller-welcome/test')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ operatorId: op.operator.id });
    expect(res.status).toBe(200);
    expect(res.body.to).toBe(admin.manager.email);
    const sent = fetchMock.mock.calls
      .filter(([u]) => String(u) === BREVO_EMAIL)
      .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, any>)
      .filter(m => (m.tags ?? []).includes('traveller_welcome_test'));
    expect(sent).toHaveLength(1);
    expect(sent[0].to[0].email).toBe(admin.manager.email);
    expect(sent[0].sender.email).toBe('contact@plazo.fr');
    expect(sent[0].subject).toMatch(/^\[Test\] Gérant, installez Plazo/);
    expect(sent[0].htmlContent).toContain('Parking des Cèdres');
    // Nothing recorded, and a loueur cannot use it.
    expect(await prisma.reservation.count()).toBe(0);
    const refused = await api().post('/api/internal/platform/traveller-welcome/test').set('Authorization', `Bearer ${op.token}`).send({});
    expect(refused.status).toBe(403);
  });
});

describe('Plateforme › Mails d’accueil (18/11/2026)', () => {
  afterEach(() => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('liste les mails traités et dit pourquoi les autres réservations ne l’ont pas eu', async () => {
    const admin = await setupOperator('Plazo');
    await prisma.operator.update({ where: { id: admin.operator.id }, data: { name: 'Plazo (tests)' } });
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    // A booking the migration marked on 15/11, before the launch: never shown as « already received ».
    await booking(op, {
      createdAt: new Date('2026-11-10T10:00:00Z'),
      welcomeEmailAt: new Date('2026-11-15T09:00:00Z'),
      welcomeEmailOutcome: 'repeat',
      customerEmail: 'old@example.org',
    });
    await prisma.travellerEmailOptout.deleteMany();
    await booking(op); // sent
    await booking(op, { customerEmail: null, externalReference: '#2' });
    await booking(op, { arrivalAt: new Date(NOW.getTime() - 60_000), customerEmail: 'b@example.org' });
    await booking(admin, { customerEmail: 'test@example.org' }); // the test operator is left out
    const ran = await service.run(NOW);
    expect(ran).toEqual({ sent: 1, skipped: 0, failed: 0 });

    const res = await api().get('/api/internal/platform/traveller-welcome?days=30').set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ bookings: 4, sent: 1, handledNotSent: 0, notCandidate: 3, pending: 0 });
    expect(res.body.reasons).toEqual([
      { reason: 'before_launch', count: 1 },
      { reason: 'no_email', count: 1 },
      { reason: 'arrival_passed', count: 1 },
    ]);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0]).toMatchObject({ traveller: 'Camille M.', email: 'c•••••@example.org', parking: 'Parking des Cèdres', outcome: 'sent' });
    expect(res.body.operators.map((o: { name: string }) => o.name)).toEqual([op.operator.name]);

    const refused = await api().get('/api/internal/platform/traveller-welcome').set('Authorization', `Bearer ${op.token}`);
    expect(refused.status).toBe(403);
  });

  it('« Renvoyer » : le même mail au même voyageur, jamais deux fois de suite ni après le dépôt (24/11/2026)', async () => {
    const admin = await setupOperator('Plazo');
    const op = await setupOperator('Parking Fictif');
    await withListing(op);
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const b = await booking(op);
    expect((await service.run(NOW)).sent).toBe(1);
    const post = (id: string, token = admin.token) =>
      api().post(`/api/internal/platform/traveller-welcome/${id}/resend`).set('Authorization', `Bearer ${token}`);
    expect((await post(b.id, op.token)).status).toBe(403);
    // Just sent: not again within two minutes.
    await prisma.reservation.update({ where: { id: b.id }, data: { welcomeEmailAt: new Date(), arrivalAt: new Date(Date.now() + 86400_000) } });
    expect((await post(b.id)).body.code).toBe('too_soon');
    await prisma.reservation.update({
      where: { id: b.id },
      data: { welcomeEmailAt: new Date(Date.now() - 600_000), arrivalAt: new Date(Date.now() + 86400_000) },
    });
    const before = emails().length;
    const res = await post(b.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ emailSent: true });
    expect(emails().length).toBe(before + 1);
    const list = await api().get('/api/internal/platform/traveller-welcome?days=30').set('Authorization', `Bearer ${admin.token}`);
    expect(list.body.rows[0]).toMatchObject({ outcome: 'sent', canResend: true });
    // The drop-off has passed.
    await prisma.reservation.update({
      where: { id: b.id },
      data: { welcomeEmailAt: new Date(Date.now() - 600_000), arrivalAt: new Date(Date.now() - 60_000) },
    });
    expect((await post(b.id)).body.code).toBe('drop_off_passed');
    expect((await post('cunknownbooking1234')).status).toBe(404);
  });
});
