/**
 * 11/11/2026 (« Je veux un status des envoi réaliste sur plazo », direction A): what is really known about a message sent
 * to a traveller. A message counts as delivered only once Meta (WhatsApp delivered or read) or the network (SMS delivered)
 * confirmed it; a WhatsApp accepted by Meta that never got an answer, and an SMS that left the phone without a delivery
 * report, are « sans confirmation », never « remis ».
 */

import type { SmsLogRow, WhatsappLogRow } from './traveller-message-log';

/** confirmed: someone confirmed the delivery · unconfirmed: it left, nobody confirmed · failed: every channel failed · pending: an SMS still waits. */
export type ProofLevel = 'confirmed' | 'unconfirmed' | 'failed' | 'pending';

export interface MessageProof {
  level: ProofLevel;
  /** accepted: Meta took it, no answer since · delivered / read: Meta confirmed · refused: Meta refused or reported a failure. */
  whatsapp: { state: 'accepted' | 'delivered' | 'read' | 'refused'; at: Date; statusAt: Date | null } | null;
  /** queued: waits at the phone · sent: left, no delivery report · delivered: the network confirmed · failed: abandoned or refused. */
  sms: { state: 'queued' | 'sent' | 'delivered' | 'failed'; at: Date; statusAt: Date | null } | null;
}

/** A fallback SMS leaves at most this long after its WhatsApp message (text kept 2 h, plus the 15-minute pass). */
const FALLBACK_WINDOW_MS = 3 * 60 * 60 * 1000;

function whatsappState(row: WhatsappLogRow): NonNullable<MessageProof['whatsapp']>['state'] {
  if (row.status === 'read') return 'read';
  if (row.status === 'delivered') return 'delivered';
  if (row.status === 'failed') return 'refused';
  // « fallback »: the SMS went in its place. With an error code Meta reported a failure; without one, Meta never answered.
  if (row.status === 'fallback') return row.errorCode ? 'refused' : 'accepted';
  return 'accepted';
}

function smsState(row: SmsLogRow, now: Date): NonNullable<MessageProof['sms']>['state'] {
  if (row.status === 'delivered') return 'delivered';
  if (row.status === 'sent') return 'sent';
  if (row.status === 'queued') return 'queued';
  // A gateway SMS in « failed » is retried for 2 h; it is still waiting until it is abandoned.
  if (row.status === 'failed' && now.getTime() - row.createdAt.getTime() < 2 * 60 * 60 * 1000) return 'queued';
  return 'failed';
}

/**
 * The proof of the last message of one kind to one booking: its last WhatsApp message and the SMS sent with or after it
 * (its fallback), or the last SMS alone. Null when nothing was sent.
 */
export function proofOf(whatsapp: WhatsappLogRow[], sms: SmsLogRow[], now: Date = new Date()): MessageProof | null {
  const lastWa = [...whatsapp].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  const smsSorted = [...sms].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const lastSms = lastWa
    ? (smsSorted.find(
        s => s.createdAt.getTime() >= lastWa.createdAt.getTime() - 1000 && s.createdAt.getTime() - lastWa.createdAt.getTime() <= FALLBACK_WINDOW_MS,
      ) ?? null)
    : (smsSorted[0] ?? null);
  // An SMS sent after a later WhatsApp (a manual resend by SMS alone) is the message: the WhatsApp is older.
  if (lastWa && smsSorted[0] && smsSorted[0].createdAt.getTime() - lastWa.createdAt.getTime() > FALLBACK_WINDOW_MS)
    return proofOf([], [smsSorted[0]], now);
  if (!lastWa && !lastSms) return null;

  const wa: MessageProof['whatsapp'] = lastWa
    ? {
        state: whatsappState(lastWa),
        at: lastWa.createdAt,
        statusAt: lastWa.status === 'delivered' || lastWa.status === 'read' ? lastWa.updatedAt : null,
      }
    : null;
  const text: MessageProof['sms'] = lastSms
    ? { state: smsState(lastSms, now), at: lastSms.createdAt, statusAt: lastSms.status === 'delivered' ? lastSms.updatedAt : null }
    : null;

  let level: ProofLevel;
  if (wa?.state === 'delivered' || wa?.state === 'read' || text?.state === 'delivered') level = 'confirmed';
  else if (text?.state === 'sent' || wa?.state === 'accepted') level = text?.state === 'queued' ? 'pending' : 'unconfirmed';
  else if (text?.state === 'queued') level = 'pending';
  else level = 'failed';
  return { level, whatsapp: wa, sms: text };
}

/**
 * Meta has gone quiet (« Meta ne confirme aucune livraison »): at least 3 WhatsApp messages accepted in the last 24 hours,
 * more than 10 minutes old, and not one of them delivered or read. The status webhook is then not reaching Plazo.
 */
export function metaSilent(rows: { status: string; waMessageId: string | null; errorCode: string | null; createdAt: Date }[], now: Date): boolean {
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const settled = now.getTime() - 10 * 60 * 1000;
  const accepted = rows.filter(r => r.waMessageId && r.createdAt.getTime() >= since && r.createdAt.getTime() <= settled);
  if (accepted.some(r => r.status === 'delivered' || r.status === 'read' || (r.status === 'failed' && r.errorCode))) return false;
  return accepted.length >= 3;
}
