import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  geometry,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// All timestamps are stored in UTC (timestamptz); the UI renders them in Europe/Paris.
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const staffRole = pgEnum("staff_role", ["manager", "agent", "driver", "valet"]);
export const sessionClient = pgEnum("session_client", ["web", "mobile"]);

export const operators = pgTable("operators", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorId: uuid("operator_id")
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    // Always stored lower-cased.
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    role: staffRole("role").notNull(),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("users_operator_idx").on(t.operatorId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the session token: a database leak does not expose usable tokens.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    client: sessionClient("client").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: text("email").notNull(),
    success: boolean("success").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_email_created_idx").on(t.email, t.createdAt)],
);

export const parkings = pgTable(
  "parkings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorId: uuid("operator_id")
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    // WGS84 point of the parking entrance; the detailed map arrives in milestone 4.
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
    timezone: text("timezone").notNull().default("Europe/Paris"),
    totalCapacity: integer("total_capacity").notNull(),
    // Share of spots kept out of bookings, in percent (0-50).
    safetyMarginPct: integer("safety_margin_pct").notNull().default(0),
    shuttleTravelMinutes: integer("shuttle_travel_minutes").notNull().default(8),
    createdAt: createdAt(),
  },
  (t) => [
    index("parkings_operator_idx").on(t.operatorId),
    check("parkings_capacity_positive", sql`${t.totalCapacity} > 0`),
    check("parkings_margin_range", sql`${t.safetyMarginPct} between 0 and 50`),
    check("parkings_shuttle_range", sql`${t.shuttleTravelMinutes} between 1 and 120`),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    operatorId: uuid("operator_id")
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_operator_created_idx").on(t.operatorId, t.createdAt)],
);

export type Operator = typeof operators.$inferSelect;
export type User = typeof users.$inferSelect;
export type Parking = typeof parkings.$inferSelect;
export type StaffRole = (typeof staffRole.enumValues)[number];
