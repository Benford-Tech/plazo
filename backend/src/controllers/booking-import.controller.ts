import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { BookingImportService } from '@/services/booking-import.service';
import catchAsync from '@/utils/catchAsync';

export class BookingImportController {
  public imports = Container.get(BookingImportService);

  /** POST /internal/reservations/import */
  public run = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.imports.run(req.staff, req.body));
  });

  /** GET /internal/reservations/imports */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.imports.list(req.staff));
  });

  /** POST /internal/reservations/imports/:id/undo */
  public undo = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.imports.undo(req.staff, String(req.params.id)));
  });
}
