import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { LiveSyncService } from '@/services/live-sync.service';
import catchAsync from '@/utils/catchAsync';

export class LiveSyncController {
  public sync = Container.get(LiveSyncService);

  /** GET /internal/sync */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.sync.version(req.staff));
  });
}
