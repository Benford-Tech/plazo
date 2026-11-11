import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { PlatformOperator, PlatformOperatorDetail, PlatformOverview } from "@/lib/types";
import PlatformOperatorPage from "./PlatformOperatorPage";
import PlatformOverviewPage from "./PlatformOverviewPage";

/** 11/11/2026 (« A avec la page loueur de C »): the cockpit and one operator's page. Fictional data only. */

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, startViewAs: vi.fn(), stopViewAs: vi.fn(), logout: vi.fn() }),
}));
const api = vi.hoisted(() => ({
  getPlatformOverview: vi.fn(),
  getPlatformOperator: vi.fn(),
  getPlatformOperators: vi.fn(),
  getOperatorContracts: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const operator = (over: Partial<PlatformOperator>): PlatformOperator => ({
  id: "o1",
  name: "Parking Exemple",
  status: "active",
  suspendedAt: null,
  archivedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  isPlatform: false,
  kind: "real",
  parkings: 1,
  places: 100,
  manager: { name: "Camille Exemple", email: "camille@example.com", emailVerified: true },
  listing: { id: "l1", status: "published" },
  payments: { connected: false, chargesEnabled: false, payoutsEnabled: false } as PlatformOperator["payments"],
  commissionBps: null,
  bookingsThisMonth: 94,
  contract: null,
  invitation: null,
  ...over,
});

const render_ = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/plateforme" element={<PlatformOverviewPage />} />
          <Route path="/plateforme/loueurs/:id" element={<PlatformOperatorPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

it("la vue d'ensemble : chiffres des vrais loueurs, « À traiter » et les loueurs par genre", async () => {
  const overview: PlatformOverview = {
    today: "2026-11-11",
    defaultCommissionBps: 1000,
    operators: { real: 1, realActive: 1, invitations: 0, other: 2, archived: 5 },
    bookingsThisMonth: { real: 94, other: 46 },
    plazoThisMonth: { bookings: 3, commissionCents: 1250 },
    todos: [
      { kind: "stripe_missing", operatorId: "o1", operatorName: "Parking Exemple" },
      { kind: "contract_missing", operatorId: "o1", operatorName: "Parking Exemple" },
    ],
    operatorsList: [operator({}), operator({ id: "o2", name: "Plazo (tests)", kind: "platform", bookingsThisMonth: 0 })],
  };
  api.getPlatformOverview.mockResolvedValue(overview);
  render_("/plateforme");
  expect(await screen.findByText("Mercredi 11 novembre · 3 loueurs, dont 2 de test ou de démo")).toBeInTheDocument();
  expect(screen.getByText("hors tests et démo (+ 46)")).toBeInTheDocument();
  expect(screen.getByText(/12,50/)).toBeInTheDocument();
  const todos = screen.getByTestId("platform-todos");
  expect(within(todos).getByText("Parking Exemple n'a pas relié son compte Stripe : ses reversements attendent")).toBeInTheDocument();
  expect(within(todos).getByText("Déposer le PDF ›").closest("a")).toHaveAttribute("href", "/plateforme/loueurs/o1?onglet=contrat");
  expect(screen.getByRole("link", { name: "Parking Exemple" })).toHaveAttribute("href", "/plateforme/loueurs/o1");
  expect(screen.queryByText("Plazo (tests)")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Tests et démo · 2" }));
  expect(screen.getByText("Plazo (tests)")).toBeInTheDocument();
  expect(screen.getByText("Votre compte")).toBeInTheDocument();
});

it("la page d'un loueur : bandeau, tuiles, activité, journal ; l'onglet Équipe", async () => {
  const detail: PlatformOperatorDetail = {
    ...operator({}),
    listingDetail: { title: "Parking Exemple", slug: "parking-exemple", submittedAt: null, reviewedAt: null, reviewMessage: null, airport: { slug: "lyon-saint-exupery", name: "Lyon Saint-Exupéry" } },
    activity: { bookingsThisMonth: 94, plazoBookingsThisMonth: 3, inboxToCheck: 2, failedPayouts: 0 },
    team: [{ id: "s1", name: "Camille Exemple", email: "camille@example.com", role: "manager", isActive: true, createdAt: "2026-10-01T00:00:00Z" }],
    journal: [{ id: "a1", action: "operator.commission_changed", at: "2026-11-10T09:00:00Z", by: "Joanny" }],
  };
  api.getPlatformOperator.mockResolvedValue(detail);
  api.getPlatformOperators.mockResolvedValue({ defaultCommissionBps: 1000, operators: [] });
  render_("/plateforme/loueurs/o1");
  expect(await screen.findByRole("heading", { name: "Parking Exemple" })).toBeInTheDocument();
  expect(screen.getByText("Lyon Saint-Exupéry · 100 places")).toBeInTheDocument();
  expect(screen.getByText("Actif")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Ouvrir son espace/ })).toBeInTheDocument();
  expect(screen.getByText(/Commission changée/)).toBeInTheDocument();
  expect(screen.getByText("Zone sensible")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Équipe" }));
  expect(screen.getByText("camille@example.com", { selector: "span" })).toBeInTheDocument();
  expect(screen.getByText("Gérant")).toBeInTheDocument();
});
