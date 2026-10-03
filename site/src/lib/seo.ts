import type { Metadata } from "next";
import { PRODUCT_NAME } from "./product";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The social card (brand/png/social-card-1200x630.png, copied to public/brand): the default Open Graph image. */
export const SOCIAL_CARD = { url: "/brand/social-card.png", width: 1200, height: 630, alt: PRODUCT_NAME };

/** Open Graph of a page. A page's openGraph replaces the layout's, so the shared fields are repeated here. */
export function openGraph(fields: OpenGraph): OpenGraph {
  return { siteName: PRODUCT_NAME, locale: "fr_FR", type: "website", images: [SOCIAL_CARD], ...fields };
}
