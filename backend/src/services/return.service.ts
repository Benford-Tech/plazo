import { Container, Service } from 'typedi';
import httpStatus from 'http-status';
import { ON_SITE_STATUSES } from '@/domain/reservation';
import { ReturnNotice, ReturnNoticeKind, returnNoticePush, returnNoticeView } from '@/domain/return-messages';
import { HttpException } from '@/utils/httpException';
import { CarLocation, carView, CLEARED_CAR_LOCATION } from '@/domain/car-location';
import prisma from '@/database';
import { arrivalWindows, LatLng } from '@/domain/arrival';
import { BookingRecord } from '@/domain/booking-view';
import { localDateTime } from '@/domain/time';
import { ArrivalService, MeetingPoint } from './arrival.service';
import { FileService } from './file.service';
import { FlightTrackingService } from './flight-tracking.service';
import { ParkingLocationService } from './parking-location.service';
import { PublicBookingService } from './public-booking.service';
import { PushService } from './push.service';
import { RoutingService, WalkingRoute } from './routing.service';
import { flightView, FlightView, ShuttleService, StayShuttles, TravellerShuttle } from './shuttle.service';

export interface TravellerReturn {
  reference: string;
  status: string;
  /** Local wall-clock time of the return typed at booking ("2026-10-10T15:05"). */
  returnAt: string;
  /** The return block applies: vehicle on site and within the return window. */
  returnDay: boolean;
  flight: FlightView;
  /** Whether a provider tracks flights (else the traveller says "J'ai atterri"). */
  flightTracked: boolean;
  meetingPoint: MeetingPoint | null;
  /** The traveller signalled they are at the meeting point (arrival signal, return moment). */
  atMeetingPointAt: string | null;
  shuttle: TravellerShuttle | null;
  parking: { name: string; phone: string | null; shuttleMinutes: number | null; address: string | null; location: LatLng | null };
  plate: string;
  /** The spot the valet placed the vehicle on (bloc 2), for "Retrouver ma voiture"; null until placed. */
  spot: { code: string; stayClass: string | null } | null;
  /** S-C (07/10/2026): the file the valet put the car in and its position from the aisle (1 = first out). */
  file: { code: string; position: number | null } | null;
  /** E (06/10/2026): what the traveller signalled on the return day ("mon vol a du retard"); null until then. */
  notice: ReturnNotice | null;
  /** Where the car is parked (GPS), recorded by the traveller or the valet; null until then. */
  car: CarLocation | null;
}

/** The return day of a traveller: the flight, the meeting point, the walking route and the shuttle. */
@Service()
export class ReturnService {
  public arrivals = Container.get(ArrivalService);
  public bookings = Container.get(PublicBookingService);
  public flights = Container.get(FlightTrackingService);
  public filesService = Container.get(FileService);
  public routing = Container.get(RoutingService);
  public shuttle = Container.get(ShuttleService);
  public locations = Container.get(ParkingLocationService);
  public push = Container.get(PushService);

  public async state(reference: string, token: string | undefined): Promise<TravellerReturn> {
    const booking = await this.bookings.load(reference, token);
    // Lazy refresh (5-minute cache): the block works without the cron.
    await this.flights.refreshBookings([booking.id]);
    return this.view(booking);
  }

  /** "J'ai atterri": the flight counts as landed from now on. */
  public async landed(reference: string, token: string | undefined): Promise<TravellerReturn> {
    const booking = await this.bookings.load(reference, token);
    await this.flights.markLandedByTraveller(booking);
    return this.view(booking);
  }

  /**
   * E (06/10/2026): "Mon vol a du retard", "Bagage perdu", or a word — while the vehicle is on site.
   * Kept on the booking (the driver's list and the operational card show it) and pushed to the
   * staff who follow the returns. 409 "vehicle_not_on_site" otherwise.
   */
  public async notice(
    reference: string,
    token: string | undefined,
    kind: ReturnNoticeKind,
    text: string | null | undefined,
  ): Promise<TravellerReturn> {
    const booking = await this.bookings.load(reference, token);
    if (!ON_SITE_STATUSES.includes(booking.status)) {
      throw new HttpException(httpStatus.CONFLICT, 'The vehicle is not at the parking', 'vehicle_not_on_site');
    }
    const clean = text?.trim() || null;
    await prisma.reservation.update({
      where: { id: booking.id },
      data: { returnNoticeKind: kind, returnNoticeText: clean, returnNoticeAt: new Date() },
    });
    await this.push.notifyStaff(
      booking.operatorId,
      'returns',
      returnNoticePush({ customerName: booking.customerName, plate: booking.plate, kind, text: clean }),
      {
        data: { type: 'return_notice', kind, reservationId: booking.id },
        collapseId: `return-notice-${booking.id}`,
      },
    );
    return this.view(booking);
  }

  /** The walking route from the traveller (or the terminal) to the meeting point. */
  public async route(
    reference: string,
    token: string | undefined,
    from: LatLng | null,
  ): Promise<WalkingRoute & { meetingPoint: MeetingPoint | null }> {
    const booking = await this.bookings.load(reference, token);
    const meeting = await this.arrivals.meetingPoint(booking, 'return');
    if (!meeting) {
      const nowhere = { lat: 0, lng: 0 };
      return { ...this.routing.straightLine(nowhere, nowhere), geometry: [], meetingPoint: null };
    }
    // Without a position (location refused): from the airport's terminal reference point.
    const airport = booking.parking.listing?.airport;
    const start = from ?? (airport ? { lat: airport.latitude, lng: airport.longitude } : null) ?? meeting;
    const route = await this.routing.walkingRoute(`${booking.id}:${from ? 'me' : 'terminal'}`, start, meeting);
    return { ...route, meetingPoint: meeting };
  }

  /** The "Navette" block of a booking during its stay (S-A): polled every 12 s while open. */
  public async stayShuttles(reference: string, token: string | undefined): Promise<StayShuttles> {
    const booking = await this.bookings.load(reference, token);
    return this.shuttle.forStay(booking);
  }

  /** N-A: the traveller's phone, registered for the pushes about their shuttle (one phone, one booking). */
  public async registerDevice(reference: string, token: string | undefined, subscriptionId: string, platform?: string | null) {
    const booking = await this.bookings.load(reference, token);
    const device = await prisma.travellerDevice.upsert({
      where: { subscriptionId },
      create: { reservationId: booking.id, subscriptionId, platform: platform ?? null },
      update: { reservationId: booking.id, platform: platform ?? null },
    });
    return { subscriptionId: device.subscriptionId, platform: device.platform };
  }

  public async unregisterDevice(reference: string, token: string | undefined, subscriptionId: string) {
    const booking = await this.bookings.load(reference, token);
    await prisma.travellerDevice.deleteMany({ where: { subscriptionId, reservationId: booking.id } });
  }

  /** Retention: the cars' positions of bookings whose return is two days past. */
  public async purgeCarLocations(now = new Date()): Promise<number> {
    const { count } = await prisma.reservation.updateMany({
      where: { returnAt: { lt: new Date(now.getTime() - 2 * 86400000) }, carLocatedAt: { not: null } },
      data: CLEARED_CAR_LOCATION,
    });
    return count;
  }

  /** Retention: the phones of bookings whose return is two days past (also removed with the booking). */
  public async purgeDevices(now = new Date()): Promise<number> {
    const { count } = await prisma.travellerDevice.deleteMany({
      where: { reservation: { returnAt: { lt: new Date(now.getTime() - 2 * 86400000) } } },
    });
    return count;
  }

  /** Polled every 10 s while the trip card is open. */
  public async shuttleStatus(reference: string, token: string | undefined): Promise<{ shuttle: TravellerShuttle | null; serverTime: string }> {
    const booking = await this.bookings.load(reference, token);
    return { shuttle: await this.shuttle.forTraveller(booking.id), serverTime: new Date().toISOString() };
  }

  private async view(booking: BookingRecord): Promise<TravellerReturn> {
    const fresh = await prisma.reservation.findUniqueOrThrow({
      where: { id: booking.id },
      include: { spot: { select: { code: true, stayClass: true } }, file: { select: { id: true, code: true } } },
    });
    const location = (await this.locations.locations([booking.parking.id])).get(booking.parking.id) ?? null;
    const now = new Date();
    const window = arrivalWindows(fresh).return;
    const onSite = ON_SITE_STATUSES.includes(fresh.status);
    const signal = await prisma.arrivalSignal.findUnique({ where: { reservationId_kind: { reservationId: booking.id, kind: 'return' } } });
    const listing = booking.parking.listing;
    return {
      reference: booking.reference,
      status: fresh.status,
      returnAt: localDateTime(fresh.returnAt, booking.parking.timezone),
      returnDay: onSite && now >= window.opensAt && now <= window.closesAt,
      flight: flightView(fresh),
      flightTracked: this.flights.enabled(),
      meetingPoint: await this.arrivals.meetingPoint(booking, 'return'),
      atMeetingPointAt: signal?.state === 'at_meeting_point' && signal.atMeetingPointAt ? signal.atMeetingPointAt.toISOString() : null,
      shuttle: onSite ? await this.shuttle.forTraveller(booking.id) : null,
      parking: {
        name: listing?.title ?? booking.parking.name,
        phone: listing?.contactPhone ?? null,
        shuttleMinutes: listing?.shuttleMinutes ?? booking.parking.shuttleTravelMinutes,
        address: booking.parking.address,
        location,
      },
      plate: fresh.plate,
      spot: onSite && fresh.spot ? { code: fresh.spot.code, stayClass: fresh.spot.stayClass } : null,
      file: onSite && fresh.file ? { code: fresh.file.code, position: await this.filesService.positionOf(fresh.file.id, fresh.id) } : null,
      notice: returnNoticeView(fresh),
      car: carView(fresh),
    };
  }
}
