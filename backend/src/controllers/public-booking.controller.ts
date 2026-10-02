import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { CreatePublicBookingDto, LookupBookingDto, UpdateBookingFlightDto } from '@/dtos/public-booking.dto';
import { PublicBookingService } from '@/services/public-booking.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs).
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;

export class PublicBookingController {
  public bookingService = Container.get(PublicBookingService);

  /** POST /public/bookings */
  public create = catchAsync(async (req: Request, res: Response) => {
    const data: CreatePublicBookingDto = req.body;
    res.set('Cache-Control', 'no-store');
    const { replayed, ...created } = await this.bookingService.create(data);
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
    res.json(await this.bookingService.updateFlight(req.params.reference as string, bookingToken(req), data.returnFlight));
  });

  /** POST /public/bookings/:reference/checkout */
  public checkout = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.bookingService.checkout(req.params.reference as string, bookingToken(req)));
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
