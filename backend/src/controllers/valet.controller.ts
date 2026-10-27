import { Response } from 'express';
import { Container } from 'typedi';
import { ValetRunKind, VALET_RUN_KINDS } from '@/domain/valet';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ValetService } from '@/services/valet.service';
import catchAsync from '@/utils/catchAsync';
import { HttpException } from '@/utils/httpException';

const kindOf = (value: unknown): ValetRunKind => {
  if (typeof value === 'string' && (VALET_RUN_KINDS as readonly string[]).includes(value)) return value as ValetRunKind;
  throw new HttpException(404, 'Unknown run', 'not_found');
};

export class ValetController {
  public valet = Container.get(ValetService);

  /** GET /internal/valet/runs */
  public runs = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.valet.runs(req.staff));
  });

  /** POST /internal/valet/runs/:reservationId/:kind/take */
  public take = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.valet.take(req.staff, req.params.reservationId as string, kindOf(req.params.kind)) });
  });

  /** POST /internal/valet/runs/:reservationId/:kind/release */
  public release = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.valet.release(req.staff, req.params.reservationId as string, kindOf(req.params.kind)) });
  });

  /** POST /internal/valet/runs/:reservationId/:kind/done */
  public done = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : undefined;
    res.json({ data: await this.valet.done(req.staff, req.params.reservationId as string, kindOf(req.params.kind), note) });
  });
}
