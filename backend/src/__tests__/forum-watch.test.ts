import { Container } from 'typedi';
import prisma from '@/database';
import {
  checkForumReply,
  FORUM_QUERIES,
  forumWatchDay,
  forumWatchEmail,
  isForumThread,
  recentEnough,
  threadKey,
  webSearchResults,
} from '@/domain/forum-watch';
import { ForumWatchService } from '@/services/forum-watch.service';
import { NotificationService } from '@/services/notification.service';
import { resetDatabase } from './utils/helpers';

/**
 * 17/11/2026: the forum watch. Each morning the new discussions about parking at Lyon's airport are mailed to the
 * platform's administrators with a drafted reply; nothing is posted. Fictional search results only.
 */

const MORNING = new Date('2026-11-18T08:30:00Z'); // 09:30 in Paris
const thread = (over: Partial<{ title: string; url: string; description: string }> = {}) => ({
  title: 'Parking pas cher à Saint-Exupéry pour une semaine ?',
  url: 'https://www.routard.com/forum_message/123/parking-aeroport-lyon.htm',
  description: "Je pars une semaine, quel parking près de l'aéroport de Lyon avec navette ?",
  age: '2 jours',
  ...over,
});

describe('le tri des résultats', () => {
  it('garde une discussion de forum sur le stationnement à Lyon, jamais une page ordinaire ni plazo.fr', () => {
    expect(isForumThread(thread())).toBe(true);
    expect(isForumThread(thread({ url: 'https://www.reddit.com/r/lyon/comments/abc/parking_lys/' }))).toBe(true);
    expect(isForumThread(thread({ url: 'https://www.lyonaeroports.com/parkings' }))).toBe(false);
    expect(isForumThread(thread({ url: 'https://www.plazo.fr/forum/lyon' }))).toBe(false);
    expect(isForumThread(thread({ title: 'Restaurant à Lyon', description: 'Où manger près de Bellecour ?' }))).toBe(false);
  });

  it('lit les résultats de la recherche web de Claude et retrouve une discussion par son adresse', () => {
    const results = webSearchResults([
      { type: 'text', text: 'ok' },
      { type: 'web_search_tool_result', content: { type: 'web_search_tool_result_error', error_code: 'unavailable' } },
      {
        type: 'web_search_tool_result',
        content: [{ type: 'web_search_result', title: 'Parking  Lyon', url: 'https://x.fr/forum/1', page_age: '2 days ago', encrypted_content: 'e' }],
      },
    ]);
    expect(results).toEqual([{ title: 'Parking Lyon', url: 'https://x.fr/forum/1', description: '', age: '2 days ago' }]);
    expect(webSearchResults(null)).toEqual([]);
    expect(recentEnough('2 days ago', MORNING)).toBe(true);
    expect(recentEnough('3 months ago', MORNING)).toBe(false);
    expect(recentEnough('March 2, 2024', MORNING)).toBe(false);
    expect(recentEnough(null, MORNING)).toBe(true);
    expect(threadKey('https://www.x.fr/forum/1/?utm=a#r')).toBe(threadKey('https://x.fr/forum/1'));
  });

  it('écarte une réponse qui donne un prix, une durée ou le Terminal 2', () => {
    expect(checkForumReply('Comparez le prix total et vérifiez la navette.')).toBe('Comparez le prix total et vérifiez la navette.');
    expect(checkForumReply('Comptez 45 € la semaine.')).toBeNull();
    expect(checkForumReply('La navette met 8 min.')).toBeNull();
    expect(checkForumReply('Allez au Terminal 2.')).toBeNull();
    expect(checkForumReply('')).toBeNull();
  });

  it('le mail dit que Plazo ne poste rien', () => {
    const mail = forumWatchEmail('Plazo', { day: '2026-11-18', threads: [{ ...thread(), host: 'routard.com', reply: null }] });
    expect(mail.subject).toBe('Veille des forums du 18/11/2026 : 1 discussion');
    expect(mail.text).toContain('Plazo ne poste rien');
    expect(mail.html).toContain('routard.com');
  });

  it('passe le matin seulement, heure de Paris', () => {
    expect(forumWatchDay(MORNING)).toBe('2026-11-18');
    expect(forumWatchDay(new Date('2026-11-18T05:00:00Z'))).toBeNull();
  });
});

describe('la veille du matin', () => {
  const notifications = () => Container.get(NotificationService);
  const service = () => Container.get(ForumWatchService);

  beforeEach(async () => {
    await resetDatabase();
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@exemple.test';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    jest.spyOn(service(), 'draft').mockResolvedValue('Comparez le prix total. Je travaille sur Plazo : https://www.plazo.fr');
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PLATFORM_ADMIN_EMAILS;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterAll(() => prisma.$disconnect());

  it('envoie les nouvelles discussions une fois, puis rien le lendemain pour les mêmes', async () => {
    jest.spyOn(notifications(), 'canSendEmail').mockReturnValue(true);
    const email = jest.spyOn(notifications(), 'emailStaff').mockResolvedValue(true);
    const search = jest.spyOn(service(), 'search').mockResolvedValue([thread(), thread({ url: 'https://www.lyonaeroports.com/parkings' })]);

    const first = await service().run(MORNING);
    expect(first).toMatchObject({ status: 'sent', searches: FORUM_QUERIES.length, found: 1, drafted: 1 });
    expect(email).toHaveBeenCalledTimes(1);
    const [, , , message] = email.mock.calls[0];
    expect(message.text).toContain('Je travaille sur Plazo');
    expect(search.mock.calls.map(([q]) => q)).toEqual([...FORUM_QUERIES]);

    expect((await service().run(new Date(MORNING.getTime() + 15 * 60_000))).status).toBe('already_ran');
    expect((await service().run(new Date('2026-11-19T08:30:00Z'))).status).toBe('nothing_new');
    expect(email).toHaveBeenCalledTimes(1);
  });

  it('ne fait rien sans clé Anthropic, et réessaie quand le mail ne part pas', async () => {
    jest.spyOn(notifications(), 'canSendEmail').mockReturnValue(true);
    delete process.env.ANTHROPIC_API_KEY;
    expect((await service().run(MORNING)).status).toBe('not_configured');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    jest.spyOn(service(), 'search').mockResolvedValue([thread()]);
    jest.spyOn(notifications(), 'emailStaff').mockResolvedValueOnce(false).mockResolvedValue(true);
    expect((await service().run(MORNING)).status).toBe('not_sent');
    expect((await service().run(MORNING)).status).toBe('sent');
  });
});
