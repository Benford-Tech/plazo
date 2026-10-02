import { Router } from 'express';
import { PlatformController } from '@/controllers/platform.controller';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { InviteOperatorDto, RejectListingDto, UnpublishListingDto, UpdateCommissionDto } from '@/dtos/platform.dto';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Platform
 *   description: >
 *     The platform owner's space (emails listed in PLATFORM_ADMIN_EMAILS; 403 for everyone else):
 *     operators, review of their listings, bookings and payouts of every operator, invitations,
 *     suspension, "open their space" (view-as) and the capacity estimator.
 */
/**
 * @swagger
 * /internal/platform/operators:
 *   get:
 *     summary: Every operator with its parkings, manager, listing status, Stripe status, commission, bookings this month and pending invitation
 *     tags: [Platform]
 *     responses:
 *       200:
 *         description: "{ defaultCommissionBps, operators: [...] }"
 * /internal/platform/operators/{id}/commission:
 *   patch:
 *     summary: Set the operator's commission on online bookings (basis points; null = platform default)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [commissionBps], properties: { commissionBps: { type: integer, nullable: true, minimum: 0, maximum: 5000 } } }
 * /internal/platform/operators/{id}/suspend:
 *   post:
 *     summary: Suspend an operator (its staff are signed out and cannot log in; its listings leave the site)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       400:
 *         description: The platform's own operator (code cannot_suspend_platform)
 * /internal/platform/operators/{id}/reactivate:
 *   post:
 *     summary: Reactivate a suspended operator
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/operators/{id}/view-as:
 *   post:
 *     summary: Open the operator's space — a 60-minute access token scoped to it, without refresh
 *     description: >
 *       The token acts as a manager of the operator. Its writes are audited with the admin's own
 *       staff id (action view_as.write); team, password and account changes are refused (403
 *       view_as_read_only). It stops working as soon as the email leaves PLATFORM_ADMIN_EMAILS.
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       201:
 *         description: "{ access: { token, expires }, operator: { id, name } }"
 * /internal/platform/invitations:
 *   post:
 *     summary: Invite an operator — creates it with its parking and manager, emails a link (7 days, single use) to set the password
 *     description: When the email cannot be sent (Brevo not configured), inviteUrl carries the link, to pass on by hand.
 *     tags: [Platform]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [operatorName, managerEmail, totalCapacity]
 *             properties:
 *               operatorName: { type: string, maxLength: 80 }
 *               managerEmail: { type: string }
 *               managerName: { type: string }
 *               totalCapacity: { type: integer, minimum: 1 }
 *               commissionBps: { type: integer, nullable: true, minimum: 0, maximum: 5000 }
 *     responses:
 *       201:
 *         description: "{ operator: { id, name }, emailSent, expiresAt, inviteUrl? }"
 *       409:
 *         description: Email already used (code email_taken)
 * /internal/platform/operators/{id}/invitation:
 *   post:
 *     summary: Send the invitation again (a new link; the previous one stops working)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       409:
 *         description: No pending invitation (code no_pending_invitation)
 * /internal/platform/listings:
 *   get:
 *     summary: Listings of every operator, by status (oldest request first), with the count per status
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [draft, pending_review, published, rejected] } }
 * /internal/platform/listings/{id}/approve:
 *   post:
 *     summary: Validate a listing sent for review (pending_review -> published); emails the operator
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       409:
 *         description: Not in review (code invalid_transition)
 * /internal/platform/listings/{id}/reject:
 *   post:
 *     summary: Refuse a listing sent for review, with a message shown to the operator (pending_review -> rejected)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [message], properties: { message: { type: string, maxLength: 1000 } } }
 * /internal/platform/listings/{id}/unpublish:
 *   post:
 *     summary: Take a published listing offline, with an optional message (published -> draft)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { message: { type: string, maxLength: 1000 } } }
 * /internal/platform/reservations:
 *   get:
 *     summary: Bookings of every operator (read-only, no contact details), newest arrival first, 50 per page
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: operatorId, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, example: "2026-10-01" }, description: Arrival on or after (Europe/Paris) }
 *       - { in: query, name: to, schema: { type: string, example: "2026-10-31" }, description: Arrival on or before }
 *       - { in: query, name: page, schema: { type: integer } }
 * /internal/platform/payments:
 *   get:
 *     summary: Per operator — Stripe account status, payout schedule, payouts waiting and payouts refused by Stripe
 *     tags: [Platform]
 * /internal/platform/payouts/{reservationId}/retry:
 *   post:
 *     summary: Try again a payout refused by Stripe (failed), with the cron's transfer logic
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: reservationId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ result: transferred | failed | skipped, payoutStatus }"
 *       409:
 *         description: Not failed (payout_not_failed) or the operator's account cannot receive transfers (operator_account_not_ready)
 *       503:
 *         description: Online payments are off (payments_disabled)
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CapacityStudyInput:
 *       type: object
 *       description: Geometries are GeoJSON in WGS84. Every field is optional on PATCH.
 *       properties:
 *         name: { type: string, maxLength: 120 }
 *         outline: { type: object, nullable: true, description: "GeoJSON Polygon (2000 vertices at most)" }
 *         parcels: { type: array, maxItems: 50, items: { type: object } }
 *         scaleFactor: { type: number, minimum: 0.5, maximum: 2 }
 *         zones: { type: array, maxItems: 50, items: { type: object, description: "{ id, name, geometry: Polygon }" } }
 *         exclusions:
 *           type: array
 *           maxItems: 200
 *           items: { type: object, description: "{ id, name, kind: building|reception|shuttle_lane|tree|post|other, geometry: Polygon|LineString|Point, clearance (m) }" }
 *         settings: { type: object, description: "Layout settings (10 kB at most)" }
 *         results: { type: object, description: "Summary of the last estimate (100 kB at most)" }
 *         carMarkers: { type: array, maxItems: 5000, items: { type: array, items: { type: number } } }
 * /internal/platform/capacity-studies:
 *   get:
 *     summary: List the capacity studies (most recent first)
 *     tags: [Platform]
 *   post:
 *     summary: Create a capacity study
 *     tags: [Platform]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CapacityStudyInput' }
 * /internal/platform/capacity-studies/{id}:
 *   get:
 *     summary: One capacity study
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   patch:
 *     summary: Save part of a capacity study (autosave)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CapacityStudyInput' }
 *   delete:
 *     summary: Delete a capacity study
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/geo/parcels:
 *   get:
 *     summary: Cadastral parcels at a point (proxy to IGN API Carto, cadastre)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: lon, required: true, schema: { type: number } }
 *       - { in: query, name: lat, required: true, schema: { type: number } }
 * /internal/platform/geo/parkings:
 *   get:
 *     summary: BD TOPO parking areas in a box of 0.05° at most (proxy to the Géoplateforme WFS)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: bbox, required: true, schema: { type: string, example: "5.07,45.715,5.09,45.73" }, description: "minLon,minLat,maxLon,maxLat" }
 * /internal/platform/geo/geocode:
 *   get:
 *     summary: Address search (proxy to the Géoplateforme geocoding service)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: q, required: true, schema: { type: string, minLength: 3 } }
 */
export class PlatformRoute implements Routes {
  public router = Router();
  public platform = new PlatformController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const base = '/internal/platform';
    this.router.get(`${base}/operators`, PlatformAdminMiddleware(), this.platform.operators);
    this.router.patch(
      `${base}/operators/:id/commission`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(UpdateCommissionDto),
      this.platform.setCommission,
    );
    this.router.post(`${base}/operators/:id/suspend`, PlatformAdminMiddleware(), this.platform.suspend);
    this.router.post(`${base}/operators/:id/reactivate`, PlatformAdminMiddleware(), this.platform.reactivate);
    this.router.post(`${base}/operators/:id/view-as`, PlatformAdminMiddleware(), this.platform.viewAs);
    this.router.post(`${base}/operators/:id/invitation`, PlatformAdminMiddleware(), this.platform.resendInvitation);
    this.router.post(`${base}/invitations`, PlatformAdminMiddleware(), ValidationMiddleware(InviteOperatorDto), this.platform.invite);
    this.router.get(`${base}/listings`, PlatformAdminMiddleware(), this.platform.listings);
    this.router.post(`${base}/listings/:id/approve`, PlatformAdminMiddleware(), this.platform.approveListing);
    this.router.post(`${base}/listings/:id/reject`, PlatformAdminMiddleware(), ValidationMiddleware(RejectListingDto), this.platform.rejectListing);
    this.router.post(
      `${base}/listings/:id/unpublish`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(UnpublishListingDto),
      this.platform.unpublishListing,
    );
    this.router.get(`${base}/reservations`, PlatformAdminMiddleware(), this.platform.reservations);
    this.router.get(`${base}/payments`, PlatformAdminMiddleware(), this.platform.payments);
    this.router.post(`${base}/payouts/:reservationId/retry`, PlatformAdminMiddleware(), this.platform.retryPayout);
    this.router.get(`${base}/capacity-studies`, PlatformAdminMiddleware(), this.platform.listStudies);
    this.router.post(`${base}/capacity-studies`, PlatformAdminMiddleware(), ValidationMiddleware(CreateCapacityStudyDto), this.platform.createStudy);
    this.router.get(`${base}/capacity-studies/:id`, PlatformAdminMiddleware(), this.platform.getStudy);
    this.router.patch(
      `${base}/capacity-studies/:id`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(UpdateCapacityStudyDto),
      this.platform.updateStudy,
    );
    this.router.delete(`${base}/capacity-studies/:id`, PlatformAdminMiddleware(), this.platform.deleteStudy);
    this.router.get(`${base}/geo/parcels`, PlatformAdminMiddleware(), this.platform.parcels);
    this.router.get(`${base}/geo/parkings`, PlatformAdminMiddleware(), this.platform.parkings);
    this.router.get(`${base}/geo/geocode`, PlatformAdminMiddleware(), this.platform.geocode);
  }
}
