import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { PartnerContract } from "@/lib/types";
import ContractPage from "./ContractPage";

const auth = vi.hoisted(() => ({ user: { name: "Malik Dubois", operatorName: "Parking Alpha", role: "manager" as const } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
const api = vi.hoisted(() => ({ getMyContract: vi.fn(), signMyContract: vi.fn(), myContractFile: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

// 20/10/2026, « Pouvoir stocker le contrat à faire signer » (choice 2a).
const contract = (over: Partial<PartnerContract> = {}): PartnerContract => ({
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ContractPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.URL.createObjectURL = vi.fn(() => "blob:pdf");
  globalThis.URL.revokeObjectURL = vi.fn();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  api.myContractFile.mockResolvedValue({ blob: new Blob(["%PDF-1.7"]), filename: "contrat-alpha.pdf" });
});

describe("Mon contrat", () => {
  it("fait signer le contrat en attente : nom complet et « Lu et approuvé »", async () => {
    api.getMyContract.mockResolvedValue({ current: contract(), history: [], canSign: true });
    const signed = contract({
      status: "signed",
      signedAt: "2026-10-20T08:42:07Z",
      signer: { name: "Malik Dubois", email: "malik@example.com" },
      signerIp: "203.0.113.24",
      signedSha256: "b".repeat(64),
    });
    api.signMyContract.mockResolvedValue({ current: signed, history: [], canSign: false });
    renderPage();

    const button = await screen.findByRole("button", { name: "Signer le contrat" });
    expect(screen.getByLabelText("Votre nom complet, comme signature")).toHaveValue("Malik Dubois");
    expect(button).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(button);
    // The confirmation (native fallback without a provider in this test).
    await waitFor(() => expect(api.signMyContract).toHaveBeenCalledWith("c2", "Malik Dubois"));
    expect(await screen.findByText("Signé")).toBeInTheDocument();
    expect(screen.getByText("203.0.113.24")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Télécharger la preuve de signature" })).toBeInTheDocument();
  });

  it("refuse un nom sans prénom avant d'appeler l'API", async () => {
    api.getMyContract.mockResolvedValue({ current: contract(), history: [], canSign: true });
    renderPage();
    const input = await screen.findByLabelText("Votre nom complet, comme signature");
    await userEvent.clear(input);
    await userEvent.type(input, "Malik");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Signer le contrat" }));
    expect(screen.getByText("Tapez votre prénom et votre nom.")).toBeInTheDocument();
    expect(api.signMyContract).not.toHaveBeenCalled();
  });

  it("en consultation, la plateforme lit sans pouvoir signer", async () => {
    api.getMyContract.mockResolvedValue({ current: contract(), history: [], canSign: false });
    renderPage();
    expect(await screen.findByText(/la plateforme lit le contrat mais ne le signe pas/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("sans contrat déposé, le dit simplement", async () => {
    api.getMyContract.mockResolvedValue({ current: null, history: [], canSign: false });
    renderPage();
    expect(await screen.findByText(/n'a pas encore déposé de contrat/)).toBeInTheDocument();
  });

  it("13/11/2026 : montre les formules à 99, 199 et 299 €, l'annuel et le calcul sur ses chiffres", async () => {
    api.getMyContract.mockResolvedValue({ current: null, history: [], canSign: true });
    renderPage();
    const plans = await screen.findByTestId("plazo-plans");
    expect(within(plans).getByTestId("price-essentiel")).toHaveTextContent("99 €");
    expect(within(plans).getByTestId("price-operations")).toHaveTextContent("199 €");
    expect(within(plans).getByTestId("price-complet")).toHaveTextContent("299 €");
    await userEvent.click(within(plans).getByTestId("plans-yearly"));
    expect(within(plans).getByTestId("price-operations")).toHaveTextContent("179 €");
    const ask = within(screen.getByTestId("plan-complet")).getByRole("link", { name: "Demander cette formule" });
    expect(ask.getAttribute("href")).toMatch(/^mailto:contact@plazo\.fr\?subject=Formule%20Complet/);
    // 400 bookings × 3 min + 15 calls × 30 days × 2 min = 35 h at 18 € = 630 €, less 179 € (Opérations, yearly).
    expect(screen.getByTestId("calc-net")).toHaveTextContent("+ 451 €");
    fireEvent.change(screen.getByRole("slider", { name: /Réservations par mois/ }), { target: { value: "100" } });
    expect(screen.getByTestId("calc-net")).toHaveTextContent("+ 181 €");
  });
});
