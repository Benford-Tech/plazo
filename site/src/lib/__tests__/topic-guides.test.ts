import { describe, expect, it } from "vitest";
import { guideTexts, topicFacts, type TopicFacts, type TopicGuide } from "../airport-guides";
import { longDate } from "../dates";
import { topicGuide, topicLinks } from "../guides";
import { GUIDE_TOPICS, hasTopicGuides, isGuideTopic, topicPath } from "../guides/topics";
import { formatEuros } from "../money";
import type { AirportResponse, SearchResult } from "../types";

type Listing = AirportResponse["listings"][number];

const listing = (over: Partial<Listing>): Listing => ({
  slug: "parkair",
  title: "Parkair",
  services: ["shuttle"],
  shuttleMinutes: 8,
  distanceKm: 4,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  fromPriceCents: 1500,
  fromDays: 1,
  ...over,
});
const result = (over: Partial<SearchResult>): SearchResult => ({ ...listing({}), available: true, days: 8, priceCents: 5600, ...over });
const preview = (results: SearchResult[]) => ({ airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" }, results });

const NONE: TopicFacts = { week: null, shuttle: null, twoWeeks: null, valet: null };
const SOME: TopicFacts = { week: { priceCents: 5600, days: 8 }, shuttle: { min: 6, max: 12 }, twoWeeks: { priceCents: 9800, days: 15 }, valet: { count: 1, week: { priceCents: 7400, days: 8 } } };

/** Everything a reader sees on a topic guide (title, intro, sections, FAQ). */
function texts(guide: TopicGuide): string[] {
  return [guide.metaTitle, guide.metaDescription, guide.partners.title, guide.partners.lead, guide.partners.empty, ...guideTexts({ title: guide.title, intro: guide.intro, sections: guide.sections, faq: guide.faq })];
}

const words = (guide: TopicGuide) =>
  [guide.intro, ...guideTexts({ title: guide.title, intro: "", sections: guide.sections, faq: guide.faq })]
    .join(" ")
    .split(/\s+/)
    .filter(w => /[\p{L}\p{N}]/u.test(w)).length;

describe("topic guide registry (09/10/2026)", () => {
  it("serves the three Lyon guides, and nothing for another airport or topic", () => {
    expect(hasTopicGuides("lyon-saint-exupery")).toBe(true);
    expect(hasTopicGuides("nice-cote-d-azur")).toBe(false);
    expect(isGuideTopic("parking-pas-cher")).toBe(true);
    expect(isGuideTopic("guide")).toBe(false);
    expect(topicGuide("nice-cote-d-azur", "parking-pas-cher", NONE)).toBeNull();
    expect(topicGuide("lyon-saint-exupery", "parking-gratuit", NONE)).toBeNull();
    expect(topicLinks("lyon-saint-exupery").map(l => l.href)).toEqual([
      "/lyon-saint-exupery/guide/parking-pas-cher",
      "/lyon-saint-exupery/guide/parking-longue-duree",
      "/lyon-saint-exupery/guide/parking-voiturier",
    ]);
    expect(topicLinks("nice-cote-d-azur")).toEqual([]);
  });

  it("reads the partners' figures from the real partners only", () => {
    const listings = [listing({ slug: "a" }), listing({ slug: "v", services: ["shuttle", "valet"] }), listing({ slug: "demo", services: ["valet"], isDemo: true })];
    const facts = topicFacts(
      listings,
      preview([result({ slug: "a", priceCents: 5600 }), result({ slug: "v", priceCents: 7400 }), result({ slug: "demo", isDemo: true, priceCents: 1000 })]),
      preview([result({ slug: "a", days: 15, priceCents: 9800 }), result({ slug: "v", days: 15, available: false, priceCents: 9000 })]),
    );
    expect(facts.week).toEqual({ priceCents: 5600, days: 8 });
    expect(facts.twoWeeks).toEqual({ priceCents: 9800, days: 15 });
    expect(facts.valet).toEqual({ count: 1, week: { priceCents: 7400, days: 8 } });
    expect(topicFacts([listing({ isDemo: true, services: ["valet"] })], null, null)).toEqual(NONE);
  });
});

describe.each(GUIDE_TOPICS.map(t => t.slug))("topic guide %s", slug => {
  const bare = topicGuide("lyon-saint-exupery", slug, NONE)!;
  const full = topicGuide("lyon-saint-exupery", slug, SOME)!;

  it("matches its address and has the shape of a search page", () => {
    expect(bare.slug).toBe(slug);
    expect(topicPath("lyon-saint-exupery", slug)).toBe(`/lyon-saint-exupery/guide/${slug}`);
    expect(bare.metaTitle.length).toBeLessThanOrEqual(65);
    expect(bare.metaDescription.length).toBeGreaterThanOrEqual(110);
    expect(bare.metaDescription.length).toBeLessThanOrEqual(160);
    expect(longDate(bare.updated)).toMatch(/^\d{1,2}(er)? [a-zéû]+ 20\d\d$/);
    const ids = bare.sections.map(s => s.id);
    expect(bare.sections.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(bare.sections.some(s => s.table || s.parts?.some(p => p.table))).toBe(true);
  });

  it("is a long page (2 000 words or more), with or without partners", () => {
    expect(words(bare)).toBeGreaterThanOrEqual(2000);
    expect(words(full)).toBeGreaterThanOrEqual(2000);
  });

  it("answers at least nine questions, each one standing alone", () => {
    expect(bare.faq.length).toBeGreaterThanOrEqual(9);
    expect(new Set(bare.faq.map(([q]) => q)).size).toBe(bare.faq.length);
    for (const [question, answer] of bare.faq) {
      expect(question).toMatch(/\?$/);
      expect(answer.length).toBeGreaterThan(60);
      expect(answer).not.toMatch(/ci-dessus|ci-dessous/);
    }
  });

  it("states no figure about the partners without a real one", () => {
    for (const text of texts(bare)) {
      for (const sentence of text.split(/(?<=[.;:!?])\s+/)) {
        if (/partenaire/i.test(sentence)) expect(sentence).not.toMatch(/\d+(?:,\d+)? ?€|\d+ (?:à \d+ )?min(?:utes)?\b/);
      }
    }
  });

  it("uses the real partners' figures when there are some", () => {
    const all = texts(full).join("\n");
    const expected = { "parking-pas-cher": formatEuros(5600), "parking-longue-duree": formatEuros(9800), "parking-voiturier": formatEuros(7400) }[slug];
    expect(all).toContain(expected);
  });

  it("keeps the corrections of the airport guide: Terminal 1, no promise beyond the conditions, no reviews", () => {
    for (const guide of [bare, full]) {
      const all = texts(guide).join("\n");
      expect(all).not.toMatch(/Terminal 1 ou (au )?Terminal 2|devant le terminal|au plus près des portes/i);
      expect(all).not.toMatch(/payez sur place|réglez à l’accueil|rien n’est payé en ligne/i);
      expect(all).not.toMatch(/ne change pas le prix|sans supplément en cas de retard chez/i);
      expect(all).not.toMatch(/avis des voyageurs|avis clients|note moyenne|étoiles/i);
      expect(all).not.toMatch(/ne jamais bloquer/i);
      expect(all).not.toMatch(/en libre service/);
    }
  });

  it("lists the partners the page is about", () => {
    expect(bare.partners.title.length).toBeGreaterThan(10);
    expect(bare.partners.empty.length).toBeGreaterThan(20);
    expect(bare.partners.filter).toBe(slug === "parking-voiturier" ? "valet" : "all");
    expect(bare.partners.stayDays).toBe(slug === "parking-longue-duree" ? 14 : 7);
  });
});
