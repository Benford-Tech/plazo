import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReservationExtra } from "@/lib/types";
import { MemoryRouter } from "react-router-dom";
import { ReservationExtras } from "./ReservationExtras";

const api = vi.hoisted(() => ({
  getReservationExtras: vi.fn(),
  markExtraDone: vi.fn(),
  refuseExtra: vi.fn(),
  addExtra: vi.fn(),
  setExtraPayment: vi.fn(),
}));
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

const renderBlock = (mayAct = true, mayAdd = false, mayConfigure = false) =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ReservationExtras reservationId="r1" mayAct={mayAct} mayAdd={mayAdd} mayConfigure={mayConfigure} />
      </QueryClientProvider>
    </MemoryRouter>,
  );

const services = [
  { kind: "interior_wash", label: "Lavage intérieur", icon: "interior", group: null, priceCents: 5000, available: true, reason: null },
  { kind: "hybrid_charge", label: "Recharge hybride", icon: "hybrid", group: "charge", priceCents: 1500, available: true, reason: null },
  { kind: "ev_charge", label: "Recharge électrique", icon: "ev", group: "charge", priceCents: 3000, available: false, reason: "already_ordered" },
];

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

  it("toujours là avec « + Ajouter un service » : service, prix modifiable, payé par, puis ajouté", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [], services, canAdd: true });
    api.addExtra.mockResolvedValue({
      extra: "x9",
      extras: [order({ id: "x9", priceCents: 4550, source: "staff", paymentMethod: "card", addedBy: "Julie" })],
      services,
      canAdd: true,
    });
    renderBlock(true, true);
    await userEvent.click(await screen.findByRole("button", { name: "+ Ajouter un service" }));
    const form = screen.getByTestId("add-extra-form");
    expect(within(form).getByTestId("add-ev_charge")).toBeDisabled();
    expect(within(form).getByText("déjà commandé")).toBeInTheDocument();
    expect(screen.getByLabelText("Prix")).toHaveValue("50,00");
    await userEvent.click(within(form).getByTestId("add-hybrid_charge"));
    expect(screen.getByLabelText("Prix")).toHaveValue("15,00");
    await userEvent.click(within(form).getByTestId("add-interior_wash"));
    await userEvent.clear(screen.getByLabelText("Prix"));
    await userEvent.type(screen.getByLabelText("Prix"), "abc");
    await userEvent.click(within(form).getByRole("button", { name: "Ajouter" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Montant invalide");
    expect(api.addExtra).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText("Prix"));
    await userEvent.type(screen.getByLabelText("Prix"), "45,50");
    await userEvent.click(within(form).getByRole("button", { name: "Espèces" }));
    await userEvent.click(within(form).getByRole("button", { name: "CB" }));
    await userEvent.click(within(form).getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(api.addExtra).toHaveBeenCalledWith("r1", { kind: "interior_wash", priceCents: 4550, paymentMethod: "card" }));
    expect(await screen.findByText("Payé au parking · CB")).toBeInTheDocument();
    expect(screen.getByText(/Ajouté au parking par Julie/)).toBeInTheDocument();
  });

  it("« À payer au retour » puis le paiement noté ; « Payé en ligne » pour une commande Plazo", async () => {
    api.getReservationExtras.mockResolvedValue({
      extras: [order(), order({ id: "x2", kind: "ev_charge", label: "Recharge électrique", source: "staff", paymentMethod: null, paidAt: null })],
      services,
      canAdd: true,
    });
    api.setExtraPayment.mockResolvedValue({
      extras: [order(), order({ id: "x2", kind: "ev_charge", label: "Recharge électrique", source: "staff", paymentMethod: "cash" })],
    });
    renderBlock(true, true);
    expect(within(await screen.findByTestId("order-interior_wash")).getByText("Payé en ligne")).toBeInTheDocument();
    const charge = screen.getByTestId("order-ev_charge");
    expect(within(charge).getByText("À payer au retour")).toBeInTheDocument();
    await userEvent.click(within(charge).getByRole("button", { name: "Noter le paiement" }));
    await userEvent.click(within(charge).getByRole("button", { name: "Espèces" }));
    await waitFor(() => expect(api.setExtraPayment).toHaveBeenCalledWith("r1", "x2", "cash"));
    expect(await screen.findByText("Payé au parking · Espèces")).toBeInTheDocument();
  });

  it("sans service proposé : un lien vers les réglages pour le gérant, rien pour les autres", async () => {
    api.getReservationExtras.mockResolvedValue({ extras: [], services: [], canAdd: false });
    renderBlock(true, true, true);
    expect(await screen.findByRole("link", { name: "Les régler dans Parking › Réglages" })).toHaveAttribute("href", "/parking/reglages");
  });
});
