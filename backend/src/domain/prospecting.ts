import { airportCity } from './airport-names';
import { createHash } from 'crypto';
import { APPLE_REVIEW_NOTE, proStoreBadges, storeBadgesHtml, travellerStoreBadges } from './account-messages';
import { EmailMessage } from './booking-messages';
import { parseLanguage, parseRegion, PROSPECT_LANGUAGES, ProspectLanguage, RegionKey } from './prospect-regions';
export type { ProspectLanguage } from './prospect-regions';
export { displayPhone } from '@/domain/phone';
import { displayPhone } from '@/domain/phone';
import { addDays, localDate, localDateTime, parseInstant } from './time';

/**
 * Prospection (Plateforme › Prospection, 18/10/2026, choix « A avec les relances de B »): the pure rules. A sequence of
 * three emails (first contact, follow-up, last message) with variables, sent Monday to Friday from 09:00 to 18:00
 * (Europe/Paris), at most `dailyCap` a day; a reply, an interest or an unsubscription stops it for good.
 */

export const PROSPECTING_TZ = 'Europe/Paris';
export const WINDOW_START = '09:00';
export const WINDOW_END = '18:00';
export const DEFAULT_DAILY_CAP = 50;
export const MAX_DAILY_CAP = 300;
/** Prospects are deleted this long after the last contact (or their creation when never contacted): CNIL, B2B. */
export const RETENTION_YEARS = 3;
/** Brevo refusals in a row on the same step before the follow-ups stop. */
export const MAX_FAILED_ATTEMPTS = 3;
/** A failed send is tried again this much later (inside the window). */
export const RETRY_AFTER_MINUTES = 60;
export const MAX_IMPORT_ROWS = 2000;

export type ProspectStatusName = 'to_contact' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'unsubscribed';
export const PROSPECT_STATUSES: ProspectStatusName[] = ['to_contact', 'contacted', 'replied', 'interested', 'not_interested', 'unsubscribed'];
/** Statuses that end the sequence: nothing is ever sent to them again. */
export const CLOSED_STATUSES: ProspectStatusName[] = ['replied', 'interested', 'not_interested', 'unsubscribed'];
export const isClosed = (status: ProspectStatusName): boolean => CLOSED_STATUSES.includes(status);

// ---- The sequence --------------------------------------------------------------------------------------------------

export interface SequenceStep {
  step: 1 | 2 | 3;
  enabled: boolean;
  /** Days after the first contact (J0); 0 for the first step. */
  delayDays: number;
  subject: string;
  body: string;
}

// 21/10/2026: {lien_demo}, the prospect's own link to the demo of Plazo Pro (14 days, made when the mail leaves).
export const VARIABLES = ['prénom', 'nom', 'parking', 'aéroport', 'ville', 'lien_demo'] as const;
export type VariableName = (typeof VARIABLES)[number];
export type TemplateValues = Record<VariableName, string>;

/** Plazo's own texts, until the platform admin writes theirs (« Modifier les mails »). */
export function defaultSteps(productName: string, language: ProspectLanguage = 'fr'): SequenceStep[] {
  if (language === 'de') return germanSteps(productName);
  if (language === 'en') return englishSteps(productName);
  // 08/11/2026 (« un mail concis avec les liens store et le lien de démo, une liste des fonctionnalités de Plazo Pro et
  // l'avantage pour leurs utilisateurs ; dis qu'une dizaine de parkings l'utilisent déjà »): short mails, the features as a
  // list, what the parking's customers gain, {lien_demo} (the button) in each; the store badges are added by prospectEmail.
  // Every feature named is live today; the « dizaine de parkings » is Joanny's own claim.
  return [
    {
      step: 1,
      enabled: true,
      delayDays: 0,
      subject: '{parking} : vos réservations, sans recopie',
      body:
        'Bonjour {prénom},\n\n' +
        `${productName} Pro est le logiciel des parkings d'aéroport avec navette ou voiturier. Une dizaine de parkings ` +
        "l'utilisent déjà au quotidien.\n\n" +
        'Pour votre équipe :\n' +
        '- les réservations des comparateurs (Allopark, Onepark, ParkVia…) arrivent seules dans un planning unique ;\n' +
        '- la navette : qui emmener, qui aller chercher, vols retour suivis ;\n' +
        '- le plan du parking, la place de chaque voiture et ses clés ;\n' +
        "- le contrat signé et l'état des lieux en photos sur le téléphone ;\n" +
        "- le SMS de la veille et le chiffre d'affaires net des commissions.\n\n" +
        'Pour vos clients :\n' +
        `- ils suivent la navette en direct dans l'application ${productName}, sur l'App Store et Google Play ;\n` +
        "- à l'atterrissage, ils reçoivent le point de rendez-vous : plus besoin d'appeler ;\n" +
        '- ils retrouvent leur réservation et leur voiture en un geste.\n\n' +
        'Essayez la démo en deux minutes : {lien_demo}\n\n' +
        `${productName} Pro s'installe sur iPhone et Android (liens ci-dessous). Une question ? Répondez simplement à ce mail.\n\n` +
        'Bien à vous,',
    },
    {
      step: 2,
      enabled: true,
      delayDays: 4,
      subject: "Vos clients appellent-ils à l'atterrissage ?",
      body:
        'Bonjour {prénom},\n\n' +
        `Avec ${productName} Pro, le téléphone ne sonne plus au retour des vacances :\n` +
        "- le vol retour est suivi, un retard décale seul l'heure de passage ;\n" +
        '- votre chauffeur voit sa liste à jour sur son téléphone ;\n' +
        `- votre client reçoit le point de rendez-vous et voit la navette arriver dans ${productName}.\n\n` +
        'Une dizaine de parkings travaillent déjà ainsi. Voyez-le sur la démo : {lien_demo}\n\n' +
        'Bien à vous,',
    },
    {
      step: 3,
      enabled: true,
      delayDays: 10,
      subject: 'Je ne vous dérange plus',
      body:
        'Bonjour {prénom},\n\n' +
        "C'est mon dernier message. Si la recopie des réservations ou les appels à l'atterrissage vous pèsent un jour, " +
        'répondez à ce mail : nous préparons tout sur {parking}, plan et tarifs compris.\n\n' +
        'La démo reste ouverte : {lien_demo}\n\n' +
        'Bonne continuation,',
    },
  ];
}

/**
 * 13/11/2026 (« fais les 3 », the European prospects): the same three mails in German and in English. Same delays and
 * switches as the French ones (only the subject and the text are translated); the comparators named are the European
 * ones Plazo reads, and « une dizaine de parkings » says « in France », where they are.
 */
function germanSteps(P: string): SequenceStep[] {
  return [
    {
      step: 1,
      enabled: true,
      delayDays: 0,
      subject: '{parking}: Ihre Buchungen, ohne Abtippen',
      body:
        'Hallo {prénom},\n\n' +
        `${P} Pro ist die Software für Flughafenparkplätze mit Shuttle oder Valet-Service. Rund zehn Parkplätze in Frankreich ` +
        'arbeiten bereits täglich damit.\n\n' +
        'Für Ihr Team:\n' +
        '- die Buchungen der Vergleichsportale (ParkVia, Parclick, ParkMundo…) landen von selbst in einem einzigen Tagesplan;\n' +
        '- der Shuttle: wer hingebracht und wer abgeholt wird, Rückflüge werden verfolgt;\n' +
        '- der Lageplan des Parkplatzes, der Stellplatz jedes Fahrzeugs und seine Schlüssel;\n' +
        '- der unterschriebene Vertrag und das Übergabeprotokoll mit Fotos auf dem Smartphone;\n' +
        '- die Erinnerung am Vortag und der Umsatz nach Abzug der Provisionen.\n\n' +
        'Für Ihre Kunden:\n' +
        `- sie verfolgen den Shuttle live in der App ${P}, im App Store und bei Google Play;\n` +
        '- nach der Landung erhalten sie den Treffpunkt: Anrufen ist nicht mehr nötig;\n' +
        '- sie finden ihre Buchung und ihr Auto mit einem Fingertipp.\n\n' +
        'Testen Sie die Demo in zwei Minuten: {lien_demo}\n\n' +
        `${P} Pro läuft auf iPhone und Android (Links unten). Eine Frage? Antworten Sie einfach auf diese E-Mail.\n\n` +
        'Mit freundlichen Grüßen',
    },
    {
      step: 2,
      enabled: true,
      delayDays: 4,
      subject: 'Rufen Ihre Kunden nach der Landung an?',
      body:
        'Hallo {prénom},\n\n' +
        `mit ${P} Pro klingelt das Telefon nicht mehr, wenn Ihre Kunden aus dem Urlaub zurückkommen:\n` +
        '- der Rückflug wird verfolgt, eine Verspätung verschiebt die Abholzeit von selbst;\n' +
        '- Ihr Fahrer sieht seine aktuelle Liste auf dem Smartphone;\n' +
        `- Ihr Kunde erhält den Treffpunkt und sieht den Shuttle in ${P} kommen.\n\n` +
        'Rund zehn Parkplätze arbeiten bereits so. Sehen Sie es sich in der Demo an: {lien_demo}\n\n' +
        'Mit freundlichen Grüßen',
    },
    {
      step: 3,
      enabled: true,
      delayDays: 10,
      subject: 'Ich melde mich nicht mehr',
      body:
        'Hallo {prénom},\n\n' +
        'das ist meine letzte Nachricht. Falls Ihnen das Abtippen der Buchungen oder die Anrufe nach der Landung eines Tages ' +
        'zu viel werden, antworten Sie einfach auf diese E-Mail: Wir richten alles für {parking} ein, Lageplan und Preise inklusive.\n\n' +
        'Die Demo bleibt offen: {lien_demo}\n\n' +
        'Alles Gute',
    },
  ];
}

function englishSteps(P: string): SequenceStep[] {
  return [
    {
      step: 1,
      enabled: true,
      delayDays: 0,
      subject: '{parking}: your bookings, no retyping',
      body:
        'Hello {prénom},\n\n' +
        `${P} Pro is the software for airport car parks with a shuttle or valet service. Around ten car parks in France ` +
        'already run on it every day.\n\n' +
        'For your team:\n' +
        '- bookings from the comparison sites (ParkVia, Parclick, ParkMundo…) land by themselves in a single daily schedule;\n' +
        '- the shuttle: who to take, who to pick up, return flights tracked;\n' +
        "- the car park map, each car's space and its keys;\n" +
        '- the signed contract and the condition report with photos, on the phone;\n' +
        '- the reminder the day before, and revenue net of commissions.\n\n' +
        'For your customers:\n' +
        `- they follow the shuttle live in the ${P} app, on the App Store and Google Play;\n` +
        '- when they land, they get the meeting point: no need to call;\n' +
        '- they find their booking and their car in one tap.\n\n' +
        'Try the demo in two minutes: {lien_demo}\n\n' +
        `${P} Pro runs on iPhone and Android (links below). Any question? Just reply to this email.\n\n` +
        'Best regards,',
    },
    {
      step: 2,
      enabled: true,
      delayDays: 4,
      subject: 'Do your customers call when they land?',
      body:
        'Hello {prénom},\n\n' +
        `With ${P} Pro, the phone stops ringing when your customers come back from holiday:\n` +
        '- the return flight is tracked, and a delay moves the pick-up time by itself;\n' +
        '- your driver sees an up-to-date list on their phone;\n' +
        `- your customer gets the meeting point and watches the shuttle arrive in ${P}.\n\n` +
        'Around ten car parks already work this way. See it in the demo: {lien_demo}\n\n' +
        'Best regards,',
    },
    {
      step: 3,
      enabled: true,
      delayDays: 10,
      subject: "I won't bother you again",
      body:
        'Hello {prénom},\n\n' +
        'This is my last message. If retyping bookings or the calls at landing ever become too much, just reply to this ' +
        'email: we will set everything up for {parking}, map and prices included.\n\n' +
        'The demo stays open: {lien_demo}\n\n' +
        'All the best,',
    },
  ];
}

const VARIABLE_RE = /\{([^{}\s]{1,20})\}/g;
const ALIASES: Record<string, VariableName> = {
  prénom: 'prénom',
  prenom: 'prénom',
  nom: 'nom',
  parking: 'parking',
  aéroport: 'aéroport',
  aeroport: 'aéroport',
  ville: 'ville',
  lien_demo: 'lien_demo',
  lien_démo: 'lien_demo',
  liendemo: 'lien_demo',
};

/** Whether a step's subject or body says {lien_demo} (its link is then made, or kept, when the mail leaves). */
export const usesDemoLink = (step: { subject: string; body: string }) => /\{(?:lien_d[ée]mo|liendemo)\}/i.test(`${step.subject}\n${step.body}`);

/** The variables of a text that Plazo does not know (refused when the sequence is saved). */
export function unknownVariables(text: string): string[] {
  const unknown = new Set<string>();
  for (const match of text.matchAll(VARIABLE_RE)) {
    if (!ALIASES[match[1].toLowerCase()]) unknown.add(match[0]);
  }
  return [...unknown];
}

/**
 * Replaces the variables. An empty value leaves no stray mark behind: « Bonjour {prénom}, » without a first name gives
 * « Bonjour, ». Unknown variables stay as typed.
 */
export function renderTemplate(text: string, values: TemplateValues): string {
  const filled = text.replace(VARIABLE_RE, (whole, name: string) => {
    const key = ALIASES[name.toLowerCase()];
    return key ? values[key].trim() : whole;
  });
  return filled
    .split('\n')
    .map(line => line.replace(/[ \t]{2,}/g, ' ').replace(/ +,/g, ','))
    .join('\n');
}

/** A subject: one line, no punctuation left at its start by an empty variable, capital first letter. */
export function renderSubject(text: string, values: TemplateValues): string {
  const line = renderTemplate(text.replace(/[\r\n]+/g, ' '), values)
    .replace(/^[\s,;:.–-]+/, '')
    .trim();
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export interface ProspectForTemplate {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  town: string | null;
  airportCode: string | null;
}

export function templateValues(prospect: ProspectForTemplate, airportName: string | null, demoUrl = ''): TemplateValues {
  return {
    lien_demo: demoUrl,
    prénom: prospect.contactFirstName ?? '',
    nom: prospect.contactLastName ?? '',
    parking: prospect.companyName,
    // An airport Plazo does not serve (Genève, Zurich… for the Swiss prospects, 03/11/2026): its city, not the bare code.
    aéroport: airportName ?? airportCity(prospect.airportCode) ?? '',
    ville: prospect.town ?? '',
  };
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface Publisher {
  name: string;
  legalForm: string;
  address: string;
  registration: string;
}

/** « Benford Tech, société par actions simplifiée, 910 729 102 RCS Vienne, 29 chemin des Collines… » (empty parts left out). */
export function publisherLine(company: Publisher): string {
  return [company.name, company.legalForm, company.registration, company.address].filter(Boolean).join(', ');
}

/**
 * The email itself: the step's text with its variables, then the footer every message carries (who writes, why the
 * reader gets it, how to never hear from Plazo again). The body is plain text; the HTML is that text, escaped.
 */
/** An address typed in the text becomes a link (the text is already escaped: `&amp;` stays part of the address). */
function linkify(escaped: string): string {
  return escaped.replace(/https?:\/\/[^\s<]+?(?=[.,;:!?)]*(?:\s|$))/g, url => `<a href="${url}" style="color:#1E5E2E">${url}</a>`);
}

/** The words around the text, in the prospect's language (13/11/2026). */
interface Chrome {
  why: (parking: string, product: string) => string;
  who: (product: string, publisher: string) => string;
  stop: (product: string) => string;
  demo: (product: string) => string;
  teamApp: (product: string) => string;
  travellerApp: (product: string) => string;
  proPlay: (product: string) => string;
  proApple: (product: string) => string;
  appPlay: (product: string) => string;
  appApple: (product: string) => string;
  appleSoon: string;
  screens: [string, string, string];
  bannerAlt: string;
  unsubscribeSubject: string;
}

const CHROME: Record<ProspectLanguage, Chrome> = {
  fr: {
    why: (parking, product) =>
      `Vous recevez ce message à l'adresse professionnelle de ${parking}, parce que ${product} s'adresse aux parkings proches des aéroports.`,
    who: (product, publisher) => `${product} est édité par ${publisher}.`,
    stop: product => `Ne plus recevoir de messages de ${product}`,
    demo: product => `Voir la démo de ${product}`,
    teamApp: product => `L'application de l'équipe, ${product} Pro :`,
    travellerApp: product => `L'application de vos clients, ${product}, déjà sur l'App Store et Google Play :`,
    proPlay: product => `${product} Pro sur Google Play (Android)`,
    proApple: product => `${product} Pro sur l'App Store (iPhone)`,
    appPlay: product => `${product}, l'application de vos clients, sur Google Play (Android)`,
    appApple: product => `${product}, l'application de vos clients, sur l'App Store (iPhone)`,
    appleSoon: APPLE_REVIEW_NOTE,
    screens: ['Le planning du jour', 'La navette en direct', 'Chaque voiture à sa place'],
    bannerAlt: "Plazo Pro, le logiciel des parkings d'aéroport : navettes en direct, réservations des comparateurs, chaque voiture à sa place",
    unsubscribeSubject: 'Ne plus recevoir de messages',
  },
  de: {
    why: (parking, product) =>
      `Sie erhalten diese Nachricht an die geschäftliche Adresse von ${parking}, weil sich ${product} an Parkplätze in Flughafennähe richtet.`,
    who: (product, publisher) => `${product} wird herausgegeben von ${publisher}.`,
    stop: product => `Keine Nachrichten mehr von ${product} erhalten`,
    demo: product => `Demo von ${product} ansehen`,
    teamApp: product => `Die App für Ihr Team, ${product} Pro:`,
    travellerApp: product => `Die App für Ihre Kunden, ${product}, bereits im App Store und bei Google Play:`,
    proPlay: product => `${product} Pro bei Google Play (Android)`,
    proApple: product => `${product} Pro im App Store (iPhone)`,
    appPlay: product => `${product}, die App für Ihre Kunden, bei Google Play (Android)`,
    appApple: product => `${product}, die App für Ihre Kunden, im App Store (iPhone)`,
    appleSoon: 'Die Prüfung durch Apple läuft: Den Link erhalten Sie, sobald die App veröffentlicht ist.',
    screens: ['Der Tagesplan', 'Der Shuttle live', 'Jedes Auto an seinem Platz'],
    bannerAlt: 'Plazo Pro, die Software für Flughafenparkplätze: Shuttle live, Buchungen der Vergleichsportale, jedes Auto an seinem Platz',
    unsubscribeSubject: 'Keine Nachrichten mehr',
  },
  en: {
    why: (parking, product) =>
      `You are receiving this message at the business address of ${parking} because ${product} is made for car parks near airports.`,
    who: (product, publisher) => `${product} is published by ${publisher}.`,
    stop: product => `Stop receiving messages from ${product}`,
    demo: product => `See the ${product} demo`,
    teamApp: product => `Your team's app, ${product} Pro:`,
    travellerApp: product => `Your customers' app, ${product}, already on the App Store and Google Play:`,
    proPlay: product => `${product} Pro on Google Play (Android)`,
    proApple: product => `${product} Pro on the App Store (iPhone)`,
    appPlay: product => `${product}, your customers' app, on Google Play (Android)`,
    appApple: product => `${product}, your customers' app, on the App Store (iPhone)`,
    appleSoon: 'Apple is reviewing the app: we will send you the link as soon as it is published.',
    screens: ["The day's schedule", 'The shuttle, live', 'Every car in its space'],
    bannerAlt: 'Plazo Pro, the software for airport car parks: live shuttles, comparison-site bookings, every car in its space',
    unsubscribeSubject: 'Stop receiving messages',
  },
};

/** The subject of the mailto of List-Unsubscribe, in the prospect's language. */
export const unsubscribeSubject = (language: ProspectLanguage = 'fr'): string => CHROME[language].unsubscribeSubject;

export function prospectEmail(input: {
  productName: string;
  /** 13/11/2026: the language of the words around the text (the text itself is the step's). French by default. */
  language?: ProspectLanguage;
  company: Publisher;
  senderName: string;
  /** PROSPECTING_PHONE: written under the sender's name. */
  senderPhone?: string;
  step: Pick<SequenceStep, 'subject' | 'body'>;
  values: TemplateValues;
  unsubscribeUrl: string;
  /** 23/10/2026 (« avec les liens des apps sur le store »): Plazo Pro's badges under the signature; none without the site's address. */
  stores?: { badgesBase: string | null; playStoreUrl: string; appStoreUrl: string | null };
  /** 13/11/2026 (« Plazo client a été approuvé sur l'App Store »): the travellers' app Plazo, both stores, under Plazo Pro's. */
  travellerStores?: { playStoreUrl: string; appStoreUrl: string };
  /** 09/11/2026 (« il faut des images dans le mail pour illustrer », direction B): three Plazo Pro screens under the
   *  introduction, and the Plazo Pro banner on top (« mets A et B ensemble »); the first mail only, served by the site next
   *  to the badges (none without the site's address). */
  screens?: boolean;
}): EmailMessage {
  const subject = renderSubject(input.step.subject, input.values);
  const body = renderTemplate(input.step.body, input.values).trim();
  const phone = input.senderPhone?.trim() ? displayPhone(input.senderPhone) : '';
  const signatureLines = [input.senderName.trim(), phone].filter(Boolean);
  const signature = signatureLines.join('\n');
  const publisher = publisherLine(input.company);
  const language = input.language ?? 'fr';
  const words = CHROME[language];
  const why = words.why(input.values.parking, input.productName);
  const who = publisher ? words.who(input.productName, publisher) : '';
  const stop = words.stop(input.productName);

  const stores = input.stores;
  // French puts a space before the colon.
  const colon = language === 'fr' ? ' :' : ':';
  const storeLines = stores
    ? [
        `${words.proPlay(input.productName)}${colon} ${stores.playStoreUrl}`,
        `${words.proApple(input.productName)}${colon} ${stores.appStoreUrl ?? words.appleSoon}`,
        ...(input.travellerStores
          ? [
              `${words.appPlay(input.productName)}${colon} ${input.travellerStores.playStoreUrl}`,
              `${words.appApple(input.productName)}${colon} ${input.travellerStores.appStoreUrl}`,
            ]
          : []),
      ].join('\n')
    : '';
  const text = [body, signature, storeLines, '--', why, who, `${stop}${colon} ${input.unsubscribeUrl}`].filter(Boolean).join('\n\n');

  // 23/10/2026 (« mets à niveau le mail de prospection »): the operators' emails' shape (light ground, white card, the
  // Plazo plate), the text itself kept as the sender's own words; a « Voir la démo » button when the step gives the
  // prospect's demo link, so that the link is a tap and not only a URL in the text.
  const C = { ink: '#1A1D1A', soft: '#6B7280', line: '#E4E6E2', tint: '#EEF0EE', lime: '#A3E635', limeInk: '#0F2A14', deep: '#1E5E2E' };
  const demoUrl = input.values.lien_demo.trim();
  const blocks = body.split(/\n{2,}/).map(p => `<p style="margin:0 0 14px">${linkify(escapeHtml(p)).replace(/\n/g, '<br>')}</p>`);
  const screensBase = input.screens ? input.stores?.badgesBase : null;
  // Under the greeting and the introduction (the second paragraph), before the feature lists.
  if (screensBase) blocks.splice(Math.min(2, blocks.length), 0, screensHtml(screensBase, C, language === 'fr' ? undefined : words.screens));
  const paragraphs = blocks.join('');
  const demoButton = demoUrl
    ? `<p style="margin:4px 0 18px"><a href="${escapeHtml(demoUrl)}" style="display:inline-block;background:${C.lime};color:${C.limeInk};text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">${escapeHtml(words.demo(input.productName))}</a></p>`
    : '';
  const html = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.tint};font-family:Helvetica,Arial,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${C.line};border-radius:14px">
${
  // The banner carries the Plazo plate itself: the small plate is left out under it.
  screensBase
    ? bannerHtml(screensBase, demoUrl, words.bannerAlt)
    : `<tr><td style="padding:18px 24px 0"><span style="display:inline-block;background:${C.lime};color:${C.limeInk};font-weight:800;font-size:16px;padding:6px 12px;border-radius:8px">${escapeHtml(input.productName)}</span></td></tr>`
}
<tr><td style="padding:20px 24px 24px;font-size:15px;line-height:1.55">${paragraphs}${demoButton}${signature ? `<p style="margin:0 0 14px">${signatureLines.map(escapeHtml).join('<br>')}</p>` : ''}${
    stores?.badgesBase
      ? `<p style="margin:18px 0 0;font-size:13px;color:${C.soft}">${escapeHtml(words.teamApp(input.productName))}</p>${storeBadgesHtml(
          relabel(
            proStoreBadges(input.productName, { badgesBase: stores.badgesBase, playStoreUrl: stores.playStoreUrl, appStoreUrl: stores.appStoreUrl }),
            [words.proPlay(input.productName), words.proApple(input.productName)],
            words.appleSoon,
          ),
        )}${
          input.travellerStores
            ? `<p style="margin:14px 0 0;font-size:13px;color:${C.soft}">${escapeHtml(words.travellerApp(input.productName))}</p>${storeBadgesHtml(
                relabel(
                  travellerStoreBadges(input.productName, { badgesBase: stores.badgesBase, ...input.travellerStores }),
                  [words.appPlay(input.productName), words.appApple(input.productName)],
                  words.appleSoon,
                ),
              )}`
            : ''
        }`
      : ''
  }</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${C.soft};text-align:left">${escapeHtml(why)}${who ? ` ${escapeHtml(who)}` : ''}</p>
<p style="max-width:600px;margin:8px auto 0;font-size:12px;text-align:left"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${C.deep}">${escapeHtml(stop)}</a></p>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

/** The badges' alternative texts and note in the prospect's language. */
function relabel<T extends { label: string; note?: string }>(badges: T[], labels: string[], appleSoon: string): T[] {
  return badges.map((b, i) => ({ ...b, label: labels[i] ?? b.label, ...(b.note ? { note: appleSoon } : {}) }));
}

/** 09/11/2026 (« mets A et B ensemble »): the Plazo Pro share card on top of the first mail, a link to the demo when there is one. */
export const MAIL_BANNER = {
  file: 'plazo-pro-banniere.jpg',
  alt: "Plazo Pro, le logiciel des parkings d'aéroport : navettes en direct, réservations des comparateurs, chaque voiture à sa place",
} as const;

function bannerHtml(base: string, demoUrl: string, alt: string = MAIL_BANNER.alt): string {
  const img =
    `<img src="${escapeHtml(`${base.replace(/\/+$/, '')}/mail/${MAIL_BANNER.file}`)}" width="600" alt="${escapeHtml(alt)}" ` +
    'style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:14px 14px 0 0">';
  return `<tr><td style="padding:0;line-height:0">${demoUrl ? `<a href="${escapeHtml(demoUrl)}">${img}</a>` : img}</td></tr>`;
}

/** 09/11/2026: the screens of the first mail (files in site/public/mail, from the stores' screenshots of the demo parking). */
export const MAIL_SCREENS = [
  { file: 'plazo-pro-planning.jpg', label: 'Le planning du jour', alt: 'Le planning du jour dans Plazo Pro : arrivées et départs' },
  { file: 'plazo-pro-navette.jpg', label: 'La navette en direct', alt: 'La navette en route vers le terminal, suivie en direct' },
  { file: 'plazo-pro-places.jpg', label: 'Chaque voiture à sa place', alt: 'Les arrivées à ranger, avec la file proposée pour chaque voiture' },
] as const;

function screensHtml(base: string, C: { line: string; deep: string }, labels?: readonly string[]): string {
  const root = base.replace(/\/+$/, '');
  const cells = MAIL_SCREENS.map(
    (s, i) =>
      `<td width="33%" valign="top" align="center" style="padding:0 4px;font-size:12px;line-height:1.35;font-weight:700;color:${C.deep}">` +
      `<img src="${escapeHtml(`${root}/mail/${s.file}`)}" width="168" alt="${escapeHtml(labels?.[i] ?? s.alt)}" style="display:block;width:100%;max-width:168px;height:auto;border:1px solid ${C.line};border-radius:10px;margin:0 auto 6px">` +
      `${escapeHtml(labels?.[i] ?? s.label)}</td>`,
  ).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 18px;table-layout:fixed"><tr>${cells}</tr></table>`;
}

// ---- Validation ----------------------------------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[^\s@<>(),;:"[\]]{2,}$/;

export interface ProspectInput {
  companyName?: unknown;
  contactFirstName?: unknown;
  contactLastName?: unknown;
  email?: unknown;
  town?: unknown;
  airportCode?: unknown;
  /** A region key or name (« Auvergne-Rhône-Alpes »); null or empty: the airport's region. */
  region?: unknown;
  phone?: unknown;
  /** 13/11/2026: the parking's site (« www.exemple.de » or a full address). */
  website?: unknown;
  /** 13/11/2026: fr, de or en (or « Allemand », « English »…); null or empty: the region's language. */
  language?: unknown;
  notes?: unknown;
}

export interface ProspectFields {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  /** 13/11/2026 (« fais les 3 »): optional; a prospect without one is called, never emailed. */
  email: string | null;
  town: string | null;
  airportCode: string | null;
  region: RegionKey | null;
  phone: string | null;
  website: string | null;
  language: ProspectLanguage | null;
  notes: string | null;
}

type TextField = Exclude<keyof ProspectFields, 'region' | 'language'>;
const LIMITS: Record<TextField, number> = {
  companyName: 120,
  contactFirstName: 60,
  contactLastName: 60,
  email: 254,
  town: 80,
  airportCode: 10,
  phone: 30,
  website: 300,
  notes: 1000,
};

export const normalizeProspectEmail = (email: string): string => email.trim().toLowerCase();

/**
 * A site typed by a person: « www.exemple.de », « exemple.de/kontakt » or a full http(s) address, as an https address
 * (http kept when typed). Null when it is not a web address.
 */
export function normalizeWebsite(text: string): string | null {
  const raw = text.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!/^https?:$/.test(url.protocol) || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname) || url.username || url.password) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

/**
 * The key that finds a prospect without an email in the list (13/11/2026): its name, without accents, case, spaces or
 * the legal form, so that « Parken zum Fliegen GmbH » and « parken zum fliegen » are the same prospect.
 */
export function companyKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(gmbh|sarl|sas|sasu|sa|ltd|limited|bv|nv|oy|ab|as|srl|sl|spa|kg|ag|s\.?r\.?o)\b\.?/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Whether two prospects without an email are the same parking: the same name (`companyKey`) at the same airport, or the
 * same name when one of them has no airport. « Star Parking » at Brussels is not the one at Milan.
 */
export function sameCompany(a: { companyName: string; airportCode: string | null }, b: { companyName: string; airportCode: string | null }): boolean {
  if (companyKey(a.companyName) !== companyKey(b.companyName)) return false;
  return !a.airportCode || !b.airportCode || a.airportCode.toUpperCase() === b.airportCode.toUpperCase();
}

/** sha256 of the lower-cased address: the opt-out list keeps no address in clear. */
export function suppressionHash(email: string): string {
  return createHash('sha256').update(normalizeProspectEmail(email)).digest('hex');
}

/**
 * Checks one prospect, typed or from a CSV row (shared by the form, the import and its preview). `partial`: an update,
 * where an absent field stays as it is. Field codes: required, too_long, invalid_email, invalid_airport, invalid_region,
 * invalid_website, invalid_language, invalid. The email is optional since 13/11/2026 (the prospect is then called).
 */
export function validateProspect(
  input: ProspectInput,
  partial = false,
): { ok: true; value: Partial<ProspectFields> } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const value: Partial<ProspectFields> = {};
  const text = (key: TextField, required: boolean) => {
    const raw = input[key];
    if (raw === undefined && partial) return;
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      fields[key] = 'invalid';
      return;
    }
    // Notes keep their lines; every other field is one line.
    const clean = key === 'notes' ? (raw ?? '').trim() : (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!clean) {
      if (required) fields[key] = 'required';
      else (value as Record<string, string | null>)[key] = null;
      return;
    }
    if (clean.length > LIMITS[key]) {
      fields[key] = 'too_long';
      return;
    }
    (value as Record<string, string | null>)[key] = clean;
  };
  text('companyName', true);
  text('contactFirstName', false);
  text('contactLastName', false);
  text('email', false);
  text('town', false);
  text('airportCode', false);
  text('phone', false);
  text('website', false);
  text('notes', false);
  const language = input.language;
  if (!(language === undefined && partial)) {
    if (language === undefined || language === null || (typeof language === 'string' && !language.trim())) value.language = null;
    else if (typeof language !== 'string') fields.language = 'invalid';
    else {
      const parsed = parseLanguage(language);
      if (parsed) value.language = parsed;
      else fields.language = 'invalid_language';
    }
  }
  // The region chosen by hand: a key or a name, whatever the case and accents; empty gives the airport's region.
  const region = input.region;
  if (!(region === undefined && partial)) {
    if (region === undefined || region === null || (typeof region === 'string' && !region.trim())) value.region = null;
    else if (typeof region !== 'string') fields.region = 'invalid';
    else {
      const key = parseRegion(region);
      if (key) value.region = key;
      else fields.region = 'invalid_region';
    }
  }
  if (typeof value.email === 'string') {
    value.email = normalizeProspectEmail(value.email);
    if (!EMAIL_RE.test(value.email)) fields.email = 'invalid_email';
  }
  if (typeof value.website === 'string') {
    const site = normalizeWebsite(value.website);
    if (site) value.website = site;
    else fields.website = 'invalid_website';
  }
  if (typeof value.airportCode === 'string') {
    value.airportCode = value.airportCode.toUpperCase();
    if (!/^[A-Z]{3}$/.test(value.airportCode)) fields.airportCode = 'invalid_airport';
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value };
}

/**
 * Checks the three steps and the daily cap of « Modifier les mails ». The first step is always on and leaves at J0;
 * the follow-ups come later, in order. Field codes as `steps.2.delayDays`: required, too_long, unknown_variable,
 * delay_range, delay_order; `dailyCap`: cap_range.
 */
export function validateSequence(
  steps: unknown,
  dailyCap: unknown,
): { ok: true; steps: SequenceStep[]; dailyCap: number } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  if (!Number.isInteger(dailyCap) || (dailyCap as number) < 1 || (dailyCap as number) > MAX_DAILY_CAP) fields.dailyCap = 'cap_range';
  if (!Array.isArray(steps) || steps.length !== 3) {
    fields.steps = 'invalid';
    return { ok: false, fields };
  }
  const clean: SequenceStep[] = [];
  steps.forEach((raw, index) => {
    const n = (index + 1) as 1 | 2 | 3;
    const key = (field: string) => `steps.${n}.${field}`;
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const subject = typeof item.subject === 'string' ? item.subject.replace(/[\r\n]+/g, ' ').trim() : '';
    const body = typeof item.body === 'string' ? item.body.replace(/\r\n?/g, '\n').trim() : '';
    if (!subject) fields[key('subject')] = 'required';
    else if (subject.length > 150) fields[key('subject')] = 'too_long';
    else if (unknownVariables(subject).length) fields[key('subject')] = 'unknown_variable';
    if (!body) fields[key('body')] = 'required';
    else if (body.length > 5000) fields[key('body')] = 'too_long';
    else if (unknownVariables(body).length) fields[key('body')] = 'unknown_variable';
    const enabled = n === 1 ? true : item.enabled !== false;
    const delayDays = n === 1 ? 0 : item.delayDays;
    if (n > 1 && (!Number.isInteger(delayDays) || (delayDays as number) < 1 || (delayDays as number) > 90)) fields[key('delayDays')] = 'delay_range';
    clean.push({ step: n, enabled, delayDays: Number(delayDays), subject, body });
  });
  if (
    !fields['steps.2.delayDays'] &&
    !fields['steps.3.delayDays'] &&
    clean[1].enabled &&
    clean[2].enabled &&
    clean[2].delayDays <= clean[1].delayDays
  ) {
    fields['steps.3.delayDays'] = 'delay_order';
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, steps: clean, dailyCap: dailyCap as number };
}

export type Translations = Partial<Record<Exclude<ProspectLanguage, 'fr'>, { step: 1 | 2 | 3; subject: string; body: string }[]>>;
export type Sequences = Record<ProspectLanguage, SequenceStep[]>;

/**
 * Checks the German and English texts of « Modifier les mails » (13/11/2026): a subject and a text for each step. Field
 * codes as `translations.de.2.body`: required, too_long, unknown_variable.
 */
export function validateTranslations(input: unknown): { ok: true; value: Translations } | { ok: false; fields: Record<string, string> } {
  if (input === undefined || input === null) return { ok: true, value: {} };
  if (typeof input !== 'object' || Array.isArray(input)) return { ok: false, fields: { translations: 'invalid' } };
  const fields: Record<string, string> = {};
  const value: Translations = {};
  for (const language of PROSPECT_LANGUAGES) {
    if (language === 'fr') continue;
    const steps = (input as Record<string, unknown>)[language];
    if (steps === undefined || steps === null) continue;
    if (!Array.isArray(steps) || steps.length !== 3) {
      fields[`translations.${language}`] = 'invalid';
      continue;
    }
    value[language] = steps.map((raw, index) => {
      const n = (index + 1) as 1 | 2 | 3;
      const key = (field: string) => `translations.${language}.${n}.${field}`;
      const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      const subject = typeof item.subject === 'string' ? item.subject.replace(/[\r\n]+/g, ' ').trim() : '';
      const body = typeof item.body === 'string' ? item.body.replace(/\r\n?/g, '\n').trim() : '';
      if (!subject) fields[key('subject')] = 'required';
      else if (subject.length > 150) fields[key('subject')] = 'too_long';
      else if (unknownVariables(subject).length) fields[key('subject')] = 'unknown_variable';
      if (!body) fields[key('body')] = 'required';
      else if (body.length > 5000) fields[key('body')] = 'too_long';
      else if (unknownVariables(body).length) fields[key('body')] = 'unknown_variable';
      return { step: n, subject, body };
    });
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value };
}

/**
 * The three sequences: the French one (its delays and switches are everyone's), and its German and English texts, saved or
 * Plazo's own when none is saved (or damaged).
 */
export function sequencesOf(storedSteps: unknown, storedTranslations: unknown, productName: string): Sequences {
  const fr = stepsOf(storedSteps, productName);
  const checked = validateTranslations(storedTranslations);
  const saved = checked.ok ? checked.value : {};
  const translate = (language: 'de' | 'en'): SequenceStep[] => {
    const texts = saved[language] ?? defaultSteps(productName, language);
    return fr.map((s, i) => ({ ...s, subject: texts[i].subject, body: texts[i].body }));
  };
  return { fr, de: translate('de'), en: translate('en') };
}

/** The steps saved in the database, or Plazo's texts when the value is missing or damaged. */
export function stepsOf(stored: unknown, productName: string): SequenceStep[] {
  // 08/11/2026 (« mets le mail à jour »): a saved step without its subject and body takes Plazo's current texts for that step,
  // keeping its delay and whether it is on (migration prospecting_default_texts clears the saved texts once).
  const defaults = defaultSteps(productName);
  const filled = Array.isArray(stored)
    ? stored.map(s => {
        if (!s || typeof s !== 'object') return s;
        const step = s as Record<string, unknown>;
        const text = defaults.find(d => d.step === step.step);
        if (!text || ('subject' in step && 'body' in step)) return step;
        return { ...step, subject: step.subject ?? text.subject, body: step.body ?? text.body };
      })
    : stored;
  const checked = validateSequence(filled, DEFAULT_DAILY_CAP);
  return checked.ok ? checked.steps : defaults;
}

// ---- When to send --------------------------------------------------------------------------------------------------

/** ISO weekday of a local date: 1 Monday … 7 Sunday. */
function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Whether emails may leave at this instant: Monday to Friday, 09:00 to 18:00 in Paris. */
export function inSendingWindow(now: Date): boolean {
  const local = localDateTime(now, PROSPECTING_TZ);
  const time = local.slice(11);
  return isoWeekday(local.slice(0, 10)) <= 5 && time >= WINDOW_START && time < WINDOW_END;
}

/** The instant itself when inside the window, else the next opening (09:00 of the next working day). */
export function nextWindowStart(instant: Date): Date {
  if (inSendingWindow(instant)) return instant;
  const local = localDateTime(instant, PROSPECTING_TZ);
  let date = local.slice(0, 10);
  if (local.slice(11) >= WINDOW_START) date = addDays(date, 1);
  while (isoWeekday(date) > 5) date = addDays(date, 1);
  return parseInstant(`${date}T${WINDOW_START}`, PROSPECTING_TZ)!;
}

/** The next step to send after `sentStep` (0: none sent yet), skipping the steps turned off; null when the sequence is over. */
export function nextStep(steps: SequenceStep[], sentStep: number): SequenceStep | null {
  return steps.find(s => s.step > sentStep && s.enabled) ?? null;
}

/**
 * When a follow-up is due: `delayDays` after the first contact (J0), at the same local time, moved into the window.
 * Never before `notBefore` (the last send plus a day: a sequence edited after the fact does not send two emails at once).
 */
export function followUpDueAt(firstContactedAt: Date, delayDays: number, notBefore: Date): Date {
  const local = localDateTime(firstContactedAt, PROSPECTING_TZ);
  const due = parseInstant(`${addDays(local.slice(0, 10), delayDays)}${local.slice(10)}`, PROSPECTING_TZ)!;
  return nextWindowStart(due.getTime() < notBefore.getTime() ? notBefore : due);
}

/** Start of today in Paris: the daily cap counts the emails sent since then. */
export function capDayStart(now: Date): Date {
  return parseInstant(`${localDate(now, PROSPECTING_TZ)}T00:00`, PROSPECTING_TZ)!;
}

/** How many more emails may leave today. */
export function remainingToday(dailyCap: number, sentToday: number): number {
  return Math.max(0, dailyCap - sentToday);
}

/** The cut-off of the retention: a prospect last contacted (or created, if never contacted) before it is deleted. */
export function retentionCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS);
  return cutoff;
}
