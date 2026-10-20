import { Request, Response } from 'express';
import { Container } from 'typedi';
import { visitorIp } from '@/domain/client-ip';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ContractFile, PartnerContractService } from '@/services/partner-contract.service';
import catchAsync from '@/utils/catchAsync';

const param = (req: Request, name: string) => req.params[name] as string;

function sendPdf(res: Response, file: ContractFile) {
  res.set('Content-Type', 'application/pdf');
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Disposition', `inline; filename="${file.fileName}"`);
  if (file.size != null) res.set('Content-Length', String(file.size));
  file.stream.pipe(res);
}

/** The Plazo ↔ operator contract (20/10/2026). */
export class PartnerContractController {
  public contracts = Container.get(PartnerContractService);

  // ---- Platform ----

  /** GET /internal/platform/operators/:id/contracts */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.contracts.listForPlatform(param(req, 'id')));
  });

  /** POST /internal/platform/operators/:id/contracts?fileName=&title= (the PDF's bytes as the body) */
  public upload = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res
      .status(201)
      .json(await this.contracts.upload(req.staff, param(req, 'id'), req.body, { fileName: req.query.fileName, title: req.query.title }));
  });

  /** POST /internal/platform/operators/:id/contracts/:contractId/remind */
  public remind = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.contracts.remind(req.staff, param(req, 'id'), param(req, 'contractId')));
  });

  /** DELETE /internal/platform/operators/:id/contracts/:contractId */
  public remove = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.contracts.remove(req.staff, param(req, 'id'), param(req, 'contractId'));
    res.status(204).end();
  });

  /** GET /internal/platform/operators/:id/contracts/:contractId/file?kind= */
  public platformFile = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.contracts.file(param(req, 'id'), param(req, 'contractId'), req.query.kind ?? 'original'));
  });

  // ---- The operator's managers ----

  /** GET /internal/contract */
  public mine = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.contracts.forOperator(req.staff));
  });

  /** POST /internal/contract/:contractId/sign */
  public sign = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const client = { ip: visitorIp(req.ip, req.get('cf-connecting-ip')) ?? null, userAgent: req.get('user-agent') ?? null };
    res.json(await this.contracts.sign(req.staff, param(req, 'contractId'), req.body ?? {}, client));
  });

  /** GET /internal/contract/:contractId/file?kind= */
  public file = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.contracts.file(req.staff.operatorId, param(req, 'contractId'), req.query.kind ?? 'original'));
  });
}
