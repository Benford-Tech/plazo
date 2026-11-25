import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LivePreview } from "@/components/parking-site/LivePreview";
import { ParkingSite } from "@/components/parking-site/ParkingSite";
import { fr } from "@/lib/fr";
import { enterLocaleFrom } from "@/lib/i18n/server";
import { lp } from "@/lib/i18n/runtime";
import { parkingFaq } from "@/lib/parking-more";
import { loadSite, previewOf, requestHost, type SiteSearch } from "@/lib/parking-site-load";
import { openGraph, parkingMetaDescription } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { faqLd, parkingLd } from "@/lib/structured-data";

// 22/11/2026 (« pouvoir créer un site dédié au parking », « le plus modulaire possible »): a parking's own site,
// /s/<slug>, made of the blocks its manager ordered. Offline it answers 404, except with the manager's preview key.
export const dynamic = "force-dynamic";

type Params = Promise<{ lang?: string; slug: string }>;
type Search = SiteSearch;
const load = loadSite;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const loaded = await load(slug, await previewOf(searchParams));
  if (!loaded) return { title: fr.parkingSite.notFound, robots: { index: false, follow: false } };
  const { site, data } = loaded;
  const title = fr.meta.parkingTitle(data.parking.title, data.airport.name);
  const description = parkingMetaDescription(data);
  // On its own domain the site's one address is that domain; plazo.fr/s/<slug> otherwise.
  const path = site.domain ? `https://${site.domain}/` : lp(`/s/${site.slug}`);
  return {
    // The parking's own name, without Plazo's after it.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    // A preview and a demo parking are never offered to search engines.
    ...(site.preview || data.parking.isDemo ? { robots: { index: false, follow: false } } : {}),
    openGraph: openGraph({ title, description, url: path, ...(data.parking.photos[0] ? { images: [data.parking.photos[0]] } : {}) }),
    // 25/11/2026 (« le favicon prend le logo du client »): the parking's logo in the browser tab.
    ...(site.iconUrl ? { icons: { icon: site.iconUrl, apple: site.iconUrl } } : {}),
  };
}

export default async function ParkingSitePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const loaded = await load(slug, await previewOf(searchParams));
  if (!loaded) notFound();
  const { site, data } = loaded;
  // The parking's own domain is the site's address: plazo.fr/s/<slug> sends there (one address for search engines).
  if (site.domain && !site.preview) {
    const host = await requestHost();
    if (host && host !== site.domain) redirect(`https://${site.domain}/`);
  }
  return (
    <>
      {!site.preview && !data.parking.isDemo && <JsonLd data={[parkingLd(siteUrl(), data, parkingMetaDescription(data)), faqLd(parkingFaq(data))]} />}
      {/* A preview follows the pro space's form as it is typed (24/11/2026). */}
      {site.preview ? (
        <LivePreview site={site} data={data} idempotencyKey={randomUUID()} />
      ) : (
        <ParkingSite site={site} data={data} idempotencyKey={randomUUID()} />
      )}
    </>
  );
}
