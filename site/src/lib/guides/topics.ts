// 09/10/2026 (« fais les trois pages guide »): one page per search intent of an airport, under
// /<airport>/guide/<slug>, next to the long guide of the airport page. Slugs and labels only, so that the
// airport guide can link to them without importing their content.

export const GUIDE_TOPICS = [
  { slug: "parking-pas-cher", short: "Parking pas cher" },
  { slug: "parking-longue-duree", short: "Parking longue durée" },
  { slug: "parking-voiturier", short: "Parking avec voiturier" },
] as const;

export type GuideTopicSlug = (typeof GUIDE_TOPICS)[number]["slug"];

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
