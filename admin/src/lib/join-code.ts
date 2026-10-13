import type { JoinCode } from "./types";

/**
 * 13/10/2026: when to read the code of the day again. Just after it changes (local midnight of the parking), and at
 * least every 15 minutes; a code the server still gives after its end (clocks a little apart) is asked again 5 s later.
 */
export function joinCodeRefetchMs(code: JoinCode | undefined, now = Date.now()): number | false {
  if (!code) return false;
  const left = new Date(code.validUntil).getTime() - now;
  if (Number.isNaN(left)) return 15 * 60_000;
  return Math.min(Math.max(left + 2000, 5000), 15 * 60_000);
}

/**
 * A code read before its end (`fetchedAt`, from this browser's clock) whose end has passed: yesterday's code, not to be
 * shown or copied while the new one is read. A code read after its end is the server's answer (the computer's clock
 * may be ahead) and stays shown.
 */
export function isJoinCodeStale(code: JoinCode, fetchedAt: number, now = Date.now()): boolean {
  const end = Date.parse(code.validUntil);
  if (Number.isNaN(end)) return false;
  return fetchedAt < end && now >= end;
}
