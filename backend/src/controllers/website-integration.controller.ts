import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { WebsiteIntegrationService } from '@/services/website-integration.service';
import { WordpressPluginService } from '@/services/wordpress-plugin.service';
import catchAsync from '@/utils/catchAsync';

/** Site du parking (19/11/2026, niveau 2 « l'extension WordPress Plazo »). */
export class WebsiteIntegrationController {
  private service = Container.get(WebsiteIntegrationService);
  private plugin = Container.get(WordpressPluginService);

  public view = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.view(req.staff) });
  });

  public rotate = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.rotate(req.staff) });
  });

  public revoke = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.revoke(req.staff) });
  });

  public status = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store').json(await this.service.status(req.get('x-plazo-site-key')));
  });

  public quote = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store').json(await this.service.quote(req.get('x-plazo-site-key'), req.query));
  });

  public book = catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await this.service.book(req.get('x-plazo-site-key'), req.body, req.get('x-plazo-site-url')));
  });

  public download = catchAsync(async (_req: Request, res: Response) => {
    res
      .set('Content-Type', 'application/zip')
      .set('Content-Disposition', 'attachment; filename="plazo.zip"')
      .set('Cache-Control', 'public, max-age=3600')
      .send(this.plugin.zip());
  });
}
