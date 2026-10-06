import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { DepartureRow, LiveShuttles, PickupRow, StaffTrip } from "@/lib/types";
import ShuttleTripsPanel from "./ShuttleTripsPanel";

const auth = vi.hoisted(() => ({ user: { id: "me", name: "Karim Benali", role: "driver", vehicle: null } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/components/dashboard/LiveShuttlesMap", () => ({ default: () => <div data-testid="live-map" /> }));

const api = vi.hoisted(() => ({
  getLiveShuttles: vi.fn(),
  getCurrentTrip: vi.fn(),
  getPickups: vi.fn(),
  getDepartures: vi.fn(),
  getVehicles: vi.fn(),
  getStops: vi.fn(),
  startTrip: vi.fn(),
  endTrip: vi.fn(),
  sendTripPosition: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const airport = { id: null, kind: "airport" as const, name: "Aéroport", lat: 45.72, lng: 5.08, instructions: null, builtIn: true };
const station = { id: "gare", kind: "station" as const, name: "Gare TGV", lat: 45.72, lng: 5.07, instructions: "Dépose minute, sortie 2", builtIn: false };
const live: LiveShuttles = { serverTime: "2026-10-06T08:00:00Z", parking: { id: "p1", name: "Parking Démo", lat: 45.7, lng: 5.0 }, stops: [airport, station], trips: [] };
const flight = (over: Partial<PickupRow["flight"]> = {}): PickupRow["flight"] => ({
  number: "TO 3627",
  status: "landed",
  scheduledAt: "2026-10-06T07:50:00Z",
  estimatedAt: "2026-10-06T08:02:00Z",
  landedAt: "2026-10-06T08:02:00Z",
  landedSource: "tracking",
  terminal: "1",
  gate: "12",
  checkedAt: "2026-10-06T08:05:00Z",
  ...over,
});
const pickup = (id: string, name: string, passengers: number, over: Partial<PickupRow> = {}): PickupRow => ({
  reservationId: id,
  reference: id.toUpperCase(),
  customerName: name,
  passengers,
  plate: "AB-123-CD",
  status: "shuttled_out",
  returnAt: "2026-10-06T08:30:00Z",
  flight: flight(),
  terminal: "Terminal 1",
  stopId: null,
  stopName: null,
  atMeetingPointAt: null,
  tripId: null,
  ...over,
});
const departure = (id: string, name: string, passengers: number): DepartureRow => ({
  reservationId: id,
  reference: id.toUpperCase(),
  customerName: name,
  passengers,
  plate: "CD-456-EF",
  status: "arrived",
  arrivalAt: "2026-10-06T06:30:00Z",
  arrivedAt: "2026-10-06T06:25:00Z",
  spot: "A12",
  stopId: null,
  stopName: null,
  tripId: null,
});
const trip = (over: Partial<StaffTrip> = {}): StaffTrip => ({
  id: "t1",
  status: "running",
  direction: "pickup",
  driverId: "me",
  driverName: "Karim Benali",
  vehicle: { model: "Vito", colour: "blanc", plate: "GH-789-IJ" },
  startedAt: "2026-10-06T08:00:00Z",
  expiresAt: "2026-10-06T09:30:00Z",
  endedAt: null,
  endReason: null,
  secondsLeft: 5400,
  passengers: [{ reservationId: "r1", reference: "R1", customerName: "Camille Martin", passengers: 2, plate: "AB-123-CD", terminal: "Terminal 1" }],
  positionUpdatedAt: null,
  meetingPoint: { lat: 45.72, lng: 5.08, source: "airport", label: "Terminal 1 · Porte 12" },
  stop: airport,
  ...over,
});

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ShuttleTripsPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ShuttleTripsPanel (le mode chauffeur sur le web)", () => {
  beforeEach(() => {
    auth.user = { id: "me", name: "Karim Benali", role: "driver", vehicle: null };
    api.getLiveShuttles.mockReset().mockResolvedValue(live);
    api.getCurrentTrip.mockReset().mockResolvedValue({ trip: null });
    api.getPickups.mockReset().mockResolvedValue({
      serverTime: live.serverTime,
      meetingPoint: { lat: 45.72, lng: 5.08, source: "airport", label: "Terminal 1 · Porte 12" },
      rows: [
        pickup("r1", "Camille Martin", 2, { atMeetingPointAt: "2026-10-06T08:10:00Z" }),
        pickup("r2", "Paul Dupont", 3, { flight: flight({ status: "delayed", landedAt: null, estimatedAt: "2026-10-06T08:40:00Z" }), terminal: "Terminal 2" }),
        pickup("r3", "Lan Nguyen", 1, { tripId: "other" }),
      ],
    });
    api.getDepartures.mockReset().mockResolvedValue({ serverTime: live.serverTime, rows: [departure("d1", "Marco Rossi", 4)] });
    api.getVehicles.mockReset().mockResolvedValue({ data: [{ id: "v1", model: "Vito", colour: "blanc", plate: "GH-789-IJ", seats: 8, inService: true, driverId: "me", driverName: "Karim Benali" }] });
    api.getStops.mockReset().mockResolvedValue({ data: [airport, station] });
    api.startTrip.mockReset();
    api.endTrip.mockReset();
    api.sendTripPosition.mockReset();
    Object.defineProperty(window.navigator, "geolocation", { configurable: true, value: undefined });
  });

  it("liste les retours par terminal avec leur état, puis démarre le trajet avec le véhicule et la desserte", async () => {
    renderPanel();
    expect(await screen.findByText("Aucune navette en route pour le moment.")).toBeInTheDocument();
    expect(await screen.findByText("À récupérer · Terminal 1")).toBeInTheDocument();
    expect(screen.getByText("À récupérer · Terminal 2")).toBeInTheDocument();
    expect(screen.getByText("Point de rendez-vous : Terminal 1 · Porte 12")).toBeInTheDocument();
    // Grouped by terminal: Terminal 1 (Camille, Lan), then Terminal 2 (Paul).
    const rows = screen.getAllByTestId("pickup-row");
    expect(within(rows[0]).getByText("Au point de RDV 10:10")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Sur un trajet")).toBeInTheDocument();
    expect(within(rows[1]).getAllByRole("button")[0]).toBeDisabled();
    expect(within(rows[2]).getByText("Retardé · 10:40")).toBeInTheDocument();
    expect(screen.getByText("Sélectionnez des clients")).toBeInTheDocument();

    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[2]).getAllByRole("button")[0]);
    await userEvent.click(screen.getByRole("button", { name: /Gare TGV/ }));
    expect(screen.getByText("Desserte : Gare TGV")).toBeInTheDocument();
    expect(screen.getByText("Dépose minute, sortie 2")).toBeInTheDocument();
    await userEvent.click(within(screen.getByTestId("vehicle-picker")).getByRole("button", { name: /Vito blanc/ }));

    api.startTrip.mockResolvedValue({ trip: trip({ stop: station, passengers: [] }) });
    await userEvent.click(screen.getByRole("button", { name: "Partir à l'aéroport · 2 clients" }));
    await waitFor(() => expect(api.startTrip).toHaveBeenCalledWith({ reservationIds: ["r1", "r2"], direction: "pickup", stopId: "gare", vehicleId: "v1", vehicle: null }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers l'aéroport · position partagée");
    expect(screen.getByText("Ce navigateur ne donne pas la position : le trajet est visible sans sa position.")).toBeInTheDocument();
  });

  it("refuse plus de passagers que de places et explique l'erreur du serveur", async () => {
    api.getVehicles.mockResolvedValue({ data: [{ id: "v2", model: "Clio", colour: null, plate: null, seats: 1, inService: true, driverId: null, driverName: null }] });
    renderPanel();
    const rows = await screen.findAllByTestId("pickup-row");
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[2]).getAllByRole("button")[0]);
    await userEvent.click(await screen.findByRole("button", { name: /Clio/ }));
    expect(screen.getByText("5 passagers pour 1 places : choisissez un autre véhicule ou moins de clients.")).toBeInTheDocument();
  });

  it("bascule sur les départs vers le terminal et partage la position pendant le trajet", async () => {
    const watchPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 45.71, longitude: 5.05, accuracy: 12 }, timestamp: Date.now() } as GeolocationPosition);
      return 7;
    });
    Object.defineProperty(window.navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
    api.sendTripPosition.mockResolvedValue({ trip: trip({ direction: "dropoff" }) });
    renderPanel();
    await screen.findAllByTestId("pickup-row");
    await userEvent.click(screen.getByRole("tab", { name: /Départs · terminal/ }));
    const row = await screen.findByTestId("departure-row");
    expect(within(row).getByText("Arrivé 08:25 · Place A12")).toBeInTheDocument();
    await userEvent.click(within(row).getAllByRole("button")[0]);
    api.startTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", passengers: [{ reservationId: "d1", reference: "D1", customerName: "Marco Rossi", passengers: 4, plate: "CD-456-EF", terminal: null }] }) });
    await userEvent.click(screen.getByRole("button", { name: "Partir au terminal · 1 client" }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers le terminal");
    await waitFor(() => expect(api.sendTripPosition).toHaveBeenCalledWith("t1", expect.objectContaining({ lat: 45.71, lng: 5.05, accuracy: 12 })));

    api.endTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", status: "ended" }) });
    await userEvent.click(screen.getByTestId("end-trip"));
    expect(await screen.findByRole("status")).toHaveTextContent("Trajet terminé");
    expect(api.endTrip).toHaveBeenCalledWith("t1");
  });

  it("montre les navettes de l'équipe et laisse un gérant terminer un trajet oublié", async () => {
    auth.user = { id: "boss", name: "Joanny Simpore", role: "manager", vehicle: null };
    api.getLiveShuttles.mockResolvedValue({
      ...live,
      trips: [
        {
          id: "t9",
          direction: "pickup",
          driverId: "me",
          driverName: "Karim Benali",
          vehicle: { model: "Vito", colour: "blanc", plate: null },
          stop: airport,
          passengers: 3,
          startedAt: "2026-10-06T07:40:00Z",
          expiresAt: "2026-10-06T09:10:00Z",
          position: { lat: 45.71, lng: 5.05 },
          positionAgeSeconds: 20,
          toStop: { distanceM: 2400, etaMinutes: 6 },
          toParking: null,
        },
      ],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.endTrip.mockResolvedValue({ trip: trip({ id: "t9", status: "ended" }) });
    renderPanel();
    const row = await screen.findByTestId("live-trip");
    expect(row).toHaveTextContent("Karim Benali");
    expect(row).toHaveTextContent("3 clients");
    expect(row).toHaveTextContent("Aéroport dans 6 min");
    await userEvent.click(within(row).getByRole("button", { name: "Terminer ce trajet" }));
    expect(window.confirm).toHaveBeenCalledWith("Terminer le trajet de Karim Benali ? Sa position ne sera plus partagée.");
    await waitFor(() => expect(api.endTrip).toHaveBeenCalledWith("t9"));
  });
});
