import { Router } from 'express';
import { PlazoAgreementController } from '@/controllers/plazo-agreement.controller';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: PlazoAgreement
 *   description: >
 *     The two contracts Plazo writes for every operator (17/11/2026, choice C « Un parcours, deux signatures »): the terms
 *     of use of Plazo Pro (`pro_terms`) and the listing contract (`listing`), filled with the operator's company, commission,
 *     payout schedule and plan. Read and signed together on « Mon contrat » with { signerName, kinds, read: { kind:
 *     textSha256 } }; nothing is blocked while they wait. Errors: 400 fields.signerName required | too_long | full_name,
 *     fields.kinds required | invalid, fields.read required, fields.kind invalid, fields.plan invalid; 403 view_as_cannot_sign,
 *     demo_read_only; 404 not_found; 409 text_changed, already_signed.
 * /internal/agreements:
 *   get:
 *     summary: Both contracts as they would be signed now, their signatures, toSign and canSign (managers)
 *     tags: [PlazoAgreement]
 * /internal/agreements/sign:
 *   post:
 *     summary: Signs the contracts ticked with one typed name (never in view-as nor in the demo)
 *     tags: [PlazoAgreement]
 * /internal/agreements/preview/{kind}:
 *   get:
 *     summary: The contract as it would be signed now, as a PDF
 *     tags: [PlazoAgreement]
 * /internal/agreements/{id}/file:
 *   get:
 *     summary: A signed contract's PDF (kind signed) or its proof (kind proof)
 *     tags: [PlazoAgreement]
 * /internal/platform/operators/{id}/agreements:
 *   get:
 *     summary: The operator's two contracts (platform)
 *     tags: [PlazoAgreement]
 * /internal/platform/operators/{id}/pro-plan:
 *   put:
 *     summary: Sets the operator's Plazo Pro plan ({ plan essentiel | operations | complet | null, yearly })
 *     tags: [PlazoAgreement]
 */
export class PlazoAgreementRoute implements Routes {
  public router = Router();
  public agreements = new PlazoAgreementController();

  constructor() {
    this.router.get('/internal/agreements', StaffAuthMiddleware('parking:manage'), this.agreements.mine);
    this.router.post(
      '/internal/agreements/sign',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs('view_as_cannot_sign', 'Only a manager of the operator signs its contracts'),
      this.agreements.sign,
    );
    this.router.get('/internal/agreements/preview/:kind', StaffAuthMiddleware('parking:manage'), this.agreements.preview);
    this.router.get('/internal/agreements/:id/file', StaffAuthMiddleware('parking:manage'), this.agreements.file);

    const platform = '/internal/platform/operators/:id';
    this.router.get(`${platform}/agreements`, PlatformAdminMiddleware(), this.agreements.platformView);
    this.router.put(`${platform}/pro-plan`, PlatformAdminMiddleware(), this.agreements.setPlan);
    this.router.get(`${platform}/agreements/preview/:kind`, PlatformAdminMiddleware(), this.agreements.platformPreview);
    this.router.get(`${platform}/agreements/:agreementId/file`, PlatformAdminMiddleware(), this.agreements.platformFile);
  }
}
