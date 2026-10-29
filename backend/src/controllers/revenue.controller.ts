import { Response } from 'express';
import { Container } from 'typedi';
import { SetPriceDto } from '@/dtos/reservation.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { CommissionService } from '@/services/commission.service';
import { RevenueService } from '@/services/revenue.service';
import catchAsync from '@/utils/catchAsync';

export class RevenueController {
  public revenue = Container.get(RevenueService);
  public commissions = Container.get(CommissionService);

  /** GET /internal/comparators/commissions */
  public commissionList = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.commissions.list(req.staff));
  });

  /** PUT /internal/comparators/commissions */
  public setCommission = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.commissions.setRate(req.staff, (req.body ?? {}) as Record<string, unknown>));
  });

  /** DELETE /internal/comparators/commissions/:key/:effectiveFrom */
  public removeCommission = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.commissions.removeRate(req.staff, String(req.params.key), String(req.params.effectiveFrom));
    res.status(204).end();
  });

  /** PUT /internal/reservations/:id/commission */
  public setReservationCommission = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.commissions.setOverride(req.staff, String(req.params.id), (req.body ?? {}) as Record<string, unknown>));
  });

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
    const { priceCents, paymentMethod } = req.body as SetPriceDto;
    res.json(await this.revenue.setPrice(req.staff, String(req.params.id), priceCents ?? null, paymentMethod));
  });
}
