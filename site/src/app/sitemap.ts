import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { api } from "@/lib/api";
import { topicFacts } from "@/lib/airport-guides";
import { topicGuide, topicLinks } from "@/lib/guides";
import { LOCALE_TAGS, LOCALES, localizedPath } from "@/lib/i18n/locales";
import { foreignHost } from "@/lib/parking-site-host";
import { isProHost } from "@/lib/pro-host";
import { PRO_HOME_UPDATED, PRO_PRICING_UPDATED, PRO_TOPICS } from "@/lib/pro-topics";
import { AIRPORTS, airportPath, PRO_HOME_PATH, PRO_PRICING_PATH, PRO_SITE_URL, PRO_TOPIC_SLUGS, siteUrl } from "@/lib/site";

// Lists the published parkings, read from the API at request time (never at build time). Demo parkings
// are fictional: they stay out of it (and their pages are not indexed).
export const dynamic = "force-dynamic";

/** The same page in every language (13/11/2026): search engines list each address with its alternates. */
function inEveryLanguage(base: string, path: string): { alternates: { languages: Record<string, string> } } {
  return { alternates: { languages: Object.fromEntries(LOCALES.map(locale => [LOCALE_TAGS[locale], `${base}${localizedPath(locale, path)}`])) } };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  // A parking's own domain (25/11/2026): its sitemap lists that site's pages only.
  const own = foreignHost(host);
  if (own) return parkingHostSitemap(own);
  // pro.plazo.fr (28/10/2026, SEO audit): its sitemap lists Plazo Pro's pages only, the travellers' stay on www.
  if (PRO_SITE_URL && isProHost(host)) {
    return [
      { url: `${PRO_SITE_URL}/`, lastModified: PRO_HOME_UPDATED, changeFrequency: "monthly", priority: 1 },
      { url: `${PRO_SITE_URL}/tarifs`, lastModified: PRO_PRICING_UPDATED, changeFrequency: "monthly", priority: 0.8 },
      ...PRO_TOPIC_SLUGS.map(slug => ({
        url: `${PRO_SITE_URL}/${slug}`,
        lastModified: PRO_TOPICS[slug].updated,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  }
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1, ...inEveryLanguage(base, "/") },
    // /suppression-compte left out on 25/11/2026: the stores link it directly, search engines have nothing to find there.
    // 27/10/2026: Plazo Pro's home page and pricing page, for the operators.
    // Under /loueurs until Plazo Pro has its own address (then its pages are listed by that host, not this one).
    ...(PRO_SITE_URL
      ? []
      : [
          { url: `${base}${PRO_HOME_PATH}`, changeFrequency: "monthly" as const, priority: 0.7 },
          { url: `${base}${PRO_PRICING_PATH}`, changeFrequency: "monthly" as const, priority: 0.6 },
        ]),
  ];
  for (const { slug } of AIRPORTS) {
    // The default airport's page is the home page ("/" is its canonical address).
    if (airportPath(slug) !== "/") entries.push({ url: `${base}${airportPath(slug)}`, changeFrequency: "weekly", priority: 0.9, ...inEveryLanguage(base, airportPath(slug)) });
    // Topic guides (09/10/2026): « parking pas cher », « longue durée », « voiturier », with the day their facts were
    // last checked (C, 09/10/2026: search engines only trust a lastmod that changes with the content).
    for (const topic of topicLinks(slug)) {
      const updated = topicGuide(slug, topic.slug, topicFacts([], null, null))?.updated;
      entries.push({ url: `${base}${topic.href}`, changeFrequency: "monthly", priority: 0.8, ...(updated ? { lastModified: updated } : {}) });
    }
    try {
      const { listings } = await api.airport(slug);
      for (const listing of listings.filter(l => !l.isDemo)) entries.push({ url: `${base}/${slug}/${listing.slug}`, changeFrequency: "weekly", priority: 0.8, ...inEveryLanguage(base, `/${slug}/${listing.slug}`) });
    } catch {
      // API unavailable: the static entries are still worth serving.
    }
  }
  // The parkings' own sites (25/11/2026): those without their own domain live under /s/<slug>.
  try {
    const { sites } = await api.onlineSites();
    for (const site of sites.filter(s => !s.domain)) {
      const lastModified = site.updatedAt;
      entries.push({ url: `${base}/s/${site.slug}`, lastModified, changeFrequency: "weekly", priority: 0.6, ...inEveryLanguage(base, `/s/${site.slug}`) });
      for (const page of site.pages) {
        entries.push({ url: `${base}/s/${site.slug}/${page}`, lastModified, changeFrequency: "monthly", priority: 0.5, ...inEveryLanguage(base, `/s/${site.slug}/${page}`) });
      }
    }
  } catch {
    // API unavailable: the rest is still worth serving.
  }
  return entries;
}

/** A parking's own domain: its home page and its pages, nothing of Plazo's. Empty when the host opens no site. */
async function parkingHostSitemap(host: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { sites } = await api.onlineSites();
    const site = sites.find(s => s.domain === host);
    if (!site) return [];
    const base = `https://${host}`;
    return [
      { url: `${base}/`, lastModified: site.updatedAt, changeFrequency: "weekly", priority: 1, ...inEveryLanguage(base, "/") },
      ...site.pages.map(page => ({
        url: `${base}/${page}`,
        lastModified: site.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        ...inEveryLanguage(base, `/${page}`),
      })),
    ];
  } catch {
    return [];
  }
}
