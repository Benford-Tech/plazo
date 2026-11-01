import { parseWebsiteForm, websiteDateTime } from '@/domain/importers/website-form';

/** 01/11/2026 (« apprends ça aussi »): the parking's own website booking form, its dates without a year. */
describe('formulaire du site du parking', () => {
  const now = new Date('2026-11-01T10:00:00Z');

  it('lit les champs du formulaire, une étiquette par ligne et sa valeur dessous', () => {
    const text = [
      'Nom',
      'Camille Exemple',
      'E-mail',
      'camille@example.com',
      "Date et heure d'arrivée",
      '10/11 à 18h30',
      'Date et heure de départ',
      '15/11 à 13h30',
      "Plaque d'immatriculation",
      'AB-123-CD',
      'Services',
      'Parking',
      'Envoyé depuis Parking Exemple Lyon Aéroport',
    ].join('\n');
    expect(parseWebsiteForm(text, now, 'Europe/Paris')).toEqual({
      provider: 'Site du parking',
      channel: 'website',
      customerName: 'Camille Exemple',
      customerEmail: 'camille@example.com',
      customerPhone: undefined,
      arrivalAt: '2026-11-10T18:30',
      returnAt: '2026-11-15T13:30',
      plate: 'AB-123-CD',
      notes: undefined,
    });
  });

  it('« Étiquette : valeur » sur une ligne aussi ; un autre mail n’est pas le formulaire', () => {
    const text =
      "Nom : Camille Exemple\nE-mail : camille@example.com\nDate et heure d'arrivée : 10/11 à 18h30\nDate et heure de départ : 15/11 à 13h\nEnvoyé depuis Mon parking";
    expect(parseWebsiteForm(text, now, 'Europe/Paris')).toMatchObject({ customerName: 'Camille Exemple', returnAt: '2026-11-15T13:00' });
    // The apostrophe the HTML of a WordPress form writes as an entity.
    expect(parseWebsiteForm(text.replace(/'/g, '&#039;'), now, 'Europe/Paris')).toMatchObject({ arrivalAt: '2026-11-10T18:30' });
    expect(parseWebsiteForm('Bonjour, je voudrais réserver du 10/11 au 15/11.', now, 'Europe/Paris')).toBeNull();
  });

  it('sans année : la prochaine date, pas plus de 60 jours en arrière ; une année écrite est gardée', () => {
    expect(websiteDateTime('10/11 à 18h30', now, 'Europe/Paris')).toBe('2026-11-10T18:30');
    expect(websiteDateTime('05/01 à 08h00', new Date('2026-12-20T10:00:00Z'), 'Europe/Paris')).toBe('2027-01-05T08:00');
    expect(websiteDateTime('20/10 à 09h', now, 'Europe/Paris')).toBe('2026-10-20T09:00');
    expect(websiteDateTime('10/11/2027 18:30', now, 'Europe/Paris')).toBe('2027-11-10T18:30');
    expect(websiteDateTime('31/02 à 10h', now, 'Europe/Paris')).toBeUndefined();
  });
});
