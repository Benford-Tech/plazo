import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ExtraService } from '@/services/extra.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs).
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;
const param = (req: Request, name: string) => req.params[name] as string;

/** Services for the car (21/10/2026). */
export class ExtraController {
  public extras = Container.get(ExtraService);

  /** GET /internal/parkings/:id/extras */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.extras.settings(req.staff, param(req, 'id')));
  });

  /** PUT /internal/parkings/:id/extras */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.extras.updateSettings(req.staff, param(req, 'id'), req.body ?? {}));
  });

  /** GET /internal/reservations/:id/extras */
  public staffOrders = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.extras.staffOrders(req.staff, param(req, 'id')));
  });

  /** POST /internal/reservations/:id/extras/:extraId/done */
  public done = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.extras.markDone(req.staff, param(req, 'id'), param(req, 'extraId')));
  });

  /** POST /internal/reservations/:id/extras/:extraId/refuse */
  public refuse = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.extras.refuse(req.staff, param(req, 'id'), param(req, 'extraId'), req.body?.reason));
  });

  /** GET /public/bookings/:reference/extras */
  public travellerView = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.extras.travellerView(param(req, 'reference'), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/extras */
  public order = catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await this.extras.order(param(req, 'reference'), bookingToken(req), req.body?.kind));
  });

  /** POST /public/bookings/:reference/extras/:extraId/sync */
  public sync = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.extras.sync(param(req, 'reference'), bookingToken(req), param(req, 'extraId')));
  });

  /** DELETE /public/bookings/:reference/extras/:extraId */
  public abandon = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.extras.abandon(param(req, 'reference'), bookingToken(req), param(req, 'extraId')));
  });
}
