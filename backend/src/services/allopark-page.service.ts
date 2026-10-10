import { Service } from 'typedi';
import { alloparkPageFacts, isAlloparkUrl, MAX_PAGES, parseAlloparkPage } from '@/domain/importers/allopark-page';
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
 */
@Service()
export class AlloparkPageService {
  public async booking(urls: string[], reference: string): Promise<ParsedBooking | null> {
    // One budget for every page and redirect: the webhook still has Claude's 30 s within Vercel's 60.
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const pages = urls.slice(0, MAX_PAGES);
    const ref = reference.trim().toUpperCase();
    for (const [index, url] of pages.entries()) {
      const label = `[Allopark] ${ref} page ${index + 1}/${pages.length}`;
      if (signal.aborted) {
        logger.warn(`${label}: not opened, the ${TIMEOUT_MS / 1000} s budget is spent`);
        break;
      }
      const answer = await this.page(url, signal);
      if (!answer.html) {
        logger.warn(`${label}: ${answer.failure ?? 'no answer'}`);
        continue;
      }
      const facts = alloparkPageFacts(answer.html, ref);
      const booking = parseAlloparkPage(answer.html, ref);
      const seen = `HTTP ${answer.status} ${answer.path ?? '?'}, booking form ${yesNo(facts.form)}, reference ${yesNo(facts.reference)}`;
      if (booking) {
        logger.info(`${label}: ${seen}`);
        return booking;
      }
      logger.warn(`${label}: ${seen}, not this booking's page`);
    }
    return null;
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
          await response.body?.cancel();
          return { html: null, status, path: pathOf(url), failure: `HTTP ${status} ${pathOf(url) ?? '?'}` };
        }
        const html = await readCapped(response);
        return html === null
          ? { html, status, path: pathOf(url), failure: `HTTP ${status} ${pathOf(url) ?? '?'}, answer over ${MAX_BYTES / 1_000_000} MB or empty` }
          : { html, status, path: pathOf(url) };
      }
      return { html: null, status, path: pathOf(url), failure: `HTTP ${status}, more than ${MAX_REDIRECTS} redirects` };
    } catch (error) {
      const name = error instanceof Error ? error.name : 'error';
      return { html: null, status, path: pathOf(url), failure: `unavailable (${name}) at ${pathOf(url) ?? '?'}` };
    }
  }
}
