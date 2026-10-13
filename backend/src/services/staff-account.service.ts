import { compare, hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, isPlatformAdmin } from '@/config';
import prisma, { IdentityProvider, Prisma, Staff } from '@/database';
import { DELETED_ACCOUNT_NAME, deletedEmail, leftEmail } from '@/domain/join-request';
import { DeleteAccountDto, LinkAppleDto } from '@/dtos/identity.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { IdentityVerificationService, VerifiedIdentity } from './identity-verification.service';
import { identityView, OnboardingService } from './onboarding.service';
import { StaffService } from './staff.service';
import { TokenService } from './token.service';

const conflict = (message: string, code: string) => new HttpException(httpStatus.CONFLICT, message, code);
const reauthFailed = () => new HttpException(httpStatus.UNAUTHORIZED, 'The confirmation could not be verified', 'reauth_failed');
const platformAccount = () => new HttpException(httpStatus.FORBIDDEN, "The platform owner's account cannot be removed", 'cannot_delete_platform');

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
    return this.link(actor, await this.verification.verifyApple(data.identityToken, data.rawNonce));
  }

  public async linkGoogle(actor: AuthenticatedStaff, idToken: string) {
    return this.link(actor, await this.verification.verifyGoogle(idToken));
  }

  /** Links an Apple / Google identity to the member: one per provider, never one already linked to someone else. */
  private async link(actor: AuthenticatedStaff, verified: VerifiedIdentity) {
    const existing = await prisma.staffIdentity.findUnique({
      where: { provider_subject: { provider: verified.provider, subject: verified.subject } },
    });
    if (existing?.staffId && existing.staffId !== actor.id) throw conflict('This identity is linked to another account', 'identity_taken');
    const mine = await prisma.staffIdentity.findFirst({ where: { staffId: actor.id, provider: verified.provider } });
    if (mine) throw conflict('An identity of this provider is already linked', 'already_linked');
    try {
      const identity = await this.onboarding.upsertIdentity(verified, { firstName: actor.firstName, lastName: actor.lastName }, false);
      await prisma.$transaction([
        prisma.staffIdentity.update({ where: { id: identity.id }, data: { staffId: actor.id } }),
        // A request it was waiting with is no longer needed, nor its onboarding sessions.
        prisma.staffJoinRequest.updateMany({ where: { identityId: identity.id, status: 'pending' }, data: { status: 'cancelled' } }),
        prisma.identityToken.deleteMany({ where: { identityId: identity.id } }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('An identity of this provider is already linked', 'already_linked');
      }
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
    const identities = await prisma.staffIdentity.findMany({ where: { staffId: actor.id } });
    const identity = identities.find(i => i.provider === provider);
    if (!identity) throw notLinked();
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id }, select: { passwordSetAt: true } });
    if (!me.passwordSetAt && identities.length <= 1) {
      throw conflict('This is the only way left to sign in', 'sign_in_required');
    }
    await prisma.staffIdentity.update({ where: { id: identity.id }, data: { staffId: null } });
    await this.audit.record(actor, { action: 'staff.identity_unlinked', entityType: 'staff', entityId: actor.id, details: { provider } });
    return { user: await this.staffService().sessionUser(actor) };
  }

  /** A shuttle trip of the person still running: they end it first. */
  private async refuseWhileDriving(staffId: string) {
    if (await prisma.shuttleTrip.count({ where: { driverId: staffId, status: 'running', expiresAt: { gt: new Date() } } })) {
      throw conflict('A shuttle trip of yours is running: end it first', 'trip_running');
    }
  }

  /** Everything that lets the person act as a member: sessions, links, phones, the vehicle of the day, the usual shuttle. */
  private async detach(tx: Prisma.TransactionClient, staffId: string) {
    await tx.staffToken.deleteMany({ where: { staffId } });
    await tx.accountToken.deleteMany({ where: { staffId } });
    await tx.staffDevice.deleteMany({ where: { staffId } });
    await tx.shuttleVehicle.updateMany({ where: { driverId: staffId }, data: { driverId: null } });
  }

  /**
   * « Quitter ce parking »: the member becomes inactive with their address freed (left-<id>@plazo.invalid; the names stay,
   * they are in the parking's records), signed out everywhere, and their identities unlinked. When they have one, an
   * onboarding session is returned so that the app goes straight to « Rejoindre un parking ».
   */
  public async leave(actor: AuthenticatedStaff) {
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (isPlatformAdmin(me.email)) throw platformAccount();
    if (me.role === 'manager' && me.isActive) {
      const managers = await prisma.staff.count({ where: { operatorId: me.operatorId, role: 'manager', isActive: true } });
      if (managers <= 1) throw conflict('At least one active manager is required', 'last_manager');
    }
    await this.refuseWhileDriving(me.id);
    const identities = await prisma.staffIdentity.findMany({
      where: { staffId: me.id },
      orderBy: [{ lastSignInAt: { sort: 'desc', nulls: 'last' } }],
    });
    await prisma.$transaction(async tx => {
      await tx.staff.update({
        where: { id: me.id },
        data: { isActive: false, leftAt: new Date(), email: leftEmail(me.id), post: null, postSetAt: null, vehicleId: null, vehicleSetAt: null },
      });
      await this.detach(tx, me.id);
      await tx.staffIdentity.updateMany({ where: { staffId: me.id }, data: { staffId: null } });
      await this.audit.record(
        { id: me.id, operatorId: me.operatorId },
        { action: 'staff.left', entityType: 'staff', entityId: me.id, details: { role: me.role } },
        tx,
      );
    });
    const identity = identities[0];
    if (!identity) return { onboarding: null };
    const token = await this.tokens.generateOnboardingToken(identity.id);
    return { onboarding: { onboardingToken: token.onboardingToken, expiresAt: token.expiresAt, identity: identityView(identity), request: null } };
  }

  /**
   * Checks that it is really the person: their password, or a fresh confirmation of an Apple / Google identity linked
   * to them. An Apple code is exchanged then revoked at Apple (whatever proved the identity), before anything changes.
   */
  private async reauthenticate(me: Staff, data: DeleteAccountDto, identities: Array<{ provider: IdentityProvider; subject: string }>) {
    const apple = identities.find(i => i.provider === 'apple');
    const google = identities.find(i => i.provider === 'google');
    let appleDone = false;
    if (data.password) {
      if (!me.passwordSetAt || !(await compare(data.password, me.password))) throw reauthFailed();
    } else if (data.appleAuthorizationCode) {
      if (!apple) throw reauthFailed();
      const { subject } = await this.verification.revokeApple(data.appleAuthorizationCode);
      if (subject !== apple.subject) throw reauthFailed();
      appleDone = true;
    } else if (data.googleIdToken) {
      if (!google) throw reauthFailed();
      let subject: string;
      try {
        subject = (await this.verification.verifyGoogle(data.googleIdToken)).subject;
      } catch (error) {
        if (error instanceof HttpException && error.code === 'identity_invalid') throw reauthFailed();
        throw error;
      }
      if (subject !== google.subject) throw reauthFailed();
    } else {
      throw reauthFailed();
    }
    // Proved with the password, but the app also sent Apple's code: Plazo leaves the Apple account too.
    if (!appleDone && apple && data.appleAuthorizationCode) {
      const { subject } = await this.verification.revokeApple(data.appleAuthorizationCode);
      if (subject !== apple.subject) throw reauthFailed();
    }
  }

  /**
   * « Supprimer mon compte »: the member is anonymised (« Compte supprimé »: trips and reservations handled stay in the
   * parking's history), their sessions, links, phones and identities deleted. The last manager may delete their
   * account (the app warns them); a platform owner's account cannot be deleted.
   */
  public async deleteAccount(actor: AuthenticatedStaff, data: DeleteAccountDto) {
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (isPlatformAdmin(me.email)) throw platformAccount();
    await this.refuseWhileDriving(me.id);
    const identities = await prisma.staffIdentity.findMany({ where: { staffId: me.id }, select: { provider: true, subject: true } });
    await this.reauthenticate(me, data, identities);
    const password = await hash(randomBytes(32).toString('base64url'), BCRYPT_ROUNDS);
    await prisma.$transaction(async tx => {
      await tx.staff.update({
        where: { id: me.id },
        data: {
          firstName: '',
          lastName: '',
          name: DELETED_ACCOUNT_NAME,
          email: deletedEmail(me.id),
          phone: null,
          password,
          passwordSetAt: null,
          emailVerifiedAt: null,
          isActive: false,
          deletedAt: new Date(),
          post: null,
          postSetAt: null,
          vehicleId: null,
          vehicleSetAt: null,
        },
      });
      await this.detach(tx, me.id);
      // The identities go with their sessions and requests; a request that named the member (identity unlinked since) too.
      await tx.staffIdentity.deleteMany({ where: { staffId: me.id } });
      await tx.staffJoinRequest.deleteMany({ where: { staffId: me.id } });
      await this.audit.record(
        { id: me.id, operatorId: me.operatorId },
        { action: 'staff.deleted', entityType: 'staff', entityId: me.id, details: { role: me.role } },
        tx,
      );
    });
  }
}
