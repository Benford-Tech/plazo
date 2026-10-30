import { randomUUID } from 'crypto';
import httpStatus from 'http-status';
import { Readable } from 'stream';
import { Container, Service } from 'typedi';
import prisma, { OperatorContractTemplate, Prisma, SignatureMethod } from '@/database';
import { bookingFieldFacts, ContractField, fieldsOf, prefilledPdf, SAMPLE_FACTS, validateFields } from '@/domain/contract-fields';
import { DEFAULT_TEMPLATE_TITLE, signedFileNames } from '@/domain/contract-template';
import { checkPdf, cleanFileName, sha256Hex } from '@/domain/partner-contract';
import { plateKey } from '@/domain/reservation';
import { localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { PhotoStorageService, StoredPhoto } from './photo-storage.service';
import { PublicBookingService } from './public-booking.service';
import { STAFF_VISIBLE } from './reservation.service';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Not found', 'not_found');
const unavailable = () => new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The contract file is unavailable', 'file_unavailable');

export interface TemplateView {
  id: string;
  version: number;
  title: string;
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string | null;
  retiredAt: string | null;
  /** Contracts signed on this version. */
  signedCount: number;
  /** Where each piece of information is stamped (30/10/2026, direction A); empty until the manager places them. */
  fields: ContractField[];
  fieldsSetAt: string | null;
}

export type ContractFileKind = 'template' | 'signed' | 'proof';
const FILE_KINDS: ContractFileKind[] = ['template', 'signed', 'proof'];
export interface ContractFile extends StoredPhoto {
  fileName: string;
}

/** A line of the register « Contrats » (26/10/2026, R-A). */
export interface SignedContractRow {
  reservationId: string;
  reference: string;
  customerName: string;
  plate: string;
  arrivalAt: string;
  returnAt: string;
  signedAt: string;
  signerName: string;
  method: SignatureMethod;
  witnessName: string | null;
  version: string;
  templateVersion: number | null;
  proofSha256: string;
  signedSha256: string | null;
  /** Which files Plazo can serve: the signed PDF and the proof once stored, the parking's PDF when one was signed. */
  files: { template: boolean; signed: boolean; proof: boolean };
  /** The traveller made a reserve on the return report. */
  reserved: boolean;
}

export const REGISTER_PAGE = 50;
const EXPORT_MAX = 5000;

export function cleanTemplateTitle(raw: unknown): string {
  const title = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  return title || DEFAULT_TEMPLATE_TITLE;
}

export async function toBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/**
 * The parking's own contract (26/10/2026, « chaque parking peut héberger le contrat de stationnement à ses clients »,
 * choice A « Mon PDF », register R-A): the managers upload the PDF their travellers sign (versions kept, one in force), or
 * go back to Plazo's template; every signed contract is kept with its signed PDF and its proof, listed on « Contrats ».
 */
@Service()
export class ContractTemplateService {
  public storage = Container.get(PhotoStorageService);
  public audit = Container.get(AuditService);
  public bookings = Container.get(PublicBookingService);

  // ---- The parking's contract -------------------------------------------------------------------------------------

  /** The contract in force, or null when the travellers sign Plazo's template. */
  public async current(operatorId: string): Promise<OperatorContractTemplate | null> {
    return prisma.operatorContractTemplate.findFirst({ where: { operatorId, retiredAt: null } });
  }

  private async views(rows: OperatorContractTemplate[]): Promise<TemplateView[]> {
    if (!rows.length) return [];
    const staffIds = [...new Set(rows.map(r => r.uploadedById).filter((id): id is string => !!id))];
    const staff = staffIds.length ? await prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } }) : [];
    const names = new Map(staff.map(s => [s.id, s.name]));
    const counts = await prisma.reservationContract.groupBy({
      by: ['templateId'],
      where: { templateId: { in: rows.map(r => r.id) } },
      _count: { _all: true },
    });
    const signed = new Map(counts.map(c => [c.templateId, c._count._all]));
    return rows.map(r => ({
      id: r.id,
      version: r.version,
      title: r.title,
      fileName: r.fileName,
      sizeBytes: r.sizeBytes,
      pageCount: r.pageCount,
      sha256: r.sha256,
      uploadedAt: r.uploadedAt.toISOString(),
      uploadedBy: r.uploadedById ? (names.get(r.uploadedById) ?? null) : null,
      retiredAt: r.retiredAt?.toISOString() ?? null,
      signedCount: signed.get(r.id) ?? 0,
      fields: fieldsOf(r.fields),
      fieldsSetAt: r.fieldsSetAt?.toISOString() ?? null,
    }));
  }

  /** GET /internal/contract-template: the version in force and the previous ones, the latest first. */
  public async forOperator(operatorId: string): Promise<{ current: TemplateView | null; history: TemplateView[]; plazoSignedCount: number }> {
    const rows = await prisma.operatorContractTemplate.findMany({ where: { operatorId }, orderBy: { version: 'desc' } });
    const views = await this.views(rows);
    const plazoSignedCount = await prisma.reservationContract.count({ where: { templateId: null, reservation: { operatorId } } });
    return { current: views.find(v => !v.retiredAt) ?? null, history: views.filter(v => !!v.retiredAt), plazoSignedCount };
  }

  /** POST /internal/contract-template: the PDF's bytes as the body; it replaces the version in force from now on. */
  public async upload(actor: AuthenticatedStaff, bytes: unknown, meta: { fileName?: unknown; title?: unknown }) {
    const body = Buffer.isBuffer(bytes) ? bytes : Buffer.alloc(0);
    const check = await checkPdf(body);
    if (!check.ok) throw new ValidationException({ file: check.code });
    if (!this.storage.available()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'File storage is not configured', 'photos_unavailable');
    const operatorId = actor.operatorId;
    const fileName = cleanFileName(meta.fileName);
    const title = cleanTemplateTitle(meta.title);
    const sha256 = sha256Hex(body);
    const blobKey = `contract-templates/${operatorId}/${randomUUID()}/${fileName}`;
    await this.storage.put(blobKey, body, 'application/pdf');
    let row: OperatorContractTemplate;
    try {
      row = await prisma.$transaction(async tx => {
        // One upload at a time per operator.
        await tx.$queryRaw`SELECT id FROM operators WHERE id = ${operatorId} FOR UPDATE`;
        const now = new Date();
        const retired = await tx.operatorContractTemplate.updateMany({
          where: { operatorId, retiredAt: null },
          data: { retiredAt: now, retiredById: actor.id },
        });
        const last = await tx.operatorContractTemplate.aggregate({ where: { operatorId }, _max: { version: true } });
        const created = await tx.operatorContractTemplate.create({
          data: {
            operatorId,
            version: (last._max.version ?? 0) + 1,
            title,
            fileName,
            sizeBytes: body.length,
            pageCount: check.pages,
            sha256,
            blobKey,
            uploadedById: actor.id,
          },
        });
        await this.audit.record(
          actor,
          {
            action: 'contract_template.uploaded',
            entityType: 'contract_template',
            entityId: created.id,
            details: { version: created.version, sha256, sizeBytes: body.length, pages: check.pages, replaced: retired.count > 0 },
          },
          tx,
        );
        return created;
      });
    } catch (error) {
      await this.storage.remove([blobKey]);
      throw error;
    }
    logger.info(`[Contracts] parking contract v${row.version} uploaded for operator ${operatorId}`);
    return this.forOperator(operatorId);
  }

  /** POST /internal/contract-template/revert: back to Plazo's template; the versions stay (signed contracts point to them). */
  public async revert(actor: AuthenticatedStaff) {
    const now = new Date();
    const retired = await prisma.operatorContractTemplate.updateMany({
      where: { operatorId: actor.operatorId, retiredAt: null },
      data: { retiredAt: now, retiredById: actor.id },
    });
    if (!retired.count) throw new HttpException(httpStatus.CONFLICT, 'The travellers already sign the Plazo template', 'no_template');
    await this.audit.record(actor, { action: 'contract_template.reverted', entityType: 'contract_template' });
    return this.forOperator(actor.operatorId);
  }

  /**
   * PUT /internal/contract-template/:id/fields (30/10/2026, « le contrat doit être pré-rempli », direction A): where
   * each piece of information goes on the version in force. Every contract read or signed from now on is pre-filled.
   */
  public async setFields(actor: AuthenticatedStaff, templateId: string, raw: unknown) {
    const row = await prisma.operatorContractTemplate.findFirst({ where: { id: templateId, operatorId: actor.operatorId } });
    if (!row) throw notFound();
    if (row.retiredAt) throw new HttpException(httpStatus.CONFLICT, 'This version is no longer in force', 'template_retired');
    const checked = validateFields(raw, row.pageCount);
    if ('error' in checked) throw new ValidationException({ fields: checked.error });
    await prisma.operatorContractTemplate.update({
      where: { id: row.id },
      data: { fields: checked.fields as unknown as Prisma.InputJsonValue, fieldsSetAt: new Date() },
    });
    await this.audit.record(actor, {
      action: 'contract_template.fields',
      entityType: 'contract_template',
      entityId: row.id,
      details: { version: row.version, fields: checked.fields.map(f => f.key) },
    });
    return this.forOperator(actor.operatorId);
  }

  /** POST /internal/contract-template/:id/preview: the PDF stamped with example values, with the fields being placed. */
  public async preview(operatorId: string, templateId: string, raw: unknown): Promise<ContractFile> {
    const row = await prisma.operatorContractTemplate.findFirst({ where: { id: templateId, operatorId } });
    if (!row) throw notFound();
    const checked = validateFields(raw, row.pageCount);
    if ('error' in checked) throw new ValidationException({ fields: checked.error });
    const bytes = await prefilledPdf(await this.bytesOf(row), checked.fields, SAMPLE_FACTS, { strokes: null, label: 'Signature du client' });
    return { stream: Readable.from(bytes), contentType: 'application/pdf', size: bytes.length, fileName: `apercu-${row.fileName}` };
  }

  /** GET /internal/contract-template/:id/file */
  public async templateFile(operatorId: string, templateId: string): Promise<ContractFile> {
    const row = await prisma.operatorContractTemplate.findFirst({ where: { id: templateId, operatorId } });
    if (!row) throw notFound();
    return this.serve(row.blobKey, row.fileName, row.sha256);
  }

  /** The bytes of the contract in force, checked against its fingerprint (what the traveller read is what is signed). */
  public async bytesOf(template: OperatorContractTemplate): Promise<Buffer> {
    const stored = await this.storage.get(template.blobKey);
    if (!stored) throw unavailable();
    const bytes = await toBuffer(stored.stream);
    if (sha256Hex(bytes) !== template.sha256) {
      logger.error(`[Contracts] Fingerprint mismatch for parking contract ${template.id}`);
      throw unavailable();
    }
    return bytes;
  }

  private async serve(key: string, fileName: string, sha256?: string): Promise<ContractFile> {
    const stored = await this.storage.get(key);
    if (!stored) throw unavailable();
    if (sha256) {
      // Served from memory once checked: a PDF is 4 MB at most.
      const bytes = await toBuffer(stored.stream);
      if (sha256Hex(bytes) !== sha256) {
        logger.error(`[Contracts] Fingerprint mismatch for ${key}`);
        throw unavailable();
      }
      return { stream: Readable.from(bytes), contentType: 'application/pdf', size: bytes.length, fileName };
    }
    return { ...stored, contentType: 'application/pdf', fileName };
  }

  // ---- Signed contracts --------------------------------------------------------------------------------------------

  private async fileOf(reservationWhere: Prisma.ReservationWhereInput, kind: unknown): Promise<ContractFile> {
    if (!FILE_KINDS.includes(kind as ContractFileKind)) throw new ValidationException({ kind: 'invalid' });
    const reservation = await prisma.reservation.findFirst({
      where: reservationWhere,
      include: { contract: { include: { template: true } }, parking: { select: { timezone: true } } },
    });
    if (!reservation) throw notFound();
    const contract = reservation.contract;
    if (kind === 'template') {
      // The PDF the traveller reads (29/10/2026, « impossible de visualiser le contrat et de le signer »): the one signed,
      // or the one in force until the signature, as the paperwork view says (no contract row exists before it).
      const template = contract ? contract.template : await this.current(reservation.operatorId);
      if (!template) throw notFound();
      // Pre-filled with the booking (30/10/2026, direction A): the date of signature is the day it was signed, or today.
      const fields = fieldsOf(template.fields);
      if (!fields.length) return this.serve(template.blobKey, template.fileName, template.sha256);
      const tz = reservation.parking.timezone;
      const facts = bookingFieldFacts(reservation, d => localDateTime(d, tz), contract?.signedAt ?? new Date());
      const bytes = await prefilledPdf(await this.bytesOf(template), fields, facts);
      return { stream: Readable.from(bytes), contentType: 'application/pdf', size: bytes.length, fileName: template.fileName };
    }
    if (!contract) throw notFound();
    const names = signedFileNames(reservation.reference);
    const key = kind === 'signed' ? contract.signedBlobKey : contract.proofBlobKey;
    if (!key) throw notFound();
    return this.serve(key, kind === 'signed' ? names.signed : names.proof, kind === 'signed' ? (contract.signedSha256 ?? undefined) : undefined);
  }

  /** GET /internal/reservations/:id/contract/file?kind=template|signed|proof */
  public async staffFile(actor: AuthenticatedStaff, reservationId: string, kind: unknown): Promise<ContractFile> {
    return this.fileOf({ id: reservationId, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] }, kind);
  }

  /** GET /public/bookings/:reference/contract/file?kind= (x-booking-token): the traveller's own copy. */
  public async travellerFile(reference: string, token: string | undefined, kind: unknown): Promise<ContractFile> {
    const booking = await this.bookings.load(reference, token);
    return this.fileOf({ id: booking.id }, kind);
  }

  private registerWhere(
    operatorId: string,
    q: { from?: string; to?: string; search?: string; reserved?: boolean },
  ): Prisma.ReservationContractWhereInput {
    const search = q.search?.trim();
    const signedAt: Prisma.DateTimeFilter = {};
    if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) signedAt.gte = new Date(`${q.from}T00:00:00Z`);
    if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) signedAt.lt = new Date(new Date(`${q.to}T00:00:00Z`).getTime() + 86400000);
    return {
      reservation: {
        operatorId,
        ...(search
          ? {
              OR: [
                { customerName: { contains: search, mode: 'insensitive' } },
                { reference: { equals: search.toUpperCase() } },
                ...(plateKey(search).length >= 2 ? [{ plateKey: { contains: plateKey(search) } }] : []),
              ],
            }
          : {}),
        ...(q.reserved ? { inspections: { some: { decision: 'reserved' } } } : {}),
      },
      ...(Object.keys(signedAt).length ? { signedAt } : {}),
    };
  }

  private async rowsOf(where: Prisma.ReservationContractWhereInput, skip: number, take: number): Promise<SignedContractRow[]> {
    const rows = await prisma.reservationContract.findMany({
      where,
      orderBy: [{ signedAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      include: {
        template: { select: { version: true } },
        reservation: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            plate: true,
            arrivalAt: true,
            returnAt: true,
            parking: { select: { timezone: true } },
            inspections: { where: { decision: 'reserved' }, select: { id: true }, take: 1 },
          },
        },
      },
    });
    const witnessIds = [...new Set(rows.map(r => r.witnessedById).filter((id): id is string => !!id))];
    const staff = witnessIds.length ? await prisma.staff.findMany({ where: { id: { in: witnessIds } }, select: { id: true, firstName: true } }) : [];
    const witnesses = new Map(staff.map(s => [s.id, s.firstName]));
    return rows.map(c => {
      const tz = c.reservation.parking.timezone;
      return {
        reservationId: c.reservation.id,
        reference: c.reservation.reference,
        customerName: c.reservation.customerName,
        plate: c.reservation.plate,
        arrivalAt: localDateTime(c.reservation.arrivalAt, tz),
        returnAt: localDateTime(c.reservation.returnAt, tz),
        signedAt: c.signedAt.toISOString(),
        signerName: c.signerName,
        method: c.method,
        witnessName: c.witnessedById ? (witnesses.get(c.witnessedById) ?? null) : null,
        version: c.version,
        templateVersion: c.template?.version ?? null,
        proofSha256: c.proofSha256,
        signedSha256: c.signedSha256,
        files: { template: !!c.templateId, signed: !!c.signedBlobKey, proof: !!c.proofBlobKey },
        reserved: c.reservation.inspections.length > 0,
      };
    });
  }

  /** GET /internal/contracts?from=&to=&q=&reserved=1&page= : the register, the latest signature first. */
  public async register(operatorId: string, q: { from?: string; to?: string; search?: string; reserved?: boolean; page?: number }) {
    const where = this.registerWhere(operatorId, q);
    const page = Math.max(1, Math.floor(q.page ?? 1));
    const [total, reservedCount, rows] = await Promise.all([
      prisma.reservationContract.count({ where }),
      prisma.reservationContract.count({ where: this.registerWhere(operatorId, { ...q, reserved: true }) }),
      this.rowsOf(where, (page - 1) * REGISTER_PAGE, REGISTER_PAGE),
    ]);
    return { data: rows, total, reservedCount, page, totalPages: Math.max(1, Math.ceil(total / REGISTER_PAGE)) };
  }

  /** GET /internal/contracts/export: CSV (« ; », UTF-8 with BOM), 5 000 lines at most. */
  public async exportCsv(operatorId: string, q: { from?: string; to?: string; search?: string; reserved?: boolean }): Promise<string> {
    const rows = await this.rowsOf(this.registerWhere(operatorId, q), 0, EXPORT_MAX);
    const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = [
      'Signé le',
      'Référence',
      'Client',
      'Plaque',
      'Dépôt',
      'Retour',
      'Moyen',
      'Témoin',
      'Version',
      'Empreinte de la signature',
      'Empreinte du PDF signé',
      'Réserve',
    ];
    const lines = rows.map(r =>
      [
        r.signedAt,
        r.reference,
        r.customerName,
        r.plate,
        r.arrivalAt,
        r.returnAt,
        r.method === 'sms_code' ? 'Code SMS' : 'À la main',
        r.witnessName,
        r.version,
        r.proofSha256,
        r.signedSha256,
        r.reserved ? 'oui' : 'non',
      ]
        .map(cell)
        .join(';'),
    );
    return `﻿${[header.map(cell).join(';'), ...lines].join('\r\n')}\r\n`;
  }

  /** Every file of an operator's contracts (erased with the operator). */
  public async blobKeysOf(operatorId: string): Promise<string[]> {
    const templates = await prisma.operatorContractTemplate.findMany({ where: { operatorId }, select: { blobKey: true } });
    const signed = await prisma.reservationContract.findMany({
      where: { reservation: { operatorId } },
      select: { signedBlobKey: true, proofBlobKey: true },
    });
    return [...templates.map(t => t.blobKey), ...signed.flatMap(s => [s.signedBlobKey, s.proofBlobKey])].filter((k): k is string => !!k);
  }

  /** The signed files of these bookings (erased at anonymisation). */
  public async signedBlobKeysOf(reservationIds: string[]): Promise<string[]> {
    if (!reservationIds.length) return [];
    const rows = await prisma.reservationContract.findMany({
      where: { reservationId: { in: reservationIds } },
      select: { signedBlobKey: true, proofBlobKey: true },
    });
    return rows.flatMap(s => [s.signedBlobKey, s.proofBlobKey]).filter((k): k is string => !!k);
  }
}
