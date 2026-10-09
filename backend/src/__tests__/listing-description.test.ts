import Anthropic from '@anthropic-ai/sdk';
import { Container } from 'typedi';
import prisma from '@/database';
import {
  checkDescription,
  descriptionFacts,
  factsText,
  listingDescriptionInput,
  listingDescriptionPrompt,
  numbersIn,
  type DescriptionSource,
} from '@/domain/listing-description';
import { ListingDescriptionService } from '@/services/listing-description.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 09/10/2026 (« pouvoir générer une Présentation pour son parking »): Claude writes the « Présentation » of the
 * Plazo page from the parking's real data. The pure side (facts, prompt, guard), then the route with a fake client.
 */

const source = (over: Partial<DescriptionSource> = {}): DescriptionSource => ({
  parking: {
    name: 'Parking Démo',
    address: '12 route de Lyon, 69124 Colombier-Saugnieu',
    shuttleTravelMinutes: 8,
    returnMeetingLabel: 'Terminal 1 · arrêt navettes P5',
  },
  listing: {
    title: 'Parking Démo LYS',
    services: ['shuttle', 'open_24h', 'fenced'],
    shuttleMinutes: 8,
    distanceKm: 4.5,
    openingHours: '24h/24',
    cancellationPolicy: 'free_24h',
  },
  airport: { code: 'LYS', name: 'Lyon Saint-Exupéry', city: 'Lyon' },
  tiers: [
    { days: 3, priceCents: 3499 },
    { days: 1, priceCents: 1500 },
  ],
  vehicles: [{ seats: 8 }, { seats: 16 }],
  stops: [{ name: 'Gare Saint-Exupéry TGV' }],
  valetFiles: 0,
  ...over,
});

describe('présentation par Claude — faits, consignes et garde-fou', () => {
  it('rassemble les vraies données du parking, une ligne par fait', () => {
    const text = factsText(descriptionFacts(source()));
    expect(text).toContain('- Nom du parking : Parking Démo LYS');
    expect(text).toContain('- Adresse : 12 route de Lyon, 69124 Colombier-Saugnieu');
    expect(text).toContain('- Aéroport : Lyon Saint-Exupéry');
    expect(text).toContain("- Aérogare en service à l'aéroport : Terminal 1");
    expect(text).toContain("- Services : navette entre le parking et l'aéroport, ouvert 24h/24, parking clôturé");
    expect(text).toContain("- Trajet en navette jusqu'à l'aéroport : 8 min");
    expect(text).toContain('- Navettes en service : 2 véhicules (8, 16 places passagers)');
    expect(text).toContain('- Autres dessertes de la navette : Gare Saint-Exupéry TGV');
    expect(text).toContain('- Point de rendez-vous au retour : Terminal 1 · arrêt navettes P5');
    expect(text).toContain("- Distance de l'aéroport : 4,5 km");
    expect(text).toContain('- Horaires : 24h/24');
    expect(text).toContain("jusqu'à 24 h avant l'arrivée");
    expect(text).toContain("- Prix : à partir de 15,00 € (forfait jusqu'à 1 jour)");
    expect(text).not.toMatch(/Voiturier/);
    // Valet files mean a valet parking, even when the service chip is off.
    expect(factsText(descriptionFacts(source({ valetFiles: 12 })))).toMatch(/- Voiturier : oui/);
  });

  it('ne dit rien de ce qui manque', () => {
    const text = factsText(
      descriptionFacts(
        source({
          parking: { name: 'Parking Démo', address: null, shuttleTravelMinutes: 8, returnMeetingLabel: null },
          listing: null,
          tiers: [],
          vehicles: [],
          stops: [{ name: 'Gare' }],
        }),
      ),
    );
    expect(text).toBe(
      "- Nom du parking : Parking Démo\n- Aéroport : Lyon Saint-Exupéry\n- Aérogare en service à l'aéroport : Terminal 1, la seule aérogare ouverte",
    );
    for (const absent of ['Adresse', 'Services', 'Navette', 'Horaires', 'Prix', 'Annulation', 'Distance', 'Gare']) expect(text).not.toContain(absent);
  });

  it('donne à Claude les règles du site et le texte actuel à améliorer', () => {
    const prompt = listingDescriptionPrompt('Plazo');
    expect(prompt).toContain('160 caractères');
    expect(prompt).toContain('Terminal 2');
    expect(prompt).toMatch(/jamais que le séjour se paie sur place/);
    expect(prompt).toMatch(/N'invente aucun/);
    const facts = descriptionFacts(source());
    expect(listingDescriptionInput(facts)).not.toContain('Présentation actuelle');
    const improve = listingDescriptionInput(facts, '  Parking sécurisé, payé sur place.  ');
    expect(improve).toContain('"""\nParking sécurisé, payé sur place.\n"""');
    expect(improve).toMatch(/Améliore cette présentation/);
  });

  it('écarte un chiffre inventé, le Terminal 2 et un texte trop long', () => {
    const facts = descriptionFacts(source());
    const good = 'Parking Démo LYS, à 4,5 km de Lyon Saint-Exupéry.  \n\n\n\nNavette en 8 min, à partir de 15,0 € pour 1 jour.';
    expect(checkDescription(good, facts)).toEqual({
      ok: true,
      text: 'Parking Démo LYS, à 4,5 km de Lyon Saint-Exupéry.\n\nNavette en 8 min, à partir de 15,0 € pour 1 jour.',
    });
    expect(checkDescription('Navette toutes les 10 minutes, 8 min de trajet.', facts)).toEqual({
      ok: false,
      reason: 'unsupported_figure',
      figures: ['10'],
    });
    // Only the starting price is a fact: another package of the grid (or a rounded price) is not.
    expect(checkDescription('Dès 35 €, 34,99 € les 3 jours.', facts)).toMatchObject({ ok: false, figures: ['35', '34.99', '3'] });
    // The manager's own figures stay when Claude improves their text.
    expect(checkDescription('Un parking de 400 places.', facts, 'Parking de 400 places')).toMatchObject({ ok: true });
    expect(checkDescription('Navette vers le terminal 2.', facts)).toEqual({ ok: false, reason: 'terminal_2' });
    expect(checkDescription('a'.repeat(2001), facts)).toEqual({ ok: false, reason: 'too_long' });
    expect(checkDescription('  \n ', facts)).toEqual({ ok: false, reason: 'empty' });
    expect(numbersIn('29,90 € ou 29.9 €, 24h/24')).toEqual(['29.9', '29.9', '24', '24']);
  });
});

describe('présentation par Claude — route', () => {
  const service = Container.get(ListingDescriptionService);
  const create = jest.fn();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const reply = (text: string, over: Record<string, unknown> = {}) => ({
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify({ text }) }],
    usage: { input_tokens: 600, output_tokens: 200 },
    ...over,
  });
  const listing = {
    airportCode: 'LYS',
    slug: 'parking-demo',
    title: 'Parking Démo LYS',
    description: 'Ancien texte.',
    services: ['shuttle', 'fenced'],
    shuttleMinutes: 8,
    distanceKm: 4.5,
    openingHours: null,
    cancellationPolicy: 'free_48h',
    photos: [],
  };

  async function operatorWithPage() {
    const op = await setupOperator();
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: null });
    expect((await api().put('/api/internal/listing').set(auth(op.token)).send(listing)).status).toBe(200);
    await prisma.shuttleVehicle.create({ data: { operatorId: op.operator.id, model: 'Mercedes Vito', seats: 8 } });
    await prisma.shuttleVehicle.create({ data: { operatorId: op.operator.id, model: 'Renault Master', seats: 16, inService: false } });
    await prisma.shuttleStop.create({ data: { parkingId: op.parking.id, kind: 'station', name: 'Gare Saint-Exupéry TGV', lat: 45.72, lng: 5.07 } });
    await prisma.parkingFile.create({ data: { parkingId: op.parking.id, code: 'F01', capacity: 6 } });
    return op;
  }

  beforeEach(async () => {
    await resetDatabase();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    create.mockReset();
    (service as unknown as { client: unknown }).client = { messages: { create } };
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    (service as unknown as { client: unknown }).client = undefined;
  });
  afterAll(() => prisma.$disconnect());

  it('rédige d’après les données du parking, sans rien enregistrer', async () => {
    const op = await operatorWithPage();
    const before = await prisma.listing.findUniqueOrThrow({ where: { parkingId: op.parking.id } });
    create.mockResolvedValue(reply('Parking Démo LYS, parking clôturé à 4,5 km de Lyon Saint-Exupéry.\n\nNavette en 8 min, dès 15 €.'));

    const res = await api().post('/api/internal/listing/description/suggest').set(auth(op.token)).send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      text: 'Parking Démo LYS, parking clôturé à 4,5 km de Lyon Saint-Exupéry.\n\nNavette en 8 min, dès 15 €.',
      model: 'claude-opus-5-5',
    });

    const params = create.mock.calls[0][0];
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.system).toContain('Terminal 2');
    const content: string = params.messages[0].content;
    expect(content).toContain('- Nom du parking : Parking Démo LYS');
    expect(content).toContain("- Trajet en navette jusqu'à l'aéroport : 8 min");
    // Only the vehicle in service, the stop, the valet file, the 48 h policy and the grid.
    expect(content).toContain('- Navettes en service : 1 véhicule (8 places passagers)');
    expect(content).toContain('Gare Saint-Exupéry TGV');
    expect(content).toContain('- Voiturier : oui');
    expect(content).toContain("jusqu'à 48 h avant l'arrivée");
    expect(content).toContain('à partir de 15,00 €');
    expect(content).not.toContain('Horaires');
    expect(content).not.toContain('Adresse');
    expect(content).not.toContain('Présentation actuelle');

    // Nothing written: the page is the same, and no other page appeared.
    const after = await prisma.listing.findUniqueOrThrow({ where: { parkingId: op.parking.id } });
    expect(after.updatedAt).toEqual(before.updatedAt);
    expect(after.description).toBe('Ancien texte.');
    expect(await prisma.listing.count()).toBe(1);
  });

  it('améliore le texte actuel au lieu de repartir de zéro, sans inventer de chiffre', async () => {
    const op = await operatorWithPage();
    create.mockResolvedValueOnce(reply('Parking Démo LYS : 120 places clôturées, navette en 8 min.'));
    const res = await api()
      .post('/api/internal/listing/description/suggest')
      .set(auth(op.token))
      .send({ current: 'Parking de 120 places, paiement sur place.' });
    expect(res.status).toBe(200);
    expect(create.mock.calls[0][0].messages[0].content).toContain('Parking de 120 places, paiement sur place.');

    create.mockResolvedValueOnce(reply('Navette toutes les 10 minutes vers le Terminal 1.'));
    const invented = await api().post('/api/internal/listing/description/suggest').set(auth(op.token)).send({});
    expect(invented.status).toBe(502);
    expect(invented.body).toMatchObject({ code: 'ai_unreliable', details: { reason: 'unsupported_figure', figures: ['10'] } });

    const tooLong = await api()
      .post('/api/internal/listing/description/suggest')
      .set(auth(op.token))
      .send({ current: 'a'.repeat(2001) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.fields).toEqual({ current: 'too_long' });
  });

  it('dit pourquoi Claude n’a rien proposé : clé absente, refus, saturé, délai, panne', async () => {
    const { token } = await operatorWithPage();
    const post = () => api().post('/api/internal/listing/description/suggest').set(auth(token)).send({});

    delete process.env.ANTHROPIC_API_KEY;
    const off = await post();
    expect(off.status).toBe(409);
    expect(off.body.code).toBe('ai_unavailable');
    expect(create).not.toHaveBeenCalled();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

    create.mockResolvedValueOnce(reply('', { stop_reason: 'refusal', content: [] }));
    expect((await post()).body).toMatchObject({ code: 'ai_refused' });
    create.mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers()));
    const busy = await post();
    expect([busy.status, busy.body.code]).toEqual([503, 'ai_busy']);
    create.mockRejectedValueOnce(new Anthropic.APIConnectionTimeoutError());
    const late = await post();
    expect([late.status, late.body.code]).toEqual([504, 'ai_timeout']);
    create.mockResolvedValueOnce({ ...reply(''), content: [{ type: 'text', text: '{oops' }] });
    const broken = await post();
    expect([broken.status, broken.body.code]).toEqual([502, 'ai_failed']);
  });

  it('ne sert que les données du loueur connecté, et seulement à un gérant', async () => {
    const a = await operatorWithPage();
    const b = await setupOperator('Autre');
    create.mockResolvedValue(reply('Un parking près de Lyon Saint-Exupéry.'));

    const res = await api().post('/api/internal/listing/description/suggest').set(auth(b.token)).send({});
    expect(res.status).toBe(200);
    const content: string = create.mock.calls[0][0].messages[0].content;
    // B has no page yet: its own parking's name and the form's default airport, nothing of A.
    expect(content).toContain(`- Nom du parking : ${b.parking.name}`);
    expect(content).toContain('- Aéroport : Lyon Saint-Exupéry');
    for (const other of ['Parking Démo LYS', 'Gare Saint-Exupéry TGV', 'Navettes en service', 'Voiturier', '15,00 €'])
      expect(content).not.toContain(other);

    const agent = await addStaff(a.token, 'agent');
    const denied = await api().post('/api/internal/listing/description/suggest').set(auth(agent.token)).send({});
    expect(denied.status).toBe(403);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
