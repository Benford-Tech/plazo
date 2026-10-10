import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { ApiError } from "@/lib/api";
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
  archiveOperator: vi.fn(),
  unarchiveOperator: vi.fn(),
  getOperatorDeletion: vi.fn(),
  deleteOperator: vi.fn(),
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
    operator({ id: "o2", name: "Allo Park Lyon", isDemo: true, listing: { id: "l2", status: "pending_review" }, payments: { connected: true, chargesEnabled: false, payoutsEnabled: false }, bookingsThisMonth: 0 }),
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
    expect(within(demo).queryByText("Démo")).not.toBeInTheDocument();
    const allo = screen.getByText("Allo Park Lyon").closest("tr")!;
    expect(within(allo).getByText("À valider")).toBeInTheDocument();
    expect(within(allo).getByText("Démo")).toBeInTheDocument();
    expect(within(allo).getByText("À activer")).toBeInTheDocument();
    const invited = screen.getByText("Parking Invité").closest("tr")!;
    expect(within(invited).getByText(/invitation envoyée le 2 oct/)).toBeInTheDocument();
    expect(within(invited).getByRole("button", { name: "Renvoyer l'invitation" })).toBeInTheDocument();
    // 09/10/2026: its space can be opened to prepare the parking before the manager accepts.
    expect(within(invited).getByRole("button", { name: "Ouvrir son espace ›" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Commission (par défaut 12 %)")).toBeInTheDocument();
  });

  it("ouvre l'espace d'un loueur invité pour préparer son parking, et montre la fiche préparée", async () => {
    const invitedWithDraft = operator({
      id: "o3",
      name: "Parking Invité",
      listing: { id: "l3", status: "draft" },
      manager: { name: "Parking Invité", email: "m.martin@example.com", emailVerified: false },
      invitation: { sentAt: "2026-10-02T08:00:00Z", expiresAt: "2026-10-09T08:00:00Z", expired: false },
    });
    api.getPlatformOperators.mockResolvedValue({ ...operators, operators: [invitedWithDraft] });
    auth.startViewAs.mockResolvedValue(undefined);
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    const invited = (await screen.findByText("Parking Invité")).closest("tr")!;
    expect(within(invited).getByText("Brouillon")).toBeInTheDocument();
    await userEvent.click(within(invited).getByRole("button", { name: "Ouvrir son espace ›" }));
    await waitFor(() => expect(auth.startViewAs).toHaveBeenCalledWith("o3"));
  });

  it("supprime un loueur invité par erreur après avoir dit ce qui part ; refuse avec la raison du serveur", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.getOperatorDeletion.mockResolvedValue({
      data: { id: "o3", name: "Parking Invité", deletable: true, reason: null, counts: { parkings: 1, listings: 0, reservations: 2, staff: 1, paidReservations: 0 } },
    });
    api.deleteOperator.mockResolvedValue({ data: { id: "o3", name: "Parking Invité" } });
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { toast } = await import("sonner");
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    // An active operator in use has no « Supprimer »: suspend it first.
    const demo = (await screen.findByText("Parking Démo LYS")).closest("tr")!;
    expect(within(demo).queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();

    // Cancelled: nothing goes.
    const invited = screen.getByText("Parking Invité").closest("tr")!;
    await userEvent.click(within(invited).getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
    expect(api.getOperatorDeletion).toHaveBeenCalledWith("o3");
    expect(api.deleteOperator).not.toHaveBeenCalled();
    // No listing yet, and an invitation cannot be archived: neither is announced.
    expect(ask.mock.calls[0][0]).toBe(
      "Parking Invité sera effacé avec son parking, ses 2 réservations et le compte de son gérant. Cette action est définitive.",
    );

    ask.mockReturnValue(true);
    const listCalls = api.getPlatformOperators.mock.calls.length;
    await userEvent.click(within(invited).getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(api.deleteOperator).toHaveBeenCalledWith("o3"));
    expect(toast.success).toHaveBeenCalledWith("Parking Invité est supprimé.");
    await waitFor(() => expect(api.getPlatformOperators.mock.calls.length).toBeGreaterThan(listCalls));

    api.deleteOperator.mockClear();
    api.getOperatorDeletion.mockResolvedValue({
      data: { id: "o3", name: "Parking Invité", deletable: false, reason: "has_payments", counts: { parkings: 1, reservations: 2, staff: 1, paidReservations: 1 } },
    });
    await userEvent.click(within(invited).getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Suspendez-le puis archivez-le")));
    expect(api.deleteOperator).not.toHaveBeenCalled();
  });

  it("propose « Supprimer » sur un loueur suspendu ou archivé, avec le bon conseil (09/10/2026)", async () => {
    api.getPlatformOperators.mockImplementation(async (view?: string) =>
      view === "archived"
        ? { defaultCommissionBps: 1200, counts: { current: 2, archived: 1 }, operators: [operator({ id: "o9", name: "Ancien Parking", status: "suspended", suspendedAt: "2026-10-05T08:00:00Z", archivedAt: "2026-10-09T08:00:00Z" })] }
        : { ...operators, counts: { current: 2, archived: 1 }, operators: [operator({}), operator({ id: "o2", name: "Allo Park Lyon", status: "suspended", suspendedAt: "2026-10-08T08:00:00Z" })] },
    );
    api.getOperatorDeletion.mockResolvedValue({
      data: { id: "o2", name: "Allo Park Lyon", deletable: true, reason: null, counts: { parkings: 1, listings: 1, reservations: 0, staff: 3, paidReservations: 0 } },
    });
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { toast } = await import("sonner");
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    const suspended = (await screen.findByText("Allo Park Lyon")).closest("tr")!;
    await userEvent.click(within(suspended).getByRole("button", { name: "Supprimer" }));
    await waitFor(() =>
      expect(ask).toHaveBeenCalledWith(
        "Allo Park Lyon sera effacé avec son parking, sa fiche, ses tarifs et les 3 comptes de son équipe. Cette action est définitive : pour le garder sans qu'il apparaisse, archivez-le.",
      ),
    );

    // Already archived, kept for its payments: no advice to archive it again.
    api.getOperatorDeletion.mockResolvedValue({
      data: { id: "o9", name: "Ancien Parking", deletable: false, reason: "has_payments", counts: { parkings: 1, listings: 1, reservations: 4, staff: 1, paidReservations: 4 } },
    });
    await userEvent.click(within(screen.getByRole("group", { name: "Afficher" })).getByRole("button", { name: /Archivés/ }));
    const archived = (await screen.findByText("Ancien Parking")).closest("tr")!;
    await userEvent.click(within(archived).getByRole("button", { name: "Supprimer" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Ce loueur a reçu des paiements en ligne : il reste archivé pour la comptabilité et ne peut pas être supprimé.",
      ),
    );
    expect(api.deleteOperator).not.toHaveBeenCalled();
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

  it("archive un loueur suspendu et le retrouve sous « Archivés » (09/10/2026)", async () => {
    api.getPlatformOperators.mockImplementation(async (view?: string) =>
      view === "archived"
        ? { defaultCommissionBps: 1200, counts: { current: 2, archived: 1 }, operators: [operator({ id: "o9", name: "Ancien Parking", status: "suspended", suspendedAt: "2026-10-05T08:00:00Z", archivedAt: "2026-10-09T08:00:00Z" })] }
        : { ...operators, counts: { current: 2, archived: 1 }, operators: [operator({}), operator({ id: "o2", name: "Allo Park Lyon", status: "suspended", suspendedAt: "2026-10-08T08:00:00Z" })] },
    );
    api.archiveOperator.mockResolvedValue({ data: {} });
    api.unarchiveOperator.mockResolvedValue({ data: {} });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    // Only a suspended operator offers « Archiver ».
    const active = (await screen.findByText("Parking Démo LYS")).closest("tr")!;
    const views = screen.getByRole("group", { name: "Afficher" });
    expect(within(views).getByRole("button", { name: /Loueurs/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(views).getByRole("button", { name: /Archivés/ })).toHaveTextContent("Archivés1");
    expect(within(active).queryByRole("button", { name: "Archiver" })).not.toBeInTheDocument();
    const suspended = screen.getByText("Allo Park Lyon").closest("tr")!;
    await userEvent.click(within(suspended).getByRole("button", { name: "Archiver" }));
    await waitFor(() => expect(api.archiveOperator).toHaveBeenCalledWith("o2"));

    await userEvent.click(within(views).getByRole("button", { name: /Archivés/ }));
    const archived = (await screen.findByText("Ancien Parking")).closest("tr")!;
    expect(api.getPlatformOperators).toHaveBeenLastCalledWith("archived");
    expect(within(archived).getByText("Archivé")).toBeInTheDocument();
    expect(within(archived).getByText("archivé le 9 oct.")).toBeInTheDocument();
    expect(within(archived).queryByRole("button", { name: "Réactiver" })).not.toBeInTheDocument();
    await userEvent.click(within(archived).getByRole("button", { name: "Désarchiver" }));
    await waitFor(() => expect(api.unarchiveOperator).toHaveBeenCalledWith("o9"));
  });

  it("invite un loueur et montre une seule fois le lien quand l'email ne peut pas partir", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.inviteOperator.mockResolvedValue({ operator: { id: "o4", name: "Nouveau" }, emailSent: false, expiresAt: "2026-10-09", inviteUrl: "https://plazo.example/pro/invitation#abc" });
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    await screen.findByText("Parking Démo LYS");
    await userEvent.type(screen.getByLabelText("Nom de l'entreprise / du parking"), "Nouveau");
    expect(screen.getByLabelText("Prénom du gérant")).toBeRequired();
    expect(screen.getByLabelText("Nom du gérant")).toBeRequired();
    await userEvent.type(screen.getByLabelText("Prénom du gérant"), " Lucie ");
    await userEvent.type(screen.getByLabelText("Nom du gérant"), "Martin");
    await userEvent.type(screen.getByLabelText("Email du gérant"), "nouveau@example.com");
    await userEvent.type(screen.getByLabelText("Capacité (places)"), "150");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer l'invitation" }));
    await waitFor(() =>
      expect(api.inviteOperator).toHaveBeenCalledWith({
        operatorName: "Nouveau",
        managerFirstName: "Lucie",
        managerLastName: "Martin",
        managerEmail: "nouveau@example.com",
        totalCapacity: 150,
        commissionBps: null,
      }),
    );
    expect(await screen.findByDisplayValue("https://plazo.example/pro/invitation#abc")).toBeInTheDocument();
    expect(screen.getByText(/il ne sera plus affiché/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByDisplayValue("https://plazo.example/pro/invitation#abc")).not.toBeInTheDocument();
  });

  it("affiche sous le nom du gérant le refus du serveur", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.inviteOperator.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { managerLastName: "invalid_name" }));
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    await screen.findByText("Parking Démo LYS");
    await userEvent.type(screen.getByLabelText("Nom de l'entreprise / du parking"), "Nouveau");
    await userEvent.type(screen.getByLabelText("Prénom du gérant"), "Lucie");
    await userEvent.type(screen.getByLabelText("Nom du gérant"), "Martin2");
    await userEvent.type(screen.getByLabelText("Email du gérant"), "nouveau@example.com");
    await userEvent.type(screen.getByLabelText("Capacité (places)"), "150");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer l'invitation" }));
    expect(await screen.findByText("Lettres, espaces, apostrophes et tirets seulement.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du gérant")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Prénom du gérant")).toHaveAttribute("aria-invalid", "false");
  });

  it("retire le lien d'invitation affiché quand ce loueur est supprimé", async () => {
    api.getPlatformOperators.mockResolvedValue(operators);
    api.resendInvitation.mockResolvedValue({ operator: { id: "o3", name: "Parking Invité" }, emailSent: false, expiresAt: "2026-10-16", inviteUrl: "https://plazo.example/pro/invitation#o3" });
    api.getOperatorDeletion.mockResolvedValue({
      data: { id: "o3", name: "Parking Invité", deletable: true, reason: null, counts: { parkings: 1, listings: 0, reservations: 0, staff: 1, paidReservations: 0 } },
    });
    api.deleteOperator.mockResolvedValue({ data: { id: "o3", name: "Parking Invité" } });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAt("/plateforme/loueurs", <OperatorsPage />);

    const invited = (await screen.findByText("Parking Invité")).closest("tr")!;
    await userEvent.click(within(invited).getByRole("button", { name: "Renvoyer l'invitation" }));
    expect(await screen.findByDisplayValue("https://plazo.example/pro/invitation#o3")).toBeInTheDocument();
    await userEvent.click(within(invited).getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(api.deleteOperator).toHaveBeenCalledWith("o3"));
    await waitFor(() => expect(screen.queryByDisplayValue("https://plazo.example/pro/invitation#o3")).not.toBeInTheDocument());
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
  parking: { id: "p2", name: "Allo Park", address: "1 rue de l'Aéroport", totalCapacity: 450, effectiveCapacity: 412 },
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
    // The capacity used everywhere (the plan's), not the declared figure (09/10/2026).
    expect(screen.getByText("Allo Park · 412 places")).toBeInTheDocument();
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
