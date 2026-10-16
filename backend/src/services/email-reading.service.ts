import Anthropic from '@anthropic-ai/sdk';
import { Service } from 'typedi';
import { anthropicApiKey, emailReadingModel } from '@/config';
import {
  EMAIL_READING_SCHEMA,
  emailReadingInput,
  emailReadingPrompt,
  outageCauseOf,
  readingOf,
  type EmailReading,
  type ReadingOutage,
  type ReadingOutageCause,
} from '@/domain/email-reading';
import { logger } from '@/utils/logger';

export interface EmailReadingResult {
  reading: EmailReading;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * 16/10/2026: what one reading came to. `answered`: Claude's reading. `declined`: Claude answered but gave no reading
 * (a refusal, an answer cut short or of the wrong shape): trying again would not help. `outage`: Claude could not be
 * reached or refused the call (credit, key, load, time, network…): the email waits and is read again once Claude answers.
 * `unavailable`: Plazo has no Anthropic key.
 */
export type ReadingAttempt =
  | ({ outcome: 'answered' } & EmailReadingResult)
  | { outcome: 'declined'; reason: 'refusal' | 'max_tokens' | 'malformed' }
  | { outcome: 'outage'; cause: ReadingOutageCause; status: number | null }
  | { outcome: 'unavailable' };

export interface EmailToRead {
  from: string | null;
  fromName?: string | null;
  subject: string | null;
  text: string;
  /** The parking's timezone: the answer's local times are expressed in it. */
  timezone: string;
}

/** The relay (an Email Worker) waits for the answer: the call is bounded well under its own patience and Vercel's 60 s. */
const TIMEOUT_MS = 30000;
/** An outage of the same cause is logged as an error once, then as a warning, until Claude answers again. */
const OUTAGE_LOG_AGAIN_MS = 3_600_000;

/** What the SDK's error tells of the failure (never the email's content). */
function failureOf(error: unknown): Parameters<typeof outageCauseOf>[0] {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return { timeout: true };
  if (error instanceof Anthropic.APIConnectionError) return { connection: true };
  if (error instanceof Anthropic.APIError) {
    const body = error.error as { error?: { type?: unknown; message?: unknown } } | undefined;
    const message = typeof body?.error?.message === 'string' ? body.error.message : error.message;
    return {
      status: typeof error.status === 'number' ? error.status : null,
      type: error.type ?? (typeof body?.error?.type === 'string' ? body.error.type : null),
      message,
    };
  }
  // An abort of the runtime (a fetch cut by Vercel) reads as no connection; anything else as an unknown failure.
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return { timeout: true };
  return {};
}

/**
 * L-A (08/10/2026): Claude reads a forwarded email the importers do not know (another comparator, the
 * operator's own website form, a customer's message) and returns the booking it describes, if any.
 * Every failure is an outcome: receiving the email never depends on the reading. 16/10/2026: the outcome says why
 * (ReadingAttempt), and the instance remembers its last outage (the dashboard's « Import » service).
 */
@Service()
export class EmailReadingService {
  private client?: Anthropic;
  /** This instance's last call to Claude: when, and its outage if it failed. */
  public lastCall: { at: Date; outage: ReadingOutage | null } | null = null;
  private loggedOutage: { cause: ReadingOutageCause; at: number } | null = null;

  /** True with an Anthropic API key: without it, the emails wait in "À vérifier" as before. */
  public available(): boolean {
    return anthropicApiKey() !== '';
  }

  public async read(email: EmailToRead): Promise<ReadingAttempt> {
    if (!this.available()) return { outcome: 'unavailable' };
    const model = emailReadingModel();
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), timeout: TIMEOUT_MS, maxRetries: 0 });
    const today = new Date().toLocaleDateString('en-CA', { timeZone: email.timezone }); // YYYY-MM-DD
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model,
        max_tokens: 4000,
        system: emailReadingPrompt({ timezone: email.timezone, today }),
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: EMAIL_READING_SCHEMA } },
        messages: [{ role: 'user', content: emailReadingInput(email) }],
      });
    } catch (error) {
      return this.outage(error);
    }
    this.lastCall = { at: new Date(), outage: null };
    this.loggedOutage = null;
    if (response.stop_reason === 'refusal') {
      logger.warn('[Inbound] Claude declined to read an email');
      return { outcome: 'declined', reason: 'refusal' };
    }
    if (response.stop_reason === 'max_tokens') {
      logger.warn('[Inbound] Claude’s reading was cut short');
      return { outcome: 'declined', reason: 'max_tokens' };
    }
    const text = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')?.text ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.warn('[Inbound] Claude’s reading is not JSON');
      return { outcome: 'declined', reason: 'malformed' };
    }
    const reading = readingOf(parsed);
    if (!reading) {
      logger.warn('[Inbound] Claude’s reading does not match the expected shape');
      return { outcome: 'declined', reason: 'malformed' };
    }
    return { outcome: 'answered', reading, model, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
  }

  /**
   * A failed call: its cause, remembered, and one log line without the email's content (16/10/2026: a connection that
   * failed has no HTTP status, « Anthropic answered undefined » before).
   */
  private outage(error: unknown): ReadingAttempt {
    const failure = failureOf(error);
    const cause = outageCauseOf(failure);
    const status = failure.status ?? null;
    const now = Date.now();
    this.lastCall = { at: new Date(now), outage: { cause, at: new Date(now).toISOString() } };
    const detail = [status !== null ? `HTTP ${status}` : null, failure.type, failure.message?.slice(0, 200)].filter(Boolean).join(', ');
    const line = `[Inbound] Claude unavailable (${cause}${detail ? `: ${detail}` : ''}): the email waits and is read again once Claude answers`;
    const known = this.loggedOutage && this.loggedOutage.cause === cause && now - this.loggedOutage.at < OUTAGE_LOG_AGAIN_MS;
    if (known) logger.warn(line);
    else {
      logger.error(line);
      this.loggedOutage = { cause, at: now };
    }
    return { outcome: 'outage', cause, status };
  }
}
