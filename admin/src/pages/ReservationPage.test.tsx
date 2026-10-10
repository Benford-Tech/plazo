import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "@/lib/api";
import ReservationPage from "./ReservationPage";

const api = vi.hoisted(() => ({ getReservation: vi.fn(), setReservationPrice: vi.fn() }));
const auth = vi.hoisted(() => ({ user: { role: "manager" } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const reservation = (extra: Record<string, unknown> = {}) => ({
  id: "r1",
  reference: "R7KQ2M",
  parkingId: "p1",
  channel: "aggregator",
  channelDetail: "Allopark",
  status: "upcoming",
  arrivalAt: "2026-10-30T10:00:00.000Z",
  returnAt: "2026-11-02T20:00:00.000Z",
  passengers: 2,
  customerName: "Jean Dupont",
  customerFirstName: "Jean",
  customerLastName: "Dupont",
  customerPhone: "0612345678",
  customerEmail: null,
  plate: "GK-318-PX",
  returnFlight: null,
  departureFlight: null,
  notes: null,
  externalReference: "AL-123829327",
  priceCents: 2600,
  overbooked: false,
  cancellationPolicy: null,
  arrivedAt: null,
  returnedAt: null,
  cancelledAt: null,
  createdAt: "2026-10-10T08:00:00.000Z",
  nextStatuses: [],
  ...extra,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/reservations/r1"]}>
        <Routes>
          <Route path="/reservations/:id" element={<ReservationPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReservationPage · prix payé (10/10/2026)", () => {
  beforeEach(() => {
    api.getReservation.mockReset();
    api.setReservationPrice.mockReset();
    auth.user = { role: "manager" };
  });

  it("modifie le prix d'une réservation importée, sur la fiche", async () => {
    api.getReservation.mockResolvedValue(reservation());
    api.setReservationPrice.mockResolvedValue({ id: "r1", priceCents: 3150 });
    renderPage();
    expect(await screen.findByText("26,00 €")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Modifier le prix" }));
    const input = screen.getByLabelText("Prix payé en euros");
    expect(input).toHaveValue("26,00");
    await userEvent.clear(input);
    await userEvent.type(input, "31,50");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.setReservationPrice).toHaveBeenCalledWith("r1", 3150));
    expect(await screen.findByText("31,50 €")).toBeInTheDocument();
  });

  it("refuse un montant invalide sans appeler l'API, et ajoute un prix absent, même après le séjour", async () => {
    api.getReservation.mockResolvedValue(reservation({ priceCents: null, status: "returned" }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Ajouter le prix" }));
    await userEvent.type(screen.getByLabelText("Prix payé en euros"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Montant invalide (ex. 45,50).");
    expect(api.setReservationPrice).not.toHaveBeenCalled();
  });

  it("dit pourquoi le serveur refuse le montant", async () => {
    api.getReservation.mockResolvedValue(reservation());
    api.setReservationPrice.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { priceCents: "too_large" }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Modifier le prix" }));
    const input = screen.getByLabelText("Prix payé en euros");
    await userEvent.clear(input);
    await userEvent.type(input, "150000");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Valeur trop grande.");
  });

  it("ne propose pas de changer le prix d'une réservation payée sur Plazo, ni à qui ne gère pas les réservations", async () => {
    api.getReservation.mockResolvedValue(reservation({ channel: "plazo", paymentStatus: "paid", chargedCents: 4500, priceCents: 4500 }));
    const { unmount } = renderPage();
    expect(await screen.findByText("45,00 €")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier le prix" })).not.toBeInTheDocument();
    unmount();
    auth.user = { role: "driver" };
    api.getReservation.mockResolvedValue(reservation());
    renderPage();
    expect(await screen.findByText("26,00 €")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier le prix" })).not.toBeInTheDocument();
  });
});
