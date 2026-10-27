import { Container } from 'typedi';
import prisma from '@/database';
import { appLinkCode, appLinkReference, deviceFingerprint, isValidAppLinkCode, platformOf } from '@/domain/app-link';
import { AppLinkService } from '@/services/app-link.service';
import { NotificationService } from '@/services/notification.service';
import {
  api,
  enableFakePayments,
  disableFakePayments,
  bookAndPay,
  onboardOperator,
  publishListing,
  resetDatabase,
  setupOperator,
} from './utils/helpers';

const SECRET = process.env.SECRET_KEY as string;
const notifications = Container.get(NotificationService);
const defaultSettings = { ...notifications.settings };
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36';
const siteHeaders = (ip: string) => ({ 'x-plazo-site-key': 'test-site-key', 'x-plazo-client-ip': ip });

async function bookedReservation() {
  const op = await setupOperator();
  await api()
    .put('/api/internal/pricing')
    .set({ Authorization: `Bearer ${op.token}` })
    .send({
      tiers: [
        { days: 1, priceCents: 1500 },
        { days: 7, priceCents: 5900 },
      ],
      extraDayPriceCents: 600,
    });
  await api()
    .put('/api/internal/listing')
    .set({ Authorization: `Bearer ${op.token}` })
    .send({
      airportCode: 'LYS',
      slug: 'parking-lien',
      title: 'Parking Lien LYS',
      services: ['shuttle'],
      shuttleMinutes: 8,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 00',
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  await publishListing(op.parking.id);
  await onboardOperator(op.operator.id);
  const stripe = enableFakePayments();
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const in6 = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
  const booking = await bookAndPay(
    {
      airport: 'lyon-saint-exupery',
      parking: 'parking-lien',
      arrivalAt: `${in3}T06:30`,
      returnAt: `${in6}T18:00`,
      customerFirstName: 'Léa',
      customerLastName: 'Petit',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'lea.petit@example.com',
      plate: 'AB-123-CD',
      passengers: 2,
      acceptTerms: true,
    },
    stripe.sessions,
  );
  disableFakePayments();
  const record = await prisma.reservation.findFirstOrThrow({ where: { reference: booking.reference } });
  return { op, booking, record };
}

beforeEach(async () => {
  await resetDatabase();
  notifications.settings.publicSiteUrl = 'https://site.example';
});
afterEach(() => {
  Object.assign(notifications.settings, defaultSettings);
});

describe('lien court (domaine)', () => {
  it('forme REF-<8>, vérifié avec le secret et la version du lien', () => {
    const booking = { id: 'ck123', reference: 'R7KQ2M', manageTokenVersion: 0 };
    const code = appLinkCode(booking, 'secret');
    expect(code).toMatch(/^R7KQ2M-[A-Za-z0-9_-]{8}$/);
    expect(appLinkReference(code)).toBe('R7KQ2M');
    expect(appLinkReference('r7kq2m-abcdefgh')).toBe('R7KQ2M');
    expect(appLinkReference('nope')).toBeNull();
    expect(isValidAppLinkCode(booking, code, 'secret')).toBe(true);
    expect(isValidAppLinkCode(booking, code, 'other')).toBe(false);
    expect(isValidAppLinkCode({ ...booking, manageTokenVersion: 1 }, code, 'secret')).toBe(false);
    expect(isValidAppLinkCode(booking, `R7KQ2M-${'x'.repeat(8)}`, 'secret')).toBe(false);
    expect(isValidAppLinkCode({ ...booking, reference: 'OTHER1' }, code, 'secret')).toBe(false);
  });

  it('reconnaît la plateforme du navigateur et hache le téléphone', () => {
    expect(platformOf(IPHONE)).toBe('ios');
    expect(platformOf(PIXEL)).toBe('android');
    expect(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1.15')).toBeNull();
    expect(deviceFingerprint('203.0.113.9', 'ios')).toMatch(/^[a-f0-9]{64}$/);
    expect(deviceFingerprint('203.0.113.9', 'ios')).not.toBe(deviceFingerprint('203.0.113.9', 'android'));
  });
});

describe('GET /public/app-link/:code', () => {
  it('rend la réservation et sa clé pour un code valide, 404 sinon', async () => {
    const { booking, record } = await bookedReservation();
    const code = appLinkCode(record, SECRET);
    expect(notifications.appLinkUrl(record)).toBe(`https://site.example/a/${code}`);
    const res = await api().get(`/api/public/app-link/${code}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      reference: booking.reference,
      manageToken: booking.manageToken,
      firstName: 'Léa',
      parking: { title: 'Parking Lien LYS' },
    });
    expect(res.body.arrivalAt).toMatch(/T06:30$/);
    expect((await api().get(`/api/public/app-link/${booking.reference}-AAAAAAAA`)).status).toBe(404);
    expect((await api().get('/api/public/app-link/garbage')).status).toBe(404);
    // A revoked manage link (new version) revokes the short link too.
    await prisma.reservation.update({ where: { id: record.id }, data: { manageTokenVersion: 1 } });
    expect((await api().get(`/api/public/app-link/${code}`)).status).toBe(404);
  });
});

describe('claim puis resume (téléphone parti au store)', () => {
  it('retrouve la réservation au premier lancement sur le même téléphone, une seule fois', async () => {
    const { booking, record } = await bookedReservation();
    const code = appLinkCode(record, SECRET);
    const claim = await api().post(`/api/public/app-link/${code}/claim`).set(siteHeaders('203.0.113.9')).send({ platform: 'ios' });
    expect(claim.status).toBe(201);
    expect(await prisma.appLinkClaim.count()).toBe(1);
    // Another phone, or the same address on Android: nothing.
    expect((await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.10')).send({ platform: 'ios' })).body).toEqual({
      found: false,
    });
    expect((await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.9')).send({ platform: 'android' })).body).toEqual({
      found: false,
    });
    const found = await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.9')).send({ platform: 'ios' });
    expect(found.body).toMatchObject({
      found: true,
      match: 'device',
      reference: booking.reference,
      manageToken: booking.manageToken,
      firstName: 'Léa',
    });
    // Consumed.
    expect((await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.9')).send({ platform: 'ios' })).body).toEqual({
      found: false,
    });
    expect(await prisma.appLinkClaim.count()).toBe(0);
  });

  it('un code passé par le store (Android) l’emporte, et la purge efface les attentes de plus de 24 h', async () => {
    const { booking, record } = await bookedReservation();
    const code = appLinkCode(record, SECRET);
    const res = await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.9')).send({ platform: 'android', code });
    expect(res.body).toMatchObject({ found: true, match: 'code', reference: booking.reference });
    await api().post(`/api/public/app-link/${code}/claim`).set(siteHeaders('203.0.113.9')).send({ platform: 'android' });
    await prisma.appLinkClaim.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().post('/api/public/app-link/resume').set(siteHeaders('203.0.113.9')).send({ platform: 'android' })).body).toEqual({
      found: false,
    });
    expect(await Container.get(AppLinkService).purge()).toBe(1);
    expect((await api().post(`/api/public/app-link/${code}/claim`).send({ platform: 'web' })).status).toBe(400);
  });
});
