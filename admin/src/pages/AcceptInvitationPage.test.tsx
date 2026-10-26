import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Staff } from "@/lib/types";
import AcceptInvitationPage from "./AcceptInvitationPage";

const api = vi.hoisted(() => ({
  getInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      ...Object.fromEntries(
        Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)]),
      ),
    },
  };
});
const auth = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signIn: auth.signIn }),
}));

const stores = {
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.benfordtech.plazopro",
  appStoreUrl: null,
};
const tokenData = {
  access: { token: "a", expires: "2026-10-27T00:00:00Z" },
  refresh: { token: "r", expires: "2026-11-27T00:00:00Z" },
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/invitation#jeton"]}>
        <Routes>
          <Route path="/invitation" element={<AcceptInvitationPage />} />
          <Route path="/plazo/fiche" element={<p>Ma fiche</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function choosePassword() {
  await userEvent.type(
    await screen.findByLabelText("Mot de passe"),
    "mon-mot-de-passe-long",
  );
  await userEvent.type(
    screen.getByLabelText("Confirmer le mot de passe"),
    "mon-mot-de-passe-long",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Accéder à mon espace" }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Invitation : choisir son mot de passe (26/10/2026)", () => {
  it("envoie un membre de l'équipe vers Plazo Pro une fois le mot de passe choisi", async () => {
    api.getInvitation.mockResolvedValue({
      email: "nawfel@example.com",
      operatorName: "Aéroport Parking Lyon",
      role: "driver",
      stores,
    });
    api.acceptInvitation.mockResolvedValue({
      tokenData,
      user: { id: "s2", role: "driver" } as Staff,
    });
    renderPage();
    expect(
      await screen.findByText(/vous installerez l'application Plazo Pro/),
    ).toBeInTheDocument();
    await choosePassword();
    await waitFor(() =>
      expect(api.acceptInvitation).toHaveBeenCalledWith(
        "jeton",
        "mon-mot-de-passe-long",
      ),
    );
    expect(auth.signIn).toHaveBeenCalled();
    const done = await screen.findByTestId("invitation-done");
    expect(done).toHaveTextContent("Votre mot de passe est enregistré");
    expect(done).toHaveTextContent("connectez-vous avec nawfel@example.com");
    expect(
      screen.getByRole("link", { name: "Disponible sur Google Play" }),
    ).toHaveAttribute("href", stores.playStoreUrl);
    // No App Store address yet: the badge is greyed, with Apple's note.
    expect(
      screen.queryByRole("link", { name: "Télécharger dans l'App Store" }),
    ).not.toBeInTheDocument();
    expect(done).toHaveTextContent("Validation par Apple en cours");
    expect(
      screen.getByRole("link", { name: "Continuer sur le web" }),
    ).toHaveAttribute("href", "/");
  });

  it("ouvre la fiche d'un gérant invité, sans parler de l'application", async () => {
    api.getInvitation.mockResolvedValue({
      email: "gerant@example.com",
      operatorName: "Parking Invité",
      role: "manager",
      stores,
    });
    api.acceptInvitation.mockResolvedValue({
      tokenData,
      user: { id: "s1", role: "manager" } as Staff,
    });
    renderPage();
    await screen.findByLabelText("Mot de passe");
    expect(
      screen.queryByText(/vous installerez l'application/),
    ).not.toBeInTheDocument();
    await choosePassword();
    expect(await screen.findByText("Ma fiche")).toBeInTheDocument();
  });
});
