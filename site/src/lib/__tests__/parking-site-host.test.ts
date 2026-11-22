import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { foreignHost, forgetSiteHosts, siteSlugOfHost } from "../parking-site-host";

// 22/11/2026 (« le nom de domaine du parking »).

describe("le nom de domaine d'un parking", () => {
  it("reconnaît un hôte étranger, jamais ceux de Plazo", () => {
    expect(foreignHost("www.parking-des-cedres.fr")).toBe("www.parking-des-cedres.fr");
    expect(foreignHost("WWW.Parking-des-Cedres.fr:443")).toBe("www.parking-des-cedres.fr");
    for (const own of ["www.plazo.fr", "plazo.fr", "pro.plazo.fr", "plazo-abc.vercel.app", "localhost:3000", "127.0.0.1:3000", "", null, "bad host"]) {
      expect(foreignHost(own)).toBeNull();
    }
  });

  describe("le site qu'il ouvre", () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
      forgetSiteHosts();
      vi.stubGlobal("fetch", fetchMock);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      fetchMock.mockReset();
    });
    const answer = (status: number, body: unknown = {}) => ({ ok: status < 400, status, json: async () => body });

    it("demande à l'API une fois par minute, garde aussi un « rien »", async () => {
      fetchMock.mockResolvedValue(answer(200, { slug: "cedres" }));
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 0)).toBe("cedres");
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 30_000)).toBe("cedres");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe("http://api/api/public/site-domains/www.cedres.example");

      fetchMock.mockResolvedValue(answer(404));
      expect(await siteSlugOfHost("inconnu.example", "http://api", 0)).toBeNull();
      expect(await siteSlugOfHost("inconnu.example", "http://api", 1_000)).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      // After a minute the answer is read again: the site was taken offline.
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 61_000)).toBeNull();
    });

    it("garde la dernière réponse quand l'API ne répond pas, et refuse un slug douteux", async () => {
      fetchMock.mockResolvedValueOnce(answer(200, { slug: "cedres" }));
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 0)).toBe("cedres");
      fetchMock.mockRejectedValueOnce(new Error("down"));
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 61_000)).toBe("cedres");
      fetchMock.mockResolvedValueOnce(answer(500));
      expect(await siteSlugOfHost("www.cedres.example", "http://api", 62_000)).toBe("cedres");
      fetchMock.mockResolvedValueOnce(answer(200, { slug: "../pro" }));
      expect(await siteSlugOfHost("autre.example", "http://api", 0)).toBeNull();
    });
  });
});
