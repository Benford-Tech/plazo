import { Container } from 'typedi';
import prisma from '@/database';
import { NotificationService } from '@/services/notification.service';
import { PaperworkService } from '@/services/paperwork.service';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { SmsService } from '@/services/sms.service';
import {
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
} from './utils/helpers';

/** « Contrat signé et état des lieux » (19/10/2026, choice A « tout dans les applis »). */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (token: string) => ({ 'x-booking-token': token });
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]);
const SLOTS = ['front', 'right', 'back', 'left', 'dashboard', 'interior'];
const STROKES = [
  [
    [0.1, 0.5],
    [0.2, 0.4],
    [0.3, 0.6],
    [0.4, 0.45],
    [0.5, 0.55],
    [0.6, 0.5],
  ],
];

let stripe: ReturnType<typeof enableFakePayments>;
let memory: MemoryPhotoBackend;
let sentCodes: string[];

beforeEach(async () => {
  await resetDatabase();
  const notifications = Container.get(NotificationService);
  notifications.settings.apiKey = 'brevo-test';
  notifications.settings.emailFrom = 'Plazo <bonjour@example.com>';
  stripe = enableFakePayments();
  jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 201 }));
  memory = new MemoryPhotoBackend();
  Container.get(PhotoStorageService).backend = memory;
  sentCodes = [];
  const sms = Container.get(SmsService);
  jest.spyOn(sms, 'sendSignatureCode').mockImplementation(async (_op, _res, _to, text) => {
    sentCodes.push(/(\d{6})/.exec(text)![1]);
    return true;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  disableFakePayments();
  Container.get(NotificationService).settings.apiKey = '';
});
afterAll(() => prisma.$disconnect());

async function setup(phone = '06 12 34 56 78', plate = 'ab123cd') {
  const op = await setupOperator();
  await onboardOperator(op.operator.id);
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
  await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: `parking-${op.parking.id}`,
      title: 'Parking LYS',
      services: ['shuttle', 'valet'],
      cancellationPolicy: 'free_24h',
      photos: [],
    });
  await publishListing(op.parking.id);
  const res = await api()
    .post('/api/public/bookings')
    .send({
      airport: 'lyon-saint-exupery',
      parking: `parking-${op.parking.id}`,
      arrivalAt: '2027-03-01T06:30',
      returnAt: '2027-03-03T15:05',
      customerName: 'Camille Martin',
      customerPhone: phone,
      customerEmail: `camille${op.parking.id}@example.com`,
      plate,
      passengers: 2,
      acceptTerms: true,
    });
  expect([res.status, res.body.code]).toEqual([201, undefined]);
  await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
  const id = (await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } })).id;
  return { op, reference: res.body.reference as string, token: res.body.manageToken as string, id };
}

async function takeReport(token: string, id: string, kind: 'dropoff' | 'return', extra: Record<string, unknown> = {}) {
  const base = `/api/internal/reservations/${id}/inspections/${kind}`;
  expect((await api().post(base).set(auth(token))).status).toBe(200);
  for (const slot of SLOTS) {
    const res = await api().post(`${base}/photos?slot=${slot}`).set(auth(token)).set('Content-Type', 'image/jpeg').send(JPEG);
    expect(res.status).toBe(201);
  }
  const patch = await api()
    .patch(base)
    .set(auth(token))
    .send({ mileageKm: 48215, fuelQuarters: 3, damages: [{ x: 0.8, y: 0.2, label: 'Rayure, aile avant droite' }], ...extra });
  expect(patch.status).toBe(200);
  const done = await api().post(`${base}/complete`).set(auth(token));
  expect(done.status).toBe(200);
  return done.body;
}

describe('contrat', () => {
  it('le voyageur signe avec le code reçu par SMS ; copie envoyée ; une seule signature', async () => {
    const b = await setup();
    const before = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(before.status).toBe(200);
    expect(before.body.contract).toMatchObject({ status: 'unsigned', canSign: true, codeAvailable: true, phoneMasked: '06 •• •• •• 78' });
    expect(before.body.contract.document.summary).toEqual(expect.arrayContaining(['Client : Camille Martin', 'Clés : confiées au parking']));

    const code = await api().post(`/api/public/bookings/${b.reference}/contract/code`).set(bookingToken(b.token));
    expect(code.status).toBe(200);
    expect(code.body.sentTo).toBe('06 •• •• •• 78');
    // Not a second code within a minute.
    expect((await api().post(`/api/public/bookings/${b.reference}/contract/code`).set(bookingToken(b.token))).body.code).toBe('code_recently_sent');

    const wrong = sentCodes[0] === '000000' ? '111111' : '000000';
    const bad = await api().post(`/api/public/bookings/${b.reference}/contract/sign`).set(bookingToken(b.token)).send({ code: wrong });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ code: 'wrong_code' });

    const ok = await api().post(`/api/public/bookings/${b.reference}/contract/sign`).set(bookingToken(b.token)).send({ code: sentCodes[0] });
    expect(ok.status).toBe(200);
    expect(ok.body.contract.status).toBe('signed');
    expect(ok.body.contract.signed).toMatchObject({
      method: 'sms_code',
      device: 'traveller_app',
      signerName: 'Camille Martin',
      phoneMasked: '06 •• •• •• 78',
    });
    const row = await prisma.reservationContract.findUniqueOrThrow({ where: { reservationId: b.id } });
    expect(row.text).toContain('Contrat de stationnement');
    expect(row.emailedAt).not.toBeNull();
    // The code is single use, and a contract is signed once.
    const again = await api().post(`/api/public/bookings/${b.reference}/contract/sign`).set(bookingToken(b.token)).send({ code: sentCodes[0] });
    expect(again.body.code).toBe('already_signed');
    // Without the booking's token, nothing.
    expect((await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken('nope'))).status).toBe(404);
  });

  it('au comptoir : signature manuscrite sur le téléphone du parking', async () => {
    const b = await setup();
    const none = await api()
      .post(`/api/internal/reservations/${b.id}/contract/sign`)
      .set(auth(b.op.token))
      .send({ strokes: [[[0.1, 0.1]]] });
    expect(none.status).toBe(400);
    expect(none.body.fields).toEqual({ strokes: 'required' });
    const ok = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ strokes: STROKES });
    expect(ok.status).toBe(200);
    expect(ok.body.contract.signed).toMatchObject({ method: 'handwritten', device: 'staff_device' });
    // Another operator never sees it.
    const other = await setupOperator('Autre');
    expect((await api().get(`/api/internal/reservations/${b.id}/paperwork`).set(auth(other.token))).status).toBe(404);
  });

  it('un code faux cinq fois bloque ce code ; un code expiré est refusé', async () => {
    const b = await setup();
    await api().post(`/api/internal/reservations/${b.id}/contract/code`).set(auth(b.op.token));
    const wrong = sentCodes[0] === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i += 1) {
      const res = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ code: wrong });
      expect(res.status).toBe(400);
    }
    const locked = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ code: sentCodes[0] });
    expect(locked.body.code).toBe('code_locked');
    await prisma.signatureCode.updateMany({ data: { attempts: 0, expiresAt: new Date(Date.now() - 1000) } });
    const expired = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ code: sentCodes[0] });
    expect(expired.body.code).toBe('code_expired');
  });
});

describe('état des lieux', () => {
  it('dépôt : photos guidées, dégâts, kilométrage ; le voyageur le voit une fois terminé et le valide', async () => {
    const b = await setup();
    const base = `/api/internal/reservations/${b.id}/inspections/dropoff`;
    await api().post(base).set(auth(b.op.token));
    // Incomplete: every guided photo, mileage and fuel are asked for.
    const early = await api().post(`${base}/complete`).set(auth(b.op.token));
    expect(early.status).toBe(400);
    expect(Object.keys(early.body.fields)).toEqual([...SLOTS, 'mileageKm', 'fuelQuarters']);
    // The traveller sees nothing of a draft.
    expect((await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token))).body.dropoff).toBeNull();
    const notImage = await api()
      .post(`${base}/photos?slot=front`)
      .set(auth(b.op.token))
      .set('Content-Type', 'image/jpeg')
      .send(Buffer.from('bonjour, pas une image'));
    expect(notImage.body.fields).toEqual({ photo: 'not_an_image' });

    const done = await takeReport(b.op.token, b.id, 'dropoff');
    expect(done.dropoff).toMatchObject({ editable: false, mileageKm: 48215, fuelQuarters: 3, decision: 'pending', canAnswer: true });
    expect(done.dropoff.photos).toHaveLength(6);
    expect(done.dropoff.damages).toEqual([{ n: 1, x: 0.8, y: 0.2, label: 'Rayure, aile avant droite', photoId: null }]);
    expect(memory.files.size).toBe(6);
    // Locked once completed.
    expect((await api().patch(base).set(auth(b.op.token)).send({ mileageKm: 1 })).body.code).toBe('inspection_completed');

    const seen = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(seen.body.dropoff.photos).toHaveLength(6);
    const photo = await api()
      .get(`/api/public/bookings/${b.reference}/inspections/dropoff/photos/${seen.body.dropoff.photos[0].id}`)
      .set(bookingToken(b.token));
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toBe('image/jpeg');
    expect(Buffer.compare(photo.body as Buffer, JPEG)).toBe(0);

    const answered = await api()
      .post(`/api/public/bookings/${b.reference}/inspections/dropoff/answer`)
      .set(bookingToken(b.token))
      .send({ decision: 'accepted' });
    expect(answered.status).toBe(200);
    expect(answered.body.dropoff).toMatchObject({
      decision: 'accepted',
      decisionMethod: 'booking_link',
      decisionDevice: 'traveller_app',
      canAnswer: false,
    });
    const twice = await api()
      .post(`/api/public/bookings/${b.reference}/inspections/dropoff/answer`)
      .set(bookingToken(b.token))
      .send({ decision: 'accepted' });
    expect(twice.body.code).toBe('answer_closed');
  });

  it('sans réponse avant le départ en navette, le dépôt vaut accord', async () => {
    const b = await setup();
    await takeReport(b.op.token, b.id, 'dropoff');
    await prisma.reservation.update({ where: { id: b.id }, data: { status: 'shuttled_out' } });
    const res = await api().get(`/api/internal/reservations/${b.id}/paperwork`).set(auth(b.op.token));
    expect(res.body.dropoff).toMatchObject({ decision: 'accepted_by_default', canAnswer: false });
  });

  it('retour : comparaison avec le dépôt, réserve signée sur le téléphone du parking', async () => {
    const b = await setup();
    await takeReport(b.op.token, b.id, 'dropoff');
    await prisma.reservation.update({ where: { id: b.id }, data: { status: 'back_at_parking' } });
    await takeReport(b.op.token, b.id, 'return', {
      mileageKm: 48221,
      damages: [
        { x: 0.8, y: 0.2, label: 'Rayure, aile avant droite' },
        { x: 0.2, y: 0.9, label: 'Rétroviseur gauche fendu' },
      ],
    });
    const base = `/api/internal/reservations/${b.id}/inspections/return`;
    const noReason = await api().post(`${base}/answer`).set(auth(b.op.token)).send({ decision: 'reserved', strokes: STROKES });
    expect(noReason.body.fields).toEqual({ reserveText: 'required' });
    const res = await api()
      .post(`${base}/answer`)
      .set(auth(b.op.token))
      .send({ decision: 'reserved', reserveText: 'Le rétroviseur était intact au dépôt.', strokes: STROKES });
    expect(res.status).toBe(200);
    expect(res.body.return).toMatchObject({ decision: 'reserved', decisionMethod: 'handwritten', decisionDevice: 'staff_device' });
    expect(res.body.comparison).toMatchObject({ mileageDeltaKm: 6, fuelDeltaQuarters: 0 });
    expect(res.body.comparison.after).toHaveLength(2);
    const row = await prisma.vehicleInspection.findFirstOrThrow({ where: { reservationId: b.id, kind: 'return' } });
    expect(row.proofSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('une photo guidée reprise remplace la précédente ; sans stockage, 503', async () => {
    const b = await setup();
    const base = `/api/internal/reservations/${b.id}/inspections/dropoff`;
    await api().post(base).set(auth(b.op.token));
    await api().post(`${base}/photos?slot=front`).set(auth(b.op.token)).set('Content-Type', 'image/jpeg').send(JPEG);
    const again = await api().post(`${base}/photos?slot=front`).set(auth(b.op.token)).set('Content-Type', 'image/jpeg').send(JPEG);
    expect(again.body.paperwork.dropoff.photos).toHaveLength(1);
    expect(memory.files.size).toBe(1);
    Container.get(PhotoStorageService).backend = null;
    const off = await api().post(`${base}/photos?slot=back`).set(auth(b.op.token)).set('Content-Type', 'image/jpeg').send(JPEG);
    expect(off.status).toBe(503);
    expect(off.body.code).toBe('photos_unavailable');
  });

  it('les photos sont effacées 90 jours après le retour, 365 avec une réserve', async () => {
    const quiet = await setup();
    const disputed = await setup('06 98 76 54 32', 'gh456jk');
    await takeReport(quiet.op.token, quiet.id, 'dropoff');
    await takeReport(disputed.op.token, disputed.id, 'dropoff');
    await prisma.reservation.update({ where: { id: disputed.id }, data: { status: 'back_at_parking' } });
    await takeReport(disputed.op.token, disputed.id, 'return');
    await api()
      .post(`/api/internal/reservations/${disputed.id}/inspections/return/answer`)
      .set(auth(disputed.op.token))
      .send({ decision: 'reserved', reserveText: 'Rayure nouvelle', strokes: STROKES });
    const longAgo = new Date(Date.now() - 100 * 86400000);
    await prisma.reservation.updateMany({
      where: { id: { in: [quiet.id, disputed.id] } },
      data: { returnAt: longAgo, arrivalAt: new Date(longAgo.getTime() - 86400000) },
    });
    expect(memory.files.size).toBe(18);
    const result = await Container.get(PaperworkService).purge();
    expect(result.photosErased).toBe(6);
    expect(memory.files.size).toBe(12);
    expect((await prisma.vehicleInspection.findFirstOrThrow({ where: { reservationId: quiet.id } })).photosErasedAt).not.toBeNull();
  });
});
