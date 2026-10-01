import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { AIRPORTS, DEFAULT_AIRPORT, siteUrl } from "@/lib/site";

// Lists the published parkings, read from the API at request time (never at build time).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, changeFrequency: "weekly", priority: 1 }];
  for (const { slug } of AIRPORTS) {
    // The default airport's page is the home page ("/" is its canonical address).
    if (slug !== DEFAULT_AIRPORT) entries.push({ url: `${base}/${slug}`, changeFrequency: "weekly", priority: 0.9 });
    try {
      const { listings } = await api.airport(slug);
      for (const listing of listings) entries.push({ url: `${base}/${slug}/${listing.slug}`, changeFrequency: "weekly", priority: 0.8 });
    } catch {
      // API unavailable: the static entries are still worth serving.
    }
  }
  return entries;
}
