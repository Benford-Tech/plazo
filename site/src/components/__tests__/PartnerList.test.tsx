import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fromPerDayCents } from "@/components/HomeHero";
import { PartnerList, sortPartners, sortsFor } from "@/components/PartnerList";
import type { AirportResponse, SearchResult } from "@/lib/types";

vi.mock("@/components/ShuttleBox", () => ({ ShuttleBox: () => null }));

type Listing = AirportResponse["listings"][number];
const listing = (slug: string, over: Partial<Listing> = {}): Listing =>
  ({
    slug,
    title: `Parking ${slug}`,
    services: ["shuttle"],
    shuttleMinutes: 8,
    distanceKm: 5,
    openingHours: null,
    cancellationPolicy: "free_24h",
    photo: null,
    fromPriceCents: 6200,
    fromDays: 8,
    ...over,
  }) as Listing;

const three = [
  listing("b", { fromPriceCents: 7400, shuttleMinutes: 12 }),
  listing("a", { fromPriceCents: 6200, shuttleMinutes: 8, liveShuttle: true }),
  listing("c", { fromPriceCents: null, shuttleMinutes: 5 }),
];

// 24/11/2026 (direction A of the airport page).
describe("les parkings partenaires de la page aéroport", () => {
  it("trie par prix, trajet ou navette en direct, une valeur absente toujours en dernier", () => {
    expect(sortPartners(three, "cheapest").map(l => l.slug)).toEqual(["a", "b", "c"]);
    expect(sortPartners(three, "dearest").map(l => l.slug)).toEqual(["b", "a", "c"]);
    expect(sortPartners(three, "shortest").map(l => l.slug)).toEqual(["c", "a", "b"]);
    expect(sortPartners(three, "live").map(l => l.slug)).toEqual(["a", "b", "c"]);
  });

  it("ne propose que les tris qui départagent les parkings", () => {
    expect(sortsFor([three[0]!])).toEqual([]);
    expect(sortsFor(three)).toEqual(["cheapest", "shortest", "live", "dearest"]);
    expect(sortsFor([listing("x"), listing("y")])).toEqual([]);
  });

  it("le moins cher d'abord, « À partir de » et « Voir le prix », puis un clic change l'ordre", async () => {
    render(<PartnerList airport={{ slug: "lyon-saint-exupery", code: "LYS" }} listings={three} />);
    const titles = () => screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent);
    expect(titles()).toEqual(["Parking a", "Parking b", "Parking c"]);
    const first = screen.getAllByRole("article")[0]!;
    expect(within(first).getByText("Le moins cher")).toBeInTheDocument();
    expect(within(first).getByText("À partir de")).toBeInTheDocument();
    expect(within(first).getByRole("link", { name: /Voir le prix/ })).toHaveAttribute("href", "/lyon-saint-exupery/a");
    // Without a price, the button leads to the parking, with no price promised.
    expect(within(screen.getAllByRole("article")[2]!).getByRole("link", { name: /Voir le parking/ })).toBeInTheDocument();
    await userEvent.click(within(screen.getByTestId("partner-sorts")).getByRole("button", { name: "Trajet le plus court" }));
    expect(titles()).toEqual(["Parking c", "Parking a", "Parking b"]);
  });

  it("« dès … par jour » : l'offre la moins chère d'un vrai parking, divisée par les jours ; rien sans vrai parking", () => {
    const result = (over: Partial<SearchResult>) => ({ ...listing("r"), available: true, priceCents: 6200, ...over }) as SearchResult;
    expect(fromPerDayCents([result({ priceCents: 8900 }), result({ priceCents: 6200 })], 8)).toBe(775);
    expect(fromPerDayCents([result({ priceCents: 4000, isDemo: true }), result({ priceCents: 6200 })], 8)).toBe(775);
    expect(fromPerDayCents([result({ isDemo: true })], 8)).toBeNull();
    expect(fromPerDayCents([result({ available: false })], 8)).toBeNull();
  });
});
