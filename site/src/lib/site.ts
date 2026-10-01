/** Airport shown at "/" (the site starts with Lyon Saint-Exupéry). */
export const DEFAULT_AIRPORT = "lyon-saint-exupery";

/** Airports listed in the footer and the sitemap. */
export const AIRPORTS: { slug: string; name: string }[] = [{ slug: DEFAULT_AIRPORT, name: "Lyon Saint-Exupéry" }];

/** Parkings' local time: every date exchanged with the API is a wall-clock time in this zone. */
export const TIMEZONE = "Europe/Paris";

/** The operators' pro space, served under /pro on the same domain. */
export const PRO_LOGIN_PATH = "/pro/login";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Public address of the site, for canonical URLs, the sitemap and Open Graph. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
