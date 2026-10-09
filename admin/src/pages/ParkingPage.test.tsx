import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Parking } from "@/lib/types";
import ParkingPage from "./ParkingPage";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { role: "manager" } }),
}));
const api = vi.hoisted(() => ({ getParking: vi.fn(), updateParking: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
// The other cards of the page load their own data: out of this test.
vi.mock("@/components/parking/FlightCheckCard", () => ({
  FlightCheckCard: () => null,
}));
vi.mock("@/components/parking/InboundEmailCard", () => ({
  InboundEmailCard: () => null,
}));
vi.mock("@/components/parking/ReturnMeetingPointForm", () => ({
  ReturnMeetingPointForm: () => null,
}));
vi.mock("@/components/parking/ShuttleStops", () => ({
  ShuttleStops: () => null,
}));
vi.mock("@/components/parking/ShuttleTrackingCard", () => ({
  ShuttleTrackingCard: () => null,
}));
vi.mock("@/components/parking/ShuttleVehicles", () => ({
  ShuttleVehicles: () => null,
}));

const parking = (overrides: Partial<Parking> = {}): Parking => ({
  id: "p1",
  name: "Parking du Rhône",
  address: null,
  timezone: "Europe/Paris",
  totalCapacity: 200,
  safetyMarginPct: 5,
  shuttleTravelMinutes: 8,
  terminalLeadMinutes: 120,
  landingDelayMinutes: 30,
  shuttleTracking: "team",
  declaredCapacity: 200,
  effectiveCapacity: 200,
  capacitySource: "declared",
  bookableCapacity: 190,
  lat: null,
  lng: null,
  ...overrides,
});

function renderPage() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ParkingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("Réglages du parking : capacité (09/10/2026)", () => {
  it("sans plan, le nombre de places se saisit et l'aperçu suit la saisie", async () => {
    api.getParking.mockResolvedValue(parking());
    renderPage();
    const input = await screen.findByLabelText("Nombre de places au total");
    expect(input).toHaveValue(200);
    await userEvent.clear(input);
    await userEvent.type(input, "100");
    expect(
      screen.getByText("Places réservables avec ces réglages : 95"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("capacity-from-plan")).not.toBeInTheDocument();
  });

  it("avec des files, montre le nombre du plan en lecture seule et renvoie le chiffre déclaré inchangé", async () => {
    api.getParking.mockResolvedValue(
      parking({
        effectiveCapacity: 64,
        capacitySource: "files",
        bookableCapacity: 60,
      }),
    );
    api.updateParking.mockImplementation(
      async (_id: string, body: Record<string, unknown>) => ({
        data: parking({
          ...body,
          effectiveCapacity: 64,
          capacitySource: "files",
        }),
      }),
    );
    renderPage();
    const block = await screen.findByTestId("capacity-from-plan");
    expect(
      screen.queryByLabelText("Nombre de places au total"),
    ).not.toBeInTheDocument();
    expect(block).toHaveTextContent("Nombre de places au total");
    expect(block).toHaveTextContent("64 places");
    expect(block).toHaveTextContent(
      "Calculé depuis le plan du parking (files de voiturier) : c'est ce nombre qui compte partout (réservations, site, planning).",
    );
    expect(
      screen.getByRole("link", { name: "Ouvrir le plan" }),
    ).toHaveAttribute("href", "/parking/plan");
    // The margin applies to the plan's figure.
    expect(
      screen.getByText("Places réservables avec ces réglages : 60"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.updateParking).toHaveBeenCalled());
    expect(api.updateParking.mock.calls[0][1]).toMatchObject({
      totalCapacity: 200,
      safetyMarginPct: 5,
    });
  });

  it("avec des places générées, dit qu'elles viennent du plan", async () => {
    api.getParking.mockResolvedValue(
      parking({
        effectiveCapacity: 1,
        capacitySource: "spots",
        safetyMarginPct: 0,
        bookableCapacity: 1,
      }),
    );
    renderPage();
    const block = await screen.findByTestId("capacity-from-plan");
    expect(block).toHaveTextContent("1 place");
    expect(block).toHaveTextContent("(places du plan)");
  });
});
