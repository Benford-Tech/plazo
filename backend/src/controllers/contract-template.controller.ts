import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ContractFile, ContractTemplateService } from '@/services/contract-template.service';
import catchAsync from '@/utils/catchAsync';

const param = (req: Request, name: string) => req.params[name] as string;
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;
const text = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

function sendPdf(res: Response, file: ContractFile) {
  res.set('Content-Type', 'application/pdf');
  res.set('Cache-Control', 'private, max-age=0');
  res.set('Content-Disposition', `inline; filename="${file.fileName}"`);
  if (file.size != null) res.set('Content-Length', String(file.size));
  file.stream.pipe(res);
}

function registerQuery(req: Request) {
  return {
    from: text(req.query.from),
    to: text(req.query.to),
    search: text(req.query.q),
    reserved: req.query.reserved === '1' || req.query.reserved === 'true',
    page: req.query.page ? Number(req.query.page) || 1 : 1,
  };
}

export class ContractTemplateController {
  public templates = Container.get(ContractTemplateService);

  /** GET /internal/contract-template */
  public mine = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.templates.forOperator(req.staff.operatorId));
  });

  /** POST /internal/contract-template?fileName=&title= (the PDF's bytes as the body) */
  public upload = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.templates.upload(req.staff, req.body, { fileName: req.query.fileName, title: req.query.title }));
  });

  /** POST /internal/contract-template/revert */
  public revert = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.templates.revert(req.staff));
  });

  /** GET /internal/contract-template/:templateId/file */
  public templateFile = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.templates.templateFile(req.staff.operatorId, param(req, 'templateId')));
  });

  /** GET /internal/contracts */
  public register = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.templates.register(req.staff.operatorId, registerQuery(req)));
  });

  /** GET /internal/contracts/export */
  public exportCsv = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const csv = await this.templates.exportCsv(req.staff.operatorId, registerQuery(req));
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="contrats-signes.csv"');
    res.send(csv);
  });

  /** GET /internal/reservations/:id/contract/file?kind=template|signed|proof */
  public staffFile = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.templates.staffFile(req.staff, param(req, 'id'), req.query.kind ?? 'signed'));
  });

  /** GET /public/bookings/:reference/contract/file?kind= */
  public travellerFile = catchAsync(async (req: Request, res: Response) => {
    sendPdf(res, await this.templates.travellerFile(param(req, 'reference'), bookingToken(req), req.query.kind ?? 'signed'));
  });
}
