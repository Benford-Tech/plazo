import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { SubscriptionView } from "@/lib/api";
import SubscriptionPage from "./SubscriptionPage";

// 17/11/2026, « Branche stripe pour le paiement des abonnements plazo pro » (direction B, with the setup fee).
const api = vi.hoisted(() => ({
  getSubscription: vi.fn(),
  subscribe: vi.fn(),
  syncSubscription: vi.fn(),
  previewSubscriptionChange: vi.fn(),
  changeSubscription: vi.fn(),
  subscriptionPaymentMethod: vi.fn(),
  confirmSubscriptionPaymentMethod: vi.fn(),
  subscriptionInvoices: vi.fn(),
  cancelSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
// Stripe.js is never loaded in the tests: the form only has to appear.
vi.mock("@/components/subscription/StripeForm", () => ({
  StripeForm: ({ submitLabel }: { submitLabel: string }) => <div data-testid="stripe-form">{submitLabel}</div>,
}));

const plans: SubscriptionView["plans"] = [
  { id: "essentiel", name: "Essentiel", monthlyCents: 14900, yearlyCents: 160800 },
  { id: "operations", name: "Opérations", monthlyCents: 29900, yearlyCents: 322800 },
  { id: "complet", name: "Complet", monthlyCents: 39900, yearlyCents: 430800 },
];
const view = (over: Partial<SubscriptionView> = {}): SubscriptionView => ({
  available: true,
  refusal: null,
  publishableKey: "pk_test_x",
  vatPercent: 20,
  setupFeeCents: 29000,
  setupFeeDue: true,
  plans,
  subscription: null,
  ...over,
});
const running = (over: Partial<NonNullable<SubscriptionView["subscription"]>> = {}) =>
  view({
    setupFeeDue: false,
    subscription: {
      status: "active",
      running: true,
      plan: "operations",
      yearly: false,
      priceCents: 29900,
      currentPeriodEnd: "2026-12-17T10:00:00Z",
      cancelAtPeriodEnd: false,
      paymentMethod: { type: "card", brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 },
      lastPaymentError: null,
      ...over,
    },
  });

function renderPage(path = "/abonnement") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <SubscriptionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.subscriptionInvoices.mockResolvedValue({ data: [] });
});

describe("SubscriptionPage", () => {
  it("s'abonne avec la mise en route et la TVA, puis montre le paiement", async () => {
    api.getSubscription.mockResolvedValue(view());
    api.subscribe.mockResolvedValue({ clientSecret: "pi_secret", totalCents: 70680, taxCents: 11780, setupFeeCents: 29000 });
    renderPage("/abonnement?formule=operations");
    const checkout = await screen.findByTestId("subscription-checkout");
    expect(checkout).toHaveTextContent("Mise en route (une fois)");
    expect(checkout).toHaveTextContent("290,00 € HT");
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("706,80 €");
    await userEvent.click(screen.getByTestId("subscription-continue"));
    expect(api.subscribe).toHaveBeenCalledWith("operations", false);
    expect(await screen.findByTestId("stripe-form")).toHaveTextContent("Payer 706,80 € et m'abonner");
  });

  it("change de formule avec l'aperçu du prorata, et résilie", async () => {
    api.getSubscription.mockResolvedValue(running());
    api.previewSubscriptionChange.mockResolvedValue({ chargedNow: true, dueNowCents: 24000, nextCents: 47880, effectiveAt: null });
    api.changeSubscription.mockResolvedValue(running({ plan: "complet", priceCents: 39900 }));
    renderPage();
    expect(await screen.findByTestId("subscription-state")).toHaveTextContent("Prochain prélèvement le 17/12/2026");
    expect(within(screen.getByTestId("plan-operations")).getByText("Votre formule")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("choose-complet"));
    const change = await screen.findByTestId("subscription-change");
    await waitFor(() => expect(change).toHaveTextContent("240,00 €"));
    await userEvent.click(screen.getByTestId("subscription-confirm-change"));
    expect(api.changeSubscription).toHaveBeenCalledWith("complet", false);
    expect(screen.getByTestId("subscription-cancel")).toBeInTheDocument();
  });

  it("prévient d'un prélèvement refusé et ne propose rien sans paiement en ligne", async () => {
    api.getSubscription.mockResolvedValue(running({ status: "past_due", lastPaymentError: "payment_failed" }));
    const { unmount } = renderPage();
    expect(await screen.findByTestId("subscription-past-due")).toHaveTextContent("Le dernier prélèvement n'est pas passé");
    unmount();
    api.getSubscription.mockResolvedValue(view({ available: false, refusal: "unavailable", publishableKey: null }));
    renderPage();
    expect(await screen.findByTestId("subscription-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("choose-essentiel")).not.toBeInTheDocument();
  });
});
