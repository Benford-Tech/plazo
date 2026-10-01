import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db/client";
import { can, type Permission } from "@/domain/roles";
import { validateSessionToken, type AuthenticatedUser } from "./sessions";

export const SESSION_COOKIE = "plazo_session";

/** Current staff member from the web session cookie, memoized per request. */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? validateSessionToken(getDb(), token) : null;
});

export async function requireUser(permission?: Permission): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (permission && !can(user.role, permission)) redirect("/espace");
  return user;
}

/** Current staff member from an `Authorization: Bearer` header (mobile app). */
export async function getBearerUser(request: Request): Promise<AuthenticatedUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? validateSessionToken(getDb(), match[1].trim()) : null;
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function userAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}
