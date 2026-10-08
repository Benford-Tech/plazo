import { describe, expect, it } from "vitest";
import { airportGuide, guideFacts, type AirportGuide } from "../airport-guides";
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

/** Every text of a guide: what a traveller (and a search engine) reads. */
function texts(guide: AirportGuide): string[] {
  return [
    guide.title,
    guide.intro,
    ...guide.sections.flatMap(s => [s.short, s.title, ...s.paragraphs, ...(s.list ?? []), ...(s.table ? [s.table.caption, ...s.table.columns, ...s.table.rows.flat()] : [])]),
    ...guide.faq.flat(),
  ];
}

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
    expect(guideFacts([listing({ isDemo: true })], preview([result({ isDemo: true })]))).toEqual({ week: null, shuttle: null });
    expect(guideFacts([], null)).toEqual({ week: null, shuttle: null });
  });
});

describe("airport guide (C-A)", () => {
  it("exists for Lyon Saint-Exupéry only, for now", () => {
    expect(airportGuide("nice-cote-d-azur", { week: null, shuttle: null })).toBeNull();
    expect(airportGuide("lyon-saint-exupery", { week: null, shuttle: null })?.title).toBe("Se garer à l’aéroport de Lyon Saint-Exupéry");
  });

  it("gives the real partners' lowest week and shuttle ride", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: { priceCents: 5600, days: 8 }, shuttle: { min: 6, max: 12 } })!;
    const all = texts(guide).join("\n");
    expect(all).toContain(`une semaine coûte aujourd’hui dès ${formatEuros(5600)} pour 8 jours, frais compris`);
    expect(all).toContain("Navette gratuite, 6 à 12 min");
    expect(guide.faq.find(([q]) => q.startsWith("Combien coûte une semaine"))![1]).toBe(`Dès ${formatEuros(5600)} pour 8 jours chez nos parkings partenaires, frais compris. Le prix exact dépend de vos dates.`);
    expect(airportGuide("lyon-saint-exupery", { week: null, shuttle: { min: 7, max: 7 } })!.sections[0].table!.rows[0][2]).toBe("Navette gratuite, 7 min");
  });

  it("states no figure at all without a real partner (no price, no ride time)", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: null, shuttle: null })!;
    for (const text of [...guide.sections.flatMap(s => [...s.paragraphs, ...(s.table?.rows.flat() ?? [])]), ...guide.faq.map(([, a]) => a)]) {
      expect(text).not.toMatch(/€|\d+ ?min/);
    }
  });

  it("has unique anchors, one per section of the « Sur cette page » list, and five questions of its own", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: null, shuttle: null })!;
    const ids = guide.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    expect(guide.faq).toHaveLength(5);
  });

  it("never says the parking is paid at the parking (every booking is paid online)", () => {
    const guide = airportGuide("lyon-saint-exupery", { week: { priceCents: 5600, days: 8 }, shuttle: null })!;
    for (const text of texts(guide)) expect(text).not.toMatch(/sur place|réglez à l’accueil|rien n’est payé en ligne/i);
  });
});
