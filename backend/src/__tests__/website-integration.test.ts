import { spawnSync } from 'child_process';
import { inflateRawSync } from 'zlib';
import prisma from '@/database';
import { addDays, localDate } from '@/domain/time';
import { buildZip } from '@/services/wordpress-plugin.service';
import { PLUGIN_FILES } from '@/wordpress/plugin-files.generated';
import { api, resetDatabase, setupOperator } from './utils/helpers';

// Site du parking (19/11/2026, niveau 2 « l'extension WordPress Plazo »). Fictional parkings and travellers only.

type Op = Awaited<ReturnType<typeof setupOperator>>;
let loueur: Op;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** A day in N days, local to Paris, « YYYY-MM-DD ». */
const inDays = (n: number) => addDays(localDate(new Date(), 'Europe/Paris'), n);

async function key(op: Op = loueur): Promise<string> {
  const res = await api().post('/api/internal/website-integration/key').set(auth(op.token));
  expect(res.status).toBe(200);
  return res.body.data.key as string;
}

const booking = (overrides: Record<string, unknown> = {}) => ({
  arrivalAt: `${inDays(5)}T07:30`,
  returnAt: `${inDays(9)}T21:40`,
  firstName: 'Camille',
  lastName: 'Exemple',
  phone: '06 12 34 56 78',
  email: 'camille@exemple.example',
  plate: 'AB-123-CD',
  returnFlight: 'TO 3627',
  passengers: 2,
  message: 'Arrivée avec deux valises',
  ...overrides,
});

beforeEach(async () => {
  await resetDatabase();
  loueur = await setupOperator('Cèdres');
  await prisma.pricingTier.createMany({
    data: [
      { parkingId: loueur.parking.id, days: 3, priceCents: 3000 },
      { parkingId: loueur.parking.id, days: 7, priceCents: 5400 },
    ],
  });
});
afterAll(() => prisma.$disconnect());

describe('Site du parking : la clé', () => {
  it('créée par un gérant, montrée une fois, remplacée par une nouvelle', async () => {
    const empty = await api().get('/api/internal/website-integration').set(auth(loueur.token));
    expect(empty.body.data).toMatchObject({ connected: false, keyPrefix: null });
    const first = await key();
    expect(first).toMatch(/^plz_site_/);
    const view = await api().get('/api/internal/website-integration').set(auth(loueur.token));
    expect(view.body.data).toMatchObject({ connected: true, keyPrefix: first.slice(0, 15) });
    expect(JSON.stringify(view.body)).not.toContain(first);
    const second = await key();
    expect((await api().get('/api/public/site/status').set('X-Plazo-Site-Key', first)).status).toBe(401);
    const ok = await api().get('/api/public/site/status').set('X-Plazo-Site-Key', second);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ connected: true, parkingName: 'Cèdres LYS' });
    await api().delete('/api/internal/website-integration').set(auth(loueur.token));
    expect((await api().get('/api/public/site/status').set('X-Plazo-Site-Key', second)).status).toBe(401);
  });
});

describe('Site du parking : places, prix et réservation', () => {
  it('le prix de la grille et les places du séjour', async () => {
    const k = await key();
    const res = await api()
      .get('/api/public/site/quote')
      .set('X-Plazo-Site-Key', k)
      .query({ arrivalAt: `${inDays(5)}T07:30`, returnAt: `${inDays(9)}T21:40` });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ available: true, reason: null, days: 5, priceCents: 5400 });
    const bad = await api()
      .get('/api/public/site/quote')
      .set('X-Plazo-Site-Key', k)
      .query({ arrivalAt: `${inDays(5)}T07:30`, returnAt: `${inDays(4)}T07:30` });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ returnAt: 'return_before_arrival' });
    const long = await api()
      .get('/api/public/site/quote')
      .set('X-Plazo-Site-Key', k)
      .query({ arrivalAt: `${inDays(5)}T07:30`, returnAt: `${inDays(20)}T07:30` });
    expect(long.body).toMatchObject({ available: false, reason: 'no_price', priceCents: null });
  });

  it('crée la réservation au canal « Site du parking », au prix de la grille, à payer au parking', async () => {
    const k = await key();
    const res = await api()
      .post('/api/public/site/bookings')
      .set('X-Plazo-Site-Key', k)
      .set('X-Plazo-Site-Url', 'https://parking-des-cedres.example/')
      .send(booking());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ duplicate: false, priceCents: 5400 });
    const created = await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } });
    expect(created).toMatchObject({
      operatorId: loueur.operator.id,
      channel: 'website',
      channelDetail: null,
      customerFirstName: 'Camille',
      customerLastName: 'Exemple',
      customerPhone: '06 12 34 56 78',
      plate: 'AB-123-CD',
      returnFlight: 'TO 3627',
      passengers: 2,
      priceCents: 5400,
      paymentMethod: null,
      status: 'upcoming',
    });
    expect(created.notes).toContain('Arrivée avec deux valises');
    const view = await api().get('/api/internal/website-integration').set(auth(loueur.token));
    expect(view.body.data).toMatchObject({ siteHost: 'parking-des-cedres.example' });
    expect(view.body.data.lastBookingAt).not.toBeNull();

    // Sent twice (a double click): the same booking, not a second one.
    const again = await api().post('/api/public/site/bookings').set('X-Plazo-Site-Key', k).send(booking());
    expect(again.body).toMatchObject({ reference: res.body.reference, duplicate: true });
    expect(await prisma.reservation.count({ where: { operatorId: loueur.operator.id } })).toBe(1);
  });

  it('refuse une nuit complète, un champ manquant, une clé inconnue et un loueur suspendu', async () => {
    const k = await key();
    await prisma.parking.update({ where: { id: loueur.parking.id }, data: { totalCapacity: 1, safetyMarginPct: 0 } });
    expect((await api().post('/api/public/site/bookings').set('X-Plazo-Site-Key', k).send(booking())).status).toBe(201);
    const full = await api()
      .post('/api/public/site/bookings')
      .set('X-Plazo-Site-Key', k)
      .send(booking({ phone: '06 98 76 54 32', plate: 'EF-456-GH', lastName: 'Autre' }));
    expect(full.status).toBe(409);
    expect(full.body.code).toBe('full');
    const quote = await api()
      .get('/api/public/site/quote')
      .set('X-Plazo-Site-Key', k)
      .query({ arrivalAt: `${inDays(5)}T07:30`, returnAt: `${inDays(9)}T21:40` });
    expect(quote.body).toMatchObject({ available: false, reason: 'full' });

    const missing = await api()
      .post('/api/public/site/bookings')
      .set('X-Plazo-Site-Key', k)
      .send(booking({ phone: '', firstName: '' }));
    expect(missing.status).toBe(400);
    expect(missing.body.fields).toEqual({ phone: 'required', firstName: 'required' });
    expect((await api().post('/api/public/site/bookings').set('X-Plazo-Site-Key', 'plz_site_nope').send(booking())).status).toBe(401);
    expect((await api().post('/api/public/site/bookings').send(booking())).status).toBe(401);

    await prisma.operator.update({ where: { id: loueur.operator.id }, data: { status: 'suspended', suspendedAt: new Date() } });
    const suspended = await api().get('/api/public/site/status').set('X-Plazo-Site-Key', k);
    expect(suspended.status).toBe(403);
    expect(suspended.body.code).toBe('operator_inactive');
  });

  it('une clé ne voit que son parking', async () => {
    const autre = await setupOperator('Autre');
    const k = await key(autre);
    expect((await api().get('/api/public/site/status').set('X-Plazo-Site-Key', k)).body.parkingName).toBe('Autre LYS');
    await api()
      .post('/api/public/site/bookings')
      .set('X-Plazo-Site-Key', k)
      .send(booking({ arrivalAt: `${inDays(5)}T07:30`, returnAt: `${inDays(6)}T07:30` }));
    expect(await prisma.reservation.count({ where: { operatorId: loueur.operator.id } })).toBe(0);
  });
});

describe("Site du parking : l'extension", () => {
  it('se télécharge en .zip lisible, dossier plazo/', async () => {
    const res = await api()
      .get('/api/public/site/wordpress-plugin.zip')
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/zip');
    const zip = res.body as Buffer;
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    // First entry: name then its deflated data, which inflates back to the file.
    const nameLength = zip.readUInt16LE(26);
    const size = zip.readUInt32LE(18);
    const name = zip.subarray(30, 30 + nameLength).toString('utf8');
    expect(name.startsWith('plazo/')).toBe(true);
    const data = inflateRawSync(zip.subarray(30 + nameLength, 30 + nameLength + size)).toString('utf8');
    expect(data).toBe(PLUGIN_FILES[name.slice('plazo/'.length)]);
    expect(zip.includes(Buffer.from('plazo/plazo.php'))).toBe(true);
  });

  it('le zip écrit son répertoire central', () => {
    const zip = buildZip([['a.txt', Buffer.from('bonjour')]]);
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
    expect(zip.readUInt16LE(zip.length - 12)).toBe(1);
  });
});

describe("Site du parking : la copie de l'extension", () => {
  it('src/wordpress/plugin-files.generated.ts suit wordpress-plugin/plazo', () => {
    const run = spawnSync(process.execPath, ['tools/sync-wordpress-plugin.mjs', '--check'], { cwd: `${__dirname}/../..`, encoding: 'utf8' });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
  });
});
