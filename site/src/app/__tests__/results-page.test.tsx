import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

async function renderPage() {
  const ui = await ResultsPage({
    params: Promise.resolve({ airport: "lyon-saint-exupery" }),
    searchParams: Promise.resolve({ arrivee: "2099-10-13T23:30", retour: "2099-10-20T18:00" }),
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
