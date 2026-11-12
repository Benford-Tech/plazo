import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { SignedContractRow, SignedContractsPage } from "@/lib/types";
import ContractsPage from "./ContractsPage";

const api = vi.hoisted(() => ({
  getSignedContracts: vi.fn(),
  reservationContractFile: vi.fn(),
  exportSignedContracts: vi.fn(),
  archiveContract: vi.fn(),
  unarchiveContract: vi.fn(),
  archiveContractsBefore: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const row = (over: Partial<SignedContractRow> = {}): SignedContractRow => ({
  id: `c-${over.reservationId ?? "r1"}`,
  reservationId: "r1",
  reference: "PLZ-7K2M",
  customerName: "Camille Martin",
  plate: "AB-123-CD",
  arrivalAt: "2026-11-12T06:30",
  returnAt: "2026-11-19T21:40",
  signedAt: "2026-11-12T05:34:00Z",
  signerName: "Camille Martin",
  method: "sms_code",
  witnessName: "Karim",
  version: "pdf-3",
  templateVersion: 3,
  proofSha256: "9f3a".padEnd(64, "0"),
  signedSha256: "e07b".padEnd(64, "0"),
  files: { template: true, signed: true, proof: true },
  reserved: false,
  archivedAt: null,
  ...over,
});

const page = (
  rows: SignedContractRow[],
  over: Partial<SignedContractsPage> = {},
): SignedContractsPage => ({
  data: rows,
  total: rows.length,
  signedCount: rows.length,
  reservedCount: rows.filter((r) => r.reserved).length,
  archivedCount: 0,
  months: [],
  month: null,
  page: 1,
  totalPages: 1,
  ...over,
});

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ContractsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("ContractsPage (26/10/2026, registre R-A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:x"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("liste les contrats signés, leur moyen, leur version et leurs fichiers ; télécharge le PDF signé", async () => {
    api.getSignedContracts.mockResolvedValue(
      page([
        row(),
        row({
          reservationId: "r2",
          customerName: "Louis Leroy",
          plate: "LM-789-NP",
          method: "handwritten",
          witnessName: "Nadia",
          version: "2026-10-19",
          templateVersion: null,
          reserved: true,
          files: { template: false, signed: true, proof: true },
        }),
      ]),
    );
    api.reservationContractFile.mockResolvedValue({
      blob: new Blob(["%PDF"]),
      filename: "contrat-PLZ-7K2M-signe.pdf",
    });
    renderPage();
    const rows = await screen.findAllByTestId("contract-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Camille Martin");
    expect(rows[0]).toHaveTextContent("12/11 06:30 → 19/11 21:40");
    expect(rows[0]).toHaveTextContent("Code SMS · Karim");
    expect(rows[0]).toHaveTextContent("PDF v3");
    expect(
      within(rows[0]).getByRole("button", { name: "Contrat du parking" }),
    ).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent("À la main · Nadia");
    expect(rows[1]).toHaveTextContent("Plazo 2026-10-19");
    expect(rows[1]).toHaveTextContent("réserve au retour");
    expect(
      within(rows[1]).queryByRole("button", { name: "Contrat du parking" }),
    ).toBeNull();
    expect(screen.getByTestId("contract-filters")).toHaveTextContent(
      "Signés · 2",
    );
    expect(screen.getByTestId("contract-filters")).toHaveTextContent(
      "Avec réserve · 1",
    );

    await userEvent.click(
      within(rows[0]).getByRole("button", { name: "PDF signé" }),
    );
    await waitFor(() =>
      expect(api.reservationContractFile).toHaveBeenCalledWith("r1", "signed"),
    );
  });

  it("classe par année et par mois ; un mois n'affiche que ses contrats (12/11/2026, choix B)", async () => {
    api.getSignedContracts.mockImplementation(async (q: { month?: string }) =>
      page([row()], {
        total: q.month ? 14 : 22,
        signedCount: 22,
        month: q.month ?? null,
        months: [
          { month: "2026-11", count: 14 },
          { month: "2026-10", count: 7 },
          { month: "2025-12", count: 1 },
        ],
      }),
    );
    renderPage();
    const nav = await screen.findByTestId("contracts-months");
    expect(within(nav).getByRole("button", { name: /Tous les mois/ })).toHaveAttribute("aria-pressed", "true");
    // The latest year is open, the older one folded.
    expect(within(nav).getByRole("button", { name: /Novembre/ })).toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: /Décembre/ })).toBeNull();
    await userEvent.click(within(nav).getByRole("button", { name: /Novembre/ }));
    await waitFor(() =>
      expect(api.getSignedContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ month: "2026-11", page: 1 }),
      ),
    );
    expect(await screen.findByTestId("contracts-month-head")).toHaveTextContent("Novembre 2026");
    const column = screen.getByTestId("contracts-months");
    await userEvent.click(within(column).getByRole("button", { name: /2025/ }));
    expect(within(column).getByRole("button", { name: /Décembre/ })).toBeInTheDocument();
  });

  it("recherche, filtre « Avec réserve » et exporte en CSV", async () => {
    api.getSignedContracts.mockResolvedValue(
      page([row(), row({ reservationId: "r2", reserved: true })]),
    );
    api.exportSignedContracts.mockResolvedValue({
      blob: new Blob(["csv"]),
      filename: "contrats-signes.csv",
    });
    renderPage();
    await screen.findAllByTestId("contract-row");
    await userEvent.type(screen.getByLabelText("Trouver un contrat"), "ab-123");
    await waitFor(() =>
      expect(api.getSignedContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "ab-123", page: 1 }),
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: /Avec réserve/ }));
    await waitFor(() =>
      expect(api.getSignedContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ reserved: true }),
      ),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Exporter en CSV" }),
    );
    await waitFor(() =>
      expect(api.exportSignedContracts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "ab-123", reserved: true }),
      ),
    );
  });

  it("archive un contrat, montre « Archivés » et désarchive (12/11/2026)", async () => {
    api.getSignedContracts.mockImplementation(
      async (q: { archived?: boolean }) =>
        q.archived
          ? page([row({ archivedAt: "2026-11-12T10:00:00Z" })], {
              signedCount: 1,
              archivedCount: 1,
            })
          : page([row(), row({ reservationId: "r2" })], { archivedCount: 1 }),
    );
    api.archiveContract.mockResolvedValue({
      id: "c-r1",
      reservationId: "r1",
      archivedAt: "2026-11-12T10:00:00Z",
    });
    api.unarchiveContract.mockResolvedValue({
      id: "c-r1",
      reservationId: "r1",
      archivedAt: null,
    });
    renderPage();
    const rows = await screen.findAllByTestId("contract-row");
    expect(screen.getByTestId("contract-filters")).toHaveTextContent(
      "Archivés · 1",
    );
    await userEvent.click(
      within(rows[0]).getByRole("button", { name: "Archiver" }),
    );
    await waitFor(() =>
      expect(api.archiveContract).toHaveBeenCalledWith("c-r1"),
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Contrat archivé"),
    );

    await userEvent.click(screen.getByRole("button", { name: /Archivés/ }));
    await waitFor(() =>
      expect(api.getSignedContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ archived: true }),
      ),
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("contract-row")).toHaveLength(1),
    );
    await userEvent.click(
      within(screen.getByTestId("contract-row")).getByRole("button", {
        name: "Désarchiver",
      }),
    );
    await waitFor(() =>
      expect(api.unarchiveContract).toHaveBeenCalledWith("c-r1"),
    );
  });

  it("archive d'un coup les contrats d'avant une date, après confirmation", async () => {
    api.getSignedContracts.mockResolvedValue(page([row()]));
    api.archiveContractsBefore.mockResolvedValue({ archived: 3 });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await screen.findAllByTestId("contract-row");
    await userEvent.click(
      screen.getByRole("button", { name: "Archiver les contrats d'avant le…" }),
    );
    const form = screen.getByTestId("archive-before");
    await userEvent.type(
      within(form).getByLabelText("Séjours terminés avant le"),
      "2026-11-01",
    );
    await userEvent.click(
      within(form).getByRole("button", { name: "Archiver" }),
    );
    await waitFor(() =>
      expect(api.archiveContractsBefore).toHaveBeenCalledWith("2026-11-01"),
    );
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("01/11/2026"));
    expect(toast.success).toHaveBeenCalledWith("3 contrats archivés.");
  });
});
