import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';

type AuditActor = { id: string; operatorId: string };
type Client = Prisma.TransactionClient | typeof prisma;

@Service()
export class AuditService {
  public async record(
    actor: AuditActor,
    entry: { action: string; entityType: string; entityId?: string; details?: Prisma.InputJsonValue },
    client: Client = prisma,
  ) {
    await client.auditLog.create({
      data: {
        operatorId: actor.operatorId,
        staffId: actor.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details ?? {},
      },
    });
  }
}
