import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/server/auth/password";
import { STAFF_ROLES } from "./roles";

// Error messages are codes; the UI translates them (src/i18n/fr.ts).
const trimmed = (max: number) => z.string().trim().min(1, "required").max(max, "too_long");
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "too_long")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, "password_too_short").max(200, "too_long");

export const loginSchema = z.object({
  email: z.string().trim().email("invalid_email"),
  password: z.string().min(1, "required"),
});

export const parkingSettingsSchema = z.object({
  name: trimmed(120),
  address: optionalTrimmed(300),
  totalCapacity: z.coerce.number().int("integer").min(1, "min_1").max(20000, "too_large"),
  safetyMarginPct: z.coerce.number().int("integer").min(0, "margin_range").max(50, "margin_range"),
  shuttleTravelMinutes: z.coerce.number().int("integer").min(1, "shuttle_range").max(120, "shuttle_range"),
});
export type ParkingSettingsInput = z.infer<typeof parkingSettingsSchema>;

export const staffCreateSchema = z.object({
  name: trimmed(120),
  email: z.string().trim().email("invalid_email"),
  phone: optionalTrimmed(30),
  role: z.enum(STAFF_ROLES),
  password: passwordSchema,
});
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z.object({
  role: z.enum(STAFF_ROLES).optional(),
  active: z.boolean().optional(),
});
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "required"),
  newPassword: passwordSchema,
});

export const operatorSetupSchema = z.object({
  operatorName: trimmed(120),
  parkingName: trimmed(120),
  totalCapacity: z.coerce.number().int().min(1).max(20000),
  managerName: trimmed(120),
  managerEmail: z.string().trim().email("invalid_email"),
  managerPassword: passwordSchema,
});
export type OperatorSetupInput = z.infer<typeof operatorSetupSchema>;
