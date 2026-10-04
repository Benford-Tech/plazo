import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { addDays, todayLocal } from "@/lib/datetime";
import type { SpotPlanning } from "@/lib/plan/spotPlanning";
import type { Staff } from "@/lib/types";
import SpotPlanningPage from "./SpotPlanningPage";

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
const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getSpotPlanning: vi.fn(),
  preassignSpots: vi.fn(),
  assignSpot: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const today = todayLocal();
const d = (n: number) => addDays(today, n);
const stay = (
  id: string,
  ref: string,
  plate: string,
  a: number,
  r: number,
  extra: Partial<SpotPlanning["unplaced"][number]> = {},
) => ({
  id,
  reference: ref,
  customerName: `Client ${plate}`,
  plate,
  status: "upcoming" as const,
  arrivalAt: `${d(a)}T06:30:00.000Z`,
  returnAt: `${d(r)}T16:00:00.000Z`,
  returnFlight: null,
  spotId: null,
  keyHook: null,
  onSite: false,
  ...extra,
});
const spot = (
  id: string,
  code: string,
  index: number,
  stays: SpotPlanning["unplaced"] = [],
) => ({
  id,
  zoneId: "z",
  code,
  row: 1,
  index,
  kind: "standard" as const,
  active: true,
  stays,
});
const planning: SpotPlanning = {
  from: today,
  days: 14,
  timezone: "Europe/Paris",
  capacity: 2,
  spots: [
    spot("s1", "A-01-01", 1, [
      stay("r1", "RAAA11", "AA-111-AA", 0, 3, {
        spotId: "s1",
        status: "arrived",
        onSite: true,
      }),
    ]),
    spot("s2", "A-01-02", 2),
  ],
  unplaced: [
    stay("r2", "RBBB22", "BB-222-BB", 1, 4),
    stay("r3", "RCCC33", "CC-333-CC", 2, 5),
  ],
  load: Array.from({ length: 14 }, (_, i) => ({
    date: d(i),
    placed: i <= 3 ? 1 : 0,
    unplaced: i === 2 || i === 3 ? 2 : i === 1 || i === 4 ? 1 : 0,
    capacity: 2,
  })),
  alerts: [
    { kind: "over_capacity", date: d(2), count: 1 },
    { kind: "unplaced", count: 2 },
  ],
};
const manager: Staff = {
  id: "s9",
  operatorId: "o1",
  email: "m@demo.fr",
  name: "Manager",
  phone: null,
  role: "manager",
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
      <MemoryRouter initialEntries={["/parking/planning"]}>
        <SpotPlanningPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = manager;
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
  api.getSpotPlanning.mockResolvedValue(planning);
  api.preassignSpots.mockResolvedValue({
    data: {
      assigned: [
        {
          reservationId: "r2",
          reference: "RBBB22",
          spotId: "s2",
          code: "A-01-02",
        },
      ],
      skipped: [{ reservationId: "r3", reference: "RCCC33" }],
    },
  });
  api.assignSpot.mockResolvedValue({
    data: { id: "r2", spotId: "s2", spot: { code: "A-01-02" } },
  });
});

describe("planning des places (bloc 2, étape 3)", () => {
  it("une ligne par place, la charge du jour en rouge quand elle dépasse, les alertes et la pré-affectation", async () => {
    renderPage();
    expect(await screen.findByTestId("row-A-01-01")).toBeInTheDocument();
    expect(screen.getByTestId("bar-RAAA11")).toHaveTextContent("AA-111-AA");
    expect(screen.getByTestId(`day-${d(2)}`)).toHaveTextContent("3 / 2");
    expect(
      screen.getByTestId(`day-${d(2)}`).querySelector(".text-destructive"),
    ).not.toBeNull();
    expect(screen.getByTestId("alerts")).toHaveTextContent(
      "1 véhicule de trop pour les places",
    );
    expect(screen.getByTestId("alerts")).toHaveTextContent(
      "2 réservations sans place",
    );
    expect(
      screen.getByRole("link", { name: "Planning des places" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pré-affecter" }));
    await waitFor(() =>
      expect(api.preassignSpots).toHaveBeenCalledWith("p1", today, 14),
    );
  });

  it("un clic sur un séjour permet de le déplacer vers une place libre sur tout le séjour", async () => {
    renderPage();
    await screen.findByTestId("row-A-01-01");
    fireEvent.click(
      screen.getByTestId("unplaced-RBBB22").querySelector("button")!,
    );
    const card = screen.getByTestId("stay-card");
    expect(card).toHaveTextContent("BB-222-BB");
    expect(screen.getByTestId("stay-spot")).toHaveTextContent("Pas de place");
    const select = screen.getByRole("combobox", { name: "Placer en" });
    // A-01-01 is taken by AA until day 3, which overlaps: only A-01-02 is offered.
    expect(
      Array.from(select.querySelectorAll("option")).map((o) => o.textContent),
    ).toEqual(["Choisir…", "A-01-02"]);
    fireEvent.change(select, { target: { value: "s2" } });
    await waitFor(() =>
      expect(api.assignSpot).toHaveBeenCalledWith("r2", { spotId: "s2" }),
    );
    // The window moves by a week; the selector changes the span.
    fireEvent.click(screen.getByRole("button", { name: "Semaine suivante" }));
    await waitFor(() =>
      expect(api.getSpotPlanning).toHaveBeenLastCalledWith("p1", d(7), 14),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Fenêtre" }), {
      target: { value: "7" },
    });
    await waitFor(() =>
      expect(api.getSpotPlanning).toHaveBeenLastCalledWith("p1", d(7), 7),
    );
  });
});
