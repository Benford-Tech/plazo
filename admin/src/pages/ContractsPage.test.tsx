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
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const row = (over: Partial<SignedContractRow> = {}): SignedContractRow => ({
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
  ...over,
});

const page = (
  rows: SignedContractRow[],
  over: Partial<SignedContractsPage> = {},
): SignedContractsPage => ({
  data: rows,
  total: rows.length,
  reservedCount: rows.filter((r) => r.reserved).length,
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
});
