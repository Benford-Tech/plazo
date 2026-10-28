import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ImportReservationsPage from "./ImportReservationsPage";

const api = vi.hoisted(() => ({ importReservations: vi.fn(), getReservationImports: vi.fn(), undoReservationImport: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      importReservations: (...a: unknown[]) => api.importReservations(...a),
      getReservationImports: () => api.getReservationImports(),
      undoReservationImport: (...a: unknown[]) => api.undoReservationImport(...a),
    },
  };
});

const booking = (name: string, status = "returned") => ({
  customerName: name,
  customerPhone: "0612345678",
  plate: "AB-123-CD",
  arrivalAt: "2025-09-03T05:30:00.000Z",
  returnAt: "2025-09-10T19:15:00.000Z",
  status,
  channel: "aggregator",
  channelDetail: "Allopark",
  externalReference: null,
  priceCents: 5400,
  returnFlight: null,
  passengers: 1,
  timing: "past",
});

const preview = (dryRun: boolean) => ({
  dryRun,
  timezone: "Europe/Paris",
  counts: { create: 1, check: 0, duplicate: 1, error: 1 },
  rows: [
    { line: 2, outcome: "create", errors: [], warnings: [], duplicateOf: null, booking: booking("Claire Martin") },
    { line: 3, outcome: "duplicate", errors: [], warnings: [], duplicateOf: { reference: "R7KQ2M", line: null }, booking: booking("Karim Benali") },
    { line: 4, outcome: "error", errors: ["return_before_arrival"], warnings: [], duplicateOf: null, booking: null },
  ],
  import: dryRun ? null : { id: "imp1", created: 1 },
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ImportReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const CSV = "Nom client;Tél;Immat;Date dépôt;Date retour;Prix TTC;Source\nClaire Martin;0612345678;AB-123-CD;03/09/2025 07:30;10/09/2025 21:15;54;Allopark\nKarim Benali;;;04/09/2025;06/09/2025;;\nPaul Durand;;;15/09/2025;12/09/2025;;\n";

describe("Importer des réservations (direction A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.getReservationImports.mockResolvedValue({ data: [] });
    api.importReservations.mockImplementation((body: { dryRun: boolean }) => Promise.resolve(preview(body.dryRun)));
  });

  it("recognises the columns, previews every row, then imports", async () => {
    renderPage();
    await userEvent.upload(screen.getByLabelText("Choisir un fichier"), new File([CSV], "planning.csv", { type: "text/csv" }));
    expect(await screen.findByText("planning.csv · 3 lignes")).toBeInTheDocument();
    expect(screen.getByLabelText("Date dépôt")).toHaveValue("arrivalDate");
    expect(screen.getByLabelText("Source")).toHaveValue("channel");

    expect(await screen.findByTestId("import-row-2")).toHaveTextContent("Claire Martin");
    const sent = api.importReservations.mock.calls[0][0];
    expect(sent).toMatchObject({ dryRun: true, fileName: "planning.csv" });
    expect(sent.rows[0]).toEqual({ line: 2, name: "Claire Martin", phone: "0612345678", plate: "AB-123-CD", arrivalDate: "03/09/2025 07:30", returnDate: "10/09/2025 21:15", price: "54", channel: "Allopark" });
    expect(screen.getByTestId("import-row-3")).toHaveTextContent("Déjà dans Plazo : R7KQ2M");
    expect(screen.getByTestId("import-row-4")).toHaveTextContent("Départ avant l'arrivée");

    await userEvent.click(screen.getByTestId("import-filter-error"));
    expect(screen.queryByTestId("import-row-2")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("import-submit"));
    await waitFor(() => expect(api.importReservations).toHaveBeenLastCalledWith(expect.objectContaining({ dryRun: false })));
  });

  it("asks for the columns it needs before any preview", async () => {
    renderPage();
    await userEvent.upload(screen.getByLabelText("Choisir un fichier"), new File(["Client;Divers\nClaire;x\n"], "court.csv", { type: "text/csv" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choisissez la colonne : Arrivée, Départ.");
    expect(api.importReservations).not.toHaveBeenCalled();
  });

  it("lists the recent imports with « Retirer cet import » for 24 hours", async () => {
    api.getReservationImports.mockResolvedValue({
      data: [{ id: "imp1", fileName: "planning.csv", createdAt: "2026-10-28T09:00:00.000Z", createdCount: 280, removedCount: 0, undoneAt: null, undoableUntil: "2026-10-29T09:00:00.000Z", by: "Gérant Test" }],
    });
    api.undoReservationImport.mockResolvedValue({ removed: 279, kept: 1 });
    renderPage();
    const history = await screen.findByTestId("import-history");
    expect(history).toHaveTextContent("280 réservations");
    await userEvent.click(within(history).getByRole("button", { name: "Retirer cet import" }));
    await waitFor(() => expect(api.undoReservationImport).toHaveBeenCalledWith("imp1"));
  });
});
