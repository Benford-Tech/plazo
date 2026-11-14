import { Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { WhatsappNumberService } from '@/services/whatsapp-number.service';
import catchAsync from '@/utils/catchAsync';

/** 14/11/2026: a parking's own WhatsApp number (chemin 1, numéros sur le compte de Benford Tech). */
export class WhatsappNumberController {
  public numbers = Container.get(WhatsappNumberService);

  private id = (req: RequestWithStaffSession) => req.params.id as string;

  /** POST /internal/whatsapp/number/request */
  public request = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.request(req.staff));
  });

  /** GET /internal/platform/operators/:id/whatsapp-number */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.numbers.platformView(this.id(req)));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number { phone } */
  public add = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.add(req.staff, this.id(req), req.body ?? {}));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number/link { phoneNumberId } */
  public link = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.link(req.staff, this.id(req), req.body ?? {}));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number/code { method } */
  public code = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.requestCode(req.staff, this.id(req), req.body ?? {}));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number/verify { code } */
  public verify = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.verify(req.staff, this.id(req), req.body ?? {}));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number/check */
  public check = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.check(req.staff, this.id(req)));
  });

  /** POST /internal/platform/operators/:id/whatsapp-number/pause | resume */
  public pause = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.setPaused(req.staff, this.id(req), true));
  });
  public resume = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.setPaused(req.staff, this.id(req), false));
  });

  /** DELETE /internal/platform/operators/:id/whatsapp-number */
  public remove = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.numbers.remove(req.staff, this.id(req)));
  });
}
