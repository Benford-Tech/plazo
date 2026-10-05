import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { DashboardService } from '@/services/dashboard.service';
import catchAsync from '@/utils/catchAsync';

export class DashboardController {
  public dashboard = Container.get(DashboardService);

  /** GET /internal/dashboard */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.dashboard.get(req.staff));
  });
}
