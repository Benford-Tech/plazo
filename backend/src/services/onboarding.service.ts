import { timingSafeEqual } from 'crypto';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { identityProviders, JOIN_FAILURE_LIMITS, JOIN_REQUEST_TTL_DAYS, joinCodeSecret } from '@/config';
import prisma, { Prisma, StaffIdentity, StaffJoinRequest } from '@/database';
import { joinCodeFor, normalizeJoinCode } from '@/domain/join-code';
import { cleanNamePart, effectiveStatus, joinRequestPush, mergedNames } from '@/domain/join-request';
import { localDate } from '@/domain/time';
import { AppleSignInDto, GoogleSignInDto, JoinParkingDto } from '@/dtos/identity.dto';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { IdentityVerificationService, VerifiedIdentity } from './identity-verification.service';
import { DEFAULT_TIMEZONE } from './operator-timezone';
import { PushService } from './push.service';
import { StaffService } from './staff.service';
import { TokenService } from './token.service';

/** The person signed in with Apple or Google, as the onboarding screens show them. */
export interface IdentityView {
  provider: StaffIdentity['provider'];
  email: string | null;
  isPrivateEmail: boolean;
  firstName: string;
  lastName: string;
}

/** A join request, as the person who made it sees it (« Demande envoyée », « Demande refusée »…). */
export interface JoinRequestView {
  id: string;
  status: StaffJoinRequest['status'];
  operatorName: string;
  firstName: string;
  lastName: string;
  wishedRole: StaffJoinRequest['wishedRole'];
  role: StaffJoinRequest['role'];
  createdAt: string;
  decidedAt: string | null;
  expiresAt: string;
}

type RequestWithOperator = StaffJoinRequest & { operator: { name: string } };

/** Refused, expired and cancelled requests are still shown for a week (« Demande refusée », « Taper un nouveau code »). */
const CLOSED_SHOWN_DAYS = 7;

export const identityView = (identity: StaffIdentity): IdentityView => ({
  provider: identity.provider,
  email: identity.email,
  isPrivateEmail: identity.isPrivateEmail,
  firstName: identity.firstName,
  lastName: identity.lastName,
});

export function joinRequestView(request: RequestWithOperator, now = new Date()): JoinRequestView {
  return {
    id: request.id,
    status: effectiveStatus(request, now),
    operatorName: request.operator.name,
    firstName: request.firstName,
    lastName: request.lastName,
    wishedRole: request.wishedRole,
    role: request.role,
    createdAt: request.createdAt.toISOString(),
    decidedAt: request.decidedAt?.toISOString() ?? null,
    expiresAt: request.expiresAt.toISOString(),
  };
}

const conflict = (message: string, code: string) => new HttpException(httpStatus.CONFLICT, message, code);
const suspended = () => new HttpException(httpStatus.FORBIDDEN, 'This account is suspended', 'account_suspended');
const disabled = () => new HttpException(httpStatus.FORBIDDEN, 'This account is disabled', 'account_disabled');
const invalidCode = () => new HttpException(httpStatus.BAD_REQUEST, 'This code does not work', 'join_code_invalid');

/** The address a member gets when the provider gave none (rare: Apple always gives one, possibly a relay). */
export const placeholderEmail = (identity: { id: string; provider: string }) => `${identity.provider}-${identity.id}@plazo.invalid`;

/**
 * Plazo Pro sign-in with Apple (iPhone) or Google (Android), then « Rejoindre un parking » with the daily code
 * (13/10/2026). An identity linked to an active member signs in like a password login; otherwise it gets a short
 * onboarding session to send a join request, wait for a manager's answer, then open its staff session.
 */
@Service()
export class OnboardingService {
  public verification = Container.get(IdentityVerificationService);
  public tokens = Container.get(TokenService);
  public audit = Container.get(AuditService);
  public push = Container.get(PushService);

  public providers() {
    return identityProviders();
  }

  public async signInWithApple(data: AppleSignInDto, metadata: { userAgent: string | null }) {
    const verified = await this.verification.verifyApple(data.identityToken, data.rawNonce);
    return this.signIn(verified, { firstName: data.givenName, lastName: data.familyName }, metadata);
  }

  public async signInWithGoogle(data: GoogleSignInDto, metadata: { userAgent: string | null }) {
    const verified = await this.verification.verifyGoogle(data.idToken);
    return this.signIn(verified, { firstName: verified.firstName, lastName: verified.lastName }, metadata);
  }

  /** Records what the provider says (a stored name is kept), then signs the member in, or opens an onboarding session. */
  public async upsertIdentity(verified: VerifiedIdentity, given: { firstName?: string | null; lastName?: string | null }, signIn = true) {
    const where = { provider_subject: { provider: verified.provider, subject: verified.subject } };
    const existing = await prisma.staffIdentity.findUnique({ where });
    const names = mergedNames(existing ?? { firstName: '', lastName: '' }, given);
    const contact = verified.email ? { email: verified.email, emailVerified: verified.emailVerified, isPrivateEmail: verified.isPrivateEmail } : {};
    const seen = signIn ? { lastSignInAt: new Date() } : {};
    return prisma.staffIdentity.upsert({
      where,
      create: { provider: verified.provider, subject: verified.subject, ...contact, ...names, ...seen },
      update: { ...contact, ...names, ...seen },
    });
  }

  private async signIn(
    verified: VerifiedIdentity,
    given: { firstName?: string | null; lastName?: string | null },
    metadata: { userAgent: string | null },
  ) {
    const identity = await this.upsertIdentity(verified, given);
    if (identity.staffId) {
      const member = await this.openStaffSession(identity, metadata);
      if (member) return { status: 'signed_in' as const, ...member };
    }
    const token = await this.tokens.generateOnboardingToken(identity.id);
    return {
      status: 'onboarding' as const,
      onboardingToken: token.onboardingToken,
      expiresAt: token.expiresAt,
      identity: identityView(identity),
      request: await this.currentRequest(identity),
    };
  }

  /** The staff session of the member an identity is linked to (null when the member row is gone). */
  private async openStaffSession(identity: StaffIdentity, metadata: { userAgent: string | null }) {
    if (!identity.staffId) return null;
    const staff = await prisma.staff.findUnique({ where: { id: identity.staffId }, include: { operator: true } });
    if (!staff) return null;
    if (staff.operator.status !== 'active') throw suspended();
    if (!staff.isActive) throw disabled();
    await prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
    const tokenData = await this.tokens.generateAuthTokens(staff.id, metadata);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { operator, ...rest } = staff;
    return { tokenData, user: await Container.get(StaffService).sessionUser({ ...rest, operatorName: operator.name }) };
  }

  /**
   * The request the onboarding screens show: the pending one, an answer or an expiry of the last 7 days, or the
   * accepted one while the identity is the member it created (the waiting screen then opens the session).
   */
  public async currentRequest(identity: StaffIdentity, now = new Date()): Promise<JoinRequestView | null> {
    const latest = await prisma.staffJoinRequest.findFirst({
      where: { identityId: identity.id },
      orderBy: { createdAt: 'desc' },
      include: { operator: { select: { name: true } } },
    });
    if (!latest) return null;
    const status = effectiveStatus(latest, now);
    if (status === 'pending') return joinRequestView(latest, now);
    if (status === 'accepted') return identity.staffId && latest.staffId === identity.staffId ? joinRequestView(latest, now) : null;
    const closedAt = status === 'expired' ? latest.expiresAt : (latest.decidedAt ?? latest.updatedAt);
    return closedAt.getTime() >= now.getTime() - CLOSED_SHOWN_DAYS * 86_400_000 ? joinRequestView(latest, now) : null;
  }

  /** GET /internal/auth/onboarding (polled by the waiting screen). */
  public async state(identity: StaffIdentity) {
    return { identity: identityView(identity), request: await this.currentRequest(identity) };
  }

  /** Pending requests past their 7 days become expired (also done every night), so that a new one can be made. */
  private async expireLapsed(identityId: string, now = new Date()) {
    await prisma.staffJoinRequest.updateMany({ where: { identityId, status: 'pending', expiresAt: { lte: now } }, data: { status: 'expired' } });
  }

  /** Too many wrong codes typed lately, by this identity or from this address: 429 (counted in the database). */
  private async checkAttempts(identityId: string, ipKey: string, now = new Date()) {
    const since = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
    const { identityShort, identityDay, ip } = JOIN_FAILURE_LIMITS;
    const [short, day, address] = await Promise.all([
      prisma.joinAttempt.count({ where: { identityId, success: false, createdAt: { gt: since(identityShort.minutes) } } }),
      prisma.joinAttempt.count({ where: { identityId, success: false, createdAt: { gt: since(identityDay.minutes) } } }),
      prisma.joinAttempt.count({ where: { ipKey, success: false, createdAt: { gt: since(ip.minutes) } } }),
    ]);
    if (short >= identityShort.max || day >= identityDay.max || address >= ip.max) {
      throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Too many attempts, try again later', 'too_many_attempts');
    }
  }

  /**
   * The operator whose code of the day this is, among those that accept codes (active, not archived, not a demo).
   * Every operator's code is compared in constant time; yesterday's code no longer matches (strict local midnight).
   */
  public async operatorForCode(code: string, now = new Date()) {
    const operators = await prisma.operator.findMany({
      where: { status: 'active', archivedAt: null, isDemo: false },
      select: { id: true, name: true, parkings: { orderBy: { createdAt: 'asc' }, take: 1, select: { timezone: true } } },
    });
    const secret = joinCodeSecret();
    const typed = Buffer.from(code);
    let found: { id: string; name: string } | null = null;
    for (const operator of operators) {
      const expected = Buffer.from(joinCodeFor(secret, operator.id, localDate(now, operator.parkings[0]?.timezone ?? DEFAULT_TIMEZONE)));
      if (expected.length === typed.length && timingSafeEqual(expected, typed) && !found) found = { id: operator.id, name: operator.name };
    }
    return found;
  }

  /** POST /internal/auth/onboarding/join: « Envoyer ma demande ». */
  public async join(identity: StaffIdentity, data: JoinParkingDto, ipKey: string) {
    const now = new Date();
    await this.checkAttempts(identity.id, ipKey, now);
    // One parking per account: leave it first (« Quitter ce parking »).
    if (identity.staffId) throw conflict('This account is already a member of a parking', 'already_member');
    await this.expireLapsed(identity.id, now);
    if (await prisma.staffJoinRequest.count({ where: { identityId: identity.id, status: 'pending' } })) {
      throw conflict('A request is already waiting for a manager', 'join_request_pending');
    }

    const code = normalizeJoinCode(data.code);
    const operator = code ? await this.operatorForCode(code, now) : null;
    await prisma.joinAttempt.create({ data: { identityId: identity.id, ipKey, success: !!operator } });
    // The same answer for an unknown, expired, suspended, archived or demo operator's code.
    if (!operator) throw invalidCode();

    const email = identity.email ?? placeholderEmail(identity);
    if (await prisma.staff.findUnique({ where: { email }, select: { id: true } })) {
      throw conflict('This email is already used by a Plazo account', 'email_taken');
    }
    const firstName = cleanNamePart(data.firstName);
    const lastName = cleanNamePart(data.lastName);
    let request: RequestWithOperator;
    try {
      request = await prisma.staffJoinRequest.create({
        data: {
          operatorId: operator.id,
          identityId: identity.id,
          firstName,
          lastName,
          email,
          wishedRole: data.wishedRole,
          expiresAt: dayjs(now).add(JOIN_REQUEST_TTL_DAYS, 'days').toDate(),
        },
        include: { operator: { select: { name: true } } },
      });
    } catch (error) {
      // Two requests sent at the same moment: the partial unique index keeps one.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('A request is already waiting for a manager', 'join_request_pending');
      }
      throw error;
    }
    // The names typed prefill the next requests (Apple gives them only once).
    if (!identity.firstName || !identity.lastName) {
      await prisma.staffIdentity.update({
        where: { id: identity.id },
        data: { firstName: identity.firstName || firstName, lastName: identity.lastName || lastName },
      });
    }
    await this.audit.record(
      { id: null, operatorId: operator.id },
      { action: 'staff.join_requested', entityType: 'join_request', entityId: request.id, details: { wishedRole: data.wishedRole } },
    );
    await this.push.notifyStaff(
      operator.id,
      'team',
      joinRequestPush({ firstName, lastName, operatorName: operator.name, wishedRole: data.wishedRole }),
      { data: { type: 'join_request', requestId: request.id }, collapseId: `join-request-${request.id}`, ttl: 12 * 3600 },
    );
    return { request: joinRequestView(request, now) };
  }

  /** POST /internal/auth/onboarding/session: the staff session, once a manager accepted the request. */
  public async session(identity: StaffIdentity, metadata: { userAgent: string | null }) {
    const member = await this.openStaffSession(identity, metadata);
    if (member) {
      // The onboarding is over: its tokens go (the app keeps the staff session only).
      await this.tokens.revokeOnboardingTokensOf(identity.id);
      await prisma.staffIdentity.update({ where: { id: identity.id }, data: { lastSignInAt: new Date() } });
      return member;
    }
    await this.expireLapsed(identity.id);
    if (await prisma.staffJoinRequest.count({ where: { identityId: identity.id, status: 'pending' } })) {
      throw conflict('The request is still waiting for a manager', 'join_request_pending');
    }
    throw conflict('This account is not a member of a parking', 'not_member');
  }

  /** DELETE /internal/auth/onboarding/request: « Annuler la demande ». */
  public async cancelRequest(identity: StaffIdentity) {
    const now = new Date();
    const pending = await prisma.staffJoinRequest.findFirst({ where: { identityId: identity.id, status: 'pending', expiresAt: { gt: now } } });
    const cancelled = pending
      ? await prisma.staffJoinRequest.updateMany({ where: { id: pending.id, status: 'pending' }, data: { status: 'cancelled' } })
      : { count: 0 };
    if (!pending || !cancelled.count) throw conflict('No request is waiting', 'join_request_closed');
    await this.audit.record(
      { id: null, operatorId: pending.operatorId },
      { action: 'staff.join_cancelled', entityType: 'join_request', entityId: pending.id },
    );
    const request = await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: pending.id }, include: { operator: { select: { name: true } } } });
    return { request: joinRequestView(request, now) };
  }

  /** POST /internal/auth/onboarding/logout: « Utiliser un autre compte ». */
  public async logout(tokenUid: string) {
    await this.tokens.revokeOnboardingToken(tokenUid);
  }

  /**
   * DELETE /internal/auth/onboarding: « Supprimer mon compte » before joining. The identity, its sessions and requests
   * are deleted; with Apple's fresh authorization code, Plazo is first removed from the person's Apple account.
   */
  public async deleteIdentity(identity: StaffIdentity, authorizationCode?: string) {
    if (identity.staffId) throw conflict('This account is a member of a parking: delete it from « Mon compte »', 'already_member');
    if (identity.provider === 'apple' && authorizationCode) {
      const { subject } = await this.verification.revokeApple(authorizationCode);
      if (subject !== identity.subject)
        throw new HttpException(httpStatus.UNAUTHORIZED, 'The Apple confirmation is for another account', 'reauth_failed');
    }
    await prisma.staffIdentity.delete({ where: { id: identity.id } });
  }
}
