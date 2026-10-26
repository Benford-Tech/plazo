import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

const auth = vi.hoisted(() => ({ role: "manager" as string }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
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

const renderLayout = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<p>accueil</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

// W-A (26/10/2026, « réorganise le menu par rôle »): the rail in three sections.
describe("AdminLayout rail sections", () => {
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
});
