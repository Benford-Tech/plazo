import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { DEFAULT_AIRPORT } from "../site";

// C (09/10/2026): the home page is the default airport's page, cached (ISR), with one address.
describe("the home page and the default airport's page", () => {
  it("serve one page under one address: « / » shows it, its own address redirects there for good", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({
      source: `/${DEFAULT_AIRPORT}`,
      destination: "/",
      permanent: true,
    });
    const rewrites = await nextConfig.rewrites!();
    expect(
      Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles,
    ).toContainEqual({ source: "/", destination: `/${DEFAULT_AIRPORT}` });
  });
});

// Universal links (11/10/2026): the app's association file is served as JSON, from public/.well-known.
describe("the Apple app site association", () => {
  it("is served as JSON", async () => {
    expect(await nextConfig.headers!()).toContainEqual({
      source: "/.well-known/apple-app-site-association",
      headers: [{ key: "Content-Type", value: "application/json" }],
    });
  });
});

// « Lien court Plazo » (27/10/2026): the code behind /a/ opens a booking, treated like the booking pages.
describe("the short link pages", () => {
  it("are never indexed, cached or leaked in a Referer", async () => {
    expect(await nextConfig.headers!()).toContainEqual({
      source: "/a/:path*",
      headers: [
        { key: "Referrer-Policy", value: "same-origin" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "private, no-store" },
      ],
    });
  });
});
