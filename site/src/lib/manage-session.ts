import "server-only";
import { cookies } from "next/headers";
import { actionLocale } from "./i18n/server";
import { isManageToken, manageCookie, manageCookieName, secureCookies } from "./manage-access";

/** The manage key of a booking kept by this browser, if any. */
export async function manageTokenFor(reference: string): Promise<string | null> {
  const value = (await cookies()).get(manageCookieName(reference))?.value;
  return isManageToken(value) ? value : null;
}

/** Keeps a booking's manage key in this browser (server actions and route handlers only). */
export async function rememberManageToken(reference: string, token: string): Promise<void> {
  // Sent to the booking's pages in the language the action was posted from.
  const cookie = manageCookie(reference, token, secureCookies(), await actionLocale());
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
}
