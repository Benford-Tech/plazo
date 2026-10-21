import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import LoginPage from "./LoginPage";

const login = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, login: (...args: unknown[]) => login(...args) } };
});

describe("LoginPage", () => {
  it("affiche l'erreur en français et garde l'email saisi", async () => {
    login.mockRejectedValue(new ApiError(401, "Invalid", "invalid_credentials"));
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    // Choice B of 21/10/2026: the address first, then the password.
    await userEvent.type(await screen.findByLabelText("Email"), "gerant@demo.fr");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByRole("heading", { name: "Votre mot de passe" })).toBeInTheDocument();
    expect(screen.getByText("gerant@demo.fr")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("gerant@demo.fr", "mauvais");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
    // « Changer d'adresse e-mail » goes back with the address kept.
    await userEvent.click(screen.getByRole("button", { name: "Changer d'adresse e-mail" }));
    expect(screen.getByLabelText("Email")).toHaveValue("gerant@demo.fr");
  });

  it("refuse une adresse sans @ sans appeler l'API", async () => {
    login.mockReset();
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.type(await screen.findByLabelText("Email"), "gerant");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByText("Adresse e-mail invalide.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Mot de passe")).not.toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
