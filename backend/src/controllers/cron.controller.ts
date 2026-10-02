import { Request, Response } from 'express';
import { Container } from 'typedi';
import { PaymentService } from '@/services/payment.service';
import { TokenService } from '@/services/token.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

export class CronController {
  public tokenService = Container.get(TokenService);
  public payments = Container.get(PaymentService);

  /** GET /internal/cron/payouts */
  public payouts = catchAsync(async (req: Request, res: Response) => {
    const result = await this.payments.runPayouts();
    logger.info(`[Cron] Payouts: ${JSON.stringify(result)}`);
    res.json(result);
  });

  /** GET /internal/cron/expire-payment-holds */
  public expirePaymentHolds = catchAsync(async (req: Request, res: Response) => {
    const expired = await this.payments.expireLapsedHolds();
    logger.info(`[Cron] ${expired} lapsed payment holds expired`);
    res.json({ expired });
  });

  /** GET /internal/cron/purge-expired-tokens */
  public purgeExpiredTokens = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.tokenService.deleteExpired();
    logger.info(`[Cron] ${deleted} expired staff tokens deleted`);
    res.json({ deleted });
  });
}
