import 'reflect-metadata';
import { Container } from 'typedi';
import { cleanPhone, cleanPlate, emailReadingInput, emailReadingPrompt, readingOf, toParsedBooking, type EmailReading } from '@/domain/email-reading';
import { EmailReadingService } from '@/services/email-reading.service';

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

  it('nettoie téléphones et plaques', () => {
    expect(cleanPhone('06.12.34.56.78')).toBe('0612345678');
    expect(cleanPhone('+33 (0)6 12 34 56 78')).toBe('+33612345678');
    expect(cleanPhone('')).toBeUndefined();
    expect(cleanPlate('gk318px')).toBe('GK-318-PX');
    expect(cleanPlate('1234 abc 69')).toBe('1234ABC69');
    expect(cleanPlate(null)).toBeUndefined();
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
    expect(await service.read(email)).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('interroge Claude en JSON structuré et renvoie sa lecture', async () => {
    create.mockResolvedValue(message());
    const result = await service.read(email);
    expect(result).toMatchObject({
      reading: { kind: 'booking', provider: 'Parkos', confidence: 0.92 },
      usage: { inputTokens: 800, outputTokens: 120 },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0][0];
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.system).toContain('Europe/Paris');
    expect(params.messages[0].content).toContain('noreply@parkos.fr');
  });

  it('répond null quand Claude refuse, est coupé, ne répond pas en JSON ou échoue', async () => {
    create.mockResolvedValueOnce(message({ stop_reason: 'refusal', content: [] }));
    expect(await service.read(email)).toBeNull();
    create.mockResolvedValueOnce(message({ stop_reason: 'max_tokens' }));
    expect(await service.read(email)).toBeNull();
    create.mockResolvedValueOnce(message({ content: [{ type: 'text', text: '{oops' }] }));
    expect(await service.read(email)).toBeNull();
    create.mockResolvedValueOnce(message({ content: [{ type: 'text', text: JSON.stringify({ kind: 'facture' }) }] }));
    expect(await service.read(email)).toBeNull();
    create.mockRejectedValueOnce(new Error('ECONNRESET'));
    expect(await service.read(email)).toBeNull();
  });
});
