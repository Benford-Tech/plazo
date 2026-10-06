import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { INBOUND_EMAIL_SECRET, inboundEmailAvailable } from '@/config';
import { InboundEmailStatus } from '@/database';
import { InboundPayload } from '@/domain/inbound-email';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { InboundEmailService } from '@/services/inbound-email.service';
import catchAsync from '@/utils/catchAsync';
import { HttpException } from '@/utils/httpException';

const STATUSES = Object.values(InboundEmailStatus);

export class InboundEmailController {
  public inbound = Container.get(InboundEmailService);

  /** POST /public/inbound/email?secret=… (Brevo's inbound parsing webhook). */
  public receive = catchAsync(async (req: Request, res: Response) => {
    const given = Buffer.from(String(req.query.secret ?? req.headers['x-inbound-secret'] ?? ''));
    const expected = Buffer.from(INBOUND_EMAIL_SECRET);
    if (!inboundEmailAvailable() || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new HttpException(httpStatus.UNAUTHORIZED, 'Bad inbound secret', 'unauthorized');
    }
    const payload = (req.body ?? {}) as InboundPayload;
    res.json(await this.inbound.receive(Array.isArray(payload.items) ? payload : { items: [] }));
  });

  /** GET /internal/inbound/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inbound.settings(req.staff));
  });

  /** POST /internal/inbound/address  { regenerate?: boolean } */
  public enableAddress = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inbound.enableAddress(req.staff, { regenerate: req.body?.regenerate === true }));
  });

  /** GET /internal/inbound/emails?status= */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const status =
      typeof req.query.status === 'string' && (STATUSES as string[]).includes(req.query.status)
        ? (req.query.status as InboundEmailStatus)
        : undefined;
    res.json({ data: await this.inbound.list(req.staff, { status }) });
  });

  /** POST /internal/inbound/emails/:id/dismiss */
  public dismiss = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.inbound.dismiss(req.staff, req.params.id as string) });
  });

  /** POST /internal/inbound/emails/:id/attach  { reservationId } */
  public attach = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const reservationId = typeof req.body?.reservationId === 'string' ? req.body.reservationId : '';
    if (!reservationId)
      throw new HttpException(httpStatus.BAD_REQUEST, 'reservationId is required', 'validation_failed', { reservationId: 'required' });
    await this.inbound.attach(req.staff, req.params.id as string, reservationId);
    res.json({ message: 'Attached' });
  });
}
