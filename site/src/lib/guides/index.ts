// Topic guides of the airports (09/10/2026): the registry the guide route, the sitemap and the footer read.
import type { TopicFacts, TopicGuide } from "../airport-guides";
import { lyonCityGuides } from "./lyon-depuis";
import { lyonGareTgv } from "./lyon-gare-tgv";
import { lyonLongueDuree } from "./lyon-longue-duree";
import { lyonPasCher } from "./lyon-pas-cher";
import { lyonVoiturier } from "./lyon-voiturier";
import { GUIDE_TOPICS, isGuideTopic, topicPath, type GuideGroup, type GuideTopicSlug } from "./topics";

const TOPICS: Record<string, Record<GuideTopicSlug, (facts: TopicFacts) => TopicGuide>> = {
  "lyon-saint-exupery": {
    "parking-pas-cher": lyonPasCher,
    "parking-longue-duree": lyonLongueDuree,
    "parking-voiturier": lyonVoiturier,
    "parking-gare-tgv": lyonGareTgv,
    ...lyonCityGuides,
  },
};

/** A topic guide of an airport; null when the airport has none, or no guide on that topic. */
export function topicGuide(airport: string, slug: string, facts: TopicFacts): TopicGuide | null {
  if (!isGuideTopic(slug)) return null;
  return TOPICS[airport]?.[slug]?.(facts) ?? null;
}

/** The topic guides of an airport, in the site's order, for links and the sitemap (optionally only some groups). */
export function topicLinks(airport: string, groups?: GuideGroup[]): { slug: GuideTopicSlug; short: string; href: string; group: GuideGroup }[] {
  if (!TOPICS[airport]) return [];
  return GUIDE_TOPICS.filter(t => !groups || groups.includes(t.group)).map(t => ({ slug: t.slug, short: t.short, href: topicPath(airport, t.slug), group: t.group }));
}
