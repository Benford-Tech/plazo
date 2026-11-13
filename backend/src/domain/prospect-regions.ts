/**
 * Classement des prospects par région (19/10/2026, « classe les prospects par région », choix « Groupés par région » +
 * « De l'aéroport »): the French administrative region (or Switzerland, 03/11/2026) of a prospect, read from its airport, unless the platform admin
 * chose one by hand. Pure; shared by the list, its filter and counts, the form and the CSV import.
 */

export const REGIONS = [
  { key: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
  { key: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
  { key: 'bretagne', label: 'Bretagne' },
  { key: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
  { key: 'corse', label: 'Corse' },
  { key: 'grand-est', label: 'Grand Est' },
  { key: 'hauts-de-france', label: 'Hauts-de-France' },
  { key: 'ile-de-france', label: 'Île-de-France' },
  { key: 'normandie', label: 'Normandie' },
  { key: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
  { key: 'occitanie', label: 'Occitanie' },
  { key: 'pays-de-la-loire', label: 'Pays de la Loire' },
  { key: 'provence-alpes-cote-d-azur', label: "Provence-Alpes-Côte d'Azur" },
  { key: 'guadeloupe', label: 'Guadeloupe' },
  { key: 'martinique', label: 'Martinique' },
  { key: 'guyane', label: 'Guyane' },
  { key: 'la-reunion', label: 'La Réunion' },
  { key: 'mayotte', label: 'Mayotte' },
  // 03/11/2026 (« rajoute des prospects en Suisse »): Switzerland as a whole, after the French regions.
  { key: 'suisse', label: 'Suisse' },
  // 13/11/2026 (« fais les 3 », the European prospects): one block per country, after France.
  { key: 'allemagne', label: 'Allemagne' },
  { key: 'autriche', label: 'Autriche' },
  { key: 'belgique', label: 'Belgique' },
  { key: 'danemark', label: 'Danemark' },
  { key: 'espagne', label: 'Espagne' },
  { key: 'estonie', label: 'Estonie' },
  { key: 'finlande', label: 'Finlande' },
  { key: 'grece', label: 'Grèce' },
  { key: 'hongrie', label: 'Hongrie' },
  { key: 'irlande', label: 'Irlande' },
  { key: 'italie', label: 'Italie' },
  { key: 'luxembourg', label: 'Luxembourg' },
  { key: 'norvege', label: 'Norvège' },
  { key: 'pays-bas', label: 'Pays-Bas' },
  { key: 'pologne', label: 'Pologne' },
  { key: 'portugal', label: 'Portugal' },
  { key: 'republique-tcheque', label: 'République tchèque' },
  { key: 'roumanie', label: 'Roumanie' },
  { key: 'royaume-uni', label: 'Royaume-Uni' },
  { key: 'suede', label: 'Suède' },
] as const;

export type RegionKey = (typeof REGIONS)[number]['key'];
export const REGION_KEYS: RegionKey[] = REGIONS.map(r => r.key);
/** The filter value of the prospects without a region. */
export const NO_REGION = 'none';

const LABELS = new Map<string, string>(REGIONS.map(r => [r.key, r.label]));

/** The keys that are countries (Switzerland and the rest of Europe), not French regions: listed after France. */
export const COUNTRY_KEYS: ReadonlySet<RegionKey> = new Set<RegionKey>(REGION_KEYS.slice(REGION_KEYS.indexOf('suisse')));
export const isCountry = (key: RegionKey): boolean => COUNTRY_KEYS.has(key);

/**
 * French commercial airports (IATA code → region). Only codes checked one by one; an airport missing here gives no region
 * (« Sans région ») until the admin picks one. EuroAirport Basel-Mulhouse (BSL / MLH) stands in the Haut-Rhin; Beauvais-Tillé
 * (BVA) in the Oise, so Hauts-de-France, not Île-de-France. Brive (BVE) straddles Corrèze and Lot: left out.
 */
export const AIRPORT_REGIONS: Readonly<Record<string, RegionKey>> = {
  // Auvergne-Rhône-Alpes
  LYS: 'auvergne-rhone-alpes', // Lyon-Saint-Exupéry
  LYN: 'auvergne-rhone-alpes', // Lyon-Bron
  GNB: 'auvergne-rhone-alpes', // Grenoble-Alpes-Isère
  CFE: 'auvergne-rhone-alpes', // Clermont-Ferrand Auvergne
  CMF: 'auvergne-rhone-alpes', // Chambéry-Savoie
  NCY: 'auvergne-rhone-alpes', // Annecy Mont-Blanc
  EBU: 'auvergne-rhone-alpes', // Saint-Étienne-Bouthéon
  AUR: 'auvergne-rhone-alpes', // Aurillac
  LPY: 'auvergne-rhone-alpes', // Le Puy-Loudes
  VAF: 'auvergne-rhone-alpes', // Valence-Chabeuil
  // Bourgogne-Franche-Comté
  DIJ: 'bourgogne-franche-comte', // Dijon-Bourgogne
  DLE: 'bourgogne-franche-comte', // Dole-Jura
  // Bretagne
  RNS: 'bretagne', // Rennes-Saint-Jacques
  BES: 'bretagne', // Brest-Bretagne
  LRT: 'bretagne', // Lorient-Bretagne Sud
  UIP: 'bretagne', // Quimper-Bretagne
  DNR: 'bretagne', // Dinard-Pleurtuit-Saint-Malo
  LAI: 'bretagne', // Lannion
  // Centre-Val de Loire
  TUF: 'centre-val-de-loire', // Tours-Val de Loire
  CHR: 'centre-val-de-loire', // Châteauroux-Centre
  // Corse
  AJA: 'corse', // Ajaccio
  BIA: 'corse', // Bastia-Poretta
  CLY: 'corse', // Calvi-Sainte-Catherine
  FSC: 'corse', // Figari-Sud-Corse
  // Grand Est
  SXB: 'grand-est', // Strasbourg-Entzheim
  ETZ: 'grand-est', // Metz-Nancy-Lorraine
  BSL: 'grand-est', // EuroAirport Basel-Mulhouse
  MLH: 'grand-est', // EuroAirport Basel-Mulhouse
  XCR: 'grand-est', // Châlons-Vatry
  // Hauts-de-France
  LIL: 'hauts-de-france', // Lille-Lesquin
  BVA: 'hauts-de-france', // Beauvais-Tillé
  // Île-de-France
  CDG: 'ile-de-france', // Paris-Charles-de-Gaulle
  ORY: 'ile-de-france', // Paris-Orly
  LBG: 'ile-de-france', // Paris-Le Bourget
  // Normandie
  CFR: 'normandie', // Caen-Carpiquet
  DOL: 'normandie', // Deauville-Normandie
  URO: 'normandie', // Rouen Vallée de Seine
  LEH: 'normandie', // Le Havre-Octeville
  CER: 'normandie', // Cherbourg-Maupertus
  // Nouvelle-Aquitaine
  BOD: 'nouvelle-aquitaine', // Bordeaux-Mérignac
  BIQ: 'nouvelle-aquitaine', // Biarritz-Pays basque
  PUF: 'nouvelle-aquitaine', // Pau-Pyrénées
  LIG: 'nouvelle-aquitaine', // Limoges-Bellegarde
  LRH: 'nouvelle-aquitaine', // La Rochelle-Île de Ré
  EGC: 'nouvelle-aquitaine', // Bergerac-Dordogne-Périgord
  PIS: 'nouvelle-aquitaine', // Poitiers-Biard
  // Occitanie
  TLS: 'occitanie', // Toulouse-Blagnac
  MPL: 'occitanie', // Montpellier-Méditerranée
  FNI: 'occitanie', // Nîmes-Alès-Camargue-Cévennes
  BZR: 'occitanie', // Béziers-Cap d'Agde
  PGF: 'occitanie', // Perpignan-Rivesaltes
  CCF: 'occitanie', // Carcassonne
  RDZ: 'occitanie', // Rodez-Aveyron
  LDE: 'occitanie', // Tarbes-Lourdes-Pyrénées
  DCM: 'occitanie', // Castres-Mazamet
  // Pays de la Loire
  NTE: 'pays-de-la-loire', // Nantes-Atlantique
  ANE: 'pays-de-la-loire', // Angers-Loire
  // Provence-Alpes-Côte d'Azur
  MRS: 'provence-alpes-cote-d-azur', // Marseille-Provence
  NCE: 'provence-alpes-cote-d-azur', // Nice-Côte d'Azur
  TLN: 'provence-alpes-cote-d-azur', // Toulon-Hyères
  AVN: 'provence-alpes-cote-d-azur', // Avignon-Provence
  CEQ: 'provence-alpes-cote-d-azur', // Cannes-Mandelieu
  // Outre-mer
  PTP: 'guadeloupe', // Pointe-à-Pitre-Le Raizet
  FDF: 'martinique', // Martinique-Aimé-Césaire
  CAY: 'guyane', // Cayenne-Félix-Éboué
  RUN: 'la-reunion', // La Réunion-Roland-Garros
  ZSE: 'la-reunion', // Saint-Pierre-Pierrefonds
  DZA: 'mayotte', // Dzaoudzi-Pamandzi
  // Suisse (EuroAirport BSL / MLH stays in Grand Est: it stands in France)
  GVA: 'suisse', // Genève
  ZRH: 'suisse', // Zurich
  BRN: 'suisse', // Berne-Belp
  LUG: 'suisse', // Lugano-Agno
  SIR: 'suisse', // Sion
  // 13/11/2026: the other European countries, by their commercial airports.
  ...country('allemagne', 'BER CGN DTM DUS FRA HAJ HAM LEJ MUC NUE STR BRE DRS HHN NRN FMM PAD FDH SCN FKB'),
  ...country('autriche', 'VIE SZG INN GRZ LNZ KLU'),
  ...country('belgique', 'BRU CRL LGG ANR OST'),
  ...country('danemark', 'CPH BLL AAL AAR'),
  ...country('espagne', 'MAD BCN AGP ALC BIO PMI SVQ VLC IBZ TFS TFN LPA ACE FUE GRO REU SCQ SDR OVD VGO MAH XRY GRX ZAZ'),
  ...country('estonie', 'TLL'),
  ...country('finlande', 'HEL OUL TMP TKU RVN'),
  ...country('grece', 'ATH SKG HER RHO CFU CHQ JTR JMK KGS'),
  ...country('hongrie', 'BUD DEB'),
  ...country('irlande', 'DUB ORK SNN NOC KIR'),
  ...country('italie', 'FCO CIA MXP LIN BGY VCE TSF BLQ NAP CTA PMO CAG OLB PSA FLR TRN BRI BDS VRN GOA TRS SUF AHO'),
  ...country('luxembourg', 'LUX'),
  ...country('norvege', 'OSL BGO TRD SVG TOS'),
  ...country('pays-bas', 'AMS EIN RTM GRQ MST'),
  ...country('pologne', 'WAW WMI KRK GDN KTW WRO POZ RZE LUZ SZZ BZG'),
  ...country('portugal', 'LIS OPO FAO FNC PDL'),
  ...country('republique-tcheque', 'PRG BRQ OSR'),
  ...country('roumanie', 'OTP CLJ TSR IAS SBZ'),
  ...country('royaume-uni', 'LHR LGW STN LTN LCY SEN MAN BHX BRS EDI GLA LPL NCL EMA LBA BFS BHD ABZ CWL EXT SOU BOH NWI PIK INV'),
  ...country('suede', 'ARN GOT MMX BMA NYO'),
};

function country(key: RegionKey, codes: string): Record<string, RegionKey> {
  return Object.fromEntries(codes.split(' ').map(code => [code, key]));
}

export const isRegionKey = (value: unknown): value is RegionKey => typeof value === 'string' && LABELS.has(value);

export const regionLabel = (key: string): string | null => LABELS.get(key) ?? null;

/** The region of an airport code, or null when Plazo does not know it. */
export function regionOfAirport(code: string | null | undefined): RegionKey | null {
  if (!code) return null;
  return AIRPORT_REGIONS[code.trim().toUpperCase()] ?? null;
}

/** The airport codes of a region (the list's filter). */
export function airportsOfRegion(key: RegionKey): string[] {
  return Object.entries(AIRPORT_REGIONS)
    .filter(([, region]) => region === key)
    .map(([code]) => code);
}

export const KNOWN_AIRPORTS: string[] = Object.keys(AIRPORT_REGIONS);

/** The region chosen by hand, else the airport's, else none. */
export function effectiveRegion(prospect: { region: string | null; airportCode: string | null }): RegionKey | null {
  if (isRegionKey(prospect.region)) return prospect.region;
  return regionOfAirport(prospect.airportCode);
}

/** What the list shows: the key and its label, and whether the admin chose it. */
export function regionView(prospect: {
  region: string | null;
  airportCode: string | null;
}): { key: RegionKey; label: string; manual: boolean } | null {
  const key = effectiveRegion(prospect);
  return key ? { key, label: LABELS.get(key)!, manual: isRegionKey(prospect.region) } : null;
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const BY_NAME = new Map<string, RegionKey>([
  ...REGIONS.flatMap(r => [[fold(r.label), r.key] as [string, RegionKey], [fold(r.key), r.key] as [string, RegionKey]]),
  // Common short forms.
  ['aura', 'auvergne-rhone-alpes'],
  ['paca', 'provence-alpes-cote-d-azur'],
  ['idf', 'ile-de-france'],
  ['reunion', 'la-reunion'],
  ['ch', 'suisse'],
  ['switzerland', 'suisse'],
  ['schweiz', 'suisse'],
  ['germany', 'allemagne'],
  ['deutschland', 'allemagne'],
  ['de', 'allemagne'],
  ['austria', 'autriche'],
  ['osterreich', 'autriche'],
  ['at', 'autriche'],
  ['belgium', 'belgique'],
  ['belgie', 'belgique'],
  ['be', 'belgique'],
  ['denmark', 'danemark'],
  ['danmark', 'danemark'],
  ['dk', 'danemark'],
  ['spain', 'espagne'],
  ['espana', 'espagne'],
  ['es', 'espagne'],
  ['estonia', 'estonie'],
  ['ee', 'estonie'],
  ['finland', 'finlande'],
  ['suomi', 'finlande'],
  ['fi', 'finlande'],
  ['greece', 'grece'],
  ['gr', 'grece'],
  ['hungary', 'hongrie'],
  ['hu', 'hongrie'],
  ['ireland', 'irlande'],
  ['ie', 'irlande'],
  ['italy', 'italie'],
  ['italia', 'italie'],
  ['it', 'italie'],
  ['lu', 'luxembourg'],
  ['norway', 'norvege'],
  ['norge', 'norvege'],
  ['no', 'norvege'],
  ['netherlands', 'pays-bas'],
  ['nederland', 'pays-bas'],
  ['hollande', 'pays-bas'],
  ['nl', 'pays-bas'],
  ['poland', 'pologne'],
  ['polska', 'pologne'],
  ['pl', 'pologne'],
  ['pt', 'portugal'],
  ['tchequie', 'republique-tcheque'],
  ['czechia', 'republique-tcheque'],
  ['czechrepublic', 'republique-tcheque'],
  ['cz', 'republique-tcheque'],
  ['romania', 'roumanie'],
  ['ro', 'roumanie'],
  ['unitedkingdom', 'royaume-uni'],
  ['uk', 'royaume-uni'],
  ['gb', 'royaume-uni'],
  ['angleterre', 'royaume-uni'],
  ['ecosse', 'royaume-uni'],
  ['sweden', 'suede'],
  ['sverige', 'suede'],
  ['se', 'suede'],
]);

/**
 * A region typed by a person (CSV column « région », or the form's key): its key, whatever the case, accents, spaces or
 * hyphens (« auvergne rhone alpes », « Île-de-France », « PACA »). Null when it is not a region.
 */
export function parseRegion(text: string): RegionKey | null {
  const key = fold(text);
  return key ? (BY_NAME.get(key) ?? null) : null;
}

/**
 * The regions in the list's order: the French regions, then the countries (13/11/2026), each alphabetical (French, accents
 * ignored). « Sans région » comes after them.
 */
export function sortedRegions(): { key: RegionKey; label: string; country: boolean }[] {
  return [...REGIONS]
    .map(r => ({ key: r.key, label: r.label, country: isCountry(r.key) }))
    .sort((a, b) => Number(a.country) - Number(b.country) || a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
}

// ---- Langue des mails (13/11/2026, « fais les 3 ») -----------------------------------------------------------------

export const PROSPECT_LANGUAGES = ['fr', 'de', 'en'] as const;
export type ProspectLanguage = (typeof PROSPECT_LANGUAGES)[number];
export const isProspectLanguage = (value: unknown): value is ProspectLanguage =>
  typeof value === 'string' && (PROSPECT_LANGUAGES as readonly string[]).includes(value);

/** German-speaking Swiss airports; the others (Geneva, Sion) get French, Lugano English. */
const SWISS_GERMAN = new Set(['ZRH', 'BRN']);

/**
 * The language of a prospect's mails when none was chosen by hand: French in France, Belgium and Luxembourg, German in
 * Germany and Austria, by the airport in Switzerland, English anywhere else in Europe; French without a region.
 */
export function regionLanguage(region: RegionKey | null, airportCode: string | null): ProspectLanguage {
  if (!region || !isCountry(region)) return 'fr';
  if (region === 'allemagne' || region === 'autriche') return 'de';
  if (region === 'belgique' || region === 'luxembourg') return 'fr';
  if (region === 'suisse') {
    const code = airportCode?.toUpperCase() ?? '';
    if (SWISS_GERMAN.has(code)) return 'de';
    return code === 'LUG' ? 'en' : 'fr';
  }
  return 'en';
}

/** The chosen language, else the region's. */
export function prospectLanguage(prospect: { language: string | null; region: string | null; airportCode: string | null }): ProspectLanguage {
  if (isProspectLanguage(prospect.language)) return prospect.language;
  return regionLanguage(effectiveRegion(prospect), prospect.airportCode);
}

const LANGUAGE_NAMES: Record<string, ProspectLanguage> = {
  fr: 'fr',
  francais: 'fr',
  french: 'fr',
  de: 'de',
  allemand: 'de',
  german: 'de',
  deutsch: 'de',
  en: 'en',
  anglais: 'en',
  english: 'en',
};

/** A language typed in a CSV or the form (« Allemand », « de », « English »). Null when it is not one. */
export function parseLanguage(text: string): ProspectLanguage | null {
  return LANGUAGE_NAMES[fold(text)] ?? null;
}
