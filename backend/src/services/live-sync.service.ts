import { Service } from 'typedi';
import prisma from '@/database';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';

/**
 * 02/11/2026 (« les actions doivent être synchronisées entre l'espace admin et l'application », « tout, en direct »): one
 * cheap signal the web pro space and Plazo Pro read every few seconds. It changes on every write of the operator: the
 * audit trail (statuses, keys, places, files, shuttle trips, settings…) and the bookings themselves (imports, mails, the
 * test feed, which do not always leave a trace). When it moves, the screens read their data again.
 */
@Service()
export class LiveSyncService {
  public async version(actor: AuthenticatedStaff): Promise<{ version: string }> {
    const [audit, booking] = await Promise.all([
      prisma.auditLog.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, id: true } }),
      prisma.reservation.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    ]);
    const a = audit ? `${audit.createdAt.getTime()}-${audit.id}` : '0';
    const b = booking ? String(booking.updatedAt.getTime()) : '0';
    return { version: `${a}.${b}` };
  }
}
