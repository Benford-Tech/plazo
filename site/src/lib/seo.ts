import type { Metadata } from "next";
import { fr } from "./fr";
import { PRODUCT_NAME } from "./product";
import type { ParkingResponse } from "./types";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The social card (brand/png/social-card-1200x630.png, copied to public/brand): the default Open Graph image. */
export const SOCIAL_CARD = { url: "/brand/social-card.png", width: 1200, height: 630, alt: PRODUCT_NAME };

/** Open Graph of a page. A page's openGraph replaces the layout's, so the shared fields are repeated here. */
export function openGraph(fields: OpenGraph): OpenGraph {
  return { siteName: PRODUCT_NAME, locale: "fr_FR", type: "website", images: [SOCIAL_CARD], ...fields };
}

/** Longest meta description search engines show whole. */
const DESCRIPTION_MAX = 160;

/** A parking page's meta description: its own text cut at a word, or a sentence naming it and its airport. */
export function parkingMetaDescription({ airport, parking }: Pick<ParkingResponse, "airport" | "parking">): string {
  const text = parking.description?.replace(/\s+/g, " ").trim();
  if (!text) return fr.meta.parkingDescription(parking.title, airport.name);
  if (text.length <= DESCRIPTION_MAX) return text;
  const head = text.slice(0, DESCRIPTION_MAX - 1);
  const space = head.lastIndexOf(" ");
  return `${(space > DESCRIPTION_MAX / 2 ? head.slice(0, space) : head).replace(/[\s,;:.]+$/, "")}…`;
}
