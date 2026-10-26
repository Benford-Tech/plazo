import { Router } from 'express';
import { ContractTemplateController } from '@/controllers/contract-template.controller';
import { Routes } from '@/interfaces/routes.interface';
import { lookupLimiter } from '@/middlewares/rateLimiter';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Contract template
 *   description: >
 *     The parking's own contract (26/10/2026, « chaque parking peut héberger le contrat de stationnement à ses clients »,
 *     choice A « Mon PDF ») and the register of the signed contracts (R-A). The managers upload the PDF their travellers
 *     sign at the counter (versions kept, one in force; « Revenir au modèle Plazo » retires it); every signed contract
 *     keeps the PDF signed (the parking's PDF, or Plazo's text laid out, plus a « Réservation et signature » page) and
 *     the proof (that page alone), served to the team and to the traveller (x-booking-token).
 * /internal/contract-template:
 *   get:
 *     summary: The contract in force, the previous versions, and how many contracts were signed on each
 *   post:
 *     summary: Uploads the parking's contract (the PDF's bytes as the body, Content-Type application/pdf, ?fileName=&title=)
 *     description: 400 validation_failed (file empty · too_large · not_a_pdf · pdf_encrypted · pdf_unreadable), 503 photos_unavailable.
 * /internal/contract-template/revert:
 *   post:
 *     summary: Back to the Plazo template (409 no_template when none is in force)
 * /internal/contract-template/{templateId}/file:
 *   get:
 *     summary: The PDF of a version (application/pdf)
 * /internal/contracts:
 *   get:
 *     summary: The signed contracts, the latest first (?from=&to=&q=&reserved=1&page=)
 * /internal/contracts/export:
 *   get:
 *     summary: The same as CSV (« ; », UTF-8 with BOM)
 * /internal/reservations/{id}/contract/file:
 *   get:
 *     summary: A signed contract's file, ?kind=template|signed|proof (application/pdf)
 * /public/bookings/{reference}/contract/file:
 *   get:
 *     summary: The traveller's own copy, ?kind=template|signed|proof (x-booking-token)
 *     security: []
 */
export class ContractTemplateRoute implements Routes {
  public router = Router();
  public templates = new ContractTemplateController();

  constructor() {
    const manage = StaffAuthMiddleware('parking:manage');
    this.router.get('/internal/contract-template', manage, this.templates.mine);
    this.router.post('/internal/contract-template', manage, RefuseInDemo(), this.templates.upload);
    this.router.post('/internal/contract-template/revert', manage, RefuseInDemo(), this.templates.revert);
    this.router.get('/internal/contract-template/:templateId/file', manage, this.templates.templateFile);
    this.router.get('/internal/contracts', manage, this.templates.register);
    this.router.get('/internal/contracts/export', manage, this.templates.exportCsv);
    this.router.get('/internal/reservations/:id/contract/file', StaffAuthMiddleware('reservations:view'), this.templates.staffFile);
    this.router.get('/public/bookings/:reference/contract/file', lookupLimiter, this.templates.travellerFile);
  }
}
