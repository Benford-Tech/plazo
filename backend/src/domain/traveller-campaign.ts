import { createHash } from 'crypto';
import { escapeHtml } from './prospecting';
import { formatEuros } from './booking-messages';
import { StoreBadge, storeBadgesHtml } from './account-messages';
import type { EmailMessage } from './booking-messages';

/**
 * 15/11/2026 (« Mail de promotion à Plazo, pour dire de penser à Plazo pour la prochaine location de parking, avec lien de
 * téléchargement », direction C « La saison des départs » des maquettes https://claude.ai/artifact/4ZYD6KgTYbUFkYMLeMrKHK,
 * « tous les voyageurs », « campagne à la main »): the platform writes a subject, a title and a text, picks an airport and
 * (optionally) dates; the email shows the app's store badges, up to three parkings of that airport with their real price,
 * and a button to the search. Pure rules: validation, the audience window, the pace, the email itself.
 */

export const CAMPAIGN_SUBJECT_MAX = 120;
export const CAMPAIGN_TITLE_MAX = 120;
export const CAMPAIGN_BODY_MAX = 1200;
/** One campaign a week at most: a traveller is never flooded. */
export const CAMPAIGN_GAP_MS = 7 * 86400_000;
/** Travellers whose last stay ended in these 3 years (or is still to come): older addresses are left alone. */
export const CAMPAIGN_AUDIENCE_MS = 3 * 365 * 86400_000;
/** Parkings shown in the email. */
export const CAMPAIGN_OFFERS = 3;

export interface CampaignInput {
  subject: string;
  title: string;
  body: string;
  airport: string;
  arrival: string | null;
  return: string | null;
}

export interface CampaignOffer {
  title: string;
  slug: string;
  /** With dates: the total for the stay; without: the grid's lowest package. */
  priceCents: number | null;
  days: number | null;
  /** True with dates: `priceCents` is the stay's total (else « dès »). */
  forStay: boolean;
  shuttleMinutes: number | null;
  valet: boolean;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STAY_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';
}

function oneLine(value: unknown): string {
  return text(value).replace(/\s+/g, ' ');
}

/** The fields of a campaign, cleaned, with the errors by field (`subject`, `body`, `arrival`…); empty errors: fine. */
export function readCampaign(raw: unknown): { value: CampaignInput; errors: Record<string, string> } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const value: CampaignInput = {
    subject: oneLine(r.subject),
    title: oneLine(r.title),
    body: text(r.body).replace(/\n{3,}/g, '\n\n'),
    airport: oneLine(r.airport),
    arrival: oneLine(r.arrival) || null,
    return: oneLine(r.return) || null,
  };
  const errors: Record<string, string> = {};
  const length = (key: 'subject' | 'title' | 'body', max: number) => {
    if (!value[key]) errors[key] = 'required';
    else if (value[key].length > max) errors[key] = 'too_long';
  };
  length('subject', CAMPAIGN_SUBJECT_MAX);
  length('title', CAMPAIGN_TITLE_MAX);
  length('body', CAMPAIGN_BODY_MAX);
  if (!SLUG.test(value.airport) || value.airport.length > 80) errors.airport = value.airport ? 'invalid' : 'required';
  if (value.arrival && !STAY_TIME.test(value.arrival)) errors.arrival = 'invalid';
  if (value.return && !STAY_TIME.test(value.return)) errors.return = 'invalid';
  if (!!value.arrival !== !!value.return) errors[value.arrival ? 'return' : 'arrival'] = 'required';
  if (value.arrival && value.return && !errors.arrival && !errors.return && value.return <= value.arrival) errors.return = 'before_arrival';
  return { value, errors };
}

/** When the next campaign may start (null: now). */
export function nextCampaignAt(lastStartedAt: Date | null, now: Date): Date | null {
  if (!lastStartedAt) return null;
  const next = new Date(lastStartedAt.getTime() + CAMPAIGN_GAP_MS);
  return next > now ? next : null;
}

/** The sha256 of an address (the same as the welcome email's opt-out list). */
export function campaignEmailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

/** "2026-12-19T08:00" -> "sam. 19 déc." */
function shortDay(local: string): string {
  const [y, m, d] = local.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** « du sam. 19 déc. au dim. 4 janv. », or null without dates. */
export function stayLabel(input: Pick<CampaignInput, 'arrival' | 'return'>): string | null {
  return input.arrival && input.return ? `du ${shortDay(input.arrival)} au ${shortDay(input.return)}` : null;
}

/** « 136,00 € · 8 jours », « dès 15,00 € la journée », « dès 54,00 € pour 7 jours »; null without a price. */
export function offerPrice(o: CampaignOffer): string | null {
  if (o.priceCents === null) return null;
  const days = o.days ?? 0;
  if (o.forStay) return `${formatEuros(o.priceCents)}${days ? ` · ${days} jour${days > 1 ? 's' : ''}` : ''}`;
  if (days <= 1) return `dès ${formatEuros(o.priceCents)} la journée`;
  return `dès ${formatEuros(o.priceCents)} pour ${days} jours`;
}

/** « Navette 8 min », « Voiturier », « Navette » */
export function offerService(o: CampaignOffer): string {
  if (o.valet) return 'Voiturier';
  return o.shuttleMinutes ? `Navette ${o.shuttleMinutes} min` : 'Navette';
}

export interface CampaignEmailInput {
  productName: string;
  campaign: Pick<CampaignInput, 'subject' | 'title' | 'body' | 'arrival' | 'return'>;
  firstName: string;
  airportName: string;
  offers: CampaignOffer[];
  /** The site's search (with the dates when given). */
  searchUrl: string;
  /** A parking's page on the site, by slug. */
  parkingUrl: (slug: string) => string;
  badges: StoreBadge[];
  /** The badges' images need the site's address; null: links in text. */
  imagesBase: string | null;
  unsubscribeUrl: string;
  publisher: string;
}

const C = {
  ground: '#F7F3EE',
  line: '#E7DDD1',
  ink: '#2B211B',
  body: '#4A3D33',
  soft: '#7A6A5C',
  accent: '#FF6600',
  accentDark: '#B34700',
};

export function campaignEmail(input: CampaignEmailInput): EmailMessage {
  const e = escapeHtml;
  const P = input.productName;
  const { campaign } = input;
  const hello = input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,';
  const paragraphs = campaign.body
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  const stay = stayLabel(campaign);
  const listTitle = `À ${input.airportName}${stay ? `, ${stay}` : ''}`;
  const offers = input.offers.slice(0, CAMPAIGN_OFFERS);
  const button = stay ? 'Voir les parkings pour mes dates' : 'Voir les parkings';

  const offerRows = offers
    .map(o => {
      const price = offerPrice(o);
      return (
        `<tr><td style="padding:0 0 10px"><a href="${e(input.parkingUrl(o.slug))}" style="display:block;text-decoration:none;border:1px solid ${C.line};border-radius:12px;padding:14px 16px">` +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
        `<td style="font-size:15px;line-height:1.4;color:${C.ink}"><b>${e(o.title)}</b><br><span style="font-size:13px;color:${C.body}">${e(offerService(o))}</span></td>` +
        (price ? `<td align="right" style="font-size:14px;color:${C.ink};white-space:nowrap"><b>${e(price)}</b></td>` : '') +
        '</tr></table></a></td></tr>'
      );
    })
    .join('');
  const offersBlock = offers.length
    ? `<tr><td style="padding:24px 28px 0"><p style="margin:0 0 12px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${C.soft}">${e(listTitle)}</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${offerRows}</table>` +
      `<p style="margin:2px 0 0;font-size:12px;line-height:1.5;color:${C.soft}">${stay ? 'Prix totaux pour ces dates, lus le jour de l’envoi.' : 'Prix de départ des parkings, lus le jour de l’envoi.'}</p></td></tr>`
    : '';
  const badges = input.badges.length && input.imagesBase ? storeBadgesHtml(input.badges) : '';

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(campaign.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};font-family:Helvetica,Arial,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">
<tr><td style="background:${C.accent};color:#fff;padding:28px 28px 26px">
<span style="display:inline-block;background:#fff;color:${C.accent};font-weight:800;font-size:17px;padding:6px 12px;border-radius:8px">${e(P)}</span>
<h1 style="margin:16px 0 10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.2;color:#fff">${e(campaign.title)}</h1>
<p style="margin:0;font-size:16px;line-height:1.5;color:#fff">Réservez votre parking dans l'application ${e(P)}, gratuite.</p>
${badges}
</td></tr>
<tr><td style="padding:24px 28px 0;font-size:15px;line-height:1.6;color:${C.body}"><p style="margin:0 0 12px">${e(hello)}</p>${paragraphs
    .map(p => `<p style="margin:0 0 12px">${e(p).replace(/\n/g, '<br>')}</p>`)
    .join('')}</td></tr>
${offersBlock}
<tr><td style="padding:20px 28px 28px"><a href="${e(input.searchUrl)}" style="display:inline-block;background:${C.accent};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px">${e(button)}</a></td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${C.soft};text-align:left">Vous recevez ce message parce que vous avez réservé un parking suivi par ${e(P)}. ${e(P)} est édité par ${e(input.publisher)}. <a href="${e(input.unsubscribeUrl)}" style="color:${C.accentDark}">Ne plus recevoir ces messages</a></p>
</td></tr></table>
</body></html>`;

  const lines = [
    campaign.title,
    '',
    hello,
    '',
    ...paragraphs.flatMap(p => [p, '']),
    `L'application ${P}, gratuite :`,
    ...input.badges.map(b => `- ${b.label} : ${b.url ?? b.note ?? ''}`),
    '',
  ];
  if (offers.length) {
    lines.push(`${listTitle} :`);
    for (const o of offers) lines.push(`- ${o.title} (${offerService(o)})${offerPrice(o) ? ` : ${offerPrice(o)}` : ''}`);
    lines.push('');
  }
  lines.push(`${button} : ${input.searchUrl}`, '', '--');
  lines.push(`Vous recevez ce message parce que vous avez réservé un parking suivi par ${P}. ${P} est édité par ${input.publisher}.`);
  lines.push(`Ne plus recevoir ces messages : ${input.unsubscribeUrl}`);
  return { subject: campaign.subject, html, text: lines.join('\n') };
}
