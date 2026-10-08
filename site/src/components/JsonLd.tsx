import { jsonLdScript, type JsonLdObject } from "@/lib/structured-data";

/** schema.org data for search engines; renders nothing when there is nothing to describe. */
export function JsonLd({ data }: { data: (JsonLdObject | null)[] }) {
  const items = data.filter((item): item is JsonLdObject => item !== null);
  if (items.length === 0) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(items.length === 1 ? items[0] : items) }} />;
}
