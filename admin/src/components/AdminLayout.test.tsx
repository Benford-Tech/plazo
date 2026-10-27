import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

const api = vi.hoisted(() => ({ getGettingStarted: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getGettingStarted: () => api.getGettingStarted(),
    },
  };
});

const auth = vi.hoisted(() => ({ role: "manager" as string }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "s1",
      firstName: "Joanny",
      name: "Joanny Simpore",
      role: auth.role,
      operatorName: "Parking Test",
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

// W-A (26/10/2026, « réorganise le menu par rôle »): the rail in three sections.
describe("AdminLayout rail sections", () => {
  beforeEach(() => {
    api.getGettingStarted.mockResolvedValue(STEPS);
    localStorage.removeItem("plazo:getting-started-hidden");
    localStorage.setItem("plazo:getting-started-welcome", "s1");
  });

  it("groups the manager’s links under Exploitation, Gérant and Compte", () => {
    auth.role = "manager";
    renderLayout();
    const ops = screen.getByTestId("nav-section-operations");
    expect(within(ops).getByText("Exploitation")).toBeInTheDocument();
    expect(
      within(ops)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual(["/", "/planning", "/navettes", "/reservations", "/parking"]);
    const manager = screen.getByTestId("nav-section-manager");
    expect(within(manager).getByText("Gérant")).toBeInTheDocument();
    expect(
      within(manager)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual([
      "/chiffre-affaires",
      "/plazo",
      "/equipe",
      "/mon-contrat",
      "/contrats",
    ]);
    const account = screen.getByTestId("nav-section-account");
    expect(
      within(account)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual(["/mon-compte"]);
  });

  it("shows no Gérant section to a driver", () => {
    auth.role = "driver";
    renderLayout();
    expect(screen.getByTestId("nav-section-operations")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-section-manager")).toBeNull();
    expect(screen.getByTestId("nav-section-account")).toBeInTheDocument();
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
