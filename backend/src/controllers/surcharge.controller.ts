import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
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
}
