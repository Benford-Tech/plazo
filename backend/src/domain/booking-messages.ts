import { PublicBooking } from '@/interfaces/booking.interface';

/**
 * French copy of the emails and SMS sent to travellers. Pure functions: the product name and the
 * manage link are passed in (the name lives in product.json only).
 */

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

const COLORS = { prune: '#4b164c', violet: '#a427c3', ink: '#1e1e1e', soft: '#6f6675', line: '#e6e0ea', tint: '#faf6fb', plate: '#1F3FA6' };

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** 3499 -> "34,99 €" (plain spaces: SMS-safe). */
export function formatEuros(cents: number): string {
  const [units, decimals] = (cents / 100).toFixed(2).split('.');
  return `${units.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${decimals} €`;
}

function parts(local: string) {
  const [date, time] = local.split('T');
  const [year, month, day] = date.split('-').map(Number);
  return { utcDay: new Date(Date.UTC(year, month - 1, day)), time, day, month };
}

/** "2026-10-04T06:30" -> "dimanche 4 octobre 2026 à 06:30". */
export function formatLocalLong(local: string): string {
  const { utcDay, time } = parts(local);
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(utcDay);
  return `${day} à ${time}`;
}

/** "2026-10-04T06:30" -> "04/10 à 06:30". */
export function formatLocalShort(local: string): string {
  const { time, day, month } = parts(local);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')} à ${time}`;
}

function cancellationSentence(booking: PublicBooking): string {
  if (!booking.cancellableUntil) return 'Cette réservation ne peut pas être annulée en ligne.';
  if (booking.cancellationPolicy === 'free_until_arrival') return "Vous pouvez l'annuler en ligne, sans frais, jusqu'à l'heure d'arrivée prévue.";
  return `Vous pouvez l'annuler en ligne, sans frais, jusqu'au ${formatLocalLong(booking.cancellableUntil)}.`;
}

function detailRows(booking: PublicBooking): [string, string][] {
  const rows: [string, string][] = [
    ['Référence', booking.reference],
    ['Parking', `${booking.parking.title} · ${booking.parking.airport.name}`],
    ['Arrivée', formatLocalLong(booking.arrivalAt)],
    ['Retour', formatLocalLong(booking.returnAt)],
    ['Durée', `${booking.days} jour${booking.days > 1 ? 's' : ''}`],
    ['Véhicule', booking.plate],
    ['Passagers', String(booking.passengers)],
  ];
  if (booking.returnFlight) rows.push(['Vol retour', booking.returnFlight]);
  if (booking.parking.address) rows.push(['Adresse', booking.parking.address]);
  if (booking.parking.shuttleMinutes) rows.push(['Navette', `environ ${booking.parking.shuttleMinutes} min jusqu'au terminal`]);
  if (booking.parking.openingHours) rows.push(['Horaires', booking.parking.openingHours]);
  return rows;
}

function plateHtml(plate: string): string {
  return (
    `<span style="display:inline-block;border:1px solid ${COLORS.ink};border-radius:4px;background:#fff;font-family:Menlo,Consolas,monospace;font-weight:700;white-space:nowrap">` +
    `<span style="display:inline-block;background:${COLORS.plate};color:#fff;padding:2px 5px;border-radius:3px 0 0 3px">F</span>` +
    `<span style="display:inline-block;padding:2px 8px">${escapeHtml(plate)}</span></span>`
  );
}

function layout(productName: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.tint};font-family:Inter,Helvetica,Arial,sans-serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.tint}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${COLORS.line};border-radius:16px;overflow:hidden">
<tr><td style="background:${COLORS.prune};padding:18px 24px;color:#fff;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:22px">${escapeHtml(productName)}</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:${COLORS.soft}">Cet email vous est envoyé par ${escapeHtml(productName)} à la suite de votre réservation.</p>
</td></tr></table>
</body></html>`;
}

function detailsTable(booking: PublicBooking): string {
  const rows = detailRows(booking)
    .map(([label, value]) => {
      const cell = label === 'Véhicule' ? plateHtml(value) : escapeHtml(value);
      return `<tr><td style="padding:6px 0;color:${COLORS.soft};font-size:14px;vertical-align:top;width:110px">${label}</td><td style="padding:6px 0;font-size:14px">${cell}</td></tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};border-bottom:1px solid ${COLORS.line};margin:16px 0">${rows}</table>`;
}

export function confirmationEmail(productName: string, booking: PublicBooking, manageUrl: string | null): EmailMessage {
  const subject = `Réservation ${booking.reference} confirmée · ${booking.parking.title}`;
  const total = booking.priceCents !== null ? formatEuros(booking.priceCents) : null;
  const manage = manageUrl
    ? `<p style="margin:24px 0 8px"><a href="${escapeHtml(manageUrl)}" style="display:inline-block;background:${COLORS.violet};background-image:linear-gradient(96deg,#a427c3,#cf4f96 55%,#f0a36b);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Gérer ma réservation</a></p>
<p style="margin:0;font-size:13px;color:${COLORS.soft}">Vous pourrez y indiquer ou changer votre vol retour${booking.cancellableUntil ? ', ou annuler' : ''}.</p>`
    : `<p style="margin:24px 0 0;font-size:13px;color:${COLORS.soft}">Retrouvez votre réservation sur le site, rubrique « Ma réservation », avec sa référence et votre email.</p>`;

  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:26px">Votre place est réservée</h1>
<p style="margin:0;font-size:15px">Bonjour ${escapeHtml(booking.customerName)}, merci pour votre réservation.</p>
${detailsTable(booking)}
${total ? `<p style="margin:0;font-size:16px"><strong>Total : ${total}</strong>, à régler sur place, au parking.</p><p style="margin:4px 0 0;font-size:13px;color:${COLORS.soft}">Aucun paiement n'a été demandé en ligne.</p>` : ''}
<p style="margin:16px 0 0;font-size:14px">${escapeHtml(cancellationSentence(booking))}</p>
${manage}`,
  );

  const text = [
    `Bonjour ${booking.customerName},`,
    '',
    `Votre place est réservée : ${booking.parking.title} (${booking.parking.airport.name}).`,
    '',
    ...detailRows(booking).map(([label, value]) => `${label} : ${value}`),
    '',
    ...(total ? [`Total : ${total}, à régler sur place, au parking. Aucun paiement n'a été demandé en ligne.`, ''] : []),
    cancellationSentence(booking),
    '',
    manageUrl
      ? `Gérer ma réservation : ${manageUrl}`
      : 'Retrouvez votre réservation sur le site, rubrique « Ma réservation », avec sa référence et votre email.',
    '',
    `— ${productName}`,
  ].join('\n');

  return { subject, html, text };
}

export function cancellationEmail(productName: string, booking: PublicBooking): EmailMessage {
  const subject = `Réservation ${booking.reference} annulée · ${booking.parking.title}`;
  const summary = `Votre réservation ${booking.reference} (${booking.parking.title}, arrivée le ${formatLocalLong(booking.arrivalAt)}, retour le ${formatLocalLong(booking.returnAt)}) est annulée.`;
  const html = layout(
    productName,
    subject,
    `<h1 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:26px">Réservation annulée</h1>
<p style="margin:0;font-size:15px">Bonjour ${escapeHtml(booking.customerName)},</p>
<p style="margin:12px 0 0;font-size:15px">${escapeHtml(summary)}</p>
<p style="margin:12px 0 0;font-size:14px;color:${COLORS.soft}">Rien ne vous sera demandé : le paiement se faisait sur place.</p>`,
  );
  const text = [
    `Bonjour ${booking.customerName},`,
    '',
    summary,
    'Rien ne vous sera demandé : le paiement se faisait sur place.',
    '',
    `— ${productName}`,
  ].join('\n');
  return { subject, html, text };
}

export function confirmationSms(productName: string, booking: PublicBooking, manageUrl: string | null): string {
  const total = booking.priceCents !== null ? ` ${formatEuros(booking.priceCents)} à régler sur place.` : '';
  return (
    `${productName} : réservation ${booking.reference} confirmée. ${booking.parking.title}, ` +
    `arrivée le ${formatLocalShort(booking.arrivalAt)}, retour le ${formatLocalShort(booking.returnAt)}.${total}` +
    (manageUrl ? ` Gérer : ${manageUrl}` : '')
  );
}

// GSM 03.38 alphabet (basic set and extension table): anything else makes the SMS unicode.
const GSM7 = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€',
);

export function isGsm7(text: string): boolean {
  return [...text].every(char => GSM7.has(char));
}
