import { readFileSync } from 'fs';
import { join } from 'path';
import {
  AIRPORT_REGIONS,
  airportsOfRegion,
  effectiveRegion,
  parseRegion,
  REGION_KEYS,
  regionOfAirport,
  regionView,
  sortedRegions,
} from '@/domain/prospect-regions';
import { validateProspect } from '@/domain/prospecting';

// Classement par région (19/10/2026, « classe les prospects par région », choix « Groupés par région » + « De l'aéroport »).

describe('régions des aéroports', () => {
  it('les aéroports français connus, chacun dans sa région administrative', () => {
    const expected: Record<string, string> = {
      LYS: 'auvergne-rhone-alpes',
      GNB: 'auvergne-rhone-alpes',
      CFE: 'auvergne-rhone-alpes',
      CMF: 'auvergne-rhone-alpes',
      MRS: 'provence-alpes-cote-d-azur',
      NCE: 'provence-alpes-cote-d-azur',
      TLN: 'provence-alpes-cote-d-azur',
      AVN: 'provence-alpes-cote-d-azur',
      MPL: 'occitanie',
      FNI: 'occitanie',
      BZR: 'occitanie',
      PGF: 'occitanie',
      TLS: 'occitanie',
      CCF: 'occitanie',
      RDZ: 'occitanie',
      LDE: 'occitanie',
      CDG: 'ile-de-france',
      ORY: 'ile-de-france',
      // Beauvais-Tillé is in the Oise.
      BVA: 'hauts-de-france',
      LIL: 'hauts-de-france',
      NTE: 'pays-de-la-loire',
      RNS: 'bretagne',
      BES: 'bretagne',
      LRT: 'bretagne',
      UIP: 'bretagne',
      DNR: 'bretagne',
      BOD: 'nouvelle-aquitaine',
      BIQ: 'nouvelle-aquitaine',
      PUF: 'nouvelle-aquitaine',
      LIG: 'nouvelle-aquitaine',
      LRH: 'nouvelle-aquitaine',
      EGC: 'nouvelle-aquitaine',
      // EuroAirport Basel-Mulhouse stands in the Haut-Rhin.
      BSL: 'grand-est',
      MLH: 'grand-est',
      SXB: 'grand-est',
      ETZ: 'grand-est',
      CFR: 'normandie',
      DOL: 'normandie',
      URO: 'normandie',
      LEH: 'normandie',
      DIJ: 'bourgogne-franche-comte',
      AJA: 'corse',
      BIA: 'corse',
      CLY: 'corse',
      FSC: 'corse',
      RUN: 'la-reunion',
      PTP: 'guadeloupe',
      FDF: 'martinique',
      CAY: 'guyane',
      DZA: 'mayotte',
    };
    for (const [code, region] of Object.entries(expected)) expect([code, regionOfAirport(code)]).toEqual([code, region]);
    // Every code is a 3-letter IATA code and every region a known key.
    for (const [code, region] of Object.entries(AIRPORT_REGIONS)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(REGION_KEYS).toContain(region);
    }
  });

  it('un code inconnu ou vide n’a pas de région ; la casse et les espaces sont ignorés', () => {
    expect(regionOfAirport('lys')).toBe('auvergne-rhone-alpes');
    expect(regionOfAirport(' cdg ')).toBe('ile-de-france');
    expect(regionOfAirport('GVA')).toBeNull();
    expect(regionOfAirport('XXX')).toBeNull();
    expect(regionOfAirport(null)).toBeNull();
    expect(regionOfAirport('')).toBeNull();
    expect(airportsOfRegion('corse').sort()).toEqual(['AJA', 'BIA', 'CLY', 'FSC']);
  });

  it('région effective : choisie à la main, sinon celle de l’aéroport, sinon aucune', () => {
    expect(effectiveRegion({ region: null, airportCode: 'LYS' })).toBe('auvergne-rhone-alpes');
    expect(effectiveRegion({ region: 'occitanie', airportCode: 'LYS' })).toBe('occitanie');
    expect(effectiveRegion({ region: 'bretagne', airportCode: null })).toBe('bretagne');
    expect(effectiveRegion({ region: null, airportCode: 'GVA' })).toBeNull();
    expect(effectiveRegion({ region: 'atlantide', airportCode: 'NTE' })).toBe('pays-de-la-loire');
    expect(regionView({ region: null, airportCode: 'BVA' })).toEqual({ key: 'hauts-de-france', label: 'Hauts-de-France', manual: false });
    expect(regionView({ region: 'ile-de-france', airportCode: 'BVA' })).toEqual({ key: 'ile-de-france', label: 'Île-de-France', manual: true });
    expect(regionView({ region: null, airportCode: null })).toBeNull();
  });

  it('nom de région tapé : casse, accents, espaces et tirets ignorés, abréviations courantes', () => {
    expect(parseRegion('Auvergne-Rhône-Alpes')).toBe('auvergne-rhone-alpes');
    expect(parseRegion('auvergne rhone alpes')).toBe('auvergne-rhone-alpes');
    expect(parseRegion('ÎLE-DE-FRANCE')).toBe('ile-de-france');
    expect(parseRegion("Provence-Alpes-Côte d'Azur")).toBe('provence-alpes-cote-d-azur');
    expect(parseRegion('PACA')).toBe('provence-alpes-cote-d-azur');
    expect(parseRegion('Réunion')).toBe('la-reunion');
    expect(parseRegion('pays-de-la-loire')).toBe('pays-de-la-loire');
    expect(parseRegion('Rhône')).toBeNull();
    expect(parseRegion('')).toBeNull();
  });

  it('ordre alphabétique (accents ignorés), et les clés du code sont celles de la contrainte de la base', () => {
    const labels = sortedRegions().map(r => r.label);
    expect(labels.slice(0, 4)).toEqual(['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire']);
    expect(labels.indexOf('Île-de-France')).toBe(labels.indexOf('Hauts-de-France') + 1);
    expect(labels).toHaveLength(18);
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261019090000_prospect_region/migration.sql'), 'utf8');
    const inCheck = [...sql.matchAll(/'([a-z-]+)'/g)].map(m => m[1]).sort();
    expect(inCheck).toEqual([...REGION_KEYS].sort());
  });

  it('validation d’un prospect : région par clé ou par nom, vide = automatique, inconnue refusée, absente inchangée', () => {
    expect(validateProspect({ companyName: 'A', email: 'a@b.fr', region: 'Normandie' })).toMatchObject({ ok: true, value: { region: 'normandie' } });
    expect(validateProspect({ companyName: 'A', email: 'a@b.fr', region: '  ' })).toMatchObject({ ok: true, value: { region: null } });
    expect(validateProspect({ companyName: 'A', email: 'a@b.fr', region: 'Atlantide' })).toEqual({ ok: false, fields: { region: 'invalid_region' } });
    expect(validateProspect({ companyName: 'A', email: 'a@b.fr', region: 12 })).toEqual({ ok: false, fields: { region: 'invalid' } });
    expect(validateProspect({ town: 'Pusignan' }, true)).toEqual({ ok: true, value: { town: 'Pusignan' } });
    expect(validateProspect({ region: null }, true)).toEqual({ ok: true, value: { region: null } });
  });
});
