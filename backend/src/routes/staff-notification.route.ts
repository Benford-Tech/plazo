import { Router } from 'express';
import { StaffNotificationController } from '@/controllers/staff-notification.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Bell
 *   description: >
 *     « Mes notifications » (02/11/2026): the bell of the pro space and Plazo Pro (`staff_notifications`, 30 days), the
 *     browsers that accepted notifications (Web Push) and, per event, where each member hears of it (phone, browser, bell).
 * /internal/notifications:
 *   get:
 *     summary: The member's latest notifications { data, hasMore, unread }; ?filter=bookings|shuttle|team, ?before=<ISO>
 * /internal/notifications/count:
 *   get:
 *     summary: "{ unread }"
 * /internal/notifications/read:
 *   post:
 *     summary: Marks { ids } read (all without ids); returns { unread }
 * /internal/notifications/channels:
 *   get:
 *     summary: Per event, { phone, browser, bell }; the member's phones and browsers; the browsers' public key
 *   put:
 *     summary: "{ channels: { <event>: { phone?, browser?, bell? } } } (400 validation_failed on an unknown event or channel)"
 * /internal/notifications/browsers:
 *   post:
 *     summary: Registers this browser { endpoint, keys { p256dh, auth }, label } (409 web_push_unavailable without VAPID keys)
 * /internal/notifications/browsers/remove:
 *   post:
 *     summary: Forgets this browser { endpoint }
 * /internal/notifications/test:
 *   post:
 *     summary: « M'envoyer une notification de test » → { bell, browsers, phones, phonesConfigured }
 */
export class StaffNotificationRoute implements Routes {
  public router = Router();
  public bell = new StaffNotificationController();

  constructor() {
    this.router.get('/internal/notifications', StaffAuthMiddleware(), this.bell.list);
    this.router.get('/internal/notifications/count', StaffAuthMiddleware(), this.bell.count);
    this.router.post('/internal/notifications/read', StaffAuthMiddleware(), this.bell.read);
    this.router.get('/internal/notifications/channels', StaffAuthMiddleware(), this.bell.channels);
    this.router.put('/internal/notifications/channels', StaffAuthMiddleware(), RefuseInViewAs(), this.bell.setChannels);
    this.router.post('/internal/notifications/browsers', StaffAuthMiddleware(), RefuseInViewAs(), this.bell.subscribe);
    this.router.post('/internal/notifications/browsers/remove', StaffAuthMiddleware(), RefuseInViewAs(), this.bell.unsubscribe);
    this.router.post('/internal/notifications/test', StaffAuthMiddleware(), RefuseInViewAs(), this.bell.test);
  }
}
