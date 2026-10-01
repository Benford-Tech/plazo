"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { parkingSettingsSchema } from "@/domain/validation";
import { requireUser } from "@/server/auth/current";
import { getPrimaryParking, updateParkingSettings } from "@/server/services/parkings";
import { fromError, fromZodError, type FormState } from "./form-state";

export async function updateParkingAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const actor = await requireUser("parking:manage");
  const parsed = parkingSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);
  try {
    const db = getDb();
    const parking = await getPrimaryParking(db, actor);
    await updateParkingSettings(db, actor, parking.id, parsed.data);
  } catch (error) {
    return fromError(error, formData);
  }
  revalidatePath("/espace", "layout");
  return { ok: true };
}
