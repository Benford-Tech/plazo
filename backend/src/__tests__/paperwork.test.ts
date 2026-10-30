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
const SLOTS = ['front', 'right', 'back', 'left'];
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
  it("au comptoir avec le code reçu par SMS ; l'appli du voyageur le montre sans le faire signer ; copie envoyée ; une seule signature", async () => {
    const b = await setup();
    const before = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(before.status).toBe(200);
    expect(before.body.contract).toMatchObject({ status: 'unsigned', canSign: false, atCounter: true, phoneMasked: '06 •• •• •• 78' });
    expect(before.body.contract.document.summary).toEqual(expect.arrayContaining(['Client : Camille Martin', 'Clés : confiées au parking']));
    // The contract is signed at the counter (20/10/2026): the traveller's routes refuse, and send nothing.
    for (const path of ['code', 'sign']) {
      const res = await api().post(`/api/public/bookings/${b.reference}/contract/${path}`).set(bookingToken(b.token)).send({ code: '123456' });
      expect([res.status, res.body.code]).toEqual([409, 'contract_at_counter']);
    }
    expect(sentCodes).toEqual([]);

    const staffView = await api().get(`/api/internal/reservations/${b.id}/paperwork`).set(auth(b.op.token));
    expect(staffView.body.contract).toMatchObject({ canSign: true, atCounter: true, codeAvailable: true });
    const code = await api().post(`/api/internal/reservations/${b.id}/contract/code`).set(auth(b.op.token));
    expect(code.status).toBe(200);
    expect(code.body.sentTo).toBe('06 •• •• •• 78');
    // Not a second code within a minute.
    expect((await api().post(`/api/internal/reservations/${b.id}/contract/code`).set(auth(b.op.token))).body.code).toBe('code_recently_sent');

    const ok = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ code: sentCodes[0] });
    expect(ok.status).toBe(200);
    expect(ok.body.contract.status).toBe('signed');
    expect(ok.body.contract.signed).toMatchObject({
      method: 'sms_code',
      device: 'staff_device',
      signerName: 'Camille Martin',
      phoneMasked: '06 •• •• •• 78',
    });
    const row = await prisma.reservationContract.findUniqueOrThrow({ where: { reservationId: b.id } });
    expect(row.text).toContain('Contrat de stationnement');
    expect(row.emailedAt).not.toBeNull();
    // The code is single use, and a contract is signed once.
    const again = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(b.op.token)).send({ code: sentCodes[0] });
    expect(again.body.code).toBe('already_signed');
    const after = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(after.body.contract).toMatchObject({ status: 'signed', canSign: false, atCounter: false });
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
    // Incomplete: the mileage and the fuel are asked for; the photos are optional (30/10/2026).
    const early = await api().post(`${base}/complete`).set(auth(b.op.token));
    expect(early.status).toBe(400);
    expect(Object.keys(early.body.fields)).toEqual(['mileageKm', 'fuelQuarters']);
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
    expect(done.dropoff.photos).toHaveLength(4);
    expect(done.dropoff.damages).toEqual([{ n: 1, x: 0.8, y: 0.2, label: 'Rayure, aile avant droite', photoId: null }]);
    expect(memory.files.size).toBe(4);
    // Locked once completed.
    expect((await api().patch(base).set(auth(b.op.token)).send({ mileageKm: 1 })).body.code).toBe('inspection_completed');

    const seen = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(seen.body.dropoff.photos).toHaveLength(4);
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
    expect(memory.files.size).toBe(12);
    const result = await Container.get(PaperworkService).purge();
    expect(result.photosErased).toBe(4);
    expect(memory.files.size).toBe(8);
    expect((await prisma.vehicleInspection.findFirstOrThrow({ where: { reservationId: quiet.id } })).photosErasedAt).not.toBeNull();
  });
});

describe('les photos du voyageur', () => {
  const mine = (reference: string, kind: string) => `/api/public/bookings/${reference}/inspections/${kind}/mine`;

  it('avant de remettre les clés : photos, mot, envoi ; le parking les voit une fois envoyées, à côté des siennes', async () => {
    const b = await setup();
    const tok = bookingToken(b.token);
    const first = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(tok);
    expect(first.body.travellerCanPhotograph).toEqual({ dropoff: true, return: false });
    expect(first.body.travellerReports).toEqual({ dropoff: null, return: null });
    // The return photos wait for the car to be back at the parking.
    expect((await api().post(mine(b.reference, 'return')).set(tok)).body.code).toBe('inspection_closed');

    expect((await api().post(mine(b.reference, 'dropoff')).set(tok)).status).toBe(200);
    // Nothing to send without a photo.
    expect(
      (
        await api()
          .post(`${mine(b.reference, 'dropoff')}/complete`)
          .set(tok)
      ).body.fields,
    ).toEqual({ photos: 'required' });
    // The six guided slots only: no close-up of a damage, and an image only.
    expect(
      (
        await api()
          .post(`${mine(b.reference, 'dropoff')}/photos?slot=damage`)
          .set(tok)
          .set('Content-Type', 'image/jpeg')
          .send(JPEG)
      ).body.fields,
    ).toEqual({
      slot: 'invalid',
    });
    const text = await api()
      .post(`${mine(b.reference, 'dropoff')}/photos?slot=front`)
      .set(tok)
      .set('Content-Type', 'image/jpeg')
      .send(Buffer.from('hello'));
    expect(text.body.fields).toEqual({ photo: 'not_an_image' });
    let photoId = '';
    for (const slot of ['front', 'right', 'back']) {
      const res = await api()
        .post(`${mine(b.reference, 'dropoff')}/photos?slot=${slot}`)
        .set(tok)
        .set('Content-Type', 'image/jpeg')
        .send(JPEG);
      expect(res.status).toBe(201);
      photoId = res.body.photoId;
    }
    const removed = await api()
      .delete(`${mine(b.reference, 'dropoff')}/photos/${photoId}`)
      .set(tok);
    expect(removed.body.travellerReports.dropoff.photos.map((p: { slot: string }) => p.slot)).toEqual(['front', 'right']);
    const noted = await api()
      .patch(mine(b.reference, 'dropoff'))
      .set(tok)
      .send({ notes: '  Petite rayure déjà présente sur la portière arrière gauche. ' });
    expect(noted.body.travellerReports.dropoff).toMatchObject({
      notes: 'Petite rayure déjà présente sur la portière arrière gauche.',
      editable: true,
    });
    // The draft is the traveller's: the staff does not see it yet, nor its photos.
    const draftFront = noted.body.travellerReports.dropoff.photos[0].id as string;
    const hidden = await api().get(`/api/internal/reservations/${b.id}/paperwork`).set(auth(b.op.token));
    expect(hidden.body.travellerReports.dropoff).toBeNull();
    expect(hidden.body.travellerCanPhotograph).toBeNull();
    expect((await api().get(`/api/internal/reservations/${b.id}/inspections/dropoff/photos/${draftFront}`).set(auth(b.op.token))).status).toBe(404);
    // Their own draft photo comes back to the traveller.
    expect((await api().get(`/api/public/bookings/${b.reference}/inspections/dropoff/photos/${draftFront}`).set(tok)).status).toBe(200);

    const sent = await api()
      .post(`${mine(b.reference, 'dropoff')}/complete`)
      .set(tok);
    expect(sent.status).toBe(200);
    expect(sent.body.travellerReports.dropoff).toMatchObject({ editable: false });
    expect(sent.body.travellerReports.dropoff.completedAt).not.toBeNull();
    expect(sent.body.travellerCanPhotograph.dropoff).toBe(false);
    // Sent: it no longer changes.
    expect((await api().patch(mine(b.reference, 'dropoff')).set(tok).send({ notes: 'autre' })).body.code).toBe('inspection_completed');
    const row = await prisma.vehicleInspection.findFirstOrThrow({ where: { reservationId: b.id, author: 'traveller' } });
    expect(row.proofSha256).toMatch(/^[0-9a-f]{64}$/);

    // The staff takes its own report next to it, and sees the traveller's photos.
    await takeReport(b.op.token, b.id, 'dropoff');
    const both = await api().get(`/api/internal/reservations/${b.id}/paperwork`).set(auth(b.op.token));
    expect(both.body.dropoff.photos).toHaveLength(4);
    expect(both.body.travellerReports.dropoff.photos).toHaveLength(2);
    expect((await api().get(`/api/internal/reservations/${b.id}/inspections/dropoff/photos/${draftFront}`).set(auth(b.op.token))).status).toBe(200);
    // The traveller answers the staff's report, never their own.
    const answer = await api().post(`/api/public/bookings/${b.reference}/inspections/dropoff/answer`).set(tok).send({ decision: 'accepted' });
    expect(answer.body.dropoff.decision).toBe('accepted');
    expect((await prisma.vehicleInspection.findFirstOrThrow({ where: { reservationId: b.id, author: 'traveller' } })).decision).toBe('pending');
  });

  it('au retour, une fois la voiture revenue au parking', async () => {
    const b = await setup('06 98 76 54 32', 'cd456ef');
    await prisma.reservation.update({ where: { id: b.id }, data: { status: 'back_at_parking' } });
    const tok = bookingToken(b.token);
    expect((await api().post(mine(b.reference, 'dropoff')).set(tok)).body.code).toBe('inspection_closed');
    expect((await api().post(mine(b.reference, 'return')).set(tok)).status).toBe(200);
    expect(
      (
        await api()
          .post(`${mine(b.reference, 'return')}/photos?slot=dashboard`)
          .set(tok)
          .set('Content-Type', 'image/jpeg')
          .send(JPEG)
      ).status,
    ).toBe(201);
    expect(
      (
        await api()
          .post(`${mine(b.reference, 'return')}/complete`)
          .set(tok)
      ).body.travellerReports.return.photos,
    ).toHaveLength(1);
    // Someone else's token sees nothing.
    expect((await api().post(mine(b.reference, 'return')).set(bookingToken('nope'))).status).toBe(404);
  });
});
