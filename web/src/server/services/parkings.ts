import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { parkings, type Parking } from "@/db/schema";
import { bookableCapacity } from "@/domain/capacity";
import { can } from "@/domain/roles";
import type { ParkingSettingsInput } from "@/domain/validation";
import type { AuthenticatedUser } from "@/server/auth/sessions";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { audit } from "./audit";

export type ParkingSummary = Parking & { bookableCapacity: number };

function summarize(p: Parking): ParkingSummary {
  return { ...p, bookableCapacity: bookableCapacity(p.totalCapacity, p.safetyMarginPct) };
}

/** MVP: one parking per operator in the UI; the data model already allows several. */
export async function getPrimaryParking(db: Db, actor: AuthenticatedUser): Promise<ParkingSummary> {
  const [p] = await db
    .select()
    .from(parkings)
    .where(eq(parkings.operatorId, actor.operatorId))
    .orderBy(asc(parkings.createdAt))
    .limit(1);
  if (!p) throw new NotFoundError("parking_not_found");
  return summarize(p);
}

export async function updateParkingSettings(
  db: Db,
  actor: AuthenticatedUser,
  parkingId: string,
  input: ParkingSettingsInput,
): Promise<ParkingSummary> {
  if (!can(actor.role, "parking:manage")) throw new ForbiddenError();
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(parkings)
      .where(and(eq(parkings.id, parkingId), eq(parkings.operatorId, actor.operatorId)));
    if (!before) throw new NotFoundError("parking_not_found");

    const [after] = await tx
      .update(parkings)
      .set({
        name: input.name,
        address: input.address ?? null,
        totalCapacity: input.totalCapacity,
        safetyMarginPct: input.safetyMarginPct,
        shuttleTravelMinutes: input.shuttleTravelMinutes,
      })
      .where(eq(parkings.id, parkingId))
      .returning();

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of ["name", "address", "totalCapacity", "safetyMarginPct", "shuttleTravelMinutes"] as const) {
      if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
    }
    await audit(tx, actor, {
      action: "parking.settings_updated",
      entityType: "parking",
      entityId: parkingId,
      details: changes,
    });
    return summarize(after);
  });
}
