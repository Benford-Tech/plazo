/**
 * The calls of Plateforme › Prospection (25/11/2026, « A · File d'appels »): what a call's result is made of.
 * The queue itself is built by the page from the prospects' list (admin/src/lib/prospecting.ts, `callQueue`).
 */
export const CALL_OUTCOMES = ['no_answer', 'voicemail', 'callback', 'interested', 'not_interested', 'wrong_number'] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

/** Nobody picked up: three in a row take the prospect out of the queue. */
export const MISSED_OUTCOMES: CallOutcome[] = ['no_answer', 'voicemail'];
export const MAX_MISSED_CALLS = 3;
export const MAX_CALL_NOTE = 300;
/** A callback is asked for at most this far ahead. */
export const MAX_CALLBACK_DAYS = 365;

export interface CallInput {
  outcome: CallOutcome;
  note: string | null;
  callbackAt: Date | null;
}

export function readCall(
  input: { outcome?: unknown; note?: unknown; callbackAt?: unknown },
  now: Date,
): { ok: true; value: CallInput } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const outcome = CALL_OUTCOMES.find(o => o === input.outcome);
  if (!outcome) fields.outcome = 'invalid';

  let note: string | null = null;
  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== 'string') fields.note = 'invalid';
    else {
      note = input.note.replace(/\s+/g, ' ').trim() || null;
      if (note && note.length > MAX_CALL_NOTE) fields.note = 'too_long';
    }
  }

  let callbackAt: Date | null = null;
  if (outcome === 'callback') {
    const at = typeof input.callbackAt === 'string' ? new Date(input.callbackAt) : null;
    if (!at || Number.isNaN(at.getTime())) fields.callbackAt = 'required';
    else if (at.getTime() <= now.getTime()) fields.callbackAt = 'past';
    else if (at.getTime() > now.getTime() + MAX_CALLBACK_DAYS * 86_400_000) fields.callbackAt = 'too_far';
    else callbackAt = at;
  }

  if (Object.keys(fields).length || !outcome) return { ok: false, fields };
  return { ok: true, value: { outcome, note, callbackAt } };
}

/** What a call writes on the prospect beside its state. */
export function callCounters(current: { callCount: number; missedCalls: number }, call: CallInput, now: Date) {
  return {
    lastCallAt: now,
    lastCallOutcome: call.outcome,
    callCount: current.callCount + 1,
    missedCalls: MISSED_OUTCOMES.includes(call.outcome) ? current.missedCalls + 1 : 0,
    callbackAt: call.callbackAt,
    ...(call.outcome === 'wrong_number' ? { phoneWrong: true } : {}),
  };
}
