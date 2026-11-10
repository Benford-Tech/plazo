/** 10/11/2026 (direction A): the super admin's parking switcher, helpers kept out of the component. */

const RECENT_KEY = "plazo:recent-parkings";
const RECENT_MAX = 3;

/** Ids of the parkings opened last, newest first (per browser; empty when storage is refused). */
export function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((r) => r !== id)].slice(0, RECENT_MAX)));
  } catch {
    // A private window: no recents, nothing else changes.
  }
}

const RESERVATION_PAGES = new Set(["nouvelle", "a-verifier", "importer", "supprimees", "services", "sms-veille"]);

/**
 * The same page in the other parking: a page about one record of this parking (a reservation, a contract
 * template) falls back to its list, the platform's pages to the dashboard.
 */
export function samePageIn(pathname: string): string {
  if (pathname.startsWith("/plateforme")) return "/";
  const reservation = /^\/reservations\/([^/]+)/.exec(pathname);
  if (reservation && !RESERVATION_PAGES.has(reservation[1])) return "/reservations";
  if (pathname.startsWith("/parking/contrat/")) return "/parking/reglages";
  return pathname || "/";
}

