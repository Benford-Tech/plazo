import { Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { OperatorLogoService } from '@/services/operator-logo.service';
import catchAsync from '@/utils/catchAsync';

export class OperatorLogoController {
  public logos = Container.get(OperatorLogoService);

  /** POST /internal/operator/logo */
  public set = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.logos.set(req.staff, req.body));
  });

  /** DELETE /internal/operator/logo */
  public remove = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.logos.remove(req.staff);
    res.status(httpStatus.NO_CONTENT).end();
  });

  /** GET /internal/operator/logo */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const logo = await this.logos.get(req.staff);
    res.set('Content-Type', logo.contentType);
    // Asked with the logo's date (?v=): a changed logo is a new address, so a long private cache is safe.
    res.set('Cache-Control', 'private, max-age=86400');
    if (logo.size != null) res.set('Content-Length', String(logo.size));
    logo.stream.pipe(res);
  });
}
