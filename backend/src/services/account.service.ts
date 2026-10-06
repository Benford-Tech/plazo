import { hash } from 'bcrypt';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, EMAIL_VERIFICATION_TTL_HOURS, INVITATION_TTL_DAYS, PRODUCT_NAME } from '@/config';
import prisma from '@/database';
import { existingAccountEmail, invitationEmail, verificationEmail } from '@/domain/account-messages';
import { AcceptInvitationDto, SignupDto } from '@/dtos/auth.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AccountTokenService } from './account-token.service';
import { AuditService } from './audit.service';
import { normalizeEmail } from './auth.service';
import { NotificationService } from './notification.service';
import { OperatorService } from './operator.service';
import { toSessionUser } from './staff.service';
import { TokenService } from './token.service';

const HOUR_MS = 3600 * 1000;
export const VERIFICATION_TTL_MS = EMAIL_VERIFICATION_TTL_HOURS * HOUR_MS;
export const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * HOUR_MS;

// The same answer whether the email was new or not, and whether the request was a bot's.
const SIGNUP_ACCEPTED = 'If this email has no account yet, it was created: you can log in. Check your inbox to confirm the email.';

const invalidLink = () => new HttpException(httpStatus.BAD_REQUEST, 'This link is invalid, expired or already used', 'invalid_link');

/** Development only: links that could not be emailed are returned to the caller, never in production. */
function devLinksAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Operators' own accounts: self sign-up with email verification, and the invitation sent by the
 * platform (set one's password). Emails go through Brevo; links are single use and stored hashed.
 */
@Service()
export class AccountService {
  public operators = Container.get(OperatorService);
  public accountTokens = Container.get(AccountTokenService);
  public notifications = Container.get(NotificationService);
  public tokens = Container.get(TokenService);
  public audit = Container.get(AuditService);

  // ---- Sign-up ----------------------------------------------------------------------------------

  /**
   * Creates the operator, its parking (with a draft Plazo page at the chosen airport) and its
   * manager, whose email is still to confirm. Answers the same when the email already has an
   * account (that person gets an email instead) or when the honeypot is filled (nothing happens).
   */
  public async signup(data: SignupDto): Promise<{ message: string; devVerificationUrl?: string }> {
    if (data.password !== data.passwordConfirmation) throw new ValidationException({ passwordConfirmation: 'password_mismatch' });
    const airport = await prisma.airport.findUnique({ where: { code: data.airportCode } });
    if (!airport) throw new ValidationException({ airportCode: 'unknown_airport' });

    const accepted = { message: SIGNUP_ACCEPTED };
    if (data.website?.trim()) {
      // Same cost as a real sign-up, so that the answer time says nothing either.
      await hash(data.password, BCRYPT_ROUNDS);
      logger.info('[Signup] Honeypot filled: nothing created');
      return accepted;
    }

    const email = normalizeEmail(data.email);
    const existing = await prisma.staff.findUnique({ where: { email }, select: { id: true, name: true } });
    if (existing) return this.signupWithTakenEmail(existing, email, data.password);

    let created;
    try {
      created = await this.operators.createWithManager({
        operatorName: data.companyName,
        parkingName: data.parkingName,
        totalCapacity: data.totalCapacity,
        managerFirstName: data.firstName,
        managerLastName: data.lastName,
        managerEmail: email,
        managerPassword: data.password,
        managerPhone: data.phone,
        emailVerified: false,
        airportId: airport.id,
      });
    } catch (error) {
      // Created by a concurrent request in between.
      if (error instanceof HttpException && error.code === 'email_taken') {
        const taken = await prisma.staff.findUnique({ where: { email }, select: { id: true, name: true } });
        if (taken) return this.signupWithTakenEmail(taken, email, null);
      }
      throw error;
    }

    const { operator, manager } = created;
    await this.audit.record(
      { id: manager.id, operatorId: operator.id },
      { action: 'operator.signed_up', entityType: 'operator', entityId: operator.id },
    );
    logger.info(`[Signup] Operator ${operator.id} created by self sign-up`);
    const link = await this.sendVerification(manager);
    return link.sent || !devLinksAllowed() ? accepted : { ...accepted, devVerificationUrl: link.url };
  }

  private async signupWithTakenEmail(staff: { id: string; name: string }, email: string, password: string | null) {
    if (password) await hash(password, BCRYPT_ROUNDS);
    await this.notifications.emailStaff(
      { email, name: staff.name },
      'signup_existing_account',
      `staff ${staff.id}`,
      existingAccountEmail(PRODUCT_NAME, { loginUrl: this.notifications.proUrl('/login') }),
    );
    logger.info(`[Signup] Email already used by staff ${staff.id}: no account created`);
    return { message: SIGNUP_ACCEPTED };
  }

  // ---- Email verification -----------------------------------------------------------------------

  private async sendVerification(staff: { id: string; email: string; name: string }): Promise<{ sent: boolean; url: string }> {
    const { token } = await this.accountTokens.issue(staff.id, 'email_verification', VERIFICATION_TTL_MS);
    // The token travels in the fragment: never sent to a server, so never in an access log.
    const url = this.notifications.proUrl(`/verifier-email#${token}`);
    const sent = await this.notifications.emailStaff(
      staff,
      'email_verification',
      `staff ${staff.id}`,
      verificationEmail(PRODUCT_NAME, { url, hours: EMAIL_VERIFICATION_TTL_HOURS }),
    );
    if (!sent) logger.info(`[Signup] Verification link generated for staff ${staff.id} (not emailed)`);
    return { sent, url };
  }

  /** A new verification link for the signed-in person (the previous one stops working). */
  public async resendVerification(actor: AuthenticatedStaff): Promise<{ alreadyVerified: boolean; devVerificationUrl?: string }> {
    const me = await prisma.staff.findUniqueOrThrow({ where: { id: actor.id } });
    if (me.emailVerifiedAt) return { alreadyVerified: true };
    const link = await this.sendVerification(me);
    return link.sent || !devLinksAllowed() ? { alreadyVerified: false } : { alreadyVerified: false, devVerificationUrl: link.url };
  }

  /** Confirms the email of the link's owner (no session needed: the link may be opened anywhere). */
  public async verifyEmail(token: string): Promise<{ verified: true }> {
    const staffId = await this.accountTokens.consume(token, 'email_verification');
    if (!staffId) throw invalidLink();
    const staff = await prisma.staff.update({ where: { id: staffId }, data: { emailVerifiedAt: new Date() } });
    await this.audit.record(
      { id: staff.id, operatorId: staff.operatorId },
      { action: 'staff.email_verified', entityType: 'staff', entityId: staff.id },
    );
    return { verified: true };
  }

  // ---- Invitations --------------------------------------------------------------------------------

  /**
   * Emails an invitation link to an invited manager (a new one cancels the previous). When the email
   * cannot go out, the link is returned so that the platform admin can pass it on.
   */
  public async sendInvitation(staff: { id: string; email: string; name: string }, operatorName: string) {
    const { token, expiresAt } = await this.accountTokens.issue(staff.id, 'invitation', INVITATION_TTL_MS);
    const url = this.notifications.proUrl(`/invitation#${token}`);
    const sent = await this.notifications.emailStaff(
      staff,
      'invitation',
      `staff ${staff.id}`,
      invitationEmail(PRODUCT_NAME, { operatorName, url, days: INVITATION_TTL_DAYS }),
    );
    return { emailSent: sent, expiresAt, ...(sent ? {} : { inviteUrl: url }) };
  }

  /** What the invitation page shows before the password is chosen. */
  public async invitation(token: string): Promise<{ email: string; operatorName: string }> {
    const row = await this.accountTokens.find(token, 'invitation');
    if (!row) throw invalidLink();
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: row.staffId }, include: { operator: true } });
    return { email: staff.email, operatorName: staff.operator.name };
  }

  /** Sets the invited manager's password (which also proves the email) and opens a session. */
  public async acceptInvitation(data: AcceptInvitationDto, metadata: { userAgent: string | null }) {
    const password = await hash(data.password, BCRYPT_ROUNDS);
    const staffId = await prisma.$transaction(async tx => {
      const id = await this.accountTokens.consume(data.token, 'invitation', tx);
      if (!id) return null;
      await tx.staff.update({ where: { id }, data: { password, emailVerifiedAt: new Date(), lastLoginAt: new Date() } });
      return id;
    });
    if (!staffId) throw invalidLink();
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: staffId }, include: { operator: true } });
    await this.tokens.revokeAll(staff.id);
    await this.audit.record(
      { id: staff.id, operatorId: staff.operatorId },
      { action: 'staff.invitation_accepted', entityType: 'staff', entityId: staff.id },
    );
    if (staff.operator.status !== 'active' || !staff.isActive) {
      throw new HttpException(httpStatus.FORBIDDEN, 'This account is suspended', 'account_suspended');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { operator, ...rest } = staff;
    return { tokenData: await this.tokens.generateAuthTokens(staff.id, metadata), user: toSessionUser({ ...rest, operatorName: operator.name }) };
  }
}
