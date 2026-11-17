import Anthropic from '@anthropic-ai/sdk';
import { Container, Service } from 'typedi';
import { anthropicApiKey, braveSearchApiKey, forumReplyModel, platformAdminEmails, PRODUCT_NAME, PUBLIC_SITE_URL } from '@/config';
import prisma from '@/database';
import {
  braveResults,
  checkForumReply,
  FORUM_QUERIES,
  FORUM_REPLY_SCHEMA,
  FORUM_SEEN_DAYS,
  FORUM_WATCH_MAX_THREADS,
  ForumThread,
  forumReplyInput,
  forumReplyPrompt,
  forumWatchDay,
  forumWatchEmail,
  hostOf,
  isForumThread,
  SearchResult,
  threadKey,
} from '@/domain/forum-watch';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';

const BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';
/** Brave's free tier answers one search per second. */
const SEARCH_SPACING_MS = 1100;
const SEARCH_TIMEOUT_MS = 8000;
const REPLY_TIMEOUT_MS = 25000;

export interface ForumWatchResult {
  status: 'sent' | 'nothing_new' | 'not_due' | 'already_ran' | 'not_configured' | 'not_sent';
  searches: number;
  found: number;
  drafted: number;
}

/**
 * 17/11/2026: the forum watch (domain/forum-watch.ts). Once a Paris morning: Brave's past week for each search, the
 * discussions about parking at Lyon's airport not mailed yet, a reply drafted by Claude for each, one mail to the
 * platform's administrators. Nothing is ever posted anywhere. Logged without the discussions' text.
 */
@Service()
export class ForumWatchService {
  private notifications = Container.get(NotificationService);
  private client?: Anthropic;
  /** Swapped by the tests. */
  public fetcher: typeof fetch = (...args) => fetch(...args);
  public pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  public async run(now = new Date(), options: { force?: boolean } = {}): Promise<ForumWatchResult> {
    const empty = { searches: 0, found: 0, drafted: 0 };
    const day = forumWatchDay(now) ?? (options.force ? now.toISOString().slice(0, 10) : null);
    if (!day) return { status: 'not_due', ...empty };
    const recipients = platformAdminEmails();
    if (!braveSearchApiKey() || !recipients.length || !this.notifications.canSendEmail()) return { status: 'not_configured', ...empty };
    if (!options.force) {
      const { count } = await prisma.forumWatchRun.createMany({ data: [{ day }], skipDuplicates: true });
      if (!count) return { status: 'already_ran', ...empty };
    }
    await prisma.forumWatchSeen.deleteMany({ where: { seenAt: { lt: new Date(now.getTime() - FORUM_SEEN_DAYS * 86_400_000) } } });

    const { results, searches } = await this.search();
    const candidates = new Map<string, SearchResult>();
    for (const result of results) {
      if (!isForumThread(result)) continue;
      const key = threadKey(result.url);
      if (!candidates.has(key)) candidates.set(key, result);
    }
    const seen = new Set(
      (await prisma.forumWatchSeen.findMany({ where: { key: { in: [...candidates.keys()] } }, select: { key: true } })).map(r => r.key),
    );
    const fresh = [...candidates.entries()].filter(([key]) => !seen.has(key)).slice(0, FORUM_WATCH_MAX_THREADS);
    if (!fresh.length) {
      await this.record(day, 0, options.force);
      logger.info(`[Forum watch] ${searches} searches, nothing new`);
      return { status: 'nothing_new', searches, found: 0, drafted: 0 };
    }

    const threads: ForumThread[] = await Promise.all(
      fresh.map(async ([, result]) => ({ ...result, host: hostOf(result.url) ?? '', reply: await this.draft(result) })),
    );
    const drafted = threads.filter(t => t.reply).length;
    const message = forumWatchEmail(PRODUCT_NAME, { day, threads });
    const names = await prisma.staff.findMany({
      where: { email: { in: recipients, mode: 'insensitive' } },
      select: { email: true, firstName: true, lastName: true },
    });
    let sent = 0;
    for (const email of recipients) {
      const staff = names.find(s => s.email.toLowerCase() === email);
      const name = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') : '';
      if (await this.notifications.emailStaff({ email, name }, 'forum-watch', day, message)) sent += 1;
    }
    if (!sent) {
      // Not sent: the next pass tries again (until noon), the discussions are not marked.
      if (!options.force) await prisma.forumWatchRun.delete({ where: { day } }).catch(() => undefined);
      return { status: 'not_sent', searches, found: threads.length, drafted };
    }
    await prisma.forumWatchSeen.createMany({ data: fresh.map(([key]) => ({ key })), skipDuplicates: true });
    await this.record(day, threads.length, options.force);
    logger.info(`[Forum watch] ${searches} searches, ${threads.length} discussions mailed, ${drafted} replies drafted`);
    return { status: 'sent', searches, found: threads.length, drafted };
  }

  private async record(day: string, found: number, force?: boolean) {
    if (force) return;
    await prisma.forumWatchRun.update({ where: { day }, data: { found } }).catch(() => undefined);
  }

  /** Every search of the day, one per second; a failed search is skipped (logged with its status only). */
  private async search(): Promise<{ results: SearchResult[]; searches: number }> {
    const results: SearchResult[] = [];
    let searches = 0;
    for (const [i, q] of FORUM_QUERIES.entries()) {
      if (i) await this.pause(SEARCH_SPACING_MS);
      const url = `${BRAVE_URL}?${new URLSearchParams({ q, country: 'FR', search_lang: 'fr', freshness: 'pw', count: '20' })}`;
      try {
        const response = await this.fetcher(url, {
          headers: { Accept: 'application/json', 'X-Subscription-Token': braveSearchApiKey() },
          signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
        });
        searches += 1;
        if (!response.ok) {
          logger.warn(`[Forum watch] Brave answered ${response.status}`);
          if (response.status === 401 || response.status === 403) break;
          continue;
        }
        results.push(...braveResults(await response.json()));
      } catch (error) {
        logger.warn(`[Forum watch] search failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      }
    }
    return { results, searches };
  }

  /** Claude's reply for one discussion, or null (no key, not relevant, refused, failed, or a figure it may have made up). */
  public async draft(thread: SearchResult): Promise<string | null> {
    if (!anthropicApiKey()) return null;
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), timeout: REPLY_TIMEOUT_MS, maxRetries: 0 });
    try {
      const response = await this.client.messages.create({
        model: forumReplyModel(),
        max_tokens: 2000,
        system: forumReplyPrompt(PRODUCT_NAME, PUBLIC_SITE_URL || 'https://www.plazo.fr'),
        output_config: { effort: 'low', format: { type: 'json_schema', schema: FORUM_REPLY_SCHEMA } },
        messages: [{ role: 'user', content: forumReplyInput(thread) }],
      });
      if (response.stop_reason !== 'end_turn') return null;
      const raw = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
      const parsed = JSON.parse(raw) as { relevant?: unknown; reply?: unknown };
      if (parsed.relevant !== true || typeof parsed.reply !== 'string') return null;
      return checkForumReply(parsed.reply);
    } catch (error) {
      logger.warn(`[Forum watch] reply not drafted: ${error instanceof Error ? error.name : 'unknown error'}`);
      return null;
    }
  }
}
