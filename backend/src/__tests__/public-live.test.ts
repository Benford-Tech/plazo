import prisma from '@/database';
import { ParkingLocationService } from '@/services/parking-location.service';
import { Container } from 'typedi';
import {
  addStaff,
  api,
  bookAndPay,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  publishListing,
  resetDatabase,
  setupOperator,
  shareShuttlesWithTravellers,
} from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60000);

describe('carte vivante de l’accueil (K-A)', () => {
  it('liste les parkings de l’aéroport et leurs navettes en circulation, sans donnée personnelle', async () => {
    const stripe = enableFakePayments();
    try {
      const op = await setupOperator('Parking Soleil');
      await onboardOperator(op.operator.id);
      await shareShuttlesWithTravellers(op.token, op.parking.id);
      await api()
        .put('/api/internal/pricing')
        .set(auth(op.token))
        .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
      await api()
        .put('/api/internal/listing')
        .set(auth(op.token))
        .send({
          airportCode: 'LYS',
          slug: 'parking-soleil',
          title: 'Parking Soleil',
          services: ['shuttle'],
          shuttleMinutes: 8,
          cancellationPolicy: 'free_24h',
          photos: [],
        });
      await publishListing(op.parking.id);
      await Container.get(ParkingLocationService).store(op.parking.id, { lat: 45.73, lng: 5.05 });
      const booking = await bookAndPay(
        {
          airport: 'lyon-saint-exupery',
          parking: 'parking-soleil',
          arrivalAt: '2027-03-01T06:30',
          returnAt: '2027-03-03T15:05',
          customerName: 'Camille Martin',
          customerPhone: '06 12 34 56 78',
          customerEmail: 'camille@example.com',
          plate: 'ab123cd',
          passengers: 2,
          acceptTerms: true,
        },
        stripe.sessions,
      );
      const reservation = await prisma.reservation.update({
        where: { reference: booking.reference },
        data: { status: 'arrived', arrivedAt: minutesFromNow(-60), arrivalAt: minutesFromNow(-60), returnAt: minutesFromNow(3 * 24 * 60) },
      });

      // Nothing on the road yet: the parkings alone.
      const quiet = await api().get('/api/public/airports/lyon-saint-exupery/live');
      expect(quiet.status).toBe(200);
      expect(quiet.headers['cache-control']).toBe('no-store');
      expect(quiet.body.airport).toMatchObject({ slug: 'lyon-saint-exupery', location: { lat: expect.any(Number), lng: expect.any(Number) } });
      expect(quiet.body.parkings).toEqual([
        {
          slug: 'parking-soleil',
          title: 'Parking Soleil',
          services: ['shuttle'],
          shuttleMinutes: 8,
          location: { lat: 45.73, lng: 5.05 },
          liveShuttle: true,
        },
      ]);
      expect(quiet.body.shuttles).toEqual([]);

      // A drop-off trip with a position: the shuttle appears, anonymous.
      const driver = await addStaff(op.token, 'driver');
      const trip = await api()
        .post('/api/internal/shuttle/trips')
        .set(auth(driver.token))
        .send({ reservationIds: [reservation.id], direction: 'dropoff', vehicle: { model: 'Vito', colour: 'blanc', plate: 'AA-111-AA' } });
      expect(trip.status).toBe(201);
      await api()
        .post(`/api/internal/shuttle/trips/${trip.body.trip.id}/position`)
        .set(auth(driver.token))
        .send({ lat: 45.7255, lng: 5.065, recordedAt: new Date().toISOString() });
      const live = await api().get('/api/public/airports/lyon-saint-exupery/live');
      expect(live.body.shuttles).toHaveLength(1);
      expect(live.body.shuttles[0]).toEqual({
        id: trip.body.trip.id,
        parking: 'parking-soleil',
        direction: 'dropoff',
        vehicle: { model: 'Vito', colour: 'blanc' },
        position: { lat: 45.7255, lng: 5.065 },
        positionAgeSeconds: expect.any(Number),
        startedAt: expect.any(String),
      });
      expect(JSON.stringify(live.body)).not.toMatch(/Camille|AA-111-AA|driver/);

      // Ended: gone. Unknown airport: 404.
      await api().post(`/api/internal/shuttle/trips/${trip.body.trip.id}/end`).set(auth(driver.token)).send({});
      expect((await api().get('/api/public/airports/lyon-saint-exupery/live')).body.shuttles).toEqual([]);
      expect((await api().get('/api/public/airports/nulle-part/live')).status).toBe(404);
    } finally {
      disableFakePayments();
    }
  });
});
