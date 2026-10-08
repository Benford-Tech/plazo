import { compare, hash } from 'bcrypt';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { BCRYPT_ROUNDS, isPlatformAdmin } from '@/config';
import prisma, { Staff, StaffRole } from '@/database';
import { allowedPosts, can, defaultBookingNotify, effectivePost } from '@/domain/roles';
import { localDate } from '@/domain/time';
import { ChangePasswordDto, CreateStaffDto, UpdateStaffDto } from '@/dtos/staff.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { namesOf } from '@/domain/staff-name';
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

export function toSessionUser(staff: AuthenticatedStaff & { vehicle?: VehicleOfTheDay | null }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { actingAs, ...rest } = toPublicStaff(staff);
  return {
    ...rest,
    vehicle: staff.vehicle ?? null,
    effectivePost: effectivePost(staff),
    allowedPosts: allowedPosts(staff.role),
    isPlatformAdmin: isPlatformAdmin(staff.email),
    emailVerified: !!staff.emailVerifiedAt,
    viewAs: actingAs ? { operatorId: staff.operatorId, operatorName: staff.operatorName } : null,
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
    const team = await prisma.staff.findMany({ where: { operatorId: actor.operatorId }, orderBy: { name: 'asc' }, include: { vehicle: true } });
    const timezone = await this.timezone(actor);
    return team.map(({ vehicle, ...s }) => ({
      ...toPublicStaff(s),
      effectivePost: effectivePost(s),
      vehicle: vehicle && holdsVehicleToday(s, timezone) ? vehicleOfTheDay(vehicle) : null,
    }));
  }

  /** The operator's time zone (its first parking's), for "today". */
  private async timezone(actor: AuthenticatedStaff): Promise<string> {
    const parking = await prisma.parking.findFirst({
      where: { operatorId: actor.operatorId },
      orderBy: { createdAt: 'asc' },
      select: { timezone: true },
    });
    return parking?.timezone ?? 'Europe/Paris';
  }

  /** The session user with the vehicle taken today (V-A), for GET /me and the login. */
  public async sessionUser(actor: AuthenticatedStaff) {
    const fresh = await prisma.staff.findUnique({ where: { id: actor.id }, select: { vehicleId: true, vehicleSetAt: true, vehicle: true } });
    const timezone = await this.timezone(actor);
    const vehicle = fresh?.vehicle && holdsVehicleToday(fresh, timezone) ? vehicleOfTheDay(fresh.vehicle) : null;
    return toSessionUser({ ...actor, vehicleId: fresh?.vehicleId ?? null, vehicleSetAt: fresh?.vehicleSetAt ?? null, vehicle });
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
        bookingNotify: defaultBookingNotify(data.role),
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
