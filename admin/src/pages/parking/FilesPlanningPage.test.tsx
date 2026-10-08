import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { addDays, shortDay, todayLocal } from "@/lib/datetime";
import type { FilesPlanning } from "@/lib/plan/parkingFiles";
import type { Staff } from "@/lib/types";
import SpotPlanningPage from "./SpotPlanningPage";

const manager: Staff = {
  id: "s9",
  operatorId: "o1",
  email: "m@demo.fr",
  name: "Manager",
  phone: null,
  role: "manager",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  operatorName: "Parking Démo",
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: manager,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    forget: vi.fn(),
  }),
}));
const api = vi.hoisted(() => ({
  getParking: vi.fn(),
  getFiles: vi.fn(),
  getSpotPlanning: vi.fn(),
  getFilesPlanning: vi.fn(),
  keepFile: vi.fn(),
  prepareFiles: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const today = todayLocal();
const d = (n: number) => addDays(today, n);
const file = (
  id: string,
  code: string,
  extra: Partial<FilesPlanning["files"][number]> = {},
): FilesPlanning["files"][number] => ({
  id,
  code,
  name: null,
  capacity: 4,
  active: true,
  plannedDay: null,
  day: null,
  cars: 0,
  sound: true,
  ...extra,
});
const emptyDay = (date: string): FilesPlanning["load"][number] => ({
  date,
  returns: 0,
  placed: 0,
  toCome: 0,
  onSite: 3,
  filesServing: [],
  filesKept: [],
  room: 0,
  missing: 0,
});
const planning = (days: number): FilesPlanning => ({
  from: today,
  days,
  timezone: "Europe/Paris",
  capacity: 16,
  files: [
    // F01 holds three cars coming back today; F02 is kept by hand for tomorrow; F03 and F04 are free.
    file("f1", "F01", { cars: 3, day: today }),
    file("f2", "F02", { plannedDay: d(1), keptByHand: true }),
    file("f3", "F03"),
    file("f4", "F04", { cars: 2, day: d(2), sound: false }),
  ],
  load: Array.from({ length: days }, (_, i) => {
    const date = d(i);
    if (i === 0)
      return {
        ...emptyDay(date),
        returns: 3,
        placed: 3,
        filesServing: ["F01"],
        room: 1,
      };
    if (i === 1)
      return {
        ...emptyDay(date),
        returns: 7,
        placed: 1,
        toCome: 6,
        filesKept: ["F02"],
        room: 4,
        missing: 2,
      };
    return emptyDay(date);
  }),
  alerts: [
    { kind: "missing_room", date: d(1), count: 2 },
    { kind: "unsound", fileCode: "F04", count: 1 },
  ],
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/parking/planning"]}>
        <SpotPlanningPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getParking.mockResolvedValue({
    id: "p1",
    name: "Parking Démo",
    address: null,
    timezone: "Europe/Paris",
    totalCapacity: 16,
    safetyMarginPct: 0,
    shuttleTravelMinutes: 8,
    bookableCapacity: 16,
  });
  api.getFiles.mockResolvedValue({
    date: today,
    timezone: "Europe/Paris",
    files: [
      {
        ...file("f1", "F01"),
        geometry: null,
        sortOrder: 0,
        day: today,
        cars: [],
        movesToday: 0,
      },
    ],
    arrivals: [],
    stats: {
      files: 1,
      capacity: 4,
      cars: 0,
      onSite: 0,
      leavingToday: 0,
      movesToday: 0,
      unsound: 0,
    },
  });
  api.getFilesPlanning.mockImplementation(async (_id: string, days: number) =>
    planning(days),
  );
  api.keepFile.mockResolvedValue({ data: file("f3", "F03") });
  api.prepareFiles.mockResolvedValue({ data: { planned: 2, free: 1 } });
});

describe("planning des files (S-C, 07/10/2026)", () => {
  it("un parking en files : une ligne par jour avec ses retours, ses files et ce qui manque, les alertes", async () => {
    renderPage();
    expect(await screen.findByTestId("files-planning")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Planning des files" }),
    ).toBeInTheDocument();
    // No `from`: the server picks the parking's local day, the page reads it back.
    expect(api.getFilesPlanning).toHaveBeenCalledWith("p1", 7, undefined);
    // The spot planning is not fetched: the parking is stored in files.
    expect(api.getSpotPlanning).not.toHaveBeenCalled();
    expect(screen.getByTestId("files-capacity")).toHaveTextContent(
      "16 places en file",
    );
    const todayRow = screen.getByTestId(`day-${today}`);
    expect(todayRow).toHaveTextContent("0 à venir · 3 placées");
    expect(todayRow).toHaveTextContent("F01");
    const tomorrow = screen.getByTestId(`day-${d(1)}`);
    expect(tomorrow).toHaveTextContent("6 à venir · 1 placée");
    expect(tomorrow).toHaveTextContent("F02");
    expect(screen.getByTestId(`missing-${d(1)}`)).toHaveTextContent("2");
    expect(screen.getByTestId(`missing-${d(1)}`)).toHaveClass("text-bad");
    expect(screen.getByTestId(`missing-${today}`)).toHaveTextContent("—");
    expect(screen.getByTestId("alerts")).toHaveTextContent(
      `${shortDay(d(1))} : il manque 2 places en file`,
    );
    expect(screen.getByTestId("alerts")).toHaveTextContent(
      "File F04 : 1 voiture bloquée derrière une autre",
    );
    // The files below: kept by hand, out of order.
    expect(screen.getByTestId("planning-file-F02")).toHaveTextContent(
      "à la main",
    );
    expect(screen.getByTestId("planning-file-F02")).toHaveTextContent(
      `Gardée pour ${shortDay(d(1))}`,
    );
    expect(screen.getByTestId("planning-file-F04")).toHaveTextContent(
      "à remettre en ordre",
    );
    expect(screen.getByTestId("planning-file-F01")).toHaveTextContent(
      "Retours Aujourd'hui",
    );
    // The window widens to fourteen days.
    fireEvent.click(screen.getByRole("button", { name: "14 jours" }));
    await waitFor(() =>
      expect(api.getFilesPlanning).toHaveBeenLastCalledWith("p1", 14, undefined),
    );
    expect(await screen.findByTestId(`day-${d(13)}`)).toBeInTheDocument();
  });

  it("réserve une file vide pour un jour, libère une file gardée à la main, prépare les files", async () => {
    renderPage();
    await screen.findByTestId("files-planning");
    const tomorrow = screen.getByTestId(`day-${d(1)}`);
    fireEvent.click(
      tomorrow.querySelector('button[aria-pressed="false"]') as HTMLElement,
    );
    // Only the empty files are offered: F02 (already kept), F03.
    expect(await screen.findByTestId("keep-F03")).toBeInTheDocument();
    expect(screen.getByTestId("keep-F02")).toBeInTheDocument();
    expect(screen.queryByTestId("keep-F01")).not.toBeInTheDocument();
    expect(screen.queryByTestId("keep-F04")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("keep-F03"));
    await waitFor(() =>
      expect(api.keepFile).toHaveBeenCalledWith("p1", "f3", d(1)),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("keep-F03")).not.toBeInTheDocument(),
    );
    // The chip of a file kept by hand frees it.
    fireEvent.click(screen.getByRole("button", { name: "Libérer F02" }));
    await waitFor(() =>
      expect(api.keepFile).toHaveBeenCalledWith("p1", "f2", null),
    );
    fireEvent.click(screen.getByRole("button", { name: "Préparer les files" }));
    await waitFor(() => expect(api.prepareFiles).toHaveBeenCalledWith("p1"));
  });
});
