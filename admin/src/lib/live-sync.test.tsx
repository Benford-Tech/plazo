import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const api = vi.hoisted(() => ({ liveSync: vi.fn() }));
vi.mock("@/lib/api", () => ({ adminApi: { liveSync: () => api.liveSync() } }));

import { useLiveSync } from "./live-sync";

function Screen({ load }: { load: () => Promise<number> }) {
  useLiveSync(true);
  useQuery({ queryKey: ["screen"], queryFn: load });
  return null;
}

describe("useLiveSync", () => {
  it("relit les écrans quand la version change, pas à la première lecture", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const load = vi.fn(async () => 1);
    api.liveSync.mockResolvedValueOnce({ version: "a" }).mockResolvedValue({ version: "b" });
    const wrap = (c: ReactNode) => <QueryClientProvider client={client}>{c}</QueryClientProvider>;
    render(wrap(<Screen load={load} />));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.getQueryData(["live-sync"])).toEqual({ version: "a" }));
    expect(load).toHaveBeenCalledTimes(1);
    await client.refetchQueries({ queryKey: ["live-sync"] });
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });
});
