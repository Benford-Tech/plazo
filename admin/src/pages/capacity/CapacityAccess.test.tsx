import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import type { Staff } from "@/lib/types";
import CapacityStudiesPage from "./CapacityStudiesPage";

const auth = vi.hoisted(() => ({ user: null as Staff | null }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, isAuthenticated: !!auth.user, isLoading: false, login: vi.fn(), logout: vi.fn(), forget: vi.fn() }),
}));
const api = vi.hoisted(() => ({ listCapacityStudies: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, listCapacityStudies: () => api.listCapacityStudies() } };
});

const manager: Staff = {
  id: "s1",
  operatorId: "o1",
  email: "gerant@demo.fr",
  name: "Camille Gérant",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "Parking Démo",
};

function renderAt(path: string, element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="*" element={element} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("outil interne", () => {
  it("n'apparaît pas dans le menu d'un loueur", () => {
    auth.user = { ...manager, isPlatformAdmin: false };
    renderAt("/", <div />);
    expect(screen.getByRole("link", { name: "Planning" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Outil interne" })).not.toBeInTheDocument();
  });

  it("apparaît pour un administrateur de la plateforme", () => {
    auth.user = { ...manager, isPlatformAdmin: true };
    renderAt("/", <div />);
    expect(screen.getByRole("link", { name: "Outil interne" })).toHaveAttribute("href", "/outil/capacite");
  });

  it("liste les études avec leur fourchette", async () => {
    auth.user = { ...manager, isPlatformAdmin: true };
    api.listCapacityStudies.mockResolvedValue([
      {
        id: "c1",
        name: "Terrain client n°1",
        parcels: [{ id: "692990000ZS0156", section: "ZS", numero: "0156", commune: "Colombier-Saugnieu", insee: "69299", contenance: 3780 }],
        results: { totals: { selfPark: 211, valet24: 298, valet5: 309 } },
        createdAt: "2026-10-02T07:00:00Z",
        updatedAt: "2026-10-02T07:00:00Z",
        createdBy: { id: "s1", name: "Camille Gérant" },
      },
    ]);
    renderAt("/outil/capacite", <CapacityStudiesPage />);
    expect(await screen.findByText("Terrain client n°1")).toBeInTheDocument();
    expect(screen.getByText("ZS 156")).toBeInTheDocument();
    expect(screen.getByText("211 à 298 voitures")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nouvelle étude" })).toBeInTheDocument();
  });
});
