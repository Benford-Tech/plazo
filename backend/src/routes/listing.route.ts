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
 *     summary: Create or update the Plazo page (manager). Publishing requires a pricing grid.
 *     tags: [Listing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [airportCode, slug, title, services, cancellationPolicy, photos, published]
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
 *               published: { type: boolean }
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
    this.router.get('/internal/pricing', StaffAuthMiddleware('dashboard:view'), this.listing.getPricing);
    this.router.put('/internal/pricing', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdatePricingDto), this.listing.updatePricing);
  }
}
