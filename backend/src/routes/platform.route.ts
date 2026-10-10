import { Router } from 'express';
import { PlatformController } from '@/controllers/platform.controller';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { InviteOperatorDto, PlatformNotificationDto, RejectListingDto, UnpublishListingDto, UpdateCommissionDto } from '@/dtos/platform.dto';
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
 *     description: >
 *       The current operators (active and suspended) by default; the archived ones with view=archived (09/10/2026).
 *       counts gives the size of both lists.
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: view, required: false, schema: { type: string, enum: [current, archived] } }
 *     responses:
 *       200:
 *         description: "{ defaultCommissionBps, counts: { current, archived }, operators: [...] }"
 *       400:
 *         description: Unknown view (fields.view invalid_view)
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
 *     summary: Reactivate a suspended operator (an archived one leaves the archive too)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/operators/{id}/archive:
 *   post:
 *     summary: Archive a suspended operator (out of the Loueurs and Annonces lists and of the crons; its data is kept)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       409:
 *         description: The operator is active (code not_suspended)
 * /internal/platform/operators/{id}/unarchive:
 *   post:
 *     summary: Take an operator out of the archive (back in the Loueurs list, still suspended)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/operators/{id}/deletion:
 *   get:
 *     summary: What deleting the operator would erase, and whether it is allowed (09/10/2026)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ data: { id, name, deletable, reason: null | cannot_delete_platform | not_suspended | has_payments, counts: { parkings, reservations, staff, paidReservations } } }"
 * /internal/platform/operators/{id}:
 *   delete:
 *     summary: Delete an operator with everything that hangs from it (parkings, listing, bookings, team…)
 *     description: >
 *       Irreversible. Allowed on a suspended operator, or on an invited one whose invitation was never accepted;
 *       never on the platform's own account, nor on an operator with online payments (accounting records: archive it).
 *       Demo operators may be deleted with their test payments. Recorded in the admin's own journal (operator.deleted).
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ data: { id, name, counts } }"
 *       400:
 *         description: The platform's own account (code cannot_delete_platform)
 *       409:
 *         description: Active and used (code not_suspended), or online payments (code has_payments)
 * /internal/platform/operators/{id}/view-as:
 *   post:
 *     summary: Open the operator's space — a 60-minute access token scoped to it, without refresh
 *     description: >
 *       The token acts as a manager of the operator. Its writes are audited with the admin's own
 *       staff id (action view_as.write). Only the team, the passwords and credentials (SMS gateway),
 *       the payments and the person's own settings (name, post, vehicle, devices, notification
 *       preferences) are refused (403 view_as_read_only, 10/10/2026); starting a shuttle trip or sending
 *       its position too (403 view_as_not_driver: the admin is not one of the operator's drivers).
 *       It stops working as soon as the email leaves PLATFORM_ADMIN_EMAILS.
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       201:
 *         description: "{ access: { token, expires }, operator: { id, name } }"
 * /internal/platform/notifications:
 *   get:
 *     summary: E-A — the last platform broadcasts ({ data [{ id, audience, operatorName, title, body, url, recipients, sentByName, createdAt }] })
 *     tags: [Platform]
 *     responses:
 *       200: { description: History }
 *   post:
 *     summary: E-A — push to every operator's staff ("staff"), every traveller with a current booking ("travellers") or one operator's staff ("operator" + operatorId); 429 daily_limit past 2 traveller broadcasts a day (C-A); audited
 *     tags: [Platform]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audience, title, body]
 *             properties:
 *               audience: { type: string, enum: [staff, travellers, operator] }
 *               operatorId: { type: string, nullable: true }
 *               title: { type: string, maxLength: 50 }
 *               body: { type: string, maxLength: 160 }
 *               url: { type: string, nullable: true }
 *     responses:
 *       201: { description: "{ data }" }
 * /internal/platform/notifications/audience:
 *   get:
 *     summary: E-A — how many phones a broadcast would reach ({ devices, configured })
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: audience, schema: { type: string, enum: [staff, travellers, operator] } }
 *       - { in: query, name: operatorId, schema: { type: string } }
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
 *             required: [operatorName, managerFirstName, managerLastName, managerEmail, totalCapacity]
 *             properties:
 *               operatorName: { type: string, maxLength: 80 }
 *               managerFirstName: { type: string, maxLength: 60, description: "Trimmed; required (09/10/2026)" }
 *               managerLastName: { type: string, maxLength: 60, description: "Trimmed; required (09/10/2026)" }
 *               managerEmail: { type: string }
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
 * /internal/platform/geo/buildings:
 *   get:
 *     summary: BD TOPO buildings in a box of 0.05° at most (proxy to the Géoplateforme WFS), B-A
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
    this.router.get(`${base}/notifications`, PlatformAdminMiddleware(), this.platform.notifications);
    this.router.get(`${base}/notifications/audience`, PlatformAdminMiddleware(), this.platform.notificationAudience);
    this.router.post(
      `${base}/notifications`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(PlatformNotificationDto),
      this.platform.sendNotification,
    );
    this.router.get(`${base}/operators`, PlatformAdminMiddleware(), this.platform.operators);
    this.router.patch(
      `${base}/operators/:id/commission`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(UpdateCommissionDto),
      this.platform.setCommission,
    );
    this.router.post(`${base}/operators/:id/suspend`, PlatformAdminMiddleware(), this.platform.suspend);
    this.router.post(`${base}/operators/:id/reactivate`, PlatformAdminMiddleware(), this.platform.reactivate);
    this.router.post(`${base}/operators/:id/archive`, PlatformAdminMiddleware(), this.platform.archive);
    this.router.post(`${base}/operators/:id/unarchive`, PlatformAdminMiddleware(), this.platform.unarchive);
    this.router.get(`${base}/operators/:id/deletion`, PlatformAdminMiddleware(), this.platform.deletionPreview);
    this.router.delete(`${base}/operators/:id`, PlatformAdminMiddleware(), this.platform.deleteOperator);
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
    this.router.get(`${base}/geo/buildings`, PlatformAdminMiddleware(), this.platform.buildings);
    this.router.get(`${base}/geo/geocode`, PlatformAdminMiddleware(), this.platform.geocode);
  }
}
