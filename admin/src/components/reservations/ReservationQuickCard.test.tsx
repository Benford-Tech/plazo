import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { Reservation } from "@/lib/types";
import { QuickCardProvider, useQuickCard } from "./ReservationQuickCard";

const api = vi.hoisted(() => ({ getReservation: vi.fn(), changeReservationStatus: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const booking = (over: Partial<Reservation> = {}): Reservation =>
  ({
    id: "r1",
    reference: "RABC12",
    channel: "plazo",
    channelDetail: null,
    status: "back_at_parking",
    arrivalAt: "2026-10-06T04:30:00Z",
    returnAt: "2026-10-06T13:05:00Z",
    passengers: 2,
    customerName: "Camille Martin",
    customerPhone: "06 12 34 56 78",
    customerEmail: null,
    plate: "AB-123-CD",
    returnFlight: "TO 3627",
    departureFlight: null,
    flightStatus: "landed",
    flightLandedAt: "2026-10-06T08:02:00Z",
    flightTerminal: "1",
    flightGate: "12",
    notes: null,
    externalReference: null,
    priceCents: 3499,
    overbooked: false,
    createdAt: "2026-10-01T10:00:00Z",
    spotId: "s1",
    spot: { code: "A-01-02" },
    keyHook: "12",
    nextStatuses: ["returned", "return_requested"],
    ...over,
  }) as unknown as Reservation;

function Opener() {
  const card = useQuickCard();
  const location = useLocation();
  return (
    <>
      <button onClick={() => card.open("r1")}>ouvrir</button>
      <p data-testid="where">{location.pathname + location.search}</p>
    </>
  );
}

function renderHost() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <QuickCardProvider>
          <Routes>
            <Route path="*" element={<Opener />} />
          </Routes>
        </QuickCardProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReservationQuickCard (C-A : la fiche opérationnelle)", () => {
  beforeEach(() => {
    api.getReservation.mockReset().mockResolvedValue(booking());
    api.changeReservationStatus.mockReset();
  });

  it("montre le contact, le vol, la place et les clés, puis rend le véhicule avec la remarque", async () => {
    renderHost();
    await userEvent.click(screen.getByText("ouvrir"));
    const card = await screen.findByTestId("quick-card");
    expect(within(card).getByText("Camille Martin")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Appeler/ })).toHaveAttribute("href", "tel:0612345678");
    expect(within(card).getByText("atterri 10:02")).toBeInTheDocument();
    expect(within(card).getByText("Terminal 1 · porte 12")).toBeInTheDocument();
    expect(within(card).getByTestId("card-spot")).toHaveTextContent("A-01-02");
    expect(within(card).getByTestId("card-keys")).toHaveTextContent("12");
    expect(within(card).getByText("De retour au parking")).toBeInTheDocument();

    await userEvent.click(within(card).getByTestId("next-hand_over"));
    await userEvent.click(within(card).getByTestId("handover-confirm"));
    expect(within(card).getByText("Confirmez que les clés sont rendues.")).toBeInTheDocument();
    expect(api.changeReservationStatus).not.toHaveBeenCalled();
    await userEvent.click(within(card).getByTestId("handover-keys"));
    await userEvent.type(within(card).getByTestId("handover-note"), "Rayure aile avant");
    const returned = booking({ status: "returned", keyHook: null, nextStatuses: ["back_at_parking"] });
    api.changeReservationStatus.mockResolvedValue({ data: returned });
    api.getReservation.mockResolvedValue(returned);
    await userEvent.click(within(card).getByTestId("handover-confirm"));
    await waitFor(() => expect(api.changeReservationStatus).toHaveBeenCalledWith("r1", "returned", "Rayure aile avant"));
    expect(await within(card).findByText("Rendu")).toBeInTheDocument();
  });

  it("la prochaine étape mène à l'écran du geste, et les autres statuts restent dans le menu", async () => {
    api.getReservation.mockResolvedValue(booking({ status: "upcoming", spot: null, spotId: null, keyHook: null, nextStatuses: ["arrived", "cancelled", "no_show"] }));
    renderHost();
    await userEvent.click(screen.getByText("ouvrir"));
    const card = await screen.findByTestId("quick-card");
    const menu = within(card).getByTestId("more-actions") as HTMLSelectElement;
    expect([...menu.options].map(o => o.textContent)).toEqual(["Autres actions…", "Enregistrer l'arrivée", "Annuler la réservation", "Marquer non venu"]);
    await userEvent.click(within(card).getByTestId("next-place"));
    expect(screen.getByTestId("where")).toHaveTextContent("/parking/occupation?focus=r1");
    expect(screen.queryByTestId("quick-card")).not.toBeInTheDocument();
  });

  it("un client parti en navette : « Récupérer » ouvre les navettes côté retours avec ce client", async () => {
    api.getReservation.mockResolvedValue(booking({ status: "shuttled_out", nextStatuses: ["return_requested", "back_at_parking", "returned", "arrived"] }));
    renderHost();
    await userEvent.click(screen.getByText("ouvrir"));
    await userEvent.click(await screen.findByTestId("next-pick_up"));
    expect(screen.getByTestId("where")).toHaveTextContent("/navettes?sens=pickup&reservation=r1");
  });
});
