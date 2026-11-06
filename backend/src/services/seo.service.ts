import { Service } from 'typedi';
import { searchConsoleConfig } from '@/config';
import prisma from '@/database';
import { Acquisition, cleanLanding, parisDay } from '@/domain/acquisition';
import {
  GOOGLE_TOKEN_URL,
  parseServiceAccount,
  readRows,
  SEARCH_CONSOLE_FIRST_DAYS,
  SEARCH_CONSOLE_KEPT_DAYS,
  SEARCH_CONSOLE_REREAD_DAYS,
  SEARCH_CONSOLE_ROW_LIMIT,
  searchAnalyticsUrl,
  signedAssertion,
  weightedPosition,
} from '@/domain/search-console';
import { addDays, dayBounds } from '@/domain/time';
import { logger } from '@/utils/logger';

const TZ = 'Europe/Paris';
const STATE_ID = 'default';
const VISITS_KEPT_DAYS = 400;
const TIMEOUT_MS = 20_000;
const TOP = 25;
export const SEO_PERIODS = [7, 30, 90] as const;

interface Group {
  key: string;
  bookings: number;
  revenueCents: number;
  visits: number;
}

export interface SeoReport {
  from: string;
  to: string;
  days: number;
  bookings: {
    total: number;
    revenueCents: number;
    search: { count: number; revenueCents: number };
    bySource: { source: string; detail: string; count: number; revenueCents: number }[];
  };
  visits: { total: number; search: number };
  /** Landing pages: visits (all, from search), bookings and revenue. */
  pages: { landing: string; visits: number; searchVisits: number; bookings: number; revenueCents: number }[];
  searchConsole: {
    configured: boolean;
    lastSyncAt: string | null;
    lastDate: string | null;
    lastError: string | null;
    property: string;
    totals: { clicks: number; impressions: number; position: number | null } | null;
    queries: { query: string; page: string; clicks: number; impressions: number; position: number | null; previous: number | null }[];
    pages: { page: string; clicks: number; impressions: number; position: number | null; previous: number | null }[];
  };
}

/**
 * SEO local, measurement (06/11/2026, A + M2): the visits per landing page, the origin of the bookings made on the site and
 * Google Search Console's positions, for Plateforme › Référencement. Never logs a query, a key or a visitor.
 */
@Service()
export class SeoService {
  /** POST /public/visits: one more visit for this day, landing page and origin. */
  public async recordVisit(acquisition: Acquisition, now = new Date()): Promise<void> {
    const landing = cleanLanding(acquisition.landing);
    if (!landing) return;
    const day = parisDay(now);
    await prisma.siteVisitDay.upsert({
      where: { day_landing_source_detail: { day, landing, source: acquisition.source, detail: acquisition.detail } },
      create: { day, landing, source: acquisition.source, detail: acquisition.detail, visits: 1 },
      update: { visits: { increment: 1 } },
    });
  }

  /** Nightly: the last days of Search Console again (Google completes them), the first time 90 days. Never throws. */
  public async syncSearchConsole(now = new Date()): Promise<{ configured: boolean; rows: number; error?: string }> {
    const config = searchConsoleConfig();
    const account = parseServiceAccount(config.credentials);
    if (!account) return { configured: !!config.credentials, rows: 0, ...(config.credentials ? { error: 'credentials_invalid' } : {}) };
    const state = await prisma.searchConsoleState.findUnique({ where: { id: STATE_ID } });
    const end = addDays(parisDay(now), -1);
    const start = state?.lastDate ? addDays(state.lastDate, -SEARCH_CONSOLE_REREAD_DAYS) : addDays(end, -SEARCH_CONSOLE_FIRST_DAYS + 1);
    try {
      const token = await this.accessToken(signedAssertion(account, now));
      const rows = [];
      for (let startRow = 0; ; startRow += SEARCH_CONSOLE_ROW_LIMIT) {
        const page = await this.query(token, config.property, start, end, startRow);
        rows.push(...page);
        if (page.length < SEARCH_CONSOLE_ROW_LIMIT) break;
      }
      // Each day read is replaced as a whole, so a figure Google revised never stays twice.
      const dates: string[] = [];
      for (let day = start; day <= end; day = addDays(day, 1)) dates.push(day);
      await prisma.$transaction([
        prisma.searchConsoleRow.deleteMany({ where: { date: { in: dates } } }),
        prisma.searchConsoleRow.createMany({ data: rows, skipDuplicates: true }),
      ]);
      const total = rows.length;
      const newest = rows.reduce<string | null>((max, r) => (!max || r.date > max ? r.date : max), null);
      const lastDate = newest && (!state?.lastDate || newest > state.lastDate) ? newest : (state?.lastDate ?? null);
      await prisma.searchConsoleState.upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, lastSyncAt: now, lastDate, lastError: null },
        update: { lastSyncAt: now, lastDate, lastError: null },
      });
      return { configured: true, rows: total };
    } catch (error) {
      const code = error instanceof SearchConsoleError ? error.code : 'search_console_error';
      logger.warn(`[SEO] Search Console import failed: ${code}`);
      await prisma.searchConsoleState.upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, lastError: code },
        update: { lastError: code },
      });
      return { configured: true, rows: 0, error: code };
    }
  }

  private async accessToken(assertion: string): Promise<string> {
    const res = await this.fetchJson(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
    });
    const token = (res as { access_token?: unknown }).access_token;
    if (typeof token !== 'string') throw new SearchConsoleError('search_console_auth');
    return token;
  }

  private async query(token: string, property: string, startDate: string, endDate: string, startRow: number) {
    const body = await this.fetchJson(searchAnalyticsUrl(property), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['date', 'query', 'page'], rowLimit: SEARCH_CONSOLE_ROW_LIMIT, startRow }),
    });
    return readRows(body);
  }

  private async fetchJson(url: string, init: RequestInit): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      throw new SearchConsoleError('search_console_unreachable');
    }
    if (res.status === 401 || res.status === 400)
      throw new SearchConsoleError(url === GOOGLE_TOKEN_URL ? 'search_console_auth' : 'search_console_rejected');
    if (res.status === 403) throw new SearchConsoleError('search_console_forbidden');
    if (!res.ok) throw new SearchConsoleError('search_console_error');
    return res.json().catch(() => ({}));
  }

  /** Nightly: visits and Search Console rows older than their keeping. */
  public async purge(now = new Date()): Promise<{ visits: number; searchConsole: number }> {
    const today = parisDay(now);
    const visits = await prisma.siteVisitDay.deleteMany({ where: { day: { lt: addDays(today, -VISITS_KEPT_DAYS) } } });
    const rows = await prisma.searchConsoleRow.deleteMany({ where: { date: { lt: addDays(today, -SEARCH_CONSOLE_KEPT_DAYS) } } });
    return { visits: visits.count, searchConsole: rows.count };
  }

  /** GET /internal/platform/seo?days=: the last 7, 30 or 90 days (today included), Paris time. */
  public async report(days: number, now = new Date()): Promise<SeoReport> {
    const period = (SEO_PERIODS as readonly number[]).includes(days) ? days : 30;
    const to = parisDay(now);
    const from = addDays(to, -(period - 1));
    const start = dayBounds(from, TZ).start;
    const end = dayBounds(to, TZ).end;

    const [bookings, visits] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          channel: 'plazo',
          status: { notIn: ['pending_payment', 'cancelled'] },
          createdAt: { gte: start, lt: end },
          operator: { isDemo: false },
        },
        select: { acquisitionSource: true, acquisitionDetail: true, acquisitionLanding: true, priceCents: true },
      }),
      prisma.siteVisitDay.findMany({ where: { day: { gte: from, lte: to } } }),
    ]);

    const bySource = new Map<string, { source: string; detail: string; count: number; revenueCents: number }>();
    const pages = new Map<string, Group & { searchVisits: number }>();
    const page = (landing: string) => {
      const key = landing || '';
      if (!pages.has(key)) pages.set(key, { key, bookings: 0, revenueCents: 0, visits: 0, searchVisits: 0 });
      return pages.get(key)!;
    };
    let revenue = 0;
    let searchCount = 0;
    let searchRevenue = 0;
    for (const b of bookings) {
      const cents = b.priceCents ?? 0;
      revenue += cents;
      const source = b.acquisitionSource ?? 'unknown';
      const detail = b.acquisitionDetail ?? '';
      const k = `${source}|${detail}`;
      const entry = bySource.get(k) ?? { source, detail, count: 0, revenueCents: 0 };
      entry.count += 1;
      entry.revenueCents += cents;
      bySource.set(k, entry);
      if (source === 'search') {
        searchCount += 1;
        searchRevenue += cents;
      }
      if (b.acquisitionLanding) {
        const p = page(b.acquisitionLanding);
        p.bookings += 1;
        p.revenueCents += cents;
      }
    }
    let visitTotal = 0;
    let visitSearch = 0;
    for (const v of visits) {
      visitTotal += v.visits;
      const p = page(v.landing);
      p.visits += v.visits;
      if (v.source === 'search') {
        visitSearch += v.visits;
        p.searchVisits += v.visits;
      }
    }

    return {
      from,
      to,
      days: period,
      bookings: {
        total: bookings.length,
        revenueCents: revenue,
        search: { count: searchCount, revenueCents: searchRevenue },
        bySource: [...bySource.values()].sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents),
      },
      visits: { total: visitTotal, search: visitSearch },
      pages: [...pages.values()]
        .filter(p => p.key)
        .sort((a, b) => b.bookings - a.bookings || b.visits - a.visits)
        .slice(0, 50)
        .map(p => ({ landing: p.key, visits: p.visits, searchVisits: p.searchVisits, bookings: p.bookings, revenueCents: p.revenueCents })),
      searchConsole: await this.searchConsoleReport(from, to, period),
    };
  }

  private async searchConsoleReport(from: string, to: string, period: number): Promise<SeoReport['searchConsole']> {
    const config = searchConsoleConfig();
    const state = await prisma.searchConsoleState.findUnique({ where: { id: STATE_ID } });
    const base = {
      configured: !!parseServiceAccount(config.credentials),
      lastSyncAt: state?.lastSyncAt?.toISOString() ?? null,
      lastDate: state?.lastDate ?? null,
      lastError: state?.lastError ?? null,
      property: config.property,
    };
    const prevFrom = addDays(from, -period);
    const prevTo = addDays(from, -1);
    const [rows, previous] = await Promise.all([
      prisma.searchConsoleRow.findMany({ where: { date: { gte: from, lte: to } } }),
      prisma.searchConsoleRow.findMany({ where: { date: { gte: prevFrom, lte: prevTo } } }),
    ]);
    if (!rows.length && !previous.length) return { ...base, totals: null, queries: [], pages: [] };

    type R = (typeof rows)[number];
    const groupBy = (list: R[], key: (r: R) => string) => {
      const map = new Map<string, R[]>();
      for (const r of list) map.set(key(r), [...(map.get(key(r)) ?? []), r]);
      return map;
    };
    const sum = (list: R[], f: 'clicks' | 'impressions') => list.reduce((s, r) => s + r[f], 0);
    const round = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

    const prevQueries = groupBy(previous, r => r.query);
    const queries = [...groupBy(rows, r => r.query).entries()].map(([query, list]) => {
      const best = [...groupBy(list, r => r.page).entries()].sort(
        (a, b) => sum(b[1], 'clicks') - sum(a[1], 'clicks') || sum(b[1], 'impressions') - sum(a[1], 'impressions'),
      )[0];
      const prev = prevQueries.get(query);
      return {
        query,
        page: best[0],
        clicks: sum(list, 'clicks'),
        impressions: sum(list, 'impressions'),
        position: round(weightedPosition(list)),
        previous: prev ? round(weightedPosition(prev)) : null,
      };
    });
    const prevPages = groupBy(previous, r => r.page);
    const pages = [...groupBy(rows, r => r.page).entries()].map(([page, list]) => {
      const prev = prevPages.get(page);
      return {
        page,
        clicks: sum(list, 'clicks'),
        impressions: sum(list, 'impressions'),
        position: round(weightedPosition(list)),
        previous: prev ? round(weightedPosition(prev)) : null,
      };
    });
    const byClicks = <T extends { clicks: number; impressions: number }>(a: T, b: T) => b.clicks - a.clicks || b.impressions - a.impressions;
    return {
      ...base,
      totals: { clicks: sum(rows, 'clicks'), impressions: sum(rows, 'impressions'), position: round(weightedPosition(rows)) },
      queries: queries.sort(byClicks).slice(0, TOP),
      pages: pages.sort(byClicks).slice(0, TOP),
    };
  }
}

export class SearchConsoleError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'SearchConsoleError';
  }
}
