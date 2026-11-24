import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ProSubscriptionService } from '@/services/pro-subscription.service';
import catchAsync from '@/utils/catchAsync';

/** The operator's Plazo Pro subscription (17/11/2026, direction B). */
export class ProSubscriptionController {
  public subscriptions = Container.get(ProSubscriptionService);

  public view = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.subscriptions.view(req.staff.operatorId));
  });

  public invoices = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.subscriptions.invoices(req.staff.operatorId));
  });

  public subscribe = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.subscribe(req.staff, req.body ?? {}));
  });

  public sync = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.refresh(req.staff.operatorId));
  });

  public preview = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.subscriptions.preview(req.staff.operatorId, req.query as { plan?: unknown; yearly?: unknown }));
  });

  public change = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.change(req.staff, req.body ?? {}));
  });

  public paymentMethodSetup = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.paymentMethodSetup(req.staff.operatorId));
  });

  public paymentMethodConfirm = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.paymentMethodConfirm(req.staff, req.body ?? {}));
  });

  public cancel = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.setCancelAtPeriodEnd(req.staff, true));
  });

  public resume = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.setCancelAtPeriodEnd(req.staff, false));
  });

  public platformPrice = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.subscriptions.platformView(req.params.id as string));
  });

  public setPlatformPrice = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.setAgreedPrice(req.staff, req.params.id as string, req.body ?? {}));
  });

  public setPlatformBilling = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.subscriptions.setBillingHidden(req.staff, req.params.id as string, req.body ?? {}));
  });
}
