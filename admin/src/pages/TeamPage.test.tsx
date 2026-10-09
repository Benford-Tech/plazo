import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import type { Staff } from "@/lib/types";
import TeamPage from "./TeamPage";

const auth = vi.hoisted(() => ({ user: null as Staff | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
const api = vi.hoisted(() => ({ getTeam: vi.fn(), updateStaff: vi.fn(), createStaff: vi.fn(), resetStaffPassword: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const member = (patch: Partial<Staff>): Staff => ({
  id: "s1",
  operatorId: "o1",
  email: "lucie@example.com",
  firstName: "Lucie",
  lastName: "Martin",
  name: "Lucie Martin",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  ...patch,
});
const manager = member({});
const driver = member({ id: "s2", email: "paul@example.com", firstName: "Paul", lastName: "Durand", name: "Paul Durand", role: "driver" });
const legacy = member({ id: "s3", email: "demo@example.com", firstName: "", lastName: "", name: "Gérant démo", role: "agent" });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TeamPage />
    </QueryClientProvider>,
  );
}

const rowOf = async (name: string) => (await screen.findByText(name)).closest("li")!;
const renameForm = (row: HTMLElement, name: string) => within(within(row).getByText(`Nom de ${name}`).closest("form")!);

describe("Équipe : modifier le nom", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    Object.values(toast).forEach(f => f.mockReset());
    auth.user = manager;
    api.getTeam.mockResolvedValue([manager, driver, legacy]);
  });

  it("corrige le prénom et le nom d'un membre", async () => {
    api.updateStaff.mockResolvedValue({ data: { ...driver, firstName: "Paul-Henri", name: "Paul-Henri Durand" } });
    renderPage();
    const row = await rowOf("Paul Durand");

    await userEvent.click(within(row).getByRole("button", { name: "Modifier le nom" }));
    expect(within(row).getByText("Nom de Paul Durand")).toBeInTheDocument();
    expect(within(row).getByLabelText("Prénom")).toHaveValue("Paul");
    expect(within(row).getByLabelText("Nom")).toHaveValue("Durand");
    await userEvent.clear(within(row).getByLabelText("Prénom"));
    await userEvent.type(within(row).getByLabelText("Prénom"), " Paul-Henri ");
    await userEvent.click(renameForm(row, "Paul Durand").getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(api.updateStaff).toHaveBeenCalledWith("s2", { firstName: "Paul-Henri", lastName: "Durand" }));
    expect(toast.success).toHaveBeenCalledWith("Membre mis à jour");
    await waitFor(() => expect(within(row).queryByLabelText("Prénom")).not.toBeInTheDocument());
    expect(within(row).getByRole("button", { name: "Modifier le nom" })).toBeInTheDocument();
  });

  it("coupe le nom affiché d'un membre sans prénom ni nom, et Annuler referme le formulaire", async () => {
    renderPage();
    const row = await rowOf("Gérant démo");
    await userEvent.click(within(row).getByRole("button", { name: "Modifier le nom" }));
    expect(within(row).getByLabelText("Prénom")).toHaveValue("Gérant");
    expect(within(row).getByLabelText("Nom")).toHaveValue("démo");
    await userEvent.click(within(row).getByRole("button", { name: "Annuler" }));
    expect(within(row).queryByLabelText("Prénom")).not.toBeInTheDocument();
    expect(api.updateStaff).not.toHaveBeenCalled();
  });

  it("affiche sous le champ le refus du serveur", async () => {
    api.updateStaff.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { lastName: "too_long" }));
    renderPage();
    const row = await rowOf("Paul Durand");
    await userEvent.click(within(row).getByRole("button", { name: "Modifier le nom" }));
    await userEvent.click(renameForm(row, "Paul Durand").getByRole("button", { name: "Enregistrer" }));
    expect(await within(row).findByText("Texte trop long.")).toBeInTheDocument();
    expect(within(row).getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
    expect(within(row).getByLabelText("Prénom")).toBeInTheDocument();
  });

  it("ne propose pas de renommer son propre compte depuis l'équipe (il passe par Mon compte)", async () => {
    renderPage();
    const own = await rowOf("Lucie Martin");
    expect(within(own).queryByRole("button", { name: "Modifier le nom" })).not.toBeInTheDocument();
    expect(within(await rowOf("Paul Durand")).getByRole("button", { name: "Modifier le nom" })).toBeInTheDocument();
  });

  it("cache le bouton pendant la consultation de l'espace d'un loueur", async () => {
    auth.user = { ...manager, viewAs: { operatorId: "o1", operatorName: "Allo Park" } };
    renderPage();
    await rowOf("Paul Durand");
    expect(screen.queryByRole("button", { name: "Modifier le nom" })).not.toBeInTheDocument();
  });

  it("envoie le prénom et le nom d'un nouveau membre sans espaces autour", async () => {
    api.createStaff.mockResolvedValue({ data: member({ id: "s4" }) });
    renderPage();
    await rowOf("Paul Durand");
    const form = screen.getByRole("button", { name: "Créer le compte" }).closest("form")!;
    await userEvent.type(within(form).getByLabelText("Prénom"), " Inès ");
    await userEvent.type(within(form).getByLabelText("Nom"), "Benali ");
    await userEvent.type(within(form).getByLabelText("Email"), "ines@example.com");
    await userEvent.type(within(form).getByLabelText("Mot de passe provisoire"), "provisoire-123");
    await userEvent.click(within(form).getByRole("button", { name: "Créer le compte" }));
    await waitFor(() => expect(api.createStaff).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Inès", lastName: "Benali", email: "ines@example.com" })));
  });
});
