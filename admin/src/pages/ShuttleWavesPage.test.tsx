import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ShuttleForecast } from "@/lib/types";
import ShuttleWavesPage from "./ShuttleWavesPage";

const api = vi.hoisted(() => ({ getShuttleForecast: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getShuttleForecast: (date?: string) => api.getShuttleForecast(date) } };
});
// The trips panel at the top of the page has its own tests.
vi.mock("@/components/shuttle/ShuttleTripsPanel", () => ({ default: () => <div data-testid="trips-panel" /> }));

const flight = (number: string, status: string | null, scheduledAt: string, estimatedAt: string | null = null) => ({
  number,
  status,
  scheduledAt,
  estimatedAt,
  actualAt: null,
  terminal: "1",
});
const member = (id: string, name: string, passengers: number, over: Record<string, unknown> = {}) => ({
  reservationId: id,
  reference: id.toUpperCase(),
  customerName: name,
  passengers,
  plate: "AB-123-CD",
  status: "arrived" as const,
  direction: "dropoff" as const,
  stopId: null,
  stopName: null,
  leaveAt: "2026-10-06T03:40:00Z",
  meetAt: null,
  flight: null,
  noFlight: false,
  state: "planned" as const,
  tripId: null,
  ...over,
});

const forecast: ShuttleForecast = {
  serverTime: "2026-10-06T03:00:00Z",
  date: "2026-10-06",
  times: { shuttleTravelMinutes: 10, terminalLeadMinutes: 120, landingDelayMinutes: 30 },
  seats: 8,
  vehiclesInService: 1,
  waves: [
    {
      id: "w1",
      direction: "dropoff",
      stopId: null,
      stopName: null,
      leaveAt: "2026-10-06T03:40:00Z",
      meetAt: null,
      passengers: 11,
      seats: 8,
      vehiclesNeeded: 2,
      noFlight: 1,
      flights: ["AF 7641"],
      state: "planned",
      members: [
        member("r1", "Camille Martin", 4, { flight: flight("AF 7641", "delayed", "2026-10-06T05:45:00Z", "2026-10-06T06:10:00Z") }),
        member("r2", "Paul Dupont", 4, { flight: flight("AF 7641", "scheduled", "2026-10-06T05:45:00Z") }),
        member("r3", "Lan Nguyen", 3, { noFlight: true }),
      ],
    },
    {
      id: "w2",
      direction: "pickup",
      stopId: "gare",
      stopName: "Gare TGV",
      leaveAt: "2026-10-06T08:20:00Z",
      meetAt: "2026-10-06T08:30:00Z",
      passengers: 2,
      seats: 8,
      vehiclesNeeded: 1,
      noFlight: 0,
      flights: ["TO 3628"],
      state: "done",
      members: [
        member("r4", "Marco Rossi", 2, {
          direction: "pickup",
          status: "returned",
          state: "done",
          stopId: "gare",
          stopName: "Gare TGV",
          leaveAt: "2026-10-06T08:20:00Z",
          meetAt: "2026-10-06T08:30:00Z",
          flight: flight("TO 3628", "landed", "2026-10-06T07:50:00Z"),
        }),
      ],
    },
  ],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ShuttleWavesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ShuttleWavesPage (V-A ligne du jour)", () => {
  beforeEach(() => api.getShuttleForecast.mockReset().mockResolvedValue(forecast));

  it("liste les vagues avec heure, sens, passagers, navettes nécessaires et vols", async () => {
    renderPage();
    const waves = await screen.findAllByTestId("wave");
    expect(waves).toHaveLength(2);
    const first = within(waves[0]);
    expect(first.getByText("05:40")).toBeInTheDocument();
    expect(first.getByText(/Vers le terminal · Aéroport/)).toBeInTheDocument();
    expect(first.getByText("11 / 8")).toBeInTheDocument();
    expect(first.getByText("2 navettes")).toBeInTheDocument();
    expect(first.getByText("1 sans vol")).toBeInTheDocument();
    expect(first.getByText("retardé +25")).toBeInTheDocument();
    expect(first.getByText(/AF 7641 · décollage 08:10/)).toBeInTheDocument();
    expect(first.getByText(/heure saisie 05:40/)).toBeInTheDocument();
    const second = within(waves[1]);
    expect(second.getByText(/Depuis l'aéroport · Gare TGV/)).toBeInTheDocument();
    expect(second.getByText("rendez-vous 10:30")).toBeInTheDocument();
    expect(second.getByText("Faite")).toBeInTheDocument();
    expect(waves[1]).toHaveAttribute("data-state", "done");
    expect(screen.getByText(/1 véhicule en service · 8 places/)).toBeInTheDocument();
    expect(screen.getByText(/Au terminal 120 min avant le décollage/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Camille Martin/ })).toHaveAttribute("href", "/reservations/r1");
  });

  it("demande un autre jour avec les puces", async () => {
    renderPage();
    await screen.findAllByTestId("wave");
    expect(api.getShuttleForecast).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    api.getShuttleForecast.mockResolvedValue({ ...forecast, waves: [] });
    await userEvent.click(screen.getByRole("tab", { name: /Demain/ }));
    expect(await screen.findByText("Aucune navette à prévoir ce jour-là.")).toBeInTheDocument();
    const dates = api.getShuttleForecast.mock.calls.map(c => c[0] as string);
    expect(dates[dates.length - 1] > dates[0]).toBe(true);
  });
});
