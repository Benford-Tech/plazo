import { describe, expect, it } from "vitest";
import { factChips, factsLine, perDayLabel, pricePerDayCents, resultBadges, trustTiles } from "../highlights";
import { formatEuros } from "../money";
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

describe("price per day", () => {
  it("divides the total by the billable days, rounded to the cent", () => {
    expect(pricePerDayCents(4500, 8)).toBe(563);
    expect(pricePerDayCents(4500, 1)).toBe(4500);
    expect(pricePerDayCents(4500, 0)).toBe(4500);
    expect(perDayLabel(4500, 8)).toBe(`${formatEuros(563)}/jour`);
    expect(perDayLabel(11300, 8)).toBe(`${formatEuros(1413)}/jour`);
  });
});

describe("badges of the results", () => {
  const cheap = result({ slug: "cheap", priceCents: 4500, shuttleMinutes: 8 });
  const fast = result({ slug: "fast", priceCents: 11300, shuttleMinutes: 4 });
  const other = result({ slug: "other", priceCents: 7500, shuttleMinutes: 5 });

  it("marks the lowest total and the shortest shuttle ride", () => {
    const badges = resultBadges([other, cheap, fast]);
    expect(badges.get("cheap")).toEqual(["cheapest"]);
    expect(badges.get("fast")).toEqual(["fastestShuttle"]);
    expect(badges.get("other")).toBeUndefined();
  });

  it("stacks both on one card, cheapest first", () => {
    const best = result({ slug: "best", priceCents: 4000, shuttleMinutes: 3 });
    expect(resultBadges([other, best]).get("best")).toEqual(["cheapest", "fastestShuttle"]);
  });

  it("gives ties to the first displayed result", () => {
    const twin = result({ slug: "twin", priceCents: 4500, shuttleMinutes: 8 });
    const badges = resultBadges([twin, cheap]);
    expect(badges.get("twin")).toEqual(["cheapest", "fastestShuttle"]);
    expect(badges.has("cheap")).toBe(false);
  });

  it("shows nothing with a single result to compare, and ignores full parkings and unknown shuttles", () => {
    expect(resultBadges([cheap]).size).toBe(0);
    expect(resultBadges([cheap, result({ slug: "full", available: false, priceCents: 1000, shuttleMinutes: 1 })]).size).toBe(0);
    const noShuttle = result({ slug: "ns", priceCents: 9000, shuttleMinutes: null });
    const badges = resultBadges([noShuttle, fast]);
    expect(badges.get("ns")).toEqual(["cheapest"]);
    expect(badges.get("fast")).toEqual(["fastestShuttle"]);
    expect(resultBadges([noShuttle, result({ slug: "ns2", priceCents: 9500, shuttleMinutes: null })]).get("ns")).toEqual(["cheapest"]);
  });
});

describe("fact chips", () => {
  it("lists shuttle, security, comfort, keys, then the cancellation terms", () => {
    const chips = factChips(result({ services: ["shuttle", "valet", "covered", "ev_charging", "fenced", "cctv", "open_24h"], shuttleMinutes: 8 }));
    expect(chips.map(c => `${c.icon}:${c.label}`)).toEqual(["shuttle:8 min", "fenced:Clôturé", "covered:Couvert", "ev:Recharge", "valet:Voiturier", "cancel:Gratuit 24 h"]);
  });

  it("warns on a non-refundable parking and skips an unknown shuttle time", () => {
    const chips = factChips(result({ services: ["shuttle"], shuttleMinutes: null, cancellationPolicy: "non_refundable" }));
    expect(chips).toEqual([{ icon: "warning", label: "Non remboursable", title: "Non annulable" }]);
    expect(factChips(result({ cancellationPolicy: "free_48h" })).at(-1)?.label).toBe("Gratuit 48 h");
    expect(factChips(result({ cancellationPolicy: "free_until_arrival" })).at(-1)?.label).toBe("Gratuit jusqu’à l’arrivée");
  });
});

describe("trust band of a parking page", () => {
  it("builds the four tiles from the listing", () => {
    const tiles = trustTiles({ services: ["shuttle", "fenced", "cctv", "open_24h"], shuttleMinutes: 8, openingHours: "24h/24", cancellationPolicy: "free_24h" });
    expect(tiles).toEqual([
      { kind: "shuttle", title: "Navette 8 min", text: "gratuite, 24h/24" },
      { kind: "security", title: "Sécurisé", text: "clôturé, vidéosurveillance" },
      { kind: "cancellation", title: "Annulation gratuite", text: "jusqu’à 24 h avant" },
      { kind: "keys", title: "Vous vous garez", text: "vous gardez vos clés" },
    ]);
  });

  it("hides the tiles without data and says when keys are handed over", () => {
    const tiles = trustTiles({ services: ["valet"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "non_refundable" });
    expect(tiles.map(t => t.kind)).toEqual(["cancellation", "keys"]);
    expect(tiles[0]).toEqual({ kind: "cancellation", title: "Non remboursable", text: "aucun remboursement en cas d’annulation" });
    expect(tiles[1]).toEqual({ kind: "keys", title: "Voiturier", text: "vous laissez les clés à l’accueil" });
    expect(trustTiles({ services: ["shuttle", "open_24h"], shuttleMinutes: 5, openingHours: null, cancellationPolicy: "free_48h" })[0].text).toBe("gratuite, 24h/24");
    expect(trustTiles({ services: ["shuttle"], shuttleMinutes: 5, openingHours: null, cancellationPolicy: "free_48h" })[0].text).toBe("gratuite vers les terminaux");
  });

  it("sums up the rest in one line", () => {
    expect(factsLine({ services: ["shuttle", "covered", "ev_charging"], distanceKm: 4.2 })).toBe("À 4,2 km des terminaux · Couvert · Recharge électrique");
    expect(factsLine({ services: ["shuttle"], distanceKm: null })).toBe("Extérieur");
  });
});
