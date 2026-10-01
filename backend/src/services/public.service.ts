import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Airport, Listing, Parking, Prisma } from '@/database';
import { billableDays, quoteCents } from '@/domain/pricing';
import { exceedsCalendarDays, parseInstant } from '@/domain/time';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { CapacityService } from './capacity.service';

const MAX_STAY_DAYS = 90;

type ListingWithParking = Listing & { parking: Parking & { pricingTiers: { days: number; priceCents: number }[] } };
type Client = Prisma.TransactionClient | typeof prisma;
type Stay = { arrivalAt: Date; returnAt: Date };

/** What travellers see on the Plazo site: published listings only, never operator or customer data. */
@Service()
export class PublicService {
  public capacity = Container.get(CapacityService);

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

  private summary(listing: ListingWithParking) {
    return {
      slug: listing.slug,
      title: listing.title,
      services: listing.services,
      shuttleMinutes: listing.shuttleMinutes ?? listing.parking.shuttleTravelMinutes,
      distanceKm: listing.distanceKm,
      openingHours: listing.openingHours,
      cancellationPolicy: listing.cancellationPolicy,
      photo: listing.photos[0] ?? null,
    };
  }

  /**
   * Full nights, billable days and total price of a stay at one listing. Bookings call it inside
   * the transaction holding the parking lock (`client`).
   */
  public async quote(listing: ListingWithParking, stay: Stay, client: Client = prisma) {
    const { full } = await this.capacity.fullNights(listing.parking, stay.arrivalAt, stay.returnAt, { client });
    const days = billableDays(stay.arrivalAt, stay.returnAt, listing.parking.timezone);
    const priceCents = quoteCents(listing.parking.pricingTiers, listing.parking.extraDayPriceCents, days);
    return { fullNights: full.map(n => n.date), days, priceCents };
  }

  /** Availability and total price of a stay at one listing. */
  private async offer(listing: ListingWithParking, stay: Stay) {
    const { fullNights, days, priceCents } = await this.quote(listing, stay);
    return { available: fullNights.length === 0 && priceCents !== null, days, priceCents };
  }

  private publishedAt(airportId: string) {
    return prisma.listing.findMany({
      where: { airportId, published: true },
      include: { parking: { include: { pricingTiers: { select: { days: true, priceCents: true } } } } },
    });
  }

  public async airport(slug: string) {
    const airport = await this.airportBySlug(slug);
    const listings = await this.publishedAt(airport.id);
    return {
      airport: { code: airport.code, name: airport.name, city: airport.city, slug: airport.slug, timezone: airport.timezone },
      listings: listings.map(l => {
        // Lowest package price, with the number of days it covers ("dès 15,00 € la journée").
        const cheapest = [...l.parking.pricingTiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
        return { ...this.summary(l), fromPriceCents: cheapest?.priceCents ?? null, fromDays: cheapest?.days ?? null };
      }),
    };
  }

  /** Published parkings at an airport for a stay: available ones first, cheapest first. */
  public async search(airportSlug: string, arrival?: string, ret?: string) {
    const airport = await this.airportBySlug(airportSlug);
    const stay = this.parseStay(airport, arrival, ret);
    if (!stay) throw new ValidationException({ arrivalAt: 'required', returnAt: 'required' });
    const listings = await this.publishedAt(airport.id);
    const results = await Promise.all(listings.map(async l => ({ ...this.summary(l), ...(await this.offer(l, stay)) })));
    results.sort((a, b) => Number(b.available) - Number(a.available) || (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
    return { airport: { code: airport.code, name: airport.name, slug: airport.slug }, results };
  }

  /** A published listing with its parking and pricing grid; 404 "not_found" otherwise. */
  public async findPublished(airport: Pick<Airport, 'id'>, slug: string, client: Client = prisma): Promise<ListingWithParking> {
    const listing = await client.listing.findFirst({
      where: { airportId: airport.id, slug, published: true },
      include: { parking: { include: { pricingTiers: { select: { days: true, priceCents: true }, orderBy: { days: 'asc' } } } } },
    });
    if (!listing) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return listing;
  }

  /** A parking's page, with the offer for a stay when dates are given. */
  public async parking(airportSlug: string, slug: string, arrival?: string, ret?: string) {
    const airport = await this.airportBySlug(airportSlug);
    const listing = await this.findPublished(airport, slug);
    const stay = this.parseStay(airport, arrival, ret);
    return {
      airport: { code: airport.code, name: airport.name, slug: airport.slug },
      parking: {
        ...this.summary(listing),
        description: listing.description,
        photos: listing.photos,
        address: listing.parking.address,
        phone: listing.contactPhone,
        pricing: { tiers: listing.parking.pricingTiers, extraDayPriceCents: listing.parking.extraDayPriceCents },
      },
      offer: stay ? await this.offer(listing, stay) : null,
    };
  }
}
