import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { appleSignInSettings, isPlatformAdmin, REAUTH_MAX_AGE_SECONDS } from '@/config';
import prisma, { IdentityProvider, Prisma, Staff } from '@/database';
import { leftEmail } from '@/domain/join-request';
import { DeleteAccountDto, LinkAppleDto } from '@/dtos/identity.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { IdentityVerificationService, reauthFailed, VerifiedIdentity } from './identity-verification.service';
import { anonymiseMember, detachMember, formerMembersOf, unusablePassword } from './member-erasure';
import { identityView, OnboardingService } from './onboarding.service';
import { checkPasswordAttempt } from './password-attempts';
import { StaffService } from './staff.service';
import { TokenService } from './token.service';

const conflict = (message: string, code: string) => new HttpException(httpStatus.CONFLICT, message, code);
const platformAccount = () => new HttpException(httpStatus.FORBIDDEN, "The platform owner's account cannot be removed", 'cannot_delete_platform');
const identityTaken = () => conflict('This identity is linked to another account', 'identity_taken');
const alreadyLinked = () => conflict('An identity of this provider is already linked', 'already_linked');

/**
 * What a signed-in member does with their own account (13/10/2026, « Mon compte » of Plazo Pro): link or unlink Apple /
 * Google, « Quitter ce parking » and « Supprimer mon compte » (required by Apple 5.1.1(v) and Google Play). Refused in a
 * platform admin's consultation (RefuseInViewAs on the routes).
 */
@Service()
export class StaffAccountService {
  public audit = Container.get(AuditService);
  public tokens = Container.get(TokenService);
  public verification = Container.get(IdentityVerificationService);
  public onboarding = Container.get(OnboardingService);

  private staffService() {
    return Container.get(StaffService);
  }

  public async linkApple(actor: AuthenticatedStaff, data: LinkAppleDto) {
    return this.link(actor, await this.verification.verifyAppleOnce(data.identityToken, data.rawNonce));
  }

  public async linkGoogle(actor: AuthenticatedStaff, idToken: string) {
    return this.link(actor, await this.verification.verifyGoogleOnce(idToken));
  }

  /** Links an Apple / Google identity to the member: one per provider, never one already linked to someone else. */
  private async link(actor: AuthenticatedStaff, verified: VerifiedIdentity) {
    const existing = await prisma.staffIdentity.findUnique({
      where: { provider_subject: { provider: verified.provider, subject: verified.subject } },
    });
    if (existing?.staffId && existing.staffId !== actor.id) throw identityTaken();
    const mine = await prisma.staffIdentity.findFirst({ where: { staffId: actor.id, provider: verified.provider } });
    if (mine) throw alreadyLinked();
    try {
      const identity = await this.onboarding.upsertIdentity(verified, { firstName: actor.firstName, lastName: actor.lastName }, false);
      await prisma.$transaction(async tx => {
        // Only while nobody else has it: a manager may have accepted its request in the meantime.
        const linked = await tx.staffIdentity.updateMany({
          where: { id: identity.id, OR: [{ staffId: null }, { staffId: actor.id }] },
          data: { staffId: actor.id },
        });
        if (!linked.count) throw identityTaken();
        // A request it was waiting with is no longer needed, nor its onboarding sessions.
        await tx.staffJoinRequest.updateMany({ where: { identityId: identity.id, status: 'pending' }, data: { status: 'cancelled' } });
        await tx.identityToken.deleteMany({ where: { identityId: identity.id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw alreadyLinked();
      throw error;
    }
    await this.audit.record(actor, {
      action: 'staff.identity_linked',
      entityType: 'staff',
      entityId: actor.id,
      details: { provider: verified.provider },
    });
    return { user: await this.staffService().sessionUser(actor) };
  }

  /** Unlinks Apple or Google, unless it is the only way left to sign in (no password, no other identity). */
  public async unlink(actor: AuthenticatedStaff, provider: string) {
    const notLinked = () => new HttpException(httpStatus.NOT_FOUND, 'No identity of this provider is linked', 'not_found');
    if (provider !== 'apple' && provider !== 'google') throw notLinked();
    await prisma.$transaction(async tx => {
      // The member's row locked: two unlinks at the same moment (Apple and Google) cannot both leave them without a way in.
      const [me] = await tx.$queryRaw<Array<{ passwordSetAt: Date | null }>>`
        SELECT "passwordSetAt" FROM "staff" WHERE "id" = ${actor.id} FOR UPDATE`;
      const identities = await tx.staffIdentity.findMany({ where: { staffId: actor.id } });
      const identity = identities.find(i => i.provider === provider);
      if (!identity) throw notLinked();
      if (!me?.passwordSetAt && identities.length <= 1) throw conflict('This is the only way left to sign in', 'sign_in_required');
      await tx.staffIdentity.update({ where: { id: identity.id }, data: { staffId: null } });
      await this.audit.record(actor, { action: 'staff.identity_unlinked', entityType: 'staff', entityId: actor.id, details: { provider } }, tx);
    });
    return { user: await this.staffService().sessionUser(actor) };
  }

  /** A shuttle trip of the person still running: they end it first. */
  private async refuseWhileDriving(staffId: string) {
    if (await prisma.shuttleTrip.count({ where: { driverId: staffId, status: 'running', expiresAt: { gt: new Date() } } })) {
      throw conflict('A shuttle trip of yours is running: end it first', 'trip_running');
    }
  }

  /**
   * « Quitter ce parking »: the member becomes inactive with their address freed (left-<id>@plazo.invalid; the names stay,
   * they are in the parking's records; the phone goes), signed out everywhere, and their identities unlinked. When they
   * have one, an onboarding session is returned so that the app goes straight to « Rejoindre un parking ».
   */
  public async leave(actor: AuthenticatedStaff) {
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (isPlatformAdmin(me.email)) throw platformAccount();
    await this.refuseWhileDriving(me.id);
    const now = new Date();
    const identity = await prisma.$transaction(async tx => {
      if (me.role === 'manager') {
        // The operator's active managers locked: two managers leaving at the same moment cannot both pass.
        const managers = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "staff" WHERE "operatorId" = ${me.operatorId} AND "role" = 'manager' AND "isActive" = true FOR UPDATE`;
        if (managers.some(m => m.id === me.id) && managers.length <= 1) throw conflict('At least one active manager is required', 'last_manager');
      }
      const identities = await tx.staffIdentity.findMany({
        where: { staffId: me.id },
        orderBy: [{ lastSignInAt: { sort: 'desc', nulls: 'last' } }],
      });
      await tx.staff.update({
        where: { id: me.id },
        data: {
          isActive: false,
          leftAt: now,
          email: leftEmail(me.id),
          phone: null,
          post: null,
          postSetAt: null,
          vehicleId: null,
          vehicleSetAt: null,
        },
      });
      await detachMember(tx, me.id);
      // Seen now: the nightly purge of idle identities counts from here, not from the last sign-in.
      await tx.staffIdentity.updateMany({ where: { staffId: me.id }, data: { staffId: null, lastSignInAt: now } });
      await this.audit.record(
        { id: me.id, operatorId: me.operatorId },
        { action: 'staff.left', entityType: 'staff', entityId: me.id, details: { role: me.role } },
        tx,
      );
      return identities[0] ?? null;
    });
    if (!identity) return { onboarding: null };
    const token = await this.tokens.generateOnboardingToken(identity.id);
    return {
      onboarding: {
        onboardingToken: token.onboardingToken,
        expiresAt: token.expiresAt,
        identity: identityView({ ...identity, staffId: null, lastSignInAt: now }),
        request: null,
      },
    };
  }

  /**
   * Checks that it is really the person, before anything changes:
   * - an Apple identity linked (and Apple sign-in configured): only Apple's fresh authorization code does, exchanged then
   *   revoked at Apple, so that Plazo leaves the person's Apple account (409 apple_confirmation_required without it);
   * - else their password (the login's lockout applies), or a fresh Google ID token (5 minutes) of the Google identity
   *   linked to them.
   */
  private async reauthenticate(me: Staff, data: DeleteAccountDto, identities: Array<{ provider: IdentityProvider; subject: string }>) {
    const apple = identities.find(i => i.provider === 'apple');
    const google = identities.find(i => i.provider === 'google');
    if (apple && appleSignInSettings()) {
      if (!data.appleAuthorizationCode) throw conflict('Confirm with Apple to delete this account', 'apple_confirmation_required');
      await this.verification.revokeApple(data.appleAuthorizationCode, apple.subject);
      return;
    }
    if (data.password) {
      if (!(await checkPasswordAttempt(me.email, data.password, me.passwordSetAt ? me.password : null))) throw reauthFailed();
      return;
    }
    if (data.googleIdToken) {
      if (!google) throw reauthFailed();
      let subject: string;
      try {
        subject = (await this.verification.verifyGoogleOnce(data.googleIdToken, { maxAgeSeconds: REAUTH_MAX_AGE_SECONDS })).subject;
      } catch (error) {
        if (error instanceof HttpException && error.code === 'identity_invalid') throw reauthFailed();
        throw error;
      }
      if (subject !== google.subject) throw reauthFailed();
      return;
    }
    if (data.appleAuthorizationCode) {
      // Without an Apple identity it proves nothing; with one but Apple sign-in off, it cannot be checked (409).
      if (!apple) throw reauthFailed();
      await this.verification.revokeApple(data.appleAuthorizationCode, apple.subject);
      return;
    }
    throw reauthFailed();
  }

  /**
   * « Supprimer mon compte »: the member is anonymised (« Compte supprimé »: trips and reservations handled stay in the
   * parking's history), their sessions, links, phones and identities deleted, with the identities that made their join
   * requests (unlinked since) and the members they left behind with them. The last manager may delete their account
   * (the app warns them); a platform owner's account cannot be deleted.
   */
  public async deleteAccount(actor: AuthenticatedStaff, data: DeleteAccountDto) {
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (isPlatformAdmin(me.email)) throw platformAccount();
    await this.refuseWhileDriving(me.id);
    const identities = await prisma.staffIdentity.findMany({ where: { staffId: me.id }, select: { id: true, provider: true, subject: true } });
    await this.reauthenticate(me, data, identities);

    const joinedWith = await prisma.staffJoinRequest.findMany({ where: { staffId: me.id }, select: { identityId: true, email: true } });
    const identityIds = [...new Set([...identities.map(i => i.id), ...joinedWith.map(r => r.identityId)])];
    const former = await formerMembersOf(prisma, identityIds, me.id);
    const password = await unusablePassword();
    await prisma.$transaction(async tx => {
      await anonymiseMember(tx, me, password, { emails: joinedWith.map(r => r.email) });
      for (const left of former) await anonymiseMember(tx, left.member, password, { emails: left.emails });
      // An identity that made a request of theirs goes too, unless someone else has it since.
      await tx.staffIdentity.deleteMany({ where: { id: { in: identityIds }, OR: [{ staffId: null }, { staffId: me.id }] } });
      await tx.staffJoinRequest.deleteMany({ where: { staffId: me.id } });
    });
  }
}
