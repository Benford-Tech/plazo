import { Response } from 'express';
import { Container } from 'typedi';
import { DATE_RE } from '@/domain/time';
import { ExcludeReminderDto, TestReminderDto, UpdateReminderEveningDto, UpdateReminderSettingsDto } from '@/dtos/reminder.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ValidationException } from '@/middlewares/validation.middleware';
import { ReminderService } from '@/services/reminder.service';
import catchAsync from '@/utils/catchAsync';

function dateParam(value: unknown, field: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) throw new ValidationException({ [field]: 'invalid_date' });
  return value;
}

export class ReminderController {
  public reminders = Container.get(ReminderService);

  /** GET /internal/parkings/:id/reminders?evening=YYYY-MM-DD */
  public board = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const evening = req.query.evening === undefined ? undefined : dateParam(req.query.evening, 'evening');
    res.set('Cache-Control', 'no-store');
    res.json(await this.reminders.board(req.staff, req.params.id as string, evening));
  });

  /** PUT /internal/parkings/:id/reminders */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateReminderSettingsDto = req.body;
    res.json(await this.reminders.updateSettings(req.staff, req.params.id as string, data));
  });

  /** PUT /internal/parkings/:id/reminders/evenings/:date */
  public updateEvening = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateReminderEveningDto = req.body;
    res.json(await this.reminders.updateEvening(req.staff, req.params.id as string, dateParam(req.params.date, 'date'), data));
  });

  /** POST /internal/parkings/:id/reminders/evenings/:date/send */
  public sendNow = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.reminders.sendEveningNow(req.staff, req.params.id as string, dateParam(req.params.date, 'date')));
  });

  /** POST /internal/parkings/:id/reminders/test */
  public test = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: TestReminderDto = req.body;
    res.json(await this.reminders.sendTest(req.staff, req.params.id as string, data));
  });

  /** PUT /internal/reservations/:id/reminder */
  public exclude = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ExcludeReminderDto = req.body;
    res.json(await this.reminders.setExcluded(req.staff, req.params.id as string, data.excluded));
  });
}
