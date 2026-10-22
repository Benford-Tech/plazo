import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError, setTokens } from "@/lib/api";
import type { Staff } from "@/lib/types";
import AccountPage from "./AccountPage";

const api = vi.hoisted(() => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
  authProviders: vi.fn(),
  linkGoogle: vi.fn(),
  unlinkIdentity: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
vi.mock("@/components/account/TravellerSms", () => ({ TravellerSms: () => null }));
vi.mock("@/components/account/MorningEmailCard", () => ({ MorningEmailCard: () => null }));
// Google's script is not loaded in tests: a stand-in hands back the callback the button registers.
const google = vi.hoisted(() => ({ callback: null as null | ((r: { credential?: string }) => void) }));
vi.mock("@/lib/google-identity", () => ({
  googleButtonWidth: () => 320,
  loadGoogleIdentity: () =>
    Promise.resolve({
      initialize: (config: { callback: (r: { credential?: string }) => void }) => {
        google.callback = config.callback;
      },
      renderButton: () => undefined,
      disableAutoSelect: () => undefined,
    }),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const me = (patch: Partial<Staff> = {}): Staff => ({
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter>
          <AccountPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("Mon compte : votre nom", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(api).forEach(f => f.mockReset());
    Object.values(toast).forEach(f => f.mockReset());
    api.authProviders.mockResolvedValue({ apple: false, google: false, googleClientId: null });
    setTokens({ access: { token: "t", expires: "2099-01-01T00:00:00Z" }, refresh: { token: "r", expires: "2099-01-01T00:00:00Z" } });
  });

  it("enregistre le prénom et le nom, puis relit le compte", async () => {
    api.getMe.mockResolvedValueOnce(me()).mockResolvedValue(me({ firstName: "Lucie", lastName: "Martin-Durand", name: "Lucie Martin-Durand" }));
    api.updateMe.mockResolvedValue(me({ lastName: "Martin-Durand", name: "Lucie Martin-Durand" }));
    renderPage();

    expect(await screen.findByText("Votre nom")).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom")).toHaveValue("Lucie");
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    await userEvent.clear(screen.getByLabelText("Nom"));
    await userEvent.type(screen.getByLabelText("Nom"), " Martin-Durand ");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(api.updateMe).toHaveBeenCalledWith({ firstName: "Lucie", lastName: "Martin-Durand" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Nom enregistré."));
    expect(api.getMe).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Lucie Martin-Durand · lucie@example.com")).toBeInTheDocument();
  });

  it("coupe le nom affiché d'un compte sans prénom ni nom enregistrés", async () => {
    api.getMe.mockResolvedValue(me({ firstName: "", lastName: "", name: "Gérant démo" }));
    renderPage();
    expect(await screen.findByLabelText("Prénom")).toHaveValue("Gérant");
    expect(screen.getByLabelText("Nom")).toHaveValue("démo");
  });

  it("affiche sous le champ le refus du serveur", async () => {
    api.getMe.mockResolvedValue(me());
    api.updateMe.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { lastName: "required" }));
    renderPage();

    await userEvent.clear(await screen.findByLabelText("Nom"));
    await userEvent.type(screen.getByLabelText("Nom"), " ");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByText("Champ obligatoire.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
    expect(api.updateMe).toHaveBeenCalledWith({ firstName: "Lucie", lastName: "" });
  });

  it("ne propose pas de changer le nom pendant la consultation d'un loueur", async () => {
    api.getMe.mockResolvedValue(me({ viewAs: { operatorId: "o2", operatorName: "Allo Park" } }));
    renderPage();
    expect(await screen.findByText("Mon compte")).toBeInTheDocument();
    await waitFor(() => expect(api.getMe).toHaveBeenCalled());
    expect(screen.queryByText("Votre nom")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Prénom")).not.toBeInTheDocument();
  });
});

describe("Mon compte : connexion", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(api).forEach(f => f.mockReset());
    Object.values(toast).forEach(f => f.mockReset());
    google.callback = null;
    api.authProviders.mockResolvedValue({ apple: false, google: true, googleClientId: "web.apps.googleusercontent.com" });
    setTokens({ access: { token: "t", expires: "2099-01-01T00:00:00Z" }, refresh: { token: "r", expires: "2099-01-01T00:00:00Z" } });
  });

  it("lie le compte Google avec le bouton de Google, puis relit le compte", async () => {
    api.getMe
      .mockResolvedValueOnce(me({ hasPassword: true, identities: [] }))
      .mockResolvedValue(me({ hasPassword: true, identities: [{ provider: "google", email: "lucie@gmail.com" }] }));
    api.linkGoogle.mockResolvedValue({ user: me() });
    renderPage();
    expect(await screen.findByText("Connexion")).toBeInTheDocument();
    expect(screen.getByText("E-mail et mot de passe")).toBeInTheDocument();
    await waitFor(() => expect(google.callback).not.toBeNull());
    await act(async () => google.callback!({ credential: "id-token" }));
    expect(api.linkGoogle).toHaveBeenCalledWith("id-token");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Compte Google lié."));
    expect(await screen.findByText("lucie@gmail.com")).toBeInTheDocument();
    expect(screen.queryByTestId("google-sign-in")).not.toBeInTheDocument();
  });

  it("délie Google après confirmation, et dit pourquoi le serveur refuse quand c'est la seule connexion", async () => {
    api.getMe.mockResolvedValue(me({ hasPassword: false, identities: [{ provider: "google", email: "lucie@gmail.com" }] }));
    api.unlinkIdentity.mockRejectedValue(new ApiError(409, "Only way", "sign_in_required"));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Délier" }));
    expect(api.unlinkIdentity).toHaveBeenCalledWith("google");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("C'est votre seule façon de vous connecter : gardez-la, ou définissez d'abord un mot de passe."),
    );
    expect(screen.queryByText("E-mail et mot de passe")).not.toBeInTheDocument();
    confirm.mockRestore();
  });
});
