import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/components/ui/confirm";
import { isTextablePhone, smsCandidates } from "@/lib/prospecting";
import type { Prospect } from "@/lib/types";
import { SmsDialog } from "./SmsDialog";

// SMS de prospection (19/11/2026, choix C). Fictional parkings and numbers only.

const api = vi.hoisted(() => ({ sendProspectsSms: vi.fn(), sendProspectSmsTest: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const base = {
  id: "p1",
  email: null,
  companyName: "Parking Alpha",
  contactFirstName: "Camille",
  contactLastName: null,
  town: "Pusignan",
  airportCode: "LYS",
  airportName: "Lyon Saint-Exupéry",
  phone: "06 12 34 56 78",
  status: "to_contact",
  lastSmsAt: null,
} as unknown as Prospect;
const prospects = [base, { ...base, id: "p2", companyName: "Parking Bêta", phone: "+32 470 12 34 56" } as Prospect];

function renderDialog(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ConfirmProvider>
        <SmsDialog
          prospects={prospects}
          today={{ sent: 3, cap: 200, configured: true }}
          window={{ open: true, nextOpening: "2026-11-19T09:00:00Z" }}
          onClose={onClose}
        />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.sendProspectsSms.mockImplementation(async (_ids: string[], _text: string, dryRun?: boolean) =>
    dryRun
      ? {
          results: [
            { id: "p1", outcome: "ready" },
            { id: "p2", outcome: "skipped", reason: "recent" },
          ],
          counts: { ready: 1, sent: 0, failed: 0, skipped: 1 },
          remainingToday: 197,
        }
      : { results: [{ id: "p1", outcome: "sent" }], counts: { ready: 0, sent: 1, failed: 0, skipped: 0 }, remainingToday: 196 },
  );
});

describe("SMS de prospection", () => {
  it("dit qui le recevra, montre le SMS rempli et l'envoie aux seuls prêts", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.getByTestId("sms-preview")).toHaveTextContent("Parking Alpha dans une seule app");
    expect(await screen.findByText("1 recevront ce SMS · 1 laissé de côté")).toBeInTheDocument();
    expect(screen.getByText("Parking Bêta · déjà un SMS cette semaine")).toBeInTheDocument();
    expect(screen.getByText("3 / 200 SMS aujourd'hui")).toBeInTheDocument();
    await user.click(screen.getByTestId("sms-send"));
    await user.click(await screen.findByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.sendProspectsSms).toHaveBeenCalledWith(["p1"], expect.stringContaining("{parking}")));
    expect(await screen.findByTestId("sms-results")).toHaveTextContent("Envoyé");
    expect(toast.success).toHaveBeenCalledWith("1 SMS envoyé.");
  });

  it("signale une variable inconnue et ne propose pas l'envoi", async () => {
    const user = userEvent.setup();
    renderDialog();
    const area = screen.getByLabelText("Texte");
    await user.clear(area);
    await user.type(area, "Bonjour {{inconnu}");
    expect(screen.getByText("Une variable n'existe pas : utilisez celles proposées.")).toBeInTheDocument();
    expect(screen.getByTestId("sms-send")).toBeDisabled();
  });

  it("test envoyé au téléphone de la prospection", async () => {
    const user = userEvent.setup();
    api.sendProspectSmsTest.mockResolvedValue({ sentTo: "07 00 00 00 01" });
    renderDialog();
    await user.click(screen.getByTestId("sms-test"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Test envoyé au 07 00 00 00 01."));
  });
});

describe("numéros qui reçoivent un SMS", () => {
  it("mobiles français et pays couverts seulement", () => {
    expect(isTextablePhone("06 12 34 56 78")).toBe(true);
    expect(isTextablePhone("+33 7 12 34 56 78")).toBe(true);
    expect(isTextablePhone("01 23 45 67 89")).toBe(false);
    expect(isTextablePhone("+1 312 555 0100")).toBe(false);
    expect(isTextablePhone("+55 11 3017 5808")).toBe(false);
    expect(isTextablePhone("+32 470 12 34 56")).toBe(true);
    expect(isTextablePhone("06 39 98 12 34")).toBe(false);
    expect(
      smsCandidates([
        base,
        { ...base, id: "x", status: "unsubscribed" } as Prospect,
        { ...base, id: "y", lastSmsAt: new Date().toISOString() } as Prospect,
      ]).map((p) => p.id),
    ).toEqual(["p1"]);
  });
});
