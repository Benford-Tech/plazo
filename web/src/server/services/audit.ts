import type { DbOrTx } from "@/db/client";
import { auditLog } from "@/db/schema";
import type { AuthenticatedUser } from "@/server/auth/sessions";

export async function audit(
  db: DbOrTx,
  actor: Pick<AuthenticatedUser, "id" | "operatorId">,
  entry: { action: string; entityType: string; entityId?: string; details?: Record<string, unknown> },
): Promise<void> {
  await db.insert(auditLog).values({
    operatorId: actor.operatorId,
    userId: actor.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    details: entry.details ?? {},
  });
}
