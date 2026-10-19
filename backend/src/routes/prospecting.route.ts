import { Router } from 'express';
import { ProspectingController } from '@/controllers/prospecting.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';

/**
 * @swagger
 * tags:
 *   name: Prospection
 *   description: >
 *     Plateforme › Prospection (18/10/2026, choix « A avec les relances de B »): airport parkings the platform owner emails
 *     (entered by hand or imported from a CSV), a three-step sequence (first contact J0, follow-up J+N, last message J+M)
 *     sent Monday to Friday 09:00-18:00 Europe/Paris, at most dailyCap a day, and the public opt-out link. Platform admins
 *     only (403 otherwise). Writes are audited (prospect.*, prospecting.*) without addresses or names.
 */
/**
 * @swagger
 * /internal/platform/prospects:
 *   get:
 *     summary: The prospects (filtered), the counts per status, the airports, today's counter and whether sending is configured
 *     tags: [Prospection]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [to_contact, contacted, replied, interested, not_interested, unsubscribed] } }
 *       - { in: query, name: airport, schema: { type: string, example: LYS } }
 *       - { in: query, name: region, description: "A region key, or none (without a region)", schema: { type: string, example: auvergne-rhone-alpes } }
 *     responses:
 *       200:
 *         description: "{ data: [Prospect], counts: { all, to_contact, contacted, replied, interested, not_interested, unsubscribed }, airports: [{ code, name, count }], regions: [{ key, label }], regionCounts: { <key>: n, none: n }, today: { sent, cap, remaining }, window: { open, nextOpening }, configured }"
 *       400: { description: "fields.status invalid_status, fields.airport invalid_airport, fields.region invalid_region" }
 *   post:
 *     summary: Add a prospect by hand
 *     tags: [Prospection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, email]
 *             properties:
 *               companyName: { type: string, maxLength: 120 }
 *               contactFirstName: { type: string, maxLength: 60, nullable: true }
 *               contactLastName: { type: string, maxLength: 60, nullable: true }
 *               email: { type: string, maxLength: 254 }
 *               town: { type: string, maxLength: 80, nullable: true }
 *               airportCode: { type: string, example: LYS, nullable: true }
 *               region: { type: string, description: "Region chosen by hand (key or name); null: the airport's", example: auvergne-rhone-alpes, nullable: true }
 *               phone: { type: string, maxLength: 30, nullable: true }
 *               notes: { type: string, maxLength: 1000, nullable: true }
 *     responses:
 *       201: { description: "{ data: Prospect }" }
 *       400: { description: "fields: required, too_long, invalid_email, invalid_airport, invalid_region" }
 *       409: { description: "prospect_exists, or suppressed (the address opted out)" }
 * /internal/platform/prospects/{id}:
 *   patch:
 *     summary: Change a prospect (absent fields unchanged; the address of an unsubscribed prospect never changes, 409 unsubscribed)
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   delete:
 *     summary: Delete a prospect and its sent history (an opted-out address stays on the opt-out list)
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/prospects/import:
 *   post:
 *     summary: Import the rows read from a CSV (dryRun true = the preview, nothing written)
 *     tags: [Prospection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rows]
 *             properties:
 *               dryRun: { type: boolean }
 *               rows: { type: array, maxItems: 2000, items: { type: object, description: "Same fields as a prospect" } }
 *     responses:
 *       200:
 *         description: "{ dryRun, results: [{ row, outcome: new | duplicate | suppressed | invalid, email?, fields? }], counts, created }"
 * /internal/platform/prospects/{id}/status:
 *   post:
 *     summary: « A répondu », « Intéressé », « Pas intéressé » or « Désinscrit » — each stops the follow-ups for good
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [status], properties: { status: { type: string, enum: [replied, interested, not_interested, unsubscribed] } } }
 *     responses:
 *       409: { description: "unsubscribed: an opted-out prospect never changes state" }
 * /internal/platform/prospects/{id}/stop:
 *   post:
 *     summary: « Arrêter les relances » (the state stays)
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/prospects/send:
 *   post:
 *     summary: « Envoyer à N prospects » — enrolls the chosen prospects still to contact and sends the first email now, within today's cap; the rest waits for the next window; the follow-ups leave by themselves
 *     tags: [Prospection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [ids], properties: { ids: { type: array, maxItems: 500, items: { type: string } } } }
 *     responses:
 *       200: { description: "{ enrolled, sent, failed, queued, skipped, nextOpening }" }
 *       409: { description: "prospecting_unavailable (Brevo key, sender, site address or SECRET_KEY missing)" }
 * /internal/platform/prospects/test:
 *   post:
 *     summary: « M'envoyer un test » — one step to the admin's own address (not counted in the cap)
 *     tags: [Prospection]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               step: { type: integer, enum: [1, 2, 3] }
 *               prospectId: { type: string, description: "Render for this prospect (else fictional values)" }
 *               subject: { type: string, description: "Unsaved text of the editor (else the saved step)" }
 *               body: { type: string }
 *     responses:
 *       200: { description: "{ sentTo }" }
 *       502: { description: "email_failed" }
 * /internal/platform/prospects/settings:
 *   get:
 *     summary: The sequence (3 steps), the daily cap, the sender, the Reply-To and the sending window
 *     tags: [Prospection]
 *   put:
 *     summary: « Modifier les mails » — the 3 steps (subject, body, delayDays, enabled; step 1 always on at J0) and dailyCap (1-300); scheduled follow-ups move with the delays
 *     tags: [Prospection]
 *     responses:
 *       400: { description: "fields steps.N.subject|body (required, too_long, unknown_variable), steps.N.delayDays (delay_range, delay_order), dailyCap (cap_range)" }
 * /public/prospecting/unsubscribe/{token}:
 *   get:
 *     summary: The opt-out page (French, a button; never unsubscribes by itself)
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: HTML page }
 *       404: { description: Invalid link (HTML page) }
 *   post:
 *     summary: Unsubscribe (the page's button and the one-click List-Unsubscribe-Post of RFC 8058); the address is never contacted again, even re-imported
 *     tags: [Prospection]
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: HTML confirmation }
 *       404: { description: Invalid link }
 */
export class ProspectingRoute implements Routes {
  public router = Router();
  public prospecting = new ProspectingController();

  constructor() {
    const base = '/internal/platform/prospects';
    this.router.get(base, PlatformAdminMiddleware(), this.prospecting.list);
    this.router.post(base, PlatformAdminMiddleware(), this.prospecting.create);
    this.router.get(`${base}/settings`, PlatformAdminMiddleware(), this.prospecting.settings);
    this.router.put(`${base}/settings`, PlatformAdminMiddleware(), this.prospecting.updateSettings);
    this.router.post(`${base}/import`, PlatformAdminMiddleware(), this.prospecting.import);
    this.router.post(`${base}/send`, PlatformAdminMiddleware(), this.prospecting.send);
    this.router.post(`${base}/test`, PlatformAdminMiddleware(), this.prospecting.test);
    this.router.patch(`${base}/:id`, PlatformAdminMiddleware(), this.prospecting.update);
    this.router.delete(`${base}/:id`, PlatformAdminMiddleware(), this.prospecting.remove);
    this.router.post(`${base}/:id/status`, PlatformAdminMiddleware(), this.prospecting.setStatus);
    this.router.post(`${base}/:id/stop`, PlatformAdminMiddleware(), this.prospecting.stop);
    this.router.get('/public/prospecting/unsubscribe/:token', this.prospecting.unsubscribePage);
    this.router.post('/public/prospecting/unsubscribe/:token', this.prospecting.unsubscribe);
  }
}
