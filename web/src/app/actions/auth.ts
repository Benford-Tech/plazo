"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { loginSchema } from "@/domain/validation";
import { SESSION_COOKIE, setSessionCookie, userAgent } from "@/server/auth/current";
import { login, revokeSession } from "@/server/auth/sessions";
import { fromZodError, submittedValues, type FormState } from "./form-state";

export async function loginAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error, formData);

  const result = await login(getDb(), { ...parsed.data, client: "web", userAgent: await userAgent() });
  if (!result.ok) return { ok: false, code: result.reason, values: submittedValues(formData) };

  await setSessionCookie(result.token, result.expiresAt);
  redirect("/espace");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(getDb(), token);
  store.delete(SESSION_COOKIE);
  redirect("/connexion");
}
