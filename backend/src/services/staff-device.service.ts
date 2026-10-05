import { Container, Service } from 'typedi';
import prisma from '@/database';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { AuditService } from './audit.service';

export interface NotificationPreferences {
  arrivals: boolean;
  returns: boolean;
  /** The shuttles' departures and returns (N-A). */
  shuttles: boolean;
  /** The platform's messages (E-A). */
  platform: boolean;
  /** Phones of the person registered for pushes. */
  devices: number;
}

/** The staff's phones registered for push notifications, and what each person wants to receive. */
@Service()
export class StaffDeviceService {
  public audit = Container.get(AuditService);

  /** Registers (or moves to this person) a OneSignal subscription: one phone, one owner. */
  public async register(actor: AuthenticatedStaff, subscriptionId: string, platform?: string | null) {
    const device = await prisma.staffDevice.upsert({
      where: { subscriptionId },
      create: { staffId: actor.id, subscriptionId, platform: platform ?? null },
      update: { staffId: actor.id, platform: platform ?? null },
    });
    return { subscriptionId: device.subscriptionId, platform: device.platform, preferences: await this.preferences(actor) };
  }

  /** Forgets a phone (logout, notifications switched off). Only the person's own. */
  public async unregister(actor: AuthenticatedStaff, subscriptionId: string) {
    await prisma.staffDevice.deleteMany({ where: { subscriptionId, staffId: actor.id } });
  }

  public async preferences(actor: AuthenticatedStaff): Promise<NotificationPreferences> {
    const staff = await prisma.staff.findUniqueOrThrow({
      where: { id: actor.id },
      select: { notifyArrivals: true, notifyReturns: true, notifyShuttles: true, notifyPlatform: true },
    });
    const devices = await prisma.staffDevice.count({ where: { staffId: actor.id } });
    return { arrivals: staff.notifyArrivals, returns: staff.notifyReturns, shuttles: staff.notifyShuttles, platform: staff.notifyPlatform, devices };
  }

  public async updatePreferences(
    actor: AuthenticatedStaff,
    patch: { arrivals?: boolean; returns?: boolean; shuttles?: boolean; platform?: boolean },
  ): Promise<NotificationPreferences> {
    await prisma.staff.update({
      where: { id: actor.id },
      data: {
        ...(patch.arrivals !== undefined ? { notifyArrivals: patch.arrivals } : {}),
        ...(patch.returns !== undefined ? { notifyReturns: patch.returns } : {}),
        ...(patch.shuttles !== undefined ? { notifyShuttles: patch.shuttles } : {}),
        ...(patch.platform !== undefined ? { notifyPlatform: patch.platform } : {}),
      },
    });
    return this.preferences(actor);
  }
}
