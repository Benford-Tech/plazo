import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { PaperworkService } from '@/services/paperwork.service';
import { StoredPhoto } from '@/services/photo-storage.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs).
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;
const param = (req: Request, name: string) => req.params[name] as string;

function sendPhoto(res: Response, photo: StoredPhoto) {
  res.set('Content-Type', photo.contentType);
  // Private: a browser or the app may keep it a while, never a shared cache.
  res.set('Cache-Control', 'private, max-age=3600');
  if (photo.size != null) res.set('Content-Length', String(photo.size));
  photo.stream.pipe(res);
}

/** « Contrat signé et état des lieux » (19/10/2026). */
export class PaperworkController {
  public paperwork = Container.get(PaperworkService);

  // ---- Staff ----

  /** GET /internal/reservations/:id/paperwork */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.paperwork.staffPaperwork(req.staff, param(req, 'id')));
  });

  /** POST /internal/reservations/:id/contract/code */
  public sendCode = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.staffSendCode(req.staff, param(req, 'id')));
  });

  /** POST /internal/reservations/:id/contract/sign */
  public sign = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.staffSign(req.staff, param(req, 'id'), req.body ?? {}));
  });

  /** POST /internal/reservations/:id/inspections/:kind */
  public start = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.start(req.staff, param(req, 'id'), param(req, 'kind')));
  });

  /** PATCH /internal/reservations/:id/inspections/:kind */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.update(req.staff, param(req, 'id'), param(req, 'kind'), req.body ?? {}));
  });

  /** POST /internal/reservations/:id/inspections/:kind/photos?slot= */
  public addPhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.paperwork.addPhoto(req.staff, param(req, 'id'), param(req, 'kind'), req.query.slot, req.body));
  });

  /** GET /internal/reservations/:id/inspections/:kind/photos/:photoId */
  public photo = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    sendPhoto(res, await this.paperwork.staffPhoto(req.staff, param(req, 'id'), param(req, 'kind'), param(req, 'photoId')));
  });

  /** DELETE /internal/reservations/:id/inspections/:kind/photos/:photoId */
  public removePhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.removePhoto(req.staff, param(req, 'id'), param(req, 'kind'), param(req, 'photoId')));
  });

  /** POST /internal/reservations/:id/inspections/:kind/complete */
  public complete = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.complete(req.staff, param(req, 'id'), param(req, 'kind')));
  });

  /** POST /internal/reservations/:id/inspections/:kind/answer */
  public answer = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.paperwork.staffAnswer(req.staff, param(req, 'id'), param(req, 'kind'), req.body ?? {}));
  });

  // ---- Traveller ----

  /** GET /public/bookings/:reference/paperwork */
  public travellerGet = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.paperwork.travellerPaperwork(param(req, 'reference'), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/contract/code */
  public travellerSendCode = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.paperwork.travellerSendCode(param(req, 'reference'), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/contract/sign */
  public travellerSign = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.paperwork.travellerSign(param(req, 'reference'), bookingToken(req), req.body?.code));
  });

  /** POST /public/bookings/:reference/inspections/:kind/answer */
  public travellerAnswer = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.paperwork.travellerAnswer(param(req, 'reference'), bookingToken(req), param(req, 'kind'), req.body ?? {}));
  });

  /** GET /public/bookings/:reference/inspections/:kind/photos/:photoId */
  public travellerPhoto = catchAsync(async (req: Request, res: Response) => {
    sendPhoto(res, await this.paperwork.travellerPhoto(param(req, 'reference'), bookingToken(req), param(req, 'kind'), param(req, 'photoId')));
  });
}
