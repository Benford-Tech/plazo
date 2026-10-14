import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { InboundSettings } from "@/lib/types";
import { InboundEmailCard } from "./InboundEmailCard";

const api = vi.hoisted(() => ({
  getInboundSettings: vi.fn(),
  enableInboundAddress: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const ADDRESS = "parkair-lyon-7f3a@in.plazo.test";
const counts = {
  imported: 0,
  duplicate: 0,
  incomplete: 0,
  unrecognised: 0,
  dismissed: 0,
  handled: 0,
  archived: 0,
  forwarding: 0,
  ignored: 0,
};
const none = (provider: string) => ({
  provider,
  lastReceivedAt: null,
  lastStatus: null,
  arrival: "none" as const,
});
const settings = (over: Partial<InboundSettings> = {}): InboundSettings => ({
  available: true,
  address: ADDRESS,
  lastReceivedAt: null,
  counts,
  toCheck: 0,
  senders: [
    { provider: "Allopark", address: "info@allopark.com" },
    { provider: "Onepark", address: "onepark" },
  ],
  forwarding: null,
  recent: [],
  comparators: [
    none("Allopark"),
    none("Onepark"),
    none("Parclick"),
    none("ParkMundo"),
  ],
  progress: {
    confirmationAt: null,
    comparatorMailAt: null,
    comparator: null,
    bookingAt: null,
  },
  unexpected: { count: 0, lastAt: null },
  mailProvider: null,
  ...over,
});
const recentEmail = (status: "imported" | "incomplete") => ({
  id: `e-${status}`,
  status,
  fromAddress: "info@allopark.com",
  fromName: "ALLOPARK",
  subject: "Confirmation AL-884880719",
  provider: "Allopark",
  reservationReference: status === "imported" ? "RXYZ99" : null,
  receivedAt: new Date().toISOString(),
});

let client: QueryClient;
/** What the wizard's 5 s polling would bring, without waiting for it. */
const refetch = () =>
  act(() => client.invalidateQueries({ queryKey: ["inbound-settings"] }));

function renderCard() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <InboundEmailCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.getInboundSettings.mockReset().mockResolvedValue(settings());
  api.enableInboundAddress.mockReset().mockResolvedValue(settings());
});

describe("Mails entrants (C : l'adresse donnée aux comparateurs)", () => {
  it("une ligne par comparateur : dernier mail, comment il arrive, et comment faire avec le message à envoyer", async () => {
    const user = userEvent.setup();
    const hourAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    api.getInboundSettings.mockResolvedValue(
      settings({
        comparators: [
          {
            provider: "Allopark",
            lastReceivedAt: hourAgo,
            lastStatus: "imported",
            arrival: "direct",
          },
          {
            provider: "Onepark",
            lastReceivedAt: hourAgo,
            lastStatus: "imported",
            arrival: "forwarded",
          },
          {
            provider: "Parclick",
            lastReceivedAt: hourAgo,
            lastStatus: "incomplete",
            arrival: "manual",
          },
          none("ParkMundo"),
        ],
      }),
    );
    renderCard();
    expect(await screen.findByTestId("inbound-address")).toHaveTextContent(
      ADDRESS,
    );
    const row = (name: string) =>
      within(screen.getByTestId(`comparator-${name}`));
    expect(
      row("Allopark").getByText("il y a 2 h · réservation importée"),
    ).toBeInTheDocument();
    expect(row("Allopark").getByText("Directement")).toBeInTheDocument();
    expect(
      row("Onepark").getByText("Par votre messagerie"),
    ).toBeInTheDocument();
    expect(
      row("Parclick").getByText("Transféré à la main"),
    ).toBeInTheDocument();
    expect(row("ParkMundo").getByText("Aucun mail reçu")).toBeInTheDocument();
    expect(row("ParkMundo").getByText("À régler")).toBeInTheDocument();

    await user.click(
      row("ParkMundo").getByRole("button", { name: "Comment faire" }),
    );
    const steps = within(screen.getByTestId("comparator-ParkMundo-steps"));
    expect(
      steps.getByText(/Dans votre espace partenaire ParkMundo/),
    ).toBeInTheDocument();
    expect(
      steps.getByText(
        new RegExp(`ajouter l'adresse ${ADDRESS.replace(/\./g, "\\.")}`),
      ),
    ).toBeInTheDocument();
    expect(
      steps.getByRole("button", { name: "Copier le message" }),
    ).toBeInTheDocument();
    await user.click(row("ParkMundo").getByRole("button", { name: "Masquer" }));
    expect(
      screen.queryByTestId("comparator-ParkMundo-steps"),
    ).not.toBeInTheDocument();
    // The mailbox rule stays, for a comparator that cannot change the address.
    expect(
      screen.getByText(/Reliez plutôt votre boîte mail/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("inbound-connect")).toHaveTextContent(
      "Relier ma boîte mail",
    );
    expect(screen.queryByTestId("inbound-unexpected")).not.toBeInTheDocument();
  });

  it("la messagerie transfère tous les mails : l'alerte, qui ouvre l'assistant", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValue(
      settings({
        unexpected: { count: 3, lastAt: new Date().toISOString() },
        mailProvider: {
          id: "gmail",
          business: false,
          email: "boss@gmail.com",
          source: "account",
        },
      }),
    );
    renderCard();
    const alert = await screen.findByTestId("inbound-unexpected");
    expect(alert).toHaveTextContent("Plazo reçoit aussi vos autres mails");
    expect(alert).toHaveTextContent(
      "3 mails de ces 7 derniers jours ne venaient pas d'un comparateur",
    );
    await user.click(
      within(alert).getByRole("button", { name: "Corriger le réglage" }),
    );
    const wizard = await screen.findByTestId("wizard-unexpected");
    expect(wizard).toHaveTextContent("cochez « Désactiver le transfert »");
  });
});

describe("Relier votre boîte mail (A : l'assistant branché)", () => {
  it("Gmail détecté : chaque bouton ouvre la bonne page, Plazo coche le code, le premier mail d'un comparateur, puis la réservation", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValue(
      settings({
        mailProvider: {
          id: "gmail",
          business: false,
          email: "boss@gmail.com",
          source: "account",
        },
      }),
    );
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    const wizard = screen.getByTestId("inbound-wizard");
    expect(
      within(wizard).getByRole("heading", { name: "Relier votre boîte mail" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wizard-provider")).toHaveTextContent(
      "Gmail, détecté d'après boss@gmail.com",
    );
    expect(screen.getByTestId("wizard-address")).toHaveTextContent(ADDRESS);
    // The address exists from the start: the wizard never asks the server for one.
    expect(api.enableInboundAddress).not.toHaveBeenCalled();
    expect(screen.getByTestId("open-gmail-forwarding")).toHaveAttribute(
      "href",
      "https://mail.google.com/mail/u/0/#settings/fwdandpop",
    );
    expect(screen.getByTestId("open-gmail-forwarding")).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByTestId("open-gmail-filters")).toHaveAttribute(
      "href",
      "https://mail.google.com/mail/u/0/#settings/filters",
    );
    expect(screen.getAllByTestId("copy-sender")[0]).toHaveTextContent(
      "info@allopark.com OR onepark",
    );
    // A personal Gmail address: no Google Workspace note.
    expect(screen.queryByText(/Google Workspace : si/)).not.toBeInTheDocument();
    expect(screen.getByTestId("wizard-gmail-add")).toHaveAttribute(
      "data-state",
      "current",
    );
    expect(screen.getByTestId("wizard-gmail-filter")).toHaveAttribute(
      "data-state",
      "later",
    );
    expect(screen.getByTestId("gmail-code")).toHaveTextContent(
      "En attente du code de Gmail…",
    );

    // Gmail's code reaches Plazo: shown, spaced for reading, and the first block is done.
    const code = {
      provider: "gmail" as const,
      code: "482913507",
      link: "https://mail-settings.google.com/mail/vf-xyz",
      requester: "boss@gmail.com",
      receivedAt: new Date().toISOString(),
    };
    api.getInboundSettings.mockResolvedValue(
      settings({
        mailProvider: {
          id: "gmail",
          business: false,
          email: "boss@gmail.com",
          source: "forwarding",
        },
        forwarding: code,
        progress: {
          confirmationAt: code.receivedAt,
          comparatorMailAt: null,
          comparator: null,
          bookingAt: null,
        },
      }),
    );
    await refetch();
    expect(await screen.findByText("482 913 507")).toBeInTheDocument();
    expect(screen.getByTestId("gmail-link")).toHaveAttribute(
      "href",
      "https://mail-settings.google.com/mail/vf-xyz",
    );
    expect(screen.getByText("Demandé par boss@gmail.com")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-gmail-add")).toHaveAttribute(
      "data-state",
      "done",
    );
    expect(screen.getByTestId("wizard-gmail-filter")).toHaveAttribute(
      "data-state",
      "current",
    );
    expect(screen.getByTestId("seen-confirmation")).toHaveAttribute(
      "data-state",
      "done",
    );
    expect(screen.getByTestId("seen-comparator")).toHaveAttribute(
      "data-state",
      "current",
    );

    const share = decodeURIComponent(
      screen.getByTestId("wizard-share").getAttribute("href")!,
    );
    expect(share).toContain("subject=Relier notre boîte mail à Plazo");
    expect(share).toContain(`Transférer une copie à : ${ADDRESS}`);
    expect(share).toContain(
      "Dans Filtres et adresses bloquées, cliquez Créer un filtre",
    );
    expect(share).not.toContain("**");

    // The filter brings Allopark's email, which becomes a booking: everything ticked.
    const now = new Date().toISOString();
    api.getInboundSettings.mockResolvedValue(
      settings({
        mailProvider: {
          id: "gmail",
          business: false,
          email: "boss@gmail.com",
          source: "forwarding",
        },
        forwarding: code,
        counts: { ...counts, imported: 1 },
        recent: [recentEmail("imported")],
        progress: {
          confirmationAt: code.receivedAt,
          comparatorMailAt: now,
          comparator: "Allopark",
          bookingAt: now,
        },
      }),
    );
    await refetch();
    expect(await screen.findByTestId("wizard-ok")).toHaveTextContent(
      "C'est relié.",
    );
    expect(screen.getByTestId("seen-comparator")).toHaveTextContent(
      /Allopark · à \d\d:\d\d/,
    );
    expect(screen.getByTestId("seen-booking")).toHaveAttribute(
      "data-state",
      "done",
    );
    expect(screen.getByTestId("wizard-test")).toHaveAttribute(
      "data-state",
      "done",
    );
    expect(
      within(screen.getByTestId("wizard-recent")).getByText("Enregistrée"),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("wizard-done"));
    expect(screen.queryByTestId("inbound-wizard")).not.toBeInTheDocument();
    // Connected: the card now offers to look the steps up again.
    expect(
      await screen.findByRole("button", { name: "Revoir les étapes" }),
    ).toBeInTheDocument();
  });

  it("loueur d'avant le 08/10/2026 sans adresse, messagerie inconnue : l'adresse créée seule, le choix, Outlook et ses deux portes ; « Changer » ; Échap ferme", async () => {
    const user = userEvent.setup();
    // Every read says « no address »: only the POST can bring it, so the test proves the wizard used it.
    api.getInboundSettings.mockResolvedValue(settings({ address: null }));
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    expect(await screen.findByTestId("wizard-address")).toHaveTextContent(
      ADDRESS,
    );
    expect(api.enableInboundAddress).toHaveBeenCalledTimes(1);
    expect(api.enableInboundAddress).toHaveBeenCalledWith(false);
    expect(
      screen.getByText(
        "Sur quelle messagerie recevez-vous les mails des comparateurs ?",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-done")).not.toBeInTheDocument();
    await user.click(
      within(screen.getByTestId("provider-outlook")).getByRole("radio"),
    );
    expect(screen.getByTestId("wizard-provider")).toHaveTextContent("Outlook");
    expect(
      screen.getByRole("heading", { name: "Créer la règle dans Outlook" }),
    ).toBeInTheDocument();
    // Personal or Microsoft 365: unknown, both doors are offered.
    expect(screen.getByTestId("open-outlook")).toHaveAttribute(
      "href",
      "https://outlook.live.com/mail/",
    );
    expect(screen.getByTestId("open-outlook-work")).toHaveAttribute(
      "href",
      "https://outlook.office.com/mail/",
    );
    expect(
      screen.getByText(/Microsoft 365\) : le transfert/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wizard-done")).toHaveTextContent(
      "J'ai créé la règle",
    );
    expect(screen.queryByTestId("seen-confirmation")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Changer" }));
    expect(screen.getByTestId("provider-gmail")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("inbound-wizard")).not.toBeInTheDocument();
  });

  it("Google Workspace détecté par ses MX : la note de l'administrateur ; un mail incomplet renvoie vers « À vérifier »", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValue(
      settings({
        mailProvider: {
          id: "gmail",
          business: true,
          email: "contact@parkair.fr",
          source: "account",
        },
        recent: [recentEmail("incomplete")],
      }),
    );
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    expect(screen.getByTestId("wizard-provider")).toHaveTextContent(
      "Gmail, détecté d'après contact@parkair.fr",
    );
    expect(
      screen.getByText(
        /Google Workspace : si « Ajouter une adresse de transfert » n'apparaît pas/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wizard-to-check")).toHaveTextContent(
      "attend dans « À vérifier »",
    );
    expect(
      screen.getByRole("link", { name: "Voir les mails à vérifier" }),
    ).toHaveAttribute("href", "/reservations/a-verifier");
    expect(
      within(screen.getByTestId("wizard-recent")).getByText("Incomplet"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(screen.queryByTestId("inbound-wizard")).not.toBeInTheDocument();
  });
});
