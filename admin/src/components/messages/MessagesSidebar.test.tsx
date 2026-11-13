import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { initialsOf, sortForBar, wroteRecently } from "@/lib/messages-bar";
import type { WhatsappConversation } from "@/lib/types";
import { MessagesSidebar } from "./MessagesSidebar";

const api = vi.hoisted(() => ({ whatsappInbox: vi.fn(), whatsappConversation: vi.fn(), replyWhatsapp: vi.fn(), handleWhatsapp: vi.fn() }));
const auth = vi.hoisted(() => ({ role: "driver" as string | undefined }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: auth.role } }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const now = Date.now();
const conv = (id: string, name: string, over: Partial<WhatsappConversation> = {}): WhatsappConversation => ({
  id,
  phone: "06 12 34 56 78",
  name,
  profileName: null,
  reservation: null,
  lastMessageAt: new Date(now - 60_000).toISOString(),
  lastInboundAt: new Date(now - 60_000).toISOString(),
  unread: 0,
  handledAt: null,
  preview: { direction: "in", text: `Bonjour de ${name}` },
  replyUntil: new Date(now + 23 * 3600_000).toISOString(),
  unknown: false,
  ...over,
});

const rows = [
  conv("c1", "Inès Garcia", { lastMessageAt: new Date(now - 30_000).toISOString() }),
  conv("c2", "Camille Martin", { unread: 2, lastMessageAt: new Date(now - 3600_000).toISOString() }),
  conv("c3", "Jean Petit", { lastInboundAt: new Date(now - 3 * 86400_000).toISOString(), lastMessageAt: new Date(now - 86400_000).toISOString() }),
];

function renderAt(path = "/") {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <MessagesSidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  auth.role = "driver";
  Element.prototype.scrollIntoView = vi.fn();
  api.whatsappInbox.mockReset().mockResolvedValue({ data: rows, counts: { unread: 1, all: 3, handled: 0, unknown: null } });
  api.whatsappConversation.mockReset().mockImplementation(async (id: string) => ({
    conversation: rows.find((r) => r.id === id),
    messages: [{ id: `m-${id}`, direction: "in", type: "text", text: "Je serai en retard", hasMedia: false, mediaMime: null, status: null, at: new Date(now - 60_000).toISOString(), by: null }],
    sent: [],
  }));
});

describe("Barre des messages (13/11/2026, choix A)", () => {
  it("range les non lus en premier et repère qui a écrit depuis moins de 24 h", () => {
    expect(sortForBar(rows).map((c) => c.id)).toEqual(["c2", "c1", "c3"]);
    expect(wroteRecently(rows[0], now)).toBe(true);
    expect(wroteRecently(rows[2], now)).toBe(false);
    expect(initialsOf("Camille Martin")).toBe("CM");
    expect(initialsOf("06 12 34 56 78")).toBe("?");
  });

  it("liste les conversations, cherche sans accents, ouvre deux fenêtres au plus et réduit les autres", async () => {
    renderAt();
    const bar = await screen.findByTestId("messages-bar");
    await within(bar).findByTestId("bar-conv-c2");
    const ids = within(bar).getAllByTestId(/^bar-conv-/).map((b) => b.dataset.testid);
    expect(ids).toEqual(["bar-conv-c2", "bar-conv-c1", "bar-conv-c3"]);

    await userEvent.type(screen.getByLabelText("Chercher un client"), "ines");
    expect(within(bar).getAllByTestId(/^bar-conv-/)).toHaveLength(1);
    await userEvent.clear(screen.getByLabelText("Chercher un client"));

    await userEvent.click(within(bar).getByTestId("bar-conv-c2"));
    expect(await screen.findByTestId("dock-window-c2")).toBeInTheDocument();
    await userEvent.click(within(bar).getByTestId("bar-conv-c1"));
    await userEvent.click(within(bar).getByTestId("bar-conv-c3"));
    expect(await screen.findByTestId("dock-window-c3")).toBeInTheDocument();
    expect(screen.getByTestId("dock-window-c1")).toBeInTheDocument();
    expect(screen.queryByTestId("dock-window-c2")).toBeNull();
    expect(screen.getByTestId("dock-tab-c2")).toBeInTheDocument();

    await userEvent.click(within(screen.getByTestId("dock-window-c3")).getByTestId("dock-minimize"));
    expect(screen.queryByTestId("dock-window-c3")).toBeNull();
    expect(screen.getByTestId("dock-tab-c3")).toBeInTheDocument();
    await userEvent.click(within(screen.getByTestId("dock-window-c1")).getByTestId("dock-close"));
    expect(screen.queryByTestId("dock-window-c1")).toBeNull();
    expect(screen.queryByTestId("dock-tab-c1")).toBeNull();
  });

  it("se replie en pastilles et le garde dans le navigateur", async () => {
    renderAt();
    await userEvent.click(await screen.findByTestId("messages-bar-toggle"));
    expect(screen.queryByLabelText("Chercher un client")).toBeNull();
    expect(localStorage.getItem("plazo:messages-bar-collapsed")).toBe("1");
    expect(await screen.findByTitle("Camille Martin")).toBeInTheDocument();
  });

  it("n'apparaît ni sur la page Messages ni pour un rôle sans la boîte", async () => {
    renderAt("/reservations/whatsapp");
    expect(screen.queryByTestId("messages-bar")).toBeNull();
    auth.role = undefined;
    renderAt("/");
    expect(screen.queryByTestId("messages-bar")).toBeNull();
    expect(api.whatsappInbox).not.toHaveBeenCalled();
  });
});
