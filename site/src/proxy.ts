import { NextResponse, type NextRequest } from "next/server";
import { isManageToken, manageCookie, managePath, REFERENCE_RE, secureCookies } from "@/lib/manage-access";

/**
 * Links from the confirmation email and SMS carry the manage key (?cle=…): keep it in a cookie
 * limited to the booking's pages, then load the same page without it in the address.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const token = url.searchParams.get("cle");
  if (token === null) return NextResponse.next();

  const [, , reference = "", ...rest] = url.pathname.split("/");
  const target = url.clone();
  target.searchParams.delete("cle");
  if (!REFERENCE_RE.test(reference)) return NextResponse.redirect(target);

  target.pathname = [managePath(reference), ...rest].join("/");
  const response = NextResponse.redirect(target);
  if (isManageToken(token)) {
    const cookie = manageCookie(reference, token, secureCookies());
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export const config = {
  matcher: ["/ma-reservation/:reference", "/ma-reservation/:reference/agenda"],
};
