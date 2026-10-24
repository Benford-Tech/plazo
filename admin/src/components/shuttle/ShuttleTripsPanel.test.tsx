import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import type { DepartureRow, LiveShuttles, PickupRow, Reservation, StaffTrip } from "@/lib/types";
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
      <button type="button" onClick={() => navigate("/navettes?sens=dropoff&reservation=r8")}>
        embarquer-r8
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
      rows: [departure("d1", "Marco Rossi", 4), departure("d2", "Nadia Roux", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", stopId: "gare", stopName: "Gare TGV", expected: true })],
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

  it("« Retour » (B, 22/10/2026) : les clients à aller chercher avec leur état, la desserte de chacun, puis le trajet part vers elle", async () => {
    api.getPickups.mockResolvedValue({
      serverTime: live.serverTime,
      meetingPoint: { lat: 45.72, lng: 5.08, source: "airport", label: "Terminal 1 · Porte 12" },
      rows: [
        pickup("r1", "Camille Martin", 2, { atMeetingPointAt: "2026-10-06T08:10:00Z" }),
        pickup("r2", "Paul Dupont", 3, { flight: flight({ status: "delayed", landedAt: null, estimatedAt: "2026-10-06T08:40:00Z" }), stopId: "gare", stopName: "Gare TGV" }),
        pickup("r3", "Lan Nguyen", 1, { tripId: "other" }),
      ],
    });
    renderPanel();
    // « Aller · Retour · En route », with the counts of both lists; the pick-ups open first.
    expect(await screen.findByRole("tab", { name: "Retour · 3" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Aller · 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "En route · 0" })).toBeInTheDocument();
    expect(screen.queryByTestId("stop-choice")).not.toBeInTheDocument();
    expect(screen.getByText("Point de rendez-vous : Terminal 1 · Porte 12")).toBeInTheDocument();
    const rows = screen.getAllByTestId("pickup-row");
    expect(within(rows[0]).getByText("Au point de RDV 10:10")).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent("à l'aéroport");
    expect(within(rows[1]).getByText("Retardé · 10:40")).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent("à Gare TGV");
    expect(within(rows[2]).getByText("Sur un trajet")).toBeInTheDocument();
    expect(within(rows[2]).getAllByRole("button")[0]).toBeDisabled();
    expect(screen.getByText("Cochez les personnes à récupérer")).toBeInTheDocument();

    // Two destinations ticked: the button says so; one left: the trip goes there.
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: "Aller chercher 5 pers. · 2 destinations" })).toBeInTheDocument();
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(screen.getByTestId("vehicle-picker")).getByRole("button", { name: /Vito blanc/ }));

    api.startTrip.mockResolvedValue({ trip: trip({ stop: station, passengers: [] }) });
    await userEvent.click(screen.getByRole("button", { name: "Aller chercher à Gare TGV · 3 pers." }));
    await waitFor(() => expect(api.startTrip).toHaveBeenCalledWith({ reservationIds: ["r2"], direction: "pickup", stopId: "gare", vehicleId: "v1", vehicle: null }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers Gare TGV · position partagée");
    expect(screen.getByRole("tab", { name: "En route · 0" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Aucune navette en route pour le moment.")).toBeInTheDocument();
    expect(screen.getByText("Ce navigateur ne donne pas la position : le trajet est visible sans sa position.")).toBeInTheDocument();
    // Back on « Retour », the trip stays reachable; « Aller » waits for its end.
    await userEvent.click(screen.getByRole("tab", { name: /Retour/ }));
    expect(screen.getByTestId("go-route")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Aller/ })).toBeDisabled();
  });

  it("« Tout cocher » prend tout le créneau, « Tout décocher » le rend", async () => {
    renderPanel("/navettes?sens=dropoff");
    await screen.findAllByTestId("departure-row");
    expect(screen.getAllByTestId("slot")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Tout cocher" }));
    expect(screen.getByRole("button", { name: "Partir · 5 pers. · 2 destinations" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tout décocher" }));
    expect(screen.getByText("Cochez les personnes qui montent")).toBeInTheDocument();
  });

  it("« Sièges auto » (24/10/2026) : « dont N enfants », une pastille par siège, et ce qu'il faut charger avant de partir", async () => {
    api.getPickups.mockResolvedValue({
      serverTime: live.serverTime,
      meetingPoint: null,
      rows: [
        pickup("r1", "Camille Martin", 4, { childSeats: { infant: 1, toddler: 0, booster: 2 } }),
        pickup("r2", "Paul Dupont", 3, { childSeats: { infant: 0, toddler: 1, booster: 0 } }),
        pickup("r3", "Lan Nguyen", 1, { childSeats: { infant: 0, toddler: 0, booster: 0 } }),
      ],
    });
    renderPanel();
    const rows = await screen.findAllByTestId("pickup-row");
    expect(rows[0]).toHaveTextContent("4 pass. · dont 3 enfants");
    expect(within(rows[0]).getByTestId("child-seat-pills")).toHaveTextContent("Siège bébé2 réhausseurs");
    expect(rows[1]).toHaveTextContent("dont 1 enfant");
    expect(within(rows[1]).getByTestId("child-seat-pills")).toHaveTextContent("Siège 1 à 4 ans");
    expect(within(rows[2]).queryByTestId("child-seat-pills")).not.toBeInTheDocument();
    expect(screen.queryByTestId("child-seats-to-load")).not.toBeInTheDocument();

    await userEvent.click(within(rows[2]).getAllByRole("button")[0]);
    expect(screen.queryByTestId("child-seats-to-load")).not.toBeInTheDocument();
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    expect(screen.getByTestId("child-seats-to-load")).toHaveTextContent(
      "À charger avant de partir1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 2 réhausseurs",
    );
  });

  it("« En route » : les sièges de chaque passager du trajet", async () => {
    api.getCurrentTrip.mockResolvedValue({
      trip: trip({ passengers: [{ reservationId: "r1", reference: "R1", customerName: "Camille Martin", passengers: 2, plate: "AB-123-CD", terminal: null, childSeats: { infant: 0, toddler: 0, booster: 1 } }] }),
    });
    renderPanel();
    const running = await screen.findByTestId("trip-running");
    expect(running).toHaveTextContent("2 pass. · dont 1 enfant");
    expect(within(running).getByTestId("child-seat-pills")).toHaveTextContent("Réhausseur");
  });

  it("refuse plus de passagers que de places et explique l'erreur du serveur", async () => {
    api.getVehicles.mockResolvedValue({ data: [{ id: "v2", model: "Clio", colour: null, plate: null, seats: 1, inService: true, driverId: null, driverName: null }] });
    renderPanel();
    const rows = await screen.findAllByTestId("pickup-row");
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
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
    await userEvent.click(screen.getByRole("tab", { name: /Aller/ }));
    const departureRows = await screen.findAllByTestId("departure-row");
    const row = departureRows[0];
    expect(within(row).getByText("Arrivé 08:25 · vers l'aéroport · Place A12")).toBeInTheDocument();
    // B: one slot per advised leave time, the destination on each line; « Embarquer en un geste »: the expected traveller
    // is tickable too.
    expect(screen.getByRole("tab", { name: "Aller · 2" })).toHaveAttribute("aria-selected", "true");
    expect(departureRows[1]).toHaveTextContent("vers Gare TGV");
    expect(screen.getByText("11:30")).toBeInTheDocument();
    expect(screen.getByText("départ conseillé")).toBeInTheDocument();
    expect(within(row).getByText("Sur place")).toBeInTheDocument();
    expect(within(departureRows[1]).getByText("Attendu 10:30")).toBeInTheDocument();
    expect(within(departureRows[1]).getAllByRole("button")[0]).toBeEnabled();
    await userEvent.click(within(row).getAllByRole("button")[0]);
    expect(screen.queryByTestId("not-checked-in")).not.toBeInTheDocument();
    api.startTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", passengers: [{ reservationId: "d1", reference: "D1", customerName: "Marco Rossi", passengers: 4, plate: "CD-456-EF", terminal: null, arrivedAt: "2026-10-06T06:25:00Z", checkedInAtBoarding: false }] }) });
    await userEvent.click(screen.getByRole("button", { name: "Partir vers l'aéroport · 4 pers." }));
    expect(await screen.findByTestId("trip-running")).toHaveTextContent("En route vers l'aéroport");
    expect(screen.getByTestId("trip-running")).toHaveTextContent("4 pers. à bord");
    expect(screen.queryByTestId("checked-in-note")).not.toBeInTheDocument();
    await waitFor(() => expect(api.sendTripPosition).toHaveBeenCalledWith("t1", expect.objectContaining({ lat: 45.71, lng: 5.05, accuracy: 12 })));

    api.endTrip.mockResolvedValue({ trip: trip({ direction: "dropoff", status: "ended" }) });
    await userEvent.click(screen.getByTestId("end-trip"));
    expect(await screen.findByRole("status")).toHaveTextContent("Trajet terminé");
    expect(api.endTrip).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("tab", { name: /Aller/ })).toHaveAttribute("aria-selected", "true");
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
    expect(row).toHaveTextContent("3 pers.");
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
    await userEvent.click(screen.getByRole("button", { name: "Partir vers l'aéroport · 3 pers." }));
    await waitFor(() => expect(api.startTrip).toHaveBeenCalledWith({ reservationIds: ["d1", "d2"], direction: "dropoff", stopId: null, vehicleId: "v1", vehicle: null }));
    const running = await screen.findByTestId("trip-running");
    const items = within(running).getAllByRole("listitem");
    expect(within(items[0]).getByText("Sur place")).toBeInTheDocument();
    expect(within(items[1]).getByText("Sur place · 09:47")).toBeInTheDocument();
    expect(screen.getByTestId("checked-in-note")).toHaveTextContent("1 voiture pointée à l'embarquement : le voiturier la retrouve dans « Arrivées à placer », avec ses clés.");
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
      "2 voitures pointées à l'embarquement : le voiturier les retrouve dans « Arrivées à placer », avec leurs clés.",
    );
  });

  it("« Embarquer » depuis une réservation : un client attendu de la liste est coché, en plus de ceux déjà cochés", async () => {
    renderPanel("/navettes?sens=dropoff&reservation=d2");
    const rows = await screen.findAllByTestId("departure-row");
    await waitFor(() => expect(rows[1]).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("button", { name: "Partir vers Gare TGV · 1 pers." })).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(api.getReservation).not.toHaveBeenCalled();
    // Unticked, then « Embarquer » again from the card while another traveller is ticked: both are.
    await userEvent.click(within(rows[1]).getAllByRole("button")[0]);
    await userEvent.click(within(rows[0]).getAllByRole("button")[0]);
    await userEvent.click(screen.getByText("embarquer-d2"));
    expect(await screen.findByRole("button", { name: "Partir · 5 pers. · 2 destinations" })).toBeInTheDocument();
  });

  it("« Embarquer » ouvert côté retours : la page passe aux départs avec ce client coché", async () => {
    renderPanel();
    await screen.findAllByTestId("pickup-row");
    await userEvent.click(screen.getByRole("tab", { name: /En route/ }));
    await userEvent.click(screen.getByText("embarquer-d2"));
    expect(await screen.findByRole("button", { name: "Partir vers Gare TGV · 1 pers." })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Aller · 2" })).toHaveAttribute("aria-selected", "true");
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
    expect(screen.getByRole("button", { name: "Partir vers l'aéroport · 3 pers." })).toBeInTheDocument();
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
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
  });
  it("« Récupérer » depuis une réservation : le client de la liste est coché, un autre absent n'est rien", async () => {
    renderPanel("/navettes?sens=pickup&reservation=r2");
    await waitFor(() => expect(screen.getAllByTestId("pickup-row")[1]).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(screen.getByRole("button", { name: "Aller chercher à l'aéroport · 3 pers." })).toBeInTheDocument();
  });

  it("« Récupérer » pour un client que la liste ne tient pas : la demande est consommée sans rien cocher", async () => {
    renderPanel("/navettes?sens=pickup&reservation=zz");
    await screen.findAllByTestId("pickup-row");
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/));
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
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
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
  });

  it("dit pourquoi la réservation demandée ne se lit pas, et n'insiste pas", async () => {
    api.getReservation.mockRejectedValue(new ApiError(404, "Not found", "not_found"));
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Élément introuvable."));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(screen.getAllByTestId("departure-row")).toHaveLength(2);
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
  });

  it("un départ refusé relit la liste : le client épinglé annulé et celui pris par un autre trajet perdent leur coche", async () => {
    api.getReservation.mockResolvedValue(booking());
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    await userEvent.click(within(screen.getAllByTestId("departure-row")[0]).getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: "Partir vers l'aéroport · 7 pers." })).toBeInTheDocument();

    // Meanwhile the desk cancelled Sarah Cohen and another driver took Marco Rossi.
    api.getReservation.mockResolvedValue(booking({ status: "cancelled" }));
    api.getDepartures.mockResolvedValue({
      serverTime: live.serverTime,
      rows: [departure("d1", "Marco Rossi", 4, { tripId: "other" }), departure("d2", "Nadia Roux", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", expected: true })],
    });
    api.startTrip.mockRejectedValue(new ApiError(422, "Invalid passengers", "invalid_passengers"));
    await userEvent.click(screen.getByRole("button", { name: "Partir vers l'aéroport · 7 pers." }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un des clients ne peut pas monter dans cette navette (statut changé ?). Actualisez la liste."));
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(2));
    expect(screen.getAllByTestId("departure-row").some(r => r.hasAttribute("data-pinned"))).toBe(false);
    await waitFor(() => expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument());
    // The traveller added by hand is named (Marco Rossi, on the list, shows « Sur un trajet »).
    expect(toast.error).toHaveBeenCalledWith("Sarah Cohen, ajouté à la main, a été retiré de la sélection : vérifiez sa réservation.");
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it("un départ refusé nomme ensemble les clients ajoutés à la main que la relecture retire", async () => {
    const bookings: Record<string, Reservation> = {
      r7: booking(),
      r8: booking({ id: "r8", reference: "R8", customerName: "Paul Durand", passengers: 1, plate: "MN-305-CB" }),
    };
    api.getReservation.mockImplementation(async (id: string) => bookings[id]);
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    await userEvent.click(screen.getByText("embarquer-r8"));
    expect(await screen.findByRole("button", { name: "Partir vers l'aéroport · 4 pers." })).toBeInTheDocument();
    expect(screen.getAllByTestId("departure-row").filter(r => r.hasAttribute("data-pinned"))).toHaveLength(2);

    // Both were cancelled meanwhile.
    bookings.r7 = booking({ status: "cancelled" });
    bookings.r8 = { ...bookings.r8, status: "cancelled" } as Reservation;
    api.startTrip.mockRejectedValue(new ApiError(422, "Invalid passengers", "invalid_passengers"));
    await userEvent.click(screen.getByRole("button", { name: "Partir vers l'aéroport · 4 pers." }));
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(2));
    await waitFor(() => expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument());
    // Both bookings, read again together, are named in one message.
    expect(toast.error.mock.calls.map(([text]) => text as string).filter(text => text.includes("à la main"))).toEqual([
      "Sarah Cohen et Paul Durand, ajoutés à la main, ont été retirés de la sélection : vérifiez leurs réservations.",
    ]);
  });

  it("un départ refusé pour un autre client garde celui ajouté à la main, sans message", async () => {
    api.getReservation.mockResolvedValue(booking());
    renderPanel("/navettes?sens=dropoff&reservation=r7");
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    await userEvent.click(within(screen.getAllByTestId("departure-row")[0]).getAllByRole("button")[0]);
    // Another driver took Marco Rossi; Sarah Cohen may still board.
    api.getDepartures.mockResolvedValue({
      serverTime: live.serverTime,
      rows: [departure("d1", "Marco Rossi", 4, { tripId: "other" }), departure("d2", "Nadia Roux", 1, { status: "upcoming", arrivedAt: null, spot: null, arrivalAt: "2026-10-06T08:30:00Z", expected: true })],
    });
    api.startTrip.mockRejectedValue(new ApiError(409, "Already on trip", "already_on_trip"));
    const reads = api.getReservation.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Partir vers l'aéroport · 7 pers." }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Partir vers l'aéroport · 3 pers." })).toBeInTheDocument());
    await waitFor(() => expect(api.getReservation.mock.calls.length).toBeGreaterThan(reads));
    const pinned = screen.getAllByTestId("departure-row").find(r => r.hasAttribute("data-pinned"))!;
    expect(pinned).toHaveAttribute("aria-selected", "true");
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Un des clients est déjà sur un trajet en cours.");
  });

  it("un client ajouté à la main que la liste relue retire hors d'un départ refusé part sans message", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    api.getReservation.mockResolvedValue(booking());
    renderPanel("/navettes?sens=dropoff&reservation=r7", client);
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(3));
    // The desk cancels the booking; the panel reads it again on its own.
    api.getReservation.mockResolvedValue(booking({ status: "cancelled" }));
    await client.invalidateQueries({ queryKey: ["reservation", "r7"] });
    await waitFor(() => expect(screen.getAllByTestId("departure-row")).toHaveLength(2));
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("« Embarquer » pendant mon trajet en cours : l'équipe est prévenue, la demande est consommée et la page reste sur « En route »", async () => {
    api.getCurrentTrip.mockResolvedValue({ trip: trip() });
    renderPanel("/navettes?sens=dropoff&reservation=d2");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un trajet est déjà en cours : terminez-le avant d'en démarrer un autre."));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/));
    expect(screen.getByRole("tab", { name: "En route · 1" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("trip-running")).toBeInTheDocument();
    expect(api.getReservation).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("« Embarquer » attend de savoir si mon trajet roule avant de cocher qui que ce soit", async () => {
    let current: (value: unknown) => void = () => undefined;
    api.getCurrentTrip.mockReturnValue(new Promise(resolve => (current = resolve)));
    renderPanel("/navettes?sens=dropoff&reservation=d2");
    await screen.findAllByTestId("departure-row");
    // The list is read, my trip not yet: the request waits.
    expect(screen.getByTestId("where")).toHaveTextContent("reservation=d2");
    expect(screen.queryByTestId("start-trip-button")).not.toBeInTheDocument();
    current({ trip: trip({ direction: "dropoff", passengers: [] }) });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un trajet est déjà en cours : terminez-le avant d'en démarrer un autre."));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/));
    expect(screen.getByRole("tab", { name: "En route · 0" })).toHaveAttribute("aria-selected", "true");
  });

  it("« Embarquer » avec un trajet en cache terminé depuis : mon trajet relu, le client est coché", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // The trip as this page saw it a minute ago; it was ended in Plazo Pro since.
    client.setQueryData(["shuttle-current"], { trip: trip() }, { updatedAt: Date.now() - 60_000 });
    renderPanel("/navettes?sens=dropoff&reservation=d2", client);
    await waitFor(() => expect(screen.getByRole("button", { name: "Partir vers Gare TGV · 1 pers." })).toBeInTheDocument());
    expect(screen.getAllByTestId("departure-row")[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("« Embarquer » depuis une fiche ouverte sur la page pendant mon trajet : retour sur « En route » avec le message", async () => {
    api.getCurrentTrip.mockResolvedValue({ trip: trip() });
    renderPanel();
    await screen.findByTestId("trip-running");
    await userEvent.click(screen.getByRole("tab", { name: /Retour/ }));
    await userEvent.click(screen.getByText("embarquer-d2"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Un trajet est déjà en cours : terminez-le avant d'en démarrer un autre."));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/navettes$/));
    expect(screen.getByRole("tab", { name: "En route · 1" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("trip-running")).toHaveTextContent("En route vers l'aéroport");
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
