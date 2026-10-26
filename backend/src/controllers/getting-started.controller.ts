import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { GettingStartedService } from '@/services/getting-started.service';
import catchAsync from '@/utils/catchAsync';

export class GettingStartedController {
  public gettingStarted = Container.get(GettingStartedService);

  /** GET /internal/getting-started */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.gettingStarted.get(req.staff));
  });
}
