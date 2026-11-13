import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { loadAirport } from "@/components/AirportView";
import { TopicGuideView } from "@/components/TopicGuideView";
import { topicFacts } from "@/lib/airport-guides";
import { api } from "@/lib/api";
import { addDays, defaultStay } from "@/lib/dates";
import { topicGuide } from "@/lib/guides";
import { hasTopicGuides, isGuideTopic, topicPath } from "@/lib/guides/topics";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { SLUG_RE } from "@/lib/site";
import type { SearchResponse } from "@/lib/types";
import { enterLocaleFrom } from "@/lib/i18n/server";

// C (09/10/2026): built on shared reads only, so cached and rebuilt every few minutes (ISR). Nothing is
// prerendered at build time: the API is reached through a runtime binding.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

type Props = PageProps<"/[lang]/[airport]/guide/[topic]">;

/** The guide pages work without the search: the partners' figures are then simply left out. */
async function searchOrNull(airport: string, arrivee: string, retour: string): Promise<SearchResponse | null> {
  try {
    return await api.sharedSearch(airport, arrivee, retour);
  } catch {
    return null;
  }
}

/** One load per request, shared by the metadata and the page. */
const loadTopic = cache(async (airportSlug: string, topic: string) => {
  if (!SLUG_RE.test(airportSlug) || !hasTopicGuides(airportSlug) || !isGuideTopic(topic)) notFound();
  const data = await loadAirport(airportSlug);
  const week = defaultStay();
  // Long stay: two weeks from the same drop-off.
  const twoWeeks = { arrivee: week.arrivee, retour: `${addDays(week.arrivee.slice(0, 10), 14)}T18:00` };
  const long = topic === "parking-longue-duree";
  const [weekPreview, twoWeeksPreview] = await Promise.all([
    searchOrNull(airportSlug, week.arrivee, week.retour),
    long ? searchOrNull(airportSlug, twoWeeks.arrivee, twoWeeks.retour) : Promise.resolve(null),
  ]);
  const guide = topicGuide(airportSlug, topic, topicFacts(data.listings, weekPreview, twoWeeksPreview));
  if (!guide) notFound();
  return {
    data,
    guide,
    path: topicPath(airportSlug, topic),
    stay: long ? twoWeeks : week,
    preview: long ? twoWeeksPreview : weekPreview,
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await enterLocaleFrom(params);
  const { airport, topic } = await params;
  const { guide, path } = await loadTopic(airport, topic);
  return {
    // The page's keyword comes first; the layout's template would only repeat the product name.
    title: { absolute: `${guide.metaTitle} · ${PRODUCT_NAME}` },
    description: guide.metaDescription,
    // Written in French only for now (13/11/2026): one address, the French one.
    alternates: { canonical: path },
    openGraph: openGraph({ title: guide.metaTitle, description: guide.metaDescription, url: path, type: "article" }),
  };
}

export default async function TopicGuidePage({ params }: Props) {
  const locale = await enterLocaleFrom(params);
  const { airport, topic } = await params;
  const { data, guide, path, stay, preview } = await loadTopic(airport, topic);
  // The guides are written in French only for now: the other languages read the French page.
  if (locale !== "fr") permanentRedirect(path);
  return <TopicGuideView airport={data.airport} guide={guide} path={path} stay={stay} preview={preview} listings={data.listings} />;
}
