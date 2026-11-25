// @vitest-environment node
import { NextRequest, type NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../../proxy";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const run = (url: string) => proxy(new NextRequest(new URL(url))) as NextResponse;

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

// 22/11/2026 (« le nom de domaine du parking »): on a parking's own host, the home page is its site.
describe("le nom de domaine d'un parking", () => {
  const onHost = async (url: string, host: string, slug: string | null, pages: string[] = []) => {
    const { vi } = await import("vitest");
    const { forgetSiteHosts } = await import("../parking-site-host");
    forgetSiteHosts();
    vi.stubGlobal("fetch", async () => (slug ? { ok: true, status: 200, json: async () => ({ slug, pages }) } : { ok: false, status: 404, json: async () => ({}) }));
    try {
      return await proxy(new NextRequest(new URL(url), { headers: { host } }));
    } finally {
      vi.unstubAllGlobals();
    }
  };

  it("sert le site du parking à la racine, dans la langue demandée", async () => {
    const home = await onHost("https://www.cedres.example/", "www.cedres.example", "cedres");
    expect(home.headers.get("x-middleware-rewrite")).toBe("https://www.cedres.example/fr/s/cedres");
    const english = await onHost("https://www.cedres.example/en", "www.cedres.example", "cedres");
    expect(english.headers.get("x-middleware-rewrite")).toBe("https://www.cedres.example/en/s/cedres");
  });

  it("sert aussi les pages du site (24/11/2026), et seulement elles", async () => {
    const pages = ["aeroport", "questions"];
    const page = await onHost("https://www.cedres.example/en/aeroport", "www.cedres.example", "cedres", pages);
    expect(page.headers.get("x-middleware-rewrite")).toBe("https://www.cedres.example/en/s/cedres/aeroport");
    const plazo = await onHost("https://www.cedres.example/contact", "www.cedres.example", "cedres", pages);
    expect(plazo.status).toBe(308);
  });

  it("renvoie toute autre page, et un hôte sans site, vers le site de Plazo", async () => {
    const other = await onHost("https://www.cedres.example/ma-reservation?x=1", "www.cedres.example", "cedres");
    expect(other.status).toBe(308);
    expect(new URL(other.headers.get("location")!).pathname).toBe("/ma-reservation");
    expect(new URL(other.headers.get("location")!).host).not.toBe("www.cedres.example");
    const unknown = await onHost("https://inconnu.example/", "inconnu.example", null);
    expect(unknown.status).toBe(307);
  });

  it("donne le logo du parking comme icône de l'onglet (25/11/2026), l'icône de Plazo sinon", async () => {
    const icon = await onHost("https://www.cedres.example/favicon.ico", "www.cedres.example", "cedres");
    expect(icon.status).toBe(307);
    expect(icon.headers.get("location")).toBe("https://www.cedres.example/api/public/sites/cedres/icon");
    const unknown = await onHost("https://inconnu.example/favicon.ico", "inconnu.example", null);
    expect(new URL(unknown.headers.get("location")!).pathname).toBe("/favicon.ico");
    // On Plazo's own domain, its own icon, untouched.
    const own = await proxy(new NextRequest(new URL("https://www.plazo.fr/favicon.ico"), { headers: { host: "www.plazo.fr" } }));
    expect(own.headers.get("x-middleware-rewrite")).toBeNull();
    expect(own.headers.get("location")).toBeNull();
  });
});
