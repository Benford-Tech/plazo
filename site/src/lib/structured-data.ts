// schema.org data (JSON-LD) for search engines: it only restates what the page shows.
import { fromPriceUnit, serviceLabel } from "./fr";
import { formatEuros } from "./money";
import { hasSupportEmail, PRODUCT_NAME, SUPPORT_EMAIL } from "./product";
import type { AirportResponse, ParkingResponse } from "./types";

export type JsonLdObject = Record<string, unknown>;

const CONTEXT = "https://schema.org";

/** Absolute address of a path of the site ("/" stays the bare origin plus "/"). */
function absolute(base: string, path: string): string {
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** The publisher of the site (home page only). */
export function organizationLd(base: string): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: PRODUCT_NAME,
    url: `${base}/`,
    logo: `${base}/apple-icon.png`,
    ...(hasSupportEmail() ? { email: SUPPORT_EMAIL } : {}),
  };
}

/** The site itself (home page only). */
export function websiteLd(base: string): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: PRODUCT_NAME,
    url: `${base}/`,
    inLanguage: "fr-FR",
    publisher: { "@id": `${base}/#organization` },
  };
}

/** The questions and answers shown on the page. */
export function faqLd(faq: [string, string][]): JsonLdObject | null {
  if (faq.length === 0) return null;
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** The airport's partner parkings, in the page's order. Demo parkings are fictional: never described to search engines. */
export function parkingListLd(base: string, { airport, listings }: Pick<AirportResponse, "airport" | "listings">): JsonLdObject | null {
  const real = listings.filter(listing => !listing.isDemo);
  if (real.length === 0) return null;
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name: `Parkings à l’aéroport de ${airport.name}`,
    itemListElement: real.map((listing, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(base, `/${airport.slug}/${listing.slug}`),
      name: listing.title,
    })),
  };
}

export function breadcrumbLd(base: string, items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absolute(base, item.path) })),
  };
}

/** A parking's page: the place, its services and its lowest price ("dès …"). Null for a demo parking.
 * No link to the airport as a place: these parkings are outside it, at a shuttle's ride. */
export function parkingLd(base: string, { airport, parking }: Pick<ParkingResponse, "airport" | "parking">, description: string): JsonLdObject | null {
  if (parking.isDemo) return null;
  const cheapest = [...parking.pricing.tiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
  const url = absolute(base, `/${airport.slug}/${parking.slug}`);
  return {
    "@context": CONTEXT,
    "@type": ["ParkingFacility", "LocalBusiness"],
    "@id": `${url}#parking`,
    name: parking.title,
    url,
    description,
    ...(parking.photos.length > 0 ? { image: parking.photos.map(photo => absolute(base, photo)) } : {}),
    ...(parking.address ? { address: parking.address } : {}),
    ...(parking.location ? { geo: { "@type": "GeoCoordinates", latitude: parking.location.lat, longitude: parking.location.lng } } : {}),
    ...(parking.phone ? { telephone: parking.phone } : {}),
    ...(parking.services.includes("open_24h") ? { openingHours: "Mo-Su 00:00-23:59" } : {}),
    ...(cheapest ? { priceRange: `dès ${formatEuros(cheapest.priceCents)} ${fromPriceUnit(cheapest.days)}`.trim() } : {}),
    ...(parking.services.length > 0
      ? { amenityFeature: parking.services.map(service => ({ "@type": "LocationFeatureSpecification", name: serviceLabel(service), value: true })) }
      : {}),
  };
}

/** The JSON of a <script type="application/ld+json">, safe inside HTML (no "</script>" can close it early). */
export function jsonLdScript(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
