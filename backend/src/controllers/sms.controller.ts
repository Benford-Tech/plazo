import { Response } from 'express';
import { Container } from 'typedi';
import { TestSmsDto, UpdateSmsSettingsDto } from '@/dtos/sms.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { SmsService } from '@/services/sms.service';
import catchAsync from '@/utils/catchAsync';

export class SmsController {
  public sms = Container.get(SmsService);

  /** GET /internal/sms/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.sms.settings(req.staff));
  });

  /** PUT /internal/sms/settings */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateSmsSettingsDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.sms.update(req.staff, data));
  });

  /** POST /internal/sms/test */
  public test = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: TestSmsDto = req.body;
    res.json(await this.sms.test(req.staff, data.to));
  });

  /** POST /internal/sms/disable */
  public disable = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.sms.disable(req.staff));
  });

  /** GET /internal/sms/status */
  public status = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.sms.status(req.staff));
  });
}
