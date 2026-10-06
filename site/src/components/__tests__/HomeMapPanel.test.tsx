import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MapParking, MapShuttle } from "../ResultsMap";
import { HomeMapPanel } from "../HomeMapPanel";
import type { AirportLive, SearchResult } from "@/lib/types";

// next/dynamic resolves asynchronously (and never under fake timers): the stub map loads at once.
vi.mock("next/dynamic", async () => {
  const mod = await import("../ResultsMap");
  return { default: () => mod.default };
});

// The real map needs WebGL: a stub lists the pins and the shuttles it is given.
vi.mock("../ResultsMap", () => ({
  default: (props: { parkings: MapParking[]; shuttles?: MapShuttle[]; selected?: string | null; onSelect?: (slug: string) => void }) => (
    <div data-testid="map" data-selected={props.selected ?? ""}>
      {props.parkings.map(p => (
        <button key={p.slug} type="button" onClick={() => props.onSelect?.(p.slug)}>
          {p.title} {p.label}
        </button>
      ))}
      {props.shuttles?.map(s => (
        <span key={s.id} data-testid="shuttle">
          {s.title} · {s.age}
        </span>
      ))}
    </div>
  ),
}));

const result = (slug: string, over: Partial<SearchResult> = {}): SearchResult => ({
  slug,
  title: `Parking ${slug}`,
  services: ["shuttle"],
  shuttleMinutes: 8,
  distanceKm: 3.5,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  location: { lat: 45.73, lng: 5.05 },
  payment: "online",
  available: true,
  days: 7,
  priceCents: 4500,
  ...over,
});

const live: AirportLive = {
  serverTime: "2026-10-06T10:00:00Z",
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery", location: { lat: 45.7256, lng: 5.0811 } },
  parkings: [{ slug: "soleil", title: "Parking soleil", services: ["shuttle"], shuttleMinutes: 8, location: { lat: 45.73, lng: 5.05 } }],
  shuttles: [
    { id: "t1", parking: "soleil", direction: "dropoff", vehicle: { model: "Vito", colour: "blanc" }, position: { lat: 45.72, lng: 5.06 }, positionAgeSeconds: 12, startedAt: "2026-10-06T09:50:00Z" },
    { id: "t2", parking: "soleil", direction: "pickup", vehicle: { model: null, colour: null }, position: null, positionAgeSeconds: null, startedAt: "2026-10-06T09:55:00Z" },
  ],
};

describe("HomeMapPanel (K-A : carte vivante)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sans navette en circulation, aucune pastille de navettes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...live, shuttles: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <HomeMapPanel
        airport={{ slug: "lyon-saint-exupery", name: "Lyon Saint-Exupéry", location: { lat: 45.7256, lng: 5.0811 } }}
        results={[result("soleil")]}
        featured="soleil"
        arrivee="2026-10-07T08:00"
        retour="2026-10-14T18:00"
        days={7}
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalled();
    expect(screen.getByTestId("home-map-count")).toBeInTheDocument();
    expect(screen.queryByTestId("home-map-shuttles")).not.toBeInTheDocument();
    expect(screen.queryByText(/Aucune navette/)).not.toBeInTheDocument();
  });

  it("montre les navettes en circulation, et la pastille choisie devient la carte orange", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => live });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <HomeMapPanel
        airport={{ slug: "lyon-saint-exupery", name: "Lyon Saint-Exupéry", location: { lat: 45.7256, lng: 5.0811 } }}
        results={[result("soleil", { priceCents: 3900 }), result("b"), result("c", { available: false })]}
        featured="soleil"
        arrivee="2026-10-07T08:00"
        retour="2026-10-14T18:00"
        days={7}
      />,
    );
    const map = screen.getByTestId("map");
    expect(map).toHaveAttribute("data-selected", "soleil");
    expect(screen.getByTestId("home-map-count")).toHaveTextContent("2 parkings disponibles");
    expect(screen.getByTestId("home-featured")).toHaveTextContent("Parking soleil");
    expect(screen.getByTestId("home-featured")).toHaveTextContent(/dès 39/);
    expect(screen.getByRole("button", { name: "Parking c Complet" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/airports/lyon-saint-exupery/live", { cache: "no-store" });
    // Two shuttles on the road, one with a position: the pill counts both, the map draws one.
    expect(screen.getByTestId("home-map-shuttles")).toHaveTextContent("2 navettes en circulation");
    expect(screen.getAllByTestId("shuttle")).toHaveLength(1);
    expect(screen.getByTestId("shuttle")).toHaveTextContent("Navette de Parking soleil · vers le terminal · position il y a 12 s");

    fireEvent.click(screen.getByRole("button", { name: /^Parking b 45/ }));
    expect(screen.getByTestId("map")).toHaveAttribute("data-selected", "b");
    expect(screen.getByTestId("home-featured")).toHaveTextContent("Parking b");
    expect(screen.getByTestId("home-featured")).toHaveAttribute("href", "/lyon-saint-exupery/b?arrivee=2026-10-07T08:00&retour=2026-10-14T18:00");

    fireEvent.click(screen.getByRole("button", { name: "Parking c Complet" }));
    expect(screen.getByTestId("home-featured")).toHaveTextContent("Complet à ces dates");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
