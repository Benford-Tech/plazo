import { Router } from 'express';
import { WhatsappNumberController } from '@/controllers/whatsapp-number.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: WhatsApp numbers
 *   description: "14/11/2026: a parking's own WhatsApp number on Benford Tech's account (display name « Plazo »); used once active"
 * /internal/whatsapp/number/request:
 *   post:
 *     tags: [WhatsApp numbers]
 *     summary: "« Demander mon numéro WhatsApp » (managers): the platform sees it in « À traiter »"
 * /internal/platform/operators/{id}/whatsapp-number:
 *   get:
 *     tags: [WhatsApp numbers]
 *     summary: "{ number, displayName, available }"
 *   post:
 *     tags: [WhatsApp numbers]
 *     summary: "{ phone }: added to Benford Tech's account. 400 phone invalid; 409 number_exists, whatsapp_unavailable; 502 Meta's code"
 *   delete:
 *     tags: [WhatsApp numbers]
 *     summary: "Plazo forgets the number (it stays at Meta): the parking is back on Plazo's number"
 * /internal/platform/operators/{id}/whatsapp-number/link:
 *   post: { tags: [WhatsApp numbers], summary: "{ phoneNumberId }: a number already on the account. 404 number_not_in_account" }
 * /internal/platform/operators/{id}/whatsapp-number/code:
 *   post: { tags: [WhatsApp numbers], summary: "{ method: SMS | VOICE }: Meta sends the code. 409 number_not_waiting" }
 * /internal/platform/operators/{id}/whatsapp-number/verify:
 *   post: { tags: [WhatsApp numbers], summary: "{ code }: verified and registered; active once Meta approves the name" }
 * /internal/platform/operators/{id}/whatsapp-number/check:
 *   post: { tags: [WhatsApp numbers], summary: "Meta's view read again" }
 * /internal/platform/operators/{id}/whatsapp-number/pause:
 *   post: { tags: [WhatsApp numbers], summary: "Back to Plazo's number. 409 number_not_active" }
 * /internal/platform/operators/{id}/whatsapp-number/resume:
 *   post: { tags: [WhatsApp numbers], summary: "From the parking's number again. 409 number_not_paused" }
 */
export class WhatsappNumberRoute implements Routes {
  public router = Router();
  public numbers = new WhatsappNumberController();

  constructor() {
    this.router.post('/internal/whatsapp/number/request', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.numbers.request);
    const base = '/internal/platform/operators/:id/whatsapp-number';
    this.router.get(base, PlatformAdminMiddleware(), this.numbers.get);
    this.router.post(base, PlatformAdminMiddleware(), this.numbers.add);
    this.router.delete(base, PlatformAdminMiddleware(), this.numbers.remove);
    this.router.post(`${base}/link`, PlatformAdminMiddleware(), this.numbers.link);
    this.router.post(`${base}/code`, PlatformAdminMiddleware(), this.numbers.code);
    this.router.post(`${base}/verify`, PlatformAdminMiddleware(), this.numbers.verify);
    this.router.post(`${base}/check`, PlatformAdminMiddleware(), this.numbers.check);
    this.router.post(`${base}/pause`, PlatformAdminMiddleware(), this.numbers.pause);
    this.router.post(`${base}/resume`, PlatformAdminMiddleware(), this.numbers.resume);
  }
}
