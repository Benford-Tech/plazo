import { Service } from 'typedi';
import { isAlloparkUrl, MAX_PAGES, parseAlloparkPage } from '@/domain/importers/allopark-page';
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

/**
 * 10/10/2026: opens Allopark's booking page of an imported email (« Consulter ma réservation ») and reads its form.
 * Only https pages of allopark.com are opened, redirects included; pages that do not answer within 8 s in all, answer
 * an error or show another booking are simply not used (the email then goes on as before: Claude, « À vérifier »).
 * The addresses in the page's link are personal data: nothing of the link is logged.
 */
@Service()
export class AlloparkPageService {
  public async booking(urls: string[], reference: string): Promise<ParsedBooking | null> {
    // One budget for every page and redirect: the webhook still has Claude's 30 s within Vercel's 60.
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    for (const url of urls.slice(0, MAX_PAGES)) {
      if (signal.aborted) break;
      const html = await this.page(url, signal);
      const booking = html ? parseAlloparkPage(html, reference) : null;
      if (booking) return booking;
    }
    return null;
  }

  private async page(start: string, signal: AbortSignal): Promise<string | null> {
    let url = start;
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        if (!isAlloparkUrl(url)) return null;
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'fr' },
          redirect: 'manual',
          signal,
        });
        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
          await response.body?.cancel();
          url = new URL(location, url).toString();
          continue;
        }
        if (!response.ok) {
          await response.body?.cancel();
          logger.warn(`[Allopark] Booking page answered HTTP ${response.status}`);
          return null;
        }
        return await readCapped(response);
      }
      logger.warn('[Allopark] Booking page redirected too many times');
    } catch (error) {
      logger.warn(`[Allopark] Booking page unavailable: ${error instanceof Error ? error.name : 'error'}`);
    }
    return null;
  }
}
