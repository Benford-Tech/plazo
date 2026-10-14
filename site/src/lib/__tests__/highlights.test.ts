import { describe, expect, it } from "vitest";
import { factChips, factsLine, perDayLabel, pricePerDayCents, resultBadges, shuttleBox, trustTiles } from "../highlights";
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

describe("fact chips (direction C, 14/10/2026)", () => {
  const labels = (chips: ReturnType<typeof factChips>) => chips.map(c => (c.short ? `${c.icon}:${c.label}|${c.short}` : `${c.icon}:${c.label}`));

  it("outdoor or covered, the keys, the opening, then fenced, EV charging and the cancellation last; no shuttle chip", () => {
    const chips = factChips(result({ services: ["shuttle", "valet", "covered", "ev_charging", "fenced", "cctv", "open_24h"], shuttleMinutes: 8 }));
    expect(labels(chips)).toEqual([
      "covered:Couvert",
      "keys:Vous devez remettre vos clés|Clés à remettre",
      "open24h:Ouvert 24h/24|24h/24",
      "fenced:Clôturé",
      "ev:Recharge",
      "cancel:Gratuit 24 h",
    ]);
    expect(chips.some(c => c.icon === "shuttle")).toBe(false);
  });

  it("a self-park outdoor parking: « Extérieur », « Vous gardez vos clés »", () => {
    const chips = factChips(result({ services: ["shuttle"] }));
    expect(labels(chips)).toEqual(["outdoor:Extérieur", "keys:Vous gardez vos clés|Clés gardées", "cancel:Gratuit 24 h"]);
  });

  it("the opening: the 24h service, else the hours typed by the parking, never twice « Ouvert »; nothing without either", () => {
    const open = (services: string[], openingHours: string | null) => factChips(result({ services, openingHours })).find(c => c.icon === "open24h");
    expect(open(["open_24h"], "5h–23h")).toEqual({ icon: "open24h", label: "Ouvert 24h/24", short: "24h/24" });
    expect(open([], "5h–23h")).toEqual({ icon: "open24h", label: "Ouvert 5h–23h" });
    expect(open([], "Ouvert de 5h à 23h")?.label).toBe("Ouvert de 5h à 23h");
    expect(open([], "24h/24")).toEqual({ icon: "open24h", label: "Ouvert 24h/24", short: "24h/24" });
    expect(open([], "  ")).toBeUndefined();
    expect(open([], null)).toBeUndefined();
  });

  it("warns on a non-refundable parking", () => {
    const chips = factChips(result({ services: [], cancellationPolicy: "non_refundable" }));
    expect(chips.at(-1)).toEqual({ icon: "warning", label: "Non remboursable", title: "Non annulable" });
    expect(factChips(result({ cancellationPolicy: "free_48h" })).at(-1)?.label).toBe("Gratuit 48 h");
    expect(factChips(result({ cancellationPolicy: "free_until_arrival" })).at(-1)?.label).toBe("Gratuit jusqu’à l’arrivée");
  });
});

describe("shuttle box", () => {
  it("only for a parking with the shuttle; the ride, the declared wait and the live rail", () => {
    expect(shuttleBox(result({ services: ["valet"] }))).toBeNull();
    expect(shuttleBox(result({ shuttleMinutes: 5, shuttleWaitMinutes: 5, liveShuttle: true }))).toEqual({ rideMinutes: 5, waitMinutes: 5, live: true });
    // Not declared (or an older API): no wait figure. A declared 0 is a figure.
    expect(shuttleBox(result({ shuttleMinutes: 8 }))).toEqual({ rideMinutes: 8, waitMinutes: null, live: false });
    expect(shuttleBox(result({ shuttleMinutes: null, shuttleWaitMinutes: 0 }))).toEqual({ rideMinutes: null, waitMinutes: 0, live: false });
  });
});

describe("trust band of a parking page (« L’essentiel », 14/10/2026)", () => {
  it("builds the five tiles from the listing: live shuttle, cover with its security, keys, opening, cancellation", () => {
    const tiles = trustTiles({
      services: ["shuttle", "fenced", "cctv", "open_24h", "valet"],
      shuttleMinutes: 5,
      shuttleWaitMinutes: 5,
      liveShuttle: true,
      openingHours: null,
      cancellationPolicy: "free_24h",
    });
    expect(tiles).toEqual([
      { kind: "shuttle", title: "Navette en direct", text: "Gratuite · trajet 5 min · attente moyenne 5 min · suivez-la sur la carte le jour J", live: true },
      { kind: "outdoor", title: "Extérieur", text: "clôturé, vidéosurveillance" },
      { kind: "keys", title: "Vous devez remettre vos clés", text: "Un voiturier gare votre voiture" },
      { kind: "opening", title: "Ouvert 24h/24", text: "Dépôt et retour à toute heure" },
      { kind: "cancellation", title: "Annulation gratuite", text: "jusqu’à 24 h avant" },
    ]);
  });

  it("a shuttle not shown live: « Navette gratuite », the parts it has; a covered self-park parking with hours", () => {
    const tiles = trustTiles({ services: ["shuttle", "covered"], shuttleMinutes: 8, openingHours: "6h–23h", cancellationPolicy: "free_48h" });
    expect(tiles).toEqual([
      { kind: "shuttle", title: "Navette gratuite", text: "Trajet 8 min" },
      { kind: "covered", title: "Couvert", text: "Parking couvert" },
      { kind: "keys", title: "Vous gardez vos clés", text: "Vous vous garez vous-même" },
      { kind: "opening", title: "Ouvert 6h–23h", text: "Dépôt et retour pendant ces horaires" },
      { kind: "cancellation", title: "Annulation gratuite", text: "jusqu’à 48 h avant" },
    ]);
    expect(trustTiles({ services: ["shuttle"], shuttleMinutes: null, shuttleWaitMinutes: 4, openingHours: null, cancellationPolicy: "free_48h" })[0].text).toBe(
      "Attente moyenne 4 min",
    );
  });

  it("a shuttle with no ride, no wait and no live tracking says where it goes: Terminal 1 at Lyon, the airport elsewhere (R4)", () => {
    const bare = { services: ["shuttle"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "free_48h" as const };
    expect(trustTiles(bare, "LYS")[0]).toEqual({ kind: "shuttle", title: "Navette gratuite", text: "Vers le Terminal 1" });
    expect(trustTiles(bare, "lys")[0].text).toBe("Vers le Terminal 1");
    expect(trustTiles(bare, "NCE")[0].text).toBe("Vers l’aéroport");
    expect(trustTiles(bare, null)[0].text).toBe("Vers l’aéroport");
    expect(trustTiles(bare)[0].text).toBe("Vers l’aéroport");
    // No more « vers les terminaux »; a tile with a figure or the live tracking never falls back.
    expect(trustTiles({ ...bare, shuttleWaitMinutes: 0 }, "LYS")[0].text).toBe("Attente moyenne 0 min");
    expect(trustTiles({ ...bare, liveShuttle: true }, "LYS")[0].text).toBe("Gratuite · suivez-la sur la carte le jour J");
  });

  it("hides the tiles without data", () => {
    const tiles = trustTiles({ services: ["valet"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "non_refundable" });
    expect(tiles.map(t => t.kind)).toEqual(["outdoor", "keys", "cancellation"]);
    expect(tiles[0]).toEqual({ kind: "outdoor", title: "Extérieur", text: "Parking à ciel ouvert" });
    expect(tiles[2]).toEqual({ kind: "cancellation", title: "Non remboursable", text: "aucun remboursement en cas d’annulation" });
  });

  it("sums up the rest in one line (outdoor or covered is a tile now)", () => {
    expect(factsLine({ services: ["shuttle", "covered", "ev_charging"], distanceKm: 4.2 })).toBe("À 4,2 km des terminaux · Recharge électrique");
    expect(factsLine({ services: ["shuttle"], distanceKm: null })).toBe("");
  });
});
