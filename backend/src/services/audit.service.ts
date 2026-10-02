import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { ActingAs } from '@/interfaces/auth.interface';

// id null: an action without staff, e.g. a traveller booking or cancelling on the site.
// actingAs: a platform admin inside the operator's space (id is then the admin's own staff id).
type AuditActor = { id: string | null; operatorId: string; actingAs?: ActingAs };
type Client = Prisma.TransactionClient | typeof prisma;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

@Service()
export class AuditService {
  public async record(
    actor: AuditActor,
    entry: { action: string; entityType: string; entityId?: string; details?: Prisma.InputJsonValue },
    client: Client = prisma,
  ) {
    const details = entry.details ?? {};
    await client.auditLog.create({
      data: {
        operatorId: actor.operatorId,
        staffId: actor.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        // Entries written from a view-as session say so (the staff id is the platform admin's).
        details: actor.actingAs && isObject(details) ? { ...details, viewAs: true } : details,
      },
    });
  }

  /** A write request of a view-as session, recorded before it runs (route only, never the body). */
  public async recordViewAsWrite(actor: AuditActor & { id: string }, request: { method: string; path: string }) {
    return prisma.auditLog.create({
      data: {
        operatorId: actor.operatorId,
        staffId: actor.id,
        action: 'view_as.write',
        entityType: 'request',
        details: { method: request.method, path: request.path, viewAs: true, fromOperatorId: actor.actingAs?.realOperatorId ?? null },
      },
      select: { id: true },
    });
  }

  public async completeViewAsWrite(id: string, status: number) {
    const entry = await prisma.auditLog.findUnique({ where: { id }, select: { details: true } });
    if (!entry) return;
    await prisma.auditLog.update({ where: { id }, data: { details: { ...(entry.details as Record<string, unknown>), status } } });
  }
}
