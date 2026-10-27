import { Router } from 'express';
import { AppLinkController } from '@/controllers/app-link.controller';
import { AppLinkClaimDto, AppLinkResumeDto } from '@/dtos/app-link.dto';
import { Routes } from '@/interfaces/routes.interface';
import { appLinkLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: App link
 *   description: « Lien court Plazo » (27/10/2026) — https://www.plazo.fr/a/<code> in the SMS and emails
 *
 * /public/app-link/{code}:
 *   get:
 *     summary: The booking a short code names (reference, manage token, first name, parking, local arrival and return)
 *     tags: [App link]
 *     responses:
 *       200: { description: "{ reference, manageToken, firstName, parking: { title }, arrivalAt, returnAt }" }
 *       404: { description: Unknown, forged, revoked or expired code }
 * /public/app-link/{code}/claim:
 *   post:
 *     summary: Remember this phone (address + platform, hashed, 24 h) before it leaves for the store
 *     tags: [App link]
 *     responses:
 *       201: { description: "{ ok: true }" }
 * /public/app-link/resume:
 *   post:
 *     summary: The app's first launch — the booking this phone was waiting for, if any (consumed)
 *     tags: [App link]
 *     responses:
 *       200: { description: "{ found: false } | { found: true, match: code | device, reference, manageToken, … }" }
 */
export class AppLinkRoute implements Routes {
  public router = Router();
  public links = new AppLinkController();

  constructor() {
    this.router.post('/public/app-link/resume', appLinkLimiter, ValidationMiddleware(AppLinkResumeDto), this.links.resume);
    this.router.get('/public/app-link/:code', appLinkLimiter, this.links.resolve);
    this.router.post('/public/app-link/:code/claim', appLinkLimiter, ValidationMiddleware(AppLinkClaimDto), this.links.claim);
  }
}
