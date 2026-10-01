import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { users } from "@/db/schema";
import { can } from "@/domain/roles";
import type { StaffCreateInput, StaffUpdateInput } from "@/domain/validation";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { normalizeEmail, revokeAllSessions, type AuthenticatedUser } from "@/server/auth/sessions";
import { DomainError, ForbiddenError, NotFoundError } from "@/server/errors";
import { audit } from "./audit";

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  role: users.role,
  active: users.active,
  lastLoginAt: users.lastLoginAt,
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AuthenticatedUser["role"];
  active: boolean;
  lastLoginAt: Date | null;
};

function requireTeamManager(actor: AuthenticatedUser) {
  if (!can(actor.role, "team:manage")) throw new ForbiddenError();
}

export async function listTeam(db: Db, actor: AuthenticatedUser): Promise<TeamMember[]> {
  requireTeamManager(actor);
  return db
    .select(publicColumns)
    .from(users)
    .where(eq(users.operatorId, actor.operatorId))
    .orderBy(asc(users.name));
}

export async function createStaff(db: Db, actor: AuthenticatedUser, input: StaffCreateInput): Promise<TeamMember> {
  requireTeamManager(actor);
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) throw new DomainError("email_taken");

  const [member] = await db
    .insert(users)
    .values({
      operatorId: actor.operatorId,
      email,
      name: input.name,
      phone: input.phone ?? null,
      role: input.role,
      passwordHash,
    })
    .returning(publicColumns);
  await audit(db, actor, { action: "user.created", entityType: "user", entityId: member.id, details: { role: member.role } });
  return member;
}

async function countActiveManagers(db: Db, operatorId: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.operatorId, operatorId), eq(users.role, "manager"), eq(users.active, true)));
  return rows.length;
}

export async function updateStaff(
  db: Db,
  actor: AuthenticatedUser,
  userId: string,
  input: StaffUpdateInput,
): Promise<TeamMember> {
  requireTeamManager(actor);
  const [target] = await db
    .select(publicColumns)
    .from(users)
    .where(and(eq(users.id, userId), eq(users.operatorId, actor.operatorId)));
  if (!target) throw new NotFoundError("user_not_found");
  if (userId === actor.id && (input.active === false || (input.role && input.role !== "manager"))) {
    throw new DomainError("cannot_demote_self");
  }
  const losesManager =
    target.role === "manager" && target.active && (input.active === false || (input.role && input.role !== "manager"));
  if (losesManager && (await countActiveManagers(db, actor.operatorId)) <= 1) {
    throw new DomainError("last_manager");
  }

  const [updated] = await db
    .update(users)
    .set({ role: input.role ?? target.role, active: input.active ?? target.active })
    .where(eq(users.id, userId))
    .returning(publicColumns);
  if (!updated.active) await revokeAllSessions(db, userId);
  await audit(db, actor, {
    action: "user.updated",
    entityType: "user",
    entityId: userId,
    details: { role: { from: target.role, to: updated.role }, active: { from: target.active, to: updated.active } },
  });
  return updated;
}

export async function resetStaffPassword(
  db: Db,
  actor: AuthenticatedUser,
  userId: string,
  newPassword: string,
): Promise<void> {
  requireTeamManager(actor);
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.operatorId, actor.operatorId)));
  if (!target) throw new NotFoundError("user_not_found");
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, userId));
  await revokeAllSessions(db, userId);
  await audit(db, actor, { action: "user.password_reset", entityType: "user", entityId: userId });
}

export async function changeOwnPassword(
  db: Db,
  actor: AuthenticatedUser,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const [me] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, actor.id));
  if (!me || !(await verifyPassword(currentPassword, me.passwordHash))) {
    throw new DomainError("wrong_current_password");
  }
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, actor.id));
  await revokeAllSessions(db, actor.id);
  await audit(db, actor, { action: "user.password_changed", entityType: "user", entityId: actor.id });
}
