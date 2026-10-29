import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ExtrasBoard, ExtrasBoardRow } from "@/lib/types";
import ExtrasTodoPage from "./ExtrasTodoPage";

const api = vi.hoisted(() => ({
  getExtrasBoard: vi.fn(),
  acceptExtra: vi.fn(),
  markExtraDone: vi.fn(),
  refuseExtra: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const NOW = "2026-10-29T13:00:00.000Z"; // 14:00 in Paris

const row = (over: Partial<ExtrasBoardRow>): ExtrasBoardRow => ({
  id: "x1",
  kind: "ev_charge",
  label: "Recharge électrique",
  priceCents: 3000,
  status: "ordered",
  withBooking: false,
  paidAt: "2026-10-28T10:00:00.000Z",
  acceptedAt: null,
  acceptedBy: null,
  doneAt: null,
  refusedAt: null,
  refusedReason: null,
  refundedAt: null,
  doneBy: null,
  refusedBy: null,
  dueAt: "2026-10-29T12:30:00.000Z",
  late: true,
  reservation: {
    id: "r1",
    reference: "R7KQ2M",
    customerName: "Claire Martin",
    plate: "GH-456-JK",
    vehicleModel: "Zoé",
    vehicleColour: "blanche",
    status: "arrived",
    returnAt: "2026-10-29T13:30:00.000Z",
    expectedReturnAt: "2026-10-29T13:30:00.000Z",
    returnFlight: null,
    spot: null,
    file: { code: "F04", rank: 2 },
  },
  ...over,
});

const board = (over: Partial<ExtrasBoard> = {}): ExtrasBoard => ({
  view: "todo",
  timezone: "Europe/Paris",
  now: NOW,
  counts: { todo: 2, done: 1, refused: 0 },
  data: [
    row({}),
    row({
      id: "x2",
      kind: "interior_wash",
      label: "Lavage intérieur et shampouineuse",
      priceCents: 5000,
      dueAt: "2026-10-29T15:10:00.000Z",
      late: false,
      acceptedAt: "2026-10-29T09:00:00.000Z",
      acceptedBy: "Karim",
      reservation: { ...row({}).reservation, id: "r2", customerName: "Karim Benali", plate: "AB-123-CD", file: null, spot: "A12" },
    }),
  ],
  ...over,
});

function renderPage(url = "/reservations/services") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <ExtrasTodoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getExtrasBoard.mockResolvedValue(board());
  api.acceptExtra.mockResolvedValue({ extras: [] });
  api.markExtraDone.mockResolvedValue({ extras: [] });
  api.refuseExtra.mockResolvedValue({ extras: [] });
});

describe("ExtrasTodoPage", () => {
  it("groupe les services par heure limite, le retard en tête, avec la file et le montant", async () => {
    renderPage();
    const late = await screen.findByTestId("extra-row-x1");
    expect(within(late).getByText("13:30")).toBeInTheDocument();
    expect(within(late).getByText(/retour 14:30 · dépassé/)).toBeInTheDocument();
    expect(within(late).getByText("File F04 · 2e")).toBeInTheDocument();
    expect(within(late).getByText("GH-456-JK · Zoé blanche")).toBeInTheDocument();
    expect(screen.getByText("En retard · 1")).toBeInTheDocument();
    expect(screen.getByText("Aujourd'hui · 1")).toBeInTheDocument();
    const later = screen.getByTestId("extra-row-x2");
    expect(within(later).getByText("Accepté par Karim")).toBeInTheDocument();
    expect(within(later).getByText("Place A12")).toBeInTheDocument();
    // Already accepted: no second « Accepter ».
    expect(within(later).queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
    expect(screen.getByTestId("extras-tab-todo")).toHaveTextContent("À faire · 2");
  });

  it("« Accepter », « Fait » et « Pas possible » sur la ligne", async () => {
    renderPage();
    const late = await screen.findByTestId("extra-row-x1");
    await userEvent.click(within(late).getByRole("button", { name: "Accepter" }));
    await waitFor(() => expect(api.acceptExtra).toHaveBeenCalledWith("r1", "x1"));
    await userEvent.click(within(late).getByRole("button", { name: "Fait" }));
    await waitFor(() => expect(api.markExtraDone).toHaveBeenCalledWith("r1", "x1"));
    await userEvent.click(within(late).getByRole("button", { name: "Pas possible" }));
    await userEvent.type(within(late).getByLabelText("Pourquoi ? (facultatif)"), "Borne en panne");
    await userEvent.click(within(late).getByRole("button", { name: "Rembourser le client" }));
    await waitFor(() => expect(api.refuseExtra).toHaveBeenCalledWith("r1", "x1", "Borne en panne"));
  });

  it("les services faits aujourd'hui, et un onglet vide", async () => {
    api.getExtrasBoard.mockImplementation(async (view: string) =>
      view === "done"
        ? board({ view: "done", data: [row({ status: "done", doneAt: "2026-10-29T12:05:00.000Z", doneBy: "Nadia", late: false })] })
        : board({ view: "refused", data: [] }),
    );
    renderPage("/reservations/services?vue=faits");
    const done = await screen.findByTestId("extra-row-x1");
    expect(within(done).getByText("Fait à 13:05 par Nadia")).toBeInTheDocument();
    expect(within(done).queryByRole("button", { name: "Fait" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("extras-tab-refused"));
    expect(await screen.findByTestId("extras-empty")).toHaveTextContent("Aucun service refusé");
  });
});
