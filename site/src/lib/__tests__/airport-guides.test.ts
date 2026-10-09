import { describe, expect, it } from "vitest";
import { airportGuide, guideFacts, guideTexts, guideWordCount, LYON_OFFICIAL } from "../airport-guides";
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

const none = { week: null, shuttle: null };

describe("guide facts", () => {
  it("come from the real partners only: demo, full or unpriced parkings are left out", () => {
    const facts = guideFacts(
      [listing({ slug: "a", shuttleMinutes: 6 }), listing({ slug: "b", shuttleMinutes: 12 }), listing({ slug: "demo", isDemo: true, shuttleMinutes: 2 }), listing({ slug: "no-shuttle", services: ["valet"], shuttleMinutes: 30 })],
      preview([
        result({ slug: "a", priceCents: 6100 }),
        result({ slug: "b", priceCents: 5600 }),
        result({ slug: "demo", isDemo: true, priceCents: 1000 }),
        result({ slug: "full", available: false, priceCents: 900 }),
        result({ slug: "unpriced", priceCents: null }),
      ]),
    );
    expect(facts).toEqual({ week: { priceCents: 5600, days: 8 }, shuttle: { min: 6, max: 12 } });
  });

  it("are empty when only demo parkings are online, or the search did not answer", () => {
    expect(guideFacts([listing({ isDemo: true })], preview([result({ isDemo: true })]))).toEqual(none);
    expect(guideFacts([], null)).toEqual(none);
  });
});

describe("airport guide (C-A, 4 200 words on 09/10/2026)", () => {
  it("exists for Lyon Saint-Exupéry only, for now", () => {
    expect(airportGuide("nice-cote-d-azur", none)).toBeNull();
    expect(airportGuide("lyon-saint-exupery", none)?.title).toBe("Se garer à l’aéroport de Lyon Saint-Exupéry : le guide complet");
  });

  it("gives the real partners' lowest week and shuttle ride", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: { priceCents: 5600, days: 8 }, shuttle: { min: 6, max: 12 } })!;
    const all = guideTexts(guide).join("\n");
    expect(all).toContain(`une semaine coûte aujourd’hui dès ${formatEuros(5600)} pour 8 jours, frais compris`);
    expect(all).toContain("Navette gratuite, 6 à 12 min");
    expect(guide.faq.find(([q]) => q.startsWith("Combien coûte une semaine"))![1]).toMatch(new RegExp(`^Dès ${formatEuros(5600)} pour 8 jours chez nos parkings partenaires, frais compris\\.`));
    expect(airportGuide("lyon-saint-exupery", { week: null, shuttle: { min: 7, max: 7 } })!.sections[0].table!.rows[0][2]).toBe("Navette gratuite, 7 min");
  });

  it("states no figure about the partners without a real one; the airport's own, dated figures stay", () => {
    const guide = airportGuide("lyon-saint-exupery", none)!;
    for (const text of guideTexts(guide)) {
      // A sentence about the partners never carries a price or a ride time of theirs.
      for (const sentence of text.split(/(?<=[.;:!?])\s+/)) {
        if (/partenaire/i.test(sentence)) expect(sentence).not.toMatch(/\d+(?:,\d+)? ?€|\d+ (?:à \d+ )?min\b/);
      }
    }
    const all = guideTexts(guide).join("\n");
    expect(all).toContain(LYON_OFFICIAL.week.p5);
    expect(all).toContain(`relevés le ${LYON_OFFICIAL.readOn}`);
  });

  it("has unique anchors, one per section of the « Sur cette page » list, and its own questions, all answered", () => {
    const guide = airportGuide("lyon-saint-exupery", none)!;
    const ids = guide.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    expect(guide.faq.length).toBeGreaterThanOrEqual(18);
    expect(new Set(guide.faq.map(([q]) => q)).size).toBe(guide.faq.length);
    for (const [question, answer] of guide.faq) {
      expect(question).toMatch(/\?$/);
      expect(answer.length).toBeGreaterThan(60);
    }
  });

  it("is a 4 200-word page, with or without a real partner", () => {
    expect(guideWordCount(airportGuide("lyon-saint-exupery", none)!)).toBeGreaterThanOrEqual(4200);
    expect(guideWordCount(airportGuide("lyon-saint-exupery", { week: { priceCents: 5600, days: 8 }, shuttle: { min: 6, max: 12 } })!)).toBeGreaterThanOrEqual(4200);
  });

  it("lays every table out as a row header plus one cell per column", () => {
    const guide = airportGuide("lyon-saint-exupery", none)!;
    const tables = guide.sections.flatMap(s => [s.table, ...(s.parts ?? []).map(p => p.table)]).filter(t => t !== undefined);
    expect(tables.length).toBeGreaterThanOrEqual(3);
    for (const table of tables) for (const row of table.rows) expect(row).toHaveLength(table.columns.length + 1);
  });

  it("never says the parking is paid at the parking (every booking is paid online)", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: { priceCents: 5600, days: 8 }, shuttle: null })!;
    for (const text of guideTexts(guide)) expect(text).not.toMatch(/réglez à l’accueil|rien n’est payé en ligne|payez sur place/i);
  });
});
