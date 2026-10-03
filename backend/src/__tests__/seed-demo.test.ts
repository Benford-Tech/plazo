import { Container } from 'typedi';
import prisma from '@/database';
import { DEMO_BOOKINGS, DEMO_OPERATORS, demoPricing } from '@/domain/demo-data';
import { demoManagerEmail, DemoSeedService, NotDemoOperatorError } from '@/services/demo-seed.service';
import { api, login, resetDatabase, setupOperator } from './utils/helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const PASSWORD = 'demo-mot-de-passe';
const seed = () => Container.get(DemoSeedService);
const future = (days: number, time: string) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.toISOString().slice(0, 10)}T${time}`;
};

describe('données de démonstration', () => {
  it('crée les cinq loueurs, leurs fiches publiées et les réservations, deux fois sans doublon', async () => {
    const first = await seed().apply(PASSWORD);
    expect(first).toEqual({ operatorsCreated: 5, operatorsUpdated: 0, bookingsCreated: 3, bookingsUpdated: 0 });

    const operators = await prisma.operator.findMany({
      where: { isDemo: true },
      include: { parkings: { include: { listing: true, pricingTiers: true } }, staff: true, vehicles: true },
    });
    expect(operators).toHaveLength(5);
    for (const op of operators) {
      expect(op.status).toBe('active');
      expect(op.parkings).toHaveLength(1);
      expect(op.parkings[0].listing).toMatchObject({ status: 'published' });
      expect(op.parkings[0].listing!.photos).toHaveLength(2);
      expect(op.parkings[0].pricingTiers).toHaveLength(15);
      expect(op.parkings[0].returnMeetingLabel).toBeTruthy();
      expect(op.staff).toHaveLength(1);
      expect(op.staff[0]).toMatchObject({ role: 'manager', email: demoManagerEmail(op.slug) });
      expect(op.vehicles).toHaveLength(1);
    }
    // Positions written in PostGIS (parking and meeting point).
    const located = await prisma.$queryRaw<
      { n: bigint }[]
    >`SELECT count(*) AS n FROM parkings WHERE location IS NOT NULL AND "returnMeetingPoint" IS NOT NULL`;
    expect(Number(located[0].n)).toBe(5);

    // Bookings of the first operator only, in the coming days.
    const bookings = await prisma.reservation.findMany({ orderBy: { arrivalAt: 'asc' } });
    expect(bookings).toHaveLength(3);
    expect(new Set(bookings.map(b => b.operatorId)).size).toBe(1);
    expect(bookings.map(b => b.reference)).toEqual(DEMO_BOOKINGS.map(b => b.reference));
    expect(bookings[0]).toMatchObject({ channel: 'plazo', status: 'upcoming', paymentStatus: null, returnFlight: 'TO 3627', plateKey: 'AB123CD' });
    expect(bookings[0].priceCents).toBeGreaterThan(0);
    expect(bookings[2].arrivalAt.getTime()).toBeGreaterThan(Date.now() + 9 * 86400000);

    // The manager can log in with the seed password.
    const session = await login(demoManagerEmail(DEMO_OPERATORS[0].slug), PASSWORD);
    expect(session.user.operatorName).toBe('Parkair Lyon');

    // A second run refreshes everything in place.
    await prisma.listing.updateMany({ data: { status: 'draft', title: 'Modifié' } });
    await prisma.operator.updateMany({ where: { slug: DEMO_OPERATORS[1].slug }, data: { status: 'suspended', suspendedAt: new Date() } });
    const second = await seed().apply('un-autre-mot-de-passe');
    expect(second).toEqual({ operatorsCreated: 0, operatorsUpdated: 5, bookingsCreated: 0, bookingsUpdated: 3 });
    expect(await prisma.operator.count()).toBe(5);
    expect(await prisma.staff.count()).toBe(5);
    expect(await prisma.reservation.count()).toBe(3);
    expect(await prisma.pricingTier.count()).toBe(75);
    expect(await prisma.shuttleVehicle.count()).toBe(5);
    expect(await prisma.listing.count({ where: { status: 'published', title: { not: 'Modifié' } } })).toBe(5);
    expect(await prisma.operator.count({ where: { status: 'active' } })).toBe(5);
    // The password of an existing account is never changed.
    await login(demoManagerEmail(DEMO_OPERATORS[0].slug), PASSWORD);
  });

  it('refuse un mot de passe trop court', async () => {
    await expect(seed().apply('court')).rejects.toThrow(/10 characters/);
    expect(await prisma.operator.count()).toBe(0);
  });

  it('ne supprime que les loueurs de démonstration et refuse les autres', async () => {
    const real = await setupOperator('Vrai loueur');
    await seed().apply(PASSWORD);
    expect(await prisma.operator.count()).toBe(6);

    await expect(seed().removeOperator(real.operator.id)).rejects.toThrow(NotDemoOperatorError);
    expect(await prisma.operator.count({ where: { id: real.operator.id } })).toBe(1);

    const removed = await seed().remove();
    expect(removed).toEqual({ operators: 5, parkings: 5, reservations: 3, staff: 5 });
    expect(await prisma.operator.findMany({ select: { id: true } })).toEqual([{ id: real.operator.id }]);
    expect(await prisma.reservation.count()).toBe(0);
    expect(await prisma.listing.count()).toBe(0);
    expect(await prisma.staff.count()).toBe(1);
    // Nothing left: a second removal is a no-op.
    expect(await seed().remove()).toEqual({ operators: 0, parkings: 0, reservations: 0, staff: 0 });
  });

  it('refuse de réutiliser l’adresse d’un loueur qui n’est pas une démo', async () => {
    await prisma.operator.create({ data: { name: 'Squatteur', slug: DEMO_OPERATORS[0].slug } });
    await expect(seed().apply(PASSWORD)).rejects.toThrow(NotDemoOperatorError);
  });

  it('expose isDemo sur le site et dans l’espace Plateforme', async () => {
    const real = await setupOperator('Vrai loueur');
    await api()
      .put('/api/internal/pricing')
      .set('Authorization', `Bearer ${real.token}`)
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
    await api()
      .put('/api/internal/listing')
      .set('Authorization', `Bearer ${real.token}`)
      .send({ airportCode: 'LYS', slug: 'vrai', title: 'Vrai parking', services: ['shuttle'], cancellationPolicy: 'free_24h', photos: [] });
    await prisma.listing.update({ where: { parkingId: real.parking.id }, data: { status: 'published' } });
    await seed().apply(PASSWORD);

    const page = await api().get('/api/public/airports/lyon-saint-exupery');
    expect(page.status).toBe(200);
    expect(page.body.listings).toHaveLength(6);
    expect(page.body.listings.find((l: { slug: string }) => l.slug === 'vrai').isDemo).toBe(false);
    expect(page.body.listings.filter((l: { isDemo: boolean }) => l.isDemo)).toHaveLength(5);

    const search = await api()
      .get('/api/public/search')
      .query({ airport: 'lyon-saint-exupery', arrivalAt: future(3, '08:00'), returnAt: future(6, '18:00') });
    expect(search.status).toBe(200);
    const parkair = search.body.results.find((r: { slug: string }) => r.slug === 'parkair-lyon');
    expect(parkair).toMatchObject({ isDemo: true, available: true, priceCents: demoPricing(DEMO_OPERATORS[0].pricing).tiers[3].priceCents });
    // The cheapest demo parking, as announced.
    expect(search.body.results.filter((r: { isDemo: boolean }) => r.isDemo)[0].slug).toBe('parkair-lyon');

    const parking = await api().get('/api/public/airports/lyon-saint-exupery/parkings/aeroparc-saint-exupery');
    expect(parking.status).toBe(200);
    expect(parking.body.parking).toMatchObject({ isDemo: true, phone: '04 72 00 00 02', pricing: { extraDayPriceCents: 800 } });
    expect(parking.body.parking.pricing.tiers).toHaveLength(15);
  });
});
