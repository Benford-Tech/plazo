export interface Env {
  /** "https://www.plazo.fr/api/public/inbound/email" (wrangler.toml). */
  PLAZO_INBOUND_URL: string;
  /** Worker secret, the same value as INBOUND_EMAIL_SECRET on Vercel. */
  INBOUND_EMAIL_SECRET: string;
  /**
   * Optional, a verified Email Routing destination (set in the dashboard, kept across deploys by `keep_vars`): receives
   * the emails Plazo cannot take, and those sent to an address of plazo.fr that is no parking's (R-A, 08/10/2026: the
   * catch-all of the apex domain brings every address here, replies to reservations@ or contact@ included).
   */
  FALLBACK_ADDRESS?: string;
}

/** Vercel takes request bodies up to 4.5 MB: a bigger message is cut there (its text parts come first, attachments last). */
export const RAW_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Cloudflare Email Routing calls this for every email sent to <slug>@plazo.fr (catch-all of the apex domain: Cloudflare
 * offers no catch-all on a subdomain, R-A of 08/10/2026): the raw message is posted to Plazo as received, with the shared
 * secret and the envelope (sender, Plazo address) in headers, and Plazo parses it. Nothing is decoded here (08/10/2026):
 * the Workers Free plan allows 10 ms of CPU per email, which decoding a real confirmation (HTML, inline images) exceeded
 * (EXCEEDED_CPU, "Worker call failed after 3 attempts" for the sender). When Plazo cannot take the email, or when no
 * parking has the address, it goes to the fallback address if there is one, else it is refused so that the sender's
 * mailbox reports the failure (nothing is lost silently).
 */
export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    let failure: string | null = null;
    let unknown = false;
    try {
      if (!env.PLAZO_INBOUND_URL || !env.INBOUND_EMAIL_SECRET) throw new Error("PLAZO_INBOUND_URL or INBOUND_EMAIL_SECRET missing");
      const { body, truncated } = await readRaw(message.raw, RAW_MAX_BYTES);
      const response = await fetch(env.PLAZO_INBOUND_URL, {
        method: "POST",
        headers: {
          "content-type": "message/rfc822",
          "x-inbound-secret": env.INBOUND_EMAIL_SECRET,
          "x-envelope-from": headerSafe(message.from),
          "x-envelope-to": headerSafe(message.to),
          ...(truncated ? { "x-inbound-truncated": "1" } : {}),
        },
        body,
      });
      if (!response.ok) failure = `Plazo answered ${response.status}`;
      else {
        // Plazo answers { received, imported, toCheck, ignored }: ignored means no parking has this address.
        const result = (await response.json().catch(() => null)) as { ignored?: number } | null;
        unknown = (result?.ignored ?? 0) > 0;
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (!failure && !unknown) return;
    if (failure) console.error(`[plazo-email-worker] ${message.to}: ${failure}`);
    const reason = unknown ? `No mailbox for ${message.to}` : "Plazo could not take this email right now, please try again later.";
    if (env.FALLBACK_ADDRESS && (await forwardTo(message, env.FALLBACK_ADDRESS))) return;
    message.setReject(reason);
  },
} satisfies ExportedHandler<Env>;

/** The first `limit` bytes of the message, copied as they come: no decoding, next to no CPU. */
export async function readRaw(stream: ReadableStream<Uint8Array>, limit: number): Promise<{ body: Uint8Array; truncated: boolean }> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (size + value.byteLength >= limit) {
      const room = limit - size;
      chunks.push(value.subarray(0, room));
      size = limit;
      truncated = value.byteLength > room || !(await reader.read()).done;
      await reader.cancel().catch(() => undefined);
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, truncated };
}

/** An envelope address as an HTTP header value: printable ASCII only (an exotic address must not crash the Worker). */
function headerSafe(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?").trim();
}

/**
 * Forwards to the fallback address and says whether it worked. Email Routing only forwards to a verified destination
 * address: an unverified one makes forward() throw, which must end in a clear refusal rather than a crashed Worker
 * ("worker script threw an exception", a temporary error that the sender's mailbox keeps retrying).
 */
async function forwardTo(message: ForwardableEmailMessage, address: string): Promise<boolean> {
  try {
    await message.forward(address);
    return true;
  } catch (error) {
    console.error(`[plazo-email-worker] forward to the fallback address failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
