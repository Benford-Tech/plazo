import { Router } from 'express';
import { WhatsappController } from '@/controllers/whatsapp.controller';
import { TestSmsDto, UpdateWhatsappSettingsDto } from '@/dtos/sms.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: "« Plazo envoie par WhatsApp », SMS en repli (03/11/2026): the traveller messages by WhatsApp from Plazo's number"
 * /internal/whatsapp/settings:
 *   get:
 *     tags: [WhatsApp]
 *     summary: "{ available, enabled, smsFallback, month: { whatsapp, read, fallbacks, failed } } (managers)"
 *   put:
 *     tags: [WhatsApp]
 *     summary: "{ enabled }: the confirmation, day-before and landing messages go by WhatsApp first, the SMS channel as fallback"
 *     responses:
 *       409: { description: "code = whatsapp_unavailable (Plazo's number is not configured)" }
 * /internal/whatsapp/test:
 *   post:
 *     tags: [WhatsApp]
 *     summary: "{ to }: a test message by WhatsApp only. 409 whatsapp_unavailable; 502 with Meta's code (meta_131026…)"
 * /public/whatsapp/webhook:
 *   get:
 *     tags: [WhatsApp]
 *     summary: "Meta's subscription check: hub.mode=subscribe, hub.verify_token = WHATSAPP_VERIFY_TOKEN → hub.challenge"
 *   post:
 *     tags: [WhatsApp]
 *     summary: "Meta's delivery statuses, signed X-Hub-Signature-256 with WHATSAPP_APP_SECRET; a failed message goes by SMS"
 */
export class WhatsappRoute implements Routes {
  public router = Router();
  public whatsapp = new WhatsappController();

  constructor() {
    this.router.get('/internal/whatsapp/settings', StaffAuthMiddleware('parking:manage'), this.whatsapp.settings);
    this.router.put(
      '/internal/whatsapp/settings',
      StaffAuthMiddleware('parking:manage'),
      RefuseInDemo(),
      ValidationMiddleware(UpdateWhatsappSettingsDto),
      this.whatsapp.update,
    );
    this.router.post(
      '/internal/whatsapp/test',
      StaffAuthMiddleware('parking:manage'),
      RefuseInDemo(),
      ValidationMiddleware(TestSmsDto),
      this.whatsapp.test,
    );
    // 12/11/2026: « Messages WhatsApp », what travellers write to Plazo's number (direction A).
    this.router.get('/internal/whatsapp/inbox', StaffAuthMiddleware('reservations:status'), this.whatsapp.inbox);
    // « Écrire au client » (13/11/2026): from Plazo's WhatsApp number, the parking's SMS as the fallback.
    this.router.get('/internal/reservations/:id/write', StaffAuthMiddleware('reservations:status'), this.whatsapp.writeStatus);
    this.router.post('/internal/reservations/:id/write', StaffAuthMiddleware('reservations:status'), RefuseInDemo(), this.whatsapp.write);
    this.router.get('/internal/whatsapp/sent', StaffAuthMiddleware('reservations:status'), this.whatsapp.sent);
    this.router.get('/internal/whatsapp/inbox/messages/:messageId/media', StaffAuthMiddleware('reservations:status'), this.whatsapp.media);
    this.router.get('/internal/whatsapp/inbox/:id', StaffAuthMiddleware('reservations:status'), this.whatsapp.conversation);
    this.router.post('/internal/whatsapp/inbox/:id/reply', StaffAuthMiddleware('reservations:status'), RefuseInDemo(), this.whatsapp.reply);
    this.router.post('/internal/whatsapp/inbox/:id/handle', StaffAuthMiddleware('reservations:status'), this.whatsapp.handle);
    this.router.post('/internal/whatsapp/inbox/:id/unhandle', StaffAuthMiddleware('reservations:status'), this.whatsapp.unhandle);
    this.router.post('/internal/whatsapp/inbox/:id/attach', StaffAuthMiddleware('reservations:manage'), this.whatsapp.attach);
    this.router.get('/public/whatsapp/webhook', this.whatsapp.verify);
    this.router.post('/public/whatsapp/webhook', this.whatsapp.webhook);
  }
}
