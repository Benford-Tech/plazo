/**
 * « Messages au voyageur » of a booking (04/11/2026, « Ajoute la liste des messages sur la fiche réservation », the
 * « Fiche réservation : messages envoyés » screen of the WhatsApp mockups): the SMS and WhatsApp messages sent to the
 * traveller, newest first. A WhatsApp message that fell back to SMS is one line: the SMS, marked « WhatsApp non remis ».
 * Kept 30 days (the outbox and the WhatsApp rows are purged then); the text is never kept.
 */

export interface SmsLogRow {
  id: string;
  kind: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsappLogRow {
  id: string;
  kind: string;
  status: string;
  waMessageId: string | null;
  errorCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravellerMessage {
  id: string;
  kind: string;
  channel: 'whatsapp' | 'sms';
  /** WhatsApp: sent · delivered · read · failed. SMS: queued · sent · delivered · failed · abandoned. */
  status: string;
  at: string;
  /** When the status was reached (read, delivered), null while it is the sending itself. */
  statusAt: string | null;
  /** The SMS sent because WhatsApp did not deliver the message. */
  whatsappFallback: boolean;
  /** 11/11/2026: the SMS went because Meta never answered (WhatsApp may well have arrived), not because it refused. */
  whatsappSilent: boolean;
  errorCode: string | null;
}

/** A fallback SMS leaves at most this long after its WhatsApp message (text kept 2 h, plus the 15-minute pass). */
const FALLBACK_WINDOW_MS = 3 * 60 * 60 * 1000;

/** The WhatsApp messages that handed their text to an SMS: fell back, or refused by Meta at once. */
const handedToSms = (row: WhatsappLogRow) => row.status === 'fallback' || (row.status === 'failed' && !row.waMessageId);

export function travellerMessages(whatsapp: WhatsappLogRow[], sms: SmsLogRow[]): TravellerMessage[] {
  const smsSorted = [...sms].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const used = new Set<string>();
  const lines: TravellerMessage[] = [];
  for (const row of [...whatsapp].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (handedToSms(row)) {
      const fallback = smsSorted.find(
        s =>
          !used.has(s.id) &&
          s.kind === row.kind &&
          s.createdAt.getTime() >= row.createdAt.getTime() - 1000 &&
          s.createdAt.getTime() - row.createdAt.getTime() <= FALLBACK_WINDOW_MS,
      );
      if (fallback) {
        used.add(fallback.id);
        lines.push(smsLine(fallback, true, row.status === 'fallback' && !row.errorCode));
        continue;
      }
    }
    lines.push({
      id: row.id,
      kind: row.kind,
      channel: 'whatsapp',
      status: row.status === 'fallback' ? 'failed' : row.status,
      at: row.createdAt.toISOString(),
      statusAt: row.status === 'delivered' || row.status === 'read' ? row.updatedAt.toISOString() : null,
      whatsappFallback: false,
      whatsappSilent: false,
      errorCode: row.errorCode,
    });
  }
  for (const row of smsSorted) if (!used.has(row.id)) lines.push(smsLine(row, false, false));
  return lines.sort((a, b) => b.at.localeCompare(a.at));
}

function smsLine(row: SmsLogRow, whatsappFallback: boolean, whatsappSilent: boolean): TravellerMessage {
  return {
    id: row.id,
    kind: row.kind,
    channel: 'sms',
    status: row.status,
    at: row.createdAt.toISOString(),
    statusAt: row.status === 'sent' || row.status === 'delivered' ? row.updatedAt.toISOString() : null,
    whatsappFallback,
    whatsappSilent,
    errorCode: null,
  };
}
