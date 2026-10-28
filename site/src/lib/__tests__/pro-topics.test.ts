import { describe, expect, it } from "vitest";
import { fr } from "@/lib/fr";
import { PRO_TOPIC_LIST, PRO_TOPICS, proTopicTexts, wordCount } from "@/lib/pro-topics";
import { PRO_TOPIC_SLUGS } from "@/lib/site";

const TECHNICAL = /GPS|SMS|suivi de vol|API|Claude/;

describe("Plazo Pro's pages by topic", () => {
  it("has one page per slug, each with its title under 70 characters and its description under 160", () => {
    expect(Object.keys(PRO_TOPICS).sort()).toEqual([...PRO_TOPIC_SLUGS].sort());
    for (const topic of PRO_TOPIC_LIST) {
      expect(topic.metaTitle.length).toBeLessThanOrEqual(70);
      expect(topic.metaDescription.length).toBeLessThanOrEqual(160);
      expect(topic.next.every(slug => slug !== topic.slug && slug in PRO_TOPICS)).toBe(true);
    }
  });

  it("says enough to be useful, with its own questions, and never how Plazo does it", () => {
    for (const topic of PRO_TOPIC_LIST) {
      const texts = proTopicTexts(topic);
      expect(wordCount(texts)).toBeGreaterThanOrEqual(900);
      expect(topic.faq.length).toBeGreaterThanOrEqual(5);
      expect(texts.join(" ")).not.toMatch(TECHNICAL);
    }
  });

  it("gives the home page's questions without technical words, the prices of the plans included", () => {
    const text = fr.proHome.faq.flat().join(" ");
    expect(fr.proHome.faq).toHaveLength(6);
    expect(text).not.toMatch(TECHNICAL);
    expect(text).toMatch(/79 € à 229 € HT/);
    for (const comparator of ["Allopark", "Onepark", "Parclick", "ParkMundo", "ParkVia", "Park Hit"]) expect(text).toContain(comparator);
  });
});
