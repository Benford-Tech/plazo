import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReservationsPage from "./ReservationsPage";

const api = vi.hoisted(() => ({
  searchReservations: vi.fn(),
  setReservationPrice: vi.fn(),
}));
const role = vi.hoisted(() => ({ value: "manager" }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Joanny Simpore", role: role.value } }),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      searchReservations: (p: object) => api.searchReservations(p),
      setReservationPrice: (id: string, cents: number | null) =>
        api.setReservationPrice(id, cents),
    },
  };
});

const booking = (over: object) => ({
  id: "r1",
  reference: "R1",
  customerName: "Camille Martin",
  plate: "AB-123-CD",
  arrivalAt: "2026-10-21T06:30:00Z",
  returnAt: "2026-10-24T18:00:00Z",
  status: "upcoming",
  channel: "aggregator",
  channelDetail: "Allopark",
  paymentStatus: null,
  chargedCents: null,
  priceCents: 5400,
  commission: { netCents: 4428 },
  ...over,
});
const page = (docs: object[], noPriceCount: number | null) => ({
  docs,
  totalDocs: docs.length,
  limit: 20,
  page: 1,
  pageNumber: 1,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
  noPriceCount,
});

function renderPage(path = "/reservations") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReservationsPage, réservations sans prix (21/10/2026, choix A)", () => {
  beforeEach(() => {
    role.value = "manager";
    api.searchReservations.mockReset();
    api.setReservationPrice.mockReset();
  });

  it("teinte la ligne sans prix, propose « Prix à saisir » et l'enregistre sur la ligne", async () => {
    api.searchReservations.mockResolvedValue(
      page(
        [
          booking({}),
          booking({
            id: "r2",
            reference: "R2",
            customerName: "Julien Petit",
            priceCents: null,
            commission: null,
          }),
        ],
        3,
      ),
    );
    api.setReservationPrice.mockResolvedValue({ id: "r2", priceCents: 4850 });
    renderPage();
    const rows = await screen.findAllByTestId("row-no-price");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Julien Petit");
    expect(screen.getByTestId("filter-no-price")).toHaveTextContent(
      "Sans prix · 3",
    );
    fireEvent.click(
      within(rows[0]).getByRole("button", { name: "+ Prix à saisir" }),
    );
    fireEvent.change(
      within(rows[0]).getByLabelText("Prix payé de R2 en euros"),
      { target: { value: "48,50" } },
    );
    fireEvent.click(within(rows[0]).getByRole("button", { name: "OK" }));
    await waitFor(() =>
      expect(api.setReservationPrice).toHaveBeenCalledWith("r2", 4850),
    );
  });

  it("le filtre « Sans prix » demande seulement celles-là", async () => {
    api.searchReservations.mockResolvedValue(page([], 0));
    renderPage("/reservations?sansprix=1");
    await screen.findByText("Toutes les réservations ont un prix.");
    expect(api.searchReservations).toHaveBeenCalledWith(
      expect.objectContaining({ noPrice: true }),
    );
    expect(screen.getByTestId("filter-no-price")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("un payé sur Plazo n'est pas modifiable ; un autre rôle ne voit rien de tout cela", async () => {
    api.searchReservations.mockResolvedValue(
      page(
        [
          booking({
            channel: "plazo",
            paymentStatus: "pending",
            priceCents: null,
            commission: null,
          }),
        ],
        1,
      ),
    );
    renderPage();
    const row = await screen.findByTestId("row-no-price");
    expect(row).toHaveTextContent("Payé sur");
    expect(
      within(row).queryByRole("button", { name: "+ Prix à saisir" }),
    ).toBeNull();
  });

  it("rien pour un agent (pas de compte)", async () => {
    role.value = "agent";
    api.searchReservations.mockResolvedValue(
      page([booking({ priceCents: null, commission: null })], null),
    );
    renderPage();
    await screen.findByText("Camille Martin");
    expect(screen.queryByTestId("row-no-price")).toBeNull();
    expect(screen.queryByTestId("filter-no-price")).toBeNull();
  });
});
