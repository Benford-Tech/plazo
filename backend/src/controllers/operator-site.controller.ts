import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { OperatorSiteService, type SitePhotoKind } from '@/services/operator-site.service';
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

  public setDomain = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.setDomain(req.staff, req.body?.domain) });
  });

  public checkDomain = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.checkDomain(req.staff) });
  });

  public setDomainActive = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.setDomainActive(req.staff, req.params.id as string, req.body?.active) });
  });

  public byDomain = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60').json(await this.service.byDomain(req.params.host as string));
  });

  public platformView = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.platformView(req.params.id as string) });
  });

  public setAddon = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.service.setAddon(req.staff, req.params.id as string, req.body?.active) });
  });

  public setPhoto = (kind: SitePhotoKind) =>
    catchAsync(async (req: RequestWithStaffSession, res: Response) => {
      res.json({ data: await this.service.setPhoto(req.staff, kind, req.body) });
    });

  public removePhoto = (kind: SitePhotoKind) =>
    catchAsync(async (req: RequestWithStaffSession, res: Response) => {
      res.json({ data: await this.service.removePhoto(req.staff, kind) });
    });

  /** Public images of a site. They are shown on the parking's own host too: any site may display them. */
  private image = (res: Response, photo: { contentType: string; size?: number | null; stream: NodeJS.ReadableStream }, cache: string) => {
    res.set('Content-Type', photo.contentType);
    res.set('Cache-Control', cache);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (photo.size != null) res.set('Content-Length', String(photo.size));
    photo.stream.pipe(res);
  };

  public photo = (kind: SitePhotoKind) =>
    catchAsync(async (req: Request, res: Response) => {
      this.image(res, await this.service.photo(req.params.slug as string, kind, req.params.file as string), 'public, max-age=604800, immutable');
    });

  public logo = catchAsync(async (req: Request, res: Response) => {
    this.image(res, await this.service.logo(req.params.slug as string), 'public, max-age=3600');
  });

  public contact = catchAsync(async (req: Request, res: Response) => {
    const key = typeof req.query.apercu === 'string' ? req.query.apercu : undefined;
    res.status(httpStatus.ACCEPTED).json(await this.service.contact(req.params.slug as string, req.body, key));
  });

  public publicSite = catchAsync(async (req: Request, res: Response) => {
    const key = typeof req.query.apercu === 'string' ? req.query.apercu : undefined;
    const site = await this.service.publicSite(req.params.slug as string, key);
    res.set('Cache-Control', site.preview ? 'no-store' : 'public, max-age=60').json(site);
  });
}
