import { Router } from 'express';
import { OperatorLogoController } from '@/controllers/operator-logo.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: OperatorLogo
 *   description: >
 *     The parking's logo (02/11/2026, direction B), shown to the team next to the Plazo Pro sign; never to travellers.
 * /internal/operator/logo:
 *   get:
 *     summary: The operator's logo (private cache; ask with ?v=<logoUpdatedAt>); 404 logo_not_found when it has none
 *   post:
 *     summary: Set the logo — the image's bytes (PNG, JPEG or WebP, 2 MB at most; the apps send a 512 px square PNG)
 *     responses:
 *       200: { description: "{ logoUpdatedAt }" }
 *       400: { description: "validation_failed: fields.logo = required | too_large | not_an_image" }
 *       503: { description: photos_unavailable (no photo store) }
 *   delete:
 *     summary: Remove the logo
 */
export class OperatorLogoRoute implements Routes {
  public router = Router();
  public logos = new OperatorLogoController();

  constructor() {
    this.router.get('/internal/operator/logo', StaffAuthMiddleware(), this.logos.get);
    // Managers; permitted in consultation (the platform prepares a parking), refused in the demo.
    this.router.post('/internal/operator/logo', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.logos.set);
    this.router.delete('/internal/operator/logo', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.logos.remove);
  }
}
