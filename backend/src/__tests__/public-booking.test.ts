import { Container } from 'typedi';
import prisma from '@/database';
import { manageToken } from '@/domain/booking';
import { localDateTime, parseInstant } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';
import {
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

const TZ = 'Europe/Paris';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const notifications = Container.get(NotificationService);
const defaultSettings = { ...notifications.settings };

// Local parking time, relative to now: tests do not depend on today's date.
const inHours = (hours: number) => localDateTime(new Date(Date.now() + hours * 3600000), TZ);
const inDays = (days: number, time: string) => `${inHours(days * 24).slice(0, 10)}T${time}`;
const shift = (local: string, hours: number) => localDateTime(new Date(parseInstant(local, TZ)!.getTime() + hours * 3600000), TZ);

const grid = {
  tiers: [
    { days: 1, priceCents: 1500 },
    { days: 3, priceCents: 3499 },
    { days: 7, priceCents: 5900 },
  ],
  extraDayPriceCents: 600,
};

async function publishedParking(options: { slug?: string; policy?: string; capacity?: number; published?: boolean; pricing?: unknown } = {}) {
  const op = await setupOperator();
  await api()
    .put('/api/internal/pricing')
    .set(auth(op.token))
    .send(options.pricing ?? grid);
  const res = await api()
    .put('/api/internal/listing')
    .set(auth(op.token))
    .send({
      airportCode: 'LYS',
      slug: options.slug ?? 'parking-demo',
      title: 'Parking Démo LYS',
      services: ['shuttle'],
      shuttleMinutes: 8,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 00',
      cancellationPolicy: options.policy ?? 'free_24h',
      photos: [],
    });
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  if (options.published ?? true) await publishListing(op.parking.id);
  await onboardOperator(op.operator.id);
  if (options.capacity) await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: options.capacity, safetyMarginPct: 0 } });
  return op;
}

const traveller = {
  customerName: 'Camille Martin',
  customerPhone: '06 12 34 56 78',
  customerEmail: 'Camille.Martin@Example.com',
  plate: 'gk318px',
};

const bookingBody = (overrides: Record<string, unknown> = {}) => ({
  airport: 'lyon-saint-exupery',
  parking: 'parking-demo',
  arrivalAt: inDays(5, '06:30'),
  returnAt: inDays(7, '15:05'),
  ...traveller,
  returnFlight: 'to3627',
  passengers: 2,
  acceptTerms: true,
  ...overrides,
});

/** The booking form sent (the place is held until the payment). */
const hold = (overrides: Record<string, unknown> = {}) => api().post('/api/public/bookings').send(bookingBody(overrides));
/** A booking made and paid, as every confirmed Plazo booking: the creation's response with the paid booking. */
async function book(overrides: Record<string, unknown> = {}) {
  const res = await hold(overrides);
  if (res.status !== 201 && res.status !== 200) return res;
  await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
  const paid = await api().get(`/api/public/bookings/${res.body.reference}`).set(token(res.body.manageToken));
  res.body.booking = paid.body;
  return res;
}
const token = (value: string) => ({ 'x-booking-token': value });

let fetchMock: jest.SpyInstance;

let stripe: ReturnType<typeof enableFakePayments>;
beforeEach(async () => {
  await resetDatabase();
  Object.assign(notifications.settings, defaultSettings, { apiKey: '' });
  stripe = enableFakePayments();
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  disableFakePayments();
});
afterAll(() => prisma.$disconnect());

describe('réservation sur le site', () => {
  it('enregistre la réservation au prix recalculé par le serveur, canal plazo', async () => {
    const { token: staffToken, operator } = await publishedParking();
    const res = await book({ priceCents: 1, customerNote: '  Poussette et 2 enfants ', vehicleModel: 'Peugeot 308', vehicleColour: 'grise' });
    expect(res.status).toBe(201);
    expect(res.body.reference).toMatch(/^R[A-HJ-NP-Z2-9]{5}$/);
    expect(res.body.manageToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(res.body.booking).toEqual({
      reference: res.body.reference,
      status: 'upcoming',
      paymentMode: 'online',
      payment: { status: 'paid', holdExpiresAt: null, holdSecondsLeft: null },
      parking: {
        title: 'Parking Démo LYS',
        slug: 'parking-demo',
        airport: { slug: 'lyon-saint-exupery', name: 'Lyon Saint-Exupéry' },
        address: null,
        shuttleMinutes: 8,
        openingHours: '24h/24',
        phone: '04 72 00 00 00',
        meetingLabel: null,
        meetingInstructions: null,
      },
      arrivalAt: inDays(5, '06:30'),
      returnAt: inDays(7, '15:05'),
      days: 3,
      priceCents: 3499,
      customerName: 'Camille Martin',
      customerEmail: 'camille.martin@example.com',
      customerPhone: '06 12 34 56 78',
      plate: 'GK-318-PX',
      returnFlight: 'TO 3627',
      departureFlight: null,
      customerNote: 'Poussette et 2 enfants',
      vehicle: { model: 'Peugeot 308', colour: 'grise' },
      outbound: null,
      car: null,
      passengers: 2,
      cancellationPolicy: 'free_24h',
      cancellableUntil: shift(inDays(5, '06:30'), -24),
      canCancel: true,
      canEditFlight: true,
    });

    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } });
    expect(saved).toMatchObject({
      operatorId: operator.id,
      channel: 'plazo',
      status: 'upcoming',
      priceCents: 3499,
      createdById: null,
      overbooked: false,
      cancellationPolicy: 'free_24h',
    });
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { entityId: saved.id } });
    expect(audit).toMatchObject({ action: 'reservation.created', staffId: null, operatorId: operator.id });

    // The token opens the booking; the operator sees it in the pro space.
    const read = await api().get(`/api/public/bookings/${res.body.reference}`).set(token(res.body.manageToken));
    expect(read.status).toBe(200);
    expect(read.body).toEqual(res.body.booking);
    const list = await api().get(`/api/internal/reservations?q=${res.body.reference}`).set(auth(staffToken));
    expect(list.body.docs).toEqual([expect.objectContaining({ channel: 'plazo', priceCents: 3499 })]);
  });

  it('valide les champs', async () => {
    await publishedParking();
    const empty = await api().post('/api/public/bookings').send({});
    expect(empty.status).toBe(400);
    expect(empty.body.code).toBe('validation_failed');
    expect(empty.body.fields).toEqual({
      airport: 'required',
      parking: 'required',
      arrivalAt: 'required',
      returnAt: 'required',
      customerName: 'required',
      customerPhone: 'required',
      customerEmail: 'required',
      plate: 'required',
      passengers: 'required',
      acceptTerms: 'terms_required',
    });
    const bad = await book({ customerEmail: 'pas-un-email', customerPhone: 'abc', plate: '!', passengers: 12, arrivalAt: 'demain' });
    expect(bad.body.fields).toEqual({
      customerEmail: 'invalid_email',
      customerPhone: 'invalid_phone',
      plate: 'invalid_plate',
      passengers: 'passengers_range',
      arrivalAt: 'invalid_datetime',
    });
    expect((await book({ returnFlight: 'xx' })).body.fields).toEqual({ returnFlight: 'invalid_flight' });
    expect((await book({ returnAt: inDays(4, '10:00') })).body.fields).toEqual({ returnAt: 'return_before_arrival' });
    expect((await book({ arrivalAt: inHours(-48), returnAt: inDays(2, '10:00') })).body.fields).toEqual({ arrivalAt: 'arrival_in_past' });
    expect((await book({ returnAt: inDays(120, '10:00') })).body.fields).toEqual({ returnAt: 'stay_too_long' });
    // Dates that do not exist are refused, not rolled over to another day.
    const year = Number(inDays(5, '06:30').slice(0, 4)) + 1;
    expect((await book({ arrivalAt: `${year}-02-30T08:00`, returnAt: `${year}-03-04T08:00` })).body.fields).toEqual({
      arrivalAt: 'invalid_datetime',
    });
    expect((await book({ returnAt: `${inDays(7, '00:00').slice(0, 10)}T25:00` })).body.fields).toEqual({ returnAt: 'invalid_datetime' });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('exige l’acceptation des conditions', async () => {
    await publishedParking();
    for (const acceptTerms of [false, 'true', undefined]) {
      const res = await book({ acceptTerms });
      expect(res.status).toBe(400);
      expect(res.body.fields).toEqual({ acceptTerms: 'terms_required' });
    }
  });

  it('refuse une nuit complète, sans jamais surréserver', async () => {
    const { token: staffToken } = await publishedParking({ capacity: 1 });
    const staff = await api()
      .post('/api/internal/reservations')
      .set(auth(staffToken))
      .send({
        channel: 'phone',
        arrivalAt: inDays(6, '08:00'),
        returnAt: inDays(6, '20:00'),
        passengers: 1,
        customerName: 'X',
        customerPhone: '0600000000',
        plate: 'AB123CD',
      });
    expect(staff.status).toBe(201);

    const res = await book();
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: 'overbooked', details: { fullNights: [inDays(6, '00:00').slice(0, 10)] } });
    expect(await prisma.reservation.count({ where: { channel: 'plazo' } })).toBe(0);
    // A stay on other nights is still possible.
    expect((await book({ arrivalAt: inDays(8, '06:30'), returnAt: inDays(9, '10:00') })).status).toBe(201);
  });

  it('ne donne la dernière place qu’à une seule de deux réservations simultanées', async () => {
    await publishedParking({ capacity: 1 });
    const results = await Promise.all([book(), book({ customerName: 'Autre voyageur', plate: 'AA111AA' }), book({ plate: 'BB222BB' })]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409, 409]);
    expect(await prisma.reservation.count()).toBe(1);
  });

  it('répond 404 pour un parking non publié ou inconnu, 409 sans tarif', async () => {
    await publishedParking({ published: false });
    expect((await book()).body).toMatchObject({ code: 'not_found' });
    expect((await book()).status).toBe(404);
    expect((await book({ airport: 'inconnu' })).status).toBe(404);

    await publishedParking({ slug: 'sans-long-sejour', pricing: { tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: null } });
    const res = await book({ parking: 'sans-long-sejour' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('no_price');
  });

  it('refuse le canal plazo aux réservations du personnel', async () => {
    const { token: staffToken } = await publishedParking();
    const res = await api()
      .post('/api/internal/reservations')
      .set(auth(staffToken))
      .send({
        channel: 'plazo',
        arrivalAt: inDays(6, '08:00'),
        returnAt: inDays(6, '20:00'),
        passengers: 1,
        customerName: 'X',
        customerPhone: '0600000000',
        plate: 'AB123CD',
      });
    expect(res.body.fields).toEqual({ channel: 'invalid_channel' });

    const booked = await book();
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: booked.body.reference } });
    const edit = await api().patch(`/api/internal/reservations/${saved.id}`).set(auth(staffToken)).send({ channel: 'phone' });
    expect(edit.body.fields).toEqual({ channel: 'invalid_channel' });
    const keep = await api().patch(`/api/internal/reservations/${saved.id}`).set(auth(staffToken)).send({ channel: 'plazo', passengers: 3 });
    expect(keep.status).toBe(200);
  });
});

describe('abus et doublons', () => {
  it('n’accepte qu’un nom de personne (ni lien, ni caractère de contrôle) : il figure dans les emails', async () => {
    await publishedParking();
    for (const customerName of [
      'Bonjour, votre compte est suspendu, allez sur http://evil.example',
      'www.evil.example',
      'evil.com',
      'Camille\u0000Martin',
      'Camille\nMartin',
      '<b>Camille</b>',
      '0612345678',
    ]) {
      const res = await book({ customerName });
      expect(res.status).toBe(400);
      expect(res.body.fields).toEqual({ customerName: 'invalid_name' });
    }
    for (const [i, customerName] of ['Jean-Luc O’Neil', 'J. Dupont', "Zoé  d'Arcy", 'Łukasz Żółć'].entries()) {
      const res = await book({ customerName, plate: `AA${i}11AA`, customerEmail: `n${i}@example.com`, customerPhone: `060000000${i}` });
      expect(res.status).toBe(201);
    }
    // Spaces are collapsed.
    expect(await prisma.reservation.count({ where: { customerName: "Zoé d'Arcy" } })).toBe(1);
  });

  it('refuse un deuxième séjour du même véhicule aux mêmes dates', async () => {
    await publishedParking();
    expect((await book()).status).toBe(201);
    const again = await book({ plate: 'GK 318 PX', arrivalAt: inDays(6, '10:00'), returnAt: inDays(9, '10:00') });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('duplicate_booking');
    // Other dates are fine.
    expect((await book({ arrivalAt: inDays(10, '06:30'), returnAt: inDays(12, '10:00') })).status).toBe(201);
  });

  it('limite à 3 réservations en cours par email et par téléphone', async () => {
    await publishedParking();
    for (const plate of ['AA111AA', 'BB222BB', 'CC333CC']) expect((await book({ plate })).status).toBe(201);
    const byEmail = await book({ plate: 'DD444DD', customerPhone: '07 00 00 00 01' });
    expect(byEmail.status).toBe(409);
    expect(byEmail.body.code).toBe('too_many_bookings');
    // Same phone written differently, other email.
    const byPhone = await book({ plate: 'DD444DD', customerEmail: 'autre@example.com', customerPhone: '+33 6 12 34 56 78' });
    expect(byPhone.body.code).toBe('too_many_bookings');
    // A cancelled booking no longer counts.
    const first = await prisma.reservation.findFirstOrThrow({ where: { plateKey: 'AA111AA' } });
    await prisma.reservation.update({ where: { id: first.id }, data: { status: 'cancelled' } });
    expect((await book({ plate: 'DD444DD' })).status).toBe(201);
  });

  it('un même formulaire envoyé deux fois ne réserve qu’une place', async () => {
    const op = await publishedParking();
    await useBrevoSms(op.operator.id);
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'reservations@example.com' });
    const idempotencyKey = '6f1c2a9e-3b7d-4e8f-9a0b-1c2d3e4f5a6b';
    const first = await book({ idempotencyKey });
    expect(first.status).toBe(201);
    const sends = fetchMock.mock.calls.length;
    const retry = await book({ idempotencyKey });
    expect(retry.status).toBe(200);
    expect(retry.body).toEqual(first.body);
    // At the same time, too.
    const [a, b] = await Promise.all([
      book({ idempotencyKey: 'b'.repeat(36), plate: 'BB222BB' }),
      book({ idempotencyKey: 'b'.repeat(36), plate: 'BB222BB' }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(a.body.reference).toBe(b.body.reference);
    expect(await prisma.reservation.count()).toBe(2);
    // No second confirmation for a replay.
    expect(fetchMock.mock.calls.length).toBe(sends + 2);
    expect((await book({ idempotencyKey: 'court' })).body.fields).toEqual({ idempotencyKey: 'invalid_idempotency_key' });
  });

  it('n’envoie de SMS qu’aux mobiles français', async () => {
    await publishedParking();
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'reservations@example.com' });
    expect((await book({ customerPhone: '+44 7911 123456' })).status).toBe(201);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['https://api.brevo.com/v3/smtp/email']);
  });
});

describe('lien de gestion', () => {
  it('le personnel peut révoquer un lien : l’ancien ne marche plus, « Ma réservation » en donne un nouveau', async () => {
    const { token: staffToken } = await publishedParking();
    const { body } = await book();
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: body.reference } });
    const revoke = await api().post(`/api/internal/reservations/${saved.id}/manage-link/revoke`).set(auth(staffToken));
    expect(revoke.status).toBe(200);
    expect((await api().get(`/api/public/bookings/${body.reference}`).set(token(body.manageToken))).status).toBe(404);
    const lookup = await api().post('/api/public/bookings/lookup').send({ reference: body.reference, email: 'camille.martin@example.com' });
    expect(lookup.body.manageToken).not.toBe(body.manageToken);
    expect((await api().get(`/api/public/bookings/${body.reference}`).set(token(lookup.body.manageToken))).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entityId: saved.id, action: 'reservation.manage_link_revoked' } })).toBe(1);
  });

  it('expire 30 jours après le retour', async () => {
    await publishedParking();
    const { body } = await book();
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: body.reference } });
    await prisma.reservation.update({
      where: { id: saved.id },
      data: { arrivalAt: new Date(Date.now() - 40 * 86400000), returnAt: new Date(Date.now() - 31 * 86400000), status: 'returned' },
    });
    expect(manageToken(saved.id, process.env.SECRET_KEY!)).toBe(body.manageToken);
    expect((await api().get(`/api/public/bookings/${body.reference}`).set(token(body.manageToken))).status).toBe(404);
    const lookup = await api().post('/api/public/bookings/lookup').send({ reference: body.reference, email: 'camille.martin@example.com' });
    expect(lookup.status).toBe(404);
  });
});

describe('retrouver sa réservation', () => {
  it('donne la clé pour la bonne référence et le bon email, et rien sinon', async () => {
    const { token: staffToken } = await publishedParking();
    const booked = await book();
    const lookup = (reference: string, email: string) => api().post('/api/public/bookings/lookup').send({ reference, email });

    const ok = await lookup(booked.body.reference.toLowerCase(), '  CAMILLE.martin@example.com ');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ reference: booked.body.reference, manageToken: booked.body.manageToken });

    const wrongEmail = await lookup(booked.body.reference, 'autre@example.com');
    const wrongReference = await lookup('RZZZZZ', 'camille.martin@example.com');
    expect([wrongEmail.status, wrongReference.status]).toEqual([404, 404]);
    expect(wrongEmail.body).toEqual(wrongReference.body);
    expect(wrongEmail.body.code).toBe('not_found');

    // Bookings from the other channels are not managed on the site.
    const phone = await api()
      .post('/api/internal/reservations')
      .set(auth(staffToken))
      .send({
        channel: 'phone',
        arrivalAt: inDays(6, '08:00'),
        returnAt: inDays(6, '20:00'),
        passengers: 1,
        customerName: 'X',
        customerPhone: '0600000000',
        customerEmail: 'x@example.com',
        plate: 'AB123CD',
      });
    expect((await lookup(phone.body.data.reference, 'x@example.com')).status).toBe(404);
    expect((await lookup('', '')).body.fields).toEqual({ reference: 'required', email: 'required' });
  });

  it('répond 404 sans la bonne clé', async () => {
    await publishedParking();
    const a = await book();
    const b = await book({ plate: 'BB222BB' });
    const get = (reference: string, headers: Record<string, string> = {}) => api().get(`/api/public/bookings/${reference}`).set(headers);
    expect((await get(a.body.reference)).status).toBe(404);
    expect((await get(a.body.reference, token('x'.repeat(32)))).status).toBe(404);
    expect((await get(a.body.reference, token(b.body.manageToken))).status).toBe(404);
    expect((await get('RZZZZZ', token(a.body.manageToken))).status).toBe(404);
    // The token is never accepted in the query string.
    expect((await get(`${a.body.reference}?cle=${a.body.manageToken}`)).status).toBe(404);
    expect((await get(a.body.reference.toLowerCase(), token(a.body.manageToken))).status).toBe(200);
  });
});

describe('vol retour', () => {
  it('se change ou s’efface tant que le véhicule n’est pas rendu', async () => {
    await publishedParking();
    const { body } = await book();
    const patch = (returnFlight: unknown, key = body.manageToken) =>
      api().patch(`/api/public/bookings/${body.reference}/flight`).set(token(key)).send({ returnFlight });

    expect((await patch('af1234')).body).toMatchObject({ returnFlight: 'AF 1234', canEditFlight: true });
    expect((await patch('')).body.returnFlight).toBeNull();
    expect((await patch('U2 4410')).body.returnFlight).toBe('U2 4410');
    expect((await patch(null)).body.returnFlight).toBeNull();
    expect((await patch('pas un vol')).body.fields).toEqual({ returnFlight: 'invalid_flight' });
    expect((await api().patch(`/api/public/bookings/${body.reference}/flight`).set(token(body.manageToken)).send({})).body.fields).toEqual({
      returnFlight: 'required',
    });
    expect((await patch('AF1234', 'x'.repeat(32))).status).toBe(404);
    expect(await prisma.auditLog.count({ where: { action: 'reservation.updated', staffId: null } })).toBe(4);

    await prisma.reservation.update({ where: { reference: body.reference }, data: { status: 'returned' } });
    const locked = await patch('AF1234');
    expect(locked.status).toBe(409);
    expect(locked.body.code).toBe('flight_locked');
  });

  it('ne se change plus après l’heure de retour', async () => {
    await publishedParking();
    const { body } = await book();
    await prisma.reservation.update({
      where: { reference: body.reference },
      data: { arrivalAt: new Date(Date.now() - 3 * 86400000), returnAt: new Date(Date.now() - 3600000), status: 'shuttled_out' },
    });
    const res = await api().patch(`/api/public/bookings/${body.reference}/flight`).set(token(body.manageToken)).send({ returnFlight: 'AF1234' });
    expect(res.body.code).toBe('flight_locked');
    expect((await api().get(`/api/public/bookings/${body.reference}`).set(token(body.manageToken))).body.canEditFlight).toBe(false);
  });
});

describe('annulation en ligne', () => {
  const cancel = (reference: string, key: string) => api().post(`/api/public/bookings/${reference}/cancel`).set(token(key));

  it('annule avant la limite, une seule fois, et libère la place', async () => {
    await publishedParking({ capacity: 1 });
    const { body } = await book();
    const res = await cancel(body.reference, body.manageToken);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'cancelled', canCancel: false, canEditFlight: false });
    const saved = await prisma.reservation.findUniqueOrThrow({ where: { reference: body.reference } });
    expect(saved.cancelledAt).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { action: 'reservation.status_changed', staffId: null } })).toBe(1);

    const again = await cancel(body.reference, body.manageToken);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('cancellation_closed');
    expect((await cancel(body.reference, 'x'.repeat(32))).status).toBe(404);
    // The spot is free again.
    expect((await book({ plate: 'BB222BB' })).status).toBe(201);
  });

  it('suit la politique d’annulation acceptée à la réservation', async () => {
    // free_24h: closed less than 24 h before arrival.
    const op = await publishedParking({ policy: 'free_24h' });
    const late = await book({ arrivalAt: inHours(10), returnAt: inDays(3, '10:00') });
    expect(late.body.booking).toMatchObject({ canCancel: false, cancellableUntil: shift(late.body.booking.arrivalAt, -24) });
    expect((await cancel(late.body.reference, late.body.manageToken)).body.code).toBe('cancellation_closed');

    // free_48h: open 3 days ahead, closed 30 h ahead.
    await api().put('/api/internal/listing').set(auth(op.token)).send({
      airportCode: 'LYS',
      slug: 'parking-demo',
      title: 'Parking Démo LYS',
      services: [],
      cancellationPolicy: 'free_48h',
      photos: [],
    });
    const soon = await book({ arrivalAt: inHours(30), returnAt: inDays(4, '10:00'), plate: 'CC333CC' });
    expect(soon.body.booking.cancellableUntil).toBe(shift(soon.body.booking.arrivalAt, -48));
    expect((await cancel(soon.body.reference, soon.body.manageToken)).status).toBe(409);
    const early = await book({ arrivalAt: inDays(3, '08:00'), returnAt: inDays(4, '10:00'), plate: 'DD444DD' });
    expect(early.body.booking).toMatchObject({ canCancel: true, cancellationPolicy: 'free_48h' });

    // A later change of the listing's policy does not apply to existing bookings.
    await api().put('/api/internal/listing').set(auth(op.token)).send({
      airportCode: 'LYS',
      slug: 'parking-demo',
      title: 'Parking Démo LYS',
      services: [],
      cancellationPolicy: 'non_refundable',
      photos: [],
    });
    expect((await cancel(early.body.reference, early.body.manageToken)).status).toBe(200);

    // non_refundable: no online cancellation at all.
    const strict = await book({ plate: 'EE555EE' });
    expect(strict.body.booking).toMatchObject({ cancellationPolicy: 'non_refundable', cancellableUntil: null, canCancel: false });
    expect((await cancel(strict.body.reference, strict.body.manageToken)).body.code).toBe('cancellation_closed');
  });

  it('free_until_arrival : jusqu’à l’heure d’arrivée', async () => {
    await publishedParking({ policy: 'free_until_arrival' });
    const { body } = await book({ arrivalAt: inHours(2), returnAt: inDays(2, '10:00') });
    expect(body.booking.cancellableUntil).toBe(body.booking.arrivalAt);
    expect((await cancel(body.reference, body.manageToken)).status).toBe(200);
  });

  it('n’annule plus un véhicule déjà arrivé', async () => {
    await publishedParking();
    const { body } = await book();
    await prisma.reservation.update({ where: { reference: body.reference }, data: { status: 'arrived' } });
    expect((await cancel(body.reference, body.manageToken)).body.code).toBe('cancellation_closed');
  });
});

describe('notifications', () => {
  const personal = [
    traveller.customerName,
    'camille.martin@example.com',
    traveller.customerEmail,
    '06 12 34 56 78',
    '0612345678',
    '33612345678',
    'GK-318-PX',
  ];

  function captureLogs() {
    const spies = (['info', 'warn', 'error', 'debug'] as const).map(level => jest.spyOn(logger, level));
    return {
      lines: () => spies.flatMap(spy => spy.mock.calls.map(call => call.map(String).join(' '))),
      restore: () => spies.forEach(spy => spy.mockRestore()),
    };
  }

  it('sans clé Brevo : rien n’est envoyé, une ligne de journal avec la seule référence', async () => {
    await publishedParking();
    const logs = captureLogs();
    const { body } = await book();
    await api().post(`/api/public/bookings/${body.reference}/cancel`).set(token(body.manageToken));
    const lines = logs.lines();
    logs.restore();

    expect(fetchMock).not.toHaveBeenCalled();
    const notices = lines.filter(line => line.includes('[Notifications]'));
    expect(notices).toEqual([expect.stringContaining(body.reference), expect.stringContaining(body.reference)]);
    for (const line of lines) for (const value of personal) expect(line).not.toContain(value);
  });

  it('avec Brevo : email et SMS de confirmation au bon format', async () => {
    const op = await publishedParking();
    await useBrevoSms(op.operator.id);
    Object.assign(notifications.settings, {
      apiKey: 'test-brevo-key',
      emailFrom: 'Plazo Lyon <reservations@example.com>',
      publicSiteUrl: 'https://site.example/',
    });
    const res = await book();
    expect(res.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const calls = fetchMock.mock.calls.map(([url, init]) => ({ url, init, body: JSON.parse(init.body) }));
    const email = calls.find(c => c.url === 'https://api.brevo.com/v3/smtp/email')!;
    const sms = calls.find(c => c.url === 'https://api.brevo.com/v3/transactionalSMS/send')!;
    const manageUrl = `https://site.example/ma-reservation/${res.body.reference}?cle=${res.body.manageToken}`;

    expect(email.init).toMatchObject({ method: 'POST', headers: { 'api-key': 'test-brevo-key', 'content-type': 'application/json' } });
    expect(email.init.signal).toBeInstanceOf(AbortSignal);
    expect(email.body).toMatchObject({
      sender: { name: 'Plazo Lyon', email: 'reservations@example.com' },
      to: [{ email: 'camille.martin@example.com', name: 'Camille Martin' }],
      subject: expect.stringContaining(res.body.reference),
      tags: ['booking_confirmed'],
    });
    expect(email.body.htmlContent).toContain(manageUrl);
    expect(email.body.htmlContent).toContain('34,99 €');
    expect(email.body.textContent).toContain('payé en ligne par carte');
    expect(email.body.textContent).toContain(manageUrl);

    expect(sms.init.headers).toMatchObject({ 'api-key': 'test-brevo-key' });
    expect(sms.body).toEqual({
      sender: 'Plazo',
      recipient: '33612345678',
      content: expect.stringContaining(res.body.reference),
      type: 'transactional',
      tag: 'booking_confirmed',
      unicodeEnabled: false,
    });
    expect(sms.body.content).toContain('34,99 € payés');
    expect(sms.body.content).toContain(manageUrl);
  });

  it('envoie un email à l’annulation', async () => {
    await publishedParking();
    const { body } = await book();
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'reservations@example.com' });
    await api().post(`/api/public/bookings/${body.reference}/cancel`).set(token(body.manageToken));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    const payload = JSON.parse(init.body);
    expect(payload).toMatchObject({ tags: ['booking_cancelled'], subject: expect.stringContaining('annulée') });
    expect(payload.sender).toEqual({ name: 'Plazo', email: 'reservations@example.com' });
  });

  it('une panne de Brevo ne fait pas échouer la réservation et ne journalise aucune donnée personnelle', async () => {
    const op = await publishedParking();
    await useBrevoSms(op.operator.id);
    Object.assign(notifications.settings, { apiKey: 'test-brevo-key', emailFrom: 'reservations@example.com' });
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'invalid_parameter', message: 'email camille.martin@example.com is not valid' }), { status: 400 }),
      )
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    const logs = captureLogs();
    const res = await book();
    const lines = logs.lines();
    logs.restore();

    expect(res.status).toBe(201);
    const errors = lines.filter(line => line.includes('failed'));
    expect(errors).toHaveLength(2);
    expect(errors.join('\n')).toContain('invalid_parameter');
    for (const line of lines) for (const value of personal) expect(line).not.toContain(value);
  });
});
