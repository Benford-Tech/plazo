import { adminApi, ApiError, getTokens, getViewAs, setTokens, setViewAs, VIEW_AS_ENDED_EVENT } from "@/lib/api";

const tokens = (access: string, refresh: string) => ({
  access: { token: access, expires: "2099-01-01" },
  refresh: { token: refresh, expires: "2099-01-01" },
});

const response = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiRequest", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("envoie le jeton d'accès", async () => {
    setTokens(tokens("a1", "r1"));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response(200, { id: "s1" }));
    await adminApi.getMe();
    expect((fetchMock.mock.calls[0][1]!.headers as Record<string, string>).Authorization).toBe("Bearer a1");
  });

  it("rafraîchit une fois sur 401 puis rejoue la requête", async () => {
    setTokens(tokens("expired", "r1"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401, { message: "x", code: "unauthorized" }))
      .mockResolvedValueOnce(response(200, { tokenData: tokens("a2", "r2") }))
      .mockResolvedValueOnce(response(200, { id: "s1" }));
    await expect(adminApi.getMe()).resolves.toEqual({ id: "s1" });
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/internal\/auth\/refresh$/);
    expect((fetchMock.mock.calls[2][1]!.headers as Record<string, string>).Authorization).toBe("Bearer a2");
    expect(getTokens()?.refresh.token).toBe("r2");
  });

  it("oublie la session si le rafraîchissement échoue", async () => {
    setTokens(tokens("expired", "r1"));
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401, { code: "unauthorized" }))
      .mockResolvedValueOnce(response(401, { code: "unauthorized" }));
    await expect(adminApi.getMe()).rejects.toBeInstanceOf(ApiError);
    expect(getTokens()).toBeNull();
  });

  it("expose le code et les champs en erreur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response(400, { message: "m", code: "validation_failed", fields: { totalCapacity: "min_1" } }));
    const error = await adminApi.getParking().catch(e => e);
    expect(error).toMatchObject({ status: 400, code: "validation_failed", fields: { totalCapacity: "min_1" } });
  });

  describe("consultation de l'espace d'un loueur", () => {
    const viewAs = { token: "v1", expires: "2099-01-01T00:00:00Z", operator: { id: "o1", name: "Parking Démo" } };
    const authOf = (call: unknown[]) => ((call[1] as RequestInit).headers as Record<string, string>).Authorization;

    it("utilise la session de consultation dans l'espace du loueur, et la sienne pour la plateforme", async () => {
      setTokens(tokens("a1", "r1"));
      setViewAs(viewAs);
      const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => response(200, {}));
      await adminApi.getParking();
      await adminApi.getPlatformOperators();
      await adminApi.logout();
      expect(fetchMock.mock.calls.map(authOf)).toEqual(["Bearer v1", "Bearer a1", "Bearer a1"]);
    });

    it("revient à la plateforme quand la consultation a expiré, sans perdre sa session", async () => {
      setTokens(tokens("a1", "r1"));
      setViewAs(viewAs);
      const ended = vi.fn();
      window.addEventListener(VIEW_AS_ENDED_EVENT, ended);
      vi.spyOn(globalThis, "fetch").mockResolvedValue(response(401, { code: "unauthorized" }));
      await expect(adminApi.getParking()).rejects.toMatchObject({ code: "view_as_ended" });
      expect(ended).toHaveBeenCalled();
      expect(getViewAs()).toBeNull();
      expect(getTokens()?.access.token).toBe("a1");
      window.removeEventListener(VIEW_AS_ENDED_EVENT, ended);
    });

    it("ignore une consultation périmée", () => {
      setViewAs({ ...viewAs, expires: "2000-01-01T00:00:00Z" });
      expect(getViewAs()).toBeNull();
    });
  });
});
