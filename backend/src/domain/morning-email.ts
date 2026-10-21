import type { StaffRole } from '@/database';
import { EmailMessage, formatEuros } from './booking-messages';

/**
 * « Mail du matin » (21/10/2026, « un mail quotidien avec l'état des intégrations, le CA et le planning ; ce mail peut être
 * désactivé », choice A « Tableau du jour »): every morning, at the hour each member chose (07:00 by default, local time of
 * the parking), the day's planning, the revenue (managers) and the state of the integrations. On by default for the
 * managers, off for the others; « Ne plus le recevoir » turns it off in one click.
 */

export const MORNING_EMAIL_DEFAULT_HOUR = 7;
export const MORNING_EMAIL_HOURS = [5, 6, 7, 8, 9, 10] as const;
/** Past this local hour a missed morning is not sent any more (the next one comes tomorrow). */
export const MORNING_EMAIL_LAST_HOUR = 12;
/** Movements listed one by one; the rest are counted. */
export const MORNING_EMAIL_MOVES = 6;
/** A comparator silent for this many days is « À voir ». */
export const COMPARATOR_QUIET_DAYS = 3;

/** Whether the member gets it: their own choice, else on for the managers only. */
export function wantsMorningEmail(choice: boolean | null, role: StaffRole): boolean {
  return choice ?? role === 'manager';
}

/** Whether it is time for today's email: from the chosen hour until noon, once per local date. */
export function morningEmailDue(localHour: number, hour: number, sentOn: string | null, today: string): boolean {
  return sentOn !== today && localHour >= hour && localHour < MORNING_EMAIL_LAST_HOUR;
}

export type Tone = 'ok' | 'warn' | 'off';

export interface MorningMove {
  /** « 05:30 » */
  time: string;
  kind: 'arrival' | 'return';
  customer: string;
  /** « Allopark », « Plazo », « Téléphone »… */
  source: string;
  /** A flight or the passengers, else null. */
  detail: string | null;
}

export interface MorningIntegration {
  label: string;
  tone: Tone;
  /** The pill: « OK », « À voir », « Off », « 1 à traiter »… */
  badge: string;
}

export interface MorningDigest {
  firstName: string;
  parkingName: string;
  /** Local date « YYYY-MM-DD ». */
  date: string;
  sendHour: number;
  role: StaffRole;
  onSite: number;
  capacity: number | null;
  arrivals: { count: number; first: string | null };
  returns: { count: number; last: string | null };
  /** Tonight's load: vehicles and the bookable room. */
  tonight: { count: number; bookable: number } | null;
  moves: MorningMove[];
  movesTotal: number;
  /** Managers only (revenue:view), else null. */
  revenue: {
    yesterdayCents: number;
    yesterdayCount: number;
    monthLabel: string;
    monthCents: number;
    commissionCents: number;
    netCents: number;
    withoutAmount: number;
  } | null;
  integrations: MorningIntegration[];
  links: { dashboard: string; unsubscribe: string; settings: string };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 2026-10-22 » → « mercredi 22 oct. » */
export function shortDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} ${MONTHS[m - 1]}`;
}

/** « 2026-10-22 » → « Mercredi 22 octobre » */
export function longDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d} ${MONTHS_LONG[m - 1]}`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n <= 1 ? one : many}`;
const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

const C = {
  ground: '#EEF0EE',
  card: '#FFFFFF',
  line: '#E4E6E2',
  faint: '#F1F2EF',
  ink: '#1A1D1A',
  soft: '#4B5563',
  deep: '#1E5E2E',
  lime: '#A3E635',
  limeInk: '#0F2A14',
  pale: '#D6E9D9',
};
const PILL: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: '#DCFCE7', fg: '#166534' },
  warn: { bg: '#FEF3C7', fg: '#92400E' },
  off: { bg: '#F1F2EF', fg: '#4B5563' },
};
const MONO = "'JetBrains Mono',Menlo,Consolas,monospace";
const SANS = 'Inter,Arial,Helvetica,sans-serif';

export function morningSubject(d: MorningDigest): string {
  return `${d.parkingName} · ${shortDay(d.date)} : ${plural(d.arrivals.count, 'arrivée', 'arrivées')}, ${plural(d.returns.count, 'retour', 'retours')}`;
}

/** The email, in the pro space's look (choice A: planning, revenue, integrations), with its plain-text twin. */
export function morningEmail(d: MorningDigest): EmailMessage {
  const subject = morningSubject(d);
  const label = (text: string) =>
    `<p style="margin:0 0 10px;font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${C.deep}">${escapeHtml(text)}</p>`;
  const section = (inner: string, first = false) =>
    `<tr><td style="padding:20px 24px;${first ? '' : `border-top:1px solid ${C.line};`}">${inner}</td></tr>`;
  const tile = (title: string, value: string, sub: string, valueColor = C.ink) =>
    `<td width="33%" valign="top" style="padding:0 4px"><div style="border:1px solid ${C.line};border-radius:12px;padding:10px 12px">` +
    `<div style="font-size:12px;color:${C.soft}">${escapeHtml(title)}</div>` +
    `<div style="font-family:${MONO};font-size:24px;color:${valueColor}">${escapeHtml(value)}</div>` +
    `<div style="font-size:12px;color:${C.soft}">${escapeHtml(sub)}</div></div></td>`;
  const pill = (tone: Tone, text: string) =>
    `<span style="display:inline-block;background:${PILL[tone].bg};color:${PILL[tone].fg};border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600;white-space:nowrap">${escapeHtml(text)}</span>`;

  const occupancy = d.tonight && d.tonight.bookable > 0 ? Math.round((d.tonight.count / d.tonight.bookable) * 100) : null;
  const planningTiles =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -4px 8px"><tr>` +
    tile('Arrivées', String(d.arrivals.count), d.arrivals.first ? `1re à ${d.arrivals.first}` : 'aucune') +
    tile('Retours', String(d.returns.count), d.returns.last ? `dernier à ${d.returns.last}` : 'aucun') +
    tile('Ce soir', occupancy === null ? '—' : `${occupancy} %`, d.tonight ? `${d.tonight.count} / ${d.tonight.bookable} places` : 'sans capacité') +
    `</tr></table>`;
  const moveRows = d.moves
    .map(
      m =>
        `<tr><td width="56" style="padding:7px 0;border-bottom:1px solid ${C.faint};font-family:${MONO};font-size:14px">${escapeHtml(m.time)}</td>` +
        `<td style="padding:7px 0;border-bottom:1px solid ${C.faint};font-size:14px">${m.kind === 'arrival' ? 'Arrivée' : 'Retour'} · ${escapeHtml(m.customer)} · ${escapeHtml(m.source)}</td>` +
        `<td align="right" style="padding:7px 0;border-bottom:1px solid ${C.faint};font-size:13px;color:${C.soft}">${escapeHtml(m.detail ?? '')}</td></tr>`,
    )
    .join('');
  const more = d.movesTotal - d.moves.length;
  const moves =
    d.movesTotal === 0
      ? `<p style="margin:0;font-size:14px;color:${C.soft}">Aucune arrivée ni aucun retour aujourd'hui.</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${moveRows}` +
        (more > 0
          ? `<tr><td></td><td colspan="2" style="padding:7px 0;font-size:14px;color:${C.soft}">et ${plural(more, 'autre mouvement', 'autres mouvements')}</td></tr>`
          : '') +
        `</table>`;

  const r = d.revenue;
  const revenue = r
    ? section(
        label("CHIFFRE D'AFFAIRES") +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -4px"><tr>` +
          tile('Hier', formatEuros(r.yesterdayCents), plural(r.yesterdayCount, 'réservation', 'réservations')) +
          tile(
            `${r.monthLabel}, encaissé`,
            formatEuros(r.monthCents),
            r.commissionCents > 0 ? `− ${formatEuros(r.commissionCents)} de commissions` : 'sans commission',
          ) +
          tile(
            `${r.monthLabel}, vous gardez`,
            formatEuros(r.netCents),
            r.withoutAmount > 0 ? plural(r.withoutAmount, 'réservation sans prix', 'réservations sans prix') : 'tous les prix saisis',
            '#166534',
          ) +
          `</tr></table>`,
      )
    : '';

  const integrations = d.integrations.length
    ? section(
        label('INTÉGRATIONS') +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
          d.integrations
            .map(
              (i, n) =>
                `<tr><td style="padding:7px 0;${n < d.integrations.length - 1 ? `border-bottom:1px solid ${C.faint};` : ''}font-size:14px">${escapeHtml(i.label)}</td>` +
                `<td align="right" style="padding:7px 0;${n < d.integrations.length - 1 ? `border-bottom:1px solid ${C.faint};` : ''}">${pill(i.tone, i.badge)}</td></tr>`,
            )
            .join('') +
          `</table>`,
      )
    : '';

  const why = `Vous recevez ce mail chaque matin à ${hourLabel(d.sendHour)}${d.role === 'manager' ? ` en tant que gérant du ${d.parkingName}` : ''}.`;
  const footer = section(
    `<a href="${escapeHtml(d.links.dashboard)}" style="display:inline-block;background:${C.lime};color:${C.limeInk};border-radius:10px;padding:12px 18px;font-weight:700;text-decoration:none;font-size:15px">Ouvrir le tableau de bord</a>` +
      `<p style="margin:14px 0 0;font-size:12px;color:${C.soft}">${escapeHtml(why)} ` +
      `<a href="${escapeHtml(d.links.unsubscribe)}" style="color:${C.deep}">Ne plus le recevoir</a> · ` +
      `<a href="${escapeHtml(d.links.settings)}" style="color:${C.deep}">Changer l'heure</a></p>`,
  );

  const capacityLine = d.capacity
    ? `${plural(d.onSite, 'voiture', 'voitures')} sur place ce matin sur ${d.capacity} places.`
    : `${plural(d.onSite, 'voiture', 'voitures')} sur place ce matin.`;
  const html =
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>` +
    `<body style="margin:0;background:${C.ground};font-family:${SANS};color:${C.ink}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:20px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:14px;overflow:hidden">` +
    `<tr><td style="background:${C.deep};padding:18px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td><span style="background:${C.lime};color:${C.limeInk};border-radius:6px;padding:2px 8px;font-weight:800;font-size:16px">Plazo</span> <span style="font-weight:700;color:${C.lime};font-size:14px">PRO</span></td>` +
    `<td align="right" style="font-size:13px;color:${C.pale}">${escapeHtml(longDay(d.date))}</td></tr></table></td></tr>` +
    `<tr><td style="padding:20px 24px 0"><h1 style="margin:0;font-size:22px;font-weight:700">${escapeHtml(d.firstName ? `Bonjour ${d.firstName}, voici votre journée.` : 'Bonjour, voici votre journée.')}</h1>` +
    `<p style="margin:4px 0 0;font-size:14px;color:${C.soft}">${escapeHtml(d.parkingName)} · ${escapeHtml(capacityLine)}</p></td></tr>` +
    section(label('PLANNING DU JOUR') + planningTiles + moves, true) +
    revenue +
    integrations +
    footer +
    `</table></td></tr></table></body></html>`;

  const text = [
    d.firstName ? `Bonjour ${d.firstName}, voici votre journée.` : 'Bonjour, voici votre journée.',
    `${d.parkingName} · ${longDay(d.date)} · ${capacityLine}`,
    [
      'PLANNING DU JOUR',
      `${plural(d.arrivals.count, 'arrivée', 'arrivées')}${d.arrivals.first ? ` (1re à ${d.arrivals.first})` : ''}, ${plural(d.returns.count, 'retour', 'retours')}${d.returns.last ? ` (dernier à ${d.returns.last})` : ''}.`,
      ...(occupancy !== null && d.tonight ? [`Ce soir : ${occupancy} % (${d.tonight.count} / ${d.tonight.bookable} places).`] : []),
      ...d.moves.map(
        m => `${m.time} ${m.kind === 'arrival' ? 'Arrivée' : 'Retour'} · ${m.customer} · ${m.source}${m.detail ? ` · ${m.detail}` : ''}`,
      ),
      ...(more > 0 ? [`et ${plural(more, 'autre mouvement', 'autres mouvements')}`] : []),
    ].join('\n'),
    ...(r
      ? [
          [
            "CHIFFRE D'AFFAIRES",
            `Hier : ${formatEuros(r.yesterdayCents)} (${plural(r.yesterdayCount, 'réservation', 'réservations')}).`,
            `${r.monthLabel} : ${formatEuros(r.monthCents)} encaissés, ${formatEuros(r.netCents)} gardés après commissions.`,
            ...(r.withoutAmount > 0 ? [plural(r.withoutAmount, 'réservation sans prix', 'réservations sans prix')] : []),
          ].join('\n'),
        ]
      : []),
    ...(d.integrations.length ? [['INTÉGRATIONS', ...d.integrations.map(i => `${i.label} : ${i.badge}`)].join('\n')] : []),
    `Tableau de bord : ${d.links.dashboard}`,
    `${why}\nNe plus le recevoir : ${d.links.unsubscribe}\nChanger l'heure : ${d.links.settings}`,
  ].join('\n\n');

  return { subject, html, text };
}
