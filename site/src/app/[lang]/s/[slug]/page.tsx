import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ParkingSite } from "@/components/parking-site/ParkingSite";
import { api, ApiError } from "@/lib/api";
import { fr } from "@/lib/fr";
import { enterLocaleFrom } from "@/lib/i18n/server";
import { lp } from "@/lib/i18n/runtime";
import { parkingFaq } from "@/lib/parking-more";
import { openGraph, parkingMetaDescription } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { faqLd, parkingLd } from "@/lib/structured-data";

// 22/11/2026 (« pouvoir créer un site dédié au parking », « le plus modulaire possible »): a parking's own site,
// /s/<slug>, made of the blocks its manager ordered. Offline it answers 404, except with the manager's preview key.
export const dynamic = "force-dynamic";

type Params = Promise<{ lang?: string; slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

async function load(slug: string, preview: string | null) {
  try {
    const site = await api.parkingSite(slug, preview);
    const data = await api.parking(site.airport, site.parking);
    return { site, data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const previewOf = async (searchParams: Search) => {
  const key = (await searchParams).apercu;
  return typeof key === "string" && /^[a-f0-9]{10,64}$/.test(key) ? key : null;
};

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const loaded = await load(slug, await previewOf(searchParams));
  if (!loaded) return { title: fr.parkingSite.notFound, robots: { index: false, follow: false } };
  const { site, data } = loaded;
  const title = fr.meta.parkingTitle(data.parking.title, data.airport.name);
  const description = parkingMetaDescription(data);
  const path = `/s/${site.slug}`;
  return {
    // The parking's own name, without Plazo's after it.
    title: { absolute: title },
    description,
    alternates: { canonical: lp(path) },
    // A preview and a demo parking are never offered to search engines.
    ...(site.preview || data.parking.isDemo ? { robots: { index: false, follow: false } } : {}),
    openGraph: openGraph({ title, description, url: lp(path), ...(data.parking.photos[0] ? { images: [data.parking.photos[0]] } : {}) }),
  };
}

export default async function ParkingSitePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const loaded = await load(slug, await previewOf(searchParams));
  if (!loaded) notFound();
  const { site, data } = loaded;
  return (
    <>
      {!site.preview && !data.parking.isDemo && <JsonLd data={[parkingLd(siteUrl(), data, parkingMetaDescription(data)), faqLd(parkingFaq(data))]} />}
      <ParkingSite site={site} data={data} idempotencyKey={randomUUID()} />
    </>
  );
}
