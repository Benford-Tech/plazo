import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { loginAttempts, operators, sessions, users, type User } from "@/db/schema";
import { verifyPassword } from "./password";

export const SESSION_TTL_MS = {
  web: 12 * 60 * 60 * 1000, // one working shift
  mobile: 30 * 24 * 60 * 60 * 1000,
} as const;

// Lock an email after too many failures in a sliding window.
export const MAX_FAILED_ATTEMPTS = 8;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export type SessionClient = keyof typeof SESSION_TTL_MS;

export type AuthenticatedUser = Pick<User, "id" | "operatorId" | "email" | "name" | "role"> & {
  operatorName: string;
};

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; user: AuthenticatedUser }
  | { ok: false; reason: "invalid_credentials" | "too_many_attempts" };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function recentFailures(db: Db, email: string, now: Date): Promise<number> {
  const since = new Date(now.getTime() - ATTEMPT_WINDOW_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
  return row?.count ?? 0;
}

export async function login(
  db: Db,
  input: { email: string; password: string; client: SessionClient; userAgent?: string | null },
  now = new Date(),
): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  if ((await recentFailures(db, email, now)) >= MAX_FAILED_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const [row] = await db
    .select({ user: users, operatorName: operators.name })
    .from(users)
    .innerJoin(operators, eq(operators.id, users.operatorId))
    .where(eq(users.email, email));

  const valid = row && row.user.active && (await verifyPassword(input.password, row.user.passwordHash));
  await db.insert(loginAttempts).values({ email, success: Boolean(valid), createdAt: now });
  if (!valid) return { ok: false, reason: "invalid_credentials" };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS[input.client]);
  await db.insert(sessions).values({
    id: hashToken(token),
    userId: row.user.id,
    client: input.client,
    expiresAt,
    userAgent: input.userAgent ?? null,
    createdAt: now,
  });
  await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, row.user.id));

  const { id, operatorId, name, role } = row.user;
  return { ok: true, token, expiresAt, user: { id, operatorId, email, name, role, operatorName: row.operatorName } };
}

/** Returns the session's user, or null if the token is unknown, expired or the user is deactivated. */
export async function validateSessionToken(db: Db, token: string, now = new Date()): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      operatorId: users.operatorId,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
      operatorName: operators.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(operators, eq(operators.id, users.operatorId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, now)));
  if (!row || !row.active) return null;
  const { id, operatorId, email, name, role, operatorName } = row;
  return { id, operatorId, email, name, role, operatorName };
}

export async function revokeSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function revokeAllSessions(db: Db, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
