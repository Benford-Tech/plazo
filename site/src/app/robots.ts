import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The API, the pro space and the travellers' booking pages are not for search engines.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pro/", "/ma-reservation"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
