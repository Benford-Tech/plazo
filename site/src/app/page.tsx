import type { Metadata } from "next";
import { AirportView, loadAirport } from "@/components/AirportView";
import { fr } from "@/lib/fr";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { DEFAULT_AIRPORT } from "@/lib/site";

// The API is reached through a runtime binding: never prerender at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { airport } = await loadAirport(DEFAULT_AIRPORT);
  return {
    // The page's main keyword is its airport (the layout's template would add the product name).
    title: { absolute: `${fr.meta.airportTitle(airport.name)} · ${PRODUCT_NAME}` },
    description: fr.meta.airportDescription(airport.name),
    alternates: { canonical: "/" },
    openGraph: openGraph({ title: fr.meta.airportTitle(airport.name), description: fr.meta.airportDescription(airport.name), url: "/" }),
  };
}

export default function HomePage() {
  return <AirportView slug={DEFAULT_AIRPORT} showBreadcrumb={false} />;
}
