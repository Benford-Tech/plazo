import { getDb } from "@/db/client";
import { loginSchema } from "@/domain/validation";
import { login } from "@/server/auth/sessions";

// Mobile app login: returns a bearer token instead of setting a cookie.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const result = await login(getDb(), {
    ...parsed.data,
    client: "mobile",
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: result.reason === "too_many_attempts" ? 429 : 401 });
  }
  return Response.json({ token: result.token, expiresAt: result.expiresAt.toISOString(), user: result.user });
}
