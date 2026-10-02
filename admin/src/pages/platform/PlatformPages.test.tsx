import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import type { PlatformListing, PlatformOperator, Staff } from "@/lib/types";
import ListingsPage from "./ListingsPage";
import OperatorsPage from "./OperatorsPage";
import PaymentsPage from "./PaymentsPage";
import PlatformReservationsPage from "./PlatformReservationsPage";

const auth = vi.hoisted(() => ({ user: null as Staff | null, startViewAs: vi.fn(), stopViewAs: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: auth.user,
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    startViewAs: auth.startViewAs,
    stopViewAs: auth.stopViewAs,
  }),
}));
const api = vi.hoisted(() => ({
  getPlatformOperators: vi.fn(),
  setCommission: vi.fn(),
  suspendOperator: vi.fn(),
  reactivateOperator: vi.fn(),
  inviteOperator: vi.fn(),
  resendInvitation: vi.fn(),
  getPlatformListings: vi.fn(),
  approveListing: vi.fn(),
  rejectListing: vi.fn(),
  unpublishListing: vi.fn(),
  getPlatformReservations: vi.fn(),
  getPlatformPayments: vi.fn(),
  retryPayout: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const admin: Staff = {
  id: "s1",
  operatorId: "o0",
  email: "joanny@example.com",
  name: "Joanny",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "Plazo (tests)",
  isPlatformAdmin: true,
  emailVerified: true,
  viewAs: null,
};

const operator = (overrides: Partial<PlatformOperator>): PlatformOperator => ({
  id: "o1",
  name: "Parking Démo LYS",
  status: "active",
  suspendedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  isPlatform: false,
  parkings: 1,
  places: 300,
  manager: { name: "J. Dupont", email: "j.dupont@example.com", emailVerified: true },
  listing: { id: "l1", status: "published" },
  payments: { connected: true, chargesEnabled: true, payoutsEnabled: true },
  commissionBps: 1200,
  bookingsThisMonth: 48,
  invitation: null,
  ...overrides,
});

const operators = {
  defaultCommissionBps: 1200,
  operators: [
    operator({}),
    operator({ id: "o2", name: "Allo Park Lyon", listing: { id: "l2", status: "pending_review" }, payments: { connected: true, chargesEnabled: false, payoutsEnabled: false }, bookingsThisMonth: 0 }),
    operator({
      id: "o3",
      name: "Parking Invité",
      listing: null,
      manager: { name: "Parking Invité", email: "m.martin@example.com", emailVerified: false },
      invitation: { sentAt: "2026-10-02T08:00:00Z", expiresAt: "2026-10-09T08:00:00Z", expired: false },
    }),
  ],
};

function renderAt(path: string, element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset());
  auth.startViewAs.mockReset();
  auth.stopViewAs.mockReset();
  auth.user = admin;
});

describe("Loueurs", () => {
  it("liste les loueurs avec leur annonce, leurs paiements, leur commission et l'invitation en attente", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    const demo = (await screen.findByText("Parking Démo LYS")).closest("tr")!;
    expect(within(demo).getByText("1 parking · 300 places")).toBeInTheDocument();
    expect(within(demo).getByText("Publiée")).toBeInTheDocument();
    expect(within(demo).getByText("Actifs")).toBeInTheDocument();
    expect(within(demo).getByText("12 %")).toBeInTheDocument();
    expect(within(demo).getByText("48")).toBeInTheDocument();
    const allo = screen.getByText("Allo Park Lyon").closest("tr")!;
    expect(within(allo).getByText("À valider")).toBeInTheDocument();
    expect(within(allo).getByText("À activer")).toBeInTheDocument();
    const invited = screen.getByText("Parking Invité").closest("tr")!;
    expect(within(invited).getByText(/invitation envoyée le 2 oct/)).toBeInTheDocument();
    expect(within(invited).getByRole("button", { name: "Renvoyer l'invitation" })).toBeInTheDocument();
    expect(within(invited).queryByRole("button", { name: "Ouvrir son espace ›" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Commission (par défaut 12 %)")).toBeInTheDocument();
  });

  it("ouvre l'espace d'un loueur, le suspend et règle sa commission", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.suspendOperator.mockResolvedValue({ data: {} });
    api.setCommission.mockResolvedValue({ data: {} });
    auth.startViewAs.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    const demo = (await screen.findByText("Parking Démo LYS")).closest("tr")!;
    await userEvent.click(within(demo).getByRole("button", { name: "Suspendre" }));
    await waitFor(() => expect(api.suspendOperator).toHaveBeenCalledWith("o1"));

    await userEvent.click(within(demo).getByRole("button", { name: "Modifier la commission de Parking Démo LYS" }));
    const input = within(demo).getByLabelText("Commission (%)");
    await userEvent.clear(input);
    await userEvent.type(input, "12,5");
    await userEvent.click(within(demo).getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.setCommission).toHaveBeenCalledWith("o1", 1250));

    await userEvent.click(within(demo).getByRole("button", { name: "Ouvrir son espace ›" }));
    await waitFor(() => expect(auth.startViewAs).toHaveBeenCalledWith("o1"));
  });

  it("invite un loueur et montre une seule fois le lien quand l'email ne peut pas partir", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.inviteOperator.mockResolvedValue({ operator: { id: "o4", name: "Nouveau" }, emailSent: false, expiresAt: "2026-10-09", inviteUrl: "https://plazo.example/pro/invitation#abc" });
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    await screen.findByText("Parking Démo LYS");
    await userEvent.type(screen.getByLabelText("Nom de l'entreprise / du parking"), "Nouveau");
    await userEvent.type(screen.getByLabelText("Email du gérant"), "nouveau@example.com");
    await userEvent.type(screen.getByLabelText("Capacité (places)"), "150");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer l'invitation" }));
    await waitFor(() =>
      expect(api.inviteOperator).toHaveBeenCalledWith({ operatorName: "Nouveau", managerEmail: "nouveau@example.com", totalCapacity: 150, commissionBps: null }),
    );
    expect(await screen.findByDisplayValue("https://plazo.example/pro/invitation#abc")).toBeInTheDocument();
    expect(screen.getByText(/il ne sera plus affiché/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByDisplayValue("https://plazo.example/pro/invitation#abc")).not.toBeInTheDocument();
  });
});

const listing: PlatformListing = {
  id: "l2",
  slug: "allo-park",
  status: "pending_review",
  title: "Allo Park Lyon",
  description: "Parking clôturé.",
  services: ["shuttle", "fenced"],
  shuttleMinutes: 7,
  distanceKm: 4,
  openingHours: "24h/24",
  contactPhone: null,
  cancellationPolicy: "free_24h",
  photos: [],
  reviewMessage: null,
  submittedAt: "2026-10-02T09:00:00Z",
  reviewedAt: null,
  updatedAt: "2026-10-02T09:00:00Z",
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" },
  parking: { id: "p2", name: "Allo Park", address: "1 rue de l'Aéroport", totalCapacity: 450 },
  operator: { id: "o2", name: "Allo Park Lyon SARL", status: "active" },
  pricingTiers: [{ days: 3, priceCents: 3499 }],
  fromPriceCents: 3499,
};

describe("Annonces", () => {
  it("montre la file « À valider » avec l'aperçu, et valide", async () => {
    api.getPlatformListings.mockResolvedValue({ counts: { pending_review: 1, published: 3, rejected: 0, draft: 2 }, listings: [listing] });
    api.approveListing.mockResolvedValue({ data: {} });
    renderAt("/plateforme/annonces", <ListingsPage />);

    expect((await screen.findAllByText("Allo Park Lyon")).length).toBeGreaterThan(0);
    expect(api.getPlatformListings).toHaveBeenCalledWith("pending_review");
    expect(screen.getByRole("button", { name: /À valider/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Parking clôturé.")).toBeInTheDocument();
    expect(screen.getByText("dès 34,99 €")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));
    await waitFor(() => expect(api.approveListing).toHaveBeenCalledWith("l2"));
  });

  it("exige un message pour refuser", async () => {
    api.getPlatformListings.mockResolvedValue({ counts: { pending_review: 1, published: 0, rejected: 0, draft: 0 }, listings: [listing] });
    api.rejectListing.mockResolvedValue({ data: {} });
    renderAt("/plateforme/annonces", <ListingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Refuser" }));
    const confirm = screen.getByRole("button", { name: "Refuser l'annonce" });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Message au loueur (obligatoire)"), "Ajoutez une photo.");
    await userEvent.click(confirm);
    await waitFor(() => expect(api.rejectListing).toHaveBeenCalledWith("l2", "Ajoutez une photo."));
  });

  it("dépublie une annonce publiée, message facultatif", async () => {
    api.getPlatformListings.mockResolvedValue({ counts: { pending_review: 0, published: 1, rejected: 0, draft: 0 }, listings: [{ ...listing, status: "published" }] });
    api.unpublishListing.mockResolvedValue({ data: {} });
    renderAt("/plateforme/annonces?statut=published", <ListingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Dépublier" }));
    await userEvent.click(screen.getByRole("button", { name: "Dépublier l'annonce" }));
    await waitFor(() => expect(api.unpublishListing).toHaveBeenCalledWith("l2", undefined));
    expect(api.getPlatformListings).toHaveBeenCalledWith("published");
  });
});

describe("Réservations et paiements", () => {
  it("liste les réservations sans coordonnées et filtre par loueur", async () => {
    api.getPlatformReservations.mockResolvedValue({
      docs: [
        {
          id: "r1",
          reference: "PLZ7K2",
          status: "upcoming",
          channel: "plazo",
          channelDetail: null,
          arrivalAt: "2026-10-04T04:30:00Z",
          returnAt: "2026-10-11T13:05:00Z",
          createdAt: "2026-10-01T10:00:00Z",
          plate: "GK-318-PX",
          amountCents: 5900,
          paymentStatus: "paid",
          operator: { id: "o1", name: "Parking Démo LYS" },
          parking: { name: "Parking Démo" },
        },
      ],
      totalDocs: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      operators: [{ id: "o1", name: "Parking Démo LYS" }],
    });
    renderAt("/plateforme/reservations", <PlatformReservationsPage />);

    expect(await screen.findByText("PLZ7K2")).toBeInTheDocument();
    expect(screen.getByText("GK-318-PX")).toBeInTheDocument();
    expect(screen.getByText("59,00 €")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Loueur"), "o1");
    await waitFor(() => expect(api.getPlatformReservations).toHaveBeenLastCalledWith({ operatorId: "o1", from: "", to: "", page: 1 }));
  });

  it("relance un reversement en échec", async () => {
    api.getPlatformPayments.mockResolvedValue({
      paymentsEnabled: true,
      operators: [
        {
          id: "o1",
          name: "Parking Démo LYS",
          status: "active",
          stripe: { connected: true, chargesEnabled: true, payoutsEnabled: true },
          payoutSchedule: "AFTER_STAY",
          commissionBps: 1200,
          pending: { count: 2, amountCents: 8800 },
          failed: [{ reservationId: "r9", reference: "FAIL01", amountCents: 4400, arrivalAt: "2026-09-01T08:00:00Z", returnAt: "2026-09-03T08:00:00Z" }],
        },
      ],
    });
    api.retryPayout.mockResolvedValue({ result: "transferred", payoutStatus: "transferred" });
    renderAt("/plateforme/paiements", <PaymentsPage />);

    expect(await screen.findByText("Virements actifs")).toBeInTheDocument();
    expect(screen.getByText("Le lendemain du séjour")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Relancer" }));
    await waitFor(() => expect(api.retryPayout).toHaveBeenCalledWith("r9"));
  });
});

describe("bandeau « Vous consultez l'espace de … »", () => {
  it("s'affiche en consultation et ramène à la plateforme", async () => {
    auth.user = { ...admin, operatorId: "o1", operatorName: "Parking Démo LYS", viewAs: { operatorId: "o1", operatorName: "Parking Démo LYS" } };
    auth.stopViewAs.mockResolvedValue(undefined);
    renderAt("/", <AdminLayout />);

    expect(screen.getByText("Vous consultez l'espace de Parking Démo LYS")).toBeInTheDocument();
    // No link to the platform space from inside the operator's: the banner leads back.
    expect(screen.queryByRole("link", { name: "Plateforme" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Revenir à la plateforme" }));
    await waitFor(() => expect(auth.stopViewAs).toHaveBeenCalled());
  });

  it("n'apparaît pas hors consultation", () => {
    renderAt("/", <AdminLayout />);
    expect(screen.queryByText(/Vous consultez l'espace de/)).not.toBeInTheDocument();
  });
});
