import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { signal } from "@/test/arrival-fixtures";
import PlanningPage from "./PlanningPage";

const api = vi.hoisted(() => ({ getPlanning: vi.fn(), getLiveArrivals: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: "driver" } }) }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getPlanning: (...a: unknown[]) => api.getPlanning(...a), getLiveArrivals: () => api.getLiveArrivals() } };
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
    expect(within(arrivals).getAllByRole("listitem")[0]).toBe(card);

    expect(screen.getByText("Prévenu · « dans 20 min »")).toBeInTheDocument();
    expect(screen.getByText("● Au point de rendez-vous")).toBeInTheDocument();

    // The banner announces the newest event; "Voir" scrolls to the row and closes it.
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Retour : Q. Roux est au point de rendez-vous — QR-321-ST");
    await userEvent.click(within(banner).getByRole("button", { name: "Voir ›" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
