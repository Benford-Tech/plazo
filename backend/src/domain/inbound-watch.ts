import { COLORS, escapeHtml, layout } from './account-messages';
import { EmailMessage } from './booking-messages';
import { isQuietHour } from './booking-digest';
import { localDate, localDateTime } from './time';

/**
 * 09/11/2026 (« faut un job qui parcourt les mails en continu pour voir si tout est ok », choix « Relire avec les règles
 * du jour · Alerte aux gérants · Rapport pour la plateforme »): what is checked of the inbound emails, as pure functions.
 * The managers hear once of a comparator's email still « À traiter » two hours after it came (grouped per operator, never
 * between 22:00 and 07:00, the parking's clock: those of the night are told at 07:00); the platform's administrators get
 * each morning the emails received in the last 24 hours, and those still to deal with, of every operator.
 */

/** A comparator's email still « À traiter » this long after it came is told to the managers. */
export const STALE_AFTER_MS = 2 * 3_600_000;
/** Older emails are never told any more (a backlog the staff knows of). */
export const STALE_WINDOW_MS = 48 * 3_600_000;
/** The platform's report leaves from this hour (Paris), until noon if a pass was missed. */
export const REPORT_FROM_HOUR = 7;
export const REPORT_UNTIL_HOUR = 12;
export const REPORT_TIMEZONE = 'Europe/Paris';
/** At most this many emails are listed in the report (the rest are counted). */
export const REPORT_MAX_ROWS = 40;

/** Whether the managers may be told now (`timeZone` = the parking's). */
export function mayAlert(now: Date, timeZone: string): boolean {
  return !isQuietHour(localDateTime(now, timeZone).slice(11));
}

/** The managers' push: « 2 mails à vérifier depuis plus de 2 h » · « Onepark · Annulation de la réservation #… ». */
export function staleAlert(emails: { sender: string; subject: string | null }[]): { title: string; body: string } {
  const n = emails.length;
  const title = n === 1 ? 'Mail à vérifier depuis plus de 2 h' : `${n} mails à vérifier depuis plus de 2 h`;
  const first = emails[0];
  const line = [first.sender, first.subject || '(sans objet)'].filter(Boolean).join(' · ');
  return { title, body: n === 1 ? line : `${line} · et ${n - 1} autre${n > 2 ? 's' : ''}` };
}

/** The Paris day the report is due for now, or null outside its hours. */
export function reportDay(now: Date): string | null {
  const hour = Number(localDateTime(now, REPORT_TIMEZONE).slice(11, 13));
  return hour >= REPORT_FROM_HOUR && hour < REPORT_UNTIL_HOUR ? localDate(now, REPORT_TIMEZONE) : null;
}

export interface ReportOperator {
  name: string;
  received: number;
  imported: number;
  toCheck: number;
}

export interface ReportEmail {
  operator: string;
  receivedAt: Date;
  sender: string;
  subject: string | null;
  /** « Non reconnu », « À compléter ». */
  state: string;
  /** What the rules or Claude read (« Annulation · Onepark · onepark.cancellation-wording »), or « Aucune lecture ». */
  reading: string;
}

const time = (at: Date) => {
  const local = localDateTime(at, REPORT_TIMEZONE);
  return `${local.slice(8, 10)}/${local.slice(5, 7)} ${local.slice(11, 16)}`;
};

/** The platform's morning report (HTML and text). */
export function inboundReportEmail(
  productName: string,
  data: { day: string; operators: ReportOperator[]; emails: ReportEmail[]; more: number; inboxUrl: string | null },
): EmailMessage {
  const toCheck = data.operators.reduce((sum, o) => sum + o.toCheck, 0);
  const received = data.operators.reduce((sum, o) => sum + o.received, 0);
  const [y, m, d] = data.day.split('-');
  const subject = toCheck ? `Mails entrants du ${d}/${m}/${y} : ${toCheck} à vérifier` : `Mails entrants du ${d}/${m}/${y} : tout est en ordre`;
  const heading = toCheck ? `${toCheck} mail${toCheck > 1 ? 's' : ''} à vérifier` : 'Tout est en ordre';
  const intro = `${received} mail${received > 1 ? 's' : ''} reçu${received > 1 ? 's' : ''} ces dernières 24 heures, tous loueurs confondus.`;
  const cell = (text: string, bold = false) =>
    `<td style="padding:6px 8px;border-top:1px solid ${COLORS.line};font-size:13px;vertical-align:top${bold ? ';font-weight:700' : ''}">${escapeHtml(text)}</td>`;
  const head = (labels: string[]) =>
    `<tr>${labels.map(l => `<th align="left" style="padding:6px 8px;font-size:11px;color:${COLORS.soft};text-transform:uppercase;letter-spacing:.06em">${escapeHtml(l)}</th>`).join('')}</tr>`;
  const operatorsTable = data.operators.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;border-collapse:collapse">${head(['Loueur', 'Reçus', 'Importés', 'À vérifier'])}${data.operators
        .map(o => `<tr>${cell(o.name, true)}${cell(String(o.received))}${cell(String(o.imported))}${cell(String(o.toCheck), o.toCheck > 0)}</tr>`)
        .join('')}</table>`
    : '';
  const emailsTable = data.emails.length
    ? `<h2 style="margin:24px 0 0;font-size:16px;color:${COLORS.deep}">À vérifier</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;border-collapse:collapse">${head(['Reçu', 'Loueur', 'Mail', 'Lecture'])}${data.emails
        .map(
          e =>
            `<tr>${cell(time(e.receivedAt))}${cell(e.operator)}<td style="padding:6px 8px;border-top:1px solid ${COLORS.line};font-size:13px;vertical-align:top"><strong>${escapeHtml(e.subject || '(sans objet)')}</strong><br><span style="color:${COLORS.soft}">${escapeHtml(e.sender)} · ${escapeHtml(e.state)}</span></td>${cell(e.reading)}</tr>`,
        )
        .join(
          '',
        )}</table>${data.more ? `<p style="margin:8px 0 0;font-size:13px;color:${COLORS.soft}">Et ${data.more} autre${data.more > 1 ? 's' : ''}.</p>` : ''}`
    : '';
  const link = data.inboxUrl
    ? `<p style="margin:20px 0 0;font-size:14px"><a href="${escapeHtml(data.inboxUrl)}" style="color:${COLORS.deep}">Ouvrir la plateforme</a></p>`
    : '';
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 4px;font-size:22px;color:${COLORS.deep}">${escapeHtml(heading)}</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${escapeHtml(intro)}</p>
${operatorsTable}${emailsTable}${link}`,
  );
  const text = [
    heading,
    '',
    intro,
    '',
    ...data.operators.map(o => `- ${o.name} : ${o.received} reçus, ${o.imported} importés, ${o.toCheck} à vérifier`),
    ...(data.emails.length
      ? [
          '',
          'À vérifier :',
          ...data.emails.map(
            e => `- ${time(e.receivedAt)} · ${e.operator} · ${e.subject || '(sans objet)'} · ${e.sender} · ${e.state} · ${e.reading}`,
          ),
        ]
      : []),
    ...(data.more ? [`Et ${data.more} autre${data.more > 1 ? 's' : ''}.`] : []),
    ...(data.inboxUrl ? ['', `Ouvrir la plateforme : ${data.inboxUrl}`] : []),
    '',
    `— ${productName}`,
  ].join('\n');
  return { subject, html, text };
}
