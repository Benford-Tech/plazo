/**
 * 16/10/2026 (« trouve un moyen d'analyser sans passer par Claude. faire du scrapping par type de mail par exemple »;
 * that morning the Anthropic account ran out of credit and every Allopark modification waited for Claude): what a
 * forwarded email is, told by fixed rules per comparator and mail type, before anything else is read. Pure side.
 *
 * Every known mail of the client's comparators is classified here, without Claude:
 * - Allopark (info@allopark.com): the booking notice to the parking and the traveller's copy (« Confirmation de votre
 *   réservation AL-… chez … »), the modification (« Modification de votre réservation AL-… chez … », its body word for
 *   word a confirmation's: only the subject or its heading tells them apart), the cancellation or refund (wording of
 *   importers/common.ts); the booking page is then the source of truth (domain/importers/allopark-page.ts).
 * - Onepark (« Une nouvelle réservation Onepark a été enregistrée… »), Parclick (« Voici votre réservation ! »),
 *   ParkMundo (« Merci pour votre réservation ! · PM… »): their importer's layout; their cancellations and changes by
 *   the same wording (never applied: no page to read them from).
 * - A reply (« Re: … ») about a comparator's booking: another mail, whatever it quotes.
 * Anything else (another comparator, the parking's own website form, a customer) is `unknown`: Claude reads it when Plazo
 * has its key, else it waits for the staff. A cancellation wins over a change, a change over a booking (the safer
 * reading: nothing is done of a cancellation).
 *
 * Only the comparator's own message decides: an email forwarded by hand is read from its forwarded header (« Objet : »,
 * « De : ») and the message under it; a reply only from what its author wrote above the quote. What the person who
 * forwarded it wrote above can only make the reading safer (« le client a annulé, voir ci-dessous »; a request, « je
 * souhaite annuler », makes it another mail for the staff: NOTE_CANCELLATION, NOTE_CHANGE).
 */
import { alloparkConfirmationPage, isAlloparkCancellation, isAlloparkChange } from './importers/allopark-page';
import { cancellationIn, changeIn, flatten, isChange, SUBJECT_CANCELLATION_STRICT, SUBJECT_CHANGE } from './importers/common';
import { EMAIL_IMPORTERS } from './importers';
import { isOneparkSummary } from './importers/onepark';
import type { ReadingMeta } from './email-reading';
import { FORWARD_MARKER, HEADER_FROM } from './inbound-email';

export type MailKind = 'booking' | 'change' | 'cancellation' | 'other' | 'unknown';
export type Comparator = 'Allopark' | 'Onepark' | 'Parclick' | 'ParkMundo';

export interface MailType {
  /** The comparator the email is about; null for an unknown sender. */
  provider: Comparator | null;
  kind: MailKind;
  /** The comparator's booking reference (« AL-… », « PM… », Onepark's number), upper case; null when none is read. */
  reference: string | null;
  /** The template or the wording that decided (« allopark.change », « parclick.booking », « allopark.reply »…), for the logs. */
  rule: string;
  /**
   * A catalogued template of the comparator matched (Allopark: its subject or heading and its body; the others: their
   * importer's layout), not only words of it: Plazo acts on it without anyone's confirmation. Otherwise Claude may
   * confirm the reading when it can (never waited for).
   */
  sure: boolean;
}

export interface MailToClassify {
  subject: string | null;
  text: string;
  /** The sender's name and address. */
  from: string | null;
  /** The email's allopark.com links (alloparkLinks): the « Consulter ma réservation » link names its booking. */
  links?: string[];
}

/** The comparator's own message within an email (comparatorMessageOf). */
export interface ComparatorMessage {
  /** The message's subject: its forwarded header's « Objet : », else the email's, without « TR: », « Fwd: », « Re: »… */
  subject: string;
  /** Its sender: its forwarded header's « De : », else the email's. */
  from: string;
  /** Its own text: neither the note of the person who forwarded it, nor a quoted older message below. */
  text: string;
  /** What the people who forwarded it wrote above it. */
  notes: string;
  /** The message answers another one (« Re: »): its text stops at the quote. */
  reply: boolean;
  /** It was forwarded by hand (a forwarded header was found). */
  forwarded: boolean;
}

/** « Re: », « RE : », « Réf : », « AW: », « SV: », « Antw: »: an answer. */
const REPLY_PREFIX = /^\s*(?:re|r[ée]f?|aw|sv|antw)\s*(?:\[\d+\])?\s*:\s*/i;
/** « TR: », « Fwd: », « Fw: », « WG: », « Enc: », « RV: »: a message forwarded by hand. */
const FORWARD_PREFIX = /^\s*(?:tr|fwd?|wg|enc|rv)\s*(?:\[\d+\])?\s*:\s*/i;
/** A line of a forwarded (or quoted) message's header: « De : », « Date : », « Envoyé : », « Objet : », « À : »… */
const HEADER_FIELD =
  /^(?:>\s*)*(de|from|exp[ée]diteur|date|envoy[ée]|sent|objet|subject|sujet|[àÀa]|to|pour|destinataires?|cci?|bcc|r[ée]pondre\s+[àa]|reply-to)\s*:\s*(.*)$/i;
const SUBJECT_FIELD = /^(?:objet|subject|sujet)$/i;
const FROM_FIELD = /^(?:de|from|exp[ée]diteur)$/i;
/** A header is read within this many lines of its « De : » line. */
const HEADER_MAX_LINES = 10;
/** « Le mer. 14 oct. 2026 à 09:12, ALLOPARK <info@allopark.com> a écrit : », « On … wrote: »: a quote below a reply. */
const QUOTE_END = /(?:a\s+[ée]crit|wrote|schrieb)\s*:\s*$/i;
const QUOTE_START = /^\s*(?:le|on|am)\s/i;
/** Forwards inside forwards: never deeper than this. */
const MAX_DEPTH = 5;

/** The subject without its « Re: » / « TR: » prefixes, and whether the first one says an answer or a forward. */
function withoutPrefixes(subject: string): { rest: string; first: 'reply' | 'forward' | null } {
  let rest = subject;
  let first: 'reply' | 'forward' | null = null;
  for (let i = 0; i < 5; i++) {
    const reply = REPLY_PREFIX.exec(rest);
    const forward = reply ? null : FORWARD_PREFIX.exec(rest);
    const found = reply ?? forward;
    if (!found) break;
    first ??= reply ? 'reply' : 'forward';
    rest = rest.slice(found[0].length);
  }
  return { rest: rest.trim(), first };
}

interface HeaderBlock {
  /** The block's first line (a « Message transféré » marker or its « De : » line). */
  at: number;
  /** The first line of the message it introduces. */
  bodyAt: number;
  subject: string | null;
  from: string | null;
}

/** The header block starting at line `i`, if any: a forward marker, or a « De : » line with an « Objet : » just below. */
function headerBlockAt(lines: string[], i: number): HeaderBlock | null {
  const line = lines[i].trim();
  const marker = FORWARD_MARKER.test(line) && !HEADER_FIELD.test(line);
  if (!marker && !HEADER_FROM.test(line)) return null;
  let subject: string | null = null;
  let from: string | null = null;
  let j = marker ? i + 1 : i;
  let fields = 0;
  for (; j < lines.length && j < i + 1 + HEADER_MAX_LINES; j++) {
    const current = lines[j].trim();
    if (!current || /^[-_=*\s]+$/.test(current)) {
      if (fields) {
        j += 1;
        break;
      }
      continue;
    }
    const field = HEADER_FIELD.exec(current);
    if (!field) break;
    fields += 1;
    if (SUBJECT_FIELD.test(field[1])) subject ??= field[2].trim();
    if (FROM_FIELD.test(field[1])) from ??= field[2].trim();
  }
  // A « De : » line that starts no header (« De : Paris », a label of a comparator's table) is no block.
  if (!marker && subject === null) return null;
  // Blank lines between the header and the message.
  while (j < lines.length && !lines[j].trim()) j += 1;
  return { at: i, bodyAt: j, subject, from };
}

function firstHeaderBlock(lines: string[], from: number): HeaderBlock | null {
  for (let i = from; i < lines.length; i++) {
    const block = headerBlockAt(lines, i);
    if (block) return block;
  }
  return null;
}

/**
 * The line where a quote of an older message starts (« Le … a écrit : », over one line or wrapped over two or three:
 * « …<info@allopark.com> a » then « écrit : »), or null.
 */
function quoteStart(lines: string[], from: number): number | null {
  for (let i = from; i < lines.length; i++) {
    const pair = i > from ? `${lines[i - 1]} ${lines[i]}` : lines[i];
    if (!QUOTE_END.test(lines[i]) && !QUOTE_END.test(pair)) continue;
    for (let back = 0; back <= 2 && i - back >= from; back++) if (QUOTE_START.test(lines[i - back])) return i - back;
    return i;
  }
  return null;
}

const joined = (lines: string[]) => lines.join('\n').trim();

/**
 * The comparator's own message within an email: as received (a mailbox rule keeps the comparator's subject, sender and
 * text), or under the forwarded headers of an email forwarded by hand (Gmail's « Message transféré », Outlook's « De :
 * … Objet : », Apple Mail's « Début du message réexpédié »), each forward's note set apart; a reply stops at its quote.
 */
export function comparatorMessageOf(mail: { subject: string | null; text: string; from: string | null }): ComparatorMessage {
  const lines = (mail.text ?? '').split(/\r?\n/);
  let subject = mail.subject ?? '';
  let from = mail.from ?? '';
  let start = 0;
  const notes: string[] = [];
  let forwarded = false;
  for (let depth = 0; ; depth++) {
    const { rest, first } = withoutPrefixes(subject);
    const block = depth < MAX_DEPTH ? firstHeaderBlock(lines, start) : null;
    const quote = quoteStart(lines, start);
    if (first === 'reply') {
      const end = Math.min(block?.at ?? lines.length, quote ?? lines.length);
      return { subject: rest, from, text: joined(lines.slice(start, end)), notes: notes.join('\n'), reply: true, forwarded };
    }
    if (block && (quote === null || block.at < quote)) {
      notes.push(joined(lines.slice(start, block.at)));
      // 16/10/2026 (relecture): the subject of a message that forwards another one is said above it too (« Annulation de
      // votre réservation AL-… » forwarding the booking's confirmation): with the notes, unless it is the same message's.
      if (block.subject !== null && withoutPrefixes(block.subject).rest !== rest) notes.push(rest);
      // A forward without its « Objet : » line keeps the email's subject (« TR: Confirmation… »).
      subject = block.subject ?? rest;
      from = block.from ?? from;
      start = block.bodyAt;
      forwarded = true;
      continue;
    }
    return { subject: rest, from, text: joined(lines.slice(start, quote ?? lines.length)), notes: notes.join('\n'), reply: false, forwarded };
  }
}

const BRANDS: { provider: Comparator; brand: RegExp }[] = [
  { provider: 'Allopark', brand: /allopark/i },
  { provider: 'Onepark', brand: /onepark/i },
  { provider: 'Parclick', brand: /parclick/i },
  { provider: 'ParkMundo', brand: /parkmundo/i },
];

/** The comparator a message names (subject, sender or text), or whose importer recognises its layout (ParkMundo's logo-only brand). */
function providerOf(subject: string, from: string, text: string): Comparator | null {
  const all = `${subject}\n${from}\n${text}`;
  const named = BRANDS.find(b => b.brand.test(all))?.provider;
  if (named) return named;
  // Onepark's daily summary never names Onepark (20/10/2026, sent from an address without the brand, or forwarded by
  // hand): its layout is its signature.
  if (isOneparkSummary(text)) return 'Onepark';
  return (EMAIL_IMPORTERS.find(i => i.detect(text))?.provider as Comparator | undefined) ?? null;
}

const ALLOPARK_REFERENCE = /\bAL-\d{6,}\b/i;

/**
 * 16/10/2026 (relecture): what a person who forwards a comparator's email by hand asks of its booking above it (« je
 * souhaite annuler », « merci de décaler le retour », « le client veut changer ses dates »): neither done (cancellationIn,
 * changeIn) nor the comparator's booking or change, the staff read it (kind `other`, rule `….note`); never in the
 * comparator's own text, whose « Annulation gratuite » or « Pour toute modification » are its conditions.
 */
const NOTE_CANCELLATION = /(?<![\p{L}\p{N}])(?:annul|rembours|cancel|refund)/iu;
const NOTE_CHANGE = /(?<![\p{L}\p{N}])(?:modif|chang|d[ée]cal|prolong|report(?:er|[ée]e?s?)?(?![\p{L}]))/iu;

/** The comparator's booking reference, subject first, upper case. */
function referenceOf(provider: Comparator, subject: string, text: string): string | null {
  const flat = flatten(text);
  const found = (() => {
    switch (provider) {
      case 'Allopark':
        return ALLOPARK_REFERENCE.exec(subject)?.[0] ?? ALLOPARK_REFERENCE.exec(text)?.[0];
      case 'ParkMundo':
        return /\bPM\d{6,}\b/i.exec(subject)?.[0] ?? /\bPM\d{6,}\b/i.exec(text)?.[0];
      case 'Onepark':
        return /Num[ée]ro de r[ée]servation\s*:?\s*([A-Z0-9-]{4,20})\b/i.exec(flat)?.[1];
      case 'Parclick':
        return /R[ée]f[ée]rence de la r[ée]servation\s*:?\s*([A-Z0-9-]{5,20})\b/i.exec(flat)?.[1];
    }
  })();
  return found ? found.toUpperCase() : null;
}

/** Allopark's subjects, repeated as the heading of the email's body: its booking, or its modification. */
const ALLOPARK_SUBJECTS = {
  booking: /^\s*confirmation de (?:votre|la) r[ée]servation\s+(AL-\d{6,})\b/i,
  change: /^\s*modification de (?:votre|la) r[ée]servation\s+(AL-\d{6,})\b/i,
};

/** Allopark's subject (or the heading that repeats it) of this kind, for this booking. */
function alloparkSubject(kind: keyof typeof ALLOPARK_SUBJECTS, subject: string, text: string, reference: string): boolean {
  const pattern = ALLOPARK_SUBJECTS[kind];
  if (pattern.exec(subject)?.[1]?.toUpperCase() === reference) return true;
  const heading = new RegExp(pattern.source, 'gim');
  return [...text.matchAll(heading)].some(match => match[1].toUpperCase() === reference);
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The body of Allopark's own emails for this booking (its confirmation's, which its modification repeats): the line
 * « AL-… | Parking », « Votre réservation de parking chez … est confirmée », the coupon, « Réservation N° AL-… », or the
 * « Consulter ma réservation » link to this booking's page.
 */
function alloparkBody(text: string, links: string[], reference: string): boolean {
  const ref = escaped(reference);
  return (
    new RegExp(`^\\s*${ref}\\s*\\|`, 'im').test(text) ||
    /votre r[ée]servation de parking chez [^\n]{1,80}? est confirm[ée]e/i.test(text) ||
    /coupon de r[ée]servation/i.test(text) ||
    new RegExp(`r[ée]servation\\s+n\\s*[°ºo]\\s*${ref}\\b`, 'i').test(text) ||
    alloparkConfirmationPage(links, reference) !== null ||
    new RegExp(`[?&]reference=${ref}(?![\\w-])`, 'i').test(text)
  );
}

const type = (provider: Comparator | null, kind: MailKind, reference: string | null, rule: string, sure: boolean): MailType => ({
  provider,
  kind,
  reference,
  rule,
  sure,
});

/** What an Allopark message is (see the module's comment). */
function alloparkType(message: ComparatorMessage, links: string[]): MailType {
  const { subject, text, notes } = message;
  const reference = referenceOf('Allopark', subject, text);
  if (!reference) return type('Allopark', 'unknown', null, 'allopark.no-reference', false);
  if (isAlloparkCancellation(subject, text) || cancellationIn(notes))
    return type('Allopark', 'cancellation', reference, 'allopark.cancellation', true);
  if (NOTE_CANCELLATION.test(notes)) return type('Allopark', 'other', reference, 'allopark.note', true);
  const body = alloparkBody(text, links, reference);
  if (isAlloparkChange(subject, text) || changeIn(notes)) {
    const sure = body && alloparkSubject('change', subject, text, reference);
    return type('Allopark', 'change', reference, sure ? 'allopark.change' : 'allopark.change-wording', sure);
  }
  if (NOTE_CHANGE.test(notes)) return type('Allopark', 'other', reference, 'allopark.note', true);
  const sure = body && alloparkSubject('booking', subject, text, reference);
  // Without its template (a reminder, a new layout…): its booking page is still read, Claude confirming it when it can.
  return type('Allopark', 'booking', reference, sure ? 'allopark.booking' : 'allopark.reference', sure);
}

/** What a message of Onepark, Parclick or ParkMundo is: their cancellations and changes by their wording, their bookings by their importer. */
function otherType(provider: Exclude<Comparator, 'Allopark'>, message: ComparatorMessage): MailType {
  const { subject, text, notes } = message;
  const reference = referenceOf(provider, subject, text);
  const name = provider.toLowerCase();
  const both = `${subject}\n${text}`;
  if (SUBJECT_CANCELLATION_STRICT.test(subject) || cancellationIn(both) || cancellationIn(notes)) {
    return type(provider, 'cancellation', reference, `${name}.cancellation`, true);
  }
  if (NOTE_CANCELLATION.test(notes)) return type(provider, 'other', reference, `${name}.note`, true);
  // isChange's words side by side as well: they always kept these emails from being imported (parseConfirmationEmail).
  if (SUBJECT_CHANGE.test(subject) || isChange(both) || changeIn(text) || changeIn(notes)) {
    return type(provider, 'change', reference, `${name}.change`, true);
  }
  if (NOTE_CHANGE.test(notes)) return type(provider, 'other', reference, `${name}.note`, true);
  // 20/10/2026: Onepark's daily summary of the stays in progress and to come: no booking of its own (no phone), it only
  // completes the bookings Plazo has (InboundEmailService.oneparkSummary).
  if (provider === 'Onepark' && isOneparkSummary(text)) return type(provider, 'other', null, 'onepark.summary', true);
  const importer = EMAIL_IMPORTERS.find(i => i.provider === provider);
  if (importer?.detect(text)) return type(provider, 'booking', reference, `${name}.booking`, true);
  return type(provider, 'unknown', reference, `${name}.unknown`, false);
}

/** What a forwarded email is, by the rules of its comparator and mail type (see the module's comment). */
export function classifyMail(mail: MailToClassify): MailType {
  const message = comparatorMessageOf(mail);
  const links = mail.links ?? [];
  if (message.reply) {
    // An answer (a customer's question, the parking's reply) is never a booking, whatever it quotes.
    const provider = providerOf(message.subject, message.from, message.text) ?? providerOf(mail.subject ?? '', mail.from ?? '', mail.text);
    if (!provider) return type(null, 'unknown', null, 'unknown', false);
    const reference = referenceOf(provider, message.subject, message.text) ?? referenceOf(provider, mail.subject ?? '', mail.text);
    return type(provider, 'other', reference, `${provider.toLowerCase()}.reply`, true);
  }
  const provider = providerOf(message.subject, message.from, message.text);
  if (!provider) return type(null, 'unknown', null, 'unknown', false);
  return provider === 'Allopark' ? alloparkType(message, links) : otherType(provider, message);
}

const KIND_OF: Record<Exclude<MailKind, 'unknown'>, ReadingMeta['kind']> = {
  booking: 'booking',
  change: 'modification',
  cancellation: 'cancellation',
  other: 'other',
};

/** The one-line summary of a rule's reading, in French, without personal data (« Modification Allopark de la réservation AL-… »). */
export function ruleSummary(mail: MailType): string {
  const p = mail.provider ?? '';
  const ref = mail.reference;
  switch (mail.kind) {
    case 'booking':
      return ref ? `Réservation ${p} ${ref}` : `Réservation ${p}`;
    case 'change':
      return ref ? `Modification ${p} de la réservation ${ref}` : `Modification d'une réservation ${p}`;
    case 'cancellation':
      return ref ? `Annulation ${p} de la réservation ${ref}` : `Annulation d'une réservation ${p}`;
    case 'other': {
      if (mail.rule === 'onepark.summary') return 'Récapitulatif Onepark des stationnements en cours et à venir';
      // 16/10/2026 (relecture): a request written above a comparator's email forwarded by hand (rule `….note`).
      const what = mail.rule.endsWith('.note') ? 'Message transféré' : 'Réponse';
      return ref ? `${what} à propos de la réservation ${p} ${ref}` : `${what} à propos d'une réservation ${p}`;
    }
    default:
      return '';
  }
}

/**
 * The reading the rules give, kept on the email as Claude's is (`InboundEmail.reading`, `source: 'rules'`): its kind for
 * the inbox's pill, « Reconnu par Plazo » rather than « Lu par Claude »; null for an unknown email.
 */
export function ruleReading(mail: MailType): ReadingMeta | null {
  if (mail.kind === 'unknown') return null;
  return {
    kind: KIND_OF[mail.kind],
    provider: mail.provider,
    confidence: mail.sure ? 1 : 0.5,
    summary: ruleSummary(mail),
    model: '',
    source: 'rules',
    rule: mail.rule,
  };
}
