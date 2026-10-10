import { euroCents, frenchDateTime, valueAfterLabel } from './common';
import { EmailImporter, ParsedBooking } from './types';

const LABELS = {
  passengers: /^Nombre (de )?personnes?\s*\*?$/i,
  plate: /^Num[ée]ro de plaque du v[ée]hicule\s*\*?$/i,
  brand: /^Marque du v[ée]hicule\s*\*?$/i,
  model: /^Mod[èe]le du v[ée]hicule\s*\*?$/i,
  outboundFlight: /^Num[ée]ro du vol aller\s*\*?$/i,
  returnFlight: /^Num[ée]ro du vol retour\s*\*?$/i,
  destination: /^Destination\s*\*?$/i,
  phone: /^Num[ée]ro de t[ée]l[ée]phone\s*\*?$/i,
  lastName: /^Nom\s*\*?$/i,
  firstName: /^Pr[ée]nom\s*\*?$/i,
  email: /^Adresse e-mail\s*\*?$/i,
  section: /^(Vos coordonn[ée]es|Assurance|Remboursement)$/i,
};
const ALL_LABELS = Object.values(LABELS);

/** Allopark booking confirmation, as copied from the email client. */
export const alloparkImporter: EmailImporter = {
  provider: 'Allopark',
  senders: ['info@allopark.com'],

  detect: text => /allopark/i.test(text) && /\bAL-\d{6,}\b/.test(text),

  parse(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const booking: ParsedBooking = { provider: 'Allopark' };

    booking.externalReference = /\b(AL-\d{6,})\b/.exec(text)?.[1];

    const stay =
      /Du\s+(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})\s*-\s*(\d{1,2})[:h](\d{2})\s*au\s+(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})\s*-\s*(\d{1,2})[:h](\d{2})/i.exec(
        text.replace(/\s+/g, ' '),
      );
    if (stay) {
      booking.arrivalAt = frenchDateTime(stay[1], stay[2], stay[3], stay[4], stay[5]);
      booking.returnAt = frenchDateTime(stay[6], stay[7], stay[8], stay[9], stay[10]);
    }

    const price = /€\s*([\d\s  ]+,\d{2})/.exec(text) ?? /([\d\s  ]+,\d{2})\s*€/.exec(text);
    if (price) booking.priceCents = euroCents(price[1]);

    // Form values, when the email carries them; the greeting is the fallback for the name.
    const first = valueAfterLabel(lines, LABELS.firstName, ALL_LABELS);
    const last = valueAfterLabel(lines, LABELS.lastName, ALL_LABELS);
    booking.customerName = first || last ? [first, last].filter(Boolean).join(' ') : /Bonjour\s+([^,\n]+),/.exec(text)?.[1]?.trim();
    if (first) booking.customerFirstName = first;
    if (last) booking.customerLastName = last;
    booking.customerPhone = valueAfterLabel(lines, LABELS.phone, ALL_LABELS);
    booking.customerEmail = valueAfterLabel(lines, LABELS.email, ALL_LABELS);
    booking.plate = valueAfterLabel(lines, LABELS.plate, ALL_LABELS);
    booking.returnFlight = valueAfterLabel(lines, LABELS.returnFlight, ALL_LABELS);
    booking.departureFlight = valueAfterLabel(lines, LABELS.outboundFlight, ALL_LABELS);
    const passengers = Number(valueAfterLabel(lines, LABELS.passengers, ALL_LABELS));
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;

    return booking;
  },
};
