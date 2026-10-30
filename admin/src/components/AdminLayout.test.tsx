import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

const api = vi.hoisted(() => ({
  getGettingStarted: vi.fn(),
  navCounts: vi.fn(async () => ({ inbox: 3, extras: 2 })),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getGettingStarted: () => api.getGettingStarted(),
      navCounts: () => api.navCounts(),
    },
  };
});

const auth = vi.hoisted(() => ({
  role: "manager" as string,
  platformAdmin: false,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "s1",
      firstName: "Joanny",
      name: "Joanny Simpore",
      role: auth.role,
      operatorName: "Parking Test",
      isPlatformAdmin: auth.platformAdmin,
    },
    logout: vi.fn(),
  }),
}));
vi.mock("./ContractBanner", () => ({ ContractBanner: () => null }));
vi.mock("./EmailVerificationBanner", () => ({
  EmailVerificationBanner: () => null,
}));

const STEPS = {
  post: "manager",
  done: 2,
  total: 7,
  steps: [
    { key: "parking", done: true, detail: "200 places déclarées" },
    { key: "bookings", done: false, detail: null },
    { key: "team", done: true, detail: "3 membres" },
    { key: "shuttles", done: false, detail: "Aucun véhicule de navette" },
    { key: "listing", done: false, detail: "Grille tarifaire vide" },
    { key: "contract", done: false, detail: null },
    { key: "sms", done: false, detail: null },
  ],
};

const renderLayout = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<p>accueil</p>} />
            <Route path="parking/reglages" element={<p>réglages</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

// Direction A (30/10/2026, « réorganise le menu sur le web »): four groups, their pages and the account at the bottom.
describe("AdminLayout rail sections", () => {
  beforeEach(() => {
    api.getGettingStarted.mockResolvedValue(STEPS);
    localStorage.removeItem("plazo:getting-started-hidden");
    localStorage.setItem("plazo:getting-started-welcome", "s1");
  });

  it("groups the manager’s pages under Aujourd'hui, Réservations, Parking and Gérant", () => {
    auth.role = "manager";
    renderLayout();
    const hrefs = (testId: string) =>
      within(screen.getByTestId(testId))
        .getAllByRole("link")
        .map((l) => l.getAttribute("href"));
    expect(within(screen.getByTestId("nav-section-today")).getByText("Aujourd'hui")).toBeInTheDocument();
    expect(hrefs("nav-section-today")).toEqual(["/", "/planning", "/navettes"]);
    expect(hrefs("nav-section-reservations")).toEqual(["/reservations"]);
    expect(hrefs("nav-section-parking")).toEqual(["/parking/occupation"]);
    expect(hrefs("nav-section-manager")).toEqual([
      "/chiffre-affaires",
      "/plazo/fiche",
      "/equipe",
      "/contrats",
      "/mon-contrat",
    ]);
  });

  it("unfolds a group on its pages, with the counters of what waits", async () => {
    auth.role = "manager";
    renderLayout();
    const group = screen.getByTestId("nav-item-/reservations");
    // Folded: the group's total.
    expect(await within(group).findByLabelText("5 à traiter")).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("button", { name: "Afficher les pages de Réservations" }));
    const pages = screen.getByTestId("nav-children-/reservations");
    expect(
      within(pages)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual([
      "/reservations",
      "/reservations/a-verifier",
      "/reservations/services",
      "/reservations/sms-veille",
      "/reservations/importer",
    ]);
    expect(within(pages).getByLabelText("3 à traiter")).toBeInTheDocument();
    expect(within(pages).getByLabelText("2 à traiter")).toBeInTheDocument();
  });

  it("shows no Gérant section to a driver, nor the pages of the managers", () => {
    auth.role = "driver";
    renderLayout();
    expect(screen.getByTestId("nav-section-today")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-section-manager")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Afficher les pages de Parking" }));
    expect(
      within(screen.getByTestId("nav-children-/parking"))
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual(["/parking/occupation", "/parking/planning"]);
  });

  it("puts the account at the bottom: Mon compte, the photo and sign out", () => {
    auth.role = "manager";
    renderLayout();
    const [rail] = screen.getAllByTestId("account-menu").slice(-1);
    expect(within(rail).getByText("Joanny Simpore")).toBeInTheDocument();
    expect(within(rail).getByText("Gérant")).toBeInTheDocument();
    fireEvent.click(rail);
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Mon compte" })).toHaveAttribute("href", "/mon-compte");
    expect(within(menu).getByRole("menuitem", { name: "Changer ma photo" })).toHaveAttribute("href", "/mon-compte#photo");
    expect(within(menu).getByRole("menuitem", { name: "Se déconnecter" })).toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "Plateforme" })).toBeNull();
  });

  // « les étapes bien démarrer doivent être sur la nav bar de gauche » (26/10/2026).
  it("lists the « Bien démarrer » steps under the sections, with their links, and folds on a click", async () => {
    auth.role = "manager";
    renderLayout();
    const block = await screen.findByTestId("getting-started");
    expect(within(block).getByText("2 / 7 étapes")).toBeInTheDocument();
    expect(within(block).getByText("Votre équipe")).toBeInTheDocument();
    const shuttles = within(block).getByTestId("getting-started-shuttles");
    expect(within(shuttles).getByRole("link")).toHaveAttribute(
      "href",
      "/parking/reglages",
    );
    expect(
      within(within(block).getByTestId("getting-started-parking")).queryByRole(
        "link",
      ),
    ).toBeNull();
    fireEvent.click(within(block).getByRole("button", { expanded: true }));
    expect(within(block).queryByText("Votre équipe")).toBeNull();
    expect(localStorage.getItem("plazo:getting-started-hidden")).toBe("1");
  });

  it("shows nothing once every step is done", async () => {
    auth.role = "manager";
    api.getGettingStarted.mockResolvedValue({
      post: "manager",
      done: 1,
      total: 1,
      steps: [{ key: "sms", done: true, detail: null }],
    });
    renderLayout();
    await screen.findByText("accueil");
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId("getting-started")).toBeNull();
  });

  // « une pop-up à la première connexion » (27/10/2026).
  it("welcomes a member once per browser with the next steps, « Commencer » opens the first one", async () => {
    auth.role = "manager";
    localStorage.removeItem("plazo:getting-started-welcome");
    renderLayout();
    const dialog = await screen.findByTestId("getting-started-welcome");
    expect(within(dialog).getByText("Bienvenue, Joanny !")).toBeInTheDocument();
    expect(within(dialog).getByText("Vos réservations")).toBeInTheDocument();
    expect(within(dialog).getByText("Vos navettes")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Vos tarifs et votre fiche Plazo"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Votre contrat de stationnement"),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Commencer : Vos réservations",
      }),
    );
    expect(screen.queryByTestId("getting-started-welcome")).toBeNull();
    expect(screen.getByText("réglages")).toBeInTheDocument();
    expect(localStorage.getItem("plazo:getting-started-welcome")).toBe("s1");
  });

  it("does not welcome again once seen, nor in a demo", async () => {
    auth.role = "manager";
    renderLayout();
    await screen.findByTestId("getting-started");
    expect(screen.queryByTestId("getting-started-welcome")).toBeNull();
  });
});

// 27/10/2026 (« pouvoir masquer le chiffre d'affaires pour le super admin de la plateforme »).
describe("AdminLayout · Masquer le CA", () => {
  beforeEach(() => {
    api.getGettingStarted.mockResolvedValue({ ...STEPS, done: 7 });
    localStorage.setItem("plazo:getting-started-welcome", "s1");
    localStorage.removeItem("plazo:revenue-hidden");
  });
  afterEach(() => {
    auth.platformAdmin = false;
    localStorage.removeItem("plazo:revenue-hidden");
  });

  it("offers the toggle to the platform admin only, and keeps the choice in the browser", () => {
    auth.role = "manager";
    renderLayout();
    expect(screen.queryByTestId("revenue-mask")).toBeNull();
  });

  it("hides and shows the revenue on a click", () => {
    auth.platformAdmin = true;
    renderLayout();
    const toggle = screen.getByTestId("revenue-mask");
    expect(toggle).toHaveTextContent("Masquer le CA");
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent("Afficher le CA");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("plazo:revenue-hidden")).toBe("1");
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent("Masquer le CA");
    expect(localStorage.getItem("plazo:revenue-hidden")).toBeNull();
  });
});
