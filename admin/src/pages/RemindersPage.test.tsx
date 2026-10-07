import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { renderTemplate, smsLength, toGsm7, unknownVariables } from "@/lib/sms";
import type { ReminderBoard, ReminderRow } from "@/lib/types";
import RemindersPage from "./RemindersPage";

const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getReminders: vi.fn(),
  updateReminders: vi.fn(),
  updateReminderEvening: vi.fn(),
  sendRemindersNow: vi.fn(),
  testReminder: vi.fn(),
  setReminderExcluded: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const APL =
  "Bonjour {prénom},\n\nNous vous confirmons votre prise en charge le {date} à {heure}.\n\n📍 Adresse du parking :\nBâtiment RESITECH\n3 avenue Maréchal Juin\n\n🔑 Remise des clés à l’arrivée\n\n🚗 Accès :\n• Portail ouvert de 8h30 à 17h (lundi au vendredi)\n• En dehors de ces horaires, merci de nous contacter (accès 24h/24 – 7j/7)\n\n🔑 Pour votre retour (navette) :\nMerci de nous envoyer 2 messages :\n• À l’atterrissage\n• Une fois sorti(e) de l’aéroport\n\nCordialement,\nAPL Parking Lyon";

const row = (over: Partial<ReminderRow>): ReminderRow => ({
  reservationId: "r1",
  reference: "R7KQ2M",
  arrivalAt: "2026-10-07T05:45",
  customerName: "Sophie Martin",
  customerPhone: "06 12 34 56 78",
  channel: "aggregator",
  channelDetail: "Allopark",
  status: "planned",
  at: "2026-10-06T18:00",
  excludedBy: null,
  ...over,
});

const evening = (date: string, over: Partial<ReminderBoard["evening"]> = {}) => ({
  date,
  departuresDate: `2026-10-0${Number(date.slice(-1)) + 1}`,
  when: (date < "2026-10-06" ? "past" : date === "2026-10-06" ? "tonight" : "future") as "past" | "tonight" | "future",
  sendTime: "18:00",
  timeChanged: false,
  paused: false,
  canSendNow: date === "2026-10-06",
  counts: { departures: 0, planned: 0, sent: 0, waiting: 0, failed: 0, withoutSms: 0 },
  ...over,
});

function board(over: Partial<ReminderBoard> = {}): ReminderBoard {
  const rows = [
    row({}),
    row({ reservationId: "r2", customerName: "Julie Roux", customerPhone: "04 72 00 00 31", channel: "phone", channelDetail: null, status: "no_mobile", at: null }),
    row({ reservationId: "r3", customerName: "Nadia Haddad", channel: "phone", channelDetail: null, status: "excluded", at: null, excludedBy: "Joanny" }),
  ];
  return {
    parkingId: "p1",
    today: "2026-10-06",
    settings: { enabled: true, sendTime: "18:00", template: APL, custom: true, updatedAt: "2026-10-06T09:02:00Z", updatedBy: "Joanny" },
    defaults: {
      template: "Plazo : à demain ! Dépôt le {date} à {heure} à APL Parking Lyon. {lien}",
      short: "APL Parking Lyon : bonjour {prénom}, à demain {heure} ! Infos pratiques et retour : {lien} Une modification ? Répondez à ce SMS.",
    },
    sendTimes: ["17:00", "17:30", "18:00", "18:30", "19:00", "20:00"],
    variables: ["prénom", "nom", "date", "heure", "plaque", "référence", "lien"],
    channel: { mode: "gateway", repliesReachParking: true },
    linkAvailable: true,
    evenings: [
      evening("2026-10-05", { counts: { departures: 15, planned: 0, sent: 14, waiting: 0, failed: 1, withoutSms: 0 } }),
      evening("2026-10-06", { counts: { departures: 3, planned: 1, sent: 0, waiting: 0, failed: 0, withoutSms: 2 } }),
      evening("2026-10-07"),
      evening("2026-10-08", { sendTime: "20:00", timeChanged: true }),
      evening("2026-10-09", { paused: true }),
    ],
    evening: { ...evening("2026-10-06", { counts: { departures: 3, planned: 1, sent: 0, waiting: 0, failed: 0, withoutSms: 2 } }), rows },
    sample: {
      customerName: "Sophie Martin",
      values: { prénom: "Sophie", nom: "Martin", date: "07/10/2026", heure: "05:45", plaque: "AB-123-CD", référence: "R7KQ2M", lien: "https://www.plazo.fr/ma-reservation/R7KQ2M?cle=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    },
    can: { edit: true, manage: true },
    ...over,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RemindersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("les règles du SMS dans le navigateur", () => {
  it("compte les SMS, remplace les variables et propose une version GSM-7", () => {
    expect(smsLength("a".repeat(153 * 2))).toEqual({ encoding: "gsm7", characters: 306, segments: 2 });
    expect(smsLength("Bâtiment").encoding).toBe("unicode");
    expect(renderTemplate("Bonjour {Prenom}, {heure}. {lien}", board().sample.values)).toContain("Bonjour Sophie, 05:45. https://");
    expect(unknownVariables("{prénom} {ville}")).toEqual(["{ville}"]);
    // "é" exists in GSM-7: it stays; "â", "’", "–", "•" and the emojis do not.
    expect(toGsm7("📍 Adresse :\nBâtiment – l’entrée • ouvert")).toBe("Adresse :\nBatiment - l'entrée - ouvert");
    const unicode = smsLength(renderTemplate(APL, board().sample.values));
    const gsm = smsLength(renderTemplate(toGsm7(APL), board().sample.values));
    expect(unicode).toMatchObject({ encoding: "unicode", segments: 8 });
    expect(gsm).toMatchObject({ encoding: "gsm7", segments: 4 });
  });
});

describe("RemindersPage (S-A + S-B)", () => {
  beforeEach(() => {
    api.getParking.mockReset().mockResolvedValue({ id: "p1", name: "APL Parking Lyon" });
    api.getReminders.mockReset().mockResolvedValue(board());
    api.updateReminders.mockReset().mockImplementation(async (_p: string, input: { template?: string | null }) =>
      board({ settings: { ...board().settings, template: input.template ?? board().defaults.template, custom: input.template !== null } }),
    );
    api.updateReminderEvening.mockReset().mockResolvedValue(board());
    api.sendRemindersNow.mockReset().mockResolvedValue(board());
    api.testReminder.mockReset().mockResolvedValue({ outcome: "sent", to: "+33612345678" });
    api.setReminderExcluded.mockReset().mockResolvedValue({ excluded: true });
  });

  it("montre les réglages, la semaine, la liste du soir et l’aperçu", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("reminder-row");
    expect(rows.map(r => r.dataset.status)).toEqual(["planned", "no_mobile", "excluded"]);
    expect(within(rows[0]).getByText("Prévu 18:00")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Allopark")).toBeInTheDocument();
    expect(within(rows[1]).getByRole("link", { name: "Corriger le numéro" })).toHaveAttribute("href", "/reservations/r2");
    expect(within(rows[2]).getByText("Exclu par Joanny")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Envoi automatique" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Heure habituelle, la veille")).toHaveValue("18:00");
    expect(screen.getByText("Les réponses des clients arrivent sur ce téléphone.")).toBeInTheDocument();

    const evenings = screen.getAllByTestId("reminder-evening");
    expect(evenings).toHaveLength(5);
    expect(within(evenings[0]).getByText("14 envoyés")).toBeInTheDocument();
    expect(within(evenings[0]).getByText("1 échec")).toBeInTheDocument();
    expect(within(evenings[3]).getByText("heure changée")).toBeInTheDocument();
    expect(within(evenings[4]).getByText("En pause")).toBeInTheDocument();
    expect(evenings[1]).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByTestId("reminder-preview")).toHaveTextContent("Bonjour Sophie,");
    expect(screen.getByTestId("reminder-preview")).toHaveTextContent("le 07/10/2026 à 05:45");
    expect(screen.getByTestId("reminder-segments")).toHaveTextContent("8 SMS");
    expect(screen.getByText("Modifié par Joanny, le 6 oct., 11:02")).toBeInTheDocument();
  });

  it("raccourcit le message, insère une variable et enregistre", async () => {
    renderPage();
    const textarea = (await screen.findByLabelText("Texte du SMS")) as HTMLTextAreaElement;
    await userEvent.click(screen.getByRole("button", { name: /Version courte avec lien · 1 SMS|Version courte avec lien · 2 SMS/ }));
    expect(textarea.value).toBe(board().defaults.short);
    expect(screen.getByTestId("reminder-segments")).not.toHaveTextContent("8 SMS");
    await userEvent.click(screen.getByRole("button", { name: "Annuler les modifications" }));
    expect(textarea.value).toBe(APL);

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "À demain ");
    await userEvent.click(screen.getByRole("button", { name: "{prénom}" }));
    expect(textarea.value).toBe("À demain {prénom}");
    await userEvent.type(textarea, " {{ville}");
    expect(screen.getByText("Variable inconnue : {ville}. Utilisez celles proposées.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer le message" })).toBeDisabled();
    await userEvent.type(textarea, "{Backspace>8/}");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer le message" }));
    await waitFor(() => expect(api.updateReminders).toHaveBeenCalledWith("p1", { template: "À demain {prénom}" }));
  });

  it("une soirée : changer l’heure, mettre en pause, exclure un client, envoyer maintenant, tester", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("reminder-row");
    await userEvent.selectOptions(screen.getByLabelText("Heure de cet envoi"), "20:00");
    expect(api.updateReminderEvening).toHaveBeenCalledWith("p1", "2026-10-06", { sendTime: "20:00" });
    await userEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    expect(api.updateReminderEvening).toHaveBeenCalledWith("p1", "2026-10-06", { paused: true });
    await userEvent.click(within(rows[0]).getByRole("button", { name: "Ne pas envoyer" }));
    expect(api.setReminderExcluded).toHaveBeenCalledWith("r1", true);
    await userEvent.click(within(rows[2]).getByRole("button", { name: "Rétablir" }));
    expect(api.setReminderExcluded).toHaveBeenCalledWith("r3", false);
    await userEvent.click(screen.getByTestId("reminder-send-now"));
    expect(api.sendRemindersNow).toHaveBeenCalledWith("p1", "2026-10-06");

    await userEvent.click(screen.getByRole("button", { name: "M’envoyer un test" }));
    await userEvent.type(screen.getByLabelText("Numéro qui reçoit le test"), "06 12 34 56 78");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer le test" }));
    await waitFor(() => expect(api.testReminder).toHaveBeenCalledWith("p1", { to: "+33612345678" }));

    await userEvent.click(screen.getAllByTestId("reminder-evening")[3]);
    await waitFor(() => expect(api.getReminders).toHaveBeenLastCalledWith("p1", "2026-10-08"));
  });

  it("un chauffeur voit tout sans pouvoir rien changer", async () => {
    api.getReminders.mockResolvedValue(board({ can: { edit: false, manage: false } }));
    renderPage();
    await screen.findAllByTestId("reminder-row");
    expect(screen.getByRole("switch", { name: "Envoi automatique" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Ne pas envoyer" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("reminder-send-now")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Heure de cet envoi")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "M’envoyer un test" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Texte du SMS")).toHaveAttribute("readonly");
    expect(screen.getByText("Seul un gérant peut modifier le message.")).toBeInTheDocument();
  });
});
