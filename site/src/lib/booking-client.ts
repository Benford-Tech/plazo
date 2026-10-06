/**
 * Browser-side calls to a booking's public routes (the manage token in the x-booking-token header,
 * as the server-side `api` does): the live blocks of "Ma réservation" poll and act from the page.
 */
export class BookingClientError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export async function bookingRequest<T>(reference: string, path: string, token: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/public/bookings/${encodeURIComponent(reference)}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "x-booking-token": token, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BookingClientError(0, "network");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data ?? {}) as { code?: string; fields?: Record<string, string> };
    throw new BookingClientError(res.status, err.code ?? (err.fields ? Object.values(err.fields)[0] : null) ?? (res.status >= 500 ? "server_error" : "unknown"));
  }
  return data as T;
}

/** "14:05" in the parking's time (every parking is in France for now). */
export const hhmm = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/** "mar. 7 oct. 08:00" for "à partir de …". */
export const dayAndTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/** "1 h 12 min", "38 min". */
export function durationLabel(seconds: number): string {
  const m = Math.max(0, Math.round(seconds / 60));
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${String(rest).padStart(2, "0")} min` : `${Math.floor(m / 60)} h`;
}
