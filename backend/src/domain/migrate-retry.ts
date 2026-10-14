/**
 * Retry rules for `prisma migrate deploy` during the Vercel build.
 *
 * Neon suspends an idle database; the first connection after a pause can fail with P1001 ("Can't reach
 * database server") while the compute wakes up, which used to fail the whole production deployment
 * (14/10/2026). Only errors raised before any migration runs are retried: an unreachable server, a
 * connection timeout or a connection closed by the server. Anything else (a failed migration, P3xxx)
 * fails at once, as before.
 */

/** Prisma error codes that mean the database could not be reached, not that a migration failed. */
export const TRANSIENT_CODES = ['P1001', 'P1002', 'P1017'] as const;

/** Waits before each new attempt, in milliseconds: 5 attempts over about one minute. */
export const RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 30_000];

/** The transient Prisma code found in the command output, if any. */
export function transientCodeIn(output: string): string | null {
  return TRANSIENT_CODES.find(code => new RegExp(`\\b${code}\\b`).test(output)) ?? null;
}

/** Wait before attempt `attempt + 1` (attempts count from 1), or null when no attempt is left. */
export function retryDelay(attempt: number): number | null {
  return RETRY_DELAYS_MS[attempt - 1] ?? null;
}
