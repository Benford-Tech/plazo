import { Router } from 'express';
import { ListingController } from '@/controllers/listing.controller';
import { SuggestDescriptionDto, UpdateListingDto, UpdatePricingDto } from '@/dtos/listing.dto';
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
 * /internal/listing/description/suggest:
 *   post:
 *     summary: Claude writes the « Présentation » of the page from the parking's real data (manager; nothing is saved)
 *     description: >
 *       The facts are the saved page (services, shuttle, distance, hours, cancellation), the parking (name, address,
 *       return meeting point), its airport, pricing grid, shuttle vehicles in service, stops and valet files. With
 *       `current`, Claude improves that text instead of starting over. An answer stating a figure absent from the data
 *       (or from `current`), in digits or in words before a unit, mentioning the closed Terminal 2 or longer than 2 000 characters is rejected (ai_unreliable).
 *     tags: [Listing]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               current: { type: string, maxLength: 2000, description: The text in the field, to improve }
 *     responses:
 *       200:
 *         description: "{ text, model }"
 *       409:
 *         description: No Anthropic API key, or the key is refused (code ai_unavailable)
 *       502:
 *         description: Claude declined (ai_refused), failed (ai_failed, details.reason) or wrote an unsupported figure (ai_unreliable, details.reason and details.figures)
 *       503:
 *         description: Claude is busy (ai_busy)
 *       504:
 *         description: Claude did not answer within 30 s (ai_timeout)
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
 *     summary: Pricing grid — packages "up to N days", the price of each extra day, and the night fees
 *     description: >-
 *       { tiers, extraDayPriceCents, commissionBps, night: { enabled, start, end, arrivalFeeCents, returnFeeCents } }:
 *       `start`/`end` are null when never set, the fees null when unset. Night fees (12/10/2026): one local window,
 *       the same every day, for drop-offs and returns ("HH:mm"; the start counts as night, the end does not; it may
 *       cross midnight); a drop-off booked in it pays `arrivalFeeCents`, a return `returnFeeCents`, both when both
 *       ends are at night. Plazo bookings only, included in the total and in Plazo's commission.
 *     tags: [Listing]
 *   put:
 *     summary: Replace the pricing grid, and the night fees when sent (manager)
 *     description: >-
 *       `night` absent: unchanged. Switched on, `start` and `end` are required ("HH:mm", 00:00 to 23:59, invalid_time)
 *       and must differ (same_time), the fees are integers from 0 to 100000 cents (integer, min_0, too_large) and at
 *       least one is above 0 (fee_required). Switched off, the values sent are kept (formats still checked), so that
 *       switching back on restores them. 400 validation_failed with fields night.start, night.end,
 *       night.arrivalFeeCents, night.returnFeeCents (night.enabled: required).
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
 *               night:
 *                 type: object
 *                 required: [enabled]
 *                 properties:
 *                   enabled: { type: boolean }
 *                   start: { type: string, nullable: true, example: "22:00" }
 *                   end: { type: string, nullable: true, example: "06:00" }
 *                   arrivalFeeCents: { type: integer, nullable: true, example: 1500 }
 *                   returnFeeCents: { type: integer, nullable: true, example: 1000 }
 */
export class ListingRoute implements Routes {
  public router = Router();
  public listing = new ListingController();

  constructor() {
    this.router.get('/internal/listing', StaffAuthMiddleware('dashboard:view'), this.listing.getListing);
    this.router.put('/internal/listing', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdateListingDto), this.listing.updateListing);
    this.router.post(
      '/internal/listing/description/suggest',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(SuggestDescriptionDto),
      this.listing.suggestDescription,
    );
    this.router.post('/internal/listing/submit', StaffAuthMiddleware('parking:manage'), this.listing.submit);
    this.router.post('/internal/listing/withdraw', StaffAuthMiddleware('parking:manage'), this.listing.withdraw);
    this.router.get('/internal/pricing', StaffAuthMiddleware('dashboard:view'), this.listing.getPricing);
    this.router.put('/internal/pricing', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdatePricingDto), this.listing.updatePricing);
  }
}
