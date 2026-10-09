import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { topicLinks } from "@/lib/guides";
import { AIRPORTS, airportPath, siteUrl } from "@/lib/site";

// Lists the published parkings, read from the API at request time (never at build time). Demo parkings
// are fictional: they stay out of it (and their pages are not indexed).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, changeFrequency: "weekly", priority: 1 }];
  for (const { slug } of AIRPORTS) {
    // The default airport's page is the home page ("/" is its canonical address).
    if (airportPath(slug) !== "/") entries.push({ url: `${base}${airportPath(slug)}`, changeFrequency: "weekly", priority: 0.9 });
    // Topic guides (09/10/2026): « parking pas cher », « longue durée », « voiturier ».
    for (const topic of topicLinks(slug)) entries.push({ url: `${base}${topic.href}`, changeFrequency: "monthly", priority: 0.8 });
    try {
      const { listings } = await api.airport(slug);
      for (const listing of listings.filter(l => !l.isDemo)) entries.push({ url: `${base}/${slug}/${listing.slug}`, changeFrequency: "weekly", priority: 0.8 });
    } catch {
      // API unavailable: the static entries are still worth serving.
    }
  }
  return entries;
}
