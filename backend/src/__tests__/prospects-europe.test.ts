import {
  companyKey,
  defaultSteps,
  normalizeWebsite,
  prospectEmail,
  sequencesOf,
  templateValues,
  unknownVariables,
  validateProspect,
  validateTranslations,
} from '@/domain/prospecting';
import { parseLanguage, parseRegion, prospectLanguage, regionLanguage, regionOfAirport, sortedRegions } from '@/domain/prospect-regions';

/** 13/11/2026 (« fais les 3 »): the European prospects (countries, mails in German and English, email optional). */

const company = {
  name: 'Benford Tech',
  legalForm: 'SAS',
  address: '29 chemin des Collines, 38080 L’Isle-d’Abeau',
  registration: '910 729 102 RCS Vienne',
};
const values = templateValues(
  { companyName: 'Parken zum Fliegen', contactFirstName: 'Jonas', contactLastName: null, town: null, airportCode: 'STR' },
  null,
  'https://www.plazo.fr/pro/demo/AbCd2345EfGh',
);

describe('prospects européens : pays', () => {
  it('chaque pays par ses aéroports, et par son nom en français, en anglais, dans sa langue ou son code', () => {
    expect(regionOfAirport('FRA')).toBe('allemagne');
    expect(regionOfAirport('vie')).toBe('autriche');
    expect(regionOfAirport('OPO')).toBe('portugal');
    expect(regionOfAirport('LGW')).toBe('royaume-uni');
    expect(regionOfAirport('PRG')).toBe('republique-tcheque');
    // Basel-Mulhouse stays in France (Grand Est), Geneva in Switzerland.
    expect(regionOfAirport('BSL')).toBe('grand-est');
    expect(regionOfAirport('GVA')).toBe('suisse');
    expect(parseRegion('Deutschland')).toBe('allemagne');
    expect(parseRegion('Tchéquie')).toBe('republique-tcheque');
    expect(parseRegion('United Kingdom')).toBe('royaume-uni');
    expect(parseRegion('NL')).toBe('pays-bas');
  });

  it('la France d’abord, puis les pays, chacun dans l’ordre alphabétique', () => {
    const regions = sortedRegions();
    const firstCountry = regions.findIndex(r => r.country);
    expect(regions.slice(0, firstCountry).every(r => !r.country)).toBe(true);
    expect(regions.slice(firstCountry).every(r => r.country)).toBe(true);
    expect(regions.slice(firstCountry).map(r => r.label)).toEqual(
      [...regions.slice(firstCountry).map(r => r.label)].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })),
    );
  });
});

describe('prospects européens : langue des mails', () => {
  it('d’après le pays (et l’aéroport en Suisse), sauf si elle est choisie', () => {
    expect(regionLanguage('auvergne-rhone-alpes', 'LYS')).toBe('fr');
    expect(regionLanguage(null, null)).toBe('fr');
    expect(regionLanguage('allemagne', 'FRA')).toBe('de');
    expect(regionLanguage('autriche', 'VIE')).toBe('de');
    expect(regionLanguage('belgique', 'CRL')).toBe('fr');
    expect(regionLanguage('suisse', 'ZRH')).toBe('de');
    expect(regionLanguage('suisse', 'GVA')).toBe('fr');
    expect(regionLanguage('suisse', 'LUG')).toBe('en');
    expect(regionLanguage('espagne', 'MAD')).toBe('en');
    expect(prospectLanguage({ language: null, region: null, airportCode: 'HAM' })).toBe('de');
    expect(prospectLanguage({ language: 'en', region: null, airportCode: 'HAM' })).toBe('en');
    expect(prospectLanguage({ language: null, region: 'pologne', airportCode: 'LYS' })).toBe('en');
    expect(parseLanguage('Allemand')).toBe('de');
    expect(parseLanguage('English')).toBe('en');
    expect(parseLanguage('klingon')).toBeNull();
  });

  it('les textes allemands et anglais ne connaissent que les variables de Plazo, et gardent les délais du français', () => {
    for (const language of ['de', 'en'] as const) {
      for (const step of defaultSteps('Plazo', language)) {
        expect(unknownVariables(`${step.subject}\n${step.body}`)).toEqual([]);
        expect(step.body).toContain('{lien_demo}');
      }
    }
    const fr = defaultSteps('Plazo').map(s => ({ ...s, delayDays: s.step === 1 ? 0 : s.step === 2 ? 5 : 12 }));
    fr[2].enabled = false;
    const sequences = sequencesOf(fr, null, 'Plazo');
    expect(sequences.de.map(s => [s.delayDays, s.enabled])).toEqual([
      [0, true],
      [5, true],
      [12, false],
    ]);
    expect(sequences.de[0].subject).toBe('{parking}: Ihre Buchungen, ohne Abtippen');
    const saved = sequencesOf(fr, { en: [1, 2, 3].map(step => ({ step, subject: `Subject ${step}`, body: `Hello {prénom}, ${step}` })) }, 'Plazo');
    expect(saved.en[1]).toMatchObject({ subject: 'Subject 2', body: 'Hello {prénom}, 2', delayDays: 5 });
    // A damaged translation: Plazo's own texts.
    expect(sequencesOf(fr, { de: 'x' }, 'Plazo').de[0].subject).toBe(sequences.de[0].subject);
  });

  it('les traductions enregistrées : objet et texte requis, variables connues', () => {
    expect(validateTranslations(undefined)).toEqual({ ok: true, value: {} });
    const bad = validateTranslations({
      de: [
        { subject: '', body: 'x' },
        { subject: 'S', body: '{inconnu}' },
        { subject: 'S', body: 'B' },
      ],
    });
    expect(bad).toEqual({ ok: false, fields: { 'translations.de.1.subject': 'required', 'translations.de.2.body': 'unknown_variable' } });
    expect(validateTranslations({ en: [{}] })).toEqual({ ok: false, fields: { 'translations.en': 'invalid' } });
  });

  it('le mail allemand : mots autour du texte en allemand, lien de désinscription, langue du document', () => {
    const [first] = defaultSteps('Plazo', 'de');
    const mail = prospectEmail({
      productName: 'Plazo',
      language: 'de',
      company,
      senderName: 'Joanny',
      step: first,
      values,
      unsubscribeUrl: 'https://www.plazo.fr/api/public/prospecting/unsubscribe/x',
      stores: { badgesBase: 'https://site.example', playStoreUrl: 'https://play.google.com/store/apps/details?id=x', appStoreUrl: null },
      screens: true,
    });
    expect(mail.subject).toBe('Parken zum Fliegen: Ihre Buchungen, ohne Abtippen');
    expect(mail.text).toContain('Hallo Jonas,');
    expect(mail.text).toContain(
      'Keine Nachrichten mehr von Plazo erhalten : https://www.plazo.fr/api/public/prospecting/unsubscribe/x'.replace(' :', ':'),
    );
    expect(mail.text).toContain('Plazo Pro bei Google Play (Android): https://play.google.com/store/apps/details?id=x');
    expect(mail.text).toContain('Die Prüfung durch Apple läuft');
    expect(mail.html).toContain('<html lang="de">');
    expect(mail.html).toContain('Demo von Plazo ansehen');
    expect(mail.html).toContain('Der Tagesplan');
    expect(mail.html).not.toContain('Vous recevez ce message');
  });
});

describe('prospects européens : e-mail facultatif, site', () => {
  it('un prospect sans e-mail est accepté ; un site est rangé en adresse https', () => {
    expect(validateProspect({ companyName: 'Avioparking', website: 'www.avioparking.it/contatti' })).toMatchObject({
      ok: true,
      value: { email: null, website: 'https://www.avioparking.it/contatti' },
    });
    expect(validateProspect({ companyName: 'A', website: 'pas un site' })).toEqual({ ok: false, fields: { website: 'invalid_website' } });
    expect(validateProspect({ companyName: 'A', language: 'Deutsch' })).toMatchObject({ ok: true, value: { language: 'de' } });
    expect(validateProspect({ companyName: 'A', language: 'xx' })).toEqual({ ok: false, fields: { language: 'invalid_language' } });
    expect(normalizeWebsite('https://parkvia.com/')).toBe('https://parkvia.com');
    expect(normalizeWebsite('javascript:alert(1)')).toBeNull();
  });

  it('le nom d’un parking, sans accents, forme juridique ni parenthèses, repère un doublon', () => {
    expect(companyKey('Parken zum Fliegen (groupe APS)')).toBe(companyKey('parken zum fliegen'));
    expect(companyKey('Panda Parken GmbH')).toBe(companyKey('Panda-Parken'));
    expect(companyKey('Måby Parkering AS')).toBe('mabyparkering');
    expect(companyKey('Flight Park')).not.toBe(companyKey('Flight Parking'));
  });
});
