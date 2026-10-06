import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Dashboard, LiveShuttles } from "@/lib/types";
import DashboardPage from "./DashboardPage";

const api = vi.hoisted(() => ({ getDashboard: vi.fn(), getLiveShuttles: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { name: "Joanny Simpore", role: "manager" } }) }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getDashboard: () => api.getDashboard(), getLiveShuttles: () => api.getLiveShuttles() } };
});
vi.mock("@/components/dashboard/LiveShuttlesMap", () => ({
  default: ({ live }: { live: LiveShuttles }) => <div data-testid="live-shuttles-map">{live.trips.length} trajets</div>,
}));

const dashboard: Dashboard = {
  serverTime: "2026-10-05T08:00:00Z",
  date: "2026-10-05",
  parking: { id: "p1", name: "Parking Lyon", timezone: "Europe/Paris", bookableCapacity: 40, plannedSpots: 3 },
  counts: { onSite: 3, arrivalsToday: 5, arrivedToday: 3, returnsToday: 2, shuttlesRunning: 1, freeSpots: 1, toTreat: 2 },
  services: {
    flights: { configured: true, provider: "aerodatabox", lastCheckedAt: null },
    sms: { mode: "brevo", pending: 2, stale: false, lastSentAt: null },
    push: { configured: false, devices: 0 },
    stripe: { connected: true, payoutsEnabled: false },
    lastImportAt: null,
  },
  alerts: [
    { kind: "no_spot", severity: "urgent", reservationId: "r3", reference: "R3", customerName: "Louis Leroy", plate: "LM-789-NP", detail: null, since: null, minutes: 10 },
    { kind: "flight_delayed", severity: "watch", reservationId: "r1", reference: "R1", customerName: "Camille Martin", plate: "AB-123-CD", detail: "TO 3627", since: null, minutes: 60 },
  ],
  nextWave: { leaveAt: "2026-10-05T08:40:00Z", direction: "dropoff", stopName: null, passengers: 11, vehiclesNeeded: 2, flights: ["AF 7641"] },
  breakdown: { onSiteQuiet: 1, toPlaceToday: 2, returnsThisWeek: 9, toTreat: 2, freeSpots: 1 },
  vehicles: [
    {
      id: "r1",
      reference: "R1",
      customerName: "Camille Martin",
      passengers: 2,
      plate: "AB-123-CD",
      status: "arrived",
      arrivalAt: "2026-10-05T04:30:00Z",
      returnAt: "2026-10-05T21:00:00Z",
      spotCode: "A-01-01",
      stayClass: "short",
      keyHook: "12",
      returnFlight: "TO 3627",
      flightStatus: "delayed",
      flightScheduledAt: "2026-10-05T19:00:00Z",
      flightEstimatedAt: "2026-10-05T19:40:00Z",
      flightLandedAt: null,
      tripDirection: null,
      stopName: null,
      returnsToday: true,
    },
    {
      id: "r3",
      reference: "R3",
      customerName: "Louis Leroy",
      passengers: 1,
      plate: "LM-789-NP",
      status: "arrived",
      arrivalAt: "2026-10-05T03:00:00Z",
      returnAt: "2026-10-09T21:00:00Z",
      spotCode: null,
      stayClass: null,
      keyHook: null,
      returnFlight: null,
      flightStatus: null,
      flightScheduledAt: null,
      flightEstimatedAt: null,
      flightLandedAt: null,
      tripDirection: null,
      stopName: null,
      returnsToday: false,
    },
  ],
};
const live: LiveShuttles = {
  serverTime: "2026-10-05T08:00:00Z",
  parking: { id: "p1", name: "Parking Lyon", lat: 45.72, lng: 5.08 },
  stops: [],
  trips: [
    {
      id: "t1",
      direction: "pickup",
      driverId: "d1",
      driverName: "Karim",
      vehicle: { model: "Vito", colour: null, plate: null },
      stop: { id: null, kind: "airport", name: "Aéroport", lat: 45.72, lng: 5.08, instructions: null, builtIn: true },
      passengers: 3,
      startedAt: "2026-10-05T07:50:00Z",
      expiresAt: "2026-10-05T09:50:00Z",
      position: { lat: 45.71, lng: 5.07 },
      positionAgeSeconds: 5,
      toStop: { distanceM: 1200, etaMinutes: 4 },
      toParking: null,
    },
  ],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    api.getDashboard.mockResolvedValue(dashboard);
    api.getLiveShuttles.mockResolvedValue(live);
  });

  it("affiche les chiffres du jour, les services, les alertes classées, les véhicules avec badges et les navettes", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Bonjour Joanny" })).toBeInTheDocument();
    const onSite = screen.getByTestId("kpi-on-site");
    expect(onSite).toHaveTextContent("3");
    expect(onSite).toHaveTextContent("1 libre sur 3");
    expect(onSite).toHaveAttribute("href", "/parking/occupation");
    expect(screen.getByTestId("kpi-arrivals")).toHaveTextContent("3 / 5 sur place");
    expect(screen.getByTestId("kpi-to-treat")).toHaveTextContent("1 urgent");
    expect(screen.getByTestId("kpi-to-treat")).toHaveClass("border-warn");

    const services = screen.getByLabelText("Services");
    expect(services).toHaveTextContent("VolsOKsuivi aerodatabox");
    expect(services).toHaveTextContent("SMSÀ voir2 en attente");
    expect(services).toHaveTextContent("NotificationsOffnon configurées");
    expect(services).toHaveTextContent("PaiementsÀ voircompte à finaliser");
    expect(services).toHaveTextContent("ImportOffjamais");

    const alerts = screen.getByRole("heading", { name: "À traiter maintenant" }).closest("section")!;
    expect(alerts).toHaveTextContent("1 urgent");
    // C-A (06/10/2026): a row opens the operational card (a button), no longer a page link.
    const rows = within(alerts).getAllByRole("button");
    expect(rows[0]).toHaveTextContent("Sur place sans place");
    expect(rows[0]).toHaveTextContent("Urgent");
    expect(rows[0]).toHaveTextContent("depuis 10 min");
    expect(rows[1]).toHaveTextContent("Vol retardé");
    expect(rows[1]).toHaveTextContent("Camille Martin · TO 3627");
    expect(rows[1]).toHaveTextContent("À surveiller");

    const vehicles = screen.getByRole("heading", { name: "Véhicules sur le parking" }).closest("section")!;
    expect(vehicles).toHaveTextContent("2 véhicules");
    const camille = within(vehicles).getByRole("button", { name: /Camille Martin/ });
    expect(camille).toHaveTextContent("A-01-01 · zone court");
    expect(camille).toHaveTextContent("Clés : crochet 12");
    expect(camille).toHaveTextContent("Vol TO 3627 · 21:40");
    expect(camille).toHaveTextContent("Retour 23:00");
    expect(camille).toHaveTextContent("Retour du jour");
    expect(camille).toHaveTextContent("Retardé +40 min");
    const louis = within(vehicles).getByRole("button", { name: /Louis Leroy/ });
    expect(louis).toHaveTextContent("Sans place");
    expect(louis).toHaveTextContent("Clés ?");
    expect(louis).toHaveTextContent("Retour ven. 9");

    expect(await screen.findByTestId("live-shuttles-map")).toHaveTextContent("1 trajets");
    const map = screen.getByLabelText("Navettes en direct");
    expect(map).toHaveTextContent("Navettes en direct · Parking Lyon");
    expect(map).toHaveTextContent("Karim");
    expect(map).toHaveTextContent("Retours · aéroport");
    expect(map).toHaveTextContent("Aéroport dans 4 min");
  });

  it("dit quand il n'y a rien à traiter ni aucun véhicule", async () => {
    api.getDashboard.mockResolvedValue({ ...dashboard, alerts: [], vehicles: [], counts: { ...dashboard.counts, onSite: 0, toTreat: 0, freeSpots: null } });
    api.getLiveShuttles.mockResolvedValue({ ...live, trips: [] });
    renderPage();
    expect(await screen.findByText("Rien à traiter : tout est en ordre.")).toBeInTheDocument();
    expect(screen.getByText("Aucun véhicule sur le parking.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune navette en route.")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-to-treat")).toHaveTextContent("rien d'urgent");
  });
});
