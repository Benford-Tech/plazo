import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_HEADER, localizedPath, splitLocale } from "@/lib/i18n/locales";
import { isManageToken, manageCookie, managePath, REFERENCE_RE, secureCookies } from "@/lib/manage-access";

/**
 * Every page of the site is under its language (13/11/2026): French at the root (served from /fr internally), the
 * other languages under /en, /de… An address written with /fr goes to its one address, without the prefix.
 *
 * Links from the confirmation email and SMS carry the manage key (?cle=…): keep it in a cookie limited to the
 * booking's pages, then load the same page without it in the address.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const { locale, path } = splitLocale(url.pathname);

  if (url.searchParams.has("cle") && path.startsWith("/ma-reservation/")) return keepManageKey(request, locale, path);

  // « /fr/contact » → « /contact »: French has one address.
  if (url.pathname === `/${DEFAULT_LOCALE}` || url.pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const target = url.clone();
    target.pathname = url.pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(target, 308);
  }

  // The language travels with the request for the server actions, which run outside the [lang] layout.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  if (locale !== DEFAULT_LOCALE) return NextResponse.next({ request: { headers } });
  const target = url.clone();
  target.pathname = `/${DEFAULT_LOCALE}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(target, { request: { headers } });
}

function keepManageKey(request: NextRequest, locale: ReturnType<typeof splitLocale>["locale"], path: string) {
  const url = request.nextUrl;
  const token = url.searchParams.get("cle") ?? "";
  const [, , reference = "", ...rest] = path.split("/");
  const target = url.clone();
  target.searchParams.delete("cle");
  if (!REFERENCE_RE.test(reference)) return NextResponse.redirect(target);

  target.pathname = localizedPath(locale, [managePath(reference), ...rest].join("/"));
  const response = NextResponse.redirect(target);
  if (isManageToken(token)) {
    // The cookie is sent to the booking's pages in this language (one cookie per name and path).
    const cookie = manageCookie(reference, token, secureCookies(), locale);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export const config = {
  // Pages only: not the files (a dot in the last segment), Next's own, the API and the pro space (other services).
  matcher: ["/((?!_next/|api/|pro/|pro$|\\.well-known/|.*\\.[a-zA-Z0-9]+$).*)"],
};
