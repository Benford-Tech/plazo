import { afterEach, describe, expect, it, vi } from "vitest";
import { paymentsOnline } from "../payments";

describe("paymentsOnline", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("follows the API's /public/config", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ payments: "online" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await paymentsOnline()).toBe(true);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toMatch(/\/api\/public\/config$/);
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ payments: "on_site" }), { status: 200 }));
    expect(await paymentsOnline()).toBe(false);
  });

  it("keeps the « paid at the parking » wording when the API cannot say", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    expect(await paymentsOnline()).toBe(false);
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 503 }));
    expect(await paymentsOnline()).toBe(false);
  });
});
