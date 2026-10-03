import { Router } from 'express';
import { SmsController } from '@/controllers/sms.controller';
import { TestSmsDto, UpdateSmsSettingsDto } from '@/dtos/sms.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: SMS
 *   description: The operator's SMS channel to travellers (their own Android phone, Brevo, or none)
 */
/**
 * @swagger
 * /internal/sms/settings:
 *   get:
 *     summary: The operator's SMS channel (manager)
 *     description: >
 *       { mode: gateway | brevo | none, brevoAvailable, gateway: { baseUrl, login, senderPhone, linkedAt } | null }.
 *       The gateway password is never returned. brevoAvailable is false while the platform has no Brevo key.
 *     tags: [SMS]
 *   put:
 *     summary: Choose the channel; for the gateway, save the app's credentials (manager)
 *     description: >
 *       mode gateway needs login, senderPhone (E.164) and password (optional when the same login is
 *       already stored); baseUrl (https://…) selects a private server, else the public cloud server.
 *       The password is encrypted at rest (SMS_GATEWAY_ENCRYPTION_KEY): 503 "sms_encryption_key_missing"
 *       without the key. 409 "brevo_unavailable" for mode brevo without Brevo. 403 "view_as_read_only"
 *       in a platform admin's view-as session.
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode: { type: string, enum: [gateway, brevo, none] }
 *               login: { type: string }
 *               password: { type: string }
 *               senderPhone: { type: string, example: "+33612345678" }
 *               baseUrl: { type: string, nullable: true }
 * /internal/sms/test:
 *   post:
 *     summary: Send a test SMS through the operator's channel (manager)
 *     description: >
 *       { outcome: sent | queued } — "queued" means the gateway accepted it and the phone sends it when
 *       online. 409 "sms_not_configured"; 502 with the gateway's code (sms_gateway_unauthorized,
 *       sms_gateway_unreachable, sms_gateway_offline, sms_gateway_rejected, sms_gateway_error) when it refuses it.
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to]
 *             properties:
 *               to: { type: string, example: "+33612345678" }
 * /internal/sms/disable:
 *   post:
 *     summary: Stop every SMS (mode none) and forget the gateway credentials (manager)
 *     tags: [SMS]
 * /internal/sms/status:
 *   get:
 *     summary: Counters and health of the channel (manager)
 *     description: >
 *       { mode, brevoAvailable, linkedAt, lastSentAt, senderPhone, month: { sent, failed }, pending,
 *       pendingStale, lastError, lastErrorAt }. Reading it also retries the waiting SMS (at most once a minute).
 *     tags: [SMS]
 */
export class SmsRoute implements Routes {
  public router = Router();
  public sms = new SmsController();

  constructor() {
    this.router.get('/internal/sms/settings', StaffAuthMiddleware('parking:manage'), this.sms.settings);
    this.router.put(
      '/internal/sms/settings',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(UpdateSmsSettingsDto),
      this.sms.updateSettings,
    );
    this.router.post('/internal/sms/test', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), ValidationMiddleware(TestSmsDto), this.sms.test);
    this.router.post('/internal/sms/disable', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.sms.disable);
    this.router.get('/internal/sms/status', StaffAuthMiddleware('parking:manage'), this.sms.status);
  }
}
