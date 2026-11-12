import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { signal } from "@/test/arrival-fixtures";
import PlanningPage from "./PlanningPage";

const api = vi.hoisted(() => ({ getPlanning: vi.fn(), getLiveArrivals: vi.fn(), getReservation: vi.fn(), getReservationExtras: vi.fn() }));
const auth = vi.hoisted(() => ({ user: { role: "driver" } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getPlanning: (...a: unknown[]) => api.getPlanning(...a),
      getLiveArrivals: () => api.getLiveArrivals(),
      getReservation: (...a: unknown[]) => api.getReservation(...a),
      getReservationExtras: (...a: unknown[]) => api.getReservationExtras(...a),
    },
  };
});

const booking = (id: string, name: string, plate: string, at: string, extra: Record<string, unknown> = {}) => ({
  id,
  reference: `R${id}`,
  parkingId: "p1",
  channel: "plazo",
  channelDetail: null,
  status: "upcoming",
  arrivalAt: at,
  returnAt: at,
  passengers: 2,
  customerName: name,
  customerPhone: "",
  customerEmail: null,
  plate,
  returnFlight: null,
  notes: null,
  externalReference: null,
  priceCents: null,
  overbooked: false,
  cancellationPolicy: null,
  arrivedAt: null,
  returnedAt: null,
  cancelledAt: null,
  createdAt: at,
  ...extra,
});

describe("Planning : arrivées en direct", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    api.getPlanning.mockResolvedValue({
      date: "2026-10-03",
      timezone: "Europe/Paris",
      parking: { id: "p1", name: "Parking Démo LYS", bookableCapacity: 100 },
      arrivals: [
        booking("r0", "Louis Leroy", "LM-789-NP", "2026-10-03T05:00:00.000Z"),
        booking("r2", "Léa Durand", "GH-456-JK", "2026-10-03T06:30:00.000Z"),
        booking("r1", "Camille Martin", "AB-123-CD", "2026-10-03T06:00:00.000Z"),
      ],
      returns: [booking("r3", "Quentin Roux", "QR-321-ST", "2026-10-03T08:05:00.000Z", { status: "return_requested" })],
      nights: [],
      stats: { arrivals: 3, arrived: 0, returns: 1, returnsWithFlight: 0 },
    });
    api.getLiveArrivals.mockResolvedValue({
      serverTime: "2026-10-03T05:40:00.000Z",
      signals: [
        signal({ id: "s3", reservationId: "r3", kind: "return", state: "at_meeting_point", customerName: "Quentin Roux", plate: "QR-321-ST", position: null }),
        signal(),
        signal({ id: "s2", reservationId: "r2", state: "announced", announcedMinutes: 20, customerName: "Léa Durand", plate: "GH-456-JK", position: null }),
      ],
    });
  });

  it("met l'arrivée en approche en tête avec sa mini-carte, et affiche les autres états", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <PlanningPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const approaching = await screen.findByText("● En approche · 12 min");
    const card = approaching.closest("li")!;
    expect(within(card).getByText("Camille Martin")).toBeInTheDocument();
    expect(within(card).getByRole("img", { name: /Position de Camille Martin/ })).toBeInTheDocument();
    expect(within(card).getByText(/Position mise à jour il y a 2\d s · 8,4 km · arrivée estimée 07:52/)).toBeInTheDocument();
    // First in its column although it is not the earliest.
    const arrivals = card.closest("ul")!;
    // The first row of its column (not the « Déjà passés » fold).
    expect(within(arrivals).getAllByRole("listitem").filter(li => li.id)[0]).toBe(card);

    expect(screen.getByText("Prévenu · « dans 20 min »")).toBeInTheDocument();
    expect(screen.getByText("● Au point de rendez-vous")).toBeInTheDocument();

    // The banner announces the newest event; "Voir" scrolls to the row and closes it.
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Retour : Q. Roux est au point de rendez-vous — QR-321-ST");
    await userEvent.click(within(banner).getByRole("button", { name: "Voir ›" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("affiche « Navette en route (Karim) » sur le retour qu'un chauffeur part chercher", async () => {
    api.getLiveArrivals.mockResolvedValue({
      serverTime: "2026-10-03T05:40:00.000Z",
      signals: [],
      shuttleTrips: [{ id: "t1", direction: "pickup", driverId: "d1", driverName: "Karim Benali", startedAt: "2026-10-03T05:35:00.000Z", reservationIds: ["r3"] }],
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <PlanningPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const badge = await screen.findByText("Navette en route (Karim)");
    expect(within(badge.closest("li")!).getByText("Quentin Roux")).toBeInTheDocument();
  });

  it("signale les SMS en attente quand le téléphone du parking ne répond plus (lien vers Mon compte pour le gérant)", async () => {
    auth.user = { role: "manager" };
    api.getPlanning.mockResolvedValue({ ...(await api.getPlanning()), smsWarning: { pending: 3 } });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <PlanningPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const warning = await screen.findByTestId("sms-warning");
    expect(warning).toHaveTextContent("3 SMS en attente · téléphone injoignable");
    expect(within(warning).getByRole("link", { name: "SMS aux voyageurs ›" })).toHaveAttribute("href", "/parking/reglages#sms");
    auth.user = { role: "driver" };
  });

  it("n'affiche rien quand aucun SMS n'attend", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <PlanningPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByTestId("planning-row-r1");
    expect(screen.queryByTestId("sms-warning")).not.toBeInTheDocument();
  });
});

describe("Planning : les prochains en tête (direction A)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T13:05:00.000Z")); // 14:05 in Paris
    Element.prototype.scrollIntoView = vi.fn();
    api.getLiveArrivals.mockResolvedValue({ serverTime: "2026-10-30T13:05:00.000Z", signals: [] });
    api.getPlanning.mockResolvedValue({
      date: "2026-10-30",
      timezone: "Europe/Paris",
      parking: { id: "p1", name: "Parking Démo LYS", bookableCapacity: 100 },
      arrivals: [
        booking("a1", "Marc Lopez", "LM-789-NP", "2026-10-30T12:20:00.000Z", { status: "arrived" }),
        booking("a2", "Hugo Morel", "AB-482-KD", "2026-10-30T13:50:00.000Z", {
          departureFlight: "AF 7641",
          departureScheduledAt: "2026-10-30T15:35:00.000Z",
          departureCity: "Lisbonne",
          stopName: "Gare TGV",
        }),
        booking("a3", "Inès Petit", "GH-456-JK", "2026-10-30T16:15:00.000Z"),
      ],
      returns: [
        booking("d1", "Anne Roux", "QR-321-ST", "2026-10-30T12:45:00.000Z", { status: "returned" }),
        booking("d2", "Claire Durand", "TS-101-PZ", "2026-10-30T12:55:00.000Z", {
          status: "shuttled_out",
          returnFlight: "TO 3627",
          flightEstimatedAt: "2026-10-30T12:40:00.000Z",
          returnCity: "Porto",
        }),
      ],
      nights: [],
      stats: { arrivals: 3, arrived: 1, returns: 2, returnsWithFlight: 0 },
    });
  });
  afterEach(() => vi.useRealTimers());

  it("montre la prochaine arrivée et le prochain départ, et replie ce qui est fait", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <PlanningPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const arrival = await screen.findByTestId("next-arrival");
    expect(within(arrival).getByText("Hugo Morel")).toBeInTheDocument();
    expect(within(arrival).getByText("14:50")).toBeInTheDocument();
    expect(within(arrival).getByText("dans 45 min")).toBeInTheDocument();
    // The flight and where the traveller goes.
    expect(within(arrival).getByTestId("next-arrival-flight")).toHaveTextContent("AF 7641 · décolle 16:35 · Lisbonne");
    expect(within(arrival).getByText(/vers Gare TGV/)).toBeInTheDocument();
    // Claire is still away 10 minutes after her time: the next departure, late.
    const departure = screen.getByTestId("next-return");
    expect(within(departure).getByText("Claire Durand")).toBeInTheDocument();
    expect(within(departure).getByText("en retard · 10 min")).toBeInTheDocument();

    expect(screen.queryByTestId("planning-row-a1")).toBeNull();
    expect(screen.getByTestId("past-arrival")).toHaveTextContent("Déjà passés · 1");
    await userEvent.click(screen.getByTestId("past-arrival"));
    expect(screen.getByTestId("planning-row-a1").closest("li")).toHaveClass("opacity-50");
    expect(screen.queryByTestId("planning-row-d1")).toBeNull();
  });
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <PlanningPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("Planning : la réservation en direct à droite (12/11/2026)", () => {
  const original = window.matchMedia;
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = ((query: string) => ({
      matches: query === "(min-width: 1024px)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date("2026-11-12T10:00:00.000Z")); // 11:00 in Paris
    api.getLiveArrivals.mockResolvedValue({
      serverTime: "2026-11-12T10:00:00.000Z",
      signals: [
        signal({
          id: "s9",
          reservationId: "m1",
          state: "at_meeting_point",
          customerName: "Sébastien Morel",
          plate: "GH-456-JK",
          position: null,
          startedAt: "2026-11-12T09:58:00.000Z",
          atMeetingPointAt: "2026-11-12T10:12:00.000Z",
          note: "Je suis en avance",
        }),
      ],
    });
    api.getPlanning.mockResolvedValue({
      date: "2026-11-12",
      timezone: "Europe/Paris",
      parking: { id: "p1", name: "Parking Démo LYS", bookableCapacity: 100 },
      arrivals: [booking("m1", "Sébastien Morel", "GH-456-JK", "2026-11-12T10:15:00.000Z")],
      returns: [],
      nights: [],
      stats: { arrivals: 1, arrived: 0, returns: 0, returnsWithFlight: 0 },
    });
    api.getReservation.mockResolvedValue({
      ...booking("m1", "Sébastien Morel", "GH-456-JK", "2026-11-12T10:15:00.000Z"),
      customerPhone: "06 12 34 56 78",
      vehicleModel: "Peugeot 3008",
      vehicleColour: "gris",
      nextStatuses: ["arrived", "cancelled"],
    });
    api.getReservationExtras.mockResolvedValue({ data: [], available: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = original;
  });

  it("ouvre la réservation à côté du planning, la relit toutes les 5 s et se ferme", async () => {
    renderPage();
    const rowButton = await screen.findByTestId("planning-row-m1");
    await act(async () => rowButton.click());
    const panel = await screen.findByTestId("live-panel");
    // The planning stays: no drawer, the row outlined.
    expect(screen.queryByTestId("quick-card")).toBeNull();
    expect(rowButton.closest("li")).toHaveAttribute("data-selected", "true");
    expect(rowButton).toHaveAttribute("aria-pressed", "true");
    expect(await within(panel).findByText("Sébastien Morel")).toBeInTheDocument();
    expect(within(panel).getByTestId("live-pill")).toHaveTextContent(/En direct · il y a \d s/);
    expect(within(panel).getByTestId("card-vehicle")).toHaveTextContent("Peugeot 3008");
    // What the traveller did: on the way with their word, then at the meeting point (now).
    expect(within(panel).getByTestId("live-step-on_the_way")).toHaveAttribute("data-state", "done");
    expect(within(panel).getByTestId("live-step-on_the_way")).toHaveTextContent("« Je suis en avance »");
    expect(within(panel).getByTestId("live-step-meeting_point")).toHaveAttribute("data-state", "now");
    expect(within(panel).getByTestId("live-step-boarded")).toHaveAttribute("data-state", "todo");
    expect(within(panel).getByRole("link", { name: "Ouvrir la fiche complète" })).toHaveAttribute("href", "/reservations/m1");

    const calls = api.getReservation.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    await waitFor(() => expect(api.getReservation.mock.calls.length).toBeGreaterThan(calls));

    await act(async () => within(panel).getByRole("button", { name: "Fermer la réservation" }).click());
    expect(screen.queryByTestId("live-panel")).toBeNull();
    expect(rowButton.closest("li")).not.toHaveAttribute("data-selected");
  });

  it("replie les deux prochains en une ligne, garde le retard et se souvient du choix", async () => {
    api.getLiveArrivals.mockResolvedValue({ serverTime: "2026-11-12T10:00:00.000Z", signals: [] });
    api.getPlanning.mockResolvedValue({
      date: "2026-11-12",
      timezone: "Europe/Paris",
      parking: { id: "p1", name: "Parking Démo LYS", bookableCapacity: 100 },
      arrivals: [
        booking("m1", "Sébastien Morel", "GH-456-JK", "2026-11-12T10:25:00.000Z"),
        booking("m0", "Paul Durand", "AA-111-AA", "2026-11-12T09:30:00.000Z"),
      ],
      returns: [booking("g1", "Inès Garcia", "BB-222-BB", "2026-11-12T10:40:00.000Z", { status: "return_requested" })],
      nights: [],
      stats: { arrivals: 2, arrived: 0, returns: 1, returnsWithFlight: 0 },
    });
    const first = renderPage();
    await screen.findByTestId("next-arrival");
    await act(async () => screen.getByRole("button", { name: "Replier" }).click());
    const line = screen.getByTestId("planning-next");
    expect(line).toHaveAttribute("data-collapsed", "true");
    expect(screen.queryByTestId("next-arrival")).toBeNull();
    expect(within(line).getByTestId("folded-arrival")).toHaveTextContent("↑ 11:25S. Moreldans 25 min");
    expect(within(line).getByTestId("folded-return")).toHaveTextContent("↓ 11:40I. Garcia");
    expect(within(line).getByTestId("folded-late")).toHaveTextContent("En retard · 1");
    expect(window.localStorage.getItem("plazo:planning-next-collapsed")).toBe("1");

    first.unmount();
    renderPage();
    expect(await screen.findByRole("button", { name: "Déplier" })).toBeInTheDocument();
    await act(async () => screen.getByRole("button", { name: "Déplier" }).click());
    expect(screen.getByTestId("next-arrival")).toBeInTheDocument();
    expect(window.localStorage.getItem("plazo:planning-next-collapsed")).toBeNull();
  });
});
