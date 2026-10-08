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
vi.mock("@/lib/api", async importOriginal => {
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
  forwarding: 0,
};
const settings = (over: Partial<InboundSettings> = {}): InboundSettings => ({
  available: true,
  address: ADDRESS,
  lastReceivedAt: null,
  counts,
  toCheck: 0,
  senders: [{ provider: "Allopark", address: "info@allopark.com" }],
  forwarding: null,
  recent: [],
  ...over,
});

let client: QueryClient;
/** What the wizard's 5 s polling would bring, without waiting for it. */
const refetch = () => act(() => client.invalidateQueries({ queryKey: ["inbound-settings"] }));

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

describe("InboundSetupWizard (G-B : relier la boîte mail)", () => {
  beforeEach(() => {
    api.getInboundSettings.mockReset().mockResolvedValue(settings());
    api.enableInboundAddress.mockReset().mockResolvedValue(settings());
  });

  it("Gmail pas à pas : adresse, autorisation avec le code reçu, filtre sur l'écran simplifié, puis le premier mail", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    const wizard = screen.getByTestId("inbound-wizard");
    expect(within(wizard).getByRole("heading", { name: "Relier votre boîte mail" })).toBeInTheDocument();
    expect(within(wizard).getByText("Adresse").closest("li")).toHaveAttribute("aria-current", "step");
    expect(within(wizard).getByTestId("wizard-address")).toHaveTextContent(ADDRESS);
    // The address exists from the start: the wizard never asks the server for one.
    expect(api.enableInboundAddress).not.toHaveBeenCalled();

    // Step 2: nothing chosen yet, nothing to continue with.
    await user.click(screen.getByTestId("wizard-next"));
    expect(screen.getByTestId("wizard-next")).toBeDisabled();
    await user.click(within(screen.getByTestId("provider-gmail")).getByRole("radio"));
    expect(screen.getByText("Messagerie · Gmail")).toBeInTheDocument();
    expect(screen.getByTestId("gmail-code")).toHaveTextContent("En attente du code de Gmail…");

    // Gmail's code reaches Plazo: it shows up, spaced for reading.
    api.getInboundSettings.mockResolvedValue(
      settings({
        forwarding: {
          provider: "gmail",
          code: "482913507",
          requester: "boss@gmail.com",
          receivedAt: "2026-10-07T12:32:00Z",
        },
      }),
    );
    await refetch();
    expect(await screen.findByText("482 913 507")).toBeInTheDocument();
    expect(screen.getByText("Code de confirmation Gmail reçu à 14:32")).toBeInTheDocument();
    expect(screen.getByText("Demandé par boss@gmail.com")).toBeInTheDocument();

    // Step 3: the filter, with the sender and the address to copy, on Gmail's simplified screen.
    await user.click(screen.getByTestId("wizard-next"));
    expect(screen.getByRole("heading", { name: "Créez le filtre dans Gmail" })).toBeInTheDocument();
    expect(screen.getAllByTestId("copy-sender")[0]).toHaveTextContent("info@allopark.com");
    expect(screen.getAllByTestId("copy-address")[0]).toHaveTextContent(ADDRESS);
    expect(screen.getByText("Aperçu simplifié de l'écran Gmail")).toBeInTheDocument();
    const share = screen.getByTestId("wizard-share");
    const mail = decodeURIComponent(share.getAttribute("href")!);
    expect(mail).toContain("subject=Relier notre boîte mail à Plazo");
    expect(mail).toContain(`Transférer une copie à : ${ADDRESS}`);
    expect(mail).toContain("1. Dans Gmail, ouvrez la roue dentée › Voir tous les paramètres");
    expect(mail).not.toContain("**");

    // Step 4: waiting, then the first email arrives and is recorded.
    await user.click(screen.getByRole("button", { name: "J'ai créé le filtre" }));
    expect(screen.getByText("En attente du premier mail…")).toBeInTheDocument();
    api.getInboundSettings.mockResolvedValue(
      settings({
        counts: { ...counts, imported: 1 },
        recent: [
          {
            id: "e1",
            status: "imported",
            fromAddress: "info@allopark.com",
            fromName: "ALLOPARK",
            subject: "Confirmation AL-884880719",
            provider: "Allopark",
            reservationReference: "RXYZ99",
            receivedAt: new Date().toISOString(),
          },
        ],
      }),
    );
    await refetch();
    expect(await screen.findByTestId("wizard-ok")).toHaveTextContent("C'est relié.");
    expect(within(screen.getByTestId("wizard-recent")).getByText("Enregistrée")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Terminer" }));
    expect(screen.queryByTestId("inbound-wizard")).not.toBeInTheDocument();
    // Connected: the card now offers to look the steps up again.
    expect(await screen.findByRole("button", { name: "Revoir les étapes" })).toBeInTheDocument();
  });

  it("loueur d'avant le 08/10/2026 sans adresse : l'assistant la crée seul ; Outlook n'a pas d'autorisation et signale le blocage possible en entreprise ; Échap ferme", async () => {
    const user = userEvent.setup();
    // Every read says « no address »: only the POST can bring it, so the test proves the wizard used it.
    api.getInboundSettings.mockResolvedValue(settings({ address: null }));
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    expect(await screen.findByTestId("wizard-address")).toHaveTextContent(ADDRESS);
    expect(api.enableInboundAddress).toHaveBeenCalledTimes(1);
    expect(api.enableInboundAddress).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("wizard-preparing")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("wizard-next"));
    await user.click(within(screen.getByTestId("provider-outlook")).getByRole("radio"));
    expect(screen.getByText(/Pas d'autorisation à donner/)).toBeInTheDocument();
    await user.click(screen.getByTestId("wizard-next"));
    expect(screen.getByRole("heading", { name: "Créez la règle dans Outlook" })).toBeInTheDocument();
    expect(screen.getByText(/Microsoft 365/)).toBeInTheDocument();
    expect(screen.getByTestId("wizard-next")).toHaveTextContent("J'ai créé la règle");
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("inbound-wizard")).not.toBeInTheDocument();
  });

  it("un mail incomplet est bien reçu mais renvoie vers « À vérifier »", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValue(
      settings({
        recent: [
          {
            id: "e2",
            status: "incomplete",
            fromAddress: "boss@gmail.com",
            fromName: null,
            subject: "TR: Confirmation AL-884880719",
            provider: "Allopark",
            reservationReference: null,
            receivedAt: new Date().toISOString(),
          },
        ],
      }),
    );
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    await user.click(screen.getByTestId("wizard-next"));
    await user.click(within(screen.getByTestId("provider-other")).getByRole("radio"));
    await user.click(screen.getByTestId("wizard-next"));
    await user.click(screen.getByTestId("wizard-next"));
    expect(screen.getByTestId("wizard-to-check")).toHaveTextContent("attend dans « À vérifier »");
    expect(screen.getByRole("link", { name: "Voir les mails à vérifier" })).toHaveAttribute("href", "/reservations/a-verifier");
    expect(within(screen.getByTestId("wizard-recent")).getByText("Incomplet")).toBeInTheDocument();
  });
});
