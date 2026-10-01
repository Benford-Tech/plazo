import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "../src/db/schema";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { login, MAX_FAILED_ATTEMPTS, revokeSession, SESSION_TTL_MS, validateSessionToken } from "../src/server/auth/sessions";
import { PASSWORD, setupOperator, setupTestDb } from "./helpers";

const db = setupTestDb();

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("login and sessions", () => {
  it("logs in case-insensitively and validates the token", async () => {
    const { manager } = await setupOperator(db);
    const result = await login(db, { email: manager.email.toUpperCase(), password: PASSWORD, client: "mobile" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const user = await validateSessionToken(db, result.token);
    expect(user).toMatchObject({ id: manager.id, role: "manager" });
  });

  it("rejects a wrong password and an unknown email the same way", async () => {
    const { manager } = await setupOperator(db);
    expect(await login(db, { email: manager.email, password: "nope", client: "web" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    expect(await login(db, { email: "personne@example.com", password: PASSWORD, client: "web" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("locks an email after too many failures, even with the right password", async () => {
    const { manager } = await setupOperator(db);
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await login(db, { email: manager.email, password: "nope", client: "web" });
    }
    const result = await login(db, { email: manager.email, password: PASSWORD, client: "web" });
    expect(result).toEqual({ ok: false, reason: "too_many_attempts" });
  });

  it("expires web sessions after a shift", async () => {
    const { manager } = await setupOperator(db);
    const now = new Date();
    const result = await login(db, { email: manager.email, password: PASSWORD, client: "web" }, now);
    if (!result.ok) throw new Error("login failed");
    const later = new Date(now.getTime() + SESSION_TTL_MS.web + 1000);
    expect(await validateSessionToken(db, result.token, later)).toBeNull();
  });

  it("refuses revoked sessions and deactivated users", async () => {
    const { manager } = await setupOperator(db);
    const a = await login(db, { email: manager.email, password: PASSWORD, client: "web" });
    const b = await login(db, { email: manager.email, password: PASSWORD, client: "web" });
    if (!a.ok || !b.ok) throw new Error("login failed");
    await revokeSession(db, a.token);
    expect(await validateSessionToken(db, a.token)).toBeNull();
    expect(await validateSessionToken(db, b.token)).not.toBeNull();

    await db.update(users).set({ active: false }).where(eq(users.id, manager.id));
    expect(await validateSessionToken(db, b.token)).toBeNull();
    expect(await login(db, { email: manager.email, password: PASSWORD, client: "web" })).toMatchObject({ ok: false });
  });
});
