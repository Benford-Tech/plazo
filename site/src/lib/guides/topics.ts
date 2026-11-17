// 09/10/2026 (« fais les trois pages guide »): one page per search intent of an airport, under
// /<airport>/guide/<slug>, next to the long guide of the airport page. Slugs and labels only, so that the
// airport guide can link to them without importing their content.
// 17/11/2026 (« fais les pages ville et gare »): the station page and one page per departure city, same address scheme.

export const GUIDE_TOPICS = [
  { slug: "parking-pas-cher", short: "Parking pas cher", group: "topic" },
  { slug: "parking-longue-duree", short: "Parking longue durée", group: "topic" },
  { slug: "parking-voiturier", short: "Parking avec voiturier", group: "topic" },
  { slug: "parking-gare-tgv", short: "Parking gare TGV", group: "station" },
  { slug: "depuis-grenoble", short: "Depuis Grenoble", group: "city" },
  { slug: "depuis-chambery", short: "Depuis Chambéry", group: "city" },
  { slug: "depuis-annecy", short: "Depuis Annecy", group: "city" },
  { slug: "depuis-saint-etienne", short: "Depuis Saint-Étienne", group: "city" },
  { slug: "depuis-bourgoin-jallieu", short: "Depuis Bourgoin-Jallieu", group: "city" },
  { slug: "depuis-vienne", short: "Depuis Vienne", group: "city" },
  { slug: "depuis-villefranche-sur-saone", short: "Depuis Villefranche-sur-Saône", group: "city" },
  { slug: "depuis-macon", short: "Depuis Mâcon", group: "city" },
  { slug: "depuis-bourg-en-bresse", short: "Depuis Bourg-en-Bresse", group: "city" },
] as const;

export type GuideTopicSlug = (typeof GUIDE_TOPICS)[number]["slug"];
export type GuideGroup = (typeof GUIDE_TOPICS)[number]["group"];

/** Airports that have topic guides (their content lives in ./<airport>-<topic>.ts). */
export const TOPIC_AIRPORTS = ["lyon-saint-exupery"] as const;

export function hasTopicGuides(airport: string): boolean {
  return (TOPIC_AIRPORTS as readonly string[]).includes(airport);
}

export function isGuideTopic(slug: string): slug is GuideTopicSlug {
  return GUIDE_TOPICS.some(t => t.slug === slug);
}

/** Address of a topic guide. */
export function topicPath(airport: string, slug: GuideTopicSlug): string {
  return `/${airport}/guide/${slug}`;
}
