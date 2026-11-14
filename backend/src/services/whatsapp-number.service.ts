import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { SECRET_KEY, whatsappConfig } from '@/config';
import prisma from '@/database';
import { displayPhone } from '@/domain/phone';
import { registrationPin, splitPhone, statusAfterCheck, WHATSAPP_DISPLAY_NAME, WhatsappNumberStatus } from '@/domain/whatsapp-number';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';

type Row = NonNullable<Awaited<ReturnType<typeof prisma.operatorWhatsappNumber.findUnique>>>;

export interface WhatsappNumberView {
  status: WhatsappNumberStatus;
  /** « 06 39 98 12 40 ». */
  phone: string | null;
  phoneNumberId: string | null;
  displayName: string;
  nameStatus: string | null;
  metaStatus: string | null;
  quality: string | null;
  requestedAt: Date | null;
  codeSentAt: Date | null;
  registeredAt: Date | null;
  activeAt: Date | null;
  checkedAt: Date | null;
  lastError: string | null;
  /** Messages leave from this number right now. */
  sending: boolean;
}

type GraphResult = { ok: boolean; status: number; data: any };

/**
 * 14/11/2026 (« Un compte WhatsApp Business par parking », chemin 1, « ne casse pas l'existant jusqu'à ce que ce soit
 * fonctionnel »): the platform adds a parking's number to Benford Tech's WhatsApp Business account, has Meta send it a
 * code, verifies and registers it; the number becomes `active` once Meta has approved the display name « Plazo ». Only
 * an active number is used to send; every other state, and any failure, leaves Plazo's number in use. Logs carry ids and
 * Meta's codes only, never a phone number or a code.
 */
@Service()
export class WhatsappNumberService {
  public audit = Container.get(AuditService);
  public config = whatsappConfig;
  public timeoutMs = 8000;
  public secret = SECRET_KEY ?? '';

  // ---- Sending ---------------------------------------------------------------------------------------

  /** The number a parking's messages leave from: its own once active, else null (Plazo's number). Never throws. */
  public async senderFor(operatorId: string): Promise<string | null> {
    try {
      const row = await prisma.operatorWhatsappNumber.findUnique({
        where: { operatorId },
        select: { status: true, phoneNumberId: true },
      });
      return row?.status === 'active' && row.phoneNumberId ? row.phoneNumberId : null;
    } catch {
      return null;
    }
  }

  /** The parking a number belongs to (whatever its state: a traveller may answer a paused number). */
  public async operatorOf(phoneNumberId: string | null | undefined): Promise<string | null> {
    if (!phoneNumberId) return null;
    const row = await prisma.operatorWhatsappNumber.findUnique({ where: { phoneNumberId }, select: { operatorId: true } });
    return row?.operatorId ?? null;
  }

  // ---- The parking ---------------------------------------------------------------------------------

  /** The parking's view, in « WhatsApp aux voyageurs ». */
  public async viewFor(operatorId: string): Promise<WhatsappNumberView | null> {
    const row = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    return row ? this.view(row) : null;
  }

  /** « Demander mon numéro WhatsApp »: the platform sees the request in « À traiter ». */
  public async request(actor: AuthenticatedStaff, now = new Date()): Promise<WhatsappNumberView> {
    const existing = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId: actor.operatorId } });
    if (existing) return this.view(existing);
    const row = await prisma.operatorWhatsappNumber.create({ data: { operatorId: actor.operatorId, status: 'requested', requestedAt: now } });
    await this.audit.record(actor, { action: 'whatsapp_number.requested', entityType: 'operator', entityId: actor.operatorId });
    return this.view(row);
  }

  // ---- The platform --------------------------------------------------------------------------------

  public async platformView(operatorId: string) {
    await this.operatorOrThrow(operatorId);
    const row = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    const { token, businessAccountId } = this.config();
    return {
      number: row ? this.view(row) : null,
      displayName: WHATSAPP_DISPLAY_NAME,
      /** Plazo can add numbers: the token and Benford Tech's WhatsApp Business account are set. */
      available: !!(token && businessAccountId),
    };
  }

  /** Adds the number to Benford Tech's account, display name « Plazo ». */
  public async add(admin: AuthenticatedStaff, operatorId: string, raw: { phone?: unknown }) {
    await this.operatorOrThrow(operatorId);
    const phone = typeof raw?.phone === 'string' ? splitPhone(raw.phone) : null;
    if (!phone) throw new ValidationException({ phone: typeof raw?.phone === 'string' && raw.phone.trim() ? 'invalid' : 'required' });
    const existing = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    if (existing && existing.status !== 'requested')
      throw new HttpException(httpStatus.CONFLICT, 'This parking already has a number', 'number_exists');
    const { businessAccountId } = this.requireConfig();
    const res = await this.graph(`${encodeURIComponent(businessAccountId)}/phone_numbers`, {
      cc: phone.cc,
      phone_number: phone.national,
      verified_name: WHATSAPP_DISPLAY_NAME,
    });
    const id = typeof res.data?.id === 'string' ? res.data.id : null;
    if (!res.ok || !id) throw this.metaError(res, 'add');
    return this.saveLinked(admin, operatorId, id, phone.e164, 'whatsapp_number.added');
  }

  /** A number already added in WhatsApp Manager: Plazo checks it is on Benford Tech's account, then takes it. */
  public async link(admin: AuthenticatedStaff, operatorId: string, raw: { phoneNumberId?: unknown }) {
    await this.operatorOrThrow(operatorId);
    const id = typeof raw?.phoneNumberId === 'string' ? raw.phoneNumberId.trim() : '';
    if (!/^\d{6,25}$/.test(id)) throw new ValidationException({ phoneNumberId: id ? 'invalid' : 'required' });
    const existing = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    if (existing && existing.status !== 'requested')
      throw new HttpException(httpStatus.CONFLICT, 'This parking already has a number', 'number_exists');
    const { businessAccountId } = this.requireConfig();
    const res = await this.graph(`${encodeURIComponent(businessAccountId)}/phone_numbers?fields=id,display_phone_number&limit=100`, undefined);
    if (!res.ok) throw this.metaError(res, 'link');
    const found = Array.isArray(res.data?.data) ? res.data.data.find((n: any) => n?.id === id) : null;
    if (!found) throw new HttpException(httpStatus.NOT_FOUND, 'Not a number of the account', 'number_not_in_account');
    const phone = typeof found.display_phone_number === 'string' ? splitPhone(`+${found.display_phone_number.replace(/\D/g, '')}`) : null;
    const saved = await this.saveLinked(
      admin,
      operatorId,
      id,
      phone?.e164 ?? `+${String(found.display_phone_number ?? '').replace(/\D/g, '')}`,
      'whatsapp_number.linked',
    );
    return this.check(admin, operatorId).catch(() => saved);
  }

  /** Meta sends the code to the number (SMS or call). */
  public async requestCode(admin: AuthenticatedStaff, operatorId: string, raw: { method?: unknown }, now = new Date()) {
    const row = await this.rowOrThrow(operatorId);
    if (row.status !== 'added' && row.status !== 'code_sent')
      throw new HttpException(httpStatus.CONFLICT, 'The number does not wait for a code', 'number_not_waiting');
    const method = raw?.method === 'VOICE' || raw?.method === 'voice' ? 'VOICE' : 'SMS';
    const res = await this.graph(`${row.phoneNumberId}/request_code`, { code_method: method, language: 'fr' });
    if (!res.ok || res.data?.success === false) {
      await this.saveError(row.id, res);
      throw this.metaError(res, 'request_code');
    }
    const updated = await prisma.operatorWhatsappNumber.update({
      where: { id: row.id },
      data: { status: 'code_sent', codeSentAt: now, lastError: null },
    });
    await this.record(admin, operatorId, 'whatsapp_number.code_requested', { method });
    return this.view(updated);
  }

  /** The code the parking received: verified, then the number is registered (two-step PIN derived, never stored). */
  public async verify(admin: AuthenticatedStaff, operatorId: string, raw: { code?: unknown }, now = new Date()) {
    const row = await this.rowOrThrow(operatorId);
    if (row.status !== 'added' && row.status !== 'code_sent')
      throw new HttpException(httpStatus.CONFLICT, 'The number does not wait for a code', 'number_not_waiting');
    const code = typeof raw?.code === 'string' ? raw.code.replace(/\D/g, '') : '';
    if (!/^\d{6}$/.test(code)) throw new ValidationException({ code: code ? 'invalid' : 'required' });
    const verified = await this.graph(`${row.phoneNumberId}/verify_code`, { code });
    if (!verified.ok || verified.data?.success === false) {
      await this.saveError(row.id, verified);
      throw this.metaError(verified, 'verify_code');
    }
    const registered = await this.register(row.id, row.phoneNumberId!);
    if (!registered.ok) throw this.metaError(registered, 'register');
    await prisma.operatorWhatsappNumber.update({
      where: { id: row.id },
      data: { status: 'registered', registeredAt: now, lastError: null },
    });
    await this.record(admin, operatorId, 'whatsapp_number.registered');
    return this.check(admin, operatorId, now);
  }

  /** Meta's view read again; a registered number whose name is approved becomes active. */
  public async check(admin: AuthenticatedStaff | null, operatorId: string, now = new Date()): Promise<WhatsappNumberView> {
    const row = await this.rowOrThrow(operatorId);
    const updated = await this.refresh(row, now);
    if (admin && updated.status === 'active' && row.status !== 'active') await this.record(admin, operatorId, 'whatsapp_number.active');
    return this.view(updated);
  }

  /** « Revenir au numéro de Plazo » / « Reprendre l'envoi depuis ce numéro ». */
  public async setPaused(admin: AuthenticatedStaff, operatorId: string, paused: boolean, now = new Date()) {
    const row = await this.rowOrThrow(operatorId);
    if (paused) {
      if (row.status !== 'active') throw new HttpException(httpStatus.CONFLICT, 'The number is not active', 'number_not_active');
      const updated = await prisma.operatorWhatsappNumber.update({ where: { id: row.id }, data: { status: 'paused' } });
      await this.record(admin, operatorId, 'whatsapp_number.paused');
      return this.view(updated);
    }
    if (row.status !== 'paused') throw new HttpException(httpStatus.CONFLICT, 'The number is not paused', 'number_not_paused');
    const back = await prisma.operatorWhatsappNumber.update({ where: { id: row.id }, data: { status: 'registered' } });
    const updated = await this.refresh(back, now);
    await this.record(admin, operatorId, 'whatsapp_number.resumed');
    return this.view(updated);
  }

  /** Plazo forgets the number (it stays on Benford Tech's account): the parking is back on Plazo's number. */
  public async remove(admin: AuthenticatedStaff, operatorId: string) {
    // A request alone can be dismissed too.
    const row = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'No number for this parking', 'no_number');
    await prisma.operatorWhatsappNumber.delete({ where: { id: row.id } });
    await this.record(admin, operatorId, 'whatsapp_number.removed');
    return { removed: true };
  }

  /** The 15-minute pass: registered and active numbers read again (an approved name turns a number on). */
  public async checkAll(now = new Date()): Promise<{ checked: number; activated: number }> {
    const { token } = this.config();
    if (!token) return { checked: 0, activated: 0 };
    const rows = await prisma.operatorWhatsappNumber.findMany({
      where: {
        status: { in: ['registered', 'active'] },
        OR: [{ checkedAt: null }, { checkedAt: { lt: new Date(now.getTime() - 15 * 60 * 1000 + 30_000) } }],
      },
      orderBy: { checkedAt: { sort: 'asc', nulls: 'first' } },
      take: 20,
    });
    let activated = 0;
    for (const row of rows) {
      const updated = await this.refresh(row, now).catch(() => row);
      if (updated.status === 'active' && row.status !== 'active') {
        activated++;
        logger.info(`[WhatsApp number] operator ${row.operatorId} now sends from its own number`);
      }
    }
    return { checked: rows.length, activated };
  }

  // ---- Internals -----------------------------------------------------------------------------------

  private async refresh(row: Row, now: Date): Promise<Row> {
    if (!row.phoneNumberId) return row;
    const res = await this.graph(
      `${row.phoneNumberId}?fields=display_phone_number,verified_name,name_status,status,quality_rating,code_verification_status`,
      undefined,
    );
    if (!res.ok) {
      return prisma.operatorWhatsappNumber.update({ where: { id: row.id }, data: { checkedAt: now, lastError: this.codeOf(res) } });
    }
    const meta = {
      nameStatus: typeof res.data?.name_status === 'string' ? res.data.name_status : null,
      metaStatus: typeof res.data?.status === 'string' ? res.data.status : null,
    };
    const status = statusAfterCheck(row.status as WhatsappNumberStatus, meta);
    return prisma.operatorWhatsappNumber.update({
      where: { id: row.id },
      data: {
        ...meta,
        quality: typeof res.data?.quality_rating === 'string' ? res.data.quality_rating : null,
        checkedAt: now,
        lastError: null,
        status,
        ...(status === 'active' && row.status !== 'active' ? { activeAt: now } : {}),
      },
    });
  }

  private async register(id: string, phoneNumberId: string): Promise<GraphResult> {
    const res = await this.graph(`${phoneNumberId}/register`, {
      messaging_product: 'whatsapp',
      pin: registrationPin(this.secret, phoneNumberId),
    });
    if (!res.ok || res.data?.success === false) await this.saveError(id, res);
    return res;
  }

  private async saveLinked(admin: AuthenticatedStaff, operatorId: string, phoneNumberId: string, e164: string, action: string) {
    const taken = await prisma.operatorWhatsappNumber.findUnique({ where: { phoneNumberId }, select: { operatorId: true } });
    if (taken && taken.operatorId !== operatorId)
      throw new HttpException(httpStatus.CONFLICT, 'The number belongs to another parking', 'number_taken');
    const row = await prisma.operatorWhatsappNumber.upsert({
      where: { operatorId },
      create: { operatorId, status: 'added', phone: e164, phoneNumberId },
      update: { status: 'added', phone: e164, phoneNumberId, lastError: null },
    });
    await this.record(admin, operatorId, action);
    return this.view(row);
  }

  private async saveError(id: string, res: GraphResult) {
    await prisma.operatorWhatsappNumber.update({ where: { id }, data: { lastError: this.codeOf(res) } }).catch(() => undefined);
  }

  private codeOf(res: GraphResult): string {
    const code = res.data?.error?.code;
    const sub = res.data?.error?.error_subcode;
    if (code === undefined || code === null) return `http_${res.status}`;
    return `meta_${String(code).slice(0, 12)}${sub ? `_${String(sub).slice(0, 12)}` : ''}`;
  }

  private metaError(res: GraphResult, step: string) {
    const code = this.codeOf(res);
    logger.warn(`[WhatsApp number] ${step} refused by Meta: ${code}`);
    return new HttpException(
      httpStatus.BAD_GATEWAY,
      typeof res.data?.error?.message === 'string' ? res.data.error.message.slice(0, 300) : 'Meta refused',
      code,
    );
  }

  private requireConfig() {
    const config = this.config();
    if (!config.token || !config.businessAccountId)
      throw new HttpException(httpStatus.CONFLICT, 'WhatsApp Business account not configured', 'whatsapp_unavailable');
    return config;
  }

  /** One Graph call: GET without a body, POST with a JSON body. Never throws (network errors come back as a status 0). */
  private async graph(path: string, body: Record<string, unknown> | undefined): Promise<GraphResult> {
    const { token, graphVersion } = this.config();
    try {
      const res = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
    } catch (error) {
      return { ok: false, status: 0, data: { error: { code: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network' } } };
    }
  }

  private async operatorOrThrow(operatorId: string) {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true } });
    if (!operator) throw new HttpException(httpStatus.NOT_FOUND, 'Operator not found', 'not_found');
  }

  private async rowOrThrow(operatorId: string): Promise<Row> {
    const row = await prisma.operatorWhatsappNumber.findUnique({ where: { operatorId } });
    if (!row || !row.phoneNumberId) throw new HttpException(httpStatus.NOT_FOUND, 'No number for this parking', 'no_number');
    return row;
  }

  private record(admin: AuthenticatedStaff, operatorId: string, action: string, details: Record<string, string> = {}) {
    return this.audit.record({ id: admin.id, operatorId }, { action, entityType: 'operator', entityId: operatorId, details });
  }

  private view(row: Row): WhatsappNumberView {
    return {
      status: row.status as WhatsappNumberStatus,
      phone: row.phone ? displayPhone(row.phone) : null,
      phoneNumberId: row.phoneNumberId,
      displayName: WHATSAPP_DISPLAY_NAME,
      nameStatus: row.nameStatus,
      metaStatus: row.metaStatus,
      quality: row.quality,
      requestedAt: row.requestedAt,
      codeSentAt: row.codeSentAt,
      registeredAt: row.registeredAt,
      activeAt: row.activeAt,
      checkedAt: row.checkedAt,
      lastError: row.lastError,
      sending: row.status === 'active' && !!row.phoneNumberId,
    };
  }
}
