import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi, ApiError, setViewAs, VIEW_AS_STORAGE_KEY } from "./api";

const session = (token: string) => ({
  token,
  expires: new Date(Date.now() + 3600_000).toISOString(),
  operator: { id: token, name: token },
});

describe("parking switched while a call is out (24/11/2026)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("drops the answer of the previous parking", async () => {
    setViewAs(session("parking-a"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        setViewAs(session("parking-b"));
        return new Response(JSON.stringify({ id: "me" }), { status: 200 });
      }),
    );
    const err = await adminApi.getMe().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("session_changed");
  });

  it("keeps the answer when the parking did not change", async () => {
    setViewAs(session("parking-a"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "me" }), { status: 200 })));
    await expect(adminApi.getMe()).resolves.toMatchObject({ id: "me" });
    expect(localStorage.getItem(VIEW_AS_STORAGE_KEY)).toContain("parking-a");
  });
});
