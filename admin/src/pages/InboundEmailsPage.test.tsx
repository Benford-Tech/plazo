import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { InboundEmail, InboundEmailView } from "@/lib/types";
import InboundEmailsPage from "./InboundEmailsPage";

const api = vi.hoisted(() => ({ getInboundEmails: vi.fn(), handleInboundEmail: vi.fn(), archiveInboundEmail: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const BODY = [
  "Bonjour Jean Dupont,",
  "votre réservation est confirmée.",
  "",
  "Voir la réservation : https://allopark.com/r/AL-884880719.",
  "",
  "> Message d'origine",
  "> Merci",
].join("\n");

const email = (over: Partial<InboundEmail> = {}): InboundEmail => ({
  id: "e1",
  status: "incomplete",
  fromAddress: "info@allopark.com",
  fromName: "ALLOPARK",
  subject: "Confirmation AL-884880719",
  textBody: BODY,
  provider: "Allopark",
  parsed: { provider: "Allopark", externalReference: "AL-884880719", customerName: "Jean Dupont", arrivalAt: "2026-10-12T08:30", returnAt: "2026-10-14T17:00", priceCents: 3499 },
  missing: ["customerPhone", "plate"],
  reservationId: null,
  reservationReference: null,
  reading: null,
  receivedAt: "2026-10-06T08:00:00Z",
  ...over,
});

/** What the server would hold: the mocks move mails between tabs like the API does. */
let lists: Record<InboundEmailView, InboundEmail[]>;
const counts = () => ({ todo: lists.todo.length, done: lists.done.length, archived: lists.archived.length });
const move = (id: string, to: InboundEmailView, status: InboundEmail["status"]) => {
  const from = (Object.keys(lists) as InboundEmailView[]).find(v => lists[v].some(e => e.id === id))!;
  const row = { ...lists[from].find(e => e.id === id)!, status };
  lists[from] = lists[from].filter(e => e.id !== id);
  lists[to] = [row, ...lists[to]];
  return row;
};

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + " " + JSON.stringify(location.state)}</p>;
}

function Search() {
  const location = useLocation();
  return <p data-testid="search">{location.search}</p>;
}

function renderPage(entry = "/reservations/a-verifier") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/reservations/a-verifier"
            element={
              <>
                <InboundEmailsPage />
                <Search />
              </>
            }
          />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const reading = () => within(screen.getByTestId("inbound-reading"));
const tab = (name: RegExp) => screen.getByRole("tab", { name });

describe("InboundEmailsPage (M-A « Boîte de réception », T-A « Deux gestes »)", () => {
  beforeEach(() => {
    lists = {
      todo: [
        email(),
        email({ id: "e2", status: "unrecognised", provider: null, parsed: null, missing: [], subject: null, fromName: null, fromAddress: "client@example.com", textBody: "Bonjour, une question." }),
      ],
      done: [email({ id: "e3", status: "imported", missing: [], reservationId: "r9", reservationReference: "RXYZ99", textBody: null }), email({ id: "e4", status: "duplicate", missing: [] })],
      archived: [email({ id: "e5", status: "archived", missing: [] })],
    };
    api.getInboundEmails.mockReset().mockImplementation((view: InboundEmailView = "todo") => Promise.resolve({ data: lists[view], counts: counts() }));
    api.handleInboundEmail.mockReset().mockImplementation((id: string) => Promise.resolve({ data: move(id, "done", "handled") }));
    api.archiveInboundEmail.mockReset().mockImplementation((id: string) => Promise.resolve({ data: move(id, "archived", "archived") }));
  });

  it("trois onglets avec leurs compteurs, le premier mail ouvert, et le volet de lecture", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    expect(rows).toHaveLength(2);
    expect(api.getInboundEmails).toHaveBeenCalledWith("todo");

    expect(tab(/À traiter/)).toHaveAttribute("aria-selected", "true");
    expect(tab(/À traiter/)).toHaveTextContent("2");
    expect(tab(/Traités/)).toHaveAttribute("aria-selected", "false");
    expect(tab(/Traités/)).toHaveTextContent("2");
    expect(tab(/Archivés/)).toHaveTextContent("1");

    // The list: sender, subject, status, and the one-line summary.
    expect(within(rows[0]).getByRole("button")).toHaveAttribute("aria-current", "true");
    expect(within(rows[0]).getByText("ALLOPARK")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Incomplet")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Jean Dupont · 12 oct. 08:30 · AL-884880719")).toBeInTheDocument();
    expect(within(rows[1]).getByText("client@example.com")).toBeInTheDocument();
    expect(within(rows[1]).getByText("(sans objet)")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Non reconnu")).toBeInTheDocument();

    // The reading pane: header, the mail as it reads, and what Plazo understood.
    expect(reading().getByRole("heading", { level: 2, name: "Confirmation AL-884880719" })).toBeInTheDocument();
    expect(reading().getByText("ALLOPARK <info@allopark.com>")).toBeInTheDocument();
    expect(reading().getByText("Allopark")).toBeInTheDocument();
    expect(reading().getByText("Bonjour Jean Dupont,")).toBeInTheDocument();
    expect(reading().getByText("votre réservation est confirmée.")).toBeInTheDocument();
    const link = reading().getByRole("link", { name: "https://allopark.com/r/AL-884880719" });
    expect(link).toHaveAttribute("href", "https://allopark.com/r/AL-884880719");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(reading().getByText("> Message d'origine")).toHaveClass("text-muted-foreground");
    expect(reading().getByText("Bonjour Jean Dupont,")).not.toHaveClass("text-muted-foreground");

    const understood = within(screen.getByTestId("inbound-understood"));
    expect(understood.getByRole("heading", { level: 3, name: "Ce que Plazo a compris" })).toBeInTheDocument();
    expect(understood.getByText("Jean Dupont")).toBeInTheDocument();
    expect(understood.getByText("12 oct. 08:30")).toBeInTheDocument();
    expect(understood.getByText("34,99 €")).toBeInTheDocument();
    expect(understood.getByText("Téléphone")).toBeInTheDocument();
    expect(understood.getByText("Plaque")).toBeInTheDocument();
    expect(understood.getAllByText("manquant")).toHaveLength(2);

    expect(reading().getByText("Compléter et enregistrer")).toBeInTheDocument();
    expect(reading().getByText("Marquer comme traité")).toBeInTheDocument();
    expect(reading().getByText("Archiver")).toBeInTheDocument();
  });

  it("la sélection vit dans ?mail= ; « Retour » la retire ; un mail sans texte dit qu'il est effacé", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    expect(screen.getByTestId("search")).toHaveTextContent("");

    await userEvent.click(within(rows[1]).getByRole("button"));
    expect(screen.getByTestId("search")).toHaveTextContent("?mail=e2");
    expect(reading().getByRole("heading", { level: 2, name: "(sans objet)" })).toBeInTheDocument();
    expect(reading().getByText("Bonjour, une question.")).toBeInTheDocument();
    expect(reading().getByText("Saisir la réservation")).toBeInTheDocument();
    expect(screen.queryByTestId("inbound-understood")).not.toBeInTheDocument();

    await userEvent.click(reading().getByRole("button", { name: "Retour" }));
    expect(screen.getByTestId("search")).toHaveTextContent("");

    await userEvent.click(tab(/Traités/));
    await waitFor(() => expect(api.getInboundEmails).toHaveBeenCalledWith("done"));
    const done = await screen.findAllByTestId("inbound-row");
    expect(done).toHaveLength(2);
    expect(tab(/Traités/)).toHaveAttribute("aria-selected", "true");
    expect(within(done[0]).getByText("Enregistré")).toBeInTheDocument();
    expect(reading().getByText("Texte effacé (30 jours).")).toBeInTheDocument();
    expect(reading().getByRole("link", { name: "Ouvrir la réservation RXYZ99" })).toHaveAttribute("href", "/reservations/r9");
    // An imported mail is done by itself: nothing to mark, only to archive.
    expect(reading().queryByText("Marquer comme traité")).not.toBeInTheDocument();
    expect(reading().getByText("Archiver")).toBeInTheDocument();
  });

  it("« Compléter » mène au formulaire prérempli avec l'identifiant du mail", async () => {
    renderPage();
    await screen.findAllByTestId("inbound-row");
    await userEvent.click(reading().getByTestId("inbound-complete"));
    expect(screen.getByTestId("where")).toHaveTextContent("/reservations/nouvelle");
    expect(screen.getByTestId("where")).toHaveTextContent('"inboundId":"e1"');
    expect(screen.getByTestId("where")).toHaveTextContent('"customerName":"Jean Dupont"');
  });

  it("« Marquer comme traité » déplace le mail dans Traités et passe au suivant", async () => {
    renderPage();
    await screen.findAllByTestId("inbound-row");
    await userEvent.click(reading().getByTestId("inbound-handle"));
    await waitFor(() => expect(api.handleInboundEmail).toHaveBeenCalledWith("e1"));

    await waitFor(() => expect(screen.getAllByTestId("inbound-row")).toHaveLength(1));
    expect(screen.getByTestId("search")).toHaveTextContent("?mail=e2");
    expect(reading().getByRole("heading", { level: 2, name: "(sans objet)" })).toBeInTheDocument();
    await waitFor(() => expect(tab(/À traiter/)).toHaveTextContent("1"));
    expect(tab(/Traités/)).toHaveTextContent("3");

    await userEvent.click(tab(/Traités/));
    const done = await screen.findAllByTestId("inbound-row");
    expect(done).toHaveLength(3);
    expect(within(done[0]).getByText("Traité")).toBeInTheDocument();
    expect(within(done[0]).getByText("ALLOPARK")).toBeInTheDocument();
  });

  it("« Archiver » déplace le mail dans Archivés, où plus aucun geste n'est proposé", async () => {
    renderPage("/reservations/a-verifier?mail=e2");
    await screen.findAllByTestId("inbound-row");
    expect(reading().getByRole("heading", { level: 2, name: "(sans objet)" })).toBeInTheDocument();
    await userEvent.click(reading().getByTestId("inbound-archive"));
    await waitFor(() => expect(api.archiveInboundEmail).toHaveBeenCalledWith("e2"));

    await waitFor(() => expect(screen.getAllByTestId("inbound-row")).toHaveLength(1));
    // Its neighbour takes over the selection.
    expect(screen.getByTestId("search")).toHaveTextContent("?mail=e1");
    expect(reading().getByRole("heading", { level: 2, name: "Confirmation AL-884880719" })).toBeInTheDocument();

    await userEvent.click(tab(/Archivés/));
    const archived = await screen.findAllByTestId("inbound-row");
    expect(archived).toHaveLength(2);
    expect(within(archived[0]).getByText("Archivé")).toBeInTheDocument();
    expect(reading().queryByText("Marquer comme traité")).not.toBeInTheDocument();
    expect(reading().queryByText("Archiver")).not.toBeInTheDocument();
    expect(reading().queryByTestId("inbound-complete")).not.toBeInTheDocument();
  });

  it("un onglet vide le dit", async () => {
    lists.todo = [];
    renderPage();
    expect(await screen.findByText("Aucun mail à traiter.")).toBeInTheDocument();
    expect(tab(/À traiter/)).toHaveTextContent("0");
  });
  it("L-A : montre ce que Claude a lu, la pastille du genre et le résumé d'un mail sans champs", async () => {
    lists = {
      todo: [
        email({
          id: "c1",
          status: "unrecognised",
          fromAddress: "noreply@parkos.fr",
          fromName: "Parkos",
          subject: "Annulation PK-123456",
          provider: null,
          parsed: null,
          missing: [],
          reading: { kind: "cancellation", provider: "Parkos", confidence: 0.88, summary: "Annulation Parkos de Marie Dupont", model: "claude-test" },
        }),
        email({
          id: "c2",
          status: "incomplete",
          fromAddress: "noreply@parkos.fr",
          fromName: "Parkos",
          subject: "Nouvelle réservation PK-654321",
          provider: "Parkos",
          parsed: { provider: "Parkos", customerName: "Marie Dupont", plate: "AB-123-CD", arrivalAt: "2026-07-12T06:30", returnAt: "2026-07-19T22:15", customerPhone: "+33612345678" },
          missing: ["confidence"],
          reading: { kind: "booking", provider: "Parkos", confidence: 0.4, summary: "Réservation Parkos de Marie Dupont du 12 au 19 juillet", model: "claude-test" },
        }),
      ],
      done: [],
      archived: [],
    };
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    // The cancellation: its kind next to the state, Claude's summary as the line.
    expect(within(rows[0]).getByTestId("inbound-kind")).toHaveTextContent("Annulation");
    expect(within(rows[0]).getByText("Annulation Parkos de Marie Dupont")).toBeInTheDocument();
    expect(within(rows[1]).queryByTestId("inbound-kind")).toBeNull();
    const line = within(reading().getByTestId("inbound-reading-line"));
    expect(line.getByText("Annulation · Parkos · confiance 88 %")).toBeInTheDocument();
    expect(line.getByText(/Rien n'est créé de lui-même/)).toBeInTheDocument();
    // The unsure booking: the warning, and no "manquant" field for the confidence itself.
    await userEvent.click(within(rows[1]).getByRole("button"));
    const unsure = within(reading().getByTestId("inbound-reading-line"));
    expect(unsure.getByText("Réservation · Parkos · confiance 40 %")).toBeInTheDocument();
    expect(unsure.getByText(/lecture incertaine/)).toBeInTheDocument();
    expect(reading().getByText("Compléter et enregistrer")).toBeInTheDocument();
  });
});
