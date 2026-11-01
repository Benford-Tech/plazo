import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Airport, Listing, Operator, Parking, Prisma, ShuttleTracking } from '@/database';
import { NightFee, nightFeesForStay, nightRule, nightSettingsOf } from '@/domain/night-fees';
import { enabledOffersFrom } from '@/domain/extras';
import { billableDays, quoteCents } from '@/domain/pricing';
import { travellersSeePosition } from '@/domain/shuttle-tracking';
import { isTestOperatorName } from '@/domain/test-feed';
import { exceedsCalendarDays, parseInstant } from '@/domain/time';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { CapacityService } from './capacity.service';
import { type OPERATOR_PAYMENT_FIELDS, PaymentService } from './payment.service';
import { LatLng, ParkingLocationService } from './parking-location.service';

const MAX_STAY_DAYS = 90;

type ListingWithParking = Listing & {
  parking: Parking & {
    pricingTiers: { days: number; priceCents: number }[];
    operator: Pick<Operator, 'commissionBps' | 'stripeAccountId' | 'stripeAccountLive' | 'stripePayoutsEnabled' | 'isDemo' | 'name'>;
  };
};
type Client = Prisma.TransactionClient | typeof prisma;
type Stay = { arrivalAt: Date; returnAt: Date };

/** Operator fields the public pages need: how it takes payments, and whether it is a demo. */
// Spelled out, not spread from OPERATOR_PAYMENT_FIELDS: through an import cycle that constant can still be undefined when
// this module loads (22/10/2026).
const PUBLIC_OPERATOR_FIELDS = {
  commissionBps: true,
  stripeAccountId: true,
  stripeAccountLive: true,
  stripePayoutsEnabled: true,
  isDemo: true,
  name: true,
} as const satisfies Record<keyof typeof OPERATOR_PAYMENT_FIELDS, true>;

/** Listings travellers may see: validated by the platform, of an operator that is not suspended. */
export const ONLINE = { status: 'published', parking: { operator: { status: 'active' } } } satisfies Prisma.ListingWhereInput;

/** The home map's live layer (K-A): the airport, its parkings and the shuttles on the road. */
export interface AirportLive {
  serverTime: string;
  airport: { code: string; name: string; slug: string; location: LatLng };
  parkings: { slug: string; title: string; services: string[]; shuttleMinutes: number | null; location: LatLng | null; liveShuttle: boolean }[];
  shuttles: {
    id: string;
    /** Slug of the parking the shuttle belongs to. */
    parking: string;
    direction: 'pickup' | 'dropoff';
    vehicle: { model: string | null; colour: string | null };
    position: LatLng | null;
    positionAgeSeconds: number | null;
    startedAt: string;
  }[];
}

/** "EN DIRECT" (R-B + I-C, 07/10/2026): a shuttle is offered and its position is shown to the travellers. */
function liveShuttle(listing: { services: string[]; parking: { shuttleTracking: ShuttleTracking } }): boolean {
  return listing.services.includes('shuttle') && travellersSeePosition(listing.parking.shuttleTracking);
}

/** What travellers see on the Plazo site: published listings only, never operator or customer data. */
@Service()
export class PublicService {
  public capacity = Container.get(CapacityService);
  public locations = Container.get(ParkingLocationService);
  public payments = Container.get(PaymentService);

  /** How travellers pay on the site: "online" (card, Stripe), or "unavailable" while Stripe is not configured (06/10/2026: no payment at the parking). */
  public config() {
    return { payments: this.payments.enabled() ? ('online' as const) : ('unavailable' as const) };
  }

  public async airports() {
    return prisma.airport.findMany({ select: { code: true, name: true, city: true, slug: true }, orderBy: { name: 'asc' } });
  }

  public async airportBySlug(slug: string): Promise<Airport> {
    const airport = await prisma.airport.findUnique({ where: { slug } });
    if (!airport) throw new HttpException(httpStatus.NOT_FOUND, 'Airport not found', 'not_found');
    return airport;
  }

  /** A traveller's stay, in local time where the parking is; null when no date is given. */
  public parseStay(place: { timezone: string }, arrival?: string, ret?: string): Stay | null {
    if (!arrival && !ret) return null;
    const arrivalAt = arrival ? parseInstant(arrival, place.timezone) : null;
    const returnAt = ret ? parseInstant(ret, place.timezone) : null;
    if (!arrivalAt) throw new ValidationException({ arrivalAt: 'invalid_datetime' });
    if (!returnAt) throw new ValidationException({ returnAt: 'invalid_datetime' });
    if (returnAt <= arrivalAt) throw new ValidationException({ returnAt: 'return_before_arrival' });
    if (arrivalAt.getTime() < Date.now() - 3600000) throw new ValidationException({ arrivalAt: 'arrival_in_past' });
    if (exceedsCalendarDays(arrivalAt, returnAt, place.timezone, MAX_STAY_DAYS)) throw new ValidationException({ returnAt: 'stay_too_long' });
    return { arrivalAt, returnAt };
  }

  private summary(listing: ListingWithParking, locations: Map<string, LatLng>) {
    return {
      slug: listing.slug,
      title: listing.title,
      services: listing.services,
      shuttleMinutes: listing.shuttleMinutes ?? listing.parking.shuttleTravelMinutes,
      // Average wait for the shuttle as the operator declares it (14/10/2026, « ATTENTE MOY. »); null: not declared.
      shuttleWaitMinutes: listing.shuttleWaitMinutes,
      distanceKm: listing.distanceKm,
      openingHours: listing.openingHours,
      cancellationPolicy: listing.cancellationPolicy,
      photo: listing.photos[0] ?? null,
      // "online": book and pay on the site; "on_site": book, pay at the parking; "unavailable":
      // payments are on but this operator cannot take them yet (no booking on the site).
      payment: this.payments.modeFor(listing.parking.operator),
      // Entrance of the parking for the site's map; null when unknown (listed, not drawn).
      location: locations.get(listing.parkingId) ?? null,
      // Fictional parking of the demo seed: shown like the others, with a small "Démo" badge.
      // The platform's test parking (« Plazo (tests) ») is shown like a demo: kept out of the sitemap, the guides and Google
      // (22/10/2026, Search Console listed « Parking test Plazo »).
      isDemo: listing.parking.operator.isDemo || isTestOperatorName(listing.parking.operator.name),
      // R-B + I-C (07/10/2026): the parking shows its shuttles to the travellers ("EN DIRECT").
      liveShuttle: liveShuttle(listing),
    };
  }

  private positions(listings: ListingWithParking[]) {
    return this.locations.forPublic(listings.map(l => ({ id: l.parkingId, address: l.parking.address })));
  }

  /**
   * Full nights, billable days and total price of a stay at one listing. Bookings call it inside
   * the transaction holding the parking lock (`client`). The total (`priceCents`) is the grid price
   * (`basePriceCents`) plus the night fees of the hours booked (12/10/2026), tested on the parking's
   * wall clock like the billable days; null when the grid cannot price the stay.
   */
  public async quote(
    listing: ListingWithParking,
    stay: Stay,
    client: Client = prisma,
  ): Promise<{ fullNights: string[]; days: number; priceCents: number | null; basePriceCents: number | null; nightFee: NightFee | null }> {
    const { full } = await this.capacity.fullNights(listing.parking, stay.arrivalAt, stay.returnAt, { client });
    const { timezone } = listing.parking;
    const days = billableDays(stay.arrivalAt, stay.returnAt, timezone);
    const basePriceCents = quoteCents(listing.parking.pricingTiers, listing.parking.extraDayPriceCents, days);
    const nightFee = basePriceCents === null ? null : nightFeesForStay(nightSettingsOf(listing.parking), stay.arrivalAt, stay.returnAt, timezone);
    const priceCents = basePriceCents === null ? null : basePriceCents + (nightFee?.totalCents ?? 0);
    return { fullNights: full.map(n => n.date), days, priceCents, basePriceCents, nightFee };
  }

  /**
   * Availability and price of a stay at one listing: the total « tout compris » (`priceCents`, used to sort, filter
   * and pick the cheapest), the grid price, and the night fees included in it (null when none).
   */
  private async offer(listing: ListingWithParking, stay: Stay) {
    const { fullNights, days, priceCents, basePriceCents, nightFee } = await this.quote(listing, stay);
    return { available: fullNights.length === 0 && priceCents !== null, days, priceCents, basePriceCents, nightFee };
  }

  private publishedAt(airportId: string) {
    return prisma.listing.findMany({
      where: { airportId, ...ONLINE },
      include: {
        parking: { include: { pricingTiers: { select: { days: true, priceCents: true } }, operator: { select: PUBLIC_OPERATOR_FIELDS } } },
      },
    });
  }

  public async airport(slug: string) {
    const airport = await this.airportBySlug(slug);
    const listings = await this.publishedAt(airport.id);
    const locations = await this.positions(listings);
    return {
      ...this.config(),
      airport: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        slug: airport.slug,
        timezone: airport.timezone,
        location: { lat: airport.latitude, lng: airport.longitude },
      },
      listings: listings.map(l => {
        // Lowest package price, with the number of days it covers ("dès 15,00 € la journée").
        const cheapest = [...l.parking.pricingTiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
        return { ...this.summary(l, locations), fromPriceCents: cheapest?.priceCents ?? null, fromDays: cheapest?.days ?? null };
      }),
    };
  }

  /**
   * K-A (06/10/2026): the home map's live layer, anonymous — the airport's published parkings and
   * their shuttles on the road right now (position, direction, vehicle). Never a driver, a plate,
   * a passenger: the traveller only sees that a shuttle is moving.
   */
  public async live(slug: string): Promise<AirportLive> {
    const airport = await this.airportBySlug(slug);
    const listings = await this.publishedAt(airport.id);
    const locations = await this.positions(listings);
    const now = new Date();
    const slugOf = new Map(listings.map(l => [l.parkingId, l.slug]));
    const trips = listings.length
      ? await prisma.shuttleTrip.findMany({
          // R-B: only the parkings that show their shuttles to the travellers.
          where: { parkingId: { in: listings.filter(liveShuttle).map(l => l.parkingId) }, status: 'running', expiresAt: { gt: now } },
          select: {
            id: true,
            parkingId: true,
            direction: true,
            lat: true,
            lng: true,
            positionReceivedAt: true,
            vehicleModel: true,
            vehicleColour: true,
            startedAt: true,
          },
          orderBy: { startedAt: 'asc' },
        })
      : [];
    return {
      serverTime: now.toISOString(),
      airport: { code: airport.code, name: airport.name, slug: airport.slug, location: { lat: airport.latitude, lng: airport.longitude } },
      parkings: listings.map(l => ({
        slug: l.slug,
        title: l.title,
        services: l.services,
        shuttleMinutes: l.shuttleMinutes ?? l.parking.shuttleTravelMinutes,
        location: locations.get(l.parkingId) ?? null,
        liveShuttle: liveShuttle(l),
      })),
      shuttles: trips.map(t => ({
        id: t.id,
        parking: slugOf.get(t.parkingId) ?? '',
        direction: t.direction,
        vehicle: { model: t.vehicleModel, colour: t.vehicleColour },
        position: t.lat !== null && t.lng !== null ? { lat: t.lat, lng: t.lng } : null,
        positionAgeSeconds:
          t.lat !== null && t.positionReceivedAt ? Math.max(0, Math.round((now.getTime() - t.positionReceivedAt.getTime()) / 1000)) : null,
        startedAt: t.startedAt.toISOString(),
      })),
    };
  }

  /** Published parkings at an airport for a stay: available ones first, cheapest first (total, night fees included). */
  public async search(airportSlug: string, arrival?: string, ret?: string) {
    const airport = await this.airportBySlug(airportSlug);
    const stay = this.parseStay(airport, arrival, ret);
    if (!stay) throw new ValidationException({ arrivalAt: 'required', returnAt: 'required' });
    const listings = await this.publishedAt(airport.id);
    const [locations, offers] = await Promise.all([this.positions(listings), Promise.all(listings.map(l => this.offer(l, stay)))]);
    const results = listings.map((l, i) => ({ ...this.summary(l, locations), ...offers[i] }));
    results.sort((a, b) => Number(b.available) - Number(a.available) || (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
    return {
      ...this.config(),
      airport: { code: airport.code, name: airport.name, slug: airport.slug, location: { lat: airport.latitude, lng: airport.longitude } },
      results,
    };
  }

  /** A published listing with its parking and pricing grid; 404 "not_found" otherwise. */
  public async findPublished(airport: Pick<Airport, 'id'>, slug: string, client: Client = prisma): Promise<ListingWithParking> {
    const listing = await client.listing.findFirst({
      where: { airportId: airport.id, slug, ...ONLINE },
      include: {
        parking: {
          include: {
            pricingTiers: { select: { days: true, priceCents: true }, orderBy: { days: 'asc' } },
            operator: { select: PUBLIC_OPERATOR_FIELDS },
          },
        },
      },
    });
    if (!listing) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return listing;
  }

  /** A parking's page, with the offer for a stay when dates are given. */
  public async parking(airportSlug: string, slug: string, arrival?: string, ret?: string) {
    const airport = await this.airportBySlug(airportSlug);
    const listing = await this.findPublished(airport, slug);
    const stay = this.parseStay(airport, arrival, ret);
    const locations = await this.positions([listing]);
    return {
      ...this.config(),
      airport: { code: airport.code, name: airport.name, slug: airport.slug, location: { lat: airport.latitude, lng: airport.longitude } },
      parking: {
        ...this.summary(listing, locations),
        description: listing.description,
        photos: listing.photos,
        address: listing.parking.address,
        phone: listing.contactPhone,
        // The night rule (12/10/2026), for the sentence under the price breakdown: null when the parking charges none.
        pricing: {
          tiers: listing.parking.pricingTiers,
          extraDayPriceCents: listing.parking.extraDayPriceCents,
          night: nightRule(nightSettingsOf(listing.parking)),
        },
        // Additional services (21/10/2026; each parking's own list since 27/10/2026), ordered in the Plazo app with the
        // booking or later, until each service's `leadHours` before the return (`leadHours` here: the apps before
        // 27/10/2026, the shortest one).
        extras: await (async () => {
          const offers = enabledOffersFrom(await prisma.parkingExtra.findMany({ where: { parkingId: listing.parkingId } }));
          return { offers, leadHours: offers.length ? Math.min(...offers.map(o => o.leadHours)) : listing.parking.extrasLeadHours };
        })(),
      },
      offer: stay ? await this.offer(listing, stay) : null,
    };
  }
}
