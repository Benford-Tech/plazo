import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import type { DepartureRow, LiveShuttles, PickupRow, Reservation, StaffTrip, StayingRow } from "@/lib/types";
import ShuttleTripsPanel from "./ShuttleTripsPanel";

const auth = vi.hoisted(() => ({ user: { id: "me", name: "Karim Benali", role: "driver", vehicle: null } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/components/dashboard/LiveShuttlesMap", () => ({ default: () => <div data-testid="live-map" /> }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const api = vi.hoisted(() => ({
  getLiveShuttles: vi.fn(),
  getCurrentTrip: vi.fn(),
  getPickups: vi.fn(),
  getDepartures: vi.fn(),
  getStaying: vi.fn(),
  getVehicles: vi.fn(),
  getStops: vi.fn(),
  startTrip: vi.fn(),
  endTrip: vi.fn(),
  sendTripPosition: vi.fn(),
  getReservation: vi.fn(),
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
const departure = (id: string, name: string, passengers: number, over: Partial<DepartureRow> = {}): DepartureRow => ({
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
  leaveAt: "2026-10-06T09:30:00Z",
  ...over,
});
const stayingRow = (id: string, name: string, over: Partial<StayingRow> = {}): StayingRow => ({
  reservationId: id,
  reference: id.toUpperCase(),
  customerName: name,
  passengers: 2,
  plate: "AB-123-CD",
  status: "shuttled_out",
  returnAt: "2026-10-08T16:40:00Z",
  returnFlight: "AF 7642",
  flight: flight({ status: "scheduled", landedAt: null }),
  spot: "A-07",
  stopName: null,
  returnedAt: null,
  ...over,
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
  sharePosition: true,
  ...over,
});

/** Where the page is, and « Embarquer » on a booking's card opened from this very page. */
function Where() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <p data-testid="where">{location.pathname + location.search}</p>
      <button type="button" onClick={() => navigate("/navettes?sens=dropoff&reservation=d2")}>
        embarquer-d2
      </button>
    </>
  );
}

function renderPanel(entry = "/navettes", client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <ShuttleTripsPanel />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** A booking as GET /internal/reservations/:id serves it (a traveller the drop-off list does not hold). */
const booking = (over: Partial<Reservation> = {}): Reservation =>
  ({
    id: "r7",
    reference: "R7",
    channel: "phone",
    status: "upcoming",
    arrivalAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
    returnAt: new Date(Date.now() + 5 * 86400_000).toISOString(),
    passengers: 3,
    customerName: "Sarah Cohen",
    customerPhone: "06 00 00 00 00",
    plate: "KL-204-BA",
    arrivedAt: null,
    spot: null,
    file: null,
    stopId: null,
    stop: null,
    nextStatuses: ["arrived", "cancelled", "no_show"],
    ...over,
  }) as unknown as Reservation;

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
    api.getDepartures.mockReset().mockResolvedValue({
      serverTime: live.serverTime,
      rows: [departure("d1", "Marco Rossi", 4), departure("d2", "Nadia Roux", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", stopName: "Gare TGV", expected: true })],
    });
    api.getStaying.mockReset().mockResolvedValue({
      serverTime: live.serverTime,
      days: [{ date: "2026-10-08", rows: [stayingRow("s1", "Camille Martin")] }],
      returnedToday: [stayingRow("s2", "Yanis Benali", { status: "back_at_parking", returnedAt: "2026-10-06T07:50:00Z", returnAt: "2026-10-06T07:30:00Z" })],
    });
    api.getVehicles.mockReset().mockResolvedValue({ data: [{ id: "v1", model: "Vito", colour: "blanc", plate: "GH-789-IJ", seats: 8, inService: true, driverId: "me", driverName: "Karim Benali" }] });
    api.getStops.mockReset().mockResolvedValue({ data: [airport, station] });
    api.startTrip.mockReset();
    api.endTrip.mockReset();
    api.sendTripPosition.mockReset();
    api.getReservation.mockReset();
    toast.error.mockReset();
    Object.defineProperty(window.navigator, "geolocation", { configurable: true, value: undefined });
  });

  it("liste les retours par terminal avec leur état, puis démarre le trajet avec le véhicule et la desserte", async () => {
    renderPanel();
    expect(await screen.findByText("À récupérer · Terminal 1")).toBeInTheDocument();
    expect(screen.getByText("À récupérer · Terminal 2")).toBeInTheDocument();
    // F-A: the three bands with their counts; the first band carries the advised leave time of each stop.
    expect(screen.getByRole("tab", { name: "À récupérer · 3" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "En route · 0" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rendus · 1" })).toBeInTheDocument();
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
    expect(screen.getByTestId("selected-summary")).toHaveTextContent("2 voyageurs · 5 pass. cochés");
    await userEvent.click(screen.getByRole("button", { name: /Gare TGV/ }));
    expect(screen.getByText("Desserte : Gare TGV")).toBeInTheDocument();
    expect(screen.getByText("Dépose minute, sortie 2")).toBeInTheDocument();
    await userEvent.click(within(screen.getByTestId("vehicle-picker")).getByRole("button", { name: /Vito blanc/ }));

    api.startTrip.mockResolvedValue({ trip: trip({ stop: station, passengers: [] }) });
    await userEvent.click(screen.getByRole("button", { name: "Partir à l'aéroport · 2 clients" }));
    await waitFor(() => expect(api.startTrip).toHaveBeenCalledWith({ reservationIds: ["r1", "r2"], direction: "pickup", stopId: "gare", vehicleId: "v1", vehicle: null }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers l'aéroport · position partagée");
    expect(screen.getByRole("tab", { name: "En route · 0" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Aucune navette en route pour le moment.")).toBeInTheDocument();
    expect(screen.getByText("Ce navigateur ne donne pas la position : le trajet est visible sans sa position.")).toBeInTheDocument();
    // Back on the first band, the trip stays reachable.
    await userEvent.click(screen.getByRole("tab", { name: /À récupérer/ }));
    expect(screen.getByTestId("go-route")).toBeInTheDocument();
    // "Rendus": who came back today.
    await userEvent.click(screen.getByRole("tab", { name: /Rendus/ }));
    expect(screen.getByText("Revenus aujourd'hui")).toBeInTheDocument();
    expect(screen.getByTestId("staying-row")).toHaveTextContent("Yanis Benali");
    expect(screen.getByTestId("staying-row")).toHaveTextContent("De retour au parking");
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

  it("suivi désactivé par le parking (R-B) : le navigateur ne partage pas sa position", async () => {
    const watchPosition = vi.fn(() => 7);
    Object.defineProperty(window.navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
    api.getCurrentTrip.mockResolvedValue({ trip: trip({ sharePosition: false }) });
    renderPanel();
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers l'aéroport · suivi désactivé");
    expect(watchPosition).not.toHaveBeenCalled();
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
    const departureRows = await screen.findAllByTestId("departure-row");
    const row = departureRows[0];
    expect(within(row).getByText("Arrivé 08:25 · Place A12")).toBeInTheDocument();
    // F-A: grouped by stop with the advised leave time; « Embarquer en un geste »: the expected traveller is tickable too.
    expect(screen.getByRole("tab", { name: "À emmener · 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("À conduire au terminal")).toBeInTheDocument();
    expect(screen.getByText("À conduire · Gare TGV")).toBeInTheDocument();
    expect(screen.getAllByText("Départ conseillé 11:30")).toHaveLength(2);
    expect(within(row).getByText("Sur place")).toBeInTheDocument();
    expect(within(departureRows[1]).getByText("Attendu 10:30")).toBeInTheDocument();
    expect(within(departureRows[1]).getAllByRole("button")[0]).toBeEnabled();
    await userEvent.click(within(row).getAllByRole("button")[0]);
    expect(screen.queryByTestId("not-checked-in")).not.toBeInTheDocument();
    api.startTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", passengers: [{ reservationId: "d1", reference: "D1", customerName: "Marco Rossi", passengers: 4, plate: "CD-456-EF", terminal: null, arrivedAt: "2026-10-06T06:25:00Z", checkedInAtBoarding: false }] }) });
    await userEvent.click(screen.getByRole("button", { name: "Embarquer et partir · 1 client" }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers le terminal");
    expect(screen.queryByTestId("checked-in-note")).not.toBeInTheDocument();
    await waitFor(() => expect(api.sendTripPosition).toHaveBeenCalledWith("t1", expect.objectContaining({ lat: 45.71, lng: 5.05, accuracy: 12 })));

    // "En séjour": the travellers dropped at the terminal, by return day.
    await userEvent.click(screen.getByRole("tab", { name: /En séjour/ }));
    expect(screen.getByText("jeu. 8 · 1 retour")).toBeInTheDocument();
    expect(screen.getByTestId("staying-row")).toHaveTextContent("Camille Martin · AF 7642 · 18:40");
    expect(screen.getByTestId("staying-row")).toHaveTextContent("Parti en navette");
    await userEvent.click(screen.getByRole("tab", { name: /En route/ }));

    api.endTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", status: "ended" }) });
    await userEvent.click(screen.getByTestId("end-trip"));
    expect(await screen.findByRole("status")).toHaveTextContent("Trajet terminé");
    expect(api.endTrip).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("tab", { name: /À emmener/ })).toHaveAttribute("aria-selected", "true");
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
    // The team's shuttles live on the "En route" band.
    await userEvent.click(await screen.findByRole("tab", { name: /En route/ }));
    const row = await screen.findByTestId("live-trip");
    expect(row).toHaveTextContent("Karim Benali");
    expect(row).toHaveTextContent("3 clients");
    expect(row).toHaveTextContent("Aéroport dans 6 min");
    await userEvent.click(within(row).getByRole("button", { name: "Terminer ce trajet" }));
    expect(window.confirm).toHaveBeenCalledWith("Terminer le trajet de Karim Benali ? Sa position ne sera plus partagée.");
    await waitFor(() => expect(api.endTrip).toHaveBeenCalledWith("t9"));
  });

  it("« Embarquer et partir » : les clients attendus se cochent, partent avec le véhicule du jour et passent « Sur place »", async () => {
    auth.user = { id: "me", name: "Karim Benali", role: "driver", vehicle: { id: "v1", model: "Vito", colour: "blanc", plate: "GH-789-IJ", seats: 8 } };
    api.getDepartures.mockResolvedValue({
      serverTime: live.serverTime,
      rows: [
        departure("d1", "Chloé Moreau", 2),
        departure("d2", "Vincent Blanc", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T07:45:00Z", expected: true }),
        departure("d3", "Sarah Cohen", 2, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", expected: true }),
      ],
    });
    renderPanel("/navettes?sens=dropoff");
    const rows = await screen.findAllByTestId("departure-row");
    expect(within(rows[1]).getByText("Attendu 09:45")).toBeInTheDocument();
    // The vehicle of the day is already chosen.
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    expect(within(screen.getByTestId("vehicle-picker")).getByRole("button", { name: /Vito blanc/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("not-checked-in")).toHaveTextContent("Vincent Blanc n'est pas encore pointé : il passera « Sur place » à l'embarquement.");
    await userEvent.click(within(rows[2]).getAllByRole("button")[0]);
    expect(screen.getByTestId("not-checked-in")).toHaveTextContent("2 clients ne sont pas encore pointés : ils passeront « Sur place » à l'embarquement.");
    await userEvent.click(within(rows[2]).getAllByRole("button")[0]);

    const passenger = (id: string, name: string, over: Partial<StaffTrip["passengers"][number]> = {}) => ({
      reservationId: id,
      reference: id.toUpperCase(),
      customerName: name,
      passengers: 1,
      plate: "AB-123-CD",
      terminal: null,
      arrivedAt: "2026-10-06T06:25:00Z",
      checkedInAtBoarding: false,
      ...over,
    });
    api.startTrip.mockResolvedValue({
      trip: trip({
        direction: "dropoff",
        passengers: [passenger("d1", "Chloé Moreau"), passenger("d2", "Vincent Blanc", { arrivedAt: "2026-10-06T07:47:00Z", checkedInAtBoarding: true })],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Embarquer et partir · 2 clients" }));
    await waitFor(() => expect(api.startTrip).toHaveBeenCalledWith({ reservationIds: ["d1", "d2"], direction: "dropoff", stopId: null, vehicleId: "v1", vehicle: null }));
    const running = await screen.findByTestId("trip-running");
    const items = within(running).getAllByRole("listitem");
    expect(within(items[0]).getByText("Sur place")).toBeInTheDocument();
    expect(within(items[1]).getByText("Sur place · 09:47")).toBeInTheDocument();
    expect(screen.getByTestId("checked-in-note")).toHaveTextContent("1 voiture pointée à l'embarquement : le voiturier la retrouve dans « À ranger », avec ses clés.");
    expect(running).toHaveTextContent("Parti à 10:00 · Véhicule : Vito · blanc · GH-789-IJ");
  });

  it("prend le véhicule du jour choisi après l'ouverture de la page", async () => {
    renderPanel("/navettes?sens=dropoff");
    const rows = await screen.findAllByTestId("departure-row");
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    const chip = () => within(screen.getByTestId("vehicle-picker")).getByRole("button", { name: /Vito blanc/ });
    expect(chip()).toHaveAttribute("aria-pressed", "false");
    // The vehicle of the day is set (« Mon véhicule aujourd'hui ») while the page is open: the next render takes it.
    auth.user = { ...auth.user, vehicle: { id: "v1", model: "Vito", colour: "blanc", plate: "GH-789-IJ", seats: 8 } };
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    await waitFor(() => expect(chip()).toHaveAttribute("aria-pressed", "true"));
  });

  it("dit combien de voitures ont été pointées à l'embarquement d'un trajet en cours", async () => {
    const p = (id: string) => ({ reservationId: id, reference: id, customerName: id, passengers: 1, plate: "AB-123-CD", terminal: null, arrivedAt: "2026-10-06T07:47:00Z", checkedInAtBoarding: true });
    api.getCurrentTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", passengers: [p("a"), p("b")] }) });
    renderPanel();
    expect(await screen.findByTestId("checked-in-note")).toHaveTextContent(
      "2 voitures pointées à l'embarquement : le voiturier les retrouve dans « À ranger », avec leurs clés.",
    );
  });

  it("« Embarquer » depuis une réservation : un client attendu de la liste est coché, en plus de ceux déjà cochés", async () => {
    renderPanel("/navettes?sens=dropoff&reservation=d2");
    const rows = await screen.findAllByTestId("departure-row");
    await waitFor(() => expect(rows[1]).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("button", { name: "Embarquer et partir · 1 client" })).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(api.getReservation).not.toHaveBeenCalled();
    // Unticked, then « Embarquer » again from the card while another traveller is ticked: both are.
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(screen.getByText("embarquer-d2"));
    expect(await screen.findByRole("button", { name: "Embarquer et partir · 2 clients" })).toBeInTheDocument();
  });

  it("« Embarquer » ouvert côté retours : la page passe aux départs avec ce client coché", async () => {
    renderPanel();
    await screen.findAllByTestId("pickup-row");
    await userEvent.click(screen.getByRole("tab", { name: /Rendus/ }));
    await userEvent.click(screen.getByText("embarquer-d2"));
    expect(await screen.findByRole("button", { name: "Embarquer et partir · 1 client" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Départs · terminal/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "À emmener · 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("departure-row")[1]).toHaveAttribute("aria-selected", "true");
  });

  it("« Embarquer » pour un client hors de la liste : sa réservation est épinglée et cochée, décocher la retire", async () => {
    api.getReservation.mockResolvedValue(booking());
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    expect(api.getReservation).toHaveBeenCalledWith("r7");
    const pinned = screen.getAllByTestId("departure-row").find(r => r.hasAttribute("data-pinned"))!;
    expect(pinned).toHaveTextContent("Sarah Cohen");
    expect(pinned).toHaveAttribute("aria-selected", "true");
    expect(within(pinned).getByText(/^Attendu /)).toBeInTheDocument();
    expect(screen.getByTestId("not-checked-in")).toHaveTextContent("Sarah Cohen n'est pas encore pointé");
    expect(screen.getByTestId("selected-summary")).toHaveTextContent("1 voyageur · 3 pass. coché");
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    // Unticked, the pinned traveller leaves the list.
    await userEvent.click(within(pinned).getAllByRole("button")[0]);
    expect(screen.getAllByTestId("departure-row")).toHaveLength(2);
  });

  it("« Embarquer » pour un client déjà parti : rien n'est coché et l'équipe est prévenue", async () => {
    api.getReservation.mockResolvedValue(booking({ status: "shuttled_out" }));
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ce client ne peut pas embarquer maintenant : il est déjà parti, annulé ou attendu un autre jour."));
    expect(screen.getAllByTestId("departure-row")).toHaveLength(2);
    expect(screen.queryByTestId("selected-summary")).not.toBeInTheDocument();
  });
  it("« Récupérer » depuis une réservation : le client de la liste est coché, un autre absent n'est rien", async () => {
    renderPanel("/navettes?sens=pickup&reservation=r2");
    await waitFor(() => expect(screen.getAllByTestId("pickup-row")[2]).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(screen.getByRole("button", { name: "Partir à l'aéroport · 1 client" })).toBeInTheDocument();
  });

  it("« Récupérer » pour un client que la liste ne tient pas : la demande est consommée sans rien cocher", async () => {
    renderPanel("/navettes?sens=pickup&reservation=zz");
    await screen.findAllByTestId("pickup-row");
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/));
    expect(screen.queryByTestId("selected-summary")).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("« Récupérer » avec une liste en cache d'avant le retour du client : la liste relue le coche", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // The list as the driver saw it a minute ago, before the traveller entered it.
    client.setQueryData(["shuttle-pickups"], { serverTime: live.serverTime, meetingPoint: null, rows: [pickup("r1", "Camille Martin", 2)] }, { updatedAt: Date.now() - 60_000 });
    let fresh: (value: unknown) => void = () => undefined;
    api.getPickups.mockReturnValue(new Promise(resolve => (fresh = resolve)));
    renderPanel("/navettes?sens=pickup&reservation=x9", client);
    await screen.findAllByTestId("pickup-row");
    // Not consumed on the cached list.
    expect(screen.getByTestId("where")).toHaveTextContent("reservation=x9");
    fresh({ serverTime: live.serverTime, meetingPoint: null, rows: [pickup("r1", "Camille Martin", 2), pickup("x9", "Léa Petit", 1)] });
    await waitFor(() => expect(screen.getAllByTestId("pickup-row")).toHaveLength(2));
    const row = screen.getAllByTestId("pickup-row").find(r => r.textContent?.includes("Léa Petit"))!;
    await waitFor(() => expect(row).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
  });

  it("refuse un client déjà sur un autre trajet, ouvert depuis sa réservation", async () => {
    renderPanel("/navettes?sens=pickup&reservation=r3");
    await screen.findAllByTestId("pickup-row");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un des clients est déjà sur un trajet en cours."));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(screen.queryByTestId("selected-summary")).not.toBeInTheDocument();
  });

  it("dit pourquoi la réservation demandée ne se lit pas, et n'insiste pas", async () => {
    api.getReservation.mockRejectedValue(new ApiError(404, "Not found", "not_found"));
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Élément introuvable."));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(screen.getAllByTestId("departure-row")).toHaveLength(2);
    expect(screen.queryByTestId("selected-summary")).not.toBeInTheDocument();
  });

  it("un départ refusé relit la liste : le client épinglé annulé et celui pris par un autre trajet perdent leur coche", async () => {
    api.getReservation.mockResolvedValue(booking());
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    await userEvent.click(within(screen.getAllByTestId("departure-row")[0]).getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: "Embarquer et partir · 2 clients" })).toBeInTheDocument();

    // Meanwhile the desk cancelled Sarah Cohen and another driver took Marco Rossi.
    api.getReservation.mockResolvedValue(booking({ status: "cancelled" }));
    api.getDepartures.mockResolvedValue({
      serverTime: live.serverTime,
      rows: [departure("d1", "Marco Rossi", 4, { tripId: "other" }), departure("d2", "Nadia Roux", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", expected: true })],
    });
    api.startTrip.mockRejectedValue(new ApiError(422, "Invalid passengers", "invalid_passengers"));
    await userEvent.click(screen.getByRole("button", { name: "Embarquer et partir · 2 clients" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un des clients ne peut pas monter dans cette navette (statut changé ?). Actualisez la liste."));
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(2));
    expect(screen.getAllByTestId("departure-row").some(r => r.hasAttribute("data-pinned"))).toBe(false);
    await waitFor(() => expect(screen.queryByTestId("selected-summary")).not.toBeInTheDocument());
  });
});
