import { describe, expect, it } from "vitest";
import { login, validateSessionToken } from "../src/server/auth/sessions";
import { DomainError, ForbiddenError, NotFoundError } from "../src/server/errors";
import { createOperatorWithManager } from "../src/server/services/operators";
import { getPrimaryParking, updateParkingSettings } from "../src/server/services/parkings";
import { changeOwnPassword, createStaff, listTeam, resetStaffPassword, updateStaff } from "../src/server/services/team";
import { addStaff, PASSWORD, setupOperator, setupTestDb } from "./helpers";

const db = setupTestDb();

const settings = { name: "P1", address: null, totalCapacity: 300, safetyMarginPct: 5, shuttleTravelMinutes: 10 };

describe("operator onboarding", () => {
  it("creates operator, parking and manager together", async () => {
    const { operator, parking, manager } = await setupOperator(db);
    expect(parking.operatorId).toBe(operator.id);
    expect(manager.role).toBe("manager");
  });

  it("refuses a manager email already in use", async () => {
    const { manager } = await setupOperator(db);
    await expect(
      createOperatorWithManager(db, {
        operatorName: "Autre",
        parkingName: "Autre",
        totalCapacity: 10,
        managerName: "X",
        managerEmail: manager.email,
        managerPassword: PASSWORD,
      }),
    ).rejects.toThrow(DomainError);
  });
});

describe("parking settings", () => {
  it("updates settings, computes bookable capacity and writes an audit entry", async () => {
    const { actor, parking } = await setupOperator(db);
    const updated = await updateParkingSettings(db, actor, parking.id, settings);
    expect(updated.bookableCapacity).toBe(285);
    const logs = await db.query.auditLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: "parking.settings_updated", userId: actor.id });
    expect(logs[0].details).toMatchObject({ totalCapacity: { from: 200, to: 300 } });
  });

  it("is reserved to managers", async () => {
    const { actor, parking } = await setupOperator(db);
    const agent = await addStaff(db, actor, "agent");
    await expect(updateParkingSettings(db, agent, parking.id, settings)).rejects.toThrow(ForbiddenError);
  });

  it("never touches another operator's parking", async () => {
    const a = await setupOperator(db, "A");
    const b = await setupOperator(db, "B");
    await expect(updateParkingSettings(db, a.actor, b.parking.id, settings)).rejects.toThrow(NotFoundError);
    expect((await getPrimaryParking(db, b.actor)).totalCapacity).toBe(200);
  });

  it("is protected by database constraints", async () => {
    const { actor, parking } = await setupOperator(db);
    await expect(updateParkingSettings(db, actor, parking.id, { ...settings, safetyMarginPct: 80 })).rejects.toThrow();
  });
});

describe("team management", () => {
  it("lists only the operator's own staff", async () => {
    const a = await setupOperator(db, "A");
    const b = await setupOperator(db, "B");
    await addStaff(db, a.actor, "driver");
    await addStaff(db, b.actor, "agent");
    const team = await listTeam(db, a.actor);
    expect(team.map((m) => m.role).sort()).toEqual(["driver", "manager"]);
    expect(team[0]).not.toHaveProperty("passwordHash");
  });

  it("refuses non-managers and duplicate emails", async () => {
    const { actor } = await setupOperator(db);
    const driver = await addStaff(db, actor, "driver");
    await expect(listTeam(db, driver)).rejects.toThrow(ForbiddenError);
    await expect(
      createStaff(db, actor, { name: "X", email: driver.email.toUpperCase(), role: "agent", password: PASSWORD }),
    ).rejects.toThrow(DomainError);
  });

  it("deactivating someone closes their sessions", async () => {
    const { actor } = await setupOperator(db);
    await addStaff(db, actor, "valet");
    const team = await listTeam(db, actor);
    const valet = team.find((m) => m.role === "valet")!;
    const session = await login(db, { email: valet.email, password: PASSWORD, client: "mobile" });
    if (!session.ok) throw new Error("login failed");
    await updateStaff(db, actor, valet.id, { active: false });
    expect(await validateSessionToken(db, session.token)).toBeNull();
  });

  it("keeps at least one active manager and forbids self-demotion", async () => {
    const { actor } = await setupOperator(db);
    await expect(updateStaff(db, actor, actor.id, { role: "agent" })).rejects.toThrow("cannot_demote_self");
    await expect(updateStaff(db, actor, actor.id, { active: false })).rejects.toThrow("cannot_demote_self");

    const second = await addStaff(db, actor, "manager");
    await updateStaff(db, actor, second.id, { role: "agent" });
    expect((await listTeam(db, actor)).filter((m) => m.role === "manager")).toHaveLength(1);
  });

  it("cannot manage another operator's staff", async () => {
    const a = await setupOperator(db, "A");
    const b = await setupOperator(db, "B");
    await expect(updateStaff(db, a.actor, b.manager.id, { active: false })).rejects.toThrow(NotFoundError);
    await expect(resetStaffPassword(db, a.actor, b.manager.id, "nouveau-mot-de-passe")).rejects.toThrow(NotFoundError);
  });

  it("password reset and change invalidate old credentials", async () => {
    const { actor } = await setupOperator(db);
    const agent = await addStaff(db, actor, "agent");
    await resetStaffPassword(db, actor, agent.id, "provisoire-123");
    expect((await login(db, { email: agent.email, password: PASSWORD, client: "web" })).ok).toBe(false);

    const session = await login(db, { email: agent.email, password: "provisoire-123", client: "web" });
    if (!session.ok) throw new Error("login failed");
    await expect(changeOwnPassword(db, session.user, "faux", "definitif-456")).rejects.toThrow("wrong_current_password");
    await changeOwnPassword(db, session.user, "provisoire-123", "definitif-456");
    expect(await validateSessionToken(db, session.token)).toBeNull();
    expect((await login(db, { email: agent.email, password: "definitif-456", client: "web" })).ok).toBe(true);
  });
});
