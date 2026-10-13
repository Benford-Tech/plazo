import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/components/ui/confirm";
import { ApiError } from "@/lib/api";
import type { JoinRequest, Staff } from "@/lib/types";
import TeamPage from "./TeamPage";

const auth = vi.hoisted(() => ({ user: null as Staff | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
const api = vi.hoisted(() => ({
  getTeam: vi.fn(),
  getJoinCode: vi.fn(),
  getJoinRequests: vi.fn(),
  acceptJoinRequest: vi.fn(),
  refuseJoinRequest: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const member = (patch: Partial<Staff>): Staff => ({
  id: "s1",
  operatorId: "o1",
  email: "claire@parkair.fr",
  firstName: "Claire",
  lastName: "Dubois",
  name: "Claire Dubois",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  ...patch,
});
const manager = member({ signIn: ["password"] });
const valet = member({ id: "s2", email: "karim.b@gmail.com", firstName: "Karim", lastName: "Benali", name: "Karim Benali", role: "valet", signIn: ["google"] });
const both = member({ id: "s3", email: "sophie@parkair.fr", firstName: "Sophie", lastName: "Laurent", name: "Sophie Laurent", role: "agent", signIn: ["password", "apple"] });

const joinCode = { code: "K7QM2-XP9TD", day: "2026-10-13", validUntil: "2026-10-13T22:00:00Z", operatorName: "Parkair Lyon" };
const julie: JoinRequest = {
  id: "j1",
  firstName: "Julie",
  lastName: "Martin",
  email: "julie.m@icloud.com",
  isPrivateEmail: false,
  provider: "apple",
  wishedRole: "driver",
  createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
  expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
};
const hidden: JoinRequest = { ...julie, id: "j2", firstName: "Hugo", lastName: "Petit", email: "x7k2@privaterelay.appleid.com", isPrivateEmail: true, wishedRole: "agent" };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ConfirmProvider>
        <TeamPage />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
  return client;
}

/** The 30 s poll of the requests, without waiting for it. */
const poll = (client: QueryClient) => act(() => client.refetchQueries({ queryKey: ["join-requests"] }));

const requestRow = async (id: string) => within(await screen.findByTestId(`join-request-${id}`));

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset());
  Object.values(toast).forEach(f => f.mockReset());
  auth.user = manager;
  api.getTeam.mockResolvedValue([manager, valet, both]);
  api.getJoinCode.mockResolvedValue(joinCode);
  api.getJoinRequests.mockResolvedValue({ data: [julie] });
});

describe("Équipe : code du jour", () => {
  it("montre le code du jour et copie le code ou un message prêt à envoyer", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderPage();
    const card = within(await screen.findByTestId("join-code-card"));
    expect(await card.findByTestId("join-code")).toHaveTextContent("K7QM2-XP9TD");
    expect(card.getByRole("heading", { name: "Code du jour" })).toBeInTheDocument();
    expect(card.getByText("change à minuit")).toBeInTheDocument();
    expect(card.getByText(/Une nouvelle recrue télécharge Plazo Pro, se connecte avec Apple ou Google et tape ce code/)).toBeInTheDocument();

    await user.click(card.getByRole("button", { name: "Copier le code" }));
    expect(writeText).toHaveBeenLastCalledWith("K7QM2-XP9TD");
    expect(toast.success).toHaveBeenLastCalledWith("Code copié.");

    await user.click(card.getByRole("button", { name: "Copier un message prêt à envoyer" }));
    expect(writeText).toHaveBeenLastCalledWith(
      "Rejoignez l’équipe de Parkair Lyon sur Plazo Pro : installez l’app, connectez-vous avec Apple ou Google, puis tapez le code du jour K7QM2-XP9TD. Il change à minuit.",
    );
    expect(toast.success).toHaveBeenLastCalledWith("Message copié : collez-le dans un SMS ou un mail.");
  });

  it("dit quand la copie est impossible, sans boîte de dialogue du navigateur", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Copier le code" }));
    expect(toast.error).toHaveBeenCalledWith("Copie impossible : sélectionnez le texte et copiez-le.");
  });

  it("dit qu'un parking de démonstration, suspendu ou archivé n'accepte pas de demandes, sans rien à copier", async () => {
    api.getJoinCode.mockResolvedValue({ ...joinCode, accepting: false });
    renderPage();
    const card = within(await screen.findByTestId("join-code-card"));
    expect(await card.findByText("Ce parking n'accepte pas de nouvelles demandes (démonstration, suspendu ou archivé).")).toBeInTheDocument();
    expect(card.queryByRole("button", { name: "Copier le code" })).not.toBeInTheDocument();
    expect(card.queryByText(/Une nouvelle recrue/)).not.toBeInTheDocument();
  });

  it("ne laisse pas le code d'hier à l'écran après minuit, et montre le nouveau au retour sur l'onglet", async () => {
    api.getJoinCode.mockResolvedValueOnce({ ...joinCode, validUntil: new Date(Date.now() + 150).toISOString() });
    api.getJoinCode.mockResolvedValue({ ...joinCode, code: "B4N8Q-ZT27W", day: "2026-10-14", validUntil: new Date(Date.now() + 86_400_000).toISOString() });
    renderPage();
    expect(await screen.findByTestId("join-code")).toHaveTextContent("K7QM2-XP9TD");
    expect(await screen.findByTestId("join-code-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("join-code")).not.toBeInTheDocument();
    act(() => {
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    });
    expect(await screen.findByTestId("join-code")).toHaveTextContent("B4N8Q-ZT27W");
  });

  it("montre un code lu après son heure de fin (horloge de l'ordinateur en avance)", async () => {
    api.getJoinCode.mockResolvedValue({ ...joinCode, validUntil: new Date(Date.now() - 3_600_000).toISOString() });
    renderPage();
    expect(await screen.findByTestId("join-code")).toHaveTextContent("K7QM2-XP9TD");
  });

  it("reste visible en consultation (lecture seule)", async () => {
    auth.user = { ...manager, viewAs: { operatorId: "o1", operatorName: "Parkair Lyon" } };
    renderPage();
    expect(await screen.findByTestId("join-code")).toHaveTextContent("K7QM2-XP9TD");
  });
});

describe("Équipe : demandes en attente", () => {
  it("n'affiche pas la carte sans demande", async () => {
    api.getJoinRequests.mockResolvedValue({ data: [] });
    renderPage();
    await screen.findByTestId("join-code");
    await waitFor(() => expect(api.getJoinRequests).toHaveBeenCalled());
    expect(screen.queryByText("Demandes en attente")).not.toBeInTheDocument();
  });

  it("liste chaque demande : nom, e-mail, Apple ou Google, poste demandé, ancienneté", async () => {
    api.getJoinRequests.mockResolvedValue({ data: [julie, hidden] });
    renderPage();
    const card = within(await screen.findByTestId("join-requests"));
    expect(card.getByRole("heading", { name: "Demandes en attente" })).toBeInTheDocument();
    expect(card.getByText("2 demandes en attente")).toBeInTheDocument();
    const row = await requestRow("j1");
    expect(row.getByText("Julie Martin")).toBeInTheDocument();
    expect(row.getByText("julie.m@icloud.com")).toBeInTheDocument();
    expect(row.getByTestId("sign-in-apple")).toHaveTextContent("Apple");
    expect(row.getByText("Chauffeur")).toBeInTheDocument();
    expect(row.getByText("il y a 3 min")).toBeInTheDocument();
    const other = await requestRow("j2");
    expect(other.getByText(/adresse relais d'Apple/)).toBeInTheDocument();
    expect(other.getByText("Accueil")).toBeInTheDocument();
  });

  it("fait avancer « il y a 3 min » entre deux lectures de la liste", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderPage();
      const row = await requestRow("j1");
      expect(row.getByText("il y a 3 min")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(row.getByText("il y a 4 min")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepte avec le rôle demandé, ou un autre, jamais gérant", async () => {
    const user = userEvent.setup();
    api.acceptJoinRequest.mockResolvedValue({ staff: member({ id: "s9", name: "Julie Martin", role: "valet" }) });
    renderPage();
    await user.click((await requestRow("j1")).getByRole("button", { name: "Accepter Julie Martin" }));

    const dialog = within(screen.getByRole("dialog", { name: "Accepter Julie Martin" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(/^julie\.m@icloud\.com · demande envoyée à \d\d:\d\d$/);
    expect(dialog.getByRole("radio", { name: /Chauffeur/ })).toBeChecked();
    expect(dialog.getAllByRole("radio")).toHaveLength(3);
    expect(dialog.queryByRole("radio", { name: /Gérant/ })).not.toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Accepter comme chauffeur" })).toBeInTheDocument();

    await user.click(dialog.getByRole("radio", { name: /Voiturier/ }));
    await user.click(dialog.getByRole("button", { name: "Accepter comme voiturier" }));
    await waitFor(() => expect(api.acceptJoinRequest).toHaveBeenCalledWith("j1", "valet"));
    expect(toast.success).toHaveBeenCalledWith("Julie Martin a rejoint l'équipe comme voiturier.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    // The team and the requests are read again.
    await waitFor(() => expect(api.getTeam).toHaveBeenCalledTimes(2));
    expect(api.getJoinRequests).toHaveBeenCalledTimes(2);
  });

  it("dit « agent d'accueil » dans les phrases, « Accueil » sur les choix", async () => {
    const user = userEvent.setup();
    api.getJoinRequests.mockResolvedValue({ data: [hidden] });
    api.acceptJoinRequest.mockResolvedValue({ staff: member({ id: "s9", name: "Hugo Petit", role: "agent" }) });
    renderPage();
    await user.click((await requestRow("j2")).getByRole("button", { name: "Accepter Hugo Petit" }));
    const dialog = within(screen.getByRole("dialog", { name: "Accepter Hugo Petit" }));
    expect(dialog.getByRole("radio", { name: /Accueil/ })).toBeChecked();
    await user.click(dialog.getByRole("button", { name: "Accepter comme agent d'accueil" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Hugo Petit a rejoint l'équipe comme agent d'accueil."));
  });

  it("Échap ferme le choix du rôle sans rien envoyer, et rend la main au bouton", async () => {
    const user = userEvent.setup();
    renderPage();
    const accept = (await requestRow("j1")).getByRole("button", { name: "Accepter Julie Martin" });
    await user.click(accept);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(accept).toHaveFocus();
    expect(api.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("ferme le choix du rôle quand la demande disparaît de la liste, et ne le rouvre jamais seul", async () => {
    const user = userEvent.setup();
    const client = renderPage();
    await user.click((await requestRow("j1")).getByRole("button", { name: "Accepter Julie Martin" }));
    expect(screen.getByRole("dialog", { name: "Accepter Julie Martin" })).toBeInTheDocument();

    // Julie cancels (or her request expires): the next poll no longer lists her.
    api.getJoinRequests.mockResolvedValue({ data: [] });
    await poll(client);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.info).toHaveBeenCalledWith("Cette demande n'est plus en attente : elle a été annulée, a expiré ou a déjà été traitée.");

    // A new request comes later: its card shows, no dialog opens by itself.
    api.getJoinRequests.mockResolvedValue({ data: [hidden] });
    await poll(client);
    await requestRow("j2");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it("ferme aussi le choix quand d'autres demandes restent", async () => {
    const user = userEvent.setup();
    api.getJoinRequests.mockResolvedValue({ data: [julie, hidden] });
    const client = renderPage();
    await user.click((await requestRow("j1")).getByRole("button", { name: "Accepter Julie Martin" }));
    api.getJoinRequests.mockResolvedValue({ data: [hidden] });
    await poll(client);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByTestId("join-request-j1")).not.toBeInTheDocument();
    expect(screen.getByTestId("join-request-j2")).toBeInTheDocument();
  });

  it("explique une adresse déjà utilisée, et relit la liste d'une demande qui n'est plus en attente", async () => {
    const user = userEvent.setup();
    api.acceptJoinRequest.mockRejectedValueOnce(new ApiError(409, "Email taken", "email_taken"));
    renderPage();
    await user.click((await requestRow("j1")).getByRole("button", { name: "Accepter Julie Martin" }));
    await user.click(screen.getByRole("button", { name: "Accepter comme chauffeur" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("déjà celle d'un compte Plazo, peut-être un ancien compte de votre équipe : réactivez-le")),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    api.acceptJoinRequest.mockRejectedValueOnce(new ApiError(409, "Closed", "join_request_closed"));
    api.getJoinRequests.mockResolvedValue({ data: [] });
    await user.click(screen.getByRole("button", { name: "Accepter comme chauffeur" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenLastCalledWith("Cette demande n'est plus en attente : elle a été annulée, a expiré ou a déjà été traitée."),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByTestId("join-requests")).not.toBeInTheDocument());
  });

  it("refuse après confirmation, et rien sans elle", async () => {
    const user = userEvent.setup();
    api.refuseJoinRequest.mockResolvedValue({ request: { ...julie, status: "refused" } });
    renderPage();
    const refuse = (await requestRow("j1")).getByRole("button", { name: "Refuser Julie Martin" });

    await user.click(refuse);
    let question = within(screen.getByRole("alertdialog"));
    expect(question.getByText(/Julie Martin ne rejoindra pas l'équipe/)).toBeInTheDocument();
    await user.click(question.getByRole("button", { name: "Annuler" }));
    expect(api.refuseJoinRequest).not.toHaveBeenCalled();

    await user.click(refuse);
    question = within(screen.getByRole("alertdialog", { name: "Refuser la demande" }));
    await user.click(question.getByRole("button", { name: "Refuser" }));
    await waitFor(() => expect(api.refuseJoinRequest).toHaveBeenCalledWith("j1"));
    expect(toast.success).toHaveBeenCalledWith("Demande de Julie Martin refusée.");
  });

  it("en consultation d'un loueur, montre les demandes sans permettre d'y répondre", async () => {
    auth.user = { ...manager, viewAs: { operatorId: "o1", operatorName: "Parkair Lyon" } };
    renderPage();
    const row = await requestRow("j1");
    expect(row.getByRole("button", { name: "Accepter Julie Martin" })).toBeDisabled();
    expect(row.getByRole("button", { name: "Refuser Julie Martin" })).toBeDisabled();
  });

  it("sur le compte de la plateforme en consultation, les demandes se traitent", async () => {
    auth.user = { ...manager, viewAs: { operatorId: "o1", operatorName: "Plazo (tests)", platformAccount: true } };
    renderPage();
    const row = await requestRow("j1");
    expect(row.getByRole("button", { name: "Accepter Julie Martin" })).toBeEnabled();
    expect(row.getByRole("button", { name: "Refuser Julie Martin" })).toBeEnabled();
  });
});

describe("Équipe : comment chacun se connecte", () => {
  it("montre E-mail, Apple ou Google sur chaque membre", async () => {
    renderPage();
    const karim = (await screen.findByText("Karim Benali")).closest("li")!;
    expect(within(karim).getByTestId("sign-in-google")).toHaveTextContent("Google");
    expect(within(karim).queryByTestId("sign-in-password")).not.toBeInTheDocument();
    const sophie = screen.getByText("Sophie Laurent").closest("li")!;
    expect(within(sophie).getByTestId("sign-in-password")).toHaveTextContent("E-mail");
    expect(within(sophie).getByTestId("sign-in-apple")).toHaveTextContent("Apple");
    expect(within(sophie).getByText("Se connecte avec :")).toHaveClass("sr-only");
  });

  it("ne montre rien avec une ancienne API sans signIn", async () => {
    api.getTeam.mockResolvedValue([member({ signIn: undefined })]);
    renderPage();
    await screen.findByText("Claire Dubois");
    expect(screen.queryByText("Se connecte avec :")).not.toBeInTheDocument();
  });
});
