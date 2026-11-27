import { Container } from 'typedi';
import prisma from '@/database';
import {
  articleWarnings,
  blogTopicsInput,
  cleanBody,
  LYON_AIRPORT_FACTS,
  mondayOf,
  partnerFacts,
  readArticle,
  slugify,
  wordCount,
} from '@/domain/blog';
import { BlogService } from '@/services/blog.service';
import { NotificationService } from '@/services/notification.service';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 26/11/2026: the blog's daily article (B « Le calendrier de la semaine »). Claude writes it the night before from Plazo's
 * facts; it is published only by a platform admin. Claude's answers are mocked; fictional parkings only.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const NIGHT = new Date('2026-11-26T20:30:00Z'); // 21:30 in Paris: tomorrow is 27/11

const body = (words = 1400) =>
  [
    '## Quand réserver ?',
    'Réservez tôt pour garder le choix. '.repeat(Math.ceil(words / 12)),
    '- Comparez le prix total',
    '- Vérifiez la navette',
    '## Combien compter ?',
    'Pour 8 jours, les parkings partenaires démarrent à 62,00 €, navette comprise.',
  ].join('\n\n');

const answer = (over: Record<string, unknown> = {}) => ({
  title: 'Parking à l’aéroport de Lyon pendant les vacances de février',
  metaTitle: 'Parking aéroport Lyon en février : prix et conseils',
  metaDescription: 'Vacances d’hiver : quand réserver votre parking à Lyon Saint-Exupéry et combien compter, navette comprise.',
  slug: 'Parking Lyon vacances février',
  intro: 'Les parkings proches de Saint-Exupéry se remplissent vite. Voici quand réserver.',
  body: body(),
  related: ['parking-longue-duree', 'inconnu', 'parking-en-famille'],
  sources: ['lyonaeroports.com'],
  ...over,
});

describe('domain', () => {
  it('reads the partners and their 8-day price, the cheapest one in a line of its own', () => {
    const facts = partnerFacts(
      [
        { title: 'Parking A', services: ['shuttle', 'covered'], shuttleMinutes: 8, tiers: [{ days: 8, priceCents: 6200 }], extraDayPriceCents: null },
        { title: 'Parking B', services: [], shuttleMinutes: null, tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 700 },
      ],
      '2026-11-26',
    );
    expect(facts.map(f => f.value)).toEqual([
      '8 jours 62,00 € · 1 jour 62,00 € · navette 8 min jusqu’au Terminal 1 · navette, places couvertes',
      '8 jours 64,00 € · 1 jour 15,00 €',
      '2',
      'dès 62,00 €',
    ]);
    expect(facts[0].source).toBe('prix des parkings partenaires de Plazo relevés le 26 novembre 2026');
  });

  it('cleans Claude’s answer: address, known guides only, no link nor HTML', () => {
    const article = readArticle(answer({ body: 'Texte <b>gras</b> et [un lien](https://x.fr).\n\n\n\n# Titre\n* point' }), 'Sujet')!;
    expect(article.slug).toBe('parking-lyon-vacances-fevrier');
    expect(article.related).toEqual(['parking-longue-duree', 'parking-en-famille']);
    expect(article.body).toBe('Texte gras et un lien.\n\n## Titre\n- point');
    expect(readArticle({ title: '', body: 'x' }, 'Sujet')).toBeNull();
    expect(slugify('L’été à Saint-Exupéry !')).toBe('l-ete-a-saint-exupery');
    expect(cleanBody('a\r\n\r\n\r\nb')).toBe('a\n\nb');
    expect(wordCount('Un deux', 'trois-quatre cinq')).toBe(4);
    expect(mondayOf('2026-11-29')).toBe('2026-11-23');
    expect(mondayOf('2026-11-23')).toBe('2026-11-23');
  });

  it('flags the figures absent from the facts, the Terminal 2 and a payment on site', () => {
    const facts = [...LYON_AIRPORT_FACTS, { label: 'Partenaires, 8 jours', value: 'dès 62,00 €', source: 'Plazo' }];
    const ok = articleWarnings({ title: 'T', metaTitle: 'T', metaDescription: 'D', intro: 'Terminal 1, 8 jours dès 62,00 €.', body: body() }, facts);
    expect(ok).toEqual([]);
    const bad = articleWarnings(
      { title: 'T', metaTitle: null, metaDescription: null, intro: null, body: 'Le Terminal 2, 45 € payés sur place, vacances le 7 février.' },
      facts,
    );
    expect(bad[0]).toContain('Terminal 2');
    expect(bad[1]).toContain('paiement sur place');
    expect(bad[2]).toBe('Chiffres absents des faits, à vérifier : 45.');
    expect(bad).toContain('Pas de description pour Google.');
    expect(bad.some(w => w.startsWith('Texte court'))).toBe(true);
  });

  it('hands the Search Console queries and the taken topics to the planning', () => {
    const input = blogTopicsInput({ days: ['2026-11-27'], taken: ['Vol annulé'], queries: [{ query: 'parking lys', impressions: 40 }] });
    expect(input).toContain('27 novembre 2026');
    expect(input).toContain('- Vol annulé');
    expect(input).toContain('parking lys (40 affichages)');
  });
});

describe('the night job and the review', () => {
  const service = () => Container.get(BlogService);
  const notifications = () => Container.get(NotificationService);
  let create: jest.Mock;

  beforeEach(async () => {
    await resetDatabase();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@exemple.test';
    create = jest.fn(async (params: { system: string }) => {
      const json = params.system.includes('calendrier éditorial')
        ? { topics: Array.from({ length: 7 }, (_, i) => ({ topic: `Sujet ${i + 1}`, query: `Requête ${i + 1}` })) }
        : answer();
      return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(json) }] };
    });
    jest.spyOn(service() as unknown as { anthropic: () => unknown }, 'anthropic').mockReturnValue({ messages: { create } });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });
  afterAll(() => prisma.$disconnect());

  it('plans the week, writes tomorrow from the real partners, mails the admins; nothing is published', async () => {
    const op = await setupOperator('Parking Réel');
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ tiers: [{ days: 8, priceCents: 6200 }], extraDayPriceCents: 600 });
    await api()
      .put('/api/internal/listing')
      .set(auth(op.token))
      .send({ airportCode: 'LYS', slug: 'parking-reel', title: 'Parking Réel', services: ['shuttle'], cancellationPolicy: 'free_24h', photos: [] });
    await publishListing(op.parking.id);
    jest.spyOn(notifications(), 'canSendEmail').mockReturnValue(true);
    const email = jest.spyOn(notifications(), 'emailStaff').mockResolvedValue(true);

    const result = await service().run(NIGHT);
    expect(result).toEqual({ status: 'written', day: '2026-11-27', mailed: 1 });
    const days = await prisma.blogArticle.findMany({ orderBy: { dueOn: 'asc' } });
    expect(days.map(d => d.dueOn)).toEqual(['2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03']);
    expect(days[0]).toMatchObject({
      status: 'draft',
      slug: 'parking-lyon-vacances-fevrier',
      topic: 'Sujet 1',
      query: 'requête 1',
      publishedAt: null,
    });
    expect(days[1].status).toBe('planned');
    const prompt = create.mock.calls[1][0].messages[0].content as string;
    expect(prompt).toContain('Parking partenaire « Parking Réel » : 8 jours 62,00 €');
    expect(prompt).toContain('Terminal 1');
    expect(email.mock.calls[0][3].subject).toContain('Article du jour à valider');
    expect((await api().get('/api/public/blog/parking-lyon-vacances-fevrier')).status).toBe(404);

    // Run again the same night: the day is written, nothing more.
    expect((await service().run(NIGHT)).status).toBe('nothing_to_do');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('the platform admin reads the week, corrects, publishes; the site reads it then', async () => {
    const admin = await setupOperator('Plazo (tests)');
    const other = await setupOperator('Parking Client');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    await service().run(NIGHT);
    const article = await prisma.blogArticle.findUniqueOrThrow({ where: { dueOn: '2026-11-27' } });

    expect((await api().get('/api/internal/platform/blog').set(auth(other.token))).status).toBe(403);
    const week = await api().get('/api/internal/platform/blog?semaine=2026-11-27').set(auth(admin.token));
    expect(week.status).toBe(200);
    expect(week.body.monday).toBe('2026-11-23');
    expect(week.body.counts).toEqual({ published: 0, toReview: 1, clicks: 0 });
    expect(week.body.days.map((d: { article: { status: string } | null }) => d.article?.status ?? null)).toEqual([
      null,
      null,
      null,
      null,
      'draft',
      'planned',
      'planned',
    ]);

    const bad = await api()
      .put(`/api/internal/platform/blog/${article.id}`)
      .set(auth(admin.token))
      .send({ slug: 'Pas Valable', body: 'Rendez-vous au Terminal 2.' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ slug: 'invalid' });
    const edited = await api().put(`/api/internal/platform/blog/${article.id}`).set(auth(admin.token)).send({ body: 'Rendez-vous au Terminal 2.' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.warnings[0]).toContain('Terminal 2');
    expect((await api().post(`/api/internal/platform/blog/${article.id}/publish`).set(auth(admin.token))).body.code).toBe('forbidden_mention');

    await api().put(`/api/internal/platform/blog/${article.id}`).set(auth(admin.token)).send({ body: body() });
    const published = await api().post(`/api/internal/platform/blog/${article.id}/publish`).set(auth(admin.token));
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('published');
    expect((await api().put(`/api/internal/platform/blog/${article.id}`).set(auth(admin.token)).send({ slug: 'autre-adresse' })).body.fields).toEqual(
      { slug: 'published' },
    );

    const list = await api().get('/api/public/blog');
    expect(list.body.articles.map((a: { slug: string }) => a.slug)).toEqual(['parking-lyon-vacances-fevrier']);
    const page = await api().get('/api/public/blog/parking-lyon-vacances-fevrier');
    expect(page.status).toBe(200);
    expect(page.body.article).toMatchObject({ title: answer().title, related: ['parking-longue-duree', 'parking-en-famille'] });
    expect(page.body.article.facts).toBeUndefined();

    const back = await api().post(`/api/internal/platform/blog/${article.id}/unpublish`).set(auth(admin.token));
    expect(back.body.data.status).toBe('draft');
    expect((await api().get('/api/public/blog/parking-lyon-vacances-fevrier')).status).toBe(404);
    const rejected = await api().post(`/api/internal/platform/blog/${article.id}/reject`).set(auth(admin.token));
    expect(rejected.body.data.status).toBe('rejected');
  });

  it('rewrites with an instruction, keeps the version when Claude fails, writes a day on demand', async () => {
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const written = await api().post('/api/internal/platform/blog/write').set(auth(admin.token)).send({ day: '2026-12-10' });
    expect(written.status).toBe(200);
    expect(written.body.data).toMatchObject({ dueOn: '2026-12-10', status: 'draft' });

    const id = written.body.data.id;
    const rewritten = await api().post(`/api/internal/platform/blog/${id}/rewrite`).set(auth(admin.token)).send({ instruction: 'Plus court' });
    expect(rewritten.status).toBe(200);
    expect(create.mock.calls.at(-1)[0].messages[0].content).toContain('Plus court');

    create.mockRejectedValueOnce(new Error('timeout'));
    const failed = await api().post(`/api/internal/platform/blog/${id}/rewrite`).set(auth(admin.token)).send({});
    expect(failed.status).toBe(502);
    expect((await prisma.blogArticle.findUniqueOrThrow({ where: { id } })).status).toBe('draft');

    // 27/11/2026: Anthropic refusing the blog's model (404) falls back once on the model the other writings use.
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    create.mockRejectedValueOnce(new Anthropic.NotFoundError(404, { type: 'error' }, 'model: claude-sonnet-5-5', new Headers()));
    const retried = await api().post(`/api/internal/platform/blog/${id}/rewrite`).set(auth(admin.token)).send({});
    expect(retried.status).toBe(200);
    expect(create.mock.calls.at(-1)[0].model).toBe('claude-opus-5-5');

    delete process.env.ANTHROPIC_API_KEY;
    expect((await api().post(`/api/internal/platform/blog/${id}/rewrite`).set(auth(admin.token)).send({})).body.code).toBe('ai_unavailable');
    expect((await service().run(NIGHT)).status).toBe('not_configured');
  });
});
