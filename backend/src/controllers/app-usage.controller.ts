import { Request, Response } from 'express';
import { Container } from 'typedi';
import { AppUsageService } from '@/services/app-usage.service';
import catchAsync from '@/utils/catchAsync';

export class AppUsageController {
  public usage = Container.get(AppUsageService);

  /** GET /internal/platform/apps */
  public report = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.usage.report(Number(req.query.days) || 30));
  });
}
