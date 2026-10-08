import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
const counts = { imported: 0, duplicate: 0, incomplete: 0, unrecognised: 0, dismissed: 0, forwarding: 0 };
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

describe("probe", () => {
  beforeEach(() => {
    api.getInboundSettings.mockReset().mockResolvedValue(settings());
    api.enableInboundAddress.mockReset().mockResolvedValue(settings());
  });

  it("A: existing scenario — how many GETs by the time the address shows", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValueOnce(settings({ address: null }));
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    expect(await screen.findByTestId("wizard-address")).toHaveTextContent(ADDRESS);
    console.log("A getInboundSettings calls:", api.getInboundSettings.mock.calls.length, "enable calls:", api.enableInboundAddress.mock.calls.length);
    console.log("A cache address:", client.getQueryData<InboundSettings>(["inbound-settings"])?.address);
  });

  it("B: existing scenario but the POST returns NO address — does wizard-address still show ADDRESS?", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValueOnce(settings({ address: null }));
    api.enableInboundAddress.mockResolvedValue(settings({ address: null }));
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    expect(await screen.findByTestId("wizard-address")).toHaveTextContent(ADDRESS);
    expect(api.enableInboundAddress).toHaveBeenCalledTimes(1);
    expect(api.enableInboundAddress).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("wizard-preparing")).not.toBeInTheDocument();
    console.log("B getInboundSettings calls:", api.getInboundSettings.mock.calls.length);
  });

  it("C: reviewer's rewrite — GET always address:null, only the POST carries the address", async () => {
    const user = userEvent.setup();
    api.getInboundSettings.mockResolvedValue(settings({ address: null }));
    api.enableInboundAddress.mockResolvedValue(settings());
    renderCard();
    await user.click(await screen.findByTestId("inbound-connect"));
    let shown: string | null = null;
    try {
      shown = (await screen.findByTestId("wizard-address", {}, { timeout: 1500 })).textContent;
    } catch {
      shown = null;
    }
    console.log("C wizard-address shown:", shown, "| preparing present:", Boolean(screen.queryByTestId("wizard-preparing")),
      "| GET calls:", api.getInboundSettings.mock.calls.length, "| enable calls:", api.enableInboundAddress.mock.calls.length,
      "| cache address:", client.getQueryData<InboundSettings>(["inbound-settings"])?.address);
  });
});
