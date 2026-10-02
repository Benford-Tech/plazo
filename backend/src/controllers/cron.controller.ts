import { Request, Response } from 'express';
import { Container } from 'typedi';
import { ArrivalService } from '@/services/arrival.service';
import { PaymentService } from '@/services/payment.service';
import { TokenService } from '@/services/token.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

export class CronController {
  public tokenService = Container.get(TokenService);
  public payments = Container.get(PaymentService);
  public arrivals = Container.get(ArrivalService);

  /** GET /internal/cron/expire-arrival-signals */
  public expireArrivalSignals = catchAsync(async (req: Request, res: Response) => {
    const ended = await this.arrivals.sweep();
    logger.info(`[Cron] ${ended} arrival signals ended`);
    res.json({ ended });
  });

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
    // Safety net of the arrival signals' retention (they are also ended lazily when read).
    const arrivalSignalsEnded = await this.arrivals.sweep();
    logger.info(`[Cron] ${deleted} expired staff tokens deleted, ${arrivalSignalsEnded} arrival signals ended`);
    res.json({ deleted, arrivalSignalsEnded });
  });
}
