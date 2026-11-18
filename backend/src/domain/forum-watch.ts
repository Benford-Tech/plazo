import { createHash } from 'node:crypto';
import { COLORS, escapeHtml, layout } from './account-messages';
import { EmailMessage } from './booking-messages';
import { localDate, localDateTime } from './time';

/**
 * 17/11/2026 (« Fais un robot qui poste sur des forums tous les jours au sujet de Plazo » → refused as spam, the watch
 * chosen instead, « réponse rédigée par Claude »; 18/11/2026, « c'est pas gratuit » : Brave's API is paid, the searches go through
 * Claude's web search tool, on the Anthropic key Plazo already has): each morning Plazo looks for the new forum
 * discussions about parking at Lyon airport, and mails the platform's administrators the links with a reply Claude
 * drafted. Nothing is ever posted: an administrator reads, edits and posts the reply himself, in his own name.
 * Pure functions: the searches, which results are discussions, the prompt, the mail.
 */

export const FORUM_WATCH_TIMEZONE = 'Europe/Paris';
/** The watch runs from this hour (Paris) until noon, once a day. */
export const FORUM_WATCH_FROM_HOUR = 8;
export const FORUM_WATCH_UNTIL_HOUR = 12;
/** At most this many discussions per mail (the freshest first), each with its drafted reply. */
export const FORUM_WATCH_MAX_THREADS = 8;
/** A discussion already mailed is not mailed again for this long. */
export const FORUM_SEEN_DAYS = 180;

/**
 * The daily searches (8 a day, about 240 a month: some 2,40 $ of Claude's web search at 10 $ per 1 000). French words a
 * traveller types when he asks a forum where to park.
 */
export const FORUM_QUERIES: readonly string[] = [
  'parking aéroport Lyon Saint-Exupéry forum',
  'parking pas cher aéroport Lyon avis',
  'navette parking aéroport Lyon Saint-Exupéry',
  'parking longue durée Saint-Exupéry conseil',
  'voiturier aéroport Lyon avis',
  'où se garer aéroport Lyon une semaine',
  'parking gare TGV Lyon Saint-Exupéry',
  'parking aéroport Lyon reddit',
];

/** Hosts whose pages are discussions (questions and answers), whatever their path. */
const FORUM_HOSTS = ['reddit.com', 'quora.com', 'commentcamarche.net', 'forum.hardware.fr', 'voyageforum.com', 'jeuxvideo.com'];
/** Paths that are discussions on other sites (Routard, Tripadvisor, phpBB, Discourse, XenForo…). */
const FORUM_PATH = /(\/forum|forum\.|\/forums?\/|\/topic|\/threads?\/|\/discussion|\/comments\/|showtopic|viewtopic|\/questions?\/|\/t\/)/i;
/** What the discussion must speak of: parking, and Lyon's airport. */
const ABOUT_PARKING = /\b(parking|parkings|garer|stationn|voiturier|navette)/i;
const ABOUT_LYON = /(saint[- ]?exup|st[- ]?exup|\blys\b|a[ée]roport (de )?lyon|lyon[- ]a[ée]roport)/i;

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  /** The page's date as the search gives it (« 2 days ago », « November 12, 2026 »…), or null. */
  age: string | null;
}

export interface ForumThread extends SearchResult {
  host: string;
  /** The reply Claude drafted, or null when it judged Plazo has nothing useful to add. */
  reply: string | null;
}

/** A result older than this (when its date can be read) is not a new discussion. */
export const FORUM_MAX_AGE_DAYS = 30;

/** The results of every web search in Claude's answer (`web_search_tool_result` blocks; an error block holds no list). */
export function webSearchResults(content: unknown): SearchResult[] {
  if (!Array.isArray(content)) return [];
  return content.flatMap(block => {
    const b = block as { type?: unknown; content?: unknown };
    if (b.type !== 'web_search_tool_result' || !Array.isArray(b.content)) return [];
    return b.content.flatMap(r => {
      const row = r as { type?: unknown; title?: unknown; url?: unknown; page_age?: unknown };
      if (row.type !== 'web_search_result' || typeof row.url !== 'string' || typeof row.title !== 'string') return [];
      const title = row.title.replace(/\s+/g, ' ').trim();
      return [{ title, url: row.url, description: '', age: typeof row.page_age === 'string' ? row.page_age : null }];
    });
  });
}

/** False only for a page whose date can be read and is older than FORUM_MAX_AGE_DAYS. */
export function recentEnough(age: string | null, now: Date): boolean {
  if (!age) return true;
  const ago = /^(\d+)\s+(hour|day|week|month|year)s?\s+ago$/i.exec(age.trim());
  if (ago) {
    const days = { hour: 0, day: 1, week: 7, month: 30, year: 365 }[ago[2].toLowerCase() as 'day'] * Number(ago[1]);
    return days <= FORUM_MAX_AGE_DAYS;
  }
  const at = Date.parse(age);
  return Number.isNaN(at) || now.getTime() - at <= FORUM_MAX_AGE_DAYS * 86_400_000;
}

export function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/** A discussion about parking at Lyon's airport, on a forum (never Plazo's own pages). */
export function isForumThread(result: SearchResult): boolean {
  const host = hostOf(result.url);
  if (!host || host === 'plazo.fr' || host.endsWith('.plazo.fr')) return false;
  const forum = FORUM_HOSTS.some(h => host === h || host.endsWith(`.${h}`)) || FORUM_PATH.test(result.url);
  if (!forum) return false;
  const text = `${result.title} ${result.description}`;
  return ABOUT_PARKING.test(text) && ABOUT_LYON.test(text);
}

/** The key a discussion is remembered by: its address without query, fragment or trailing slash. */
export function threadKey(url: string): string {
  let canonical = url;
  try {
    const u = new URL(url);
    canonical = `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    // keep the raw address
  }
  return createHash('sha256').update(canonical).digest('hex');
}

/** The Paris day the watch is due for now, or null outside its hours. */
export function forumWatchDay(now: Date): string | null {
  const hour = Number(localDateTime(now, FORUM_WATCH_TIMEZONE).slice(11, 13));
  return hour >= FORUM_WATCH_FROM_HOUR && hour < FORUM_WATCH_UNTIL_HOUR ? localDate(now, FORUM_WATCH_TIMEZONE) : null;
}

export const FORUM_REPLY_SCHEMA = {
  type: 'object',
  properties: {
    relevant: { type: 'boolean' },
    reply: { type: 'string' },
  },
  required: ['relevant', 'reply'],
  additionalProperties: false,
} as const;

/**
 * The drafting rules. What Plazo is, only what is true of it today; the reply answers the question first, says who
 * writes it (a reply that hides its author is astroturfing, and the forums ban it), never invents a price or a figure.
 */
export function forumReplyPrompt(productName: string, siteUrl: string): string {
  return [
    `Tu aides l'équipe de ${productName} à répondre, en son propre nom, à des discussions de forum de voyageurs.`,
    `${productName} (${siteUrl}) est un site qui compare les parkings privés autour de l'aéroport de Lyon Saint-Exupéry : prix total pour les dates, navette gratuite vers le Terminal 1 ou voiturier selon le parking, réservation et paiement en ligne, et une application qui montre la navette en direct le jour du départ et au retour.`,
    "Faits sur l'aéroport à respecter : le Terminal 2 est fermé depuis le 1er avril 2026, tout passe par le Terminal 1 ; les navettes des parkings extérieurs ne déposent pas devant l'aérogare.",
    'Règles de la réponse :',
    '- En français, ton simple et poli, au plus 700 caractères, en texte brut (ni markdown ni émoji).',
    "- Réponds d'abord à la question posée, avec des conseils utiles même sans Plazo (réserver tôt, comparer le prix total, vérifier la navette et ses horaires).",
    `- Si ${productName} aide vraiment pour cette question, cite-le une fois avec son adresse ${siteUrl}, et dis clairement que tu fais partie de l'équipe de ${productName} (par exemple « je travaille sur ${productName} »). Jamais de faux avis de client.`,
    "- N'invente aucun prix, aucun chiffre, aucun parking, aucune promotion, aucun avis.",
    "- Si la discussion n'a rien à voir avec le stationnement à l'aéroport de Lyon, ou si elle est trop ancienne ou close, mets relevant à false et reply vide.",
    'Réponds en JSON : { "relevant": booléen, "reply": texte }.',
  ].join('\n');
}

export function forumReplyInput(thread: SearchResult): string {
  return [`Titre : ${thread.title}`, `Adresse : ${thread.url}`, `Extrait : ${thread.description || '(aucun)'}`].join('\n');
}

/** Claude's reply kept only when short, plain and free of figures it could have made up (a price, a duration). */
export function checkForumReply(reply: string): string | null {
  const text = reply.replace(/\s+\n/g, '\n').trim();
  if (!text || text.length > 900) return null;
  if (/\d+\s*(€|euros?|min|minutes|%)/i.test(text)) return null;
  if (/terminal\s*2/i.test(text)) return null;
  return text;
}

/** The morning mail to the platform's administrators. */
export function forumWatchEmail(productName: string, data: { day: string; threads: ForumThread[] }): EmailMessage {
  const [y, m, d] = data.day.split('-');
  const n = data.threads.length;
  const subject = `Veille des forums du ${d}/${m}/${y} : ${n} discussion${n > 1 ? 's' : ''}`;
  const intro = `${n} nouvelle${n > 1 ? 's' : ''} discussion${n > 1 ? 's' : ''} sur le stationnement à l'aéroport de Lyon. Relisez la réponse proposée, adaptez-la, puis postez-la vous-même avec votre compte : ${productName} ne poste rien.`;
  const blocks = data.threads
    .map(t => {
      const reply = t.reply
        ? `<p style="margin:10px 0 0;font-size:12px;color:${COLORS.soft};text-transform:uppercase;letter-spacing:.06em">Réponse proposée</p><div style="margin:4px 0 0;padding:10px 12px;border-radius:10px;background:#F4F6F2;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(t.reply)}</div>`
        : `<p style="margin:10px 0 0;font-size:13px;color:${COLORS.soft}">Pas de réponse proposée : ${escapeHtml(productName)} n'a rien d'utile à y ajouter.</p>`;
      return `<div style="margin:16px 0 0;padding:14px 0 0;border-top:1px solid ${COLORS.line}">
<a href="${escapeHtml(t.url)}" style="font-size:16px;font-weight:700;color:${COLORS.deep};text-decoration:none">${escapeHtml(t.title)}</a>
<p style="margin:4px 0 0;font-size:13px;color:${COLORS.soft}">${escapeHtml([t.host, t.age].filter(Boolean).join(' · '))}</p>
${t.description ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.5">${escapeHtml(t.description)}</p>` : ''}
${reply}</div>`;
    })
    .join('');
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 4px;font-size:22px;color:${COLORS.deep}">Veille des forums</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${escapeHtml(intro)}</p>${blocks}`,
  );
  const text = [
    'Veille des forums',
    '',
    intro,
    ...data.threads.flatMap(t => [
      '',
      `— ${t.title}`,
      t.url,
      ...(t.description ? [t.description] : []),
      t.reply ? `Réponse proposée :\n${t.reply}` : 'Pas de réponse proposée.',
    ]),
    '',
    `— ${productName}`,
  ].join('\n');
  return { subject, html, text };
}
