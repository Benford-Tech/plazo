import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ReservationSurchargeService } from '@/services/reservation-surcharge.service';
import { SurchargeService } from '@/services/surcharge.service';
import catchAsync from '@/utils/catchAsync';

/** The parking's supplements (12/11/2026). */
export class SurchargeController {
  public surcharges = Container.get(SurchargeService);

  /** GET /internal/parkings/:id/surcharges */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.surcharges.get(req.staff, req.params.id as string));
  });

  /** PUT /internal/parkings/:id/surcharges */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.surcharges.update(req.staff, req.params.id as string, req.body ?? {}));
  });

  public booking = Container.get(ReservationSurchargeService);

  /** GET /internal/reservations/:id/surcharges */
  public onBooking = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.booking.list(req.staff, req.params.id as string));
  });

  /** POST /internal/reservations/:id/surcharges */
  public addToBooking = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.booking.add(req.staff, req.params.id as string, req.body ?? {}));
  });

  /** DELETE /internal/reservations/:id/surcharges/:surchargeId */
  public removeFromBooking = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.booking.remove(req.staff, req.params.id as string, req.params.surchargeId as string));
  });

  /** POST /internal/reservations/:id/surcharges/dismiss */
  public dismissSuggestion = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.booking.dismiss(req.staff, req.params.id as string));
  });
}
