import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const incoming = new Headers();
vi.mock("next/headers", () => ({ headers: async () => incoming }));

import { api, ApiError, apiRequest, backendBase, backendUrl, clientIp, SHARED_READ_SECONDS, sharedRead, siteApiKey } from "../api";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("backend URL", () => {
  it("joins the base and the path by string, whatever the trailing slashes", () => {
    expect(backendBase({})).toBe("http://localhost:3005");
    expect(backendBase({ BACKEND_URL: "https://backend.internal/" })).toBe("https://backend.internal");
    expect(backendUrl("/api/public/search", { BACKEND_URL: "https://backend.internal//" })).toBe("https://backend.internal/api/public/search");
    expect(backendUrl("api/public/search", { BACKEND_URL: "https://backend.internal" })).toBe("https://backend.internal/api/public/search");
    expect(backendUrl("/api/public/search", { BACKEND_URL: "https://x.vercel.internal/base" })).toBe("https://x.vercel.internal/base/api/public/search");
  });

  it("takes the traveller's IP from x-forwarded-for, else x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "x-real-ip": "10.0.0.2" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(new Headers())).toBeNull();
  });

  it("takes cf-connecting-ip only when the request came through Cloudflare's proxy (08/10/2026)", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "172.70.111.26", "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "2606:4700:3030::1", "cf-connecting-ip": "2001:db8::9" }))).toBe("2001:db8::9");
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.9", "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers({ "x-forwarded-for": "172.70.111.26", "cf-connecting-ip": "garbage" }))).toBe("172.70.111.26");
  });
});

describe("site key", () => {
  it("is required once deployed on Vercel, optional locally", () => {
    expect(siteApiKey({ SITE_API_KEY: " k " })).toBe("k");
    expect(siteApiKey({})).toBe("");
    expect(() => siteApiKey({ VERCEL: "1" })).toThrow(/SITE_API_KEY/);
    expect(() => siteApiKey({ VERCEL: "1", SITE_API_KEY: "  " })).toThrow(/SITE_API_KEY/);
    expect(siteApiKey({ VERCEL: "1", SITE_API_KEY: "k" })).toBe("k");
  });
});

describe("apiRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("BACKEND_URL", "https://backend.internal/");
    vi.stubEnv("SITE_API_KEY", "site-secret");
    incoming.set("x-forwarded-for", "203.0.113.7, 10.0.0.1");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    incoming.delete("x-forwarded-for");
  });

  it("sends the site key and the traveller's IP, uncached", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { airport: { slug: "lys" }, results: [] }));
    const data = await api.search("lyon-saint-exupery", "2026-10-04T06:30", "2026-10-11T15:05");
    expect(data).toEqual({ airport: { slug: "lys" }, results: [] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.internal/api/public/search?airport=lyon-saint-exupery&arrivalAt=2026-10-04T06%3A30&returnAt=2026-10-11T15%3A05");
    expect(init.method).toBe("GET");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({ "x-plazo-site-key": "site-secret", "x-plazo-client-ip": "203.0.113.7" });
    expect(init.body).toBeUndefined();
  });

  it("puts the booking token in a header, never in the URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { reference: "RAB234" }));
    await api.changeFlight("RAB234", "tok_123", "TO 3627");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.internal/api/public/bookings/RAB234/flight");
    expect(url).not.toContain("tok_123");
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({ "x-booking-token": "tok_123", "content-type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({ returnFlight: "TO 3627" });
  });

  it("encodes path segments", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await api.airport("a/b");
    expect(fetchMock.mock.calls[0][0]).toBe("https://backend.internal/api/public/airports/a%2Fb");
  });

  it("maps validation errors with their field codes", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { message: "plate: invalid_plate", code: "validation_failed", fields: { plate: "invalid_plate", acceptTerms: "terms_required" } }),
    );
    const error = await apiRequest("/api/public/bookings", { method: "POST", body: {} }).catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "validation_failed", fields: { plate: "invalid_plate", acceptTerms: "terms_required" } });
  });

  it("keeps the details of an overbooking", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { message: "Full", code: "overbooked", details: { fullNights: ["2026-10-04"] } }));
    const error = await apiRequest("/api/public/bookings", { method: "POST", body: {} }).catch(e => e);
    expect(error).toMatchObject({ status: 409, code: "overbooked", details: { fullNights: ["2026-10-04"] } });
  });

  it("gives a code to errors without a JSON body", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Too many requests, please try again later.", { status: 429 }));
    await expect(apiRequest("/api/public/bookings/lookup")).rejects.toMatchObject({ status: 429, code: "too_many_requests" });
    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 502 }));
    await expect(apiRequest("/api/public/search")).rejects.toMatchObject({ status: 502, code: "server_error" });
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    await expect(apiRequest("/api/public/airports/x")).rejects.toMatchObject({ status: 404, code: "not_found" });
  });

  it("reports an unreachable backend as a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(apiRequest("/api/public/search")).rejects.toMatchObject({ status: 0, code: "network" });
  });

  it("omits the IP header when the request has none", async () => {
    incoming.delete("x-forwarded-for");
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await apiRequest("/api/public/airports/lyon-saint-exupery");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("x-plazo-client-ip");
  });
  it("reads what every visitor shares (airport, default stay) without the visitor's IP, cached a few minutes (C, 09/10/2026)", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(200, { results: [] }));
    await api.airport("lyon-saint-exupery");
    await api.sharedSearch("lyon-saint-exupery", "2026-10-10T08:00", "2026-10-17T18:00");
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toMatch(/^https:\/\/backend\.internal\/api\/public\/(airports|search)/);
      expect(init.headers).toEqual({ accept: "application/json", "x-plazo-site-key": "site-secret" });
      expect(init.next).toEqual({ revalidate: SHARED_READ_SECONDS });
      expect(init.cache).toBeUndefined();
    }
    expect(fetchMock.mock.calls[1][0]).toBe("https://backend.internal/api/public/search?airport=lyon-saint-exupery&arrivalAt=2026-10-10T08%3A00&returnAt=2026-10-17T18%3A00");
  });

  it("maps a shared read's errors like any other", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { message: "Not found", code: "airport_not_found" }));
    await expect(sharedRead("/api/public/airports/x")).rejects.toMatchObject({ status: 404, code: "airport_not_found" });
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(sharedRead("/api/public/airports/x")).rejects.toMatchObject({ status: 0, code: "network" });
  });
});
