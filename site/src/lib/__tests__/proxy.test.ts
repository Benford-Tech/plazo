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

describe("languages (proxy, 13/11/2026)", () => {
  const rewritten = (url: string) => run(url).headers.get("x-middleware-rewrite");

  it("serves a French address from /fr internally, the language in a request header for the actions", () => {
    expect(rewritten("https://site.example/")).toBe("https://site.example/fr");
    expect(rewritten("https://site.example/contact")).toBe("https://site.example/fr/contact");
    expect(run("https://site.example/contact").headers.get("x-middleware-request-x-plazo-locale")).toBe("fr");
  });

  it("lets the other languages through as they are", () => {
    const res = run("https://site.example/en/contact");
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-request-x-plazo-locale")).toBe("en");
  });

  it("gives French one address: /fr/… goes to the address without the prefix", () => {
    const res = run("https://site.example/fr/contact?x=1");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://site.example/contact?x=1");
    expect(run("https://site.example/fr").headers.get("location")).toBe("https://site.example/");
  });

  it("keeps the manage key for the booking's pages in the language of the link", () => {
    const res = run(`https://site.example/en/ma-reservation/rab234?cle=${TOKEN}`);
    expect(res.headers.get("location")).toBe("https://site.example/en/ma-reservation/RAB234");
    expect(res.headers.get("set-cookie")).toContain("Path=/en/ma-reservation/RAB234");
  });
});
