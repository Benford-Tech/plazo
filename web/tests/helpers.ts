import "dotenv/config";
import { afterAll, beforeEach } from "vitest";
import { createDb, type Db } from "../src/db/client";
import type { StaffRole } from "../src/db/schema";
import { login, type AuthenticatedUser } from "../src/server/auth/sessions";
import { createOperatorWithManager } from "../src/server/services/operators";
import { createStaff } from "../src/server/services/team";

export const PASSWORD = "mot-de-passe-solide";

export function setupTestDb(): Db {
  const { db, sql } = createDb(process.env.DATABASE_URL_TEST!);
  beforeEach(async () => {
    await sql.unsafe("TRUNCATE operators, login_attempts RESTART IDENTITY CASCADE");
  });
  afterAll(async () => {
    await sql.end();
  });
  return db;
}

let counter = 0;

export async function setupOperator(db: Db, name = "Parking Test") {
  counter += 1;
  const result = await createOperatorWithManager(db, {
    operatorName: `${name} ${counter}`,
    parkingName: `${name} LYS`,
    totalCapacity: 200,
    managerName: "Gérant Test",
    managerEmail: `gerant${counter}@example.com`,
    managerPassword: PASSWORD,
  });
  const session = await login(db, { email: result.manager.email, password: PASSWORD, client: "web" });
  if (!session.ok) throw new Error("login failed");
  return { ...result, actor: session.user };
}

export async function addStaff(db: Db, actor: AuthenticatedUser, role: StaffRole): Promise<AuthenticatedUser> {
  counter += 1;
  const email = `${role}${counter}@example.com`;
  await createStaff(db, actor, { name: `${role} ${counter}`, email, role, password: PASSWORD });
  const session = await login(db, { email, password: PASSWORD, client: "web" });
  if (!session.ok) throw new Error("login failed");
  return session.user;
}
