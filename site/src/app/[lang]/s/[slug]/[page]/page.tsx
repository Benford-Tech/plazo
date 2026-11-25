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
import { pageOf } from "@/lib/parking-site";
import { loadSite, previewOf, requestHost, type SiteSearch } from "@/lib/parking-site-load";
import { openGraph, parkingMetaDescription } from "@/lib/seo";
import { faqLd } from "@/lib/structured-data";

// 24/11/2026 (« je veux pouvoir faire des sites comme celui-ci », choix B): the pages of a parking's site, one per
// destination (« Parking proche de … »), then the questions, the contact and the legal notice.
export const dynamic = "force-dynamic";

type Params = Promise<{ lang?: string; slug: string; page: string }>;

async function open(params: Params, searchParams: SiteSearch) {
  const { slug, page } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(page)) return null;
  const loaded = await loadSite(slug, await previewOf(searchParams));
  if (!loaded) return null;
  const opened = pageOf(loaded.site, page);
  return opened ? { ...loaded, page, opened } : null;
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SiteSearch }): Promise<Metadata> {
  await enterLocaleFrom(params);
  const found = await open(params, searchParams);
  if (!found) return { title: fr.parkingSite.notFound, robots: { index: false, follow: false } };
  const { site, data, page, opened } = found;
  const t = fr.parkingSite;
  const name =
    opened.kind === "destination"
      ? t.nearTitle(opened.destination.name)
      : opened.kind === "questions"
        ? t.questions
        : opened.kind === "contact"
          ? t.contact
          : opened.kind === "tarifs"
            ? t.prices
            : t.legal;
  const title = `${name} · ${data.parking.title}`;
  const description = opened.kind === "destination" ? t.nearIntro(data.parking.title, opened.destination.name) : parkingMetaDescription(data);
  const path = site.domain ? `https://${site.domain}/${page}` : lp(`/s/${site.slug}/${page}`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    // A preview, a demo parking and the legal notice are not offered to search engines.
    ...(site.preview || data.parking.isDemo || opened.kind === "mentions-legales" ? { robots: { index: false, follow: false } } : {}),
    openGraph: openGraph({ title, description, url: path, ...(data.parking.photos[0] ? { images: [data.parking.photos[0]] } : {}) }),
    // 25/11/2026 (« le favicon prend le logo du client »): the parking's logo in the browser tab.
    ...(site.iconUrl ? { icons: { icon: site.iconUrl, apple: site.iconUrl } } : {}),
  };
}

export default async function ParkingSiteSubPage({ params, searchParams }: { params: Params; searchParams: SiteSearch }) {
  await enterLocaleFrom(params);
  const found = await open(params, searchParams);
  if (!found) notFound();
  const { site, data, page, opened } = found;
  if (site.domain && !site.preview) {
    const host = await requestHost();
    if (host && host !== site.domain) redirect(`https://${site.domain}/${page}`);
  }
  const withFaq = opened.kind === "questions" && !site.preview && !data.parking.isDemo;
  return (
    <>
      {withFaq && <JsonLd data={[faqLd(parkingFaq(data))]} />}
      {/* A preview follows the pro space's form as it is typed (24/11/2026). */}
      {site.preview ? (
        <LivePreview site={site} data={data} idempotencyKey={randomUUID()} page={page} />
      ) : (
        <ParkingSite site={site} data={data} idempotencyKey={randomUUID()} page={page} />
      )}
    </>
  );
}
