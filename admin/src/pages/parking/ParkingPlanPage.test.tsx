import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { makeFrame } from "@/lib/capacity/projection";
import type { ParkingPlanView } from "@/lib/plan/types";
import ParkingPlanPage from "./ParkingPlanPage";

vi.mock("@/components/capacity/MapView", () => ({
  MapView: (props: { onMapClick?: (p: [number, number]) => void }) => (
    <div data-testid="map">
      <button type="button" onClick={() => props.onMapClick?.(spotCentre)}>
        click-spot
      </button>
    </div>
  ),
}));
const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getParkingPlan: vi.fn(),
  updateParkingPlan: vi.fn(),
  replaceSpots: vi.fn(),
  updateSpot: vi.fn(),
  applyPlanCapacity: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

// A 40 m × 14 m rectangle at Lyon Saint-Exupéry, as one zone.
const frame = makeFrame([5.08, 45.72], 1);
const rect = [
  [0, 0],
  [40, 0],
  [40, 14],
  [0, 14],
  [0, 0],
].map(p => frame.inverse(p as [number, number])) as [number, number][];
const outline = { type: "Polygon" as const, coordinates: [rect] };
let spotCentre: [number, number] = [5.08, 45.72];

const parking = { id: "p1", name: "Parking Test", address: null, timezone: "Europe/Paris", totalCapacity: 200, safetyMarginPct: 0, shuttleTravelMinutes: 8, bookableCapacity: 200 };
const view = (spots: ParkingPlanView["spots"], totalCapacity = 200): ParkingPlanView => ({
  plan: { id: "pl1", parkingId: "p1", outline, parcels: [], scaleFactor: 1, zones: [{ id: "z1", name: "Zone A", geometry: outline }], exclusions: [], settings: {}, landmarks: [], layout: spots.length ? "valet24" : null, generatedAt: spots.length ? "2026-10-03T10:00:00Z" : null, updatedAt: "2026-10-03T10:00:00Z" },
  spots,
  activeSpots: spots.filter(s => s.active).length,
  totalCapacity,
});

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/parking/plan/:step" element={<ParkingPlanPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getParking.mockResolvedValue(parking);
});

describe("plan du parking (bloc 2, étape Plan)", () => {
  it("génère les places numérotées depuis la disposition choisie, puis recalcule la capacité", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.replaceSpots.mockImplementation(async (_id: string, layout: string, spots: ParkingPlanView["spots"]) =>
      ({ data: view(spots.map((s, i) => ({ ...s, id: `s${i}`, kind: "standard", active: true, lon: 0, lat: 0 })), 200) }),
    );
    renderAt("/parking/plan/places");
    expect(await screen.findByRole("heading", { name: "Plan du parking" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réglages" })).toHaveAttribute("href", "/parking/reglages");
    expect(screen.getByText("Aucune place pour l'instant : choisissez une disposition et générez les places.")).toBeInTheDocument();

    const generate = await screen.findByRole("button", { name: "Générer les places" });
    await waitFor(() => expect(generate).toBeEnabled(), { timeout: 15000 });
    fireEvent.click(screen.getByRole("radio", { name: /Clients garés seuls/ }));
    fireEvent.click(generate);
    await waitFor(() => expect(api.replaceSpots).toHaveBeenCalled());
    const [, layout, spots] = api.replaceSpots.mock.calls[0];
    expect(layout).toBe("selfPark");
    expect(spots.length).toBeGreaterThan(10);
    expect(spots[0].code).toBe("A-01-01");
    expect(new Set(spots.map((s: { code: string }) => s.code)).size).toBe(spots.length);
    expect(spots.every((s: { row: number; index: number }) => s.row >= 1 && s.index >= 1)).toBe(true);

    expect(await screen.findByText(`Recalculer la capacité → ${spots.length}`)).toBeInTheDocument();
    api.applyPlanCapacity.mockResolvedValue({ data: view([], spots.length) });
    fireEvent.click(screen.getByText(`Recalculer la capacité → ${spots.length}`));
    await waitFor(() => expect(api.applyPlanCapacity).toHaveBeenCalledWith("p1"));
  }, 20000);

  it("désactive une place d'un clic sur la carte", async () => {
    const ring = [
      [0, 0],
      [2.5, 0],
      [2.5, 5],
      [0, 5],
      [0, 0],
    ].map(p => frame.inverse(p as [number, number])) as [number, number][];
    spotCentre = frame.inverse([1.2, 2.5]) as [number, number];
    api.getParkingPlan.mockResolvedValue(view([{ id: "s1", zoneId: "z1", code: "A-01-01", row: 1, index: 1, kind: "standard", active: true, geometry: ring, lon: 0, lat: 0 }], 1));
    api.updateSpot.mockResolvedValue({ data: {} });
    renderAt("/parking/plan/places");
    expect(await screen.findByText("Capacité déclarée à jour")).toBeInTheDocument();
    fireEvent.click(screen.getByText("click-spot"));
    await waitFor(() => expect(api.updateSpot).toHaveBeenCalledWith("p1", "s1", { active: false }));
    expect(await screen.findByText("Recalculer la capacité → 0")).toBeInTheDocument();
  });
});
