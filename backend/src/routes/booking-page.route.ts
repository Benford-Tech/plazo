import { Router } from 'express';
import { BookingPageController } from '@/controllers/booking-page.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Page de réservation
 *   description: >
 *     19/11/2026 (Site du parking, niveau 3): the parking's own Plazo booking page, plazo.fr/r/<slug>, in its site or as a
 *     link. Plazo bookings (paid online) marked viaBookingPage, without commission.
 * /internal/booking-page:
 *   get:
 *     summary: The page's address, colour, whether it is on, and the code for the site → { enabled, slug, saved, accent, listingOnline, page, embed }
 *     tags: [Page de réservation]
 *   put:
 *     summary: "{ enabled?, slug?, accent? } — absent fields unchanged"
 *     tags: [Page de réservation]
 *     responses:
 *       400: { description: "slug: invalid, reserved, taken; accent: invalid; enabled: listing_offline" }
 * /public/booking-pages/{slug}:
 *   get:
 *     summary: What a page opens → { slug, title, airport, airportName, parking, accent, accentInk }
 *     tags: [Page de réservation]
 *     responses:
 *       404: { description: not_found (unknown, off, listing offline, operator inactive) }
 */
export class BookingPageRoute implements Routes {
  public router = Router();
  public controller = new BookingPageController();

  constructor() {
    this.router.get('/internal/booking-page', StaffAuthMiddleware('parking:manage'), this.controller.view);
    this.router.put('/internal/booking-page', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.controller.update);
    this.router.get('/public/booking-pages/:slug', this.controller.publicPage);
  }
}
