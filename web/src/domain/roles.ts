import type { StaffRole } from "@/db/schema";

export const STAFF_ROLES = ["manager", "agent", "driver", "valet"] as const satisfies readonly StaffRole[];

export type Permission = "dashboard:view" | "parking:manage" | "team:manage";

const PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  manager: ["dashboard:view", "parking:manage", "team:manage"],
  agent: ["dashboard:view"],
  driver: ["dashboard:view"],
  valet: ["dashboard:view"],
};

export function can(role: StaffRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}
