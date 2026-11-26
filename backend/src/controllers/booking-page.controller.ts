import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { BookingPageService } from '@/services/booking-page.service';
import catchAsync from '@/utils/catchAsync';

/** « Ma page de réservation » (Site du parking, niveau 3, 19/11/2026). */
export class BookingPageController {
  private service = Container.get(BookingPageService);

  public view = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.view(req.staff) });
  });

  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.update(req.staff, req.body ?? {}) });
  });

  public publicPage = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60').json(await this.service.publicPage(req.params.slug as string));
  });

  public fullNights = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60').json(await this.service.fullNights(req.params.slug as string, req.query.month));
  });
}
