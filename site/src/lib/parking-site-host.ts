import { PRO_HOST, siteUrl } from "./site";

/**
 * A parking's own domain name (22/11/2026, « le nom de domaine du parking »): the site answers on it. The router asks
 * the API which site a foreign host opens, and keeps the answer a minute (a host that opens nothing included).
 */

const OWN_HOSTS = [/(^|\.)plazo\.fr$/, /(^|\.)vercel\.app$/, /^localhost$/, /^127\.0\.0\.1$/, /^\[?::1\]?$/];

/** « www.parking-des-cedres.fr:443 » → « www.parking-des-cedres.fr »; null for Plazo's own hosts and anything unreadable. */
export function foreignHost(header: string | null): string | null {
  const host = (header ?? "").trim().toLowerCase().replace(/:\d+$/, "");
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return null;
  if (OWN_HOSTS.some(re => re.test(host)) || host === PRO_HOST) return null;
  try {
    if (host === new URL(siteUrl()).host) return null;
  } catch {
    // No site URL configured: the patterns above decide.
  }
  return host;
}

const TTL_MS = 60_000;
const MAX_ENTRIES = 500;
interface HostSite {
  slug: string | null;
  /** The page names the host answers besides its home page. */
  pages: string[];
}
const cache = new Map<string, HostSite & { at: number }>();

/** The site a parking's own host opens and its pages; a null slug when it opens none (or the API does not answer). */
export async function siteOfHost(host: string, backendUrl: string, now = Date.now()): Promise<HostSite> {
  const known = cache.get(host);
  if (known && now - known.at < TTL_MS) return known;
  const last: HostSite = known ?? { slug: null, pages: [] };
  const site: HostSite = { slug: null, pages: [] };
  try {
    const res = await fetch(`${backendUrl}/api/public/site-domains/${encodeURIComponent(host)}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const body = (await res.json()) as { slug?: unknown; pages?: unknown };
      if (typeof body.slug === "string" && /^[a-z0-9-]+$/.test(body.slug)) {
        site.slug = body.slug;
        if (Array.isArray(body.pages)) site.pages = body.pages.filter((p): p is string => typeof p === "string" && /^[a-z0-9-]{1,40}$/.test(p));
      }
    } else if (res.status !== 404) {
      // The API is unwell: keep the last answer rather than close a site that was open.
      return last;
    }
  } catch {
    return last;
  }
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(host, { ...site, at: now });
  return site;
}

/** The slug of the site a parking's own host opens; null when it opens none. */
export const siteSlugOfHost = async (host: string, backendUrl: string, now = Date.now()) => (await siteOfHost(host, backendUrl, now)).slug;

/** For the tests. */
export const forgetSiteHosts = () => cache.clear();
