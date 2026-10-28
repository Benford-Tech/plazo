import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isProHost } from "@/lib/pro-host";
import { PRO_SITE_URL, siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // pro.plazo.fr (28/10/2026, SEO audit): its own sitemap, which lists Plazo Pro's pages.
  if (PRO_SITE_URL && isProHost((await headers()).get("host"))) {
    return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pro/"] }], sitemap: `${PRO_SITE_URL}/sitemap.xml` };
  }
  return {
    // The API, the pro space and the travellers' booking pages are not for search engines.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pro/", "/ma-reservation"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
