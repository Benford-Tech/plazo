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
