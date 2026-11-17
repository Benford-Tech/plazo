import { Request, Response } from 'express';
import { Container } from 'typedi';
import { visitorIp } from '@/domain/client-ip';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { AgreementFile, PlazoAgreementService } from '@/services/plazo-agreement.service';
import catchAsync from '@/utils/catchAsync';

const param = (req: Request, name: string) => req.params[name] as string;

function sendPdf(res: Response, file: AgreementFile) {
  res.set('Content-Type', 'application/pdf');
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Disposition', `inline; filename="${file.fileName}"`);
  res.send(file.bytes);
}

/** The two contracts Plazo writes for every operator (17/11/2026, choice C). */
export class PlazoAgreementController {
  public agreements = Container.get(PlazoAgreementService);

  /** GET /internal/agreements */
  public mine = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.agreements.view(req.staff.operatorId, req.staff));
  });

  /** POST /internal/agreements/sign */
  public sign = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const client = { ip: visitorIp(req.ip, req.get('cf-connecting-ip')) ?? null, userAgent: req.get('user-agent') ?? null };
    res.json(await this.agreements.sign(req.staff, req.body ?? {}, client));
  });

  /** GET /internal/agreements/preview/:kind */
  public preview = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.agreements.preview(req.staff.operatorId, param(req, 'kind')));
  });

  /** GET /internal/agreements/:id/file?kind=signed|proof */
  public file = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.agreements.file(req.staff.operatorId, param(req, 'id'), req.query.kind ?? 'signed'));
  });

  // ---- Platform ----

  /** GET /internal/platform/operators/:id/agreements */
  public platformView = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.agreements.view(param(req, 'id')));
  });

  /** PUT /internal/platform/operators/:id/pro-plan */
  public setPlan = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.agreements.setPlan(req.staff, param(req, 'id'), req.body ?? {}));
  });

  /** GET /internal/platform/operators/:id/agreements/preview/:kind */
  public platformPreview = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.agreements.preview(param(req, 'id'), param(req, 'kind')));
  });

  /** GET /internal/platform/operators/:id/agreements/:agreementId/file?kind= */
  public platformFile = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.agreements.file(param(req, 'id'), param(req, 'agreementId'), req.query.kind ?? 'signed'));
  });
}
