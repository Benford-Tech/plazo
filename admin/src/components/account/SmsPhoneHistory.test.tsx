import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhoneHistory } from "@/lib/types";
import { SmsPhoneHistory } from "./SmsPhoneHistory";

const api = vi.hoisted(() => ({ getSmsPhone: vi.fn(), setSmsPhoneAlerts: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getSmsPhone: () => api.getSmsPhone(), setSmsPhoneAlerts: (e: boolean) => api.setSmsPhoneAlerts(e) } };
});

const none = (date: string) => ({ date, segments: [{ start: 0, end: 1, from: "00:00", to: "24:00", state: "none" as const }], failed: 0, reminderAt: "18:00" });
const history: PhoneHistory = {
  now: { state: "online", lastSeenAt: "2026-11-06T09:12", checkedAt: "2026-11-06T09:15" },
  alerts: true,
  pingSet: true,
  days: [
    none("2026-11-06"),
    {
      date: "2026-11-05",
      segments: [
        { start: 0, end: 0.736, from: "00:00", to: "17:40", state: "online" },
        { start: 0.736, end: 0.885, from: "17:40", to: "21:15", state: "offline" },
        { start: 0.885, end: 1, from: "21:15", to: "24:00", state: "online" },
      ],
      failed: 8,
      reminderAt: "18:00",
    },
    ...["2026-11-04", "2026-11-03", "2026-11-02", "2026-11-01", "2026-10-31"].map(none),
  ],
  events: [
    { kind: "state", at: "2026-11-05T21:15", state: "online", lastSeenAt: "2026-11-05T21:14", afterMinutes: 215 },
    { kind: "sms_failed", at: "2026-11-05T20:05", smsKind: "booking_reminder", status: "abandoned", count: 8 },
    { kind: "state", at: "2026-11-05T17:45", state: "offline", lastSeenAt: "2026-11-05T17:40", afterMinutes: null },
  ],
};

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SmsPhoneHistory readOnly={false} />
    </QueryClientProvider>,
  );
}

describe("SmsPhoneHistory (06/11/2026)", () => {
  beforeEach(() => {
    api.getSmsPhone.mockReset().mockResolvedValue(history);
    api.setSmsPhoneAlerts.mockReset().mockResolvedValue({ alerts: false });
  });

  it("montre l'état, le ruban de 7 jours et les changements", async () => {
    show();
    expect(await screen.findByTestId("sms-phone-state")).toHaveTextContent("En ligne");
    expect(screen.getByText("Vu à 09:12")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(7);
    expect(screen.getByTestId("sms-phone-day-2026-11-05")).toHaveTextContent("8 ✕");
    expect(screen.getByRole("img", { name: /17:40–21:15 Hors ligne/ })).toBeInTheDocument();
    const events = screen.getByTestId("sms-phone-events");
    expect(events).toHaveTextContent("De nouveau en ligne");
    expect(events).toHaveTextContent("après 3 h 35");
    expect(events).toHaveTextContent("8 SMS de la veille abandonnés");
    expect(events).toHaveTextContent("dernier signe de vie à 17:40");
  });

  it("coupe l'alerte des gérants", async () => {
    show();
    const toggle = await screen.findByTestId("sms-phone-alerts");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(toggle);
    await waitFor(() => expect(api.setSmsPhoneAlerts).toHaveBeenCalledWith(false));
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
  });
});
