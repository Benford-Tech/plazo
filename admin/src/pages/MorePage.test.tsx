import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MorePage from "./MorePage";

const auth = vi.hoisted(() => ({ role: "manager" as string, platformAdmin: false }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "s1", name: "Joanny Simpore", role: auth.role, operatorName: "Parking Test", isPlatformAdmin: auth.platformAdmin },
    logout: vi.fn(),
  }),
}));

const renderMore = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <MorePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

describe("« Plus » of the phone's tab bar (10/11/2026)", () => {
  it("lists the manager's pages, the account and the notifications", () => {
    auth.role = "manager";
    auth.platformAdmin = true;
    renderMore();
    expect(hrefs()).toEqual([
      "/mon-compte",
      "/chiffre-affaires",
      "/statistiques",
      "/plazo/fiche",
      "/plazo/tarifs",
      "/equipe",
      "/contrats",
      "/mon-contrat",
      "/mon-compte",
      "/notifications",
      "/plateforme",
    ]);
    expect(screen.getByRole("link", { name: /Sur .* · Fiche/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });

  it("has no Gérant block for a driver", () => {
    auth.role = "driver";
    auth.platformAdmin = false;
    renderMore();
    expect(screen.queryByText("Gérant")).toBeNull();
    expect(hrefs()).toEqual(["/mon-compte", "/mon-compte", "/notifications"]);
  });
});
