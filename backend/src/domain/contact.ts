import { EmailMessage } from './booking-messages';

/**
 * The site's contact form and « La lettre Plazo » (footer A, 15/10/2026). Pure functions: which support address is a real
 * one, and the email the support receives (the visitor's words always escaped).
 */

/** Same rule as the site's hasSupportEmail(): a valid address that is not the product.json placeholder (@example.com…). */
export function isRealSupportEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !/@example\.(com|org|net)$/i.test(email);
}

/** The page of the site Brevo's confirmation link leads to. */
export const NEWSLETTER_CONFIRMED_PATH = '/lettre/confirmee';

export interface ContactMessage {
  name: string;
  email: string;
  reference?: string;
  message: string;
}

const COLORS = { ink: '#221b16', soft: '#74685f', line: '#e7ddd1', ground: '#f7f3ee', tint: '#f3ede5', espresso: '#2b211b' };

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** "jeudi 15 octobre 2026 à 14:05", in Paris time. */
export function formatSentAt(date: Date): string {
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  );
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} à ${time}`;
}

/**
 * The email the support receives for one message of the form. Replying to it answers the visitor (Reply-To, set by the
 * sender). `id` is a short random id, the only thing the logs say about the message.
 */
export function contactEmail(productName: string, data: ContactMessage, id: string, sentAt: Date): EmailMessage {
  const reference = data.reference?.trim() || '';
  const subject = `Formulaire de contact ${productName} · ${data.name}${reference ? ` · ${reference}` : ''}`;
  const rows: [string, string][] = [
    ['Nom', data.name],
    ['E-mail', data.email],
    ['Réservation', reference || 'non indiquée'],
    ['Envoyé le', formatSentAt(sentAt)],
  ];
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.ground};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.ground}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${COLORS.line};border-radius:16px">
<tr><td style="padding:24px">
<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.soft}">Formulaire de contact</p>
<h1 style="margin:6px 0 16px;font-size:22px;font-weight:400;font-family:Georgia,serif">Nouveau message sur ${escapeHtml(productName)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:2px 16px 2px 0;color:${COLORS.soft};white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:2px 0">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
<div style="margin:16px 0 0;padding:14px 16px;background:${COLORS.tint};border-radius:12px;font-size:15px;line-height:1.55;white-space:pre-wrap;word-break:break-word">${escapeHtml(data.message)}</div>
<p style="margin:16px 0 0;font-size:13px;color:${COLORS.soft}">Répondez à ce mail pour écrire directement à ${escapeHtml(data.name)}.</p>
</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;font-size:12px;color:${COLORS.soft}">Envoyé par le formulaire de contact du site ${escapeHtml(productName)} · ${escapeHtml(id)}</p>
</td></tr></table>
</body></html>`;
  const text = [
    `Nouveau message sur ${productName} (formulaire de contact)`,
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    data.message,
    '',
    `Répondez à ce mail pour écrire directement à ${data.name}.`,
    `— ${productName} · ${id}`,
  ].join('\n');
  return { subject, html, text };
}
