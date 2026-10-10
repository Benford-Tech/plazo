/**
 * « Présentation » of a parking's Plazo page, written by Claude (09/10/2026, « pouvoir générer une Présentation pour
 * son parking »). Pure side: the facts gathered from the parking's real data, the instructions, the answer's schema
 * and the guard that rejects an answer stating a figure the data does not hold. The call itself lives in
 * `ListingDescriptionService`; nothing is saved, the manager reviews the text and saves the page.
 */
import type { CancellationPolicy } from '@/database';
import { formatEuros } from './booking-messages';
import type { Service } from './listing';

/** The listing's own limit (`UpdateListingDto.description`): an answer beyond it is rejected. */
export const DESCRIPTION_MAX_CHARS = 2000;
/** What the instructions ask for: well under the limit, a page's introduction rather than an article. */
export const DESCRIPTION_TARGET_CHARS = 1200;
/** The site cuts the description here for the page's meta description (`site/src/lib/seo.ts`). */
export const META_DESCRIPTION_CHARS = 160;

/** The services of the listing, as a traveller reads them (the pro space's chips say the same in short). */
export const SERVICE_FACTS: Record<Service, string> = {
  shuttle: "navette entre le parking et l'aéroport",
  valet: 'voiturier',
  covered: 'places couvertes',
  ev_charging: 'recharge pour véhicule électrique',
  open_24h: 'ouvert 24h/24',
  fenced: 'parking clôturé',
  cctv: 'vidéosurveillance',
};

/** The cancellation policies, worded as in the traveller's confirmation (`booking-messages.ts`). */
export const CANCELLATION_FACTS: Record<CancellationPolicy, string> = {
  free_until_arrival: "annulation en ligne sans frais jusqu'à l'heure d'arrivée prévue, remboursement intégral",
  free_24h: "annulation en ligne sans frais jusqu'à 24 h avant l'arrivée, remboursement intégral",
  free_48h: "annulation en ligne sans frais jusqu'à 48 h avant l'arrivée, remboursement intégral",
  non_refundable: 'réservation non remboursable',
};

/**
 * The terminal in service, per airport. Lyon Saint-Exupéry: the Terminal 2 is closed since 01/04/2026, every flight
 * goes through the Terminal 1 (the site's guide, `LYON_OFFICIAL`).
 */
export const AIRPORT_TERMINALS: Record<string, string> = {
  LYS: 'Terminal 1, la seule aérogare ouverte',
};

/** What the server reads to write the facts: the saved page and the parking's settings, nothing typed on screen. */
export interface DescriptionSource {
  parking: { name: string; address: string | null; shuttleTravelMinutes: number | null; returnMeetingLabel: string | null };
  /** The saved Plazo page; null before its first save (then only the parking's own data speaks). */
  listing: {
    title: string;
    services: string[];
    shuttleMinutes: number | null;
    distanceKm: number | null;
    openingHours: string | null;
    cancellationPolicy: CancellationPolicy;
  } | null;
  airport: { code: string; name: string; city: string } | null;
  tiers: { days: number; priceCents: number }[];
  /** The shuttle vehicles in service. */
  vehicles: { seats: number | null }[];
  /** The places the shuttle serves besides the airport (D-A). */
  stops: { name: string }[];
  /** Active valet files (S-C): the parking stores the cars itself. */
  valetFiles: number;
}

export interface DescriptionFact {
  label: string;
  value: string;
}

const text = (value: string | null | undefined): string | null => value?.trim().replace(/\s+/g, ' ') || null;
const decimal = (value: number) => String(value).replace('.', ',');

/** The parking's real data, one line per fact; a missing piece of data is no line at all. */
export function descriptionFacts(source: DescriptionSource): DescriptionFact[] {
  const facts: DescriptionFact[] = [];
  const add = (label: string, value: string | null) => {
    if (value) facts.push({ label, value });
  };
  const { parking, listing, airport } = source;

  add('Nom du parking', text(listing?.title) ?? text(parking.name));
  add('Adresse', text(parking.address));
  if (airport) {
    const sameCity = airport.name.toLowerCase().includes(airport.city.toLowerCase());
    add('Aéroport', sameCity ? airport.name : `${airport.name} (${airport.city})`);
    add("Aérogare en service à l'aéroport", AIRPORT_TERMINALS[airport.code] ?? null);
  }

  const services = (listing?.services ?? []).filter((s): s is Service => s in SERVICE_FACTS);
  const valet = services.includes('valet') || source.valetFiles > 0;
  const shuttle = services.includes('shuttle') || source.vehicles.length > 0;
  add(
    'Services',
    services
      .filter(s => s !== 'valet')
      .map(s => SERVICE_FACTS[s])
      .join(', ') || null,
  );
  if (valet) add('Voiturier', "oui : le client confie ses clés, l'équipe gare la voiture");

  if (shuttle) {
    // As the pro form shows it: the page's figure, else the parking's own setting (Réglages).
    const minutes = listing?.shuttleMinutes ?? parking.shuttleTravelMinutes;
    if (minutes) add("Trajet en navette jusqu'à l'aéroport", `${minutes} min`);
    if (source.vehicles.length) {
      const seats = source.vehicles.map(v => v.seats).filter((n): n is number => !!n && n > 0);
      const count = source.vehicles.length;
      const vehicles = `${count} véhicule${count > 1 ? 's' : ''}`;
      add('Navettes en service', seats.length ? `${vehicles} (${seats.join(', ')} places passagers)` : vehicles);
    }
    add(
      'Autres dessertes de la navette',
      source.stops
        .map(s => text(s.name))
        .filter(Boolean)
        .join(', ') || null,
    );
    add('Point de rendez-vous au retour', text(parking.returnMeetingLabel));
  }

  if (listing?.distanceKm !== null && listing?.distanceKm !== undefined) add("Distance de l'aéroport", `${decimal(listing.distanceKm)} km`);
  add('Horaires', text(listing?.openingHours));
  if (listing) add('Annulation', CANCELLATION_FACTS[listing.cancellationPolicy]);

  const cheapest = [...source.tiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
  if (cheapest) {
    add('Prix', `à partir de ${formatEuros(cheapest.priceCents)} (forfait jusqu'à ${cheapest.days} jour${cheapest.days > 1 ? 's' : ''})`);
  }
  return facts;
}

/** The facts as Claude reads them, one per line. */
export function factsText(facts: DescriptionFact[]): string {
  return facts.map(f => `- ${f.label} : ${f.value}`).join('\n');
}

export const LISTING_DESCRIPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: { text: { type: 'string' } },
};

/** The instructions, in French like the text they ask for. */
export function listingDescriptionPrompt(productName: string): string {
  return `Tu rédiges la présentation d'un parking proche d'un aéroport pour sa page sur ${productName}, un site où les voyageurs comparent et réservent leur parking. Le texte s'affiche sous le nom du parking, au-dessus de la réservation.

Règles :
- En français, vouvoiement, ton sobre et concret, phrases courtes.
- Texte brut : 2 à 4 courts paragraphes séparés par une ligne vide, ${DESCRIPTION_TARGET_CHARS} caractères au plus. Ni markdown (pas de titre, de liste, de gras), ni émoji, ni lien.
- La première phrase se suffit à elle-même et tient en ${META_DESCRIPTION_CHARS} caractères : elle devient la description de la page dans Google. Elle dit ce qu'est le parking et près de quel aéroport il se trouve.
- N'utilise que les faits fournis. N'invente aucun service, équipement, horaire, prix, durée, distance, capacité ni chiffre ; un élément absent des faits n'est pas mentionné. N'écris aucun nombre, en chiffres ou en lettres, qui ne figure pas dans les faits (ou dans la présentation actuelle, quand elle t'est donnée).
- Aucun superlatif ni promesse (« le meilleur », « le moins cher », « idéal », « garanti », « incontournable »…), aucun point d'exclamation.
- Ne parle jamais du « Terminal 2 », ni de sa fermeture.
- Le paiement se fait toujours en ligne, à la réservation : n'écris jamais que le séjour se paie sur place, au parking ou à l'arrivée.

Réponds en JSON : { "text": "…" }.`;
}

/** The message handed to Claude: the facts, and the manager's current text to improve when there is one. */
export function listingDescriptionInput(facts: DescriptionFact[], current?: string | null): string {
  const data = `Faits sur le parking :\n${factsText(facts)}`;
  const existing = current?.trim();
  if (!existing) return `${data}\n\nRédige la présentation.`;
  return `${data}

Présentation actuelle, écrite par le loueur :
"""
${existing.slice(0, DESCRIPTION_MAX_CHARS)}
"""

Améliore cette présentation plutôt que de repartir de zéro : garde ce qu'elle dit de juste et son intention, corrige ce qui enfreint les règles (paiement sur place, Terminal 2, superlatifs, mise en forme), complète-la avec les faits et suis la même longueur cible. N'ajoute aucun fait absent des faits ci-dessus ou de la présentation actuelle.`;
}

/** Every number of a text, normalised ("29,90" and "29.9" are the same): "24h/24" gives 24 twice. */
export function numbersIn(value: string): string[] {
  return (value.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => String(Number(n.replace(',', '.'))));
}

/** The French number words up to « mille »: « zéro » to « seize » by rank, then the tens (« quatre-vingt »: `wordsValue`). */
const TENS = { vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, cents: 100, mille: 1000 };
const NUMBER_WORDS: Record<string, number> = {
  ...Object.fromEntries(
    'zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize'.split(' ').map((w, i) => [w, i]),
  ),
  une: 1,
  ...TENS,
};
/** A number word is a figure of the presentation only before one of these units. */
const UNITS =
  'minutes?|min|heures?|h|secondes?|jours?|nuits?|semaines?|mois|ans|années?|places?|emplacements?|km|kilomètres?|mètres?|' +
  'hectares?|euros?|€|%|navettes?|véhicules?|minibus|voitures?|chauffeurs?|voituriers?|passagers?|personnes?|rotations?|' +
  'départs?|trajets?|caméras?|bornes?';
const WORD = `(?:${Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .join('|')})(?!\\p{L})`;
// « vingt-quatre », « deux cents », « vingt et un » (« et » only before un, une or onze), then the unit.
const SPELLED = new RegExp(
  `(?<![\\p{L}\\d-])(${WORD}(?:(?:[\\s-]+|\\s+et\\s+(?=(?:un|une|onze)(?!\\p{L})))${WORD})*)\\s*(?:${UNITS})(?![\\p{L}\\d])`,
  'giu',
);

function wordsValue(words: string[]): number {
  let total = 0;
  let current = 0;
  let previous = '';
  for (const word of words) {
    const value = NUMBER_WORDS[word];
    if (value === 100) current = (current || 1) * 100;
    else if (value === 1000) {
      total += (current || 1) * 1000;
      current = 0;
    } else {
      // « quatre-vingt » is 4 × 20: the « quatre » already counted becomes 80.
      current += value === 20 && previous === 'quatre' ? 76 : value;
    }
    previous = word;
  }
  return total + current;
}

/**
 * The numbers a text writes in words before a unit (« dix minutes » gives 10, « vingt-quatre heures » 24), so that a
 * figure spelled out escapes the guard no more than in digits. A lone « un » or « une » is an article, not a figure.
 */
export function spelledNumbersIn(value: string): string[] {
  const found: string[] = [];
  for (const match of value.matchAll(SPELLED)) {
    const words = match[1]
      .toLowerCase()
      .split(/[\s-]+/)
      .filter(w => w && w !== 'et');
    if (words.length === 1 && NUMBER_WORDS[words[0]] === 1) continue;
    found.push(String(wordsValue(words)));
  }
  return found;
}

export type DescriptionCheck =
  { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' | 'terminal_2' | 'unsupported_figure'; figures?: string[] };

/**
 * The guard on Claude's answer: a text with a figure absent from the facts (or from the manager's own text it
 * improves), in digits or in words before a unit, a mention of the closed Terminal 2, or beyond the listing's limit is
 * rejected rather than offered.
 */
export function checkDescription(answer: string, facts: DescriptionFact[], current?: string | null): DescriptionCheck {
  const cleaned = answer
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!cleaned) return { ok: false, reason: 'empty' };
  if (cleaned.length > DESCRIPTION_MAX_CHARS) return { ok: false, reason: 'too_long' };
  if (/terminal\s*2\b/i.test(cleaned)) return { ok: false, reason: 'terminal_2' };
  const known = new Set([...numbersIn(factsText(facts)), ...numbersIn(current ?? ''), ...spelledNumbersIn(current ?? '')]);
  const figures = [...new Set([...numbersIn(cleaned), ...spelledNumbersIn(cleaned)].filter(n => !known.has(n)))];
  if (figures.length) return { ok: false, reason: 'unsupported_figure', figures };
  return { ok: true, text: cleaned };
}
