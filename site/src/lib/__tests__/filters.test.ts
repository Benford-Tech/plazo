import { describe, expect, it } from "vitest";
import { applyFilters, cheapestSlug, hasActiveFilters, parseFilters, priceCeilingCents, resultsQuery, serviceCounts } from "../filters";
import type { SearchResult } from "../types";

const result = (over: Partial<SearchResult>): SearchResult => ({
  slug: "a",
  title: "A",
  services: ["shuttle"],
  shuttleMinutes: 8,
  distanceKm: 3.5,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  available: true,
  days: 8,
  priceCents: 5500,
  ...over,
});

const A = result({ slug: "a", priceCents: 5500, shuttleMinutes: 8, distanceKm: 3.5, services: ["shuttle", "fenced"] });
const B = result({ slug: "b", priceCents: 4900, shuttleMinutes: 12, distanceKm: 1.2, services: ["shuttle", "valet", "covered"] });
const C = result({ slug: "c", priceCents: 3000, shuttleMinutes: 6, distanceKm: 5, available: false, cancellationPolicy: "non_refundable" });
const D = result({ slug: "d", priceCents: null, shuttleMinutes: null, distanceKm: null, available: false });

describe("search params -> filters", () => {
  it("reads French params and ignores unknown values", () => {
    expect(parseFilters({ service: ["navette", "couvert", "inconnu", "navette"], annulation: "gratuite", navette: "10", prix_max: "60", tri: "distance" })).toEqual({
      services: ["shuttle", "covered"],
      freeCancellation: true,
      maxShuttle: 10,
      maxPriceCents: 6000,
      sort: "distance",
    });
    expect(parseFilters({ navette: "7", prix_max: "abc", tri: "nope" })).toEqual({
      services: [],
      freeCancellation: false,
      maxShuttle: null,
      maxPriceCents: null,
      sort: "prix",
    });
    expect(hasActiveFilters(parseFilters({ tri: "navette" }))).toBe(false);
    expect(hasActiveFilters(parseFilters({ service: "voiturier" }))).toBe(true);
  });

  it("writes them back in the URL, defaults omitted", () => {
    const stay = { arrivee: "2026-10-04T06:30", retour: "2026-10-11T15:05" };
    expect(resultsQuery(stay, parseFilters({}))).toBe("?arrivee=2026-10-04T06:30&retour=2026-10-11T15:05");
    expect(resultsQuery(stay, parseFilters({ service: "couvert", annulation: "gratuite", navette: "15", prix_max: "80", tri: "navette" }))).toBe(
      "?arrivee=2026-10-04T06:30&retour=2026-10-11T15:05&service=couvert&annulation=gratuite&navette=15&prix_max=80&tri=navette",
    );
  });
});

describe("applying filters", () => {
  const all = [A, B, C, D];

  it("sorts available parkings first, cheapest first by default", () => {
    expect(applyFilters(all, parseFilters({})).map(r => r.slug)).toEqual(["b", "a", "c", "d"]);
  });

  it("sorts by shuttle time or distance", () => {
    expect(applyFilters(all, parseFilters({ tri: "navette" })).map(r => r.slug)).toEqual(["a", "b", "c", "d"]);
    expect(applyFilters(all, parseFilters({ tri: "distance" })).map(r => r.slug)).toEqual(["b", "a", "c", "d"]);
  });

  it("keeps only parkings with every chosen service", () => {
    expect(applyFilters(all, parseFilters({ service: ["navette", "voiturier"] })).map(r => r.slug)).toEqual(["b"]);
  });

  it("filters on free cancellation, shuttle time and total price", () => {
    expect(applyFilters(all, parseFilters({ annulation: "gratuite" })).map(r => r.slug)).toEqual(["b", "a", "d"]);
    expect(applyFilters(all, parseFilters({ navette: "10" })).map(r => r.slug)).toEqual(["a", "c"]);
    expect(applyFilters(all, parseFilters({ prix_max: "50" })).map(r => r.slug)).toEqual(["b", "c"]);
  });

  it("counts services, bounds the price slider and finds the cheapest", () => {
    expect(serviceCounts(all)).toMatchObject({ shuttle: 4, valet: 1, covered: 1, fenced: 1, cctv: 0 });
    expect(priceCeilingCents(all)).toBe(6000);
    expect(priceCeilingCents([D])).toBe(0);
    expect(cheapestSlug(all)).toBe("b");
    expect(cheapestSlug([A, C])).toBeNull(); // nothing to compare with
  });
});

describe("map toggle in the URL", () => {
  const stay = { arrivee: "2026-10-04T06:30", retour: "2026-10-11T15:05" };
  it("reads ?carte=1 and writes it last, so the link can be shared", async () => {
    const { mapShown } = await import("../filters");
    expect(mapShown({ carte: "1" })).toBe(true);
    expect(mapShown({ carte: "0" })).toBe(false);
    expect(mapShown({})).toBe(false);
    expect(resultsQuery(stay, parseFilters({ tri: "navette" }), true)).toBe("?arrivee=2026-10-04T06:30&retour=2026-10-11T15:05&tri=navette&carte=1");
    expect(resultsQuery(stay, parseFilters({}), false)).not.toContain("carte");
  });
});

