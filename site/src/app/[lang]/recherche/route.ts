import type { NextRequest } from "next/server";
import { encodeQueryValue, joinLocal } from "@/lib/dates";
import { localeOf } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/locales";
import { DEFAULT_AIRPORT, SLUG_RE } from "@/lib/site";

/**
 * Target of the search forms (GET, works without JavaScript): joins the separate date and time
 * fields into "YYYY-MM-DDTHH:mm" and redirects to the results page, or to a parking's page when the
 * form came from one. Only slugs are accepted in the target path (no open redirect).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/[lang]/recherche">) {
  const locale = localeOf((await ctx.params).lang);
  const q = request.nextUrl.searchParams;
  const airportParam = q.get("aeroport") ?? "";
  const airport = SLUG_RE.test(airportParam) ? airportParam : DEFAULT_AIRPORT;
  const parkingParam = q.get("parking") ?? "";
  const parking = SLUG_RE.test(parkingParam) ? parkingParam : null;
  const arrivee = joinLocal(q.get("date_depot"), q.get("heure_depot")) ?? "";
  const retour = joinLocal(q.get("date_retour"), q.get("heure_retour")) ?? "";
  const path = parking ? `/${airport}/${parking}` : `/${airport}/recherche`;
  // The results page's map stays shown when the search is changed from it.
  const map = !parking && q.get("carte") === "1" ? "&carte=1" : "";
  const location = `${localizedPath(locale, path)}?arrivee=${encodeQueryValue(arrivee)}&retour=${encodeQueryValue(retour)}${map}`;
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}
