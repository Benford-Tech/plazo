import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, isPlatformAdmin, joinCodeSecret } from '@/config';
import prisma, { Prisma } from '@/database';
import { formatJoinCode, joinCodeFor, joinCodeValidUntil } from '@/domain/join-code';
import { JoinableRole } from '@/domain/join-request';
import { defaultBookingNotify, effectivePost } from '@/domain/roles';
import { fullName } from '@/domain/staff-name';
import { localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { joinRequestView } from './onboarding.service';
import { operatorTimezone } from './operator-timezone';
import { signInMethods, toPublicStaff } from './staff.service';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Request not found', 'not_found');
const closed = () => new HttpException(httpStatus.CONFLICT, 'This request is no longer waiting', 'join_request_closed');
const emailTaken = () => new HttpException(httpStatus.CONFLICT, 'This email is already used by a Plazo account', 'email_taken');

/** Identities never linked to a member, and with no request lately, are forgotten after this many days. */
const UNLINKED_IDENTITY_DAYS = 30;
/** Join attempts (wrong codes counted for the limits) are kept a week. */
const JOIN_ATTEMPT_DAYS = 7;

/**
 * The managers' side of « Rejoindre un parking » (13/10/2026): the code of the day to hand to a new recruit, the
 * requests waiting, accepting one (the member is created with the role chosen) or refusing it. Every query is scoped to
 * the manager's operator.
 */
@Service()
export class JoinRequestService {
  public audit = Container.get(AuditService);

  /** GET /internal/staff/join-code: today's code, until the next local midnight (also in consultation). */
  public async joinCode(actor: AuthenticatedStaff, now = new Date()) {
    const timezone = await operatorTimezone(actor.operatorId);
    const day = localDate(now, timezone);
    const operator = await prisma.operator.findUniqueOrThrow({
      where: { id: actor.operatorId },
      select: { name: true, status: true, archivedAt: true, isDemo: true },
    });
    return {
      code: formatJoinCode(joinCodeFor(joinCodeSecret(), actor.operatorId, day)),
      day,
      validUntil: joinCodeValidUntil(day, timezone).toISOString(),
      operatorName: operator.name,
      // A suspended, archived or demo operator's code is never accepted.
      accepting: operator.status === 'active' && !operator.archivedAt && !operator.isDemo,
    };
  }

  /** GET /internal/staff/join-requests: the requests waiting, oldest first. */
  public async list(actor: AuthenticatedStaff, now = new Date()) {
    const requests = await prisma.staffJoinRequest.findMany({
      where: { operatorId: actor.operatorId, status: 'pending', expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' },
      include: { identity: { select: { provider: true, isPrivateEmail: true } } },
    });
    return {
      data: requests.map(r => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        isPrivateEmail: r.identity.isPrivateEmail,
        provider: r.identity.provider,
        wishedRole: r.wishedRole,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
      })),
    };
  }

  /** For the dashboard's « À traiter »: how many requests wait, and the oldest one's name. */
  public async pendingSummary(operatorId: string, now = new Date()) {
    const where = { operatorId, status: 'pending' as const, expiresAt: { gt: now } };
    const [count, oldest] = await Promise.all([
      prisma.staffJoinRequest.count({ where }),
      prisma.staffJoinRequest.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { firstName: true, lastName: true, createdAt: true } }),
    ]);
    return { count, oldest };
  }

  private async pendingOf(actor: AuthenticatedStaff, requestId: string, now: Date) {
    const request = await prisma.staffJoinRequest.findFirst({ where: { id: requestId, operatorId: actor.operatorId }, include: { identity: true } });
    if (!request) throw notFound();
    if (request.status !== 'pending' || request.expiresAt <= now) throw closed();
    return request;
  }

  /**
   * POST /internal/staff/join-requests/:id/accept: creates the member (the request's email and names, the role chosen,
   * a random password nobody knows: they sign in with Apple or Google), links the identity and closes the request.
   */
  public async accept(actor: AuthenticatedStaff, requestId: string, role: JoinableRole) {
    const now = new Date();
    const request = await this.pendingOf(actor, requestId, now);
    if (request.identity.staffId) throw closed();
    if (await prisma.staff.findUnique({ where: { email: request.email }, select: { id: true } })) throw emailTaken();
    const password = await hash(randomBytes(32).toString('base64url'), BCRYPT_ROUNDS);
    try {
      const staff = await prisma.$transaction(async tx => {
        const claimed = await tx.staffJoinRequest.updateMany({
          where: { id: request.id, status: 'pending', expiresAt: { gt: now } },
          data: { status: 'accepted', role, decidedById: actor.id, decidedAt: now },
        });
        if (!claimed.count) throw closed();
        const created = await tx.staff.create({
          data: {
            operatorId: actor.operatorId,
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName,
            name: fullName(request.firstName, request.lastName),
            role,
            password,
            passwordSetAt: null,
            // A platform owner's address never becomes verified through a join (the platform tools need a proven email).
            emailVerifiedAt: request.identity.emailVerified && !isPlatformAdmin(request.email) ? now : null,
            bookingNotify: defaultBookingNotify(role),
          },
        });
        await tx.staffJoinRequest.update({ where: { id: request.id }, data: { staffId: created.id } });
        const linked = await tx.staffIdentity.updateMany({ where: { id: request.identityId, staffId: null }, data: { staffId: created.id } });
        if (!linked.count) throw closed();
        await this.audit.record(
          actor,
          { action: 'staff.joined', entityType: 'staff', entityId: created.id, details: { via: 'join_code', role, requestId: request.id } },
          tx,
        );
        return created;
      });
      return {
        staff: {
          ...toPublicStaff(staff),
          effectivePost: effectivePost(staff),
          vehicle: null,
          signIn: signInMethods(staff, [request.identity.provider]),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw emailTaken();
      throw error;
    }
  }

  /** POST /internal/staff/join-requests/:id/refuse. */
  public async refuse(actor: AuthenticatedStaff, requestId: string) {
    const now = new Date();
    const request = await this.pendingOf(actor, requestId, now);
    const refused = await prisma.staffJoinRequest.updateMany({
      where: { id: request.id, status: 'pending', expiresAt: { gt: now } },
      data: { status: 'refused', decidedById: actor.id, decidedAt: now },
    });
    if (!refused.count) throw closed();
    await this.audit.record(actor, { action: 'staff.join_refused', entityType: 'join_request', entityId: request.id });
    const updated = await prisma.staffJoinRequest.findUniqueOrThrow({ where: { id: request.id }, include: { operator: { select: { name: true } } } });
    return { request: joinRequestView(updated, now) };
  }

  /**
   * Nightly purge: pending requests past their 7 days become expired, join attempts go after 7 days, and identities
   * never linked to a member (or unlinked since) with no request lately go after 30 days of inactivity, unless an
   * onboarding session of theirs is still valid (e.g. just after « Quitter ce parking »).
   */
  public async purge(now = new Date()) {
    const { count: requestsExpired } = await prisma.staffJoinRequest.updateMany({
      where: { status: 'pending', expiresAt: { lte: now } },
      data: { status: 'expired' },
    });
    const { count: joinAttemptsDeleted } = await prisma.joinAttempt.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - JOIN_ATTEMPT_DAYS * 86_400_000) } },
    });
    const idleSince = new Date(now.getTime() - UNLINKED_IDENTITY_DAYS * 86_400_000);
    const { count: identitiesDeleted } = await prisma.staffIdentity.deleteMany({
      where: {
        staffId: null,
        OR: [{ lastSignInAt: null, createdAt: { lt: idleSince } }, { lastSignInAt: { lt: idleSince } }],
        joinRequests: { none: { OR: [{ status: 'pending' }, { updatedAt: { gte: idleSince } }] } },
        tokens: { none: { expiresAt: { gt: now } } },
      },
    });
    return { requestsExpired, joinAttemptsDeleted, identitiesDeleted };
  }
}
