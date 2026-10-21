import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ProspectDemoService } from '@/services/prospect-demo.service';
import catchAsync from '@/utils/catchAsync';

/** 21/10/2026 (« mets un environnement de démo de l'app », A + B + C). */
export class DemoController {
  public demo = Container.get(ProspectDemoService);

  /** POST /internal/auth/demo { role, token? } → { tokenData, user } */
  public enter = catchAsync(async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { role?: unknown; token?: unknown };
    res.status(httpStatus.OK).json(await this.demo.enter(body, { userAgent: req.get('user-agent') ?? null }));
  });

  /** GET /public/demo/links/:token → { status, companyName } */
  public link = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.demo.linkStatus(String(req.params.token)));
  });

  /** POST /internal/platform/prospects/:id/demo-link { renew? } → the link */
  public prospectLink = catchAsync(async (req: Request, res: Response) => {
    const actor = (req as RequestWithStaffSession).staff;
    const renew = (req.body as { renew?: unknown } | undefined)?.renew === true;
    res.json({ data: await this.demo.linkForProspect(String(req.params.id), actor.id, { renew }) });
  });
}
