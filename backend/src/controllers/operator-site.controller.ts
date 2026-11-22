import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { OperatorSiteService } from '@/services/operator-site.service';
import catchAsync from '@/utils/catchAsync';

/** « Mon site » (22/11/2026): the parking's own site made of blocks. */
export class OperatorSiteController {
  private service = Container.get(OperatorSiteService);

  public view = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.view(req.staff) });
  });

  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.update(req.staff, req.body ?? {}) });
  });

  public request = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.request(req.staff) });
  });

  public platformView = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.platformView(req.params.id as string) });
  });

  public setAddon = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.setAddon(req.staff, req.params.id as string, req.body?.active) });
  });

  public publicSite = catchAsync(async (req: Request, res: Response) => {
    const key = typeof req.query.apercu === 'string' ? req.query.apercu : undefined;
    const site = await this.service.publicSite(req.params.slug as string, key);
    res.set('Cache-Control', site.preview ? 'no-store' : 'public, max-age=60').json(site);
  });
}
