import { Request, Response } from 'express';
import { Container } from 'typedi';
import { PublicService } from '@/services/public.service';
import catchAsync from '@/utils/catchAsync';

const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

export class PublicController {
  public publicService = Container.get(PublicService);

  /** GET /public/config */
  public config = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(this.publicService.config());
  });

  /** GET /public/airports */
  public airports = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(await this.publicService.airports());
  });

  /** GET /public/airports/:slug */
  public airport = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(await this.publicService.airport(req.params.slug as string));
  });

  /** GET /public/airports/:slug/live — polled by the home map every 12 s, never cached. */
  public live = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.publicService.live(req.params.slug as string));
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
