import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ConfirmProvider } from "@/components/ui/confirm";
import type { Prospect } from "@/lib/types";
import ProspectingPage from "./ProspectingPage";

// Plateforme › Prospection (18/10/2026, « A avec les relances de B »). Fictional parkings only.

const api = vi.hoisted(() => ({
  getProspects: vi.fn(),
  getProspectingSettings: vi.fn(),
  sendProspects: vi.fn(),
  sendProspectTest: vi.fn(),
  importProspects: vi.fn(),
  setProspectStatus: vi.fn(),
  createProspect: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const base: Prospect = {
  id: "p1",
  email: "contact@alpha.example",
  companyName: "Parking Alpha",
  contactFirstName: "Camille",
  contactLastName: "Exemple",
  town: "Colombier-Saugnieu",
  airportCode: "LYS",
  airportName: "Lyon Saint-Exupéry",
  phone: null,
  notes: null,
  source: "csv",
  status: "to_contact",
  step: 0,
  nextStep: null,
  nextSendAt: null,
  firstContactedAt: null,
  lastContactedAt: null,
  stoppedAt: null,
  failedAttempts: 0,
  lastError: null,
  createdAt: "2026-10-18T08:00:00Z",
};
const prospects: Prospect[] = [
  base,
  { ...base, id: "p2", companyName: "Valet Bêta", email: "malik@beta.example", contactFirstName: "Malik", town: "Pusignan" },
  {
    ...base,
    id: "p3",
    companyName: "Navette Delta",
    email: "sophie@delta.example",
    status: "contacted",
    step: 1,
    nextStep: 2,
    nextSendAt: "2026-10-21T08:00:00Z",
  },
  { ...base, id: "p4", companyName: "Parking Thêta", email: "accueil@theta.example", status: "unsubscribed" },
];
const counts = { all: 4, to_contact: 2, contacted: 1, replied: 0, interested: 0, not_interested: 0, unsubscribed: 1 };
const settings = {
  steps: [
    { step: 1, enabled: true, delayDays: 0, subject: "{prénom}, vos réservations au même endroit", body: "Bonjour {prénom},\n\nJe vous écris au sujet de {parking}, près de {aéroport}." },
    { step: 2, enabled: true, delayDays: 4, subject: "Re : vos réservations", body: "Relance" },
    { step: 3, enabled: true, delayDays: 10, subject: "Une démo ?", body: "Dernier" },
  ],
  dailyCap: 50,
  updatedAt: null,
  sender: { name: "Plazo", email: "bonjour@plazo.test" },
  replyTo: null,
  configured: true,
};

const renderIn = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ConfirmProvider>
          <ProspectingPage />
        </ConfirmProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("Plateforme › Prospection", () => {
  beforeEach(() => {
    api.getProspects.mockImplementation(async ({ status }: { status?: string | null }) => ({
      data: status ? prospects.filter(p => p.status === status) : prospects,
      counts,
      airports: [{ code: "LYS", name: "Lyon Saint-Exupéry", count: 4 }],
      today: { sent: 12, cap: 50, remaining: 38 },
      window: { open: true, nextOpening: "2026-10-19T07:00:00Z" },
      configured: true,
    }));
    api.getProspectingSettings.mockResolvedValue({ data: settings });
  });

  it("liste, états, prochain envoi, compteur du jour et filtres", async () => {
    const user = userEvent.setup();
    renderIn();
    expect(await screen.findByText("Parking Alpha")).toBeInTheDocument();
    expect(screen.getByText("12 / 50 aujourd'hui")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tous · 4" })).toHaveAttribute("aria-pressed", "true");
    const delta = screen.getByText("Navette Delta").closest("tr")!;
    expect(within(delta).getByText("Mail 1 envoyé")).toBeInTheDocument();
    expect(within(delta).getByText("Relance · 21 oct.")).toBeInTheDocument();
    expect(within(screen.getByText("Parking Thêta").closest("tr")!).getByText("— jamais plus")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Désinscrits · 1" }));
    await waitFor(() => expect(api.getProspects).toHaveBeenLastCalledWith({ status: "unsubscribed", airport: null }));
    await waitFor(() => expect(screen.queryByText("Parking Alpha")).not.toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText("Aéroport"), "LYS");
    await waitFor(() => expect(api.getProspects).toHaveBeenLastCalledWith({ status: "unsubscribed", airport: "LYS" }));
  });

  it("aperçu pour le premier choisi, confirmation, envoi des seuls prospects à contacter", async () => {
    const user = userEvent.setup();
    api.sendProspects.mockResolvedValue({ enrolled: 2, sent: 2, failed: 0, queued: 0, skipped: 0, nextOpening: null });
    renderIn();
    await screen.findByText("Parking Alpha");
    expect(screen.getByRole("button", { name: "Envoyer à 0 prospect" })).toBeDisabled();
    await user.click(screen.getByLabelText("Choisir Parking Alpha"));
    await user.click(screen.getByLabelText("Choisir Valet Bêta"));
    await user.click(screen.getByLabelText("Choisir Navette Delta"));
    expect(screen.getByText("1 déjà contacté ou fermé : ignoré.")).toBeInTheDocument();
    const preview = screen.getByTestId("prospect-preview");
    expect(screen.getByText("Aperçu pour Parking Alpha")).toBeInTheDocument();
    expect(within(preview).getByText("Camille, vos réservations au même endroit")).toBeInTheDocument();
    expect(within(preview).getByText(/Je vous écris au sujet de Parking Alpha, près de Lyon Saint-Exupéry\./)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Envoyer à 2 prospects" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Le premier mail part maintenant pour 2 prospects/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.sendProspects).toHaveBeenCalledWith(["p1", "p2"]));
    expect(toast.success).toHaveBeenCalledWith("2 mails envoyés.");
  });

  it("import CSV : aperçu des lignes (doublon, désinscrit, erreur) avant l'import", async () => {
    const user = userEvent.setup();
    api.importProspects.mockImplementation(async (rows: unknown[], dryRun: boolean) =>
      dryRun
        ? {
            dryRun: true,
            created: 0,
            counts: { new: 1, duplicate: 1, suppressed: 1, invalid: 1 },
            results: [
              { row: 1, outcome: "new", email: "nouveau@gamma.example" },
              { row: 2, outcome: "duplicate", email: "contact@alpha.example" },
              { row: 3, outcome: "suppressed", email: "accueil@theta.example" },
              { row: 4, outcome: "invalid", fields: { email: "invalid_email" } },
            ],
          }
        : { dryRun: false, created: 1, counts: { new: 1, duplicate: 1, suppressed: 1, invalid: 1 }, results: [] },
    );
    renderIn();
    await screen.findByText("Parking Alpha");
    await user.click(screen.getByRole("button", { name: "Importer un CSV" }));
    const csv =
      "parking;prénom;e-mail\nParc Gamma;Inès;nouveau@gamma.example\nParking Alpha;Camille;contact@alpha.example\nParking Thêta;;accueil@theta.example\nSans adresse;;pas-une-adresse\n";
    await user.upload(screen.getByLabelText("Fichier CSV"), new File([csv], "prospects.csv", { type: "text/csv" }));
    expect(await screen.findByText("1 à ajouter · 1 déjà dans la liste · 1 désinscrit · 1 en erreur")).toBeInTheDocument();
    expect(api.importProspects).toHaveBeenCalledWith(
      [
        { companyName: "Parc Gamma", contactFirstName: "Inès", email: "nouveau@gamma.example" },
        { companyName: "Parking Alpha", contactFirstName: "Camille", email: "contact@alpha.example" },
        { companyName: "Parking Thêta", email: "accueil@theta.example" },
        { companyName: "Sans adresse", email: "pas-une-adresse" },
      ],
      true,
    );
    expect(screen.getByText("E-mail : Adresse email invalide.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Importer 1 prospect" }));
    await waitFor(() => expect(api.importProspects).toHaveBeenLastCalledWith(expect.any(Array), false));
    expect(toast.success).toHaveBeenCalledWith("1 prospect importé.");
  });

  it("actions d'un prospect : « Intéressé » arrête les relances ; « Inviter sur Plazo » préremplit l'invitation", async () => {
    const user = userEvent.setup();
    api.setProspectStatus.mockResolvedValue({ data: { ...base, status: "interested" } });
    renderIn();
    await screen.findByText("Parking Alpha");
    await user.click(screen.getByRole("button", { name: "Actions pour Parking Alpha" }));
    const invite = screen.getByRole("menuitem", { name: "Inviter sur Plazo" });
    expect(invite.getAttribute("href")).toBe(
      "/plateforme/loueurs?inviter=1&parking=Parking+Alpha&prenom=Camille&nom=Exemple&email=contact%40alpha.example",
    );
    await user.click(screen.getByRole("menuitem", { name: "Intéressé" }));
    await waitFor(() => expect(api.setProspectStatus).toHaveBeenCalledWith("p1", "interested"));
  });
});
