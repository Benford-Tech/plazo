import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchResponse, SearchResult } from "@/lib/types";

const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ApiError: actual.ApiError, api: { search } };
});
vi.mock("@/components/AirportView", () => ({ loadAirport: vi.fn() }));
vi.mock("@/components/SearchForm", () => ({ SearchForm: () => null }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }) }));

import ResultsPage from "../[airport]/recherche/page";

const result = (over: Partial<SearchResult> = {}): SearchResult => ({
  slug: "rhone",
  title: "Parking du Rhône",
  services: ["shuttle"],
  shuttleMinutes: 5,
  distanceKm: 3.5,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  location: null,
  payment: "online",
  available: true,
  days: 8,
  priceCents: 3660,
  basePriceCents: 3660,
  nightFee: null,
  ...over,
});

const response = (results: SearchResult[]): SearchResponse => ({
  payments: "online",
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery", location: null },
  results,
});

async function renderPage(extra: Record<string, string> = {}) {
  const ui = await ResultsPage({
    params: Promise.resolve({ airport: "lyon-saint-exupery" }),
    searchParams: Promise.resolve({ arrivee: "2099-10-13T23:30", retour: "2099-10-20T18:00", ...extra }),
  } as never);
  return render(ui);
}

describe("results: night fees (direction B, 12/10/2026)", () => {
  beforeEach(() => search.mockReset());

  it("one line under the heading when a total shown includes a night fee; the card shows the total only", async () => {
    search.mockResolvedValue(
      response([
        result(),
        result({ slug: "parkair", title: "Parkair Lyon", priceCents: 5160, basePriceCents: 3660, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } }),
      ]),
    );
    await renderPage();
    expect(screen.getByText("Prix totaux pour vos dates, frais de nuit compris.")).toBeInTheDocument();
    expect(screen.getByText("51,60 €")).toBeInTheDocument();
    // No chip nor fee line on the cards: the detail is on the parking's page.
    expect(screen.queryByText(/Frais de nuit/)).not.toBeInTheDocument();
    expect(screen.queryByText("15,00 €")).not.toBeInTheDocument();
  });

  it("no line when no total includes a night fee (or the parking that charges one is full)", async () => {
    search.mockResolvedValue(
      response([result(), result({ slug: "parkair", available: false, priceCents: 5160, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } })]),
    );
    await renderPage();
    expect(screen.queryByText(/frais de nuit compris/)).not.toBeInTheDocument();
  });
});

describe("results: « Navette en direct » (14/10/2026)", () => {
  beforeEach(() => {
    search.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("a filter row counted like the services, and a quick chip while it narrows the results", async () => {
    search.mockResolvedValue(response([result(), result({ slug: "parkair", title: "Parkair Lyon", liveShuttle: true })]));
    await renderPage();
    const row = screen.getByLabelText(/^Navette en direct/, { selector: "#f-direct" });
    expect(row).toHaveAttribute("name", "direct");
    expect(row).not.toBeChecked();
    expect(row.closest("label")).toHaveTextContent("Navette en direct1");
    expect(screen.getByLabelText("Navette en direct", { selector: "#q-direct" })).toBeInTheDocument();
    // Both parkings listed; the live one carries the rail, fed by one shared poll.
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByTestId("live-rail")).toHaveLength(1);
    expect(screen.getByTestId("live-rail")).toHaveTextContent("Terminal 1 · 5 min");
  });

  it("?direct=1 keeps the parkings whose shuttles are shown live", async () => {
    search.mockResolvedValue(response([result(), result({ slug: "parkair", title: "Parkair Lyon", liveShuttle: true })]));
    await renderPage({ direct: "1" });
    expect(screen.getAllByRole("article").map(a => a.getAttribute("data-result-slug"))).toEqual(["parkair"]);
    expect(screen.getByLabelText(/^Navette en direct/, { selector: "#f-direct" })).toBeChecked();
    expect(screen.getByRole("link", { name: "Effacer les filtres" })).toHaveAttribute(
      "href",
      "/lyon-saint-exupery/recherche?arrivee=2099-10-13T23:30&retour=2099-10-20T18:00",
    );
  });

  it("no « Navette en direct » row when no parking shows its shuttles", async () => {
    search.mockResolvedValue(response([result(), result({ slug: "parkair" })]));
    await renderPage();
    expect(screen.queryByText("Navette en direct")).not.toBeInTheDocument();
  });
});
