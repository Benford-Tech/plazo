import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { callQueue, defaultCallback, isFrenchPhone, telHref } from "@/lib/prospecting";
import type { Prospect } from "@/lib/types";
import { CallsView } from "./CallsView";

// « A · File d'appels » (25/11/2026). Fictional parkings and numbers only.

const api = vi.hoisted(() => ({ logProspectCall: vi.fn(), getProspectCalls: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const NOW = new Date(2026, 10, 25, 11, 0);
const noCalls = { count: 0, missed: 0, lastAt: null, lastOutcome: null, callbackAt: null, wrongNumber: false };
const make = (id: string, over: Partial<Prospect> = {}): Prospect =>
  ({
    id,
    email: null,
    companyName: `Parking ${id}`,
    contactFirstName: null,
    contactLastName: null,
    town: "Pusignan",
    airportCode: "LYS",
    phone: "04 72 00 00 08",
    website: null,
    notes: null,
    status: "to_contact",
    step: 0,
    lastContactedAt: null,
    createdAt: "2026-11-01T10:00:00.000Z",
    calls: noCalls,
    demo: null,
    ...over,
  }) as Prospect;

const prospects = [
  make("neuf"),
  make("ecrit", { status: "contacted", step: 2, lastContactedAt: "2026-11-18T10:00:00.000Z" }),
  make("demo", {
    status: "contacted",
    step: 2,
    airportCode: "BOD",
    contactFirstName: "Claire",
    contactLastName: "Dumas",
    demo: { url: "https://pro.example/demo", expiresAt: "2026-12-01T00:00:00.000Z", expired: false, opens: 3, lastOpenedAt: "2026-11-22T09:00:00.000Z" },
  }),
  make("rappel", { calls: { ...noCalls, count: 1, lastOutcome: "callback", lastAt: "2026-11-20T10:00:00.000Z", callbackAt: new Date(2026, 10, 25, 14, 30).toISOString() } }),
  make("plus-tard", { calls: { ...noCalls, count: 1, callbackAt: new Date(2026, 10, 27, 10, 0).toISOString() } }),
  make("sans-numero", { phone: null }),
  make("refus", { status: "not_interested" }),
  make("faux", { calls: { ...noCalls, count: 1, wrongNumber: true } }),
  make("trois", { calls: { ...noCalls, count: 3, missed: 3, lastAt: "2026-11-20T10:00:00.000Z" } }),
  make("ce-matin", { calls: { ...noCalls, count: 1, missed: 1, lastAt: new Date(2026, 10, 25, 9, 0).toISOString() } }),
  make("belge", { phone: "+32 470 00 00 01", airportCode: "BRU" }),
];

describe("callQueue", () => {
  it("orders who to call and leaves out who must not be called", () => {
    const queue = callQueue(prospects, NOW);
    expect(queue.map((i) => `${i.group}:${i.prospect.id}`)).toEqual(["callback:rappel", "demo:demo", "contacted:ecrit", "new:belge", "new:neuf"]);
  });
  it("reads a French number, dials it, and proposes the next working morning", () => {
    expect(isFrenchPhone("04 72 00 00 08")).toBe(true);
    expect(isFrenchPhone("+33 4 72 00 00 08")).toBe(true);
    expect(isFrenchPhone("+32 470 00 00 01")).toBe(false);
    expect(telHref("+33 (0)4 72 00 00 08")).toBe("tel:+33472000008");
    // Friday 27 November 2026: Monday 30.
    expect(defaultCallback(new Date(2026, 10, 27, 16, 0))).toBe("2026-11-30T10:00");
  });
});

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CallsView prospects={prospects} loading={false} callerName="Joanny" />
    </QueryClientProvider>,
  );
}

describe("CallsView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    Object.values(api).forEach((fn) => fn.mockReset());
    Object.values(toast).forEach((fn) => fn.mockReset());
    api.getProspectCalls.mockResolvedValue({
      data: [{ id: "c1", outcome: "callback", note: "en congé", callbackAt: null, at: "2026-11-20T10:00:00.000Z", by: "Joanny" }],
    });
    api.logProspectCall.mockResolvedValue({ data: prospects[0] });
  });
  afterEach(() => vi.useRealTimers());

  it("shows the first prospect to call with its number, its context and what to say", async () => {
    renderView();
    const sheet = screen.getByTestId("call-sheet");
    expect(within(sheet).getByRole("heading", { name: "Parking rappel" })).toBeInTheDocument();
    expect(within(sheet).getByText("1 sur 5")).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: /Appeler/ })).toHaveAttribute("href", "tel:0472000008");
    expect(screen.getByTestId("call-script")).toHaveTextContent("Joanny de Plazo. Vous m'aviez demandé de vous rappeler");
    expect(await within(sheet).findByText(/en congé/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "À rappeler aujourd'hui · 1" })).toBeInTheDocument();
    expect(screen.getByTestId("call-queue-demo")).toHaveTextContent("BOD · démo ouverte 3 fois · 2 mails · jamais appelé");
  });

  it("logs the result with its note and moves on to the next", async () => {
    const user = userEvent.setup();
    renderView();
    await user.type(screen.getByLabelText("Note sur l'appel"), "rappeler lundi");
    await user.click(screen.getByTestId("call-outcome-voicemail"));
    await waitFor(() => expect(api.logProspectCall).toHaveBeenCalledWith("rappel", { outcome: "voicemail", note: "rappeler lundi", callbackAt: null }));
    await waitFor(() => expect(within(screen.getByTestId("call-sheet")).getByRole("heading", { name: "Parking demo" })).toBeInTheDocument());
    expect(screen.getByTestId("call-script")).toHaveTextContent("Vous avez regardé notre démo");
    expect(screen.getByLabelText("Note sur l'appel")).toHaveValue("");
    expect(toast.success).toHaveBeenCalledWith("Parking rappel : messagerie noté.");
  });

  it("asks when to call back before saving a callback", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByTestId("call-outcome-callback"));
    expect(api.logProspectCall).not.toHaveBeenCalled();
    expect(screen.getByTestId("call-callback-at")).toHaveValue("2026-11-26T10:00");
    await user.click(screen.getByRole("button", { name: "Enregistrer le rappel" }));
    await waitFor(() =>
      expect(api.logProspectCall).toHaveBeenCalledWith("rappel", { outcome: "callback", note: null, callbackAt: new Date(2026, 10, 26, 10, 0).toISOString() }),
    );
  });

  it("filters the queue by the number's country and opens a prospect of the list", async () => {
    const user = userEvent.setup();
    renderView();
    await user.selectOptions(screen.getByLabelText("Pays du numéro"), "foreign");
    expect(within(screen.getByTestId("call-sheet")).getByRole("heading", { name: "Parking belge" })).toBeInTheDocument();
    expect(screen.getByText("1 sur 1")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Pays du numéro"), "all");
    await user.click(screen.getByTestId("call-queue-ecrit"));
    expect(screen.getByTestId("call-script")).toHaveTextContent("Je vous ai écrit récemment");
  });

  it("says so when nobody is left to call", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <CallsView prospects={[]} loading={false} callerName={null} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Personne à appeler pour l'instant.")).toBeInTheDocument();
  });
});
