import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { INBOUND_EMAIL_SECRET, inboundEmailAvailable } from '@/config';
import { InboundEmailStatus } from '@/database';
import { InboundPayload } from '@/domain/inbound-email';
import { Envelope, parseRawEmail } from '@/domain/inbound-mime';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ValidationException } from '@/middlewares/validation.middleware';
import { INBOUND_VIEWS, InboundEmailService, InboundView } from '@/services/inbound-email.service';
import catchAsync from '@/utils/catchAsync';
import { HttpException } from '@/utils/httpException';

const STATUSES = Object.values(InboundEmailStatus);

const header = (req: Request, name: string): string | null => {
  const value = req.headers[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};
/** The envelope the relay puts in headers: the message's sender and the parking's Plazo address. */
const envelopeOf = (req: Request): Envelope => ({ from: header(req, 'x-envelope-from'), to: header(req, 'x-envelope-to') });

/** The relay's shared secret, compared in constant time; refused when the inbound email is not set up. */
function checkInboundSecret(req: Request): void {
  const given = Buffer.from(String(req.headers['x-inbound-secret'] ?? ''));
  const expected = Buffer.from(INBOUND_EMAIL_SECRET);
  if (!inboundEmailAvailable() || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new HttpException(httpStatus.UNAUTHORIZED, 'Bad inbound secret', 'unauthorized');
  }
}

export class InboundEmailController {
  public inbound = Container.get(InboundEmailService);

  /**
   * POST /public/inbound/email, secret in the X-Inbound-Secret header only (a ?secret= would end up in the access logs;
   * the email-worker/ relay of Cloudflare Email Routing uses the header). Since 08/10/2026 the relay posts the raw
   * message (message/rfc822, the envelope in X-Envelope-From and X-Envelope-To) and it is parsed here; the former
   * { items } JSON is still read.
   */
  public receive = catchAsync(async (req: Request, res: Response) => {
    checkInboundSecret(req);
    const payload: InboundPayload = Buffer.isBuffer(req.body)
      ? { items: [await parseRawEmail(req.body, envelopeOf(req))] }
      : ((req.body ?? {}) as InboundPayload);
    res.json(await this.inbound.receive(Array.isArray(payload.items) ? payload : { items: [] }));
  });

  /**
   * POST /public/inbound/retry (11/10/2026, « Lance l'analyse automatiquement pour allopark »): the email relay's cron,
   * every 10 minutes, with the same X-Inbound-Secret: the Allopark emails due for another try are analysed again.
   * 15/10/2026: then, unless Allopark stopped the pass, the emails that waited only for their plate (`plateOnly`, given
   * when some were due). 16/10/2026 (« analyser sans passer par Claude »): then the emails stored before the rules per
   * mail type that those rules now know (`rules`), and the emails that wait because Claude could not read them, once it
   * answers again (`reading`); each given when some were due. 16/10/2026 (« relie les mail deja traité »): last, the
   * emails received and dealt with before the rules, read once more with them (`reread`).
   */
  public retry = catchAsync(async (req: Request, res: Response) => {
    checkInboundSecret(req);
    const startedAt = Date.now();
    const report = await this.inbound.retryAllopark();
    const blocked = (...reports: ({ stopped?: string } | null)[]) => reports.some(r => r?.stopped === 'protected' || r?.stopped === 'refused');
    const plateOnly = blocked(report) ? null : await this.inbound.importWaitingForPlate(new Date(), startedAt);
    const rules = blocked(report, plateOnly) ? null : await this.inbound.analyseWaitingForRules(new Date(), startedAt);
    const reading = blocked(report, plateOnly, rules) ? null : await this.inbound.retryReading(new Date(), startedAt);
    const reread = blocked(report, plateOnly, rules, reading) ? null : await this.inbound.rereadWithRules(new Date(), startedAt);
    res.json({
      ...report,
      ...(plateOnly?.due ? { plateOnly } : {}),
      ...(rules?.due ? { rules } : {}),
      ...(reading?.due ? { reading } : {}),
      ...(reread?.due ? { reread } : {}),
    });
  });

  /** GET /internal/inbound/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inbound.settings(req.staff));
  });

  /** POST /internal/inbound/address  { regenerate?: boolean } */
  public enableAddress = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inbound.enableAddress(req.staff, { regenerate: req.body?.regenerate === true }));
  });

  /** GET /internal/inbound/emails?view=todo|done|archived&status= → { data, counts: { todo, done, archived } } */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const view =
      typeof req.query.view === 'string' && (INBOUND_VIEWS as string[]).includes(req.query.view) ? (req.query.view as InboundView) : undefined;
    const status =
      typeof req.query.status === 'string' && (STATUSES as string[]).includes(req.query.status)
        ? (req.query.status as InboundEmailStatus)
        : undefined;
    res.json(await this.inbound.list(req.staff, { view, status }));
  });

  /** POST /internal/inbound/emails/:id/handle (T-A « Marquer comme traité »); /dismiss is its deprecated alias. */
  public handle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.inbound.handle(req.staff, req.params.id as string) });
  });

  /** POST /internal/inbound/emails/:id/archive (T-A « Archiver ») */
  public archive = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.inbound.archive(req.staff, req.params.id as string) });
  });

  /** POST /internal/inbound/emails/:id/reanalyse → { email, outcome } (10/10/2026, « Relancer l'analyse ») */
  public reanalyse = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(httpStatus.OK).json(await this.inbound.reanalyse(req.staff, req.params.id as string));
  });

  /** POST /internal/inbound/emails/paste  { text, subject? } → { email, outcome } (29/10/2026, « Coller un mail ») */
  public paste = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject : null;
    if (!text.trim()) throw new ValidationException({ text: 'required' });
    if (text.length > 200000) throw new ValidationException({ text: 'too_long' });
    res.status(httpStatus.CREATED).json(await this.inbound.paste(req.staff, { text, subject }));
  });

  /** GET /internal/reservations/:id/emails (« Mails liés », 27/10/2026) */
  public forReservation = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.inbound.forReservation(req.staff, req.params.id as string) });
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
