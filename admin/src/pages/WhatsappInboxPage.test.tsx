import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { WhatsappConversation, WhatsappConversationDetail } from "@/lib/types";
import WhatsappInboxPage from "./WhatsappInboxPage";

const api = vi.hoisted(() => ({ whatsappSent: vi.fn(), whatsappInbox: vi.fn(), whatsappConversation: vi.fn(), replyWhatsapp: vi.fn(), handleWhatsapp: vi.fn(), whatsappMedia: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: "manager" } }) }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const now = Date.now();
const conv = (over: Partial<WhatsappConversation> = {}): WhatsappConversation => ({
  id: "c1",
  phone: "06 12 34 56 78",
  name: "Sébastien Morel",
  profileName: "Seb",
  reservation: {
    id: "r1",
    reference: "R7KQ2M",
    externalReference: null,
    channelDetail: null,
    customerName: "Sébastien Morel",
    status: "upcoming",
    arrivalAt: new Date(now + 20 * 3600000).toISOString(),
    returnAt: new Date(now + 90 * 3600000).toISOString(),
  },
  lastMessageAt: new Date(now - 60000).toISOString(),
  lastInboundAt: new Date(now - 60000).toISOString(),
  unread: 2,
  handledAt: null,
  preview: { direction: "in", text: "On arrive plutôt vers 8h, c’est possible ?" },
  replyUntil: new Date(now + 23 * 3600000).toISOString(),
  unknown: false,
  ...over,
});

const detail = (over: Partial<WhatsappConversation> = {}): WhatsappConversationDetail => ({
  conversation: conv({ unread: 0, ...over }),
  messages: [
    { id: "m1", direction: "in", type: "text", text: "On arrive plutôt vers 8h, c’est possible ?", hasMedia: false, mediaMime: null, status: null, at: new Date(now - 120000).toISOString(), by: null },
    { id: "m2", direction: "in", type: "image", text: null, hasMedia: true, mediaMime: "image/jpeg", status: null, at: new Date(now - 60000).toISOString(), by: null },
  ],
  sent: [{ id: "s1", kind: "booking_reminder", status: "read", at: new Date(now - 3600000).toISOString() }],
});

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reservations/whatsapp" element={<WhatsappInboxPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  api.whatsappInbox.mockResolvedValue({ data: [conv()], counts: { unread: 1, all: 3, handled: 2, unknown: null } });
  api.whatsappConversation.mockResolvedValue(detail());
  api.replyWhatsapp.mockResolvedValue({});
  api.handleWhatsapp.mockResolvedValue(conv({ handledAt: new Date().toISOString() }));
});

describe("Messages WhatsApp (12/11/2026)", () => {
  it("liste les conversations, ouvre la conversation avec le message de Plazo, et répond", async () => {
    renderAt("/reservations/whatsapp");
    await waitFor(() => expect(screen.getByTestId("wa-view-unread")).toHaveTextContent("Non lus · 1"));
    expect(screen.queryByTestId("wa-view-unknown")).toBeNull();
    await userEvent.click(await screen.findByTestId("wa-conv-c1"));
    expect(await screen.findByTestId("wa-thread")).toBeInTheDocument();
    expect(screen.getByTestId("wa-sent")).toHaveTextContent("Veille du dépôt envoyé par Plazo");
    expect(screen.getAllByTestId("wa-in")).toHaveLength(2);
    expect(screen.getByText("Voir la photo")).toBeInTheDocument();
    expect(screen.getByTestId("wa-window")).toHaveTextContent("Réponse libre possible jusqu'à");
    await userEvent.type(screen.getByLabelText("Écrire au client…"), "Oui, à demain 8h.");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.replyWhatsapp).toHaveBeenCalledWith("c1", "Oui, à demain 8h."));
    await userEvent.click(screen.getByRole("button", { name: "Marquer comme traité" }));
    await waitFor(() => expect(api.handleWhatsapp).toHaveBeenCalledWith("c1", true));
  });

  it("montre les messages envoyés par Plazo, avec leur texte, et ouvre la conversation", async () => {
    api.whatsappSent.mockResolvedValue({
      data: [
        {
          id: "w1",
          kind: "booking_reminder",
          status: "read",
          text: "Bonjour Sébastien, rendez-vous demain à 8h.",
          phone: "06 12 34 56 78",
          at: new Date(now - 3600000).toISOString(),
          smsFallback: false,
          reservation: { id: "r1", reference: "R7KQ2M", externalReference: null, customerName: "Sébastien Morel" },
          conversationId: "c1",
        },
        { id: "w2", kind: "booking_confirmed", status: "sent", text: null, phone: "06 99 88 77 66", at: new Date(now).toISOString(), smsFallback: false, reservation: null, conversationId: null },
      ],
    });
    renderAt("/reservations/whatsapp?vue=sent");
    expect(await screen.findByText("Bonjour Sébastien, rendez-vous demain à 8h.")).toBeInTheDocument();
    expect(screen.getByTestId("wa-sent-w1")).toHaveTextContent("Veille du dépôt");
    expect(screen.getByTestId("wa-sent-w1")).toHaveTextContent("lu ✓✓");
    expect(screen.getByTestId("wa-sent-w2")).toHaveTextContent("Texte non gardé");
    await userEvent.click(screen.getByRole("button", { name: "Voir la conversation ›" }));
    expect(await screen.findByTestId("wa-thread")).toBeInTheDocument();
  });

  it("un message écrit depuis l'app Plazo : pastille, et la réponse part dans l'app même après 24 h", async () => {
    const d = detail({ replyUntil: null, replyBy: "app" });
    d.messages[0] = { ...d.messages[0], channel: "app" };
    api.whatsappConversation.mockResolvedValue(d);
    renderAt("/reservations/whatsapp?c=c1");
    expect(await screen.findByTestId("wa-window-app")).toBeInTheDocument();
    expect(screen.getByTestId("wa-app")).toHaveTextContent("App Plazo");
    await userEvent.type(screen.getByLabelText("Écrire au client…"), "Oui.");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.replyWhatsapp).toHaveBeenCalledWith("c1", "Oui."));
  });

  it("propose d'appeler quand les 24 h de Meta sont passées", async () => {
    api.whatsappConversation.mockResolvedValue(detail({ replyUntil: null }));
    renderAt("/reservations/whatsapp?c=c1");
    expect(await screen.findByTestId("wa-window-closed")).toBeInTheDocument();
    expect(screen.getByLabelText("Écrire au client…")).toBeDisabled();
    expect(screen.getByRole("link", { name: "Appeler le 06 12 34 56 78" })).toHaveAttribute("href", "tel:0612345678");
  });
});
