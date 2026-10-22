import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import LoginPage from "./LoginPage";

const api = vi.hoisted(() => ({
  login: vi.fn(),
  authProviders: vi.fn(),
  googleSignIn: vi.fn(),
  onboardingLogout: vi.fn(),
  getMe: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});

// Google's script is not loaded in tests: a stand-in hands back the callback the button registers.
const google = vi.hoisted(() => ({ callback: null as null | ((r: { credential?: string }) => void), renderButton: vi.fn() }));
vi.mock("@/lib/google-identity", () => ({
  googleButtonWidth: () => 320,
  loadGoogleIdentity: () =>
    Promise.resolve({
      initialize: (config: { callback: (r: { credential?: string }) => void }) => {
        google.callback = config.callback;
      },
      renderButton: google.renderButton,
      disableAutoSelect: () => undefined,
    }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>Tableau de bord</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  Object.values(api).forEach(f => f.mockReset());
  api.authProviders.mockResolvedValue({ apple: false, google: false, googleClientId: null });
  api.getMe.mockRejectedValue(new ApiError(401, "No session"));
  google.callback = null;
  google.renderButton.mockReset();
});

describe("LoginPage", () => {
  it("affiche l'erreur en français et garde l'email saisi", async () => {
    api.login.mockRejectedValue(new ApiError(401, "Invalid", "invalid_credentials"));
    renderPage();
    // Choice B of 21/10/2026: the address first, then the password.
    await userEvent.type(await screen.findByLabelText("Email"), "gerant@demo.fr");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByRole("heading", { name: "Votre mot de passe" })).toBeInTheDocument();
    expect(screen.getByText("gerant@demo.fr")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith("gerant@demo.fr", "mauvais");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
    // « Changer d'adresse e-mail » goes back with the address kept.
    await userEvent.click(screen.getByRole("button", { name: "Changer d'adresse e-mail" }));
    expect(screen.getByLabelText("Email")).toHaveValue("gerant@demo.fr");
  });

  it("refuse une adresse sans @ sans appeler l'API", async () => {
    renderPage();
    await userEvent.type(await screen.findByLabelText("Email"), "gerant");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByText("Adresse e-mail invalide.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Mot de passe")).not.toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it("ne montre pas Google sans client Google côté API", async () => {
    renderPage();
    await screen.findByLabelText("Email");
    await waitFor(() => expect(api.authProviders).toHaveBeenCalled());
    expect(screen.queryByTestId("google-sign-in")).not.toBeInTheDocument();
  });

  it("connecte un membre avec Google", async () => {
    api.authProviders.mockResolvedValue({ apple: false, google: true, googleClientId: "web.apps.googleusercontent.com" });
    api.googleSignIn.mockResolvedValue({
      status: "signed_in",
      tokenData: { access: { token: "a", expires: "2099-01-01T00:00:00Z" }, refresh: { token: "r", expires: "2099-01-01T00:00:00Z" } },
      user: { id: "s1", name: "Lucie Martin", email: "lucie@example.com", role: "manager" },
    });
    renderPage();
    expect(await screen.findByTestId("google-sign-in")).toBeInTheDocument();
    await waitFor(() => expect(google.renderButton).toHaveBeenCalled());
    expect(google.renderButton.mock.calls[0][1]).toMatchObject({ text: "continue_with", locale: "fr" });
    await act(async () => google.callback!({ credential: "id-token" }));
    expect(api.googleSignIn).toHaveBeenCalledWith("id-token");
    expect(await screen.findByText("Tableau de bord")).toBeInTheDocument();
  });

  it("renvoie vers Plazo Pro un compte Google qui n'est dans aucune équipe, et ferme sa session d'accueil", async () => {
    api.authProviders.mockResolvedValue({ apple: false, google: true, googleClientId: "web.apps.googleusercontent.com" });
    api.googleSignIn.mockResolvedValue({ status: "onboarding", onboardingToken: "onb" });
    api.onboardingLogout.mockResolvedValue(undefined);
    renderPage();
    await waitFor(() => expect(google.callback).not.toBeNull());
    await act(async () => google.callback!({ credential: "id-token" }));
    expect(await screen.findByText(/Ce compte Google n'est lié à aucun parking/)).toBeInTheDocument();
    expect(api.onboardingLogout).toHaveBeenCalledWith("onb");
  });

  it("traduit un refus de Google", async () => {
    api.authProviders.mockResolvedValue({ apple: false, google: true, googleClientId: "web.apps.googleusercontent.com" });
    api.googleSignIn.mockRejectedValue(new ApiError(401, "Invalid", "identity_invalid"));
    renderPage();
    await waitFor(() => expect(google.callback).not.toBeNull());
    await act(async () => google.callback!({ credential: "id-token" }));
    expect(await screen.findByText("La connexion n'a pas pu être vérifiée. Réessayez.")).toBeInTheDocument();
  });
});
