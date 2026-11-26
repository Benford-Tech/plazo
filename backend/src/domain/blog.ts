/**
 * 26/11/2026 (« Pour le SEO », « Un par jour, je valide chaque article », choix B « Le calendrier de la semaine »): one SEO
 * article a day on www.plazo.fr/blog, written by Claude the night before from Plazo's real facts (partner parkings and
 * their prices, the airport's official figures, the existing guides) and published only once a platform admin
 * validates it. Pure side: the day arithmetic, the facts, the instructions, the answers' schemas and the checks; the
 * calls live in `BlogService`.
 */
import { COLORS, escapeHtml, layout } from './account-messages';
import { EmailMessage, formatEuros } from './booking-messages';
import { numbersIn, spelledNumbersIn } from './listing-description';
import { quoteCents, Tier } from './pricing';
import { addDays, localDate } from './time';

export const BLOG_TIMEZONE = 'Europe/Paris';
/** The airport the articles are about (the site's guides cover this one only). */
export const BLOG_AIRPORT_SLUG = 'lyon-saint-exupery';
/** Topics are planned this many days ahead. */
export const BLOG_PLAN_DAYS = 7;
/** What the instructions ask for; below the minimum the admin is warned. */
export const BLOG_TARGET_WORDS = '900 à 1 300';
export const BLOG_MIN_WORDS = 600;

export const BLOG_LIMITS = {
  topic: 200,
  query: 200,
  slug: 100,
  title: 140,
  metaTitle: 70,
  metaDescription: 170,
  intro: 800,
  body: 30000,
  instruction: 600,
} as const;

/**
 * The site's guides an article may point to (`site/src/lib/guides/topics.ts`, copied: slugs and labels only). Their
 * address is /lyon-saint-exupery/guide/<slug>.
 */
export const BLOG_GUIDES: readonly { slug: string; label: string }[] = [
  { slug: 'parking-pas-cher', label: 'Parking pas cher' },
  { slug: 'parking-longue-duree', label: 'Parking longue durée' },
  { slug: 'parking-voiturier', label: 'Parking avec voiturier' },
  { slug: 'parking-vol-tot-le-matin', label: 'Vol tôt le matin' },
  { slug: 'parking-en-famille', label: 'Parking en famille' },
  { slug: 'parking-voiture-electrique', label: 'Voiture électrique' },
  { slug: 'parking-week-end', label: 'Parking week-end' },
  { slug: 'parking-voyage-affaires', label: "Voyage d'affaires" },
  { slug: 'parking-gare-tgv', label: 'Parking gare TGV' },
  { slug: 'depuis-grenoble', label: 'Depuis Grenoble' },
  { slug: 'depuis-chambery', label: 'Depuis Chambéry' },
  { slug: 'depuis-annecy', label: 'Depuis Annecy' },
  { slug: 'depuis-saint-etienne', label: 'Depuis Saint-Étienne' },
  { slug: 'depuis-bourgoin-jallieu', label: 'Depuis Bourgoin-Jallieu' },
  { slug: 'depuis-vienne', label: 'Depuis Vienne' },
  { slug: 'depuis-villefranche-sur-saone', label: 'Depuis Villefranche-sur-Saône' },
  { slug: 'depuis-macon', label: 'Depuis Mâcon' },
  { slug: 'depuis-bourg-en-bresse', label: 'Depuis Bourg-en-Bresse' },
];
const GUIDE_SLUGS = new Set(BLOG_GUIDES.map(g => g.slug));

export interface BlogFact {
  label: string;
  value: string;
  source: string;
}

/**
 * The airport's own figures, copied from the site's guide (`LYON_OFFICIAL` of `site/src/lib/airport-guides.ts`, read on
 * lyonaeroports.com on 09/10/2026, 2026 tariff sheet without booking). Change both together.
 */
export const LYON_AIRPORT_FACTS: readonly BlogFact[] = [
  { label: 'Aéroport', value: 'Lyon Saint-Exupéry, à Colombier-Saugnieu, à l’est de Lyon', source: 'lyonaeroports.com' },
  {
    label: 'Aérogare',
    value: 'depuis le 1er avril 2026, tous les vols partent du Terminal 1, seule aérogare ouverte',
    source: 'lyonaeroports.com',
  },
  { label: 'Gare TGV', value: 'la gare Lyon Saint-Exupéry TGV est reliée à l’aérogare par une passerelle', source: 'lyonaeroports.com' },
  {
    label: 'Parkings officiels, une semaine sans réservation (grille 2026)',
    value: 'P5 76,90 €, P4 139,40 €, P3 156,90 €, P2 170,90 €, P0 et P1 194,90 €',
    source: 'lyonaeroports.com, grille tarifaire 2026',
  },
  {
    label: 'Parkings officiels, 24 h sans réservation (grille 2026)',
    value: 'P5 24,40 €, P4 26,90 €, P2 et P3 30,90 €, P0 et P1 32,90 €',
    source: 'lyonaeroports.com, grille tarifaire 2026',
  },
  {
    label: 'Navette du P5',
    value: 'toutes les 7 minutes de 6 h à minuit, toutes les 10 minutes la nuit',
    source: 'lyonaeroports.com',
  },
  { label: 'Dépose-minute', value: '10 premières minutes gratuites', source: 'lyonaeroports.com, grille tarifaire 2026' },
  {
    label: 'Conseil de l’aéroport',
    value: 'arriver 2 h avant un vol en France, 2 h 30 avant un vol dans l’espace Schengen, 3 h avant un vol international',
    source: 'lyonaeroports.com',
  },
];

/** What Plazo is and does for a traveller (true for every partner parking). */
export const PLAZO_FACTS: readonly BlogFact[] = [
  {
    label: 'Plazo',
    value:
      'site et application où les voyageurs comparent et réservent un parking privé près de l’aéroport, prix total affiché, paiement en ligne à la réservation',
    source: 'Plazo',
  },
  {
    label: 'Le jour du départ avec Plazo',
    value: 'le voyageur prévient de son arrivée, suit la navette en direct quand le parking la montre, retrouve sa réservation dans l’application',
    source: 'Plazo',
  },
  { label: 'Au retour avec Plazo', value: 'le parking suit le vol retour et donne le point de rendez-vous à l’atterrissage', source: 'Plazo' },
];

/** A partner parking as the server reads it (published listing at the airport, real operator). */
export interface PartnerSource {
  title: string;
  services: string[];
  shuttleMinutes: number | null;
  tiers: Tier[];
  extraDayPriceCents: number | null;
}

const SERVICE_WORDS: Record<string, string> = {
  shuttle: 'navette',
  valet: 'voiturier',
  covered: 'places couvertes',
  ev_charging: 'recharge électrique',
  open_24h: 'ouvert 24h/24',
  fenced: 'clôturé',
  cctv: 'vidéosurveillance',
};

/** The partner parkings' facts: one line each (8-day price, shuttle, services), then the cheapest 8 days. */
export function partnerFacts(partners: PartnerSource[], readOn: string): BlogFact[] {
  const source = `prix des parkings partenaires de Plazo relevés le ${frenchDate(readOn)}`;
  const facts: BlogFact[] = [];
  let cheapest: number | null = null;
  for (const p of partners) {
    const week = quoteCents(p.tiers, p.extraDayPriceCents, 8);
    const day = quoteCents(p.tiers, p.extraDayPriceCents, 1);
    if (week !== null) cheapest = cheapest === null ? week : Math.min(cheapest, week);
    const parts = [
      week !== null ? `8 jours ${formatEuros(week)}` : null,
      day !== null ? `1 jour ${formatEuros(day)}` : null,
      p.shuttleMinutes ? `navette ${p.shuttleMinutes} min jusqu’au Terminal 1` : null,
      p.services
        .map(s => SERVICE_WORDS[s])
        .filter(Boolean)
        .join(', ') || null,
    ].filter(Boolean);
    if (parts.length) facts.push({ label: `Parking partenaire « ${p.title} »`, value: parts.join(' · '), source });
  }
  if (partners.length) facts.push({ label: 'Parkings partenaires de Plazo à Lyon Saint-Exupéry', value: String(partners.length), source });
  if (cheapest !== null) facts.push({ label: 'Partenaires, 8 jours navette comprise', value: `dès ${formatEuros(cheapest)}`, source });
  return facts;
}

export function factsText(facts: readonly BlogFact[]): string {
  return facts.map(f => `- ${f.label} : ${f.value} (source : ${f.source})`).join('\n');
}

// ---- Days -----------------------------------------------------------------------------------------------------------

export function blogToday(now: Date): string {
  return localDate(now, BLOG_TIMEZONE);
}

export function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** The Monday of the week holding `day`. */
export function mondayOf(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7));
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function frenchDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`;
}

// ---- Text -----------------------------------------------------------------------------------------------------------

/** An article's address: lowercase words, no accent, dashes. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= BLOG_LIMITS.slug;
}

export function wordCount(...texts: (string | null | undefined)[]): number {
  return texts.reduce((n, t) => n + (t?.match(/[\p{L}\d]+(?:['’-][\p{L}\d]+)*/gu)?.length ?? 0), 0);
}

/** The body as written: lines trimmed, at most one blank line in a row, no HTML tag nor markdown link. */
export function cleanBody(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .split('\n')
    .map(l =>
      l
        .trim()
        .replace(/^[*•]\s+/, '- ')
        .replace(/^#{3,}\s+/, '## ')
        .replace(/^#\s+/, '## '),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const oneLine = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

// ---- Planning ---------------------------------------------------------------------------------------------------------

export const BLOG_TOPICS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['topics'],
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['topic', 'query'],
        properties: { topic: { type: 'string' }, query: { type: 'string' } },
      },
    },
  },
};

export function blogTopicsPrompt(productName: string): string {
  return `Tu prépares le calendrier éditorial du blog de ${productName}, un site où les voyageurs comparent et réservent un parking privé près de l'aéroport de Lyon Saint-Exupéry, navette comprise.

Pour chaque jour demandé, propose un sujet d'article utile à un voyageur qui cherche où garer sa voiture pour prendre l'avion à Lyon, et la requête Google qu'il vise (en minuscules, telle qu'un voyageur la tape).
- Des sujets concrets et variés : périodes de départ (vacances scolaires, ponts, ski, été), situations (vol annulé ou retardé, départ très tôt, retour de nuit, famille, voiture électrique, moto, camping-car, longue durée), comparaisons (navette ou voiturier, parking officiel ou privé), venir depuis une ville de la région.
- Jamais deux fois le même sujet, ni un sujet déjà publié ou prévu (la liste t'est donnée), ni un sujet que couvre déjà un guide du site.
- Rien sur le Terminal 2 (fermé), rien qui demande des chiffres que tu n'aurais pas.
- Le sujet tient en une phrase courte (moins de 80 caractères).

Réponds en JSON : { "topics": [ { "topic": "…", "query": "…" } ] }, un sujet par jour demandé, dans l'ordre des jours.`;
}

export function blogTopicsInput(data: { days: string[]; taken: string[]; queries: { query: string; impressions: number }[] }): string {
  const guides = BLOG_GUIDES.map(g => `- ${g.label}`).join('\n');
  const taken = data.taken.length ? data.taken.map(t => `- ${t}`).join('\n') : '- (aucun)';
  const queries = data.queries.length ? data.queries.map(q => `- ${q.query} (${q.impressions} affichages)`).join('\n') : '- (pas encore de données)';
  return `Jours à prévoir (${data.days.length}) : ${data.days.map(frenchDate).join(', ')}.

Guides déjà sur le site :
${guides}

Sujets déjà publiés ou prévus :
${taken}

Requêtes qui affichent déjà le site dans Google ces 28 derniers jours (Search Console) :
${queries}`;
}

export function readTopics(raw: unknown, count: number): { topic: string; query: string | null }[] {
  const list = (raw as { topics?: unknown })?.topics;
  if (!Array.isArray(list)) return [];
  return list
    .map(t => ({
      topic: oneLine((t as { topic?: unknown })?.topic as string).slice(0, BLOG_LIMITS.topic),
      query:
        oneLine((t as { query?: unknown })?.query as string)
          .toLowerCase()
          .slice(0, BLOG_LIMITS.query) || null,
    }))
    .filter(t => t.topic)
    .slice(0, count);
}

// ---- Writing ---------------------------------------------------------------------------------------------------------

export const BLOG_ARTICLE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'metaTitle', 'metaDescription', 'slug', 'intro', 'body', 'related', 'sources'],
  properties: {
    title: { type: 'string' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    slug: { type: 'string' },
    intro: { type: 'string' },
    body: { type: 'string' },
    related: { type: 'array', items: { type: 'string' } },
    sources: { type: 'array', items: { type: 'string' } },
  },
};

export function blogArticlePrompt(productName: string): string {
  return `Tu écris un article du blog de ${productName}, un site où les voyageurs comparent et réservent un parking privé près de l'aéroport de Lyon Saint-Exupéry. L'article doit répondre vraiment à la question du voyageur et bien se classer sur la requête Google visée.

Règles :
- En français, vouvoiement, ton sobre et concret, phrases courtes. ${BLOG_TARGET_WORDS} mots.
- "intro" : un chapeau de 2 phrases qui répond tout de suite à la question.
- "body" : texte brut ; paragraphes séparés par une ligne vide ; intertitres sur leur propre ligne commençant par "## " (4 à 6 intertitres, formulés comme les questions d'un voyageur) ; listes à puces avec des lignes commençant par "- ". Ni lien, ni HTML, ni gras, ni émoji, ni tableau. Pas de titre principal dans le body.
- N'utilise que les faits fournis pour tout chiffre : prix, durée, distance, horaire, date, nombre. Un chiffre absent des faits n'est pas écrit. Les conseils généraux sans chiffre sont permis. Quand une information utile manque (dates de vacances scolaires, par exemple), dis au voyageur où la vérifier sans l'inventer.
- Ne parle jamais du « Terminal 2 » : tous les vols partent du Terminal 1.
- Le paiement d'une réservation sur ${productName} se fait toujours en ligne : n'écris jamais qu'on paie sur place.
- Aucun superlatif ni promesse (« le meilleur », « le moins cher », « garanti »…), aucun point d'exclamation, aucun concurrent nommé.
- Cite ${productName} quand il aide (comparer les parkings, réserver, suivre la navette), sans en faire une publicité.
- "title" : le titre de l'article (60 à 90 caractères) ; "metaTitle" : 60 caractères au plus, la requête visée au début ; "metaDescription" : 150 caractères au plus ; "slug" : l'adresse en minuscules sans accent, mots séparés par des tirets, 6 mots au plus.
- "related" : 2 à 4 guides du site en rapport, par leur identifiant (liste fournie).
- "sources" : les sources des faits que tu as utilisés, telles qu'elles sont écrites dans les faits.

Réponds en JSON.`;
}

export function blogArticleInput(data: {
  day: string;
  topic: string;
  query: string | null;
  facts: readonly BlogFact[];
  taken: string[];
  previous?: { title: string; intro: string; body: string } | null;
  instruction?: string | null;
}): string {
  const guides = BLOG_GUIDES.map(g => `- ${g.slug} : ${g.label}`).join('\n');
  const parts = [
    `Date de publication : ${frenchDate(data.day)}.`,
    `Sujet : ${data.topic}`,
    data.query ? `Requête Google visée : ${data.query}` : null,
    `Faits (les seuls chiffres permis) :\n${factsText(data.facts)}`,
    `Guides du site (identifiant : titre) :\n${guides}`,
    data.taken.length ? `Articles déjà publiés (ne pas les répéter) :\n${data.taken.map(t => `- ${t}`).join('\n')}` : null,
  ];
  if (data.previous) {
    parts.push(`Version actuelle de l'article :\nTitre : ${data.previous.title}\nChapeau : ${data.previous.intro}\n"""\n${data.previous.body}\n"""`);
    parts.push(
      data.instruction
        ? `Réécris l'article en suivant cette consigne de l'éditeur, sans enfreindre les règles : ${data.instruction}`
        : "Réécris l'article : même sujet, une version nouvelle.",
    );
  } else {
    parts.push("Écris l'article.");
  }
  return parts.filter(Boolean).join('\n\n');
}

export interface ArticleDraft {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  intro: string;
  body: string;
  related: string[];
  sources: string[];
}

/** Claude's answer, cleaned and cut to the limits; null when nothing usable came back. */
export function readArticle(raw: unknown, topic: string): ArticleDraft | null {
  const a = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const title = oneLine(str(a.title)).slice(0, BLOG_LIMITS.title);
  const body = cleanBody(str(a.body)).slice(0, BLOG_LIMITS.body);
  if (!title || !body) return null;
  const slug = slugify(str(a.slug) || title) || slugify(topic);
  const list = (v: unknown) =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string')
          .map(oneLine)
          .filter(Boolean)
      : [];
  return {
    title,
    metaTitle: oneLine(str(a.metaTitle) || title).slice(0, BLOG_LIMITS.metaTitle),
    metaDescription: oneLine(str(a.metaDescription)).slice(0, BLOG_LIMITS.metaDescription),
    slug,
    intro: oneLine(str(a.intro)).slice(0, BLOG_LIMITS.intro),
    body,
    related: [...new Set(list(a.related).filter(s => GUIDE_SLUGS.has(s)))].slice(0, 4),
    sources: [...new Set(list(a.sources))].slice(0, 8),
  };
}

/** Writing that would put Plazo in the wrong: the closed terminal, or payment at the parking. */
export function forbiddenIn(text: string): ('terminal_2' | 'pay_on_site')[] {
  const found: ('terminal_2' | 'pay_on_site')[] = [];
  if (/terminal\s*(?:2|deux)(?![\p{L}\d])|\bT2\b/iu.test(text)) found.push('terminal_2');
  if (/pa(?:ie|y)\p{L}*\s+(?:sur place|au parking|à l['’]arrivée)/iu.test(text)) found.push('pay_on_site');
  return found;
}

/**
 * What the admin must check before publishing, worded for the review screen: the figures absent from the facts
 * (« à vérifier »), the forbidden mentions, a text too short, missing meta data, a taken address.
 */
export function articleWarnings(
  article: { title: string; metaTitle: string | null; metaDescription: string | null; intro: string | null; body: string },
  facts: readonly BlogFact[],
): string[] {
  const warnings: string[] = [];
  const all = [article.title, article.metaTitle, article.metaDescription, article.intro, article.body].filter(Boolean).join('\n');
  const forbidden = forbiddenIn(all);
  if (forbidden.includes('terminal_2')) warnings.push('Parle du Terminal 2, fermé depuis le 1er avril 2026 : à retirer.');
  if (forbidden.includes('pay_on_site')) warnings.push('Parle d’un paiement sur place : tout se paie en ligne, à retirer.');
  const known = new Set([...numbersIn(factsText(facts)), ...spelledNumbersIn(factsText(facts)), '1']);
  const unknown = [...new Set([...numbersIn(all), ...spelledNumbersIn(all)])].filter(n => !known.has(n));
  if (unknown.length) warnings.push(`Chiffres absents des faits, à vérifier : ${unknown.slice(0, 8).join(', ')}.`);
  const words = wordCount(article.intro, article.body);
  if (words < BLOG_MIN_WORDS) warnings.push(`Texte court : ${words} mots (${BLOG_MIN_WORDS} au moins conseillés).`);
  if (!article.metaDescription) warnings.push('Pas de description pour Google.');
  else if (article.metaDescription.length > 160) warnings.push('Description pour Google trop longue (160 caractères au plus).');
  if ((article.metaTitle ?? article.title).length > 60) warnings.push('Titre pour Google trop long (60 caractères au plus).');
  return warnings;
}

/** A warning that blocks the publication (the others are for the admin's judgment). */
export function blocksPublication(text: string): boolean {
  return forbiddenIn(text).length > 0;
}

// ---- Mail ------------------------------------------------------------------------------------------------------------

export function blogReviewEmail(
  productName: string,
  data: { day: string; title: string; topic: string; warnings: string[]; url: string },
): EmailMessage {
  const subject = `Article du jour à valider : ${data.title}`;
  const intro = `L'article du ${frenchDate(data.day)} est écrit. Il ne sera publié qu'après votre validation.`;
  const warnings = data.warnings.length
    ? `<ul style="margin:10px 0 0;padding-left:18px;font-size:14px;line-height:1.5;color:#B45309">${data.warnings
        .map(w => `<li>${escapeHtml(w)}</li>`)
        .join('')}</ul>`
    : `<p style="margin:10px 0 0;font-size:14px;color:${COLORS.deep}">Aucun point à vérifier.</p>`;
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 4px;font-size:22px;color:${COLORS.deep}">${escapeHtml(data.title)}</h1>
<p style="margin:4px 0 0;font-size:13px;color:${COLORS.soft}">${escapeHtml(data.topic)}</p>
<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${escapeHtml(intro)}</p>${warnings}
<p style="margin:18px 0 0"><a href="${escapeHtml(data.url)}" style="display:inline-block;background:#A3E635;color:#0F2A14;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:999px">Relire et publier</a></p>`,
  );
  const text = [data.title, '', intro, ...data.warnings.map(w => `- ${w}`), '', `Relire et publier : ${data.url}`, '', `— ${productName}`].join('\n');
  return { subject, html, text };
}
