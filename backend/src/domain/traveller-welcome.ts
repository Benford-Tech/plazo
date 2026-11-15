import { createHash } from 'crypto';
import { EmailMessage } from './booking-messages';
import { StoreBadge, storeBadgesHtml } from './account-messages';
import { escapeHtml } from './prospecting';

/**
 * 15/11/2026 (« Mail d'intro de Plazo au client avec message pour installer l'App », direction B, « l'installation en
 * star »): the email that introduces Plazo to a traveller of another channel (comparator, phone, counter, the parking's
 * site) and asks them to install the app. The orange band holds the install (the store badges), then three screens of the
 * app, what else it does, and the two gestures once installed. Every claim is a feature the traveller has today.
 */

export interface WelcomeEmailInput {
  productName: string;
  firstName: string;
  parkingName: string;
  /** "2026-11-20T06:30", the parking's local time. */
  arrivalLocal: string;
  returnLocal: string;
  /** The number the traveller knows (the comparator's when there is one), for the lookup without the link. */
  reference: string;
  /** The short link (/a/…): the app when installed, else the site's page that offers it. */
  link: string;
  /** The site's address for the images; none: no image (text and links only). */
  imagesBase: string | null;
  badges: StoreBadge[];
  unsubscribeUrl: string;
  publisher: string;
}

/** The screens of the email (`site/public/mail/`, crops of the stores' screenshots of the demo parking). */
export const WELCOME_SCREENS = [
  {
    file: 'plazo-depot.jpg',
    title: 'Au départ',
    text: 'Un geste prévient le parking : la navette est prête quand vous arrivez.',
    alt: "Prévenir le parking de son arrivée dans l'application",
  },
  {
    file: 'plazo-atterrissage.jpg',
    title: "À l'atterrissage",
    text: 'Votre vol est suivi : retard compris, la navette vient au bon moment.',
    alt: 'Le vol retour suivi en direct',
  },
  {
    file: 'plazo-ma-voiture.jpg',
    title: 'Au retour',
    text: "Votre voiture vous attend : sa place est dans l'application.",
    alt: 'Retrouver sa voiture sur le plan',
  },
] as const;

export const WELCOME_ALSO = [
  ['Le point de rendez-vous', 'arrive dès que vous atterrissez.'],
  ['Un message au parking', 'en un geste : retard de vol, bagage perdu, question.'],
  ["Le contrat et l'état des lieux", 'signés et gardés, avec les photos de votre voiture.'],
  ['Des sièges auto', "pour les enfants dans la navette, à demander d'avance."],
  ['Votre facture', 'à demander au parking, puis à télécharger.'],
] as const;

const C = {
  ground: '#F7F3EE',
  line: '#E7DDD1',
  ink: '#2B211B',
  body: '#4A3D33',
  soft: '#7A6A5C',
  accent: '#FF6600',
  accentDark: '#B34700',
  paper: '#FBF7F2',
};

/** "2026-11-20T06:30" -> { day: "vendredi 20 novembre", time: "06:30" }. */
export function localParts(local: string): { day: string; time: string } {
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
  return { day, time: (time ?? '').slice(0, 5) };
}

/** The sha256 of an address, as kept by the opt-out (never the address itself). */
export function welcomeEmailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function welcomeEmail(input: WelcomeEmailInput): EmailMessage {
  const P = input.productName;
  const arrival = localParts(input.arrivalLocal);
  const back = localParts(input.returnLocal);
  const dayOnly = arrival.day.replace(/^\S+\s/, '');
  const subject = input.firstName
    ? `${input.firstName}, installez ${P} avant votre départ du ${dayOnly}`
    : `Installez ${P} avant votre départ du ${dayOnly}`;
  const hello = input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,';
  const stay = `dépôt le ${arrival.day} à ${arrival.time}, retour le ${back.day} à ${back.time}`;
  const intro =
    `${input.parkingName} suit votre séjour (${stay}) avec l'application ${P}. Avec elle, plus besoin d'appeler le parking : ` +
    'vous savez à chaque instant où en est votre navette, et le parking sait où vous en êtes.';
  const e = escapeHtml;
  const base = input.imagesBase?.replace(/\/+$/, '') || null;

  const screens = base
    ? `<tr><td style="padding:16px 22px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${WELCOME_SCREENS.map(
        s =>
          `<td valign="top" width="33%" style="padding:0 6px"><img src="${e(`${base}/mail/${s.file}`)}" width="172" alt="${e(s.alt)}" style="display:block;width:100%;max-width:172px;height:auto;border:1px solid ${C.line};border-radius:10px">` +
          `<p style="margin:8px 0 2px;font-size:13px;font-weight:700;color:${C.ink}">${e(s.title)}</p>` +
          `<p style="margin:0;font-size:12px;line-height:1.45;color:${C.body}">${e(s.text)}</p></td>`,
      ).join('')}</tr></table></td></tr>`
    : `<tr><td style="padding:12px 28px 0">${WELCOME_SCREENS.map(
        s =>
          `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${C.body}"><b style="color:${C.ink}">${e(s.title)}</b> : ${e(s.text)}</p>`,
      ).join('')}</td></tr>`;

  const also = WELCOME_ALSO.map(
    ([b, t]) =>
      `<tr><td valign="top" width="20" style="padding:4px 0;color:${C.accentDark};font-weight:700">&#10003;</td><td style="padding:4px 0;font-size:14px;line-height:1.45;color:${C.body}"><b style="color:${C.ink}">${e(b)}</b> ${e(t)}</td></tr>`,
  ).join('');

  const step = (n: number, title: string, text: string, action = '') =>
    `<tr><td valign="top" width="44" style="padding:10px 0"><span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:999px;background:${C.ink};color:#fff;font-weight:700;text-align:center">${n}</span></td>` +
    `<td style="padding:10px 0"><p style="margin:4px 0 4px;font-size:16px;font-weight:700;color:${C.ink}">${e(title)}</p><p style="margin:0;font-size:14px;line-height:1.5;color:${C.body}">${text}</p>${action}</td></tr>`;

  const button = (label: string, bg: string, fg: string) =>
    `<a href="${e(input.link)}" style="display:inline-block;margin-top:10px;background:${bg};color:${fg};text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px">${e(label)}</a>`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};font-family:Helvetica,Arial,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">
<tr><td style="background:${C.accent};color:#fff;padding:26px 28px 28px">
<span style="display:inline-block;background:#fff;color:${C.accent};font-weight:800;font-size:17px;padding:6px 12px;border-radius:8px">${e(P)}</span>
<h1 style="margin:16px 0 10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.2;color:#fff">Installez ${e(P)} avant votre départ</h1>
<p style="margin:0;font-size:16px;line-height:1.5;color:#fff">L'application de ${e(input.parkingName)} pour votre séjour du ${e(arrival.day)} au ${e(back.day)}. Gratuite, sans compte ni mot de passe.</p>
${input.badges.length && base ? storeBadgesHtml(input.badges) : ''}
${button(`Déjà installée ? Ouvrir ma réservation`, '#fff', C.accentDark)}
</td></tr>
<tr><td style="padding:22px 28px 0;font-size:15px;line-height:1.55;color:${C.body}"><p style="margin:0 0 10px">${e(hello)}</p><p style="margin:0">${e(intro)}</p></td></tr>
${screens}
<tr><td style="padding:18px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:14px 18px">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${C.soft}">Et aussi</p>
<table role="presentation" cellpadding="0" cellspacing="0">${also}</table>
</td></tr></table></td></tr>
<tr><td style="padding:18px 28px 0"><p style="margin:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${C.soft}">Une fois installée</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${step(1, 'Ouvrez votre réservation', `Ce bouton l'ajoute à l'application. Sinon : le numéro <b style="font-family:'Courier New',monospace;color:${C.ink}">${e(input.reference)}</b> et votre e-mail.`, button('Ouvrir ma réservation', C.accent, '#fff'))}
${step(2, 'Le jour J, laissez-vous guider', "L'application vous dit quoi faire à chaque étape, du dépôt de la voiture à votre retour.")}
</table></td></tr>
<tr><td style="padding:12px 28px 26px"><p style="margin:0;background:${C.ground};border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.5;color:${C.body}">Une question ? Écrivez au parking depuis l'application.</p></td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${C.soft};text-align:left">Vous recevez ce message parce que vous avez réservé chez ${e(input.parkingName)}, qui utilise ${e(P)}. ${e(P)} est édité par ${e(input.publisher)}. <a href="${e(input.unsubscribeUrl)}" style="color:${C.accentDark}">Ne plus recevoir ces messages</a></p>
</td></tr></table>
</body></html>`;

  const text = [
    `Installez ${P} avant votre départ`,
    '',
    hello,
    '',
    intro,
    '',
    `${P} est gratuite, sans compte ni mot de passe :`,
    ...input.badges.map(b => `- ${b.label} : ${b.url ?? b.note ?? ''}`),
    '',
    ...WELCOME_SCREENS.map(s => `${s.title} : ${s.text}`),
    '',
    'Et aussi :',
    ...WELCOME_ALSO.map(([b, t]) => `- ${b} ${t}`),
    '',
    `Une fois installée, ouvrez votre réservation : ${input.link}`,
    `(ou le numéro ${input.reference} et votre e-mail)`,
    '',
    "Une question ? Écrivez au parking depuis l'application.",
    '',
    '--',
    `Vous recevez ce message parce que vous avez réservé chez ${input.parkingName}, qui utilise ${P}. ${P} est édité par ${input.publisher}.`,
    `Ne plus recevoir ces messages : ${input.unsubscribeUrl}`,
  ].join('\n');

  return { subject, html, text };
}
