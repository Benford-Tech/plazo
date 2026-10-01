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
    await userEvent.type(await screen.findByLabelText("Email"), "gerant@demo.fr");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("gerant@demo.fr");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });
});
