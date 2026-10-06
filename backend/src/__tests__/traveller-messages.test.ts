import { Container } from 'typedi';
import prisma from '@/database';
import { localDate } from '@/domain/time';
import { closingEmail, confirmationEmail, departureDaySteps, reminderSms } from '@/domain/booking-messages';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { landedSms } from '@/domain/return-messages';
import { ArrivalService } from '@/services/arrival.service';
import { NotificationService } from '@/services/notification.service';
import { ParkingLocationService } from '@/services/parking-location.service';
import { ONESIGNAL_NOTIFICATIONS_URL } from '@/services/push.service';
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

/**
 * B (06/10/2026): the traveller's message thread. The confirmation names the phone, the meeting
 * point and the day's three steps; the day before, a reminder goes out once; the valet's placement,
 * the drop-off and the handover each send a push; the handover also sends the closing email.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (token: string) => ({ 'x-booking-token': token });
const RECEPTION = { lat: 45.73, lng: 5.05 };
const MEETING = { lat: 45.7205, lng: 5.0817 };
const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_SMS = 'https://api.brevo.com/v3/transactionalSMS/send';

let fetchMock: jest.SpyInstance;
let stripe: ReturnType<typeof enableFakePayments>;
const calls = (url: string) =>
  fetchMock.mock.calls.filter(([u]) => String(u) === url).map(([, init]) => JSON.parse((init as RequestInit).body as string));
const pushes = () =>
  calls(ONESIGNAL_NOTIFICATIONS_URL) as { headings: { fr: string }; contents: { fr: string }; include_subscription_ids: string[] }[];

beforeEach(async () => {
  await resetDatabase();
  stripe = enableFakePayments();
  Object.assign(Container.get(NotificationService).settings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo Lyon <reservations@example.com>',
    publicSiteUrl: 'https://site.example',
  });
  process.env.ONESIGNAL_TRAVELLER_APP_ID = 'traveller-app';
  process.env.ONESIGNAL_TRAVELLER_REST_API_KEY = 'traveller-key';
  fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async () => new Response(JSON.stringify({ id: 'n1', messageId: 'm1' }), { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  disableFakePayments();
  Container.get(NotificationService).settings.apiKey = '';
  delete process.env.ONESIGNAL_TRAVELLER_APP_ID;
  delete process.env.ONESIGNAL_TRAVELLER_REST_API_KEY;
});
afterAll(() => prisma.$disconnect());

const square = (lon: number, lat: number, d = 0.00003): [number, number][] => [
  [lon, lat],
  [lon + d, lat],
  [lon + d, lat + d],
  [lon, lat + d],
  [lon, lat],
];
const spots = [{ zoneId: 'z1', code: 'A-01-01', row: 1, index: 1, geometry: square(5.08, 45.72) }];

/** An operator on Plazo with a phone and a meeting point, a booking paid on the site, Brevo as the SMS channel. */
async function setup() {
  const op = await setupOperator();
  await onboardOperator(op.operator.id);
  await useBrevoSms(op.operator.id);
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
      contactPhone: '04 72 00 00 00',
    });
  await publishListing(op.parking.id);
  await Container.get(ParkingLocationService).store(op.parking.id, RECEPTION);
  await Container.get(ArrivalService).setReturnMeetingPoint(op.parking.id, {
    ...MEETING,
    label: 'Terminal 1 · Porte 12',
    instructions: 'Sortez côté parkings.',
    photoUrl: null,
  });
  await api().put(`/api/internal/parkings/${op.parking.id}/plan/spots`).set(auth(op.token)).send({ layout: 'valet24', spots });
  const res = await api()
    .post('/api/public/bookings')
    .send({
      airport: 'lyon-saint-exupery',
      parking: `parking-${op.parking.id}`,
      arrivalAt: '2027-03-01T06:30',
      returnAt: '2027-03-03T15:05',
      customerName: 'Camille Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: `camille${op.parking.id}@example.com`,
      plate: 'ab123cd',
      passengers: 2,
      returnFlight: 'TO 3627',
      acceptTerms: true,
    });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
  const reservation = await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } });
  return { op, reference: res.body.reference as string, manageToken: res.body.manageToken as string, reservation };
}

describe('le fil de messages du voyageur (B)', () => {
  it('la confirmation nomme le téléphone, le point de rendez-vous et les trois étapes du jour J', async () => {
    const { reference } = await setup();
    const email = calls(BREVO_EMAIL).find(e => e.tags?.[0] === 'booking_confirmed');
    expect(email.textContent).toContain('Téléphone : 04 72 00 00 00');
    expect(email.textContent).toContain('Retour : rendez-vous navette : Terminal 1 · Porte 12 · Sortez côté parkings.');
    expect(email.textContent).toContain('Le jour du départ :');
    expect(email.textContent).toContain("Dès l'atterrissage du TO 3627");
    expect(email.htmlContent).toContain('Le jour du départ');
    const sms = calls(BREVO_SMS).find(s => s.tag === 'booking_confirmed');
    expect(sms.content).toContain(reference);
    expect(sms.content).toContain('Parking : 04 72 00 00 00.');
    // The same three steps, in words, for the email and the site.
    const record = await prisma.reservation.findUniqueOrThrow({ where: { reference }, include: WITH_LISTING });
    expect(departureDaySteps(toPublicBooking(record)).map(([t]) => t)).toEqual([
      'Rendez-vous au parking',
      'Donnez votre référence ou votre plaque',
      'Au retour, on suit votre vol',
    ]);
    expect(confirmationEmail('Plazo', toPublicBooking(record), null).text).toContain('Retrouvez votre réservation sur le site');
  });

  it('la veille : rappel par email, SMS et push, une seule fois', async () => {
    const { reservation, manageToken, reference } = await setup();
    await api()
      .put(`/api/public/bookings/${reference}/devices`)
      .set(bookingToken(manageToken))
      .send({ subscriptionId: 'sub-camille', platform: 'android' });
    // Arriving tomorrow at 06:30 Paris time.
    const tomorrow = new Date(Date.now() + 86400000);
    const local = `${localDate(tomorrow, 'Europe/Paris')}T06:30`;
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { arrivalAt: new Date(`${local}:00+02:00`), returnAt: new Date(tomorrow.getTime() + 3 * 86400000) },
    });
    fetchMock.mockClear();
    const first = await api().get('/api/internal/cron/remind-tomorrow').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ checked: 1, sent: 1 });
    const email = calls(BREVO_EMAIL).find(e => e.tags?.[0] === 'booking_reminder');
    expect(email.subject).toBe('Demain : votre parking Parking LYS, 06:30');
    expect(email.textContent).toContain('Téléphone : 04 72 00 00 00');
    const sms = calls(BREVO_SMS).find(s => s.tag === 'booking_reminder');
    expect(sms.content).toMatch(/^Plazo : à demain ! Dépôt le \d{2}\/\d{2} à 06:30 à Parking LYS\./);
    expect(sms.content).toContain('Parking : 04 72 00 00 00.');
    expect(pushes().map(p => p.headings.fr)).toEqual(['À demain, Camille !']);
    // Already reminded: nothing more.
    const second = await api().get('/api/internal/cron/remind-tomorrow').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
    expect(second.body).toEqual({ checked: 0, sent: 0 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).reminderSentAt).not.toBeNull();
  });

  it('voiture garée, bon voyage, puis bon retour avec le mail de clôture ; chacun une fois', async () => {
    const { op, reservation, manageToken, reference } = await setup();
    const valet = await addStaff(op.token, 'valet');
    const driver = await addStaff(op.token, 'driver');
    await api()
      .put(`/api/public/bookings/${reference}/devices`)
      .set(bookingToken(manageToken))
      .send({ subscriptionId: 'sub-camille', platform: 'android' });
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { arrivalAt: new Date(Date.now() - 3600000), returnAt: new Date(Date.now() + 3600000) },
    });
    const spotId = (await api().get(`/api/internal/parkings/${op.parking.id}/plan`).set(auth(op.token))).body.spots[0].id as string;
    fetchMock.mockClear();

    const placed = await api().post(`/api/internal/reservations/${reservation.id}/spot`).set(auth(valet.token)).send({ spotId, keyHook: '12' });
    expect(placed.status).toBe(200);
    expect(pushes().map(p => [p.headings.fr, p.contents.fr])).toEqual([
      ['Votre voiture est garée', 'Place A-01-01 · clés au crochet 12 · elle vous attendra là au retour.'],
    ]);
    expect(pushes()[0].include_subscription_ids).toEqual(['sub-camille']);
    // A move does not repeat it.
    await api().post(`/api/internal/reservations/${reservation.id}/spot`).set(auth(valet.token)).send({ spotId, keyHook: '13' });
    expect(pushes()).toHaveLength(1);

    const trip = await api()
      .post('/api/internal/shuttle/trips')
      .set(auth(driver.token))
      .send({ reservationIds: [reservation.id], direction: 'dropoff' });
    expect(trip.status).toBe(201);
    await api().post(`/api/internal/shuttle/trips/${trip.body.trip.id}/end`).set(auth(driver.token));
    expect(pushes().map(p => p.headings.fr)).toContain('Bon voyage !');
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).status).toBe('shuttled_out');

    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'back_at_parking' } });
    fetchMock.mockClear();
    const handed = await api().post(`/api/internal/reservations/${reservation.id}/status`).set(auth(valet.token)).send({ status: 'returned' });
    expect(handed.status).toBe(200);
    const email = calls(BREVO_EMAIL).find(e => e.tags?.[0] === 'booking_closed');
    expect(email.subject).toBe('Merci, et à bientôt · Parking LYS');
    expect(email.textContent).toContain('Votre véhicule vous a été rendu le');
    expect(email.textContent).toContain('Total : 27,00 €, payé en ligne par carte.');
    expect(pushes().map(p => p.headings.fr)).toEqual(['Bon retour !']);
    // Reopened and handed back again: no second closing.
    await api().post(`/api/internal/reservations/${reservation.id}/status`).set(auth(op.token)).send({ status: 'back_at_parking' });
    await api().post(`/api/internal/reservations/${reservation.id}/status`).set(auth(op.token)).send({ status: 'returned' });
    expect(calls(BREVO_EMAIL).filter(e => e.tags?.[0] === 'booking_closed')).toHaveLength(1);
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id }, include: WITH_LISTING });
    expect(closingEmail('Plazo', toPublicBooking(record), '2027-03-03T15:40').text).toContain('rendu le mercredi 3 mars 2027 à 15:40');
  });

  it('le SMS d’atterrissage garde le téléphone avec le lien, et le rappel tient en un ou deux segments', async () => {
    expect(
      landedSms({
        productName: 'Plazo',
        parkingName: 'Parking LYS',
        meetingLabel: 'Lyon Saint-Exupéry',
        instructions: null,
        phone: '04 72 00 00 00',
        manageUrl: 'https://s/x',
      }),
    ).toBe('Plazo : votre vol a atterri. Rendez-vous navette : Lyon Saint-Exupéry. Votre reservation : https://s/x Parking : 04 72 00 00 00');
    const { reservation } = await setup();
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id }, include: WITH_LISTING });
    const sms = reminderSms('Plazo', toPublicBooking(record), null);
    expect(sms.length).toBeLessThanOrEqual(306);
    expect(sms).toContain('Navette');
  });
});
