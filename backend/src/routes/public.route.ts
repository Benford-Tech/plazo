import { Router } from 'express';
import { PublicController } from '@/controllers/public.controller';
import { Routes } from '@/interfaces/routes.interface';

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Read-only data for the Plazo traveller site (no authentication, published pages only)
 */
/**
 * @swagger
 * /public/config:
 *   get:
 *     summary: "How travellers pay: { payments: online | on_site }"
 *     description: >-
 *       "online" when Stripe is configured (STRIPE_SECRET_KEY): bookings are paid by card on the site.
 *       The airport, search and parking answers carry the same `payments` field, and each parking a
 *       `payment` field: "online", "on_site", or "unavailable" (payments on, but its operator cannot take
 *       them yet: not bookable on the site).
 *     tags: [Public]
 *     security: []
 * /public/airports:
 *   get:
 *     summary: "Airports served by the platform: [{ code, name, city, slug }] (sign-up form of the pro space)"
 *     tags: [Public]
 *     security: []
 * /public/airports/{slug}:
 *   get:
 *     summary: Airport page — published parkings with their lowest package price
 *     description: >-
 *       The airport has a `location` ({ lat, lng }); each parking has a `location` ({ lat, lng }) or null
 *       when unknown (geocoded from its address the first time it is needed).
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string, example: lyon-saint-exupery } }
 * /public/airports/{slug}/live:
 *   get:
 *     summary: "Live layer of the home map (K-A): the airport's parkings and their shuttles on the road"
 *     description: "Anonymous: shuttle position, direction and vehicle only — never a driver, a plate or a passenger. Polled every 12 s."
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string, example: lyon-saint-exupery } }
 * /public/search:
 *   get:
 *     summary: Parkings for a stay — availability and total price, available first then cheapest
 *     description: Same `location` fields as the airport page (airport and each parking), for the site's map.
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: query, name: airport, required: true, schema: { type: string, example: lyon-saint-exupery } }
 *       - { in: query, name: arrivalAt, required: true, schema: { type: string, example: "2026-10-04T06:30" } }
 *       - { in: query, name: returnAt, required: true, schema: { type: string, example: "2026-10-11T15:05" } }
 * /public/airports/{airport}/parkings/{slug}:
 *   get:
 *     summary: A parking's page, with the offer for a stay when dates are given
 *     description: The parking's `location` ({ lat, lng } or null) and the airport's `location`.
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: path, name: airport, required: true, schema: { type: string } }
 *       - { in: path, name: slug, required: true, schema: { type: string } }
 *       - { in: query, name: arrivalAt, schema: { type: string } }
 *       - { in: query, name: returnAt, schema: { type: string } }
 */
export class PublicRoute implements Routes {
  public router = Router();
  public public = new PublicController();

  // Rate limited per traveller in app.ts (publicLimiter on /public).
  constructor() {
    this.router.get('/public/config', this.public.config);
    this.router.get('/public/airports', this.public.airports);
    this.router.get('/public/airports/:slug', this.public.airport);
    this.router.get('/public/airports/:slug/live', this.public.live);
    this.router.get('/public/search', this.public.search);
    this.router.get('/public/airports/:airport/parkings/:slug', this.public.parking);
  }
}
