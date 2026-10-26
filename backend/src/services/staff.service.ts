import { nextDemoReset } from '@/domain/prospect-demo';
import { hash } from 'bcrypt';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, INVITATION_TTL_DAYS, isPlatformAdmin, PLAZO_PRO_APP_STORE_URL, PLAZO_PRO_PLAY_STORE_URL, PRODUCT_NAME } from '@/config';
import prisma, { IdentityProvider, Staff, StaffRole } from '@/database';
import { allowedPosts, can, defaultBookingNotify, effectivePost } from '@/domain/roles';
import { localDate } from '@/domain/time';
import { logger } from '@/utils/logger';
import { ChangePasswordDto, CreateStaffDto, UpdateMeDto, UpdateStaffDto } from '@/dtos/staff.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { fullName, namesOf } from '@/domain/staff-name';
import { teamInvitationEmail } from '@/domain/account-messages';
import { AccountTokenService } from './account-token.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { operatorTimezone } from './operator-timezone';
import { checkPasswordAttempt } from './password-attempts';
import { TokenService } from './token.service';

export type PublicStaff = Omit<Staff, 'password'> & { operatorName?: string };

export function toPublicStaff<T extends Staff>(staff: T): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = staff;
  return rest;
}

/**
 * The signed-in person as the pro space sees them: no password, whether they are a platform admin,
 * whether their email is confirmed, and the operator they are viewing as a platform admin.
 */
/** The shuttle taken for the day, as the apps show it. */
export interface VehicleOfTheDay {
  id: string;
  model: string;
  colour: string | null;
  plate: string | null;
  seats: number | null;
}

/** A vehicle taken on another local day is free again (nobody "releases" it at night). */
export function holdsVehicleToday(staff: { vehicleId: string | null; vehicleSetAt: Date | null }, timezone: string, now = new Date()): boolean {
  return !!staff.vehicleId && !!staff.vehicleSetAt && localDate(staff.vehicleSetAt, timezone) === localDate(now, timezone);
}

/** How a member signs in (13/10/2026): their own password, Apple, Google (in that order). */
export type SignInMethod = 'password' | IdentityProvider;

export function signInMethods(staff: { passwordSetAt: Date | null }, providers: IdentityProvider[]): SignInMethod[] {
  return [
    ...(staff.passwordSetAt ? (['password'] as const) : []),
    ...(['apple', 'google'] as const).filter(provider => providers.includes(provider)),
  ];
}

/** The Apple / Google identities linked to a member, as Mon compte shows them. */
export type LinkedIdentity = { provider: IdentityProvider; email: string | null };

export function toSessionUser(staff: AuthenticatedStaff & { vehicle?: VehicleOfTheDay | null }, identities: LinkedIdentity[] = []) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { actingAs, ...rest } = toPublicStaff(staff);
  return {
    ...rest,
    vehicle: staff.vehicle ?? null,
    // 13/10/2026: whether the person has a password of their own, and the Apple / Google identities linked to them.
    hasPassword: !!staff.passwordSetAt,
    identities: [...identities]
      .sort((a, b) => a.provider.localeCompare(b.provider))
      .map(identity => ({ provider: identity.provider, email: identity.email })),
    effectivePost: effectivePost(staff),
    allowedPosts: allowedPosts(staff.role),
    isPlatformAdmin: isPlatformAdmin(staff.email),
    emailVerified: !!staff.emailVerifiedAt,
    viewAs: actingAs ? { operatorId: staff.operatorId, operatorName: staff.operatorName, platformAccount: actingAs.platformAccount } : null,
    // 21/10/2026: a session of the prospects' demo, and when it is wiped (the 01:00 UTC cron).
    demo: staff.demo ? { resetsAt: nextDemoReset(new Date()).toISOString() } : null,
  };
}

export const vehicleOfTheDay = (v: {
  id: string;
  model: string;
  colour: string | null;
  plate: string | null;
  seats: number | null;
}): VehicleOfTheDay => ({
  id: v.id,
  model: v.model,
  colour: v.colour,
  plate: v.plate,
  seats: v.seats,
});

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Staff member not found', 'not_found');

/**
 * A new first and/or last name merged with the stored ones, `name` rebuilt (09/10/2026). A blank one is refused: the DTOs
 * trim and check, this also catches a null that got past an optional field. Undefined when neither is given.
 */
export function renamed(
  current: { firstName: string; lastName: string },
  input: { firstName?: string | null; lastName?: string | null },
): { firstName: string; lastName: string; name: string } | undefined {
  if (input.firstName === undefined && input.lastName === undefined) return undefined;
  for (const field of ['firstName', 'lastName'] as const) {
    if (input[field] !== undefined && !input[field]?.trim()) throw new ValidationException({ [field]: 'required' });
  }
  const firstName = (input.firstName ?? current.firstName).trim().replace(/\s+/g, ' ');
  const lastName = (input.lastName ?? current.lastName).trim().replace(/\s+/g, ' ');
  return { firstName, lastName, name: fullName(firstName, lastName) };
}

@Service()
export class StaffService {
  public audit = Container.get(AuditService);
  public tokenService = Container.get(TokenService);

  private requireTeamManager(actor: AuthenticatedStaff) {
    if (!can(actor.role, 'team:manage')) throw forbidden();
  }

  /** A member of the actor's operator; one who left or deleted their account is no longer there (13/10/2026). */
  private async findInOperator(actor: AuthenticatedStaff, staffId: string): Promise<Staff> {
    const target = await prisma.staff.findFirst({ where: { id: staffId, operatorId: actor.operatorId, leftAt: null, deletedAt: null } });
    if (!target) throw notFound();
    return target;
  }

  public async list(actor: AuthenticatedStaff) {
    this.requireTeamManager(actor);
    // Those who left the parking or deleted their account (13/10/2026) are no longer part of the team.
    const team = await prisma.staff.findMany({
      where: { operatorId: actor.operatorId, leftAt: null, deletedAt: null },
      orderBy: { name: 'asc' },
      include: { vehicle: true, identities: { select: { provider: true } } },
    });
    const timezone = await this.timezone(actor);
    return team.map(({ vehicle, identities, ...s }) => ({
      ...toPublicStaff(s),
      effectivePost: effectivePost(s),
      vehicle: vehicle && holdsVehicleToday(s, timezone) ? vehicleOfTheDay(vehicle) : null,
      signIn: signInMethods(
        s,
        identities.map(i => i.provider),
      ),
    }));
  }

  /** The operator's time zone (its first parking's), for "today". */
  private async timezone(actor: AuthenticatedStaff): Promise<string> {
    return operatorTimezone(actor.operatorId);
  }

  /** The session user with the vehicle taken today (V-A) and the sign-in methods, for GET /me and the logins. */
  public async sessionUser(actor: AuthenticatedStaff) {
    const fresh = await prisma.staff.findUnique({
      where: { id: actor.id },
      select: { vehicleId: true, vehicleSetAt: true, vehicle: true, passwordSetAt: true, identities: { select: { provider: true, email: true } } },
    });
    const timezone = await this.timezone(actor);
    const vehicle = fresh?.vehicle && holdsVehicleToday(fresh, timezone) ? vehicleOfTheDay(fresh.vehicle) : null;
    return toSessionUser(
      {
        ...actor,
        vehicleId: fresh?.vehicleId ?? null,
        vehicleSetAt: fresh?.vehicleSetAt ?? null,
        passwordSetAt: fresh ? fresh.passwordSetAt : actor.passwordSetAt,
        vehicle,
      },
      fresh?.identities ?? [],
    );
  }

  /**
   * "Mon véhicule aujourd'hui" (V-A, 05/10/2026): the shuttle the driver takes for the day, among the
   * operator's vehicles in service and not taken by someone else today. `null` hands it back.
   */
  public async setVehicle(actor: AuthenticatedStaff, vehicleId: string | null) {
    const timezone = await this.timezone(actor);
    if (vehicleId) {
      const vehicle = await prisma.shuttleVehicle.findFirst({ where: { id: vehicleId, operatorId: actor.operatorId }, include: { holders: true } });
      if (!vehicle) throw new HttpException(httpStatus.NOT_FOUND, 'Vehicle not found', 'not_found');
      if (!vehicle.inService) throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'This vehicle is out of service', 'vehicle_out_of_service');
      const holder = vehicle.holders.find(h => h.id !== actor.id && h.isActive && holdsVehicleToday(h, timezone));
      if (holder) {
        throw new HttpException(httpStatus.CONFLICT, 'This vehicle is taken today', 'vehicle_taken', {
          holderId: holder.id,
          holderName: holder.name,
        });
      }
    }
    const staff = await prisma.staff.update({ where: { id: actor.id }, data: { vehicleId, vehicleSetAt: vehicleId ? new Date() : null } });
    await this.audit.record(actor, { action: 'staff.vehicle_set', entityType: 'staff', entityId: actor.id, details: { vehicleId } });
    return this.sessionUser({ ...actor, ...staff });
  }

  /** "Aujourd'hui, je suis…": the post held for the day, among those the role covers. */
  public async setPost(actor: AuthenticatedStaff, post: StaffRole) {
    if (!allowedPosts(actor.role).includes(post)) {
      throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'This post is not covered by your role', 'post_not_allowed', {
        allowed: allowedPosts(actor.role),
      });
    }
    // Another post than the driver's: the shuttle taken for the day goes back to the pool.
    const release = post === 'driver' ? {} : { vehicleId: null, vehicleSetAt: null };
    const staff = await prisma.staff.update({ where: { id: actor.id }, data: { post, postSetAt: new Date(), ...release } });
    await this.audit.record(actor, { action: 'staff.post_set', entityType: 'staff', entityId: actor.id, details: { post } });
    return this.sessionUser({ ...actor, ...staff });
  }

  public async create(actor: AuthenticatedStaff, data: CreateStaffDto) {
    this.requireTeamManager(actor);
    const email = data.email.trim().toLowerCase();
    if (await prisma.staff.findUnique({ where: { email } })) {
      throw new HttpException(httpStatus.CONFLICT, 'This email is already used', 'email_taken');
    }
    const staff = await prisma.staff.create({
      data: {
        operatorId: actor.operatorId,
        email,
        ...namesOf(data),
        phone: data.phone?.trim() || null,
        role: data.role,
        password: await hash(data.password, BCRYPT_ROUNDS),
        passwordSetAt: new Date(),
        bookingNotify: defaultBookingNotify(data.role),
      },
    });
    await this.audit.record(actor, { action: 'staff.created', entityType: 'staff', entityId: staff.id, details: { role: staff.role } });
    // 26/10/2026: the member chooses their own password from an invitation email (the typed one works meanwhile); a mail
    // that cannot go out never fails the creation.
    const invitation = await this.sendInvitation(actor, staff).catch(error => {
      logger.warn(`[Staff] invitation of ${staff.id} not sent: ${error instanceof Error ? error.message : String(error)}`);
      return { emailSent: false };
    });
    return { staff: toPublicStaff(staff), invitation };
  }

  /** « Renvoyer l'invitation » (26/10/2026): a new link for a member who did not get, or lost, the email. */
  public async invite(actor: AuthenticatedStaff, staffId: string): Promise<{ emailSent: boolean }> {
    this.requireTeamManager(actor);
    const target = await this.findInOperator(actor, staffId);
    if (!target.isActive) throw new HttpException(httpStatus.BAD_REQUEST, 'This member is deactivated', 'staff_inactive');
    return this.sendInvitation(actor, target);
  }

  /** Issues the invitation link (7 days, single use, a new one cancels the previous) and emails it. */
  private async sendInvitation(actor: AuthenticatedStaff, staff: Staff): Promise<{ emailSent: boolean }> {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: staff.operatorId }, select: { name: true } });
    const { token } = await Container.get(AccountTokenService).issue(staff.id, 'invitation', INVITATION_TTL_DAYS * 24 * 3600 * 1000);
    const notifications = Container.get(NotificationService);
    const emailSent = await notifications.emailStaff(
      { email: staff.email, name: fullName(staff.firstName, staff.lastName) },
      'team_invitation',
      `staff ${staff.id}`,
      teamInvitationEmail(PRODUCT_NAME, {
        operatorName: operator.name,
        inviterName: fullName(actor.firstName, actor.lastName),
        role: staff.role,
        url: notifications.proUrl(`/invitation#${token}`),
        days: INVITATION_TTL_DAYS,
        playStoreUrl: PLAZO_PRO_PLAY_STORE_URL,
        appStoreUrl: PLAZO_PRO_APP_STORE_URL,
        badgesBase: notifications.siteUrl(''),
      }),
    );
    await this.audit.record(actor, { action: 'staff.invited', entityType: 'staff', entityId: staff.id, details: { emailSent } });
    return { emailSent };
  }

  public async update(actor: AuthenticatedStaff, staffId: string, data: UpdateStaffDto) {
    this.requireTeamManager(actor);
    const target = await this.findInOperator(actor, staffId);
    const losesManagerRights = data.isActive === false || (data.role !== undefined && data.role !== 'manager');

    if (staffId === actor.id && losesManagerRights) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'You cannot remove your own manager rights', 'cannot_demote_self');
    }
    if (target.role === 'manager' && target.isActive && losesManagerRights) {
      const activeManagers = await prisma.staff.count({ where: { operatorId: actor.operatorId, role: 'manager', isActive: true } });
      if (activeManagers <= 1) throw new HttpException(httpStatus.BAD_REQUEST, 'At least one active manager is required', 'last_manager');
    }

    const names = renamed(target, data);
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { role: data.role ?? target.role, isActive: data.isActive ?? target.isActive, ...names },
    });
    if (!updated.isActive) await this.tokenService.revokeAll(staffId);
    await this.audit.record(actor, {
      action: 'staff.updated',
      entityType: 'staff',
      entityId: staffId,
      details: {
        role: { from: target.role, to: updated.role },
        isActive: { from: target.isActive, to: updated.isActive },
        ...(names && names.name !== target.name ? { name: { from: target.name, to: updated.name } } : {}),
      },
    });
    return toPublicStaff(updated);
  }

  /** « Votre nom » (09/10/2026): one's own first and last name; answers like GET /internal/staff/me. */
  public async updateMe(actor: AuthenticatedStaff, data: UpdateMeDto) {
    const names = renamed(actor, data)!;
    const staff = await prisma.staff.update({ where: { id: actor.id }, data: names });
    if (names.name !== actor.name) {
      await this.audit.record(actor, {
        action: 'staff.renamed',
        entityType: 'staff',
        entityId: actor.id,
        details: { name: { from: actor.name, to: staff.name } },
      });
    }
    return this.sessionUser({ ...actor, ...staff });
  }

  public async resetPassword(actor: AuthenticatedStaff, staffId: string, password: string) {
    this.requireTeamManager(actor);
    await this.findInOperator(actor, staffId);
    await prisma.staff.update({ where: { id: staffId }, data: { password: await hash(password, BCRYPT_ROUNDS), passwordSetAt: new Date() } });
    await this.tokenService.revokeAll(staffId);
    await this.audit.record(actor, { action: 'staff.password_reset', entityType: 'staff', entityId: staffId });
  }

  /** Changing one's password signs out every device, including the current one. */
  public async changeOwnPassword(actor: AuthenticatedStaff, data: ChangePasswordDto) {
    const me = await prisma.staff.findUnique({ where: { id: actor.id } });
    // The login's lockout applies: a stolen session cannot be used to guess the password.
    if (!me || !(await checkPasswordAttempt(me.email, data.currentPassword, me.password))) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Current password is incorrect', 'wrong_current_password');
    }
    await prisma.staff.update({
      where: { id: actor.id },
      data: { password: await hash(data.newPassword, BCRYPT_ROUNDS), passwordSetAt: new Date() },
    });
    await this.tokenService.revokeAll(actor.id);
    await this.audit.record(actor, { action: 'staff.password_changed', entityType: 'staff', entityId: actor.id });
  }
}
