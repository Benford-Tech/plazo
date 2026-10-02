import { Request, Response } from 'express';
import { Container } from 'typedi';
import { UpdatePayoutSettingsDto } from '@/dtos/payment.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { PaymentService } from '@/services/payment.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

/** The webhook's raw body: a Buffer from RawBodyMiddleware (app.ts). */
function rawBody(req: Request): Buffer | undefined {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  logger.error('[Payments] Stripe webhook without its raw body: the signature cannot be checked');
  return undefined;
}

export class PaymentController {
  public payments = Container.get(PaymentService);

  /** POST /internal/payments/onboarding */
  public onboarding = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.payments.onboarding(req.staff));
  });

  /** GET /internal/payments/status */
  public status = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.payments.status(req.staff));
  });

  /** GET /internal/payments/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.payments.payoutSettings(req.staff));
  });

  /** PUT /internal/payments/settings */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdatePayoutSettingsDto = req.body;
    res.json(await this.payments.updatePayoutSettings(req.staff, data.payoutSchedule));
  });

  /** POST /public/stripe/webhook */
  public webhook = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.payments.handleWebhook(rawBody(req), req.get('stripe-signature') || undefined));
  });
}
