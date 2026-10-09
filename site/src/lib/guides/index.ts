// Topic guides of the airports (09/10/2026): the registry the guide route, the sitemap and the footer read.
import type { TopicFacts, TopicGuide } from "../airport-guides";
import { lyonLongueDuree } from "./lyon-longue-duree";
import { lyonPasCher } from "./lyon-pas-cher";
import { lyonVoiturier } from "./lyon-voiturier";
import { GUIDE_TOPICS, isGuideTopic, topicPath, type GuideTopicSlug } from "./topics";

const TOPICS: Record<string, Record<GuideTopicSlug, (facts: TopicFacts) => TopicGuide>> = {
  "lyon-saint-exupery": {
    "parking-pas-cher": lyonPasCher,
    "parking-longue-duree": lyonLongueDuree,
    "parking-voiturier": lyonVoiturier,
  },
};

/** A topic guide of an airport; null when the airport has none, or no guide on that topic. */
export function topicGuide(airport: string, slug: string, facts: TopicFacts): TopicGuide | null {
  if (!isGuideTopic(slug)) return null;
  return TOPICS[airport]?.[slug]?.(facts) ?? null;
}

/** The topic guides of an airport, in the site's order, for links and the sitemap. */
export function topicLinks(airport: string): { slug: GuideTopicSlug; short: string; href: string }[] {
  if (!TOPICS[airport]) return [];
  return GUIDE_TOPICS.map(t => ({ slug: t.slug, short: t.short, href: topicPath(airport, t.slug) }));
}
