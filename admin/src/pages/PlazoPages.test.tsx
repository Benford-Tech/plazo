import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@/lib/api";
import ListingPage from "./ListingPage";
import PricingPage from "./PricingPage";

const api = vi.hoisted(() => ({
  getListing: vi.fn(),
  updateListing: vi.fn(),
  getPricing: vi.fn(),
  updatePricing: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});

const pricing = { tiers: [{ days: 3, priceCents: 3499 }, { days: 8, priceCents: 5500 }], extraDayPriceCents: 600, commissionBps: 1200 };
const parking = { id: "p1", name: "Parking Démo LYS", address: null, shuttleTravelMinutes: 8 };

function renderPage(page: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{page}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Mes tarifs", () => {
  beforeEach(() => Object.values(api).forEach(f => f.mockReset()));

  it("simule le prix payé et enregistre la grille triée", async () => {
    api.getPricing.mockResolvedValue(pricing);
    api.updatePricing.mockResolvedValue({ data: pricing });
    renderPage(<PricingPage />);

    expect(await screen.findByTestId("sim-2")).toHaveTextContent("Forfait 3 jours");
    expect(screen.getByTestId("sim-10")).toHaveTextContent("8 jours + 2 ×");
    expect(screen.getByText(/commission \(12 %\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Ajouter un forfait" }));
    const price = screen.getByLabelText("Prix tout compris 3");
    await userEvent.type(price, "abc");
    expect(screen.getByText("Prix invalide (ex. 34,99).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer les tarifs" })).toBeDisabled();
    expect(screen.getByText("Modifié · non enregistré")).toBeInTheDocument();

    fireEvent.change(price, { target: { value: "79" } });
    fireEvent.change(screen.getByLabelText("Durée 1"), { target: { value: "15" } });
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer les tarifs" }));
    await waitFor(() =>
      expect(api.updatePricing).toHaveBeenCalledWith(
        [
          { days: 8, priceCents: 5500 },
          { days: 9, priceCents: 7900 },
          { days: 15, priceCents: 3499 },
        ],
        600,
      ),
    );
  });
});

describe("Ma fiche", () => {
  beforeEach(() => Object.values(api).forEach(f => f.mockReset()));

  it("préremplit une première fiche et met à jour l'aperçu", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue(pricing);
    renderPage(<ListingPage />);

    expect(await screen.findByLabelText("Nom affiché")).toHaveValue("Parking Démo LYS");
    expect(screen.getByLabelText("Adresse de la page")).toHaveValue("parking-demo-lys");
    expect(await screen.findByText("dès 34,99 €")).toBeInTheDocument();
    expect(screen.getByText(/Navette 8 min/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voiturier" }));
    expect(screen.getByText(/Voiturier/, { selector: "div" })).toBeInTheDocument();
  });

  it("envoie la fiche et explique le refus de mise en ligne sans tarifs", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue({ ...pricing, tiers: [] });
    api.updateListing.mockRejectedValue(new ApiError(400, "Set prices before publishing", "pricing_required"));
    renderPage(<ListingPage />);

    await screen.findByLabelText("Nom affiché");
    fireEvent.change(screen.getByLabelText("Distance (km)"), { target: { value: "3,5" } });
    await userEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(api.updateListing).toHaveBeenCalled());
    expect(api.updateListing.mock.calls[0][0]).toMatchObject({
      airportCode: "LYS",
      slug: "parking-demo-lys",
      services: ["shuttle"],
      shuttleMinutes: 8,
      distanceKm: 3.5,
      cancellationPolicy: "free_24h",
      published: true,
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });
});
