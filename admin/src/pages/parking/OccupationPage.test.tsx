import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { OccupationBoard } from "@/lib/plan/occupation";
import type { Staff } from "@/lib/types";
import OccupationPage from "./OccupationPage";

const auth = vi.hoisted(() => ({ user: null as Staff | null }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: auth.user,
    isAuthenticated: !!auth.user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    forget: vi.fn(),
  }),
}));
vi.mock("@/components/capacity/MapView", () => ({
  MapView: (props: { onMapClick?: (p: [number, number]) => void }) => (
    <div data-testid="map">
      <button
        type="button"
        onClick={() => props.onMapClick?.([5.08002, 45.72002])}
      >
        click-spot-1
      </button>
      <button
        type="button"
        onClick={() => props.onMapClick?.([5.08007, 45.72002])}
      >
        click-spot-2
      </button>
    </div>
  ),
}));
const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getOccupation: vi.fn(),
  searchVehicles: vi.fn(),
  assignSpot: vi.fn(),
  getFiles: vi.fn(),
  assignFile: vi.fn(),
  prepareFiles: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const ring = (lon: number): [number, number][] => [
  [lon, 45.72],
  [lon + 0.00004, 45.72],
  [lon + 0.00004, 45.72004],
  [lon, 45.72004],
  [lon, 45.72],
];
const occupant = {
  id: "r1",
  reference: "RABC12",
  customerName: "Mme Laurent",
  plate: "GK-318-PX",
  status: "arrived" as const,
  arrivalAt: "2026-10-04T06:30:00.000Z",
  returnAt: "2026-10-11T16:00:00.000Z",
  returnFlight: "TO 3627",
  spotId: "s1",
  keyHook: "17",
  onSite: true,
  leavesToday: false,
  nights: 7,
  stayClass: "medium" as const,
};
const board: OccupationBoard = {
  date: "2026-10-04",
  timezone: "Europe/Paris",
  plan: { outline: null, zones: [], landmarks: [] },
  spots: [
    {
      id: "s1",
      zoneId: "z",
      code: "A-01-01",
      row: 1,
      index: 1,
      kind: "standard",
      active: true,
      geometry: ring(5.08),
      stayClass: null,
      occupant,
    },
    {
      id: "s2",
      zoneId: "z",
      code: "A-01-02",
      row: 1,
      index: 2,
      kind: "standard",
      active: true,
      geometry: ring(5.08005),
      stayClass: "short",
      occupant: null,
    },
  ],
  arrivals: [
    {
      id: "r2",
      reference: "RDEF34",
      customerName: "M. Petit",
      plate: "AB-123-CD",
      status: "upcoming",
      arrivalAt: "2026-10-04T12:10:00.000Z",
      returnAt: "2026-10-09T08:00:00.000Z",
      returnFlight: null,
      spotId: null,
      keyHook: null,
      suggestions: [
        {
          spotId: "s2",
          code: "A-01-02",
          distanceM: 12,
          reason: "near_handover",
          stayClass: "short",
        },
      ],
    },
  ],
  zones: [{ zoneId: "z", total: 2, occupied: 1 }],
  stats: { active: 2, occupied: 1, leavingToday: 0 },
};
const agent: Staff = {
  id: "s9",
  operatorId: "o1",
  email: "agent@demo.fr",
  name: "Alex Agent",
  phone: null,
  role: "agent",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "Parking Démo",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/parking/occupation"]}>
        <OccupationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = agent;
  api.getParking.mockResolvedValue({
    id: "p1",
    name: "Parking Démo",
    address: null,
    timezone: "Europe/Paris",
    totalCapacity: 2,
    safetyMarginPct: 0,
    shuttleTravelMinutes: 8,
    bookableCapacity: 2,
  });
  api.getOccupation.mockResolvedValue(board);
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
  });
  api.assignSpot.mockImplementation(
    async (
      _id: string,
      patch: { spotId: string | null; keyHook?: string | null },
    ) => ({
      data: {
        ...occupant,
        spotId: patch.spotId,
        keyHook: patch.keyHook ?? occupant.keyHook,
        spot: patch.spotId
          ? { code: patch.spotId === "s2" ? "A-01-02" : "A-01-01" }
          : null,
      },
    }),
  );
});

describe("occupation (bloc 2, étape 2)", () => {
  it("montre l'état, place une arrivée sur la place proposée, et un agent n'a que l'onglet Occupation", async () => {
    renderPage();
    expect(await screen.findByTestId("occupation-stats")).toHaveTextContent(
      "1 / 2 places occupées · 0 départ aujourd'hui",
    );
    expect(
      screen.getByRole("link", { name: "Occupation" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Plan" }),
    ).not.toBeInTheDocument();
    const row = screen.getByTestId("arrival-RDEF34");
    expect(row).toHaveTextContent("→ A-01-02 proposé");
    expect(row).toHaveTextContent("à 12 m de la remise · zone court séjour");
    fireEvent.click(screen.getByRole("button", { name: "Placer" }));
    await waitFor(() =>
      expect(api.assignSpot).toHaveBeenCalledWith("r2", { spotId: "s2" }),
    );
  });

  it("un clic sur une place montre son occupant ; « Choisir sur le plan » puis un clic place le véhicule", async () => {
    renderPage();
    await screen.findByTestId("occupation-stats");
    // D-B: the plan reads by state, or by stay length with its own legend.
    expect(screen.getByText("Départ aujourd'hui")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Par durée" }));
    expect(screen.getByText("Long séjour")).toBeInTheDocument();
    expect(screen.queryByText("Départ aujourd'hui")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("click-spot-1"));
    const card = await screen.findByTestId("spot-card");
    expect(card).toHaveTextContent("A-01-01");
    expect(card).toHaveTextContent("Mme Laurent");
    expect(card).toHaveTextContent("Clés : crochet 17");
    expect(screen.getByTestId("spot-stay")).toHaveTextContent(
      "7 nuits · Moyen séjour",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Choisir sur le plan" }),
    );
    expect(
      screen.getByText("Cliquez une place libre pour y mettre AB-123-CD."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("click-spot-2"));
    await waitFor(() =>
      expect(api.assignSpot).toHaveBeenCalledWith("r2", { spotId: "s2" }),
    );
  });

  it("retrouve un véhicule par sa plaque et enregistre le crochet des clés", async () => {
    api.searchVehicles.mockResolvedValue({
      results: [{ ...occupant, spot: { code: "A-01-01" } }],
    });
    renderPage();
    await screen.findByTestId("occupation-stats");
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rechercher un véhicule" }),
      { target: { value: "gk 318" } },
    );
    await waitFor(() =>
      expect(api.searchVehicles).toHaveBeenCalledWith("p1", "gk 318"),
    );
    fireEvent.click(await screen.findByRole("button", { name: /Mme Laurent/ }));
    expect(screen.getByTestId("vehicle-spot")).toHaveTextContent("A-01-01");
    fireEvent.change(screen.getByLabelText("Clés : crochet"), {
      target: { value: "B4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() =>
      expect(api.assignSpot).toHaveBeenCalledWith("r1", {
        spotId: "s1",
        keyHook: "B4",
      }),
    );
  });

  it("lit l'occupation en files quand le parking en a : piles, voiture à sortir, arrivée rangée dans la file proposée (S-C)", async () => {
    const car = (
      id: string,
      plate: string,
      returnAt: string,
      position: number,
      blockedBy: {
        reservationId: string;
        reference: string;
        plate: string;
        returnAt: string;
      }[] = [],
    ) => ({
      id,
      reference: id.toUpperCase(),
      customerName: `Client ${id}`,
      plate,
      status: "arrived" as const,
      arrivalAt: "2026-10-05T06:30:00.000Z",
      returnAt,
      returnFlight: null,
      keyHook: null,
      onSite: true,
      leavesToday: false,
      position,
      blockedBy,
    });
    const fileBoard = {
      date: "2026-10-07",
      timezone: "Europe/Paris",
      files: [
        {
          id: "f1",
          code: "F01",
          name: null,
          capacity: 3,
          geometry: null,
          sortOrder: 0,
          active: true,
          plannedDay: null,
          day: "2026-10-07",
          cars: [
            car("a", "AA-111-AA", "2026-10-12T16:00:00.000Z", 1),
            car("b", "BB-222-BB", "2026-10-07T16:00:00.000Z", 2, [
              {
                reservationId: "a",
                reference: "A",
                plate: "AA-111-AA",
                returnAt: "2026-10-12T16:00:00.000Z",
              },
            ]),
          ],
          movesToday: 1,
          sound: false,
        },
        {
          id: "f2",
          code: "F02",
          name: null,
          capacity: 2,
          geometry: null,
          sortOrder: 1,
          active: true,
          plannedDay: "2026-10-09",
          day: "2026-10-09",
          cars: [],
          movesToday: 0,
          sound: true,
        },
      ],
      arrivals: [
        {
          id: "r9",
          reference: "R9",
          customerName: "Mme Neuve",
          plate: "GK-318-PX",
          status: "upcoming" as const,
          arrivalAt: "2026-10-07T08:00:00.000Z",
          returnAt: "2026-10-09T10:00:00.000Z",
          returnFlight: null,
          keyHook: null,
          onSite: false,
          choices: [
            {
              fileId: "f2",
              code: "F02",
              reason: "planned_day" as const,
              moves: 0,
              cars: 0,
              capacity: 2,
              fitMinutes: null,
            },
            {
              fileId: "f1",
              code: "F01",
              reason: "moves" as const,
              moves: 1,
              cars: 2,
              capacity: 3,
              fitMinutes: null,
            },
          ],
          suggested: {
            fileId: "f2",
            code: "F02",
            reason: "planned_day" as const,
            moves: 0,
            cars: 0,
            capacity: 2,
            fitMinutes: null,
          },
        },
      ],
      stats: {
        files: 2,
        capacity: 5,
        cars: 2,
        onSite: 2,
        leavingToday: 1,
        movesToday: 1,
        unsound: 1,
      },
    };
    api.getFiles.mockResolvedValue(fileBoard);
    api.assignFile.mockResolvedValue({ data: {} });
    renderPage();
    expect(await screen.findByTestId("moves-today")).toHaveTextContent("1");
    expect(screen.getByTestId("files-stats").textContent).toBe(
      "2 / 5 voitures · 2 files · 1 à remettre en ordre",
    );
    // The blocked car says how many to take out; the empty file says what it is kept for.
    expect(screen.getByText("1 à sortir avant")).toBeInTheDocument();
    expect(screen.getByText("Gardée pour ven. 9")).toBeInTheDocument();
    // The arrival gets the planned file: place it with its keys.
    expect(screen.getByTestId("suggested").textContent).toContain("F02");
    fireEvent.click(screen.getByRole("button", { name: "Ranger en F02" }));
    fireEvent.change(screen.getByLabelText("Crochet des clés (facultatif)"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ranger en F02/ }));
    await waitFor(() =>
      expect(api.assignFile).toHaveBeenCalledWith("r9", {
        fileId: "f2",
        keyHook: "12",
      }),
    );
    // Taking a car out of its file.
    fireEvent.click(
      screen.getByRole("button", { name: "Retirer de la file BB-222-BB" }),
    );
    await waitFor(() =>
      expect(api.assignFile).toHaveBeenCalledWith("b", {
        fileId: null,
        keyHook: undefined,
      }),
    );
  });
});
