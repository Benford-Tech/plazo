import { EmailMessage } from './booking-messages';

/**
 * French copy of the emails sent to operators (pro space): invitation, email confirmation and the
 * platform's decisions on their listing. Pure functions; the product name and links are passed in.
 */

const COLORS = { ink: '#0B0B0C', yellow: '#F5C400', soft: '#5d5d58', line: '#e4e4df', tint: '#f3f3f0' };

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const paragraph = (text: string) => `<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${escapeHtml(text)}</p>`;

function button(label: string, url: string): string {
  return `<p style="margin:24px 0 8px"><a href="${escapeHtml(url)}" style="display:inline-block;background:${COLORS.yellow};color:${COLORS.ink};text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:12px 20px">${escapeHtml(label)}</a></p>
<p style="margin:0;font-size:12px;color:${COLORS.soft};word-break:break-all">${escapeHtml(url)}</p>`;
}

function layout(productName: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.tint};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.tint}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${COLORS.line}">
<tr><td style="background:${COLORS.ink};padding:16px 24px;color:${COLORS.yellow};font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:18px">${escapeHtml(productName)} pro</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:${COLORS.soft}">Cet email vous est envoyé par ${escapeHtml(productName)} au sujet de votre espace professionnel.</p>
</td></tr></table>
</body></html>`;
}

function message(productName: string, subject: string, heading: string, lines: string[], action?: { label: string; url: string }): EmailMessage {
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 4px;font-size:22px;text-transform:uppercase;letter-spacing:.03em">${escapeHtml(heading)}</h1>
${lines.map(paragraph).join('\n')}
${action ? button(action.label, action.url) : ''}`,
  );
  const text = [heading, '', ...lines, ...(action ? ['', `${action.label} : ${action.url}`] : []), '', `— ${productName}`].join('\n');
  return { subject, html, text };
}

export function invitationEmail(productName: string, data: { operatorName: string; url: string; days: number }): EmailMessage {
  return message(
    productName,
    `Votre espace ${productName} pour ${data.operatorName}`,
    `Bienvenue sur ${productName}`,
    [
      `Un espace professionnel a été ouvert pour ${data.operatorName}. Vous en êtes le gérant.`,
      `Choisissez votre mot de passe pour y accéder. Ce lien est valable ${data.days} jours et ne sert qu'une fois ; personne d'autre ne connaît votre mot de passe.`,
    ],
    { label: 'Choisir mon mot de passe', url: data.url },
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
