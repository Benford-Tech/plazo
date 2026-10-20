import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { INBOUND_EMAIL_DOMAIN, inboundEmailAvailable } from '@/config';
import prisma, { InboundEmailStatus, Prisma } from '@/database';
import { MIN_CONFIDENCE, READING_OUTAGE_CAUSES, ReadingMeta, ReadingOutage, readingOutageOf, toParsedBooking } from '@/domain/email-reading';
import { EMAIL_IMPORTERS, IMPORT_SENDERS, isComparatorAddress, parseBookingEmail, ParsedBooking } from '@/domain/importers';
import { alloparkConfirmationPage, alloparkLinks, alloparkPageAddresses, alloparkPageUrls, isAlloparkUrl } from '@/domain/importers/allopark-page';
import { classifyMail, ruleReading } from '@/domain/inbound-kind';
import { parseOneparkSummary } from '@/domain/importers/onepark';
import { SUBJECT_CANCELLATION } from '@/domain/importers/common';
import { IMPORT_CHANGE_FIELDS, IMPORT_CHANGE_REASONS, ImportChange, ImportChangeField, ImportChangeReason } from '@/domain/import-change';
import { ComparatorState, comparatorStates, latestAutomatic } from '@/domain/inbound-comparators';
import { deliveryOf, looksLikeBooking } from '@/domain/inbound-delivery';
import {
  forwardingConfirmationOf,
  headerRecipientsOf,
  InboundItem,
  InboundPayload,
  inboundSlugOf,
  ownRecipientsOf,
  recipientsOf,
  REQUIRED_FOR_IMPORT,
  SOUGHT_FOR_IMPORT,
  textOf,
} from '@/domain/inbound-email';
import { fullName } from '@/domain/staff-name';
import { AUTO_RETRY_MAX, AUTO_RETRY_OUTCOMES, AUTO_RETRY_WINDOW_HOURS, nextAutoRetry } from '@/domain/inbound-retry';
import { can } from '@/domain/roles';
import { HttpException } from '@/utils/httpException';
import { allocateInboundSlug } from './inbound-slug';
import { AlloparkPageOutcome, AlloparkPageService } from './allopark-page.service';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { EmailReadingService, ReadingAttempt } from './email-reading.service';
import { MailProviderService } from './mail-provider.service';
import { MailProviderId } from '@/domain/mail-provider';
import { ImportChangeResult, ReservationService } from './reservation.service';

/** The email's text is kept this long for "À vérifier", then cleared; the row itself goes after 90 days. */
const TEXT_RETENTION_DAYS = 30;
const ROW_RETENTION_DAYS = 90;
/** What the settings block counts: the last 30 days. */
const COUNT_WINDOW_DAYS = 30;
const TEXT_MAX_CHARS = 20000;
/** Gmail's confirmation code is shown in the setup wizard this long. */
const FORWARDING_SHOWN_DAYS = 7;
/** "Ce que Plazo a reçu" in the wizard's last step. */
const RECENT_SHOWN = 5;
/** A (14/10/2026): the emails a too-wide rule sent on, counted for the wizard's alert, then deleted. */
const UNEXPECTED_DAYS = 7;
/** C (14/10/2026): the emails read for the comparators' table (newest first; enough for a busy parking's 90 days). */
const COMPARATOR_ROWS = 500;
/** Statuses of an email that came in (not Gmail's confirmation, not an email set aside). */
const RECEIVED: InboundEmailStatus[] = ['imported', 'duplicate', 'incomplete', 'unrecognised', 'dismissed', 'handled', 'archived'];

export interface InboundSettings {
  /** False when the platform has no inbound domain or secret: the block explains it. */
  available: boolean;
  /** "lys-demo-7f3a@plazo.fr": every operator has one from its creation (08/10/2026); null only when the platform has no domain. */
  address: string | null;
  lastReceivedAt: string | null;
  counts: Record<InboundEmailStatus, number>;
  /** Emails waiting for the staff (incomplete or unrecognised). */
  toCheck: number;
  /** G-B: the comparators' sender addresses, for the forwarding rule. */
  senders: { provider: string; address: string }[];
  /** G-B: Gmail's latest forwarding confirmation (7 days): its code typed back in Gmail, or its acceptance link. */
  forwarding: { provider: 'gmail'; code: string | null; link: string | null; requester: string | null; receivedAt: string } | null;
  /** G-B: the last emails received, newest first, for the wizard's check step. */
  recent: InboundRecent[];
  /** C (14/10/2026): one line per comparator: its last email and how its emails arrive (domain/inbound-comparators.ts). */
  comparators: ComparatorState[];
  /**
   * A (14/10/2026): what Plazo saw of the setup, latest first: Gmail's confirmation, an email of a comparator that came
   * by itself (never one forwarded by hand), a booking made from an email.
   */
  progress: { confirmationAt: string | null; comparatorMailAt: string | null; comparator: string | null; bookingAt: string | null };
  /** A: the emails a too-wide rule of the mailbox sent on these 7 days, set aside without sender, subject or text. */
  unexpected: { count: number; lastAt: string | null };
  /** A: the mail service the wizard opens on, and the address it was read from (null: the manager picks it). */
  mailProvider: { id: MailProviderId; business: boolean; email: string; source: 'forwarding' | 'account' } | null;
}

export interface InboundRecent {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  provider: string | null;
  reservationReference: string | null;
  receivedAt: string;
}

export interface InboundEmailView {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  textBody: string | null;
  provider: string | null;
  parsed: ParsedBooking | null;
  missing: string[];
  reservationId: string | null;
  reservationReference: string | null;
  /**
   * L-A (08/10/2026): what Claude made of the email; null when it was not read. 16/10/2026: or what Plazo's rules per
   * mail type made of it (`source: 'rules'`, domain/inbound-kind.ts).
   */
  reading: ReadingMeta | null;
  /**
   * 16/10/2026: Claude could not read the email (its cause: credit, key, load…), which waits for it: Plazo reads it again
   * once Claude answers (POST /public/inbound/retry); null otherwise (also once the email is handled or archived, or
   * older than the 7 days of that re-reading).
   */
  readingOutage: ReadingOutage | null;
  /** 10/10/2026: the last re-analysis asked by the staff; null when the email was only analysed at its reception. */
  analysedAt: string | null;
  /** 10/10/2026 (« Prévent captcha »): what became of the Allopark booking page at the last analysis; null when not tried. */
  pageLookup: PageLookupView | null;
  /** 10/10/2026 (« C'est une modification »): what Plazo did of an Allopark change of a booking; null for any other email. */
  change: InboundChangeView | null;
  /** 11/10/2026: the re-analyses Plazo made by itself, and when it makes the next one (null: none planned). */
  autoRetries: number;
  autoRetryAt: string | null;
  receivedAt: string;
}

/** 11/10/2026 (« Lance l'analyse automatiquement pour allopark »): what one automatic pass did, without personal data. */
export interface AutoRetryReport {
  /** Emails due for another try. */
  due: number;
  tried: number;
  outcomes: Partial<Record<ReanalysisOutcome, number>>;
  /**
   * The pass ended early: Allopark asked for an anti-robot check or refused Plazo (no other email opened it), or
   * (16/10/2026, `reading`) Claude still could not read.
   */
  stopped?: 'protected' | 'refused' | 'reading';
  /**
   * 15/10/2026 (relecture): emails left to the staff, not analysed again, because the staff made the traveller's booking
   * themselves while it waited (ReservationService.typedSince); given only when some were.
   */
  typedByHand?: number;
}

/**
 * 10/10/2026 (« C'est une modification »): an Allopark email announcing a change of a booking, read against the booking
 * page (its current state): applied to the booking (`applied`), nothing to change (no changes: the email is a
 * duplicate), or left to the staff with the `reason` and the changes to make by hand. `reservationId` and `reference`
 * name the booking concerned (the email itself is attached only when the change is applied or not needed).
 */
export interface InboundChangeView {
  applied: boolean;
  reason: ImportChangeReason | null;
  reservationId: string | null;
  /** The booking's Plazo reference (« Modification appliquée à la réservation R7KQ2M »). */
  reference: string | null;
  changes: ImportChange[];
  at: string;
}

/**
 * 10/10/2026 (« Prévent captcha »): the Allopark booking page of the email at its last analysis: read, protected by an
 * anti-robot check (captcha), unavailable or without this booking; `url` is the page the staff open by hand, given for
 * the three failures only (it carries the parking's address: cleared with the text, and once the email has its booking).
 */
export interface PageLookupView {
  outcome: AlloparkPageOutcome;
  url: string | null;
  at: string;
  /** 11/10/2026 (relecture): Allopark refused Plazo (429, Cloudflare block): shown as unavailable, never retried by Plazo. */
  refused?: boolean;
}

const PAGE_OUTCOMES: AlloparkPageOutcome[] = ['read', 'protected', 'unavailable', 'not_found'];

const TO_CHECK: InboundEmailStatus[] = ['incomplete', 'unrecognised'];

/**
 * M-A « Boîte de réception » (08/10/2026): the three tabs of the inbox. `todo` = waiting for the staff (every row);
 * `done` = imported, duplicate, handled (or the deprecated dismissed) of the last 30 days; `archived` = the last 90 days.
 * Gmail's forwarding confirmations are never listed.
 */
export type InboundView = 'todo' | 'done' | 'archived';
export const INBOUND_VIEWS: InboundView[] = ['todo', 'done', 'archived'];
const DONE_STATUSES: InboundEmailStatus[] = ['imported', 'duplicate', 'handled', 'dismissed'];
/** T-A: « Marquer comme traité » applies to these; `imported` stays imported, `archived` refuses, `forwarding` is unknown. */
const HANDLEABLE: InboundEmailStatus[] = ['incomplete', 'unrecognised', 'duplicate', 'dismissed'];
const DONE_WINDOW_DAYS = COUNT_WINDOW_DAYS;

/** The tab a status lives in (forwarding confirmations are in none: the caller gets an empty list). */
function viewOfStatus(status: InboundEmailStatus): InboundView {
  if (TO_CHECK.includes(status)) return 'todo';
  return status === 'archived' ? 'archived' : 'done';
}
const ARCHIVED_WINDOW_DAYS = ROW_RETENTION_DAYS;
const LIST_MAX = 100;

/**
 * 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): an email without booking can be analysed again, the same way
 * as at its reception; a second analysis of the same email within 30 s is refused (a double click never pays Claude
 * twice).
 */
const REANALYSIS_GAP_MS = 30_000;
/**
 * 11/10/2026: one automatic pass (every 10 minutes, called by the email relay) analyses three emails at most, and starts
 * another only within its first 10 s: each may open Allopark's page (8 s) and ask Claude (30 s), within Vercel's 60 s.
 */
const AUTO_RETRY_PER_RUN = 3;
const AUTO_RETRY_START_BUDGET_MS = 10_000;
/**
 * 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): the emails that waited only for their plate
 * before it stopped being required are imported by the relay's cron, those of the last 7 days.
 */
const PLATE_CATCH_UP_DAYS = 7;
/**
 * 16/10/2026: an email that waits for Claude (an outage) is read again once Claude answers, within 7 days of its reception
 * (a credit run out on a Friday evening and topped up on the Monday; an older one waits for the staff), at least 5 minutes
 * after its last try.
 */
const READING_RETRY_WINDOW_MS = 7 * 86_400_000;
const READING_RETRY_GAP_MS = 5 * 60_000;
/** 16/10/2026 (« analyser sans passer par Claude »): the emails stored before the rules per mail type, these 7 days. */
const RULES_CATCH_UP_DAYS = 7;
/**
 * 16/10/2026 (« relie les mail deja traité »): the audit action that marks an email rereadWithRules claimed (no staff
 * member, `auto: true`): an email that has it is never picked again, so each is read once. A mark rather than a date
 * (`analysedAt`): the former code ran until the deployment, and an email the staff relaunched with it while Claude had
 * no credit was read by no rule. An email whose reading is the rules' (`reading.source`: received or analysed again
 * since the deployment) is not picked either.
 */
const REREAD_MARK = 'inbound.reread';
/** 16/10/2026: the statuses of the emails re-read: « À traiter » and those marked as handled without their booking. */
const REREAD_STATUSES: InboundEmailStatus[] = ['incomplete', 'unrecognised', 'handled', 'dismissed'];
/**
 * 16/10/2026: what may name a comparator the rules know (classifyMail's providerOf: its name, or ParkMundo's « PM… »
 * reference), a necessary condition read in SQL, so that the other emails of the 30 days are never loaded; the rules
 * decide on what is loaded.
 */
const COMPARATOR_WORDS = 'allopark|onepark|parclick|parkmundo|pm[0-9]{6}';
/** Review (16/10/2026): the comparators' booking references an email names (Allopark « AL-… », ParkMundo « PM… »). */
const namedReferencesIn = (text: string): string[] => [...new Set([...text.matchAll(/\b(?:AL-\d{6,}|PM\d{6,})\b/gi)].map(m => m[0].toUpperCase()))];
/** 16/10/2026: the emails rereadWithRules loads per pass (newest first; the rules then keep the known ones). */
const REREAD_SCAN = 200;
/** 10/10/2026 (« C'est une modification »): `changed` = an Allopark change applied to its booking (the email then reads `imported`). */
/** `handled`: Onepark's daily summary completed what it could and left nothing to the team (20/10/2026). */
export type ReanalysisOutcome = 'imported' | 'changed' | 'duplicate' | 'incomplete' | 'unrecognised' | 'handled';
export interface Reanalysis {
  email: InboundEmailView;
  outcome: ReanalysisOutcome;
}

/** What the analysis reads: the stored email, or the one just received. */
interface AnalysisInput {
  operatorId: string;
  /** The email's row (made before it is written at its reception): the history of a change names it. */
  emailId: string;
  text: string;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  /** The email's allopark.com links (alloparkLinks) and own recipients (ownRecipientsOf). */
  links: string[];
  recipients: string[];
  /** A re-analysis: what the stored row says, so that the new analysis never knows less than the one before. */
  previous?: { parsed: ParsedBooking | null; missing: string[]; reading: ReadingMeta | null; change?: InboundChangeView | null };
  /**
   * 16/10/2026 (relecture): Plazo's own re-analysis (retryReading, the rules' catch-up…): when the email was received. A
   * booking the staff typed since then for the same traveller leaves the email to them (ReservationService.typedSince,
   * from what this analysis read: an email Claude could not read had nothing to check before, typedByHand).
   */
  typedSince?: Date;
  /**
   * 16/10/2026 (« relie les mail deja traité »): the re-reading of the emails already received (rereadWithRules): a booking
   * whose stay is over at this instant is only linked to the booking Plazo has of it (createFromImport's duplicate
   * rules), never created (missing `stay_over` otherwise).
   */
  linkOnlyIfOverAt?: Date;
}

interface Analysis {
  status: ReanalysisOutcome;
  provider: string | null;
  parsed: ParsedBooking | null;
  missing: string[];
  reading: ReadingMeta | null;
  reservationId: string | null;
  /** 10/10/2026: the Allopark booking page tried for this email; null when none was. */
  pageLookup: PageLookupView | null;
  /** 10/10/2026 (« C'est une modification »): what became of an Allopark change; null for any other email. */
  change: InboundChangeView | null;
  /** 16/10/2026: Claude could not read an email that waits for it (only for an email left « À traiter »). */
  outage?: ReadingOutage | null;
}

/** 16/10/2026: what the calls to Claude of one analysis came to (an outage while the email needed Claude). */
interface ClaudeCalls {
  outage: ReadingOutage | null;
}

/** What one more analysis of a stored email did: the analysis, the row as it was when written, and its new state (null: attached meanwhile). */
interface Rerun {
  analysis: Analysis;
  current: { status: InboundEmailStatus; reservationId: string | null } | null;
  status: InboundEmailStatus | null;
}

/** The Allopark booking page tried for an email: its booking as the page shows it, and what became of the page. */
interface PageResult {
  /** 10/10/2026 (relecture): the reference the page was opened for (upper case): a change applies the page to it only. */
  reference: string;
  parsed: ParsedBooking | null;
  /** The page's own booking (null when no page showed it). */
  page: ParsedBooking | null;
  lookup: PageLookupView | null;
}

/** The status an analysis leaves on the email: an applied change is an email whose booking is made. */
function storedStatus(outcome: ReanalysisOutcome): InboundEmailStatus {
  return outcome === 'changed' ? 'imported' : outcome;
}

export interface InboundEmailList {
  data: InboundEmailView[];
  counts: Record<InboundView, number>;
}

/**
 * M-A (06/10/2026): the operator's mailbox forwards the comparators' confirmations to
 * <slug>@<INBOUND_EMAIL_DOMAIN>; the Cloudflare relay (email-worker/) posts each email here; the importers read it and the booking is
 * created at once, or the email waits in "À vérifier" for the staff.
 */
@Service()
export class InboundEmailService {
  public reservations = Container.get(ReservationService);
  public audit = Container.get(AuditService);
  public reader = Container.get(EmailReadingService);
  public alloparkPage = Container.get(AlloparkPageService);
  public mailProviders = Container.get(MailProviderService);

  /** The relay's webhook: every item is handled on its own; the answer is always 200 so the relay does not resend it. */
  public async receive(payload: InboundPayload): Promise<{ received: number; imported: number; toCheck: number; ignored: number }> {
    const result = { received: 0, imported: 0, toCheck: 0, ignored: 0 };
    for (const item of payload.items ?? []) {
      result.received += 1;
      const outcome = await this.receiveItem(item);
      if (outcome === 'ignored') result.ignored += 1;
      else if (outcome === 'imported') result.imported += 1;
      else if (TO_CHECK.includes(outcome)) result.toCheck += 1;
    }
    return result;
  }

  /** One email of the relay's payload: stored with what became of it. */
  private async receiveItem(item: InboundItem): Promise<InboundEmailStatus | 'ignored'> {
    const slug = inboundSlugOf(recipientsOf(item), INBOUND_EMAIL_DOMAIN);
    if (!slug) return 'ignored';
    const operator = await prisma.operator.findUnique({ where: { inboundSlug: slug }, select: { id: true, status: true } });
    if (!operator || operator.status !== 'active') return 'ignored';
    const text = textOf(item).slice(0, TEXT_MAX_CHARS);
    const fromAddress = item.From?.Address?.trim().toLowerCase().slice(0, 200) || null;
    const fromIsComparator = !!fromAddress && isComparatorAddress(fromAddress);
    const delivery = deliveryOf({
      autoForwarded: item.AutoForwarded,
      headerRecipients: headerRecipientsOf(item),
      inboundDomain: INBOUND_EMAIL_DOMAIN,
      fromIsComparator,
    });
    // G-B: Gmail asks the Plazo address to confirm the forwarding; the code is shown in the setup wizard.
    const confirmation = forwardingConfirmationOf({ from: fromAddress, subject: item.Subject ?? null, text });
    if (confirmation) {
      await prisma.inboundEmail.create({
        data: {
          operatorId: operator.id,
          status: 'forwarding',
          fromAddress,
          fromName: item.From?.Name?.trim().slice(0, 120) || null,
          subject: item.Subject?.trim().slice(0, 200) || null,
          provider: confirmation.provider,
          parsed: { code: confirmation.code, link: confirmation.link, requester: confirmation.requester },
        },
      });
      return 'forwarding';
    }
    // A (14/10/2026): a rule that sends every email on (« transférer une copie de tous les e-mails ») brings the
    // parking's own emails: one that a rule forwarded, not from a comparator, without a booking word, is set aside
    // unread (no Claude) and kept without sender, subject or text, only to warn the manager in the setup wizard.
    if (item.AutoForwarded && !fromIsComparator && !looksLikeBooking(item.Subject ?? null, text)) {
      await prisma.inboundEmail.create({ data: { operatorId: operator.id, status: 'ignored', delivery } });
      return 'ignored';
    }
    const base = {
      operatorId: operator.id,
      fromAddress,
      fromName: item.From?.Name?.trim().slice(0, 120) || null,
      subject: item.Subject?.trim().slice(0, 200) || null,
      textBody: text || null,
    };
    // 10/10/2026: what a re-analysis needs that the text lost (the raw HTML is not stored); kept only while the email
    // waits for its booking.
    const forReanalysis = { recipients: ownRecipientsOf(item, INBOUND_EMAIL_DOMAIN), links: linksOf(item) };
    // 10/10/2026 (« C'est une modification »): the row's id is known before it is written, for the history of a change.
    const id = newRowId();
    const analysis = await this.analyse({ ...base, ...forReanalysis, text, emailId: id });
    const status = storedStatus(analysis.status);
    await prisma.inboundEmail.create({
      data: {
        id,
        ...base,
        ...(analysis.reservationId ? {} : forReanalysis),
        status,
        delivery,
        ...(analysis.reading || analysis.outage ? { reading: storedReading(analysis.reading, analysis.outage) } : {}),
        ...(analysis.provider ? { provider: analysis.provider } : {}),
        ...(analysis.parsed ? { parsed: analysis.parsed as unknown as Prisma.InputJsonValue } : {}),
        ...(analysis.missing.length ? { missing: analysis.missing } : {}),
        ...(analysis.reservationId ? { reservationId: analysis.reservationId } : {}),
        ...(analysis.pageLookup ? { pageLookup: storedPageLookup(analysis.pageLookup, !!analysis.reservationId) } : {}),
        ...(analysis.change ? { change: storedChange(analysis.change) } : {}),
      },
    });
    return status;
  }

  /**
   * What an email says, and the booking it makes when it is complete: the importers, Allopark's booking page, then
   * Claude for what is still missing, then createFromImport. Shared by the reception and the re-analysis
   * (10/10/2026, « pouvoir relancer l'analyse d'un mail »); nothing is stored here but the booking. 10/10/2026 (« C'est
   * une modification »): an Allopark change of a booking is applied to it from the booking page (alloparkChange).
   * 16/10/2026 (« trouve un moyen d'analyser sans passer par Claude »): the rules per comparator and mail type
   * (domain/inbound-kind.ts) say first what the email is; a known one is handled without Claude (its booking imported,
   * its change applied, a cancellation or another mail shown with its kind), and Claude only reads an email of an
   * unknown format, or completes a field the rules could not read; when Claude cannot answer (`outage`), the email waits
   * with the cause and is read again once Claude answers.
   */
  private async analyse(input: AnalysisInput): Promise<Analysis> {
    const claude: ClaudeCalls = { outage: null };
    const analysis = await this.analyseWith(input, claude);
    // Marked only when the email waits: one Claude did not read but that was handled anyway needs nothing more of it.
    const waits = TO_CHECK.includes(storedStatus(analysis.status));
    return { ...analysis, outage: waits ? claude.outage : null };
  }

  private async analyseWith(input: AnalysisInput, claude: ClaudeCalls): Promise<Analysis> {
    const { operatorId, text, fromAddress, fromName, subject } = input;
    const sender = [fromName, fromAddress].filter(Boolean).join(' ');
    const type = classifyMail({ subject, text, from: sender, links: input.links });
    const rules = ruleReading(type);
    // « [Allopark] AL-…: mail type allopark.change », « [Inbound] mail type unknown ».
    const label = type.provider ? `[${type.provider}]${type.reference ? ` ${type.reference}` : ''}:` : '[Inbound]';
    logger.info(`${label} mail type ${type.rule}`);
    // 20/10/2026: Onepark's daily summary completes the bookings it lists (number, plate), never creates one.
    if (type.rule === 'onepark.summary') return this.oneparkSummary(input, rules);
    // A cancellation, a reply or another mail of a comparator, a change of Onepark, Parclick or ParkMundo (no page to read
    // it from): shown with its kind, nothing done by itself (cancellations are never applied), no Claude.
    if (type.kind === 'cancellation' || type.kind === 'other' || (type.kind === 'change' && (type.provider !== 'Allopark' || !type.reference))) {
      return {
        status: 'unrecognised',
        provider: null,
        parsed: null,
        missing: [],
        reading: rules,
        reservationId: null,
        pageLookup: null,
        change: null,
      };
    }
    // 10/10/2026 (« C'est une modification »): an Allopark email that announces a change of a booking (« Modification
    // de votre réservation AL-… », « nouvelles dates ») is no new booking: Plazo reads the booking page again and updates
    // the booking. 16/10/2026: Allopark's own modification template is applied without Claude's confirmation.
    if (type.kind === 'change') return this.alloparkChange(input, type.reference!, null, rules, type.sure ? 'rules' : 'wording', claude);
    // 16/10/2026: a catalogued booking template (Allopark's confirmation, Onepark's notice, Parclick's or ParkMundo's
    // confirmation) is a booking: no one confirms it, Claude only fills what the importer and the page left blank.
    const known = type.kind === 'booking' && type.sure;
    // What the importers read of the email itself.
    const found = type.kind === 'booking' && type.provider && text ? parseBookingEmail(text, type.provider, known) : null;
    let parsed = found;
    // 10/10/2026: Allopark's emails leave « Vos informations » blank (plate, phone, name…); the booking page they link to
    // shows them, so it is opened before Claude is asked anything. Also for an Allopark email the importer did not
    // recognise (« Allopark » only in the sender, the reference only in the subject): the page then gives the booking.
    const allopark = type.provider === 'Allopark' && type.kind === 'booking' && (!found || found.provider === 'Allopark') ? type.reference : null;
    const reference = found?.externalReference ?? allopark;
    let fromPage = false;
    let pageLookup: PageLookupView | null = null;
    let tried: PageResult | null = null;
    // 15/10/2026: the page is opened for a missing plate too (soughtForImport), which no longer makes the email wait.
    if (allopark && reference && (!found || soughtForImport(found).length)) {
      tried = await this.withAlloparkPage(operatorId, found, reference, input);
      parsed = tried.parsed;
      pageLookup = tried.lookup;
      fromPage = parsed !== found;
    }
    // 16/10/2026: the template vouches for the page's booking: the page was opened for the very reference the template
    // names, and shows that booking's form (parseAlloparkPage refuses a page that does not name it); Claude's reading would
    // only add the email's kind, which the template already gives. An email that names two bookings is read as before.
    const decided = known && (!fromPage || tried?.reference === type.reference);
    // L-A (08/10/2026): what no rule knows, Claude reads; its answer is kept on the row for the inbox. Since 09/10/2026
    // Claude also completes a confirmation an importer recognised but could not read in full (a comparator that changed
    // its layout, a detail in a part of the email the importer does not look at): the importer's fields stay, Claude only
    // fills the gaps. 10/10/2026 (relecture): a booking completed by Allopark's page without a known template is read by
    // Claude too, gaps or not: the page still shows the booking a change or a cancellation is about. 16/10/2026: never for
    // a known Allopark email, whose booking page says all its email could.
    let reading: ReadingMeta | null = null;
    let unsure = false;
    const gaps = parsed ? soughtForImport(parsed) : [];
    const ask = decided ? gaps.length > 0 && type.provider !== 'Allopark' : !parsed || gaps.length > 0 || fromPage;
    if (ask && text && this.reader.available()) {
      const attempt = await this.readEmail(input, claude);
      if (attempt.outcome === 'answered') {
        const { kind, confidence } = attempt.reading;
        // A known booking stays one whatever Claude says of its kind: only its fields are taken.
        if (kind === 'booking' || !decided) reading = readingMetaOf(attempt);
        if (kind === 'booking') {
          const read = toParsedBooking(attempt.reading);
          const filled = parsed ? fillGaps(parsed, read) : read;
          // An unsure reading only matters for what it brought, or when nothing but Claude says it is a booking.
          const low = confidence < MIN_CONFIDENCE;
          const brought = gaps.filter(key => filled[key] !== undefined);
          unsure = low && (!found || brought.some(key => key !== 'plate'));
          // 15/10/2026: a plate Claude is unsure of never holds the booking back: left out, read on arrival (an email that
          // waits anyway keeps it, for « Compléter »).
          if (low && !unsure && brought.includes('plate')) delete filled.plate;
          parsed = filled;
        }
      }
    }
    // 10/10/2026 (relecture): the page's booking only when the email is one. Claude reads a change, a cancellation or
    // another mail (now, or at a former analysis when it does not answer this time): the page's fields go, the email
    // waits as it would have without the page (the importer's reading in « À traiter », or unrecognised). No importer:
    // only Claude, sure of itself, makes the page's booking a booking; else it waits for a human eye. 16/10/2026: not for
    // a known template, which says itself what the email is.
    const said = reading ?? claudeReading(input.previous?.reading ?? null);
    // 10/10/2026 (« C'est une modification »): Claude reads a change of the Allopark booking the email names, which its
    // text did not announce: applied from the booking page as well (the page just read, else opened now).
    if (!decided && allopark && said?.kind === 'modification') return this.alloparkChange(input, allopark, tried, reading, 'claude', claude);
    const notBooking = !decided && fromPage && !!said && said.kind !== 'booking';
    const unconfirmed = !decided && fromPage && !found && !notBooking && (!said || said.confidence < MIN_CONFIDENCE);
    if (fromPage && reference) {
      const pageLabel = `[Allopark] ${reference.trim().toUpperCase()}`;
      if (notBooking) logger.info(`${pageLabel}: read as ${said?.kind} by Claude, nothing taken from the booking page`);
      else if (unconfirmed) logger.info(`${pageLabel}: no importer and no sure reading by Claude, the booking waits for the staff`);
    }
    if (notBooking) parsed = found;
    // Nothing of the page is used: the inbox does not speak of it.
    if (notBooking) pageLookup = null;
    if (unconfirmed) unsure = true;
    // A re-analysis never knows less than the analysis before it: when Claude does not answer this time (no key, a
    // timeout, a refusal) or Allopark's page no longer does, the fields read then fill what is still blank; nothing of
    // it stays once Claude reads the email as something else than a booking.
    const before = input.previous?.parsed;
    if (before && !notBooking && (!reading || reading.kind === 'booking')) {
      const own = parsed;
      const merged = own ? fillGaps(own, before) : { ...before };
      const kept = !own || (Object.keys(merged) as (keyof ParsedBooking)[]).some(key => key !== 'provider' && !isSet(own[key]) && isSet(merged[key]));
      // The fields of an unsure reading stay unsure.
      if (input.previous!.missing.includes('confidence') && (!own || missingForImport(own).some(key => isSet(merged[key])))) unsure = true;
      // 15/10/2026: a plate only a former unsure reading gave is not imported.
      if (!unsure && input.previous!.missing.includes('confidence') && !isSet(own?.plate)) delete merged.plate;
      // Claude's former reading stays with the fields it gave.
      if (kept && !reading) reading = claudeReading(input.previous!.reading);
      parsed = merged;
    }
    // Claude's former reading when it decided (another mail, not read this time), else what the rules tell when Claude did
    // not read the email (or read it as something else than a known template is).
    reading ??= (decided ? null : said) ?? rules;
    // A mail no rule knows that Claude did not read as a booking: shown with Claude's summary, nothing done by itself.
    if (!parsed) return { status: 'unrecognised', provider: null, parsed: null, missing: [], reading, reservationId: null, pageLookup, change: null };
    const booking = parsed;
    const missing: string[] = missingForImport(booking);
    // An unsure reading waits for a human eye even when every field is there.
    if (unsure) missing.push('confidence');
    const result = { provider: booking.provider, parsed: booking, reading, pageLookup, change: null };
    if (missing.length) return { ...result, status: 'incomplete', missing, reservationId: null };
    // 16/10/2026 (relecture): never a second booking of the same car when the staff typed it while the email waited.
    if (input.typedSince && (await this.reservations.typedSince(operatorId, booking, input.typedSince))) {
      logger.info(`${label} the staff typed this booking by hand: left to the staff`);
      return { ...result, status: 'incomplete', missing: ['confidence'], reservationId: null };
    }
    try {
      // 16/10/2026 (« relie les mail deja traité »): a stay that is over is only linked, never created, by the re-reading.
      const over = await this.overStay(input, booking, label);
      if (over) return { ...result, ...over };
      const created = await this.reservations.createFromImport(operatorId, booking);
      return { ...result, status: created.duplicate ? 'duplicate' : 'imported', missing: [], reservationId: created.reservation.id };
    } catch (error) {
      // Dates the importer misread, a stay too long…: the staff read the email themselves.
      logger.warn(`[Inbound] Email for ${operatorId} not imported: ${error instanceof Error ? error.message : String(error)}`);
      return { ...result, status: 'incomplete', missing: [error instanceof HttpException ? error.code || 'error' : 'error'], reservationId: null };
    }
  }

  /**
   * 20/10/2026: Onepark's daily summary (« Voici le résumé des réservations en cours et à venir »): each stay completes
   * the Onepark booking Plazo has of it (ReservationService.completeFromSummary). Done when nothing is left to the team;
   * a stay Plazo does not have, or a booking it cannot tell apart, or another plate, keeps the email « À traiter », its
   * summary saying which booking numbers (no personal data).
   */
  private async oneparkSummary(input: AnalysisInput, rules: ReadingMeta | null): Promise<Analysis> {
    const stays = parseOneparkSummary(input.text);
    const report = await this.reservations.completeFromSummary(input.operatorId, stays, { inboundEmailId: input.emailId ?? null });
    const left = report.missing.length + report.ambiguous.length + report.plateDiffers.length;
    logger.info(
      `[Onepark] summary: ${stays.length} stays, ${report.completed.length} completed, ${report.upToDate.length} up to date, ` +
        `${report.missing.length} missing, ${report.ambiguous.length} ambiguous, ${report.plateDiffers.length} with another plate`,
    );
    const list = (refs: string[]) => refs.join(', ');
    const summary = [
      `Récapitulatif Onepark : ${stays.length} ${stays.length > 1 ? 'stationnements' : 'stationnement'}`,
      report.completed.length ? `${report.completed.length} complété(s) (numéro ou plaque)` : null,
      report.upToDate.length ? `${report.upToDate.length} déjà à jour` : null,
      report.missing.length ? `absent(s) de Plazo : ${list(report.missing)}` : null,
      report.ambiguous.length ? `plusieurs réservations possibles : ${list(report.ambiguous)}` : null,
      report.plateDiffers.length ? `autre plaque dans Plazo : ${list(report.plateDiffers)}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      status: left ? 'unrecognised' : 'handled',
      provider: null,
      parsed: null,
      missing: [],
      reading: rules ? { ...rules, summary } : null,
      reservationId: null,
      pageLookup: null,
      change: null,
    };
  }

  /**
   * An Allopark email completed by its booking page: the email's link, else the page of each candidate address (its
   * own recipients, the forwarded message's header, its sender, the Gmail boxes that forward to Plazo, the managers:
   * alloparkPageAddresses), read for the fields the email left blank; the page's form names the customer, where the
   * email only greets them (« Bonjour Jean Dupont, »). An email no importer recognised (`found` null) takes the page's
   * booking as it is (Claude then says whether the email is a booking at all: analyse). Unchanged when no page answers
   * for this booking. Logged without any address, link or name (10/10/2026): the reference, the link found or not, the
   * pages tried, the fields filled. 10/10/2026 (« Prévent captcha »): with what became of the page (`lookup`, null when
   * there was no page to open), kept on the email for the inbox.
   */
  private async withAlloparkPage(operatorId: string, found: ParsedBooking | null, reference: string, email: AnalysisInput): Promise<PageResult> {
    const [requesters, managers] = await Promise.all([this.forwardingRequesters(operatorId), this.managerAddresses(operatorId)]);
    const addresses = alloparkPageAddresses(
      { recipients: email.recipients, text: email.text, from: email.fromAddress, requesters, managers },
      INBOUND_EMAIL_DOMAIN,
    );
    const urls = alloparkPageUrls({ links: email.links, reference, addresses, excludeDomain: INBOUND_EMAIL_DOMAIN });
    const ref = reference.trim().toUpperCase();
    const label = `[Allopark] ${ref}`;
    const linked = !!alloparkConfirmationPage(email.links, reference);
    logger.info(
      `${label}: ${found ? 'importer' : 'no importer'}, ${email.links.length} allopark.com link(s), confirmation link ${linked ? 'yes' : 'no'}, ${urls.length} page(s) to try`,
    );
    if (!urls.length) {
      logger.warn(`${label}: no booking page to open (no confirmation link, no candidate address)`);
      return { reference: ref, parsed: found, page: null, lookup: null };
    }
    const result = await this.alloparkPage.booking(urls, reference);
    const lookup: PageLookupView = {
      outcome: result.outcome,
      url: result.outcome === 'read' ? null : result.url || null,
      at: new Date().toISOString(),
      ...(result.refused ? { refused: true } : {}),
    };
    const page = result.booking;
    if (!page) {
      if (result.outcome !== 'protected') logger.warn(`${label}: no booking found on ${urls.length} page(s)`);
      return { reference: ref, parsed: found, page: null, lookup };
    }
    const completed = found ? fillGaps(found, page) : { ...page };
    if (found && (page.customerFirstName || page.customerLastName)) {
      for (const key of NAME_KEYS) {
        if (page[key]) completed[key] = page[key];
        else delete completed[key];
      }
    }
    const filled = (Object.keys(completed) as (keyof ParsedBooking)[]).filter(key => key !== 'provider' && completed[key] !== found?.[key]);
    const still = soughtForImport(completed);
    logger.info(`${label}: ${filled.length} field(s) filled from the booking page${still.length ? `, still missing: ${still.join(', ')}` : ''}`);
    return { reference: ref, parsed: completed, page, lookup };
  }

  /**
   * 10/10/2026 (« C'est une modification »: « Plazo relit la page Allopark (l'état actuel de la réservation), met à jour
   * la réservation existante […]. Si la réservation n'existe pas encore, il la crée. Si c'est risqué […], le mail reste
   * « À traiter » avec les changements affichés »): an Allopark change of a booking. The booking page is opened as for
   * a confirmation (same addresses, budget and anti-robot rules), or the one `prior` already read for this reference is
   * used; it shows the booking as it is now. Not read: nothing changes, the email waits (unrecognised) with the page to
   * open by hand. Read: the operator's booking with this reference is updated (ReservationService.applyImportChange:
   * `changed`), already up to date (`duplicate`), or left to the staff with the reason (unrecognised, with the changes);
   * none: the page's booking is created (`imported`), or waits when the page lacks a required field. Logged without
   * personal data. 10/10/2026 (relecture): a change only the wording announced (`confirmedBy` « wording ») is first read
   * by Claude when Plazo has its key: nothing is opened, changed, created or attached when Claude reads a cancellation or
   * another mail (it waits for the staff). 16/10/2026 (« analyser sans passer par Claude »): Allopark's own modification
   * template (`confirmedBy` « rules ») needs no one's confirmation; a change only its wording announces that Claude does
   * not confirm (no key, an outage, no reading) is decided by the rules with two safeguards: no booking is created for a
   * reference Plazo does not have (it waits, prefilled from the page), and a page that changes nothing leaves the email
   * « À traiter » rather than a silent duplicate (a cancellation worded in a way the rules do not know). 10/10/2026 (« Tu n'as pas
   * récupéré le prix pour la modif »): no booking with the reference, a booking typed without it for the same car and
   * stay takes the reference and the change (ReservationService.unreferencedMatches); several: left to the staff
   * (`ambiguous`). A flight of the page that is no flight number no longer stops the booking (created without it, the
   * text in its notes).
   */
  private async alloparkChange(
    input: AnalysisInput,
    reference: string,
    prior: PageResult | null,
    reading: ReadingMeta | null,
    confirmedBy: 'rules' | 'claude' | 'wording',
    claude: ClaudeCalls,
  ): Promise<Analysis> {
    const { operatorId } = input;
    const ref = reference.trim().toUpperCase();
    const label = `[Allopark] ${ref}`;
    const base = { provider: 'Allopark', pageLookup: null, change: null };
    // What the email had before, kept while nothing new is known (a re-analysis never knows less than the one before).
    const waits = (said: ReadingMeta | null, lookup: PageLookupView | null): Analysis => {
      const previous = input.previous;
      const kept = previous?.parsed || previous?.change;
      // 15/10/2026: the plate no longer makes an email wait (a row written before still lists it).
      const missing = (previous?.missing ?? []).filter(key => key !== 'plate');
      return {
        ...base,
        status: kept && missing.length ? 'incomplete' : 'unrecognised',
        parsed: kept ? previous!.parsed : null,
        missing: kept ? missing : [],
        change: kept ? (previous!.change ?? null) : null,
        reading: said,
        reservationId: null,
        pageLookup: lookup,
      };
    };
    // Only the wording said it: Claude confirms it when it can, never waited for.
    let guarded = false;
    if (confirmedBy === 'wording') {
      const attempt: ReadingAttempt = input.text && this.reader.available() ? await this.readEmail(input, claude) : { outcome: 'unavailable' };
      const answered = attempt.outcome === 'answered' ? readingMetaOf(attempt) : null;
      const said = answered ?? claudeReading(input.previous?.reading ?? null);
      if (said && (said.kind === 'cancellation' || said.kind === 'other')) {
        logger.info(`${label}: change announced, read as ${said.kind} by Claude: nothing changed`);
        // Decided by a former reading: the email no longer waits for Claude.
        claude.outage = null;
        return { ...base, provider: null, status: 'unrecognised', parsed: null, missing: [], reading: said, reservationId: null };
      }
      if (answered) reading = answered;
      if (!said) {
        guarded = true;
        const why =
          attempt.outcome === 'outage'
            ? `Claude unavailable (${attempt.cause})`
            : attempt.outcome === 'declined'
              ? 'no reading by Claude'
              : 'no Claude';
        logger.info(`${label}: change announced by its wording only, ${why}: the rules decide (no booking created, no silent duplicate)`);
      }
    }
    // 10/10/2026 (relecture): only a page opened for this very reference is applied to its booking (an email that names
    // two bookings, its subject one and its text another, never mixes them).
    const tried = prior && prior.reference === ref ? prior : await this.withAlloparkPage(operatorId, null, ref, input);
    if (!tried.page) {
      logger.info(`${label}: change announced, booking page not read (${tried.lookup?.outcome ?? 'no page to open'}): nothing changed`);
      // The staff read the email (with Claude's summary when Claude was asked); the fields and the changes found before
      // stay shown.
      return waits(reading, tried.lookup);
    }
    const withLookup = { ...base, pageLookup: tried.lookup };
    const booking: ParsedBooking = { ...tried.page, provider: 'Allopark', externalReference: ref };
    const withPage = { ...withLookup, parsed: booking, reading };
    const byReference = () =>
      prisma.reservation.findUnique({ where: { operatorId_externalReference: { operatorId, externalReference: ref } }, select: { id: true } });
    let reservationId = (await byReference())?.id ?? null;
    // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): the booking may have been typed by hand without its
    // reference (« Compléter », before the page was read): the same car for the same stay is that booking, which takes
    // the reference and the change; several such bookings are left to the staff, none is guessed.
    if (!reservationId) {
      const typed = await this.reservations.unreferencedMatches(operatorId, booking, ref);
      if (typed.length > 1) {
        logger.info(`${label}: change of a booking typed without its reference, ${typed.length} bookings match: left to the staff`);
        const change: InboundChangeView = {
          applied: false,
          reason: 'ambiguous',
          reservationId: null,
          reference: null,
          changes: [],
          at: new Date().toISOString(),
        };
        return { ...withPage, change, status: 'unrecognised', missing: [], reservationId: null };
      }
      if (typed.length === 1) {
        const origin = { source: 'allopark_change', provider: 'Allopark', inboundEmailId: input.emailId };
        if (await this.reservations.linkExternalReference(operatorId, typed[0], ref, origin)) {
          logger.info(`${label}: change of a booking typed without its reference: the reference is set on it`);
          reservationId = typed[0];
        } else {
          // Another booking took the reference meanwhile (its confirmation received at the same moment).
          reservationId = (await byReference())?.id ?? null;
        }
      }
    }
    if (!reservationId) {
      const missing = missingForImport(booking);
      if (missing.length) {
        logger.info(`${label}: change of a booking Plazo does not have, the page lacks ${missing.join(', ')}: waits for the staff`);
        return { ...withPage, status: 'incomplete', missing: guarded ? [...missing, 'confidence'] : missing, reservationId: null };
      }
      // 16/10/2026: a change only the wording announced never creates a booking by itself (a cancellation the rules do not
      // know would make one): it waits, prefilled from the page, for « Compléter ».
      if (guarded) {
        logger.info(`${label}: change of a booking Plazo does not have, announced by its wording only: waits for the staff`);
        return { ...withPage, status: 'incomplete', missing: ['confidence'], reservationId: null };
      }
      try {
        // 16/10/2026 (« relie les mail deja traité »): a stay that is over is never created by the re-reading.
        const over = await this.overStay(input, booking, `${label}:`);
        if (over) return { ...withPage, ...over };
        const created = await this.reservations.createFromImport(operatorId, booking);
        if (!created.duplicate) {
          logger.info(`${label}: change of a booking Plazo did not have: created from the booking page`);
          return { ...withPage, status: 'imported', missing: [], reservationId: created.reservation.id };
        }
        // Made meanwhile (its confirmation received at the same moment): the change applies to it.
        reservationId = created.reservation.id;
      } catch (error) {
        logger.warn(`${label}: change of a booking Plazo does not have, not created: ${error instanceof Error ? error.message : String(error)}`);
        return {
          ...withPage,
          status: 'incomplete',
          missing: [error instanceof HttpException ? error.code || 'error' : 'error'],
          reservationId: null,
        };
      }
    }
    let result: ImportChangeResult;
    try {
      result = await this.reservations.applyImportChange(operatorId, reservationId, booking, {
        source: 'allopark_change',
        inboundEmailId: input.emailId,
      });
    } catch (error) {
      logger.warn(`${label}: change not applied: ${error instanceof Error ? error.message : String(error)}`);
      return { ...withPage, status: 'unrecognised', missing: [], reservationId: null };
    }
    const change: InboundChangeView = {
      applied: result.applied,
      reason: result.reason ?? null,
      reservationId,
      reference: result.reservation.reference,
      changes: result.changes,
      at: new Date().toISOString(),
    };
    const fields = result.changes.map(c => c.field).join(', ');
    if (!result.changes.length) {
      // 16/10/2026: announced by its wording only, nothing to change: the staff read it (never a silent duplicate).
      if (guarded) {
        logger.info(`${label}: change announced by its wording only, the booking is already up to date: left to the staff`);
        return { ...withPage, change, status: 'unrecognised', missing: [], reservationId: null };
      }
      logger.info(`${label}: change announced, the booking is already up to date`);
      return { ...withPage, change, status: 'duplicate', missing: [], reservationId };
    }
    if (result.applied) {
      logger.info(`${label}: change applied to the booking (${fields})`);
      return { ...withPage, change, status: 'changed', missing: [], reservationId };
    }
    logger.info(`${label}: change left to the staff (${result.reason}: ${fields})`);
    return { ...withPage, change, status: 'unrecognised', missing: [], reservationId: null };
  }

  /**
   * 16/10/2026 (« relie les mail deja traité »): for the re-reading of the emails already received (`linkOnlyIfOverAt`),
   * a booking whose stay is over: linked to the booking Plazo has of it (`duplicate`), else left without a booking
   * (missing `stay_over`: the staff type it if they want it); null when the stay is not over (the analysis goes on).
   * `label` starts the log line (« [Allopark] AL-…: »).
   */
  private async overStay(
    input: AnalysisInput,
    booking: ParsedBooking,
    label: string,
  ): Promise<{ status: 'duplicate' | 'incomplete'; missing: string[]; reservationId: string | null } | null> {
    if (!input.linkOnlyIfOverAt) return null;
    const over = await this.reservations.overStay(input.operatorId, booking, input.linkOnlyIfOverAt);
    if (!over) return null;
    if (over.existing) {
      logger.info(`${label} stay already over: linked to the booking Plazo has`);
      return { status: 'duplicate', missing: [], reservationId: over.existing.id };
    }
    logger.info(`${label} stay already over and no booking of it: nothing created`);
    return { status: 'incomplete', missing: ['stay_over'], reservationId: null };
  }

  /** One reading of the email by Claude; an outage is noted for the analysis (the email then waits for Claude). */
  private async readEmail(input: AnalysisInput, claude: ClaudeCalls): Promise<ReadingAttempt> {
    const timezone = await this.timezoneOf(input.operatorId);
    const attempt = await this.reader.read({ from: input.fromAddress, fromName: input.fromName, subject: input.subject, text: input.text, timezone });
    claude.outage = attempt.outcome === 'outage' ? { cause: attempt.cause, at: new Date().toISOString() } : null;
    return attempt;
  }

  /** 10/10/2026: the addresses of the operator's active managers (the parking's mailbox is often theirs), oldest first. */
  private async managerAddresses(operatorId: string): Promise<string[]> {
    const managers = await prisma.staff.findMany({
      where: { operatorId, role: 'manager', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { email: true },
      take: 5,
    });
    return managers.map(m => m.email);
  }

  /** The Gmail addresses that asked to forward to the operator's Plazo address, newest first. */
  private async forwardingRequesters(operatorId: string): Promise<string[]> {
    const rows = await prisma.inboundEmail.findMany({
      where: { operatorId, status: 'forwarding' },
      orderBy: { receivedAt: 'desc' },
      select: { parsed: true },
      take: 20,
    });
    const requesters = rows.map(r => (r.parsed as { requester?: unknown } | null)?.requester);
    return [...new Set(requesters.filter((r): r is string => typeof r === 'string' && !!r.trim()).map(r => r.trim().toLowerCase()))];
  }

  /** The timezone Claude expresses the local times in: the operator's first parking's. */
  private async timezoneOf(operatorId: string): Promise<string> {
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' }, select: { timezone: true } });
    return parking?.timezone ?? 'Europe/Paris';
  }

  public async settings(actor: AuthenticatedStaff): Promise<InboundSettings> {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { inboundSlug: true } });
    const now = new Date();
    const since = new Date(now.getTime() - COUNT_WINDOW_DAYS * 86400000);
    const [grouped, last, toCheck, forwarding, recent, received, unexpected, booked, confirmation] = await Promise.all([
      prisma.inboundEmail.groupBy({ by: ['status'], where: { operatorId: actor.operatorId, receivedAt: { gte: since } }, _count: { _all: true } }),
      prisma.inboundEmail.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { receivedAt: 'desc' }, select: { receivedAt: true } }),
      prisma.inboundEmail.count({ where: { operatorId: actor.operatorId, status: { in: TO_CHECK } } }),
      prisma.inboundEmail.findFirst({
        where: { operatorId: actor.operatorId, status: 'forwarding', receivedAt: { gte: new Date(Date.now() - FORWARDING_SHOWN_DAYS * 86400000) } },
        orderBy: { receivedAt: 'desc' },
        select: { parsed: true, receivedAt: true },
      }),
      prisma.inboundEmail.findMany({
        where: { operatorId: actor.operatorId, status: { not: 'ignored' } },
        include: { reservation: { select: { reference: true } } },
        orderBy: { receivedAt: 'desc' },
        take: RECENT_SHOWN,
      }),
      prisma.inboundEmail.findMany({
        where: { operatorId: actor.operatorId, status: { in: RECEIVED } },
        select: { provider: true, fromAddress: true, status: true, delivery: true, receivedAt: true },
        orderBy: { receivedAt: 'desc' },
        take: COMPARATOR_ROWS,
      }),
      prisma.inboundEmail.aggregate({
        where: { operatorId: actor.operatorId, status: 'ignored', receivedAt: { gte: new Date(now.getTime() - UNEXPECTED_DAYS * 86400000) } },
        _count: { _all: true },
        _max: { receivedAt: true },
      }),
      prisma.inboundEmail.findFirst({
        where: { operatorId: actor.operatorId, status: { in: ['imported', 'duplicate'] }, reservationId: { not: null } },
        orderBy: { receivedAt: 'desc' },
        select: { receivedAt: true },
      }),
      prisma.inboundEmail.findFirst({
        where: { operatorId: actor.operatorId, status: 'forwarding' },
        orderBy: { receivedAt: 'desc' },
        select: { parsed: true, receivedAt: true },
      }),
    ]);
    const providers = EMAIL_IMPORTERS.map(i => i.provider);
    const automatic = latestAutomatic(received, providers);
    const counts = Object.fromEntries(Object.values(InboundEmailStatus).map(status => [status, 0])) as Record<InboundEmailStatus, number>;
    for (const g of grouped) counts[g.status] = g._count._all;
    const available = inboundEmailAvailable();
    return {
      available,
      address: available && operator.inboundSlug ? `${operator.inboundSlug}@${INBOUND_EMAIL_DOMAIN}` : null,
      lastReceivedAt: last?.receivedAt.toISOString() ?? null,
      counts,
      toCheck,
      senders: IMPORT_SENDERS,
      forwarding: forwardingView(forwarding),
      recent: recent.map(r => ({
        id: r.id,
        status: r.status,
        fromAddress: r.fromAddress,
        fromName: r.fromName,
        subject: r.subject,
        provider: r.provider,
        reservationReference: r.reservation?.reference ?? null,
        receivedAt: r.receivedAt.toISOString(),
      })),
      comparators: comparatorStates(received, providers, now),
      progress: {
        confirmationAt: confirmation?.receivedAt.toISOString() ?? null,
        comparatorMailAt: automatic?.at ?? null,
        comparator: automatic?.provider ?? null,
        bookingAt: booked?.receivedAt.toISOString() ?? null,
      },
      unexpected: { count: unexpected._count._all, lastAt: unexpected._max.receivedAt?.toISOString() ?? null },
      mailProvider: await this.mailProviderOf(actor, forwardingView(confirmation)?.requester ?? null),
    };
  }

  /**
   * A (14/10/2026): the mail service the wizard opens on: Gmail when Gmail asked to forward to Plazo, else the service
   * of the member's own address (never a platform admin's in consultation: the operator's managers'), domain or MX.
   */
  private async mailProviderOf(actor: AuthenticatedStaff, requester: string | null): Promise<InboundSettings['mailProvider']> {
    if (requester) {
      const guess = await this.mailProviders.guess(requester);
      return { id: 'gmail', business: guess?.business ?? false, email: requester, source: 'forwarding' };
    }
    const candidates = actor.actingAs ? (await this.managerAddresses(actor.operatorId)).slice(0, 2) : [actor.email];
    for (const email of candidates) {
      const guess = await this.mailProviders.guess(email);
      if (guess) return { ...guess, email, source: 'account' };
    }
    return null;
  }

  /**
   * The manager asks for a new address (the old one stops working). Without `regenerate`, the address is simply
   * returned: every operator has one from its creation (08/10/2026); only an operator created before gets it here.
   */
  public async enableAddress(actor: AuthenticatedStaff, options: { regenerate?: boolean } = {}): Promise<InboundSettings> {
    this.require(actor, 'parking:manage');
    if (!inboundEmailAvailable()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Inbound email is not configured', 'inbound_unavailable');
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { slug: true, inboundSlug: true } });
    if (!operator.inboundSlug || options.regenerate) {
      const slug = await allocateInboundSlug(prisma, operator.slug);
      await prisma.operator.update({ where: { id: actor.operatorId }, data: { inboundSlug: slug } });
      await this.audit.record(actor, {
        action: options.regenerate ? 'inbound.address_regenerated' : 'inbound.address_enabled',
        entityType: 'operator',
        entityId: actor.operatorId,
      });
    }
    return this.settings(actor);
  }

  /**
   * The inbox (M-A, 08/10/2026): one tab (`view`, `todo` by default) newest first, with the three tabs' counts;
   * `status` narrows the tab's rows to one status (the older filter).
   */
  public async list(actor: AuthenticatedStaff, filter: { view?: InboundView; status?: InboundEmailStatus } = {}): Promise<InboundEmailList> {
    this.require(actor, 'reservations:manage');
    // A bare ?status= looks in the tab that holds it (an "imported" filter would find nothing in « À traiter »).
    const view = filter.view ?? (filter.status ? viewOfStatus(filter.status) : 'todo');
    const now = Date.now();
    const scope: Record<InboundView, Prisma.InboundEmailWhereInput> = {
      todo: { status: { in: TO_CHECK } },
      done: { status: { in: DONE_STATUSES }, receivedAt: { gte: new Date(now - DONE_WINDOW_DAYS * 86400000) } },
      archived: { status: 'archived', receivedAt: { gte: new Date(now - ARCHIVED_WINDOW_DAYS * 86400000) } },
    };
    const where = (v: InboundView): Prisma.InboundEmailWhereInput => ({ operatorId: actor.operatorId, ...scope[v] });
    // Gmail's forwarding confirmations belong to the setup wizard, never to the inbox.
    const listed: Prisma.InboundEmailWhereInput | null =
      filter.status === 'forwarding' || filter.status === 'ignored'
        ? null
        : filter.status
          ? { AND: [where(view), { status: filter.status }] }
          : where(view);
    const [rows, todo, done, archived] = await Promise.all([
      listed
        ? prisma.inboundEmail.findMany({
            where: listed,
            include: { reservation: { select: { reference: true } } },
            orderBy: { receivedAt: 'desc' },
            take: LIST_MAX,
          })
        : [],
      prisma.inboundEmail.count({ where: where('todo') }),
      prisma.inboundEmail.count({ where: where('done') }),
      prisma.inboundEmail.count({ where: where('archived') }),
    ]);
    return { data: rows.map(r => this.view(r)), counts: { todo, done, archived } };
  }

  /**
   * T-A « Marquer comme traité »: the email was dealt with, with or without a booking. `imported` stays as it is
   * (a booking is its proof); an archived email refuses (409 `archived`); the text stays until the purge.
   */
  public async handle(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id);
    if (row.status === 'archived') throw new HttpException(httpStatus.CONFLICT, 'This email is archived', 'archived');
    if (HANDLEABLE.includes(row.status)) {
      await prisma.inboundEmail.update({ where: { id }, data: { status: 'handled' } });
      await this.audit.record(actor, { action: 'inbound.handled', entityType: 'inbound_email', entityId: id });
      return this.view({ ...row, status: 'handled' });
    }
    return this.view(row);
  }

  /** Deprecated alias of handle() (« Classer sans suite » until the 08/10/2026). */
  public async dismiss(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    return this.handle(actor, id);
  }

  /** T-A « Archiver »: out of the inbox, still readable in « Archivés » until the purge; not a forwarding confirmation (409). */
  public async archive(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id, { includeForwarding: true });
    if (row.status === 'forwarding') throw new HttpException(httpStatus.CONFLICT, 'A forwarding confirmation cannot be archived', 'forwarding');
    if (row.status !== 'archived') {
      await prisma.inboundEmail.update({ where: { id }, data: { status: 'archived' } });
      await this.audit.record(actor, { action: 'inbound.archived', entityType: 'inbound_email', entityId: id });
    }
    return this.view({ ...row, status: 'archived' });
  }

  /**
   * 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): an email waiting or set aside is analysed again as at its
   * reception (importers, Allopark's booking page, Claude, the booking); typically an email received before the
   * Allopark page was read, or while Claude was unavailable. Refused for an email with a booking (409
   * `already_imported`), without its text (purged after 30 days: 409 `text_gone`) or analysed less than 30 s ago (409
   * `analysis_running`). A handled or archived email keeps its status unless the booking is made: a re-analysis never
   * moves an email back to « À traiter » by itself; nor does it forget a field read before (Claude or Allopark's page
   * not answering this time).
   */
  public async reanalyse(actor: AuthenticatedStaff, id: string): Promise<Reanalysis> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id);
    if (row.reservationId || row.status === 'imported' || row.status === 'duplicate') {
      throw new HttpException(httpStatus.CONFLICT, 'This email already has its booking', 'already_imported');
    }
    if (!row.textBody) throw new HttpException(httpStatus.CONFLICT, 'The text of this email is no longer kept', 'text_gone');
    // The claim is atomic: of two clicks, one analyses, the other is refused.
    const now = new Date();
    const claimed = await prisma.inboundEmail.updateMany({
      where: {
        id,
        operatorId: actor.operatorId,
        reservationId: null,
        OR: [{ analysedAt: null }, { analysedAt: { lte: new Date(now.getTime() - REANALYSIS_GAP_MS) } }],
      },
      data: { analysedAt: now },
    });
    if (!claimed.count) throw new HttpException(httpStatus.CONFLICT, 'This email is being analysed', 'analysis_running');
    let result: Rerun;
    try {
      result = await this.rerun(row, actor.operatorId, actor, false);
    } catch (error) {
      // An unexpected failure frees the email for another try at once.
      await prisma.inboundEmail.updateMany({ where: { id, analysedAt: now }, data: { analysedAt: row.analysedAt } }).catch(() => undefined);
      throw error;
    }
    if (!result.current) throw new HttpException(httpStatus.NOT_FOUND, 'Email not found', 'not_found');
    if (!result.status) throw new HttpException(httpStatus.CONFLICT, 'This email already has its booking', 'already_imported');
    const updated = await prisma.inboundEmail.findUniqueOrThrow({ where: { id }, include: { reservation: { select: { reference: true } } } });
    return { email: this.view(updated), outcome: result.analysis.status };
  }

  /**
   * 11/10/2026 (« Lance l'analyse automatiquement pour allopark »): the Allopark emails whose booking page Plazo could not
   * read are analysed again by Plazo itself when due (domain/inbound-retry.ts: after 10 min, 30 min, 1 h, 3 h and 8 h, two
   * days at most; never a page protected by a captcha), oldest first, a few per pass. Each is one « Relancer l'analyse »:
   * the same claim (never while the staff relaunch it), the same analysis, the booking created or the change applied with
   * their notifications, traced `inbound.reanalysed` with `auto: true` and no staff member. Called every 10 minutes by the
   * email relay's cron (POST /public/inbound/retry).
   */
  public async retryAllopark(now = new Date()): Promise<AutoRetryReport> {
    const rows = await prisma.inboundEmail.findMany({
      where: {
        status: { in: TO_CHECK },
        reservationId: null,
        textBody: { not: null },
        receivedAt: { gte: new Date(now.getTime() - AUTO_RETRY_WINDOW_HOURS * 3_600_000) },
        autoRetries: { lt: AUTO_RETRY_MAX },
        operator: { suspendedAt: null },
        // A refusal of Allopark (429, Cloudflare block, `refused` in the lookup) is left out below (nextAutoRetry).
        OR: AUTO_RETRY_OUTCOMES.map(outcome => ({ pageLookup: { path: ['outcome'], equals: outcome } })),
      },
      include: { reservation: { select: { reference: true } } },
      orderBy: { receivedAt: 'asc' },
      take: 50,
    });
    const due = rows.filter(row => {
      const next = nextAutoRetry(autoRetryCandidate(row));
      return next !== null && next.getTime() <= now.getTime();
    });
    const report: AutoRetryReport = { due: due.length, tried: 0, outcomes: {} };
    const started = Date.now();
    for (const row of due) {
      if (report.tried >= AUTO_RETRY_PER_RUN) break;
      if (report.tried > 0 && Date.now() - started > AUTO_RETRY_START_BUDGET_MS) break;
      // 15/10/2026 (relecture): the staff made the booking themselves while the email waited: never a second one.
      if (await this.typedByHand(row)) {
        report.typedByHand = (report.typedByHand ?? 0) + 1;
        continue;
      }
      const at = new Date();
      // Claimed as a staff relaunch is (never twice at once), the try counted even when the analysis fails.
      const claimed = await prisma.inboundEmail.updateMany({
        where: {
          id: row.id,
          reservationId: null,
          status: { in: TO_CHECK },
          autoRetries: row.autoRetries,
          OR: [{ analysedAt: null }, { analysedAt: { lte: new Date(at.getTime() - REANALYSIS_GAP_MS) } }],
        },
        data: { analysedAt: at, autoRetries: { increment: 1 } },
      });
      if (!claimed.count) continue;
      report.tried += 1;
      try {
        const result = await this.rerun(row, row.operatorId, { id: null, operatorId: row.operatorId }, true);
        report.outcomes[result.analysis.status] = (report.outcomes[result.analysis.status] ?? 0) + 1;
        // Allopark asked for a check or refused Plazo: no other email opens it in this pass (never hammered).
        const lookup = result.analysis.pageLookup;
        if (lookup && (lookup.outcome === 'protected' || lookup.refused)) {
          report.stopped = lookup.outcome === 'protected' ? 'protected' : 'refused';
          break;
        }
      } catch (error) {
        logger.warn(`[Inbound] automatic re-analysis of ${row.id} failed: ${error instanceof Error ? error.name : 'error'}`);
      }
    }
    if (report.due) {
      const outcomes = Object.entries(report.outcomes)
        .map(([outcome, count]) => `${count} ${outcome}`)
        .join(', ');
      const stopped = report.stopped
        ? `, stopped: Allopark ${report.stopped === 'protected' ? 'asked for an anti-robot check' : 'refused Plazo'}`
        : '';
      logger.info(`[Inbound] automatic re-analysis: ${report.due} due, ${report.tried} tried${outcomes ? ` (${outcomes})` : ''}${stopped}`);
    }
    return report;
  }

  /**
   * 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): the emails that waited only for their plate
   * (incomplete, `missing` ['plate'], received these 7 days, without booking, text kept, operator not suspended) are
   * analysed again now that the plate is no longer required, oldest first, a few per pass, as retryAllopark does (the
   * same claim and count, the same rerun traced `auto: true`, the pass stopped when Allopark asks for a check or refuses
   * Plazo). It ends by itself: an analysis never writes ['plate'] again. Called after retryAllopark by POST
   * /public/inbound/retry; `startedAt` is when that call began, so that no analysis starts after its first 10 s (within
   * Vercel's 60 s).
   */
  public async importWaitingForPlate(now = new Date(), startedAt = Date.now()): Promise<AutoRetryReport> {
    const rows = await prisma.inboundEmail.findMany({
      where: {
        status: 'incomplete',
        reservationId: null,
        textBody: { not: null },
        missing: { equals: ['plate'] },
        receivedAt: { gte: new Date(now.getTime() - PLATE_CATCH_UP_DAYS * 86_400_000) },
        autoRetries: { lt: AUTO_RETRY_MAX },
        operator: { suspendedAt: null },
      },
      include: { reservation: { select: { reference: true } } },
      orderBy: { receivedAt: 'asc' },
      take: 50,
    });
    const report: AutoRetryReport = { due: rows.length, tried: 0, outcomes: {} };
    for (const row of rows) {
      if (report.tried >= AUTO_RETRY_PER_RUN) break;
      if (Date.now() - startedAt > AUTO_RETRY_START_BUDGET_MS) break;
      // The staff made the booking themselves while the email waited (typed at the counter…): never a second one.
      if (await this.typedByHand(row)) {
        report.typedByHand = (report.typedByHand ?? 0) + 1;
        continue;
      }
      const at = new Date();
      const claimed = await prisma.inboundEmail.updateMany({
        where: {
          id: row.id,
          reservationId: null,
          status: 'incomplete',
          autoRetries: row.autoRetries,
          missing: { equals: ['plate'] },
          OR: [{ analysedAt: null }, { analysedAt: { lte: new Date(at.getTime() - REANALYSIS_GAP_MS) } }],
        },
        data: { analysedAt: at, autoRetries: { increment: 1 } },
      });
      if (!claimed.count) continue;
      report.tried += 1;
      try {
        const result = await this.rerun(row, row.operatorId, { id: null, operatorId: row.operatorId }, true);
        report.outcomes[result.analysis.status] = (report.outcomes[result.analysis.status] ?? 0) + 1;
        const lookup = result.analysis.pageLookup;
        if (lookup && (lookup.outcome === 'protected' || lookup.refused)) {
          report.stopped = lookup.outcome === 'protected' ? 'protected' : 'refused';
          break;
        }
      } catch (error) {
        logger.warn(`[Inbound] plate catch-up of ${row.id} failed: ${error instanceof Error ? error.name : 'error'}`);
      }
    }
    if (report.due) {
      const outcomes = Object.entries(report.outcomes)
        .map(([outcome, count]) => `${count} ${outcome}`)
        .join(', ');
      logger.info(
        `[Inbound] plate catch-up: ${report.due} due, ${report.tried} tried${outcomes ? ` (${outcomes})` : ''}${report.stopped ? `, stopped: ${report.stopped}` : ''}`,
      );
    }
    return report;
  }

  /**
   * 16/10/2026 (the Anthropic account out of credit that morning): the emails that wait only because Claude could not
   * read them (`reading.outage`, received these 7 days, « À traiter », without booking, text kept, operator not suspended)
   * are analysed again once Claude answers: the least recently tried first, three per pass at most (none started after
   * the call's first 10 s), each claimed as a staff relaunch is (never twice at once) and traced `auto: true`; the pass
   * stops at the first email Claude still cannot read (one call per pass while it is down), or when Allopark asks for a
   * check or refuses Plazo. Never when Plazo has no Anthropic key, never a mail whose booking the staff typed themselves
   * meanwhile (typedByHand). Called after the other passes by POST /public/inbound/retry (every 10 minutes).
   */
  public async retryReading(now = new Date(), startedAt = Date.now()): Promise<AutoRetryReport> {
    if (!this.reader.available()) return { due: 0, tried: 0, outcomes: {} };
    const rows = await prisma.inboundEmail.findMany({
      where: {
        status: { in: TO_CHECK },
        reservationId: null,
        textBody: { not: null },
        receivedAt: { gte: new Date(now.getTime() - READING_RETRY_WINDOW_MS) },
        operator: { suspendedAt: null },
        OR: READING_OUTAGE_CAUSES.map(cause => ({ reading: { path: ['outage', 'cause'], equals: cause } })),
      },
      include: { reservation: { select: { reference: true } } },
      orderBy: { receivedAt: 'asc' },
      take: 50,
    });
    const triedAt = (row: InboundRow) => new Date(outageOf(row.reading)?.at ?? row.receivedAt.toISOString()).getTime();
    const due = rows.filter(row => triedAt(row) <= now.getTime() - READING_RETRY_GAP_MS).sort((a, b) => triedAt(a) - triedAt(b));
    return this.autoPass('reading retry', due, startedAt, { status: { in: TO_CHECK } }, { count: false, stopOnOutage: true });
  }

  /**
   * 16/10/2026 (« analyser sans passer par Claude »): the emails stored before the rules per mail type, that waited for
   * Claude's reading (the Allopark modifications of the morning: « change announced, Claude did not answer »): « À
   * traiter », without booking, reading, change nor an unread booking page, received these 7 days, text kept, operator
   * not suspended, that the rules now know (domain/inbound-kind.ts: a booking template, a change, a cancellation or
   * another mail of a comparator) are analysed again, as the plate catch-up does (the same claim and count, traced
   * `auto: true`). It ends by itself: an analysis writes the rules' reading.
   */
  public async analyseWaitingForRules(now = new Date(), startedAt = Date.now()): Promise<AutoRetryReport> {
    const rows = await prisma.inboundEmail.findMany({
      where: {
        reservationId: null,
        textBody: { not: null },
        reading: { equals: Prisma.DbNull },
        change: { equals: Prisma.DbNull },
        OR: [{ pageLookup: { equals: Prisma.DbNull } }, { pageLookup: { path: ['outcome'], equals: 'read' } }],
        // What Claude was waited for: an email left unread (a change « Claude did not answer »), or a booking unsure.
        AND: [{ OR: [{ status: 'unrecognised' }, { status: 'incomplete', missing: { array_contains: ['confidence'] } }] }],
        receivedAt: { gte: new Date(now.getTime() - RULES_CATCH_UP_DAYS * 86_400_000) },
        autoRetries: { lt: AUTO_RETRY_MAX },
        operator: { suspendedAt: null },
      },
      include: { reservation: { select: { reference: true } } },
      orderBy: { receivedAt: 'asc' },
      take: 50,
    });
    const known = rows.filter(row => {
      const sender = [row.fromName, row.fromAddress].filter(Boolean).join(' ');
      const type = classifyMail({ subject: row.subject, text: row.textBody ?? '', from: sender, links: row.links });
      return type.kind !== 'unknown' && (type.kind !== 'booking' || type.sure);
    });
    return this.autoPass('rules catch-up', known, startedAt, { status: { in: TO_CHECK }, reading: { equals: Prisma.DbNull } }, { count: true });
  }

  /**
   * 16/10/2026 (« relie les mail deja traité »): the emails received and dealt with before the rules per mail type are
   * read once more with them, so that those Plazo can now read get their booking. Candidates: of an active operator (not
   * suspended, not archived), received within the 30 days their text is kept, without booking, « À traiter » or marked
   * as handled (never archived, ignored, a forwarding confirmation, imported or a duplicate), whatever their reading
   * (Claude's, none, an outage) but the rules' and never re-read before (REREAD_MARK, whenever the staff relaunched it), that the rules read
   * as a known booking (a comparator's template) or an Allopark change of a named booking; never a cancellation, a reply
   * or another mail, nor one Claude read as a cancellation (nothing to do of them without Claude). Each is one « Relancer
   * l'analyse » by Plazo (rerun traced `auto: true`): the booking created as at the reception, or the email linked to the
   * booking Plazo has (its reference, or createFromImport's duplicate rules), an Allopark change applied from its page or
   * left « À faire à la main » with its reason; a handled email that neither imports nor links keeps its status. Two
   * guards: a booking of the same traveller the staff typed, before the email came or while it waited, leaves it to them
   * (typedSince, from any date), and a stay that is over is
   * only linked, never created (`linkOnlyIfOverAt`). Newest first (the stays to come), three per pass, none started after
   * the call's first 10 s; the pass stops when Allopark asks for a check or refuses Plazo. It ends by itself: its claim
   * leaves REREAD_MARK. An email another pass reads again (an Allopark page not read yet, a plate
   * catch-up, the rules' catch-up, a reading waiting for Claude) is left to it. Called last by POST /public/inbound/retry.
   */
  public async rereadWithRules(now = new Date(), startedAt = Date.now()): Promise<AutoRetryReport> {
    // Review: the call's 10 s are spent already: no scan (no analysis could start), the next call reads them.
    if (Date.now() - startedAt > AUTO_RETRY_START_BUDGET_MS) return { due: 0, tried: 0, outcomes: {} };
    const since = (days: number) => new Date(now.getTime() - days * 86_400_000);
    const toCheck = Prisma.join(TO_CHECK);
    // The emails another pass of the relay reads again (now or at its next try) are left to it: never two passes on one.
    const found = await prisma.$queryRaw<{ id: string }[]>`
      SELECT e.id FROM inbound_emails e
      JOIN operators o ON o.id = e."operatorId"
      WHERE e."reservationId" IS NULL
        AND e."textBody" IS NOT NULL
        AND e.status::text IN (${Prisma.join(REREAD_STATUSES)})
        AND e."receivedAt" >= ${since(TEXT_RETENTION_DAYS)}
        AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a."operatorId" = e."operatorId" AND a.action = ${REREAD_MARK} AND a."entityId" = e.id)
        AND (e.reading IS NULL OR e.reading->>'source' IS DISTINCT FROM 'rules')
        AND (e.reading IS NULL OR e.reading->>'kind' IS DISTINCT FROM 'cancellation')
        AND o.status = 'active' AND o."suspendedAt" IS NULL AND o."archivedAt" IS NULL
        AND concat_ws(' ', e.subject, e."fromAddress", e."fromName", e."textBody") ~* ${COMPARATOR_WORDS}
        -- retryAllopark: an Allopark booking page not read, tried again within two days.
        AND NOT COALESCE(e.status::text IN (${toCheck})
          AND e."pageLookup"->>'outcome' IN (${Prisma.join([...AUTO_RETRY_OUTCOMES])})
          AND (e."pageLookup"->>'refused') IS DISTINCT FROM 'true'
          AND e."autoRetries" < ${AUTO_RETRY_MAX}
          AND e."receivedAt" >= ${new Date(now.getTime() - AUTO_RETRY_WINDOW_HOURS * 3_600_000)}, false)
        -- importWaitingForPlate: an email that waited only for its plate, these 7 days.
        AND NOT COALESCE(e.status::text = 'incomplete' AND e.missing = '["plate"]'::jsonb
          AND e."autoRetries" < ${AUTO_RETRY_MAX} AND e."receivedAt" >= ${since(PLATE_CATCH_UP_DAYS)}, false)
        -- analyseWaitingForRules: « À traiter » without any reading, these 7 days.
        AND NOT COALESCE(e.reading IS NULL AND e.change IS NULL
          AND (e."pageLookup" IS NULL OR e."pageLookup"->>'outcome' = 'read')
          AND (e.status::text = 'unrecognised' OR (e.status::text = 'incomplete' AND e.missing @> '["confidence"]'::jsonb))
          AND e."autoRetries" < ${AUTO_RETRY_MAX} AND e."receivedAt" >= ${since(RULES_CATCH_UP_DAYS)}, false)
        -- retryReading (with an Anthropic key): « À traiter » waiting for Claude, these 7 days.
        AND NOT COALESCE(${this.reader.available()} AND e.status::text IN (${toCheck}) AND e.reading->'outage' IS NOT NULL
          AND e."receivedAt" >= ${new Date(now.getTime() - READING_RETRY_WINDOW_MS)}, false)
      ORDER BY e."receivedAt" DESC
      LIMIT ${REREAD_SCAN}`;
    const ids = found.map(row => row.id);
    const rows = ids.length
      ? await prisma.inboundEmail.findMany({ where: { id: { in: ids } }, include: { reservation: { select: { reference: true } } } })
      : [];
    const order = new Map(ids.map((id, index) => [id, index]));
    const known = rows
      .filter(row => {
        const sender = [row.fromName, row.fromAddress].filter(Boolean).join(' ');
        const type = classifyMail({ subject: row.subject, text: row.textBody ?? '', from: sender, links: row.links });
        return (type.kind === 'booking' && type.sure) || (type.kind === 'change' && type.provider === 'Allopark' && !!type.reference);
      })
      .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    // Review (16/10/2026): never a booking whose reference another email of the operator cancelled (the confirmation
    // left « À traiter » or handled because the traveller cancelled it): no phantom booking of a cancelled stay.
    const cancelled = await this.cancelledReferences(
      known.map(row => row.operatorId),
      now,
    );
    const notCancelled = known.filter(row => {
      const refs = cancelled.get(row.operatorId);
      return !refs || !namedReferencesIn(`${row.subject ?? ''}\n${row.textBody ?? ''}`).some(ref => refs.has(ref));
    });
    if (notCancelled.length < known.length)
      logger.info(`[Inbound] reading of the mails already received: ${known.length - notCancelled.length} cancelled elsewhere, left to the staff`);
    known.splice(0, known.length, ...notCancelled);
    const still: Prisma.InboundEmailWhereInput = { status: { in: REREAD_STATUSES } };
    return this.autoPass('reading of the mails already received', known, startedAt, still, { count: false, linkOnlyIfOver: true });
  }

  /**
   * Review (16/10/2026): the comparators' references (AL-…, PM…) that an email of these operators, these 90 days, cancels
   * or refunds: read by Claude or by the rules as a cancellation, or with a cancellation subject once its text is gone.
   */
  private async cancelledReferences(operatorIds: string[], now: Date): Promise<Map<string, Set<string>>> {
    const result = new Map<string, Set<string>>();
    const ids = [...new Set(operatorIds)];
    if (!ids.length) return result;
    const rows = await prisma.inboundEmail.findMany({
      where: {
        operatorId: { in: ids },
        receivedAt: { gte: new Date(now.getTime() - 90 * 86_400_000) },
        status: { notIn: ['ignored', 'forwarding'] },
        OR: [
          { reading: { path: ['kind'], equals: 'cancellation' } },
          { subject: { contains: 'annul', mode: 'insensitive' } },
          { subject: { contains: 'rembours', mode: 'insensitive' } },
          { subject: { contains: 'cancel', mode: 'insensitive' } },
          { subject: { contains: 'refund', mode: 'insensitive' } },
          { textBody: { contains: 'annul', mode: 'insensitive' } },
          { textBody: { contains: 'rembours', mode: 'insensitive' } },
          { textBody: { contains: 'cancel', mode: 'insensitive' } },
          { textBody: { contains: 'refund', mode: 'insensitive' } },
        ],
      },
      select: { operatorId: true, subject: true, textBody: true, fromName: true, fromAddress: true, links: true, reading: true },
    });
    for (const row of rows) {
      const sender = [row.fromName, row.fromAddress].filter(Boolean).join(' ');
      const cancels =
        readingOf(row.reading)?.kind === 'cancellation' ||
        (row.textBody !== null
          ? classifyMail({ subject: row.subject, text: row.textBody, from: sender, links: row.links }).kind === 'cancellation'
          : SUBJECT_CANCELLATION.test(row.subject ?? ''));
      if (!cancels) continue;
      const refs = namedReferencesIn(`${row.subject ?? ''}\n${row.textBody ?? ''}`);
      if (!refs.length) continue;
      const set = result.get(row.operatorId) ?? new Set<string>();
      refs.forEach(ref => set.add(ref));
      result.set(row.operatorId, set);
    }
    return result;
  }

  /**
   * One automatic pass (retryReading, analyseWaitingForRules, rereadWithRules): each row claimed as a staff relaunch is
   * (never twice at once; `count`: the try counted in `autoRetries`, even when the analysis fails), analysed again and
   * traced `auto: true`; three per pass, none started after the call's first 10 s; the pass stops when Allopark asks for
   * a check or refuses Plazo, and (`stopOnOutage`) when Claude still cannot read. `linkOnlyIfOver` (rereadWithRules): a
   * stay that is over is only linked, and the booking typed by the staff is found by the analysis (typedSince) rather
   * than before the claim, so that each email is read once. Logged without personal data.
   */
  private async autoPass(
    name: string,
    rows: (InboundRow & { operatorId: string })[],
    startedAt: number,
    still: Prisma.InboundEmailWhereInput,
    options: { count: boolean; stopOnOutage?: boolean; linkOnlyIfOver?: boolean },
  ): Promise<AutoRetryReport> {
    const report: AutoRetryReport = { due: rows.length, tried: 0, outcomes: {} };
    for (const row of rows) {
      if (report.tried >= AUTO_RETRY_PER_RUN) break;
      if (Date.now() - startedAt > AUTO_RETRY_START_BUDGET_MS) break;
      if (!options.linkOnlyIfOver && (await this.typedByHand(row))) {
        report.typedByHand = (report.typedByHand ?? 0) + 1;
        continue;
      }
      const at = new Date();
      const claimed = await prisma.inboundEmail.updateMany({
        where: {
          id: row.id,
          reservationId: null,
          ...still,
          ...(options.count ? { autoRetries: row.autoRetries } : {}),
          OR: [{ analysedAt: null }, { analysedAt: { lte: new Date(at.getTime() - REANALYSIS_GAP_MS) } }],
        },
        data: { analysedAt: at, ...(options.count ? { autoRetries: { increment: 1 } } : {}) },
      });
      if (!claimed.count) continue;
      report.tried += 1;
      try {
        // rereadWithRules: once per email, whatever this analysis becomes (an error included).
        if (options.linkOnlyIfOver) {
          await this.audit.record(
            { id: null, operatorId: row.operatorId },
            {
              action: REREAD_MARK,
              entityType: 'inbound_email',
              entityId: row.id,
              details: { auto: true },
            },
          );
        }
        // The re-reading of emails already dealt with: a booking of the same traveller typed by the staff at any time,
        // before the email came too (typed from the comparator's extranet or by phone), leaves it to them (typedSince).
        const result = await this.rerun(row, row.operatorId, { id: null, operatorId: row.operatorId }, true, {
          ...(options.linkOnlyIfOver ? { linkOnlyIfOverAt: at, typedSince: new Date(0) } : {}),
        });
        report.outcomes[result.analysis.status] = (report.outcomes[result.analysis.status] ?? 0) + 1;
        const lookup = result.analysis.pageLookup;
        if (lookup && (lookup.outcome === 'protected' || lookup.refused)) {
          report.stopped = lookup.outcome === 'protected' ? 'protected' : 'refused';
          break;
        }
        if (options.stopOnOutage && result.analysis.outage) {
          report.stopped = 'reading';
          break;
        }
      } catch (error) {
        logger.warn(`[Inbound] ${name} of ${row.id} failed: ${error instanceof Error ? error.name : 'error'}`);
      }
    }
    if (report.due) {
      const outcomes = Object.entries(report.outcomes)
        .map(([outcome, count]) => `${count} ${outcome}`)
        .join(', ');
      logger.info(
        `[Inbound] ${name}: ${report.due} due, ${report.tried} tried${outcomes ? ` (${outcomes})` : ''}${report.typedByHand ? `, ${report.typedByHand} typed by hand` : ''}${report.stopped ? `, stopped: ${report.stopped}` : ''}`,
      );
    }
    return report;
  }

  /**
   * 15/10/2026 (relecture de « ne pas planter à l'import quand la plaque est manquante »): whether the staff made the
   * booking of a waiting email themselves since it arrived (ReservationService.typedSince, read from what the email said
   * so far). Plazo's own re-analyses (retryAllopark, importWaitingForPlate) then leave it to the staff: importing it
   * would make a second booking of the same car. Never for an Allopark change, which finds a booking typed without its
   * reference itself (unreferencedMatches) and applies to it.
   */
  private async typedByHand(row: InboundRow & { operatorId: string }): Promise<boolean> {
    const parsed = storedParsed(row.parsed);
    if (!parsed || row.change || readingOf(row.reading)?.kind === 'modification') return false;
    const sender = [row.fromName, row.fromAddress].filter(Boolean).join(' ');
    if (classifyMail({ text: row.textBody ?? '', subject: row.subject, from: sender, links: row.links }).kind === 'change') return false;
    return this.reservations.typedSince(row.operatorId, parsed, row.receivedAt);
  }

  /**
   * One more analysis of a stored email (« Relancer l'analyse », or Plazo's own try): the analysis of the reception, then
   * the row written under its lock (a colleague may have handled, archived or attached it while the analysis ran: a
   * handled or archived email keeps that state, an attached one its booking) and the history.
   */
  private async rerun(
    row: InboundRow,
    operatorId: string,
    auditActor: { id: string | null; operatorId: string },
    auto: boolean,
    options: Pick<AnalysisInput, 'linkOnlyIfOverAt' | 'typedSince'> = {},
  ): Promise<Rerun> {
    const id = row.id;
    const { typedSince, ...rest } = options;
    const analysis = await this.analyse({
      ...rest,
      operatorId,
      emailId: id,
      text: row.textBody ?? '',
      fromAddress: row.fromAddress,
      fromName: row.fromName,
      subject: row.subject,
      links: row.links,
      recipients: row.recipients,
      previous: {
        parsed: storedParsed(row.parsed),
        missing: missingOf(row.missing),
        reading: readingOf(row.reading),
        change: changeOf(row.change),
      },
      ...(auto ? { typedSince: typedSince ?? row.receivedAt } : {}),
    });
    const linked = analysis.status === 'imported' || analysis.status === 'changed' || analysis.status === 'duplicate';
    // The new reading (Claude's when it answered, else the rules'); none for a booking made without either; else the
    // former one stays. 16/10/2026: with the outage when Claude could not read an email that waits for it; a former
    // outage goes once the email no longer waits for Claude.
    const former = readingOf(row.reading);
    const reading = analysis.reading
      ? { reading: storedReading(analysis.reading, analysis.outage) }
      : linked
        ? { reading: Prisma.DbNull }
        : analysis.outage
          ? { reading: storedReading(former, analysis.outage) }
          : outageOf(row.reading)
            ? { reading: former ? storedReading(former, null) : Prisma.DbNull }
            : {};
    const written = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM inbound_emails WHERE id = ${id} FOR UPDATE`;
      const current = await tx.inboundEmail.findUnique({ where: { id }, select: { status: true, reservationId: true } });
      if (!current || current.reservationId) return { current, status: null };
      const status: InboundEmailStatus = linked || TO_CHECK.includes(current.status) ? storedStatus(analysis.status) : current.status;
      await tx.inboundEmail.update({
        where: { id },
        data: {
          status,
          provider: analysis.provider,
          parsed: analysis.parsed ? (analysis.parsed as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          missing: analysis.missing.length ? analysis.missing : Prisma.DbNull,
          reservationId: analysis.reservationId,
          // Of no use once the email has its booking (RGPD: minimised as in attach()).
          ...(linked ? { recipients: [], links: [] } : {}),
          // 10/10/2026: what became of the Allopark page this time (none tried: none shown).
          pageLookup: analysis.pageLookup ? storedPageLookup(analysis.pageLookup, linked) : Prisma.DbNull,
          // 10/10/2026 (« C'est une modification »): what this analysis did of an Allopark change (none: none shown).
          change: analysis.change ? storedChange(analysis.change) : Prisma.DbNull,
          ...reading,
        },
      });
      return { current, status };
    });
    const details = {
      from: written.current?.status ?? row.status,
      to: written.status ?? written.current?.status ?? row.status,
      outcome: analysis.status,
      ...(analysis.reservationId ? { reservationId: analysis.reservationId } : {}),
      ...(auto ? { auto: true } : {}),
    };
    // Traced even when refused: the analysis may have made a booking before the email was attached by hand.
    if (written.current) await this.audit.record(auditActor, { action: 'inbound.reanalysed', entityType: 'inbound_email', entityId: id, details });
    return { analysis, current: written.current, status: written.status };
  }

  /** Links an email to the booking the staff typed from it (the "Compléter" flow). */
  public async attach(actor: AuthenticatedStaff, id: string, reservationId: string): Promise<void> {
    this.require(actor, 'reservations:manage');
    const row = await prisma.inboundEmail.findFirst({ where: { id, operatorId: actor.operatorId }, select: { id: true } });
    const booking = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId }, select: { id: true } });
    if (!row || !booking) throw new HttpException(httpStatus.NOT_FOUND, 'Not found', 'not_found');
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: 'imported', reservationId, textBody: null, recipients: [], links: [], pageLookup: Prisma.DbNull, change: Prisma.DbNull },
    });
  }

  /**
   * Nightly: the text (with the recipients and links kept for a re-analysis, the Allopark page's lookup whose link
   * carries an address, and the values of an Allopark change: 10/10/2026) after 30 days, the rows after 90.
   */
  public async purge(now = new Date()): Promise<{ textsCleared: number; rowsDeleted: number }> {
    const { count: textsCleared } = await prisma.inboundEmail.updateMany({
      where: {
        receivedAt: { lt: new Date(now.getTime() - TEXT_RETENTION_DAYS * 86400000) },
        OR: [
          { textBody: { not: null } },
          { recipients: { isEmpty: false } },
          { links: { isEmpty: false } },
          { pageLookup: { not: Prisma.DbNull } },
          { change: { not: Prisma.DbNull } },
        ],
      },
      data: { textBody: null, recipients: [], links: [], pageLookup: Prisma.DbNull, change: Prisma.DbNull },
    });
    const { count: rowsDeleted } = await prisma.inboundEmail.deleteMany({
      where: {
        OR: [
          { receivedAt: { lt: new Date(now.getTime() - ROW_RETENTION_DAYS * 86400000) } },
          // A (14/10/2026): an email set aside only counts for the wizard's alert, 7 days.
          { status: 'ignored', receivedAt: { lt: new Date(now.getTime() - UNEXPECTED_DAYS * 86400000) } },
        ],
      },
    });
    return { textsCleared, rowsDeleted };
  }

  /**
   * 16/10/2026: Claude's outage for the dashboard (« Import » À voir, « Lecture par Claude en panne : crédit Anthropic
   * épuisé »): the latest one of the operator's emails that wait for Claude, tried within the hour; none without an
   * Anthropic key (the emails then wait for the staff, as always), nor once this instance's Claude answered since.
   */
  public async readingOutage(operatorId: string, now = new Date()): Promise<ReadingOutage | null> {
    if (!this.reader.available()) return null;
    const rows = await prisma.inboundEmail.findMany({
      where: {
        operatorId,
        status: { in: TO_CHECK },
        OR: READING_OUTAGE_CAUSES.map(cause => ({ reading: { path: ['outage', 'cause'], equals: cause } })),
      },
      select: { reading: true },
      orderBy: { receivedAt: 'desc' },
      take: 20,
    });
    const since = now.getTime() - 3_600_000;
    const latest = rows
      .map(row => outageOf(row.reading))
      .filter((outage): outage is ReadingOutage => !!outage && Date.parse(outage.at) >= since)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    if (!latest) return null;
    const last = this.reader.lastCall;
    return last && !last.outage && last.at.getTime() > Date.parse(latest.at) ? null : latest;
  }

  /** Emails waiting for the staff, for the dashboard. */
  public async toCheckCount(operatorId: string): Promise<number> {
    return prisma.inboundEmail.count({ where: { operatorId, status: { in: TO_CHECK } } });
  }

  /** The operator's email with its booking's reference; a forwarding confirmation is unknown to the inbox unless asked for. */
  private async find(actor: AuthenticatedStaff, id: string, options: { includeForwarding?: boolean } = {}): Promise<InboundRow> {
    const row = await prisma.inboundEmail.findFirst({
      where: {
        id,
        operatorId: actor.operatorId,
        status: options.includeForwarding ? { not: 'ignored' } : { notIn: ['forwarding', 'ignored'] },
      },
      include: { reservation: { select: { reference: true } } },
    });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'Email not found', 'not_found');
    return row;
  }

  private view(r: InboundRow): InboundEmailView {
    return {
      id: r.id,
      status: r.status,
      fromAddress: r.fromAddress,
      fromName: r.fromName,
      subject: r.subject,
      textBody: r.textBody,
      provider: r.provider,
      parsed: (r.parsed as unknown as ParsedBooking | null) ?? null,
      // 15/10/2026: the plate is no longer missing (a row written before still lists it, until its catch-up).
      missing: missingOf(r.missing).filter(key => key !== 'plate'),
      reservationId: r.reservationId,
      reservationReference: r.reservation?.reference ?? null,
      reading: readingOf(r.reading),
      // Only while Plazo reads it again by itself (retryReading): never on a mail handled or archived meanwhile, nor older.
      readingOutage: TO_CHECK.includes(r.status) && Date.now() - r.receivedAt.getTime() <= READING_RETRY_WINDOW_MS ? outageOf(r.reading) : null,
      analysedAt: r.analysedAt?.toISOString() ?? null,
      pageLookup: pageLookupOf(r.pageLookup),
      change: changeOf(r.change),
      autoRetries: r.autoRetries,
      autoRetryAt: nextAutoRetry(autoRetryCandidate(r))?.toISOString() ?? null,
      receivedAt: r.receivedAt.toISOString(),
    };
  }

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
  }
}

type InboundRow = {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  textBody: string | null;
  provider: string | null;
  parsed: Prisma.JsonValue | null;
  missing: Prisma.JsonValue | null;
  reading: Prisma.JsonValue | null;
  recipients: string[];
  links: string[];
  pageLookup: Prisma.JsonValue | null;
  change: Prisma.JsonValue | null;
  analysedAt: Date | null;
  autoRetries: number;
  reservationId: string | null;
  receivedAt: Date;
  reservation: { reference: string } | null;
};

/** What the schedule of Plazo's own re-analyses reads of a row (domain/inbound-retry.ts). */
function autoRetryCandidate(r: InboundRow) {
  return {
    status: r.status,
    reservationId: r.reservationId,
    hasText: !!r.textBody,
    // A refusal of Allopark (429, Cloudflare block) is left to the staff, like a captcha.
    pageOutcome: pageLookupOf(r.pageLookup)?.refused ? 'refused' : (pageLookupOf(r.pageLookup)?.outcome ?? null),
    autoRetries: r.autoRetries,
    analysedAt: r.analysedAt,
    receivedAt: r.receivedAt,
  };
}

/** The booking fields as stored (null for an email nothing was read from, or a Gmail confirmation's code). */
function storedParsed(value: Prisma.JsonValue | null): ParsedBooking | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return typeof (value as Record<string, unknown>).provider === 'string' ? (value as unknown as ParsedBooking) : null;
}

function missingOf(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

const isSet = (value: unknown) => value !== undefined && value !== null && value !== '';

/** The reading as stored, or null for a row written before L-A or never read (an outage alone included). */
function readingOf(value: Prisma.JsonValue | null): ReadingMeta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== 'string') return null;
  return {
    kind: v.kind as ReadingMeta['kind'],
    provider: typeof v.provider === 'string' ? v.provider : null,
    confidence: typeof v.confidence === 'number' ? v.confidence : 0,
    summary: typeof v.summary === 'string' ? v.summary : '',
    model: typeof v.model === 'string' ? v.model : '',
    ...(v.source === 'rules' ? { source: 'rules' as const, ...(typeof v.rule === 'string' ? { rule: v.rule } : {}) } : {}),
  };
}

/** 16/10/2026: the outage stored with the reading (`reading.outage`): Claude could not read the email, which waits for it. */
function outageOf(value: Prisma.JsonValue | null): ReadingOutage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return readingOutageOf((value as Record<string, unknown>).outage);
}

/** The reading as written on the row: Claude's or the rules', with the outage of an email that waits for Claude. */
function storedReading(reading: ReadingMeta | null, outage: ReadingOutage | null | undefined): Prisma.InputJsonValue {
  return { ...(reading ?? {}), ...(outage ? { outage: { cause: outage.cause, at: outage.at } } : {}) } as unknown as Prisma.InputJsonValue;
}

/** Claude's reading only (a reading of the rules says nothing of what Claude made of the email), or null. */
function claudeReading(reading: ReadingMeta | null): ReadingMeta | null {
  return reading && reading.source !== 'rules' ? reading : null;
}

/** Claude's answer as kept on the row. */
function readingMetaOf(attempt: Extract<ReadingAttempt, { outcome: 'answered' }>): ReadingMeta {
  const { kind, provider, confidence, summary } = attempt.reading;
  return { kind, provider, confidence, summary, model: attempt.model };
}

/** The lookup as stored: the page's link only for a failure, and never once the email has its booking. */
function storedPageLookup(lookup: PageLookupView, linked: boolean): Prisma.InputJsonValue {
  const url = !linked && lookup.outcome !== 'read' ? lookup.url : null;
  return { outcome: lookup.outcome, url, at: lookup.at, ...(lookup.refused ? { refused: true } : {}) };
}

/** The Allopark page's lookup as stored, or null (never tried, purged, or a row written before 10/10/2026). */
function pageLookupOf(value: Prisma.JsonValue | null): PageLookupView | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const outcome = PAGE_OUTCOMES.find(o => o === v.outcome);
  if (!outcome || typeof v.at !== 'string') return null;
  const url = outcome !== 'read' && typeof v.url === 'string' && isAlloparkUrl(v.url) ? v.url : null;
  return { outcome, url, at: v.at, ...(v.refused === true ? { refused: true } : {}) };
}

/** 10/10/2026 (« C'est une modification »): the change as stored (nulls left out). */
function storedChange(change: InboundChangeView): Prisma.InputJsonValue {
  return {
    applied: change.applied,
    ...(change.reason ? { reason: change.reason } : {}),
    ...(change.reservationId ? { reservationId: change.reservationId } : {}),
    ...(change.reference ? { reference: change.reference } : {}),
    changes: change.changes.map(c => ({ field: c.field, from: c.from, to: c.to })),
    at: change.at,
  };
}

const isChangeValue = (value: unknown): value is string | number | null => value === null || typeof value === 'string' || typeof value === 'number';

/** The change as stored, or null (none, purged, attached, or a row written before 10/10/2026). */
function changeOf(value: Prisma.JsonValue | null): InboundChangeView | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.applied !== 'boolean' || typeof v.at !== 'string' || !Array.isArray(v.changes)) return null;
  const changes = v.changes.flatMap(item => {
    const c = item as Record<string, unknown> | null;
    const field = IMPORT_CHANGE_FIELDS.find(f => f === c?.field);
    return field && c && isChangeValue(c.from ?? null) && isChangeValue(c.to ?? null)
      ? [{ field: field as ImportChangeField, from: (c.from ?? null) as string | number | null, to: (c.to ?? null) as string | number | null }]
      : [];
  });
  return {
    applied: v.applied,
    reason: IMPORT_CHANGE_REASONS.find(r => r === v.reason) ?? null,
    reservationId: typeof v.reservationId === 'string' ? v.reservationId : null,
    reference: typeof v.reference === 'string' ? v.reference : null,
    changes,
    at: v.at,
  };
}

/** A row id made before the row is written (cuid-like: « c », the time in base 36, 16 random hex digits). */
function newRowId(): string {
  return `c${Date.now().toString(36)}${randomBytes(8).toString('hex')}`;
}

function forwardingView(row: { parsed: Prisma.JsonValue | null; receivedAt: Date } | null): InboundSettings['forwarding'] {
  const parsed = row?.parsed as { code?: unknown; link?: unknown; requester?: unknown } | null | undefined;
  const code = typeof parsed?.code === 'string' ? parsed.code : null;
  const link = typeof parsed?.link === 'string' ? parsed.link : null;
  if (!row || (!code && !link)) return null;
  return {
    provider: 'gmail',
    code,
    link,
    requester: typeof parsed?.requester === 'string' ? parsed.requester : null,
    receivedAt: row.receivedAt.toISOString(),
  };
}

/**
 * The email's allopark.com links: those parseRawEmail read from the whole bodies (10/10/2026), else those of the
 * payload's bodies (the former JSON payload); kept by the rules of alloparkLinks either way (confirmation pages whole
 * and first, the others without their query, 10 at most).
 */
function linksOf(item: InboundItem): string[] {
  if (Array.isArray(item.Links)) return alloparkLinks(null, item.Links.filter((link): link is string => typeof link === 'string').join('\n'));
  return alloparkLinks(item.RawHtmlBody, item.RawTextBody);
}

/** The fields a booking still lacks before it can be created without staff. */
function missingForImport(booking: ParsedBooking): (typeof REQUIRED_FOR_IMPORT)[number][] {
  return REQUIRED_FOR_IMPORT.filter(key => !booking[key]);
}

/** 15/10/2026: the fields Plazo still looks for (Allopark's page, Claude): the required ones and the plate. */
function soughtForImport(booking: ParsedBooking): (typeof SOUGHT_FOR_IMPORT)[number][] {
  return SOUGHT_FOR_IMPORT.filter(key => !booking[key]);
}

const NAME_KEYS: readonly ('customerName' | 'customerFirstName' | 'customerLastName')[] = ['customerName', 'customerFirstName', 'customerLastName'];

/** An importer's reading completed by Claude's: every field the importer found stays, Claude's fill the empty ones. */
export function fillGaps(found: ParsedBooking, read: ParsedBooking): ParsedBooking {
  const filled: ParsedBooking = { ...found };
  for (const [key, value] of Object.entries(read) as [keyof ParsedBooking, ParsedBooking[keyof ParsedBooking]][]) {
    if (key === 'provider' || (NAME_KEYS as readonly string[]).includes(key) || value === undefined || value === null || value === '') continue;
    if (filled[key] === undefined || filled[key] === null || filled[key] === '') (filled as unknown as Record<string, unknown>)[key] = value;
  }
  // The name goes as a whole (09/10/2026): Claude's when the importer read none; Claude's first and last name apart
  // only when they rebuild the importer's name ("Claire Durand" read as one field by ParkMundo).
  const importerName = !!(found.customerName || found.customerFirstName || found.customerLastName);
  if (!importerName) {
    for (const key of NAME_KEYS) if (read[key]) filled[key] = read[key];
  } else if (found.customerName && !found.customerFirstName && !found.customerLastName && read.customerFirstName && read.customerLastName) {
    const same = (a: string) => a.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
    if (same(fullName(read.customerFirstName, read.customerLastName)) === same(found.customerName)) {
      filled.customerFirstName = read.customerFirstName;
      filled.customerLastName = read.customerLastName;
    }
  }
  return filled;
}
