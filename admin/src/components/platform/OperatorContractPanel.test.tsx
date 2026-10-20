import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PartnerContract, PlatformOperator } from "@/lib/types";
import { OperatorContractPanel } from "./OperatorContractPanel";

const api = vi.hoisted(() => ({
  getOperatorContracts: vi.fn(),
  uploadOperatorContract: vi.fn(),
  remindOperatorContract: vi.fn(),
  removeOperatorContract: vi.fn(),
  operatorContractFile: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const operator = { id: "op1", name: "Parking Alpha", contract: { status: "pending", version: 2 } } as PlatformOperator;
const contract = (over: Partial<PartnerContract>): PartnerContract => ({
  id: "c2",
  version: 2,
  title: "Contrat de partenariat Plazo",
  fileName: "contrat-alpha.pdf",
  sizeBytes: 219000,
  sha256: "a".repeat(64),
  status: "pending",
  uploadedAt: "2026-10-20T08:12:00Z",
  uploadedBy: "Joanny Simpore",
  notifiedAt: "2026-10-20T08:12:00Z",
  signedAt: null,
  signer: null,
  signerIp: null,
  signedSha256: null,
  ...over,
});

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OperatorContractPanel operator={operator} />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("Plateforme › contrat d'un loueur", () => {
  it("montre la version en attente, l'historique, renvoie l'e-mail et dépose un nouveau PDF", async () => {
    api.getOperatorContracts.mockResolvedValue({
      contracts: [
        contract({}),
        contract({ id: "c1", version: 1, status: "signed", signedAt: "2026-10-02T14:40:00Z", signer: { name: "Malik Dubois", email: null } }),
      ],
    });
    api.remindOperatorContract.mockResolvedValue(contract({}));
    api.uploadOperatorContract.mockResolvedValue(contract({ id: "c3", version: 3 }));
    renderPanel();

    expect(await screen.findByText("En attente de signature")).toBeInTheDocument();
    expect(screen.getByText(/v1 signée par Malik Dubois/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Renvoyer l'e-mail" }));
    await waitFor(() => expect(api.remindOperatorContract).toHaveBeenCalledWith("op1", "c2"));

    await userEvent.type(screen.getByLabelText("Titre (facultatif)"), "Contrat 2027");
    const file = new File(["%PDF-1.7"], "contrat.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choisir un PDF"), { target: { files: [file] } });
    await waitFor(() => expect(api.uploadOperatorContract).toHaveBeenCalledWith("op1", file, "Contrat 2027"));
  });

  it("refuse un fichier trop lourd ou qui n'est pas un PDF sans l'envoyer", async () => {
    api.getOperatorContracts.mockResolvedValue({ contracts: [] });
    renderPanel();
    expect(await screen.findByText("Aucun contrat déposé pour ce loueur.")).toBeInTheDocument();
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "gros.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choisir un PDF"), { target: { files: [big] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Le PDF dépasse 4 Mo.");
    fireEvent.change(screen.getByLabelText("Choisir un PDF"), { target: { files: [new File(["x"], "photo.png", { type: "image/png" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Ce fichier n'est pas un PDF.");
    expect(api.uploadOperatorContract).not.toHaveBeenCalled();
  });
});
