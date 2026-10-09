import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { DEFAULT_AIRPORT } from "../site";

// C (09/10/2026): the home page is the default airport's page, cached (ISR), with one address.
describe("the home page and the default airport's page", () => {
  it("serve one page under one address: « / » shows it, its own address redirects there for good", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: `/${DEFAULT_AIRPORT}`, destination: "/", permanent: true });
    const rewrites = await nextConfig.rewrites!();
    expect(Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles).toContainEqual({ source: "/", destination: `/${DEFAULT_AIRPORT}` });
  });
});
