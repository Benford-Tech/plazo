import { Router } from 'express';
import { SeoController } from '@/controllers/seo.controller';
import { VisitDto } from '@/dtos/seo.dto';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { visitLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: SEO
 *   description: Measurement of the traveller site (06/11/2026, SEO local A + M2)
 * /public/visits:
 *   post:
 *     summary: Count the first page of a visit of the traveller site
 *     description: >
 *       Sent once per visit by the site's browser code. { source: search | direct | referral | social | campaign, detail?
 *       (engine, site or campaign), landing (path) }. Counted per day, landing page and origin; nothing about the visitor is
 *       kept. 204 always (an unreadable visit is ignored).
 *     tags: [SEO]
 * /internal/platform/seo:
 *   get:
 *     summary: Plateforme › Référencement (platform admin)
 *     description: >
 *       ?days=7|30|90 (30 by default), today included, Paris time. Bookings made on Plazo by origin, visits and bookings per
 *       landing page, and Search Console (queries and pages with clicks, impressions, average position and the position of
 *       the period before), with the import's state.
 *     tags: [SEO]
 */
export class SeoRoute implements Routes {
  public router = Router();
  public seo = new SeoController();

  constructor() {
    this.router.post('/public/visits', visitLimiter, ValidationMiddleware(VisitDto), this.seo.visit);
    this.router.get('/internal/platform/seo', PlatformAdminMiddleware(), this.seo.report);
  }
}
