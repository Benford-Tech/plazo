"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { changePasswordSchema, passwordSchema, staffCreateSchema, staffUpdateSchema } from "@/domain/validation";
import { requireUser } from "@/server/auth/current";
import { changeOwnPassword, createStaff, resetStaffPassword, updateStaff } from "@/server/services/team";
import { fromError, fromZodError, type FormState } from "./form-state";

export async function createStaffAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const actor = await requireUser("team:manage");
  const parsed = staffCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);
  try {
    await createStaff(getDb(), actor, parsed.data);
  } catch (error) {
    return fromError(error, formData);
  }
  revalidatePath("/espace/equipe");
  return { ok: true, code: "created" };
}

const updateFormSchema = z.object({
  userId: z.string().uuid(),
  role: staffUpdateSchema.shape.role,
  active: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

export async function updateStaffAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const actor = await requireUser("team:manage");
  const parsed = updateFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const { userId, ...changes } = parsed.data;
  try {
    await updateStaff(getDb(), actor, userId, changes);
  } catch (error) {
    return fromError(error, formData);
  }
  revalidatePath("/espace/equipe");
  return { ok: true };
}

const resetFormSchema = z.object({ userId: z.string().uuid(), password: passwordSchema });

export async function resetStaffPasswordAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const actor = await requireUser("team:manage");
  const parsed = resetFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);
  try {
    await resetStaffPassword(getDb(), actor, parsed.data.userId, parsed.data.password);
  } catch (error) {
    return fromError(error, formData);
  }
  return { ok: true, code: "password_reset" };
}

export async function changeOwnPasswordAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const actor = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);
  try {
    await changeOwnPassword(getDb(), actor, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    return fromError(error, formData);
  }
  // Every session was revoked, including this one.
  redirect("/connexion?motdepasse=modifie");
}
