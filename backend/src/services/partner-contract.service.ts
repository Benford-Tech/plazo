import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { platformAdminEmails, PRODUCT_NAME } from '@/config';
import prisma, { PartnerContract } from '@/database';
import { contractSignedEmail, contractToSignEmail } from '@/domain/account-messages';
import { buildSignedPdf, checkPdf, checkSignature, cleanFileName, cleanTitle, parisTime, sha256Hex } from '@/domain/partner-contract';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { PhotoStorageService, StoredPhoto } from './photo-storage.service';

export type ContractFileKind = 'original' | 'signed' | 'proof';
const FILE_KINDS: ContractFileKind[] = ['original', 'signed', 'proof'];

export interface ContractView {
  id: string;
  version: number;
  title: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  status: 'pending' | 'signed' | 'superseded';
  uploadedAt: Date;
  uploadedBy: string | null;
  notifiedAt: Date | null;
  signedAt: Date | null;
  signer: { name: string; email: string | null } | null;
  signerIp: string | null;
  signedSha256: string | null;
}

export interface ContractFile extends StoredPhoto {
  fileName: string;
}

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Contract not found', 'not_found');

async function toBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/**
 * The Plazo ↔ operator contract (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a « bandeau puis
 * page Mon contrat »). The platform uploads a PDF per operator (a new one replaces the one still waiting); the managers
 * are emailed and see a banner until one of them signs it on « Mon contrat » (typed full name + « Lu et approuvé »).
 * Plazo then keeps, in the private Blob store, the PDF signed (the original with a « Signature » page) and the proof page,
 * with the signer's name, email, IP, browser and both SHA-256. Nothing personal goes to the logs.
 */
@Service()
export class PartnerContractService {
  public storage = Container.get(PhotoStorageService);
  public audit = Container.get(AuditService);
  public notifications = Container.get(NotificationService);

  // ---- Views ----------------------------------------------------------------------------------------

  private async views(rows: PartnerContract[]): Promise<ContractView[]> {
    const staffIds = [...new Set(rows.map(r => r.uploadedById).filter((id): id is string => !!id))];
    const staff = staffIds.length ? await prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } }) : [];
    const names = new Map(staff.map(s => [s.id, s.name]));
    return rows.map(r => ({
      id: r.id,
      version: r.version,
      title: r.title,
      fileName: r.fileName,
      sizeBytes: r.sizeBytes,
      sha256: r.sha256,
      status: r.status,
      uploadedAt: r.uploadedAt,
      // The platform's own members only: « Plazo » for the operator's eyes.
      uploadedBy: r.uploadedById ? (names.get(r.uploadedById) ?? null) : null,
      notifiedAt: r.notifiedAt,
      signedAt: r.signedAt,
      signer: r.signerName ? { name: r.signerName, email: r.signerEmail } : null,
      signerIp: r.signerIp,
      signedSha256: r.signedSha256,
    }));
  }

  /** Every contract of an operator, the latest version first. */
  private async rowsOf(operatorId: string) {
    return prisma.partnerContract.findMany({ where: { operatorId }, orderBy: { version: 'desc' } });
  }

  /** The platform's card: every version. */
  public async listForPlatform(operatorId: string): Promise<{ contracts: ContractView[] }> {
    await this.operatorOrThrow(operatorId);
    return { contracts: await this.views(await this.rowsOf(operatorId)) };
  }

  /** « Mon contrat »: the one to sign (else the latest signed), and the versions signed before it. */
  public async forOperator(staff: AuthenticatedStaff): Promise<{ current: ContractView | null; history: ContractView[]; canSign: boolean }> {
    const rows = (await this.rowsOf(staff.operatorId)).filter(r => r.status !== 'superseded');
    const views = await this.views(rows);
    const current = views.find(v => v.status === 'pending') ?? views[0] ?? null;
    return {
      current,
      history: views.filter(v => v !== current),
      canSign: current?.status === 'pending' && !staff.actingAs,
    };
  }

  // ---- Platform -------------------------------------------------------------------------------------

  private async operatorOrThrow(operatorId: string) {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true, name: true } });
    if (!operator) throw new HttpException(httpStatus.NOT_FOUND, 'Operator not found', 'not_found');
    return operator;
  }

  /** Uploads a contract (the PDF's bytes as the body); it replaces the one still waiting for a signature. */
  public async upload(
    actor: AuthenticatedStaff,
    operatorId: string,
    bytes: unknown,
    meta: { fileName?: unknown; title?: unknown },
  ): Promise<ContractView> {
    const operator = await this.operatorOrThrow(operatorId);
    const body = Buffer.isBuffer(bytes) ? bytes : Buffer.alloc(0);
    const check = await checkPdf(body);
    if (!check.ok) throw new ValidationException({ file: check.code });

    const fileName = cleanFileName(meta.fileName);
    const title = cleanTitle(meta.title);
    const sha256 = sha256Hex(body);
    const blobKey = `partner-contracts/${operatorId}/${randomUUID()}/${fileName}`;
    await this.storage.put(blobKey, body, 'application/pdf');

    let row: PartnerContract;
    let replaced: string[] = [];
    try {
      ({ row, replaced } = await prisma.$transaction(async tx => {
        // One upload at a time per operator.
        await tx.$queryRaw`SELECT id FROM operators WHERE id = ${operatorId} FOR UPDATE`;
        const waiting = await tx.partnerContract.findMany({ where: { operatorId, status: 'pending' }, select: { id: true, version: true } });
        if (waiting.length) await tx.partnerContract.updateMany({ where: { id: { in: waiting.map(w => w.id) } }, data: { status: 'superseded' } });
        const last = await tx.partnerContract.aggregate({ where: { operatorId }, _max: { version: true } });
        const created = await tx.partnerContract.create({
          data: {
            operatorId,
            version: (last._max.version ?? 0) + 1,
            title,
            fileName,
            sizeBytes: body.length,
            sha256,
            blobKey,
            uploadedById: actor.id,
          },
        });
        await this.audit.record(
          { id: actor.id, operatorId },
          {
            action: 'partner_contract.uploaded',
            entityType: 'partner_contract',
            entityId: created.id,
            details: { version: created.version, sha256, sizeBytes: body.length, pages: check.pages, replaced: waiting.map(w => w.version) },
          },
          tx,
        );
        return { row: created, replaced: waiting.map(w => w.id) };
      }));
    } catch (error) {
      await this.storage.remove([blobKey]);
      throw error;
    }
    logger.info(`[Contracts] v${row.version} uploaded for operator ${operatorId}${replaced.length ? ` (replaces ${replaced.length})` : ''}`);
    await this.notifyManagers(row, operator.name, false);
    return (await this.views([await prisma.partnerContract.findUniqueOrThrow({ where: { id: row.id } })]))[0];
  }

  /** « Renvoyer l'e-mail » to the managers of a contract still waiting. */
  public async remind(actor: AuthenticatedStaff, operatorId: string, contractId: string): Promise<ContractView> {
    const operator = await this.operatorOrThrow(operatorId);
    const row = await prisma.partnerContract.findFirst({ where: { id: contractId, operatorId } });
    if (!row) throw notFound();
    if (row.status !== 'pending') throw new HttpException(httpStatus.CONFLICT, 'The contract is not waiting for a signature', 'not_pending');
    const sent = await this.notifyManagers(row, operator.name, true);
    if (!sent) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'No email could be sent', 'email_unavailable');
    await this.audit.record({ id: actor.id, operatorId }, { action: 'partner_contract.reminded', entityType: 'partner_contract', entityId: row.id });
    return (await this.views([await prisma.partnerContract.findUniqueOrThrow({ where: { id: row.id } })]))[0];
  }

  /** Takes out a contract uploaded by mistake, as long as nobody signed it. */
  public async remove(actor: AuthenticatedStaff, operatorId: string, contractId: string): Promise<void> {
    const row = await prisma.partnerContract.findFirst({ where: { id: contractId, operatorId } });
    if (!row) throw notFound();
    if (row.status === 'signed') throw new HttpException(httpStatus.CONFLICT, 'A signed contract is kept', 'already_signed');
    const removed = await prisma.$transaction(async tx => {
      const deleted = await tx.partnerContract.deleteMany({ where: { id: row.id, status: { not: 'signed' } } });
      if (deleted.count) {
        await this.audit.record(
          { id: actor.id, operatorId },
          {
            action: 'partner_contract.removed',
            entityType: 'partner_contract',
            entityId: row.id,
            details: { version: row.version, sha256: row.sha256 },
          },
          tx,
        );
      }
      return deleted.count;
    });
    if (!removed) throw new HttpException(httpStatus.CONFLICT, 'A signed contract is kept', 'already_signed');
    await this.storage.remove([row.blobKey]);
  }

  /** Emails the operator's active managers; true when at least one email left. */
  private async notifyManagers(row: PartnerContract, operatorName: string, reminder: boolean): Promise<boolean> {
    if (!this.notifications.emailConfigured()) {
      logger.info(`[Notifications] Email not configured: partner_contract not sent for contract ${row.id}`);
      return false;
    }
    const managers = await prisma.staff.findMany({
      where: { operatorId: row.operatorId, role: 'manager', isActive: true, leftAt: null, deletedAt: null },
      select: { email: true, name: true },
    });
    const email = contractToSignEmail(PRODUCT_NAME, {
      operatorName,
      title: row.title,
      version: row.version,
      url: this.notifications.proUrl('/mon-contrat'),
      reminder,
    });
    const sent = await Promise.all(managers.map(m => this.notifications.emailStaff(m, 'partner_contract', `contract ${row.id}`, email)));
    if (!sent.some(Boolean)) return false;
    await prisma.partnerContract.update({ where: { id: row.id }, data: { notifiedAt: new Date() } });
    return true;
  }

  // ---- Signature ------------------------------------------------------------------------------------

  /** A manager signs the contract waiting (typed full name, « Lu et approuvé » ticked). */
  public async sign(
    staff: AuthenticatedStaff,
    contractId: string,
    body: { signerName?: unknown; accepted?: unknown },
    client: { ip: string | null; userAgent: string | null },
  ): Promise<{ current: ContractView | null; history: ContractView[]; canSign: boolean }> {
    if (staff.actingAs) throw new HttpException(httpStatus.FORBIDDEN, 'Only a manager of the operator signs its contract', 'view_as_cannot_sign');
    const row = await prisma.partnerContract.findFirst({ where: { id: contractId, operatorId: staff.operatorId } });
    if (!row || row.status === 'superseded') throw notFound();
    if (row.status === 'signed') throw new HttpException(httpStatus.CONFLICT, 'The contract is already signed', 'already_signed');
    const check = checkSignature(body);
    if (!check.ok) throw new ValidationException(check.fields);

    const stored = await this.storage.get(row.blobKey);
    if (!stored) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The contract file is unavailable', 'file_unavailable');
    const original = await toBuffer(stored.stream);
    // The PDF the manager read is the one uploaded, bit for bit.
    if (sha256Hex(original) !== row.sha256) {
      logger.error(`[Contracts] Fingerprint mismatch for contract ${row.id}`);
      throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The contract file is unavailable', 'file_unavailable');
    }

    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: staff.operatorId }, select: { name: true } });
    const signedAt = new Date();
    const pages = await checkPdf(original);
    const facts = {
      productName: PRODUCT_NAME,
      contractId: row.id,
      title: row.title,
      version: row.version,
      operatorName: operator.name,
      signerName: check.name,
      signerEmail: staff.email,
      signedAt,
      ip: client.ip?.slice(0, 64) ?? null,
      userAgent: client.userAgent?.slice(0, 300) ?? null,
      uploadedAt: row.uploadedAt,
      originalSha256: row.sha256,
      pageCount: pages.ok ? pages.pages : 0,
    };
    const { signed, signedSha256, proof } = await buildSignedPdf(original, facts);
    const base = row.fileName.replace(/\.pdf$/i, '');
    const folder = row.blobKey.split('/').slice(0, -1).join('/');
    const signedBlobKey = `${folder}/${base}-signe.pdf`;
    const proofBlobKey = `${folder}/preuve-signature-${base}.pdf`;
    await this.storage.put(signedBlobKey, signed, 'application/pdf');
    await this.storage.put(proofBlobKey, proof, 'application/pdf');

    const won = await prisma.$transaction(async tx => {
      const updated = await tx.partnerContract.updateMany({
        where: { id: row.id, status: 'pending' },
        data: {
          status: 'signed',
          signedAt,
          signedById: staff.id,
          signerName: check.name,
          signerEmail: staff.email,
          signerIp: facts.ip,
          signerUserAgent: facts.userAgent,
          signedBlobKey,
          signedSha256,
          proofBlobKey,
        },
      });
      if (updated.count) {
        await this.audit.record(
          staff,
          {
            action: 'partner_contract.signed',
            entityType: 'partner_contract',
            entityId: row.id,
            details: { version: row.version, sha256: row.sha256, signedSha256 },
          },
          tx,
        );
      }
      return updated.count > 0;
    });
    if (!won) {
      await this.storage.remove([signedBlobKey, proofBlobKey]);
      throw new HttpException(httpStatus.CONFLICT, 'The contract is no longer waiting for a signature', 'already_signed');
    }
    logger.info(`[Contracts] v${row.version} signed for operator ${staff.operatorId}`);
    await this.notifySigned(row, { operatorName: operator.name, signerName: check.name, signedAt, signedSha256, signer: staff });
    return this.forOperator(staff);
  }

  private async notifySigned(
    row: PartnerContract,
    data: { operatorName: string; signerName: string; signedAt: Date; signedSha256: string; signer: { email: string; name: string } },
  ) {
    if (!this.notifications.emailConfigured()) return;
    const common = {
      operatorName: data.operatorName,
      title: row.title,
      version: row.version,
      signerName: data.signerName,
      signedAt: parisTime(data.signedAt),
      signedSha256: data.signedSha256,
    };
    const about = `contract ${row.id}`;
    await this.notifications.emailStaff(
      data.signer,
      'partner_contract_signed',
      about,
      contractSignedEmail(PRODUCT_NAME, { ...common, url: this.notifications.proUrl('/mon-contrat') }),
    );
    const platform = contractSignedEmail(PRODUCT_NAME, {
      ...common,
      url: this.notifications.proUrl(`/plateforme/loueurs?contrat=${row.operatorId}`),
    });
    await Promise.all(
      platformAdminEmails().map(email => this.notifications.emailStaff({ email, name: email }, 'partner_contract_signed', about, platform)),
    );
  }

  // ---- Files ----------------------------------------------------------------------------------------

  /** A contract's PDF: `original`, `signed` or `proof`; `operatorId` limits it to one operator. */
  public async file(operatorId: string, contractId: string, kind: unknown): Promise<ContractFile> {
    if (!FILE_KINDS.includes(kind as ContractFileKind)) throw new ValidationException({ kind: 'invalid' });
    const row = await prisma.partnerContract.findFirst({ where: { id: contractId, operatorId } });
    if (!row) throw notFound();
    const key = kind === 'original' ? row.blobKey : kind === 'signed' ? row.signedBlobKey : row.proofBlobKey;
    if (!key) throw notFound();
    const stored = await this.storage.get(key);
    if (!stored) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The contract file is unavailable', 'file_unavailable');
    return { ...stored, fileName: key.split('/').pop() ?? row.fileName };
  }

  /** Every file of an operator's contracts (erased with the operator). */
  public async blobKeysOf(operatorId: string): Promise<string[]> {
    const rows = await prisma.partnerContract.findMany({ where: { operatorId }, select: { blobKey: true, signedBlobKey: true, proofBlobKey: true } });
    return rows.flatMap(r => [r.blobKey, r.signedBlobKey, r.proofBlobKey]).filter((k): k is string => !!k);
  }
}
