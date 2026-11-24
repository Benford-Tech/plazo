import { lp } from "@/lib/i18n/runtime";
import type { ParkingSiteInfo, SiteDestination } from "@/lib/types";

/**
 * A parking's site with several pages (24/11/2026, choix B): one page per destination (the airport, each stop of the
 * shuttle), then the questions, the contact and the legal notice. The home page is the page with no name.
 */
export const FIXED_PAGES = ["questions", "contact", "mentions-legales"] as const;
export type FixedPage = (typeof FIXED_PAGES)[number];

/** The address of one of the site's pages (the home page without a name), in the visitor's language. */
export function sitePath(site: ParkingSiteInfo, page?: string | null, hash = ""): string {
  const base = site.links?.base ?? `/s/${site.slug}`;
  return `${lp(`${base}${page ? `/${page}` : ""}` || "/")}${site.links?.query ?? ""}${hash}`;
}

/** Every look but the sober one: bands across the page, the booking brought up under the title. */
export const isRich = (site: ParkingSiteInfo) => (site.theme ?? "simple") !== "simple";

export const hasPages = (site: ParkingSiteInfo) => (site.pages?.length ?? 0) > 0;

/** What a page name opens: a destination, a fixed page, or nothing (404). */
export function pageOf(site: ParkingSiteInfo, name: string): { kind: "destination"; destination: SiteDestination } | { kind: FixedPage } | null {
  if (!site.pages?.includes(name)) return null;
  const destination = site.destinations?.find(d => d.slug === name);
  if (destination) return { kind: "destination", destination };
  return (FIXED_PAGES as readonly string[]).includes(name) ? { kind: name as FixedPage } : null;
}

/** The block kinds each page shows, in its own order; the home page shows the manager's order. */
export const PAGE_BLOCKS = {
  destination: ["booking", "steps", "pricing", "faq", "contact"],
  questions: ["faq", "contact"],
  contact: ["contact", "access"],
  "mentions-legales": [],
} as const;
