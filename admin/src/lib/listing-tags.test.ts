import { listingTags, shuttleTag, type TaggedListing } from "./listing-tags";

// Mirrors site/src/lib/__tests__/highlights.test.ts (factChips, shuttleBox): the preview shows what travellers see.
const listing = (over: Partial<TaggedListing>): TaggedListing => ({
  services: ["shuttle"],
  shuttleMinutes: 8,
  shuttleWaitMinutes: null,
  openingHours: null,
  cancellationPolicy: "free_24h",
  ...over,
});
const labels = (l: TaggedListing) => listingTags(l).map(t => `${t.icon}:${t.label}`);

describe("tags of the results preview (14/10/2026, direction C)", () => {
  it("outdoor or covered, the keys, the opening, then fenced, EV charging and the cancellation last; no shuttle or CCTV chip", () => {
    expect(labels(listing({ services: ["shuttle", "valet", "covered", "ev_charging", "fenced", "cctv", "open_24h"] }))).toEqual([
      "covered:Couvert",
      "keys:Vous devez remettre vos clés",
      "open24h:Ouvert 24h/24",
      "fenced:Clôturé",
      "ev:Recharge",
      "cancel:Gratuit 24 h",
    ]);
    expect(listingTags(listing({ services: ["ev_charging"] })).find(t => t.icon === "ev")?.title).toBe("Recharge électrique");
  });

  it("a self-park outdoor parking: « Extérieur », « Vous gardez vos clés »", () => {
    expect(labels(listing({ services: ["shuttle"] }))).toEqual(["outdoor:Extérieur", "keys:Vous gardez vos clés", "cancel:Gratuit 24 h"]);
  });

  it("the opening: the 24h service, else the hours typed by the parking, never twice « Ouvert »; nothing without either", () => {
    const open = (services: TaggedListing["services"], openingHours: string | null) => listingTags(listing({ services, openingHours })).find(t => t.icon === "open24h")?.label;
    expect(open(["open_24h"], "5h–23h")).toBe("Ouvert 24h/24");
    expect(open([], "5h–23h")).toBe("Ouvert 5h–23h");
    expect(open([], "Ouvert de 5h à 23h")).toBe("Ouvert de 5h à 23h");
    expect(open([], "24h/24")).toBe("Ouvert 24h/24");
    expect(open([], "24/7")).toBe("Ouvert 24h/24");
    expect(open([], "  ")).toBeUndefined();
    expect(open([], null)).toBeUndefined();
  });

  it("the cancellation in the site's words, a warning when non-refundable", () => {
    expect(listingTags(listing({ services: [], cancellationPolicy: "non_refundable" })).at(-1)).toEqual({ icon: "warning", label: "Non remboursable", title: "Non annulable" });
    expect(listingTags(listing({ cancellationPolicy: "free_24h" })).at(-1)).toEqual({ icon: "cancel", label: "Gratuit 24 h", title: "Annulation gratuite jusqu’à 24 h avant" });
    expect(listingTags(listing({ cancellationPolicy: "free_48h" })).at(-1)?.label).toBe("Gratuit 48 h");
    expect(listingTags(listing({ cancellationPolicy: "free_until_arrival" })).at(-1)?.label).toBe("Gratuit jusqu’à l’arrivée");
  });
});

describe("shuttle tag of the results preview", () => {
  it("only for a parking with the shuttle; the ride and the declared wait, a missing figure left out", () => {
    expect(shuttleTag(listing({ services: ["valet"] }))).toBeNull();
    expect(shuttleTag(listing({ shuttleMinutes: 5, shuttleWaitMinutes: 5 }))).toEqual({ rideMinutes: 5, waitMinutes: 5 });
    // Not declared: no wait figure. A declared 0 is a figure; a ride of 0 (or a field being typed) is not.
    expect(shuttleTag(listing({ shuttleWaitMinutes: undefined }))).toEqual({ rideMinutes: 8, waitMinutes: null });
    expect(shuttleTag(listing({ shuttleMinutes: null, shuttleWaitMinutes: 0 }))).toEqual({ rideMinutes: null, waitMinutes: 0 });
    expect(shuttleTag(listing({ shuttleMinutes: 0 }))).toEqual({ rideMinutes: null, waitMinutes: null });
    expect(shuttleTag(listing({ shuttleMinutes: Number.NaN }))).toEqual({ rideMinutes: null, waitMinutes: null });
  });
});
