import { Router } from 'express';
import { BlogController } from '@/controllers/blog.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: The daily SEO articles of www.plazo.fr/blog (26/11/2026), written by Claude, published by a platform admin
 * /internal/platform/blog:
 *   get:
 *     summary: Plateforme › Articles, one week (platform admin)
 *     description: >
 *       ?semaine=YYYY-MM-DD (any day of the week; this week by default). { today, monday, configured, counts { published,
 *       toReview, clicks (Google, 28 days) }, days [{ day, article | null }] }; an article has its status (planned · draft ·
 *       published · rejected · failed), topic, target query, text, warnings (« à vérifier ») and clicks.
 *     tags: [Blog]
 * /internal/platform/blog/write:
 *   post:
 *     summary: Write a day's article now ({ day }); its topic is planned first when it has none. 502 ai_failed, 409 ai_unavailable · already_published
 *     tags: [Blog]
 * /internal/platform/blog/{id}:
 *   put:
 *     summary: Correct an article (topic, query, title, metaTitle, metaDescription, slug, intro, body, related); 400 per field (slug taken · published · invalid)
 *     tags: [Blog]
 * /internal/platform/blog/{id}/rewrite:
 *   post:
 *     summary: A new version by Claude, with an optional { instruction } (600 characters)
 *     tags: [Blog]
 * /internal/platform/blog/{id}/publish:
 *   post:
 *     summary: Publish on www.plazo.fr/blog/<slug>; 409 not_written · forbidden_mention (Terminal 2, payment on site) · already_published
 *     tags: [Blog]
 * /public/blog:
 *   get:
 *     summary: The published articles, newest first
 *     tags: [Blog]
 * /public/blog/{slug}:
 *   get:
 *     summary: One published article with three others; 404 otherwise
 *     tags: [Blog]
 */
export class BlogRoute implements Routes {
  public router = Router();
  public blog = new BlogController();

  constructor() {
    this.router.get('/public/blog', this.blog.list);
    this.router.get('/public/blog/:slug', this.blog.article);
    this.router.get('/internal/platform/blog', PlatformAdminMiddleware(), this.blog.week);
    this.router.post('/internal/platform/blog/write', PlatformAdminMiddleware(), this.blog.write);
    this.router.get('/internal/platform/blog/:id', PlatformAdminMiddleware(), this.blog.get);
    this.router.put('/internal/platform/blog/:id', PlatformAdminMiddleware(), this.blog.update);
    this.router.post('/internal/platform/blog/:id/rewrite', PlatformAdminMiddleware(), this.blog.rewrite);
    this.router.post('/internal/platform/blog/:id/publish', PlatformAdminMiddleware(), this.blog.publish);
    this.router.post('/internal/platform/blog/:id/unpublish', PlatformAdminMiddleware(), this.blog.unpublish);
    this.router.post('/internal/platform/blog/:id/reject', PlatformAdminMiddleware(), this.blog.reject);
  }
}
