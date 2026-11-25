import { SiteContactDto } from '@/dtos/contact.dto';
import { contactLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
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
 * /internal/site/domain:
 *   put:
 *     tags: [Site du parking]
 *     summary: Set or remove the parking's own domain name (400 domain invalid · taken · addon_required)
 * /public/site-domains/{host}:
 *   get:
 *     tags: [Site du parking]
 *     summary: The site a parking's own host opens (404 unless online and the name active)
 * /public/sites/{slug}/contact:
 *   post:
 *     tags: [Site du parking]
 *     summary: >
 *       The contact form of the parking's site (name, email, phone?, reference?, message, website honeypot): into
 *       « Messages » and by e-mail to the managers; 404 while offline (unless ?apercu=<key>); 5 per hour per visitor
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
    this.router.put('/internal/site/domain', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.setDomain);
    this.router.post('/internal/site/domain/check', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.checkDomain);
    this.router.put('/internal/platform/operators/:id/site/domain', PlatformAdminMiddleware(), this.controller.setDomainActive);
    for (const kind of ['hero', 'team'] as const) {
      this.router.post(`/internal/site/${kind}-photo`, StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.setPhoto(kind));
      this.router.delete(`/internal/site/${kind}-photo`, StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.removePhoto(kind));
      this.router.get(`/public/sites/:slug/${kind}/:file`, this.controller.photo(kind));
    }
    this.router.get('/public/sites/:slug/logo', this.controller.logo);
    this.router.get('/public/sites/:slug/icon', this.controller.icon);
    this.router.get('/public/sites/:slug', this.controller.publicSite);
    this.router.post('/public/sites/:slug/contact', contactLimiter, ValidationMiddleware(SiteContactDto), this.controller.contact);
    this.router.get('/public/site-domains/:host', this.controller.byDomain);
  }
}
