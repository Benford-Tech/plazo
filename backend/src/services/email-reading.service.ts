import Anthropic from '@anthropic-ai/sdk';
import { Service } from 'typedi';
import { anthropicApiKey, emailReadingModel } from '@/config';
import { EMAIL_READING_SCHEMA, emailReadingInput, emailReadingPrompt, readingOf, type EmailReading } from '@/domain/email-reading';
import { logger } from '@/utils/logger';

export interface EmailReadingResult {
  reading: EmailReading;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

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

/**
 * L-A (08/10/2026): Claude reads a forwarded email the importers do not know (another comparator, the
 * operator's own website form, a customer's message) and returns the booking it describes, if any.
 * Every failure answers null: receiving the email never depends on the reading.
 */
@Service()
export class EmailReadingService {
  private client?: Anthropic;

  /** True with an Anthropic API key: without it, the emails wait in "À vérifier" as before. */
  public available(): boolean {
    return anthropicApiKey() !== '';
  }

  public async read(email: EmailToRead): Promise<EmailReadingResult | null> {
    if (!this.available()) return null;
    const model = emailReadingModel();
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), timeout: TIMEOUT_MS, maxRetries: 0 });
    const today = new Date().toLocaleDateString('en-CA', { timeZone: email.timezone }); // YYYY-MM-DD
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model,
        max_tokens: 1500,
        system: emailReadingPrompt({ timezone: email.timezone, today }),
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: EMAIL_READING_SCHEMA } },
        messages: [{ role: 'user', content: emailReadingInput(email) }],
      });
    } catch (error) {
      // Most specific first; none of them stops the email from being stored.
      if (error instanceof Anthropic.AuthenticationError) logger.error('[Inbound] Anthropic rejected the API key: emails are not read');
      else if (error instanceof Anthropic.RateLimitError) logger.warn('[Inbound] Claude is busy: the email waits in "À vérifier"');
      else if (error instanceof Anthropic.APIConnectionTimeoutError)
        logger.warn('[Inbound] Claude did not answer in time: the email waits in "À vérifier"');
      else if (error instanceof Anthropic.APIError) logger.error(`[Inbound] Anthropic answered ${error.status}: ${error.message}`);
      else logger.error(`[Inbound] Anthropic call failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }
    if (response.stop_reason === 'refusal') {
      logger.warn('[Inbound] Claude declined to read an email');
      return null;
    }
    if (response.stop_reason === 'max_tokens') {
      logger.warn('[Inbound] Claude’s reading was cut short');
      return null;
    }
    const text = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')?.text ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.warn('[Inbound] Claude’s reading is not JSON');
      return null;
    }
    const reading = readingOf(parsed);
    if (!reading) {
      logger.warn('[Inbound] Claude’s reading does not match the expected shape');
      return null;
    }
    return { reading, model, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
  }
}
