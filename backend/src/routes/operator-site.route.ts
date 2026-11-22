import { Router } from 'express';
import { OperatorSiteController } from '@/controllers/operator-site.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Site du parking
 *   description: >
 *     « Mon site » (22/11/2026): the parking's own site, plazo.fr/s/<slug>, made of blocks the manager orders, switches
 *     and titles. A paid extra the platform switches on.
 * /internal/site:
 *   get:
 *     tags: [Site du parking]
 *     summary: The site's address, colour, blocks, extra and whether it is online
 *   put:
 *     tags: [Site du parking]
 *     summary: Save the blocks, the address, the colour; publish or take offline (400 by field)
 * /internal/site/request:
 *   post:
 *     tags: [Site du parking]
 *     summary: Ask the platform for the extra
 * /internal/platform/operators/{id}/site:
 *   get:
 *     tags: [Site du parking]
 *     summary: The extra's state for one operator (platform)
 *   put:
 *     tags: [Site du parking]
 *     summary: Switch the extra on or off (platform)
 * /public/sites/{slug}:
 *   get:
 *     tags: [Site du parking]
 *     summary: What the site shows (404 while offline, unless the manager's preview key is given)
 */
export class OperatorSiteRoute implements Routes {
  public router = Router();
  public controller = new OperatorSiteController();

  constructor() {
    this.router.get('/internal/site', StaffAuthMiddleware('parking:manage'), this.controller.view);
    this.router.put('/internal/site', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.update);
    this.router.post('/internal/site/request', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.request);
    this.router.get('/internal/platform/operators/:id/site', PlatformAdminMiddleware(), this.controller.platformView);
    this.router.put('/internal/platform/operators/:id/site', PlatformAdminMiddleware(), this.controller.setAddon);
    this.router.get('/public/sites/:slug', this.controller.publicSite);
  }
}
