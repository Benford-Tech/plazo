import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ReturnNoticeDto } from '@/dtos/arrival.dto';
import { TravellerDeviceDto } from '@/dtos/shuttle.dto';
import { ReturnService } from '@/services/return.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs). The traveller's position
// for the route travels in the query of a GET (short-lived, never logged by the service): the
// rounded coordinates only serve the routing call.
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;
const reference = (req: Request) => req.params.reference as string;

export class ReturnController {
  public returns = Container.get(ReturnService);

  /** GET /public/bookings/:reference/return */
  public state = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.state(reference(req), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/return/landed */
  public landed = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.landed(reference(req), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/return/notice */
  public notice = catchAsync(async (req: Request, res: Response) => {
    const data: ReturnNoticeDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.notice(reference(req), bookingToken(req), data.kind, data.text));
  });

  /** GET /public/bookings/:reference/return/route?lat=&lng= */
  public route = catchAsync(async (req: Request, res: Response) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const from = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.route(reference(req), bookingToken(req), from));
  });

  /** GET /public/bookings/:reference/shuttles */
  public shuttles = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.stayShuttles(reference(req), bookingToken(req)));
  });

  /** PUT /public/bookings/:reference/devices */
  public registerDevice = catchAsync(async (req: Request, res: Response) => {
    const data: TravellerDeviceDto = req.body;
    res.json(await this.returns.registerDevice(reference(req), bookingToken(req), data.subscriptionId.trim(), data.platform));
  });

  /** DELETE /public/bookings/:reference/devices/:subscriptionId */
  public unregisterDevice = catchAsync(async (req: Request, res: Response) => {
    await this.returns.unregisterDevice(reference(req), bookingToken(req), req.params.subscriptionId as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** GET /public/bookings/:reference/shuttle */
  public shuttle = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.returns.shuttleStatus(reference(req), bookingToken(req)));
  });
}
