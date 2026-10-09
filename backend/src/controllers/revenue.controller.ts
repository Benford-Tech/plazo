import { Response } from 'express';
import { Container } from 'typedi';
import { SetPriceDto } from '@/dtos/reservation.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { RevenueService } from '@/services/revenue.service';
import catchAsync from '@/utils/catchAsync';

export class RevenueController {
  public revenue = Container.get(RevenueService);

  /** GET /internal/revenue?from=&to=&basis= */
  public report = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.revenue.report(req.staff, req.query));
  });

  /** GET /internal/revenue/summary */
  public summary = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.revenue.summary(req.staff));
  });

  /** GET /internal/revenue/export?from=&to=&basis= */
  public export = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const { filename, body } = await this.revenue.csv(req.staff, req.query);
    res.set('Cache-Control', 'no-store');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  });

  /** PUT /internal/reservations/:id/price */
  public setPrice = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const { priceCents } = req.body as SetPriceDto;
    res.json(await this.revenue.setPrice(req.staff, String(req.params.id), priceCents ?? null));
  });
}
