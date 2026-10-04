import { compare, hash } from 'bcrypt';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, isPlatformAdmin } from '@/config';
import prisma, { Staff, StaffRole } from '@/database';
import { allowedPosts, can, effectivePost } from '@/domain/roles';
import { ChangePasswordDto, CreateStaffDto, UpdateStaffDto } from '@/dtos/staff.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
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
export function toSessionUser(staff: AuthenticatedStaff) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { actingAs, ...rest } = toPublicStaff(staff);
  return {
    ...rest,
    effectivePost: effectivePost(staff),
    allowedPosts: allowedPosts(staff.role),
    isPlatformAdmin: isPlatformAdmin(staff.email),
    emailVerified: !!staff.emailVerifiedAt,
    viewAs: actingAs ? { operatorId: staff.operatorId, operatorName: staff.operatorName } : null,
  };
}

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Staff member not found', 'not_found');

@Service()
export class StaffService {
  public audit = Container.get(AuditService);
  public tokenService = Container.get(TokenService);

  private requireTeamManager(actor: AuthenticatedStaff) {
    if (!can(actor.role, 'team:manage')) throw forbidden();
  }

  private async findInOperator(actor: AuthenticatedStaff, staffId: string): Promise<Staff> {
    const target = await prisma.staff.findFirst({ where: { id: staffId, operatorId: actor.operatorId } });
    if (!target) throw notFound();
    return target;
  }

  public async list(actor: AuthenticatedStaff) {
    this.requireTeamManager(actor);
    const team = await prisma.staff.findMany({ where: { operatorId: actor.operatorId }, orderBy: { name: 'asc' } });
    return team.map(s => ({ ...toPublicStaff(s), effectivePost: effectivePost(s) }));
  }

  /** "Aujourd'hui, je suis…": the post held for the day, among those the role covers. */
  public async setPost(actor: AuthenticatedStaff, post: StaffRole) {
    if (!allowedPosts(actor.role).includes(post)) {
      throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'This post is not covered by your role', 'post_not_allowed', {
        allowed: allowedPosts(actor.role),
      });
    }
    const staff = await prisma.staff.update({ where: { id: actor.id }, data: { post, postSetAt: new Date() } });
    await this.audit.record(actor, { action: 'staff.post_set', entityType: 'staff', entityId: actor.id, details: { post } });
    return toSessionUser({ ...actor, ...staff });
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
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role: data.role,
        password: await hash(data.password, BCRYPT_ROUNDS),
      },
    });
    await this.audit.record(actor, { action: 'staff.created', entityType: 'staff', entityId: staff.id, details: { role: staff.role } });
    return toPublicStaff(staff);
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

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { role: data.role ?? target.role, isActive: data.isActive ?? target.isActive },
    });
    if (!updated.isActive) await this.tokenService.revokeAll(staffId);
    await this.audit.record(actor, {
      action: 'staff.updated',
      entityType: 'staff',
      entityId: staffId,
      details: { role: { from: target.role, to: updated.role }, isActive: { from: target.isActive, to: updated.isActive } },
    });
    return toPublicStaff(updated);
  }

  public async resetPassword(actor: AuthenticatedStaff, staffId: string, password: string) {
    this.requireTeamManager(actor);
    await this.findInOperator(actor, staffId);
    await prisma.staff.update({ where: { id: staffId }, data: { password: await hash(password, BCRYPT_ROUNDS) } });
    await this.tokenService.revokeAll(staffId);
    await this.audit.record(actor, { action: 'staff.password_reset', entityType: 'staff', entityId: staffId });
  }

  /** Changing one's password signs out every device, including the current one. */
  public async changeOwnPassword(actor: AuthenticatedStaff, data: ChangePasswordDto) {
    const me = await prisma.staff.findUnique({ where: { id: actor.id } });
    if (!me || !(await compare(data.currentPassword, me.password))) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Current password is incorrect', 'wrong_current_password');
    }
    await prisma.staff.update({ where: { id: actor.id }, data: { password: await hash(data.newPassword, BCRYPT_ROUNDS) } });
    await this.tokenService.revokeAll(actor.id);
    await this.audit.record(actor, { action: 'staff.password_changed', entityType: 'staff', entityId: actor.id });
  }
}
