import type { Metadata } from "next";
import { PRODUCT_NAME } from "./product";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** Open Graph of a page. A page's openGraph replaces the layout's, so the shared fields are repeated here. */
export function openGraph(fields: OpenGraph): OpenGraph {
  return { siteName: PRODUCT_NAME, locale: "fr_FR", type: "website", ...fields };
}
