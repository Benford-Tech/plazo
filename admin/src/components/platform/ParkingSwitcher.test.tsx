import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { PlatformOperator, Staff } from "@/lib/types";
import { samePageIn } from "@/lib/parking-switcher";
import { ParkingSwitcher } from "./ParkingSwitcher";

const auth = vi.hoisted(() => ({
  user: null as Staff | null,
  startViewAs: vi.fn(),
  stopViewAs: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, startViewAs: auth.startViewAs, stopViewAs: auth.stopViewAs }),
}));
const api = vi.hoisted(() => ({ getPlatformOperators: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getPlatformOperators: api.getPlatformOperators } };
});

const operator = (id: string, name: string, extra: Partial<PlatformOperator> = {}): PlatformOperator => ({
  id,
  name,
  status: "active",
  suspendedAt: null,
  archivedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  isPlatform: false,
  parkings: 1,
  places: 100,
  manager: { name: "Gérant", email: "g@example.com", emailVerified: true },
  listing: null,
  payments: {} as PlatformOperator["payments"],
  commissionBps: null,
  bookingsThisMonth: 0,
  invitation: null,
  ...extra,
});

const admin: Staff = {
  id: "s1",
  operatorId: "apl",
  email: "admin@example.com",
  name: "Joanny Admin",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "APL Parking Lyon",
  isPlatformAdmin: true,
  viewAs: { operatorId: "apl", operatorName: "APL Parking Lyon", realOperatorId: "tests", realOperatorName: "Plazo (tests)" },
};

function Where() {
  const { pathname } = useLocation();
  return <p data-testid="where">{pathname}</p>;
}

function renderAt(path: string, current: "platform" | "operator" = "operator") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ParkingSwitcher current={current} />
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  auth.user = admin;
  auth.startViewAs.mockReset().mockResolvedValue(undefined);
  auth.stopViewAs.mockReset().mockResolvedValue(undefined);
  api.getPlatformOperators.mockReset().mockImplementation(async (view?: string) =>
    view === "archived"
      ? { defaultCommissionBps: null, operators: [operator("old", "Ancien Parking Lyon", { status: "suspended", archivedAt: "2026-10-09T00:00:00Z" })] }
      : {
          defaultCommissionBps: null,
          operators: [
            operator("apl", "APL Parking Lyon"),
            operator("safe", "Safe Parking Lyon Aéroport"),
            operator("valet", "Valet Lyon", { status: "suspended", suspendedAt: "2026-10-01T00:00:00Z" }),
            operator("tests", "Plazo (tests)", { isPlatform: true }),
          ],
        },
  );
});

describe("samePageIn", () => {
  it("garde la page, sauf celle d'une réservation ou de la plateforme", () => {
    expect(samePageIn("/planning")).toBe("/planning");
    expect(samePageIn("/reservations/a-verifier")).toBe("/reservations/a-verifier");
    expect(samePageIn("/reservations/cmabc123")).toBe("/reservations");
    expect(samePageIn("/parking/contrat/t1/champs")).toBe("/parking/reglages");
    expect(samePageIn("/plateforme/loueurs")).toBe("/");
  });
});

describe("ParkingSwitcher (direction A, 10/11/2026)", () => {
  it("liste les loueurs avec leur état, la plateforme et mon espace", async () => {
    renderAt("/planning");
    fireEvent.click(screen.getByTestId("parking-switcher"));
    expect(await screen.findByRole("option", { name: /Safe Parking Lyon Aéroport/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Valet Lyon/ })).toHaveTextContent("Suspendu");
    expect(screen.getByRole("option", { name: /APL Parking Lyon/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Toute la plateforme" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mon espace (Plazo (tests))" })).toBeInTheDocument();
  });

  it("ouvre un autre parking sur la même page et le garde dans les récents", async () => {
    renderAt("/planning");
    fireEvent.click(screen.getByTestId("parking-switcher"));
    fireEvent.click(await screen.findByRole("option", { name: /Safe Parking/ }));
    await waitFor(() => expect(auth.startViewAs).toHaveBeenCalledWith("safe"));
    expect(screen.getByTestId("where")).toHaveTextContent("/planning");
    expect(JSON.parse(localStorage.getItem("plazo:recent-parkings")!)).toEqual(["safe"]);

    fireEvent.click(screen.getByTestId("parking-switcher"));
    expect(await screen.findByText("Récents")).toBeInTheDocument();
  });

  it("revient à mon espace sans nouvelle consultation", async () => {
    renderAt("/reservations/cmabc123");
    fireEvent.click(screen.getByTestId("parking-switcher"));
    fireEvent.click(await screen.findByRole("option", { name: "Mon espace (Plazo (tests))" }));
    await waitFor(() => expect(auth.stopViewAs).toHaveBeenCalled());
    expect(auth.startViewAs).not.toHaveBeenCalled();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/reservations$/);
  });

  it("cherche sans accents et trouve aussi les archivés", async () => {
    renderAt("/");
    fireEvent.click(screen.getByTestId("parking-switcher"));
    await screen.findByRole("option", { name: /Safe Parking/ });
    fireEvent.change(screen.getByRole("textbox", { name: "Rechercher un parking…" }), { target: { value: "aeroport" } });
    expect(screen.getByRole("option", { name: /Safe Parking Lyon Aéroport/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Valet Lyon/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Rechercher un parking…" }), { target: { value: "ancien" } });
    expect(await screen.findByRole("option", { name: /Ancien Parking Lyon/ })).toHaveTextContent("Archivé");
  });

  it("s'ouvre avec Ctrl K et choisit au clavier", async () => {
    renderAt("/navettes");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const search = await screen.findByRole("textbox", { name: "Rechercher un parking…" });
    await screen.findByRole("option", { name: /Safe Parking/ });
    fireEvent.change(search, { target: { value: "safe" } });
    fireEvent.keyDown(search, { key: "Enter" });
    await waitFor(() => expect(auth.startViewAs).toHaveBeenCalledWith("safe"));
    expect(screen.getByTestId("where")).toHaveTextContent("/navettes");
  });

  it("depuis la plateforme, ouvre le parking sur son tableau de bord", async () => {
    auth.user = { ...admin, operatorId: "tests", operatorName: "Plazo (tests)", viewAs: null };
    renderAt("/plateforme/loueurs", "platform");
    expect(screen.getByTestId("parking-switcher")).toHaveTextContent("Toute la plateforme");
    fireEvent.click(screen.getByTestId("parking-switcher"));
    fireEvent.click(await screen.findByRole("option", { name: /APL Parking Lyon/ }));
    await waitFor(() => expect(auth.startViewAs).toHaveBeenCalledWith("apl"));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/$/);
  });
});
