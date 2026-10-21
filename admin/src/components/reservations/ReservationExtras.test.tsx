import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReservationExtra } from "@/lib/types";
import { ReservationExtras } from "./ReservationExtras";

const api = vi.hoisted(() => ({ getReservationExtras: vi.fn(), markExtraDone: vi.fn(), refuseExtra: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const order = (over: Partial<ReservationExtra> = {}): ReservationExtra => ({
  id: "x1",
  kind: "interior_wash",
  label: "Lavage intérieur et shampouineuse",
  priceCents: 5000,
  status: "ordered",
  withBooking: false,
  paidAt: "2026-10-27T09:00:00Z",
  doneAt: null,
  refusedAt: null,
  refusedReason: null,
  refundedAt: null,
  doneBy: null,
  refusedBy: null,
  ...over,
});

const renderBlock = (mayAct = true) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ReservationExtras reservationId="r1" mayAct={mayAct} />
    </QueryClientProvider>,
  );

describe("ReservationExtras (services commandés)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rien quand aucun service n'est commandé", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [] });
    renderBlock();
    await waitFor(() => expect(api.getReservationExtras).toHaveBeenCalled());
    expect(screen.queryByTestId("reservation-extras")).not.toBeInTheDocument();
  });

  it("« Fait » marque le service fait", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [order(), order({ id: "x2", kind: "ev_charge", label: "Recharge électrique", status: "done", doneAt: "2026-10-29T13:12:00Z", doneBy: "Karim" })] });
    api.markExtraDone.mockResolvedValue({ extras: [order({ status: "done", doneAt: "2026-10-29T14:00:00Z", doneBy: "Julie" })] });
    renderBlock();
    const wash = await screen.findByTestId("order-interior_wash");
    expect(within(wash).getByText("À faire")).toBeInTheDocument();
    expect(screen.getByText("1 à faire")).toBeInTheDocument();
    expect(within(screen.getByTestId("order-ev_charge")).getByText(/par Karim/)).toBeInTheDocument();
    await userEvent.click(within(wash).getByRole("button", { name: "Fait" }));
    await waitFor(() => expect(api.markExtraDone).toHaveBeenCalledWith("r1", "x1"));
    expect(await screen.findByText(/par Julie/)).toBeInTheDocument();
  });

  it("« Pas possible » demande un motif puis rembourse", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [order()] });
    api.refuseExtra.mockResolvedValue({ extras: [order({ status: "refused", refusedReason: "Aspirateur en panne" })] });
    renderBlock();
    await userEvent.click(await screen.findByRole("button", { name: "Pas possible" }));
    await userEvent.type(screen.getByLabelText("Pourquoi ? (facultatif)"), "Aspirateur en panne");
    await userEvent.click(screen.getByRole("button", { name: "Rembourser le client" }));
    await waitFor(() => expect(api.refuseExtra).toHaveBeenCalledWith("r1", "x1", "Aspirateur en panne"));
    expect(await screen.findByText("Pas possible · remboursé")).toBeInTheDocument();
  });

  it("sans le droit de changer les statuts, pas de bouton", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [order()] });
    renderBlock(false);
    await screen.findByTestId("order-interior_wash");
    expect(screen.queryByRole("button", { name: "Fait" })).not.toBeInTheDocument();
  });
});
