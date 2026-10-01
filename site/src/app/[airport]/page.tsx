import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AirportView, loadAirport } from "@/components/AirportView";
import { fr } from "@/lib/fr";
import { openGraph } from "@/lib/seo";
import { DEFAULT_AIRPORT, SLUG_RE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[airport]">): Promise<Metadata> {
  const { airport: slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const { airport } = await loadAirport(slug);
  const title = fr.meta.airportTitle(airport.name);
  const description = fr.meta.airportDescription(airport.name);
  // The default airport's page is also the home page: one canonical address for both, "/".
  const canonical = airport.slug === DEFAULT_AIRPORT ? "/" : `/${airport.slug}`;
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
  return <AirportView slug={airport} showBreadcrumb />;
}
