import Anthropic from '@anthropic-ai/sdk';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { anthropicApiKey, listingDescriptionModel, PRODUCT_NAME } from '@/config';
import prisma from '@/database';
import {
  checkDescription,
  descriptionFacts,
  LISTING_DESCRIPTION_SCHEMA,
  listingDescriptionInput,
  listingDescriptionPrompt,
  type DescriptionFact,
} from '@/domain/listing-description';
import { can } from '@/domain/roles';
import { SuggestDescriptionDto } from '@/dtos/listing.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { ParkingService } from './parking.service';

/** The pro space waits for the answer: bounded well under Vercel's 60 s, a short text at medium effort. */
const TIMEOUT_MS = 30000;
/** The pro form defaults a first page to this airport (read-only there): the facts follow it until the page is saved. */
const FORM_DEFAULT_AIRPORT = 'LYS';

export interface DescriptionSuggestion {
  text: string;
  model: string;
}

/**
 * 09/10/2026 (« pouvoir générer une Présentation pour son parking »): Claude writes the « Présentation » of the
 * operator's Plazo page from the parking's real data (`domain/listing-description.ts`), or improves the text the
 * manager already has. Nothing is saved: the pro space puts the text in the field and the manager saves the page.
 */
@Service()
export class ListingDescriptionService {
  public parkings = Container.get(ParkingService);
  private client?: Anthropic;

  public static enabled(): boolean {
    return !!anthropicApiKey();
  }

  public async suggest(actor: AuthenticatedStaff, options: SuggestDescriptionDto = {}): Promise<DescriptionSuggestion> {
    if (!can(actor.role, 'parking:manage')) throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
    if (!ListingDescriptionService.enabled()) {
      throw new HttpException(httpStatus.CONFLICT, 'Writing the presentation needs an Anthropic API key', 'ai_unavailable');
    }
    const facts = await this.facts(actor);
    const current = options.current?.trim() || null;
    const model = listingDescriptionModel();
    const answer = await this.ask(facts, current, model);
    const checked = checkDescription(answer, facts, current);
    if (!checked.ok) {
      // A figure the data does not hold is an invented fact: the text is not offered at all.
      logger.warn(`[Listing] Claude's presentation rejected: ${checked.reason}${checked.figures ? ` (${checked.figures.join(', ')})` : ''}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude wrote something the parking data does not support', 'ai_unreliable', {
        reason: checked.reason,
        ...(checked.figures && { figures: checked.figures }),
      });
    }
    return { text: checked.text, model };
  }

  /** The operator's own data only: its primary parking, its saved page, grid, vehicles, stops and valet files. */
  public async facts(actor: AuthenticatedStaff): Promise<DescriptionFact[]> {
    const parking = await this.parkings.getPrimary(actor);
    const [listing, tiers, vehicles, stops, valetFiles] = await Promise.all([
      prisma.listing.findUnique({ where: { parkingId: parking.id }, include: { airport: true } }),
      prisma.pricingTier.findMany({ where: { parkingId: parking.id }, select: { days: true, priceCents: true } }),
      prisma.shuttleVehicle.findMany({
        where: { operatorId: actor.operatorId, inService: true },
        select: { seats: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.shuttleStop.findMany({
        where: { parkingId: parking.id },
        select: { name: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.parkingFile.count({ where: { parkingId: parking.id, active: true } }),
    ]);
    const airport = listing?.airport ?? (await prisma.airport.findUnique({ where: { code: FORM_DEFAULT_AIRPORT } }));
    return descriptionFacts({ parking, listing, airport, tiers, vehicles, stops, valetFiles });
  }

  /** Claude's text for these facts (public for the tests). */
  public async ask(facts: DescriptionFact[], current: string | null, model = listingDescriptionModel()): Promise<string> {
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), timeout: TIMEOUT_MS, maxRetries: 0 });
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model,
        max_tokens: 4000,
        system: listingDescriptionPrompt(PRODUCT_NAME),
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: LISTING_DESCRIPTION_SCHEMA } },
        messages: [{ role: 'user', content: listingDescriptionInput(facts, current) }],
      });
    } catch (error) {
      // Most specific first: a bad key, a rate limit, a timeout, any other API answer, the network.
      if (error instanceof Anthropic.AuthenticationError) {
        logger.error('[Listing] Anthropic rejected the API key');
        throw new HttpException(httpStatus.CONFLICT, 'The Anthropic API key is not accepted', 'ai_unavailable');
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Claude is busy, try again shortly', 'ai_busy');
      }
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        throw new HttpException(httpStatus.GATEWAY_TIMEOUT, 'Claude did not answer in time', 'ai_timeout');
      }
      if (error instanceof Anthropic.APIError && error.status) {
        // The SDK's message already starts with the status (« 500 {…} »).
        logger.error(`[Listing] Anthropic answered ${error.message}`);
        throw new HttpException(httpStatus.BAD_GATEWAY, `Anthropic answered ${error.status}`, 'ai_failed', {
          reason: error.message.slice(0, 300),
        });
      }
      const reason = error instanceof Error ? error.message : 'unknown error';
      logger.error(`[Listing] Anthropic call failed: ${reason}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude could not be reached', 'ai_failed', { reason: reason.slice(0, 300) });
    }
    if (response.stop_reason === 'refusal') {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude declined to write this presentation', 'ai_refused');
    }
    if (response.stop_reason === 'max_tokens') {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude ran out of room for its answer', 'ai_failed', { reason: 'max_tokens' });
    }
    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');
    let parsed: { text?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude answered something that is not JSON', 'ai_failed', {
        reason: `not JSON: ${raw.slice(0, 120)}`,
      });
    }
    if (typeof parsed?.text !== 'string') {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude answered without a text', 'ai_failed', { reason: 'no text' });
    }
    logger.info(`[Listing] presentation written by ${model} (${response.usage.input_tokens} in, ${response.usage.output_tokens} out)`);
    return parsed.text;
  }
}
