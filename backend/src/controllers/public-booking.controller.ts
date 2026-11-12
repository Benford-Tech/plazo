import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ChildSeatsDto } from '@/dtos/child-seats.dto';
import { CreatePublicBookingDto, LookupBookingDto, UpdateBookingFlightDto, CarLocationDto } from '@/dtos/public-booking.dto';
import { cleanAcquisition } from '@/domain/acquisition';
import { fromSite } from '@/middlewares/rateLimiter';
import { PublicBookingService } from '@/services/public-booking.service';
import { WhatsappInboxService } from '@/services/whatsapp-inbox.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs).
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;

export class PublicBookingController {
  public bookingService = Container.get(PublicBookingService);
  public inbox = Container.get(WhatsappInboxService);

  /** GET /public/bookings/:reference/messages (12/11/2026, « Écrire au parking » from the Plazo app) */
  public messages = catchAsync(async (req: Request, res: Response) => {
    const booking = await this.bookingService.load(req.params.reference as string, bookingToken(req));
    res.set('Cache-Control', 'no-store');
    res.json(await this.inbox.travellerThread(booking));
  });

  /** POST /public/bookings/:reference/messages { text } */
  public writeMessage = catchAsync(async (req: Request, res: Response) => {
    const booking = await this.bookingService.load(req.params.reference as string, bookingToken(req));
    res.set('Cache-Control', 'no-store');
    res.status(httpStatus.CREATED).json(await this.inbox.travellerWrite(booking, req.body?.text));
  });

  /** POST /public/bookings */
  public create = catchAsync(async (req: Request, res: Response) => {
    const data: CreatePublicBookingDto = req.body;
    res.set('Cache-Control', 'no-store');
    // 06/11/2026 (SEO local M1): the site says where the visit came from; any other client is the Plazo app.
    const acquisition = fromSite(req) ? cleanAcquisition(data.acquisition) : { source: 'app' as const, detail: '', landing: '' };
    const { replayed, ...created } = await this.bookingService.create(data, acquisition);
    // A form sent again (same idempotency key) gets the booking already made.
    res.status(replayed ? httpStatus.OK : httpStatus.CREATED).json(created);
  });

  /** POST /public/bookings/lookup */
  public lookup = catchAsync(async (req: Request, res: Response) => {
    const data: LookupBookingDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.lookup(data));
  });

  /** GET /public/bookings/:reference */
  public get = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.get(req.params.reference as string, bookingToken(req)));
  });

  /** PATCH /public/bookings/:reference/flight */
  public updateFlight = catchAsync(async (req: Request, res: Response) => {
    const data: UpdateBookingFlightDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.updateFlight(req.params.reference as string, bookingToken(req), data.returnFlight, data.departureFlight));
  });

  /** PUT /public/bookings/:reference/child-seats (24/10/2026) */
  public updateChildSeats = catchAsync(async (req: Request, res: Response) => {
    const data: ChildSeatsDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.updateChildSeats(req.params.reference as string, bookingToken(req), data));
  });

  /** PUT /public/bookings/:reference/car-location */
  public locateCar = catchAsync(async (req: Request, res: Response) => {
    const data: CarLocationDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.locateCar(req.params.reference as string, bookingToken(req), data));
  });

  /** DELETE /public/bookings/:reference/car-location */
  public clearCarLocation = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.clearCarLocation(req.params.reference as string, bookingToken(req)));
  });

  /** POST /public/bookings/:reference/checkout */
  public checkout = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.checkout(req.params.reference as string, bookingToken(req)));
  });

  /** POST /public/bookings/:reference/payment-intent */
  public paymentIntent = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.paymentIntent(req.params.reference as string, bookingToken(req)));
  });

  /** POST /public/bookings/:reference/release */
  public release = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.release(req.params.reference as string, bookingToken(req)));
  });

  /** POST /public/bookings/:reference/cancel */
  public cancel = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.cancel(req.params.reference as string, bookingToken(req)));
  });
}
