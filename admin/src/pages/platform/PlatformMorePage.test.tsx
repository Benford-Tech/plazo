import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import PlatformMorePage from "./PlatformMorePage";

/** 22/11/2026 (direction A, téléphone) : the Plateforme's tab bar and its « Plus » page. Fictional data only. */

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { firstName: "Camille" }, startViewAs: vi.fn(), stopViewAs: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/components/platform/ParkingSwitcher", () => ({ ParkingSwitcher: () => null }));
vi.mock("@/components/platform/ViewAsBanner", () => ({ ViewAsBanner: () => null }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getPlatformOverview: async () => ({ todos: [{ kind: "listing_review" }, { kind: "listing_review" }] }),
    },
  };
});

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<PlatformLayout />}>
            <Route path="/plateforme/plus" element={<PlatformMorePage />} />
            <Route path="/plateforme/prospection" element={<p>Prospection</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("Plateforme sur téléphone", () => {
  it("quatre onglets en bas, l'onglet de la page ouverte marqué", () => {
    renderAt("/plateforme/prospection");
    const bar = screen.getByTestId("platform-tab-bar");
    expect(within(bar).getAllByRole("link").map(l => l.textContent)).toEqual(["Pilotage", "Loueurs", "Prospection", "Plus"]);
    expect(within(bar).getByTestId("platform-tab-prospecting")).toHaveAttribute("aria-current", "page");
    expect(within(bar).getByTestId("platform-tab-more")).not.toHaveAttribute("aria-current");
  });

  it("« Plus » liste les pages sans onglet, par groupe, avec les annonces à valider et la déconnexion", async () => {
    renderAt("/plateforme/plus");
    const more = screen.getByTestId("platform-more");
    expect(within(more).getByRole("link", { name: /Réservations/ })).toHaveAttribute("href", "/plateforme/reservations");
    expect(within(more).queryByRole("link", { name: /Prospection/ })).toBeNull();
    expect(within(more).queryByRole("link", { name: /Loueurs/ })).toBeNull();
    expect(await within(more).findByRole("link", { name: /Annonces\s*2/ })).toBeInTheDocument();
    expect(within(more).getByRole("button", { name: /Se déconnecter/ })).toBeInTheDocument();
    expect(screen.getByTestId("platform-tab-more")).toHaveAttribute("aria-current", "page");
  });
});
