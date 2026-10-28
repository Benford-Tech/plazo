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

/** « Se connecter à l'espace loueur » (footer A, 15/10/2026): the pro space's login page (admin route /login under /pro). */
export const PRO_LOGIN_PATH = "/pro/login";

/** Plazo Pro's pages for the operators (27/10/2026), on the site: the home page and the pricing page. */
export const OPERATORS_PREFIX = "/loueurs";
/**
 * Plazo Pro's own address (27/10/2026, « Le site pro est sur pro.plazo.fr »), e.g. https://pro.plazo.fr. Set once its DNS
 * answers: the pages are then served at its root (rewrites of next.config.ts), /loueurs redirects there and every link
 * points there. Unset: the pages stay under /loueurs on the travellers' site.
 */
export const PRO_SITE_URL = (process.env.NEXT_PUBLIC_PRO_SITE_URL ?? "").replace(/\/+$/, "") || null;
/** The host that serves Plazo Pro's pages at its root, even before the links point there. */
export const PRO_HOST = PRO_SITE_URL ? new URL(PRO_SITE_URL).host : "pro.plazo.fr";

/** The home page of Plazo Pro (27/10/2026, on the model of Solution Park's): « Vous êtes un parking ? » leads to it. */
export const PRO_HOME_PATH = PRO_SITE_URL ? `${PRO_SITE_URL}/` : OPERATORS_PREFIX;
export const PRO_PRICING_PATH = PRO_SITE_URL ? `${PRO_SITE_URL}/tarifs` : `${OPERATORS_PREFIX}/tarifs`;
/** Plazo Pro's pages by topic (28/10/2026, SEO mockups 3A): one search each, at the root of pro.plazo.fr. */
export const PRO_TOPIC_SLUGS = ["navette", "voiturier", "comparateurs"] as const;
export type ProTopicSlug = (typeof PRO_TOPIC_SLUGS)[number];
export const proTopicPath = (slug: ProTopicSlug) => (PRO_SITE_URL ? `${PRO_SITE_URL}/${slug}` : `${OPERATORS_PREFIX}/${slug}`);

/** « Essayer la démo »: the pro space's demo for prospects (21/10/2026), no account needed. */
export const PRO_DEMO_PATH = "/pro/demo";

/** The contact form (footer A, 15/10/2026). */
export const CONTACT_PATH = "/contact";

/** Where Brevo sends a reader who confirmed « La lettre » (redirectionUrl of the API's double opt-in). */
export const LETTER_CONFIRMED_PATH = "/lettre/confirmee";

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
