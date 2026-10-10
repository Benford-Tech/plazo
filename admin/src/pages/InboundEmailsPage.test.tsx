import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ApiError } from "@/lib/api";
import type { InboundEmail, InboundEmailView, InboundReanalysis } from "@/lib/types";
import InboundEmailsPage from "./InboundEmailsPage";

const api = vi.hoisted(() => ({ getInboundEmails: vi.fn(), handleInboundEmail: vi.fn(), archiveInboundEmail: vi.fn(), reanalyseInboundEmail: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
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
  analysedAt: null,
  pageLookup: null,
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
    api.reanalyseInboundEmail.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
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
  it("10/10/2026 (« Prévent captcha ») : la page Allopark protégée se lit sous « Reconnu » avec son lien ; lue, sans lien ; jamais essayée, rien", async () => {
    const page = "https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking";
    lists = {
      todo: [
        email({ id: "p1", subject: "Protégée", pageLookup: { outcome: "protected", url: page, at: "2026-10-10T09:00:00Z" } }),
        email({ id: "p2", subject: "Indisponible", pageLookup: { outcome: "unavailable", url: page, at: "2026-10-10T09:00:00Z" } }),
        email({ id: "p3", subject: "Introuvable", pageLookup: { outcome: "not_found", url: page, at: "2026-10-10T09:00:00Z" } }),
        email({ id: "p4", subject: "Sans page" }),
      ],
      done: [email({ id: "p5", status: "imported", missing: [], reservationId: "r9", subject: "Lue", pageLookup: { outcome: "read", url: null, at: "2026-10-10T09:00:00Z" } })],
      archived: [],
    };
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    const line = () => within(reading().getByTestId("inbound-allopark-line"));
    expect(line().getByText("Page Allopark :", { exact: false })).toBeInTheDocument();
    expect(line().getByText("vérification anti-robot demandée")).toBeInTheDocument();
    const link = reading().getByTestId("inbound-allopark-page");
    expect(link).toHaveTextContent("Ouvrir la page Allopark");
    expect(link).toHaveAttribute("href", page);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // The staff complete the booking from what they read there.
    expect(reading().getByText("Compléter et enregistrer")).toBeInTheDocument();

    await userEvent.click(within(rows[1]).getByRole("button"));
    expect(line().getByText("indisponible")).toBeInTheDocument();
    expect(reading().getByTestId("inbound-allopark-page")).toHaveAttribute("href", page);
    await userEvent.click(within(rows[2]).getByRole("button"));
    expect(line().getByText("réservation introuvable sur la page")).toBeInTheDocument();
    expect(reading().getByTestId("inbound-allopark-page")).toBeInTheDocument();
    await userEvent.click(within(rows[3]).getByRole("button"));
    expect(reading().queryByTestId("inbound-allopark-line")).toBeNull();

    await userEvent.click(tab(/Traités/));
    await screen.findByRole("heading", { level: 2, name: "Lue" });
    expect(line().getByText("lue, champs complétés")).toBeInTheDocument();
    expect(reading().queryByTestId("inbound-allopark-page")).toBeNull();
  });
  describe("10/10/2026 (« C'est une modification ») : une modification Allopark", () => {
    const CHANGE_TEXT = "ALLOPARK\nVotre réservation AL-884880719 a été modifiée.";
    const changes = [
      { field: "returnAt" as const, from: "2026-12-13T20:30", to: "2026-12-15T18:00" },
      { field: "passengers" as const, from: 3, to: 4 },
      { field: "priceCents" as const, from: 2400, to: 2900 },
      { field: "departureFlight" as const, from: null, to: "TO 3626" },
    ];
    const changed = (over: Partial<InboundEmail> = {}) =>
      email({
        id: "m1",
        subject: "Modification de votre réservation AL-884880719",
        textBody: CHANGE_TEXT,
        status: "imported",
        missing: [],
        reservationId: "r7",
        reservationReference: "R7KQ2M",
        change: { applied: true, reason: null, reservationId: "r7", reference: "R7KQ2M", changes, at: "2026-10-10T09:00:00Z" },
        ...over,
      });

    it("appliquée : le bloc la dit avec le lien vers la réservation et une ligne par changement, à la place de « Ce que Plazo a compris »", async () => {
      // Read as a change by Claude: its line no longer says that nothing is done.
      lists = {
        todo: [],
        done: [changed({ reading: { kind: "modification", provider: "Allopark", confidence: 0.9, summary: "Nouvelles dates pour AL-884880719", model: "claude-test" } })],
        archived: [],
      };
      renderPage();
      await userEvent.click(await screen.findByRole("tab", { name: /Traités/ }));
      await screen.findByRole("heading", { level: 2, name: "Modification de votre réservation AL-884880719" });
      const block = within(reading().getByTestId("inbound-change"));
      expect(block.getByRole("heading", { level: 3 })).toHaveTextContent("Modification appliquée à la réservation R7KQ2M");
      expect(block.getByRole("link", { name: "R7KQ2M" })).toHaveAttribute("href", "/reservations/r7");
      expect(block.getAllByTestId("inbound-change-line").map(line => line.textContent)).toEqual([
        "Date de retour : 13 déc. 20:30 → 15 déc. 18:00",
        "Passagers : 3 → 4",
        "Prix : 24,00 € → 29,00 €",
        "Vol aller : — → TO 3626",
      ]);
      expect(block.queryByTestId("inbound-change-reason")).toBeNull();
      expect(reading().queryByTestId("inbound-understood")).toBeNull();
      expect(within(reading().getByTestId("inbound-reading-line")).queryByText(/Rien n'est créé de lui-même/)).toBeNull();
      // The row says it is a change.
      expect(within(screen.getAllByTestId("inbound-row")[0]).getByTestId("inbound-kind")).toHaveTextContent("Modification");
    });

    it("à faire à la main : la raison en français, les changements, et la réservation à ouvrir à la place de « Compléter »", async () => {
      lists = {
        todo: [
          changed({
            status: "unrecognised",
            reservationId: null,
            reservationReference: null,
            change: { applied: false, reason: "already_arrived", reservationId: "r7", reference: "R7KQ2M", changes: changes.slice(0, 2), at: "2026-10-10T09:00:00Z" },
          }),
          changed({
            id: "m2",
            subject: "Votre réservation AL-884880719 a été modifiée",
            status: "unrecognised",
            reservationId: null,
            reservationReference: null,
            change: { applied: false, reason: "no_room", reservationId: "r7", reference: "R7KQ2M", changes: changes.slice(0, 1), at: "2026-10-10T09:00:00Z" },
          }),
        ],
        done: [],
        archived: [],
      };
      renderPage();
      await screen.findAllByTestId("inbound-row");
      const block = within(reading().getByTestId("inbound-change"));
      expect(block.getByRole("heading", { level: 3 })).toHaveTextContent("Modification à faire à la main · réservation R7KQ2M");
      expect(block.getByRole("link", { name: "R7KQ2M" })).toHaveAttribute("href", "/reservations/r7");
      // 10/10/2026 (relecture): recognised, to do by hand: never « Non reconnu », in the list as in the pane.
      expect(within(screen.getAllByTestId("inbound-row")[0]).getByTestId("inbound-status")).toHaveTextContent("À faire à la main");
      expect(reading().getByTestId("inbound-status")).toHaveTextContent("À faire à la main");
      expect(screen.queryByText("Non reconnu")).toBeNull();
      expect(block.getByTestId("inbound-change-reason")).toHaveTextContent("La voiture est déjà arrivée : la date d'arrivée n'a pas été changée.");
      expect(block.getByTestId("inbound-change-reason")).toHaveTextContent("Plazo n'a rien changé");
      expect(block.getAllByTestId("inbound-change-line")).toHaveLength(2);
      expect(reading().queryByTestId("inbound-complete")).toBeNull();
      expect(reading().getByTestId("inbound-change-booking")).toHaveTextContent("Ouvrir la réservation R7KQ2M");
      expect(reading().getByTestId("inbound-change-booking")).toHaveAttribute("href", "/reservations/r7");
      // Still to deal with: handled or re-analysed once the booking allows it.
      expect(reading().getByTestId("inbound-handle")).toBeInTheDocument();
      expect(reading().getByTestId("inbound-reanalyse")).toBeInTheDocument();

      await userEvent.click(within(screen.getAllByTestId("inbound-row")[1]).getByRole("button"));
      expect(within(reading().getByTestId("inbound-change")).getByTestId("inbound-change-reason")).toHaveTextContent("Plus de place aux nouvelles dates.");
    });

    it("10/10/2026 (relecture) : traitée à la main, la modification mène encore à sa réservation", async () => {
      lists = {
        todo: [],
        done: [
          changed({
            status: "handled",
            reservationId: null,
            reservationReference: null,
            change: { applied: false, reason: "reservation_closed", reservationId: "r7", reference: "R7KQ2M", changes: changes.slice(0, 1), at: "2026-10-10T09:00:00Z" },
          }),
        ],
        archived: [],
      };
      renderPage();
      await userEvent.click(await screen.findByRole("tab", { name: /Traités/ }));
      const block = within(await screen.findByTestId("inbound-change"));
      expect(block.getByRole("heading", { level: 3 })).toHaveTextContent("Modification à faire à la main · réservation R7KQ2M");
      expect(block.getByRole("link", { name: "R7KQ2M" })).toHaveAttribute("href", "/reservations/r7");
      expect(reading().queryByTestId("inbound-change-booking")).toBeNull();
      expect(reading().getByTestId("inbound-status")).toHaveTextContent("Traité");
    });

    it("déjà à jour : le doublon le dit, sans ligne", async () => {
      lists = {
        todo: [],
        done: [changed({ status: "duplicate", change: { applied: false, reason: null, reservationId: "r7", reference: "R7KQ2M", changes: [], at: "2026-10-10T09:00:00Z" } })],
        archived: [],
      };
      renderPage();
      await userEvent.click(await screen.findByRole("tab", { name: /Traités/ }));
      const block = within(await screen.findByTestId("inbound-change"));
      expect(block.getByRole("heading", { level: 3 })).toHaveTextContent("Modification déjà prise en compte dans la réservation R7KQ2M");
      expect(block.getByText("Aucun changement : la réservation était déjà à jour.")).toBeInTheDocument();
      expect(block.queryByTestId("inbound-change-reason")).toBeNull();
    });

    it("« Relancer l'analyse » qui applique la modification : le toast la dit", async () => {
      lists = {
        todo: [
          changed({
            status: "unrecognised",
            reservationId: null,
            reservationReference: null,
            change: { applied: false, reason: "no_room", reservationId: "r7", reference: "R7KQ2M", changes: changes.slice(0, 1), at: "2026-10-10T09:00:00Z" },
          }),
        ],
        done: [],
        archived: [],
      };
      api.reanalyseInboundEmail.mockImplementation((id: string) => {
        const row = move(id, "done", "imported");
        const applied = { ...changed(), ...row, status: "imported" as const, reservationId: "r7", reservationReference: "R7KQ2M", change: changed().change };
        lists.done[0] = applied;
        return Promise.resolve({ email: applied, outcome: "changed" });
      });
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Modification appliquée à la réservation R7KQ2M."));
    });

    it("« Relancer l'analyse » qui laisse la modification à la main : le toast le dit", async () => {
      const left = changed({
        status: "unrecognised",
        reservationId: null,
        reservationReference: null,
        change: { applied: false, reason: "no_room", reservationId: "r7", reference: "R7KQ2M", changes: changes.slice(0, 1), at: "2026-10-10T09:00:00Z" },
      });
      lists = { todo: [left], done: [], archived: [] };
      api.reanalyseInboundEmail.mockResolvedValue({ email: left, outcome: "unrecognised" });
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Analyse relancée : la modification reste à faire à la main."));
    });
  });

  it("relecture : un ?mail= absent de l'onglet n'ouvre pas un autre mail et quitte l'adresse ; un doublon n'a pas « Marquer comme traité »", async () => {
    lists = {
      todo: [email({ id: "e1" }), email({ id: "e2", subject: "Deuxième" })],
      done: [email({ id: "d1", status: "duplicate", subject: "Déjà connu", reservationId: "r1", reservationReference: "RABC12", missing: [] })],
      archived: [],
    };
    renderPage("/reservations/a-verifier?mail=gone");
    // The list is shown (no detail forced open on a phone), the first mail reads by default, the stale id goes.
    const rows = await screen.findAllByTestId("inbound-row");
    expect(screen.getByRole("list")).not.toHaveClass("hidden");
    expect(within(rows[0]).getByRole("button")).toHaveAttribute("aria-current", "true");
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent(""));
    // In « Traités », a duplicate is attached to its booking: open it or archive it, nothing to mark.
    await userEvent.click(screen.getByRole("tab", { name: /Traités/ }));
    await screen.findByRole("heading", { level: 2, name: "Déjà connu" });
    expect(reading().getByText("Ouvrir la réservation RABC12")).toBeInTheDocument();
    expect(reading().queryByText("Marquer comme traité")).toBeNull();
    expect(reading().getByText("Archiver")).toBeInTheDocument();
  });

  it("relecture : un import refusé se lit en une phrase, les onglets répondent aux flèches", async () => {
    lists = {
      todo: [email({ id: "e1", missing: ["stay_too_long"] })],
      done: [],
      archived: [],
    };
    renderPage();
    await screen.findAllByTestId("inbound-row");
    expect(screen.getByTestId("inbound-refused")).toHaveTextContent("Réservation refusée à l'import : Séjour de plus de 90 jours.");
    expect(reading().queryByText("manquant")).toBeNull();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map(tab => tab.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Traités/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Traités/ })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Archivés/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /À traiter/ })).toHaveAttribute("aria-selected", "true");
  });

  describe("« Relancer l'analyse » (10/10/2026)", () => {
    /** A promise the test settles when it wants: the analysis takes its time. */
    function deferred<T>() {
      let resolve!: (value: T) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it("proposé pour un mail en attente, pas pour un mail enregistré ni pour un mail sans texte", async () => {
      lists = {
        todo: [email(), email({ id: "e6", subject: "Texte effacé", textBody: null })],
        done: [email({ id: "e3", status: "imported", subject: "Enregistré", missing: [], reservationId: "r9", reservationReference: "RXYZ99" })],
        archived: [],
      };
      renderPage();
      await screen.findAllByTestId("inbound-row");
      expect(reading().getByTestId("inbound-reanalyse")).toHaveTextContent("Relancer l'analyse");
      expect(reading().queryByTestId("inbound-analysed")).toBeNull();
      // 10/10/2026 (« mets les boutons d'action en haut du mail »): the toolbar comes before the subject.
      const toolbar = reading().getByRole("toolbar", { name: "Actions du mail" });
      expect(within(toolbar).getByTestId("inbound-reanalyse")).toBeInTheDocument();
      expect(toolbar.compareDocumentPosition(reading().getByRole("heading", { level: 2 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      await userEvent.click(within(screen.getAllByTestId("inbound-row")[1]).getByRole("button"));
      expect(reading().getByText("Texte effacé (30 jours).")).toBeInTheDocument();
      expect(reading().queryByTestId("inbound-reanalyse")).toBeNull();

      await userEvent.click(tab(/Traités/));
      await screen.findByRole("heading", { level: 2, name: "Enregistré" });
      expect(reading().queryByTestId("inbound-reanalyse")).toBeNull();
    });

    it("« Analyse en cours… » pendant l'analyse, puis la réservation créée : toast et mail suivant", async () => {
      const pending = deferred<InboundReanalysis>();
      api.reanalyseInboundEmail.mockImplementation(() => pending.promise);
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      expect(api.reanalyseInboundEmail).toHaveBeenCalledWith("e1");

      // Every action of the pane waits for the analysis.
      await waitFor(() => expect(reading().getByTestId("inbound-reanalyse")).toHaveTextContent("Analyse en cours…"));
      expect(reading().getByTestId("inbound-reanalyse")).toBeDisabled();
      expect(reading().getByTestId("inbound-complete")).toBeDisabled();
      expect(reading().getByTestId("inbound-handle")).toBeDisabled();
      expect(reading().getByTestId("inbound-archive")).toBeDisabled();

      // The server created the booking: the mail leaves « À traiter » for « Traités ».
      const row = move("e1", "done", "imported");
      const imported = { ...row, missing: [], reservationId: "r7", reservationReference: "RAB123", analysedAt: "2026-10-10T09:15:00Z" };
      lists.done[0] = imported;
      pending.resolve({ email: imported, outcome: "imported" });

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Réservation RAB123 créée depuis ce mail."));
      await waitFor(() => expect(screen.getAllByTestId("inbound-row")).toHaveLength(1));
      expect(screen.getByTestId("search")).toHaveTextContent("?mail=e2");
      expect(reading().getByRole("heading", { level: 2, name: "(sans objet)" })).toBeInTheDocument();
      expect(reading().getByTestId("inbound-reanalyse")).toHaveTextContent("Relancer l'analyse");
      expect(reading().getByTestId("inbound-reanalyse")).toBeEnabled();
      await waitFor(() => expect(tab(/Traités/)).toHaveTextContent("3"));

      await userEvent.click(tab(/Traités/));
      await waitFor(() => expect(reading().getByRole("link", { name: "Ouvrir la réservation RAB123" })).toBeInTheDocument());
      expect(reading().queryByTestId("inbound-reanalyse")).toBeNull();
      expect(reading().getByTestId("inbound-analysed")).toHaveTextContent("Analysé de nouveau le");
    });

    it("toujours incomplet : le mail reste ouvert avec ce que Plazo a compris, le toast dit ce qui manque", async () => {
      api.reanalyseInboundEmail.mockImplementation((id: string) => {
        const updated = {
          ...lists.todo.find(e => e.id === id)!,
          parsed: { provider: "Allopark", externalReference: "AL-884880719", customerName: "Jean Dupont", plate: "AB-123-CD", arrivalAt: "2026-10-12T08:30", returnAt: "2026-10-14T17:00", priceCents: 3499 },
          missing: ["customerPhone"],
          analysedAt: "2026-10-10T09:15:00Z",
        };
        lists.todo = lists.todo.map(e => (e.id === id ? updated : e));
        return Promise.resolve({ email: updated, outcome: "incomplete" });
      });
      renderPage();
      await screen.findAllByTestId("inbound-row");
      expect(within(screen.getByTestId("inbound-understood")).getAllByText("manquant")).toHaveLength(2);
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      expect(api.reanalyseInboundEmail).toHaveBeenCalledWith("e1");

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Analyse relancée, champ encore manquant : téléphone."));
      // Still in « À traiter », still selected: the plate is now read, only the phone is missing.
      expect(screen.getAllByTestId("inbound-row")).toHaveLength(2);
      expect(reading().getByRole("heading", { level: 2, name: "Confirmation AL-884880719" })).toBeInTheDocument();
      await waitFor(() => expect(within(screen.getByTestId("inbound-understood")).getAllByText("manquant")).toHaveLength(1));
      expect(within(screen.getByTestId("inbound-understood")).getByText("AB-123-CD")).toBeInTheDocument();
      expect(reading().getByTestId("inbound-analysed")).toHaveTextContent("Analysé de nouveau le :");
      expect(reading().getByTestId("inbound-reanalyse")).toBeEnabled();
    });

    it("un refus du serveur se lit dans les mots de la boîte de réception", async () => {
      api.reanalyseInboundEmail.mockRejectedValue(new ApiError(409, "Already attached", "already_imported"));
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ce mail est déjà rattaché à une réservation."));
      expect(reading().getByTestId("inbound-reanalyse")).toBeEnabled();
    });

    it.each([
      ["text_gone", "Le texte de ce mail a été effacé (30 jours) : il ne peut plus être analysé."],
      ["analysis_running", "Ce mail vient d'être analysé : réessayez dans 30 secondes."],
    ])("le refus %s se lit dans les mots communs de l'espace pro", async (code, text) => {
      api.reanalyseInboundEmail.mockRejectedValue(new ApiError(409, "Refused", code));
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(text));
    });

    it.each<[string, InboundReanalysis["outcome"], Partial<InboundEmail>, string]>([
      ["doublon", "duplicate", { status: "duplicate", missing: [], reservationId: "r1", reservationReference: "RABC12" }, "Cette réservation existait déjà : le mail y est rattaché."],
      ["non reconnu", "unrecognised", { status: "unrecognised", provider: null, parsed: null, missing: [] }, "Analyse relancée : ce mail n'est toujours pas reconnu comme une réservation."],
      [
        "plusieurs champs",
        "incomplete",
        { missing: ["plate", "customerPhone", "customerName"] },
        "Analyse relancée, champs encore manquants : nom du client, téléphone et plaque.",
      ],
      ["refus à l'import", "incomplete", { missing: ["stay_too_long"] }, "Analyse relancée. Réservation refusée à l'import : Séjour de plus de 90 jours."],
      ["lecture incertaine", "incomplete", { missing: ["confidence"] }, "Analyse relancée : la lecture reste incertaine, vérifiez chaque champ."],
    ])("toast du résultat : %s", async (_name, outcome, over, text) => {
      api.reanalyseInboundEmail.mockResolvedValue({ email: { ...email(), analysedAt: "2026-10-10T09:15:00Z", ...over }, outcome });
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(text));
    });

    it("un mail traité qui reste incomplet reste ouvert dans « Traités »", async () => {
      lists = { todo: [], done: [email({ id: "h1", status: "handled", subject: "Traité à la main" }), email({ id: "h2", status: "handled", subject: "Autre" })], archived: [] };
      api.reanalyseInboundEmail.mockImplementation((id: string) => {
        const updated = { ...lists.done.find(e => e.id === id)!, missing: ["customerPhone"], analysedAt: "2026-10-10T09:15:00Z" };
        lists.done = lists.done.map(e => (e.id === id ? updated : e));
        return Promise.resolve({ email: updated, outcome: "incomplete" });
      });
      renderPage();
      await screen.findByText("Aucun mail à traiter.");
      await userEvent.click(tab(/Traités/));
      await screen.findByRole("heading", { level: 2, name: "Traité à la main" });
      // Set aside but without booking: it can be analysed again.
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Analyse relancée, champ encore manquant : téléphone."));
      expect(screen.getAllByTestId("inbound-row")).toHaveLength(2);
      expect(reading().getByRole("heading", { level: 2, name: "Traité à la main" })).toBeInTheDocument();
      await waitFor(() => expect(reading().getByTestId("inbound-analysed")).toBeInTheDocument());
    });

    it("un mail archivé dont la réservation est créée quitte « Archivés » ; la sélection passe à son voisin", async () => {
      lists = { todo: [], done: [], archived: [email({ id: "a1", status: "archived", subject: "Archivé un" }), email({ id: "a2", status: "archived", subject: "Archivé deux" })] };
      api.reanalyseInboundEmail.mockImplementation((id: string) => {
        const row = move(id, "done", "imported");
        const imported = { ...row, missing: [], reservationId: "r7", reservationReference: "RAB123", analysedAt: "2026-10-10T09:15:00Z" };
        lists.done[0] = imported;
        return Promise.resolve({ email: imported, outcome: "imported" });
      });
      renderPage();
      await screen.findByText("Aucun mail à traiter.");
      await userEvent.click(tab(/Archivés/));
      await screen.findByRole("heading", { level: 2, name: "Archivé un" });
      await userEvent.click(within(screen.getAllByTestId("inbound-row")[0]).getByRole("button"));
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Réservation RAB123 créée depuis ce mail."));
      await waitFor(() => expect(screen.getAllByTestId("inbound-row")).toHaveLength(1));
      expect(screen.getByTestId("search")).toHaveTextContent("?mail=a2");
      expect(reading().getByRole("heading", { level: 2, name: "Archivé deux" })).toBeInTheDocument();
      await waitFor(() => expect(tab(/Traités/)).toHaveTextContent("1"));
    });

    it("quitter la boîte de réception pendant l'analyse : le toast arrive, la page ne revient pas", async () => {
      const pending = deferred<InboundReanalysis>();
      api.reanalyseInboundEmail.mockImplementation(() => pending.promise);
      renderPage();
      await screen.findAllByTestId("inbound-row");
      await userEvent.click(reading().getByTestId("inbound-reanalyse"));
      await userEvent.click(screen.getByRole("link", { name: "Réservations" }));
      expect(screen.getByTestId("where")).toHaveTextContent("/reservations");

      const row = move("e1", "done", "imported");
      const imported = { ...row, missing: [], reservationId: "r7", reservationReference: "RAB123", analysedAt: "2026-10-10T09:15:00Z" };
      pending.resolve({ email: imported, outcome: "imported" });
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Réservation RAB123 créée depuis ce mail."));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(screen.getByTestId("where")).toHaveTextContent("/reservations null");
      expect(screen.queryByRole("tablist")).toBeNull();
    });
  });
});
