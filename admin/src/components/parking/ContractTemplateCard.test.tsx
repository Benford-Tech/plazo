import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ContractTemplate, ContractTemplates } from "@/lib/types";
import { ContractTemplateCard } from "./ContractTemplateCard";

const api = vi.hoisted(() => ({
  getContractTemplate: vi.fn(),
  uploadContractTemplate: vi.fn(),
  revertContractTemplate: vi.fn(),
  contractTemplateFile: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const template = (over: Partial<ContractTemplate> = {}): ContractTemplate => ({
  id: "t2",
  version: 2,
  title: "Contrat des Cèdres",
  fileName: "contrat-cedres.pdf",
  sizeBytes: 217088,
  pageCount: 4,
  sha256: "9f".repeat(32),
  uploadedAt: "2026-10-26T09:00:00Z",
  uploadedBy: "Nadia Benali",
  retiredAt: null,
  signedCount: 12,
  ...over,
});

const renderCard = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ContractTemplateCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("ContractTemplateCard (26/10/2026, choix A « Mon PDF »)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("sans PDF : le modèle Plazo, puis le dépôt d'un PDF avec son titre", async () => {
    const none: ContractTemplates = {
      current: null,
      history: [],
      plazoSignedCount: 3,
    };
    api.getContractTemplate.mockResolvedValue(none);
    api.uploadContractTemplate.mockResolvedValue({
      current: template({ version: 1, signedCount: 0 }),
      history: [],
      plazoSignedCount: 3,
    });
    renderCard();
    expect(await screen.findByText("Modèle Plazo")).toBeInTheDocument();
    expect(
      screen.getByText("3 contrats signés sur le modèle Plazo"),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Titre du contrat (facultatif)"),
      "Contrat des Cèdres",
    );
    const file = new File(["%PDF-1.7"], "contrat cedres.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Choisir un PDF"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(api.uploadContractTemplate).toHaveBeenCalledWith(
        file,
        "Contrat des Cèdres",
      ),
    );
    expect(
      await screen.findByText("Contrat des Cèdres · version 1"),
    ).toBeInTheDocument();
    expect(screen.getByText("En vigueur")).toBeInTheDocument();
  });

  it("avec un PDF : version en vigueur, historique, « Remplacer » et « Revenir au modèle Plazo »", async () => {
    const data: ContractTemplates = {
      current: template(),
      history: [
        template({
          id: "t1",
          version: 1,
          retiredAt: "2026-10-26T09:00:00Z",
          uploadedAt: "2026-10-01T09:00:00Z",
          signedCount: 31,
        }),
      ],
      plazoSignedCount: 0,
    };
    api.getContractTemplate.mockResolvedValue(data);
    api.revertContractTemplate.mockResolvedValue({
      current: null,
      history: [data.current!, ...data.history],
      plazoSignedCount: 0,
    });
    renderCard();
    expect(
      await screen.findByText("Contrat des Cèdres · version 2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /contrat-cedres\.pdf · 4 pages · 212 Ko · déposé le 26 oct\. 2026 par Nadia Benali/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("12 contrats signés")).toBeInTheDocument();
    expect(
      screen.getByText(
        /v1 · Contrat des Cèdres · du 1 oct\. 2026 au 26 oct\. 2026/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remplacer" }),
    ).toBeInTheDocument();

    // A file too large never leaves the browser.
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "gros.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Choisir un PDF"), {
      target: { files: [big] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le PDF dépasse 4 Mo.",
    );
    expect(api.uploadContractTemplate).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Revenir au modèle Plazo" }),
    );
    await waitFor(() => expect(api.revertContractTemplate).toHaveBeenCalled());
    expect(await screen.findByText("Modèle Plazo")).toBeInTheDocument();
  });
});
