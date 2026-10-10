import { Service } from 'typedi';
import {
  alloparkPageFacts,
  hasAntiRobotCheck,
  isAlloparkPageProtected,
  isAlloparkUrl,
  MAX_PAGES,
  parseAlloparkPage,
} from '@/domain/importers/allopark-page';
import { ParsedBooking } from '@/domain/importers';
import { logger } from '@/utils/logger';

/** Allopark's booking page weighs ~230 KB; a bigger answer is not a booking page. */
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'Mozilla/5.0 (compatible; Plazo/1.0; +https://www.plazo.fr)';

async function readCapped(response: Response): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** What became of one page: its HTML, or why there is none; the last status and path, for the logs. */
interface PageAnswer {
  html: string | null;
  status: number | null;
  /** The path of the last URL asked (after the redirects), without its query: never an address. */
  path: string | null;
  failure?: string;
  /** 10/10/2026: the answer is an anti-robot check (a Cloudflare challenge, a captcha), not the page. */
  protected?: boolean;
  /**
   * 10/10/2026 (« do not hammer Allopark »): Allopark refused Plazo without a check to pass (any 429, a rate limit;
   * a 403 or 503 served by Cloudflare, a block): the other pages of the email are not opened right after.
   */
  refused?: boolean;
}

/**
 * 10/10/2026 (« Prévent captcha »): what became of the booking page of an email. `read`: a page showed this booking;
 * `protected`: Allopark asked for an anti-robot check (captcha, challenge), never passed by Plazo; `unavailable`: an
 * error, the time spent, a redirect elsewhere or too many; `not_found`: every page answered, none with this booking.
 */
export type AlloparkPageOutcome = 'read' | 'protected' | 'unavailable' | 'not_found';

export interface AlloparkPageLookup {
  booking: ParsedBooking | null;
  outcome: AlloparkPageOutcome;
  /**
   * The page the staff open by hand (« Ouvrir la page Allopark »): the first one tried, the most likely, unless it
   * answered without this booking (10/10/2026): then the first one not ruled out; for `protected`, the protected page.
   */
  url: string;
}

/** Statuses Cloudflare answers a challenge with (403 managed challenge, 429 rate limit, 503 « I'm under attack »). */
const CHALLENGE_STATUSES = [403, 429, 503];

/**
 * 10/10/2026: a refusal to stop at, challenge or not: any 429 (Too Many Requests, Cloudflare's « Error 1015 »), and a
 * 403 or 503 served by Cloudflare (« Error 1020 Access denied »), which carries `cf-ray` or `server: cloudflare`.
 * Other errors (a 500, a 502, a timeout) are read past to the next page.
 */
function isRefusal(response: Response): boolean {
  if (response.status === 429) return true;
  if (response.status !== 403 && response.status !== 503) return false;
  return response.headers.has('cf-ray') || /cloudflare/i.test(response.headers.get('server') ?? '');
}

/** "/fr-be/confirmation" of a URL: no query, no fragment, and no segment that could hold an address. */
function pathOf(url: string): string | null {
  try {
    const path = new URL(url).pathname
      .split('/')
      .map(segment => (/@|%40/i.test(segment) ? '…' : segment))
      .join('/');
    return path.slice(0, 120);
  } catch {
    return null;
  }
}

const yesNo = (value: boolean) => (value ? 'yes' : 'no');

/**
 * 10/10/2026: opens Allopark's booking page of an imported email (« Consulter ma réservation ») and reads its form.
 * Only https pages of allopark.com are opened, redirects included; pages that do not answer within 8 s in all, answer
 * an error or show another booking are simply not used (the email then goes on as before: Claude, « À vérifier »).
 * The addresses in the page's link are personal data: nothing of the link is logged but its path. Each page tried is
 * logged (10/10/2026, « tu ne vas pas chercher dans les liens »): status, path, booking form and reference found.
 * 10/10/2026 (« Prévent captcha »): a page that asks for an anti-robot check (a captcha, a Cloudflare challenge) is
 * never passed, solved nor retried: the other pages of the email are not opened either (Allopark is not hammered), and
 * the outcome tells the staff to open the page themselves (pageLookup of the email). A refusal without a check (a 429,
 * a Cloudflare block) also ends the email's pages, as `unavailable`.
 */
@Service()
export class AlloparkPageService {
  public async booking(urls: string[], reference: string): Promise<AlloparkPageLookup> {
    // One budget for every page and redirect: the webhook still has Claude's 30 s within Vercel's 60.
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const pages = urls.slice(0, MAX_PAGES);
    const ref = reference.trim().toUpperCase();
    // 10/10/2026: pages that answered without this booking are not offered to the staff when another one may hold it.
    const ruledOut = new Set<number>();
    const lookup = (outcome: AlloparkPageOutcome, booking: ParsedBooking | null = null, at?: number): AlloparkPageLookup => ({
      booking,
      outcome,
      url: (at !== undefined ? pages[at] : pages.find((_, i) => !ruledOut.has(i))) ?? pages[0] ?? '',
    });
    // `not_found` only when every page tried answered without this booking: one that did not answer may hold it.
    let unanswered = pages.length === 0;
    for (const [index, url] of pages.entries()) {
      const label = `[Allopark] ${ref} page ${index + 1}/${pages.length}`;
      if (signal.aborted) {
        logger.warn(`${label}: not opened, the ${TIMEOUT_MS / 1000} s budget is spent`);
        unanswered = true;
        break;
      }
      const answer = await this.page(url, signal);
      if (answer.protected) {
        logger.warn(
          `[Allopark] ${ref}: page protected by an anti-robot check (captcha), left to the staff (page ${index + 1}/${pages.length}, HTTP ${answer.status} ${answer.path ?? '?'})`,
        );
        // 10/10/2026: the link opens the page that asked for the check, not an earlier one that showed another page.
        return lookup('protected', null, index);
      }
      if (answer.refused) {
        logger.warn(`${label}: ${answer.failure ?? 'refused'}, refused by Allopark: the other pages are not opened`);
        return lookup('unavailable');
      }
      if (!answer.html) {
        logger.warn(`${label}: ${answer.failure ?? 'no answer'}`);
        unanswered = true;
        continue;
      }
      const facts = alloparkPageFacts(answer.html, ref);
      const booking = parseAlloparkPage(answer.html, ref);
      const seen = `HTTP ${answer.status} ${answer.path ?? '?'}, booking form ${yesNo(facts.form)}, reference ${yesNo(facts.reference)}`;
      if (booking) {
        logger.info(`${label}: ${seen}`);
        return lookup('read', booking);
      }
      logger.warn(`${label}: ${seen}, not this booking's page`);
      ruledOut.add(index);
    }
    return lookup(unanswered ? 'unavailable' : 'not_found');
  }

  private async page(start: string, signal: AbortSignal): Promise<PageAnswer> {
    let url = start;
    let status: number | null = null;
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        // Where an outside redirect leads is never logged.
        if (!isAlloparkUrl(url)) {
          return { html: null, status, path: null, failure: status ? `HTTP ${status}, redirected outside allopark.com` : 'not an allopark.com page' };
        }
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'fr' },
          redirect: 'manual',
          signal,
        });
        status = response.status;
        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
          await response.body?.cancel();
          url = new URL(location, url).toString();
          continue;
        }
        if (!response.ok) {
          // 10/10/2026: Cloudflare answers its challenge (« Just a moment… », a captcha) with 403, 429 or 503; its
          // header says so, else the page's markers. Any other error is only read past.
          const challenge = CHALLENGE_STATUSES.includes(response.status);
          const flagged = challenge && /\bchallenge\b/i.test(response.headers.get('cf-mitigated') ?? '');
          const body = challenge && !flagged ? await readCapped(response).catch(() => null) : null;
          if (!challenge || flagged) await response.body?.cancel();
          if (flagged || (body !== null && hasAntiRobotCheck(body))) return { html: null, status, path: pathOf(url), protected: true };
          return { html: null, status, path: pathOf(url), failure: `HTTP ${status} ${pathOf(url) ?? '?'}`, refused: isRefusal(response) };
        }
        const html = await readCapped(response);
        if (html === null) {
          return {
            html,
            status,
            path: pathOf(url),
            failure: `HTTP ${status} ${pathOf(url) ?? '?'}, answer over ${MAX_BYTES / 1_000_000} MB or empty`,
          };
        }
        // A page served without the booking form but with a check to pass (a captcha, Turnstile) is no page either.
        return isAlloparkPageProtected(html) ? { html: null, status, path: pathOf(url), protected: true } : { html, status, path: pathOf(url) };
      }
      return { html: null, status, path: pathOf(url), failure: `HTTP ${status}, more than ${MAX_REDIRECTS} redirects` };
    } catch (error) {
      const name = error instanceof Error ? error.name : 'error';
      return { html: null, status, path: pathOf(url), failure: `unavailable (${name}) at ${pathOf(url) ?? '?'}` };
    }
  }
}
