import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import SignupPage from "./SignupPage";

const api = vi.hoisted(() => ({ getAirports: vi.fn(), signup: vi.fn(), login: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/inscription"]}>
          <Routes>
            <Route path="/inscription" element={<SignupPage />} />
            <Route path="/plazo/fiche" element={<p>Ma fiche</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

async function fill(overrides: { confirmation?: string; terms?: boolean } = {}) {
  await userEvent.type(await screen.findByLabelText("Entreprise"), "Parking Express SARL");
  await userEvent.type(screen.getByLabelText("Nom du parking"), "Parking Express LYS");
  await userEvent.type(screen.getByLabelText("Capacité (places)"), "180");
  await userEvent.type(screen.getByLabelText("Prénom"), "Lucie");
  await userEvent.type(screen.getByLabelText("Nom"), "Martin");
  await userEvent.type(screen.getByLabelText("Téléphone"), "06 12 34 56 78");
  await userEvent.type(screen.getByLabelText("Email"), "lucie@example.com");
  await userEvent.type(screen.getByLabelText("Mot de passe"), "mot-de-passe-solide");
  await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), overrides.confirmation ?? "mot-de-passe-solide");
  if (overrides.terms !== false) await userEvent.click(screen.getByRole("checkbox", { name: /J'accepte les conditions/ }));
}

describe("Inscription d'un loueur", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(api).forEach(f => f.mockReset());
    api.getAirports.mockResolvedValue([{ code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", slug: "lyon-saint-exupery" }]);
  });

  it("vérifie le formulaire avant l'envoi", async () => {
    renderPage();
    await fill({ confirmation: "autre-mot-de-passe", terms: false });
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByText("Les deux mots de passe ne sont pas identiques.")).toBeInTheDocument();
    expect(screen.getByText("Acceptez les conditions pour continuer.")).toBeInTheDocument();
    expect(api.signup).not.toHaveBeenCalled();
  });

  it("crée le compte, connecte le gérant et l'emmène sur sa fiche", async () => {
    api.signup.mockResolvedValue({ message: "ok" });
    api.login.mockResolvedValue({
      tokenData: { access: { token: "a", expires: "2099-01-01" }, refresh: { token: "r", expires: "2099-01-01" } },
      user: { id: "s1", email: "lucie@example.com", name: "Lucie Martin", role: "manager", emailVerified: false },
    });
    renderPage();
    await fill();
    // The airport list has one entry: it is chosen already.
    expect(screen.getByLabelText("Aéroport")).toHaveValue("LYS");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    await waitFor(() =>
      expect(api.signup).toHaveBeenCalledWith({
        companyName: "Parking Express SARL",
        parkingName: "Parking Express LYS",
        totalCapacity: 180,
        airportCode: "LYS",
        firstName: "Lucie",
        lastName: "Martin",
        email: "lucie@example.com",
        phone: "06 12 34 56 78",
        password: "mot-de-passe-solide",
        passwordConfirmation: "mot-de-passe-solide",
        acceptTerms: true,
        website: "",
      }),
    );
    expect(api.login).toHaveBeenCalledWith("lucie@example.com", "mot-de-passe-solide");
    expect(await screen.findByText("Ma fiche")).toBeInTheDocument();
  });

  it("ne dit pas si l'email avait déjà un compte", async () => {
    api.signup.mockResolvedValue({ message: "ok" });
    api.login.mockRejectedValue(new ApiError(401, "Invalid", "invalid_credentials"));
    renderPage();
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByText(/Si cette adresse n'avait pas encore de compte/)).toBeInTheDocument();
  });

  it("traduit les erreurs du serveur par champ", async () => {
    api.signup.mockRejectedValue(new ApiError(400, "x", "validation_failed", { phone: "invalid_phone" }));
    renderPage();
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByText("Numéro de téléphone invalide.")).toBeInTheDocument();
  });
});
