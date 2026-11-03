import { Request, Response } from 'express';
import { Container } from 'typedi';
import { TestSmsDto, UpdateWhatsappSettingsDto } from '@/dtos/sms.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
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
