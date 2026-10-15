import { Response } from 'express';
import { Container } from 'typedi';
import { SetTestFeedDto } from '@/dtos/test-feed.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { TestFeedService } from '@/services/test-feed.service';
import catchAsync from '@/utils/catchAsync';

export class TestFeedController {
  public feed = Container.get(TestFeedService);

  /** GET /internal/test-feed */
  public view = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json({ data: await this.feed.view(req.staff) });
  });

  /** PUT /internal/test-feed { enabled } */
  public set = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const { enabled } = req.body as SetTestFeedDto;
    res.json({ data: await this.feed.setEnabled(req.staff, enabled) });
  });

  /** POST /internal/test-feed/run */
  public run = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.feed.runNow(req.staff) });
  });
}
