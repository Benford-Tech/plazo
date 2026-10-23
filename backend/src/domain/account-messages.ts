import { EmailMessage } from './booking-messages';

/**
 * French copy of the emails sent to operators (pro space): invitation, email confirmation and the
 * platform's decisions on their listing. Pure functions; the product name and links are passed in.
 */

// The pro space's colours (direction C-B « Opérations », 05/10/2026; until 23/10/2026 the template wore the black and
// amber of direction B): light ground, white card, lime for the button with dark green text, dark green for the accents.
const COLORS = { ink: '#1A1D1A', soft: '#6B7280', line: '#E4E6E2', tint: '#EEF0EE', lime: '#A3E635', limeInk: '#0F2A14', deep: '#1E5E2E' };

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const paragraph = (text: string) => `<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${escapeHtml(text)}</p>`;

function button(label: string, url: string): string {
  return `<p style="margin:24px 0 8px"><a href="${escapeHtml(url)}" style="display:inline-block;background:${COLORS.lime};color:${COLORS.limeInk};text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">${escapeHtml(label)}</a></p>
<p style="margin:0;font-size:12px;color:${COLORS.soft};word-break:break-all">${escapeHtml(url)}</p>`;
}

function layout(productName: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.tint};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.tint}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${COLORS.line};border-radius:14px">
<tr><td style="padding:18px 24px 0"><span style="display:inline-block;background:${COLORS.lime};color:${COLORS.limeInk};font-weight:800;font-size:16px;padding:6px 12px;border-radius:8px">${escapeHtml(productName)}</span> <span style="color:${COLORS.deep};font-weight:700;letter-spacing:.08em;font-size:12px;vertical-align:middle">PRO</span></td></tr>
<tr><td style="padding:24px">${body}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:${COLORS.soft}">Cet email vous est envoyé par ${escapeHtml(productName)} au sujet de votre espace professionnel.</p>
</td></tr></table>
</body></html>`;
}

type Link = { label: string; url: string | null; note?: string };

/** Links after the button: « Plazo Pro sur Google Play : https://… » ; a link not yet available shows its note instead. */
function links(items: Link[]): string {
  const rows = items.map(
    l =>
      `<li style="margin:6px 0">${escapeHtml(l.label)} : ${
        l.url
          ? `<a href="${escapeHtml(l.url)}" style="color:${COLORS.deep};word-break:break-all">${escapeHtml(l.url)}</a>`
          : `<span style="color:${COLORS.soft}">${escapeHtml(l.note ?? '')}</span>`
      }</li>`,
  );
  return `<ul style="margin:12px 0 0;padding-left:20px;font-size:14px;line-height:1.5">${rows.join('')}</ul>`;
}

function message(
  productName: string,
  subject: string,
  heading: string,
  lines: string[],
  action?: { label: string; url: string },
  extra?: { lines: string[]; links: Link[] },
): EmailMessage {
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 4px;font-size:22px;color:${COLORS.deep}">${escapeHtml(heading)}</h1>
${lines.map(paragraph).join('\n')}
${action ? button(action.label, action.url) : ''}
${extra ? `${extra.lines.map(paragraph).join('\n')}\n${links(extra.links)}` : ''}`,
  );
  const text = [
    heading,
    '',
    ...lines,
    ...(action ? ['', `${action.label} : ${action.url}`] : []),
    ...(extra ? ['', ...extra.lines, ...extra.links.map(l => `- ${l.label} : ${l.url ?? l.note ?? ''}`)] : []),
    '',
    `— ${productName}`,
  ].join('\n');
  return { subject, html, text };
}

/**
 * The manager's invitation (22/10/2026: with the demo of the pro space and Plazo Pro on the stores; the App Store link
 * comes once Apple has published the app, the email says the review is running until then).
 */
export function invitationEmail(
  productName: string,
  data: { operatorName: string; url: string; days: number; demoUrl: string | null; playStoreUrl: string; appStoreUrl: string | null },
): EmailMessage {
  return message(
    productName,
    `Votre espace ${productName} pour ${data.operatorName}`,
    `Bienvenue sur ${productName}`,
    [
      `Un espace professionnel a été ouvert pour ${data.operatorName}. Vous en êtes le gérant.`,
      `Choisissez votre mot de passe pour y accéder. Ce lien est valable ${data.days} jours et ne sert qu'une fois ; personne d'autre ne connaît votre mot de passe.`,
    ],
    { label: 'Choisir mon mot de passe', url: data.url },
    {
      lines: [
        `Avant de vous lancer, vous pouvez découvrir ${productName} sur un parking fictif, sans rien enregistrer. Votre équipe utilisera ensuite l'application ${productName} Pro sur son téléphone : planning, navette, parking et réservations.`,
      ],
      links: [
        ...(data.demoUrl ? [{ label: 'Essayer la démo', url: data.demoUrl }] : []),
        { label: `${productName} Pro sur Google Play (Android)`, url: data.playStoreUrl },
        {
          label: `${productName} Pro sur l'App Store (iPhone)`,
          url: data.appStoreUrl,
          note: "validation par Apple en cours, le lien vous sera envoyé dès qu'elle est publiée",
        },
      ],
    },
  );
}

export function verificationEmail(productName: string, data: { url: string; hours: number }): EmailMessage {
  return message(
    productName,
    `Confirmez votre adresse email · ${productName}`,
    'Confirmez votre adresse email',
    [
      `Merci d'avoir inscrit votre parking sur ${productName}.`,
      `Confirmez votre adresse email pour pouvoir envoyer votre fiche en validation. Ce lien est valable ${data.hours} heures.`,
      "Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.",
    ],
    { label: 'Confirmer mon adresse', url: data.url },
  );
}

/** Sent instead of a new account when someone signs up with an email that already has one. */
export function existingAccountEmail(productName: string, data: { loginUrl: string }): EmailMessage {
  return message(
    productName,
    `Inscription sur ${productName}`,
    'Vous avez déjà un compte',
    [
      `Quelqu'un (peut-être vous) a tenté d'inscrire un parking sur ${productName} avec cette adresse email. Un compte existe déjà à ce nom : aucun nouveau compte n'a été créé.`,
      "Si c'était vous, connectez-vous avec votre mot de passe habituel. Sinon, vous pouvez ignorer cet email.",
    ],
    { label: 'Me connecter', url: data.loginUrl },
  );
}

export function listingApprovedEmail(productName: string, data: { title: string; url: string }): EmailMessage {
  return message(
    productName,
    `Votre fiche « ${data.title} » est en ligne`,
    'Votre fiche est en ligne',
    [`Bonne nouvelle : votre fiche « ${data.title} » a été validée. Les voyageurs peuvent maintenant la voir et réserver sur ${productName}.`],
    { label: 'Voir ma fiche', url: data.url },
  );
}

export function listingRejectedEmail(productName: string, data: { title: string; message: string; url: string }): EmailMessage {
  return message(
    productName,
    `Votre fiche « ${data.title} » est à corriger`,
    'Votre fiche est à corriger',
    [
      `Votre fiche « ${data.title} » n'a pas été validée. Message de l'équipe ${productName} :`,
      data.message,
      'Corrigez-la puis envoyez-la à nouveau en validation.',
    ],
    { label: 'Modifier ma fiche', url: data.url },
  );
}

export function listingUnpublishedEmail(productName: string, data: { title: string; message: string | null; url: string }): EmailMessage {
  return message(
    productName,
    `Votre fiche « ${data.title} » est retirée de ${productName}`,
    'Votre fiche est retirée',
    [
      `Votre fiche « ${data.title} » n'est plus visible sur ${productName}.`,
      ...(data.message ? [`Message de l'équipe ${productName} :`, data.message] : []),
      'Vous pouvez la modifier et la renvoyer en validation.',
    ],
    { label: 'Modifier ma fiche', url: data.url },
  );
}

/** « Pouvoir stocker le contrat à faire signer » (20/10/2026): a contract waits for a manager's signature. */
export function contractToSignEmail(
  productName: string,
  data: { operatorName: string; title: string; version: number; url: string; reminder: boolean },
): EmailMessage {
  return message(
    productName,
    data.reminder ? `Rappel : votre contrat ${productName} est à signer` : `Votre contrat ${productName} est prêt à signer`,
    'Votre contrat est prêt à signer',
    [
      `${productName} a déposé le contrat « ${data.title} » (version ${data.version}) pour ${data.operatorName}.`,
      'Lisez-le puis signez-le depuis votre espace pro, page « Mon contrat » : tapez votre nom complet et cochez « Lu et approuvé ». Seul un gérant peut le signer.',
    ],
    { label: 'Lire et signer le contrat', url: data.url },
  );
}

/** The signed contract, to the manager who signed and to the platform. */
export function contractSignedEmail(
  productName: string,
  data: { operatorName: string; title: string; version: number; signerName: string; signedAt: string; signedSha256: string; url: string },
): EmailMessage {
  return message(
    productName,
    `Contrat signé : ${data.title} · ${data.operatorName}`,
    'Contrat signé',
    [
      `Le contrat « ${data.title} » (version ${data.version}) de ${data.operatorName} a été signé par ${data.signerName} le ${data.signedAt} (heure de Paris).`,
      `Empreinte SHA-256 du PDF signé : ${data.signedSha256}`,
      'Le PDF signé et la preuve de signature sont à télécharger depuis l’espace pro.',
    ],
    { label: 'Voir le contrat signé', url: data.url },
  );
}
