import { Request, Response } from 'express';
import { Container } from 'typedi';
import { PublicService } from '@/services/public.service';
import catchAsync from '@/utils/catchAsync';

const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

export class PublicController {
  public publicService = Container.get(PublicService);

  /** GET /public/airports/:slug */
  public airport = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(await this.publicService.airport(req.params.slug as string));
  });

  /** GET /public/search?airport=&arrivalAt=&returnAt= */
  public search = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.publicService.search(str(req.query.airport) ?? '', str(req.query.arrivalAt), str(req.query.returnAt)));
  });

  /** GET /public/airports/:airport/parkings/:slug?arrivalAt=&returnAt= */
  public parking = catchAsync(async (req: Request, res: Response) => {
    res.json(
      await this.publicService.parking(req.params.airport as string, req.params.slug as string, str(req.query.arrivalAt), str(req.query.returnAt)),
    );
  });
}
