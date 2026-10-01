import { Request, Response } from 'express';
import { Container } from 'typedi';
import { TokenService } from '@/services/token.service';
import catchAsync from '@/utils/catchAsync';
import { logger } from '@/utils/logger';

export class CronController {
  public tokenService = Container.get(TokenService);

  /** GET /internal/cron/purge-expired-tokens */
  public purgeExpiredTokens = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.tokenService.deleteExpired();
    logger.info(`[Cron] ${deleted} expired staff tokens deleted`);
    res.json({ deleted });
  });
}
