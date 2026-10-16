import 'reflect-metadata';
import Anthropic from '@anthropic-ai/sdk';
import { Container } from 'typedi';
import {
  cleanPhone,
  cleanPlate,
  emailReadingInput,
  emailReadingPrompt,
  outageCauseOf,
  readingOf,
  readingOutageOf,
  toParsedBooking,
  type EmailReading,
} from '@/domain/email-reading';
import { EmailReadingService } from '@/services/email-reading.service';
import { logger } from '@/utils/logger';

/**
 * L-A (08/10/2026): Claude reads the forwarded emails no importer knows. The pure side (answer →
 * booking) and the service with a fake Anthropic client; the API side is in inbound-email.test.ts.
 */

const answer: EmailReading = {
  kind: 'booking',
  provider: 'Parkos',
  externalReference: 'pk-123456',
  arrivalAt: '2026-07-12T06:30',
  returnAt: '2026-07-19T22:15',
  customerName: ' Marie  Dupont ',
  customerFirstName: null,
  customerLastName: null,
  customerPhone: '+33 6 12 34 56 78',
  customerEmail: 'Marie.Dupont@Example.com',
  plate: 'ab 123 cd',
  returnFlight: 'af 1234',
  departureFlight: null,
  passengers: 2,
  priceCents: 18990,
  confidence: 0.92,
  summary: 'Réservation Parkos de Marie Dupont du 12 au 19 juillet',
};

describe('lecture d’un mail par Claude (L-A, 08/10/2026) — conversion', () => {
  it('normalise les champs lus en réservation importable', () => {
    expect(toParsedBooking(answer)).toEqual({
      provider: 'Parkos',
      externalReference: 'pk-123456',
      arrivalAt: '2026-07-12T06:30',
      returnAt: '2026-07-19T22:15',
      customerName: 'Marie Dupont',
      customerPhone: '+33612345678',
      customerEmail: 'marie.dupont@example.com',
      plate: 'AB-123-CD',
      returnFlight: 'AF1234',
      passengers: 2,
      priceCents: 18990,
    });
  });

  it('écarte ce qui n’est pas plausible plutôt que de le corriger', () => {
    const parsed = toParsedBooking({
      ...answer,
      provider: null,
      arrivalAt: '12/07/2026 06:30',
      returnAt: '2026-07-19T22:15',
      customerPhone: '06',
      customerEmail: 'pas-un-mail',
      plate: 'x',
      returnFlight: 'vol du soir',
      passengers: 40,
      priceCents: -5,
    });
    expect(parsed).toEqual({ provider: 'E-mail', externalReference: 'pk-123456', returnAt: '2026-07-19T22:15', customerName: 'Marie Dupont' });
    // A return before the arrival is dropped too: the staff fix the dates from the email.
    expect(toParsedBooking({ ...answer, returnAt: '2026-07-10T08:00' }).returnAt).toBeUndefined();
    expect(toParsedBooking({ ...answer, arrivalAt: '2026-02-30T08:00' }).arrivalAt).toBeUndefined();
  });

  it('garde le prénom et le nom à part quand Claude les distingue, toujours par paire (09/10/2026)', () => {
    expect(toParsedBooking({ ...answer, customerFirstName: ' Marie ', customerLastName: 'DUPONT' })).toMatchObject({
      customerName: 'Marie Dupont',
      customerFirstName: 'Marie',
      customerLastName: 'DUPONT',
    });
    // Without the display name, it is rebuilt from the pair.
    expect(toParsedBooking({ ...answer, customerName: null, customerFirstName: 'Marie', customerLastName: 'Dupont' }).customerName).toBe(
      'Marie Dupont',
    );
    // One without the other: neither is kept, the display name is split when the booking is created.
    const half = toParsedBooking({ ...answer, customerFirstName: 'Marie', customerLastName: null });
    expect(half.customerFirstName).toBeUndefined();
    expect(half.customerLastName).toBeUndefined();
    expect(toParsedBooking({ ...answer, customerName: null, customerFirstName: 'Marie' }).customerName).toBeUndefined();
  });

  it('nettoie téléphones et plaques', () => {
    expect(cleanPhone('06.12.34.56.78')).toBe('0612345678');
    expect(cleanPhone('+33 (0)6 12 34 56 78')).toBe('+33612345678');
    expect(cleanPhone('')).toBeUndefined();
    expect(cleanPlate('gk318px')).toBe('GK-318-PX');
    expect(cleanPlate('1234 abc 69')).toBe('1234ABC69');
    expect(cleanPlate(null)).toBeUndefined();
  });

  it('15/10/2026 : une plaque absente est normale ; ce qui n’est pas une plaque est écarté', () => {
    const prompt = emailReadingPrompt({ timezone: 'Europe/Paris', today: '2026-10-15' });
    expect(prompt).toContain('a missing plate is normal');
    expect(prompt).toContain('a plate the email gives is ambiguous');
    expect(toParsedBooking({ ...answer, plate: 'INCONNUE' })).not.toHaveProperty('plate');
    expect(toParsedBooking({ ...answer, plate: 'XX-XXX-XX' })).not.toHaveProperty('plate');
    expect(toParsedBooking({ ...answer, plate: null })).not.toHaveProperty('plate');
    expect(toParsedBooking({ ...answer, plate: 'AB-123-CD' }).plate).toBe('AB-123-CD');
    expect(toParsedBooking({ ...answer, plate: '1234 abc 69' }).plate).toBe('1234ABC69');
  });

  it('vérifie la forme de la réponse', () => {
    expect(readingOf(null)).toBeNull();
    expect(readingOf({ kind: 'invoice' })).toBeNull();
    const reading = readingOf({ kind: 'other', confidence: 7, summary: 'Newsletter', passengers: '2' });
    expect(reading).toMatchObject({ kind: 'other', confidence: 1, summary: 'Newsletter', passengers: null, plate: null });
  });

  it('donne à Claude le fuseau du parking, la date du jour et le mail avec son expéditeur', () => {
    const prompt = emailReadingPrompt({ timezone: 'Europe/Paris', today: '2026-10-08' });
    expect(prompt).toContain('Europe/Paris');
    expect(prompt).toContain('2026-10-08');
    const input = emailReadingInput({ from: 'noreply@parkos.fr', fromName: 'Parkos', subject: 'Nouvelle réservation', text: 'Bonjour' });
    expect(input).toBe('From: Parkos noreply@parkos.fr\nSubject: Nouvelle réservation\n\nBonjour');
  });
});

describe('lecture d’un mail par Claude — service', () => {
  const service = Container.get(EmailReadingService);
  const create = jest.fn();
  const email = { from: 'noreply@parkos.fr', subject: 'Nouvelle réservation', text: 'Bonjour…', timezone: 'Europe/Paris' };
  const message = (over: Record<string, unknown> = {}) => ({
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(answer) }],
    usage: { input_tokens: 800, output_tokens: 120 },
    ...over,
  });

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    create.mockReset();
    (service as unknown as { client: unknown }).client = { messages: { create } };
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    (service as unknown as { client: unknown }).client = undefined;
  });

  it('ne fait rien sans clé', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(service.available()).toBe(false);
    expect(await service.read(email)).toEqual({ outcome: 'unavailable' });
    expect(create).not.toHaveBeenCalled();
  });

  it('interroge Claude en JSON structuré et renvoie sa lecture', async () => {
    create.mockResolvedValue(message());
    const result = await service.read(email);
    expect(result).toMatchObject({
      outcome: 'answered',
      reading: { kind: 'booking', provider: 'Parkos', confidence: 0.92 },
      usage: { inputTokens: 800, outputTokens: 120 },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0][0];
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.system).toContain('Europe/Paris');
    expect(params.messages[0].content).toContain('noreply@parkos.fr');
  });

  it('16/10/2026 : dit pourquoi il n’y a pas de lecture : refus, réponse coupée ou mal formée (« declined »), panne (« outage »)', async () => {
    create.mockResolvedValueOnce(message({ stop_reason: 'refusal', content: [] }));
    expect(await service.read(email)).toEqual({ outcome: 'declined', reason: 'refusal' });
    create.mockResolvedValueOnce(message({ stop_reason: 'max_tokens' }));
    expect(await service.read(email)).toEqual({ outcome: 'declined', reason: 'max_tokens' });
    create.mockResolvedValueOnce(message({ content: [{ type: 'text', text: '{oops' }] }));
    expect(await service.read(email)).toEqual({ outcome: 'declined', reason: 'malformed' });
    create.mockResolvedValueOnce(message({ content: [{ type: 'text', text: JSON.stringify({ kind: 'facture' }) }] }));
    expect(await service.read(email)).toEqual({ outcome: 'declined', reason: 'malformed' });
    create.mockRejectedValueOnce(new Error('ECONNRESET'));
    expect(await service.read(email)).toEqual({ outcome: 'outage', cause: 'other', status: null });
  });

  /** An error as the SDK throws it for an HTTP answer of Anthropic. */
  const apiError = (status: number, type: string, text: string) =>
    Anthropic.APIError.generate(status, { type: 'error', error: { type, message: text }, request_id: 'req_test' }, undefined, new Headers());
  const CREDIT = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.';

  it('16/10/2026 : reconnaît la cause d’une panne (crédit épuisé en 400, clé, charge, délai, réseau)', async () => {
    const cases: [unknown, string, number | null][] = [
      [apiError(400, 'invalid_request_error', CREDIT), 'credit', 400],
      [apiError(402, 'billing_error', 'Billing issue'), 'credit', 402],
      [apiError(401, 'authentication_error', 'invalid x-api-key'), 'auth', 401],
      [apiError(403, 'permission_error', 'Your API key does not have permission'), 'auth', 403],
      [apiError(429, 'rate_limit_error', 'Number of request tokens has exceeded your per-minute rate limit'), 'rate_limit', 429],
      [apiError(529, 'overloaded_error', 'Overloaded'), 'overloaded', 529],
      [apiError(500, 'api_error', 'Internal server error'), 'overloaded', 500],
      [apiError(400, 'invalid_request_error', 'max_tokens: must be positive'), 'other', 400],
      [new Anthropic.APIConnectionTimeoutError(), 'timeout', null],
      [new Anthropic.APIConnectionError({ message: 'Connection error.' }), 'network', null],
    ];
    for (const [error, cause, status] of cases) {
      create.mockRejectedValueOnce(error);
      expect([cause, await service.read(email)]).toEqual([cause, { outcome: 'outage', cause, status }]);
      expect(service.lastCall?.outage?.cause).toBe(cause);
    }
    // An answer since: the instance remembers it.
    create.mockResolvedValueOnce(message());
    expect((await service.read(email)).outcome).toBe('answered');
    expect(service.lastCall?.outage).toBeNull();
  });

  it('16/10/2026 : journalise une panne une fois en erreur puis en avertissement, sans le mail ni « undefined »', async () => {
    const error = jest.spyOn(logger, 'error');
    const warn = jest.spyOn(logger, 'warn');
    try {
      create.mockRejectedValueOnce(apiError(400, 'invalid_request_error', CREDIT));
      create.mockRejectedValueOnce(apiError(400, 'invalid_request_error', CREDIT));
      create.mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: 'Connection error.' }));
      await service.read({ ...email, text: 'Bonjour Marie Dupont, AB-123-CD' });
      await service.read({ ...email, text: 'Bonjour Marie Dupont, AB-123-CD' });
      await service.read({ ...email, text: 'Bonjour Marie Dupont, AB-123-CD' });
      const errors = error.mock.calls.map(([m]) => String(m));
      const warnings = warn.mock.calls.map(([m]) => String(m));
      expect(errors).toEqual([
        expect.stringMatching(/^\[Inbound\] Claude unavailable \(credit: HTTP 400, invalid_request_error, Your credit balance is too low/),
        // Another cause: an error again; a failed connection has no HTTP status to tell.
        '[Inbound] Claude unavailable (network): the email waits and is read again once Claude answers',
      ]);
      expect(warnings).toEqual([expect.stringMatching(/^\[Inbound\] Claude unavailable \(credit: HTTP 400/)]);
      for (const line of [...errors, ...warnings]) {
        expect(line).not.toMatch(/undefined|Dupont|AB-123-CD|noreply/);
      }
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  });
});

describe('panne de Claude (16/10/2026) — domaine', () => {
  it('outageCauseOf : le crédit d’abord (par son message sur un 400), puis la clé, la charge, le délai, le réseau', () => {
    expect(
      outageCauseOf({ status: 400, type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' }),
    ).toBe('credit');
    expect(outageCauseOf({ status: 403, type: 'billing_error' })).toBe('credit');
    expect(outageCauseOf({ status: 403, type: 'permission_error' })).toBe('auth');
    expect(outageCauseOf({ status: 503 })).toBe('overloaded');
    expect(outageCauseOf({ timeout: true, status: 500 })).toBe('timeout');
    expect(outageCauseOf({ connection: true })).toBe('network');
    expect(outageCauseOf({})).toBe('other');
  });

  it('readingOutageOf : seulement une cause connue et une date', () => {
    expect(readingOutageOf({ cause: 'credit', at: '2026-10-16T07:00:00.000Z' })).toEqual({ cause: 'credit', at: '2026-10-16T07:00:00.000Z' });
    expect(readingOutageOf({ cause: 'panne', at: '2026-10-16T07:00:00.000Z' })).toBeNull();
    expect(readingOutageOf({ cause: 'credit' })).toBeNull();
    expect(readingOutageOf(null)).toBeNull();
  });
});
