// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../../proxy";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const run = (url: string) => proxy(new NextRequest(new URL(url)));

describe("manage links (proxy)", () => {
  it("keeps the key in a cookie limited to the booking, and drops it from the address", () => {
    const res = run(`https://site.example/ma-reservation/rab234?cle=${TOKEN}&confirmee=1`);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://site.example/ma-reservation/RAB234?confirmee=1");
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`cle-RAB234=${TOKEN}`);
    expect(cookie).toContain("Path=/ma-reservation/RAB234");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("also cleans the calendar link", () => {
    const res = run(`https://site.example/ma-reservation/RAB234/agenda?cle=${TOKEN}`);
    expect(res.headers.get("location")).toBe("https://site.example/ma-reservation/RAB234/agenda");
    expect(res.headers.get("set-cookie")).toContain(`cle-RAB234=${TOKEN}`);
  });

  it("drops a malformed key without storing it, and lets other requests through", () => {
    const res = run("https://site.example/ma-reservation/RAB234?cle=%3Cscript%3E");
    expect(res.headers.get("location")).toBe("https://site.example/ma-reservation/RAB234");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(run("https://site.example/ma-reservation/RAB234").headers.get("location")).toBeNull();
  });
});
