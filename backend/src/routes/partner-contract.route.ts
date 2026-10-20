import { Router } from 'express';
import { PartnerContractController } from '@/controllers/partner-contract.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: PartnerContract
 *   description: >
 *     The Plazo ↔ operator contract (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a). The platform
 *     uploads a PDF per operator (4 MB at most, not encrypted); a new upload replaces the one still waiting (superseded).
 *     The managers are emailed and see a banner until one of them signs it on « Mon contrat » with { signerName,
 *     accepted: true }. Plazo keeps the PDF signed (the original plus a « Signature » page) and the proof page, with the
 *     signer's name, email, IP, browser, time and both SHA-256. Files are kept in the private Blob store and only streamed
 *     by these routes. Errors: 400 fields.file empty | too_large | not_a_pdf | pdf_encrypted | pdf_unreadable,
 *     fields.signerName required | too_long | full_name, fields.accepted required, fields.kind invalid; 403
 *     view_as_cannot_sign; 404 not_found; 409 already_signed, not_pending; 503 photos_unavailable (no store),
 *     file_unavailable, email_unavailable.
 * /internal/platform/operators/{id}/contracts:
 *   get:
 *     summary: Every version of the operator's contract, the latest first
 *     tags: [PartnerContract]
 *   post:
 *     summary: Uploads a contract (the PDF's bytes as the body, Content-Type application/pdf)
 *     tags: [PartnerContract]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: fileName, required: false, schema: { type: string } }
 *       - { in: query, name: title, required: false, schema: { type: string } }
 * /internal/platform/operators/{id}/contracts/{contractId}:
 *   delete:
 *     summary: Takes out a contract nobody signed (uploaded by mistake)
 *     tags: [PartnerContract]
 * /internal/platform/operators/{id}/contracts/{contractId}/remind:
 *   post:
 *     summary: Emails the managers again about a contract waiting
 *     tags: [PartnerContract]
 * /internal/platform/operators/{id}/contracts/{contractId}/file:
 *   get:
 *     summary: The PDF (kind original | signed | proof)
 *     tags: [PartnerContract]
 * /internal/contract:
 *   get:
 *     summary: « Mon contrat » (managers) — { current, history, canSign }
 *     tags: [PartnerContract]
 * /internal/contract/{contractId}/sign:
 *   post:
 *     summary: Signs the contract waiting, { signerName, accepted true } (never in view-as)
 *     tags: [PartnerContract]
 * /internal/contract/{contractId}/file:
 *   get:
 *     summary: The PDF (kind original | signed | proof)
 *     tags: [PartnerContract]
 */
export class PartnerContractRoute implements Routes {
  public router = Router();
  public contracts = new PartnerContractController();

  constructor() {
    const platform = '/internal/platform/operators/:id/contracts';
    this.router.get(platform, PlatformAdminMiddleware(), this.contracts.list);
    this.router.post(platform, PlatformAdminMiddleware(), this.contracts.upload);
    this.router.delete(`${platform}/:contractId`, PlatformAdminMiddleware(), this.contracts.remove);
    this.router.post(`${platform}/:contractId/remind`, PlatformAdminMiddleware(), this.contracts.remind);
    this.router.get(`${platform}/:contractId/file`, PlatformAdminMiddleware(), this.contracts.platformFile);

    this.router.get('/internal/contract', StaffAuthMiddleware('parking:manage'), this.contracts.mine);
    this.router.post(
      '/internal/contract/:contractId/sign',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs('view_as_cannot_sign', 'Only a manager of the operator signs its contract'),
      this.contracts.sign,
    );
    this.router.get('/internal/contract/:contractId/file', StaffAuthMiddleware('parking:manage'), this.contracts.file);
  }
}
