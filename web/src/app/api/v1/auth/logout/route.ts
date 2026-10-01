import { getDb } from "@/db/client";
import { revokeSession } from "@/server/auth/sessions";

export async function POST(request: Request) {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (match) await revokeSession(getDb(), match[1].trim());
  return new Response(null, { status: 204 });
}
