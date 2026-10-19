/**
 * Classement des prospects par région (19/10/2026, « classe les prospects par région », choix « Groupés par région » +
 * « De l'aéroport »): the French administrative region of a prospect, read from its airport, unless the platform admin
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
] as const;

export type RegionKey = (typeof REGIONS)[number]['key'];
export const REGION_KEYS: RegionKey[] = REGIONS.map(r => r.key);
/** The filter value of the prospects without a region. */
export const NO_REGION = 'none';

const LABELS = new Map<string, string>(REGIONS.map(r => [r.key, r.label]));

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
};

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
]);

/**
 * A region typed by a person (CSV column « région », or the form's key): its key, whatever the case, accents, spaces or
 * hyphens (« auvergne rhone alpes », « Île-de-France », « PACA »). Null when it is not a region.
 */
export function parseRegion(text: string): RegionKey | null {
  const key = fold(text);
  return key ? (BY_NAME.get(key) ?? null) : null;
}

/** The regions in the list's order: alphabetical (French, accents ignored). « Sans région » comes after them. */
export function sortedRegions(): { key: RegionKey; label: string }[] {
  return [...REGIONS].sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
}
