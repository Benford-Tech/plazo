import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { makeFrame } from "@/lib/capacity/projection";
import type { ParkingPlanView } from "@/lib/plan/types";
import type { Staff } from "@/lib/types";
import ParkingPlanPage from "./ParkingPlanPage";

const manager: Staff = {
  id: "s1",
  operatorId: "o1",
  email: "gerant@demo.fr",
  name: "Camille Gérant",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "Parking Démo",
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: manager,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    forget: vi.fn(),
  }),
}));

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
  buildingsIn: vi.fn(async () => ({ buildings: [] })),
  suggestZones: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
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
].map((p) => frame.inverse(p as [number, number])) as [number, number][];
const outline = { type: "Polygon" as const, coordinates: [rect] };
let spotCentre: [number, number] = [5.08, 45.72];

const parking = {
  id: "p1",
  name: "Parking Test",
  address: null,
  timezone: "Europe/Paris",
  totalCapacity: 200,
  safetyMarginPct: 0,
  shuttleTravelMinutes: 8,
  bookableCapacity: 200,
};
const view = (
  spots: ParkingPlanView["spots"],
  totalCapacity = 200,
): ParkingPlanView => ({
  plan: {
    id: "pl1",
    parkingId: "p1",
    outline,
    parcels: [],
    scaleFactor: 1,
    zones: [{ id: "z1", name: "Zone A", geometry: outline }],
    exclusions: [],
    settings: {},
    landmarks: [],
    layout: spots.length ? "valet24" : null,
    generatedAt: spots.length ? "2026-10-03T10:00:00Z" : null,
    updatedAt: "2026-10-03T10:00:00Z",
  },
  spots,
  activeSpots: spots.filter((s) => s.active).length,
  totalCapacity,
});

function renderAt(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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
    api.replaceSpots.mockImplementation(
      async (_id: string, layout: string, spots: ParkingPlanView["spots"]) => ({
        data: view(
          spots.map((s, i) => ({
            ...s,
            id: `s${i}`,
            kind: "standard",
            active: true,
            lon: 0,
            lat: 0,
            depth: s.depth ?? null,
            fileLength: s.fileLength ?? null,
            stayClass: s.stayClass ?? null,
          })),
          200,
        ),
      }),
    );
    renderAt("/parking/plan/places");
    expect(
      await screen.findByRole("heading", { name: "Plan du parking" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réglages" })).toHaveAttribute(
      "href",
      "/parking/reglages",
    );
    expect(
      screen.getByText(
        "Aucune place pour l'instant : choisissez une disposition et générez les places.",
      ),
    ).toBeInTheDocument();

    const generate = await screen.findByRole("button", {
      name: "Générer les places",
    });
    await waitFor(() => expect(generate).toBeEnabled(), { timeout: 15000 });
    fireEvent.click(screen.getByRole("radio", { name: /Clients garés seuls/ }));
    fireEvent.click(generate);
    await waitFor(() => expect(api.replaceSpots).toHaveBeenCalled());
    const [, layout, spots] = api.replaceSpots.mock.calls[0];
    expect(layout).toBe("selfPark");
    expect(spots.length).toBeGreaterThan(10);
    expect(spots[0].code).toBe("A-01-01");
    expect(new Set(spots.map((s: { code: string }) => s.code)).size).toBe(
      spots.length,
    );
    expect(
      spots.every(
        (s: { row: number; index: number }) => s.row >= 1 && s.index >= 1,
      ),
    ).toBe(true);

    expect(
      await screen.findByText(`Recalculer la capacité → ${spots.length}`),
    ).toBeInTheDocument();
    api.applyPlanCapacity.mockResolvedValue({ data: view([], spots.length) });
    fireEvent.click(
      screen.getByText(`Recalculer la capacité → ${spots.length}`),
    );
    await waitFor(() =>
      expect(api.applyPlanCapacity).toHaveBeenCalledWith("p1"),
    );
  }, 20000);

  it("réinitialise tout le plan après confirmation : tracé effacé, places retirées, retour au terrain", async () => {
    api.getParkingPlan.mockResolvedValue(
      view(
        [
          {
            id: "s1",
            zoneId: "z1",
            code: "A-01-01",
            row: 1,
            index: 1,
            kind: "standard",
            active: true,
            geometry: rect,
            lon: 5.08,
            lat: 45.72,
            depth: null,
            fileLength: null,
            stayClass: null,
          },
        ],
        1,
      ),
    );
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceSpots.mockResolvedValue({ data: view([], 1) });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/parking/plan/places");
    fireEvent.click(await screen.findByRole("button", { name: "Réinitialiser…" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Tout le plan/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(api.replaceSpots).toHaveBeenCalledWith("p1", "valet24", []));
    await waitFor(() => expect(api.updateParkingPlan).toHaveBeenCalled());
    const patch = api.updateParkingPlan.mock.calls[0][1];
    expect(patch).toMatchObject({ outline: null, zones: [], exclusions: [], landmarks: [], scaleFactor: 1 });
    expect(patch.settings).toMatchObject({ zonesAuto: true, ignBuildingsSynced: false });
    expect(await screen.findByText("Pas encore de contour")).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("demande à Claude de proposer les zones, les montre, puis les applique (V-A)", async () => {
    api.getParkingPlan.mockResolvedValue({ ...view([]), plan: { ...view([]).plan, zones: [], settings: { zonesAuto: false } } });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    const half = { type: "Polygon" as const, coordinates: [rect.map(([x, y]) => [x, y] as [number, number])] };
    api.suggestZones.mockResolvedValue({
      zones: [{ id: "c1", name: "Zone A", geometry: half }],
      surfaces: [{ name: "Zone A", label: "Cour en enrobé", surface: "asphalt", confidence: 0.9, area: 520 }],
      image: { width: 512, height: 512, metresPerPixel: 0.21, zoom: 19 },
      model: "claude-opus-5-5",
      usage: { inputTokens: 1200, outputTokens: 300 },
    });
    renderAt("/parking/plan/zones");
    fireEvent.click(await screen.findByRole("button", { name: /Proposer les zones avec Claude/ }));
    expect(await screen.findByText("1 zone proposée")).toBeInTheDocument();
    expect(screen.getByText(/Cour en enrobé · enrobé · sûr à 90 %/)).toBeInTheDocument();
    expect(api.suggestZones).toHaveBeenCalledWith("p1");
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));
    await waitFor(() => expect(api.updateParkingPlan).toHaveBeenCalled());
    const patch = api.updateParkingPlan.mock.calls.at(-1)![1];
    expect(patch.zones).toHaveLength(1);
    expect(patch.zones[0].name).toBe("Zone A");
    expect(patch.settings.zonesAuto).toBe(false);
    expect(screen.queryByText("1 zone proposée")).not.toBeInTheDocument();
  });

  it("désactive une place d'un clic sur la carte", async () => {
    const ring = [
      [0, 0],
      [2.5, 0],
      [2.5, 5],
      [0, 5],
      [0, 0],
    ].map((p) => frame.inverse(p as [number, number])) as [number, number][];
    spotCentre = frame.inverse([1.2, 2.5]) as [number, number];
    api.getParkingPlan.mockResolvedValue(
      view(
        [
          {
            id: "s1",
            zoneId: "z1",
            code: "A-01-01",
            row: 1,
            index: 1,
            kind: "standard",
            active: true,
            geometry: ring,
            lon: 0,
            lat: 0,
            depth: null,
            fileLength: null,
            stayClass: null,
          },
        ],
        1,
      ),
    );
    api.updateSpot.mockResolvedValue({ data: {} });
    renderAt("/parking/plan/places");
    expect(
      await screen.findByText("Capacité déclarée à jour"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("click-spot"));
    await waitFor(() =>
      expect(api.updateSpot).toHaveBeenCalledWith("p1", "s1", {
        active: false,
      }),
    );
    expect(
      await screen.findByText("Recalculer la capacité → 0"),
    ).toBeInTheDocument();
  });
});
