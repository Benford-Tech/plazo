import Anthropic from '@anthropic-ai/sdk';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { anthropicApiKey, blogArticleModel, platformAdminEmails, PRODUCT_NAME } from '@/config';
import prisma, { BlogArticle, Prisma } from '@/database';
import {
  articleWarnings,
  BLOG_AIRPORT_SLUG,
  BLOG_ARTICLE_SCHEMA,
  BLOG_LIMITS,
  BLOG_PLAN_DAYS,
  BLOG_TOPICS_SCHEMA,
  BlogFact,
  blogArticleInput,
  blogArticlePrompt,
  blogReviewEmail,
  blogToday,
  blogTopicsInput,
  blogTopicsPrompt,
  blocksPublication,
  cleanBody,
  isDay,
  isSlug,
  LYON_AIRPORT_FACTS,
  mondayOf,
  partnerFacts,
  PLAZO_FACTS,
  readArticle,
  readTopics,
  wordCount,
} from '@/domain/blog';
import { isTestOperatorName } from '@/domain/test-feed';
import { addDays } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

/** One article fits in Vercel's 60 s: the call is bounded below it. */
const WRITE_TIMEOUT_MS = 50000;
const PLAN_TIMEOUT_MS = 30000;
const CLICKS_DAYS = 28;
/** The model the other writings of Plazo use, tried when the blog's model is refused. */
const BLOG_FALLBACK_MODEL = 'claude-opus-5-5';

/** Why a call failed, for the logs: Anthropic's status and message (the prompts hold no personal data). */
function failureOf(error: unknown): string {
  if (error instanceof Anthropic.APIError) return `${error.status ?? '?'} ${(error.message ?? '').replace(/\s+/g, ' ').slice(0, 200)}`;
  return error instanceof Error ? `${error.name} ${error.message.slice(0, 200)}` : 'unknown error';
}

export interface BlogRunResult {
  status: 'written' | 'planned' | 'nothing_to_do' | 'not_configured' | 'failed';
  day: string;
  mailed?: number;
}

type ArticleInput = {
  topic?: unknown;
  query?: unknown;
  slug?: unknown;
  title?: unknown;
  metaTitle?: unknown;
  metaDescription?: unknown;
  intro?: unknown;
  body?: unknown;
  related?: unknown;
};

/**
 * 26/11/2026 (« Un par jour, je valide chaque article », B « Le calendrier de la semaine »): the blog's daily SEO
 * article (domain/blog.ts). Each night Claude plans the week's topics and writes tomorrow's article from Plazo's real
 * facts; it waits as a draft until a platform admin publishes it. Nothing is published on its own.
 */
@Service()
export class BlogService {
  public notifications = Container.get(NotificationService);
  public audit = Container.get(AuditService);
  private client?: Anthropic;

  private anthropic(): Anthropic {
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), maxRetries: 0 });
    return this.client;
  }

  /**
   * One call to Claude with the blog's model; when Anthropic refuses the call itself (400 or 404: a model or a setting it
   * does not take), once more with the model the other writings of Plazo use (27/11/2026: « Écrire maintenant » failed in
   * 20 ms, the reason never logged).
   */
  private async ask(
    params: Omit<Anthropic.MessageCreateParamsNonStreaming, 'model'>,
    timeout: number,
  ): Promise<{ response: Anthropic.Message; model: string }> {
    const first = blogArticleModel();
    try {
      return { response: await this.anthropic().messages.create({ ...params, model: first }, { timeout }), model: first };
    } catch (error) {
      const status = error instanceof Anthropic.APIError ? error.status : undefined;
      logger.warn(`[Blog] ${first} refused: ${failureOf(error)}`);
      if ((status !== 400 && status !== 404) || first === BLOG_FALLBACK_MODEL) throw error;
      const response = await this.anthropic().messages.create({ ...params, model: BLOG_FALLBACK_MODEL }, { timeout });
      return { response, model: BLOG_FALLBACK_MODEL };
    }
  }

  // ---- Facts ---------------------------------------------------------------------------------------------------------

  /** Plazo's real facts of the day: the partner parkings at Lyon and their prices, the airport's figures, Plazo itself. */
  public async facts(now = new Date()): Promise<BlogFact[]> {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'published',
        airport: { slug: BLOG_AIRPORT_SLUG },
        parking: { operator: { status: 'active', archivedAt: null, suspendedAt: null, isDemo: false, prospectDemo: false } },
      },
      select: {
        title: true,
        services: true,
        shuttleMinutes: true,
        parking: {
          select: {
            shuttleTravelMinutes: true,
            extraDayPriceCents: true,
            pricingTiers: { select: { days: true, priceCents: true } },
            operator: { select: { name: true } },
          },
        },
      },
      orderBy: { title: 'asc' },
    });
    const partners = listings
      .filter(l => !isTestOperatorName(l.parking.operator.name))
      .map(l => ({
        title: l.title,
        services: l.services,
        shuttleMinutes: l.shuttleMinutes ?? l.parking.shuttleTravelMinutes,
        tiers: l.parking.pricingTiers,
        extraDayPriceCents: l.parking.extraDayPriceCents,
      }));
    return [...PLAZO_FACTS, ...partnerFacts(partners, blogToday(now)), ...LYON_AIRPORT_FACTS];
  }

  // ---- Planning and writing -------------------------------------------------------------------------------------------

  private async takenTitles(exceptId?: string): Promise<string[]> {
    const rows = await prisma.blogArticle.findMany({
      where: { status: { in: ['published', 'draft', 'planned'] }, ...(exceptId ? { id: { not: exceptId } } : {}) },
      orderBy: { dueOn: 'desc' },
      take: 120,
      select: { title: true, topic: true },
    });
    return rows.map(r => r.title || r.topic);
  }

  /** The Search Console queries that show the site, best first (no brand query). */
  private async queries(now: Date) {
    const from = addDays(blogToday(now), -CLICKS_DAYS);
    const rows = await prisma.searchConsoleRow.groupBy({
      by: ['query'],
      where: { date: { gte: from }, NOT: { query: { contains: 'plazo', mode: 'insensitive' } } },
      _sum: { impressions: true },
      orderBy: { _sum: { impressions: 'desc' } },
      take: 40,
    });
    return rows.map(r => ({ query: r.query, impressions: r._sum.impressions ?? 0 }));
  }

  /** Plans a topic for each day of the next week (from tomorrow) that has none; one call to Claude. */
  public async plan(now = new Date()): Promise<number> {
    if (!anthropicApiKey()) return 0;
    const tomorrow = addDays(blogToday(now), 1);
    const days = Array.from({ length: BLOG_PLAN_DAYS }, (_, i) => addDays(tomorrow, i));
    const existing = new Set((await prisma.blogArticle.findMany({ where: { dueOn: { in: days } }, select: { dueOn: true } })).map(r => r.dueOn));
    const free = days.filter(d => !existing.has(d));
    if (!free.length) return 0;
    const [taken, queries] = await Promise.all([this.takenTitles(), this.queries(now)]);
    try {
      const { response } = await this.ask(
        {
          max_tokens: 2000,
          system: blogTopicsPrompt(PRODUCT_NAME),
          output_config: { effort: 'low', format: { type: 'json_schema', schema: BLOG_TOPICS_SCHEMA } },
          messages: [{ role: 'user', content: blogTopicsInput({ days: free, taken, queries }) }],
        },
        PLAN_TIMEOUT_MS,
      );
      if (response.stop_reason !== 'end_turn') return 0;
      const topics = readTopics(JSON.parse(textOf(response)), free.length);
      const { count } = await prisma.blogArticle.createMany({
        data: topics.map((t, i) => ({ dueOn: free[i], topic: t.topic, query: t.query })),
        skipDuplicates: true,
      });
      logger.info(`[Blog] ${count} topics planned`);
      return count;
    } catch (error) {
      logger.warn(`[Blog] topics not planned: ${failureOf(error)}`);
      return 0;
    }
  }

  /** Claude's article for `article` (a first version, or a rewrite with the admin's instruction); saved as a draft. */
  private async compose(article: BlogArticle, instruction: string | null, now: Date): Promise<BlogArticle> {
    const facts = await this.facts(now);
    const taken = await this.takenTitles(article.id);
    const previous = article.body && article.title ? { title: article.title, intro: article.intro ?? '', body: article.body } : null;
    let model = blogArticleModel();
    let draft: ReturnType<typeof readArticle> = null;
    let failure = 'no_answer';
    try {
      const answer = await this.ask(
        {
          max_tokens: 8000,
          system: blogArticlePrompt(PRODUCT_NAME),
          output_config: { effort: 'low', format: { type: 'json_schema', schema: BLOG_ARTICLE_SCHEMA } },
          messages: [
            {
              role: 'user',
              content: blogArticleInput({ day: article.dueOn, topic: article.topic, query: article.query, facts, taken, previous, instruction }),
            },
          ],
        },
        WRITE_TIMEOUT_MS,
      );
      const response = answer.response;
      model = answer.model;
      if (response.stop_reason === 'end_turn') draft = readArticle(JSON.parse(textOf(response)), article.topic);
      else failure = response.stop_reason ?? 'no_answer';
    } catch (error) {
      failure = failureOf(error);
    }
    if (!draft) {
      logger.warn(`[Blog] article of ${article.dueOn} not written: ${failure}`);
      // A rewrite that fails keeps the version the admin had.
      if (previous) throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude did not write the article', 'ai_failed');
      return prisma.blogArticle.update({ where: { id: article.id }, data: { status: 'failed', error: failure.slice(0, 200) } });
    }
    const slug = await this.freeSlug(draft.slug, article.id);
    const warnings = articleWarnings(draft, facts);
    return prisma.blogArticle.update({
      where: { id: article.id },
      data: {
        status: article.status === 'published' ? 'published' : 'draft',
        slug: article.status === 'published' ? article.slug : slug,
        title: draft.title,
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
        intro: draft.intro,
        body: draft.body,
        related: draft.related,
        sources: draft.sources,
        facts: facts as unknown as Prisma.InputJsonValue,
        warnings,
        wordCount: wordCount(draft.intro, draft.body),
        model,
        error: null,
        writtenAt: now,
        rejectedAt: null,
      },
    });
  }

  /** An address no other article holds: the one asked, else with -2, -3… */
  private async freeSlug(wanted: string, exceptId: string): Promise<string> {
    const base = isSlug(wanted) ? wanted : 'article';
    for (let i = 1; i < 50; i++) {
      const slug = i === 1 ? base : `${base.slice(0, BLOG_LIMITS.slug - 4)}-${i}`;
      const other = await prisma.blogArticle.findUnique({ where: { slug }, select: { id: true } });
      if (!other || other.id === exceptId) return slug;
    }
    return `${base.slice(0, 60)}-${Date.now().toString(36)}`;
  }

  /**
   * GET /internal/cron/blog: `step=plan` plans the coming week; otherwise tomorrow's article is written (its topic
   * planned first if none) and the admins are mailed. A day already written is left alone.
   */
  public async run(now = new Date(), options: { step?: string; day?: string } = {}): Promise<BlogRunResult> {
    const day = options.day && isDay(options.day) ? options.day : addDays(blogToday(now), 1);
    if (!anthropicApiKey()) return { status: 'not_configured', day };
    if (options.step === 'plan') return { status: (await this.plan(now)) ? 'planned' : 'nothing_to_do', day };
    let article = await prisma.blogArticle.findUnique({ where: { dueOn: day } });
    if (!article) {
      await this.plan(now);
      article = await prisma.blogArticle.findUnique({ where: { dueOn: day } });
      if (!article) return { status: 'failed', day };
    }
    if (article.status !== 'planned' && article.status !== 'failed') return { status: 'nothing_to_do', day };
    const written = await this.compose(article, null, now);
    if (written.status !== 'draft') return { status: 'failed', day };
    return { status: 'written', day, mailed: await this.mail(written) };
  }

  private async mail(article: BlogArticle): Promise<number> {
    const recipients = platformAdminEmails();
    if (!recipients.length || !this.notifications.canSendEmail()) return 0;
    const message = blogReviewEmail(PRODUCT_NAME, {
      day: article.dueOn,
      title: article.title ?? article.topic,
      topic: article.topic,
      warnings: (article.warnings as string[] | null) ?? [],
      url: this.notifications.proUrl(`/plateforme/articles?semaine=${mondayOf(article.dueOn)}&article=${article.id}`),
    });
    let sent = 0;
    for (const email of recipients) {
      if (await this.notifications.emailStaff({ email, name: '' }, 'blog-review', article.dueOn, message)) sent += 1;
    }
    if (sent) await prisma.blogArticle.update({ where: { id: article.id }, data: { mailedAt: new Date() } });
    return sent;
  }

  // ---- Platform (review) ---------------------------------------------------------------------------------------------

  private async clicksBySlug(now: Date): Promise<Map<string, number>> {
    const from = addDays(blogToday(now), -CLICKS_DAYS);
    const rows = await prisma.searchConsoleRow.groupBy({
      by: ['page'],
      where: { date: { gte: from }, page: { contains: '/blog/' } },
      _sum: { clicks: true },
    });
    const bySlug = new Map<string, number>();
    for (const r of rows) {
      const slug = r.page.split('/blog/')[1]?.split(/[?#/]/)[0];
      if (slug) bySlug.set(slug, (bySlug.get(slug) ?? 0) + (r._sum.clicks ?? 0));
    }
    return bySlug;
  }

  private viewOf(a: BlogArticle, clicks?: Map<string, number>) {
    return {
      id: a.id,
      dueOn: a.dueOn,
      status: a.status,
      topic: a.topic,
      query: a.query,
      slug: a.slug,
      title: a.title,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      intro: a.intro,
      body: a.body,
      related: (a.related as string[] | null) ?? [],
      sources: (a.sources as string[] | null) ?? [],
      warnings: (a.warnings as string[] | null) ?? [],
      wordCount: a.wordCount,
      model: a.model,
      error: a.error,
      writtenAt: a.writtenAt,
      publishedAt: a.publishedAt,
      rejectedAt: a.rejectedAt,
      clicks: a.slug && clicks ? (clicks.get(a.slug) ?? 0) : null,
    };
  }

  /** GET /internal/platform/blog?semaine=: the week from its Monday, and the counters. */
  public async week(from: unknown, now = new Date()) {
    const today = blogToday(now);
    const monday = mondayOf(isDay(from) ? from : today);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    const [articles, published, toReview, clicks] = await Promise.all([
      prisma.blogArticle.findMany({ where: { dueOn: { in: days } } }),
      prisma.blogArticle.count({ where: { status: 'published' } }),
      prisma.blogArticle.count({ where: { status: 'draft' } }),
      this.clicksBySlug(now),
    ]);
    let total = 0;
    for (const n of clicks.values()) total += n;
    return {
      today,
      monday,
      configured: !!anthropicApiKey(),
      counts: { published, toReview, clicks: total },
      days: days.map(day => {
        const a = articles.find(x => x.dueOn === day);
        return { day, article: a ? this.viewOf(a, clicks) : null };
      }),
    };
  }

  private async find(id: string): Promise<BlogArticle> {
    const article = await prisma.blogArticle.findUnique({ where: { id } });
    if (!article) throw new HttpException(httpStatus.NOT_FOUND, 'Article not found', 'not_found');
    return article;
  }

  public async get(id: string) {
    return this.viewOf(await this.find(id), await this.clicksBySlug(new Date()));
  }

  private record(actor: AuthenticatedStaff, action: string, id: string, details: Prisma.InputJsonValue = {}) {
    return this.audit.record(
      { id: actor.id, operatorId: actor.actingAs?.realOperatorId ?? actor.operatorId },
      { action, entityType: 'blog_article', entityId: id, details },
    );
  }

  /** PUT /internal/platform/blog/:id: the admin's corrections (a planned day: its topic and query only). */
  public async update(actor: AuthenticatedStaff, id: string, input: ArticleInput) {
    const article = await this.find(id);
    const fields: Record<string, string> = {};
    const data: Prisma.BlogArticleUpdateInput = {};
    const str = (key: keyof ArticleInput, max: number, required = false): string | null | undefined => {
      const value = input[key];
      if (value === undefined) return undefined;
      if (value !== null && typeof value !== 'string') {
        fields[key] = 'invalid';
        return undefined;
      }
      const text = key === 'body' ? cleanBody(value ?? '') : (value ?? '').replace(/\s+/g, ' ').trim();
      if (!text && required) fields[key] = 'required';
      else if (text.length > max) fields[key] = 'too_long';
      return text || null;
    };
    const topic = str('topic', BLOG_LIMITS.topic, true);
    const query = str('query', BLOG_LIMITS.query);
    if (topic) data.topic = topic;
    if (query !== undefined) data.query = query?.toLowerCase() ?? null;
    if (article.status !== 'planned') {
      const title = str('title', BLOG_LIMITS.title, true);
      const metaTitle = str('metaTitle', BLOG_LIMITS.metaTitle);
      const metaDescription = str('metaDescription', BLOG_LIMITS.metaDescription);
      const intro = str('intro', BLOG_LIMITS.intro);
      const body = str('body', BLOG_LIMITS.body, true);
      const slug = str('slug', BLOG_LIMITS.slug, true);
      if (slug && !isSlug(slug)) fields.slug = 'invalid';
      if (slug && !fields.slug) {
        const other = await prisma.blogArticle.findUnique({ where: { slug }, select: { id: true } });
        if (other && other.id !== id) fields.slug = 'taken';
        // A published address stays: Google already knows it.
        if (article.status === 'published' && slug !== article.slug) fields.slug = 'published';
      }
      if (input.related !== undefined) {
        if (!Array.isArray(input.related) || input.related.some(s => typeof s !== 'string')) fields.related = 'invalid';
        else data.related = [...new Set(input.related as string[])].slice(0, 4);
      }
      if (title) data.title = title;
      if (metaTitle !== undefined) data.metaTitle = metaTitle;
      if (metaDescription !== undefined) data.metaDescription = metaDescription;
      if (intro !== undefined) data.intro = intro;
      if (body) data.body = body;
      if (slug) data.slug = slug;
    }
    if (Object.keys(fields).length) throw new ValidationException(fields);
    if (article.status !== 'planned') {
      const merged = {
        title: (data.title as string | undefined) ?? article.title ?? '',
        metaTitle: data.metaTitle !== undefined ? (data.metaTitle as string | null) : article.metaTitle,
        metaDescription: data.metaDescription !== undefined ? (data.metaDescription as string | null) : article.metaDescription,
        intro: data.intro !== undefined ? (data.intro as string | null) : article.intro,
        body: (data.body as string | undefined) ?? article.body ?? '',
      };
      data.warnings = articleWarnings(merged, (article.facts as unknown as BlogFact[] | null) ?? []);
      data.wordCount = wordCount(merged.intro, merged.body);
    }
    const saved = await prisma.blogArticle.update({ where: { id }, data });
    await this.record(actor, 'blog.updated', id, { fields: Object.keys(data).filter(k => k !== 'warnings' && k !== 'wordCount') });
    return this.viewOf(saved);
  }

  /** POST …/:id/rewrite: a new version by Claude, with the admin's instruction (a planned or failed day: its first version). */
  public async rewrite(actor: AuthenticatedStaff, id: string, instruction: unknown) {
    if (!anthropicApiKey()) throw new HttpException(httpStatus.CONFLICT, 'Writing needs an Anthropic API key', 'ai_unavailable');
    const article = await this.find(id);
    const text = typeof instruction === 'string' ? instruction.replace(/\s+/g, ' ').trim() : '';
    if (text.length > BLOG_LIMITS.instruction) throw new ValidationException({ instruction: 'too_long' });
    const saved = await this.compose(article, text || null, new Date());
    if (saved.status === 'failed') throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude did not write the article', 'ai_failed');
    await this.record(actor, 'blog.rewritten', id, { instruction: !!text });
    return this.viewOf(saved);
  }

  /** POST /internal/platform/blog/write { day }: writes a day now (its topic planned first when it has none). */
  public async writeDay(actor: AuthenticatedStaff, day: unknown) {
    if (!isDay(day)) throw new ValidationException({ day: 'invalid' });
    if (!anthropicApiKey()) throw new HttpException(httpStatus.CONFLICT, 'Writing needs an Anthropic API key', 'ai_unavailable');
    let article = await prisma.blogArticle.findUnique({ where: { dueOn: day } });
    if (!article) {
      await this.plan(new Date(`${addDays(day, -1)}T12:00:00Z`));
      article = await prisma.blogArticle.findUnique({ where: { dueOn: day } });
      if (!article) throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude did not plan a topic', 'ai_failed');
    }
    if (article.status === 'published') throw new HttpException(httpStatus.CONFLICT, 'Article already published', 'already_published');
    return this.rewrite(actor, article.id, null);
  }

  public async publish(actor: AuthenticatedStaff, id: string, now = new Date()) {
    const article = await this.find(id);
    if (article.status === 'published') throw new HttpException(httpStatus.CONFLICT, 'Article already published', 'already_published');
    if (!article.title || !article.body || !article.slug) throw new HttpException(httpStatus.CONFLICT, 'The article is not written', 'not_written');
    const all = [article.title, article.metaTitle, article.metaDescription, article.intro, article.body].join('\n');
    if (blocksPublication(all)) throw new HttpException(httpStatus.CONFLICT, 'The text mentions something forbidden', 'forbidden_mention');
    const saved = await prisma.blogArticle.update({
      where: { id },
      data: { status: 'published', publishedAt: now, publishedById: actor.id, rejectedAt: null },
    });
    await this.record(actor, 'blog.published', id, { slug: saved.slug });
    return this.viewOf(saved);
  }

  /** POST …/:id/unpublish: back to a draft (the page disappears from the site). */
  public async unpublish(actor: AuthenticatedStaff, id: string) {
    const article = await this.find(id);
    if (article.status !== 'published') throw new HttpException(httpStatus.CONFLICT, 'Article not published', 'not_published');
    const saved = await prisma.blogArticle.update({ where: { id }, data: { status: 'draft', publishedAt: null, publishedById: null } });
    await this.record(actor, 'blog.unpublished', id);
    return this.viewOf(saved);
  }

  public async reject(actor: AuthenticatedStaff, id: string, now = new Date()) {
    const article = await this.find(id);
    if (article.status === 'published') throw new HttpException(httpStatus.CONFLICT, 'Article already published', 'already_published');
    const saved = await prisma.blogArticle.update({ where: { id }, data: { status: 'rejected', rejectedAt: now } });
    await this.record(actor, 'blog.rejected', id);
    return this.viewOf(saved);
  }

  // ---- Public --------------------------------------------------------------------------------------------------------

  private publicOf(a: BlogArticle) {
    return {
      slug: a.slug as string,
      title: a.title as string,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      intro: a.intro,
      publishedAt: a.publishedAt as Date,
      updatedAt: a.updatedAt,
      wordCount: a.wordCount,
    };
  }

  /** GET /public/blog: the published articles, newest first. */
  public async listPublished() {
    const rows = await prisma.blogArticle.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 500 });
    return rows.map(r => this.publicOf(r));
  }

  /** GET /public/blog/:slug: one published article, with three others to read next. */
  public async getPublished(slug: string) {
    const article = await prisma.blogArticle.findFirst({ where: { slug, status: 'published' } });
    if (!article) throw new HttpException(httpStatus.NOT_FOUND, 'Article not found', 'not_found');
    const others = await prisma.blogArticle.findMany({
      where: { status: 'published', id: { not: article.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return {
      ...this.publicOf(article),
      body: article.body as string,
      related: (article.related as string[] | null) ?? [],
      sources: (article.sources as string[] | null) ?? [],
      others: others.map(o => this.publicOf(o)),
    };
  }
}

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
}
