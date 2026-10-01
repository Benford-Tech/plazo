import type { Db } from "@/db/client";
import { operators, parkings, users } from "@/db/schema";
import type { OperatorSetupInput } from "@/domain/validation";
import { hashPassword } from "@/server/auth/password";
import { normalizeEmail } from "@/server/auth/sessions";
import { DomainError } from "@/server/errors";

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Onboards a new operator with its first parking and manager account (platform-side, not self-service). */
export async function createOperatorWithManager(db: Db, input: OperatorSetupInput) {
  const email = normalizeEmail(input.managerEmail);
  const passwordHash = await hashPassword(input.managerPassword);
  return db.transaction(async (tx) => {
    const existing = await tx.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
    if (existing) throw new DomainError("email_taken");

    const [operator] = await tx
      .insert(operators)
      .values({ name: input.operatorName, slug: slugify(input.operatorName) || "operateur" })
      .returning();
    const [parking] = await tx
      .insert(parkings)
      .values({ operatorId: operator.id, name: input.parkingName, totalCapacity: input.totalCapacity })
      .returning();
    const [manager] = await tx
      .insert(users)
      .values({ operatorId: operator.id, email, name: input.managerName, role: "manager", passwordHash })
      .returning();
    return { operator, parking, manager };
  });
}
