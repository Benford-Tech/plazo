import type { StaffRole } from "./types";

// Mirrors backend/src/domain/roles.ts: the backend stays the authority, this only hides screens.
export type Permission =
  | "dashboard:view"
  | "parking:manage"
  | "team:manage"
  | "reservations:view"
  | "reservations:manage"
  | "reservations:force"
  | "reservations:status"
  | "revenue:view";

const PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  manager: ["dashboard:view", "parking:manage", "team:manage", "reservations:view", "reservations:manage", "reservations:force", "reservations:status", "revenue:view"],
  agent: ["dashboard:view", "reservations:view", "reservations:manage", "reservations:force", "reservations:status"],
  driver: ["dashboard:view", "reservations:view", "reservations:status"],
  valet: ["dashboard:view", "reservations:view", "reservations:status"],
};

export const STAFF_ROLES: StaffRole[] = ["manager", "agent", "driver", "valet"];

export function can(role: StaffRole | undefined, permission: Permission): boolean {
  return !!role && PERMISSIONS[role].includes(permission);
}

/** Same rule as backend/src/domain/capacity.ts, for the live preview only. */
export function bookableCapacity(totalCapacity: number, safetyMarginPct: number): number | null {
  if (!Number.isInteger(totalCapacity) || totalCapacity <= 0) return null;
  if (!Number.isInteger(safetyMarginPct) || safetyMarginPct < 0 || safetyMarginPct > 50) return null;
  return Math.floor((totalCapacity * (100 - safetyMarginPct)) / 100);
}
