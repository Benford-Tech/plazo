import { randomUUID } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PLATFORM_COMMISSION_BPS, PRODUCT_COMPANY, PRODUCT_NAME, PUBLIC_SITE_URL, SUPPORT_EMAIL } from '@/config';
import prisma, { Prisma } from '@/database';
import {
  AGREEMENT_KINDS,
  AgreementArticle,
  AgreementFacts,
  AgreementKind,
  agreementDocument,
  agreementText,
  buildAgreementPdf,
  checkSignRequest,
  isAgreementKind,
  isProPlan,
  ProPlanId,
  textSha256,
} from '@/domain/plazo-agreements';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';

/** The rate written in the listing contract when neither the operator nor the platform set one: the published one. */
const DEFAULT_COMMISSION_BPS = 1500;

export interface SignedAgreementView {
  id: string;
  version: string;
  signedAt: Date;
  signerName: string;
  textSha256: string;
  pdfSha256: string;
}

export interface AgreementView {
  kind: AgreementKind;
  title: string;
  version: string;
  parties: string[];
  articles: AgreementArticle[];
  textSha256: string;
  /** The signature of this version, if any. */
  signed: SignedAgreementView | null;
  /** The versions signed before. */
  history: SignedAgreementView[];
}

export interface AgreementsView {
  agreements: AgreementView[];
  /** The operator has a listing sent for review or online: the listing contract is expected too. */
  sellsOnPlazo: boolean;
  /** What the banner asks for: the terms of use, and the listing contract once the operator sells on Plazo. */
  toSign: AgreementKind[];
  canSign: boolean;
  plan: { id: ProPlanId; yearly: boolean; agreedMonthlyCents?: number | null } | null;
}

export interface AgreementFile {
  bytes: Buffer;
  fileName: string;
}

const FILE_BASE: Record<AgreementKind, string> = { pro_terms: 'conditions-plazo-pro', listing: 'contrat-diffusion-annonces' };

/**
 * The two contracts Plazo writes for every operator (17/11/2026, « Il faut un contrat pour publier des annonces et un
 * contrat d'utilisation de Plazo Pro », choice C): read on « Mon contrat » in three steps and signed together with one
 * typed name and a box per contract. Nothing is blocked while they wait: a banner only. The text is filled with the
 * operator's figures (company, commission, payout schedule, plan); the one signed is kept word for word with both PDF.
 */
@Service()
export class PlazoAgreementService {
  public audit = Container.get(AuditService);

  private async facts(operatorId: string): Promise<{ facts: AgreementFacts; sellsOnPlazo: boolean; plan: AgreementsView['plan'] }> {
    const o = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        name: true,
        billingLegalName: true,
        billingAddress: true,
        billingSiret: true,
        billingVatNumber: true,
        commissionBps: true,
        payoutSchedule: true,
        proPlan: true,
        proPlanYearly: true,
        proAgreedPlan: true,
        proAgreedMonthlyCents: true,
        parkings: { select: { address: true, listing: { select: { status: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!o) throw new HttpException(httpStatus.NOT_FOUND, 'Operator not found', 'not_found');
    const plan = isProPlan(o.proPlan)
      ? {
          id: o.proPlan,
          yearly: o.proPlanYearly,
          agreedMonthlyCents: o.proAgreedPlan === o.proPlan ? o.proAgreedMonthlyCents : null,
        }
      : null;
    return {
      plan,
      sellsOnPlazo: o.parkings.some(p => p.listing && p.listing.status !== 'draft'),
      facts: {
        productName: PRODUCT_NAME,
        supportEmail: SUPPORT_EMAIL,
        siteUrl: PUBLIC_SITE_URL || 'https://www.plazo.fr',
        company: { ...PRODUCT_COMPANY },
        operator: {
          name: o.name,
          legalName: o.billingLegalName,
          address: o.billingAddress || o.parkings[0]?.address || null,
          siret: o.billingSiret,
          vatNumber: o.billingVatNumber,
        },
        commissionBps: o.commissionBps ?? PLATFORM_COMMISSION_BPS ?? DEFAULT_COMMISSION_BPS,
        payoutSchedule: o.payoutSchedule,
        plan,
      },
    };
  }

  /** « Mon contrat » (managers) and the platform's tab: both contracts, as they would be signed now. */
  public async view(operatorId: string, staff?: AuthenticatedStaff): Promise<AgreementsView> {
    const [{ facts, sellsOnPlazo, plan }, rows] = await Promise.all([
      this.facts(operatorId),
      prisma.plazoAgreement.findMany({
        where: { operatorId },
        orderBy: { signedAt: 'desc' },
        select: { id: true, kind: true, version: true, signedAt: true, signerName: true, textSha256: true, pdfSha256: true },
      }),
    ]);
    const agreements = AGREEMENT_KINDS.map(kind => {
      const doc = agreementDocument(kind, facts);
      const mine = rows
        .filter(r => r.kind === kind)
        .map(r => ({
          id: r.id,
          version: r.version,
          signedAt: r.signedAt,
          signerName: r.signerName,
          textSha256: r.textSha256,
          pdfSha256: r.pdfSha256,
        }));
      return {
        kind,
        title: doc.title,
        version: doc.version,
        parties: doc.parties,
        articles: doc.articles,
        textSha256: textSha256(doc),
        signed: mine.find(r => r.version === doc.version) ?? null,
        history: mine.filter(r => r.version !== doc.version),
      };
    });
    const toSign = agreements.filter(a => !a.signed && (a.kind === 'pro_terms' || sellsOnPlazo)).map(a => a.kind);
    return { agreements, sellsOnPlazo, toSign, canSign: !!staff && !staff.actingAs && !staff.demo, plan };
  }

  /** One typed name, one box per contract read: each one ticked is signed, with its own PDF and proof. */
  public async sign(
    staff: AuthenticatedStaff,
    body: { signerName?: unknown; kinds?: unknown; read?: unknown },
    client: { ip: string | null; userAgent: string | null },
  ): Promise<AgreementsView> {
    if (staff.actingAs) throw new HttpException(httpStatus.FORBIDDEN, 'Only a manager of the operator signs its contracts', 'view_as_cannot_sign');
    const check = checkSignRequest(body);
    if (!check.ok) throw new ValidationException(check.fields);
    const { name, kinds, read } = check.value;
    const { facts } = await this.facts(staff.operatorId);
    const signedAt = new Date();
    const ip = client.ip?.slice(0, 64) ?? null;
    const userAgent = client.userAgent?.slice(0, 300) ?? null;

    const rows: Prisma.PlazoAgreementUncheckedCreateInput[] = [];
    for (const kind of kinds) {
      const doc = agreementDocument(kind, facts);
      const sha = textSha256(doc);
      // The text read is the one signed: a figure changed meanwhile (commission, plan) asks for a new reading.
      if (read[kind] !== sha) throw new HttpException(httpStatus.CONFLICT, 'The contract changed since it was read', 'text_changed');
      const id = randomUUID();
      const { pdf, pdfSha256, proof } = await buildAgreementPdf(doc, PRODUCT_NAME, {
        id,
        operatorName: facts.operator.legalName || facts.operator.name,
        signerName: name,
        signerEmail: staff.email,
        signedAt,
        ip,
        userAgent,
        textSha256: sha,
      });
      rows.push({
        id,
        operatorId: staff.operatorId,
        kind,
        version: doc.version,
        title: doc.title,
        text: agreementText(doc),
        textSha256: sha,
        signedAt,
        signedById: staff.id,
        signerName: name,
        signerEmail: staff.email,
        signerIp: ip,
        signerUserAgent: userAgent,
        pdf: new Uint8Array(pdf),
        pdfSha256,
        proof: new Uint8Array(proof as Buffer),
      });
    }

    await prisma.$transaction(async tx => {
      const already = await tx.plazoAgreement.findMany({
        where: { operatorId: staff.operatorId, OR: rows.map(r => ({ kind: r.kind, version: r.version })) },
        select: { kind: true },
      });
      if (already.length) throw new HttpException(httpStatus.CONFLICT, 'Already signed', 'already_signed');
      for (const row of rows) {
        await tx.plazoAgreement.create({ data: row });
        await this.audit.record(
          staff,
          {
            action: 'plazo_agreement.signed',
            entityType: 'plazo_agreement',
            entityId: row.id,
            details: { kind: row.kind, version: row.version, textSha256: row.textSha256, pdfSha256: row.pdfSha256 },
          },
          tx,
        );
      }
    });
    logger.info(`[Agreements] ${kinds.join(', ')} signed for operator ${staff.operatorId}`);
    return this.view(staff.operatorId, staff);
  }

  /** The contract as it would be signed now, as a PDF (« Télécharger le PDF »). */
  public async preview(operatorId: string, kind: unknown): Promise<AgreementFile> {
    if (!isAgreementKind(kind)) throw new ValidationException({ kind: 'invalid' });
    const { facts } = await this.facts(operatorId);
    const doc = agreementDocument(kind, facts);
    const { pdf } = await buildAgreementPdf(doc, PRODUCT_NAME);
    return { bytes: pdf, fileName: `${FILE_BASE[kind]}-${doc.version}.pdf` };
  }

  /** A signed contract's PDF (`signed`) or its proof (`proof`). */
  public async file(operatorId: string, id: string, kind: unknown): Promise<AgreementFile> {
    if (kind !== 'signed' && kind !== 'proof') throw new ValidationException({ kind: 'invalid' });
    const row = await prisma.plazoAgreement.findFirst({
      where: { id, operatorId },
      select: { kind: true, version: true, pdf: true, proof: true },
    });
    if (!row || !isAgreementKind(row.kind)) throw new HttpException(httpStatus.NOT_FOUND, 'Contract not found', 'not_found');
    const base = `${FILE_BASE[row.kind]}-${row.version}`;
    return kind === 'signed'
      ? { bytes: Buffer.from(row.pdf), fileName: `${base}-signe.pdf` }
      : { bytes: Buffer.from(row.proof), fileName: `preuve-signature-${base}.pdf` };
  }

  /** The platform sets the operator's Plazo Pro plan, read by the terms of use ({ plan: id | null, yearly }). */
  public async setPlan(actor: AuthenticatedStaff, operatorId: string, body: { plan?: unknown; yearly?: unknown }): Promise<AgreementsView> {
    const plan = body.plan === null || body.plan === '' ? null : body.plan;
    if (plan !== null && !isProPlan(plan)) throw new ValidationException({ plan: 'invalid' });
    if (body.yearly !== undefined && typeof body.yearly !== 'boolean') throw new ValidationException({ yearly: 'invalid' });
    const exists = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true } });
    if (!exists) throw new HttpException(httpStatus.NOT_FOUND, 'Operator not found', 'not_found');
    const yearly = plan === null ? false : body.yearly === true;
    await prisma.operator.update({ where: { id: operatorId }, data: { proPlan: plan, proPlanYearly: yearly } });
    await this.audit.record(
      { id: actor.id, operatorId: actor.actingAs?.realOperatorId ?? actor.operatorId },
      { action: 'operator.pro_plan_set', entityType: 'operator', entityId: operatorId, details: { plan, yearly } },
    );
    return this.view(operatorId);
  }
}
