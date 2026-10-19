import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PRODUCT_NAME, signatureCodeSecret } from '@/config';
import prisma, { Prisma, Reservation } from '@/database';
import { EmailMessage } from '@/domain/booking-messages';
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_AFTER_MS,
  CODE_TTL_MS,
  CODES_PER_HOUR,
  cleanStrokes,
  codeMatches,
  codeSms,
  CONTRACT_VERSION,
  ContractDocument,
  contractDocument,
  contractText,
  hashCode,
  maskPhone,
  newCode,
  proofOf,
  sha256,
} from '@/domain/contract';
import {
  canAnswer,
  cleanDamages,
  compareReports,
  Damage,
  DAMAGE_SLOT,
  dropoffAnswersItself,
  isSlot,
  MAX_DAMAGE_PHOTOS,
  MAX_NOTES_LENGTH,
  MAX_PHOTO_BYTES,
  MAX_RESERVE_LENGTH,
  missingForCompletion,
  photosCutoff,
  REQUIRED_SLOTS,
  sniffImage,
} from '@/domain/inspection';
import { smsRecipient } from '@/domain/phone';
import { can } from '@/domain/roles';
import { localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { PhotoStorageService, StoredPhoto } from './photo-storage.service';
import { PublicBookingService } from './public-booking.service';
import { STAFF_VISIBLE } from './reservation.service';
import { SmsService } from './sms.service';

export type InspectionKindName = 'dropoff' | 'return';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const conflict = (code: string, message: string) => new HttpException(httpStatus.CONFLICT, message, code);

/** The contract can be signed from the booking until the car is dropped (and at the counter, the day of the drop-off). */
const CONTRACT_SIGNABLE = ['upcoming', 'arrived'];
/** A drop-off report is taken when the car arrives; a return report once the car is on the parking and before it leaves. */
const DROPOFF_STATUSES = ['upcoming', 'arrived'];
const RETURN_STATUSES = ['arrived', 'shuttled_out', 'return_requested', 'back_at_parking', 'returned'];
/** Bookings per nightly pass whose photos are erased. */
const PURGE_BATCH = 200;

const WITH_PAPERWORK = {
  parking: { include: { listing: { select: { title: true, services: true } } } },
  operator: { select: { name: true } },
  contract: true,
  inspections: { include: { photos: { orderBy: { takenAt: 'asc' as const } } } },
} satisfies Prisma.ReservationInclude;

type PaperworkRecord = Prisma.ReservationGetPayload<{ include: typeof WITH_PAPERWORK }>;
type InspectionRecord = PaperworkRecord['inspections'][number];
type Viewer = 'staff' | 'traveller';

const isKind = (value: string): value is InspectionKindName => value === 'dropoff' || value === 'return';

function damagesOf(value: Prisma.JsonValue): Damage[] {
  return Array.isArray(value) ? (value as unknown as Damage[]) : [];
}

/** The signed text back into its parts (title, summary lines, clauses). */
function documentFromText(text: string): ContractDocument {
  const [title = '', ...rest] = text.split('\n');
  const blank = rest.indexOf('', 1);
  const body = rest.slice(1);
  const split = blank > 0 ? blank - 1 : body.length;
  return {
    title,
    summary: body.slice(0, split),
    clauses: body
      .slice(split + 1)
      .filter(Boolean)
      .map(line => line.replace(/^\d+\.\s*/, '')),
  };
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * « Contrat signé et état des lieux » (19/10/2026, choice A « tout dans les applis »): the parking contract signed with a
 * code sent by SMS (in the traveller app, or typed on the staff's phone at the counter) or by hand on the staff's phone,
 * and the condition reports at the drop-off and at the return (six guided photos, damages on the outline, mileage, fuel),
 * answered by the traveller. Everything is scoped to the staff's operator, or to the booking's token for the traveller.
 */
@Service()
export class PaperworkService {
  public storage = Container.get(PhotoStorageService);
  public sms = Container.get(SmsService);
  public notifications = Container.get(NotificationService);
  public audit = Container.get(AuditService);
  public bookings = Container.get(PublicBookingService);

  // ---- Loading ----------------------------------------------------------------------------------------------------

  private async loadForStaff(actor: AuthenticatedStaff, id: string): Promise<PaperworkRecord> {
    const reservation = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      include: WITH_PAPERWORK,
    });
    if (!reservation) throw notFound();
    return this.settle(reservation);
  }

  private async loadForTraveller(reference: string, token: string | undefined): Promise<PaperworkRecord> {
    const booking = await this.bookings.load(reference, token);
    const reservation = await prisma.reservation.findUnique({ where: { id: booking.id }, include: WITH_PAPERWORK });
    if (!reservation) throw notFound();
    return this.settle(reservation);
  }

  /** Lazy rule: a drop-off report left unanswered once the traveller has left in the shuttle stands as made. */
  private async settle(reservation: PaperworkRecord): Promise<PaperworkRecord> {
    const dropoff = reservation.inspections.find(i => i.kind === 'dropoff');
    if (dropoff?.completedAt && dropoff.decision === 'pending' && dropoffAnswersItself(reservation.status)) {
      const decidedAt = new Date();
      const { count } = await prisma.vehicleInspection.updateMany({
        where: { id: dropoff.id, decision: 'pending' },
        data: {
          decision: 'accepted_by_default',
          decidedAt,
          proofSha256: this.inspectionProof(dropoff, 'accepted_by_default', decidedAt, null, null),
        },
      });
      if (count) return (await prisma.reservation.findUnique({ where: { id: reservation.id }, include: WITH_PAPERWORK }))!;
    }
    return reservation;
  }

  private require(actor: AuthenticatedStaff) {
    if (!can(actor.role, 'reservations:status')) throw forbidden();
  }

  // ---- Views ------------------------------------------------------------------------------------------------------

  private contractFacts(r: PaperworkRecord) {
    const tz = r.parking.timezone;
    const services = r.parking.listing?.services ?? [];
    return {
      operatorName: r.operator.name,
      parkingName: r.parking.listing?.title || r.parking.name,
      parkingAddress: r.parking.address,
      customerName: r.customerName,
      plate: r.plate,
      vehicle: [r.vehicleModel, r.vehicleColour].filter(Boolean).join(' ') || null,
      arrivalAt: localDateTime(r.arrivalAt, tz),
      returnAt: localDateTime(r.returnAt, tz),
      priceCents: r.priceCents,
      keysEntrusted: services.includes('valet') || !!r.fileId || !!r.keyHook,
      paidOnline: r.paymentStatus === 'paid',
    };
  }

  private codeAvailable(r: Reservation): boolean {
    return this.notifications.settings.apiKey !== '' && !!smsRecipient(r.customerPhone);
  }

  private contractView(r: PaperworkRecord) {
    const c = r.contract;
    return {
      status: c ? ('signed' as const) : ('unsigned' as const),
      canSign: !c && CONTRACT_SIGNABLE.includes(r.status),
      codeAvailable: this.codeAvailable(r),
      phoneMasked: maskPhone(r.customerPhone),
      document: c ? documentFromText(c.text) : contractDocument(this.contractFacts(r)),
      signed: c
        ? {
            version: c.version,
            signedAt: c.signedAt.toISOString(),
            signerName: c.signerName,
            method: c.method,
            device: c.device,
            phoneMasked: c.phoneMasked,
            proofSha256: c.proofSha256,
          }
        : null,
    };
  }

  private inspectionView(r: PaperworkRecord, i: InspectionRecord | undefined, performers: Map<string, string>) {
    if (!i) return null;
    const slots = i.photos.map(p => p.slot);
    return {
      kind: i.kind,
      startedAt: i.startedAt.toISOString(),
      completedAt: i.completedAt?.toISOString() ?? null,
      performedBy: (i.performedById && performers.get(i.performedById)) || null,
      damages: damagesOf(i.damages),
      mileageKm: i.mileageKm,
      fuelQuarters: i.fuelQuarters,
      notes: i.notes,
      photos: i.photos.map(p => ({ id: p.id, slot: p.slot, takenAt: p.takenAt.toISOString() })),
      photosErased: !!i.photosErasedAt,
      missing: i.completedAt ? [] : missingForCompletion({ slots, mileageKm: i.mileageKm, fuelQuarters: i.fuelQuarters }),
      editable: !i.completedAt,
      decision: i.decision,
      decidedAt: i.decidedAt?.toISOString() ?? null,
      decisionMethod: i.decisionMethod,
      decisionDevice: i.decisionDevice,
      reserveText: i.reserveText,
      canAnswer: canAnswer(i, r.status, i.kind),
    };
  }

  private async view(r: PaperworkRecord, viewer: Viewer) {
    const ids = r.inspections.map(i => i.performedById).filter((x): x is string => !!x);
    const staff = ids.length ? await prisma.staff.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true } }) : [];
    const performers = new Map(staff.map(s => [s.id, s.firstName]));
    const dropoff = r.inspections.find(i => i.kind === 'dropoff');
    const ret = r.inspections.find(i => i.kind === 'return');
    const comparison =
      ret?.completedAt != null
        ? compareReports(
            dropoff?.completedAt ? { damages: damagesOf(dropoff.damages), mileageKm: dropoff.mileageKm, fuelQuarters: dropoff.fuelQuarters } : null,
            {
              damages: damagesOf(ret.damages),
              mileageKm: ret.mileageKm,
              fuelQuarters: ret.fuelQuarters,
            },
          )
        : null;
    const traveller = viewer === 'traveller';
    return {
      reservationId: traveller ? undefined : r.id,
      status: r.status,
      photosAvailable: this.storage.available(),
      contract: this.contractView(r),
      dropoff: this.inspectionView(r, traveller && !dropoff?.completedAt ? undefined : dropoff, performers),
      return: this.inspectionView(r, traveller && !ret?.completedAt ? undefined : ret, performers),
      comparison,
    };
  }

  /** GET /internal/reservations/:id/paperwork */
  public async staffPaperwork(actor: AuthenticatedStaff, id: string) {
    return this.view(await this.loadForStaff(actor, id), 'staff');
  }

  /** GET /public/bookings/:reference/paperwork: the traveller sees a report once it is complete. */
  public async travellerPaperwork(reference: string, token: string | undefined) {
    return this.view(await this.loadForTraveller(reference, token), 'traveller');
  }

  // ---- Contract -------------------------------------------------------------------------------------------------

  /** Sends a one-time code by SMS to the traveller's phone (Plazo's Brevo, whatever the parking's SMS channel). */
  private async sendCode(r: PaperworkRecord, actor: AuthenticatedStaff | null) {
    if (r.contract) throw conflict('already_signed', 'The contract is already signed');
    if (!CONTRACT_SIGNABLE.includes(r.status)) throw conflict('contract_closed', 'The contract can no longer be signed');
    const recipient = smsRecipient(r.customerPhone);
    if (!recipient) throw conflict('no_mobile', 'No mobile number to send the code to');
    if (!this.notifications.settings.apiKey) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'SMS are not configured', 'sms_unavailable');
    const now = Date.now();
    const recent = await prisma.signatureCode.findMany({
      where: { reservationId: r.id, purpose: 'contract', createdAt: { gt: new Date(now - 3600000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (recent.length >= CODES_PER_HOUR) throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Too many codes sent', 'too_many_codes');
    if (recent[0] && now - recent[0].createdAt.getTime() < CODE_RESEND_AFTER_MS) {
      throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Wait before asking for a new code', 'code_recently_sent');
    }
    const id = `sc_${randomBytes(12).toString('hex')}`;
    const code = newCode();
    const phoneMasked = maskPhone(r.customerPhone);
    const expiresAt = new Date(now + CODE_TTL_MS);
    // A new code replaces the previous ones.
    await prisma.$transaction([
      prisma.signatureCode.updateMany({ where: { reservationId: r.id, purpose: 'contract', consumedAt: null }, data: { consumedAt: new Date(now) } }),
      prisma.signatureCode.create({
        data: { id, reservationId: r.id, purpose: 'contract', codeHash: hashCode(signatureCodeSecret(), id, code), phoneMasked, expiresAt },
      }),
    ]);
    const sent = await this.sms.sendSignatureCode(r.operatorId, r.id, recipient, codeSms(PRODUCT_NAME, code));
    if (!sent) {
      await prisma.signatureCode.update({ where: { id }, data: { consumedAt: new Date() } });
      throw new HttpException(httpStatus.BAD_GATEWAY, 'The SMS could not be sent', 'sms_failed');
    }
    await this.audit.record(
      { id: actor?.id ?? null, operatorId: r.operatorId, actingAs: actor?.actingAs },
      { action: 'contract.code_sent', entityType: 'reservation', entityId: r.id, details: { device: actor ? 'staff_device' : 'traveller_app' } },
    );
    return { sentTo: phoneMasked, expiresAt: expiresAt.toISOString(), resendAfterSeconds: CODE_RESEND_AFTER_MS / 1000 };
  }

  /** Checks a typed code against the latest one; counts the tries. */
  private async consumeCode(r: PaperworkRecord, code: string): Promise<string> {
    const latest = await prisma.signatureCode.findFirst({
      where: { reservationId: r.id, purpose: 'contract', consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest || latest.expiresAt <= new Date()) throw conflict('code_expired', 'The code has expired: ask for a new one');
    if (latest.attempts >= CODE_MAX_ATTEMPTS) throw conflict('code_locked', 'Too many wrong codes: ask for a new one');
    if (!codeMatches(signatureCodeSecret(), latest.id, code, latest.codeHash)) {
      await prisma.signatureCode.update({ where: { id: latest.id }, data: { attempts: { increment: 1 } } });
      throw new ValidationException({ code: 'wrong_code' });
    }
    const { count } = await prisma.signatureCode.updateMany({ where: { id: latest.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (!count) throw conflict('code_expired', 'The code has expired: ask for a new one');
    return latest.phoneMasked;
  }

  private async sign(
    r: PaperworkRecord,
    actor: AuthenticatedStaff | null,
    proof: { method: 'sms_code' | 'handwritten'; phoneMasked: string | null; strokes: number[][][] | null },
  ) {
    const text = contractText(contractDocument(this.contractFacts(r)));
    const signedAt = new Date();
    const device = actor ? 'staff_device' : 'traveller_app';
    const strokesHash = proof.strokes ? sha256(JSON.stringify(proof.strokes)) : '';
    try {
      await prisma.reservationContract.create({
        data: {
          reservationId: r.id,
          version: CONTRACT_VERSION,
          text,
          textSha256: sha256(text),
          signerName: r.customerName,
          method: proof.method,
          device,
          phoneMasked: proof.phoneMasked,
          strokes: proof.strokes ?? undefined,
          witnessedById: actor?.id ?? null,
          signedAt,
          proofSha256: proofOf(text, r.customerName, proof.method, signedAt, strokesHash),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw conflict('already_signed', 'The contract is already signed');
      throw error;
    }
    await this.audit.record(
      { id: actor?.id ?? null, operatorId: r.operatorId, actingAs: actor?.actingAs },
      { action: 'contract.signed', entityType: 'reservation', entityId: r.id, details: { method: proof.method, device, version: CONTRACT_VERSION } },
    );
    const signed = (await prisma.reservation.findUnique({ where: { id: r.id }, include: WITH_PAPERWORK }))!;
    await this.emailCopy(signed);
    return signed;
  }

  /** The signed copy to the traveller (never fails the signature). */
  private async emailCopy(r: PaperworkRecord) {
    const c = r.contract;
    if (!c || !r.customerEmail) return;
    const doc = documentFromText(c.text);
    const when = `${localDateTime(c.signedAt, r.parking.timezone).replace('T', ' à ')}`;
    const how = c.method === 'sms_code' ? `par code reçu par SMS au ${c.phoneMasked}` : 'par signature manuscrite sur l’appareil du parking';
    const proofLines = [`Signé par ${c.signerName} le ${when}, ${how}.`, `Version ${c.version} · empreinte ${c.proofSha256}`];
    const message: EmailMessage = {
      subject: `Votre contrat signé · ${doc.title.replace(/^Contrat de stationnement · /, '')}`,
      text: [c.text, '', ...proofLines].join('\n'),
      html:
        `<div style="font-family:Arial,sans-serif;max-width:600px;color:#1e1e1e">` +
        `<h2 style="font-weight:600">${escapeHtml(doc.title)}</h2>` +
        doc.summary.map(l => `<div>${escapeHtml(l)}</div>`).join('') +
        `<ol style="padding-left:20px;margin-top:16px">${doc.clauses.map(l => `<li style="margin-bottom:8px">${escapeHtml(l)}</li>`).join('')}</ol>` +
        `<p style="color:#6f6a66;font-size:13px;border-top:1px solid #ece4de;padding-top:12px">${proofLines.map(escapeHtml).join('<br>')}</p></div>`,
    };
    const ok = await this.notifications.emailTraveller(
      { email: r.customerEmail, name: r.customerName },
      'contract_signed',
      `reservation ${r.id}`,
      message,
    );
    if (ok) await prisma.reservationContract.update({ where: { id: c.id }, data: { emailedAt: new Date() } });
  }

  /** POST /public/bookings/:reference/contract/code */
  public async travellerSendCode(reference: string, token: string | undefined) {
    return this.sendCode(await this.loadForTraveller(reference, token), null);
  }

  /** POST /public/bookings/:reference/contract/sign { code } */
  public async travellerSign(reference: string, token: string | undefined, code: unknown) {
    const r = await this.loadForTraveller(reference, token);
    this.assertSignable(r);
    if (typeof code !== 'string') throw new ValidationException({ code: 'required' });
    const phoneMasked = await this.consumeCode(r, code);
    return this.view(await this.sign(r, null, { method: 'sms_code', phoneMasked, strokes: null }), 'traveller');
  }

  /** POST /internal/reservations/:id/contract/code: the code goes to the traveller's phone, typed on the staff's. */
  public async staffSendCode(actor: AuthenticatedStaff, id: string) {
    this.require(actor);
    return this.sendCode(await this.loadForStaff(actor, id), actor);
  }

  /** POST /internal/reservations/:id/contract/sign { code } | { strokes } */
  public async staffSign(actor: AuthenticatedStaff, id: string, body: { code?: unknown; strokes?: unknown }) {
    this.require(actor);
    const r = await this.loadForStaff(actor, id);
    this.assertSignable(r);
    if (typeof body.code === 'string' && body.code.trim()) {
      const phoneMasked = await this.consumeCode(r, body.code);
      return this.view(await this.sign(r, actor, { method: 'sms_code', phoneMasked, strokes: null }), 'staff');
    }
    const strokes = cleanStrokes(body.strokes);
    if (!strokes) throw new ValidationException({ strokes: 'required' });
    return this.view(await this.sign(r, actor, { method: 'handwritten', phoneMasked: null, strokes }), 'staff');
  }

  private assertSignable(r: PaperworkRecord) {
    if (r.contract) throw conflict('already_signed', 'The contract is already signed');
    if (!CONTRACT_SIGNABLE.includes(r.status)) throw conflict('contract_closed', 'The contract can no longer be signed');
  }

  // ---- Condition reports (staff) -------------------------------------------------------------------------------

  private kindOf(kind: string): InspectionKindName {
    if (!isKind(kind)) throw notFound();
    return kind;
  }

  private draft(r: PaperworkRecord, kind: InspectionKindName): InspectionRecord {
    const i = r.inspections.find(x => x.kind === kind);
    if (!i) throw new HttpException(httpStatus.NOT_FOUND, 'No condition report yet', 'inspection_not_found');
    if (i.completedAt) throw conflict('inspection_completed', 'The condition report is completed');
    return i;
  }

  /** POST /internal/reservations/:id/inspections/:kind: starts the report (or returns the one already started). */
  public async start(actor: AuthenticatedStaff, id: string, rawKind: string) {
    this.require(actor);
    const kind = this.kindOf(rawKind);
    const r = await this.loadForStaff(actor, id);
    if (!r.inspections.some(i => i.kind === kind)) {
      const allowed = kind === 'dropoff' ? DROPOFF_STATUSES : RETURN_STATUSES;
      if (!allowed.includes(r.status)) throw conflict('inspection_closed', 'This condition report cannot be made at this stage');
      await prisma.vehicleInspection.upsert({
        where: { reservationId_kind: { reservationId: r.id, kind } },
        create: { reservationId: r.id, kind, performedById: actor.id },
        update: {},
      });
      await this.audit.record(actor, { action: 'inspection.started', entityType: 'reservation', entityId: r.id, details: { kind } });
    }
    return this.staffPaperwork(actor, id);
  }

  /** PATCH /internal/reservations/:id/inspections/:kind { damages?, mileageKm?, fuelQuarters?, notes? } */
  public async update(actor: AuthenticatedStaff, id: string, rawKind: string, body: Record<string, unknown>) {
    this.require(actor);
    const kind = this.kindOf(rawKind);
    const r = await this.loadForStaff(actor, id);
    const i = this.draft(r, kind);
    const data: Prisma.VehicleInspectionUpdateInput = {};
    const fields: Record<string, string> = {};
    if (body.damages !== undefined) {
      const cleaned = cleanDamages(body.damages);
      if (!cleaned.ok) fields.damages = cleaned.code;
      else {
        const photoIds = new Set(i.photos.filter(p => p.slot === DAMAGE_SLOT).map(p => p.id));
        if (cleaned.value.some(d => d.photoId && !photoIds.has(d.photoId))) fields.damages = 'invalid';
        else data.damages = cleaned.value as unknown as Prisma.InputJsonValue;
      }
    }
    if (body.mileageKm !== undefined) {
      const v = body.mileageKm;
      if (v === null) data.mileageKm = null;
      else if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > 2_000_000) fields.mileageKm = 'invalid';
      else data.mileageKm = v as number;
    }
    if (body.fuelQuarters !== undefined) {
      const v = body.fuelQuarters;
      if (v === null) data.fuelQuarters = null;
      else if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > 4) fields.fuelQuarters = 'invalid';
      else data.fuelQuarters = v as number;
    }
    if (body.notes !== undefined) {
      const v = body.notes;
      if (v !== null && typeof v !== 'string') fields.notes = 'invalid';
      else if (typeof v === 'string' && v.trim().length > MAX_NOTES_LENGTH) fields.notes = 'too_long';
      else data.notes = typeof v === 'string' && v.trim() ? v.trim() : null;
    }
    if (Object.keys(fields).length) throw new ValidationException(fields);
    const { count } = await prisma.vehicleInspection.updateMany({
      where: { id: i.id, completedAt: null },
      data: data as Prisma.VehicleInspectionUpdateManyMutationInput,
    });
    if (!count) throw conflict('inspection_completed', 'The condition report is completed');
    return this.staffPaperwork(actor, id);
  }

  /** POST /internal/reservations/:id/inspections/:kind/photos?slot=front (raw image body). */
  public async addPhoto(actor: AuthenticatedStaff, id: string, rawKind: string, slot: unknown, body: unknown) {
    this.require(actor);
    const kind = this.kindOf(rawKind);
    if (!isSlot(slot)) throw new ValidationException({ slot: 'invalid' });
    if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationException({ photo: 'required' });
    if (body.length > MAX_PHOTO_BYTES) throw new ValidationException({ photo: 'too_large' });
    const contentType = sniffImage(body);
    if (!contentType) throw new ValidationException({ photo: 'not_an_image' });
    const r = await this.loadForStaff(actor, id);
    const i = this.draft(r, kind);
    if (slot === DAMAGE_SLOT && i.photos.filter(p => p.slot === DAMAGE_SLOT).length >= MAX_DAMAGE_PHOTOS)
      throw new ValidationException({ photo: 'too_many' });
    const photoId = `ph_${randomBytes(12).toString('hex')}`;
    const ext = contentType.split('/')[1];
    const key = `inspections/${r.id}/${i.id}/${photoId}.${ext}`;
    await this.storage.put(key, body, contentType);
    // A guided photo taken again replaces the previous one.
    const replaced = slot === DAMAGE_SLOT ? [] : i.photos.filter(p => p.slot === slot);
    await prisma.$transaction([
      prisma.inspectionPhoto.deleteMany({ where: { id: { in: replaced.map(p => p.id) } } }),
      prisma.inspectionPhoto.create({
        data: { id: photoId, inspectionId: i.id, slot, storageKey: key, contentType, bytes: body.length, sha256: sha256(body) },
      }),
    ]);
    await this.storage.remove(replaced.map(p => p.storageKey));
    return { photoId, paperwork: await this.staffPaperwork(actor, id) };
  }

  /** DELETE /internal/reservations/:id/inspections/:kind/photos/:photoId (while the report is a draft). */
  public async removePhoto(actor: AuthenticatedStaff, id: string, rawKind: string, photoId: string) {
    this.require(actor);
    const r = await this.loadForStaff(actor, id);
    const i = this.draft(r, this.kindOf(rawKind));
    const photo = i.photos.find(p => p.id === photoId);
    if (!photo) throw new HttpException(httpStatus.NOT_FOUND, 'Photo not found', 'photo_not_found');
    await prisma.inspectionPhoto.delete({ where: { id: photo.id } });
    const damages = damagesOf(i.damages);
    if (damages.some(d => d.photoId === photo.id)) {
      await prisma.vehicleInspection.update({
        where: { id: i.id },
        data: { damages: damages.map(d => (d.photoId === photo.id ? { ...d, photoId: null } : d)) as unknown as Prisma.InputJsonValue },
      });
    }
    await this.storage.remove([photo.storageKey]);
    return this.staffPaperwork(actor, id);
  }

  /** POST /internal/reservations/:id/inspections/:kind/complete */
  public async complete(actor: AuthenticatedStaff, id: string, rawKind: string) {
    this.require(actor);
    const kind = this.kindOf(rawKind);
    const r = await this.loadForStaff(actor, id);
    const i = this.draft(r, kind);
    const missing = missingForCompletion({ slots: i.photos.map(p => p.slot), mileageKm: i.mileageKm, fuelQuarters: i.fuelQuarters });
    if (missing.length) throw new ValidationException(Object.fromEntries(missing.map(m => [m, 'required'])));
    const { count } = await prisma.vehicleInspection.updateMany({
      where: { id: i.id, completedAt: null },
      data: { completedAt: new Date(), performedById: actor.id },
    });
    if (!count) throw conflict('inspection_completed', 'The condition report is completed');
    await this.audit.record(actor, {
      action: 'inspection.completed',
      entityType: 'reservation',
      entityId: r.id,
      details: { kind, photos: i.photos.length, damages: damagesOf(i.damages).length },
    });
    return this.staffPaperwork(actor, id);
  }

  // ---- Answers ---------------------------------------------------------------------------------------------------

  private inspectionProof(i: InspectionRecord, decision: string, decidedAt: Date, reserveText: string | null, strokesHash: string | null): string {
    return sha256(
      JSON.stringify({
        kind: i.kind,
        photos: i.photos.map(p => [p.slot, p.sha256]).sort(),
        damages: damagesOf(i.damages),
        mileageKm: i.mileageKm,
        fuelQuarters: i.fuelQuarters,
        completedAt: i.completedAt?.toISOString() ?? null,
        decision,
        decidedAt: decidedAt.toISOString(),
        reserveText,
        strokes: strokesHash,
      }),
    );
  }

  private async answer(
    r: PaperworkRecord,
    kind: InspectionKindName,
    actor: AuthenticatedStaff | null,
    body: { decision?: unknown; reserveText?: unknown; strokes?: unknown },
  ) {
    const i = r.inspections.find(x => x.kind === kind);
    if (!i?.completedAt) throw new HttpException(httpStatus.NOT_FOUND, 'No completed condition report', 'inspection_not_found');
    if (!canAnswer(i, r.status, kind)) throw conflict('answer_closed', 'This condition report can no longer be answered');
    const decision = body.decision;
    if (decision !== 'accepted' && decision !== 'reserved') throw new ValidationException({ decision: 'invalid' });
    let reserveText: string | null = null;
    if (decision === 'reserved') {
      reserveText = typeof body.reserveText === 'string' ? body.reserveText.trim() : '';
      if (!reserveText) throw new ValidationException({ reserveText: 'required' });
      if (reserveText.length > MAX_RESERVE_LENGTH) throw new ValidationException({ reserveText: 'too_long' });
    }
    let strokes: number[][][] | null = null;
    if (actor) {
      strokes = cleanStrokes(body.strokes);
      if (!strokes) throw new ValidationException({ strokes: 'required' });
    }
    const decidedAt = new Date();
    const strokesHash = strokes ? sha256(JSON.stringify(strokes)) : null;
    const { count } = await prisma.vehicleInspection.updateMany({
      where: { id: i.id, decision: 'pending' },
      data: {
        decision,
        decidedAt,
        reserveText,
        decisionMethod: actor ? 'handwritten' : 'booking_link',
        decisionDevice: actor ? 'staff_device' : 'traveller_app',
        strokes: strokes ?? undefined,
        proofSha256: this.inspectionProof(i, decision, decidedAt, reserveText, strokesHash),
      },
    });
    if (!count) throw conflict('answer_closed', 'This condition report can no longer be answered');
    await this.audit.record(
      { id: actor?.id ?? null, operatorId: r.operatorId, actingAs: actor?.actingAs },
      {
        action: 'inspection.answered',
        entityType: 'reservation',
        entityId: r.id,
        details: { kind, decision, device: actor ? 'staff_device' : 'traveller_app' },
      },
    );
    if (decision === 'reserved') logger.info(`[Paperwork] Reservation made on the ${kind} report of reservation ${r.id}`);
  }

  /** POST /internal/reservations/:id/inspections/:kind/answer { decision, reserveText?, strokes } (signed on the staff's phone). */
  public async staffAnswer(
    actor: AuthenticatedStaff,
    id: string,
    rawKind: string,
    body: { decision?: unknown; reserveText?: unknown; strokes?: unknown },
  ) {
    this.require(actor);
    const kind = this.kindOf(rawKind);
    await this.answer(await this.loadForStaff(actor, id), kind, actor, body);
    return this.staffPaperwork(actor, id);
  }

  /** POST /public/bookings/:reference/inspections/:kind/answer { decision, reserveText? } */
  public async travellerAnswer(reference: string, token: string | undefined, rawKind: string, body: { decision?: unknown; reserveText?: unknown }) {
    const kind = this.kindOf(rawKind);
    await this.answer(await this.loadForTraveller(reference, token), kind, null, { decision: body.decision, reserveText: body.reserveText });
    return this.travellerPaperwork(reference, token);
  }

  // ---- Photos out ------------------------------------------------------------------------------------------------

  private async photo(r: PaperworkRecord, rawKind: string, photoId: string, viewer: Viewer): Promise<StoredPhoto> {
    const kind = this.kindOf(rawKind);
    const i = r.inspections.find(x => x.kind === kind);
    if (!i || (viewer === 'traveller' && !i.completedAt)) throw new HttpException(httpStatus.NOT_FOUND, 'Photo not found', 'photo_not_found');
    const p = i.photos.find(x => x.id === photoId);
    if (!p) throw new HttpException(httpStatus.NOT_FOUND, 'Photo not found', 'photo_not_found');
    const stored = await this.storage.get(p.storageKey);
    if (!stored) throw new HttpException(httpStatus.NOT_FOUND, 'Photo not found', 'photo_not_found');
    return { ...stored, contentType: p.contentType };
  }

  public async staffPhoto(actor: AuthenticatedStaff, id: string, kind: string, photoId: string) {
    return this.photo(await this.loadForStaff(actor, id), kind, photoId, 'staff');
  }

  public async travellerPhoto(reference: string, token: string | undefined, kind: string, photoId: string) {
    return this.photo(await this.loadForTraveller(reference, token), kind, photoId, 'traveller');
  }

  // ---- Retention -------------------------------------------------------------------------------------------------

  /** Erases the photos of these bookings now (anonymisation). Returns the photos erased. */
  public async erasePhotosOf(reservationIds: string[]): Promise<number> {
    if (!reservationIds.length) return 0;
    const photos = await prisma.inspectionPhoto.findMany({
      where: { inspection: { reservationId: { in: reservationIds } } },
      select: { id: true, storageKey: true, inspectionId: true },
    });
    if (!(await this.storage.remove(photos.map(p => p.storageKey)))) return 0;
    await prisma.inspectionPhoto.deleteMany({ where: { id: { in: photos.map(p => p.id) } } });
    await prisma.vehicleInspection.updateMany({
      where: { reservationId: { in: reservationIds }, photosErasedAt: null },
      data: { photosErasedAt: new Date() },
    });
    return photos.length;
  }

  /**
   * Nightly: the photos of bookings returned more than 90 days ago (365 when the traveller made a reservation) are erased,
   * and the signature codes older than a day deleted. Returns what was done.
   */
  public async purge(now = new Date()) {
    let photosErased = 0;
    for (const disputed of [false, true]) {
      const rows = await prisma.reservation.findMany({
        where: {
          returnAt: { lt: photosCutoff(now, disputed) },
          AND: [
            { inspections: { some: { photosErasedAt: null, photos: { some: {} } } } },
            disputed ? { inspections: { some: { decision: 'reserved' } } } : { NOT: { inspections: { some: { decision: 'reserved' } } } },
          ],
        },
        select: { id: true },
        take: PURGE_BATCH,
      });
      photosErased += await this.erasePhotosOf(rows.map(r => r.id));
    }
    const { count: codesDeleted } = await prisma.signatureCode.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86400000) } } });
    return { photosErased, codesDeleted };
  }

  /** The required slots, for the apps' guided capture. */
  public static readonly requiredSlots = REQUIRED_SLOTS;
}
