import type { NextRequest } from "next/server";
import { api, ApiError } from "@/lib/api";
import { bookingIcs } from "@/lib/ics";
import { REFERENCE_RE } from "@/lib/manage-access";
import { manageTokenFor } from "@/lib/manage-session";
import { siteUrl } from "@/lib/site";

/** "Ajouter à l'agenda": the booking's drop-off and return as an .ics file (manage key from the cookie). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/ma-reservation/[reference]/agenda">) {
  const { reference } = await ctx.params;
  const token = REFERENCE_RE.test(reference) ? await manageTokenFor(reference) : null;
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "same-origin", "X-Robots-Tag": "noindex" };
  if (!token || !REFERENCE_RE.test(reference)) return new Response("Introuvable", { status: 404, headers });
  try {
    const booking = await api.booking(reference, token);
    return new Response(bookingIcs(booking, { siteUrl: siteUrl() }), {
      headers: {
        ...headers,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservation-${booking.reference}.ics"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return new Response("Introuvable", { status: 404, headers });
    throw error;
  }
}
