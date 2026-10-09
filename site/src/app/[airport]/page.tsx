import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AirportView, loadAirport } from "@/components/AirportView";
import { JsonLd } from "@/components/JsonLd";
import { fr, texts } from "@/lib/fr";
import { openGraph } from "@/lib/seo";
import { airportPath, DEFAULT_AIRPORT, siteUrl, SLUG_RE } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/structured-data";

// C (09/10/2026): built on shared reads only, so cached and rebuilt every few minutes (ISR) instead of rendered
// for each visit. Nothing is prerendered at build time: the API is reached through a runtime binding. The
// default airport's page is also the home page: "/" is rewritten here, and its own address redirects to "/"
// (next.config.ts).
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[airport]">): Promise<Metadata> {
  const { airport: slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const { airport, payments } = await loadAirport(slug);
  const title = fr.meta.airportTitle(airport.name);
  const description = texts(payments === "online").meta.airportDescription(airport.name);
  const canonical = airportPath(airport.slug);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: openGraph({ title, description, url: canonical }),
  };
}

export default async function AirportPage({ params }: PageProps<"/[airport]">) {
  const { airport } = await params;
  if (!SLUG_RE.test(airport)) notFound();
  const home = airport === DEFAULT_AIRPORT;
  const base = siteUrl();
  return (
    <>
      {home && <JsonLd data={[organizationLd(base), websiteLd(base)]} />}
      <AirportView slug={airport} showBreadcrumb={!home} />
    </>
  );
}
