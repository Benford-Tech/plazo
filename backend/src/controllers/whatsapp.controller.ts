import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { TestSmsDto, UpdateWhatsappSettingsDto } from '@/dtos/sms.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { StaffMessageService } from '@/services/staff-message.service';
import { INBOX_VIEWS, InboxView, WhatsappInboxService } from '@/services/whatsapp-inbox.service';
import { WhatsappService } from '@/services/whatsapp.service';
import catchAsync from '@/utils/catchAsync';

/** The webhook's raw body: a Buffer from RawBodyMiddleware (app.ts), needed for Meta's signature. */
function rawBody(req: Request): Buffer | undefined {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  return undefined;
}

export class WhatsappController {
  public whatsapp = Container.get(WhatsappService);
  public inboxService = Container.get(WhatsappInboxService);

  /** GET /internal/whatsapp/settings */
  public settings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.whatsapp.settings(req.staff));
  });

  /** PUT /internal/whatsapp/settings */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateWhatsappSettingsDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.whatsapp.update(req.staff, data.enabled));
  });

  /** POST /internal/whatsapp/test */
  public test = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: TestSmsDto = req.body;
    res.json(await this.whatsapp.test(req.staff, data.to));
  });

  /** GET /internal/whatsapp/inbox?view=unread|all|handled|unknown */
  public inbox = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const asked = String(req.query.view ?? 'all') as InboxView;
    const view = INBOX_VIEWS.includes(asked) ? asked : 'all';
    res.set('Cache-Control', 'no-store');
    res.json(await this.inboxService.list(req.staff, view));
  });

  /** GET /internal/reservations/:id/write (« Écrire au client », 13/11/2026) */
  public writeStatus = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await Container.get(StaffMessageService).status(req.staff, req.params.id as string));
  });

  /** POST /internal/reservations/:id/write { text, channel } */
  public write = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(httpStatus.CREATED).json(await Container.get(StaffMessageService).send(req.staff, req.params.id as string, req.body ?? {}));
  });

  /** GET /internal/whatsapp/sent */
  public sent = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.inboxService.sent(req.staff));
  });

  /** GET /internal/whatsapp/inbox/:id */
  public conversation = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.inboxService.get(req.staff, req.params.id as string));
  });

  /** POST /internal/whatsapp/inbox/:id/reply { text } */
  public reply = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(201).json(await this.inboxService.reply(req.staff, req.params.id as string, req.body?.text));
  });

  /** POST /internal/whatsapp/inbox/:id/handle */
  public handle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inboxService.setHandled(req.staff, req.params.id as string, true));
  });

  /** POST /internal/whatsapp/inbox/:id/unhandle */
  public unhandle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inboxService.setHandled(req.staff, req.params.id as string, false));
  });

  /** POST /internal/whatsapp/inbox/:id/attach { reference } (platform admins) */
  public attach = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.inboxService.attach(req.staff, req.params.id as string, req.body?.reference));
  });

  /** GET /internal/whatsapp/inbox/messages/:messageId/media */
  public media = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const media = await this.inboxService.media(req.staff, req.params.messageId as string);
    // 12/11/2026 (security): the type is the sender's word. Only images, sound, video and PDF keep theirs; anything else
    // (an HTML or SVG « document ») is served as a download, never as a page that could run script.
    const safe = safeMediaType(media.contentType);
    res.set('Content-Type', safe ?? 'application/octet-stream');
    if (!safe) res.set('Content-Disposition', 'attachment');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; sandbox");
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(media.bytes);
  });

  /** GET /public/whatsapp/webhook: Meta's subscription check. */
  public verify = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const challenge = this.whatsapp.verifySubscription(query['hub.mode'], query['hub.verify_token'], query['hub.challenge']);
    if (challenge === null) {
      res.status(403).json({ message: 'Forbidden', code: 'invalid_verify_token' });
      return;
    }
    res.type('text/plain').send(challenge);
  });

  /** POST /public/whatsapp/webhook */
  public webhook = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.whatsapp.handleWebhook(rawBody(req), req.get('x-hub-signature-256') || undefined));
  });
}

/** A traveller's WhatsApp media type Plazo lets the browser show: images (not SVG), sound, video, PDF. Null otherwise. */
export function safeMediaType(type: string): string | null {
  const t = type.split(';')[0].trim().toLowerCase();
  if (/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(t)) return t;
  if (/^audio\/[a-z0-9.+-]+$/.test(t) || /^video\/(mp4|3gpp|quicktime|webm)$/.test(t) || t === 'application/pdf') return t;
  return null;
}
