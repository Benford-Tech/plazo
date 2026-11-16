import { Container, Service } from 'typedi';
import { PLAZO_APP_STORE_URL, PLAZO_PLAY_STORE_URL, PRODUCT_COMPANY, PRODUCT_NAME, SUPPORT_EMAIL } from '@/config';
import prisma from '@/database';
import { travellerStoreBadges } from '@/domain/account-messages';
import { publisherLine } from '@/domain/prospecting';
import { promotionPath } from '@/domain/promotion';
import { travellerEmail } from '@/domain/traveller-email';
import {
  CAMPAIGN_AUDIENCE_MS,
  CAMPAIGN_OFFERS,
  CampaignInput,
  CampaignOffer,
  campaignEmail,
  campaignEmailHash,
  nextCampaignAt,
  readCampaign,
} from '@/domain/traveller-campaign';
import { HttpException } from '@/utils/httpException';
import { ValidationException } from '@/middlewares/validation.middleware';
import { NotificationService } from '@/services/notification.service';
import { PublicService } from '@/services/public.service';
import { TravellerWelcomeService } from '@/services/traveller-welcome.service';
import { logger } from '@/utils/logger';

/** The platform's test operator, « … (tests) » (isTestOperatorName), as a Postgres pattern. */
const TEST_OPERATOR_PATTERN = '\\(tests\\)\\s*$';

/** Emails sent by one 15-minute pass (and right after the start). */
export const CAMPAIGN_PER_PASS = 120;
/** A claim older than this is taken again (the pass that held it died). */
const CLAIM_STALE_MS = 15 * 60_000;

interface AudienceRow {
  id: string;
  email: string;
  firstName: string | null;
}

/**
 * 15/11/2026 (« Mail de promotion à Plazo… », direction C, « tous les voyageurs », « campagne à la main »): the platform's
 * emails to the travellers. One address once per campaign (its latest booking gives the first name and the opt-out link),
 * never an address that opted out (the welcome email's list), a comparator's or robot's address, an anonymized or deleted
 * booking, a stay ended more than 3 years ago, nor a booking of the demo or test operators. Sent in batches by the 15-minute
 * pass, each address claimed first; the address is erased from the row once its email is sent.
 */
@Service()
export class TravellerCampaignService {
  public notifications = Container.get(NotificationService);
  public publicService = Container.get(PublicService);
  public welcome = Container.get(TravellerWelcomeService);

  /** The addresses a campaign would reach now. */
  private async audience(now: Date): Promise<AudienceRow[]> {
    const since = new Date(now.getTime() - CAMPAIGN_AUDIENCE_MS);
    const rows = await prisma.$queryRaw<AudienceRow[]>`
      SELECT DISTINCT ON (lower(trim(r."customerEmail")))
        r.id, lower(trim(r."customerEmail")) AS email, r."customerFirstName" AS "firstName"
      FROM reservations r
      JOIN operators o ON o.id = r."operatorId"
      WHERE r."deletedAt" IS NULL
        AND r."anonymizedAt" IS NULL
        AND r."customerEmail" IS NOT NULL
        AND trim(r."customerEmail") <> ''
        AND r.status <> 'pending_payment'
        AND r."returnAt" >= ${since}
        AND o."isDemo" = false
        AND o."prospectDemo" = false
        AND o.name !~ ${TEST_OPERATOR_PATTERN}
      ORDER BY lower(trim(r."customerEmail")), r."returnAt" DESC, r.id`;
    const optedOut = new Set((await prisma.travellerEmailOptout.findMany({ select: { emailHash: true } })).map(o => o.emailHash));
    return rows.filter(r => travellerEmail(r.email) && !optedOut.has(campaignEmailHash(r.email)));
  }

  public async overview(now: Date = new Date()) {
    const [audience, campaigns] = await Promise.all([
      this.audience(now),
      prisma.travellerCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { createdBy: { select: { firstName: true } } },
      }),
    ]);
    return {
      available: this.notifications.canSendEmail() && !!process.env.SECRET_KEY,
      audience: audience.length,
      nextAt: nextCampaignAt(campaigns[0]?.createdAt ?? null, now)?.toISOString() ?? null,
      from: SUPPORT_EMAIL || null,
      campaigns: campaigns.map(c => ({
        id: c.id,
        subject: c.subject,
        airport: c.airportSlug,
        arrival: c.arrival,
        return: c.return,
        recipients: c.recipients,
        sent: c.sent,
        failed: c.failed,
        skipped: c.skipped,
        createdAt: c.createdAt.toISOString(),
        finishedAt: c.finishedAt?.toISOString() ?? null,
        by: c.createdBy?.firstName ?? null,
      })),
    };
  }

  private read(raw: unknown): CampaignInput {
    const { value, errors } = readCampaign(raw);
    if (Object.keys(errors).length) throw new ValidationException(errors);
    return value;
  }

  /** The parkings of the airport the email shows, with their real price (the stay's total, else the grid's lowest). */
  private async offers(input: CampaignInput): Promise<{ airportName: string; offers: CampaignOffer[] }> {
    if (input.arrival && input.return) {
      const found = await this.publicService.search(input.airport, input.arrival, input.return);
      return {
        airportName: found.airport.name,
        offers: found.results
          .filter(r => !r.isDemo && r.available && r.priceCents !== null)
          .slice(0, CAMPAIGN_OFFERS)
          .map(r => ({
            title: r.title,
            slug: r.slug,
            priceCents: r.priceCents,
            days: r.days,
            forStay: true,
            shuttleMinutes: r.shuttleMinutes ?? null,
            valet: r.services.includes('valet') && !r.services.includes('shuttle'),
          })),
      };
    }
    const found = await this.publicService.airport(input.airport);
    return {
      airportName: found.airport.name,
      offers: found.listings
        .filter(l => !l.isDemo && l.fromPriceCents !== null)
        .sort((a, b) => (a.fromPriceCents ?? 0) - (b.fromPriceCents ?? 0))
        .slice(0, CAMPAIGN_OFFERS)
        .map(l => ({
          title: l.title,
          slug: l.slug,
          priceCents: l.fromPriceCents,
          days: l.fromDays,
          forStay: false,
          shuttleMinutes: l.shuttleMinutes ?? null,
          valet: l.services.includes('valet') && !l.services.includes('shuttle'),
        })),
    };
  }

  private compose(input: CampaignInput, airportName: string, offers: CampaignOffer[], firstName: string, unsubscribeUrl: string) {
    const imagesBase = this.notifications.siteUrl('');
    const dates = input.arrival && input.return ? { arrival: input.arrival, return: input.return } : {};
    const searchUrl = this.notifications.siteUrl(promotionPath({ kind: 'search', airport: input.airport, ...dates })) || 'https://www.plazo.fr';
    return campaignEmail({
      productName: PRODUCT_NAME,
      campaign: input,
      firstName,
      airportName,
      offers,
      searchUrl,
      parkingUrl: slug =>
        this.notifications.siteUrl(promotionPath({ kind: 'parking', airport: input.airport, parking: slug, ...dates })) || searchUrl,
      badges: imagesBase
        ? travellerStoreBadges(PRODUCT_NAME, { badgesBase: imagesBase, playStoreUrl: PLAZO_PLAY_STORE_URL, appStoreUrl: PLAZO_APP_STORE_URL })
        : [],
      imagesBase,
      unsubscribeUrl,
      publisher: publisherLine(PRODUCT_COMPANY) || PRODUCT_NAME,
    });
  }

  private sender(): string | undefined {
    return SUPPORT_EMAIL ? `${PRODUCT_NAME} <${SUPPORT_EMAIL}>` : undefined;
  }

  /** The email as it would leave now, for the page's preview (an example first name, no opt-out link). */
  public async preview(raw: unknown, firstName: string) {
    const input = this.read(raw);
    const { airportName, offers } = await this.offers(input);
    const message = this.compose(input, airportName, offers, firstName, this.notifications.siteUrl('/') || 'https://www.plazo.fr');
    return { subject: message.subject, html: message.html, offers: offers.length };
  }

  /** « M'envoyer un test »: the email to the admin who asks, with « [Test] » in its subject. Nothing is recorded. */
  public async sendTest(raw: unknown, to: { email: string; firstName: string }) {
    if (!this.notifications.canSendEmail()) throw new HttpException(409, 'Email is not configured', 'email_unavailable');
    const input = this.read(raw);
    const { airportName, offers } = await this.offers(input);
    const message = this.compose(input, airportName, offers, to.firstName, this.notifications.siteUrl('/') || 'https://www.plazo.fr');
    const ok = await this.notifications.emailTraveller(
      { email: to.email, name: to.firstName || to.email },
      'traveller_campaign_test',
      'platform',
      { ...message, subject: `[Test] ${message.subject}` },
      [],
      {},
      this.sender(),
    );
    if (!ok) throw new HttpException(502, 'The email could not be sent', 'email_failed');
    return { to: to.email };
  }

  /** « Envoyer à N voyageurs »: the campaign, its parkings' prices taken now, its addresses, then a first batch. */
  public async start(raw: unknown, staffId: string, operatorId: string, now: Date = new Date()) {
    if (!this.notifications.canSendEmail() || !process.env.SECRET_KEY) {
      throw new HttpException(409, 'Email is not configured', 'email_unavailable');
    }
    const input = this.read(raw);
    const last = await prisma.travellerCampaign.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
    const next = nextCampaignAt(last?.createdAt ?? null, now);
    if (next) throw new HttpException(429, 'One campaign a week at most', 'campaign_too_soon', { nextAt: next.toISOString() });
    const { offers } = await this.offers(input);
    const audience = await this.audience(now);
    if (!audience.length) throw new HttpException(409, 'Nobody to write to', 'no_audience');
    const campaign = await prisma.travellerCampaign.create({
      data: {
        subject: input.subject,
        title: input.title,
        body: input.body,
        airportSlug: input.airport,
        arrival: input.arrival,
        return: input.return,
        offers: offers as unknown as object,
        createdById: staffId,
        recipients: audience.length,
        createdAt: now,
      },
    });
    for (let i = 0; i < audience.length; i += 1000) {
      await prisma.travellerCampaignRecipient.createMany({
        data: audience.slice(i, i + 1000).map(r => ({
          campaignId: campaign.id,
          emailHash: campaignEmailHash(r.email),
          email: r.email,
          firstName: (r.firstName ?? '').trim() || null,
          reservationId: r.id,
        })),
        skipDuplicates: true,
      });
    }
    await prisma.auditLog
      .create({
        data: {
          operatorId,
          staffId,
          action: 'traveller_campaign.started',
          entityType: 'traveller_campaign',
          entityId: campaign.id,
          details: { recipients: audience.length },
        },
      })
      .catch(() => undefined);
    const first = await this.run(now);
    logger.info(`[TravellerCampaign] Started for ${audience.length} addresses (${first.sent} sent at once)`);
    return { id: campaign.id, recipients: audience.length, sent: first.sent };
  }

  /** The 15-minute pass: the next addresses of the campaigns still sending. Never throws for one address. */
  public async run(now: Date = new Date()): Promise<{ sent: number; failed: number; skipped: number }> {
    const report = { sent: 0, failed: 0, skipped: 0 };
    if (!this.notifications.canSendEmail() || !process.env.SECRET_KEY) return report;
    const stale = new Date(now.getTime() - CLAIM_STALE_MS);
    const claimed = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE traveller_campaign_recipients SET "sendingAt" = ${now}
      WHERE id IN (
        SELECT id FROM traveller_campaign_recipients
        WHERE status = 'pending' AND ("sendingAt" IS NULL OR "sendingAt" < ${stale})
        ORDER BY "campaignId", id
        LIMIT ${CAMPAIGN_PER_PASS}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id`;
    if (!claimed.length) return report;
    const rows = await prisma.travellerCampaignRecipient.findMany({
      where: { id: { in: claimed.map(c => c.id) } },
      include: { campaign: true },
    });
    const airportNames = new Map<string, string>();
    const touched = new Set<string>();
    for (const row of rows) {
      touched.add(row.campaignId);
      let status: 'sent' | 'failed' | 'skipped' = 'skipped';
      try {
        const email = travellerEmail(row.email);
        const optedOut = email ? await prisma.travellerEmailOptout.findUnique({ where: { emailHash: row.emailHash } }) : null;
        if (email && !optedOut) {
          const c = row.campaign;
          if (!airportNames.has(c.airportSlug)) {
            const airport = await prisma.airport.findFirst({ where: { slug: c.airportSlug }, select: { name: true } });
            airportNames.set(c.airportSlug, airport?.name ?? c.airportSlug);
          }
          const unsubscribeUrl = this.notifications.siteUrl(
            `/api/public/traveller-emails/unsubscribe/${this.welcome.unsubscribeToken(row.reservationId)}`,
          );
          if (unsubscribeUrl) {
            const input: CampaignInput = {
              subject: c.subject,
              title: c.title,
              body: c.body,
              airport: c.airportSlug,
              arrival: c.arrival,
              return: c.return,
            };
            const message = this.compose(
              input,
              airportNames.get(c.airportSlug) ?? c.airportSlug,
              (c.offers as unknown as CampaignOffer[]) ?? [],
              row.firstName ?? '',
              unsubscribeUrl,
            );
            const ok = await this.notifications.emailTraveller(
              { email, name: row.firstName || email },
              'traveller_campaign',
              c.id,
              message,
              [],
              { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
              this.sender(),
            );
            status = ok ? 'sent' : 'failed';
          } else status = 'failed';
        }
      } catch (error) {
        logger.warn(`[TravellerCampaign] An email failed: ${(error as Error).name}`);
        status = 'failed';
      }
      await prisma.travellerCampaignRecipient.update({
        where: { id: row.id },
        data: { status, email: null, firstName: null, sentAt: status === 'sent' ? now : null },
      });
      await prisma.travellerCampaign.update({ where: { id: row.campaignId }, data: { [status]: { increment: 1 } } });
      report[status]++;
    }
    for (const id of touched) {
      const left = await prisma.travellerCampaignRecipient.count({ where: { campaignId: id, status: 'pending' } });
      if (!left) await prisma.travellerCampaign.updateMany({ where: { id, finishedAt: null }, data: { finishedAt: now } });
    }
    return report;
  }
}
