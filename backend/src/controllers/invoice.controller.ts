import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { InvoiceFile, InvoiceService } from '@/services/invoice.service';
import catchAsync from '@/utils/catchAsync';

const param = (req: Request, name: string) => String(req.params[name]);
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;

function sendPdf(res: Response, file: InvoiceFile) {
  res.set('Content-Type', 'application/pdf');
  res.set('Cache-Control', 'private, max-age=0');
  res.set('Content-Disposition', `inline; filename="${file.fileName}"`);
  res.set('Content-Length', String(file.bytes.length));
  res.send(file.bytes);
}

export class InvoiceController {
  public invoices = Container.get(InvoiceService);

  /** GET /internal/billing/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.invoices.settings(req.staff.operatorId));
  });

  /** PUT /internal/billing/settings */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.invoices.updateSettings(req.staff, req.body));
  });

  /** GET /internal/reservations/:id/invoices */
  public forReservation = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.invoices.forReservation(req.staff, param(req, 'id')));
  });

  /** GET /internal/reservations/:id/invoices/preview */
  public preview = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.invoices.preview(req.staff, param(req, 'id'), req.query as Record<string, unknown>));
  });

  /** POST /internal/reservations/:id/invoices */
  public create = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.invoices.create(req.staff, param(req, 'id'), req.body));
  });

  /** GET /internal/invoices/:id/pdf */
  public file = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPdf(res, await this.invoices.file(req.staff, param(req, 'id')));
  });

  /** POST /internal/invoices/:id/send */
  public send = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.invoices.send(req.staff, param(req, 'id'), req.body));
  });

  /** POST /internal/invoices/:id/credit-note */
  public creditNote = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.invoices.creditNote(req.staff, param(req, 'id')));
  });

  /** GET /public/bookings/:reference/invoices (x-booking-token) */
  public travellerList = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.invoices.travellerList(param(req, 'reference'), bookingToken(req)));
  });

  /** GET /public/bookings/:reference/invoices/:id/pdf (x-booking-token) */
  public travellerFile = catchAsync(async (req: Request, res: Response) => {
    sendPdf(res, await this.invoices.travellerFile(param(req, 'reference'), bookingToken(req), param(req, 'id')));
  });

  /** POST /public/bookings/:reference/invoices/request (x-booking-token) */
  public travellerRequest = catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await this.invoices.travellerRequest(param(req, 'reference'), bookingToken(req), req.body));
  });
}
