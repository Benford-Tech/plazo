import { Router } from 'express';
import { ListingController } from '@/controllers/listing.controller';
import { UpdateListingDto, UpdatePricingDto } from '@/dtos/listing.dto';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Listing
 *   description: The operator's page on Plazo and its pricing grid
 */
/**
 * @swagger
 * /internal/listing:
 *   get:
 *     summary: The operator's Plazo page (null until created) and parking basics
 *     tags: [Listing]
 *   put:
 *     summary: Create or update the Plazo page (manager). Never changes its status; a published page stays online (audited).
 *     tags: [Listing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [airportCode, slug, title, services, cancellationPolicy, photos]
 *             properties:
 *               airportCode: { type: string, example: LYS }
 *               slug: { type: string, example: parking-demo }
 *               title: { type: string }
 *               description: { type: string }
 *               services: { type: array, items: { type: string, enum: [shuttle, valet, covered, ev_charging, open_24h, fenced, cctv] } }
 *               shuttleMinutes: { type: integer }
 *               distanceKm: { type: number }
 *               openingHours: { type: string, example: "24h/24" }
 *               contactPhone: { type: string, nullable: true, example: "04 72 00 00 00", description: Shown to travellers; unchanged when absent }
 *               cancellationPolicy: { type: string, enum: [free_until_arrival, free_24h, free_48h, non_refundable] }
 *               photos: { type: array, items: { type: string, format: uri } }
 * /internal/listing/submit:
 *   post:
 *     summary: Send the page for validation by the platform (draft or refused -> pending_review; manager)
 *     description: Requires a pricing grid (pricing_required) and a confirmed email (email_not_verified, 403).
 *     tags: [Listing]
 *     responses:
 *       200:
 *         description: "{ message, data: listing }"
 *       409:
 *         description: Not possible from the current status (code invalid_transition)
 * /internal/listing/withdraw:
 *   post:
 *     summary: Take the page offline or cancel the request (published or pending_review -> draft; manager)
 *     tags: [Listing]
 * /internal/pricing:
 *   get:
 *     summary: Pricing grid — packages "up to N days" and the price of each extra day
 *     tags: [Listing]
 *   put:
 *     summary: Replace the pricing grid (manager)
 *     tags: [Listing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tiers]
 *             properties:
 *               tiers: { type: array, items: { type: object, properties: { days: { type: integer }, priceCents: { type: integer } } } }
 *               extraDayPriceCents: { type: integer, nullable: true }
 */
export class ListingRoute implements Routes {
  public router = Router();
  public listing = new ListingController();

  constructor() {
    this.router.get('/internal/listing', StaffAuthMiddleware('dashboard:view'), this.listing.getListing);
    this.router.put('/internal/listing', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdateListingDto), this.listing.updateListing);
    this.router.post('/internal/listing/submit', StaffAuthMiddleware('parking:manage'), this.listing.submit);
    this.router.post('/internal/listing/withdraw', StaffAuthMiddleware('parking:manage'), this.listing.withdraw);
    this.router.get('/internal/pricing', StaffAuthMiddleware('dashboard:view'), this.listing.getPricing);
    this.router.put('/internal/pricing', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdatePricingDto), this.listing.updatePricing);
  }
}
