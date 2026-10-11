/**
 * 11/10/2026 (« Lance l'analyse automatiquement pour allopark »): an Allopark email whose booking page Plazo could not
 * read at reception (Allopark showed « gérer ma réservation » instead of the booking, the page did not answer…) is
 * analysed again by Plazo itself, as « Relancer l'analyse » does, a few times over the next hours: the page usually
 * shows the booking a few minutes later. Never a page that asked for an anti-robot check, nor one Allopark refused (a
 * 429, a Cloudflare block): both are left to the staff (« Prévent captcha »); never an email the staff handled,
 * archived or attached, nor one whose text is gone.
 */

/** Minutes from the last analysis (or the reception) to the next automatic one: five tries at most. */
export const AUTO_RETRY_DELAYS_MIN = [10, 30, 60, 180, 480] as const;
export const AUTO_RETRY_MAX = AUTO_RETRY_DELAYS_MIN.length;
/** Only for the emails of the last two days: an older one waits for the staff. */
export const AUTO_RETRY_WINDOW_HOURS = 48;
/** What became of the booking page that is worth another try (not `protected`, not `read`). */
export const AUTO_RETRY_OUTCOMES = ['not_found', 'unavailable'] as const;

export interface AutoRetryCandidate {
  status: string;
  reservationId: string | null;
  hasText: boolean;
  /** The outcome of the last Allopark page lookup (`refused` for an `unavailable` one Allopark refused), null when none was tried. */
  pageOutcome: string | null;
  autoRetries: number;
  analysedAt: Date | null;
  receivedAt: Date;
}

/**
 * When Plazo analyses this email again by itself (maybe already past: it is due), or null when it no longer does: not
 * waiting for the staff, booking page read or protected, all tries made, or received more than two days ago.
 */
export function nextAutoRetry(email: AutoRetryCandidate): Date | null {
  if (email.status !== 'incomplete' && email.status !== 'unrecognised') return null;
  if (email.reservationId || !email.hasText) return null;
  if (!email.pageOutcome || !(AUTO_RETRY_OUTCOMES as readonly string[]).includes(email.pageOutcome)) return null;
  if (email.autoRetries >= AUTO_RETRY_MAX) return null;
  const last = email.analysedAt ?? email.receivedAt;
  const next = new Date(last.getTime() + AUTO_RETRY_DELAYS_MIN[email.autoRetries] * 60_000);
  const closes = email.receivedAt.getTime() + AUTO_RETRY_WINDOW_HOURS * 3_600_000;
  return next.getTime() > closes ? null : next;
}
