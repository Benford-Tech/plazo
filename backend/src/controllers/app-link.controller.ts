import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { AppLinkClaimDto, AppLinkResumeDto } from '@/dtos/app-link.dto';
import { visitorAddress } from '@/middlewares/rateLimiter';
import { AppLinkService } from '@/services/app-link.service';
import catchAsync from '@/utils/catchAsync';

export class AppLinkController {
  public links = Container.get(AppLinkService);

  /** GET /public/app-link/:code */
  public resolve = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.links.resolve(req.params.code as string));
  });

  /** POST /public/app-link/:code/claim */
  public claim = catchAsync(async (req: Request, res: Response) => {
    const data: AppLinkClaimDto = req.body;
    res.set('Cache-Control', 'no-store');
    await this.links.claim(req.params.code as string, visitorAddress(req) ?? 'unknown', data.platform);
    res.status(httpStatus.CREATED).json({ ok: true });
  });

  /** POST /public/app-link/resume */
  public resume = catchAsync(async (req: Request, res: Response) => {
    const data: AppLinkResumeDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.links.resume(visitorAddress(req) ?? 'unknown', data.platform, data.code));
  });
}
