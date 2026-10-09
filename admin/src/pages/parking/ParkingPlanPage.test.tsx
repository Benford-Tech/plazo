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

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  message: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));

const mapHandle = vi.hoisted(() => ({
  flyTo: vi.fn(),
  fitTo: vi.fn(),
  rotateTo: vi.fn(),
  project: vi.fn(() => null),
  getBounds: vi.fn(() => null),
}));
vi.mock("@/components/capacity/MapView", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    MapView: forwardRef(function MapView(
      props: {
        onMapClick?: (p: [number, number]) => void;
        onDrawn?: (g: { type: string; coordinates: unknown }) => void;
        drawMode?: string | null;
        initialBounds?: unknown;
        onBearingChange?: (bearing: number) => void;
        labels?: { id: string; lngLat: [number, number]; text: string }[];
        children?: React.ReactNode;
      },
      ref,
    ) {
      useImperativeHandle(ref, () => mapHandle);
      return (
        <div
          data-testid="map"
          data-drawmode={props.drawMode ?? ""}
          data-bounds={JSON.stringify(props.initialBounds ?? null)}
        >
          <button type="button" onClick={() => props.onMapClick?.(spotCentre)}>
            click-spot
          </button>
          <button
            type="button"
            onClick={() =>
              props.onDrawn?.({ type: "LineString", coordinates: drawnLine })
            }
          >
            draw-line
          </button>
          <button type="button" onClick={() => props.onBearingChange?.(30)}>
            turn-30
          </button>
          <ul>
            {(props.labels ?? []).map((l) => (
              <li key={l.id} data-testid={`label-${l.id}`}>
                {l.text} {l.lngLat.join(",")}
              </li>
            ))}
          </ul>
          {props.children}
        </div>
      );
    }),
  };
});
const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getParkingPlan: vi.fn(),
  updateParkingPlan: vi.fn(),
  replaceSpots: vi.fn(),
  addSpots: vi.fn(),
  deleteSpot: vi.fn(),
  updateSpot: vi.fn(),
  applyPlanCapacity: vi.fn(),
  buildingsIn: vi.fn(async () => ({ buildings: [] })),
  parcelsAt: vi.fn(
    async (): Promise<{ parcels: unknown[] }> => ({ parcels: [] }),
  ),
  geocode: vi.fn(async () => ({ results: [] })),
  suggestZones: vi.fn(),
  getFiles: vi.fn(async () => ({
    date: "2026-10-07",
    timezone: "Europe/Paris",
    files: [],
    arrivals: [],
    stats: {
      files: 0,
      capacity: 0,
      cars: 0,
      onSite: 0,
      leavingToday: 0,
      movesToday: 0,
      unsound: 0,
    },
  })),
  replaceFiles: vi.fn(),
  filesFromPlan: vi.fn(),
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
// A 12.5 m line across the land: five valet spots of 2.4 m.
const drawnLine: [number, number][] = [
  frame.inverse([0, 7]) as [number, number],
  frame.inverse([12.5, 7]) as [number, number],
];

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
            manual: false,
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

  it("prépare seul un plan vide : parcelle, bâtiments, zones par Claude, places puis files (R-C, S-C)", async () => {
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
              depth: s.depth ?? null,
              fileLength: s.fileLength ?? null,
              stayClass: s.stayClass ?? null,
              manual: false,
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
    api.filesFromPlan.mockResolvedValue({
      data: [
        {
          id: "f0",
          code: "F01",
          name: null,
          capacity: 4,
          geometry: null,
          sortOrder: 0,
          active: true,
          plannedDay: null,
        },
      ],
    });
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
    // The comb's valet files become the files of the parking, and the editor opens on them.
    await waitFor(() => expect(api.filesFromPlan).toHaveBeenCalledWith("p1"));
    await waitFor(
      () =>
        expect(
          screen.queryByText("Préparation du plan"),
        ).not.toBeInTheDocument(),
      { timeout: 10000 },
    );
    expect(toast.success).toHaveBeenCalledWith(
      "1 file proposée : corrigez-la d'un trait si besoin",
    );
    expect(screen.getByRole("button", { name: "Files" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }, 40000);

  it("ouvre sur Contour · Files · Repères, les outils de l'estimateur sous « Avancé »", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan");
    // With an outline and no files yet, the editor opens on the files tool.
    expect(
      await screen.findByRole("button", { name: "Files" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Contour" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Repères" })).toBeInTheDocument();
    for (const name of [
      "Zone de parking",
      "Zone de passage",
      "Obstacle",
      "Places",
    ])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    const advanced = screen.getByRole("button", { name: "Avancé" });
    expect(advanced).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute("aria-expanded", "true");
    for (const name of [
      "Zone de parking",
      "Zone de passage",
      "Obstacle",
      "Places",
    ])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Places" }));
    expect(screen.getByRole("button", { name: "Places" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Folding with an estimator tool in hand hands a primary one over, then folds.
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute("aria-expanded", "false");
    for (const name of [
      "Zone de parking",
      "Zone de passage",
      "Obstacle",
      "Places",
    ])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Files" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("« Me proposer des files » crée les files depuis les places voiturier du plan", async () => {
    api.getParkingPlan.mockResolvedValue(
      view([
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
          depth: 1,
          fileLength: 4,
          stayClass: "short",
          manual: false,
        },
      ]),
    );
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    const proposed = (code: string, i: number) => ({
      id: `f${i}`,
      code,
      name: null,
      capacity: 4,
      geometry: null,
      sortOrder: i,
      active: true,
      plannedDay: null,
    });
    api.filesFromPlan.mockResolvedValue({
      data: [proposed("F01", 0), proposed("F02", 1)],
    });
    renderAt("/parking/plan/files");
    const propose = await screen.findByRole("button", {
      name: "Me proposer des files",
    });
    expect(
      screen.getByText(/Plazo découpe le terrain en files de voiturier/),
    ).toBeInTheDocument();
    fireEvent.click(propose);
    await waitFor(() => expect(api.filesFromPlan).toHaveBeenCalledWith("p1"));
    // The valet spots are there: no automatic pass runs first.
    expect(api.parcelsAt).not.toHaveBeenCalled();
    expect(api.replaceSpots).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "2 files proposées : corrigez-les d'un trait si besoin",
      ),
    );
  });

  it("réinitialise les files seulement : les files vides sont retirées, les places restent", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceFiles.mockResolvedValue({ data: [] });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/parking/plan/files");
    fireEvent.click(
      await screen.findByRole("button", { name: "Réinitialiser…" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Files seulement/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(api.replaceFiles).toHaveBeenCalledWith("p1", []),
    );
    expect(api.replaceSpots).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Files retirées"),
    );
    expect(screen.getByRole("button", { name: "Files" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    confirm.mockRestore();
  });

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
            manual: false,
          },
        ],
        1,
      ),
    );
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceSpots.mockResolvedValue({ data: view([], 1) });
    api.replaceFiles.mockResolvedValue({ data: [] });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/parking/plan/places");
    fireEvent.click(
      await screen.findByRole("button", { name: "Réinitialiser…" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Tout le plan/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    // The spots laid by hand go too, and so do the files.
    await waitFor(() =>
      expect(api.replaceSpots).toHaveBeenCalledWith("p1", "valet24", [], {
        includeManual: true,
      }),
    );
    await waitFor(() =>
      expect(api.replaceFiles).toHaveBeenCalledWith("p1", []),
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

  it("pose une rangée de places à la main le long d'un trait, puis la supprime d'un clic (P-B)", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    const manualSpot = (code: string, i: number) => ({
      id: `m${i}`,
      zoneId: "z1",
      code,
      row: 1,
      index: i + 1,
      kind: "standard" as const,
      active: true,
      geometry: rect,
      lon: 5.08,
      lat: 45.72,
      depth: null,
      fileLength: null,
      stayClass: null,
      manual: true,
    });
    api.addSpots.mockImplementation(
      async (_id: string, spots: { code: string }[]) => ({
        data: view(spots.map((s, i) => manualSpot(s.code, i))),
      }),
    );
    api.deleteSpot.mockResolvedValue({ data: view([]) });
    renderAt("/parking/plan/places");
    const row = await screen.findByRole("button", {
      name: "+ Rangée de places",
    });
    fireEvent.click(row);
    expect(screen.getByTestId("map")).toHaveAttribute(
      "data-drawmode",
      "linestring",
    );
    fireEvent.click(screen.getByText("draw-line"));
    await waitFor(() => expect(api.addSpots).toHaveBeenCalled());
    const [, spots] = api.addSpots.mock.calls[0];
    expect(spots.map((s: { code: string }) => s.code)).toEqual([
      "M-01",
      "M-02",
      "M-03",
      "M-04",
      "M-05",
    ]);
    expect(spots[0]).toMatchObject({ zoneId: "z1", row: 1, index: 1 });
    expect(await screen.findByText("5 à la main")).toBeInTheDocument();
    expect(screen.getByTestId("plan-count").textContent).toBe("5 places");
    // The delete tool removes a spot laid by hand.
    spotCentre = frame.inverse([1, 1]) as [number, number];
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.click(screen.getByText("click-spot"));
    await waitFor(() =>
      expect(api.deleteSpot).toHaveBeenCalledWith("p1", "m0"),
    );
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
            manual: false,
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

  it("trace une file d'un trait et déduit sa capacité de la longueur (S-C)", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceFiles.mockImplementation(
      async (_id: string, files: { code: string; capacity: number }[]) => {
        api.getFiles.mockResolvedValue({
          date: "2026-10-07",
          timezone: "Europe/Paris",
          files: files.map((f, i) => ({
            id: `f${i}`,
            name: null,
            geometry: null,
            sortOrder: i,
            active: true,
            plannedDay: null,
            day: null,
            cars: [],
            movesToday: 0,
            sound: true,
            ...f,
          })),
          arrivals: [],
          stats: {
            files: files.length,
            capacity: 0,
            cars: 0,
            onSite: 0,
            leavingToday: 0,
            movesToday: 0,
            unsound: 0,
          },
        } as never);
        return { data: files.map((f, i) => ({ id: `f${i}`, ...f })) };
      },
    );
    renderAt("/parking/plan/files");
    const draw = await screen.findByRole("button", {
      name: "+ Tracer une file",
    });
    fireEvent.click(draw);
    expect(screen.getByTestId("map")).toHaveAttribute(
      "data-drawmode",
      "linestring",
    );
    fireEvent.click(screen.getByText("draw-line"));
    await waitFor(() => expect(api.replaceFiles).toHaveBeenCalled());
    const [, files] = api.replaceFiles.mock.calls[0];
    // A 12.5 m line at 5 m per car holds 2 cars.
    expect(files).toEqual([
      expect.objectContaining({ code: "F01", capacity: 2, sortOrder: 0 }),
    ]);
    expect(await screen.findByTestId("file-F01")).toBeInTheDocument();
    expect(screen.getByTestId("plan-count").textContent).toBe(
      "1 file · 2 voitures",
    );
  });

  it("ne relance pas la préparation automatique sur un plan vidé par une réinitialisation", async () => {
    api.getParkingPlan.mockResolvedValue({
      ...view([]),
      plan: {
        ...view([]).plan,
        outline: null,
        zones: [],
        settings: { autoSetupAt: "2026-10-08T06:00:00.000Z" },
      },
    });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan");
    await screen.findByRole("button", { name: "Contour" });
    await new Promise((r) => setTimeout(r, 50));
    expect(api.parcelsAt).not.toHaveBeenCalled();
    expect(api.suggestZones).not.toHaveBeenCalled();
    expect(api.replaceSpots).not.toHaveBeenCalled();
    expect(screen.queryByText("Préparation du plan")).not.toBeInTheDocument();
  });

  it("se cale sur l'adresse du parking : épingle, ouverture sur le contour et l'adresse, « Recentrer sur le parking »", async () => {
    // The address 550 m north of the outline: the opening view shows both.
    api.getParking.mockResolvedValue({ ...parking, lat: 45.725, lng: 5.08 });
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan");
    expect(
      (await screen.findByTestId("label-parking-address")).textContent,
    ).toBe("Adresse du parking 5.08,45.725");
    const [[w, s], [e, n]] = JSON.parse(
      screen.getByTestId("map").dataset.bounds!,
    ) as [[number, number], [number, number]];
    expect(n).toBe(45.725);
    expect(s).toBeCloseTo(45.72, 4);
    expect(w).toBeCloseTo(5.08, 4);
    expect(e).toBeGreaterThan(5.08);
    fireEvent.click(
      screen.getByRole("button", { name: "Recentrer sur le parking" }),
    );
    expect(mapHandle.fitTo).toHaveBeenCalledWith([
      [w, s],
      [e, n],
    ]);
  });

  it("revient sur l'adresse après « Réinitialiser… › Tout le plan », pas quand on annule", async () => {
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceFiles.mockResolvedValue({ data: [] });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderAt("/parking/plan");
    fireEvent.click(
      await screen.findByRole("button", { name: "Réinitialiser…" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Tout le plan/ }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(mapHandle.fitTo).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser…" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Tout le plan/ }));
    // Some 200 m around the address, the outline being gone.
    await waitFor(() =>
      expect(mapHandle.fitTo).toHaveBeenCalledWith([
        [5.08 - 0.0015, 45.72 - 0.0015],
        [5.08 + 0.0015, 45.72 + 0.0015],
      ]),
    );
    confirm.mockRestore();
  });

  it("sans adresse placée, ni épingle ni recentrage avant le premier contour", async () => {
    api.getParking.mockResolvedValue({ ...parking, lat: null, lng: null });
    api.getParkingPlan.mockResolvedValue({
      ...view([]),
      plan: { ...view([]).plan, outline: null, zones: [] },
    });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan");
    await screen.findByRole("button", { name: "Réinitialiser…" });
    expect(screen.queryByTestId("label-parking-address")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Recentrer sur le parking" }),
    ).toBeNull();
  });

  it("Ctrl+Z annule le dernier geste sur le dessin, Ctrl+Maj+Z le rétablit, sauf dans un champ", async () => {
    const entrance = {
      id: "lm1",
      kind: "entrance" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [5.08, 45.72] as [number, number],
      },
    };
    api.getParkingPlan.mockResolvedValue({
      ...view([]),
      plan: { ...view([]).plan, landmarks: [entrance] },
    });
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan/landmark");
    fireEvent.click(
      await screen.findByRole("button", { name: "Retirer Entrée" }),
    );
    expect(screen.queryByRole("button", { name: "Retirer Entrée" })).toBeNull();

    // In a text field, Ctrl+Z is the field's own.
    const field = document.body.appendChild(document.createElement("input"));
    fireEvent.keyDown(field, { key: "z", ctrlKey: true });
    expect(screen.queryByRole("button", { name: "Retirer Entrée" })).toBeNull();
    field.remove();

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(
      await screen.findByRole("button", { name: "Retirer Entrée" }),
    ).toBeInTheDocument();
    expect(toast.message).toHaveBeenLastCalledWith("Modification annulée", {
      id: "plan-history",
    });
    fireEvent.keyDown(window, { key: "Z", ctrlKey: true, shiftKey: true });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Retirer Entrée" }),
      ).toBeNull(),
    );
    // Saved like any change: the last patch has no landmark.
    await waitFor(() =>
      expect(api.updateParkingPlan).toHaveBeenLastCalledWith(
        "p1",
        expect.objectContaining({ landmarks: [] }),
      ),
    );
    fireEvent.keyDown(window, { key: "y", metaKey: true });
    expect(toast.message).toHaveBeenLastCalledWith("Rien à rétablir", {
      id: "plan-history",
    });
  });

  it("Ctrl+Z retire la file qui vient d'être tracée, Ctrl+Y la remet", async () => {
    // No file yet (an earlier test leaves its own in the mock).
    api.getFiles.mockResolvedValue({
      date: "2026-10-07",
      timezone: "Europe/Paris",
      files: [],
      arrivals: [],
      stats: {
        files: 0,
        capacity: 0,
        cars: 0,
        onSite: 0,
        leavingToday: 0,
        movesToday: 0,
        unsound: 0,
      },
    } as never);
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    api.replaceFiles.mockImplementation(
      async (_id: string, files: { code: string; capacity: number }[]) => {
        api.getFiles.mockResolvedValue({
          date: "2026-10-07",
          timezone: "Europe/Paris",
          files: files.map((f, i) => ({
            id: `f${i}`,
            name: null,
            geometry: null,
            sortOrder: i,
            active: true,
            plannedDay: null,
            day: null,
            cars: [],
            movesToday: 0,
            sound: true,
            ...f,
          })),
          arrivals: [],
          stats: {
            files: files.length,
            capacity: 0,
            cars: 0,
            onSite: 0,
            leavingToday: 0,
            movesToday: 0,
            unsound: 0,
          },
        } as never);
        return { data: files.map((f, i) => ({ id: `f${i}`, ...f })) };
      },
    );
    renderAt("/parking/plan/files");
    fireEvent.click(
      await screen.findByRole("button", { name: "+ Tracer une file" }),
    );
    fireEvent.click(screen.getByText("draw-line"));
    expect(await screen.findByTestId("file-F01")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    await waitFor(() =>
      expect(api.replaceFiles).toHaveBeenLastCalledWith("p1", []),
    );
    await waitFor(() => expect(screen.queryByTestId("file-F01")).toBeNull());

    fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    await waitFor(() =>
      expect(api.replaceFiles).toHaveBeenLastCalledWith("p1", [
        expect.objectContaining({ code: "F01", capacity: 2 }),
      ]),
    );
    expect(await screen.findByTestId("file-F01")).toBeInTheDocument();
  });

  it("replie la palette à la main, et d'elle-même pendant qu'on trace une file (P-B)", async () => {
    localStorage.removeItem("plazo:plan-palette");
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan/files");
    const draw = await screen.findByRole("button", {
      name: "+ Tracer une file",
    });
    const card = screen.getByTestId("tool-card");
    expect(card).toHaveAttribute("data-collapsed", "false");

    // While the line is drawn the palette is a bar: the tool, the help line, « Terminer ».
    fireEvent.click(draw);
    expect(card).toHaveAttribute("data-collapsed", "true");
    expect(
      screen.queryByRole("button", { name: "+ Tracer une file" }),
    ).toBeNull();
    expect(card.textContent).toContain("Terminer");
    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(card).toHaveAttribute("data-collapsed", "false");

    // By hand, and remembered.
    fireEvent.click(screen.getByRole("button", { name: "Replier la palette" }));
    expect(card).toHaveAttribute("data-collapsed", "true");
    expect(localStorage.getItem("plazo:plan-palette")).toBe("closed");
    fireEvent.click(screen.getByRole("button", { name: "Déplier la palette" }));
    expect(card).toHaveAttribute("data-collapsed", "false");
    expect(
      screen.getByRole("button", { name: "+ Tracer une file" }),
    ).toBeInTheDocument();
    localStorage.removeItem("plazo:plan-palette");
  });

  it("tourne la carte : « Aligner sur le parking », boussole et nord en haut (R-A)", async () => {
    localStorage.removeItem("plazo:plan-bearing:p1");
    api.getParkingPlan.mockResolvedValue(view([]));
    api.updateParkingPlan.mockResolvedValue({ data: {} });
    renderAt("/parking/plan");
    // The 40 × 14 m outline lies east-west in Lambert 93, whose north is ~1.5° off true north at
    // Lyon: aligned, the map barely turns.
    fireEvent.click(
      await screen.findByRole("button", { name: "Aligner sur le parking" }),
    );
    expect(mapHandle.rotateTo).toHaveBeenCalledTimes(1);
    const [aligned, bounds] = mapHandle.rotateTo.mock.calls[0];
    expect(Math.abs(aligned)).toBeLessThan(3);
    expect(bounds).not.toBeNull();
    // No compass while north is up.
    expect(
      screen.queryByRole("button", { name: "Remettre le nord en haut" }),
    ).toBeNull();

    // Turned by hand: the compass appears, the bearing is kept for this parking.
    fireEvent.click(screen.getByText("turn-30"));
    const north = await screen.findByRole("button", {
      name: "Remettre le nord en haut",
    });
    expect(localStorage.getItem("plazo:plan-bearing:p1")).toBe("30");
    fireEvent.click(north);
    expect(mapHandle.rotateTo).toHaveBeenLastCalledWith(0);
    localStorage.removeItem("plazo:plan-bearing:p1");
  });
});
