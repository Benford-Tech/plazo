import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api";
import type { BillingSettings } from "@/lib/types";
import { BillingSettingsCard } from "./BillingSettingsCard";

const api = vi.hoisted(() => ({ billingSettings: vi.fn(), updateBillingSettings: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const auth = vi.hoisted(() => ({ demo: null as null | { resetsAt: string } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "s1", role: "manager", demo: auth.demo } }) }));

const empty: BillingSettings = {
  tradeName: "Parking des Cèdres",
  legalName: null,
  address: null,
  parkingAddress: "12 route de l'Aéroport, 69125 Colombier-Saugnieu",
  siret: null,
  vatNumber: null,
  vatExempt: false,
  vatRatePercent: 20,
  mention: null,
  prefix: "F",
  hasLogo: true,
  complete: false,
  missing: ["legalName", "siret", "vatNumber"],
  issuedCount: 0,
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BillingSettingsCard />
    </QueryClientProvider>,
  );

// 06/11/2026 (« une facture au nom du parking avec son logo », direction A).
describe("BillingSettingsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.demo = null;
  });

  it("dit ce qui manque, enregistre et montre l'erreur d'un champ", async () => {
    api.billingSettings.mockResolvedValue(empty);
    api.updateBillingSettings.mockRejectedValueOnce(new ApiError(400, "Invalid", "validation_failed", { siret: "invalid" }));
    api.updateBillingSettings.mockResolvedValueOnce({ ...empty, legalName: "SAS Parking des Cèdres", siret: "12345678900012", vatNumber: "FR12123456789", complete: true, missing: [] });
    renderCard();
    expect(await screen.findByTestId("billing-state")).toHaveTextContent("À compléter : raison sociale, SIRET, n° de TVA.");
    fireEvent.change(screen.getByLabelText("Raison sociale"), { target: { value: "SAS Parking des Cèdres" } });
    fireEvent.change(screen.getByLabelText("SIRET"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("N° de TVA intracommunautaire"), { target: { value: "FR12123456789" } });
    fireEvent.click(screen.getByText("Enregistrer"));
    expect(await screen.findByText("Le SIRET compte 14 chiffres.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("SIRET"), { target: { value: "123 456 789 00012" } });
    fireEvent.click(screen.getByText("Enregistrer"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Informations de facturation enregistrées."));
    expect(api.updateBillingSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ legalName: "SAS Parking des Cèdres", siret: "123 456 789 00012", vatRatePercent: 20, prefix: "F" }),
    );
    expect(screen.getByTestId("billing-state")).toHaveTextContent("Complet");
    expect(screen.getByLabelText("SIRET")).toHaveValue("123 456 789 00012");
  });

  it("cache la TVA pour une micro-entreprise et reste en lecture seule dans la démo", async () => {
    auth.demo = { resetsAt: "2026-11-07T01:00:00Z" };
    api.billingSettings.mockResolvedValue(empty);
    renderCard();
    await screen.findByTestId("billing-state");
    expect(screen.queryByText("Enregistrer")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Raison sociale")).toBeDisabled();
  });
});
