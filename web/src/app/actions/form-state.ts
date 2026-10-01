import type { ZodError } from "zod";
import { DomainError, ForbiddenError, NotFoundError } from "@/server/errors";

export type FormState = {
  ok?: boolean;
  /** Error or info code, translated by the UI. */
  code?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values (never passwords), so fields keep what the user typed after an error. */
  values?: Record<string, string>;
};

const SECRET_FIELDS = /password/i;

export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$") && !SECRET_FIELDS.test(key)) values[key] = value;
  }
  return values;
}

export function fromZodError(error: ZodError, formData?: FormData): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, fieldErrors, values: formData && submittedValues(formData) };
}

export function fromError(error: unknown, formData?: FormData): FormState {
  const values = formData && submittedValues(formData);
  if (error instanceof DomainError) return { ok: false, code: error.code, values };
  if (error instanceof ForbiddenError) return { ok: false, code: "forbidden" };
  if (error instanceof NotFoundError) return { ok: false, code: "not_found" };
  console.error(error);
  return { ok: false, code: "unknown" };
}
