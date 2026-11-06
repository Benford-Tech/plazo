import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { cleanAcquisition } from '@/domain/acquisition';
import { VisitDto } from '@/dtos/seo.dto';
import { SeoService } from '@/services/seo.service';
import catchAsync from '@/utils/catchAsync';

export class SeoController {
  public seo = Container.get(SeoService);

  /** POST /public/visits */
  public visit = catchAsync(async (req: Request, res: Response) => {
    const acquisition = cleanAcquisition(req.body as VisitDto);
    if (acquisition) await this.seo.recordVisit(acquisition);
    res.status(httpStatus.NO_CONTENT).end();
  });

  /** GET /internal/platform/seo */
  public report = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.seo.report(Number(req.query.days) || 30));
  });
}
