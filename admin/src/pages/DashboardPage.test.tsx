import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Dashboard, LiveShuttles } from "@/lib/types";
import DashboardPage from "./DashboardPage";

const api = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  getLiveShuttles: vi.fn(),
  getRevenueSummary: vi.fn(),
  setReservationPrice: vi.fn(),
  setKeys: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Joanny Simpore", role: "manager" } }),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getDashboard: () => api.getDashboard(),
      getLiveShuttles: () => api.getLiveShuttles(),
      getRevenueSummary: () => api.getRevenueSummary(),
      setReservationPrice: (id: string, cents: number | null) =>
        api.setReservationPrice(id, cents),
      setKeys: (id: string, left: boolean) => api.setKeys(id, left),
    },
  };
});
vi.mock("@/components/dashboard/LiveShuttlesMap", () => ({
  default: ({ live }: { live: LiveShuttles }) => (
    <div data-testid="live-shuttles-map">{live.trips.length} trajets</div>
  ),
}));

const dashboard: Dashboard = {
  serverTime: "2026-10-05T08:00:00Z",
  date: "2026-10-05",
  parking: {
    id: "p1",
    name: "Parking Lyon",
    timezone: "Europe/Paris",
    bookableCapacity: 40,
    plannedSpots: 3,
  },
  counts: {
    onSite: 3,
    arrivalsToday: 5,
    arrivedToday: 3,
    returnsToday: 2,
    shuttlesRunning: 1,
    freeSpots: 1,
    toTreat: 2,
  },
  services: {
    flights: { configured: true, provider: "aerodatabox", lastCheckedAt: null },
    sms: { mode: "brevo", pending: 2, stale: false, lastSentAt: null },
    push: { configured: false, devices: 0 },
    stripe: { online: true, connected: true, payoutsEnabled: false },
    lastImportAt: null,
  },
  alerts: [
    {
      kind: "no_spot",
      severity: "urgent",
      reservationId: "r3",
      reference: "R3",
      customerName: "Louis Leroy",
      plate: "LM-789-NP",
      detail: null,
      since: null,
      minutes: 10,
    },
    {
      kind: "flight_delayed",
      severity: "watch",
      reservationId: "r1",
      reference: "R1",
      customerName: "Camille Martin",
      plate: "AB-123-CD",
      detail: "TO 3627",
      since: null,
      minutes: 60,
    },
  ],
  nextWave: {
    leaveAt: "2026-10-05T08:40:00Z",
    direction: "dropoff",
    stopName: null,
    passengers: 11,
    vehiclesNeeded: 2,
    flights: ["AF 7641"],
  },
  breakdown: {
    onSiteQuiet: 1,
    toPlaceToday: 2,
    returnsThisWeek: 9,
    toTreat: 2,
    freeSpots: 1,
  },
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
      keysLeftAt: null,
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
      keysLeftAt: null,
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
      stop: {
        id: null,
        kind: "airport",
        name: "Aéroport",
        lat: 45.72,
        lng: 5.08,
        instructions: null,
        builtIn: true,
      },
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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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
    api.getRevenueSummary.mockResolvedValue({
      today: "2026-10-05",
      month: {
        from: "2026-10-01",
        to: "2026-10-31",
        totalCents: 481250,
        count: 109,
        withoutAmount: 3,
      },
      todayCents: 34500,
      weekCents: 198000,
    });
  });

  it("CA-A (09/10/2026) : la tuile du chiffre d'affaires du mois mène à la page, avec le jour, les 7 jours et ceux sans montant", async () => {
    renderPage();
    const tile = await screen.findByTestId("kpi-revenue");
    expect(tile).toHaveAttribute("href", "/chiffre-affaires");
    expect(tile).toHaveTextContent("Chiffre d'affaires · octobre");
    expect(tile).toHaveTextContent(/4\s812,50\s€/);
    expect(tile).toHaveTextContent(
      /Aujourd'hui 345,00\s€ · 7 jours 1\s980,00\s€ · 109 réservations/,
    );
    expect(tile).toHaveTextContent("3 sans montant");
  });

  it("choix A (20/10/2026) : brut − commissions = ce que le parking garde, une pastille par canal, un comparateur sans taux", async () => {
    api.getRevenueSummary.mockResolvedValue({
      today: "2026-10-20",
      month: {
        from: "2026-10-01",
        to: "2026-10-31",
        totalCents: 841250,
        commissionCents: 123640,
        netCents: 717610,
        count: 187,
        withoutAmount: 0,
      },
      todayCents: 41200,
      weekCents: 210480,
      commissions: [
        {
          label: "Allopark",
          comparatorKey: "allopark",
          rateBp: 1800,
          amountCents: 61200,
          count: 41,
          missingRate: false,
        },
        {
          label: "Plazo",
          comparatorKey: null,
          rateBp: null,
          amountCents: 24000,
          count: 9,
          missingRate: false,
        },
        {
          label: "Parclick",
          comparatorKey: "parclick",
          rateBp: null,
          amountCents: 0,
          count: 14,
          missingRate: true,
        },
      ],
    });
    renderPage();
    const tile = await screen.findByTestId("kpi-revenue");
    expect(tile).toHaveTextContent(/Encaissé par les clients8\s412,50\s€/);
    expect(tile).toHaveTextContent(
      /Commissions1\s236,40\s€14,7\s%\sdu chiffre/,
    );
    expect(tile).toHaveTextContent(/Vous gardez7\s176,10\s€/);
    expect(tile).toHaveTextContent(/Allopark 18\s% · −612,00\s€/);
    expect(tile).toHaveTextContent(/Plazo · −240,00\s€/);
    expect(tile).toHaveTextContent("Parclick : taux à régler");
    expect(tile).not.toHaveTextContent("sans montant");
  });

  it("affiche les chiffres du jour, les services, les alertes classées, les véhicules avec badges et les navettes", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Bonjour Joanny" }),
    ).toBeInTheDocument();
    const onSite = screen.getByTestId("kpi-on-site");
    expect(onSite).toHaveTextContent("3");
    expect(onSite).toHaveTextContent("1 libre sur 3");
    expect(onSite).toHaveAttribute("href", "/parking/occupation");
    expect(screen.getByTestId("kpi-arrivals")).toHaveTextContent(
      "3 / 5 sur place",
    );
    expect(screen.getByTestId("kpi-to-treat")).toHaveTextContent("1 urgent");
    expect(screen.getByTestId("kpi-to-treat")).toHaveClass("border-warn");

    const services = screen.getByLabelText("Services");
    expect(services).toHaveTextContent("VolsOKsuivi aerodatabox");
    expect(services).toHaveTextContent("SMSÀ voir2 en attente");
    expect(services).toHaveTextContent("NotificationsOffnon configurées");
    expect(services).toHaveTextContent(
      "PaiementsOKen ligne, encaissés par Plazo",
    );
    expect(services).toHaveTextContent("ImportOffjamais");

    const alerts = screen
      .getByRole("heading", { name: "À traiter maintenant" })
      .closest("section")!;
    expect(alerts).toHaveTextContent("1 urgent");
    // C-A (06/10/2026): a row opens the operational card (a button), no longer a page link.
    const rows = within(alerts).getAllByRole("button");
    expect(rows[0]).toHaveTextContent("Sur place sans place");
    expect(rows[0]).toHaveTextContent("Urgent");
    expect(rows[0]).toHaveTextContent("depuis 10 min");
    expect(rows[1]).toHaveTextContent("Vol retardé");
    expect(rows[1]).toHaveTextContent("Camille Martin · TO 3627");
    expect(rows[1]).toHaveTextContent("À surveiller");

    const vehicles = screen
      .getByRole("heading", { name: "Véhicules sur le parking" })
      .closest("section")!;
    expect(vehicles).toHaveTextContent("2 véhicules");
    const camille = within(vehicles)
      .getByRole("button", { name: /Camille Martin/ })
      .closest("[data-testid=vehicle-row]")!;
    expect(camille).toHaveTextContent("A-01-01 · zone court");
    expect(camille).toHaveTextContent("Clés : crochet 12");
    expect(camille).toHaveTextContent("Vol TO 3627 · 21:40");
    expect(camille).toHaveTextContent("Retour 23:00");
    expect(camille).toHaveTextContent("Retour du jour");
    expect(camille).toHaveTextContent("Retardé +40 min");
    const louis = within(vehicles)
      .getByRole("button", { name: /Louis Leroy/ })
      .closest("[data-testid=vehicle-row]")!;
    expect(louis).toHaveTextContent("Sans place");
    expect(louis).toHaveTextContent("Clés ? · Clés laissées");
    expect(louis).toHaveTextContent("Retour ven. 9");

    expect(await screen.findByTestId("live-shuttles-map")).toHaveTextContent(
      "1 trajets",
    );
    const map = screen.getByLabelText("Navettes en direct");
    expect(map).toHaveTextContent("Navettes en direct · Parking Lyon");
    expect(map).toHaveTextContent("Karim");
    expect(map).toHaveTextContent("Retours · aéroport");
    expect(map).toHaveTextContent("Aéroport dans 4 min");
  });

  it("13/10/2026 : une demande pour rejoindre l'équipe mène à Équipe, avec le nom, le nombre et son âge", async () => {
    // The backend's shape: `since` = the oldest request, `minutes` up to 7 days.
    const join = {
      kind: "join_request" as const,
      severity: "todo" as const,
      reservationId: null,
      reference: null,
      customerName: "Julie Martin",
      plate: null,
      detail: "2",
      since: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      minutes: 4320,
    };
    api.getDashboard.mockResolvedValue({ ...dashboard, alerts: [join] });
    renderPage();
    const row = await screen.findByRole("link", {
      name: /Demande pour rejoindre l'équipe/,
    });
    expect(row).toHaveAttribute("href", "/equipe");
    expect(row).toHaveTextContent("Julie Martin et 1 autre");
    expect(row).toHaveTextContent("il y a 3 j");
    expect(row).not.toHaveTextContent("4320 min");
    expect(row).toHaveTextContent("À faire");
  });

  it("21/10/2026 : un service à faire avant un retour ouvre la fiche de la réservation", async () => {
    api.getDashboard.mockResolvedValue({
      ...dashboard,
      alerts: [
        {
          kind: "extras_due" as const,
          severity: "watch" as const,
          reservationId: "r7",
          reference: null,
          customerName: "Camille Martin",
          plate: "GK-318-PX",
          detail: "Lavage intérieur et shampouineuse, Recharge électrique",
          since: "2026-10-05T16:40:00Z",
          minutes: null,
        },
      ],
    });
    renderPage();
    const title = await screen.findByText("Services à faire avant le retour");
    const row = title.closest("button, a") as HTMLElement;
    expect(row).toHaveTextContent(
      "Camille Martin · Lavage intérieur et shampouineuse, Recharge électrique · retour 18:40",
    );
    expect(row).toHaveTextContent("À surveiller");
  });

  it("26/10/2026 : « Clés laissées » en un clic depuis la liste des véhicules", async () => {
    api.setKeys.mockResolvedValue({
      keysLeftAt: "2026-10-05T07:47:00Z",
      keyHook: null,
    });
    renderPage();
    const vehicles = (
      await screen.findByRole("heading", { name: "Véhicules sur le parking" })
    ).closest("section")!;
    const mark = within(vehicles).getByRole("button", {
      name: "Marquer : le client a laissé ses clés",
    });
    api.getDashboard.mockResolvedValue({
      ...dashboard,
      vehicles: dashboard.vehicles.map((v) =>
        v.id === "r3" ? { ...v, keysLeftAt: "2026-10-05T07:47:00Z" } : v,
      ),
    });
    fireEvent.click(mark);
    await waitFor(() => expect(api.setKeys).toHaveBeenCalledWith("r3", true));
    await waitFor(() =>
      expect(
        within(vehicles)
          .getByRole("button", { name: /Louis Leroy/ })
          .closest("[data-testid=vehicle-row]")!,
      ).toHaveTextContent("Clés laissées · 09:47"),
    );
    expect(
      within(vehicles).queryByRole("button", {
        name: "Marquer : le client a laissé ses clés",
      }),
    ).not.toBeInTheDocument();
  });

  it("21/10/2026 (choix C) : les réservations sans prix, dans « À traiter » et à compléter sur place", async () => {
    api.setReservationPrice.mockResolvedValue({ id: "r9", priceCents: 4850 });
    const alert = {
      kind: "price_missing" as const,
      severity: "todo" as const,
      reservationId: null,
      reference: null,
      customerName: null,
      plate: null,
      detail: "7",
      since: null,
      minutes: null,
    };
    api.getDashboard.mockResolvedValue({
      ...dashboard,
      alerts: [alert],
      noPrice: {
        count: 7,
        next: [
          {
            id: "r9",
            reference: "R9",
            customerName: "Julien Petit",
            plate: "GH-456-JK",
            arrivalAt: "2026-10-05T07:15:00Z",
            channel: "aggregator",
            detail: "Onepark",
          },
        ],
      },
    });
    renderPage();
    const row = await screen.findByRole("link", {
      name: /Réservations sans prix/,
    });
    expect(row).toHaveAttribute("href", "/reservations?sansprix=1");
    expect(row).toHaveTextContent(
      "7 réservations · le chiffre d'affaires est incomplet",
    );
    expect(screen.getByTestId("kpi-to-treat")).toHaveTextContent("7 sans prix");
    const card = screen.getByTestId("no-price-card");
    expect(card).toHaveTextContent("Julien Petit");
    expect(card).toHaveTextContent("Onepark");
    expect(screen.getByRole("link", { name: "Voir les 7" })).toHaveAttribute(
      "href",
      "/reservations?sansprix=1",
    );
    fireEvent.change(within(card).getByLabelText("Prix payé de R9 en euros"), {
      target: { value: "48,50" },
    });
    fireEvent.click(within(card).getByRole("button", { name: "OK" }));
    await waitFor(() =>
      expect(api.setReservationPrice).toHaveBeenCalledWith("r9", 4850),
    );
  });

  it("16/10/2026 : « Import » À voir quand Claude n'a pas pu lire un mail dans l'heure, avec la cause", async () => {
    api.getDashboard.mockResolvedValue({
      ...dashboard,
      services: {
        ...dashboard.services,
        lastImportAt: new Date().toISOString(),
        reading: {
          configured: true,
          outage: { cause: "credit", at: new Date().toISOString() },
        },
      },
    });
    renderPage();
    const services = await screen.findByLabelText("Services");
    expect(services).toHaveTextContent(
      "ImportÀ voirLecture par Claude en panne : crédit Anthropic épuisé",
    );
  });

  it("dit quand il n'y a rien à traiter ni aucun véhicule", async () => {
    api.getDashboard.mockResolvedValue({
      ...dashboard,
      alerts: [],
      vehicles: [],
      counts: { ...dashboard.counts, onSite: 0, toTreat: 0, freeSpots: null },
    });
    api.getLiveShuttles.mockResolvedValue({ ...live, trips: [] });
    renderPage();
    expect(
      await screen.findByText("Rien à traiter : tout est en ordre."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aucun véhicule sur le parking."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Aucune navette en route."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("kpi-to-treat")).toHaveTextContent(
      "rien d'urgent",
    );
  });
});
