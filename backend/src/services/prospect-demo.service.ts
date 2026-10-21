import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS } from '@/config';
import prisma from '@/database';
import { demoPricing } from '@/domain/demo-data';
import {
  DEMO_COMMISSIONS,
  DEMO_FILES,
  DEMO_LINK_DAYS,
  DEMO_OPERATOR_NAME,
  DEMO_OPERATOR_SLUG,
  DEMO_PARKING,
  DEMO_STAFF,
  DEMO_TOKEN_RE,
  DEMO_VEHICLES,
  demoLinkToken,
  DemoRole,
  isDemoRole,
} from '@/domain/prospect-demo';
import { customerNamesOf } from '@/domain/customer-name';
import { newReference, plateKey } from '@/domain/reservation';
import { defaultBookingNotify } from '@/domain/roles';
import { namesOf } from '@/domain/staff-name';
import { localDate } from '@/domain/time';
import { HttpException } from '@/utils/httpException';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { forgetDemoOperators, isProspectDemoOperator } from './demo-guard';
import { allocateInboundSlug } from './inbound-slug';
import { NotificationService } from './notification.service';
import { ParkingLocationService } from './parking-location.service';
import { StaffService } from './staff.service';
import { TokenService } from './token.service';

/** A prospect's demo link as the platform reads it. */
export interface DemoLinkView {
  url: string;
  expiresAt: string;
  expired: boolean;
  opens: number;
  lastOpenedAt: string | null;
}

const DAY = 86400000;

/**
 * 21/10/2026 (« mets un environnement de démo de l'app », choice A + B + C): the prospects' demo of Plazo Pro (see
 * domain/prospect-demo.ts). Seeded on the first entry, wiped and seeded again every night; its four members have a
 * random password nobody knows (entered only through `enter`); a prospect's own link counts its opens.
 */
@Service()
export class ProspectDemoService {
  public tokens = Container.get(TokenService);
  public staff = Container.get(StaffService);
  public locations = Container.get(ParkingLocationService);
  public notifications = Container.get(NotificationService);
  /** Whether an operator is the prospects' demo (nothing it does leaves Plazo). */
  public isDemoOperator(operatorId: string): Promise<boolean> {
    return isProspectDemoOperator(operatorId);
  }

  /** The demo operator, seeded when missing. */
  public async ensure(now: Date = new Date()): Promise<{ operatorId: string; parkingId: string }> {
    const existing = await prisma.operator.findFirst({
      where: { prospectDemo: true },
      select: { id: true, parkings: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (existing?.parkings[0]) return { operatorId: existing.id, parkingId: existing.parkings[0].id };
    if (existing) await prisma.operator.delete({ where: { id: existing.id } });
    return this.seed(now);
  }

  /** The nightly reset: everything of the demo goes (cascades), then a fresh one. Never throws. */
  public async reset(now: Date = new Date()): Promise<boolean> {
    try {
      const existing = await prisma.operator.findFirst({ where: { prospectDemo: true }, select: { id: true } });
      if (!existing) return false;
      await prisma.operator.delete({ where: { id: existing.id } });
      forgetDemoOperators();
      await this.seed(now);
      logger.info('[Demo] The prospects’ demo was reset');
      return true;
    } catch (error) {
      logger.error(`[Demo] Reset failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async seed(now: Date): Promise<{ operatorId: string; parkingId: string }> {
    const password = await hash(randomBytes(24).toString('base64'), BCRYPT_ROUNDS);
    const grid = demoPricing(DEMO_PARKING.pricing);
    const result = await prisma.$transaction(async tx => {
      const operator = await tx.operator.create({
        data: {
          name: DEMO_OPERATOR_NAME,
          slug: DEMO_OPERATOR_SLUG,
          prospectDemo: true,
          inboundSlug: await allocateInboundSlug(tx, DEMO_OPERATOR_SLUG),
        },
      });
      const parking = await tx.parking.create({
        data: {
          operatorId: operator.id,
          name: DEMO_PARKING.name,
          address: DEMO_PARKING.address,
          totalCapacity: DEMO_FILES.reduce((sum, f) => sum + f.capacity, 0),
          shuttleTravelMinutes: DEMO_PARKING.shuttleTravelMinutes,
          returnMeetingLabel: DEMO_PARKING.meetingPoint.label,
          returnMeetingInstructions: DEMO_PARKING.meetingPoint.instructions,
          extraDayPriceCents: grid.extraDayPriceCents,
          shuttleTracking: 'everyone',
        },
      });
      await this.locations.store(parking.id, DEMO_PARKING.location, tx);
      const meeting = DEMO_PARKING.meetingPoint.location;
      await tx.$executeRaw`
        UPDATE parkings SET "returnMeetingPoint" = ST_SetSRID(ST_MakePoint(${meeting.lng}, ${meeting.lat}), 4326) WHERE id = ${parking.id}`;
      await tx.pricingTier.createMany({ data: grid.tiers.map(t => ({ parkingId: parking.id, ...t })) });
      await tx.parkingFile.createMany({
        data: DEMO_FILES.map((f, i) => ({ parkingId: parking.id, code: f.code, capacity: f.capacity, sortOrder: i })),
      });
      for (const role of Object.keys(DEMO_STAFF) as DemoRole[]) {
        const member = DEMO_STAFF[role];
        await tx.staff.create({
          data: {
            operatorId: operator.id,
            email: member.email,
            ...namesOf(member),
            role,
            password,
            emailVerifiedAt: now,
            bookingNotify: defaultBookingNotify(role),
          },
        });
      }
      await tx.shuttleVehicle.createMany({ data: DEMO_VEHICLES.map(v => ({ operatorId: operator.id, ...v })) });
      const today = localDate(now, 'Europe/Paris');
      const monthStart = `${today.slice(0, 8)}01`;
      await tx.comparatorCommission.createMany({
        data: DEMO_COMMISSIONS.map(c => ({ operatorId: operator.id, ...c, effectiveFrom: monthStart })),
      });
      // A few comparators' bookings of the coming days, two of them without a price (« Sans prix »).
      const bookings = [
        { detail: 'Allopark', ref: 'AL-900000101', first: 'Camille', last: 'Martin', plate: 'AB-123-CD', inDays: 2, nights: 5, price: 5400 },
        { detail: 'Allopark', ref: 'AL-900000102', first: 'Julien', last: 'Petit', plate: 'GH-456-JK', inDays: 3, nights: 7, price: 6900 },
        { detail: 'Onepark', ref: '5900101', first: 'Sarah', last: 'Leroy', plate: 'LM-789-NP', inDays: 4, nights: 3, price: null },
        { detail: 'Onepark', ref: '5900102', first: 'Thomas', last: 'Roux', plate: 'QR-321-ST', inDays: 5, nights: 10, price: null },
        { detail: 'Parclick', ref: 'PK90010', first: 'Inès', last: 'Moreau', plate: 'UV-654-WX', inDays: 6, nights: 4, price: 4200 },
      ];
      for (const [i, b] of bookings.entries()) {
        const arrivalAt = new Date(now.getTime() + b.inDays * DAY + (i % 3) * 3600000);
        await tx.reservation.create({
          data: {
            reference: newReference(),
            operatorId: operator.id,
            parkingId: parking.id,
            channel: 'aggregator',
            channelDetail: b.detail,
            externalReference: b.ref,
            arrivalAt,
            returnAt: new Date(arrivalAt.getTime() + b.nights * DAY),
            passengers: 2,
            ...customerNamesOf({ customerFirstName: b.first, customerLastName: b.last }),
            customerPhone: '06 39 98 00 0' + String(i + 1),
            plate: b.plate,
            plateKey: plateKey(b.plate),
            priceCents: b.price,
            importedPriceCents: b.price,
            createdAt: new Date(now.getTime() - (i + 1) * DAY),
          },
        });
      }
      return { operatorId: operator.id, parkingId: parking.id };
    });
    return result;
  }

  // ---------------------------------------------------------------- entering (A + B)

  /** What the entry page shows for a link: valid, expired or unknown. */
  public async linkStatus(token: string): Promise<{ status: 'valid' | 'expired' | 'unknown'; companyName: string | null }> {
    if (!DEMO_TOKEN_RE.test(token)) return { status: 'unknown', companyName: null };
    const link = await prisma.demoLink.findUnique({ where: { token }, include: { prospect: { select: { companyName: true } } } });
    if (!link) return { status: 'unknown', companyName: null };
    return { status: link.expiresAt.getTime() <= Date.now() ? 'expired' : 'valid', companyName: link.prospect?.companyName ?? null };
  }

  /**
   * Opens the demo in a role: a session of that demo member (no password), like a sign-in. With a prospect's link: the
   * link must be valid, its opens are counted. 400 `invalid_role`, 404 `demo_link_unknown`, 410 `demo_link_expired`.
   */
  public async enter(input: { role?: unknown; token?: unknown }, metadata: { userAgent: string | null }, now: Date = new Date()) {
    if (!isDemoRole(input.role)) throw new HttpException(httpStatus.BAD_REQUEST, 'Unknown demo role', 'invalid_role');
    if (input.token !== undefined && input.token !== null && input.token !== '') {
      const token = String(input.token);
      const link = DEMO_TOKEN_RE.test(token) ? await prisma.demoLink.findUnique({ where: { token } }) : null;
      if (!link) throw new HttpException(httpStatus.NOT_FOUND, 'Unknown demo link', 'demo_link_unknown');
      if (link.expiresAt.getTime() <= now.getTime()) throw new HttpException(httpStatus.GONE, 'This demo link has expired', 'demo_link_expired');
      await prisma.demoLink.update({ where: { id: link.id }, data: { opens: { increment: 1 }, lastOpenedAt: now } });
    }
    await this.ensure(now);
    const member = await prisma.staff.findUnique({ where: { email: DEMO_STAFF[input.role].email }, include: { operator: true } });
    if (!member || !member.operator.prospectDemo)
      throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The demo is not ready', 'demo_unavailable');
    await prisma.staff.update({ where: { id: member.id }, data: { lastLoginAt: now, post: input.role, postSetAt: now } });
    const tokenData = await this.tokens.generateAuthTokens(member.id, { userAgent: metadata.userAgent, demo: 'true' });
    const { operator, ...staff } = member;
    const actor: AuthenticatedStaff = { ...staff, post: input.role, postSetAt: now, operatorName: operator.name, demo: true };
    return { tokenData, user: await this.staff.sessionUser(actor) };
  }

  // ---------------------------------------------------------------- prospects' links (C)

  public linkUrl(token: string): string {
    return this.notifications.siteUrl(`/pro/demo/${token}`) ?? `/pro/demo/${token}`;
  }

  private view(link: { token: string; expiresAt: Date; opens: number; lastOpenedAt: Date | null }, now: Date): DemoLinkView {
    return {
      url: this.linkUrl(link.token),
      expiresAt: link.expiresAt.toISOString(),
      expired: link.expiresAt.getTime() <= now.getTime(),
      opens: link.opens,
      lastOpenedAt: link.lastOpenedAt?.toISOString() ?? null,
    };
  }

  /** The prospects' links, by prospect id. */
  public async linksOf(prospectIds: string[], now: Date = new Date()): Promise<Map<string, DemoLinkView>> {
    if (!prospectIds.length) return new Map();
    const links = await prisma.demoLink.findMany({ where: { prospectId: { in: prospectIds } } });
    return new Map(links.map(l => [l.prospectId!, this.view(l, now)]));
  }

  /** « Créer un lien de démo » from Plateforme › Prospection: 404 for an unknown prospect. */
  public async linkForProspect(prospectId: string, createdById: string, options: { renew?: boolean } = {}): Promise<DemoLinkView> {
    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId }, select: { id: true } });
    if (!prospect) throw new HttpException(httpStatus.NOT_FOUND, 'Prospect not found', 'not_found');
    return this.linkFor(prospectId, createdById, options);
  }

  /**
   * « Créer un lien de démo »: a new link for 14 days (an expired one is replaced, a valid one is kept unless `renew`).
   * Also used when a prospecting mail says {lien_demo}.
   */
  public async linkFor(
    prospectId: string,
    createdById: string | null,
    options: { renew?: boolean } = {},
    now: Date = new Date(),
  ): Promise<DemoLinkView> {
    const existing = await prisma.demoLink.findUnique({ where: { prospectId } });
    if (existing && existing.expiresAt.getTime() > now.getTime() && !options.renew) return this.view(existing, now);
    const data = { token: demoLinkToken(), expiresAt: new Date(now.getTime() + DEMO_LINK_DAYS * DAY), opens: 0, lastOpenedAt: null, createdById };
    const link = existing
      ? await prisma.demoLink.update({ where: { id: existing.id }, data })
      : await prisma.demoLink.create({ data: { ...data, prospectId } });
    return this.view(link, now);
  }
}
