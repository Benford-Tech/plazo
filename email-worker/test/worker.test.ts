import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { RAW_MAX_BYTES, type Env } from "../src/index";
import { alloparkForwarded } from "./samples";

function message(raw: string, to = "parkair-lyon-7f3a@plazo.fr") {
  return {
    from: "bounce@gmail.com",
    to,
    headers: new Headers(),
    raw: new Response(raw).body!,
    rawSize: raw.length,
    setReject: vi.fn(),
    forward: vi.fn(async () => undefined),
    reply: vi.fn(async () => undefined),
  } as unknown as ForwardableEmailMessage & { setReject: ReturnType<typeof vi.fn>; forward: ReturnType<typeof vi.fn> };
}

const env: Env = { PLAZO_INBOUND_URL: "https://www.plazo.test/api/public/inbound/email", INBOUND_EMAIL_SECRET: "s3cret" };

afterEach(() => vi.unstubAllGlobals());

describe("email()", () => {
  it("envoie le mail à Plazo avec le secret dans l'en-tête, pas dans l'adresse", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ received: 1, imported: 1, toCheck: 0, ignored: 0 })));
    vi.stubGlobal("fetch", fetchMock);
    const msg = message(alloparkForwarded);
    await worker.email(msg, env);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(env.PLAZO_INBOUND_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-inbound-secret"]).toBe("s3cret");
    const headers = init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("message/rfc822");
    expect(headers["x-envelope-from"]).toBe("bounce@gmail.com");
    expect(headers["x-envelope-to"]).toBe("parkair-lyon-7f3a@plazo.fr");
    expect(headers["x-inbound-truncated"]).toBeUndefined();
    // The message goes as received: Plazo decodes it (the Worker's 10 ms of CPU on the Free plan would not).
    expect(new TextDecoder().decode(init.body as Uint8Array)).toBe(alloparkForwarded);
    expect(msg.setReject).not.toHaveBeenCalled();
    expect(msg.forward).not.toHaveBeenCalled();
  });

  it("un mail de plus de 4 Mo est coupé à 4 Mo (les textes viennent avant les pièces jointes) et signalé comme tel", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ received: 1, imported: 0, toCheck: 1, ignored: 0 })));
    vi.stubGlobal("fetch", fetchMock);
    const big = alloparkForwarded + "\r\n" + "x".repeat(RAW_MAX_BYTES);
    const msg = message(big);
    await worker.email(msg, env);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.body as Uint8Array).byteLength).toBe(RAW_MAX_BYTES);
    expect((init.headers as Record<string, string>)["x-inbound-truncated"]).toBe("1");
    expect(new TextDecoder().decode((init.body as Uint8Array).subarray(0, alloparkForwarded.length))).toBe(alloparkForwarded);
    expect(msg.setReject).not.toHaveBeenCalled();
    // Exactly at the limit: whole, not flagged.
    const exact = message("y".repeat(RAW_MAX_BYTES));
    await worker.email(exact, env);
    const [, exactInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect((exactInit.body as Uint8Array).byteLength).toBe(RAW_MAX_BYTES);
    expect((exactInit.headers as Record<string, string>)["x-inbound-truncated"]).toBeUndefined();
  });

  it("Plazo refuse ou ne répond pas : le mail part à l'adresse de secours, sinon il est refusé (l'expéditeur le voit)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    const kept = message(alloparkForwarded);
    await worker.email(kept, { ...env, FALLBACK_ADDRESS: "secours@example.com" });
    expect(kept.forward).toHaveBeenCalledWith("secours@example.com");
    expect(kept.setReject).not.toHaveBeenCalled();

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));
    const refused = message(alloparkForwarded);
    await worker.email(refused, env);
    expect(refused.setReject).toHaveBeenCalledTimes(1);
  });

  it("adresse de plazo.fr qui n'est à aucun parking (réponse à reservations@, contact@…) : part à l'adresse de secours, sinon refusée", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ received: 1, imported: 0, toCheck: 0, ignored: 1 }))));
    const kept = message(alloparkForwarded, "reservations@plazo.fr");
    await worker.email(kept, { ...env, FALLBACK_ADDRESS: "secours@example.com" });
    expect(kept.forward).toHaveBeenCalledWith("secours@example.com");
    expect(kept.setReject).not.toHaveBeenCalled();

    const refused = message(alloparkForwarded, "contact@plazo.fr");
    await worker.email(refused, env);
    expect(refused.forward).not.toHaveBeenCalled();
    expect(refused.setReject).toHaveBeenCalledWith("No mailbox for contact@plazo.fr");
  });

  it("adresse de secours non vérifiée chez Cloudflare : le renvoi échoue, le mail est refusé avec son motif, le Worker ne plante pas", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ received: 1, imported: 0, toCheck: 0, ignored: 1 }))));
    const msg = message(alloparkForwarded, "contact@plazo.fr");
    msg.forward.mockRejectedValueOnce(new Error("destination address not verified"));
    await expect(worker.email(msg, { ...env, FALLBACK_ADDRESS: "secours@example.com" })).resolves.toBeUndefined();
    expect(msg.forward).toHaveBeenCalledWith("secours@example.com");
    expect(msg.setReject).toHaveBeenCalledWith("No mailbox for contact@plazo.fr");
  });

  it("sans secret configuré, rien n'est envoyé et le mail est refusé", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const msg = message(alloparkForwarded);
    await worker.email(msg, { ...env, INBOUND_EMAIL_SECRET: "" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(msg.setReject).toHaveBeenCalledTimes(1);
  });
});
