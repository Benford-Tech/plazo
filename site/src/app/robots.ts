import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { foreignHost } from "@/lib/parking-site-host";
import { isProHost } from "@/lib/pro-host";
import { PRO_SITE_URL, siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  // A parking's own domain (25/11/2026): its own sitemap, which lists that site's pages.
  const own = foreignHost(host);
  if (own) return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }], sitemap: `https://${own}/sitemap.xml` };
  // pro.plazo.fr (28/10/2026, SEO audit): its own sitemap, which lists Plazo Pro's pages.
  if (PRO_SITE_URL && isProHost(host)) {
    return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pro/"] }], sitemap: `${PRO_SITE_URL}/sitemap.xml` };
  }
  return {
    // The API, the pro space and the travellers' booking pages are not for search engines.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pro/", "/ma-reservation"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
