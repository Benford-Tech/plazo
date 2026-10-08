/** Airport shown at "/" (the site starts with Lyon Saint-Exupéry). */
export const DEFAULT_AIRPORT = "lyon-saint-exupery";

/** Airports listed in the footer and the sitemap. */
export const AIRPORTS: { slug: string; name: string }[] = [{ slug: DEFAULT_AIRPORT, name: "Lyon Saint-Exupéry" }];

/** Parkings' local time: every date exchanged with the API is a wall-clock time in this zone. */
export const TIMEZONE = "Europe/Paris";

/**
 * "Vous êtes un parking ?": the operators' sign-up page in the pro space (served under /pro on the
 * same domain; it links to the login page for existing accounts).
 */
export const PRO_SIGNUP_PATH = "/pro/inscription";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Canonical path of an airport's page: the default airport's page is the home page, "/". */
export function airportPath(slug: string): string {
  return slug === DEFAULT_AIRPORT ? "/" : `/${slug}`;
}

/** Public address of the site, for canonical URLs, the sitemap and Open Graph. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
