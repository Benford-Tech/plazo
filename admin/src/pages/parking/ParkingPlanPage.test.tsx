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
  MapView: (props: {
    onMapClick?: (p: [number, number]) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="map">
      <button type="button" onClick={() => props.onMapClick?.(spotCentre)}>
        click-spot
      </button>
      {props.children}
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
  parcelsAt: vi.fn(
    async (): Promise<{ parcels: unknown[] }> => ({ parcels: [] }),
  ),
  geocode: vi.fn(async () => ({ results: [] })),
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
  lat: 45.72,
  lng: 5.08,
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
          <Route path="/parking/plan" element={<ParkingPlanPage />} />
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

describe("plan du parking (éditeur R-A, 07/10/2026)", () => {
  it("génère les places numérotées depuis la disposition choisie, puis recalcule la capacité", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
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
    // The old step name opens the editor on the spots tool.
    expect(screen.getByRole("button", { name: "Places" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: /Clients garés seuls/ }));
    const generate = await screen.findByRole(
      "button",
      { name: /^Générer \d+ places?$/ },
      { timeout: 15000 },
    );
    await waitFor(() => expect(generate).toBeEnabled(), { timeout: 15000 });
    // The count on top follows the chosen layout before anything is generated.
    expect(screen.getByTestId("plan-count").textContent).toMatch(/\d+ places?/);
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
      await screen.findByText(`Recalculer la capacité → ${spots.length}`),
    ).toBeInTheDocument();
    api.applyPlanCapacity.mockResolvedValue({ data: view([], spots.length) });
    fireEvent.click(
      screen.getByText(`Recalculer la capacité → ${spots.length}`),
    );
    await waitFor(() =>
      expect(api.applyPlanCapacity).toHaveBeenCalledWith("p1"),
    );
  }, 30000);

  it("prépare seul un plan vide : parcelle, bâtiments, zones par Claude et places (R-C)", async () => {
    api.getParkingPlan.mockResolvedValue({
      ...view([]),
      plan: { ...view([]).plan, outline: null, zones: [], settings: {} },
    });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.parcelsAt.mockResolvedValue({
      parcels: [
        {
          id: "69000A0001",
          section: "A",
          numero: "1",
          commune: "Colombier",
          insee: "69000",
          contenance: 560,
          geometry: outline,
        },
      ],
    });
    api.suggestZones.mockResolvedValue({
      zones: [{ id: "c1", name: "Zone A", geometry: outline }],
      surfaces: [
        {
          name: "Zone A",
          label: "Cour",
          surface: "gravel",
          confidence: 0.9,
          area: 560,
        },
      ],
      image: { width: 512, height: 512, metresPerPixel: 0.21, zoom: 19 },
      model: "claude-opus-5-5",
      usage: { inputTokens: 1, outputTokens: 1 },
    });
    api.replaceSpots.mockImplementation(
      async (_id: string, layout: string, spots: ParkingPlanView["spots"]) => ({
        data: {
          ...view(
            spots.map((s, i) => ({
              ...s,
              id: `s${i}`,
              kind: "standard",
              active: true,
              lon: 0,
              lat: 0,
              depth: null,
              fileLength: null,
              stayClass: null,
            })),
          ),
          plan: {
            ...view([]).plan,
            layout: layout as "valetEdge",
            zones: [{ id: "c1", name: "Zone A", geometry: outline }],
          },
        },
      }),
    );
    renderAt("/parking/plan");
    expect(await screen.findByText("Préparation du plan")).toBeInTheDocument();
    await waitFor(
      () => expect(api.parcelsAt).toHaveBeenCalledWith(5.08, 45.72),
      { timeout: 10000 },
    );
    await waitFor(
      () =>
        expect(api.suggestZones).toHaveBeenCalledWith("p1", {
          allowGrass: true,
        }),
      { timeout: 10000 },
    );
    await waitFor(() => expect(api.replaceSpots).toHaveBeenCalled(), {
      timeout: 20000,
    });
    const [, layout, spots] = api.replaceSpots.mock.calls[0];
    expect(layout).toBe("valetEdge");
    expect(spots.length).toBeGreaterThan(5);
    // The outline came from the parcel and was saved before Claude read it.
    const saved = api.updateParkingPlan.mock.calls.map((c) => c[1]);
    expect(saved.some((p) => p.outline && p.parcels?.length === 1)).toBe(true);
    expect(
      saved.some(
        (p) => p.zones?.length === 1 && p.settings?.zonesAuto === false,
      ),
    ).toBe(true);
    await waitFor(
      () =>
        expect(
          screen.queryByText("Préparation du plan"),
        ).not.toBeInTheDocument(),
      { timeout: 10000 },
    );
    expect(screen.getByRole("button", { name: "Places" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }, 40000);

  it("réinitialise tout le plan après confirmation : tracé effacé, places retirées, retour au contour", async () => {
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
    fireEvent.click(
      await screen.findByRole("button", { name: "Réinitialiser…" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Tout le plan/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(api.replaceSpots).toHaveBeenCalledWith("p1", "valet24", []),
    );
    // The IGN buildings sync at opening saves first: the reset's patch is the one without outline.
    await waitFor(() =>
      expect(
        api.updateParkingPlan.mock.calls.some((c) => c[1].outline === null),
      ).toBe(true),
    );
    const patch = api.updateParkingPlan.mock.calls.find(
      (c) => c[1].outline === null,
    )![1];
    expect(patch).toMatchObject({
      outline: null,
      zones: [],
      exclusions: [],
      landmarks: [],
      scaleFactor: 1,
    });
    expect(patch.settings).toMatchObject({
      zonesAuto: true,
      ignBuildingsSynced: false,
    });
    // Back to the contour tool, the count on top says there is nothing drawn.
    await waitFor(
      () =>
        expect(screen.getByTestId("plan-count").textContent).toBe(
          "Pas encore de contour",
        ),
      { timeout: 3000 },
    );
    // A reset is not a first opening: the plan is not prepared again on its own.
    expect(api.parcelsAt).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Contour" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    confirm.mockRestore();
  });

  it("demande à Claude de proposer les zones, les montre, puis les ajoute aux zones tracées (V-A, H-A, Z-A)", async () => {
    // A hand-drawn zone in the far corner, which the proposal does not touch: it survives.
    const corner = {
      type: "Polygon" as const,
      coordinates: [
        [
          [30, 30],
          [38, 30],
          [38, 38],
          [30, 38],
          [30, 30],
        ].map((p) => frame.inverse(p as [number, number]) as [number, number]),
      ],
    };
    api.getParkingPlan.mockResolvedValue({
      ...view([]),
      plan: {
        ...view([]).plan,
        zones: [{ id: "h1", name: "Zone A", geometry: corner }],
        settings: { zonesAuto: false, suggestGrass: false },
      },
    });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    const half = {
      type: "Polygon" as const,
      coordinates: [rect.map(([x, y]) => [x, y] as [number, number])],
    };
    api.suggestZones.mockResolvedValue({
      zones: [{ id: "c1", name: "Zone A", geometry: half }],
      surfaces: [
        {
          name: "Zone A",
          label: "Pré fauché",
          surface: "grass",
          confidence: 0.8,
          area: 520,
        },
      ],
      image: { width: 512, height: 512, metresPerPixel: 0.21, zoom: 19 },
      model: "claude-opus-5-5",
      usage: { inputTokens: 1200, outputTokens: 300 },
    });
    renderAt("/parking/plan/zones");
    expect(
      await screen.findByRole("button", { name: "Zone de parking" }),
    ).toHaveAttribute("aria-pressed", "true");
    const grass = (await screen.findByLabelText(
      /Herbe autorisée/,
    )) as HTMLInputElement;
    expect(grass.checked).toBe(false);
    fireEvent.click(grass);
    await waitFor(() =>
      expect(
        api.updateParkingPlan.mock.calls.at(-1)![1].settings.suggestGrass,
      ).toBe(true),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Proposer les zones avec Claude/ }),
    );
    expect(await screen.findByText("1 zone proposée")).toBeInTheDocument();
    expect(
      screen.getByText(/Pré fauché · herbe · sûr à 80 %/),
    ).toBeInTheDocument();
    expect(api.suggestZones).toHaveBeenCalledWith("p1", { allowGrass: true });
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter à mes zones" }),
    );
    await waitFor(() =>
      expect(api.updateParkingPlan.mock.calls.at(-1)![1].zones).toHaveLength(2),
    );
    const patch = api.updateParkingPlan.mock.calls.at(-1)![1];
    expect(
      patch.zones.map((z: { id: string; name: string }) => [z.id, z.name]),
    ).toEqual([
      ["h1", "Zone A"],
      [expect.any(String), "Zone B"],
    ]);
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
